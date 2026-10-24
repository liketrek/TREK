import type { AutoPhoto } from '../auto/auto-types';
import type { BookFrame, BookPhotoElement } from '../book.schema';
import { frameOf, photoEl } from './design-compose';
import {
  addLockup,
  badgeSpan,
  inkOn,
  keptTurn,
  mmOn,
  mmToPt,
  placeLockup,
  printEl,
  shapeEl,
  spacedLine,
  titleText,
  type CoverDraft,
  type CoverKit,
} from './design-cover-kit';

/**
 * The covers made of several photos: four in a grid round a title badge, and
 * two or three cut into arches and stamps over a checker band with a postmark.
 */

const WHITE = '#ffffff';

/** A photo filling a cell of a grid edge to edge: unframed and straight, at print resolution. */
function cellEl(k: CoverKit, photo: AutoPhoto, cell: BookFrame): BookPhotoElement {
  return { ...photoEl(k.c, photo, cell), frameStyle: 'none', rotation: 0 };
}

/**
 * The cells of a cover grid, to the bleed with a gutter between them: four as
 * two by two, three as two over one, two side by side, one to the bleed.
 */
function gridCells(k: CoverKit, count: number, g: number): BookFrame[] {
  const { W, H, b } = k;
  const half = { w: (W - g) / 2 + b, h: (H - g) / 2 + b };
  const right = (W + g) / 2;
  const low = (H + g) / 2;
  if (count >= 4) {
    return [
      frameOf(-b, -b, half.w, half.h),
      frameOf(right, -b, half.w, half.h),
      frameOf(-b, low, half.w, half.h),
      frameOf(right, low, half.w, half.h),
    ];
  }
  if (count === 3) {
    return [frameOf(-b, -b, half.w, half.h), frameOf(right, -b, half.w, half.h), frameOf(-b, low, W + b * 2, half.h)];
  }
  if (count === 2) return [frameOf(-b, -b, half.w, H + b * 2), frameOf(right, -b, half.w, H + b * 2)];
  return count === 1 ? [frameOf(-b, -b, W + b * 2, H + b * 2)] : [];
}

/**
 * Grid and badge (reference 6): four photos two by two to the bleed with a
 * white cross of 4 to 6 mm between them, and a round badge at the centre with
 * the title and the year (the circle-badge lockup, or the one asked for).
 */
export function gridBadge(k: CoverKit): CoverDraft {
  const { c, W, H } = k;
  const draft: CoverDraft = { elements: [], groups: [] };
  const photos = k.photos.slice(0, 4);
  const cells = gridCells(k, photos.length, mmOn(k, k.rng.range(4, 6)));
  photos.forEach((p, i) => {
    const cell = cells[i];
    if (cell) draft.elements.push(cellEl(k, p, cell));
  });
  const cellsLaid = draft.elements.filter((e): e is BookPhotoElement => e.kind === 'photo');
  const d = badgeSpan(cellsLaid, [W / 2, H / 2], W * k.rng.range(0.4, 0.46), W * 0.26);
  addLockup(k, draft, { box: frameOf((W - d) / 2, (H - d) / 2, d, d), ground: c.look.paper, fallback: 'circle-badge' });
  return draft;
}

/**
 * The prints of a stamp collage in a row across the foot of the band: the
 * middle one cut to an arch with a white die-cut edge, the others perforated
 * as stamps in a white border, each turned a little by the seed.
 */
function stampRow(k: CoverKit, photos: readonly AutoPhoto[], y: number): BookPhotoElement[] {
  const { W } = k;
  const pw = W * 0.26;
  const gap = mmOn(k, 7);
  const n = photos.length;
  const start = (W - (n * pw + (n - 1) * gap)) / 2;
  const arch = n === 1 ? 0 : 1;
  return photos.map((p, i) => {
    const turn = keptTurn(k, k.rng.sign() * k.rng.range(2, 6));
    const ph = i === arch ? pw * 1.3 : pw * 1.2;
    const frame = frameOf(start + i * (pw + gap), y - ph / 2, pw, ph);
    if (i === arch) {
      return printEl(k, p, frame, { turn, mask: 'arch-tall', cutout: { width: mmOn(k, 1.8), color: WHITE } });
    }
    return printEl(k, p, frame, {
      turn,
      edge: { edge: 'perforated', size: mmOn(k, 1.5) },
      border: { width: mmOn(k, 2.2), color: WHITE },
    });
  });
}

/**
 * Stamp collage (reference 2, India): a checker band across the top of the
 * page, two or three photos as an arch and stamps over its edge, the title
 * in the display face under them (or the lockup asked for), the month in
 * spaced capitals, and a round postmark turned beside the title.
 */
export function stampCollage(k: CoverKit): CoverDraft {
  const { c, W, H, b, m } = k;
  const draft: CoverDraft = { elements: [], groups: [] };
  const bandH = H * 0.34;
  const band = shapeEl(k, 'rect', frameOf(-b, -b, W + b * 2, bandH + b), c.look.accent);
  const scale = Math.round(k.rng.range(0.9, 1.3) * 100) / 100;
  const paint = {
    type: 'pattern' as const,
    pattern: 'checker' as const,
    fg: c.look.accent,
    bg: c.look.paper,
    scale,
    angle: 0,
  };
  draft.elements.push({ ...band, paint });
  draft.elements.push(...stampRow(k, k.photos.slice(0, 3), bandH + mmOn(k, 4)));
  const titleTop = H * 0.62;
  // The postmark stays above the bottom margin, turned: on a short page it is smaller.
  const d = Math.min(W * 0.3, (H - m - titleTop + mmOn(k, 3)) * 0.92);
  const titleW = W - m * 2 - d - mmOn(k, 8);
  const ink = inkOn(c, c.look.paper);
  const titleBox = frameOf(m, titleTop, titleW, H * 0.27);
  if (!addLockup(k, draft, { box: titleBox, ground: c.look.paper }).length) {
    if (k.title.words.trim()) {
      const frame = frameOf(m, titleTop, titleW, H * 0.18);
      draft.elements.push(
        titleText(k, frame, { max: mmToPt(H * 0.15), color: ink, transform: 'upper', align: 'left', weight: 800 }),
      );
    }
    const line = k.words.dates || k.words.year || '';
    if (line) draft.elements.push(spacedLine(k, line, frameOf(m, titleTop + H * 0.19, titleW, mmOn(k, 8)), ink, 9));
  }
  const turn = -k.rng.range(6, 14);
  const box = frameOf(W - m - d, titleTop - mmOn(k, 3), d, d);
  placeLockup(k, draft, { id: 'postmark', box, ground: c.look.paper, turn });
  return draft;
}
