import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { ANDRADE, LOGO_H, LOGO_W, SCRIPT, SILVA } from '../logoPaths';
import { heroScaleAt, logoAt } from '../timeline';
import type { Layout } from '../layout';
import { HOME_PATH } from '../router';

const REST_X = 520; // where "ANDRADE SILVA" begins in the logo artwork

/**
 * The mark, as three words that rise into place on load ("Nini", "ANDRADE", "SILVA").
 * Each word is cropped at the bottom of the mark, so it appears from below its baseline.
 */
function Mark({ id, restRef }: { id: string; restRef: (el: SVGRectElement | null) => void }) {
  const crop = `url(#${id}-crop)`;
  return (
    <svg viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} width={LOGO_W} height={LOGO_H} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect ref={restRef} x={REST_X} y={0} width={LOGO_W - REST_X} height={LOGO_H} />
        </clipPath>
        <clipPath id={`${id}-crop`}>
          <rect x={-100} y={-200} width={LOGO_W + 200} height={LOGO_H + 200} />
        </clipPath>
      </defs>
      <g clipPath={crop}>
        <path className="logo__word" style={{ '--i': 0 } as CSSProperties} d={SCRIPT} fill="currentColor" />
      </g>
      <g clipPath={`url(#${id})`}>
        <g clipPath={crop}>
          <g className="logo__word" style={{ '--i': 1 } as CSSProperties}>
            {ANDRADE.map((d, i) => <path key={i} d={d} fill="currentColor" />)}
          </g>
          <g className="logo__word" style={{ '--i': 2 } as CSSProperties}>
            {SILVA.map((d, i) => <path key={i} d={d} fill="currentColor" />)}
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * The full "Nini ANDRADE SILVA" mark: centred over the hero, rising to the top, then
 * simplifying into the compact header "Nini". Two stacked copies: ink everywhere, and a
 * light copy clipped to the hero photograph, so the logo reads light over the image and
 * dark over the page wherever the two meet.
 */
export default function Logo({ scrollY, layout, reduced }: { scrollY: MotionValue<number>; layout: Layout; reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const hit = useRef<HTMLAnchorElement>(null);
  const over = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const rests = useRef<SVGRectElement[]>([]);
  const hovering = useRef(false);
  const compact = useRef(false);

  // Intro: the words rise in once the page has painted.
  const [intro, setIntro] = useState(false);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setIntro(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // The colour swap on hover belongs to the compact header mark only; the full logo is a
  // plain link. Re-evaluated on hover changes and as the logo changes state.
  const syncHover = () => root.current?.toggleAttribute('data-hover', hovering.current && compact.current);

  const update = (s: number) => {
    const { W, VH, mobile } = layout;
    const st = logoAt(s, W, VH, mobile);
    const el = root.current;
    if (!el || !hit.current || !over.current || !nav.current) return;

    const transform = `translate3d(${st.x}px, ${st.y}px, 0) scale(${st.scale})`;
    el.style.transform = transform;
    el.style.zIndex = st.front ? '60' : '5';
    // The hit area tracks the visible mark and stays above the images, so the logo can be
    // hovered and clicked even while photographs drift over it.
    hit.current.style.transform = transform;
    const isCompact = st.collapse > 0.98;
    if (isCompact !== compact.current) {
      compact.current = isCompact;
      syncHover();
    }

    // Hero photograph's on-screen box, expressed in the logo's own (unscaled) units.
    const k = reduced ? 1 : heroScaleAt(s, VH);
    const cy = layout.hero.y + layout.hero.h / 2 - s;
    const hw = (layout.hero.w * k) / 2;
    const hh = (layout.hero.h * k) / 2;
    const toLocal = (v: number) => v / st.scale;
    const top = Math.max(0, toLocal(cy - hh - st.y));
    const bottom = Math.max(0, LOGO_H - toLocal(cy + hh - st.y));
    const left = Math.max(0, toLocal(W / 2 - hw - st.x));
    const right = Math.max(0, LOGO_W - toLocal(W / 2 + hw - st.x));
    over.current.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;

    const restW = (LOGO_W - REST_X) * (1 - st.collapse);
    rests.current.forEach((r) => r.setAttribute('width', String(restW)));
    hit.current.style.width = `${REST_X + restW}px`;

    nav.current.style.opacity = String(st.nav);
    nav.current.style.transform = `translate3d(0, ${(1 - st.nav) * -10}px, 0)`;
    nav.current.style.pointerEvents = st.nav > 0.5 ? 'auto' : 'none';
  };

  useMotionValueEvent(scrollY, 'change', update);
  useEffect(() => update(scrollY.get()));

  return (
    <>
      <div ref={root} className="logo" data-intro={intro || undefined} aria-hidden="true" style={{ width: LOGO_W, height: LOGO_H }}>
        <div className="logo__layer logo__ink">
          <Mark id="logo-rest-ink" restRef={(r) => { if (r) rests.current[0] = r; }} />
        </div>
        <div ref={over} className="logo__layer logo__light">
          <Mark id="logo-rest-light" restRef={(r) => { if (r) rests.current[1] = r; }} />
        </div>
      </div>

      <a
        ref={hit}
        className="logo-hit"
        href={HOME_PATH}
        aria-label="Nini Andrade Silva — home"
        style={{ width: LOGO_W, height: LOGO_H }}
        onPointerEnter={() => { hovering.current = true; syncHover(); }}
        onPointerLeave={() => { hovering.current = false; syncHover(); }}
        onFocus={() => { hovering.current = true; syncHover(); }}
        onBlur={() => { hovering.current = false; syncHover(); }}
      />

      <nav ref={nav} className="nav" aria-label="Primary">
        <button type="button" className="nav__item">Menu</button>
        <a className="nav__item" href="#" hrefLang="pt" lang="pt">PT</a>
      </nav>
    </>
  );
}
