import type { KiReservation } from '../booking-import/kitinerary.types';
import type { WalkedMail } from './mime-walker';
import type { LlmParseOutcome, MailAttachmentKind, MailIngestField, MailIngestSuggestedTrip } from '@trek/shared';

export type { WalkedMail };

/** An attachment of a forwarded mail as the walker kept it. */
export interface MailReadAttachment {
  fileName: string;
  kind: MailAttachmentKind;
  mimeType: string;
  data: Buffer;
}

/**
 * A trip the model may assign a booking to: a reference made up for this one
 * call (`t1`, `t2`, …) and what tells the trips apart. No id, no member, no
 * budget and no booking of the trip goes to the model.
 */
export interface MailReadTrip {
  ref: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  destinations: string[];
}

/** One forwarded mail as it goes to the model: its subject, its readable body and its attachments, no addresses. */
export interface MailReadInput {
  subject: string | null;
  /** When the booking mail was sent, as its Date header names it. */
  date: string | null;
  body: string;
  attachments: MailReadAttachment[];
  /** What the machine-readable parts already said, as a hint the model may confirm. */
  hints: unknown[];
  trips: MailReadTrip[];
}

/** One booking the model read: what kind of mail it is, its reservations, and the trip it would go to. */
export interface MailReadBooking {
  kind: 'new_booking' | 'change' | 'cancellation';
  /** The legs of one journey, or the one stay, event or rental, in schema.org's shape. */
  reservations: KiReservation[];
  /** A `ref` from the trip list, null when no trip fits. */
  tripRef: string | null;
  tripConfidence: number | null;
  uncertainFields: MailIngestField[];
  suggestedNewTrip: MailIngestSuggestedTrip | null;
}

/** How the AI reading of a mail ended, and what it found. */
export interface MailReading {
  outcome: LlmParseOutcome;
  bookings: MailReadBooking[];
  /**
   * The mail's text and the text layers of its attachments, in full: what
   * every value the model gives has to be found in.
   */
  documentText: string;
  /** Nothing but page images and photos went to the model, so no value can be checked against text. */
  imageOnly: boolean;
}
