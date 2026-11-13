import type { MailIngestInboxEntry, MailIngestReason } from '@trek/shared';

/**
 * What an inbox entry offers and how it reads, worked out once for the desktop
 * dialog and the phone sheet. Pure: the reasons come from the server as codes
 * (MAIL_INGEST_REASONS) and are worded here through i18n keys, never as server
 * prose.
 */

/** The ways out of an entry, in the order the row offers them. */
export type InboxAction = 'add' | 'choose' | 'file' | 'manual' | 'readAi' | 'discard';

/** Reasons where reading the mail again with AI is worth a try. */
const AI_RETRY: ReadonlySet<MailIngestReason> = new Set(['ai_quota_exhausted', 'ai_user_cap', 'ai_provider_error', 'ai_disabled', 'not_a_booking', 'mail_unreadable']);

/** Reasons that need no booking decision at all: the entry only informs. */
const INFO_ONLY: ReadonlySet<MailIngestReason> = new Set(['forwarding_confirmation', 'newsletter', 'auto_reply']);

export function actionsOf(entry: MailIngestInboxEntry, aiAvailable: boolean): InboxAction[] {
  const reason = entry.reason ?? entry.message.reason;
  if (reason && INFO_ONLY.has(reason)) return ['discard'];
  const actions: InboxAction[] = [];
  if (entry.item) actions.push(entry.suggested_trip ? 'add' : 'choose');
  if (entry.message.attachments.length > 0 || entry.item) actions.push('file');
  actions.push('manual');
  if (aiAvailable && reason && AI_RETRY.has(reason)) actions.push('readAi');
  actions.push('discard');
  return actions;
}

/**
 * A reason in the reader's words. A switch of literal keys rather than a table,
 * so the i18n check sees every key in use and a new code fails the type check
 * here first.
 */
export function reasonText(reason: MailIngestReason, t: (key: string) => string): string {
  switch (reason) {
    case 'forwarding_confirmation':
      return t('mailInbox.reason.forwardingConfirmation');
    case 'newsletter':
      return t('mailInbox.reason.newsletter');
    case 'auto_reply':
      return t('mailInbox.reason.autoReply');
    case 'empty_mail':
      return t('mailInbox.reason.emptyMail');
    case 'mail_unreadable':
      return t('mailInbox.reason.mailUnreadable');
    case 'not_a_booking':
      return t('mailInbox.reason.notABooking');
    case 'too_large':
      return t('mailInbox.reason.tooLarge');
    case 'address_invalid':
      return t('mailInbox.reason.addressInvalid');
    case 'address_daily_limit':
      return t('mailInbox.reason.addressDailyLimit');
    case 'processing_failed':
      return t('mailInbox.reason.processingFailed');
    case 'ai_quota_exhausted':
      return t('mailInbox.reason.aiQuotaExhausted');
    case 'ai_disabled':
      return t('mailInbox.reason.aiDisabled');
    case 'ai_user_cap':
      return t('mailInbox.reason.aiUserCap');
    case 'ai_provider_error':
      return t('mailInbox.reason.aiProviderError');
    case 'no_trip_in_range':
      return t('mailInbox.reason.noTripInRange');
    case 'trip_ambiguous':
      return t('mailInbox.reason.tripAmbiguous');
    case 'trip_without_dates':
      return t('mailInbox.reason.tripWithoutDates');
    case 'no_edit_permission':
      return t('mailInbox.reason.noEditPermission');
    case 'demo_mode':
      return t('mailInbox.reason.demoMode');
    case 'outside_trip_dates':
      return t('mailInbox.reason.outsideTripDates');
    case 'source_mismatch':
      return t('mailInbox.reason.sourceMismatch');
    case 'implausible':
      return t('mailInbox.reason.implausible');
    case 'not_in_text':
      return t('mailInbox.reason.notInText');
    case 'image_only':
      return t('mailInbox.reason.imageOnly');
    case 'missing_critical_field':
      return t('mailInbox.reason.missingCriticalField');
    case 'missing_confirmation':
      return t('mailInbox.reason.missingConfirmation');
    case 'too_many_bookings':
      return t('mailInbox.reason.tooManyBookings');
    case 'change_or_cancellation':
      return t('mailInbox.reason.changeOrCancellation');
    case 'cancelled':
      return t('mailInbox.reason.cancelled');
    case 'possible_duplicate':
      return t('mailInbox.reason.possibleDuplicate');
    case 'change_available':
      return t('mailInbox.reason.changeAvailable');
    case 'conflict':
      return t('mailInbox.reason.conflict');
    case 'ask_first':
      return t('mailInbox.reason.askFirst');
  }
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
  return (entry.resolution === 'applied' || entry.resolution === 'auto_applied') && !!entry.undo_until && Date.parse(entry.undo_until) > now;
}
