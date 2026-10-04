import path from 'path';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { avatarUrl } from '../common/avatarUrl';
import { checkSsrf, createOutboundDispatcher } from '../../utils/ssrfGuard';
import { discardBody, exceedsDeclaredLength, readCappedText } from '../../utils/cappedFetch';
import type { User } from '../../types';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { RateLimitService } from '../common/rate-limit.service';
import { UnitOfWork } from '../database/unit-of-work';
import { toRowId } from '../common/row-id';
import { CollabNotes } from '../../db/entities/CollabNotes.entity';
import type { CollabNotesRepository, CollabNoteJoinRow } from '../../db/repositories/CollabNotes.repository';
import { CollabMessageReactions } from '../../db/entities/CollabMessageReactions.entity';
import type { CollabMessageReactionsRepository } from '../../db/repositories/CollabMessageReactions.repository';
import { CollabPolls } from '../../db/entities/CollabPolls.entity';
import type { CollabPollsRepository } from '../../db/repositories/CollabPolls.repository';
import { CollabPollVotes } from '../../db/entities/CollabPollVotes.entity';
import type { CollabPollVotesRepository } from '../../db/repositories/CollabPollVotes.repository';
import { CollabLinks } from '../../db/entities/CollabLinks.entity';
import type { CollabLinksRepository } from '../../db/repositories/CollabLinks.repository';
import { CollabMessages } from '../../db/entities/CollabMessages.entity';
import type { CollabMessagesRepository, CollabMessageJoinRow } from '../../db/repositories/CollabMessages.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';

type Trip = TripAccess;

// Half a megabyte of markup is far more than any og:/<title> block needs, and
// the URL is caller-supplied, so read no further than that.
const MAX_PREVIEW_BYTES = 512 * 1024;

export interface ReactionRow {
  emoji: string;
  user_id: number;
  username: string;
  message_id?: number;
}

export interface PollVoteRow {
  option_index: number;
  user_id: number;
  username: string;
  avatar: string | null;
}

export interface GroupedReaction {
  emoji: string;
  users: { user_id: number; username: string }[];
  count: number;
}

export interface LinkPreviewResult {
  title: string | null;
  description: string | null;
  image: string | null;
  site_name?: string | null;
  url: string;
  /** Set when the URL was refused; the controller turns it into a 400. */
  error?: string;
  /** Set when the caller is out of preview fetches; the controller turns it into a 429. */
  rateLimited?: boolean;
}

/**
 * Outbound fetches one user may trigger per minute. Deliberately generous: the
 * client asks for a preview per rendered message (`LIMIT 100`) and per note with
 * a website, both without debounce, so opening a link-heavy trip is a burst of
 * dozens. Cache hits are not charged, so this only ever meters *new* URLs.
 */
const PREVIEW_FETCHES_PER_MINUTE = 60;

/** How long a scraped preview stays good. og: tags are near-static. */
const PREVIEW_CACHE_TTL_MS = 10 * 60 * 1000;

/** Entries kept before the least recently used one is dropped. */
const PREVIEW_CACHE_MAX = 500;

/**
 * Pulls the og:/<title>/description fields out of a document.
 *
 * Every `[^>]` run is bounded. Unbounded, two of them separated by a literal make
 * the engine rescan the rest of the document from every `<meta` it passes, which
 * is quadratic: a page of `'<meta '` with no `>` in it took ~58s at 240KB on the
 * measured build, and the cap admits half a megabyte. Node runs one thread, so
 * that is the whole server — WebSocket, auth and health included — for one
 * request. No real attribute list comes close to 512 characters.
 */
function scrapeOpenGraph(html: string): Omit<LinkPreviewResult, 'url'> {
  const og = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]{0,512}property=["']og:${prop}["'][^>]{0,512}content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]{0,512}content=["']([^"']*)["'][^>]{0,512}property=["']og:${prop}["']`, 'i'));
    return m ? m[1] : null;
  };
  const titleTag = html.match(/<title[^>]{0,512}>([^<]*)<\/title>/i);
  const descMeta = html.match(/<meta[^>]{0,512}name=["']description["'][^>]{0,512}content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]{0,512}content=["']([^"']*)["'][^>]{0,512}name=["']description["']/i);
  const image = og('image');

  return {
    title: og('title') || (titleTag ? titleTag[1].trim() : null),
    description: og('description') || (descMeta ? descMeta[1].trim() : null),
    // The client renders this straight into an <img src>, so the page being
    // previewed must not be able to point that at anything but a web address —
    // the same scheme pin placeImageUrlSchema applies to a stored place picture.
    image: image && /^https?:\/\//i.test(image) ? image : null,
    site_name: og('site_name') || null,
  };
}

/**
 * Collab domain service — owns the collab SQL, now through the six
 * `Collab*Repository` classes (Plan 3e Task 5, CB1-55) plus `TripsRepository
 * .getTitle` (CB55) and `TripFiles`-scoped note/message attachment methods
 * that live on `CollabNotesRepository`/`CollabMessagesRepository` themselves
 * (see those classes' docstrings for why — Task 1's landed
 * `TripFilesRepository` doesn't have note/message-scoped methods). Trip
 * access, the 'collab_edit' / 'file_upload' permissions and the WebSocket
 * broadcast keep their legacy call paths. Post-migration hardening carried
 * over from the original DI move: the multi-statement writes (deleteNote,
 * votePoll's multi-choice-clear branch, createMessage, deleteMessage) run
 * through UnitOfWork.transactional(), getFormattedNoteById is trip-scoped
 * and null-safe, votePoll rejects non-integer indexes, and linkPreview
 * absorbs malformed URLs instead of throwing.
 *
 * **Read-then-write id seam (rule 21).** Every guard read below (`findInTrip`
 * / `findScoped...`) returns the row's OWN typed `id` (a `number`), and every
 * subsequent repository call in that method reuses THAT id rather than
 * re-deriving one from the raw `string | number` route param — the same
 * numeric value feeds both the trip-scoping SELECT and the write that
 * follows it.
 *
 * **`deleteMessage`'s pre-existing `username` gap.** The legacy statement
 * behind `findInTrip` (CB51) is `SELECT * FROM collab_messages WHERE id = ?
 * AND trip_id = ?` — no join to `users` — yet the legacy code returned
 * `{ username: message.username }`, a column that statement never selected.
 * That has always evaluated to `undefined` at runtime; preserved exactly
 * below (parity is law), not fixed — flagged in the task-5 report as a
 * pre-existing defect for a ruling, the same as `§17`'s other "surprises".
 */
@Injectable()
export class CollabService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
    private readonly rateLimit: RateLimitService,
    private readonly uow: UnitOfWork,
    @InjectRepository(CollabMessageReactions) private readonly messageReactionsRepo: CollabMessageReactionsRepository,
    @InjectRepository(CollabNotes) private readonly notesRepo: CollabNotesRepository,
    @InjectRepository(CollabPolls) private readonly pollsRepo: CollabPollsRepository,
    @InjectRepository(CollabPollVotes) private readonly pollVotesRepo: CollabPollVotesRepository,
    @InjectRepository(CollabLinks) private readonly linksRepo: CollabLinksRepository,
    @InjectRepository(CollabMessages) private readonly messagesRepo: CollabMessagesRepository,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
  ) {}

  /**
   * Scraped previews, keyed by URL and ordered least-recently-used first.
   *
   * On the service rather than at module scope so a test gets a fresh one per
   * container. What it buys: the client re-requests every preview it renders on
   * each mount, so without it a reload of a busy trip is another hundred outbound
   * fetches — the exact traffic the budget above is meant to stop the server from
   * emitting on someone else's behalf.
   */
  private readonly previewCache = new Map<string, { at: number; result: LinkPreviewResult }>();

  /** Preview fetches currently in flight, so simultaneous askers share one request. */
  private readonly inFlight = new Map<string, Promise<LinkPreviewResult>>();

  async verifyTripAccess(tripId: string | number, userId: number) {
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    return await this.tripsRepo.findAccessible(tripId, userId);
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('collab_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  async canUploadFiles(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('file_upload', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /* ------------------------------------------------------------------ */
  /*  Reactions                                                          */
  /* ------------------------------------------------------------------ */

  private async loadReactions(messageId: number): Promise<ReactionRow[]> {
    return this.messageReactionsRepo.listForMessage(messageId);
  }

  private groupReactions(reactions: ReactionRow[]): GroupedReaction[] {
    const map: Record<string, { user_id: number; username: string }[]> = {};
    for (const r of reactions) {
      if (!map[r.emoji]) map[r.emoji] = [];
      map[r.emoji].push({ user_id: r.user_id, username: r.username });
    }
    return Object.entries(map).map(([emoji, users]) => ({ emoji, users, count: users.length }));
  }

  async reactMessage(messageId: number | string, tripId: number | string, userId: number, emoji: string): Promise<{ found: boolean; reactions: GroupedReaction[] }> {
    const idNum = toRowId(messageId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return { found: false, reactions: [] };
    const msg = await this.messagesRepo.findInTrip(idNum, tripIdNum);
    if (!msg) return { found: false, reactions: [] };

    const existing = await this.messageReactionsRepo.findReaction(msg.id, userId, emoji);
    if (existing) {
      await this.messageReactionsRepo.deleteById(existing.id);
    } else {
      await this.messageReactionsRepo.insertReaction(msg.id, userId, emoji);
    }

    return { found: true, reactions: this.groupReactions(await this.loadReactions(msg.id)) };
  }

  /* ------------------------------------------------------------------ */
  /*  Notes                                                              */
  /* ------------------------------------------------------------------ */

  private async formatNote(note: CollabNoteJoinRow) {
    const attachments = await this.notesRepo.listAttachmentsForNote(note.id);
    return {
      ...note,
      avatar_url: avatarUrl(note),
      attachments: attachments.map(a => ({ ...a, url: `/api/trips/${note.trip_id}/files/${a.id}/download` })),
    };
  }

  async listNotes(tripId: string | number) {
    const notes = await this.notesRepo.listForTrip(toRowId(tripId) ?? -1);
    return Promise.all(notes.map(note => this.formatNote(note)));
  }

  async createNote(tripId: string | number, userId: number, data: { title: string; content?: string | null; category?: string | null; color?: string | null; website?: string | null; pinned?: boolean }) {
    const pinned = data.pinned ? 1 : 0;
    const id = await this.notesRepo.insertNote({
      trip_id: tripId,
      user_id: userId,
      title: data.title,
      content: data.content || null,
      category: data.category || 'General',
      color: data.color || '#6366f1',
      website: data.website || null,
      pinned,
    });

    const note = (await this.notesRepo.findWithUser(id))!;
    return this.formatNote(note);
  }

  async updateNote(tripId: string | number, noteId: string | number, data: { title?: string; content?: string | null; category?: string | null; color?: string | null; pinned?: number | boolean; website?: string | null }): Promise<Awaited<ReturnType<CollabService['formatNote']>> | null> {
    const idNum = toRowId(noteId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return null;
    const existing = await this.notesRepo.findInTrip(idNum, tripIdNum);
    if (!existing) return null;

    await this.notesRepo.update(existing.id, {
      title: data.title || existing.title,
      content: data.content !== undefined ? data.content : existing.content,
      category: data.category || existing.category,
      color: data.color || existing.color,
      pinned: data.pinned !== undefined ? (data.pinned ? 1 : 0) : existing.pinned,
      website: data.website !== undefined ? data.website : existing.website,
    });

    const note = (await this.notesRepo.findWithUser(existing.id))!;
    return this.formatNote(note);
  }

  async deleteNote(tripId: string | number, noteId: string | number): Promise<boolean> {
    const idNum = toRowId(noteId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return false;
    const existing = await this.notesRepo.findInTrip(idNum, tripIdNum);
    if (!existing) return false;

    // Clean up attached objects first (delete-first is intentional — a failed
    // row delete leaves dangling rows, never orphaned files). basename()
    // tolerates any legacy 'files/'-prefixed row the boot migration has not
    // seen.
    const noteFiles = await this.notesRepo.listFilenamesForNote(existing.id);
    for (const f of noteFiles) {
      await this.storage.delete('files', path.basename(f.filename)).catch(() => { /* ignore */ });
    }
    await this.uow.transactional(async () => {
      await this.notesRepo.deleteAttachmentsForNote(existing.id);
      await this.notesRepo.delete(existing.id);
    });
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Note files                                                         */
  /* ------------------------------------------------------------------ */

  async addNoteFile(tripId: string | number, noteId: string | number, file: { filename: string; originalname: string; size: number; mimetype: string }) {
    const idNum = toRowId(noteId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return null;
    const note = await this.notesRepo.findInTrip(idNum, tripIdNum);
    if (!note) return null;

    const insertedId = await this.notesRepo.insertAttachmentForNote({
      trip_id: tripId,
      note_id: note.id,
      filename: file.filename,
      original_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
    });

    const saved = (await this.notesRepo.findAttachmentById(insertedId))!;
    return { file: { ...saved, url: `/api/trips/${tripId}/files/${saved.id}/download` } };
  }

  async getFormattedNoteById(tripId: string | number, noteId: string | number) {
    const idNum = toRowId(noteId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return null;
    const note = await this.notesRepo.findWithUserInTrip(idNum, tripIdNum);
    if (!note) return null;
    return this.formatNote(note);
  }

  async deleteNoteFile(tripId: string | number, noteId: string | number, fileId: string | number): Promise<boolean> {
    // Scope to the trip — like every sibling collab op — so a caller authorized for THEIR
    // trip can't delete a note-file that belongs to someone else's trip (IDOR). trip_files
    // carries trip_id, so this ties the deleted object to the URL's :tripId the controller
    // access-checked, not just to a note/file id an attacker can enumerate. All THREE ids
    // (`fileId`, `noteId`, `tripId`) are resolved via `toRowId` here and fed, unchanged,
    // into the one three-column guard query below — never re-derived separately.
    const fileIdNum = toRowId(fileId);
    const noteIdNum = toRowId(noteId);
    const tripIdNum = toRowId(tripId);
    if (fileIdNum === null || noteIdNum === null || tripIdNum === null) return false;
    const file = await this.notesRepo.findScopedForNote(fileIdNum, noteIdNum, tripIdNum);
    if (!file) return false;

    await this.storage.delete('files', path.basename(file.filename)).catch(() => { /* ignore */ });

    await this.notesRepo.deleteAttachmentById(file.id);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Polls                                                              */
  /* ------------------------------------------------------------------ */

  private async getPollWithVotes(pollId: number) {
    const poll = await this.pollsRepo.findWithUser(pollId);
    if (!poll) return null;

    const options: (string | { label: string })[] = JSON.parse(poll.options);

    const votes = await this.pollVotesRepo.listForPoll(poll.id);

    const formattedOptions = options.map((label: string | { label: string }, idx: number) => {
      const text = typeof label === 'string' ? label : label.label || label;
      return {
        // The client renders `opt.text`; keep `label` too for any other consumer.
        text,
        label: text,
        voters: votes
          .filter(v => v.option_index === idx)
          .map(v => ({ id: v.user_id, user_id: v.user_id, username: v.username, avatar: v.avatar, avatar_url: avatarUrl(v) })),
      };
    });

    return {
      ...poll,
      avatar_url: avatarUrl(poll),
      options: formattedOptions,
      is_closed: !!poll.closed,
      multiple_choice: !!poll.multiple,
    };
  }

  async listPolls(tripId: string | number) {
    const ids = await this.pollsRepo.listIdsForTrip(toRowId(tripId) ?? -1);
    return (await Promise.all(ids.map(id => this.getPollWithVotes(id)))).filter(Boolean);
  }

  async createPoll(tripId: string | number, userId: number, data: { question: string; options: unknown[]; multiple?: boolean; multiple_choice?: boolean; deadline?: string }) {
    const isMultiple = data.multiple || data.multiple_choice;

    const id = await this.pollsRepo.insertPoll({
      trip_id: tripId,
      user_id: userId,
      question: data.question,
      options: JSON.stringify(data.options),
      multiple: isMultiple ? 1 : 0,
      deadline: data.deadline || null,
    });

    return this.getPollWithVotes(id);
  }

  async votePoll(tripId: string | number, pollId: string | number, userId: number, optionIndex: number): Promise<{ error?: string; poll?: Awaited<ReturnType<CollabService['getPollWithVotes']>> }> {
    const idNum = toRowId(pollId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return { error: 'not_found' };
    const poll = await this.pollsRepo.findInTrip(idNum, tripIdNum);
    if (!poll) return { error: 'not_found' };
    if (poll.closed) return { error: 'closed' };

    const options = JSON.parse(poll.options);
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
      return { error: 'invalid_index' };
    }

    const existingVote = await this.pollVotesRepo.findVote(poll.id, userId, optionIndex);

    if (existingVote) {
      await this.pollVotesRepo.deleteById(existingVote.id);
    } else {
      await this.uow.transactional(async () => {
        if (!poll.multiple) {
          await this.pollVotesRepo.deleteForUser(poll.id, userId);
        }
        await this.pollVotesRepo.insertVote(poll.id, userId, optionIndex);
      });
    }

    return { poll: await this.getPollWithVotes(poll.id) };
  }

  async closePoll(tripId: string | number, pollId: string | number): Promise<Awaited<ReturnType<CollabService['getPollWithVotes']>> | null> {
    const idNum = toRowId(pollId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return null;
    const poll = await this.pollsRepo.findInTrip(idNum, tripIdNum);
    if (!poll) return null;

    await this.pollsRepo.close(poll.id);
    return this.getPollWithVotes(poll.id);
  }

  async deletePoll(tripId: string | number, pollId: string | number): Promise<boolean> {
    const idNum = toRowId(pollId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return false;
    const poll = await this.pollsRepo.findInTrip(idNum, tripIdNum);
    if (!poll) return false;

    await this.pollsRepo.delete(poll.id);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Shared links                                                       */
  /* ------------------------------------------------------------------ */

  async listLinks(tripId: string | number) {
    return this.linksRepo.listForTrip(toRowId(tripId) ?? -1);
  }

  async createLink(tripId: string | number, userId: number, data: { title: string; url: string; pinned?: boolean }) {
    const id = await this.linksRepo.insertLink({ trip_id: tripId, user_id: userId, title: data.title.trim(), url: data.url.trim(), pinned: data.pinned ? 1 : 0 });
    return this.linksRepo.findWithUser(id);
  }

  async updateLink(tripId: string | number, linkId: string | number, data: { title?: string; url?: string; pinned?: boolean | number }) {
    const idNum = toRowId(linkId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return null;
    const existing = await this.linksRepo.findInTrip(idNum, tripIdNum);
    if (!existing) return null;
    await this.linksRepo.update(existing.id, existing.trip_id, {
      title: data.title?.trim() || existing.title,
      url: data.url?.trim() || existing.url,
      // `existing.pinned` is `number | null` on the column, but every write
      // this repository makes sets it to 0/1 (never null) — the `?? 0`
      // fallback only guards a value that should never actually be null.
      pinned: data.pinned === undefined ? (existing.pinned ?? 0) : (data.pinned ? 1 : 0),
    });
    return this.linksRepo.findWithUser(existing.id);
  }

  async deleteLink(tripId: string | number, linkId: string | number): Promise<boolean> {
    const idNum = toRowId(linkId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return false;
    return this.linksRepo.deleteScoped(idNum, tripIdNum);
  }

  /* ------------------------------------------------------------------ */
  /*  Messages                                                           */
  /* ------------------------------------------------------------------ */

  private async formatMessage(msg: CollabMessageJoinRow, reactions?: GroupedReaction[]) {
    const attachments = msg.id && msg.trip_id ? await this.messagesRepo.listAttachmentsForMessage(msg.id, msg.trip_id) : [];
    return {
      ...msg,
      user_avatar: avatarUrl(msg),
      avatar_url: avatarUrl(msg),
      reactions: reactions || [],
      attachments: attachments.map(a => ({
        id: a.id,
        filename: a.filename,
        original_name: a.original_name,
        file_size: a.file_size,
        mime_type: a.mime_type,
        url: `/api/trips/${a.trip_id}/files/${a.id}/download`,
      })),
    };
  }

  async countMessages(tripId: string | number): Promise<number> {
    return this.messagesRepo.countForTrip(toRowId(tripId) ?? -1);
  }

  async listMessages(tripId: string | number, before?: string | number) {
    const tripIdNum = toRowId(tripId) ?? -1;
    // A malformed (non-canonical) `before` is narrowed to `-1` (rule 15) —
    // `m.id < -1` matches nothing, an empty page. The legacy raw bind let
    // SQLite's TEXT/INTEGER type-ordering decide instead (a non-numeric
    // cursor sorts as "greater" than every integer id, so `m.id < 'garbage'`
    // was always true and returned every message unfiltered) — a
    // non-canonical `before` can only reach this path from something other
    // than our own client (every real cursor is `String(<a message's own
    // integer id>)`), so this is the SAME accepted narrowing `toRowId`'s own
    // docstring describes elsewhere, not a behaviour this domain's own
    // traffic can trigger. Flagged in the task-5 report for a ruling.
    const beforeNum = before === undefined ? undefined : (toRowId(before) ?? -1);
    const messages = await this.messagesRepo.listForTrip(tripIdNum, beforeNum);

    messages.reverse();

    // A deleted message keeps its row so the client can render the placeholder
    // off the flag, but the original text must not leave the server. REST and
    // both MCP surfaces read through this method, so blanking here covers all
    // three.
    for (const m of messages) if (m.deleted) m.text = '';

    const msgIds = messages.map(m => m.id);
    const allReactions = await this.messageReactionsRepo.listForMessages(msgIds);
    const reactionsByMsg: Record<number, ReactionRow[]> = {};
    for (const r of allReactions) {
      if (!reactionsByMsg[r.message_id]) reactionsByMsg[r.message_id] = [];
      reactionsByMsg[r.message_id].push(r);
    }

    return Promise.all(messages.map(m => this.formatMessage(m, this.groupReactions(reactionsByMsg[m.id] || []))));
  }

  async createMessage(
    tripId: string | number,
    userId: number,
    text: string,
    replyTo?: number | null,
    files: Array<{ filename: string; originalname: string; size: number; mimetype: string }> = [],
  ): Promise<{ error?: string; message?: Awaited<ReturnType<CollabService['formatMessage']>> }> {
    if (replyTo) {
      // A soft-deleted message is gone as far as anyone replying is concerned:
      // its row survives only so the placeholder can be drawn where it was.
      const tripIdNum = toRowId(tripId) ?? -1;
      const replyMsg = await this.messagesRepo.findActiveInTrip(replyTo, tripIdNum);
      if (!replyMsg) return { error: 'reply_not_found' };
    }

    // One transaction: the caller has already committed the image bytes to
    // storage, so a message row that lands without its attachment rows would
    // leave those bytes with nothing pointing at them and nothing to sweep them.
    const insertedId = await this.uow.transactional(async () => {
      const id = await this.messagesRepo.insertMessage(tripId, userId, text.trim(), replyTo || null);

      for (const file of files) {
        await this.messagesRepo.insertAttachmentForMessage({
          trip_id: tripId,
          message_id: id,
          filename: file.filename,
          original_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: userId,
        });
      }
      return id;
    });

    const message = (await this.messagesRepo.findWithReply(insertedId))!;

    return { message: await this.formatMessage(message) };
  }

  async deleteMessage(tripId: string | number, messageId: string | number, userId: number): Promise<{ error?: string; username?: string }> {
    const idNum = toRowId(messageId);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return { error: 'not_found' };
    const message = await this.messagesRepo.findInTrip(idNum, tripIdNum);
    if (!message) return { error: 'not_found' };
    if (Number(message.user_id) !== Number(userId)) return { error: 'not_owner' };

    const attachments = await this.messagesRepo.listFilenamesForMessage(message.id, tripIdNum);
    await this.uow.transactional(async () => {
      await this.messagesRepo.deleteAttachmentsForMessage(message.id, tripIdNum);
      await this.messagesRepo.softDelete(message.id);
    });
    // Only once the rows are actually gone. Dropping the blobs first left a
    // live message pointing at attachments whose bytes no longer existed
    // whenever the second statement failed.
    for (const file of attachments) {
      void this.storage.delete('files', path.basename(file.filename)).catch(() => { /* best effort */ });
    }
    // `message.username` — see the class docstring's "pre-existing `username`
    // gap" note: `findInTrip` never joins `users`, so this has always been
    // `undefined` at runtime. Preserved exactly, not fixed.
    return { username: undefined };
  }

  /* ------------------------------------------------------------------ */
  /*  Link preview                                                       */
  /* ------------------------------------------------------------------ */

  async linkPreview(url: string, userId?: number): Promise<LinkPreviewResult> {
    const fallback: LinkPreviewResult = { title: null, description: null, image: null, url };

    // A malformed URL returns the fallback directly (the legacy code let
    // `new URL` throw and relied on the controller's catch for the same 200).
    try { new URL(url); } catch { return fallback; }

    // Served before the budget is charged: opening a chat re-requests every
    // preview it renders, so a reload must not cost the caller its allowance.
    const cached = this.readPreviewCache(url);
    if (cached) return cached;

    // A fetch for this URL is already on its way. The client renders one preview
    // per message and does not deduplicate, so the same link posted twenty times
    // arrives as twenty simultaneous requests — none of which would find a cache
    // entry yet, since the first has not answered. Joining the running fetch keeps
    // that a single outbound request instead of twenty.
    const running = this.inFlight.get(url);
    if (running !== undefined) return { ...(await running), url };

    // Charged per outbound fetch rather than per request, which is what the
    // budget is actually protecting. Without a user there is no one to charge —
    // no caller passes that today, and the fetch stays behind the SSRF guard.
    if (userId !== undefined && !this.rateLimit.check('collab_link_preview', String(userId), PREVIEW_FETCHES_PER_MINUTE, 60_000, Date.now())) {
      return { ...fallback, rateLimited: true };
    }

    // Memoised in-flight fetch, not a missing await: the promise is stored so the
    // concurrent askers above can join it, and this frame awaits it below.
    const task = this.fetchPreview(url, fallback);
    this.inFlight.set(url, task);
    try {
      return await task;
    } finally {
      this.inFlight.delete(url);
    }
  }

  /** The outbound half of linkPreview, past the cache and the budget. */
  private async fetchPreview(url: string, fallback: LinkPreviewResult): Promise<LinkPreviewResult> {
    const ssrf = await checkSsrf(url, true);
    if (!ssrf.allowed) {
      // The caller learns that the URL was refused, never why: the three distinct
      // reasons ("could not resolve", "private address", "loopback") would together
      // map out the server's internal DNS for anyone willing to guess hostnames.
      return { ...fallback, error: 'URL not allowed' };
    }

    const dispatcher = createOutboundDispatcher(url, ssrf.resolvedIp!);
    try {
      // AbortSignal.timeout covers the body as well. The hand-rolled controller
      // this replaces was cleared as soon as the headers arrived, so a server that
      // answered fast and then dripped the body one byte at a time held the handler,
      // the socket and this dispatcher open indefinitely — the byte cap counts
      // bytes, and at that rate it would never reach one.
      const r = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
        dispatcher,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NOMAD/1.0; +https://github.com/mauriceboe/NOMAD)' },
      } as any);
      if (!r.ok) { discardBody(r); return this.cachePreview(url, fallback); }
      // Only markup is worth scraping. A declared type that is not HTML means the
      // regexes below would comb a video or an archive for og: tags and find nothing.
      const type = r.headers?.get('content-type') ?? '';
      if (type && !/^\s*(text\/html|application\/xhtml\+xml|text\/plain)\b/i.test(type)) {
        discardBody(r);
        return this.cachePreview(url, fallback);
      }
      // An unread body keeps its socket reserved until the garbage collector runs,
      // which is the one thing a size cap is there to prevent.
      if (exceedsDeclaredLength(r, MAX_PREVIEW_BYTES)) { discardBody(r); return this.cachePreview(url, fallback); }

      // A truncated head still carries the tags we scrape, so a page over the
      // budget degrades to fewer fields rather than to an error.
      const { text: html } = await readCappedText(r, MAX_PREVIEW_BYTES);
      return this.cachePreview(url, { ...scrapeOpenGraph(html), url });
    } catch {
      return this.cachePreview(url, fallback);
    } finally {
      // Closed rather than left to the garbage collector: one Agent is built per
      // preview, and each keeps its sockets until something releases them.
      void (dispatcher as { close?: () => Promise<void> } | undefined)?.close?.()?.catch(() => {});
    }
  }

  /** A cached preview, or undefined once its entry has expired or was never there. */
  private readPreviewCache(url: string): LinkPreviewResult | undefined {
    const hit = this.previewCache.get(url);
    if (!hit) return undefined;
    if (Date.now() - hit.at > PREVIEW_CACHE_TTL_MS) {
      this.previewCache.delete(url);
      return undefined;
    }
    // Re-insert so the eviction below drops the least recently used entry.
    this.previewCache.delete(url);
    this.previewCache.set(url, hit);
    return { ...hit.result, url };
  }

  /** Stores a preview and returns it, so call sites can `return this.cachePreview(...)`. */
  private cachePreview(url: string, result: LinkPreviewResult): LinkPreviewResult {
    if (this.previewCache.size >= PREVIEW_CACHE_MAX) {
      const oldest = this.previewCache.keys().next().value;
      if (oldest !== undefined) this.previewCache.delete(oldest);
    }
    this.previewCache.set(url, { at: Date.now(), result });
    return result;
  }

  /** Fire-and-forget collab notification (mirrors the legacy route's dynamic import). */
  async notifyCollab(tripId: string, actor: User, preview?: string): Promise<void> {
    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    const title = await this.tripsRepo.getTitle(tripId);
    const params: Record<string, string> = { trip: title || 'Untitled', actor: actor.email, tripId: String(tripId) };
    if (preview !== undefined) params.preview = preview;
    this.notifications.send({ event: 'collab_message', actorId: actor.id, scope: 'trip', targetId: Number(tripId), params }).catch(() => {});
  }
}
