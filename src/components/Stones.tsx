import { motion, useTransform, type MotionValue } from 'motion/react';
import { STONES } from '../content';
import type { Rect } from '../layout';

/** Full-bleed image: the frame scrolls with the page, the photograph drifts inside it. */
export default function Stones({ scrollY, rect, VH, reduced }: { scrollY: MotionValue<number>; rect: Rect; VH: number; reduced: boolean }) {
  const y = useTransform(() => (reduced ? 0 : -(rect.y + rect.h / 2 - scrollY.get() - VH / 2) * 0.08));
  return (
    <figure className="bleed" style={{ top: rect.y, height: rect.h }}>
      <motion.img src={STONES.src} alt={STONES.alt} draggable={false} style={{ y }} />
    </figure>
  );
}
