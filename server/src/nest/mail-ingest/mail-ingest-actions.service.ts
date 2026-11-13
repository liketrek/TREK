import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import {
  MAIL_INGEST_CREATED,
  MAIL_INGEST_ITEM,
  MAIL_INGEST_UNCERTAIN_FIELDS,
  type MailIngestCreated,
} from '../../db/json-columns';
import type {
  MailIngestCandidateRow,
  MailIngestCandidatesRepository,
} from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow, parseDbTimestamp } from '../../db/types';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { AirportsService } from '../airports/airports.service';
import { DemoService } from '../common/demo.service';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { MailReadService } from '../llm-parse/mail-read.service';
import type { WalkedMail } from '../llm-parse/mail-read.types';
import { MailIngestApplyService } from './mail-ingest-apply.service';
import { MailIngestNotifyService } from './mail-ingest-notify.service';
import { implausible, type TripOption } from './mail-ingest-checks';
import { MailIngestTripsService } from './mail-ingest-trips.service';
import { IMPORT_SOURCES, UNDO_WINDOW_DAYS } from './mail-ingest.constants';
import { openMail } from './mail-seal';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { BookingImportPreviewItem } from '@trek/shared';

const DAY_MS = 24 * 60 * 60 * 1000;
/** The states an added booking is undone from. */
const ADDED = ['auto_applied', 'applied'] as const;
const ISO_DATE_RE = /\b(20\d\d-[01]\d-[0-3]\d)\b/;
/** A booking reference as a mail writes it: after its label, letters and digits. */
const REFERENCE_RE =
  /(?:booking (?:reference|code|number)|confirmation (?:code|number)|reservation (?:code|number)|pnr|buchungsnummer|buchungscode|référence|localizador)\W{0,5}([A-Z0-9-]{5,20})/i;
const TYPE_WORDS: ReadonlyArray<[RegExp, string]> = [
  [/\b(flight|flug|vol|vuelo|volo|boarding)\b/i, 'flight'],
  [/\b(train|zug|bahn|treno|tren|rail)\b/i, 'train'],
  [/\b(hotel|apartment|check-in|unterkunft|hébergement|alojamiento)\b/i, 'hotel'],
  [/\b(rental car|car hire|mietwagen|location de voiture)\b/i, 'car'],
  [/\b(restaurant|table)\b/i, 'restaurant'],
  [/\b(ticket|event|concert|konzert|museum)\b/i, 'event'],
];

/**
 * What a person does with an entry of their mail inbox: add it to a trip,
 * file the mail as documents, fill the booking form in themselves, discard
 * it, or undo a booking a mail added. Every action checks again that the
 * person may add bookings to the trip it touches, and that every id belongs
 * to that trip.
 */
@Injectable()
export class MailIngestActionsService {
  constructor(
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    private readonly apply: MailIngestApplyService,
    private readonly notify: MailIngestNotifyService,
    private readonly trips: MailIngestTripsService,
    private readonly reader: MailReadService,
    private readonly airports: AirportsService,
    private readonly demo: DemoService,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * Removes exactly what adding the booking created, within the undo window,
   * for the person who forwarded it or any member who may edit the trip's
   * bookings. A booking whose cost moved balances, or that was edited since,
   * is only undone with `confirm`.
   *
   * @txIndependent the removal is one transaction; the documents go to the
   * trash after it, as storage I/O.
   */
  async undo(
    candidateId: number,
    userId: number,
    confirm: boolean,
    now: Date = new Date(),
  ): Promise<MailIngestCandidateRow> {
    const entry = await this.candidates.findById(candidateId);
    const tripId = entry?.resolved_trip_id ?? null;
    if (!entry || tripId === null || !(await this.editableBy(userId, tripId))) {
      throw new DomainError(404, 'Booking not found');
    }
    if (!(ADDED as readonly string[]).includes(entry.resolution)) {
      throw new DomainError(409, 'This booking is not added from a mail any more');
    }
    const until = parseDbTimestamp(entry.undo_until);
    if (!until || until < now) throw new DomainError(409, 'The time to undo this booking has passed');

    const created = decodeJson(MAIL_INGEST_CREATED, entry.created_ids_json);
    const affects = await this.undoAffects(tripId, created);
    if (affects.length > 0 && !confirm) {
      throw new DomainError(409, 'Undoing this booking changes more than the booking', {
        details: { code: 'needs_confirmation', affects },
      });
    }
    const removed = await this.uow.transactional(async () => {
      const claimed = await this.candidates.resolve(entry.id, ADDED, {
        resolution: 'undone',
        reason: null,
        resolvedTripId: tripId,
        createdIdsJson: entry.created_ids_json,
        resolvedBy: userId,
        resolvedAt: dbNow(now),
        undoUntil: null,
      });
      if (!claimed) throw new DomainError(409, 'This booking was undone already');
      return this.apply.removeInTx(tripId, created);
    });
    await this.apply.announceRemoved(removed, created.file_ids);
    return this.reload(entry.id);
  }

  /**
   * Adds a waiting booking to the trip the inbox suggested or the person
   * picked. The person decides the trip; the server still checks that they
   * may add bookings there, that the booking is plausible and that the trip
   * does not hold it already.
   *
   * @txIndependent the booking and the entry are one transaction; the mail's
   * documents are attached after it, as storage I/O, and noted on the entry.
   */
  async applyToTrip(
    candidateId: number,
    userId: number,
    tripId: number | null,
    now: Date = new Date(),
  ): Promise<MailIngestCandidateRow> {
    const entry = await this.pendingEntry(candidateId, userId);
    const item = decodeJson(MAIL_INGEST_ITEM, entry.item_json);
    if (!item) throw new DomainError(409, 'This mail holds no booking to add; file it as a document instead');
    if (await this.demo.isDemoUserId(userId)) throw new DomainError(403, 'Demo accounts cannot add bookings');
    const trip = await this.tripFor(userId, tripId ?? entry.suggested_trip_id);
    if (implausible(item, now, (code) => this.airports.findByIata(code) !== null)) {
      throw new DomainError(422, 'This booking has values that cannot be right; fill it in yourself instead');
    }
    if (await this.candidates.tripHasExternal(trip.id, IMPORT_SOURCES, this.apply.externalKey(item))) {
      throw new DomainError(409, 'This booking is already in the trip.');
    }
    const uncertain = decodeJson(MAIL_INGEST_UNCERTAIN_FIELDS, entry.uncertain_fields);
    const prepared = await this.apply.prepare(item, trip, entry.user_id, uncertain);
    const written = await this.uow.transactional(async () => {
      const done = await this.apply.writeInTx(prepared);
      const claimed = await this.candidates.resolve(entry.id, ['pending'], {
        resolution: 'applied',
        reason: null,
        resolvedTripId: trip.id,
        createdIdsJson: encodeJson(MAIL_INGEST_CREATED, done.created),
        resolvedBy: userId,
        resolvedAt: dbNow(now),
        undoUntil: dbNow(new Date(now.getTime() + UNDO_WINDOW_DAYS * DAY_MS)),
      });
      if (!claimed) throw new DomainError(409, 'This entry was decided already');
      return done;
    });
    await this.apply.announce(written);
    const mail = await this.mailOf(entry);
    if (mail) {
      const { fileIds, error } = await this.apply.attachDocuments(trip.id, written.reservation.id, mail, userId);
      const created = { ...written.created, file_ids: fileIds };
      await this.candidates.setAttachments(entry.id, encodeJson(MAIL_INGEST_CREATED, created), error);
    }
    return this.reload(entry.id);
  }

  /**
   * "Add as document": the mail's attachments, or its text, as files of the
   * trip, and the entry settled as filed. Without the documents addon there
   * is nothing to file into.
   *
   * @txIndependent each document is storage I/O; the entry is settled once they are in.
   */
  async fileToTrip(
    candidateId: number,
    userId: number,
    tripId: number,
    now: Date = new Date(),
  ): Promise<MailIngestCandidateRow> {
    const entry = await this.pendingEntry(candidateId, userId);
    const trip = await this.tripFor(userId, tripId);
    const mail = await this.mailOf(entry);
    if (!mail) throw new DomainError(410, 'The mail is no longer stored');
    const { fileIds, error } = await this.apply.attachDocuments(trip.id, null, mail, userId);
    if (fileIds.length === 0) throw new DomainError(409, error ?? 'This trip takes no documents');
    const created = { reservation_ids: [], place_ids: [], budget_item_ids: [], file_ids: fileIds, fingerprint: null };
    await this.candidates.resolve(entry.id, ['pending'], {
      resolution: 'filed',
      reason: null,
      resolvedTripId: trip.id,
      createdIdsJson: encodeJson(MAIL_INGEST_CREATED, created),
      resolvedBy: userId,
      resolvedAt: dbNow(now),
      undoUntil: null,
    });
    return this.reload(entry.id);
  }

  /**
   * "Fill in yourself": the booking form's starting values. The booking read
   * from the mail where there is one; otherwise what the mail says plainly: a
   * type by its words, the subject as title, the first date, a reference.
   */
  async prefill(
    candidateId: number,
    userId: number,
  ): Promise<{ trip_id: number | null; item: BookingImportPreviewItem }> {
    const entry = await this.pendingEntry(candidateId, userId);
    const item = decodeJson(MAIL_INGEST_ITEM, entry.item_json);
    if (item) return { trip_id: entry.suggested_trip_id, item };
    const mail = await this.mailOf(entry);
    const message = await this.messages.findById(entry.message_id);
    return { trip_id: entry.suggested_trip_id, item: guessedItem(mail, message?.subject ?? null) };
  }

  /** Puts a waiting entry aside; the mail goes with the retention like any other. */
  async discard(candidateId: number, userId: number, now: Date = new Date()): Promise<MailIngestCandidateRow> {
    const entry = await this.pendingEntry(candidateId, userId);
    await this.candidates.resolve(entry.id, ['pending'], {
      resolution: 'discarded',
      reason: entry.reason,
      resolvedTripId: null,
      createdIdsJson: null,
      resolvedBy: userId,
      resolvedAt: dbNow(now),
      undoUntil: null,
    });
    return this.reload(entry.id);
  }

  /** What an undo would touch beyond the booking: costs someone settled with, and an edit since. */
  private async undoAffects(tripId: number, created: MailIngestCreated): Promise<Array<'balances' | 'edited'>> {
    const affects: Array<'balances' | 'edited'> = [];
    if ((await this.candidates.countPayers(created.budget_item_ids)) > 0) affects.push('balances');
    if (await this.apply.editedSince(tripId, created)) affects.push('edited');
    return affects;
  }

  /** The person's own waiting entry; anyone else's answers as missing. */
  private async pendingEntry(candidateId: number, userId: number): Promise<MailIngestCandidateRow> {
    const entry = await this.candidates.findById(candidateId);
    if (!entry || entry.user_id !== userId) throw new DomainError(404, 'Entry not found');
    if (entry.resolution !== 'pending') throw new DomainError(409, 'This entry was decided already');
    return entry;
  }

  private async tripFor(userId: number, tripId: number | null): Promise<TripOption> {
    const person = await this.trips.person(userId);
    const trip = person && tripId !== null ? await this.trips.editableTrip(person, tripId) : null;
    if (!trip) throw new DomainError(404, 'Trip not found');
    return trip;
  }

  private async editableBy(userId: number, tripId: number): Promise<boolean> {
    const person = await this.trips.person(userId);
    return person !== null && (await this.trips.editableTrip(person, tripId)) !== null;
  }

  /** The mail an entry came from, as long as it is stored. */
  private async mailOf(entry: MailIngestCandidateRow): Promise<WalkedMail | null> {
    const message = await this.messages.findById(entry.message_id);
    const raw = openMail(message?.raw_eml_enc ?? null);
    return raw ? this.reader.walk(raw) : null;
  }

  /** The entry as it is now; its person's clients hear the inbox changed. */
  private async reload(id: number): Promise<MailIngestCandidateRow> {
    const row = await this.candidates.findById(id);
    if (!row) throw new DomainError(404, 'Entry not found');
    this.notify.inboxChanged(row.user_id, await this.candidates.countPending(row.user_id));
    return row;
  }
}

/** A booking form started from what a mail says in plain words, for a mail no reading made sense of. */
function guessedItem(mail: WalkedMail | null, storedSubject: string | null): BookingImportPreviewItem {
  const subject = mail?.subject ?? storedSubject ?? '';
  const text = `${subject}\n${mail?.body ?? ''}`;
  const type = TYPE_WORDS.find(([words]) => words.test(text))?.[1] ?? 'other';
  const date = ISO_DATE_RE.exec(text)?.[1] ?? null;
  const reference = REFERENCE_RE.exec(text)?.[1] ?? null;
  return {
    type,
    title: subject.trim().slice(0, 200) || 'Booking',
    reservation_time: date,
    confirmation_number: reference ? reference.toUpperCase() : null,
    source: { fileName: 'mail', index: 0 },
  };
}
