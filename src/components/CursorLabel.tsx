import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

/**
 * Over a thumbnail the system cursor is hidden and the project title follows the
 * pointer on a lightly under-damped spring.
 */
export default function CursorLabel() {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 260, damping: 24, mass: 0.8 };
  const x = useSpring(px, spring);
  const y = useSpring(py, spring);
  const [title, setTitle] = useState('');
  const [visible, setVisible] = useState(false);
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const hovered = useRef<Element | null>(null);

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Hit-test from the pointer, so images drifting under a still cursor are picked up too.
    const check = () => {
      const p = pointer.current;
      const hit = p.inside ? document.elementFromPoint(p.x, p.y)?.closest('[data-title]') ?? null : null;
      if (hit === hovered.current) return;
      hovered.current?.removeAttribute('data-hover');
      hovered.current = hit;
      if (hit) {
        hit.setAttribute('data-hover', '');
        setTitle(hit.getAttribute('data-title') ?? '');
        setVisible((wasVisible) => {
          if (!wasVisible) {
            x.jump(p.x);
            y.jump(p.y);
          }
          return true;
        });
      } else {
        setVisible(false);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current = { x: e.clientX, y: e.clientY, inside: true };
      px.set(e.clientX);
      py.set(e.clientY);
      check();
    };
    const onLeave = () => {
      pointer.current.inside = false;
      check();
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [px, py, x, y]);

  return (
    <motion.div className="cursor-label" aria-hidden="true" data-visible={visible || undefined} style={{ x, y }}>
      <span>{title}</span>
      <span className="cursor-label__arrow">&gt;</span>
    </motion.div>
  );
}
