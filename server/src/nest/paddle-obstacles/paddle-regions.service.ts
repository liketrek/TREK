import { PaddleFeatures } from '../../db/entities/PaddleFeatures.entity';
import { PaddleRegionRequests } from '../../db/entities/PaddleRegionRequests.entity';
import { PaddleRegions, type TPaddleRegionsOrigin } from '../../db/entities/PaddleRegions.entity';
import { PADDLE_FEATURE_GEOMETRY, PADDLE_FEATURE_TAGS, PADDLE_REGION_BOUNDARY } from '../../db/json-columns';
import type { PaddleFeatureRow, PaddleFeaturesRepository } from '../../db/repositories/PaddleFeatures.repository';
import type { PaddleRegionRequestsRepository } from '../../db/repositories/PaddleRegionRequests.repository';
import type { PaddleRegionRow, PaddleRegionsRepository } from '../../db/repositories/PaddleRegions.repository';
import { dbNow, utcSuffix } from '../../db/types';
import { encodeJson } from '../../utils/json-column';
import { DataPathsService } from '../app-config/data-paths.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { withRequestContext } from '../database/request-context';
import { UnitOfWork } from '../database/unit-of-work';
import { PaddleRoutingService } from '../paddle-routing/paddle-routing.service';
import { GeofabrikClient, type GeofabrikRegion } from './geofabrik.client';
import { PADDLE_IMPORT_RUNNER, type ImportRunner } from './import-runner';
import type { ExtractedFeature } from './paddle-extract';
import { boxOfBoundary } from './paddle-geo';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { PaddleRegion, PaddleRegionCatalogEntry } from '@trek/shared';

import { mkdir, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const CATALOG_LIMIT = 25;

export const REGION_UNKNOWN_MESSAGE = 'Geofabrik has no extract by that id';
export const CATALOG_UNAVAILABLE_MESSAGE = 'The list of regions cannot be fetched right now';
export const REGION_NOT_FOUND_MESSAGE = 'Region not found';
const REMOVED_WHILE_READ = 'removed while it was read; nothing kept';
const STOPPED_AT_SHUTDOWN = 'stopped by the shutdown; read again on the next start';

/** What the region being read is doing, for the admin list; held in memory, as one process reads. */
type ReadProgress = NonNullable<PaddleRegion['progress']>;

function toRegion(
  row: PaddleRegionRow,
  progress: ReadProgress | null = null,
  network: PaddleRegion['network'] = null,
): PaddleRegion {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    origin: row.origin,
    source_timestamp: row.source_timestamp,
    imported_at: utcSuffix(row.imported_at),
    feature_count: row.feature_count,
    error: row.error,
    progress: row.status === 'importing' ? progress : null,
    network,
  };
}

function toRow(feature: ExtractedFeature): PaddleFeatureRow {
  return {
    region_id: '',
    osm_ref: feature.osm_ref,
    kind: feature.kind,
    group_key: feature.group_key,
    name: feature.name,
    geometry: encodeJson(PADDLE_FEATURE_GEOMETRY, feature.geometry),
    tags: encodeJson(PADDLE_FEATURE_TAGS, feature.tags),
    tag_hash: feature.tag_hash,
    min_lat: feature.min_lat,
    min_lng: feature.min_lng,
    max_lat: feature.max_lat,
    max_lng: feature.max_lng,
  };
}

/** The box around a read's objects, for a region whose boundary Geofabrik does not give. */
function extentOf(
  features: readonly ExtractedFeature[],
): Pick<PaddleRegionRow, 'min_lat' | 'min_lng' | 'max_lat' | 'max_lng'> {
  if (features.length === 0) return { min_lat: null, min_lng: null, max_lat: null, max_lng: null };
  const box = { min_lat: 90, min_lng: 180, max_lat: -90, max_lng: -180 };
  for (const feature of features) {
    box.min_lat = Math.min(box.min_lat, feature.min_lat);
    box.min_lng = Math.min(box.min_lng, feature.min_lng);
    box.max_lat = Math.max(box.max_lat, feature.max_lat);
    box.max_lng = Math.max(box.max_lng, feature.max_lng);
  }
  return box;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * PAD-05A: the regions TREK holds paddle data for. An admin picks a region
 * from Geofabrik's list; TREK downloads its extract into the data folder's
 * temporary space, reads the paddle objects out of it, replaces the region's
 * rows in one transaction and deletes the file. Regions are read one at a
 * time, in the background, never on a request's path; a failed read keeps the
 * region's previous data and says why. Removing a region while it is read
 * calls the read off.
 */
@Injectable()
export class PaddleRegionsService implements OnApplicationShutdown {
  private running: Promise<void> | null = null;
  /** A region was queued after the running reads last looked at the queue. */
  private again = false;
  private current: { id: string; abort: AbortController; progress: ReadProgress } | null = null;
  private stopping = false;

  constructor(
    private readonly geofabrik: GeofabrikClient,
    private readonly paths: DataPathsService,
    private readonly uow: UnitOfWork,
    private readonly orm: MikroORM,
    @InjectRepository(PaddleRegions) private readonly regions: PaddleRegionsRepository,
    @InjectRepository(PaddleFeatures) private readonly features: PaddleFeaturesRepository,
    @InjectRepository(PaddleRegionRequests) private readonly requests: PaddleRegionRequestsRepository,
    private readonly routing: PaddleRoutingService,
    @Inject(PADDLE_IMPORT_RUNNER) private readonly importer: ImportRunner,
  ) {}

  async list(): Promise<PaddleRegion[]> {
    const networks = await this.routing.networks();
    return (await this.regions.list()).map((row) =>
      toRegion(row, this.progressOf(row.id), networks.get(row.id) ?? null),
    );
  }

  /** Regions of Geofabrik's list whose name or id matches, with the regions they lie in. */
  async catalog(query: string): Promise<PaddleRegionCatalogEntry[]> {
    const all = await this.catalogue();
    const needle = query.toLowerCase();
    const path = (id: string | null): string[] => {
      const names: string[] = [];
      for (let at = id; at; at = all.get(at)?.parent ?? null) names.unshift(all.get(at)?.name ?? at);
      return names;
    };
    return [...all.values()]
      .filter((region) => region.name.toLowerCase().includes(needle) || region.id.includes(needle))
      .sort(
        (a, b) => Number(!a.name.toLowerCase().startsWith(needle)) - Number(!b.name.toLowerCase().startsWith(needle)),
      )
      .slice(0, CATALOG_LIMIT)
      .map((region) => ({ id: region.id, name: region.name, path: path(region.parent) }));
  }

  /**
   * Adds a region and queues its first read; a region already there is read
   * again, as `refresh` does. A paddler's request for it is settled by adding it.
   */
  async add(id: string, origin: TPaddleRegionsOrigin = 'admin'): Promise<PaddleRegion> {
    if (await this.regions.findById(id)) return await this.refresh(id);
    const region = (await this.catalogue()).get(id);
    if (!region)
      throw new DomainError(400, REGION_UNKNOWN_MESSAGE, {
        code: 'unknown_region',
        details: { code: 'unknown_region' },
      });
    const box = region.boundary ? boxOfBoundary(region.boundary) : null;
    await this.uow.transactional(async () => {
      await this.requests.remove(id);
      await this.regions.insertRegion(
        {
          id,
          name: region.name,
          boundary: region.boundary ? encodeJson(PADDLE_REGION_BOUNDARY, region.boundary) : null,
          min_lat: box?.south ?? null,
          min_lng: box?.west ?? null,
          max_lat: box?.north ?? null,
          max_lng: box?.east ?? null,
        },
        origin,
      );
      await this.regions.updateRegion(id, { status: 'queued', error: null });
    });
    this.kick();
    const row = await this.regions.findById(id);
    if (!row) throw new Error('Added region could not be read back');
    return toRegion(row);
  }

  /** Queues a region's read again; one already waiting or being read is left as it is. */
  async refresh(id: string): Promise<PaddleRegion> {
    const row = await this.regions.findById(id);
    if (!row) throw new DomainError(404, REGION_NOT_FOUND_MESSAGE);
    if (row.status === 'queued' || row.status === 'importing') return toRegion(row, this.progressOf(id));
    await this.regions.updateRegion(id, { status: 'queued', error: null });
    this.kick();
    return toRegion({ ...row, status: 'queued', error: null });
  }

  /** Removes a region and its objects; a read of it under way is called off. */
  async remove(id: string): Promise<void> {
    if (!(await this.regions.deleteRegion(id))) throw new DomainError(404, REGION_NOT_FOUND_MESSAGE);
    if (this.current?.id === id) this.current.abort.abort(REMOVED_WHILE_READ);
  }

  /** A read under way stops with the process; the boot after it queues the region again. */
  onApplicationShutdown(): void {
    this.stopping = true;
    this.current?.abort.abort(STOPPED_AT_SHUTDOWN);
  }

  /** Every region with data queued again, for the monthly refresh; the reads follow in the background. */
  async queueRefresh(): Promise<number> {
    const queued = await this.regions.queueReady();
    if (queued > 0) this.kick();
    return queued;
  }

  /**
   * A restart left a read unfinished: it goes back to the queue, the file it
   * was reading is cleared away, and the queue starts.
   */
  async resumeAfterRestart(): Promise<void> {
    await this.regions.requeueInterrupted();
    await rm(this.downloadDir(), { recursive: true, force: true });
    this.kick();
  }

  /**
   * Starts the background reads unless they already run. A region queued
   * while they run is still picked up: the run looks at the queue again
   * before it ends.
   *
   * @txStandalone the reads run detached, later, each region's rows in a transaction of their own; no caller's transaction could hold them
   */
  kick(): void {
    this.again = true;
    if (this.running !== null || this.stopping) return;
    this.running = this.run().finally(() => {
      this.running = null;
      if (this.again) this.kick();
    });
  }

  /** Resolves once the queue is empty and nothing reads; for tests and an orderly shutdown. */
  async idle(): Promise<void> {
    if (this.running === null) return;
    await this.running;
    await this.idle();
  }

  /** Where extracts are downloaded to while they are read; nothing in it outlives its read. */
  private downloadDir(): string {
    return join(this.paths.tmpDir, 'paddle');
  }

  /** How far a queued or importing region is: its read's progress, and how many regions are read before it. */
  async readState(id: string): Promise<{ progress: ReadProgress | null; ahead: number }> {
    if (this.current?.id === id) return { progress: this.progressOf(id), ahead: 0 };
    const waiting = (await this.regions.queued()).findIndex((row) => row.id === id);
    return { progress: null, ahead: Math.max(0, waiting) + (this.current ? 1 : 0) };
  }

  private progressOf(id: string): ReadProgress | null {
    return this.current?.id === id ? { ...this.current.progress } : null;
  }

  private async catalogue(): Promise<Map<string, GeofabrikRegion>> {
    try {
      return await this.geofabrik.regions();
    } catch (err) {
      logError(`[Paddle] Geofabrik index: ${messageOf(err)}`);
      throw new DomainError(502, CATALOG_UNAVAILABLE_MESSAGE, {
        code: 'catalog_unavailable',
        details: { code: 'catalog_unavailable' },
      });
    }
  }

  private async run(): Promise<void> {
    this.again = false;
    try {
      await withRequestContext(this.orm, () => this.drain());
    } catch (err) {
      logError(`[Paddle] the read queue stopped: ${messageOf(err)}`);
    }
  }

  /** The queued regions, one after another, oldest first. */
  private async drain(): Promise<void> {
    if (this.stopping) return;
    const next = await this.regions.nextQueued();
    if (!next) return;
    await this.importRegion(next);
    await this.drain();
  }

  /** @txIndependent the download and the read sit between the status writes; only the swap of rows is one transaction. */
  private async importRegion(region: PaddleRegionRow): Promise<void> {
    await this.regions.updateRegion(region.id, { status: 'importing', error: null });
    const abort = new AbortController();
    const current = { id: region.id, abort, progress: { phase: 'download', fraction: null } as ReadProgress };
    this.current = current;
    const dir = this.downloadDir();
    // Some of Geofabrik's ids are nested (`us/texas`); the file stays in the one folder.
    const file = join(dir, `${region.id.replaceAll('/', '_')}-${Date.now()}.osm.pbf`);
    // A network written but never recorded (the read failed or was called off after it) goes again.
    let graphFile: string | null = null;
    try {
      const known = (await this.geofabrik.regions()).get(region.id);
      if (!known) throw new Error(REGION_UNKNOWN_MESSAGE);
      await mkdir(dir, { recursive: true });
      const started = Date.now();
      await this.geofabrik.download(known.pbfUrl, file, {
        signal: abort.signal,
        onProgress: (fraction) => (current.progress = { phase: 'download', fraction }),
      });
      current.progress = { phase: 'read', fraction: 0 };
      const { timestamp, features, graph } = await this.importer.run(
        file,
        region.id,
        (phase, fraction) => (current.progress = { phase, fraction }),
        abort.signal,
      );
      abort.signal.throwIfAborted();
      graphFile = graph ? await this.routing.writeGraphFile(region.id, graph) : null;
      let previousGraph: string | null = null;
      const kept = await this.uow.transactional(async () => {
        if (!(await this.regions.findById(region.id))) return false;
        await this.features.replaceRegion(region.id, features.map(toRow));
        await this.regions.updateRegion(region.id, {
          status: 'ready',
          feature_count: features.length,
          source_timestamp: timestamp === null ? null : new Date(timestamp * 1000).toISOString(),
          imported_at: dbNow(),
          error: null,
          // Without a boundary the region covers what its objects span, so the map can still tell it is covered.
          ...(known.boundary ? {} : extentOf(features)),
        });
        if (graph && graphFile) previousGraph = await this.routing.recordGraph(region.id, graphFile, graph);
        return true;
      });
      if (!kept) throw new Error(REMOVED_WHILE_READ);
      if (graphFile) await this.routing.replaced(previousGraph, graphFile);
      graphFile = null;
      logInfo(
        `[Paddle] ${region.id}: ${features.length} objects read in ${Math.round((Date.now() - started) / 1000)} s`,
      );
    } catch (err) {
      if (abort.signal.aborted) {
        logInfo(`[Paddle] ${region.id}: ${String(abort.signal.reason)}`);
      } else if (messageOf(err) === REMOVED_WHILE_READ) {
        logInfo(`[Paddle] ${region.id}: ${REMOVED_WHILE_READ}`);
      } else {
        logError(`[Paddle] ${region.id}: ${messageOf(err)}`);
        await this.regions.updateRegion(region.id, { status: 'failed', error: messageOf(err).slice(0, 500) });
      }
    } finally {
      if (this.current === current) this.current = null;
      await unlink(file).catch(() => undefined);
      if (graphFile) await this.routing.discard(graphFile);
    }
  }
}
