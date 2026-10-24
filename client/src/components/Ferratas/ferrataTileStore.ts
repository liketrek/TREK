import {
  type Ferrata,
  type FerrataBbox,
  type FerratasResponse,
  type FerrataTile,
  type FerrataTileRange,
  ferrataTileKey,
  ferrataTileRange,
  ferrataTileRequests,
  ferrataTilesOf,
} from '@trek/shared';

import type { FerrataTileRow } from '../../repo/ferrataRepo';
import { ferrataPointsBbox } from './ferrataGroups';
import { ferrataPositions } from './ferrataModel';

/**
 * The via ferrata layer's tiles for one trip, outside React.
 *
 * Every ferrata loaded for the trip stays, in a map by OSM id, whatever the
 * map does afterwards: a pan or a zoom only asks for the tiles of the shared
 * 0.05 degree grid that are not loaded yet, never for ones it has, and never
 * drops any. Tiles wanted for the view on screen go first; the ring around it
 * and the trip's area load behind them. The two have lanes of their own: the
 * view's requests run beside a prefetch on its way rather than behind it,
 * VISIBLE_AT_ONCE of them at a time, while prefetches go one at a time, so
 * the view is never kept waiting by a prefetch. Answers go to `persist` per tile, and a
 * trip's cached tiles come back through `hydrate`, which holds every request
 * until the cache has been read, so a cached tile is never asked for again.
 *
 * Built for `useSyncExternalStore`: `subscribe` and `getSnapshot`, and the
 * snapshot is a new object only when something in it changed.
 */

type FerrataTilePriority = 'visible' | 'background';

/**
 * Why the last request for the view failed: `refused` (a 400, the server would
 * not take the box, read as "zoom in") or `unavailable` (anything else: the
 * Overpass mirrors, worth another try).
 */
type FerrataTileFailure = 'refused' | 'unavailable';

export interface FerrataTileSnapshot {
  /** Every tile loaded for the trip, cached or fetched. */
  loaded: ReadonlySet<string>;
  /** Every ferrata those tiles hold, each once. */
  ferratas: readonly Ferrata[];
  /** Tiles wanted for the view that are queued or on their way. */
  waiting: ReadonlySet<string>;
  failure: FerrataTileFailure | null;
  /** True when an answer for the view was cut at the server's cap. */
  truncated: boolean;
  /** Whether the cached tiles have been read. */
  hydrated: boolean;
}

interface FerrataTileStoreDeps {
  fetch: (bbox: FerrataBbox, signal: AbortSignal) => Promise<FerratasResponse>;
  persist?: (rows: FerrataTileRow[]) => Promise<void>;
  now?: () => number;
  /** How long to wait before asking again for the view after the mirrors failed it. */
  retryDelaysMs?: readonly number[];
}

interface Job {
  bbox: FerrataBbox;
  range: FerrataTileRange;
  keys: string[];
  priority: FerrataTilePriority;
}

const FERRATA_RETRY_DELAYS_MS = [5_000, 15_000, 45_000] as const;

/** Requests for the view on screen that may be on their way at once. */
const VISIBLE_AT_ONCE = 2;
/** Prefetches on their way at once: one, beside the view's own. */
const BACKGROUND_AT_ONCE = 1;

/** A job on its way, and the lane it took: the lane is what it counts against, even once it is moved up. */
interface Flight {
  job: Job;
  lane: FerrataTilePriority;
  controller: AbortController;
}

function failureOf(error: unknown): FerrataTileFailure {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status;
  return status === 400 ? 'refused' : 'unavailable';
}

/**
 * The ferratas of an answer per tile of the box it was for: each one goes to
 * every tile its own box reaches into, and every tile gets a row, an empty one
 * included, because "no ferrata here" is an answer worth keeping too.
 */
export function ferrataRowsOf(range: FerrataTileRange, ferratas: readonly Ferrata[], at: number): FerrataTileRow[] {
  const rows = new Map(ferrataTilesOf(range).map((tile) => [ferrataTileKey(tile), [] as Ferrata[]]));
  for (const ferrata of ferratas) {
    const box = ferrataPointsBbox(ferrataPositions(ferrata));
    if (!box) continue;
    const own = ferrataTileRange(box);
    const minRow = Math.max(own.minRow, range.minRow);
    const maxRow = Math.min(own.maxRow, range.maxRow);
    const minCol = Math.max(own.minCol, range.minCol);
    const maxCol = Math.min(own.maxCol, range.maxCol);
    if (minRow > maxRow || minCol > maxCol) continue;
    for (const tile of ferrataTilesOf({ minRow, maxRow, minCol, maxCol }))
      rows.get(ferrataTileKey(tile))?.push(ferrata);
  }
  return [...rows].map(([tile, list]) => ({ tile, fetchedAt: at, ferratas: list }));
}

export class FerrataTileStore {
  private readonly loaded = new Set<string>();
  private readonly byId = new Map<string, Ferrata>();
  /** Tiles in a queued or in-flight job, so no tile is asked for twice at once. */
  private readonly pending = new Set<string>();
  private readonly waiting = new Set<string>();
  private queue: Job[] = [];
  private readonly inFlight = new Set<Flight>();
  private failure: FerrataTileFailure | null = null;
  private truncated = false;
  private hydrated = false;
  private hydrating = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;
  private readonly listeners = new Set<() => void>();
  private snapshot: FerrataTileSnapshot;
  /** Writes to the device cache that failed; the tiles still draw, they only load again next time. */
  persistFailures = 0;

  constructor(private readonly deps: FerrataTileStoreDeps) {
    this.snapshot = this.build();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): FerrataTileSnapshot => this.snapshot;

  /** Starts reading the cache; requests wait until `hydrate` hands its rows over. */
  beginHydration(): boolean {
    if (this.hydrated || this.hydrating) return false;
    this.hydrating = true;
    return true;
  }

  /** The cached tiles. Queued jobs whose tiles all came back from the cache are dropped. */
  hydrate(rows: readonly FerrataTileRow[]): void {
    for (const row of rows) {
      this.loaded.add(row.tile);
      this.waiting.delete(row.tile);
      for (const ferrata of row.ferratas) this.byId.set(ferrata.id, ferrata);
    }
    this.hydrating = false;
    this.hydrated = true;
    this.queue = this.queue.filter((job) => {
      if (!job.keys.every((key) => this.loaded.has(key))) return true;
      for (const key of job.keys) this.pending.delete(key);
      return false;
    });
    this.emit();
    this.pump();
  }

  /**
   * Asks for the tiles not loaded or on their way yet. `visible` ones jump the
   * queue, and a background job already holding one of them is moved up with
   * it; the error of an earlier view is cleared, its retry called off.
   */
  want(tiles: readonly FerrataTile[], priority: FerrataTilePriority): void {
    const keys = tiles.map(ferrataTileKey);
    if (priority === 'visible') {
      this.clearRetry();
      // The ones on their way too, so their failure is reported and retried like the view's own.
      const jobs = [...[...this.inFlight].map((flight) => flight.job), ...this.queue];
      for (const job of jobs) {
        if (job.priority === 'background' && job.keys.some((key) => keys.includes(key))) job.priority = 'visible';
      }
      for (const key of keys) if (!this.loaded.has(key)) this.waiting.add(key);
    }
    const missing = tiles.filter((tile, index) => !this.loaded.has(keys[index]) && !this.pending.has(keys[index]));
    for (const request of ferrataTileRequests(missing)) {
      const jobKeys = ferrataTilesOf(request.range).map(ferrataTileKey);
      for (const key of jobKeys) this.pending.add(key);
      this.queue.push({ ...request, keys: jobKeys, priority });
    }
    this.emit();
    this.pump();
  }

  /** Calls off everything queued, in flight or due for a retry; what is loaded stays. */
  stop(): void {
    this.clearRetry();
    for (const flight of this.inFlight) flight.controller.abort();
    this.inFlight.clear();
    this.queue = [];
    this.pending.clear();
    this.waiting.clear();
    this.emit();
  }

  private clearRetry(): void {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  /** How many jobs of a lane are on their way. */
  private flying(lane: FerrataTilePriority): number {
    let count = 0;
    for (const flight of this.inFlight) if (flight.lane === lane) count += 1;
    return count;
  }

  /** The next queued job of a priority, taken off the queue, or null for none. */
  private take(priority: FerrataTilePriority): Job | null {
    const index = this.queue.findIndex((job) => job.priority === priority);
    if (index < 0) return null;
    const [job] = this.queue.splice(index, 1);
    return job ?? null;
  }

  /** Starts what the lanes have room for: the view's jobs in theirs, the prefetches in theirs. */
  private pump(): void {
    if (!this.hydrated) return;
    for (const [lane, room] of [
      ['visible', VISIBLE_AT_ONCE],
      ['background', BACKGROUND_AT_ONCE],
    ] as const) {
      while (this.flying(lane) < room) {
        const job = this.take(lane);
        if (!job) break;
        this.launch(job, lane);
      }
    }
  }

  private launch(job: Job, lane: FerrataTilePriority): void {
    const controller = new AbortController();
    const flight: Flight = { job, lane, controller };
    this.inFlight.add(flight);
    void this.deps.fetch(job.bbox, controller.signal).then(
      (reply) => {
        if (controller.signal.aborted) return;
        this.inFlight.delete(flight);
        this.settle(job, reply);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        this.inFlight.delete(flight);
        this.fail(job, failureOf(error));
      }
    );
  }

  private settle(job: Job, reply: FerratasResponse): void {
    const at = (this.deps.now ?? Date.now)();
    for (const ferrata of reply.ferratas) this.byId.set(ferrata.id, ferrata);
    for (const key of job.keys) {
      this.loaded.add(key);
      this.pending.delete(key);
      this.waiting.delete(key);
    }
    if (job.priority === 'visible') {
      this.failure = null;
      this.retryAttempt = 0;
      this.truncated = reply.truncated;
    }
    const persist = this.deps.persist;
    if (persist) {
      void persist(ferrataRowsOf(job.range, reply.ferratas, at)).catch(() => {
        this.persistFailures += 1;
      });
    }
    this.emit();
    this.pump();
  }

  private fail(job: Job, failure: FerrataTileFailure): void {
    for (const key of job.keys) this.pending.delete(key);
    if (job.priority === 'visible') {
      // The view's tiles are no longer on their way: the status reads the failure instead.
      for (const key of job.keys) this.waiting.delete(key);
      this.failure = failure;
      const delay = (this.deps.retryDelaysMs ?? FERRATA_RETRY_DELAYS_MS)[this.retryAttempt];
      if (failure === 'unavailable' && delay !== undefined) {
        this.retryAttempt += 1;
        const tiles = ferrataTilesOf(job.range);
        this.clearRetry();
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          this.want(tiles, 'visible');
        }, delay);
      }
    }
    this.emit();
    this.pump();
  }

  private build(): FerrataTileSnapshot {
    return {
      loaded: new Set(this.loaded),
      ferratas: [...this.byId.values()],
      waiting: new Set(this.waiting),
      failure: this.failure,
      truncated: this.truncated,
      hydrated: this.hydrated,
    };
  }

  private emit(): void {
    const next = this.build();
    const prev = this.snapshot;
    // An unchanged list keeps its reference, so what is drawn from it is not rebuilt.
    const sameFerratas =
      prev.ferratas.length === next.ferratas.length &&
      prev.ferratas.every((ferrata, index) => ferrata === next.ferratas[index]);
    const same =
      sameFerratas &&
      prev.failure === next.failure &&
      prev.truncated === next.truncated &&
      prev.hydrated === next.hydrated &&
      sameSet(prev.loaded, next.loaded) &&
      sameSet(prev.waiting, next.waiting);
    if (same) return;
    this.snapshot = sameFerratas ? { ...next, ferratas: prev.ferratas } : next;
    for (const listener of [...this.listeners]) listener();
  }
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}
