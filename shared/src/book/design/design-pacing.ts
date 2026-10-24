import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import type { BookPhotoInfo } from '../book-ops-core';
import { bookEntryListItems } from '../book-travel';
import type { BookPageSetup } from '../book.schema';
import { pickBookPhotos, type PhotoPickCandidate } from '../photo-pick';
import { BOOK_DESIGN_LIVELY_BEATS } from './design-brief.schema';
import type { BookDesignDirectives } from './design-directives.schema';
import { burstOf, heroWorthy, isPanorama, pickEntriesOf, type BookDesignLeftOut } from './design-photos';

/**
 * The story of the book before its pages: which chapters, how many spreads
 * each gets, and the beat of every spread (opener or hero, quiet pages for
 * words that run long, two, three or a grid of photos, a burst as one grid, a
 * panorama), paced so the book breathes: never one photo beat three times
 * running, a loud spread followed by a calm one, at most one hero in four
 * spreads. A lively or loud book makes some of them lively afterwards
 * (design-lively-pacing.ts).
 */

export const BOOK_DESIGN_BEATS = [
  'cover',
  'first',
  'summary',
  'countries',
  'opener',
  'hero',
  'story',
  'quiet',
  'grid',
  'duo',
  'trio',
  'pano',
  'map',
  'stations',
  'closing',
  'last',
  'back',
  ...BOOK_DESIGN_LIVELY_BEATS,
] as const;
export type BookDesignBeat = (typeof BOOK_DESIGN_BEATS)[number];

export interface DesignChapter {
  key: string;
  /** The place or day a chapter is of, when it is not one entry's. */
  label: string | null;
  /** The entries it tells, the first one opening it. */
  entries: AutoEntry[];
  photos: AutoPhoto[];
  /** Runs of bare stops, set as a list. */
  stations: boolean;
  /** The photos of its burst (four or more within fifteen minutes), set as one grid; empty when it has none. */
  burst: number[];
}

export interface PlannedSpread {
  beat: BookDesignBeat;
  chapter: DesignChapter;
  /**
   * The chapter's first entry, on its opening spread and on the pages planned
   * for its words; null on a photo spread. A quiet spread of one photo still
   * sets the chapter's words that wait for a page, as every quiet page does.
   */
  entry: AutoEntry | null;
  photos: AutoPhoto[];
}

const storyChars = (entries: readonly AutoEntry[]) => entries.reduce((n, e) => n + (e.story ?? '').trim().length, 0);

function entryChapter(entry: AutoEntry, photos: AutoPhoto[], pool: readonly PhotoPickCandidate[]): DesignChapter {
  const burst = burstOf(photos, pool);
  return { key: `e${entry.id}`, label: null, entries: [entry], photos, stations: false, burst };
}

/** A run of bare stops, set as a list. */
const stationsChapter = (run: AutoEntry[]): DesignChapter => ({
  key: `s${run[0]?.id ?? 0}`,
  label: null,
  entries: run,
  photos: [],
  stations: true,
  burst: [],
});

/** Entries with substance each open a chapter; runs of bare ones become a list of stations. */
function byEntry(
  entries: readonly AutoEntry[],
  photosOf: (e: AutoEntry) => AutoPhoto[],
  candidates: readonly PhotoPickCandidate[],
): DesignChapter[] {
  const out: DesignChapter[] = [];
  let run: AutoEntry[] = [];
  const flush = () => {
    if (run.length) out.push(stationsChapter(run));
    run = [];
  };
  for (const entry of entries) {
    const photos = photosOf(entry);
    if (!photos.length && !(entry.story ?? '').trim()) {
      run.push(entry);
      continue;
    }
    flush();
    out.push(entryChapter(entry, photos, candidates));
  }
  flush();
  return out;
}

/** The entries of one date merged into a chapter, in date order. */
function byDay(
  entries: readonly AutoEntry[],
  photosOf: (e: AutoEntry) => AutoPhoto[],
  candidates: readonly PhotoPickCandidate[],
): DesignChapter[] {
  const days = new Map<string, AutoEntry[]>();
  for (const entry of entries) {
    const key = entry.date ?? `undated-${entry.id}`;
    days.set(key, [...(days.get(key) ?? []), entry]);
  }
  return [...days].map(([day, list]): DesignChapter => {
    const photos = list.flatMap(photosOf);
    const substance = photos.length > 0 || storyChars(list) > 0;
    return {
      key: `d${day}`,
      label: day,
      entries: list,
      photos,
      stations: !substance,
      burst: burstOf(photos, candidates),
    };
  });
}

/**
 * Chapters by place: the photo picker's groups (photos within 250 m of each
 * other), each labelled by its nearest entry. Entries with words and no
 * photos of their own keep a chapter of their own, in date order.
 */
function byPlace(
  entries: readonly AutoEntry[],
  photosOf: (e: AutoEntry) => AutoPhoto[],
  candidates: readonly PhotoPickCandidate[],
): DesignChapter[] {
  const all = new Map(entries.flatMap(photosOf).map((p) => [p.photoId, p]));
  const result = pickBookPhotos(candidates, pickEntriesOf(entries, candidates), { limit: 60 });
  const out: { day: string; chapter: DesignChapter }[] = [];
  const placed = new Set<number>();
  for (const group of result.groups) {
    const photos = group.picks.flatMap((p) => all.get(p.photoId) ?? []).filter((p) => !placed.has(p.photoId));
    if (!photos.length) continue;
    photos.forEach((p) => placed.add(p.photoId));
    const entry = entries.find((e) => e.id === group.entryId);
    const chapter = {
      key: `p${out.length}`,
      label: group.place,
      entries: entry ? [entry] : [],
      photos,
      stations: false,
      burst: burstOf(photos, candidates),
    };
    out.push({ day: group.day, chapter });
  }
  for (const entry of entries) {
    const rest = photosOf(entry).filter((p) => !placed.has(p.photoId));
    rest.forEach((p) => placed.add(p.photoId));
    const told = out.some((o) => o.chapter.entries.includes(entry));
    if (told && !rest.length) continue;
    if (!rest.length && !(entry.story ?? '').trim()) continue;
    out.push({ day: entry.date ?? '9999', chapter: entryChapter(entry, rest, candidates) });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day)).map((o) => o.chapter);
}

/** The book's chapters, as the directives ask. */
export function buildChapters(
  entries: readonly AutoEntry[],
  byEntryPhotos: ReadonlyMap<number, AutoPhoto[]>,
  directives: BookDesignDirectives,
  candidates: readonly PhotoPickCandidate[],
): DesignChapter[] {
  const photosOf = (e: AutoEntry) => byEntryPhotos.get(e.id) ?? [];
  if (directives.chapters === 'day') return byDay(entries, photosOf, candidates);
  if (directives.chapters === 'place' && candidates.length) return byPlace(entries, photosOf, candidates);
  return byEntry(entries, photosOf, candidates);
}

/** Photos per spread the density aims at, and the most a spread takes. */
const DENSITY = { airy: { aim: 1.5, max: 2 }, balanced: { aim: 3, max: 4 }, rich: { aim: 5, max: 6 } } as const;

/** Characters an opener's text page holds before the story needs a page of its own. */
const OPENER_STORY_CHARS = 1400;

/**
 * Characters a page for words holds at the least: a narrow column beside a
 * photo. Without one its column runs on across both pages and holds twice as
 * many.
 */
const QUIET_STORY_CHARS = 1400;

/** The room, in characters of a story, the small heading over a later entry's story takes. */
const HEADING_CHARS = 250;

/** The room, in characters of a story, a row of pros and cons takes. */
const LIST_ROW_CHARS = 200;

/**
 * The room a chapter's words take, in characters of a story: every entry's
 * story (its excerpt when excerpts are asked for), a small heading over each
 * after the first, and its first entry's pros and cons, a row each and one
 * for their labels. None when the chapter tells no story: a list alone never
 * asks for a page of its own.
 */
function wordsRoom(chapter: DesignChapter, directives: BookDesignDirectives): number {
  const mode = directives.text?.story ?? 'full';
  if (mode === 'none') return 0;
  const most = mode === 'excerpt' ? (directives.text?.excerptChars ?? 600) : Infinity;
  const told = chapter.entries.map((e) => Math.min(most, (e.story ?? '').trim().length));
  const stories = told.reduce((n, chars, i) => n + chars + (chars > 0 && i > 0 ? HEADING_CHARS : 0), 0);
  if (stories === 0) return 0;
  const items = chapter.entries.slice(0, 1).flatMap((e) => bookEntryListItems(e));
  const pros = items.filter((item) => item.tone === 'pro').length;
  return stories + (items.length ? LIST_ROW_CHARS * (Math.max(pros, items.length - pros) + 1) : 0);
}

/** The spreads a chapter wants with nothing holding it back: its opening, its photo spreads, its pages for words. */
export function naturalSpreads(chapter: DesignChapter, directives: BookDesignDirectives, perStations: number): number {
  if (chapter.stations) return Math.max(1, Math.ceil(chapter.entries.length / perStations));
  const aim = DENSITY[directives.density].aim;
  const rest = Math.max(0, chapter.photos.length - 1);
  const words = Math.ceil(Math.max(0, wordsRoom(chapter, directives) - OPENER_STORY_CHARS) / QUIET_STORY_CHARS);
  return 1 + Math.ceil(rest / aim) + words;
}

/** The most spreads a chapter can fill: one photo each and a quiet page for its words, or what its words want. */
function fullest(chapter: DesignChapter, natural: number): number {
  return chapter.stations ? 1 : Math.max(natural, 1 + Math.max(0, chapter.photos.length - 1) + 1);
}

/**
 * Spreads per chapter for a total, by largest remainder on the chapters'
 * weight (photos and words), every chapter at least one, none more than it
 * can fill.
 */
export function shareSpreads(chapters: readonly DesignChapter[], natural: readonly number[], total: number): number[] {
  const want = natural.reduce((a, b) => a + b, 0);
  if (total === want) return [...natural];
  const weight = chapters.map((c) => c.photos.length + storyChars(c.entries) / 600 + 1);
  const sum = weight.reduce((a, b) => a + b, 0) || 1;
  const floor = chapters.map(() => 1);
  const room = Math.max(0, total - chapters.length);
  const raw = weight.map((w) => (room * w) / sum);
  const most = chapters.map((chapter, i) => fullest(chapter, natural[i] as number));
  const out = raw.map((r, i) => Math.min((floor[i] ?? 1) + Math.floor(r), most[i] as number));
  const order = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  let left = total - out.reduce((a, b) => a + b, 0);
  for (let pass = 0; left > 0 && pass < 4; pass++) {
    for (const { i } of order) {
      if (left <= 0) break;
      if ((out[i] ?? 0) >= (most[i] as number)) continue;
      out[i] = (out[i] ?? 0) + 1;
      left--;
    }
  }
  return out;
}

/** Merge the two smallest neighbouring chapters until the book has no more chapters than spreads. */
export function fitChapters(chapters: readonly DesignChapter[], total: number): DesignChapter[] {
  const list = [...chapters];
  while (list.length > Math.max(1, total)) {
    let best = 0;
    let bestSize = Infinity;
    for (let i = 0; i + 1 < list.length; i++) {
      const a = list[i] as DesignChapter;
      const b = list[i + 1] as DesignChapter;
      const size = a.photos.length + b.photos.length + a.entries.length + b.entries.length;
      if (size < bestSize) {
        best = i;
        bestSize = size;
      }
    }
    const a = list[best] as DesignChapter;
    const b = list[best + 1] as DesignChapter;
    const merged = {
      key: `${a.key}+${b.key}`,
      label: a.label,
      entries: [...a.entries, ...b.entries],
      photos: [...a.photos, ...b.photos],
      stations: a.stations && b.stations,
      // The longer burst of the two: together they would make a grid past six.
      burst: a.burst.length >= b.burst.length ? a.burst : b.burst,
    };
    list.splice(best, 2, merged);
  }
  return list;
}

interface Rhythm {
  beats: BookDesignBeat[];
  lastHero: number;
}

const LOUD = new Set<BookDesignBeat>(['hero', 'pano']);

/** Whether a loud beat may come now: the spread before it was calm, and no hero in the last three. */
function loudAllowed(rhythm: Rhythm, beat: BookDesignBeat): boolean {
  const last = rhythm.beats[rhythm.beats.length - 1];
  if (last && (LOUD.has(last) || last === 'grid')) return false;
  return beat !== 'hero' || rhythm.beats.length - rhythm.lastHero >= 4;
}

/** The beat a run of photos makes on its own spread. */
function photoBeat(count: number): BookDesignBeat {
  if (count <= 1) return 'quiet';
  if (count === 2) return 'duo';
  if (count === 3) return 'trio';
  return 'grid';
}

interface PlanInput {
  directives: BookDesignDirectives;
  page: BookPageSetup;
  infos: ReadonlyMap<number, BookPhotoInfo>;
}

/**
 * The chapter's opening spread, out of its `spreads`: a hero when it has a
 * photo for one and the rhythm allows, else a panorama, else the opener. A
 * hero sets none of the words and a panorama's half page is too small to
 * count on, so a chapter that tells a story opens on either only when a
 * spread for its words can follow.
 */
function opening(
  chapter: DesignChapter,
  photos: AutoPhoto[],
  rhythm: Rhythm,
  input: PlanInput,
  spreads: number,
): PlannedSpread {
  const entry = chapter.entries[0] ?? null;
  const loudFits = spreads > 1 || wordsRoom(chapter, input.directives) === 0;
  const hero = loudFits ? photos.find((p) => heroWorthy(p, input.infos.get(p.photoId), input.page)) : undefined;
  if (entry && hero && loudAllowed(rhythm, 'hero')) {
    photos.splice(photos.indexOf(hero), 1);
    return { beat: 'hero', chapter, entry, photos: [hero] };
  }
  const pano = loudFits && photos[0] && isPanorama(photos[0]) && loudAllowed(rhythm, 'pano') ? photos[0] : null;
  if (entry && pano) return { beat: 'pano', chapter, entry, photos: photos.splice(0, 3) };
  const first = photos.shift();
  return { beat: first ? 'opener' : 'story', chapter, entry, photos: first ? [first] : [] };
}

/**
 * The chapter's burst as one grid, taken out of `photos`: up to six of its
 * photos, five after a loud spread (six make a loud grid), at any density;
 * null when fewer than four of them are left once the chapter has opened.
 */
function burstGrid(chapter: DesignChapter, photos: AutoPhoto[], rhythm: Rhythm): PlannedSpread | null {
  const most = loudAllowed(rhythm, 'grid') ? 6 : 5;
  const take = photos.filter((p) => chapter.burst.includes(p.photoId)).slice(0, most);
  if (take.length < 4) return null;
  for (const p of take) photos.splice(photos.indexOf(p), 1);
  return { beat: 'grid', chapter, entry: null, photos: take };
}

/**
 * The photos a quiet page takes, out of `photos`, with `left` spreads still
 * to plan: none while more follow, so the words stand alone; one beside them
 * on the chapter's last spread, or on its `first` page for words when the
 * entry has pros and cons, which then still have a page should the opening
 * hold the whole story. The photo is the first outside the burst, which stays
 * whole for its grid.
 */
function quietPhotos(chapter: DesignChapter, photos: AutoPhoto[], left: number, first: boolean): AutoPhoto[] {
  const entry = chapter.entries[0];
  if (left > 1 && !(first && entry && bookEntryListItems(entry).length > 0)) return [];
  const at = photos.findIndex((p) => !chapter.burst.includes(p.photoId));
  return photos.splice(Math.max(0, at), 1);
}

/**
 * How many of `count` photos the next photo spread takes: five for a grid of
 * six after a loud spread, and fewer until its beat is not the third alike
 * running (a grid of five is still a grid).
 */
function photoTake(rhythm: Rhythm, count: number): number {
  let take = count >= 6 && !loudAllowed(rhythm, 'grid') ? 5 : count;
  const [before, last] = rhythm.beats.slice(-2);
  const twice = before === last ? last : null;
  while (take > 1 && photoBeat(take) === twice) take--;
  return take;
}

/**
 * The quiet pages a chapter's words want after its `open`ing, out of `left`
 * spreads and of `photos`: one for every page's worth of the room its words
 * take (the room of all its entries' words, as `naturalSpreads` counts it)
 * that the opening cannot hold, a page holding a column beside a photo or two
 * without one.
 */
function wordsPages(
  chapter: DesignChapter,
  photos: AutoPhoto[],
  open: PlannedSpread,
  left: number,
  directives: BookDesignDirectives,
): PlannedSpread[] {
  const out: PlannedSpread[] = [];
  const entry = chapter.entries[0] ?? null;
  const held = open.beat === 'hero' || open.beat === 'pano' ? 0 : OPENER_STORY_CHARS;
  let words = wordsRoom(chapter, directives) - held;
  while (words > 0 && out.length < left) {
    const beside = quietPhotos(chapter, photos, left - out.length, out.length === 0);
    out.push({ beat: 'quiet', chapter, entry, photos: beside });
    words -= beside.length ? QUIET_STORY_CHARS : QUIET_STORY_CHARS * 2;
  }
  return out;
}

/**
 * The spreads of one chapter for its share of the budget: the opening, the
 * quiet pages its words want, its burst as one grid, then the photos spread
 * evenly over what is left, at most the density's maximum a spread; photos
 * that find no spread are left out and said.
 */
export function planChapter(
  chapter: DesignChapter,
  spreads: number,
  rhythm: Rhythm,
  input: PlanInput,
  leftOut: BookDesignLeftOut[],
): PlannedSpread[] {
  if (chapter.stations) return [{ beat: 'stations', chapter, entry: null, photos: [] }];
  const photos = [...chapter.photos];
  const out: PlannedSpread[] = [];
  const push = (s: PlannedSpread) => {
    out.push(s);
    if (s.beat === 'hero') rhythm.lastHero = rhythm.beats.length;
    rhythm.beats.push(s.beat);
  };
  const open = opening(chapter, photos, rhythm, input, spreads);
  push(open);
  const pages = wordsPages(chapter, photos, open, spreads - 1, input.directives);
  pages.forEach(push);
  let left = spreads - 1 - pages.length;
  const grid = left > 0 ? burstGrid(chapter, photos, rhythm) : null;
  if (grid) {
    push(grid);
    left--;
  }
  const max = DENSITY[input.directives.density].max;
  while (left > 0 && photos.length) {
    const take = photoTake(rhythm, Math.min(max, Math.ceil(photos.length / left)));
    push({ beat: photoBeat(take), chapter, entry: null, photos: photos.splice(0, take) });
    left--;
  }
  for (const p of photos) leftOut.push({ photoId: p.photoId, reason: 'page_budget' });
  return out;
}

/** Where the last hero stands before the book has one: far enough back for the first chapter to open with one. */
const NO_HERO = -10;

export function newRhythm(): Rhythm {
  return { beats: [], lastHero: NO_HERO };
}

/**
 * The rhythm from `from` on as the chapter's spreads were made: a planned
 * page the composer left out (a quiet page with no words left to set once the
 * opener held the story) takes no place in it, so the next chapter's hero is
 * paced by the spreads the book has, four of them after the last hero.
 */
export function settleRhythm(rhythm: Rhythm, from: number, made: readonly BookDesignBeat[]): void {
  rhythm.beats.splice(from, rhythm.beats.length - from, ...made);
  const hero = rhythm.beats.lastIndexOf('hero');
  rhythm.lastHero = hero >= 0 ? hero : NO_HERO;
}
