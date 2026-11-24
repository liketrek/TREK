import type { MailIngestInboxEntry, MailIngestReason } from '@trek/shared';

/**
 * What an inbox entry offers and how it reads, worked out once for the desktop
 * dialog and the phone sheet. Pure: the reasons come from the server as codes
 * (MAIL_INGEST_REASONS) and are worded here through i18n keys, never as server
 * prose.
 */

/** The ways out of an entry, in the order the row offers them. */
export type InboxAction = 'add' | 'choose' | 'file' | 'manual' | 'discard';

/** Reasons that need no booking decision at all: the entry only informs. */
const INFO_ONLY: ReadonlySet<MailIngestReason> = new Set(['forwarding_confirmation', 'newsletter', 'auto_reply']);

/**
 * A passing AI failure is read again by the server on its own; an allowance
 * used up leaves the form and the document, so there is no "read again" here.
 */
export function actionsOf(entry: MailIngestInboxEntry): InboxAction[] {
  const reason = entry.reason ?? entry.message.reason;
  if (reason && INFO_ONLY.has(reason)) return ['discard'];
  const actions: InboxAction[] = [];
  if (entry.item) actions.push(entry.suggested_trip ? 'add' : 'choose');
  if (entry.message.attachments.length > 0 || entry.item) actions.push('file');
  actions.push('manual');
  actions.push('discard');
  return actions;
}

type Translate = (key: string) => string;

/**
 * A reason in the reader's words. A table of literal keys, so the i18n check
 * sees every key in use, and typed by the reason codes, so a new code fails
 * the type check here first.
 */
const REASON_TEXT: Record<MailIngestReason, (t: Translate) => string> = {
  forwarding_confirmation: (t) => t('mailInbox.reason.forwardingConfirmation'),
  newsletter: (t) => t('mailInbox.reason.newsletter'),
  auto_reply: (t) => t('mailInbox.reason.autoReply'),
  empty_mail: (t) => t('mailInbox.reason.emptyMail'),
  mail_unreadable: (t) => t('mailInbox.reason.mailUnreadable'),
  not_a_booking: (t) => t('mailInbox.reason.notABooking'),
  too_large: (t) => t('mailInbox.reason.tooLarge'),
  address_invalid: (t) => t('mailInbox.reason.addressInvalid'),
  address_daily_limit: (t) => t('mailInbox.reason.addressDailyLimit'),
  processing_failed: (t) => t('mailInbox.reason.processingFailed'),
  ai_quota_exhausted: (t) => t('mailInbox.reason.aiQuotaExhausted'),
  ai_disabled: (t) => t('mailInbox.reason.aiDisabled'),
  ai_user_cap: (t) => t('mailInbox.reason.aiUserCap'),
  ai_provider_error: (t) => t('mailInbox.reason.aiProviderError'),
  no_trip_in_range: (t) => t('mailInbox.reason.noTripInRange'),
  trip_ambiguous: (t) => t('mailInbox.reason.tripAmbiguous'),
  trip_without_dates: (t) => t('mailInbox.reason.tripWithoutDates'),
  no_edit_permission: (t) => t('mailInbox.reason.noEditPermission'),
  demo_mode: (t) => t('mailInbox.reason.demoMode'),
  outside_trip_dates: (t) => t('mailInbox.reason.outsideTripDates'),
  source_mismatch: (t) => t('mailInbox.reason.sourceMismatch'),
  implausible: (t) => t('mailInbox.reason.implausible'),
  not_in_text: (t) => t('mailInbox.reason.notInText'),
  image_only: (t) => t('mailInbox.reason.imageOnly'),
  missing_critical_field: (t) => t('mailInbox.reason.missingCriticalField'),
  missing_confirmation: (t) => t('mailInbox.reason.missingConfirmation'),
  too_many_bookings: (t) => t('mailInbox.reason.tooManyBookings'),
  change_or_cancellation: (t) => t('mailInbox.reason.changeOrCancellation'),
  cancelled: (t) => t('mailInbox.reason.cancelled'),
  possible_duplicate: (t) => t('mailInbox.reason.possibleDuplicate'),
  change_available: (t) => t('mailInbox.reason.changeAvailable'),
  conflict: (t) => t('mailInbox.reason.conflict'),
  ask_first: (t) => t('mailInbox.reason.askFirst'),
};

export function reasonText(reason: MailIngestReason, t: Translate): string {
  return REASON_TEXT[reason](t);
}

/** The entry's headline: the booking's title, else the mail's subject, else nothing to show. */
export function entryTitle(entry: MailIngestInboxEntry): string | null {
  return entry.item?.title || entry.message.subject || null;
}

/** The booking's day, or days, as YYYY-MM-DD for the caller to format; null when it has none. */
export function entryDates(entry: MailIngestInboxEntry): { start: string; end: string | null } | null {
  const start = entry.item?.reservation_time?.slice(0, 10);
  if (!start) return null;
  const end = entry.item?.reservation_end_time?.slice(0, 10) ?? null;
  return { start, end: end && end !== start ? end : null };
}

/** True while an added booking can still be taken back in one tap. */
export function canUndo(entry: { undo_until: string | null; resolution: string }, now: number): boolean {
  return (
    (entry.resolution === 'applied' || entry.resolution === 'auto_applied') &&
    !!entry.undo_until &&
    Date.parse(entry.undo_until) > now
  );
}
