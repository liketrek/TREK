import type { AutoEntry } from '../auto/auto-types';
import { bookEntryListItems } from '../book-travel';
import type { BookElement, BookSpread } from '../book.schema';
import type { BookDesignInput } from './design-book';
import type { ComposeCtx } from './design-compose';
import { composeCountries, composeStations, composeSummary } from './design-framing';
import type { DesignedSpread } from './design-merge';
import {
  buildChapters,
  fitChapters,
  naturalSpreads,
  newRhythm,
  planChapter,
  settleRhythm,
  shareSpreads,
  type DesignChapter,
  type PlannedSpread,
} from './design-pacing';
import type { BookDesignLeftOut, DesignPhotoChoice } from './design-photos';
import {
  composeDuo,
  composeGrid,
  composeHero,
  composeOpener,
  composePano,
  composeQuiet,
  composeTrio,
  innerSpread,
  panoFits,
  tripOf,
  type Composed,
  type FlowItem,
  type Words,
} from './design-spreads';

/**
 * The inner pages of a designed book: the journey at a glance and its
 * countries, the chapters paced to the page budget, the closing totals.
 */

export interface FramingNeeds {
  /** Inner spreads the book has room for, the kept stored pages taken off. */
  room: number;
  /** Bare stops one stations spread holds. */
  perStations: number;
}

interface InnerResult {
  spreads: DesignedSpread[];
  leftOut: BookDesignLeftOut[];
  notes: string[];
}

type FramingKind = 'summary' | 'countries' | 'closing';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The inner framing pages the journey has something for: the summary, the countries, the closing totals. */
function framingInner(c: ComposeCtx): FramingKind[] {
  const stats = c.travel.stats;
  const travel = c.directives.travel;
  const out: FramingKind[] = [];
  if (!stats) return out;
  if ((travel?.summary ?? true) && stats.points.length >= 2) out.push('summary');
  if ((travel?.countries ?? true) && stats.countries.length >= 2) out.push('countries');
  const closes = c.directives.style === 'editorial' || c.directives.style === 'bold';
  if (closes && stats.points.length >= 2) out.push('closing');
  return out;
}

/** The most inner spreads the design may make: `pages.max`, and never past the room the book has. */
const innerCap = (c: ComposeCtx, needs: FramingNeeds) =>
  Math.max(0, Math.min(c.directives.pages?.max ?? needs.room, needs.room));

/**
 * The framing pages that fit beside at least one chapter spread: past the cap
 * the closing totals go first, then the countries, then the summary.
 */
function fittingFraming(all: readonly FramingKind[], cap: number): FramingKind[] {
  let out = [...all];
  for (const drop of ['closing', 'countries', 'summary'] as const) {
    if (out.length + 1 <= cap) break;
    out = out.filter((k) => k !== drop);
  }
  return out;
}

/** Spreads for the chapters, within the page budget the directives set (framing pages count as pages). */
function chapterBudget(c: ComposeCtx, natural: number, framing: number, cap: number): number {
  const lo = Math.min(c.directives.pages?.min ?? 1, cap);
  return Math.max(1, clamp(natural + framing, lo, Math.max(lo, cap)) - framing);
}

/**
 * The chapter pages within the cap. Stations pages take what their stops need
 * and a chapter may round up, so the end is cut here; the photos of a page cut
 * are said to be left out for the budget.
 */
function withinCap(body: DesignedSpread[], room: number, leftOut: BookDesignLeftOut[], notes: string[]) {
  const keep = Math.max(0, room);
  if (body.length <= keep) return body;
  const cut = body.slice(keep);
  for (const d of cut) {
    for (const e of d.spread.elements) {
      if (e.kind === 'photo' && e.photoId != null) leftOut.push({ photoId: e.photoId, reason: 'page_budget' });
    }
  }
  notes.push(`${cut.length} pages past the page budget are left out`);
  return body.slice(0, keep);
}

function framingElements(c: ComposeCtx, kind: FramingKind, input: BookDesignInput): BookElement[] {
  const stats = c.travel.stats;
  if (kind === 'countries') return composeCountries(c, input.countriesLabel);
  if (!stats) return [];
  return composeSummary(c, stats, input.summaryLabel, kind === 'summary' ? 'left' : 'right');
}

function framingSpread(c: ComposeCtx, kind: FramingKind, input: BookDesignInput): DesignedSpread {
  return { spread: innerSpread(c, framingElements(c, kind, input), null), beat: kind, chapter: null, findings: [] };
}

/** The pages of a list of bare stops: as many stations spreads as the stops need. */
function stationsSpreads(c: ComposeCtx, chapter: DesignChapter, input: BookDesignInput): DesignedSpread[] {
  const out: DesignedSpread[] = [];
  let rest = chapter.entries;
  while (rest.length) {
    const set = composeStations(c, rest, input.stationsLabel);
    if (!set.placed) break;
    out.push({ spread: innerSpread(c, set.elements, null), beat: 'stations', chapter: null, findings: [] });
    rest = rest.slice(set.placed);
  }
  return out;
}

const chapterName = (chapter: DesignChapter) => chapter.label ?? chapter.entries[0]?.title ?? null;

/**
 * What a chapter has to say, in reading order: its first entry's story (the
 * chapter's title block is that entry's), that entry's pros and cons, then
 * the story of every further entry (the other entries of a day, or of the
 * chapters the budget combined), each under a small heading of its title.
 * With no stories asked for, only the pros and cons. An entry a chapter
 * before has `told` (a place may name one entry for two chapters) says
 * nothing again.
 */
function chapterWords(c: ComposeCtx, chapter: DesignChapter, told: ReadonlySet<number>): FlowItem[] {
  const stories = (c.directives.text?.story ?? 'full') !== 'none';
  return chapter.entries.flatMap((entry, i): FlowItem[] => {
    if (told.has(entry.id)) return [];
    const words = stories ? (entry.story ?? '').trim() : '';
    const story: FlowItem[] = words ? [{ kind: 'story', entry, words, begun: false, headed: i > 0 }] : [];
    const list: FlowItem[] = i === 0 && bookEntryListItems(entry).length ? [{ kind: 'list', entry }] : [];
    return [...story, ...list];
  });
}

/**
 * One planned spread, composed. The pages that take words (the opener, the
 * panorama, a quiet page) set what they can of the chapter's `words` and hand
 * back the rest; a hero and the photo spreads take none, so the words wait
 * for the next page that does.
 */
function composePlanned(c: ComposeCtx, plan: PlannedSpread, hand: 'left' | 'right', words: Words): Composed {
  const entry = plan.entry;
  const entryId = plan.chapter.entries[0]?.id ?? null;
  const [first, ...more] = plan.photos;
  switch (plan.beat) {
    case 'hero':
      if (entry && first) return composeHero(c, entry, first, hand);
      break;
    case 'pano':
      if (entry && first && panoFits(c, first)) return composePano(c, entry, first, more, hand, words);
      break;
    case 'quiet':
      return composeQuiet(c, words, first ?? null, hand, entryId);
    case 'duo':
      return composeDuo(c, plan.photos, hand, entryId);
    case 'trio':
      return composeTrio(c, plan.photos, hand, entryId);
    case 'grid':
      return composeGrid(c, plan.photos, hand, entryId);
    default:
      break;
  }
  if (entry) return composeOpener(c, entry, first ?? null, hand, words);
  return composeGrid(c, plan.photos, hand, entryId);
}

/** The entries whose stories a page sets to the end: those in its `flow` that the words it hands on, `rest`, lack. */
function endedOn(flow: readonly FlowItem[], rest: readonly FlowItem[]): number[] {
  const open = new Set(rest.flatMap((w) => (w.kind === 'story' ? [w.entry.id] : [])));
  return flow.flatMap((w) => (w.kind === 'story' && !open.has(w.entry.id) ? [w.entry.id] : []));
}

/**
 * A chapter's spreads, composed from its plan, the photo page alternating
 * across the book, its words flowing from page to page as far as the pages
 * that take words hold them (none of an entry a chapter before has `told`);
 * and, by entry id, the page the last of each story is set on.
 */
function chapterSpreads(
  c: ComposeCtx,
  chapter: DesignChapter,
  plans: readonly PlannedSpread[],
  start: number,
  told: ReadonlySet<number>,
) {
  const spreads: DesignedSpread[] = [];
  const ends = new Map<number, string>();
  const entryId = chapter.entries[0]?.id ?? null;
  let flow = chapterWords(c, chapter, told);
  plans.forEach((plan, i) => {
    // A quiet page with no story left to set and no photo would be an empty spread, or one holding only a list:
    // it is left out (the planner gives the quiet page of an entry with pros and cons a photo for them).
    if (plan.beat === 'quiet' && !plan.photos.length && !flow.some((w) => w.kind === 'story')) return;
    const hand = (start + i + (c.directives.seed ?? 0)) % 2 === 0 ? 'left' : 'right';
    // Every quiet page takes words, one photo's too, so a list with no room where it falls can wait for one.
    const later = plans.slice(i + 1).some((p) => p.beat === 'quiet');
    const done = composePlanned(c, plan, hand, { flow, later });
    const spread: BookSpread = innerSpread(c, done.elements, entryId);
    const rest = done.rest ?? flow;
    for (const id of endedOn(flow, rest)) ends.set(id, spread.id);
    flow = rest;
    spreads.push({ spread, beat: plan.beat, chapter: chapterName(chapter), findings: [] });
  });
  return { spreads, ends };
}

/** "entry 3", or "entries 3, 4 and 6", in a note. */
function entriesNamed(ids: readonly number[]): string {
  if (ids.length < 2) return `entry ${ids.join('')}`;
  return `entries ${ids.slice(0, -1).join(', ')} and ${ids.slice(-1).join('')}`;
}

/** The entry whose story a page element sets, as a list of one; empty for any other element. */
function storyOn(e: BookElement): number[] {
  const id = e.kind === 'text' && e.binding?.source === 'entry.story' ? e.binding.entryId : undefined;
  return id === undefined ? [] : [id];
}

/**
 * The stories the pages could not hold, said in the notes as the pros and
 * cons are: those a page holds only a part of, and those no page holds (the
 * chapter's pages full, or past the budget). `ends` holds, by entry id, the
 * page the last of each story was set on.
 */
function storiesUnsaid(
  c: ComposeCtx,
  entries: readonly AutoEntry[],
  body: readonly DesignedSpread[],
  ends: ReadonlyMap<number, string>,
): string[] {
  if ((c.directives.text?.story ?? 'full') === 'none') return [];
  const kept = new Set(body.map((d) => d.spread.id));
  const begun = new Set(body.flatMap((d) => d.spread.elements.flatMap(storyOn)));
  const short = entries.filter((e) => (e.story ?? '').trim() && !kept.has(ends.get(e.id) ?? ''));
  const none = short.filter((e) => !begun.has(e.id)).map((e) => e.id);
  const part = short.filter((e) => begun.has(e.id)).map((e) => e.id);
  const out: string[] = [];
  if (none.length === 1) out.push(`the story of ${entriesNamed(none)} found no room on its pages and is left out`);
  if (none.length > 1) out.push(`the stories of ${entriesNamed(none)} found no room on their pages and are left out`);
  if (part.length) {
    const what = part.length === 1 ? 'story' : 'stories';
    const their = part.length === 1 ? 'its' : 'their';
    out.push(`part of the ${what} of ${entriesNamed(part)} found no room on ${their} pages and is left out`);
  }
  return out;
}

/**
 * What the pages leave out of the entries, said in the notes: the pros and
 * cons that found no page (an entry among the stations, one after the first
 * of its day's chapter, one whose pages had no room or fell past the budget),
 * and with chapter maps asked for, the chapters that have none because their
 * entry is on no trip.
 */
function leftUnsaid(c: ComposeCtx, entries: readonly AutoEntry[], body: readonly DesignedSpread[]): string[] {
  const out: string[] = [];
  const listed = new Set(
    body.flatMap((d) => (d.spread.elements.some((e) => e.kind === 'list') ? [d.spread.entryId] : [])),
  );
  const unlisted = entries.filter((e) => bookEntryListItems(e).length > 0 && !listed.has(e.id)).map((e) => e.id);
  if (unlisted.length) {
    const their = unlisted.length === 1 ? 'its' : 'their';
    out.push(`the pros and cons of ${entriesNamed(unlisted)} found no room on ${their} pages and are left out`);
  }
  const stats = c.travel.stats;
  if (!c.directives.travel?.chapterMaps || !stats) return out;
  const told = new Set(body.map((d) => d.spread.entryId));
  const mapless = entries.filter((e) => told.has(e.id) && tripOf(stats, e) === null).map((e) => e.id);
  if (mapless.length) {
    const said = mapless.length === 1 ? 'is on no trip, so its chapter has' : 'are on no trip, so their chapters have';
    out.push(`${entriesNamed(mapless)} ${said} no map`);
  }
  return out;
}

/** Every inner page of the designed book, in order. */
export function composeDesignedInner(
  c: ComposeCtx,
  entries: readonly AutoEntry[],
  choice: DesignPhotoChoice,
  input: BookDesignInput,
  needs: FramingNeeds,
): InnerResult {
  const notes: string[] = [];
  const leftOut: BookDesignLeftOut[] = [];
  const cap = innerCap(c, needs);
  const wanted = framingInner(c);
  const framing = fittingFraming(wanted, cap);
  if (framing.length < wanted.length) {
    notes.push(`the page budget leaves no room for: ${wanted.slice(framing.length).join(', ')}`);
  }
  const naturalOf = (ch: DesignChapter) => naturalSpreads(ch, c.directives, needs.perStations);
  let chapters = buildChapters(entries, choice.byEntry, c.directives, input.candidates);
  const natural = chapters.map(naturalOf).reduce((a, b) => a + b, 0);
  const budget = chapterBudget(c, natural, framing.length, cap);
  if (budget < chapters.length) {
    notes.push(`${chapters.length} chapters share ${budget} spreads, so neighbouring chapters are combined`);
    chapters = fitChapters(chapters, budget);
  }
  const shares = shareSpreads(chapters, chapters.map(naturalOf), budget);
  const rhythm = newRhythm();
  const plan = { directives: c.directives, page: c.page, infos: c.infos };
  const body: DesignedSpread[] = [];
  // By entry id, the page its story is set to the end on.
  const ends = new Map<number, string>();
  // The entries a chapter has told: a place may name one entry for two chapters, and its words go in the first.
  const told = new Set<number>();
  chapters.forEach((chapter, i) => {
    if (chapter.stations) {
      body.push(...stationsSpreads(c, chapter, input));
      return;
    }
    const from = rhythm.beats.length;
    const plans = planChapter(chapter, shares[i] ?? 1, rhythm, plan, leftOut);
    const made = chapterSpreads(c, chapter, plans, body.length, told);
    settleRhythm(
      rhythm,
      from,
      made.spreads.map((d) => d.beat),
    );
    body.push(...made.spreads);
    for (const [id, at] of made.ends) ends.set(id, at);
    for (const entry of chapter.entries) told.add(entry.id);
  });
  const head = framing.filter((k) => k !== 'closing').map((k) => framingSpread(c, k, input));
  const tail = framing.filter((k) => k === 'closing').map((k) => framingSpread(c, k, input));
  const fitted = withinCap(body, cap - head.length - tail.length, leftOut, notes);
  notes.push(...storiesUnsaid(c, entries, fitted, ends), ...leftUnsaid(c, entries, fitted));
  return { spreads: [...head, ...fitted, ...tail], leftOut, notes };
}
