import { GROUP_ONE, GROUP_ONE_H, GROUP_TWO, GROUP_TWO_H, STONES, type Thumb } from './content';

export const PLAN_W = 1728;
export const MOBILE_BP = 768;

/** Desktop spacing between sections, in pixels of the page plan. */
const PLAN_GAPS = {
  heroToGroupOne: 52,
  groupOneToStones: 149,
  stonesToCaption: 109,
  captionToGroupTwo: 107,
  groupTwoToEnd: 217, // before the brands strip and footer
};

/** Phone spacing between sections, in pixels. */
const SECTION_GAP = 100;
const STONES_MARGIN = 200; // extra space above and below the full-bleed stones image
const CAPTION_TWO_BELOW = 100; // extra space below the second caption
const END_PADDING = 300; // extra room before the brands strip and footer

export type Rect = { x: number; y: number; w: number; h: number };
export type PlacedThumb = Thumb & { rect: Rect };

export type Layout = {
  W: number;
  VH: number;
  u: number;
  mobile: boolean;
  hero: Rect;
  heroCaption: Rect;
  groupOne: PlacedThumb[];
  stones: Rect;
  captionTwo: Rect;
  groupTwo: PlacedThumb[];
  height: number; // height of the scroll composition, before the brands strip and footer
};

/** Desktop: the plan scaled to the viewport width, spacing included. */
function desktop(W: number, VH: number): Layout {
  const u = W / PLAN_W;
  const place = (t: Thumb, top: number): PlacedThumb => ({
    ...t,
    rect: { x: t.x * u, y: top + t.y * u, w: t.w * u, h: t.h * u },
  });

  const hero = { x: 0, y: 0, w: W, h: VH };
  const captionH = Math.max(18, 24 * u);
  const heroCaption = { x: 0, y: VH - 52 * u - captionH / 2, w: W, h: captionH };

  const gap = (k: keyof typeof PLAN_GAPS) => PLAN_GAPS[k] * u;
  const g1Top = hero.h + gap('heroToGroupOne');
  const groupOne = GROUP_ONE.map((t) => place(t, g1Top));
  const stones = { x: 0, y: g1Top + GROUP_ONE_H * u + gap('groupOneToStones'), w: W, h: STONES.h * u };
  const captionTwo = { x: 0, y: stones.y + stones.h + gap('stonesToCaption'), w: W, h: captionH };
  const g2Top = captionTwo.y + captionTwo.h + gap('captionToGroupTwo');
  const groupTwo = GROUP_TWO.map((t) => place(t, g2Top));
  const height = g2Top + GROUP_TWO_H * u + gap('groupTwoToEnd');

  return { W, VH, u, mobile: false, hero, heroCaption, groupOne, stones, captionTwo, groupTwo, height };
}

/** Phones: same order and left/right rhythm, images large enough to read. */
function mobile(W: number, VH: number): Layout {
  const u = W / PLAN_W;
  const g = 16;
  const gap = 64;
  const captionH = 36;

  const hero = { x: 0, y: 0, w: W, h: VH };
  const heroCaption = { x: 0, y: VH - 72, w: W, h: captionH };

  const stack = (items: Thumb[], top: number) => {
    let y = top;
    const placed = items.map((t) => {
      const w = Math.min(Math.max(t.w * u * 2.4, W * 0.46), W - 2 * g);
      const h = w * (t.h / t.w);
      const c = Math.min(Math.max(((t.x + t.w / 2) / PLAN_W - 0.1) / 0.8, 0), 1);
      const rect = { x: g + (W - 2 * g - w) * c, y, w, h };
      y += h + gap;
      return { ...t, rect };
    });
    return { placed, bottom: y - gap };
  };

  const one = stack(GROUP_ONE, hero.h + SECTION_GAP);
  const stones = { x: 0, y: one.bottom + SECTION_GAP + STONES_MARGIN, w: W, h: Math.round(W * (STONES.h / PLAN_W) * 1.8) };
  const captionTwo = { x: 0, y: stones.y + stones.h + SECTION_GAP + STONES_MARGIN, w: W, h: captionH };
  const two = stack(GROUP_TWO, captionTwo.y + captionTwo.h + SECTION_GAP + CAPTION_TWO_BELOW);

  return {
    W, VH, u, mobile: true, hero, heroCaption,
    groupOne: one.placed, stones, captionTwo, groupTwo: two.placed,
    height: two.bottom + SECTION_GAP + END_PADDING,
  };
}

export function computeLayout(W: number, VH: number): Layout {
  return W < MOBILE_BP ? mobile(W, VH) : desktop(W, VH);
}
