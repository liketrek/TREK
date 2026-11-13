import { ADDON_IDS } from '../../addons';
import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import type { MailIngestCreated } from '../../db/json-columns';
import type { MailIngestCandidatesRepository } from '../../db/repositories/MailIngestCandidates.repository';
import { AddonsService } from '../addons/addons.service';
import { logWarn } from '../audit/audit-log.logger';
import { BookingImportService } from '../booking-import/booking-import.service';
import { BudgetService } from '../budget/budget.service';
import { isUploadTypeAllowed } from '../files/files.constants';
import { FilesService } from '../files/files.service';
import type { WalkedMail } from '../llm-parse/mail-read.types';
import { MapsService } from '../maps/maps.service';
import { PlacesService, type PlaceCreateInput } from '../places/places.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsService, type CostEvent, type CreateReservationData } from '../reservations/reservations.service';
import { contentHash, dateOf, type TripOption } from './mail-ingest-checks';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MAIL_EXTERNAL_SOURCE } from './mail-ingest.constants';
import { parsePriceMinor } from './mail-money';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  normalizePlaceWebsite,
  typeToCostCategory,
  type BookingImportPreviewItem,
  type MailIngestField,
} from '@trek/shared';

import { createHash } from 'node:crypto';

type CostEntry = Parameters<ReservationsService['createWithCostInTx']>[2];

/** What a booking's fingerprint covers: the fields a person edits. */
const FINGERPRINT_KEYS = [
  'title',
  'type',
  'status',
  'reservation_time',
  'reservation_end_time',
  'location',
  'confirmation_number',
  'notes',
  'metadata',
] as const;
type Written = Awaited<ReturnType<ReservationsService['createWithCostInTx']>>;

/** A booking ready to write: everything that needs the network (geocoding, the frozen rate) is done. */
export interface PreparedBooking {
  tripId: number;
  data: CreateReservationData;
  venue: PlaceCreateInput | null;
  cost: CostEntry;
  travelerIds: number[];
  /** The fields marked for a second look, the price among them when no cost could be written. */
  uncertain: MailIngestField[];
}

/** What writing a booking created, for the announcement after the commit and for its undo. */
export interface WrittenBooking {
  tripId: number;
  reservation: Written['reservation'];
  place: { id: number } | null;
  accommodationCreated: boolean;
  costEvents: CostEvent[];
  stayMirror: Written['stayMirror'];
  created: MailIngestCreated;
}

/**
 * Writes a booking read from a mail into its trip, with every field the mail
 * gave: the booking or transport with its endpoints and legs, a stay for a
 * hotel, the venue as a place (an existing one when the trip has it), the
 * forwarder as traveller, and the cost when the price reads to the cent. It
 * goes through the same services a booking made by hand goes through, and
 * records exactly what it created, so an undo removes that and nothing else.
 */
@Injectable()
export class MailIngestApplyService {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly places: PlacesService,
    private readonly budget: BudgetService,
    private readonly addons: AddonsService,
    private readonly files: FilesService,
    private readonly maps: MapsService,
    private readonly realtime: RealtimeService,
    private readonly bookingImport: BookingImportService,
    private readonly settings: MailIngestSettingsService,
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
  ) {}

  /** The key a mail booking is stored under: its reference, or, without one, what it says. */
  externalKey(item: BookingImportPreviewItem): string {
    return this.bookingImport.externalKey(item) ?? `content:${contentHash(item)}`;
  }

  /** The network half of a write: locate the venue and freeze the cost's rate. Writes nothing. */
  async prepare(
    item: BookingImportPreviewItem,
    trip: TripOption,
    forwarderId: number,
    uncertain: readonly MailIngestField[],
  ): Promise<PreparedBooking> {
    const marked = new Set(uncertain);
    const cost = await this.costOf(item, trip);
    if (cost === null) marked.add('price');
    const venue = await this.venueOf(item);
    return {
      tripId: trip.id,
      data: this.reservationData(item, trip, marked),
      venue,
      cost: cost ?? undefined,
      travelerIds: [forwarderId],
      uncertain: [...marked],
    };
  }

  /**
   * The write itself, inside the caller's transaction: the place (matched or
   * new), the booking with its stay and cost, its traveller. Nothing is
   * announced here; the caller announces once the transaction committed.
   */
  async writeInTx(prepared: PreparedBooking): Promise<WrittenBooking> {
    const tripId = String(prepared.tripId);
    const matched = prepared.venue ? await this.places.findMatchingPlaceId(tripId, prepared.venue) : null;
    const place = prepared.venue && matched === null ? await this.places.create(tripId, prepared.venue) : null;
    const placeId = matched ?? place?.id ?? undefined;
    const stay = prepared.data.create_accommodation;
    const written = await this.reservations.createWithCostInTx(
      tripId,
      { ...prepared.data, place_id: placeId, ...(stay && { create_accommodation: { ...stay, place_id: placeId } }) },
      prepared.cost,
    );
    await this.reservations.setReservationTravelers(written.reservation.id, tripId, prepared.travelerIds);
    // Read back once everything is written: the fingerprint an undo compares against is the booking as it stands.
    const stored = await this.reservations.getReservationWithJoins(written.reservation.id, tripId);
    return {
      tripId: prepared.tripId,
      reservation: written.reservation,
      place: place ? { id: place.id } : null,
      accommodationCreated: written.accommodationCreated,
      costEvents: written.costEvents,
      stayMirror: written.stayMirror,
      created: {
        reservation_ids: [written.reservation.id],
        place_ids: place ? [place.id] : [],
        budget_item_ids: createdItemIds(written.costEvents),
        file_ids: [],
        fingerprint: fingerprintOf(stored ?? written.reservation),
      },
    };
  }

  /** What a committed write tells the trip, to everyone, the forwarder's devices included. */
  async announce(written: WrittenBooking): Promise<void> {
    const { tripId } = written;
    if (written.place) this.realtime.broadcast(tripId, 'place:created', { place: written.place });
    this.realtime.broadcast(tripId, 'reservation:created', { reservation: written.reservation });
    if (written.accommodationCreated) this.realtime.broadcast(tripId, 'accommodation:created', {});
    await this.reservations.announceStayMirror(tripId, written.stayMirror);
    this.reservations.announceCost(tripId, written.costEvents, undefined);
  }

  /**
   * The mail's documents as trip files on the booking (or on the trip, for a
   * mail filed without one), when the documents addon is on: each attachment
   * of a type the trip takes, or the mail's text when none is. A failure
   * leaves the booking standing and is reported, never thrown.
   *
   * @txIndependent one file per attachment on purpose: each upload is storage
   * I/O, and a file that failed leaves the ones before it in place.
   */
  async attachDocuments(
    tripId: number,
    reservationId: number | null,
    mail: WalkedMail,
    userId: number,
  ): Promise<{ fileIds: number[]; error: string | null }> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.DOCUMENTS))) return { fileIds: [], error: null };
    const allowed = await this.settings.allowedFileTypes();
    const kept = mail.attachments.filter((file) => isUploadTypeAllowed(file.fileName, file.mimeType, allowed));
    const uploads = kept.length
      ? kept.map((file) => ({ originalname: file.fileName, mimetype: file.mimeType, bytes: file.data }))
      : [{ originalname: 'mail.txt', mimetype: 'text/plain', bytes: Buffer.from(mailText(mail), 'utf8') }];
    const fileIds: number[] = [];
    try {
      await uploads.reduce(async (previous, upload) => {
        await previous;
        const file = await this.files.createFileFromBytes(tripId, upload, userId, { reservation_id: reservationId });
        fileIds.push(file.id);
        this.realtime.broadcast(tripId, 'file:created', { file });
      }, Promise.resolve());
      return { fileIds, error: null };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logWarn(`[mail-ingest] Attaching a mail's documents to trip ${tripId} failed: ${reason}`);
      return { fileIds, error: reason.slice(0, 300) };
    }
  }

  /**
   * Removes what adding a booking created, inside the caller's transaction:
   * the booking with its stay and costs, and a place it made that nothing
   * else names any more. Answers what to announce once that committed.
   */
  async removeInTx(tripId: number, created: MailIngestCreated): Promise<RemovedBooking> {
    const removed: RemovedBooking = {
      tripId,
      reservationIds: [],
      accommodationIds: [],
      budgetItemIds: [],
      placeIds: [],
    };
    await created.reservation_ids.reduce(async (previous, id) => {
      await previous;
      const gone = await this.reservations.remove(id, tripId);
      if (!gone.deleted) return;
      removed.reservationIds.push(id);
      removed.budgetItemIds.push(...gone.deletedBudgetItemIds);
      if (gone.accommodationDeleted && gone.deleted.accommodation_id) {
        removed.accommodationIds.push(gone.deleted.accommodation_id);
      }
    }, Promise.resolve());
    await created.place_ids.reduce(async (previous, placeId) => {
      await previous;
      if (await this.candidates.placeInUse(placeId)) return;
      if ((await this.places.remove(String(tripId), String(placeId))).deleted) removed.placeIds.push(placeId);
    }, Promise.resolve());
    return removed;
  }

  /** What an undo tells the trip once it committed, and the documents it moves to the trash. */
  async announceRemoved(removed: RemovedBooking, fileIds: readonly number[]): Promise<void> {
    const { tripId } = removed;
    for (const accommodationId of removed.accommodationIds) {
      this.realtime.broadcast(tripId, 'accommodation:deleted', { accommodationId });
    }
    for (const itemId of removed.budgetItemIds) this.realtime.broadcast(tripId, 'budget:deleted', { itemId });
    for (const reservationId of removed.reservationIds) {
      this.realtime.broadcast(tripId, 'reservation:deleted', { reservationId });
    }
    for (const placeId of removed.placeIds) this.realtime.broadcast(tripId, 'place:deleted', { placeId });
    await Promise.all(fileIds.map((fileId) => this.files.softDeleteFile(fileId)));
    for (const fileId of fileIds) this.realtime.broadcast(tripId, 'file:deleted', { fileId });
  }

  /** Whether the booking was changed since it was written, by its fingerprint then and now. */
  async editedSince(tripId: number, created: MailIngestCreated): Promise<boolean> {
    if (created.fingerprint === null) return false;
    const [reservationId] = created.reservation_ids;
    if (reservationId === undefined) return true;
    const now = await this.reservations.getReservationWithJoins(reservationId, tripId);
    return !now || fingerprintOf(now) !== created.fingerprint;
  }

  private reservationData(
    item: BookingImportPreviewItem,
    trip: TripOption,
    marked: Set<MailIngestField>,
  ): CreateReservationData {
    const { _venue, _accommodation, source: _source, type_guessed: _guessed, needs_review: _review, ...fields } = item;
    const endpoints = (fields.endpoints ?? []).flatMap((endpoint) =>
      endpoint.lat != null && endpoint.lng != null ? [{ ...endpoint, lat: endpoint.lat, lng: endpoint.lng }] : [],
    );
    if (endpoints.length < (fields.endpoints ?? []).length) marked.add('endpoints');
    return {
      title: fields.title,
      type: fields.type,
      status: statusOf(item),
      reservation_time: fields.reservation_time ?? undefined,
      reservation_end_time: fields.reservation_end_time ?? undefined,
      location: fields.location ?? undefined,
      confirmation_number: fields.confirmation_number ?? undefined,
      metadata: fields.metadata,
      endpoints,
      needs_review: marked.size > 0,
      external_source: MAIL_EXTERNAL_SOURCE,
      external_id: this.externalKey(item),
      sync_enabled: false,
      ...(item.type === 'hotel' && _accommodation && { create_accommodation: stayOf(_accommodation, trip) }),
    };
  }

  /**
   * The cost a price becomes: only with the costs addon on, a price read to
   * the cent and, in a foreign currency, a rate frozen now. Undefined where
   * there is no cost to write, null where the mail names a price that cannot
   * be written without guessing (the field is marked instead).
   */
  private async costOf(item: BookingImportPreviewItem, trip: TripOption): Promise<CostEntry | null> {
    const meta = item.metadata ?? {};
    if (meta.price == null || meta.price === '') return undefined;
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.BUDGET))) return undefined;
    const currency = typeof meta.priceCurrency === 'string' ? meta.priceCurrency.toUpperCase() : null;
    const minor = parsePriceMinor(meta.price, currency ?? trip.currency);
    if (minor === null || minor <= 0) return null;
    const entry: NonNullable<CostEntry> = {
      total_price: minor / 100,
      category: typeToCostCategory(item.type),
      currency,
    };
    try {
      await this.budget.freezeForeignRate(trip.id, entry);
    } catch {
      return null;
    }
    const abroad = currency !== null && currency !== trip.currency;
    return abroad && entry.exchange_rate === undefined ? null : entry;
  }

  /** The venue as a place: its position from the mail, or looked up by its name and address. */
  private async venueOf(item: BookingImportPreviewItem): Promise<PlaceCreateInput | null> {
    const venue = item._venue;
    if (!venue?.name) return null;
    let position = venue.lat != null && venue.lng != null ? { lat: venue.lat, lng: venue.lng } : null;
    if (!position) {
      const query = venue.address ? `${venue.name} ${venue.address}` : venue.name;
      position = await this.maps.geocodeQuery(query).catch(() => null);
    }
    return {
      name: venue.name,
      lat: position?.lat,
      lng: position?.lng,
      address: venue.address,
      website: normalizePlaceWebsite(venue.website) ?? undefined,
      phone: venue.phone,
    };
  }
}

/** What an undo removed, for the announcement after it committed. */
export interface RemovedBooking {
  tripId: number;
  reservationIds: number[];
  accommodationIds: string[];
  budgetItemIds: number[];
  placeIds: number[];
}

/** The status a booking is written with: confirmed when the mail said so, pending otherwise. */
function statusOf(item: BookingImportPreviewItem): string {
  const status = item.metadata?.reservationStatus;
  return typeof status === 'string' && /confirm/i.test(status) ? 'confirmed' : 'pending';
}

/** A hotel's stay: its days by check-in and check-out date, its times of day alone. */
function stayOf(
  stay: NonNullable<BookingImportPreviewItem['_accommodation']>,
  trip: TripOption,
): NonNullable<CreateReservationData['create_accommodation']> {
  const checkIn = dateOf(stay.check_in);
  const checkOut = dateOf(stay.check_out);
  return {
    start_day_id: checkIn ? trip.days.get(checkIn) : undefined,
    end_day_id: checkOut ? trip.days.get(checkOut) : undefined,
    check_in: timeOf(stay.check_in),
    check_out: timeOf(stay.check_out),
    confirmation: stay.confirmation,
  };
}

/** The time of day of an ISO date-time, `HH:MM`; undefined for a bare date. */
function timeOf(value: string | undefined): string | undefined {
  const match = /T(\d{2}:\d{2})/.exec(value ?? '');
  return match ? match[1] : undefined;
}

/** The ids of the costs a write created. */
function createdItemIds(events: readonly CostEvent[]): number[] {
  return events.flatMap((event) => {
    if (event.event !== 'budget:created') return [];
    const item = event.payload.item;
    return item && typeof item === 'object' && 'id' in item && typeof item.id === 'number' ? [item.id] : [];
  });
}

/** A booking's content as one hash: an edit after the write changes it. */
function fingerprintOf(reservation: Record<string, unknown>): string {
  const content = FINGERPRINT_KEYS.map((key) => reservation[key] ?? null);
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

/** A mail as a text file: its subject and its readable body, without any header. */
function mailText(mail: WalkedMail): string {
  return `${mail.subject ?? ''}\n\n${mail.body}`.trim();
}
