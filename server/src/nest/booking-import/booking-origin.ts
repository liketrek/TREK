import type { BookingImportPreviewItem } from '@trek/shared';

/** The `external_source` of a booking written by the file import. */
export const IMPORT_SOURCE = 'import';

/** `external_id` is free text, but a key past this length is a document that is not a booking reference. */
const MAX_EXTERNAL_ID = 200;

/** A booking reference as an operator prints it, without the spacing and case a mail adds. */
function normalizeReference(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

/** An endpoint as the key names it: its code where it has one, else its name. */
function endpointKey(endpoint: { code?: string | null; name?: string | null } | undefined): string {
  if (!endpoint) return '';
  return (endpoint.code || endpoint.name || '').trim().toLowerCase();
}

/**
 * The key one booking of a reference is stored under, or null without a
 * reference. One reference covers several bookings (an outbound and a return
 * flight, two hotels of one trip), so the key adds what tells them apart: the
 * type, the day it starts (the check-in for a stay) and, for a transport, where
 * it runs from and to. The same booking imported twice gives the same key, and
 * `idx_reservations_external` holds one booking per key and trip.
 */
export function importExternalId(item: BookingImportPreviewItem): string | null {
  const reference = normalizeReference(item.confirmation_number);
  if (!reference) return null;
  const start = (item.reservation_time ?? item._accommodation?.check_in ?? '').slice(0, 10);
  const endpoints = item.endpoints ?? [];
  const route = endpoints.length > 0 ? `${endpointKey(endpoints[0])}-${endpointKey(endpoints.at(-1))}` : '';
  return [reference, item.type, start, route].join('|').slice(0, MAX_EXTERNAL_ID);
}
