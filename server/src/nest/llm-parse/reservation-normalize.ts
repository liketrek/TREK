import { toIsoCurrency } from './currency-code';
import { extractTotalPrice } from './router/extraction-router';

/** Root-level keys in the schema.org reservation shape; everything else is trip-specific. */
const ROOT_KEYS = new Set([
  '@type',
  'reservationNumber',
  'checkinTime',
  'checkoutTime',
  'pickupTime',
  'dropoffTime',
  'startTime',
  'endTime',
  'pickupLocation',
  'dropoffLocation',
  'seat',
  'class',
  'platform',
  'price',
  'priceCurrency',
  'reservationFor',
]);

/**
 * Small models often flatten the type-specific fields (flightNumber, airline,
 * departureAirport, …) onto the reservation root instead of nesting them under
 * `reservationFor`, which is where the kitinerary mapper reads them. When
 * `reservationFor` is missing/empty, fold the non-root keys into it so the
 * existing mappers work unchanged.
 */
export function normalizeNode(node: Record<string, unknown>): Record<string, unknown> {
  const rf = node.reservationFor;
  if (rf && typeof rf === 'object' && Object.keys(rf as object).length > 0) return node;

  const out: Record<string, unknown> = {};
  const reservationFor: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (ROOT_KEYS.has(k)) out[k] = v;
    else reservationFor[k] = v;
  }
  // Nothing to fold (no flattened type fields) — leave the node as-is.
  if (Object.keys(reservationFor).length === 0) return node;
  out.reservationFor = reservationFor;
  return out;
}

/**
 * The node with its `priceCurrency` as an ISO 4217 code, or without one.
 *
 * What the model wrote wins when it reads as a code. Otherwise, and only when
 * the node carries a price, the currency comes from the document's own total
 * (a Booking.com print shows `€ 89,35`). When neither yields a code the field
 * is dropped: an empty currency lets the cost form pick one, a made up one
 * (`EURials`, #2477) is saved and cannot be converted.
 */
export function normalizeCurrency(node: Record<string, unknown>, documentText: string | undefined): Record<string, unknown> {
  const hasPrice = node.price != null && node.price !== '';
  if (node.priceCurrency == null && !hasPrice) return node;
  const code =
    toIsoCurrency(node.priceCurrency) ??
    (hasPrice && documentText ? toIsoCurrency(extractTotalPrice(documentText)?.currency) : undefined);
  const { priceCurrency: _dropped, ...rest } = node;
  return code ? { ...rest, priceCurrency: code } : rest;
}
