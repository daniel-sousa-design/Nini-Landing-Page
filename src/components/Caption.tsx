import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import type { Rect } from '../layout';
import Words, { useInOut } from './Words';

/** Editorial line: quiet parallax, constant size, words rising in as it enters view. */
export default function Caption({ text, scrollY, rect, VH, reduced }: { text: string; scrollY: MotionValue<number>; rect: Rect; VH: number; reduced: boolean }) {
  const offset = (s: number) => (reduced ? 0 : -(rect.y + rect.h / 2 - s - VH / 2) * 0.1);
  const y = useTransform(() => offset(scrollY.get()));
  const [visible, setVisible] = useState(false);
  const state = useInOut(visible);

  const update = (s: number) => {
    const mid = rect.y + rect.h / 2 - s + offset(s);
    setVisible(mid > VH * 0.06 && mid < VH * 0.94);
  };
  useMotionValueEvent(scrollY, 'change', update);
  useEffect(() => update(scrollY.get()));

  return (
    <motion.p className="caption" style={{ top: rect.y, height: rect.h, y }}>
      <Words text={text} state={state} />
    </motion.p>
  );
}
