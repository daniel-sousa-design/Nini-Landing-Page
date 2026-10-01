# Nini Landing Page

A scroll-driven landing page built with React, Vite and TypeScript. [Lenis](https://github.com/darkroomengineering/lenis) handles the eased page scroll, and [Motion](https://motion.dev) drives the scroll-linked values and the per-image springs.

## Run

```sh
mise trust && mise install   # Node 22, pinned in mise.toml
npm install
npm run dev                  # http://localhost:5173
npm run build                # production build in dist/
```

## Structure

| File | What it holds |
| --- | --- |
| `src/content.ts` | All content: images, titles, links, brands, footer text. Thumbnail boxes come from the 1728px page plan, plus per-image `peak` (scale at focus), `pull` (drift toward the centre) and `depth` (how far the image trails the scroll). |
| `src/layout.ts` | Turns plan boxes into page pixels for the current viewport. Sections are `SECTION_GAP` (100px) apart, with `STONES_MARGIN` (200px) extra around the stones image and `END_PADDING` (300px) before the footer. Phones get a stacked layout. |
| `src/timeline.ts` | The motion curves: hero shrink, logo phases A–D, and the image focus curve. |
| `src/components/` | `Logo` (full mark into header, plus nav), `Hero`, `FloatingField` (all thumbnails), `Stones`, `Caption`, `Words` (word-by-word reveals), `CursorLabel`, `Footer` (with `Brands`), `ExpandingImage` and `ProjectPage`. |
| `src/router.ts` | Two routes, home and `/project/<name>`, on the History API. |
| `public/assets/` | Images, brand logos, the logo SVGs, and the ABC ROM and Nini fonts. Nini sets the FUNCHAL / INTERIOR titles. |

## How the motion works

- **Page scroll:** Lenis eases the native scroll, so it trails slightly behind the wheel. It glides a little more slowly over the hero.
- **Images** (`src/components/FloatingField.tsx`, one shared frame loop):
  - Each image follows the scroll through its own spring (`depth`), so images float independently and ease to rest.
  - Size depends on where an image sits in the viewport. It grows gradually from the bottom, holds through the middle and upper half, and returns to resting size just before leaving at the top. The cap is `MAX_SCALE` (1.5×).
  - Images never collide or push each other. When the layout changes, `solvePlans` simulates the whole scroll and settles each image's peak size and centre drift so neighbours always keep their clearance. The smaller image gives way first. Because size then depends only on an image's own position, it can't jump when a neighbour passes. On a fast flick, an image that trails further simply trails less rather than drifting into a neighbour.
  - The FUNCHAL / INTERIOR titles are set in Nini at the far end of its design axis. Their letters rise in one by one as the image arrives and lift out as it leaves.
- **Logo:**
  - A: holds over the hero while the photo recedes into an inset frame.
  - B: rises to the top.
  - C: rests there while the first images pass over it.
  - D: shrinks into the compact "Nini" as MENU / PT appear.
  
  It is drawn twice: a light copy clipped to the hero photo and a dark copy everywhere else. It works as a link throughout, but only swaps colour on hover once it's the compact "Nini".
- **Captions** (`Words.tsx`): both lines rise in word by word, each word cropped at its baseline, when they enter view (the hero caption does this on load). They lift out above the baseline when they leave. The hero caption uses the same two-layer trick as the logo: white over the photo, black over the page.
- **Opening a project** (`ExpandingImage.tsx`, `ProjectPage.tsx`, `router.ts`): clicking an image grows its frame from where it sits to the full screen (1.1s, ease in-out). The photograph inside swells slightly and settles a beat after the frame. Only when the frame fills the screen does the URL change to `/project/<name>` and the project page take over. On that page, at the same moment:
  - a 20% black shade fades in
  - the title rises word by word in the centre
  - the nav arrives
  - the date / client / location facts appear at the foot, centred and 100px apart, values at twice the label size and 10px below.

  Below the opening screen the project page scrolls (with its own smooth scroll) to an "About project" section, then the footer. The section has a centred title and a centred description at 60% of the page width, both rising in as they come into view. The nav stays at the top: white over the photograph, ink once past it.

  The home page stays put underneath. Back, Escape or the logo returns to it at the same scroll position.
- **Background:** the page tone moves from sand to cream as you scroll down (`useBackgroundTone` in `App.tsx`).

`prefers-reduced-motion` turns off the scroll easing, springs, scaling and parallax.

## Placeholders to replace

- All images come from `00_Source/Images site`. A few are small for their size on screen (e.g. `03.jpg` is 195px wide).
- Brand logos in `public/assets/brands/` are cut from frame 14. Swap in the official SVGs.
- Project titles in `src/content.ts`. Only "Banana Prata da Madeira" and "The Collection" come from the frames.
- Project descriptions: every project page shows `DESCRIPTION_PLACEHOLDER` (two generic paragraphs) until a `description: ['…', '…']` entry is added to that project in `src/content.ts`.
- Project facts: every project page shows `FACTS_PLACEHOLDER` ("2024 / Client name / Location") until a `facts: { date, client, location }` entry is added to that project in `src/content.ts`.
- `ABCROMWidthsVariable.woff2` is built from the **trial** font. A licence is needed before launch.
