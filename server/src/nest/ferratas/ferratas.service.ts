import { FerrataTiles } from '../../db/entities/FerrataTiles.entity';
import { FERRATA_TILE_PAYLOAD, type FerrataTilePayload } from '../../db/json-columns';
import type { FerrataTileRow, FerrataTilesRepository } from '../../db/repositories/FerrataTiles.repository';
import { decodeJsonResult, encodeJson, logJsonFailure } from '../../utils/json-column';
import { logWarn } from '../audit/audit-log.logger';
import { badRequest, DomainError } from '../common/domain-error';
import { withRequestContext } from '../database/request-context';
import { UnitOfWork } from '../database/unit-of-work';
import { FerratasOverpassClient } from './ferratas-overpass.client';
import {
  buildFerrataQuery,
  ferrataTileBlocks,
  ferrataTileKeysFor,
  ferrataTilesBbox,
  splitFerratasByTile,
  toFerratas,
} from './ferratas.helpers';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  FERRATAS_ATTRIBUTION,
  FERRATAS_RESULT_CAP,
  FERRATAS_UNAVAILABLE_CODE,
  type Ferrata,
  type FerrataBbox,
  type FerratasResponse,
} from '@trek/shared';

/**
 * Via ferratas change on the scale of seasons. A cell older than this is still
 * served at once, and asked for again in the background.
 */
export const FERRATA_TILE_STALE_MS = 30 * 24 * 60 * 60 * 1000;

/** The most cells held in memory in front of the table; the least recently used goes first. */
const FERRATA_TILE_MEMORY_MAX = 2000;

/**
 * The most cells one request may cover. The contract's span cap already keeps
 * a box to 11 by 11 cells; this holds the service to a bound of its own.
 */
const FERRATA_TILES_MAX_PER_REQUEST = 200;

/**
 * The most Overpass queries this process runs at once. A box is queried in
 * blocks of 0.1 degree, so a wide one turns into several queries; they wait
 * their turn here rather than all hitting the public mirrors together.
 */
const FERRATA_QUERIES_AT_ONCE = 2;

/** `fetched_at` is kept in seconds, so the epoch fits a 32-bit integer column on Postgres too. */
const MS_PER_S = 1000;

/**
 * `fetched_at` of a cell whose answer was cut at the cap: the oldest possible,
 * so a restart serves it and asks again rather than keeping a partial cell for
 * FERRATA_TILE_STALE_MS. This process keeps it for what it is meanwhile.
 */
const FERRATA_CUT_TILE_FETCHED_AT = 0;

export const FERRATAS_UNAVAILABLE_MESSAGE = 'Via ferrata data is unavailable right now';

interface StoredTile {
  fetchedAt: number;
  payload: FerrataTilePayload;
}

type TileBatch = Promise<ReadonlyMap<string, StoredTile>>;

/**
 * The via ferratas inside a box, from OpenStreetMap.
 *
 * The unit is one cell of the 0.05 degree grid. A box is resolved into its
 * cells, each served from `ferrata_tiles` (with a small LRU in front), and
 * Overpass is asked only for the cells never fetched: one query per
 * grid-aligned block of FERRATA_TILES_PER_REQUEST_SIDE cells a side (0.1
 * degree), at most FERRATA_QUERIES_AT_ONCE at a time, each answer split back
 * per cell and stored. A block whose answer was cut at the cap is asked again
 * cell by cell, and a cell still cut on its own is kept but stored as old, so
 * it is not served as complete for a month. A cell older than
 * FERRATA_TILE_STALE_MS is served as it is and refreshed in the background,
 * in queries of its own, so a refresh can never fail the request that saw
 * it; nothing is deleted. Concurrent requests for a cell share one call.
 *
 * A request fails only when a cell it needs has never been fetched and
 * Overpass fails too: the client gets a 502 `{ error, code }` it can show,
 * never a 500 with a stack. A failed background refresh is logged and leaves
 * the old cell in place.
 */
@Injectable()
export class FerratasService {
  private readonly memory = new Map<string, StoredTile>();
  private readonly pending = new Map<string, TileBatch>();
  /** Overpass queries running now, and the ones waiting for a turn. */
  private running = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(
    private readonly overpass: FerratasOverpassClient,
    @InjectRepository(FerrataTiles) private readonly tiles: FerrataTilesRepository,
    private readonly uow: UnitOfWork,
    private readonly orm: MikroORM,
  ) {}

  /** The via ferratas that reach into `bbox`, gathered from the cells it covers. */
  async list(bbox: FerrataBbox, now: number = Date.now()): Promise<FerratasResponse> {
    const keys = ferrataTileKeysFor(bbox, FERRATA_TILES_MAX_PER_REQUEST);
    if (keys === null) throw badRequest(FERRATA_BBOX_TOO_LARGE_MESSAGE);

    const tiles = new Map(await this.stored(keys));
    const stale = keys.filter((key) => {
      const tile = tiles.get(key);
      return tile !== undefined && now - tile.fetchedAt >= FERRATA_TILE_STALE_MS && !this.pending.has(key);
    });
    const missing = keys.filter((key) => !tiles.has(key));

    if (stale.length > 0) this.refreshInBackground(stale, now);
    if (missing.length > 0) {
      for (const [key, tile] of await this.fetchMissing(missing, now)) tiles.set(key, tile);
    }
    return gather(keys, tiles, bbox);
  }

  /** The cells among `keys` that were ever fetched: memory first, the table for the rest. */
  private async stored(keys: readonly string[]): Promise<Map<string, StoredTile>> {
    const found = new Map<string, StoredTile>();
    const unread: string[] = [];
    for (const key of keys) {
      const hit = this.memory.get(key);
      if (hit) {
        this.remember(key, hit);
        found.set(key, hit);
      } else {
        unread.push(key);
      }
    }
    for (const row of await this.tiles.findByKeys(unread)) {
      const decoded = decodeJsonResult(FERRATA_TILE_PAYLOAD, row.payload);
      if (!decoded.ok || decoded.value === null) {
        logJsonFailure(FERRATA_TILE_PAYLOAD, decoded.ok ? 'schema' : decoded.reason, row.tile_key);
        continue;
      }
      const tile = { fetchedAt: row.fetched_at * MS_PER_S, payload: decoded.value };
      this.remember(row.tile_key, tile);
      found.set(row.tile_key, tile);
    }
    return found;
  }

  /**
   * The cells never fetched, awaited. A cell another request is already
   * fetching joins that batch; the rest go out one batch per block.
   */
  private async fetchMissing(missing: readonly string[], now: number): Promise<Map<string, StoredTile>> {
    const tiles = new Map<string, StoredTile>();
    const batches = new Set<TileBatch>();
    const own: string[] = [];
    for (const key of missing) {
      const hit = this.memory.get(key);
      const inFlight = this.pending.get(key);
      if (hit) tiles.set(key, hit);
      else if (inFlight !== undefined) batches.add(inFlight);
      else own.push(key);
    }
    for (const block of ferrataTileBlocks(own)) batches.add(this.batch(block, now));

    for (const answer of await Promise.all(batches)) {
      for (const [key, tile] of answer) tiles.set(key, tile);
    }
    return tiles;
  }

  /** Refreshes old cells without holding up the request, a batch per block; a failure only costs the refresh. */
  private refreshInBackground(keys: readonly string[], now: number): void {
    for (const block of ferrataTileBlocks(keys)) {
      this.batch(block, now).catch((err: unknown) => {
        const reason = err instanceof Error ? err.message : String(err);
        logWarn(`[Ferratas] background refresh of ${block.length} tile(s) failed: ${reason}`);
      });
    }
  }

  /**
   * One Overpass query for `keys`, shared with every request that needs one of
   * them until it settles. It runs in a request context of its own: it can
   * outlive the request that started it.
   *
   * @txStandalone a cache fill: each block is stored whole in its own
   * transaction after its own Overpass answer, and a lost one is asked again.
   */
  private batch(keys: readonly string[], now: number): TileBatch {
    const run = withRequestContext(this.orm, () => this.fetchAndStore(keys, now));
    for (const key of keys) this.pending.set(key, run);
    const settle = () => {
      for (const key of keys) {
        if (this.pending.get(key) === run) this.pending.delete(key);
      }
    };
    void run.then(settle, settle);
    return run;
  }

  /**
   * Asks Overpass for `keys` and stores the answer per cell. An answer cut at
   * the cap is not stored for a block: its cells are asked again one by one,
   * which is the most a cut answer can be narrowed. A single cell still cut is
   * kept in memory as it is, and stored as old, so the next start refreshes it.
   */
  private async fetchAndStore(keys: readonly string[], now: number): Promise<Map<string, StoredTile>> {
    const elements = await this.queryOverpass(keys);
    const { ferratas, truncated } = toFerratas(elements);
    if (truncated && keys.length > 1) {
      const tiles = new Map<string, StoredTile>();
      const answers = await Promise.all(keys.map((key) => this.fetchAndStore([key], now)));
      for (const answer of answers) for (const [key, tile] of answer) tiles.set(key, tile);
      return tiles;
    }
    const byTile = splitFerratasByTile(ferratas, new Set(keys));
    const storedAt = truncated ? FERRATA_CUT_TILE_FETCHED_AT : Math.floor(now / MS_PER_S);

    const tiles = new Map<string, StoredTile>();
    const rows: FerrataTileRow[] = [];
    for (const key of keys) {
      const payload: FerrataTilePayload = { ferratas: byTile.get(key) ?? [], truncated };
      tiles.set(key, { fetchedAt: now, payload });
      rows.push({ tile_key: key, payload: encodeJson(FERRATA_TILE_PAYLOAD, payload), fetched_at: storedAt });
    }
    try {
      await this.uow.transactional(() => this.tiles.upsertTiles(rows));
    } catch (err) {
      // The answer is still good for this process; the next start asks again.
      const reason = err instanceof Error ? err.message : String(err);
      logWarn(`[Ferratas] could not store ${rows.length} tile(s): ${reason}`);
    }
    for (const [key, tile] of tiles) this.remember(key, tile);
    return tiles;
  }

  /** One Overpass query for the box around `keys`, once a turn is free; a failure becomes the 502 the client reads. */
  private async queryOverpass(keys: readonly string[]): Promise<unknown[]> {
    await this.turn();
    try {
      return await this.overpass.query(buildFerrataQuery(ferrataTilesBbox(keys)));
    } catch {
      // The client already logged why each mirror failed.
      throw new DomainError(502, FERRATAS_UNAVAILABLE_MESSAGE, {
        code: FERRATAS_UNAVAILABLE_CODE,
        details: { code: FERRATAS_UNAVAILABLE_CODE },
      });
    } finally {
      // The turn passes straight to the next query waiting, or is given back.
      const next = this.waiting.shift();
      if (next) next();
      else this.running -= 1;
    }
  }

  /** Resolves once the caller holds one of FERRATA_QUERIES_AT_ONCE turns, handed over by a query that finished. */
  private async turn(): Promise<void> {
    if (this.running < FERRATA_QUERIES_AT_ONCE) {
      this.running += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  private remember(key: string, tile: StoredTile): void {
    this.memory.delete(key);
    while (this.memory.size >= FERRATA_TILE_MEMORY_MAX) {
      const oldest = this.memory.keys().next();
      if (oldest.done) break;
      this.memory.delete(oldest.value);
    }
    this.memory.set(key, tile);
  }
}

/** A ferrata belongs to the box when any point of its line lies inside it. */
function reachesInto(ferrata: Ferrata, bbox: FerrataBbox): boolean {
  return ferrata.geometry.some(
    ([lat, lng]) => lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east,
  );
}

/**
 * The answer out of the cells: every ferrata once, however many cells it
 * crosses, kept when it reaches into the asked box, cut at the contract's cap.
 * The answer is marked cut when any cell came from a cut Overpass answer.
 */
function gather(keys: readonly string[], tiles: ReadonlyMap<string, StoredTile>, bbox: FerrataBbox): FerratasResponse {
  const seen = new Set<string>();
  const ferratas: Ferrata[] = [];
  let truncated = false;
  for (const key of keys) {
    const tile = tiles.get(key);
    if (!tile) continue;
    truncated ||= tile.payload.truncated;
    for (const ferrata of tile.payload.ferratas) {
      if (seen.has(ferrata.id)) continue;
      seen.add(ferrata.id);
      if (reachesInto(ferrata, bbox)) ferratas.push(ferrata);
    }
  }
  return {
    ferratas: ferratas.slice(0, FERRATAS_RESULT_CAP),
    truncated: truncated || ferratas.length > FERRATAS_RESULT_CAP,
    source: 'openstreetmap',
    attribution: FERRATAS_ATTRIBUTION,
  };
}
