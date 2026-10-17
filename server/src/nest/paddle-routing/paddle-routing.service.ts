import { PaddleWaterGraphs } from '../../db/entities/PaddleWaterGraphs.entity';
import { PADDLE_REGION_GRAPH_STATS } from '../../db/json-columns';
import type {
  PaddleWaterGraphRow,
  PaddleWaterGraphsRepository,
} from '../../db/repositories/PaddleWaterGraphs.repository';
import { dbNow, utcSuffix } from '../../db/types';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { DataPathsService } from '../app-config/data-paths.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import type { RouteProfile } from './engine/router';
import { PADDLE_ROUTER_RUNNER, type RouterRunner } from './router-runner';
import type { BuiltWaterGraph } from './water-graph.contract';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import type { PaddleRegion, PaddleRouteLeg, PaddleRouteRequest, PaddleRouteResponse } from '@trek/shared';

import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GRAPH_SUFFIX = '.wgraph';

type Network = NonNullable<PaddleRegion['network']>;

/**
 * PAD-11: routing on the water. Each paddle region's import hands over the
 * water network it built; this service keeps the network's file in the data
 * folder (written beside, then renamed into place, so a reader never sees half
 * a file), records it, and plans legs on it in the router's thread. A leg is
 * planned on the smallest region whose network covers both its ends.
 */
@Injectable()
export class PaddleRoutingService implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    private readonly paths: DataPathsService,
    private readonly orm: MikroORM,
    @InjectRepository(PaddleWaterGraphs) private readonly graphs: PaddleWaterGraphsRepository,
    @Inject(PADDLE_ROUTER_RUNNER) private readonly runner: RouterRunner,
  ) {}

  private dir(): string {
    return join(this.paths.dataDir, 'paddle', 'graphs');
  }

  private pathOf(file: string): string {
    return join(this.dir(), file);
  }

  /** Clears network files no region names any more, and halves of a write a crash left. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await withRequestContext(this.orm, () => this.sweep());
    } catch (err) {
      logError(`[Paddle] sweeping water networks: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.runner.close();
  }

  async sweep(): Promise<void> {
    const kept = new Set((await this.graphs.list()).map((row) => row.file));
    let entries: string[];
    try {
      entries = await readdir(this.dir());
    } catch {
      return;
    }
    const stale = entries.filter(
      (entry) => !kept.has(entry) && (entry.endsWith(GRAPH_SUFFIX) || entry.endsWith('.tmp')),
    );
    await Promise.all(stale.map((entry) => rm(this.pathOf(entry), { force: true })));
  }

  /** Writes a built network beside its final name and renames it into place; returns the file's name. */
  async writeGraphFile(regionId: string, built: BuiltWaterGraph): Promise<string> {
    await mkdir(this.dir(), { recursive: true });
    const file = `${regionId.replaceAll('/', '_')}.${built.rev}${GRAPH_SUFFIX}`;
    const temp = this.pathOf(`${file}.tmp`);
    await writeFile(temp, built.bytes);
    await rename(temp, this.pathOf(file));
    return file;
  }

  /** Records a region's new network; called inside the import's transaction, beside the swap of its obstacles. */
  async recordGraph(regionId: string, file: string, built: BuiltWaterGraph): Promise<string | null> {
    const previous = (await this.graphs.findByRegion(regionId))?.file ?? null;
    await this.graphs.saveGraph({
      region_id: regionId,
      file,
      rev: built.rev,
      bytes: built.bytes.byteLength,
      built_at: dbNow(),
      stats: encodeJson(PADDLE_REGION_GRAPH_STATS, built.stats),
      min_lat: built.box.minLat,
      min_lng: built.box.minLng,
      max_lat: built.box.maxLat,
      max_lng: built.box.maxLng,
    });
    return previous;
  }

  /** After the import committed: the network it replaced goes, from disk and from the router's memory. */
  async replaced(previous: string | null, current: string): Promise<void> {
    if (!previous || previous === current) return;
    this.runner.forget(this.pathOf(previous));
    await rm(this.pathOf(previous), { force: true });
  }

  /** A written network whose import did not commit. */
  async discard(file: string): Promise<void> {
    await rm(this.pathOf(file), { force: true });
  }

  /** What each region's network holds, by region id, for the admin list. */
  async networks(): Promise<Map<string, Network>> {
    const rows = await this.graphs.list();
    return new Map(
      rows.flatMap((row) => {
        const network = this.networkOf(row);
        return network ? [[row.region_id, network] as const] : [];
      }),
    );
  }

  /** The regions whose network reaches a point, smallest first: where a leg ending there would be planned. */
  async regionsCovering(lat: number, lng: number): Promise<string[]> {
    return (await this.graphs.coveringPoint(lat, lng)).map((row) => row.region_id);
  }

  private networkOf(row: PaddleWaterGraphRow): Network | null {
    const stats = decodeJson(PADDLE_REGION_GRAPH_STATS, row.stats, row.region_id);
    if (!stats) return null;
    return { ...stats, built_at: utcSuffix(row.built_at) ?? row.built_at, bytes: row.bytes };
  }

  /**
   * Plans every leg of a request: each on the smallest region covering both
   * its ends, the legs of one region in one go. A leg no region covers, or
   * whose ends lie in regions that do not overlap, fails on its own; the
   * others are planned all the same.
   */
  async route(request: PaddleRouteRequest): Promise<PaddleRouteResponse> {
    const profile: RouteProfile = {
      boat: request.boat,
      lakeStyle: request.lake_style,
      lockPolicy: request.lock_policy,
    };
    const legs: PaddleRouteLeg[] = new Array(request.legs.length);
    const jobs = new Map<string, { row: PaddleWaterGraphRow; indices: number[] }>();
    const placed = await Promise.all(request.legs.map((leg) => this.regionOf(leg)));
    placed.forEach((place, index) => {
      if ('status' in place) {
        legs[index] = place;
        return;
      }
      const job = jobs.get(place.region_id) ?? { row: place, indices: [] };
      job.indices.push(index);
      jobs.set(place.region_id, job);
    });
    // Each region's legs in one job; the router thread takes them one after the other.
    await Promise.all(
      [...jobs.values()].map(async ({ row, indices }) => {
        const planned = await this.planOn(
          row,
          indices.map((index) => request.legs[index] as PaddleRouteRequest['legs'][number]),
          profile,
        );
        indices.forEach((index, at) => (legs[index] = planned[at] as PaddleRouteLeg));
      }),
    );
    const revs = [...jobs.values()].map(({ row }) => row.rev);
    return { legs, graph_rev: revs.length > 0 ? revs.join('+') : null };
  }

  /** The smallest region whose network covers both ends of a leg, or why there is none. */
  private async regionOf(leg: PaddleRouteRequest['legs'][number]): Promise<PaddleWaterGraphRow | PaddleRouteLeg> {
    const [fromRows, toRows] = await Promise.all([
      this.graphs.coveringPoint(leg.from.lat, leg.from.lng),
      this.graphs.coveringPoint(leg.to.lat, leg.to.lng),
    ]);
    if (fromRows.length === 0) return { status: 'failed', code: 'no_region', at: leg.from };
    if (toRows.length === 0) return { status: 'failed', code: 'no_region', at: leg.to };
    const toIds = new Set(toRows.map((row) => row.region_id));
    return (
      fromRows.find((candidate) => toIds.has(candidate.region_id)) ?? {
        status: 'failed',
        code: 'cross_region',
        at: leg.to,
      }
    );
  }

  /** One region's legs planned in the router's thread; a thread that fails or hangs fails them all, as busy or timeout. */
  private async planOn(
    row: PaddleWaterGraphRow,
    legs: PaddleRouteRequest['legs'],
    profile: RouteProfile,
  ): Promise<PaddleRouteLeg[]> {
    try {
      return await this.runner.run({ file: this.pathOf(row.file), legs, profile });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logInfo(`[Paddle] routing on ${row.region_id}: ${message}`);
      const code = message === 'timeout' ? 'timeout' : 'busy';
      return legs.map((): PaddleRouteLeg => ({ status: 'failed', code, at: null }));
    }
  }
}
