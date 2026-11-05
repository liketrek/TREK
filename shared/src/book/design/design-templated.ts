import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import type { BookCoverArchetype } from '../book-archetypes';
import { DESIGN_TEXT_HEADROOM, textHeightNeeded } from '../book-findings';
import { formatBookDate } from '../book-text';
import type { BookElement, BookSpread, BookTextElement } from '../book.schema';
import { decoratedTemplatesFor } from '../templates/template-catalogue';
import { templatePhotoSlots, templateRoles, type BookDecoratedTemplate } from '../templates/template-format';
import type { BookTemplateWord } from '../templates/template-words';
import type { BookDesignInput } from './design-book';
import { cutWords, liveBox, photoEl, textEl, type ComposeCtx } from './design-compose';
import { composeStations } from './design-framing';
import type { DesignedSpread } from './design-merge';
import type { BookDesignBeat } from './design-pacing';
import { buildChapters, type DesignChapter } from './design-pacing';
import type { BookDesignLeftOut, DesignPhotoChoice } from './design-photos';
import { innerSpread } from './design-spreads';
import {
  bodyCapacity,
  chunkPhotos,
  chunkSizesOf,
  innerPool,
  type ChunkSizes,
  pickInnerTemplate,
  templateEnergy,
  type TemplatePickCtx,
} from './design-template-pick';
import {
  composeTravelCountries,
  composeTravelSummary,
  composeWordsPage,
  countryLookFor,
  pourTemplate,
  summaryLookFor,
} from './design-templated-framing';

/**
 * The inner pages of a book laid on the designed templates.
 *
 * The journey at a glance and its countries open it, in the travel looks.
 * Then every chapter: its photos cut into page-sized parts that leave no
 * frame empty (`chunkPhotos`), the first part carrying the chapter's words,
 * and each part laid on the decorated template that suits it best
 * (`pickInnerTemplate`), in the book's theme, its title, place, date and
 * story bound to the journal. A story too long for its frame is cut at a
 * sentence and goes on over a page of words. Runs of stops nobody wrote
 * about share a list as in every design. Photos of the journey's gallery that
 * found no entry with room close the book on pages of more moments.
 */

interface TemplatedInnerResult {
  spreads: DesignedSpread[];
  leftOut: BookDesignLeftOut[];
  notes: string[];
}

/** What the inner pages are laid with beside the composer's context. */
interface TemplatedPlan {
  archetype: BookCoverArchetype;
  /** The book counts as calm for template choice: its busy pages stay few. */
  calm: boolean;
  /** Loose photos of the journey no entry had room for, for the closing pages of more moments. */
  rest: readonly AutoPhoto[];
}

/** The closing pages of more moments a book takes at most. */
const MORE_MOMENTS = 3;
/** Pages of words one story runs on to at most past its own. */
const MOST_CONTINUED = 2;

/** The classic mark styles: never set by the auto layout, which sets a date mark as a stamp. */
const CLASSIC_MARKS = new Set(['plain', 'chip', 'outline', 'stacked']);

/** The beat a templated page plays in the plan, read from its template's energy and photos. */
function beatOf(tpl: BookDecoratedTemplate | null, photos: number): BookDesignBeat {
  if (!tpl) return photos ? 'grid' : 'story';
  const energy = templateEnergy(tpl);
  if (energy === 'loud') return 'hero';
  if (energy === 'lively' || energy === 'medium') return photos >= 4 ? 'grid' : photos >= 2 ? 'duo' : 'quiet';
  return photos === 0 ? 'story' : 'quiet';
}

/** The words of a story the directives let a book set: all, an excerpt, or none. */
function storyOf(c: ComposeCtx, entry: AutoEntry | undefined): string {
  const words = (entry?.story ?? '').trim();
  const mode = c.directives.text?.story ?? 'full';
  if (!words || mode === 'none') return '';
  return mode === 'excerpt' ? cutWords(words, c.directives.text?.excerptChars ?? 600) : words;
}

/**
 * A page holding an entry's content for a template to pour: the story (bound
 * when it is the whole of it), the first photo's caption when captions are
 * asked of each photo, and the photos in order. The title, place and date the
 * template takes from the journal itself, bound to the entry.
 */
function entrySeedSpread(
  c: ComposeCtx,
  entry: AutoEntry,
  photos: readonly AutoPhoto[],
  story: { words: string; whole: boolean } | null,
): BookSpread {
  const box = liveBox(c, 'right');
  const els: BookElement[] = [];
  if (story?.words) {
    const binding = { source: 'entry.story' as const, entryId: entry.id };
    els.push(textEl(c, box, story.words, 'body', { binding, overridden: !story.whole }));
  }
  const caption = photos[0]?.caption?.trim();
  const first = photos[0];
  if (caption && first && c.directives.text?.captions === 'photo') {
    const binding = { source: 'photo.caption' as const, photoId: first.photoId };
    els.push(textEl(c, box, caption, 'caption', { binding }));
  }
  els.push(...photos.map((p) => photoEl(c, p, box)));
  return innerSpread(c, els, entry.id);
}

/** The longest start of `words` its laid frame holds, cut at a sentence where one is near. */
function cutToFrame(el: BookTextElement, words: string): string {
  const fits = (s: string) => textHeightNeeded({ ...el, text: s }, DESIGN_TEXT_HEADROOM) <= el.frame.h;
  if (fits(words)) return words;
  let lo = 0;
  let hi = words.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(`${words.slice(0, mid)}…`)) lo = mid;
    else hi = mid - 1;
  }
  return cutWords(words, lo);
}

const isStory = (e: BookElement): e is BookTextElement => e.kind === 'text' && e.binding?.source === 'entry.story';

/**
 * A laid page with its story cut to its frame where it runs over: marked as
 * no longer following the journal and said in the notes, the rest handed
 * back for the next page. A story that fits stays as it is.
 */
function fittedStory(c: ComposeCtx, spread: BookSpread, entry: AutoEntry): { spread: BookSpread; rest: string } {
  const story = spread.elements.find(isStory);
  if (!story) return { spread, rest: '' };
  const fitting = cutToFrame(story, story.text);
  if (fitting === story.text) return { spread, rest: '' };
  c.notes.push(`the story of entry ${entry.id} is cut to fit its page and no longer follows the journal`);
  const rest = story.text.slice(fitting.replace(/…$/, '').length).trim();
  const elements = fitting
    ? spread.elements.map((e) => (e === story ? { ...story, text: fitting, overridden: true } : e))
    : spread.elements.filter((e) => e !== story);
  return { spread: { ...spread, elements }, rest };
}

/** A laid page as the auto layout leaves it: date marks as stamps, and only its photos parked. */
function tidied(spread: BookSpread): BookSpread {
  const elements = spread.elements.map((e) =>
    e.kind === 'badge' && CLASSIC_MARKS.has(e.style) ? { ...e, style: 'stamp' as const } : e,
  );
  // The words a template has no role for are the journal's own, bound to it: nothing is lost leaving them.
  return { ...spread, elements, parked: spread.parked.filter((e) => e.kind === 'photo') };
}

/** The pick context for the next page of the book. */
type PickBase = Omit<TemplatePickCtx, 'history' | 'key'>;

interface Laying {
  c: ComposeCtx;
  base: PickBase;
  /** Template ids laid so far, in order, for the picker's variety and rhythm. */
  history: string[];
  entries: readonly AutoEntry[];
  out: DesignedSpread[];
}

/** A story to set on a page: its words, and whether they are the whole of the entry's. */
export type PageStory = { words: string; whole: boolean } | null;

/** One page as it is laid: the spread, the template it was laid on (none for a composed one) and the story's rest. */
export interface LaidPage {
  spread: BookSpread;
  template: BookDecoratedTemplate | null;
  rest: string;
}

/**
 * One page of an entry laid on the template that suits it best, in the
 * book's theme, or composed as a page of words where none takes it; the
 * story cut to its frame, its rest handed back for the next page.
 */
export function layEntryPage(
  c: ComposeCtx,
  entry: AutoEntry,
  page: { photos: readonly AutoPhoto[]; story: PageStory; entries: readonly AutoEntry[] },
  pick: TemplatePickCtx,
): LaidPage {
  const mappable = (entry.lat != null && entry.lng != null) || !!c.travel.stats?.points.length;
  const chunk = { photos: page.photos, story: page.story?.words ?? '', mappable };
  const tpl = pickInnerTemplate(chunk, pick);
  if (!tpl) {
    const fitted = fittedStory(c, composeWordsPage(c, entry, wordsColumn(c, entry, page.story)), entry);
    return { ...fitted, template: null };
  }
  const laid = tidied(pourTemplate(c, entrySeedSpread(c, entry, page.photos, page.story), tpl, page.entries));
  return { ...fittedStory(c, laid, entry), template: tpl };
}

/** One page of the book laid and added; the rest of its story handed back. */
function layPage(
  l: Laying,
  entry: AutoEntry,
  photos: readonly AutoPhoto[],
  story: PageStory,
  chapter: string | null,
): string {
  const key = `e${entry.id}:${l.out.length}`;
  const laid = layEntryPage(l.c, entry, { photos, story, entries: l.entries }, { ...l.base, history: l.history, key });
  if (laid.template) l.history.push(laid.template.id);
  l.out.push({
    spread: laid.spread,
    beat: laid.template ? beatOf(laid.template, photos.length) : 'story',
    chapter,
    findings: [],
    ...(laid.template ? { template: laid.template.id } : {}),
  });
  return laid.rest;
}

/**
 * A story set in a column down the left page, where no template takes it:
 * bound to the entry while it is the whole of it, for `fittedStory` to cut.
 */
function wordsColumn(c: ComposeCtx, entry: AutoEntry, story: PageStory) {
  if (!story?.words) return null;
  const binding = { source: 'entry.story' as const, entryId: entry.id };
  const el = textEl(c, liveBox(c, 'left'), story.words, 'body', { binding, overridden: !story.whole });
  return { ...el, frame: liveBox(c, 'left') };
}

/** The best capacity of the pool's story templates for each photo count, for what a long story costs a page. */
function storyRoom(c: ComposeCtx, pool: readonly BookDecoratedTemplate[]): Map<number, number> {
  const room = new Map<number, number>();
  for (const t of pool) {
    const cap = bodyCapacity(t, c.page, c.look.theme);
    if (cap > 0) room.set(templatePhotoSlots(t), Math.max(room.get(templatePhotoSlots(t)) ?? 0, cap));
  }
  return room;
}

/** A first page whose story frame cannot hold the story costs this much more: a page of words follows. */
const SHORT_STORY_PAGE = 12;
/** A page only another archetype has a template for costs this much more, so as few as can be are. */
const FOREIGN_PAGE = 8;

/**
 * The photo counts a chapter's pages may take: those of the book's own pool
 * of templates, the pool the picker lays them from. `wide` adds those only
 * another archetype has, at a price, for a chapter the own pool would leave
 * a photo of without a frame.
 */
function chunkSizesFor(c: ComposeCtx, archetype: BookCoverArchetype, words: string, wide = false): ChunkSizes {
  const pool = innerPool(archetype);
  const own = chunkSizesOf(pool);
  const sizes = wide ? chunkSizesOf(decoratedTemplatesFor('inner')) : own;
  const room = storyRoom(c, words ? (wide ? decoratedTemplatesFor('inner') : pool) : []);
  const pageCost = (s: number, first: boolean) => {
    const foreign = !(first && words ? own.story : own.any).has(s);
    const short = first && words && (room.get(s) ?? 0) < words.length;
    return (foreign ? FOREIGN_PAGE : 0) + (short ? SHORT_STORY_PAGE : 0);
  };
  return { any: sizes.any, story: sizes.story, pageCost };
}

/** A chapter's photos cut into pages of the own pool, or of any where the own pool leaves one without a frame. */
function cutChapter(c: ComposeCtx, archetype: BookCoverArchetype, words: string, photos: number) {
  const own = chunkPhotos(photos, !!words, chunkSizesFor(c, archetype, words));
  if (!own.parked) return own;
  const wide = chunkPhotos(photos, !!words, chunkSizesFor(c, archetype, words, true));
  return wide.parked < own.parked ? wide : own;
}

/** A chapter's pages: its photos cut into parts, the first taking its first entry's words, then the rest of them. */
function chapterPages(l: Laying, chapter: DesignChapter, notes: string[]) {
  const entry = chapter.entries[0];
  if (!entry) return;
  const name = chapter.label ?? entry.title ?? null;
  const words = storyOf(l.c, entry);
  const cut = cutChapter(l.c, l.base.archetype, words, chapter.photos.length);
  let at = 0;
  let rest = '';
  cut.sizes.forEach((size, i) => {
    const story = i === 0 && words ? { words, whole: words === (entry.story ?? '').trim() } : null;
    rest = layPage(l, entry, chapter.photos.slice(at, at + size), story, name) || rest;
    at += size;
  });
  const parked = chapter.photos.slice(at);
  const last = l.out[l.out.length - 1];
  if (parked.length && last) {
    last.spread = {
      ...last.spread,
      parked: [...last.spread.parked, ...parked.map((p) => photoEl(l.c, p, liveBox(l.c, 'right')))],
    };
    const what = parked.length === 1 ? '1 photo' : `${parked.length} photos`;
    notes.push(`${what} of entry ${entry.id} found no frame and wait with its last page`);
  }
  for (let n = 0; rest && n < MOST_CONTINUED; n++) rest = layPage(l, entry, [], { words: rest, whole: false }, name);
  if (rest) notes.push(`part of the story of entry ${entry.id} found no room on its pages and is left out`);
  // The further entries of a chapter of a day or a place each tell their own story on a page of words.
  for (const more of chapter.entries.slice(1)) {
    const told = storyOf(l.c, more);
    if (told) layPage(l, more, [], { words: told, whole: told === (more.story ?? '').trim() }, name);
  }
}

/** The most stops one page of the list takes, so a page of them still reads as a list. */
const STOPS_PER_PAGE = 10;

/** Bare stops as a list: under each date the names of the stops of that day, a blank line between days. */
function stopList(c: ComposeCtx, stops: readonly AutoEntry[], dated: boolean): string {
  const days: { date: string; names: string[] }[] = [];
  for (const e of stops) {
    const date = e.date && dated ? formatBookDate(e.date, c.locale) : '';
    const name = (e.title || e.location || '').trim();
    if (!name) continue;
    const day = days[days.length - 1];
    if (day && day.date === date) day.names.push(name);
    else days.push({ date, names: [name] });
  }
  return days.map((d) => [d.date, ...d.names].filter(Boolean).join('\n')).join('\n\n');
}

/** The one day all these stops were on, bound to the first of them, as a date role takes it; null without one. */
function oneDay(c: ComposeCtx, stops: readonly AutoEntry[]): BookTemplateWord | null {
  const days = new Set(stops.map((e) => e.date ?? ''));
  const [day] = days;
  const first = stops[0];
  if (days.size !== 1 || !day || !first) return null;
  return { text: formatBookDate(day, c.locale), binding: { source: 'entry.date', entryId: first.id, value: day } };
}

/**
 * One page of bare stops on a words-only template of the book's styles: the
 * list's label as its title, the stops as its story (given by role, since a
 * short list that opens on a date would read as a date line), as many as its
 * story frame holds. Stops of one day set that day in the template's date
 * and only their names in the list. Undefined when no template takes a list.
 */
function stationsPage(l: Laying, stops: readonly AutoEntry[], label: string) {
  for (let n = Math.min(stops.length, STOPS_PER_PAGE); n > 0; n--) {
    const some = stops.slice(0, n);
    const key = `stations:${l.out.length}`;
    const pick = (list: string) =>
      pickInnerTemplate({ photos: [], story: list, mappable: false }, { ...l.base, history: l.history, key });
    const tpl = pick(stopList(l.c, some, true));
    if (!tpl) return undefined;
    const day = templateRoles(tpl).includes('date') ? oneDay(l.c, some) : null;
    const list = stopList(l.c, some, !day);
    if (bodyCapacity(tpl, l.c.page, l.c.look.theme) < list.length && n > 1) continue;
    const words = {
      title: { text: label },
      body: { text: list },
      ...(day ? { date: day } : {}),
    };
    return { spread: tidied(pourTemplate(l.c, innerSpread(l.c, [], null), tpl, l.entries, words)), tpl, placed: n };
  }
  return undefined;
}

/** The pages of a list of bare stops: as many as the stops need, each on a words-only template where one takes it. */
function stationsPages(l: Laying, chapter: DesignChapter, input: BookDesignInput) {
  let rest = chapter.entries;
  while (rest.length) {
    const page = stationsPage(l, rest, input.stationsLabel);
    if (page) {
      l.history.push(page.tpl.id);
      l.out.push({ spread: page.spread, beat: 'stations', chapter: null, findings: [], template: page.tpl.id });
      rest = rest.slice(page.placed);
      continue;
    }
    const set = composeStations(l.c, rest, input.stationsLabel);
    if (!set.placed) break;
    l.out.push({ spread: innerSpread(l.c, set.elements, null), beat: 'stations', chapter: null, findings: [] });
    rest = rest.slice(set.placed);
  }
}

/** The closing pages of more moments: the photos no entry had room for, on grids, at most three pages. */
function moreMoments(l: Laying, rest: readonly AutoPhoto[], leftOut: BookDesignLeftOut[]) {
  let left = [...rest];
  const sizes = chunkSizesOf(innerPool(l.base.archetype)).any;
  const biggest = Math.max(...[...sizes].filter((s) => s > 0), 1);
  for (let n = 0; left.length && n < MORE_MOMENTS; n++) {
    const take = left.slice(0, biggest);
    const tpl = pickInnerTemplate(
      { photos: take, story: '', mappable: false },
      { ...l.base, history: l.history, key: `more:${n}` },
    );
    if (!tpl) break;
    const used = take.slice(0, templatePhotoSlots(tpl));
    const seed = innerSpread(
      l.c,
      used.map((p) => photoEl(l.c, p, liveBox(l.c, 'right'))),
      null,
    );
    const laid = tidied(pourTemplate(l.c, seed, tpl, l.entries));
    l.history.push(tpl.id);
    l.out.push({ spread: laid, beat: beatOf(tpl, used.length), chapter: null, findings: [], template: tpl.id });
    left = left.slice(used.length);
  }
  for (const p of left) leftOut.push({ photoId: p.photoId, reason: 'page_budget' });
}

/** The pages past the budget are left out from the end, their photos said to be left out for it. */
function withinCap(body: DesignedSpread[], keep: number, leftOut: BookDesignLeftOut[], notes: string[]) {
  if (body.length <= keep) return body;
  const cut = body.slice(Math.max(0, keep));
  for (const d of cut) {
    for (const e of [...d.spread.elements, ...d.spread.parked]) {
      if (e.kind === 'photo' && e.photoId != null) leftOut.push({ photoId: e.photoId, reason: 'page_budget' });
    }
  }
  notes.push(`${cut.length} pages past the page budget are left out`);
  return body.slice(0, Math.max(0, keep));
}

/** The journey at a glance and its countries, as the directives allow them. */
function framingPages(c: ComposeCtx, archetype: BookCoverArchetype): DesignedSpread[] {
  const travel = c.directives.travel;
  const out: DesignedSpread[] = [];
  const summary = (travel?.summary ?? true) ? composeTravelSummary(c, summaryLookFor(archetype)) : null;
  if (summary) out.push({ spread: summary, beat: 'summary', chapter: null, findings: [] });
  const countries = (travel?.countries ?? true) ? composeTravelCountries(c, countryLookFor(archetype)) : null;
  if (countries) out.push({ spread: countries, beat: 'countries', chapter: null, findings: [] });
  return out;
}

/** Every inner page of a book laid on the designed templates, in order. */
export function composeTemplatedInner(
  c: ComposeCtx,
  entries: readonly AutoEntry[],
  choice: DesignPhotoChoice,
  input: BookDesignInput,
  plan: TemplatedPlan,
): TemplatedInnerResult {
  const notes: string[] = [];
  const leftOut: BookDesignLeftOut[] = [];
  const cap = Math.max(0, c.directives.pages?.max ?? Number.POSITIVE_INFINITY);
  const head = framingPages(c, plan.archetype).slice(0, Math.max(0, cap - 1));
  const base: PickBase = {
    archetype: plan.archetype,
    page: c.page,
    theme: c.look.theme,
    calm: plan.calm,
    seed: c.directives.seed ?? 0,
  };
  const l: Laying = { c, base, history: [], entries, out: [] };
  for (const chapter of buildChapters(entries, choice.byEntry, c.directives, input.candidates)) {
    if (chapter.stations) stationsPages(l, chapter, input);
    else chapterPages(l, chapter, notes);
  }
  moreMoments(l, plan.rest, leftOut);
  const body = withinCap(l.out, cap - head.length, leftOut, notes);
  return { spreads: [...head, ...body], leftOut, notes };
}
