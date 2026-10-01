import { useEffect, useState } from 'react';
import { MOBILE_BP } from './layout';

const read = () => ({ W: document.documentElement.clientWidth, VH: window.innerHeight });

/** Viewport size. On phones, height-only changes (URL bar showing/hiding) are ignored. */
export function useViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        const next = read();
        setVp((prev) =>
          (prev.W === next.W && (next.W < MOBILE_BP || prev.VH === next.VH)) ? prev : next,
        );
      }, 120);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, []);
  return vp;
}
