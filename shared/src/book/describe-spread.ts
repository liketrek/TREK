import { photoDpi, spreadFindings } from './book-findings';
import { designFindings, sortBookFindings } from './book-findings-design';
import { BOOK_GRIDS } from './book-grids';
import { BOOK_COVER_TEMPLATES, BOOK_TEMPLATES, type BookTemplate } from './book-layouts';
import type { BookPhotoInfo } from './book-ops-core';
import type {
  BookElementSummary,
  BookFinding,
  BookOverview,
  BookPageDescription,
  BookSpreadSummary,
} from './book-ops.schema';
import {
  bookPageSetupSchema,
  type BookDocument,
  type BookElement,
  type BookPageSetup,
  type BookPhotoElement,
  type BookSpread,
} from './book.schema';

/**
 * A page in words, for a model that cannot see it and as the text beside a
 * page image for one that can: the page and its role, every element back to
 * front with its frame in millimetres, what each photo is and how it sits in
 * its frame, what each text says and how it is set, then the findings.
 *
 * Also the short forms a read tool answers with: one row per page for
 * `get_book`, the layouts a book can use for `list_book_layouts`.
 */

const n = (v: number) => `${Math.round(v * 10) / 10}`;
const head = (text: string, max: number) => {
  const flat = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' / ');
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

const ROLE_WORDS: Record<BookSpread['role'], string> = {
  cover: 'the front cover, a single page',
  first: 'the first page, a single right-hand page',
  inner: 'a double spread',
  last: 'the last page, a single left-hand page',
  back: 'the back cover, a single page',
};

function orientation(w: number, h: number): string {
  if (Math.abs(w - h) / Math.max(w, h) < 0.05) return 'square';
  return w > h ? 'landscape' : 'portrait';
}

function photoWords(el: BookPhotoElement, info: BookPhotoInfo | undefined): string {
  if (el.photoId == null) return 'empty frame';
  const parts = [`photo ${el.photoId}`];
  if (info?.hidden) parts.push('by another contributor, not shown');
  if (info?.width && info.height) {
    const pic = orientation(info.width, info.height);
    const frame = orientation(el.frame.w, el.frame.h);
    parts.push(`${pic} ${info.width} x ${info.height} px in a ${frame} frame`);
    const ratio = info.width / info.height / (el.frame.w / el.frame.h);
    const shown = Math.min(ratio, 1 / ratio);
    if (el.fit === 'cover' && shown < 0.9) {
      const crop = `cover shows ${Math.round(shown * 100)}% of the picture (no face detection: check people in the page image)`;
      parts.push(crop);
    }
  }
  parts.push(`${el.fit}, focal ${el.focalX.toFixed(2)}/${el.focalY.toFixed(2)}`);
  const dpi = photoDpi(el, info);
  if (dpi !== null) parts.push(`about ${dpi} dpi`);
  if (el.filter !== 'none') parts.push(`filter ${el.filter}`);
  if (el.mask) parts.push(`mask ${el.mask}`);
  if (el.frameStyle !== 'none') parts.push(`frame style ${el.frameStyle}`);
  if (el.radius > 0) parts.push(`radius ${n(el.radius)}`);
  return parts.join(', ');
}

function elementWords(el: BookElement, photos: readonly BookPhotoInfo[] | undefined): string {
  switch (el.kind) {
    case 'photo':
      return photoWords(
        el,
        photos?.find((p) => p.photoId === el.photoId),
      );
    case 'text': {
      const style = `${el.font} ${n(el.size)} pt${el.weight >= 600 ? ' bold' : ''}${el.italic ? ' italic' : ''}, ${el.align}, ${el.color}`;
      const bound = el.binding ? `, bound to ${el.binding.source}${el.overridden ? ' (overridden)' : ''}` : '';
      return `${style}: "${head(el.text, 80)}"${bound}`;
    }
    case 'shape':
      return shapeWords(el);
    case 'icon':
      return `icon ${el.name}, ${el.color}, line ${n(el.lineWidth)}`;
    default:
      return travelWords(el);
  }
}

function shapeWords(el: Extract<BookElement, { kind: 'shape' }>): string {
  const parts = [`${el.shape}, fill ${el.fill ?? 'none'}`];
  if (el.gradient !== 'none') parts.push(`fading ${el.gradient}`);
  if (el.stroke) parts.push(`stroke ${el.stroke} ${n(el.strokeWidth)} mm ${el.strokeStyle}`);
  if (el.radius > 0) parts.push(`radius ${n(el.radius)}`);
  return parts.join(', ');
}

type TravelElement = Extract<BookElement, { kind: 'map' | 'stats' | 'countries' | 'badge' | 'list' }>;

/** What a travel element shows, and how it is set: its face, ink, accent and size. */
function travelWords(el: TravelElement): string {
  const set = `${el.font} ${el.weight >= 600 ? 'bold' : 'regular'}, ink ${el.color}, accent ${el.accent}, type x${n(el.textScale)}`;
  const stale = el.stale ? '; its figures are out of date with the journey' : '';
  return `${travelWhat(el)}; ${set}${stale}`;
}

function travelWhat(el: TravelElement): string {
  switch (el.kind) {
    case 'map': {
      const scope = el.tripId != null ? `trip ${el.tripId}` : 'the whole journey';
      const line = el.path.length ? `, a recorded track of ${el.path.length} segments` : '';
      return `${el.style} ${el.source} map of ${scope}, ${el.points.length} stops, ${el.countries.length} countries${line}`;
    }
    case 'stats': {
      const figures = el.metrics.map((m) => `${m} ${el.values[m] ?? 0}`).join(', ');
      return `figures (${el.layout}): ${figures}`;
    }
    case 'countries':
      return `${el.codes.length} countries (${el.codes.slice(0, 8).join(', ')}), ${el.layout}`;
    case 'badge':
      return `${el.variant} mark "${head(el.text, 40)}"${el.sub ? ` over "${head(el.sub, 40)}"` : ''}, ${el.style}`;
    case 'list': {
      const pros = el.items.filter((i) => i.tone === 'pro').length;
      return `list of ${el.items.length} (${pros} pros, ${el.items.length - pros} others), ${el.layout}`;
    }
  }
}

function elementLine(el: BookElement, i: number, photos: readonly BookPhotoInfo[] | undefined): string {
  const { x, y, w, h } = el.frame;
  const extra = [
    el.rotation ? `turned ${n(el.rotation)} deg` : '',
    el.opacity < 1 ? `opacity ${n(el.opacity)}` : '',
    el.locked ? 'locked' : '',
  ].filter(Boolean);
  const tail = extra.length ? `; ${extra.join(', ')}` : '';
  return `${i + 1}. ${el.kind} ${el.id} at ${n(x)}, ${n(y)}, ${n(w)} x ${n(h)}: ${elementWords(el, photos)}${tail}`;
}

function parkedLine(spread: BookSpread): string | null {
  if (!spread.parked.length) return null;
  const items = spread.parked
    .slice(0, 12)
    .map((el) =>
      el.kind === 'photo'
        ? `photo ${el.photoId ?? 'empty'}`
        : el.kind === 'text'
          ? `text "${head(el.text, 30)}"`
          : el.kind,
    );
  const more = spread.parked.length > 12 ? `, and ${spread.parked.length - 12} more` : '';
  return `Parked off the page (${spread.parked.length}): ${items.join(', ')}${more}`;
}

function pageLine(doc: BookDocument, spread: BookSpread, index: number): string {
  const p = doc.page;
  const single = spread.role !== 'inner';
  const size = single
    ? `${n(p.pageWidth)} x ${n(p.pageHeight)} mm`
    : `${n(p.pageWidth * 2)} x ${n(p.pageHeight)} mm (two pages of ${n(p.pageWidth)} x ${n(p.pageHeight)}), fold at x ${n(p.pageWidth)}`;
  const entry = spread.entryId != null ? ` From entry ${spread.entryId}.` : '';
  return `Page ${index + 1} of ${doc.spreads.length} (${spread.id}): ${ROLE_WORDS[spread.role]}, ${size}; bleed ${n(p.bleed)}, safe ${n(p.safe)}. Background ${spread.background ?? 'paper (none set)'}.${entry}`;
}

function findingLine(f: BookFinding): string {
  return `- ${f.severity} ${f.code}: ${f.message}`;
}

function elementSummary(el: BookElement): BookElementSummary {
  const { x, y, w, h } = el.frame;
  return {
    id: el.id,
    kind: el.kind,
    frame: { x, y, w, h },
    rotation: el.rotation,
    locked: el.locked,
    ...(el.kind === 'photo' ? { photoId: el.photoId } : {}),
    ...(el.kind === 'text' ? { text: head(el.text, 80) } : {}),
    ...(el.kind === 'text' && el.binding ? { binding: el.binding.source } : {}),
  };
}

/**
 * Every finding of one page, the print faults and the design checks
 * (book-findings-design.ts) together, severe first, at most the cap.
 */
export function pageFindings(
  spread: BookSpread,
  page: BookPageSetup,
  photos?: readonly BookPhotoInfo[],
): BookFinding[] {
  return sortBookFindings([...spreadFindings(spread, page, photos), ...designFindings(spread, page, photos)]);
}

/**
 * One page in words, with its findings and its elements. Null when the book
 * has no page with that id.
 *
 * `photos` is the journey gallery as far as it is known: the original's size
 * gives the print resolution, `hidden` marks a photo the page image leaves out.
 */
export function describeSpread(
  doc: BookDocument,
  spreadId: string,
  photos?: readonly BookPhotoInfo[],
): BookPageDescription | null {
  const index = doc.spreads.findIndex((s) => s.id === spreadId);
  const spread = doc.spreads[index];
  if (!spread) return null;
  const findings = pageFindings(spread, doc.page, photos);
  const lines = [pageLine(doc, spread, index)];
  if (spread.elements.length) {
    lines.push('Elements, back to front (frame in mm: x, y, w x h):');
    spread.elements.forEach((el, i) => lines.push(elementLine(el, i, photos)));
  } else {
    lines.push('The page is empty.');
  }
  const parked = parkedLine(spread);
  if (parked) lines.push(parked);
  lines.push(findings.length ? 'Findings:' : 'Findings: none.');
  findings.forEach((f) => lines.push(findingLine(f)));
  return {
    spreadId: spread.id,
    index,
    role: spread.role,
    text: lines.join('\n'),
    findings,
    elements: spread.elements.map(elementSummary),
  };
}

/** One page as a row of `get_book`. */
export function summarizeSpread(spread: BookSpread, index: number): BookSpreadSummary {
  const photos = spread.elements.filter((e): e is BookPhotoElement => e.kind === 'photo');
  return {
    index,
    id: spread.id,
    role: spread.role,
    entryId: spread.entryId,
    background: spread.background,
    photoIds: photos.flatMap((p) => (p.photoId == null ? [] : [p.photoId])),
    texts: spread.elements.flatMap((e) => (e.kind === 'text' && e.text.trim() ? [head(e.text, 60)] : [])),
    elements: spread.elements.length,
    emptyFrames: photos.filter((p) => p.photoId == null).length,
    parked: spread.parked.length,
  };
}

/** `get_book`: the book without its document; `doc` null is a journey without a book. */
export function summarizeBook(doc: BookDocument | null, version: number | null): BookOverview {
  const { preset, pageWidth, pageHeight, bleed, safe } = doc?.page ?? bookPageSetupSchema.parse({});
  return {
    exists: doc !== null,
    version: doc ? version : null,
    title: doc?.title ?? '',
    page: { preset, pageWidth, pageHeight, bleed, safe },
    spreads: doc ? doc.spreads.map(summarizeSpread) : [],
    layouts: (doc?.layouts ?? []).map((l) => ({ id: l.id, name: l.name, role: l.role })),
  };
}

function templateRow(tpl: BookTemplate, page: BookPageSetup) {
  const slots = tpl.build(page);
  return {
    id: tpl.id,
    photoSlots: tpl.photoSlots,
    textSlots: slots.flatMap((s) => (s.kind === 'photo' ? [] : [s.kind])),
  };
}

/**
 * What a layout does to what is on the page, said where a model picks one: a
 * grid here is not the Studio's grid button (which adds empty frames on top),
 * and a template or saved layout leaves out what it has no slot kind for.
 */
const BOOK_LAYOUT_NOTES = {
  templates:
    "A template or saved layout re-pours the photos and texts of the page into its slots and parks what it has no room for; the page's own shapes, maps, badges, stats, lists and icons are dropped (a saved layout brings its own), and the write answer names them in dropped.",
  grids:
    'A grid re-pours every photo of the page, placed or parked, into its cells and parks the rest; the old frames go, empty ones too. Texts, shapes and travel elements stay where they are.',
} as const;

/** `list_book_layouts`: what a page can be laid out on, for a double spread, a single page, or both. */
export function listBookLayouts(doc: BookDocument | null, page: BookPageSetup, role?: 'inner' | 'single') {
  const want = (r: 'inner' | 'single') => role === undefined || role === r;
  return {
    notes: BOOK_LAYOUT_NOTES,
    inner: want('inner') ? BOOK_TEMPLATES.map((t) => templateRow(t, page)) : [],
    single: want('single') ? BOOK_COVER_TEMPLATES.map((t) => templateRow(t, page)) : [],
    grids: BOOK_GRIDS.map((g) => ({ id: g.id, cells: g.cells.length })),
    saved: (doc?.layouts ?? [])
      .filter((l) => want(l.role))
      .map((l) => ({
        id: l.id,
        name: l.name,
        role: l.role,
        photoFrames: l.elements.filter((e) => e.kind === 'photo').length,
        texts: l.elements.filter((e) => e.kind === 'text').length,
      })),
  };
}
