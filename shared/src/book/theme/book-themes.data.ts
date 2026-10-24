import type { BookFontFamily, BookWeight } from '../book-fonts.data';
import type {
  BookPalette,
  BookThemeDecoration,
  BookThemeId,
  BookThemeMotif,
  BOOK_THEME_FRAMES,
} from './book-theme.schema';

/**
 * The twelve built-in themes, each a look of its own rather than a recolour:
 * a paper and an ink that read together, three accents that belong to the
 * same place, a display face for the cover, a heading and a body face that
 * pair, a script for the words laid over a photo, and the motifs that suit.
 *
 * The faces are families of the book's own catalogue (book-fonts.data.ts),
 * each at a weight it really ships, which a spec holds them to.
 */

/** One typeface slot of a built-in theme: the family and, where the theme says, its weight. */
export interface BookThemeFontPick {
  font: BookFontFamily;
  weight?: BookWeight;
}

export interface BookThemePreset {
  id: BookThemeId;
  /** What the Studio calls it. */
  labelKey: string;
  /** One line on what it looks like, for the Studio's card. */
  descrKey: string;
  /** The same line in English, for a model picking a theme it cannot see. */
  descr: string;
  palette: BookPalette;
  fonts: {
    display: BookThemeFontPick;
    heading: BookThemeFontPick;
    body: BookThemeFontPick;
    script: BookThemeFontPick | null;
  };
  motifs: readonly BookThemeMotif[];
  decoration: BookThemeDecoration;
  frameStyle: (typeof BOOK_THEME_FRAMES)[number];
  tilt: number;
}

export const BOOK_THEME_PRESETS: readonly BookThemePreset[] = [
  {
    id: 'poster-pop',
    labelKey: 'studio.theme.name.posterPop',
    descrKey: 'studio.theme.descr.posterPop',
    descr:
      'Loud travel poster: cream paper, hot coral and sunflower blocks, heavy condensed titles, tropical stickers.',
    palette: { paper: '#fbf1de', ink: '#1d1a2f', accent: '#ef4e45', accent2: '#ffbf3c', accent3: '#13807b' },
    fonts: {
      display: { font: 'archivo', weight: 400 },
      heading: { font: 'anton', weight: 400 },
      body: { font: 'inter' },
      script: { font: 'kaushan', weight: 400 },
    },
    motifs: ['tropical', 'doodles'],
    decoration: 'rich',
    frameStyle: 'white',
    tilt: 4,
  },
  {
    id: 'cutout',
    labelKey: 'studio.theme.name.cutout',
    descrKey: 'studio.theme.descr.cutout',
    descr: 'Matisse cut-outs: cobalt paper, coral and sand shapes, white type, spaced condensed caps.',
    palette: { paper: '#2445b8', ink: '#fdf8ef', accent: '#ff7a59', accent2: '#f1d9b5', accent3: '#9fd3ff' },
    fonts: {
      display: { font: 'shoulders', weight: 800 },
      heading: { font: 'oswald', weight: 500 },
      body: { font: 'inter' },
      script: { font: 'caveat', weight: 400 },
    },
    motifs: ['sea', 'doodles'],
    decoration: 'light',
    frameStyle: 'white',
    tilt: 2,
  },
  {
    id: 'postcard',
    labelKey: 'studio.theme.name.postcard',
    descrKey: 'studio.theme.descr.postcard',
    descr:
      'Illustrated postcard: pastel mint paper, navy ink, stamp red and peach, a display serif with a script subtitle.',
    palette: { paper: '#e3f1e8', ink: '#1f2d4d', accent: '#c8453d', accent2: '#ec8f6a', accent3: '#f3d58a' },
    fonts: {
      display: { font: 'dmserif', weight: 400 },
      heading: { font: 'montserrat', weight: 600 },
      body: { font: 'inter' },
      script: { font: 'dancing', weight: 400 },
    },
    motifs: ['landmarks', 'mediterranean'],
    decoration: 'light',
    frameStyle: 'white',
    tilt: 0,
  },
  {
    id: 'riviera',
    labelKey: 'studio.theme.name.riviera',
    descrKey: 'studio.theme.descr.riviera',
    descr: 'Mediterranean summer: warm white paper, azure, olive and lemon yellow, a soft serif with a flowing script.',
    palette: { paper: '#fffaf0', ink: '#22324a', accent: '#2a78bd', accent2: '#6f7f34', accent3: '#e9b824' },
    fonts: {
      display: { font: 'fraunces', weight: 600 },
      heading: { font: 'montserrat', weight: 500 },
      body: { font: 'serif' },
      script: { font: 'vibes', weight: 400 },
    },
    motifs: ['mediterranean', 'sea'],
    decoration: 'light',
    frameStyle: 'none',
    tilt: 0,
  },
  {
    id: 'fabric-classic',
    labelKey: 'studio.theme.name.fabricClassic',
    descrKey: 'studio.theme.descr.fabricClassic',
    descr:
      'Linen-bound classic: linen paper, dusty blue and terracotta, an elegant serif over Garamond, fine ornaments.',
    palette: { paper: '#efe8db', ink: '#2e2a26', accent: '#5f7d99', accent2: '#b0603c', accent3: '#97a184' },
    fonts: {
      display: { font: 'cormorant', weight: 500 },
      heading: { font: 'montserrat', weight: 500 },
      body: { font: 'garamond' },
      script: { font: 'sacramento', weight: 400 },
    },
    motifs: ['nordic', 'ornaments'],
    decoration: 'light',
    frameStyle: 'none',
    tilt: 0,
  },
  {
    id: 'minimal-serif',
    labelKey: 'studio.theme.name.minimalSerif',
    descrKey: 'studio.theme.descr.minimalSerif',
    descr:
      'Gallery minimal: white paper, warm grey and sand, a very large thin serif title, hairline ornaments, no script.',
    palette: { paper: '#ffffff', ink: '#222222', accent: '#857d72', accent2: '#cbbda6', accent3: '#54504a' },
    fonts: {
      display: { font: 'cormorant', weight: 300 },
      heading: { font: 'montserrat', weight: 300 },
      body: { font: 'inter' },
      script: null,
    },
    motifs: ['ornaments'],
    decoration: 'none',
    frameStyle: 'none',
    tilt: 0,
  },
  {
    id: 'grid-badge',
    labelKey: 'studio.theme.name.gridBadge',
    descrKey: 'studio.theme.descr.gridBadge',
    descr: 'Photo grid with a badge: white paper, black ink, one red accent, heavy geometric caps, travel ephemera.',
    palette: { paper: '#ffffff', ink: '#141414', accent: '#e2412f', accent2: '#f2eee7', accent3: '#6f6f6f' },
    fonts: {
      display: { font: 'montserrat', weight: 800 },
      heading: { font: 'montserrat', weight: 600 },
      body: { font: 'inter' },
      script: { font: 'allura', weight: 400 },
    },
    motifs: ['ephemera'],
    decoration: 'light',
    frameStyle: 'none',
    tilt: 0,
  },
  {
    id: 'scrapbook-script',
    labelKey: 'studio.theme.name.scrapbookScript',
    descrKey: 'studio.theme.descr.scrapbookScript',
    descr: 'Handmade scrapbook: kraft paper, cream and red, marker titles, handwriting, tape, doodles and tickets.',
    palette: { paper: '#dcc6a2', ink: '#2b2118', accent: '#c2342a', accent2: '#f8f1e1', accent3: '#2f4f7a' },
    fonts: {
      display: { font: 'marker', weight: 400 },
      heading: { font: 'caveat', weight: 700 },
      body: { font: 'serif' },
      script: { font: 'homemade', weight: 400 },
    },
    motifs: ['paper', 'doodles', 'ephemera'],
    decoration: 'rich',
    frameStyle: 'polaroid',
    tilt: 3,
  },
  {
    id: 'tropical',
    labelKey: 'studio.theme.name.tropical',
    descrKey: 'studio.theme.descr.tropical',
    descr: 'Tropical holiday: cream paper, jungle green, hibiscus red and mango, a fat retro title and a beach script.',
    palette: { paper: '#fbf5e6', ink: '#13382a', accent: '#1d7a4c', accent2: '#dc3446', accent3: '#f29d34' },
    fonts: {
      display: { font: 'shrikhand', weight: 400 },
      heading: { font: 'oswald', weight: 500 },
      body: { font: 'sans' },
      script: { font: 'pacifico', weight: 400 },
    },
    motifs: ['tropical'],
    decoration: 'rich',
    frameStyle: 'white',
    tilt: 2,
  },
  {
    id: 'nordic',
    labelKey: 'studio.theme.name.nordic',
    descrKey: 'studio.theme.descr.nordic',
    descr: 'Nordic calm: pale grey paper, slate ink, ochre and rose, a friendly grotesque, row houses and pines.',
    palette: { paper: '#f3f1ec', ink: '#2e3a45', accent: '#a8741c', accent2: '#cf7d7d', accent3: '#566d83' },
    fonts: {
      display: { font: 'bricolage', weight: 700 },
      heading: { font: 'montserrat', weight: 600 },
      body: { font: 'inter' },
      script: { font: 'satisfy', weight: 400 },
    },
    motifs: ['nordic', 'mountains'],
    decoration: 'light',
    frameStyle: 'none',
    tilt: 0,
  },
  {
    id: 'alpine',
    labelKey: 'studio.theme.name.alpine',
    descrKey: 'studio.theme.descr.alpine',
    descr: 'Alpine lodge: snow white paper, forest green ink, rust and sky blue, a slab title over condensed caps.',
    palette: { paper: '#f7f7f2', ink: '#1e3a2c', accent: '#b0502a', accent2: '#2f5d46', accent3: '#6f9cbd' },
    fonts: {
      display: { font: 'alfa', weight: 400 },
      heading: { font: 'oswald', weight: 500 },
      body: { font: 'inter' },
      script: { font: 'caveat', weight: 400 },
    },
    motifs: ['mountains'],
    decoration: 'light',
    frameStyle: 'white',
    tilt: 0,
  },
  {
    id: 'india-stamp',
    labelKey: 'studio.theme.name.indiaStamp',
    descrKey: 'studio.theme.descr.indiaStamp',
    descr: 'Stamp collage: warm paper, magenta, saffron and teal, a high-contrast display serif, stamps and postmarks.',
    palette: { paper: '#fbf2e2', ink: '#2a1b2e', accent: '#bd2275', accent2: '#e9801a', accent3: '#12807f' },
    fonts: {
      display: { font: 'abril', weight: 400 },
      heading: { font: 'montserrat', weight: 600 },
      body: { font: 'serif' },
      script: { font: 'parisienne', weight: 400 },
    },
    motifs: ['asia', 'ephemera'],
    decoration: 'rich',
    frameStyle: 'white',
    tilt: 2,
  },
];
