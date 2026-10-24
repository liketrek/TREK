import { DataPathsService } from '../app-config/data-paths.service';
import { logError, logInfo, logWarn } from '../audit/audit-log.logger';
import { TrekPlacesWinterService } from '../maps/trek-places-winter.service';
import { SGR_FORMAT } from './ski-graph.contract';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import {
  winterAttributionSchema,
  winterIndexSchema,
  type WinterIndex,
  type WinterIndexRow,
  type WinterMeta,
} from '@trek/shared';

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

/**
 * The ski areas the piste router plans on (spec 7.2, 7.3): the Places host's
 * index of every area, and each area's graph as it was downloaded. No table:
 * the index is a file `data/ski/index-<sha8>.json`, each area a file
 * `data/ski/areas/<id>@<sha8>.sgr.gz`, written beside its name and renamed
 * into place. An area is downloaded once, when a planner first plans in it,
 * and checked against the index's checksum before it is kept; a copy of an
 * older build stays as the fallback while the Places host cannot be reached.
 */

/** One area of the index with where its padded box lies. */
export interface IndexedArea {
  row: WinterIndexRow;
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface SkiIndex {
  build: string;
  indexSha: string;
  attribution: string;
  areas: IndexedArea[];
  /** Area positions by 0.1 degree cell of their padded box. */
  grid: Map<number, number[]>;
}

/** An area's graph file, and whether it is an older build kept for when the Places host is down. */
export interface AreaFile {
  file: string;
  stale: boolean;
}

/** Why a leg has no area to be planned on. */
type AreaPick =
  | { status: 'ok'; areas: IndexedArea[] }
  | { status: 'no_area'; at: { lat: number; lng: number } }
  | { status: 'cross_area'; at: { lat: number; lng: number } };

/** An area's box is widened by this much, so a click just past its outermost run still finds it. */
const PAD_M = 300;
/** At most this many areas are stitched for one leg. */
const MAX_AREAS = 4;
const CELL_DEG = 0.1;
/** An area a download failed for counts as unavailable this long. */
const FAILED_FOR_MS = 5 * 60 * 1000;
/** Area files not used for this long are swept. */
export const UNUSED_FOR_MS = 90 * 24 * 60 * 60 * 1000;
export const DEFAULT_ATTRIBUTION = '© OpenStreetMap contributors, ODbL. Terrain: Mapzen Terrarium';

const storedIndexSchema = z.object({
  meta: z.object({ build: z.string(), indexSha: z.string(), attribution: winterAttributionSchema }),
  index: winterIndexSchema,
});

const cellKey = (y: number, x: number): number => (y + 1000) * 10_000 + (x + 2000);
const safeId = (id: string): string => id.replace(':', '_');
const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

function indexed(row: WinterIndexRow): IndexedArea {
  const [minLng, minLat, maxLng, maxLat] = row.bbox;
  const padLat = PAD_M / 111_195;
  const padLng = PAD_M / (111_195 * Math.max(0.05, Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)));
  return { row, minLat: minLat - padLat, minLng: minLng - padLng, maxLat: maxLat + padLat, maxLng: maxLng + padLng };
}

function contains(area: IndexedArea, point: { lat: number; lng: number }): boolean {
  return point.lat >= area.minLat && point.lat <= area.maxLat && point.lng >= area.minLng && point.lng <= area.maxLng;
}

function touches(a: IndexedArea, b: IndexedArea): boolean {
  return a.minLat <= b.maxLat && b.minLat <= a.maxLat && a.minLng <= b.maxLng && b.minLng <= a.maxLng;
}

/** The id an area's pieces share: `w:12` for `w:12-1a`. */
const baseId = (id: string): string => id.split('-')[0] as string;

function distanceTo(area: IndexedArea, point: { lat: number; lng: number }): number {
  const lat = (area.minLat + area.maxLat) / 2;
  const lng = (area.minLng + area.maxLng) / 2;
  return Math.hypot(lat - point.lat, (lng - point.lng) * Math.cos((point.lat * Math.PI) / 180));
}

export function buildIndex(meta: Pick<WinterMeta, 'build' | 'indexSha' | 'attribution'>, index: WinterIndex): SkiIndex {
  const areas = index.areas.map(indexed);
  const grid = new Map<number, number[]>();
  areas.forEach((area, position) => {
    for (let y = Math.floor(area.minLat / CELL_DEG); y <= Math.floor(area.maxLat / CELL_DEG); y++) {
      for (let x = Math.floor(area.minLng / CELL_DEG); x <= Math.floor(area.maxLng / CELL_DEG); x++) {
        const key = cellKey(y, x);
        grid.set(key, [...(grid.get(key) ?? []), position]);
      }
    }
  });
  const attribution = `${meta.attribution.data}. ${meta.attribution.terrain}`;
  return { build: meta.build, indexSha: meta.indexSha, attribution, areas, grid };
}

/** The areas whose padded box holds a point, nearest first. */
export function areasAt(index: SkiIndex, point: { lat: number; lng: number }): IndexedArea[] {
  const key = cellKey(Math.floor(point.lat / CELL_DEG), Math.floor(point.lng / CELL_DEG));
  return (index.grid.get(key) ?? ([] as number[]))
    .map((position) => index.areas[position] as IndexedArea)
    .filter((area) => contains(area, point))
    .sort((a, b) => distanceTo(a, point) - distanceTo(b, point));
}

/**
 * The areas a leg is planned on: those holding its ends, with the pieces of
 * the same network that touch them, at most four, nearest first. Ends in two
 * areas that do not touch are two ski areas, not one leg.
 */
export function pickAreas(
  index: SkiIndex,
  leg: { from: { lat: number; lng: number }; to: { lat: number; lng: number } },
): AreaPick {
  const atFrom = areasAt(index, leg.from);
  if (atFrom.length === 0) return { status: 'no_area', at: leg.from };
  const atTo = areasAt(index, leg.to);
  if (atTo.length === 0) return { status: 'no_area', at: leg.to };
  const picked = new Map<string, IndexedArea>();
  for (const area of [...atFrom, ...atTo]) picked.set(area.row.id, area);
  const shared = atFrom.some((a) => atTo.some((b) => a.row.id === b.row.id));
  if (!shared && !atFrom.some((a) => atTo.some((b) => touches(a, b)))) return { status: 'cross_area', at: leg.to };
  // Pieces of a split network between the two ends, so the stitch has its halo.
  const bases = new Set([...picked.values()].map((area) => baseId(area.row.id)));
  const middle = { lat: (leg.from.lat + leg.to.lat) / 2, lng: (leg.from.lng + leg.to.lng) / 2 };
  for (const area of areasAt(index, middle)) {
    if (bases.has(baseId(area.row.id))) picked.set(area.row.id, area);
  }
  const areas = [...picked.values()].sort((a, b) => distanceTo(a, leg.from) - distanceTo(b, leg.from));
  return { status: 'ok', areas: areas.slice(0, MAX_AREAS) };
}

@Injectable()
export class SkiAreasService implements OnApplicationBootstrap {
  private current: SkiIndex | null = null;
  private loading: Promise<SkiIndex | null> | null = null;
  private readonly downloads = new Map<string, Promise<void>>();
  private readonly failedAt = new Map<string, number>();

  constructor(
    private readonly paths: DataPathsService,
    private readonly winter: TrekPlacesWinterService,
  ) {}

  private dir(): string {
    return join(this.paths.dataDir, 'ski');
  }

  private areasDir(): string {
    return join(this.dir(), 'areas');
  }

  fileOf(row: WinterIndexRow): string {
    return join(this.areasDir(), `${safeId(row.id)}@${row.sha256.slice(0, 8)}.sgr.gz`);
  }

  /** Halves of a write a crash left are cleared at boot. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.sweep(Date.now(), { tempOnly: true });
    } catch (err) {
      logError(`[Ski] clearing half-written files: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Whether the operator lets anything go to the Places host. */
  enabled(): boolean {
    return this.winter.enabled();
  }

  /** The index of ski areas: in memory, else as kept on disk, else fetched. Null when none can be had. */
  index(): Promise<SkiIndex | null> {
    if (this.current) return Promise.resolve(this.current);
    if (this.loading === null) {
      this.loading = this.loadIndex().finally(() => {
        this.loading = null;
      });
    }
    return this.loading;
  }

  private async loadIndex(): Promise<SkiIndex | null> {
    const kept = await this.readKeptIndex();
    if (kept) {
      this.current = kept;
      return kept;
    }
    if (!this.winter.enabled()) return null;
    try {
      await this.refresh();
    } catch (err) {
      logWarn(`[Ski] fetching the ski area index: ${err instanceof Error ? err.message : String(err)}`);
    }
    return this.current;
  }

  private async readKeptIndex(): Promise<SkiIndex | null> {
    let names: string[];
    try {
      names = (await readdir(this.dir())).filter((name) => name.startsWith('index-') && name.endsWith('.json'));
    } catch {
      return null;
    }
    const read = await Promise.all(names.map((name) => this.readIndexFile(name)));
    const newest = read
      .filter((kept): kept is { at: number; index: SkiIndex } => kept !== null)
      .sort((a, b) => b.at - a.at)[0];
    return newest?.index ?? null;
  }

  private async readIndexFile(name: string): Promise<{ at: number; index: SkiIndex } | null> {
    const file = join(this.dir(), name);
    try {
      const stored = storedIndexSchema.parse(JSON.parse(await readFile(file, 'utf8')));
      return { at: (await stat(file)).mtimeMs, index: buildIndex(stored.meta, stored.index) };
    } catch {
      logWarn(`[Ski] the kept index ${name} does not read; it is skipped`);
      return null;
    }
  }

  /**
   * Asks the Places host which build it serves and fetches the index when it
   * is not the one held. An index whose checksum is not the one the host
   * announced, or of a format this build cannot read, is not taken: the one
   * held stays. Throws when the host cannot be reached.
   */
  async refresh(): Promise<'unchanged' | 'updated' | 'refused'> {
    const meta = await this.winter.meta();
    if (this.current?.indexSha === meta.indexSha) return 'unchanged';
    if (meta.format !== SGR_FORMAT) {
      logWarn(`[Ski] the Places host serves winter format ${meta.format}; this TREK reads ${SGR_FORMAT}`);
      return 'refused';
    }
    const answer = await this.winter.index(this.current?.indexSha ?? null);
    if (answer.status === 'not_modified') return 'unchanged';
    if (answer.sha256 !== meta.indexSha) {
      logWarn(`[Ski] the ski area index does not match its checksum; the one held stays`);
      return 'refused';
    }
    if (answer.dropped > 0) logWarn(`[Ski] ${answer.dropped} rows of the ski area index did not read`);
    const kept = { build: meta.build, indexSha: meta.indexSha, attribution: meta.attribution };
    const stored = { meta: kept, index: answer.index };
    await this.writeAtomically(join(this.dir(), `index-${meta.indexSha.slice(0, 8)}.json`), JSON.stringify(stored));
    this.current = buildIndex(stored.meta, stored.index);
    logInfo(`[Ski] ski area index of build ${meta.build}: ${answer.index.areas.length} areas`);
    await this.dropOtherIndexes(meta.indexSha);
    return 'updated';
  }

  private async dropOtherIndexes(keep: string): Promise<void> {
    const names = await readdir(this.dir());
    const stale = names.filter((name) => name.startsWith('index-') && name !== `index-${keep.slice(0, 8)}.json`);
    await Promise.all(stale.map((name) => rm(join(this.dir(), name), { force: true })));
  }

  private async writeAtomically(file: string, content: string | Buffer): Promise<void> {
    await mkdir(join(file, '..'), { recursive: true });
    const temp = `${file}.tmp`;
    await writeFile(temp, content);
    await rename(temp, file);
  }

  /** Whether the Places host failed often enough that requests to it are held back for now. */
  placesHeldBack(): boolean {
    return this.winter.heldBack();
  }

  /** Whether an area's graph is here, on its way, or cannot be had right now. */
  stateOf(row: WinterIndexRow): 'ready' | 'loading' | 'unavailable' {
    if (existsSync(this.fileOf(row))) return 'ready';
    if (this.downloads.has(row.id)) return 'loading';
    const failed = this.failedAt.get(row.id);
    if (!this.winter.enabled() || (failed !== undefined && Date.now() - failed < FAILED_FOR_MS)) return 'unavailable';
    return 'loading';
  }

  /**
   * An area's graph file: the current build's, downloaded if it is not here
   * yet (one download however many ask at once), or the newest older copy
   * while the download fails. Throws when there is neither.
   */
  async ensureArea(row: WinterIndexRow): Promise<AreaFile> {
    const file = this.fileOf(row);
    if (existsSync(file)) {
      await this.touch(file);
      return { file, stale: false };
    }
    let download = this.downloads.get(row.id);
    if (download === undefined) {
      download = this.download(row, file).finally(() => this.downloads.delete(row.id));
      this.downloads.set(row.id, download);
    }
    try {
      await download;
      this.failedAt.delete(row.id);
      return { file, stale: false };
    } catch (err) {
      this.failedAt.set(row.id, Date.now());
      const older = await this.keptCopy(row.id);
      if (older) return { file: older, stale: true };
      throw err;
    }
  }

  private async download(row: WinterIndexRow, file: string): Promise<void> {
    let answer: Awaited<ReturnType<TrekPlacesWinterService['area']>>;
    try {
      answer = await this.winter.area(row.id, null);
    } catch (err) {
      // An id the host does not know means the index is out of date.
      if ((err as { status?: number }).status === 404) void this.refresh().catch(() => undefined);
      throw err;
    }
    if (answer.status !== 'ok') throw new Error(`The Places host sent no graph for ${row.id}`);
    if (sha256(answer.bytes) !== row.sha256) {
      throw new Error(`The graph of ${row.id} does not match the index's checksum; it was not kept`);
    }
    await this.writeAtomically(file, answer.bytes);
  }

  /** The newest file of an area kept from an earlier build, if any. */
  private async keptCopy(id: string): Promise<string | null> {
    let names: string[];
    try {
      names = await readdir(this.areasDir());
    } catch {
      return null;
    }
    const prefix = `${safeId(id)}@`;
    const copies = names.filter((name) => name.startsWith(prefix) && name.endsWith('.sgr.gz'));
    const dated = await Promise.all(
      copies.map(async (name) => ({ name, at: (await stat(join(this.areasDir(), name))).mtimeMs })),
    );
    const newest = dated.sort((a, b) => b.at - a.at)[0];
    return newest ? join(this.areasDir(), newest.name) : null;
  }

  /** Marks a file used, so the sweep keeps it. */
  private async touch(file: string): Promise<void> {
    const now = new Date();
    await utimes(file, now, now).catch(() => undefined);
  }

  /** The ids of the areas with a graph kept here, with the checksum prefix each file carries. */
  async keptAreas(): Promise<Array<{ id: string; sha8: string }>> {
    let names: string[];
    try {
      names = await readdir(this.areasDir());
    } catch {
      return [];
    }
    return names
      .filter((name) => name.endsWith('.sgr.gz') && name.includes('@'))
      .map((name) => {
        const [id, rest] = name.split('@') as [string, string];
        return { id: id.replace('_', ':'), sha8: rest.slice(0, 8) };
      });
  }

  /**
   * Clears what is left of interrupted writes and, unless `tempOnly`, every
   * area file unused for 90 days. An area kept is never older than its last use.
   */
  async sweep(now: number, { tempOnly = false }: { tempOnly?: boolean } = {}): Promise<number> {
    const removed = await Promise.all([this.dir(), this.areasDir()].map((dir) => this.sweepDir(dir, now, tempOnly)));
    return removed.reduce((sum, count) => sum + count, 0);
  }

  private async sweepDir(dir: string, now: number, tempOnly: boolean): Promise<number> {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return 0;
    }
    const verdicts = await Promise.all(
      names.map(async (name) => {
        if (name.endsWith('.tmp')) return name;
        if (tempOnly || !name.endsWith('.sgr.gz')) return null;
        const at = (await stat(join(dir, name))).mtimeMs;
        return now - at > UNUSED_FOR_MS ? name : null;
      }),
    );
    const doomed = verdicts.filter((name): name is string => name !== null);
    await Promise.all(doomed.map((name) => rm(join(dir, name), { force: true })));
    return doomed.length;
  }
}
