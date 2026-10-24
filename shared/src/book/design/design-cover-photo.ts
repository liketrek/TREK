import { luminance, parseHex, toHsl } from '../book-colour';
import type { BookElement, BookFrame, BookShapeId } from '../book.schema';
import { mixHex } from '../theme/book-theme';
import { frameOf } from './design-compose';
import {
  addLockup,
  askedLockup,
  bleedPhoto,
  clearOfTrim,
  coverText,
  deepened,
  inkOn,
  keptTurn,
  lockupOrnamented,
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
import { sharedArea, turnedBox } from './design-stickers';

/**
 * The covers led by one photograph: a spine band beside a photo to the bleed,
 * a minimal serif page under a large photo with a hairline, and a cut-out page
 * of paper shapes round a bordered portrait.
 */

const WHITE = '#ffffff';
const OUTLINE_SHARE = 0.07;
const ptMm = (pt: number) => (pt * 25.4) / 72;

/** The band keeps off the picture's detail: on the side away from it, by the seed when the detail is central. */
function bandOnLeft(focalX: number, k: CoverKit): boolean {
  if (focalX < 0.4) return false;
  return focalX > 0.6 || k.rng.chance(0.7);
}

/**
 * Spine band (reference 1): the photo to the bleed, a band of 14 to 18 % of the
 * width on the spine side (on the other when the picture's detail is there,
 * and now and then by the seed), solid or woven, the title in spaced capitals
 * along it, the year at its foot, a script subtitle on the photo, outlined so
 * it reads on any part of it.
 */
export function spineBand(k: CoverKit): CoverDraft {
  const { c, W, H, b, m, safe } = k;
  const draft: CoverDraft = { elements: [], groups: [] };
  const photo = k.photos[0];
  const bled = photo ? bleedPhoto(k, photo) : null;
  if (bled) draft.elements.push(bled);
  const onLeft = bandOnLeft(bled?.focalX ?? 0.5, k);
  const bw = W * k.rng.range(0.14, 0.18);
  const fill = deepened(photo ? c.look.accent : standOut(c, c.look.paper));
  const band = shapeEl(
    k,
    'rect',
    onLeft ? frameOf(-b, -b, bw + b, H + b * 2) : frameOf(W - bw, -b, bw + b, H + b * 2),
    fill,
  );
  const weave = k.rng.pick(['gingham', 'stripes', 'pinstripe'] as const);
  const woven = weave && k.rng.chance(0.5);
  draft.elements.push(
    woven
      ? {
          ...band,
          paint: { type: 'pattern', pattern: weave, fg: mixHex(fill, WHITE, 0.18), bg: fill, scale: 0.8, angle: 0 },
        }
      : band,
  );
  const ink = inkOn(c, fill);
  const bandX = onLeft ? 0 : W - bw;
  // The band's own width, kept off its edges and out of the safe margin.
  const innerX = Math.max(bandX + 2, safe + 1);
  const innerW = Math.min(bandX + bw - 2, W - safe - 1) - innerX;
  const year = k.words.year ?? '';
  if (year) draft.elements.push(spacedLine(k, year, frameOf(innerX, H - m - mmOn(k, 7), innerW, mmOn(k, 7)), ink, 8));
  // A lockup is set on a paper card over the photo: the band is too narrow for one.
  const card = frameOf(onLeft ? bw + m : m, H * 0.6, W - bw - m * 2, H * 0.4 - m);
  const asked = askedLockup(k, frameOf(card.x + 3, card.y + 3, card.w - 6, card.h - 6), c.look.paper);
  if (asked.length) {
    draft.elements.push(shapeEl(k, 'rect', card, c.look.paper), ...asked);
    if (asked.length > 1) draft.groups.push(asked.map((e) => e.id));
    return draft;
  }
  const len = H * 0.74;
  const thick = bw * 0.56;
  const cx = bandX + bw / 2;
  const along = frameOf(cx - len / 2, H * 0.46 - thick / 2, len, thick);
  let lead = 0;
  if (k.title.words.trim()) {
    const max = mmToPt(thick * 0.8);
    const turn = onLeft ? -90 : 90;
    const title = titleText(k, along, {
      max,
      color: ink,
      rotation: turn,
      transform: 'upper',
      tracking: 0.18,
      weight: 700,
    });
    draft.elements.push(title);
    lead = title.size;
  }
  const words = k.sub.words.trim();
  if (words) {
    const x = onLeft ? bw + m : m;
    const frame = frameOf(x, H * 0.7, W - bw - m * 2, H * 0.16);
    // A theme without a script sets the line in its heading face, which the band's title must still lead.
    const under = lead ? Math.max(8, Math.floor((lead / 2.2) * 4) / 4) : 14;
    const max = c.look.theme.fonts.script ? 30 : under;
    const set = coverText(k, words, frame, { slot: 'script', max, color: photo ? WHITE : c.look.ink });
    const binding = k.sub.bound ? { source: 'journey.subtitle' as const } : null;
    const outline = photo ? { color: '#1a1a1a', width: Math.round(ptMm(set.size) * OUTLINE_SHARE * 100) / 100 } : null;
    draft.elements.push({ ...set, binding, ...(outline ? { outline } : {}) });
  }
  return draft;
}

/**
 * Minimal serif (reference 7): a white page, a large photo inside the margins
 * with a hairline round it, and under it a very large thin serif title as
 * wide as the page holds it, the subtitle, a sun between two hairlines and
 * the year. A lockup asked for takes the title's place; one that brings no
 * ornament of its own keeps the sun under it, so the page is never bare. A
 * landscape page gives the title more of its height and the photo less.
 */
export function minimalSerif(k: CoverKit): CoverDraft {
  const { c, W, H, m } = k;
  const light = luminance(parseHex(c.look.paper) ?? { r: 255, g: 255, b: 255 }) > 0.8;
  const ground = light ? c.look.paper : WHITE;
  const draft: CoverDraft = { elements: [], groups: [], ...(light ? {} : { background: WHITE }) };
  const photo = k.photos[0];
  const wide = W > H * 1.15;
  const ph = H * (wide ? k.rng.range(0.38, 0.42) : k.rng.range(0.5, 0.56));
  if (photo) {
    const border = { width: Math.max(0.3, mmOn(k, 0.3)), color: inkOn(c, ground) };
    draft.elements.push(printEl(k, photo, frameOf(m, m, W - m * 2, ph), { border }));
  }
  const top = photo ? m + ph + mmOn(k, 6) : H * 0.25;
  const box = frameOf(m, top, W - m * 2, photo ? H - m - top : H * 0.5);
  if (k.lockup) {
    const plain = !lockupOrnamented(k.lockup);
    const foot = plain ? Math.min(mmOn(k, 10), box.h * 0.2) : 0;
    const asked = addLockup(k, draft, { box: frameOf(box.x, box.y, box.w, box.h - foot), ground });
    if (asked.length) {
      if (plain) sunRule(k, draft, frameOf(box.x, box.y + box.h - foot, box.w, foot), ground);
      return draft;
    }
  }
  serifStack(k, draft, box, ground);
  return draft;
}

/** A sun between two hairlines, centred in a band, made one group. */
function sunRule(k: CoverKit, draft: CoverDraft, band: BookFrame, ground: string): void {
  const d = Math.min(mmOn(k, 6), band.h * 0.8);
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h / 2;
  const bar = band.w * 0.22;
  const hair = Math.max(0.3, mmOn(k, 0.3));
  const ink = inkOn(k.c, ground);
  const parts = [
    shapeEl(k, 'rect', frameOf(cx - d / 2 - mmOn(k, 2) - bar, cy - hair / 2, bar, hair), ink),
    shapeEl(k, 'sun', frameOf(cx - d / 2, cy - d / 2, d, d), standOut(k.c, ground)),
    shapeEl(k, 'rect', frameOf(cx + d / 2 + mmOn(k, 2), cy - hair / 2, bar, hair), ink),
  ];
  draft.elements.push(...parts);
  draft.groups.push(parts.map((e) => e.id));
}

/**
 * The archetype's own words in a box: the title in the thin display face as
 * large as the box's width and height hold it, the subtitle under it, the
 * sun between hairlines and the year at the foot, the fixed lines made
 * smaller together when the box is short.
 */
function serifStack(k: CoverKit, draft: CoverDraft, box: BookFrame, ground: string): void {
  const ink = inkOn(k.c, ground);
  const sub = k.sub.words.trim();
  const year = k.words.year ?? '';
  const lines = { sub: sub ? mmOn(k, 9) : 0, rule: mmOn(k, 11), year: year ? mmOn(k, 8) : 0 };
  const fixed = lines.sub + lines.rule + lines.year;
  const titleH = Math.max(box.h * 0.4, box.h - fixed);
  const f = Math.min(1, (box.h - titleH) / Math.max(fixed, 1));
  let y = box.y;
  if (k.title.words.trim()) {
    const frame = frameOf(box.x, y, box.w, titleH);
    // In the display face at its own weight, the thin serif a minimal theme gives it; the theme links it so.
    draft.elements.push(titleText(k, frame, { max: mmToPt(titleH * 0.8), color: ink, leading: 1 }));
  }
  y += titleH;
  if (sub) {
    const text = coverText(k, sub, frameOf(box.x, y + mmOn(k, 2) * f, box.w, mmOn(k, 6) * f), {
      slot: 'heading',
      max: 11,
      color: ink,
      tracking: 0.04,
    });
    draft.elements.push(k.sub.bound ? { ...text, binding: { source: 'journey.subtitle' } } : text);
    y += lines.sub * f;
  }
  sunRule(k, draft, frameOf(box.x, y, box.w, lines.rule * f), ground);
  y += lines.rule * f;
  if (year) draft.elements.push(spacedLine(k, year, frameOf(box.x, y + mmOn(k, 1) * f, box.w, mmOn(k, 6) * f), ink, 8));
}

/** Saturated enough to be the page of a cut-out cover. */
function saturated(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  const hsl = toHsl(rgb);
  return hsl.s >= 0.35 && hsl.l >= 0.2 && hsl.l <= 0.65;
}

/** The paper cut-outs a cut-out cover is made of. */
const CUTOUTS: readonly BookShapeId[] = [
  'leaf-monstera',
  'leaf-palm',
  'leaf-long',
  'coral-1',
  'coral-2',
  'seaweed',
  'organic-1',
  'organic-2',
  'organic-3',
  'star-organic',
  'sun-cutout',
];

/**
 * Cut-out (reference 4): a saturated page, a spaced date line over a condensed
 * title at about a quarter of its height, paper cut-outs in two tones round a
 * portrait photo in a thick white border, a small one over its edge, and the
 * place in small capitals under it.
 */
export function cutout(k: CoverKit): CoverDraft {
  const { c, W, H, m } = k;
  const p = c.look.theme.palette;
  const ground = deepened([c.look.paper, c.look.accent, p.accent3, p.accent2].find(saturated) ?? c.look.accent);
  const draft: CoverDraft = { elements: [], groups: [], ...(ground === c.look.paper ? {} : { background: ground }) };
  const ink = inkOn(c, ground);
  const texts: BookElement[] = [];
  const zone = frameOf(m, m, W - m * 2, H * 0.34 - m);
  const asked = askedLockup(k, zone, ground);
  if (asked.length) {
    texts.push(...asked);
    if (asked.length > 1) draft.groups.push(asked.map((e) => e.id));
  } else {
    const line = k.words.dates || k.words.year || '';
    if (line) texts.push(spacedLine(k, line, frameOf(m, m, W - m * 2, mmOn(k, 8)), ink, 9));
    const titleFrame = frameOf(m, m + mmOn(k, 11), W - m * 2, H * 0.25);
    if (k.title.words.trim()) {
      const look = {
        max: mmToPt(H * 0.2),
        color: ink,
        transform: 'upper' as const,
        tracking: 0.04,
        weight: 800 as const,
      };
      texts.push(titleText(k, titleFrame, { ...look, leading: 0.95 }));
    }
  }
  const photo = k.photos[0];
  const pw = W * 0.48;
  const ph = H * 0.43;
  const turn = keptTurn(k, k.rng.range(-3, 3));
  const at = frameOf((W - pw) / 2 + k.rng.range(-0.04, 0.04) * W, H * 0.4, pw, ph);
  const print = photo ? printEl(k, photo, at, { turn, border: { width: mmOn(k, 4.5), color: WHITE } }) : null;
  const below = turnedBox(print?.frame ?? at, turn);
  const place = k.words.place ?? '';
  if (place && below.y + below.h + mmOn(k, 11) < H - m) {
    const w = below.w * 0.5;
    texts.push(
      spacedLine(k, place, frameOf(below.x + (below.w - w) / 2, below.y + below.h + mmOn(k, 4), w, mmOn(k, 6)), ink, 7),
    );
  }
  const first = standOut(c, ground);
  const tones = [first, standOut(c, ground, [first])];
  const keepClear = texts.map((t) => turnedBox(t.frame, t.rotation));
  const shapes = cutoutShapes(k, print?.frame ?? at, tones, keepClear, print);
  draft.elements.push(...shapes.behind);
  if (print) draft.elements.push(print);
  draft.elements.push(...shapes.front, ...texts);
  return draft;
}

/**
 * The cut-outs round the photo: up to five behind it, at its sides and lower
 * corners and partly off the page, one small one over its edge that keeps off
 * the picture's detail, none under the words.
 */
function cutoutShapes(
  k: CoverKit,
  photo: BookFrame,
  tones: readonly string[],
  keepClear: readonly BookFrame[],
  print: { frame: BookFrame; focalX: number; focalY: number } | null,
): { behind: BookElement[]; front: BookElement[] } {
  const ids = k.rng.shuffle(CUTOUTS);
  const cx = photo.x + photo.w / 2;
  const anchors: [number, number][] = [
    [photo.x - photo.w * 0.2, photo.y + photo.h * 0.45],
    [photo.x + photo.w * 1.2, photo.y + photo.h * 0.55],
    [photo.x - photo.w * 0.35, photo.y + photo.h * 0.98],
    [photo.x + photo.w * 1.35, photo.y + photo.h * 1.0],
    [cx - photo.w * 0.62, photo.y + photo.h * 0.08],
  ];
  const clashes = (box: BookFrame) => keepClear.some((t) => sharedArea(t, box) > 0);
  const behind: BookElement[] = [];
  anchors.forEach(([x, y], i) => {
    const size = k.W * k.rng.range(0.22, 0.32);
    const turn = k.rng.range(-40, 40);
    const frame = clearOfTrim(k, frameOf(x - size / 2, y - size / 2, size, size), turn);
    if (clashes(turnedBox(frame, turn))) return;
    behind.push(shapeEl(k, ids[i % ids.length] as BookShapeId, frame, tones[i % 2] as string, turn));
  });
  const front: BookElement[] = [];
  if (print) {
    const size = k.W * 0.16;
    const frame = frameOf(photo.x - size * 0.45, photo.y + photo.h - size * 0.6, size, size);
    const focal: [number, number] = [
      print.frame.x + print.focalX * print.frame.w,
      print.frame.y + print.focalY * print.frame.h,
    ];
    const box = turnedBox(frame, 20);
    const onDetail = focal[0] >= box.x && focal[0] <= box.x + box.w && focal[1] >= box.y && focal[1] <= box.y + box.h;
    if (!onDetail && !clashes(box)) {
      front.push(shapeEl(k, ids[anchors.length % ids.length] as BookShapeId, frame, tones[1] as string, 20));
    }
  }
  return { behind, front };
}
