import type {
  BookCoverArchetype,
  BookDecoratedTemplate,
  BookDocument,
  BookPageSetup,
  BookSpread,
  BookTemplateKind,
  BookTemplateWords,
  BookTravelContext,
  JourneyStats,
} from '@trek/shared';
import { BOOK_COVER_ARCHETYPES, applyDecoratedTemplate, bookTemplateWords, decoratedTemplatesFor } from '@trek/shared';

import { studioTravelContext } from '../studioTravelContext';

/**
 * What the Templates panel lays out and draws: the decorated templates a page
 * can take, the words and the figures they are filled with, and the page one
 * template makes. The card and the click run the same function, so a card
 * shows the page the click gives, with this page's own photos and words in it.
 */

export type ArchetypeFilter = BookCoverArchetype | 'all';

/** The panel's style filter: every template, or those of one archetype. */
export const ARCHETYPE_FILTERS: readonly ArchetypeFilter[] = ['all', ...BOOK_COVER_ARCHETYPES];

/** Which templates a page takes: a single page (the cover, the first, the last, the back) or a double spread. */
export function pageKind(spread: BookSpread): BookTemplateKind {
  return spread.role === 'inner' ? 'inner' : 'single';
}

/** The decorated templates for a page: covers for a single page, spreads for a double one. */
export function templatesForSpread(spread: BookSpread, filter: ArchetypeFilter): BookDecoratedTemplate[] {
  return decoratedTemplatesFor(pageKind(spread), filter === 'all' ? null : filter);
}

/** What the Studio knows of the journey that a template takes words and a map from. */
export interface TemplateSource {
  /** The journey's title, for a cover of a book without its own, and its subtitle. */
  title?: string;
  subtitle?: string | null;
  entries: readonly {
    id: number;
    title: string | null;
    story: string | null;
    location: string | null;
    date: string | null;
  }[];
}

/** Everything a page is laid out on a template with. */
export interface TemplateContext {
  theme: BookDocument['theme'];
  words: BookTemplateWords;
  travel: BookTravelContext | null;
  locale: string;
}

/**
 * The words a template's empty roles take, as the assistant's layout gives
 * them (template-op.ts in shared): on a single page the book's title, or the
 * journey's when the book has none, the journey's subtitle and the year; on
 * a page made from a journal entry that entry's title, place, date and story.
 */
export function studioTemplateWords(
  bookTitle: string,
  spread: BookSpread,
  source: TemplateSource,
  locale: string
): BookTemplateWords {
  return bookTemplateWords(spread, {
    bookTitle: bookTitle.trim() || (source.title ?? ''),
    subtitle: source.subtitle ?? null,
    locale,
    entries: source.entries,
  });
}

/** The journey's figures and way, for a template's map; null while they are loading or failed. */
export function templateTravel(
  stats: JourneyStats | null,
  path: [number, number][][],
  locale: string,
  t: (k: string) => string
): BookTravelContext | null {
  return stats ? studioTravelContext(stats, path, locale, t) : null;
}

/** A page laid out on a template: what a card draws and what a click commits. */
export function layTemplate(
  spread: BookSpread,
  tpl: BookDecoratedTemplate,
  page: BookPageSetup,
  ctx: TemplateContext,
  newId?: (prefix: string) => string
): BookSpread {
  return applyDecoratedTemplate(spread, tpl, page, {
    theme: ctx.theme ?? null,
    words: ctx.words,
    travel: ctx.travel,
    locale: ctx.locale,
    ...(newId ? { newId } : {}),
  });
}

/** Ids for a card's drawing that stay the same from one render to the next, so its keys do too. */
export function previewIds(prefix: string): (kind: string) => string {
  let n = 0;
  return (kind) => `${prefix}-${kind}${(n += 1)}`;
}

/** How many frames a laid page is left waiting for a picture in. */
export function emptyFrames(spread: BookSpread): number {
  return spread.elements.filter((e) => e.kind === 'photo' && e.photoId == null).length;
}
