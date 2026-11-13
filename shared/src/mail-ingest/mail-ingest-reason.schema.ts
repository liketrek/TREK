import type { LlmParseOutcome } from '../reservation/reservation.schema';

import { z } from 'zod';

/**
 * Why a forwarded mail, or one booking read from it, was not added on its own:
 * the one list the inbox, the notifications, the admin status card and the MCP
 * tools name a reason from. The client words each one; the server never sends
 * prose for it.
 */
export const MAIL_INGEST_REASONS = [
  // The mail as a whole.
  /** A Gmail or Outlook forwarding confirmation: its code is shown, nothing is clicked. */
  'forwarding_confirmation',
  /** A newsletter, a bulk or list mail. */
  'newsletter',
  /** An out-of-office or other automatic reply. */
  'auto_reply',
  /** Neither text nor an attachment worth reading. */
  'empty_mail',
  /** The mail could not be read: broken MIME, a scan without a model that reads images. */
  'mail_unreadable',
  /** Read, and holds no booking. */
  'not_a_booking',
  /** More than the import or the model takes. */
  'too_large',
  /** The address it came in on was renewed, revoked or belongs to someone who left the trip. */
  'address_invalid',
  /** The address took its mails for the day. */
  'address_daily_limit',
  /** Reading it failed three times. */
  'processing_failed',

  // The AI reading.
  /** The TREK Cloud allowance for the period is used up. */
  'ai_quota_exhausted',
  /** No AI reading for this person: not set up, switched off, or the new consent not given yet. */
  'ai_disabled',
  /** The person's own daily limit of AI-read mails is reached. */
  'ai_user_cap',
  /** The AI provider failed or refused. */
  'ai_provider_error',

  // The trip.
  /** No trip the person may add bookings to covers the booking's dates. */
  'no_trip_in_range',
  /** More than one trip could be meant. */
  'trip_ambiguous',
  /** The trip has no dates to check the booking against. */
  'trip_without_dates',
  /** The person may not add bookings to the trip. */
  'no_edit_permission',
  /** A demo account adds nothing. */
  'demo_mode',

  // The checks on one booking (plan G3 to G8).
  /** A date lies outside the trip, or on a day the trip has no row for (G3). */
  'outside_trip_dates',
  /** The AI read a critical field differently from the machine-readable data (G4). */
  'source_mismatch',
  /** A value that cannot be right: an unknown airport, an arrival before departure (G5). */
  'implausible',
  /** A value the AI gave is not in the mail (G6). */
  'not_in_text',
  /** Read from a page image alone, with no text to check it against (G6). */
  'image_only',
  /** No type, start, or for a transport no origin and destination. */
  'missing_critical_field',
  /** A transport, stay or rental without a booking reference. */
  'missing_confirmation',
  /** More bookings in one mail than are added on their own. */
  'too_many_bookings',
  /** A change or cancellation of an earlier booking. */
  'change_or_cancellation',
  /** The booking itself is cancelled (G8). */
  'cancelled',

  // Bookings already in the trip.
  /** A booking like it is in the trip already. */
  'possible_duplicate',
  /** The trip holds this booking, and the mail says something else about it. */
  'change_available',
  /** The same booking with different content. */
  'conflict',

  // The person's own choice.
  /** "Ask first" is on: nothing is added without a tap. */
  'ask_first',
] as const;
export const mailIngestReasonSchema = z.enum(MAIL_INGEST_REASONS);
export type MailIngestReason = z.infer<typeof mailIngestReasonSchema>;

/**
 * What the inbox notes about a mail without holding it back: an unconfirmed
 * sender is shown, never a reason to stop (owner decision 13.11.2026).
 */
export const mailIngestHintSchema = z.enum(['sender_unverified', 'attachments_skipped']);
export type MailIngestHint = z.infer<typeof mailIngestHintSchema>;

/**
 * The reason an AI reading that found nothing to add stands for; null where it
 * found bookings. One list instead of two: the outcome is how the reading
 * ended, the reason is what the person reads.
 */
export const MAIL_INGEST_REASON_BY_LLM_OUTCOME: Readonly<Record<LlmParseOutcome, MailIngestReason | null>> = {
  ok: null,
  empty: 'not_a_booking',
  no_text: 'mail_unreadable',
  quota_exhausted: 'ai_quota_exhausted',
  ai_disabled: 'ai_disabled',
  user_cap: 'ai_user_cap',
  provider_error: 'ai_provider_error',
  too_large: 'too_large',
};

/** The server's checks on a booking read from a mail, as the inbox lists them (plan G1 to G8). */
export const mailIngestCheckSchema = z.enum([
  'schema',
  'trip',
  'dates',
  'agreement',
  'plausible',
  'in_text',
  'assignment',
  'cancellation',
]);
export type MailIngestCheck = z.infer<typeof mailIngestCheckSchema>;

export const mailIngestCheckResultSchema = z.enum(['pass', 'fail', 'skipped']);
export type MailIngestCheckResult = z.infer<typeof mailIngestCheckResultSchema>;

/**
 * The fields of a booking the server may mark as uncertain: the AI's own
 * `uncertain_fields` must name these and nothing else, so a mail cannot write
 * free text through it.
 */
export const mailIngestFieldSchema = z.enum([
  'type',
  'title',
  'status',
  'reservation_time',
  'reservation_end_time',
  'confirmation_number',
  'location',
  'endpoints',
  'check_in',
  'check_out',
  'price',
  'currency',
  'travelers',
  'url',
  'operator',
  'seat',
  'class',
  'terminal',
  'gate',
  'trip',
]);
export type MailIngestField = z.infer<typeof mailIngestFieldSchema>;
