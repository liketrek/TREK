import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import type { MailIngestPersonRow } from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../db/types';
import { BookingImportService } from '../booking-import/booking-import.service';
import { MailReadService } from '../llm-parse/mail-read.service';
import type { MailReadBooking, MailReadTrip, WalkedMail } from '../llm-parse/mail-read.types';
import { bookingStart, dateOf, normalizeReference, type MailDraft, type TripOption } from './mail-ingest-checks';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MailIngestTripsService } from './mail-ingest-trips.service';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  MAIL_INGEST_REASON_BY_LLM_OUTCOME,
  type BookingImportPreviewItem,
  type LlmParseOutcome,
  type MailIngestPrefs,
  type MailIngestReason,
} from '@trek/shared';

/** What reading a mail gave. */
export interface MailReading {
  drafts: MailDraft[];
  /** Whether a request went to the AI, which counts against the person's daily limit. */
  aiUsed: boolean;
  /** Why the mail gave no booking; null when it gave some. */
  emptyReason: MailIngestReason | null;
  /** Everything the mail and its attachments say, for the in-text check. */
  documentText: string;
}

/** The outcomes of a reading that never reached a model. */
const NOT_SENT: ReadonlySet<LlmParseOutcome> = new Set(['ai_disabled', 'no_text', 'user_cap']);
const ISO_DATE_RE = /\b(20\d\d-[01]\d-[0-3]\d)\b/g;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Reads the bookings out of a forwarded mail. The machine-readable parts
 * (JSON-LD, calendar files, passes, through kitinerary) are read always and
 * cost nothing. The AI reads the mail when the person allows it and is under
 * their daily limit, and picks a trip from the list it is given; where both
 * name a booking, the machine-readable values win, and a critical field they
 * disagree on sends the booking to the inbox (G4).
 */
@Injectable()
export class MailIngestReadingService {
  constructor(
    private readonly bookingImport: BookingImportService,
    private readonly reader: MailReadService,
    private readonly settings: MailIngestSettingsService,
    private readonly trips: MailIngestTripsService,
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
  ) {}

  /** The bookings the machine-readable parts of the mail name. */
  async readMachine(raw: Buffer, mail: WalkedMail, userId: number): Promise<BookingImportPreviewItem[]> {
    const attachments = mail.attachments.map(({ fileName, data }) => ({ fileName, data }));
    return this.bookingImport.readMailBookings(raw, attachments, userId);
  }

  /** The dates the mail names: they rank the trips the AI is offered. */
  hintDates(mail: WalkedMail, machine: readonly BookingImportPreviewItem[]): string[] {
    const named = [...`${mail.subject ?? ''}\n${mail.body}`.matchAll(ISO_DATE_RE)].map((match) => match[1]);
    const read = machine.map((item) => dateOf(bookingStart(item))).filter((date): date is string => date !== null);
    return [...new Set([...read, ...named])];
  }

  async read(args: {
    mail: WalkedMail;
    machine: BookingImportPreviewItem[];
    person: MailIngestPersonRow;
    prefs: MailIngestPrefs;
    trips: readonly TripOption[];
    now: Date;
  }): Promise<MailReading> {
    const { mail, machine, person, prefs, trips, now } = args;
    const skipped = await this.aiSkipped(person.id, prefs, now);
    const refs = trips.map((trip, i) => ({ trip, ref: `t${i + 1}` }));
    const reading = skipped
      ? null
      : await this.reader.read(
          {
            subject: mail.subject,
            date: mail.envelope.date,
            body: mail.body,
            attachments: mail.attachments,
            hints: machine.map(hintOf),
            trips: refs.map(({ trip, ref }) => this.tripForAi(trip, ref)),
          },
          person.id,
          now.toISOString().slice(0, 10),
        );
    const documentText = reading?.documentText ?? `${mail.subject ?? ''}\n${mail.body}`;
    const aiUsed = reading !== null && !NOT_SENT.has(reading.outcome);

    if (reading && reading.bookings.length > 0) {
      const tripIdOf = new Map(refs.map(({ trip, ref }) => [ref, trip.id]));
      const drafts = await this.fromAi(reading.bookings, machine, tripIdOf, reading.imageOnly);
      return { drafts, aiUsed, emptyReason: null, documentText };
    }
    if (machine.length > 0) return { drafts: machine.map(fromMachine), aiUsed, emptyReason: null, documentText };
    const emptyReason = reading ? MAIL_INGEST_REASON_BY_LLM_OUTCOME[reading.outcome] : skipped;
    return { drafts: [], aiUsed, emptyReason: emptyReason ?? 'not_a_booking', documentText };
  }

  /** Why the AI does not read this mail: switched off, not set up, or the person's daily limit is reached. */
  private async aiSkipped(userId: number, prefs: MailIngestPrefs, now: Date): Promise<MailIngestReason | null> {
    if (!prefs.ai_enabled || !(await this.reader.isAvailable(userId))) return 'ai_disabled';
    const since = dbNow(new Date(now.getTime() - DAY_MS));
    if ((await this.messages.countAiReadSince(userId, since)) >= (await this.settings.aiDailyCap())) {
      return 'ai_user_cap';
    }
    return null;
  }

  private tripForAi(trip: TripOption, ref: string): MailReadTrip {
    return {
      ref,
      title: trip.title.slice(0, 80),
      start_date: trip.start_date,
      end_date: trip.end_date,
      destinations: this.trips.destinationsOf(trip),
    };
  }

  private async fromAi(
    bookings: readonly MailReadBooking[],
    machine: readonly BookingImportPreviewItem[],
    tripIdOf: ReadonlyMap<string, number>,
    imageOnly: boolean,
  ): Promise<MailDraft[]> {
    const mapped = await Promise.all(
      bookings.map((booking) => this.bookingImport.mapAiReservations(booking.reservations, 'mail')),
    );
    return bookings
      .flatMap((booking, i) => mapped[i].map((item) => ({ booking, item })))
      .slice(0, MAIL_INGEST_LIMITS.storedBookings)
      .map(({ booking, item }) => {
        const match = machine.find((candidate) => sameBooking(candidate, item));
        const disagrees = match !== undefined && criticalDiffers(match, item);
        return {
          item: match && !disagrees ? match : item,
          source: 'ai' as const,
          kind: booking.kind,
          aiTripId: booking.tripRef === null ? null : (tripIdOf.get(booking.tripRef) ?? null),
          uncertainFields: booking.uncertainFields,
          suggestedNewTrip: booking.suggestedNewTrip,
          imageOnly: imageOnly && match === undefined,
          disagrees,
        };
      });
  }
}

function fromMachine(item: BookingImportPreviewItem): MailDraft {
  return {
    item,
    source: 'kitinerary',
    kind: 'new_booking',
    aiTripId: null,
    uncertainFields: [],
    suggestedNewTrip: null,
    imageOnly: false,
    disagrees: false,
  };
}

/** A booking as a hint for the AI: what it is, when, its reference and route, no more. */
function hintOf(item: BookingImportPreviewItem): Record<string, unknown> {
  return {
    type: item.type,
    title: item.title,
    start: bookingStart(item),
    reference: item.confirmation_number ?? null,
    route: (item.endpoints ?? []).map((endpoint) => endpoint.code ?? endpoint.name),
  };
}

/** The same booking read twice: one type and one reference, or one type starting on one day. */
function sameBooking(a: BookingImportPreviewItem, b: BookingImportPreviewItem): boolean {
  if (a.type !== b.type) return false;
  const reference = normalizeReference(a.confirmation_number);
  if (reference && reference === normalizeReference(b.confirmation_number)) return true;
  const day = dateOf(bookingStart(a));
  return day !== null && day === dateOf(bookingStart(b));
}

/** G4: a critical field both readings give, read differently: the start to the minute, the reference, the route. */
function criticalDiffers(machine: BookingImportPreviewItem, ai: BookingImportPreviewItem): boolean {
  const differs = (x: string | null, y: string | null) => x !== null && y !== null && x !== y;
  const minute = (item: BookingImportPreviewItem) => bookingStart(item)?.slice(0, 16) ?? null;
  const reference = (item: BookingImportPreviewItem) => normalizeReference(item.confirmation_number) || null;
  const route = (item: BookingImportPreviewItem) => {
    const codes = (item.endpoints ?? []).map((endpoint) => endpoint.code).filter((code): code is string => !!code);
    return codes.length >= 2 ? `${codes[0]}-${codes[codes.length - 1]}`.toUpperCase() : null;
  };
  return (
    differs(minute(machine), minute(ai)) ||
    differs(reference(machine), reference(ai)) ||
    differs(route(machine), route(ai))
  );
}
