import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

export type Opening = { src: string; from: DOMRect; slug: string };

// Slow out of rest, slow into place.
const EASE = [0.76, 0, 0.24, 1] as const;
const FRAME = 1.1; // seconds for the frame to reach full screen
const INNER = 1.4; // the photograph inside settles a little after the frame

/**
 * Grows a clicked image from where it sits on screen to the full viewport. The frame
 * leads; the photograph inside trails it: it swells slightly while the frame is moving and
 * settles only after the frame has landed. onDone fires when the frame fills the screen.
 */
export default function ExpandingImage({ opening, reduced, onDone }: { opening: Opening; reduced: boolean; onDone: () => void }) {
  const { from } = opening;
  const p = useMotionValue(0);
  const inner = useMotionValue(1);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const left = useTransform(p, (v) => from.left * (1 - v));
  const top = useTransform(p, (v) => from.top * (1 - v));
  const width = useTransform(p, (v) => from.width + (W - from.width) * v);
  const height = useTransform(p, (v) => from.height + (H - from.height) * v);

  useEffect(() => {
    if (reduced) {
      p.set(1);
      onDone();
      return;
    }
    const frame = animate(p, 1, { duration: FRAME, ease: EASE, onComplete: onDone });
    const photo = animate(inner, [1, 1.12, 1], { duration: INNER, ease: EASE, times: [0, 0.55, 1] });
    return () => {
      frame.stop();
      photo.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per opening
  }, []);

  return (
    <motion.div className="expanding" style={{ left, top, width, height }} aria-hidden="true">
      <motion.img src={opening.src} alt="" style={{ scale: inner }} draggable={false} />
    </motion.div>
  );
}
