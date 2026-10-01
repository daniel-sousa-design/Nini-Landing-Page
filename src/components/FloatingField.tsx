import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, motionValue, useAnimationFrame, type MotionValue } from 'motion/react';
import { MAX_SCALE, slug, type LetterStyle, type Thumb } from '../content';
import { projectPath } from '../router';
import type { PlacedThumb } from '../layout';
import { clamp, easeInOutCubic, focusAt, smoothstep } from '../timeline';

type Props = {
  items: PlacedThumb[];
  scrollY: MotionValue<number>;
  W: number;
  VH: number;
  mobile: boolean;
  reduced: boolean;
  onOpen: (item: Thumb, el: HTMLElement) => void;
};

type Node = {
  item: PlacedThumb;
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  z: MotionValue<number>;
  letters: HTMLSpanElement[];
  // springs: this image's trailing copy of the scroll position, and its scale
  pos: number;
  vel: number;
  s: number;
  sv: number;
  // per-frame scratch
  f: number;
  want: number;
  cx: number;
  cy: number;
};

const GAP = 28; // minimum clearance between images while they grow
const SCALE_STIFFNESS = 90; // scale is eased on a soft, critically damped spring
const PLAN_GAP = 44; // clearance planned for when choosing peaks (headroom for trailing)

type Plan = { peak: number; pull: number };

/** Scale an image wants at focus amount f, and where it drifts horizontally. */
function pose(item: PlacedThumb, plan: Plan, f: number, W: number) {
  const restCx = item.rect.x + item.rect.w / 2;
  return {
    s: 1 + (plan.peak - 1) * f,
    cx: restCx + (W / 2 - restCx) * plan.pull * f,
  };
}

/**
 * Chooses each image's peak scale and centre drift ahead of time. The whole scroll is
 * simulated, and whenever two images would come closer than PLAN_GAP the pair is eased
 * apart: the smaller image gives up its growth first, then the larger drifts less toward
 * the centre, and only then does the larger grow less. At runtime an image's size depends
 * only on its own position, so neighbours can never make it change abruptly.
 */
function solvePlans(items: PlacedThumb[], W: number, VH: number, mobile: boolean): Plan[] {
  const plans = items.map((t) => {
    const p = Math.min(t.peak, MAX_SCALE);
    return { peak: mobile ? 1 + (p - 1) * 0.25 : p, pull: mobile ? 0 : t.pull };
  });
  const area = (t: PlacedThumb) => t.rect.w * t.rect.h;
  const ease = (plan: Plan) => {
    plan.peak = plan.peak - 1 < 0.004 ? 1 : 1 + (plan.peak - 1) * 0.9;
  };
  const top = Math.min(...items.map((t) => t.rect.y)) - VH;
  const bottom = Math.max(...items.map((t) => t.rect.y + t.rect.h));
  const step = VH / 60;

  // Pairs that sit closer than PLAN_GAP in the plan keep their own clearance.
  const gapOf = (a: PlacedThumb, b: PlacedThumb) => {
    const ra = a.rect;
    const rb = b.rect;
    const free = Math.max(
      Math.abs(ra.x + ra.w / 2 - (rb.x + rb.w / 2)) - (ra.w + rb.w) / 2,
      Math.abs(ra.y + ra.h / 2 - (rb.y + rb.h / 2)) - (ra.h + rb.h) / 2,
    );
    return clamp(free, 0, PLAN_GAP);
  };

  for (let pass = 0; pass < 120; pass++) {
    let changed = false;
    for (let s = top; s <= bottom; s += step) {
      const poses = items.map((t, i) => {
        const cy = t.rect.y + t.rect.h / 2 - s;
        const f = focusAt(cy / VH);
        return { f, cy, ...pose(t, plans[i], f, W) };
      });
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = poses[i];
          const b = poses[j];
          if (a.f === 0 && b.f === 0) continue;
          const ra = items[i].rect;
          const rb = items[j].rect;
          const gap = gapOf(items[i], items[j]);
          const ox = (ra.w * a.s + rb.w * b.s) / 2 + gap - Math.abs(a.cx - b.cx);
          const oy = (ra.h * a.s + rb.h * b.s) / 2 + gap - Math.abs(a.cy - b.cy);
          if (ox <= 0.5 || oy <= 0.5) continue;
          const [small, large] = area(items[i]) < area(items[j]) ? [plans[i], plans[j]] : [plans[j], plans[i]];
          if (small.peak > 1) ease(small);
          else if (Math.abs(large.pull) > 0.01) large.pull *= 0.85;
          else if (large.peak > 1) ease(large);
          else continue; // touching even at rest: nothing growth can fix
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return plans;
}

/**
 * Every image floats in its own depth plane: it follows the scroll through its own
 * spring, so it trails slightly and eases to rest after the page stops. Images never
 * push one another, and each one's peak size is chosen ahead of time (solvePeaks) so
 * enlarged images do not collide.
 */
export default function FloatingField({ items, scrollY, W, VH, mobile, reduced, onOpen }: Props) {
  const nodes = useMemo<Node[]>(
    () =>
      items.map((item) => ({
        item,
        x: motionValue(0),
        y: motionValue(0),
        scale: motionValue(1),
        z: motionValue(10),
        letters: [],
        pos: scrollY.get(),
        vel: 0,
        s: 1,
        sv: 0,
        f: 0,
        want: 1,
        cx: 0,
        cy: 0,
      })),
    [items, scrollY],
  );
  const plans = useMemo(() => solvePlans(items, W, VH, mobile), [items, W, VH, mobile]);

  useAnimationFrame((_, delta) => {
    const target = scrollY.get();
    const dt = Math.min(delta / 1000, 1 / 30);

    // 1. Each image's trailing scroll. Deeper planes trail further; near-critical damping
    //    gives a soft settle without bounce.
    for (const n of nodes) {
      if (reduced) {
        n.pos = target;
        n.vel = 0;
        continue;
      }
      const k = 210 - 120 * n.item.depth;
      const c = 1.9 * Math.sqrt(k);
      const h = dt / 2;
      for (let i = 0; i < 2; i++) {
        n.vel += (k * (target - n.pos) - c * n.vel) * h;
        n.pos += n.vel * h;
      }
    }

    // 1b. Planes trail by different amounts, so on a fast flick a far image could drift into
    //     a near one sharing its column. The one trailing more simply trails less: its lag
    //     is shortened until the clearance is restored. Nothing is pushed past its place.
    if (!reduced) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const ra = a.item.rect;
          const rb = b.item.rect;
          if (Math.min(ra.x + ra.w, rb.x + rb.w) - Math.max(ra.x, rb.x) <= -GAP) continue;
          const ya = ra.y + ra.h / 2 - a.pos;
          const yb = rb.y + rb.h / 2 - b.pos;
          const overlap = (ra.h + rb.h) / 2 + GAP - Math.abs(ya - yb);
          if (overlap <= 0) continue;
          // Only fix overlap the trailing created; images that already sit this close at rest stay put.
          const restOverlap = (ra.h + rb.h) / 2 + GAP - Math.abs(ra.y + ra.h / 2 - (rb.y + rb.h / 2));
          const fix = overlap - Math.max(0, restOverlap);
          if (fix <= 0) continue;
          const trailer = Math.abs(target - a.pos) > Math.abs(target - b.pos) ? a : b;
          const other = trailer === a ? b : a;
          const trailerAbove = (trailer === a ? ya : yb) < (trailer === a ? yb : ya);
          trailer.pos += trailerAbove ? fix : -fix;
          trailer.vel = other.vel;
        }
      }
    }

    // 2. The size and position each image would take on its own.
    nodes.forEach((n, i) => {
      const { rect } = n.item;
      n.cy = rect.y + rect.h / 2 - n.pos;
      n.f = reduced ? 0 : focusAt(n.cy / VH);
      const p = pose(n.item, plans[i], n.f, W);
      n.want = p.s;
      n.cx = p.cx;
    });

    // 3. Ease toward that size on a soft spring, so scale always glides.
    for (const n of nodes) {
      if (reduced) {
        n.s = 1;
        n.sv = 0;
        continue;
      }
      const k = SCALE_STIFFNESS;
      n.sv += (k * (n.want - n.s) - 2 * Math.sqrt(k) * n.sv) * dt;
      n.s += n.sv * dt;
    }

    // 4. Keep enlarged images on screen, then write the transforms.
    for (const n of nodes) {
      const { rect } = n.item;
      const restCx = rect.x + rect.w / 2;
      const margin = Math.max(0, Math.min(16, rect.x, W - rect.x - rect.w));
      const half = (rect.w * n.s) / 2;
      const cx = W - 2 * margin >= 2 * half ? clamp(n.cx, margin + half, W - margin - half) : W / 2;
      n.x.set(cx - restCx);
      n.y.set(target - n.pos);
      n.scale.set(n.s);
      n.z.set(10 + Math.round(n.f * 10));
      if (n.letters.length) animateTitle(n.letters, n.cy / VH, reduced);
    }
  });

  return (
    <>
      {nodes.map((n) => {
        const { item, x, y, scale, z } = n;
        const style = { left: item.rect.x, top: item.rect.y, width: item.rect.w, height: item.rect.h, x, y, scale, zIndex: z };
        const inner = (
          <>
            <img src={item.src} alt="" draggable={false} />
            {item.overlay && (
              <OverlayTitle {...item.overlay} w={item.rect.w} h={item.rect.h} onLetters={(els) => (n.letters = els)} />
            )}
          </>
        );
        // Purely stylistic images: same motion, but no link, hover or cursor title.
        if (item.decorative) {
          return (
            <motion.div key={item.id} className="thumb thumb--static" aria-hidden="true" style={style}>
              {inner}
            </motion.div>
          );
        }
        return (
          <motion.a
            key={item.id}
            className="thumb"
            href={projectPath(slug(item.title))}
            data-title={item.title}
            aria-label={item.title}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let new-tab clicks through
              e.preventDefault();
              onOpen(item, e.currentTarget);
            }}
            style={style}
          >
            {inner}
          </motion.a>
        );
      })}
    </>
  );
}

/**
 * Letters rise into place from below as the image arrives and lift out above as it
 * leaves, one after another. Driven by the image's position, so it scrubs both ways.
 */
function animateTitle(letters: HTMLSpanElement[], p: number, reduced: boolean) {
  // Spread over a long stretch of the scroll, so the letters settle slowly.
  const tIn = reduced ? 1 : smoothstep(1.08, 0.5, p);
  const tOut = reduced ? 0 : smoothstep(0.42, 0.0, p);
  const n = letters.length;
  const stagger = 0.45; // share of the transition spent staggering the letters
  const travel = 40; // % of the letter height: a short, quiet rise
  letters.forEach((el, i) => {
    const offset = n > 1 ? (stagger * i) / (n - 1) : 0;
    const a = easeInOutCubic(clamp((tIn - offset) / (1 - stagger), 0, 1));
    const b = easeInOutCubic(clamp((tOut - offset) / (1 - stagger), 0, 1));
    el.style.transform = `translate3d(0, ${((1 - a) - b) * travel}%, 0)`;
    el.style.opacity = String(a * (1 - b));
  });
}

/** Word set in the Nini face at the far end of its design axis, fitted to the photograph. */
type TitleProps = {
  text: string;
  features?: string;
  letters?: Record<string, LetterStyle>;
  w: number;
  h: number;
  onLetters: (els: HTMLSpanElement[]) => void;
};

function OverlayTitle({ text, features, letters = {}, w, h, onLetters }: TitleProps) {
  const word = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(h * 0.3);

  useLayoutEffect(() => {
    const el = word.current;
    if (!el) return;
    onLetters([...el.querySelectorAll<HTMLSpanElement>('.thumb__letter')]);
    // Measure at a reference size once the face is loaded, then set the word to ~68% of the
    // photograph's width (never under 60%), capped only so it can't outgrow the height.
    const fit = () => {
      const prev = el.style.fontSize;
      el.style.fontSize = '100px';
      // Span of the letters themselves (advance widths), not swashes or padding.
      const ls = el.querySelectorAll<HTMLSpanElement>('.thumb__letter');
      const first = ls[0];
      const last = ls[ls.length - 1];
      const natural = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      el.style.fontSize = prev; // React won't re-apply it if the fitted size is unchanged
      setSize(Math.min(h * 0.6, ((w * 0.68) / natural) * 100));
    };
    fit();
    document.fonts?.ready.then(fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onLetters is a fresh closure each render
  }, [text, features, letters, w, h]);

  return (
    <span className="thumb__type" aria-hidden="true">
      <span ref={word} className="thumb__word" style={{ fontSize: size, fontFeatureSettings: features }}>
        {[...text].map((ch, i) => {
          const own = letters[ch.toUpperCase()];
          return (
            <span
              key={i}
              className="thumb__letter"
              style={own && {
                fontFeatureSettings: own.features,
                fontVariationSettings: own.axis === undefined ? undefined : `"DSNG" ${own.axis}`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    </span>
  );
}
