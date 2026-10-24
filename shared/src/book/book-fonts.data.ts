/**
 * The typefaces a book may be set in, and what each of them is.
 *
 * One catalogue for every reader of a book: the schema takes its ids, the
 * Studio draws its picker and its stacks from it, the findings count its
 * roles, the design engine checks its weights, and the assistant reads the
 * same lines in the tool schemas. A family named in one of those places and
 * missing from another is how five of the first seven fonts shipped without
 * their faces (#2183), so nothing here is copied anywhere else.
 *
 * Every family is self-hosted through @fontsource and licensed under the SIL
 * Open Font License 1.1 or the Apache License 2.0 (the typefaces in NOTICE.md),
 * which both allow embedding in a printed or exported book.
 *
 * This file holds data only, so book.schema.ts can take the ids from it
 * without importing the logic in book-fonts.ts.
 */

/** Every weight CSS names. A family offers the ones it really ships. */
export const BOOK_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type BookWeight = (typeof BOOK_WEIGHTS)[number];

/**
 * What a family is for, most suited first.
 *
 * `display` sets a cover title or a poster word, `heading` a page's title,
 * `body` running text at 9 to 11 pt. A `script` is laid over a title or a
 * photo, a `mono` sets tickets and coordinates. Neither of the last two
 * counts towards the faces a book is set in (`font_mix`), because they are
 * ornaments of a page rather than its voice.
 */
export const BOOK_FONT_ROLES = ['display', 'heading', 'body', 'script', 'mono'] as const;
export type BookFontRole = (typeof BOOK_FONT_ROLES)[number];

/** The picker's groups, in the order it shows them. */
export const BOOK_FONT_CATEGORIES = ['sans', 'serif', 'elegant', 'condensed', 'retro', 'script', 'mono'] as const;
export type BookFontCategory = (typeof BOOK_FONT_CATEGORIES)[number];

export interface BookFontFace {
  /** What it is called, shown as itself in the picker. */
  name: string;
  /** The CSS stack. Ends in a generic, never in a font that is not bundled. */
  stack: string;
  /** The @fontsource package the faces come from. */
  pkg: string;
  category: BookFontCategory;
  /** What it suits, the first being what it is for. */
  roles: readonly BookFontRole[];
  /**
   * Weights actually loaded. Asking for 700 on a family that ships one weight
   * gets a synthesised bold, which prints as a smeared version of the regular.
   */
  weights: readonly BookWeight[];
  /** The weights it has a real italic for. Any other italic is the browser's slant. */
  italics: readonly BookWeight[];
  /**
   * Average letter width per em at weight 400, measured on story text from
   * the face's own advance widths, for the text measure in book-findings.ts.
   */
  letterEm: number;
  /**
   * The same at weight 700, measured the same way, for a family that ships a
   * real bold: a condensed bold sets up to a sixth wider than its regular.
   */
  boldEm?: number;
  /** Set in capitals whatever is typed. */
  caps?: true;
}

const ALL = BOOK_WEIGHTS;
const ONE = [400] as const;
const MID = [400, 500, 600, 700] as const;

/**
 * The families. `sans`, `serif` and `display` are the three the format started
 * with and keep their names, because documents already contain them.
 */
export const BOOK_FONT_FACES = {
  // ── sans ──
  sans: {
    name: 'Poppins',
    stack: '"Poppins", system-ui, sans-serif',
    pkg: 'poppins',
    category: 'sans',
    roles: ['heading', 'body', 'display'],
    weights: ALL,
    italics: [],
    letterEm: 0.507,
    boldEm: 0.519,
  },
  inter: {
    name: 'Inter',
    stack: '"Inter", system-ui, sans-serif',
    pkg: 'inter',
    category: 'sans',
    roles: ['body', 'heading'],
    weights: ALL,
    italics: [],
    letterEm: 0.478,
    boldEm: 0.491,
  },
  montserrat: {
    name: 'Montserrat',
    stack: '"Montserrat", system-ui, sans-serif',
    pkg: 'montserrat',
    category: 'sans',
    roles: ['heading', 'body', 'display'],
    weights: ALL,
    italics: [],
    letterEm: 0.507,
    boldEm: 0.536,
  },
  // ── serif ──
  serif: {
    name: 'Lora',
    stack: '"Lora", Georgia, serif',
    pkg: 'lora',
    category: 'serif',
    roles: ['body', 'heading'],
    weights: MID,
    italics: MID,
    letterEm: 0.469,
    boldEm: 0.481,
  },
  garamond: {
    name: 'EB Garamond',
    stack: '"EB Garamond", Georgia, serif',
    pkg: 'eb-garamond',
    category: 'serif',
    roles: ['body', 'heading'],
    weights: [400, 500, 600, 700, 800],
    italics: [400, 500, 600, 700, 800],
    letterEm: 0.383,
    boldEm: 0.424,
  },
  // ── elegant display serifs ──
  playfair: {
    name: 'Playfair Display',
    stack: '"Playfair Display", Georgia, serif',
    pkg: 'playfair-display',
    category: 'elegant',
    roles: ['display', 'heading'],
    weights: [400, 500, 600, 700, 800, 900],
    italics: [400, 500, 600, 700, 800, 900],
    letterEm: 0.454,
    boldEm: 0.462,
  },
  fraunces: {
    name: 'Fraunces',
    stack: '"Fraunces", Georgia, serif',
    pkg: 'fraunces',
    category: 'elegant',
    roles: ['display', 'heading', 'body'],
    weights: ALL,
    italics: ALL,
    letterEm: 0.467,
    boldEm: 0.497,
  },
  cormorant: {
    name: 'Cormorant Garamond',
    stack: '"Cormorant Garamond", Georgia, serif',
    pkg: 'cormorant-garamond',
    category: 'elegant',
    roles: ['display', 'heading'],
    weights: [300, 400, 500, 600, 700],
    italics: [300, 400, 500, 600, 700],
    letterEm: 0.393,
    boldEm: 0.398,
  },
  dmserif: {
    name: 'DM Serif Display',
    stack: '"DM Serif Display", Georgia, serif',
    pkg: 'dm-serif-display',
    category: 'elegant',
    roles: ['display'],
    weights: ONE,
    italics: ONE,
    letterEm: 0.448,
  },
  bodoni: {
    name: 'Bodoni Moda',
    stack: '"Bodoni Moda", Georgia, serif',
    pkg: 'bodoni-moda',
    category: 'elegant',
    roles: ['display', 'heading'],
    weights: [400, 500, 600, 700, 800, 900],
    italics: [400, 500, 600, 700, 800, 900],
    letterEm: 0.463,
    boldEm: 0.488,
  },
  // ── condensed and poster ──
  bebas: {
    name: 'Bebas Neue',
    stack: '"Bebas Neue", Impact, sans-serif',
    pkg: 'bebas-neue',
    category: 'condensed',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.339,
    caps: true,
  },
  anton: {
    name: 'Anton',
    stack: '"Anton", Impact, sans-serif',
    pkg: 'anton',
    category: 'condensed',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.409,
  },
  oswald: {
    name: 'Oswald',
    stack: '"Oswald", Impact, sans-serif',
    pkg: 'oswald',
    category: 'condensed',
    roles: ['display', 'heading'],
    weights: [200, 300, 400, 500, 600, 700],
    italics: [],
    letterEm: 0.365,
    boldEm: 0.412,
  },
  league: {
    name: 'League Gothic',
    stack: '"League Gothic", Impact, sans-serif',
    pkg: 'league-gothic',
    category: 'condensed',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.266,
  },
  shoulders: {
    name: 'Big Shoulders Display',
    stack: '"Big Shoulders Display", Impact, sans-serif',
    pkg: 'big-shoulders-display',
    category: 'condensed',
    roles: ['display', 'heading'],
    weights: ALL,
    italics: [],
    letterEm: 0.304,
    boldEm: 0.355,
  },
  archivo: {
    name: 'Archivo Black',
    stack: '"Archivo Black", Impact, sans-serif',
    pkg: 'archivo-black',
    category: 'condensed',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.557,
  },
  // ── heavy and retro display ──
  display: {
    name: 'MuseoModerno',
    stack: '"MuseoModerno", "Poppins", system-ui, sans-serif',
    pkg: 'museomoderno',
    category: 'retro',
    roles: ['display', 'heading'],
    weights: ALL,
    italics: [],
    letterEm: 0.492,
    boldEm: 0.5,
  },
  shrikhand: {
    name: 'Shrikhand',
    stack: '"Shrikhand", system-ui, sans-serif',
    pkg: 'shrikhand',
    category: 'retro',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.529,
  },
  alfa: {
    name: 'Alfa Slab One',
    stack: '"Alfa Slab One", Georgia, serif',
    pkg: 'alfa-slab-one',
    category: 'retro',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.54,
  },
  bricolage: {
    name: 'Bricolage Grotesque',
    stack: '"Bricolage Grotesque", system-ui, sans-serif',
    pkg: 'bricolage-grotesque',
    category: 'retro',
    roles: ['display', 'heading', 'body'],
    weights: [200, 300, 400, 500, 600, 700, 800],
    italics: [],
    letterEm: 0.471,
    boldEm: 0.49,
  },
  abril: {
    name: 'Abril Fatface',
    stack: '"Abril Fatface", Georgia, serif',
    pkg: 'abril-fatface',
    category: 'retro',
    roles: ['display'],
    weights: ONE,
    italics: [],
    letterEm: 0.46,
  },
  // ── script and handwriting ──
  caveat: {
    name: 'Caveat',
    stack: '"Caveat", cursive',
    pkg: 'caveat',
    category: 'script',
    roles: ['script'],
    weights: MID,
    italics: [],
    letterEm: 0.344,
    boldEm: 0.349,
  },
  dancing: {
    name: 'Dancing Script',
    stack: '"Dancing Script", cursive',
    pkg: 'dancing-script',
    category: 'script',
    roles: ['script'],
    weights: MID,
    italics: [],
    letterEm: 0.363,
    boldEm: 0.372,
  },
  pacifico: {
    name: 'Pacifico',
    stack: '"Pacifico", cursive',
    pkg: 'pacifico',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.419,
  },
  vibes: {
    name: 'Great Vibes',
    stack: '"Great Vibes", cursive',
    pkg: 'great-vibes',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.284,
  },
  sacramento: {
    name: 'Sacramento',
    stack: '"Sacramento", cursive',
    pkg: 'sacramento',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.308,
  },
  kaushan: {
    name: 'Kaushan Script',
    stack: '"Kaushan Script", cursive',
    pkg: 'kaushan-script',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.396,
  },
  allura: {
    name: 'Allura',
    stack: '"Allura", cursive',
    pkg: 'allura',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.33,
  },
  parisienne: {
    name: 'Parisienne',
    stack: '"Parisienne", cursive',
    pkg: 'parisienne',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.361,
  },
  satisfy: {
    name: 'Satisfy',
    stack: '"Satisfy", cursive',
    pkg: 'satisfy',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.382,
  },
  yellowtail: {
    name: 'Yellowtail',
    stack: '"Yellowtail", cursive',
    pkg: 'yellowtail',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.333,
  },
  homemade: {
    name: 'Homemade Apple',
    stack: '"Homemade Apple", cursive',
    pkg: 'homemade-apple',
    category: 'script',
    roles: ['script'],
    weights: ONE,
    italics: [],
    letterEm: 0.561,
  },
  marker: {
    name: 'Permanent Marker',
    stack: '"Permanent Marker", cursive',
    pkg: 'permanent-marker',
    category: 'script',
    roles: ['script', 'display'],
    weights: ONE,
    italics: [],
    letterEm: 0.516,
  },
  // ── mono ──
  mono: {
    name: 'DM Mono',
    stack: '"DM Mono", ui-monospace, monospace',
    pkg: 'dm-mono',
    category: 'mono',
    roles: ['mono'],
    weights: [300, 400, 500],
    italics: [],
    letterEm: 0.613,
  },
} as const satisfies Record<string, BookFontFace>;

export type BookFontFamily = keyof typeof BOOK_FONT_FACES;

/**
 * The families a book may be set in, as the schema takes them. The first
 * seven keep the order they shipped in; new ones follow.
 */
export const BOOK_FONTS_IDS = [
  'sans',
  'inter',
  'serif',
  'garamond',
  'playfair',
  'display',
  'bebas',
  'montserrat',
  'fraunces',
  'cormorant',
  'dmserif',
  'bodoni',
  'anton',
  'oswald',
  'league',
  'shoulders',
  'archivo',
  'shrikhand',
  'alfa',
  'bricolage',
  'abril',
  'caveat',
  'dancing',
  'pacifico',
  'vibes',
  'sacramento',
  'kaushan',
  'allura',
  'parisienne',
  'satisfy',
  'yellowtail',
  'homemade',
  'marker',
  'mono',
] as const satisfies readonly BookFontFamily[];

/**
 * The faces whose latin files the service worker installs with the app, so a
 * book set in them opens offline before Studio was ever opened online: the
 * seven families and weights the book shipped with before this catalogue grew.
 * Every other face is cached the first time a book that uses it is opened.
 */
export const BOOK_FONTS_PRECACHED: Readonly<Partial<Record<BookFontFamily, readonly BookWeight[]>>> = {
  sans: MID,
  inter: MID,
  serif: MID,
  garamond: MID,
  playfair: MID,
  display: MID,
  bebas: ONE,
};
