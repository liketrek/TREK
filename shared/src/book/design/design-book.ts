import { buildBook, distributeGallery } from '../auto/auto-book';
import type { AutoEntry, AutoInput, AutoPhoto } from '../auto/auto-types';
import type { BookCoverArchetype } from '../book-archetypes';
import { briefFindings, type BookBriefArt } from '../book-findings-art';
import { bookLevelFindings, sortBookFindings } from '../book-findings-design';
import { withRealWeight } from '../book-fonts';
import { bookElementId } from '../book-ids';
import type { BookPhotoInfo } from '../book-ops-core';
import type { BookFinding } from '../book-ops.schema';
import { bookPageSetupForPreset } from '../book-pages';
import type { BookTravelContext } from '../book-travel';
import { MAX_BOOK_TITLE, type BookDocument, type BookPageSetup, type BookSpread } from '../book.schema';
import { pageFindings } from '../describe-spread';
import type { PhotoPickCandidate } from '../photo-pick';
import { isBookFontFamily, mutedOn, readableOn } from '../theme/book-theme';
import type { BookTheme } from '../theme/book-theme.schema';
import { designArt, livelyLook, type BookDesignSticker } from './design-art';
import type { ComposeCtx } from './design-compose';
import type { CoverMaterial } from './design-cover-kit';
import {
  bookDesignDirectivesSchema,
  type BookDesignDirectives,
  type BookDesignDirectivesInput,
} from './design-directives.schema';
import { composeBack, composeCover, composeTitlePage, stationsPerSpread } from './design-framing';
import { composeDesignedInner, type FramingNeeds } from './design-inner';
import { isLivelyBeat } from './design-lively-pacing';
import { mergeDesign, type BookDesignPlanRow, type DesignedSpread } from './design-merge';
import { applyPageOverrides } from './design-overrides';
import type { BookDesignBeat } from './design-pacing';
import {
  TEMPLATED_ENTRY_PHOTOS,
  choosePhotos,
  shareGalleryByDay,
  type BookDesignLeftOut,
  type DesignPhotoChoice,
} from './design-photos';
import { repairSpread } from './design-repair';
import { designGrid, designLook, paperBackground, type BookDesignLook } from './design-style';
import { archetypeOfTheme } from './design-template-pick';
import { composeTemplatedInner } from './design-templated';
import { composeTemplatedCover, composeTravelBack } from './design-templated-framing';
import { themeDesignedSpread, unlinkDrifted } from './design-theme';

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
 *
 * The art direction (design-brief.schema.ts) shapes it further: a cover
 * composed on its archetype (design-cover.ts), lively spreads and stickers
 * for a lively or loud book (design-lively-pacing.ts, design-stickers.ts),
 * single pages of the plan recomposed (design-overrides.ts), and the book
 * judged against its brief (book-findings-art.ts). A design asked for none of
 * it is composed exactly as before.
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
  /**
   * The sticker library's facts (`BOOK_STICKERS` of `@trek/shared/stickers`),
   * for the stickers a decorated design places; without it nothing is stuck on.
   */
  stickers?: readonly BookDesignSticker[];
  /**
   * The book's own theme, recoloured or not, for a book laid on the designed
   * templates (`layouts: 'templates'`): it is kept whole in place of the
   * style's preset. The composed pages ignore it.
   */
  theme?: BookTheme;
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
  /** The brief the book was designed against, so a page revised later is judged by it; none without a brief. */
  brief?: BookBriefArt;
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
  if (d.style !== 'classic' || d.photos || d.palette || d.type || d.brief) return false;
  if (d.layouts === 'templates') return false;
  if (d.pages || d.cover || d.text || d.travel) return false;
  return d.chapters === 'entry' && d.density === 'balanced';
}

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
  const merged = mergeDesign(doc, all, directives.keep);
  const finalDoc: BookDocument = {
    ...built,
    spreads: merged.spreads,
    ...(doc?.layouts ? { layouts: doc.layouts } : {}),
  };
  const residual = all.flatMap((d) => d.findings.filter((f) => f.severity !== 'info'));
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
  const directives = withBriefTheme(bookDesignDirectivesSchema.parse(raw));
  const entries = inScope(input.entries, directives.scope);
  if (classicOnly(directives)) return classicDesign(doc, input, directives, entries);
  if (directives.layouts === 'templates') return templatedDesign(doc, input, raw);

  const newId = input.newId ?? bookElementId;
  const page = pageFor(doc, input, directives);
  const ordered = byDate(entries);
  const placed = input.gallery ? distributeGallery(ordered, input.gallery) : ordered;
  const choice = choosePhotos(placed, input.candidates, directives, input.photos);
  const usedPhotos = [...choice.byEntry.values()].flat();
  const usedInfos = input.photos.filter((p) => usedPhotos.some((u) => u.photoId === p.photoId));
  const plain = designLook(directives, page, usedInfos);
  const art = designArt(directives, plain.theme, input.stickers);
  // A lively or loud book turns and frames its prints and sets its cover title larger.
  const look = livelyLook(plain, art, directives);
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
    art,
  };
  const needs: FramingNeeds = { perStations: stationsPerSpread(c) };
  const inner = composeDesignedInner(c, placed, choice, input, needs);

  const words = {
    title: input.title,
    subtitle: input.subtitle,
    ownTitle: directives.cover?.title,
    ownSubtitle: directives.cover?.subtitle,
  };
  const cover = coverPhoto(input, directives, usedPhotos);
  const titlePage = TITLE_PAGE_STYLES.has(directives.style);
  const first = titlePage ? composeTitlePage(c, words, placed) : blank(c, 'first');
  const framing: DesignedSpread[] = [
    {
      spread: composeCover(c, words, cover, coverMaterial(cover, usedPhotos, placed)),
      beat: 'cover',
      chapter: null,
      findings: [],
    },
    { spread: first, beat: 'first', chapter: null, findings: [] },
  ];
  const closing: DesignedSpread[] = [
    { spread: blank(c, 'last'), beat: 'last', chapter: null, findings: [] },
    { spread: composeBack(c, words, placed), beat: 'back', chapter: null, findings: [] },
  ];
  const repairCtx = { page, photos: input.photos, look, newId };
  const finish = (spread: BookSpread) => {
    const fixed = repairSpread(themeDesignedSpread(spread, look), repairCtx);
    // Every face at a weight its family has: a travel element's bold in a one-weight poster face would be faked.
    const weighted = { ...fixed.spread, elements: fixed.spread.elements.map(withRealWeight) };
    return { spread: unlinkDrifted(weighted, look.theme), findings: fixed.findings };
  };
  const designed = [...framing, ...inner.spreads, ...closing].map((d): DesignedSpread => ({
    ...d,
    ...finish(d.spread),
  }));

  const laid = mergeDesign(doc, designed, directives.keep);
  const title = (directives.cover?.title ?? input.title).slice(0, MAX_BOOK_TITLE);
  const pageNumbers = { ...page.pageNumbers, font: look.body };
  const built: BookDocument = {
    version: 1,
    title,
    page: { ...page, pageNumbers: { ...pageNumbers, startAt: 1 } },
    spreads: laid.spreads,
    ...(doc?.layouts ? { layouts: doc.layouts } : {}),
    theme: look.theme,
  };
  const overrides = directives.pages?.overrides ?? [];
  const env = { c, entries: placed, finish, ops: { photos: input.photos, newId } };
  const merged = overrides.length
    ? applyPageOverrides(built, laid.plan, overrides, env)
    : { doc: built, plan: laid.plan, notes: [] };
  const result = merged.doc;
  const residual = overrides.length
    ? redesignedFindings(result, merged.plan, input.photos)
    : designed.flatMap((d) => d.findings.filter((f) => f.severity !== 'info'));
  const judged = briefOf(c);
  const brief = judged ? briefFindings(result, judged, briefScope(merged.plan)) : [];
  return {
    doc: result,
    plan: merged.plan,
    style: { paper: look.paper, ink: look.ink, accent: look.accent, heading: look.heading, body: look.body },
    photos: {
      used: [...new Set(merged.plan.flatMap((r) => (r.action === 'drop' ? [] : r.photoIds)))],
      left_out: [...choice.leftOut, ...inner.leftOut],
    },
    findings: sortBookFindings([...residual, ...bookLevelFindings(result), ...brief]),
    notes: [...new Set([...inner.notes, ...c.notes, ...merged.notes])],
    ...(judged ? { brief: judged } : {}),
  };
}

/** The brief a design is judged against, when it was made with one. */
function briefOf(c: ComposeCtx): BookBriefArt | undefined {
  const art = c.art;
  if (!art?.briefed) return undefined;
  return { energy: art.energy, decoration: art.decoration, bare: art.bare, tilt: art.tilt };
}

/** The pages the plan kept as they were, and whether it made lively ones: what the brief's findings read of it. */
function briefScope(plan: readonly BookDesignPlanRow[]): { kept: string[]; lively: boolean } {
  const kept = plan.filter((r) => r.action === 'keep').map((r) => r.spreadId);
  return { kept, lively: plan.some((r) => r.action !== 'keep' && isLivelyBeat(r.beat)) };
}

/** What the repair left on the pages a design writes, measured afresh once pages were overridden. */
function redesignedFindings(
  doc: BookDocument,
  plan: readonly BookDesignPlanRow[],
  photos: BookDesignInput['photos'],
): BookFinding[] {
  const kept = new Set(plan.filter((r) => r.action === 'keep').map((r) => r.spreadId));
  return doc.spreads
    .filter((s) => !kept.has(s.id))
    .flatMap((s) => pageFindings(s, doc.page, photos).filter((f) => f.severity !== 'info'));
}

/**
 * The photos a composed cover may use: the cover photo first, then one from
 * each part of the book in turn, so a grid or a collage of the cover shows
 * the journey and not one afternoon of it.
 */
function coverMaterial(
  cover: AutoPhoto | null,
  used: readonly AutoPhoto[],
  entries: readonly AutoEntry[],
): CoverMaterial {
  const rest = used.filter((p) => p.photoId !== cover?.photoId);
  const picks = [0.2, 0.5, 0.8, 0.35, 0.65].map((at) => rest[Math.floor(at * rest.length)]);
  const spread = [...new Map(picks.flatMap((p) => (p ? [[p.photoId, p] as const] : []))).values()];
  return { photos: [...(cover ? [cover] : []), ...spread], entries };
}

/** The directives with the brief's theme as the style it takes the place of. */
function withBriefTheme(d: BookDesignDirectives): BookDesignDirectives {
  const theme = d.brief?.theme;
  return theme && theme !== d.style ? { ...d, style: theme } : d;
}

/** The styles that open the book on a title page: the quiet, bookish ones. */
const TITLE_PAGE_STYLES: ReadonlySet<string> = new Set(['editorial', 'journal', 'fabric-classic', 'minimal-serif']);

/** An empty single page of a role, on the book's paper. */
function blank(c: ComposeCtx, role: 'first' | 'last'): BookSpread {
  return { id: c.newId('sp'), role, background: paperBackground(c.look), elements: [], parked: [], entryId: null };
}

// ── the book laid on the designed templates ────────────────────────────────

/** The look with the book's own theme kept whole: its palette, its faces, its frames. */
function withOwnTheme(look: BookDesignLook, theme: BookTheme | undefined): BookDesignLook {
  if (!theme) return look;
  const paper = theme.palette.paper.toLowerCase();
  const ink = readableOn(paper, theme.palette.ink);
  const face = (f: string, fallback: BookDesignLook['heading']) => (isBookFontFamily(f) ? f : fallback);
  return {
    ...look,
    paper,
    ink,
    muted: mutedOn(paper, ink),
    accent: theme.palette.accent,
    heading: face(theme.fonts.heading.font, look.heading),
    body: face(theme.fonts.body.font, look.body),
    frameStyle: theme.frameStyle,
    tilt: theme.tilt,
    theme,
  };
}

/** The directives with each entry's photos held to what its pages on the templates take. */
const cappedPhotos = (d: BookDesignDirectives): BookDesignDirectives => ({
  ...d,
  photos: { pick: 'best', ...d.photos, perChapterMax: d.photos?.perChapterMax ?? TEMPLATED_ENTRY_PHOTOS },
});

/** The cover, the first page, the inner pages, the last page and the back of a templated book, in order. */
function templatedPages(
  c: ComposeCtx,
  input: BookDesignInput,
  parts: { placed: AutoEntry[]; usedPhotos: AutoPhoto[]; inner: DesignedSpread[]; archetype: BookCoverArchetype },
): DesignedSpread[] {
  const { directives } = c;
  const words = {
    title: input.title,
    subtitle: input.subtitle,
    ownTitle: directives.cover?.title,
    ownSubtitle: directives.cover?.subtitle,
  };
  const cover = coverPhoto(input, directives, parts.usedPhotos);
  const material = coverMaterial(cover, parts.usedPhotos, parts.placed);
  const front = directives.cover?.template
    ? { spread: composeCover(c, words, cover, material), template: null }
    : composeTemplatedCover(c, words, material, parts.archetype);
  const titlePage = TITLE_PAGE_STYLES.has(c.look.theme.id ?? directives.style);
  const first = titlePage ? composeTitlePage(c, words, parts.placed) : blank(c, 'first');
  const page = (spread: BookSpread, beat: BookDesignBeat): DesignedSpread => ({
    spread,
    beat,
    chapter: null,
    findings: [],
  });
  return [
    { ...page(front.spread, 'cover'), ...(front.template ? { template: front.template } : {}) },
    page(first, 'first'),
    ...parts.inner,
    page(blank(c, 'last'), 'last'),
    page(composeTravelBack(c, words, parts.placed), 'back'),
  ];
}

/**
 * The book laid on the Studio's designed templates (`layouts: 'templates'`):
 * the cover on a cover template of the theme's archetype, every chapter on
 * its spreads, the summary, the countries and the back cover in the newer
 * travel looks. The rest is the composer's: the scope, the photo picker, the
 * page budget, the stored pages kept, the repair and the findings.
 */
/** What a book on the designed templates is laid with: its context, archetype, entries and photos. */
export interface TemplatedSetting {
  c: ComposeCtx;
  archetype: BookCoverArchetype;
  /** The book counts as calm for template choice. */
  calm: boolean;
  /** The entries in date order, the gallery shared out to them. */
  placed: AutoEntry[];
  /** Loose photos no entry had room for. */
  rest: AutoPhoto[];
  choice: DesignPhotoChoice;
  /** A page finished as the design finishes it: a templated one repaired, a composed one linked to the theme too. */
  finish: (spread: BookSpread, templated?: boolean) => { spread: BookSpread; findings: BookFinding[] };
}

/**
 * The setting of a book laid on the designed templates, read from the
 * stored book, the journey and the directives: what the whole book is laid
 * with, and what laying one of its pages again needs.
 */
export function templatedSetting(
  doc: BookDocument | null,
  input: BookDesignInput,
  raw: BookDesignDirectivesInput,
): TemplatedSetting {
  const directives = withBriefTheme(bookDesignDirectivesSchema.parse(raw));
  const entries = inScope(input.entries, directives.scope);
  const newId = input.newId ?? bookElementId;
  const page = pageFor(doc, input, directives);
  const shared = shareGalleryByDay(byDate(entries), input.gallery ?? [], input.candidates);
  const placed = shared.entries;
  const choice = choosePhotos(placed, input.candidates, cappedPhotos(directives), input.photos);
  const usedPhotos = [...choice.byEntry.values()].flat();
  const usedInfos = input.photos.filter((p) => usedPhotos.some((u) => u.photoId === p.photoId));
  const plain = withOwnTheme(designLook(directives, page, usedInfos), input.theme);
  const art = designArt(directives, plain.theme, input.stickers);
  const look = livelyLook(plain, art, directives);
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
    art,
  };
  const archetype = directives.cover?.archetype ?? archetypeOfTheme(look.theme);
  // A rich theme designed without a brief is lively for its templates, so a poster book gets its loud pages at all.
  const calm = art.energy === 'calm' && !(look.theme.decoration === 'rich' && !art.briefed);
  const repairCtx = { page, photos: input.photos, look, newId };
  // A templated page has its colours linked to the theme by its template, so it is repaired, not relinked.
  const finish = (spread: BookSpread, templated = false) => {
    const fixed = repairSpread(templated ? spread : themeDesignedSpread(spread, look), repairCtx);
    const weighted = { ...fixed.spread, elements: fixed.spread.elements.map(withRealWeight) };
    return { spread: templated ? weighted : unlinkDrifted(weighted, look.theme), findings: fixed.findings };
  };
  return { c, archetype, calm, placed, rest: shared.rest, choice, finish };
}

/**
 * The book laid on the Studio's designed templates (`layouts: 'templates'`):
 * the cover on a cover template of the theme's archetype, every chapter on
 * its spreads, the summary, the countries and the back cover in the newer
 * travel looks. The rest is the composer's: the scope, the photo picker, the
 * page budget, the stored pages kept, the repair and the findings.
 */
function templatedDesign(
  doc: BookDocument | null,
  input: BookDesignInput,
  raw: BookDesignDirectivesInput,
): BookDesignResult {
  const { c, archetype, calm, placed, rest, choice, finish } = templatedSetting(doc, input, raw);
  const inner = composeTemplatedInner(c, placed, choice, input, { archetype, calm, rest });
  const usedPhotos = [...choice.byEntry.values()].flat();
  const designed = templatedPages(c, input, { placed, usedPhotos, inner: inner.spreads, archetype });
  const done = designed.map((d): DesignedSpread => ({ ...d, ...finish(d.spread, !!d.template) }));
  const leftOut = [...choice.leftOut, ...inner.leftOut];
  return templatedResult(doc, input, { c, done, finish, placed, leftOut, notes: inner.notes });
}

interface TemplatedParts {
  c: ComposeCtx;
  done: DesignedSpread[];
  finish: (spread: BookSpread) => { spread: BookSpread; findings: BookFinding[] };
  placed: AutoEntry[];
  leftOut: BookDesignLeftOut[];
  notes: string[];
}

/** The templated pages over the stored book, the overrides laid on them, and what is left to say. */
function templatedResult(doc: BookDocument | null, input: BookDesignInput, parts: TemplatedParts): BookDesignResult {
  const { c, finish, placed, notes } = parts;
  const { look, directives, page } = c;
  const laid = mergeDesign(doc, parts.done, directives.keep);
  const built: BookDocument = {
    version: 1,
    title: (directives.cover?.title ?? input.title).slice(0, MAX_BOOK_TITLE),
    page: { ...page, pageNumbers: { ...page.pageNumbers, font: look.body, startAt: 1 } },
    spreads: laid.spreads,
    ...(doc?.layouts ? { layouts: doc.layouts } : {}),
    theme: look.theme,
  };
  const overrides = directives.pages?.overrides ?? [];
  const env = { c, entries: placed, finish, ops: { photos: input.photos, newId: c.newId } };
  const merged = overrides.length
    ? applyPageOverrides(built, laid.plan, overrides, env)
    : { doc: built, plan: laid.plan, notes: [] };
  const residual = overrides.length
    ? redesignedFindings(merged.doc, merged.plan, input.photos)
    : parts.done.flatMap((d) => d.findings.filter((f) => f.severity !== 'info'));
  const judged = briefOf(c);
  const brief = judged ? briefFindings(merged.doc, judged, briefScope(merged.plan)) : [];
  const used = [...new Set(merged.plan.flatMap((r) => (r.action === 'drop' ? [] : r.photoIds)))];
  return {
    doc: merged.doc,
    plan: merged.plan,
    style: { paper: look.paper, ink: look.ink, accent: look.accent, heading: look.heading, body: look.body },
    photos: { used, left_out: parts.leftOut },
    findings: sortBookFindings([...residual, ...bookLevelFindings(merged.doc), ...brief]),
    notes: [...new Set([...notes, ...c.notes, ...merged.notes])],
    ...(judged ? { brief: judged } : {}),
  };
}
