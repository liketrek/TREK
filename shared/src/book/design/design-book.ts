import { buildBook, distributeGallery } from '../auto/auto-book';
import type { AutoEntry, AutoInput, AutoPhoto } from '../auto/auto-types';
import { bookLevelFindings, sortBookFindings } from '../book-findings-design';
import { bookElementId } from '../book-ids';
import type { BookPhotoInfo } from '../book-ops-core';
import type { BookFinding } from '../book-ops.schema';
import { bookPageSetupForPreset } from '../book-pages';
import type { BookTravelContext } from '../book-travel';
import { MAX_BOOK_TITLE, MAX_SPREADS, type BookDocument, type BookPageSetup, type BookSpread } from '../book.schema';
import { pageFindings } from '../describe-spread';
import type { PhotoPickCandidate } from '../photo-pick';
import type { ComposeCtx } from './design-compose';
import {
  bookDesignDirectivesSchema,
  type BookDesignDirectives,
  type BookDesignDirectivesInput,
} from './design-directives.schema';
import { composeBack, composeCover, composeTitlePage, stationsPerSpread } from './design-framing';
import { composeDesignedInner, type FramingNeeds } from './design-inner';
import { keepsStored, mergeDesign, type BookDesignPlanRow, type DesignedSpread } from './design-merge';
import type { BookDesignBeat } from './design-pacing';
import { choosePhotos, type BookDesignLeftOut } from './design-photos';
import { repairSpread } from './design-repair';
import { designGrid, designLook, paperBackground, type BookDesignLook } from './design-style';

/**
 * The assistant designs the whole photo book.
 *
 * Pure and deterministic for the same book, journey, directives and seed: the
 * server's `design_book` runs it and keeps the result as a draft until the
 * person approves it. `style: 'classic'` asking nothing the Auto layout cannot
 * do is the Studio's own Auto layout (`buildBook`) over the stored pages;
 * every other design composes the book from chapters, pacing, a page
 * grid, the photos' own palette and type, repairs every page against the
 * findings and answers what is left.
 */

export interface BookDesignInput extends AutoInput {
  /** The gallery's photos with their pixel signals, for the picker and the place chapters. */
  candidates: readonly PhotoPickCandidate[];
  /** The gallery as the book engine knows it: original sizes, palette, busy grid, salient point. */
  photos: readonly BookPhotoInfo[];
  /** Photos of the journey on no entry, shared out to the entries as the Studio does. */
  gallery?: readonly AutoPhoto[];
  distanceLabel?: string;
  prosLabel?: string;
  consLabel?: string;
}

export interface BookDesignResult {
  doc: BookDocument;
  plan: BookDesignPlanRow[];
  style: Pick<BookDesignLook, 'paper' | 'ink' | 'accent' | 'heading' | 'body'>;
  photos: { used: number[]; left_out: BookDesignLeftOut[] };
  /** What the repair passes could not fix, severe first. */
  findings: BookFinding[];
  /**
   * What the design changed or left out, said once each: the book-wide notes
   * first (the budget, the words and lists no page holds), then a story cut to
   * fit a page, so a reader keeping only the first few keeps what matters most.
   */
  notes: string[];
}

/** The entries the directives' scope names, in the order they came. */
function inScope(entries: readonly AutoEntry[], scope: BookDesignDirectives['scope']): AutoEntry[] {
  const ids = scope?.entryIds ? new Set(scope.entryIds) : null;
  return entries.filter((e) => {
    if (ids && !ids.has(e.id)) return false;
    if (scope?.from && (!e.date || e.date < scope.from)) return false;
    return !(scope?.to && (!e.date || e.date > scope.to));
  });
}

/** Entries in date order, the undated ones last as they came. */
function byDate(entries: readonly AutoEntry[]): AutoEntry[] {
  const dated = entries.filter((e) => e.date).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  return [...dated, ...entries.filter((e) => !e.date)];
}

/** A book with nothing on its pages yet: a new format may still be chosen for it. */
const isBlank = (doc: BookDocument | null) => !doc || doc.spreads.every((s) => !s.elements.length);

function pageFor(doc: BookDocument | null, input: BookDesignInput, directives: BookDesignDirectives): BookPageSetup {
  const base = doc?.page ?? input.page;
  if (!directives.preset || !isBlank(doc)) return base;
  return { ...bookPageSetupForPreset(directives.preset), pageNumbers: base.pageNumbers };
}

/**
 * Whether the classic style may run as the Studio's own Auto layout: only when
 * nothing is asked that `buildBook` cannot do. A page budget, a cover of the
 * person's, chapters by day or place, another density, caption, story or
 * travel choices go through the composer in the classic look, so no directive
 * is dropped without a word. Scope, keep, format and seed the Auto path honours.
 */
function classicOnly(d: BookDesignDirectives): boolean {
  if (d.style !== 'classic' || d.photos || d.palette || d.type) return false;
  if (d.pages || d.cover || d.text || d.travel) return false;
  return d.chapters === 'entry' && d.density === 'balanced';
}

/**
 * The designed pages within the spread cap: inner pages past `room` are left
 * off the end (the framing pages always stay), and the note says how many.
 */
function withinRoom(designed: readonly DesignedSpread[], room: number, notes: string[]): DesignedSpread[] {
  const inner = designed.filter((d) => d.spread.role === 'inner');
  const over = inner.length - Math.max(0, room);
  if (over <= 0) return [...designed];
  const cut = new Set(inner.slice(inner.length - over).map((d) => d.spread.id));
  notes.push(`the book holds ${MAX_SPREADS} spreads, so the last ${over} designed pages are left out`);
  return designed.filter((d) => !cut.has(d.spread.id));
}

/** Inner spreads the book has room for once the stored pages it keeps are counted. */
const roomFor = (doc: BookDocument | null, keep: BookDesignDirectives['keep']) =>
  MAX_SPREADS - 4 - (doc?.spreads ?? []).filter((s) => s.role === 'inner' && keepsStored(s, keep)).length;

/** The travel context the travel elements read: the journey's figures, route, entries and labels. */
function travelOf(input: BookDesignInput, entries: readonly AutoEntry[]): BookTravelContext {
  return {
    locale: input.locale,
    stats: input.stats,
    path: input.path ?? [],
    entries,
    labels: {
      day: input.dayLabel,
      stations: input.stationsLabel,
      summary: input.summaryLabel,
      countries: input.countriesLabel,
      distance: input.distanceLabel ?? '',
      pros: input.prosLabel ?? '',
      cons: input.consLabel ?? '',
    },
  };
}

/** The beat a page of the Auto layout plays, read from what it holds. */
function classicBeat(spread: BookSpread): BookDesignBeat {
  if (spread.role !== 'inner') return spread.role;
  if (spread.entryId != null) return 'opener';
  const has = (kind: BookSpread['elements'][number]['kind']) => spread.elements.some((e) => e.kind === kind);
  if (has('stats') && has('map')) return 'summary';
  if (spread.elements.some((e) => e.kind === 'countries' && e.codes.length > 1)) return 'countries';
  return 'stations';
}

function classicDesign(
  doc: BookDocument | null,
  input: BookDesignInput,
  directives: BookDesignDirectives,
  entries: AutoEntry[],
): BookDesignResult {
  const newId = input.newId ?? bookElementId;
  const placed = input.gallery ? distributeGallery(entries, input.gallery) : entries;
  const page = pageFor(doc, input, directives);
  const built = buildBook({ ...input, entries: placed, page, newId });
  const notes: string[] = [];
  // The Auto layout is not repaired (it is the Studio's own, page for page),
  // but every page is measured, so the plan and the findings say what it left.
  const all = built.spreads.map((spread): DesignedSpread => ({
    spread,
    beat: classicBeat(spread),
    chapter: entries.find((e) => e.id === spread.entryId)?.title ?? null,
    findings: pageFindings(spread, page, input.photos),
  }));
  const designed = withinRoom(all, roomFor(doc, directives.keep), notes);
  const merged = mergeDesign(doc, designed, directives.keep);
  const finalDoc: BookDocument = {
    ...built,
    spreads: merged.spreads,
    ...(doc?.layouts ? { layouts: doc.layouts } : {}),
  };
  const residual = designed.flatMap((d) => d.findings.filter((f) => f.severity !== 'info'));
  return {
    doc: finalDoc,
    plan: merged.plan,
    style: { paper: '#ffffff', ink: '#1a1a1a', accent: '#c2410c', heading: 'sans', body: 'sans' },
    photos: { used: [...new Set(merged.plan.flatMap((r) => (r.action === 'drop' ? [] : r.photoIds)))], left_out: [] },
    findings: sortBookFindings([...residual, ...bookLevelFindings(finalDoc)]),
    notes,
  };
}

/** The photo the cover takes: the one asked for, else the journey's cover, else the first photo the book uses. */
function coverPhoto(
  input: BookDesignInput,
  directives: BookDesignDirectives,
  used: readonly AutoPhoto[],
): AutoPhoto | null {
  const want = directives.photos?.coverPhotoId ?? input.coverPhotoId;
  const excluded = want != null && (directives.photos?.exclude ?? []).includes(want);
  const info = want == null || excluded ? undefined : input.photos.find((p) => p.photoId === want);
  if (info) return { photoId: info.photoId, width: info.width ?? null, height: info.height ?? null };
  return used[0] ?? null;
}

/**
 * Design the whole book. `doc` is the stored book (null for a journey with
 * none); the result is a complete document laid over it, page ids kept where
 * a designed page takes a stored one's place.
 */
export function designBook(
  doc: BookDocument | null,
  input: BookDesignInput,
  raw: BookDesignDirectivesInput,
): BookDesignResult {
  const directives = bookDesignDirectivesSchema.parse(raw);
  const entries = inScope(input.entries, directives.scope);
  if (classicOnly(directives)) return classicDesign(doc, input, directives, entries);

  const newId = input.newId ?? bookElementId;
  const page = pageFor(doc, input, directives);
  const ordered = byDate(entries);
  const placed = input.gallery ? distributeGallery(ordered, input.gallery) : ordered;
  const choice = choosePhotos(placed, input.candidates, directives, input.photos);
  const usedPhotos = [...choice.byEntry.values()].flat();
  const usedInfos = input.photos.filter((p) => usedPhotos.some((u) => u.photoId === p.photoId));
  const look = designLook(directives, page, usedInfos);
  const c: ComposeCtx = {
    look,
    page,
    grid: designGrid(page),
    newId,
    locale: input.locale,
    infos: new Map(input.photos.map((p) => [p.photoId, p])),
    travel: travelOf(input, placed),
    directives,
    notes: [],
  };
  const needs: FramingNeeds = { room: roomFor(doc, directives.keep), perStations: stationsPerSpread(c) };
  const inner = composeDesignedInner(c, placed, choice, input, needs);

  const words = {
    title: input.title,
    subtitle: input.subtitle,
    ownTitle: directives.cover?.title,
    ownSubtitle: directives.cover?.subtitle,
  };
  const cover = coverPhoto(input, directives, usedPhotos);
  const titlePage = directives.style === 'editorial' || directives.style === 'journal';
  const first = titlePage ? composeTitlePage(c, words, placed) : blank(c, 'first');
  const framing: DesignedSpread[] = [
    { spread: composeCover(c, words, cover), beat: 'cover', chapter: null, findings: [] },
    { spread: first, beat: 'first', chapter: null, findings: [] },
  ];
  const closing: DesignedSpread[] = [
    { spread: blank(c, 'last'), beat: 'last', chapter: null, findings: [] },
    { spread: composeBack(c, words, placed), beat: 'back', chapter: null, findings: [] },
  ];
  const repairCtx = { page, photos: input.photos, look, newId };
  const designed = [...framing, ...inner.spreads, ...closing].map((d): DesignedSpread => {
    const fixed = repairSpread(d.spread, repairCtx);
    return { ...d, spread: fixed.spread, findings: fixed.findings };
  });

  const merged = mergeDesign(doc, designed, directives.keep);
  const title = (directives.cover?.title ?? input.title).slice(0, MAX_BOOK_TITLE);
  const pageNumbers = { ...page.pageNumbers, font: look.body };
  const result: BookDocument = {
    version: 1,
    title,
    page: { ...page, pageNumbers: { ...pageNumbers, startAt: 1 } },
    spreads: merged.spreads,
    ...(doc?.layouts ? { layouts: doc.layouts } : {}),
  };
  const residual = designed.flatMap((d) => d.findings.filter((f) => f.severity !== 'info'));
  return {
    doc: result,
    plan: merged.plan,
    style: { paper: look.paper, ink: look.ink, accent: look.accent, heading: look.heading, body: look.body },
    photos: {
      used: [...new Set(merged.plan.flatMap((r) => (r.action === 'drop' ? [] : r.photoIds)))],
      left_out: [...choice.leftOut, ...inner.leftOut],
    },
    findings: sortBookFindings([...residual, ...bookLevelFindings(result)]),
    notes: [...new Set([...inner.notes, ...c.notes])],
  };
}

/** An empty single page of a role, on the book's paper. */
function blank(c: ComposeCtx, role: 'first' | 'last'): BookSpread {
  return { id: c.newId('sp'), role, background: paperBackground(c.look), elements: [], parked: [], entryId: null };
}
