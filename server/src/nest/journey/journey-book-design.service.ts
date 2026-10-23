import { JourneyBookRevisions } from '../../db/entities/JourneyBookRevisions.entity';
import { JourneyEntryPhotos } from '../../db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import { JOURNEY_BOOK_REVISION_DOCUMENT } from '../../db/json-columns';
import type { JourneyBookRevisionsRepository } from '../../db/repositories/JourneyBookRevisions.repository';
import type { JourneyEntryPhotosRepository } from '../../db/repositories/JourneyEntryPhotos.repository';
import type { JourneyPhotosRepository } from '../../db/repositories/JourneyPhotos.repository';
import { decodeJson } from '../../utils/json-column';
import { DomainError } from '../common/domain-error';
import { PhotoSignalsService } from '../photos/photo-signals.service';
import { applyDesignDraft } from './book-design-apply';
import {
  BOOK_DESIGN_DRAFTS,
  BookDesignDraftStore,
  designExpired,
  type BookDesignDraft,
} from './book-design-draft.store';
import { JourneyBookEditService } from './journey-book-edit.service';
import { JourneyBookService } from './journey-book.service';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  applyBookOps,
  BOOK_DESIGN_LIMITS,
  BOOK_OP_LIMITS,
  bookPageSetupForPreset,
  describeSpread,
  designBook,
  normalizeBookDocument,
  sortBookFindings,
  spreadFindings,
  summarizeSpread,
  type ApplyBookDesignRequest,
  type BookDesignAnswer,
  type BookDesignApplyResult,
  type BookDesignDirectivesInput,
  type BookDesignDraftResponse,
  type BookDesignInput,
  type BookDesignPlanRow,
  type BookDesignRevisionAnswer,
  type BookDesignSelectionResponse,
  type BookDocument,
  type BookOpError,
  type BookPhotoInfo,
  type BookRecord,
  type BookWriteResult,
  type PhotoPickCandidate,
  type RestoreBookRevisionRequest,
  type ReviseBookDesignRequest,
} from '@trek/shared';

import { randomUUID } from 'node:crypto';

/**
 * The assistant designs the whole photo book (journey-studio-wp13.md 6.1).
 *
 * `design_book` gathers the journey as the Studio's Auto layout reads it
 * (entries with their stops, the gallery with its pixel signals, the figures
 * and the recorded route, the words in the user's language), runs the shared
 * design engine on the stored book and keeps the result as a draft, nothing
 * written. `revise_book_design` changes one page of the draft with the
 * operations `edit_book_page` takes; the proposal card narrows which pages
 * the apply writes. `apply_book_design` writes the chosen pages in one
 * transaction against the stored version, keeping the book as it was as a
 * revision in the same transaction, and announces it once after the commit;
 * `restore_book_revision` puts that revision back, only at the version the
 * apply left.
 *
 * The rights are the book's: a draft is made and applied by the owner and
 * editors only (a viewer gets 403, an outsider 404), and a draft is its
 * maker's alone.
 */
@Injectable()
export class JourneyBookDesignService {
  constructor(
    private readonly journey: JourneyDomainService,
    private readonly books: JourneyBookService,
    private readonly edits: JourneyBookEditService,
    private readonly signals: PhotoSignalsService,
    private readonly drafts: BookDesignDraftStore,
    @InjectRepository(JourneyPhotos) private readonly photosRepo: JourneyPhotosRepository,
    @InjectRepository(JourneyEntryPhotos) private readonly entryPhotosRepo: JourneyEntryPhotosRepository,
    @InjectRepository(JourneyBookRevisions) private readonly revisionsRepo: JourneyBookRevisionsRepository,
  ) {}

  // ── Draft ────────────────────────────────────────────────────────────────

  /** `design_book`: a whole book designed over the stored one and kept as a draft. */
  async design(
    journeyId: number,
    userId: number,
    directives: BookDesignDirectivesInput = {},
  ): Promise<BookDesignAnswer> {
    const journey = await this.requireEditor(journeyId, userId);
    const record = await this.books.getBook(journeyId, userId);
    const input = await this.inputFor(journeyId, userId, journey, record);
    const result = designBook(record?.document ?? null, input, directives);
    const freshBook = directives.keep === 'nothing';
    const draft: BookDesignDraft = {
      designId: `d-${randomUUID()}`,
      userId,
      journeyId,
      baseVersion: record?.version ?? null,
      base: record?.document ?? null,
      doc: result.doc,
      plan: result.plan,
      // A stored page goes only when the person asked for a fresh book or picks it on the card.
      selection: result.plan
        .filter((row) => row.action !== 'keep' && (row.action !== 'drop' || freshBook))
        .map((row) => row.spreadId),
      style: { style: directives.style ?? 'classic', ...result.style },
      usedPhotos: result.photos.used.length,
      leftOut: result.photos.left_out,
      findings: result.findings,
      notes: result.notes,
      expiresAt: Date.now() + BOOK_DESIGN_DRAFTS.ttlMs,
    };
    await this.drafts.put(draft);
    return answerOf(draft);
  }

  /** `get_book_design`: a draft in words again, as design_book answered it, with what is chosen now. */
  async describeDraft(journeyId: number, userId: number, designId: string): Promise<BookDesignAnswer> {
    await this.requireAccess(journeyId, userId);
    return answerOf(await this.draftOf(userId, journeyId, designId));
  }

  /**
   * `revise_book_design`: one page of the draft changed with the operations
   * `edit_book_page` takes, checked against the journey's gallery, entries
   * and figures like an edit of the book. A kept page that is revised is
   * proposed for the apply like any other.
   */
  async revise(journeyId: number, userId: number, args: ReviseBookDesignRequest): Promise<BookDesignRevisionAnswer> {
    await this.requireEditor(journeyId, userId);
    const draft = await this.draftOf(userId, journeyId, args.designId);
    const { ctx } = await this.edits.trialBase(journeyId, userId);
    const made = applyBookOps(draft.doc, { spreadId: args.spreadId, ops: args.ops }, ctx);
    if (made.ok === false) throw refused(made.error);
    const described = describeSpread(made.doc, args.spreadId, ctx.photos);
    const index = made.doc.spreads.findIndex((s) => s.id === args.spreadId);
    const spread = made.doc.spreads[index];
    if (!described || !spread) throw new DomainError(404, `No page ${args.spreadId} in this design`);
    const findings = described.findings;
    const count = (severity: 'severe' | 'warn') => findings.filter((f) => f.severity === severity).length;
    const plan = draft.plan.map((row): BookDesignPlanRow =>
      row.spreadId === args.spreadId
        ? {
            ...row,
            action: row.action === 'keep' ? 'replace' : row.action,
            photoIds: summarizeSpread(spread, index).photoIds,
            findings: { severe: count('severe'), warn: count('warn') },
          }
        : row,
    );
    const row = plan.find((r) => r.spreadId === args.spreadId);
    const action = row?.action ?? 'replace';
    const selection = draft.selection.includes(args.spreadId) ? draft.selection : [...draft.selection, args.spreadId];
    await this.drafts.put({ ...draft, doc: made.doc, plan, selection });
    const page = summarizeSpread(spread, index);
    return { design_id: draft.designId, page, action, findings: findings.slice(0, BOOK_DESIGN_LIMITS.findings) };
  }

  /** GET .../book-designs/:designId: the draft and its plan for the proposal card; the maker's alone. */
  async draftView(journeyId: number, userId: number, designId: string): Promise<BookDesignDraftResponse> {
    await this.requireAccess(journeyId, userId);
    const draft = await this.draftOf(userId, journeyId, designId);
    return {
      designId: draft.designId,
      baseVersion: draft.baseVersion,
      expiresAt: new Date(draft.expiresAt).toISOString(),
      document: draft.doc,
      plan: draft.plan.slice(0, BOOK_DESIGN_LIMITS.selection).map(planRowOut),
      selection: draft.selection,
    };
  }

  /** PUT .../book-designs/:designId/selection: the pages the apply writes, each one the plan changes. */
  async select(
    journeyId: number,
    userId: number,
    designId: string,
    spreadIds: readonly string[],
  ): Promise<BookDesignSelectionResponse> {
    await this.requireEditor(journeyId, userId);
    const draft = await this.draftOf(userId, journeyId, designId);
    const changing = new Set(draft.plan.filter((row) => row.action !== 'keep').map((row) => row.spreadId));
    const unknown = spreadIds.find((id) => !changing.has(id));
    if (unknown !== undefined) {
      throw new DomainError(422, `The design does not change page ${unknown}`, { code: 'book_design_page_unknown' });
    }
    const selection = [...new Set(spreadIds)];
    await this.drafts.put({ ...draft, selection });
    return { selection };
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /**
   * `apply_book_design`: the chosen pages of the draft written in one
   * transaction, the book as it was kept as a revision in it. A page someone
   * changed since the design, or whose photos left the gallery, stays as it
   * is and is named under `skipped`; nothing applied is a 409.
   */
  async apply(journeyId: number, userId: number, args: ApplyBookDesignRequest): Promise<BookDesignApplyResult> {
    // The rights come before the draft: a viewer or an outsider holds none, and is told 403 or 404, not 410.
    await this.requireEditor(journeyId, userId);
    const draft = await this.draftOf(userId, journeyId, args.designId);
    const { record, result, revisionId } = await this.books.editBook(
      journeyId,
      userId,
      async (current) => {
        const gallery = await this.photosRepo.galleryRead(journeyId);
        const merged = applyDesignDraft(current?.document ?? null, draft, new Set(gallery.map((p) => p.photo_id)));
        if (merged.applied.length === 0) throw nothingApplied();
        return { title: current?.title ?? merged.doc.title, document: merged.doc, result: merged };
      },
      { expectedVersion: args.expectedVersion, keepRevision: true },
    );
    await this.drafts.remove(userId, journeyId, draft.designId);
    return {
      ...pagesAnswer(record, result.applied),
      design_id: draft.designId,
      revision_id: revisionId,
      applied: result.applied,
      skipped: result.skipped,
    };
  }

  /**
   * `restore_book_revision`, the assistant's undo of an applied design: the
   * book put back as the apply found it, only while it is still at
   * `expectedVersion`, so nothing saved since is overwritten (409 instead).
   */
  async restoreRevision(journeyId: number, userId: number, args: RestoreBookRevisionRequest): Promise<BookWriteResult> {
    const { record } = await this.books.editBook(
      journeyId,
      userId,
      async (current) => {
        const revision = await this.revisionsRepo.findForJourney(args.revisionId, journeyId);
        if (!revision) {
          throw new DomainError(404, 'No such revision of this book', {
            code: 'book_revision_missing',
            mcpMessage: 'This book keeps no such revision any more; it cannot be put back.',
          });
        }
        // A revision that does not read back is refused, never written over the book as an empty one.
        const stored = decodeJson(JOURNEY_BOOK_REVISION_DOCUMENT, revision.document, `revision ${revision.id}`);
        if (!stored) throw revisionUnreadable();
        const document = normalizeBookDocument(stored);
        return { title: current?.title ?? document.title, document, result: null };
      },
      { expectedVersion: args.expectedVersion },
    );
    return pagesAnswer(
      record,
      record.document.spreads.map((s) => s.id),
    );
  }

  // ── The pieces ───────────────────────────────────────────────────────────

  /** The journey for a member, else 404. */
  private async requireAccess(journeyId: number, userId: number) {
    const journey = await this.journey.canAccessJourney(journeyId, userId);
    if (!journey) throw journeyNotFound();
    return journey;
  }

  /** The journey for its owner or an editor; 403 for a viewer, 404 for anyone else. */
  private async requireEditor(journeyId: number, userId: number) {
    const journey = await this.requireAccess(journeyId, userId);
    if (await this.journey.canEdit(journeyId, userId)) return journey;
    throw new DomainError(403, 'Not allowed', {
      code: 'book_read_only',
      mcpMessage: "You can read this journey's book but not change it: only its owner and editors can.",
    });
  }

  private async draftOf(userId: number, journeyId: number, designId: string): Promise<BookDesignDraft> {
    const draft = await this.drafts.get(userId, journeyId, designId);
    if (!draft) throw designExpired();
    return draft;
  }

  /**
   * The journey as the design engine reads it: the entries with their stops
   * and the words (travelContext), the gallery's photos as picking candidates
   * with their signals (measured now where they are missing, waited for a
   * bounded time) and as the book engine knows them (original sizes, colours,
   * calm areas), the gallery's loose photos, and the book's page format.
   */
  private async inputFor(
    journeyId: number,
    userId: number,
    journey: { title: string; subtitle?: string | null },
    record: BookRecord | null,
  ): Promise<BookDesignInput> {
    const travel = await this.edits.travelContext(journeyId, userId);
    const facts = await this.signals.galleryFacts(journeyId);
    const links = await this.entryPhotosRepo.listForJourney(journeyId);
    const ids = facts.map((f) => f.photo_id);
    const { byPhoto } = await this.signals.signalsFor(ids);
    const measured = await this.signals.bookSignals(ids);
    const listed = new Set(travel.entries.map((e) => e.id));
    const entriesOf = new Map<number, number[]>();
    for (const link of links) {
      if (!listed.has(link.entry_id)) continue;
      entriesOf.set(link.photo_id, [...(entriesOf.get(link.photo_id) ?? []), link.entry_id]);
    }
    const inBook = photosInBook(record?.document ?? null);
    const candidates: PhotoPickCandidate[] = facts.map((f) => ({
      photoId: f.photo_id,
      takenAt: f.taken_at,
      lat: f.lat,
      lng: f.lng,
      width: f.width,
      height: f.height,
      caption: f.caption,
      entryIds: entriesOf.get(f.photo_id) ?? [],
      inBook: inBook.has(f.photo_id),
      signals: byPhoto.get(f.photo_id) ?? null,
    }));
    const photos = facts.map((f): BookPhotoInfo => ({
      photoId: f.photo_id,
      caption: f.caption,
      ...measured.get(f.photo_id),
    }));
    const labels = travel.labels;
    return {
      locale: travel.locale,
      title: journey.title,
      subtitle: journey.subtitle ?? null,
      coverPhotoId: facts[0]?.photo_id ?? null,
      entries: [...travel.entries],
      page: record?.document.page ?? bookPageSetupForPreset('square-210'),
      stats: travel.stats,
      path: travel.path,
      stationsLabel: labels.stations,
      dayLabel: labels.day,
      summaryLabel: labels.summary,
      countriesLabel: labels.countries,
      distanceLabel: labels.distance,
      prosLabel: labels.pros,
      consLabel: labels.cons,
      candidates,
      photos,
      gallery: facts.map((f) => ({ photoId: f.photo_id, width: f.width, height: f.height, caption: f.caption })),
    };
  }
}

/** A plan row as an answer carries it: the chapter cut to what a row holds. */
function planRowOut(row: BookDesignPlanRow): BookDesignPlanRow {
  return { ...row, chapter: row.chapter ? row.chapter.slice(0, 80) : null };
}

/** The draft in words, the plan and the photos left out cut to what an answer holds. */
function answerOf(draft: BookDesignDraft): BookDesignAnswer {
  const rows = draft.plan.slice(0, BOOK_DESIGN_LIMITS.planRows).map(planRowOut);
  const leftOut = draft.leftOut.slice(0, BOOK_DESIGN_LIMITS.leftOut);
  return {
    design_id: draft.designId,
    journey_id: draft.journeyId,
    base_version: draft.baseVersion,
    expires_at: new Date(draft.expiresAt).toISOString(),
    plan: rows,
    more_rows: draft.plan.length - rows.length,
    selected: draft.selection.slice(0, BOOK_DESIGN_LIMITS.selection),
    style: draft.style,
    photos: {
      used: draft.usedPhotos,
      left_out: leftOut.map((l) => ({ photoId: l.photoId, reason: l.reason })),
      left_out_more: draft.leftOut.length - leftOut.length,
    },
    findings: draft.findings.slice(0, BOOK_DESIGN_LIMITS.findings),
    notes: draft.notes.slice(0, BOOK_DESIGN_LIMITS.notes).map((n) => n.slice(0, 300)),
  };
}

/** A book write's answer for the pages named: the first few summarized, their findings, severe first. */
function pagesAnswer(record: BookRecord, spreadIds: readonly string[]): BookWriteResult {
  const doc = record.document;
  const named = new Set(spreadIds);
  const pages = doc.spreads.flatMap((s, i) => (named.has(s.id) ? [{ spread: s, index: i }] : []));
  const findings = sortBookFindings(pages.flatMap(({ spread }) => spreadFindings(spread, doc.page)));
  return {
    version: record.version,
    spread_ids: pages.map(({ spread }) => spread.id),
    pages: pages.slice(0, BOOK_DESIGN_LIMITS.pages).map(({ spread, index }) => summarizeSpread(spread, index)),
    findings: findings.slice(0, BOOK_OP_LIMITS.findings),
    dropped: [],
  };
}

/** The photos the book shows in a frame, placed or parked. */
function photosInBook(doc: BookDocument | null): Set<number> {
  const ids = new Set<number>();
  for (const spread of doc?.spreads ?? []) {
    for (const element of [...spread.elements, ...spread.parked]) {
      if (element.kind === 'photo' && element.photoId != null) ids.add(element.photoId);
    }
  }
  return ids;
}

function revisionUnreadable(): DomainError {
  return new DomainError(409, 'This revision of the book cannot be read', {
    code: 'book_revision_unreadable',
    mcpMessage: 'This revision of the book cannot be read any more; the book stays as it is.',
  });
}

function journeyNotFound(): DomainError {
  return new DomainError(404, 'Journey not found', { mcpMessage: 'Journey not found or access denied.' });
}

function nothingApplied(): DomainError {
  return new DomainError(409, 'Nothing of this design could be applied', {
    code: 'book_design_nothing_applied',
    mcpMessage:
      'Nothing of this design was applied: every chosen page was changed since the design, left out by the person, ' +
      'or shows photos no longer in the gallery. Run design_book again on the book as it is now.',
  });
}

/** An operation the engine refused on a draft page, as a 422 that names it, like an edit of the book. */
function refused(error: BookOpError): DomainError {
  const message = error.opIndex === null ? error.message : `ops[${error.opIndex}]: ${error.message}`;
  return new DomainError(422, message, {
    code: `book_${error.code}`,
    details: { code: error.code, opIndex: error.opIndex, ...(error.elementId ? { elementId: error.elementId } : {}) },
  });
}
