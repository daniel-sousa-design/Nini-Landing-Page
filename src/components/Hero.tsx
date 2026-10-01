import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { HERO } from '../content';
import type { Layout } from '../layout';
import { heroScaleAt } from '../timeline';
import Words, { useInOut } from './Words';

const RISE = 0.45; // the caption climbs at 55% of scroll speed: a slow, footer-like drift

/** Full-bleed portrait that recedes into an inset frame as the page begins to move. */
export default function Hero({ scrollY, layout, reduced }: { scrollY: MotionValue<number>; layout: Layout; reduced: boolean }) {
  const { hero, heroCaption, W, VH } = layout;
  const scale = useTransform(() => (reduced ? 1 : heroScaleAt(scrollY.get(), VH)));
  const captionY = useTransform(() => (reduced ? 0 : scrollY.get() * RISE));

  // Like the logo, the caption is drawn twice: light where it sits on the photograph,
  // ink where it sits on the page.
  const light = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const state = useInOut(visible);

  const update = (s: number) => {
    const top = heroCaption.y - s + (reduced ? 0 : s * RISE);
    const k = reduced ? 1 : heroScaleAt(s, VH);
    const cy = hero.y + hero.h / 2 - s;
    const hTop = cy - (hero.h * k) / 2;
    const hBottom = cy + (hero.h * k) / 2;
    const hLeft = W / 2 - (hero.w * k) / 2;
    const hRight = W / 2 + (hero.w * k) / 2;
    if (light.current) {
      light.current.style.clipPath = `inset(${Math.max(0, hTop - top)}px ${Math.max(0, W - hRight)}px ${Math.max(0, top + heroCaption.h - hBottom)}px ${Math.max(0, hLeft)}px)`;
    }
    const mid = top + heroCaption.h / 2;
    setVisible(mid > VH * 0.06 && mid < VH);
  };

  useMotionValueEvent(scrollY, 'change', update);
  useEffect(() => update(scrollY.get()));

  return (
    <>
      <motion.figure className="hero" style={{ top: hero.y, height: hero.h, scale }}>
        <img src={HERO.src} alt={HERO.alt} fetchPriority="high" draggable={false} />
      </motion.figure>
      <motion.p className="caption caption--hero" style={{ top: heroCaption.y, height: heroCaption.h, y: captionY }}>
        <span className="caption__layer caption__ink">
          <Words text={HERO.caption} state={state} />
        </span>
        <span ref={light} className="caption__layer caption__light" aria-hidden="true">
          <Words text={HERO.caption} state={state} />
        </span>
      </motion.p>
    </>
  );
}
