import { luminance, parseHex, toHsl } from '../book-colour';
import { bookStickerElement } from '../book-sticker';
import type { BookFrame } from '../book.schema';
import { mixHex } from '../theme/book-theme';
import { CALM_ART, type BookDesignSticker } from './design-art';
import { frameOf } from './design-compose';
import {
  addLockup,
  clearOfTrim,
  deepened,
  inkOn,
  keptTurn,
  mmOn,
  mmToPt,
  printEl,
  shapeEl,
  spacedLine,
  standOut,
  titleText,
  type CoverDraft,
  type CoverKit,
} from './design-cover-kit';
import { placeStickers, sharedArea, turnedBox } from './design-stickers';

/**
 * The covers led by colour and drawing: a poster of two colour blocks with a
 * heavy title and a turned inset photo among stickers, and a pastel postcard
 * round a drawing of a landmark.
 */

const WHITE = '#ffffff';

/**
 * Poster pop (reference 2): the upper half of the page a block of the accent,
 * the title in two heavy lines on it at about a third of the page height, a
 * sun burst rising from the edge of the block behind a turned inset photo in
 * a white border, the subtitle and the year on the paper below, and three to
 * six stickers of the theme's motifs round the photo.
 */
export function posterPop(k: CoverKit): CoverDraft {
  const { c, W, H, b, m } = k;
  const draft: CoverDraft = { elements: [], groups: [] };
  const split = H * k.rng.range(0.5, 0.58);
  // A lockup sets small lines on the block too, which a mid-tone accent would not carry.
  const block = k.lockup ? deepened(c.look.accent) : c.look.accent;
  const blockEl = shapeEl(k, 'rect', frameOf(-b, -b, W + b * 2, split + b), block);
  const photo = k.photos[0];
  let photoBox: BookFrame | null = null;
  if (photo) {
    const pw = W * 0.44;
    const wide = !!(photo.width && photo.height && photo.width > photo.height);
    const ph = Math.min(H * 0.4, wide ? pw * 0.75 : pw * 1.2);
    const turn = keptTurn(k, k.rng.sign() * k.rng.range(3, 6));
    const cx = W * 0.6 + k.rng.range(-0.04, 0.04) * W;
    const cy = Math.min(split + H * 0.06, H - m - ph / 2 - mmOn(k, 4));
    const frame = frameOf(Math.min(cx - pw / 2, W - m - pw - 2), cy - ph / 2, pw, ph);
    const burst = W * 0.62;
    const burstFrame = clearOfTrim(k, frameOf(cx - burst / 2, cy - burst / 2, burst, burst), 0);
    // Behind the block, so the rays rise from its edge and the words on the block keep it as their ground.
    draft.elements.push(shapeEl(k, 'sunburst-24', burstFrame, standOut(c, c.look.paper, [block])), blockEl);
    const print = printEl(k, photo, frame, { turn, border: { width: mmOn(k, 3), color: WHITE }, shadow: true });
    draft.elements.push(print);
    photoBox = turnedBox(print.frame, print.rotation);
  } else {
    draft.elements.push(blockEl);
  }
  const zone = frameOf(m, m, W - m * 2, split - m - mmOn(k, 6));
  const titleZone = photoBox ? frameOf(zone.x, zone.y, zone.w, Math.min(zone.h, photoBox.y - zone.y - 3)) : zone;
  const asked = addLockup(k, draft, { box: titleZone, ground: block });
  if (!asked.length && k.title.words.trim()) {
    const max = mmToPt(titleZone.h / 2 / 0.95);
    draft.elements.push(
      titleText(k, titleZone, {
        max,
        color: inkOn(c, block),
        transform: 'upper',
        leading: 0.92,
        weight: 900,
        align: 'left',
      }),
    );
  }
  // The lines on the paper keep left of the photo.
  const left = photoBox ? Math.max(m + mmOn(k, 30), photoBox.x - 4) : W - m;
  const ink = inkOn(c, c.look.paper);
  const sub = k.sub.words.trim();
  if (sub && !asked.length) {
    const text = spacedLine(k, sub, frameOf(m, split + mmOn(k, 7), left - m, mmOn(k, 8)), ink, 10);
    draft.elements.push(k.sub.bound ? { ...text, binding: { source: 'journey.subtitle' } } : text);
  }
  const year = k.words.year ?? '';
  if (year) draft.elements.push(spacedLine(k, year, frameOf(m, H - m - mmOn(k, 8), left - m, mmOn(k, 8)), ink, 9));
  const count = (c.art ?? CALM_ART).bare ? 0 : k.rng.int(3, 6);
  draft.elements.push(
    ...placeStickers(c, draft.elements, {
      count,
      size: [0.12, 0.19],
      sides: ['single'],
      key: 'cover:poster-pop',
      used: c.art?.used,
    }),
  );
  return draft;
}

/**
 * A landmark drawing of the journey: one with a tag that is the name of a
 * stop it made (the city a stop is written as, "Paris" of "Paris, France"),
 * or whose name the title says. None for a journey the library draws nothing
 * of, since another place's landmark on the cover would be wrong: the cover
 * photo takes its place.
 */
function landmarkFor(k: CoverKit): BookDesignSticker | undefined {
  const landmarks = (k.c.art ?? CALM_ART).library.filter((s) => s.theme === 'landmarks');
  const stops = new Set(k.places.map((p) => p.split(',')[0]?.trim() ?? ''));
  const title = ` ${k.title.words.toLowerCase()} `;
  return landmarks.find(
    (s) =>
      s.tags.some((t) => stops.has(t.toLowerCase())) || (!!s.tags[0] && title.includes(` ${s.tags[0].toLowerCase()} `)),
  );
}

/** A pastel ground: the paper when it is a light tint, else the second accent washed out. */
function pastelOf(k: CoverKit): string {
  const paper = k.c.look.paper;
  const rgb = parseHex(paper) ?? { r: 255, g: 255, b: 255 };
  const tinted = luminance(rgb) >= 0.7 && toHsl(rgb).s >= 0.08 && luminance(rgb) < 0.97;
  return tinted ? paper : mixHex(k.c.look.theme.palette.accent2, WHITE, 0.72);
}

/**
 * Illustrated postcard (reference 5): a pastel page, a drawing of a landmark
 * of the journey at its centre (the cover photo in an arch when the library
 * draws none of its places), a small photo as a postage stamp in the corner
 * with the cancel lines under it, and the title in the display serif with a
 * script subtitle and the year under it (the title-script-year lockup, or the
 * one asked for).
 */
export function postcard(k: CoverKit): CoverDraft {
  const { c, W, H, m } = k;
  const ground = pastelOf(k);
  const draft: CoverDraft = { elements: [], groups: [], ...(ground === c.look.paper ? {} : { background: ground }) };
  const art = c.art ?? CALM_ART;
  const landmark = art.bare ? undefined : landmarkFor(k);
  const [photo, second] = k.photos;
  const top = H * 0.08;
  const tall = H * k.rng.range(0.42, 0.46);
  let centre: BookFrame | null = null;
  if (landmark) {
    const w = Math.min(W - m * 2, (tall * landmark.box[0]) / Math.max(landmark.box[1], 1));
    const h = (w * landmark.box[1]) / Math.max(landmark.box[0], 1);
    centre = frameOf((W - w) / 2, top + (tall - h) / 2, w, h);
    draft.elements.push(bookStickerElement(landmark, centre, c.newId('k')));
  } else if (photo) {
    const w = Math.min(tall * 0.78, W * 0.4);
    const arch = printEl(k, photo, frameOf((W - w) / 2, top, w, tall), {
      mask: 'arch-tall',
      cutout: { width: mmOn(k, 2), color: WHITE },
    });
    draft.elements.push(arch);
    centre = arch.frame;
  }
  const stampPhoto = landmark ? photo : second;
  const sw = W * 0.2;
  const stamp = frameOf(W - m - sw, m, sw, sw * 1.2);
  if (stampPhoto) {
    const turn = keptTurn(k, k.rng.sign() * k.rng.range(4, 8));
    const clear = !centre || sharedArea(turnedBox(stamp, turn), centre) === 0;
    if (clear) {
      const look = {
        turn,
        edge: { edge: 'perforated' as const, size: mmOn(k, 1.4) },
        border: { width: mmOn(k, 1.6), color: WHITE },
      };
      draft.elements.push(printEl(k, stampPhoto, stamp, look));
    }
  }
  // The cancel lines of a posted card, under the stamp's corner where they hide nothing.
  const wave = frameOf(stamp.x + stamp.w - W * 0.2, stamp.y + stamp.h + mmOn(k, 3), W * 0.2, W * 0.045);
  if (!centre || sharedArea(wave, centre) === 0) draft.elements.push(shapeEl(k, 'wave', wave, inkOn(c, ground)));
  const y = top + tall + mmOn(k, 8);
  addLockup(k, draft, { box: frameOf(m, y, W - m * 2, H - m - y), ground, fallback: 'title-script-year' });
  return draft;
}
