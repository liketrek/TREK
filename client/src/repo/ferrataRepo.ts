import {
  type Ferrata,
  type FerratasResponse,
  ferrataSchema,
  ferratasResponseSchema,
  parseFerrataTileKey,
} from '@trek/shared';

import { ferratasApi } from '../api/ferratas';
import { offlineDb } from '../db/offlineDb';
import { isEffectivelyOffline } from '../sync/networkMode';

/** How long a loaded tile stays good on this device; past it the tile is asked for again. */
export const FERRATA_TILE_FRESH_MS = 7 * 24 * 60 * 60 * 1000;

/** One loaded tile of the layer: its key, when it was loaded and the ferratas that reach into it. */
export interface FerrataTileRow {
  tile: string;
  fetchedAt: number;
  ferratas: Ferrata[];
}

/** The cached ferratas that still match the contract; a row an older bundle wrote off it is left out, not drawn. */
function validFerratas(rows: unknown[]): Ferrata[] {
  return rows.flatMap((row) => {
    const parsed = ferrataSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * Via ferratas from OpenStreetMap, for the map layer.
 *
 * Read through the network per tile of the shared 0.05 degree grid, and kept
 * on the device per trip in `ferrataTiles` (Dexie), so a trip's lines draw at
 * once on the next visit and offline. The copy is read-only map data, not trip
 * data, so there is no write queue: a tile is good for FERRATA_TILE_FRESH_MS
 * and then loaded again.
 *
 * Offline (by circumstance or by the manual switch) no request is made at all.
 * Every answer is parsed against the shared contract rather than cast, because
 * its names and grades go on to be drawn on the map.
 */
export const ferrataRepo = {
  async list(tripId: number, bbox: string, signal: AbortSignal): Promise<FerratasResponse> {
    if (isEffectivelyOffline()) throw new Error('Via ferratas need a connection');
    return ferratasResponseSchema.parse(await ferratasApi.list(tripId, bbox, signal));
  },

  /** The trip's tiles loaded within the last FERRATA_TILE_FRESH_MS; older ones are dropped on the way. */
  async cachedTiles(tripId: number, now: number = Date.now()): Promise<FerrataTileRow[]> {
    const rows = await offlineDb.ferrataTiles.where('tripId').equals(tripId).toArray();
    const fresh: FerrataTileRow[] = [];
    const stale: Array<[number, string]> = [];
    for (const row of rows) {
      const current = now - row.fetchedAt < FERRATA_TILE_FRESH_MS && parseFerrataTileKey(row.tile) !== null;
      if (!current) stale.push([tripId, row.tile]);
      else
        fresh.push({
          tile: row.tile,
          fetchedAt: row.fetchedAt,
          ferratas: validFerratas(Array.isArray(row.ferratas) ? row.ferratas : []),
        });
    }
    if (stale.length) await offlineDb.ferrataTiles.bulkDelete(stale);
    return fresh;
  },

  /** Which account's database the cache is in now, to hand back to `saveTiles` once an answer arrives. */
  cacheName(): string {
    return offlineDb.name;
  },

  /**
   * Keeps loaded tiles for the trip. Skipped when the account changed since
   * the answer was asked for, so one user's map data never lands in another's
   * database.
   */
  async saveTiles(tripId: number, rows: readonly FerrataTileRow[], cacheName: string = offlineDb.name): Promise<void> {
    if (rows.length === 0 || offlineDb.name !== cacheName) return;
    await offlineDb.ferrataTiles.bulkPut(
      rows.map((row) => ({ tripId, tile: row.tile, fetchedAt: row.fetchedAt, ferratas: row.ferratas }))
    );
  },
};
