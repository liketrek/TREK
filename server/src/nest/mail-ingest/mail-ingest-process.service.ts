import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import {
  MAIL_INGEST_ATTACHMENTS,
  MAIL_INGEST_CHECKS,
  MAIL_INGEST_CREATED,
  MAIL_INGEST_HINTS,
  MAIL_INGEST_ITEM,
  MAIL_INGEST_MATCH,
  MAIL_INGEST_UNCERTAIN_FIELDS,
} from '../../db/json-columns';
import type {
  MailIngestCandidatesRepository,
  MailIngestPersonRow,
} from '../../db/repositories/MailIngestCandidates.repository';
import type {
  MailIngestMessageOutcome,
  MailIngestMessageRow,
  MailIngestMessagesRepository,
} from '../../db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../db/types';
import { encodeJson } from '../../utils/json-column';
import { AirportsService } from '../airports/airports.service';
import { logError } from '../audit/audit-log.logger';
import { DemoService } from '../common/demo.service';
import { UnitOfWork } from '../database/unit-of-work';
import { MailReadService } from '../llm-parse/mail-read.service';
import type { WalkedMail } from '../llm-parse/mail-read.types';
import { classifyMail, senderVerified } from './mail-classify';
import { MailIngestApplyService, type PreparedBooking, type WrittenBooking } from './mail-ingest-apply.service';
import {
  bookingStart,
  contentHash,
  judgeBooking,
  normalizeReference,
  type BookingVerdict,
  type CheckContext,
  type MailDraft,
  type TripOption,
} from './mail-ingest-checks';
import { MailIngestAddressService } from './mail-ingest-address.service';
import { MailIngestNotifyService } from './mail-ingest-notify.service';
import { MailIngestReadingService } from './mail-ingest-reading.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MailIngestTripsService } from './mail-ingest-trips.service';
import { IMPORT_SOURCES, MAIL_INGEST_LIMITS, UNDO_WINDOW_DAYS } from './mail-ingest.constants';
import { openMail } from './mail-seal';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { MailIngestHint, MailIngestPrefs, MailIngestReason, MailIngestResolution } from '@trek/shared';

/** One booking of a mail with the decision on it. */
interface PlannedBooking {
  position: number;
  draft: MailDraft;
  verdict: BookingVerdict;
  key: string;
  hash: string;
  resolution: MailIngestResolution;
  reason: MailIngestReason | null;
  /** Set for a booking that is added on its own, with the trip it goes to. */
  prepared: PreparedBooking | null;
  trip: TripOption | null;
}

/** A booking the write added, with its entry, for what follows the commit. */
interface AddedEntry {
  candidateId: number;
  trip: TripOption;
  written: WrittenBooking;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** How long a failed mail waits per try before the next. */
const RETRY_STEP_MS = 5 * MINUTE_MS;
/** A booking an hour either side of one in the trip is the same booking, as far as adding it on its own goes. */
const SIMILAR_WINDOW_MS = 60 * MINUTE_MS;

/**
 * Reads one forwarded mail to its end (plan section 5). It filters what is no
 * booking without AI, reads the bookings (machine-readable data always, the
 * AI where allowed), checks each one, adds those that pass to their trip in
 * one transaction with the mail's own status, and keeps the rest in the
 * inbox with a reason. A mail is hostile: it can pick neither a person, nor a
 * trip outside the person's own list, nor anything but adding a booking.
 */
@Injectable()
export class MailIngestProcessService {
  constructor(
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly addresses: MailIngestAddressService,
    private readonly trips: MailIngestTripsService,
    private readonly reading: MailIngestReadingService,
    private readonly apply: MailIngestApplyService,
    private readonly notify: MailIngestNotifyService,
    private readonly reader: MailReadService,
    private readonly airports: AirportsService,
    private readonly demo: DemoService,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * Reads a mail the caller claimed. A failure is not the caller's: the mail
   * is tried again later, and given up after its last try.
   *
   * @txIndependent the mail's own write is one transaction; the retry note on
   * a failure, and what follows the commit, stand on their own.
   */
  async process(messageId: number, now: Date = new Date()): Promise<void> {
    const message = await this.messages.findById(messageId);
    if (!message || message.status !== 'processing') return;
    try {
      await this.read(message, now);
    } catch (err) {
      await this.failed(message, err, now);
    }
  }

  /** @txIndependent each branch settles the mail in one write; the notices after it stand on their own. */
  private async read(message: MailIngestMessageRow, now: Date): Promise<void> {
    const raw = openMail(message.raw_eml_enc);
    const mail = raw ? this.reader.walk(raw) : null;
    const person = await this.trips.person(message.user_id);
    if (!raw || !mail || !person) {
      await this.keepForInbox(message, null, 'mail_unreadable', now);
      return;
    }
    const outcome = this.outcomeBase(mail, person, message.transport, now);
    const address = message.address_id === null ? null : await this.addresses.findById(message.address_id);
    if (!address || !(await this.addresses.isLive(address))) {
      await this.messages.finish(message.id, { ...outcome, status: 'discarded', reason: 'address_invalid' });
      return;
    }
    const kind = classifyMail(mail);
    if (kind.kind === 'drop') {
      await this.messages.finish(message.id, { ...outcome, status: 'discarded', reason: kind.reason });
      return;
    }
    if (kind.kind === 'forwarding_confirmation') {
      await this.keepForInbox(message, { ...outcome, forwardingCode: kind.code }, 'forwarding_confirmation', now);
      await this.notify.bookingsPending(person.id, await this.candidates.countPending(person.id));
      return;
    }
    await this.readBookings(message, raw, mail, person, outcome, now);
  }

  /**
   * @txIndependent the bookings and the mail's status are one transaction;
   * announcements, documents and notices follow it.
   */
  private async readBookings(
    message: MailIngestMessageRow,
    raw: Buffer,
    mail: WalkedMail,
    person: MailIngestPersonRow,
    outcome: MailIngestMessageOutcome,
    now: Date,
  ): Promise<void> {
    const prefs = await this.settings.prefsOf(person.id);
    const machine = await this.reading.readMachine(raw, mail, person.id);
    const trips = await this.tripsFor(message, person, now, this.reading.hintDates(mail, machine));
    const read = await this.reading.read({ mail, machine, person, prefs, trips, now });
    const done = { ...outcome, aiUsed: read.aiUsed };
    if (read.drafts.length === 0) {
      if (read.emptyReason === 'not_a_booking') {
        await this.messages.finish(message.id, { ...done, status: 'discarded', reason: 'not_a_booking' });
        return;
      }
      await this.keepForInbox(message, done, read.emptyReason, now);
      await this.notify.bookingsPending(person.id, await this.candidates.countPending(person.id));
      return;
    }
    const context: CheckContext = {
      trips,
      addressTripId: message.trip_id,
      subject: mail.subject,
      documentText: read.documentText,
      now,
      knownAirport: (code) => this.airports.findByIata(code) !== null,
    };
    const planned = await this.plan(read.drafts, context, person, prefs);
    const added = await this.write(message, planned, done, now);
    await this.afterCommit(added, planned, mail, person);
  }

  /** The trips a booking of this mail may go to: the address's trip alone, or the person's editable ones. */
  private async tripsFor(
    message: MailIngestMessageRow,
    person: MailIngestPersonRow,
    now: Date,
    hintDates: string[],
  ): Promise<TripOption[]> {
    if (message.trip_id === null) return this.trips.editableTrips(person, now, hintDates);
    const trip = await this.trips.editableTrip(person, message.trip_id);
    return trip ? [trip] : [];
  }

  /** Every booking with its checks, the checks that read its trip and, for one added on its own, its network half. */
  private async plan(
    drafts: readonly MailDraft[],
    context: CheckContext,
    person: MailIngestPersonRow,
    prefs: MailIngestPrefs,
  ): Promise<PlannedBooking[]> {
    const tooMany = drafts.length > MAIL_INGEST_LIMITS.autoBookings;
    const demo = await this.demo.isDemoUserId(person.id);
    const judged = await Promise.all(drafts.map((draft, position) => this.judge(draft, position, context)));
    const seen = new Set<string>();
    for (const booking of judged) {
      const tripKey = `${booking.verdict.choice.tripId}|${booking.key}`;
      if (booking.resolution === 'pending' && booking.reason === null && seen.has(tripKey)) {
        booking.resolution = 'duplicate';
      }
      seen.add(tripKey);
      if (booking.resolution !== 'pending' || booking.reason !== null) continue;
      if (tooMany) booking.reason = 'too_many_bookings';
      else if (demo) booking.reason = 'demo_mode';
      else if (!prefs.auto_add) booking.reason = 'ask_first';
    }
    return judged.reduce<Promise<PlannedBooking[]>>(async (previous, booking) => {
      const done = await previous;
      const trip = context.trips.find((candidate) => candidate.id === booking.verdict.choice.tripId);
      if (booking.resolution === 'pending' && booking.reason === null && trip) {
        booking.prepared = await this.apply.prepare(booking.draft.item, trip, person.id, booking.verdict.uncertain);
        booking.trip = trip;
      }
      return [...done, booking];
    }, Promise.resolve([]));
  }

  /** One booking's checks, and the checks that read the trip it would go to (G9, an undone twin, a look-alike). */
  private async judge(draft: MailDraft, position: number, context: CheckContext): Promise<PlannedBooking> {
    const verdict = judgeBooking(draft, context);
    const planned: PlannedBooking = {
      position,
      draft,
      verdict,
      key: this.apply.externalKey(draft.item),
      hash: contentHash(draft.item),
      resolution: 'pending',
      reason: verdict.reason,
      prepared: null,
      trip: null,
    };
    const tripId = verdict.choice.tripId;
    if (tripId === null || verdict.reason !== null) return planned;
    if (await this.candidates.tripHasExternal(tripId, IMPORT_SOURCES, planned.key)) {
      verdict.checks.duplicate = 'fail';
      return { ...planned, resolution: 'duplicate' };
    }
    verdict.checks.duplicate = 'pass';
    if ((await this.candidates.wasUndoneInTrip(tripId, planned.hash)) || (await this.looksAlike(tripId, draft))) {
      return { ...planned, reason: 'possible_duplicate' };
    }
    return planned;
  }

  private async looksAlike(tripId: number, draft: MailDraft): Promise<boolean> {
    const start = Date.parse(bookingStart(draft.item) ?? '');
    const window = (offset: number) =>
      Number.isFinite(start) ? new Date(start + offset).toISOString().slice(0, 16) : null;
    return this.candidates.tripHasSimilar(tripId, {
      type: draft.item.type,
      startFrom: window(-SIMILAR_WINDOW_MS),
      startTo: window(SIMILAR_WINDOW_MS),
      confirmation: normalizeReference(draft.item.confirmation_number) || null,
    });
  }

  /**
   * One transaction per mail: every entry, the bookings added on their own
   * (each in a savepoint, so one the unique index refuses is a duplicate and
   * the others still land), and the mail's own status. A crash before the
   * commit leaves the mail to be read again, never half added.
   */
  private async write(
    message: MailIngestMessageRow,
    planned: readonly PlannedBooking[],
    outcome: MailIngestMessageOutcome,
    now: Date,
  ): Promise<AddedEntry[]> {
    const createdAt = dbNow(now);
    const undoUntil = dbNow(new Date(now.getTime() + UNDO_WINDOW_DAYS * DAY_MS));
    return this.uow.transactional(async () => {
      const added = await planned.reduce<Promise<AddedEntry[]>>(async (previous, booking) => {
        const done = await previous;
        const written = booking.prepared ? await this.tryWrite(booking) : null;
        const candidateId = await this.candidates.insertCandidate({
          messageId: message.id,
          userId: message.user_id,
          position: booking.position,
          itemJson: encodeJson(MAIL_INGEST_ITEM, booking.draft.item),
          source: booking.draft.source,
          checksJson: encodeJson(MAIL_INGEST_CHECKS, booking.verdict.checks),
          uncertainFields: encodeJson(
            MAIL_INGEST_UNCERTAIN_FIELDS,
            booking.prepared?.uncertain ?? booking.verdict.uncertain,
          ),
          matchJson: encodeJson(MAIL_INGEST_MATCH, {
            kind: booking.draft.kind,
            suggested_new_trip: booking.draft.suggestedNewTrip,
          }),
          suggestedTripId: booking.verdict.choice.suggestedTripId,
          dedupeKey: booking.key,
          contentHash: booking.hash,
          resolution: written ? 'auto_applied' : booking.prepared ? 'duplicate' : booking.resolution,
          reason: written || booking.prepared ? null : booking.reason,
          createdAt,
          ...(written && {
            resolvedTripId: written.tripId,
            createdIdsJson: encodeJson(MAIL_INGEST_CREATED, written.created),
            resolvedAt: createdAt,
            undoUntil,
          }),
        });
        return written && booking.trip ? [...done, { candidateId, trip: booking.trip, written }] : done;
      }, Promise.resolve([]));
      await this.messages.finish(message.id, { ...outcome, status: 'processed', reason: null });
      return added;
    });
  }

  /** A savepoint around one booking: the unique index refusing it makes it a duplicate, not a failed mail. */
  private async tryWrite(booking: PlannedBooking): Promise<WrittenBooking | null> {
    const prepared = booking.prepared;
    if (!prepared) return null;
    try {
      return await this.uow.transactional(() => this.apply.writeInTx(prepared));
    } catch (err) {
      if (err instanceof UniqueConstraintViolationException) return null;
      throw err;
    }
  }

  /**
   * After the commit: what the trips are told, the mail's documents on the
   * first booking of each trip, and the notifications.
   *
   * @txIndependent each step stands on its own after the commit: a document
   * that fails to attach leaves the booking, and is noted on its entry.
   */
  private async afterCommit(
    added: readonly AddedEntry[],
    planned: readonly PlannedBooking[],
    mail: WalkedMail,
    person: MailIngestPersonRow,
  ): Promise<void> {
    const attachedTrips = new Set<number>();
    await added.reduce(async (previous, entry) => {
      await previous;
      await this.apply.announce(entry.written);
      if (!attachedTrips.has(entry.written.tripId)) {
        attachedTrips.add(entry.written.tripId);
        const { fileIds, error } = await this.apply.attachDocuments(
          entry.written.tripId,
          entry.written.reservation.id,
          mail,
          person.id,
        );
        const created = { ...entry.written.created, file_ids: fileIds };
        await this.candidates.setAttachments(entry.candidateId, encodeJson(MAIL_INGEST_CREATED, created), error);
      }
      await this.notify.bookingAdded(person, {
        candidateId: entry.candidateId,
        tripId: entry.written.tripId,
        tripTitle: entry.trip.title,
        title: entry.written.reservation.title,
        type: entry.written.reservation.type,
      });
    }, Promise.resolve());
    if (planned.some((booking) => booking.resolution === 'pending' && booking.prepared === null)) {
      await this.notify.bookingsPending(person.id, await this.candidates.countPending(person.id));
    }
  }

  /** The entry standing for a mail that gave no booking, with the reason, so the ways out still apply. */
  private async keepForInbox(
    message: MailIngestMessageRow,
    outcome: MailIngestMessageOutcome | null,
    reason: MailIngestReason | null,
    now: Date,
  ): Promise<void> {
    const createdAt = dbNow(now);
    await this.uow.transactional(async () => {
      await this.candidates.insertCandidate({
        messageId: message.id,
        userId: message.user_id,
        position: 0,
        itemJson: null,
        source: null,
        checksJson: null,
        uncertainFields: null,
        matchJson: null,
        suggestedTripId: message.trip_id,
        dedupeKey: null,
        contentHash: null,
        resolution: 'pending',
        reason,
        createdAt,
      });
      await this.messages.finish(message.id, {
        ...(outcome ?? emptyOutcome(createdAt)),
        status: 'processed',
        reason,
      });
    });
  }

  /** What the mail says about itself, before any booking in it is read; `transport` is the one it came by. */
  private outcomeBase(
    mail: WalkedMail,
    person: MailIngestPersonRow,
    transport: string,
    now: Date,
  ): MailIngestMessageOutcome {
    const hints: MailIngestHint[] = [];
    if (!senderVerified(mail, person.email, transport)) hints.push('sender_unverified');
    if (mail.skippedAttachments > 0) hints.push('attachments_skipped');
    return {
      status: 'processed',
      reason: null,
      subject: mail.subject?.slice(0, 300) ?? null,
      fromAddr: mail.envelope.from?.slice(0, 320) ?? null,
      fromVerified: !hints.includes('sender_unverified'),
      authResults: mail.envelope.authenticationResults?.slice(0, 2000) ?? null,
      hints: encodeJson(MAIL_INGEST_HINTS, hints),
      attachments: encodeJson(
        MAIL_INGEST_ATTACHMENTS,
        mail.attachments.map((file) => ({ file_name: file.fileName, kind: file.kind, size: file.data.length })),
      ),
      forwardingCode: null,
      aiUsed: false,
      processedAt: dbNow(now),
    };
  }

  /** A try that failed: again later, or given up after the last one. The mail's content stays out of the log. */
  private async failed(message: MailIngestMessageRow, err: unknown, now: Date): Promise<void> {
    logError(`[mail-ingest] Reading mail ${message.id} failed: ${err instanceof Error ? err.message : String(err)}`);
    if (message.attempts < MAIL_INGEST_LIMITS.maxAttempts) {
      await this.messages.retryLater(message.id, dbNow(new Date(now.getTime() + RETRY_STEP_MS * message.attempts)));
      return;
    }
    await this.messages.finish(message.id, {
      ...emptyOutcome(dbNow(now)),
      status: 'failed',
      reason: 'processing_failed',
    });
  }
}

function emptyOutcome(at: MailIngestMessageOutcome['processedAt']): MailIngestMessageOutcome {
  return {
    status: 'processed',
    reason: null,
    subject: null,
    fromAddr: null,
    fromVerified: false,
    authResults: null,
    hints: null,
    attachments: null,
    forwardingCode: null,
    aiUsed: false,
    processedAt: at,
  };
}
