import {
  MAIL_INGEST_ATTACHMENTS,
  MAIL_INGEST_CHECKS,
  MAIL_INGEST_CREATED,
  MAIL_INGEST_HINTS,
  MAIL_INGEST_ITEM,
  MAIL_INGEST_MATCH,
  MAIL_INGEST_UNCERTAIN_FIELDS,
} from '../../db/json-columns';
import type { MailIngestCandidateRow } from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessageHead } from '../../db/repositories/MailIngestMessages.repository';
import { parseDbTimestamp, utcSuffix } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import {
  mailIngestMessageStatusSchema,
  mailIngestReasonSchema,
  mailIngestResolutionSchema,
  mailIngestSourceSchema,
  mailIngestTransportSchema,
  type MailIngestCandidate,
  type MailIngestMessage,
  type MailIngestTripRef,
} from '@trek/shared';

/** The states an added booking can still be undone or moved from. */
export const ADDED_RESOLUTIONS: readonly string[] = ['auto_applied', 'applied'];

/**
 * How the inbox shows an entry: its booking, why it waits, the trip it
 * suggests (named only when the reader can see that trip), what adding it
 * created, and until when that can be undone. A stored value the contract
 * does not know reads as the closest safe one rather than failing the page.
 */
export function candidateView(
  row: MailIngestCandidateRow,
  trips: ReadonlyMap<number, MailIngestTripRef>,
  now: Date,
): MailIngestCandidate {
  const created = decodeJson(MAIL_INGEST_CREATED, row.created_ids_json);
  const undoUntil = parseDbTimestamp(row.undo_until);
  const undoable = ADDED_RESOLUTIONS.includes(row.resolution) && undoUntil !== null && undoUntil > now;
  return {
    id: row.id,
    message_id: row.message_id,
    item: decodeJson(MAIL_INGEST_ITEM, row.item_json),
    source: mailIngestSourceSchema.nullable().catch(null).parse(row.source),
    uncertain_fields: decodeJson(MAIL_INGEST_UNCERTAIN_FIELDS, row.uncertain_fields),
    checks: decodeJson(MAIL_INGEST_CHECKS, row.checks_json),
    suggested_trip: row.suggested_trip_id === null ? null : (trips.get(row.suggested_trip_id) ?? null),
    suggested_new_trip: decodeJson(MAIL_INGEST_MATCH, row.match_json).suggested_new_trip,
    resolution: mailIngestResolutionSchema.catch('pending').parse(row.resolution),
    reason: mailIngestReasonSchema.nullable().catch(null).parse(row.reason),
    resolved_trip_id: row.resolved_trip_id,
    reservation_ids: created.reservation_ids,
    file_ids: created.file_ids,
    created_at: isoOf(row.created_at),
    resolved_at: utcSuffix(row.resolved_at),
    undo_until: undoable ? undoUntil.toISOString() : null,
  };
}

/** How the inbox shows the mail an entry came from: its header and what it carried, never its content. */
export function messageView(head: MailIngestMessageHead): MailIngestMessage {
  return {
    id: head.id,
    transport: mailIngestTransportSchema.catch('upload').parse(head.transport),
    subject: head.subject,
    received_at: isoOf(head.received_at),
    status: mailIngestMessageStatusSchema.catch('failed').parse(head.status),
    reason: mailIngestReasonSchema.nullable().catch(null).parse(head.reason),
    hints: decodeJson(MAIL_INGEST_HINTS, head.hints),
    ai_used: head.ai_used === 1,
    trip_id: head.trip_id,
    attachments: decodeJson(MAIL_INGEST_ATTACHMENTS, head.attachments),
    forwarding_code: head.forwarding_code,
  };
}

/** A stored timestamp in the ISO spelling the contract carries. */
function isoOf(stored: string): string {
  return utcSuffix(stored) ?? stored;
}
