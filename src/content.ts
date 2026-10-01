/**
 * Page content and resting boxes, in pixels of the 1728px-wide page plan.
 * Thumbnail y values are relative to the top of their group.
 *
 * peak  – scale reached while the image passes through the middle of the viewport (≤ MAX_SCALE)
 * pull  – how far the image drifts toward the horizontal centre at its peak
 *         (1 = all the way, negative = away from the centre)
 * depth – 0 (near, follows scroll tightly) … 1 (far, trails further behind)
 */
export type LetterStyle = { features?: string; axis?: number };

/** Facts shown at the foot of a project page. */
export type ProjectFacts = { date: string; client: string; location: string };

/** PLACEHOLDER facts until the real ones are supplied per project (see `facts` below). */
export const FACTS_PLACEHOLDER: ProjectFacts = { date: '2024', client: 'Client name', location: 'Location' };

/** PLACEHOLDER project description, shown until a project has its own `description`. */
export const DESCRIPTION_PLACEHOLDER = [
  'Conceived as a dialogue between place and matter, the project translates the character of its surroundings into a calm, tactile interior. Natural textures, sculpted forms and a restrained palette of light and shadow give each space its own presence while holding the whole together as one continuous experience.',
  'Every element, from the proportions of a room to the grain of a surface, was drawn to be felt as much as seen. The result is an atmosphere designed to be lived slowly: welcoming, quietly theatrical and unmistakably rooted in its place.',
];

/** URL-safe project name: "Banana Prata da Madeira" → "banana-prata-da-madeira". */
export const slug = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export type Thumb = {
  id: string;
  src: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  peak: number;
  pull: number;
  depth: number;
  /**
   * Optional title set over the photograph in the Nini typeface, axis at its far end.
   * features – OpenType features for the word, e.g. '"ss05"'
   * letters  – per-letter overrides: their own features and/or design-axis value
   */
  overlay?: { text: string; features?: string; letters?: Record<string, LetterStyle> };
  /** Date, client and location for the project page; placeholders are used until set. */
  facts?: ProjectFacts;
  /** Paragraphs for the project page's "About project" section; a placeholder until set. */
  description?: string[];
  /** Purely stylistic image: moves with the others but is not a link and has no hover. */
  decorative?: boolean;
};

export const MAX_SCALE = 1.5;

const img = (n: string) => `/assets/img/${n}.jpg`;

export const HERO = {
  src: img('00-hero-duna'),
  alt: 'Nini Andrade Silva seated on a sculptural cork bench',
  caption: 'Where interior architecture becomes identity',
};

export const GROUP_ONE: Thumb[] = [
  { id: '01', src: img('01'), title: 'Onda Chaise', x: 1442, y: 0, w: 274, h: 276, peak: 1.5, pull: 0.12, depth: 0.5 },
  { id: '02', src: img('02'), title: 'Lounge Interior', x: 12, y: 179, w: 370, h: 274, peak: 1.45, pull: 0.12, depth: 0.25 },
  { id: '03', src: img('03'), title: 'Villas & Golfe', x: 1291, y: 276, w: 130, h: 183, peak: 1.5, pull: 0.1, depth: 0.55 },
  { id: '04', src: img('04'), title: 'Pink Dining Room', x: 15, y: 746, w: 205, h: 325, peak: 1.5, pull: 0, depth: 0.6 },
  { id: '05', src: img('05'), title: 'Banana Prata da Madeira', x: 727, y: 765, w: 733, h: 488, peak: 1.31, pull: 0.4, depth: 0.15 },
  { id: '06', src: img('06'), title: 'Golden Bar', x: 441, y: 1009, w: 192, h: 211, peak: 1.4, pull: -0.14, depth: 0.9 },
  { id: '07', src: img('07-funchal'), title: 'Funchal', overlay: { text: 'Funchal' }, decorative: true, x: 882, y: 1468, w: 382, h: 255, peak: 1.4, pull: 0.2, depth: 0.45 },
  { id: '08', src: img('08'), title: 'The Collection', x: 155, y: 1939, w: 834, h: 497, peak: 1.2, pull: 0.4, depth: 0.1 },
  { id: '09', src: img('09'), title: 'The Studio', x: 1220, y: 2674, w: 341, h: 227, peak: 1.5, pull: 0.14, depth: 0.7 },
  { id: '10', src: img('10'), title: 'Chrome Sofa', x: 155, y: 3109, w: 350, h: 244, peak: 1.5, pull: 0.08, depth: 0.4 },
];
export const GROUP_ONE_H = 3385;

export const STONES = {
  src: img('11'),
  alt: 'Sculpted stones resting in a dark pool',
  h: 752,
};

export const CAPTION_TWO = 'Where interiors become emotional landmarks';

export const GROUP_TWO: Thumb[] = [
  { id: '12', src: img('12'), title: 'Suite Bathroom', x: 31, y: 0, w: 989, h: 660, peak: 1.15, pull: 0.2, depth: 0.15 },
  { id: '13', src: img('13-interior'), title: 'Interior', overlay: { text: 'Interior', features: '"ss05"', letters: { I: { features: '"ss06"', axis: 0 } } }, decorative: true, x: 1240, y: 263, w: 341, h: 271, peak: 1.5, pull: 0.12, depth: 0.6 },
  { id: '14', src: img('14'), title: 'Living Room View', x: 910, y: 827, w: 328, h: 368, peak: 1.4, pull: 0.1, depth: 0.35 },
];
export const GROUP_TWO_H = 1195;

export const BRANDS = [
  { name: 'Belmond', src: '/assets/brands/belmond.png', w: 139, h: 58 },
  { name: 'Marriott', src: '/assets/brands/marriott.png', w: 131, h: 52 },
  { name: 'Highgate', src: '/assets/brands/highgate.png', w: 95, h: 59 },
  { name: 'Hilton', src: '/assets/brands/hilton.png', w: 86, h: 58 },
  { name: 'Barceló Hotel Group', src: '/assets/brands/barcelo.png', w: 103, h: 39 },
  { name: 'Alila', src: '/assets/brands/alila.png', w: 100, h: 39 },
  { name: 'Octant', src: '/assets/brands/octant.png', w: 152, h: 34 },
];

export const SOCIAL = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'YouTube', href: '#' },
];

export const OFFICES = [
  {
    city: 'Lisboa',
    lines: ['Rua do Barão, Nº 25 e 29', '1100-072 Lisboa', 'T +351 218 123 790', 'P +351 965 011 493'],
    email: 'geral@niniandradesilva.com',
  },
  {
    city: 'Funchal',
    lines: ['Rua dos Ferreiros, 125', '9000-082 Funchal, Madeira', 'T +351 291 215 500'],
    email: 'geral@niniandradesilva.com',
  },
];

export const LEGAL = [
  { label: 'Terms and conditions', href: '#' },
  { label: 'Privacy policy', href: '#' },
  { label: 'Cookies policy', href: '#' },
];
