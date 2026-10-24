import { JourneyAiPhotosService } from '../journey/journey-ai-photos.service';
import { JourneyBookEditService } from '../journey/journey-book-edit.service';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { PhotoSignalsService } from '../photos/photo-signals.service';
import { buildTripCard, todayIn, type TripCard } from './assistant-context';
import { Injectable } from '@nestjs/common';
import type { AssistantFocus, BookOverview, BookSpreadSummary } from '@trek/shared';

/**
 * The journey as the Studio assistant knows it on a turn: the journey, what
 * the user may do on it, its book page by page, its gallery in numbers with
 * how many of its photos a page image may show (journey-studio.md 4.1), and
 * its entries. Built from the journey and book services with the user's own
 * rights, it gives the model the page and entry ids it works with.
 */

/** What the user may do in a journey's book. */
type BookRole = 'owner' | 'editor' | 'viewer';

/** One entry as the card lists it. */
interface BookCardEntry {
  id: number;
  date: string;
  title: string | null;
  place: string | null;
  photos: number;
}

/** The journey's gallery in numbers, videos left out: what a photo pick can go by. */
interface BookCardGallery {
  photos: number;
  withTime: number;
  withGps: number;
  /** The photos the user contributed: the only ones a page image draws, every other one an empty frame there. */
  own: number;
}

export interface BookCard {
  journeyId: number;
  title: string;
  subtitle: string | null;
  role: BookRole;
  book: BookOverview;
  gallery: BookCardGallery;
  entries: BookCardEntry[];
  focus: AssistantFocus | null;
}

/** Pages the card lists one by one; a longer book is counted past them. */
const PAGES_LISTED = 150;
/** Entries the card lists one by one; the rest are counted. */
const ENTRIES_LISTED = 200;
/** Selected elements the focus names; a larger selection is counted. */
const SELECTED_LISTED = 30;

const ROLE_WORDING: Readonly<Record<BookRole, string>> = {
  owner: 'owner (you may change the book)',
  editor: 'editor (you may change the book)',
  viewer: 'viewer (you may read the book but not change it; propose no changes, say so when asked for one)',
};

/** User text on one line, so a line break in a title cannot split a row of the card. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** A list cut after `max`, with how many more there are. */
function listed<T>(items: readonly T[], max: number, line: (item: T) => string): string[] {
  const lines = items.slice(0, max).map(line);
  if (items.length > max) lines.push(`and ${items.length - max} more`);
  return lines;
}

function pageRow(spread: BookSpreadSummary): string {
  const texts = spread.texts.map((text) => `"${oneLine(text)}"`).join(', ');
  const cells = [spread.index, spread.id, spread.role, spread.entryId ?? '', spread.photoIds.join(', '), texts];
  return cells.join(' | ');
}

function entryRow(entry: BookCardEntry): string {
  const words = [entry.title, entry.place].map((text) => oneLine(text ?? ''));
  return [entry.id, entry.date, ...words, entry.photos].join(' | ');
}

/** What the user looks at in the Studio, first in the card, so "this page" needs no question back. */
function focusLines(card: BookCard): string[] {
  const spreadId = card.focus?.spreadId;
  const page = spreadId ? card.book.spreads.find((spread) => spread.id === spreadId) : undefined;
  if (!page) return [];
  const about = `page ${page.id} (index ${page.index}, ${page.role})`;
  const lines = [`The user is looking at ${about}; words like "this page" or "here" mean it.`];
  const selected = card.focus?.elementIds ?? [];
  if (selected.length > 0) {
    const shown = selected.slice(0, SELECTED_LISTED).join(', ');
    const more = selected.length > SELECTED_LISTED ? ` and ${selected.length - SELECTED_LISTED} more` : '';
    lines.push(`Selected on it ("this photo", "these" mean them): ${shown}${more}.`);
  }
  return [...lines, ''];
}

/** No book yet: someone who may change the book is pointed at create_book, which a viewer's turn is not offered. */
function noBook(role: BookRole): string {
  return role === 'viewer' ? 'Book: none yet.' : 'Book: none yet (create_book lays down a blank one).';
}

/** The book as the model reads it: its setup, then a row per page. */
function bookLines(book: BookOverview, role: BookRole): string[] {
  if (!book.exists) return [noBook(role)];
  const { preset, pageWidth, pageHeight, bleed, safe } = book.page;
  const lines = [
    `Book: "${oneLine(book.title)}", version ${book.version ?? '?'}`,
    `Page: ${pageWidth} x ${pageHeight} mm (${preset}), bleed ${bleed} mm, safe margin ${safe} mm`,
    '',
    'Pages (index | page id | role | entry id | photo ids | first words of its texts):',
    ...listed(book.spreads, PAGES_LISTED, pageRow),
  ];
  const layouts = book.layouts.map((layout) => `${oneLine(layout.name)} (${layout.id}, ${layout.role})`);
  if (layouts.length > 0) lines.push('', `Saved layouts: ${layouts.join(', ')}`);
  return lines;
}

/**
 * Which of the photos a page image may show: only the user's own, so a photo
 * of another contributor is an empty frame there. Said as the rule, since a
 * turn of a model that reads no images gets none.
 */
function shownLine(photos: number, own: number): string {
  if (own >= photos) return 'All of them are yours, so a page image may show every one.';
  if (own === 0) return 'None of them are yours, so a page image shows each of them as an empty frame.';
  const others = 'photos of other contributors are empty frames there on purpose';
  return `${own} of them are yours; a page image shows only those, and ${others}.`;
}

/**
 * The gallery in one line: how many photos a pick chooses from, how many it
 * can place by time or on the map, and how many a page image may show.
 */
function galleryLine({ photos, withTime, withGps, own }: BookCardGallery): string {
  if (photos === 0) return 'Gallery: no photos yet.';
  const known = `${withTime} with the time taken, ${withGps} with a GPS position`;
  return `Gallery: ${photos} photos (videos left out), ${known}. ${shownLine(photos, own)}`;
}

/**
 * The card as the model reads it: the focus first, then the journey, the
 * user's role, the book, the gallery and the entries.
 */
export function renderBookCard(card: BookCard): string {
  const lines = [`Journey: ${oneLine(card.title)}`];
  if (card.subtitle) lines.push(`Subtitle: ${oneLine(card.subtitle)}`);
  const book = bookLines(card.book, card.role);
  lines.push(`Your role: ${ROLE_WORDING[card.role]}`, '', ...book, '', galleryLine(card.gallery), '');
  lines.push('Entries (entry id | date | title | place | photos):');
  if (card.entries.length === 0) lines.push('(no entries yet)');
  lines.push(...listed(card.entries, ENTRIES_LISTED, entryRow));
  return [...focusLines(card), ...lines].join('\n');
}

/** What the model reads next to its instructions on a Studio turn: the date and the book card. */
export function bookTurnContext(card: BookCard, timeZone: string, now: Date): string {
  const today = `Today is ${todayIn(timeZone, now)} (time zone ${timeZone}).`;
  return [today, '', '<book_card>', renderBookCard(card), '</book_card>'].join('\n');
}

/**
 * The trip card a journey turn hands the agent loop: empty, so the trip's
 * answer cards (places found, the weather strip) find nothing to show and a
 * change card names nothing from a trip.
 */
export function emptyTripCard(userId: number): TripCard {
  return buildTripCard(0, userId, null, null, null);
}

/** The entries the card lists: none waved away, and the suggestions only while nothing is written yet. */
function listedEntries<T extends { dismissed: boolean; type?: string | null }>(entries: readonly T[]): T[] {
  const kept = entries.filter((entry) => !entry.dismissed);
  const written = kept.filter((entry) => entry.type !== 'skeleton');
  return written.length > 0 ? written : kept;
}

/** A gallery photo as far as the card counts it. */
interface GalleryFact {
  photo_id: number;
  taken_at: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * A gallery's photos, how many of them carry the time taken and a position,
 * and how many are the user's own (`own`): counted among these photos, so a
 * video of theirs is not.
 */
function galleryOf(photos: readonly GalleryFact[], own: ReadonlySet<number>): BookCardGallery {
  return {
    photos: photos.length,
    withTime: photos.filter((photo) => !!photo.taken_at).length,
    withGps: photos.filter((photo) => photo.lat !== null && photo.lng !== null).length,
    own: photos.filter((photo) => own.has(photo.photo_id)).length,
  };
}

/**
 * Reads the journey a Studio conversation is about, with the user's rights:
 * whether they may open it and change its book, and its card for a turn.
 */
@Injectable()
export class AssistantBookContext {
  constructor(
    private readonly journeys: JourneyDomainService,
    private readonly books: JourneyBookEditService,
    private readonly photos: PhotoSignalsService,
    // Which gallery photos are the user's own, the ones a page image may draw.
    private readonly aiPhotos: JourneyAiPhotosService,
  ) {}

  /** Whether the user may open the journey: its owner and every contributor. */
  async canOpen(userId: number, journeyId: number): Promise<boolean> {
    return (await this.journeys.canAccessJourney(journeyId, userId)) !== null;
  }

  /** Whether the user may change the journey's book: its owner and editors. */
  canEdit(userId: number, journeyId: number): Promise<boolean> {
    return this.journeys.canEdit(journeyId, userId);
  }

  /**
   * The card of one turn. The book is read as get_book reads it, so a journey
   * the user can no longer open is refused there (404), as by every tool; the
   * entries are read as list_journey_entries reads them and the gallery as
   * suggest_book_photos reads it, its photos of the user's own as a page image
   * draws them. The journey row, read once, names its owner.
   */
  async cardOf(userId: number, journeyId: number, focus: AssistantFocus | null): Promise<BookCard> {
    const book = await this.books.overview(journeyId, userId);
    const journey = await this.journeys.canAccessJourney(journeyId, userId);
    const role = await this.roleOf(userId, journeyId, journey?.user_id === userId);
    const entries = (await this.journeys.listEntries(journeyId, userId)) ?? [];
    const gallery = journey ? await this.photos.galleryFacts(journeyId) : [];
    const own = journey ? await this.aiPhotos.ownPhotoIds(journeyId, userId) : new Set<number>();
    return {
      journeyId,
      title: journey?.title ?? '',
      subtitle: journey?.subtitle ?? null,
      role,
      book,
      gallery: galleryOf(gallery, own),
      entries: listedEntries(entries).map((entry) => ({
        id: entry.id,
        date: entry.entry_date,
        title: entry.title ?? null,
        place: entry.location_name ?? null,
        photos: entry.photos.length,
      })),
      focus,
    };
  }

  private async roleOf(userId: number, journeyId: number, owner: boolean): Promise<BookRole> {
    if (owner) return 'owner';
    return (await this.canEdit(userId, journeyId)) ? 'editor' : 'viewer';
  }
}
