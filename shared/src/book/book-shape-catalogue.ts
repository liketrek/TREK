import type { BookShapeId } from './book.schema';

/**
 * How the Studio's shape shelf is divided and which shapes it offers as photo
 * frames: one list for the Shapes panel, the photo inspector and the
 * assistant's `list_book_assets`, so the three agree on what a frame is.
 *
 * Grouped the way you go looking for them ("I want an arrow", "I want
 * something round and soft") rather than by how they are built. Sixty
 * unlabelled tiles in one grid is a wall; six groups of ten is a menu.
 */

export interface BookShapeGroup {
  /** The group's i18n key under `journey.studio.shapeGroup`, and its tag in the asset listing. */
  id: string;
  shapes: BookShapeId[];
}

export const BOOK_SHAPE_GROUPS: BookShapeGroup[] = [
  {
    id: 'basic',
    shapes: [
      'rect',
      'squircle',
      'ellipse',
      'capsule',
      'triangle',
      'triangle-down',
      'diamond',
      'parallelogram',
      'trapezoid',
      'arch',
      'half-circle',
      'quarter-circle',
    ],
  },
  { id: 'polygons', shapes: ['pentagon', 'hexagon', 'hexagon-flat', 'heptagon', 'octagon'] },
  {
    id: 'stars',
    shapes: [
      'star-4',
      'star-5',
      'star-6',
      'star-8',
      'star-12',
      'burst',
      'seal',
      'sparkle',
      'star-rounded',
      'star-twinkle',
    ],
  },
  {
    id: 'arrows',
    shapes: [
      'arrow-right',
      'arrow-left',
      'arrow-up',
      'arrow-down',
      'arrow-both',
      'chevron-right',
      'chevron-left',
      'arrow-bent',
      'arrow-curve',
      'arrow-circle',
      'arrow-notched',
      'arrow-thin',
    ],
  },
  {
    id: 'speech',
    shapes: [
      'bubble-round',
      'bubble-square',
      'bubble-oval',
      'bubble-think',
      'bubble-shout',
      'bubble-side',
      'bubble-capsule',
    ],
  },
  {
    id: 'travel',
    shapes: [
      'pin',
      'compass',
      'mountain',
      'sun',
      'moon',
      'cloud',
      'cloud-puffy',
      'drop',
      'wave',
      'leaf',
      'shield',
      'ticket',
    ],
  },
  {
    id: 'decor',
    shapes: [
      'heart',
      'flower-5',
      'flower-6',
      'cross',
      'plus',
      'gear',
      'blob-1',
      'blob-2',
      'blob-3',
      'blob-4',
      'heart-round',
      'heart-pair',
      'flower-8',
    ],
  },
  {
    id: 'banners',
    shapes: [
      'banner-ribbon',
      'banner-pennant',
      'banner-bookmark',
      'banner-flag',
      'ribbon-ends',
      'ribbon-arc',
      'wavy-band',
      'torn-strip',
    ],
  },
  // The second shelf (book-shapes-more.ts).
  { id: 'arches', shapes: ['arch-tall', 'arch-pointed', 'arch-double', 'arch-half', 'arch-rainbow'] },
  {
    id: 'cutouts',
    shapes: [
      'leaf-palm',
      'leaf-oak',
      'leaf-long',
      'leaf-monstera',
      'coral-1',
      'coral-2',
      'seaweed',
      'star-organic',
      'sun-cutout',
      'organic-1',
      'organic-2',
      'organic-3',
    ],
  },
  {
    id: 'stamps',
    shapes: [
      'stamp-rect',
      'stamp-circle',
      'postmark',
      'rosette',
      'scallop-circle',
      'badge-shield',
      'label-tab',
      'ticket-stub',
      'sunburst-12',
      'sunburst-24',
    ],
  },
  { id: 'frames', shapes: ['frame-notched', 'frame-chamfer', 'frame-cushion'] },
  { id: 'ornaments', shapes: ['flourish-scroll', 'laurel', 'fleuron', 'corner-flourish'] },
];

/**
 * The shapes offered as picture frames.
 *
 * A subset, and the subset is the point: a photograph cut to a speech bubble's
 * tail or to a hairline is a photograph you cannot read. What is here holds an
 * image at book size: broad, mostly convex, no thin limbs.
 */
export const BOOK_FRAME_SHAPES: BookShapeId[] = [
  'rect',
  'squircle',
  'ellipse',
  'capsule',
  'arch',
  'half-circle',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'octagon',
  'heart',
  'star-5',
  'star-6',
  'seal',
  'flower-5',
  'flower-6',
  'blob-1',
  'blob-2',
  'blob-3',
  'blob-4',
  'shield',
  'drop',
  'leaf',
  'pin',
  'banner-pennant',
  'banner-bookmark',
  // The second shelf: arches, stamps and the frames cut for photographs.
  'arch-tall',
  'arch-pointed',
  'arch-double',
  'arch-half',
  'stamp-rect',
  'stamp-circle',
  'scallop-circle',
  'badge-shield',
  'ticket-stub',
  'heart-round',
  'star-rounded',
  'flower-8',
  'frame-notched',
  'frame-chamfer',
  'frame-cushion',
  'organic-1',
  'organic-2',
  'organic-3',
  'star-organic',
  'sun-cutout',
  'bubble-side',
  'bubble-capsule',
];
