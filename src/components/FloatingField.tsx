import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, motionValue, useAnimationFrame, type MotionValue } from 'motion/react';
import { slug, type LetterStyle, type Thumb } from '../content';
import { projectPath } from '../router';
import type { PlacedThumb } from '../layout';
import { clamp, easeInOutCubic, smoothstep } from '../timeline';

type Props = {
  items: PlacedThumb[];
  scrollY: MotionValue<number>;
  VH: number;
  reduced: boolean;
  onOpen: (item: Thumb, el: HTMLElement) => void;
};

type Node = {
  item: PlacedThumb;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  letters: HTMLSpanElement[];
  // spring: this image's trailing copy of the scroll position
  pos: number;
  vel: number;
};

const GAP = 28; // minimum clearance kept between images while they trail
const RISE = 60; // px an image climbs as it arrives
const START_SCALE = 0.96; // and the size it grows from
const ENTER = 0.4; // share of the viewport height the entrance is spread over

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Every image floats in its own depth plane: it follows the scroll through its own
 * spring, so it trails slightly and eases to rest after the page stops. Each one keeps
 * its place and size; it only rises in, growing a touch, as it enters from below.
 */
export default function FloatingField({ items, scrollY, VH, reduced, onOpen }: Props) {
  const nodes = useMemo<Node[]>(
    () =>
      items.map((item) => ({
        item,
        y: motionValue(0),
        scale: motionValue(1),
        letters: [],
        pos: scrollY.get(),
        vel: 0,
      })),
    [items, scrollY],
  );

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

    // 2. Entrance, scrubbed by where the image's top edge sits as it comes up from below.
    for (const n of nodes) {
      const { rect } = n.item;
      const top = rect.y - n.pos;
      const e = reduced ? 1 : easeOutCubic(clamp((VH - top) / (VH * ENTER), 0, 1));
      n.y.set(target - n.pos + (1 - e) * RISE);
      n.scale.set(START_SCALE + (1 - START_SCALE) * e);
      if (n.letters.length) animateTitle(n.letters, (top + rect.h / 2) / VH, reduced);
    }
  });

  return (
    <>
      {nodes.map((n) => {
        const { item, y, scale } = n;
        const style = { left: item.rect.x, top: item.rect.y, width: item.rect.w, height: item.rect.h, y, scale };
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
