/**
 * Where an imported booking came from (`import`, `mail`) and its key there,
 * unique per trip. Both or neither; without them the row is a hand-made
 * booking, as every write was before imports recorded their origin.
 */
export interface ReservationOrigin {
  external_source?: string;
  external_id?: string;
  /** False keeps an imported booking out of any sync back to its source; the column defaults to on. */
  sync_enabled?: boolean;
}

/**
 * A create body from a client without the origin fields. The REST and plugin
 * bodies are open objects, and an origin a caller could name would let it pose
 * as an AirTrail link or an import, so only the importers set one.
 */
export function withoutOrigin(body: Record<string, unknown>): Record<string, unknown> {
  const { external_source: _source, external_id: _id, sync_enabled: _sync, ...rest } = body;
  return rest;
}

/** The origin columns an insert names, none for a booking without an origin. */
export function originColumns(data: ReservationOrigin): {
  external_source?: string;
  external_id?: string;
  sync_enabled?: number;
} {
  if (!data.external_source || !data.external_id) return {};
  return {
    external_source: data.external_source,
    external_id: data.external_id,
    ...(data.sync_enabled !== undefined && { sync_enabled: data.sync_enabled ? 1 : 0 }),
  };
}
