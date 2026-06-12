import { z } from 'zod';

/**
 * Airport API contract — single source of truth for the /api/airports endpoints.
 *
 * The legacy Express route (server/src/routes/airports.ts) exposes a typeahead
 * search and a single-airport lookup by IATA code, both backed by an in-memory
 * dataset (server/src/services/airportService.ts). The route treats the query as
 * an opaque string and returns an empty array when it is absent, so the search
 * query mirrors that: an optional string, no coercion.
 *
 * The bespoke 404 `{ error: 'Airport not found' }` body is reproduced in the
 * controller, not derived from this schema, so the response stays byte-identical
 * to Express.
 */

/** A single airport record as served by the dataset (matches Airport in airportService). */
export const airportSchema = z.object({
  iata: z.string(),
  icao: z.string().nullable(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  tz: z.string(),
});
export type Airport = z.infer<typeof airportSchema>;

/**
 * Search query. `q` is optional — the route answers with `[]` when it is missing
 * or empty rather than 400ing, so presence is handled in the controller.
 */
export const airportSearchQuerySchema = z.object({
  q: z.string().optional(),
});
export type AirportSearchQuery = z.infer<typeof airportSearchQuerySchema>;
