import { LOGO_H, LOGO_W } from './logoPaths';

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Hermite smoothstep; edges may be given in either order. */
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * How "in focus" an image is, from where its centre sits in the viewport
 * (p = 0 top edge, 1 bottom edge). It swells gradually from the bottom, is fully
 * grown by the middle, keeps that size through the upper half and settles back
 * to its resting size only as it is about to leave at the top.
 */
export const focusAt = (p: number) => smoothstep(1.02, 0.6, p) * smoothstep(0.05, 0.38, p);

/** Hero photograph recedes from full-bleed into an inset frame as the page starts. */
export const heroScaleAt = (s: number, VH: number) =>
  1 - 0.6 * Math.sin(clamp(s / VH, 0, 1) * (Math.PI / 2));

export type LogoState = {
  x: number;
  y: number;
  scale: number;
  collapse: number; // 0 full name … 1 only the "Nini" script
  nav: number; // MENU / PT entrance
  front: boolean; // above the images once it is the compact header mark
};

/**
 * A – held near the centre while the hero starts to move
 * B – rises to the top, still full width
 * C – rests at the top while the first images drift past
 * D – shrinks and simplifies into the compact top-left "Nini"
 */
export function logoAt(s: number, W: number, VH: number, mobile: boolean): LogoState {
  const startScale = (W - 24) / LOGO_W;
  const endScale = (mobile ? 104 : 131) / 521;
  const endX = mobile ? 16 : 22;
  const endY = mobile ? 14 : 17;
  const topY = 15;

  const anchoredY = VH / 2 - (LOGO_H * startScale) / 2 - s * 0.04;
  const b = easeInOutCubic(clamp((s - VH * 0.22) / (VH * 0.4), 0, 1));
  const tD = clamp((s - VH * 1.0) / (VH * 0.5), 0, 1);
  const d = easeInOutCubic(tD);

  return {
    x: mix(12, endX, d),
    y: mix(mix(anchoredY, topY, b), endY, d),
    scale: Math.exp(mix(Math.log(startScale), Math.log(endScale), d)),
    collapse: smoothstep(0.35, 0.9, tD),
    nav: smoothstep(0.45, 1, tD),
    front: tD > 0.85,
  };
}
