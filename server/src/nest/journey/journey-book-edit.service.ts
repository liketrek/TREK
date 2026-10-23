import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';
import type { JourneyPhotosRepository } from '../../db/repositories/JourneyPhotos.repository';
import { DomainError } from '../common/domain-error';
import { PhotoSignalsService } from '../photos/photo-signals.service';
import { SettingsService } from '../settings/settings.service';
import { canonical } from './book-design-apply';
import { BookDesignDraftStore, designExpired } from './book-design-draft.store';
import { bookEntriesOf } from './book-journey-input';
import { bookLanguage, loadBookWords, type BookWords } from './book-travel-labels';
import { JourneyBookService } from './journey-book.service';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  addBookPages,
  applyBookOps,
  autoEntriesWithStops,
  blankBook,
  BOOK_OP_LIMITS,
  bookPageSetupSchema,
  bookPath,
  deleteBookPages,
  describeSpread,
  duplicateBookPage,
  listBookLayouts,
  moveBookPage,
  removeBookLayout,
  restoreBookLayout,
  restoreBookPage,
  saveBookLayout,
  setBookCover,
  setBookSetup,
  spreadFindings,
  summarizeBook,
  summarizeSpread,
  type AddBookPagesRequest,
  type BookDocument,
  type BookEditResult,
  type BookOpError,
  type BookOpsContext,
  type BookOverview,
  type BookPageDescription,
  type BookPageDigest,
  type BookPhotoInfo,
  type BookPreviousSpread,
  type BookSpread,
  type BookSpreadSummary,
  type BookTravelContext,
  type BookWriteResult,
  type CreateBookRequest,
  type DeleteBookPagesRequest,
  type DuplicateBookPageRequest,
  type EditBookPageRequest,
  type MoveBookPageRequest,
  type RemoveBookLayoutRequest,
  type RestoreBookLayoutRequest,
  type RestoreBookPageRequest,
  type SaveBookLayoutRequest,
  type SetBookCoverRequest,
  type SetBookSetupRequest,
} from '@trek/shared';

import { createHash } from 'node:crypto';

/** A book write's answer, in the shared result's shape. */
export type BookWriteAnswer = BookWriteResult;

/** A book as a held change is tried on: the stored document (null without a book), its version, the context. */
export interface BookTrialBase {
  doc: BookDocument | null;
  version: number | null;
  ctx: BookOpsContext;
}

/** One write as the engine runs it: the stored document (null without a book) and the journey in, a result out. */
type BookChange = (doc: BookDocument | null, ctx: BookOpsContext) => BookEditResult;

/** A successful engine result. */
type BookMade = Extract<BookEditResult, { ok: true }>;

/** What of the journey a binding reads. */
interface JourneyWords {
  title: string;
  subtitle?: string | null;
}

/** How one write answers beyond the pages it touched. */
interface WriteOptions {
  returnPrevious?: boolean;
  expectedVersion?: number;
  /** More of the answer, from the book as it was before the write and what the engine made. */
  extra?: (before: BookDocument | null, made: BookMade) => Partial<BookWriteResult>;
  /** The engine needs the journey's figures, route and entries (travel elements, a page laid out again). */
  travel?: boolean;
}

/**
 * The assistant's and every MCP client's way to read and change a TREK Studio
 * book (journey-book.mcp.ts), one page at a time.
 *
 * The edits themselves are the shared engine (shared/src/book/), pure and the
 * same one the Studio previews and a chat card draws with. What needs I/O
 * stays here: the journey's access, its gallery and entries for the engine to
 * check ids against, and the answer a model reads. Every write goes through
 * `JourneyBookService.editBook`, so it is one transaction against the stored
 * version, refused whole when an operation is refused, and announced after the
 * commit like a save from the Studio.
 *
 * The rights are the save route's: any member reads, the owner and editors
 * write, a viewer is refused (403), an outsider is told the journey is not
 * there (404). Unlike the save route a tool may only bring in photos of the
 * journey's own gallery: the REST save stays as it is.
 */
@Injectable()
export class JourneyBookEditService {
  constructor(
    private readonly books: JourneyBookService,
    private readonly journey: JourneyDomainService,
    @InjectRepository(JourneyPhotos) private readonly photosRepo: JourneyPhotosRepository,
    @InjectRepository(JourneyEntries) private readonly entriesRepo: JourneyEntriesRepository,
    // The originals' sizes for the print check, and the colours and calm areas the design findings read.
    private readonly signals: PhotoSignalsService,
    // The user's language, for the words the travel elements print.
    private readonly settings: SettingsService,
    // describe_book_page and a preview may look at a page of a design draft instead of the book.
    private readonly drafts: BookDesignDraftStore,
  ) {}

  /** The words of each language, read once from its locale table. */
  private readonly words = new Map<string, Promise<BookWords>>();

  // ── Reads ────────────────────────────────────────────────────────────────

  /** `get_book`: the book without its document; a journey without one answers `exists: false`. */
  async overview(journeyId: number, userId: number): Promise<BookOverview> {
    const { record } = await this.readable(journeyId, userId);
    return summarizeBook(record?.document ?? null, record?.version ?? null);
  }

  /**
   * `describe_book_page`: one page in words, with its findings and its
   * elements; with `designId` the page of that design draft (design_book).
   */
  async describePage(
    journeyId: number,
    userId: number,
    spreadId: string,
    designId?: string,
  ): Promise<BookPageDescription> {
    const { journey, record } = await this.readable(journeyId, userId);
    const doc = designId ? (await this.draftOf(userId, journeyId, designId)).doc : record?.document;
    if (!doc) throw noBook();
    const ctx = await this.context(journeyId, journey);
    const described = describeSpread(doc, spreadId, ctx.photos);
    if (!described) throw pageNotFound(spreadId);
    return described;
  }

  /** `list_book_layouts`: the layouts a page can take, with what each does to what is on it. */
  async layouts(journeyId: number, userId: number, role?: 'inner' | 'single') {
    const { record } = await this.readable(journeyId, userId);
    const doc = record?.document ?? null;
    return listBookLayouts(doc, doc?.page ?? bookPageSetupSchema.parse({}), role);
  }

  /**
   * The stored book and what the engine checks a change against (the
   * gallery, the entries), for a change that is only tried: the assistant runs
   * a held book write on it before the user sees its card, so it can refuse
   * what the engine would refuse and show what the page would become. A
   * member's read, like `get_book`; nothing is written. With `designId` the
   * base is that design draft at the version it was made against (a preview
   * of a draft page).
   */
  async trialBase(journeyId: number, userId: number, designId?: string): Promise<BookTrialBase> {
    const { journey, record } = await this.readable(journeyId, userId);
    const ctx = { ...(await this.context(journeyId, journey)), travel: await this.travelContext(journeyId, userId) };
    if (designId) {
      const draft = await this.draftOf(userId, journeyId, designId);
      return { doc: draft.doc, version: draft.baseVersion ?? 0, ctx };
    }
    return { doc: record?.document ?? null, version: record?.version ?? null, ctx };
  }

  /**
   * What the travel elements read: the journey's figures, its recorded route
   * thinned for a page, its entries with their stops, and the words in the
   * user's language. Read with the user's rights; a journey without figures
   * has none (`stats: null`), and the engine refuses travel values then.
   */
  async travelContext(journeyId: number, userId: number): Promise<BookTravelContext> {
    const stats = await this.journey.journeyStats(journeyId, userId);
    const tracks = (await this.journey.journeyTracks(journeyId, userId)) ?? [];
    const rows = (await this.journey.listEntries(journeyId, userId)) ?? [];
    const words = await this.wordsFor(userId);
    return {
      locale: words.locale,
      labels: words.labels,
      stats,
      path: bookPath(tracks),
      entries: autoEntriesWithStops(bookEntriesOf(rows), stats),
    };
  }

  /** The words the book prints in the user's language, and that language's locale. */
  async wordsFor(userId: number): Promise<BookWords> {
    const language = bookLanguage((await this.settings.getUserSettings(userId)).language);
    let known = this.words.get(language);
    if (known === undefined) {
      known = loadBookWords(language);
      this.words.set(language, known);
    }
    return known;
  }

  /** The user's design draft for this journey; 410 once it is gone. */
  private async draftOf(userId: number, journeyId: number, designId: string) {
    const draft = await this.drafts.get(userId, journeyId, designId);
    if (!draft) throw designExpired();
    return draft;
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /** A blank book (cover, first page, one spread, last page, back) for a journey that has none. */
  async createBook(journeyId: number, userId: number, args: CreateBookRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc, ctx) => {
      if (doc) {
        throw new DomainError(409, 'This journey has a book already', {
          code: 'book_exists',
          mcpMessage: 'This journey has a book already: read it with get_book and change it instead.',
        });
      }
      const title = args.title?.trim() || ctx.journey?.title || '';
      const book = blankBook({ title, preset: args.preset });
      const ids = book.spreads.map((s) => s.id);
      return { ok: true, doc: book, spreadIds: ids, created: ids, dropped: [] };
    });
  }

  async addPages(journeyId: number, userId: number, args: AddBookPagesRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc, ctx) => addBookPages(stored(doc), args, ctx));
  }

  /**
   * The answer's `from_index` is where the page stood, so the assistant's undo
   * can move it back; that undo names `expectedVersion`, so it never moves a
   * page over a later save (409 instead).
   */
  async movePage(journeyId: number, userId: number, args: MoveBookPageRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc) => moveBookPage(stored(doc), args), {
      expectedVersion: args.expectedVersion,
      extra: (before) => {
        const from = before?.spreads.findIndex((s) => s.id === args.spreadId) ?? -1;
        return from >= 0 ? { from_index: from } : {};
      },
    });
  }

  /** The assistant's undo of new pages names `expectedVersion`, so it never deletes a page someone saved since. */
  async deletePages(journeyId: number, userId: number, args: DeleteBookPagesRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc) => deleteBookPages(stored(doc), args), {
      returnPrevious: args.returnPrevious,
      expectedVersion: args.expectedVersion,
    });
  }

  async editPage(journeyId: number, userId: number, args: EditBookPageRequest): Promise<BookWriteAnswer> {
    const edit = { spreadId: args.spreadId, ops: args.ops };
    return this.write(journeyId, userId, (doc, ctx) => applyBookOps(stored(doc), edit, ctx), {
      returnPrevious: args.returnPrevious,
      travel: true,
    });
  }

  async setCover(journeyId: number, userId: number, args: SetBookCoverRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc, ctx) => setBookCover(stored(doc), args, ctx), {
      returnPrevious: args.returnPrevious,
    });
  }

  /**
   * Pages put back as they were, for the assistant's undo: all the pages one
   * change answered under `previous_spreads` in one call, and only while the
   * book is still at `expectedVersion`, so an undo never overwrites what anyone
   * saved after the change it takes back (409 instead). `expectedPages` (the
   * change's `page_digests`) are checked in the write's transaction: every
   * page they name must still be as the change left them. They stand in for
   * the version only when they name every page put back with a digest, so
   * "undo all" over several page edits takes each back while a later save to
   * another page stands; a page put back that they do not name, or name as
   * gone (a deleted page goes back at its old index, which means the same
   * only at the version), keeps the whole book's check, and so does an MCP
   * client that names only the version. The engine holds a restore to an
   * edit's rules: photos from the gallery or the book, locked elements as
   * they are.
   */
  async restorePage(journeyId: number, userId: number, args: RestoreBookPageRequest): Promise<BookWriteAnswer> {
    const pinned = args.expectedPages;
    const covered = pinned !== undefined && args.pages.every((page) => digestNamed(pinned, page.spread.id));
    return this.write(
      journeyId,
      userId,
      (doc, ctx) => {
        const book = stored(doc);
        if (pinned && !pagesAsLeft(book, pinned)) throw pageMoved();
        return restoreBookPage(book, args, ctx);
      },
      { expectedVersion: covered ? undefined : args.expectedVersion },
    );
  }

  /**
   * `set_book_setup`: the page format and the page numbers, elements not
   * rescaled; the answer holds the setup as it was under `previous_setup`.
   * The assistant's undo sets it back naming `expectedVersion`.
   */
  async setSetup(journeyId: number, userId: number, args: SetBookSetupRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc) => setBookSetup(stored(doc), args), {
      expectedVersion: args.expectedVersion,
      extra: (before) => (before ? { previous_setup: before.page } : {}),
    });
  }

  /** `duplicate_book_page`: a copy of an inner page with new ids, right after it. */
  async duplicatePage(journeyId: number, userId: number, args: DuplicateBookPageRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc, ctx) => duplicateBookPage(stored(doc), args, ctx));
  }

  /** `save_book_layout`: a page's arrangement kept as one of the book's own layouts; `layout_id` names it. */
  async saveLayout(journeyId: number, userId: number, args: SaveBookLayoutRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc, ctx) => saveBookLayout(stored(doc), args, ctx), {
      extra: (_before, made) => (made.created[0] ? { layout_id: made.created[0] } : {}),
    });
  }

  /** `remove_book_layout`: one of the book's own layouts taken away; `previous_layout` puts it back. */
  async removeLayout(journeyId: number, userId: number, args: RemoveBookLayoutRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc) => removeBookLayout(stored(doc), args), {
      expectedVersion: args.expectedVersion,
      extra: (before) => {
        const layout = before?.layouts?.find((l) => l.id === args.layoutId);
        return layout ? { previous_layout: layout } : {};
      },
    });
  }

  /**
   * `restore_book_layout`, the assistant's undo of `remove_book_layout`: the
   * layout it answered put back, only while the book is at `expectedVersion`.
   * The layout comes as JSON and is parsed again like any argument.
   */
  async restoreLayout(journeyId: number, userId: number, args: RestoreBookLayoutRequest): Promise<BookWriteAnswer> {
    return this.write(journeyId, userId, (doc) => restoreBookLayout(stored(doc), parsedJson(args.layout)), {
      expectedVersion: args.expectedVersion,
    });
  }

  // ── The pieces ───────────────────────────────────────────────────────────

  /** The journey as a member sees it and its book. 404 for anyone else. */
  private async readable(journeyId: number, userId: number) {
    const journey = await this.journey.canAccessJourney(journeyId, userId);
    if (!journey) throw journeyNotFound();
    const record = await this.books.getBook(journeyId, userId);
    return { journey, record };
  }

  /**
   * The gallery and the entries, for the engine: a photo an operation brings in
   * must be in the gallery, an entry a page or a binding names must be the
   * journey's. A photo's size is its original's as the pixel signals measured
   * it (`trek_photo_signals`), never `trek_photos.width/height`, which hold a
   * thumbnail's size for an uploaded photo and nothing for a provider's: the
   * print check reads the original's or says nothing. The colours, the busy
   * grid and the salient point come with it for the design findings.
   */
  private async context(journeyId: number, journey: JourneyWords): Promise<BookOpsContext> {
    const gallery = await this.photosRepo.galleryRead(journeyId);
    const entries = await this.entriesRepo.listForJourney(journeyId);
    const measured = await this.signals.bookSignals(gallery.map((p) => p.photo_id));
    return {
      photos: gallery.map((p): BookPhotoInfo => ({
        photoId: p.photo_id,
        caption: p.caption ?? null,
        ...measured.get(p.photo_id),
      })),
      journey: {
        title: journey.title,
        subtitle: journey.subtitle ?? null,
        entries: entries.map((e) => ({
          id: e.id,
          title: e.title ?? null,
          story: e.story ?? null,
          location: e.location_name ?? null,
        })),
      },
    };
  }

  /**
   * One write: the change run on the stored document inside `editBook`'s
   * transaction, with the gallery and the entries read in that same
   * transaction, so a photo taken out of the gallery a moment before cannot be
   * placed. A refusal from the engine throws there, so the transaction rolls
   * back with nothing written or sent. An engine answer that is the stored
   * document itself changed nothing, and nothing is written.
   */
  private async write(
    journeyId: number,
    userId: number,
    change: BookChange,
    options: WriteOptions = {},
  ): Promise<BookWriteAnswer> {
    const journey = await this.journey.canAccessJourney(journeyId, userId);
    if (!journey) throw journeyNotFound();
    // Read before the transaction: the figures take a while and need not be read in it.
    const travel = options.travel ? await this.travelContext(journeyId, userId) : undefined;
    const { record, result } = await this.books.editBook(
      journeyId,
      userId,
      async (current) => {
        const ctx = { ...(await this.context(journeyId, journey)), ...(travel ? { travel } : {}) };
        const before = current?.document ?? null;
        const made = change(before, ctx);
        if (made.ok === false) throw refused(made.error);
        const unchanged = before !== null && made.doc === before;
        const title = current?.title ?? made.doc.title;
        return { title, document: made.doc, unchanged, result: { before, made, ctx } };
      },
      { expectedVersion: options.expectedVersion },
    );
    const answer = pagesOf(record.document, result.made, result.ctx);
    return {
      version: record.version,
      spread_ids: result.made.spreadIds,
      pages: answer.pages,
      findings: answer.findings,
      dropped: result.made.dropped,
      ...(options.returnPrevious
        ? {
            previous_spreads: previousOf(result.before, result.made.spreadIds),
            page_digests: digestsOf(record.document, result.made.spreadIds),
          }
        : {}),
      ...options.extra?.(result.before, result.made),
    };
  }
}

/** A page as the book stores it, as a restore checks it: a digest of its canonical JSON. */
function pageDigest(spread: BookSpread): string {
  return createHash('sha256').update(canonical(spread)).digest('hex').slice(0, 16);
}

/** The pages a write touched as it left them; null for one it took out of the book. */
function digestsOf(doc: BookDocument, spreadIds: readonly string[]): BookPageDigest[] {
  return spreadIds.map((spreadId) => {
    const spread = doc.spreads.find((s) => s.id === spreadId);
    return { spreadId, digest: spread ? pageDigest(spread) : null };
  });
}

/** The digests name this page as the write left it in the book, not as one it took out. */
function digestNamed(expected: readonly BookPageDigest[], spreadId: string): boolean {
  return expected.some((row) => row.spreadId === spreadId && row.digest !== null);
}

/** Every page named is as its digest says: there and unchanged, or still gone for a null digest. */
function pagesAsLeft(doc: BookDocument, expected: readonly BookPageDigest[]): boolean {
  return expected.every(({ spreadId, digest }) => {
    const spread = doc.spreads.find((s) => s.id === spreadId);
    return spread ? digest !== null && pageDigest(spread) === digest : digest === null;
  });
}

/** The pages a write touched as they are stored now, with their findings, severe first and capped. */
function pagesOf(doc: BookDocument, made: BookMade, ctx: BookOpsContext) {
  const pages: BookSpreadSummary[] = [];
  const findings: BookWriteResult['findings'] = [];
  for (const id of made.spreadIds) {
    const index = doc.spreads.findIndex((s) => s.id === id);
    const spread = doc.spreads[index];
    if (!spread) continue;
    pages.push(summarizeSpread(spread, index));
    findings.push(...spreadFindings(spread, doc.page, ctx.photos));
  }
  const order = { severe: 0, warn: 1, info: 2 } as const;
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { pages, findings: findings.slice(0, BOOK_OP_LIMITS.findings) };
}

/**
 * The pages as they were before the write, lowest index first, for the
 * assistant's undo (`restore_book_page` puts them back in that order, so each
 * index means what it meant before). Only pages that existed before.
 */
function previousOf(before: BookDocument | null, spreadIds: readonly string[]): BookPreviousSpread[] {
  if (!before) return [];
  return before.spreads.flatMap((spread, index) => (spreadIds.includes(spread.id) ? [{ index, spread }] : []));
}

/** A JSON argument read back; what does not parse reaches the engine as nothing, which it refuses. */
function parsedJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Every write but `create_book` needs a book to change. */
function stored(doc: BookDocument | null): BookDocument {
  if (!doc) throw noBook();
  return doc;
}

function journeyNotFound(): DomainError {
  return new DomainError(404, 'Journey not found', { mcpMessage: 'Journey not found or access denied.' });
}

function noBook(): DomainError {
  return new DomainError(404, 'This journey has no book yet', {
    code: 'book_missing',
    mcpMessage: 'This journey has no book yet: create_book makes one.',
  });
}

/** A page a restore names was saved since the change it takes back: the 409 a moved book gets. */
function pageMoved(): DomainError {
  return new DomainError(409, 'Book was changed by someone else', {
    code: 'book_conflict',
    mcpMessage: 'A page was changed since that change. Read the book again with get_book before changing it.',
  });
}

function pageNotFound(spreadId: string): DomainError {
  return new DomainError(404, `No page ${spreadId} in this book`, {
    code: 'book_page_missing',
    mcpMessage: `The book has no page ${spreadId}: get_book lists the pages with their ids.`,
  });
}

/**
 * An operation the engine refused, as a 422 that names it: which of the
 * call's operations (from 0) and the engine's sentence, which says what to do.
 */
function refused(error: BookOpError): DomainError {
  const message = error.opIndex === null ? error.message : `ops[${error.opIndex}]: ${error.message}`;
  return new DomainError(422, message, {
    code: `book_${error.code}`,
    details: {
      code: error.code,
      opIndex: error.opIndex,
      ...(error.elementId ? { elementId: error.elementId } : {}),
    },
  });
}
