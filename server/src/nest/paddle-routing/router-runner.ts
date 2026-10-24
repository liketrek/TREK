import { WaterRouter, type RouteProfile } from './engine/router';
import { decodeWaterGraph } from './water-graph';
import type { PaddleRouteLeg, PaddleRoutePoint } from '@trek/shared';

import { readFile } from 'node:fs/promises';

/** One region's legs to plan, read from the graph file at `file`. */
export interface RouteJob {
  file: string;
  legs: Array<{ from: PaddleRoutePoint; to: PaddleRoutePoint }>;
  profile: RouteProfile;
}

/** Plans legs on a region's graph: in a worker thread in production, on the calling thread in tests. */
export interface RouterRunner {
  run(job: RouteJob): Promise<PaddleRouteLeg[]>;
  /** Drops a graph from memory, after a region was built again or removed. */
  forget(file: string): void;
  close(): Promise<void>;
}

export const PADDLE_ROUTER_RUNNER = Symbol('PADDLE_ROUTER_RUNNER');

/** How many regions' graphs stay loaded; the least recently used one goes first. */
const LOADED_REGIONS = 4;

/** The loaded graphs of a thread, newest use last. */
export class GraphCache {
  private readonly routers = new Map<string, Promise<WaterRouter>>();

  get(file: string): Promise<WaterRouter> {
    let router = this.routers.get(file);
    if (router !== undefined) {
      this.routers.delete(file);
    } else {
      router = readFile(file).then((bytes) => new WaterRouter(decodeWaterGraph(bytes)));
      router.catch(() => this.routers.delete(file));
    }
    this.routers.set(file, router);
    while (this.routers.size > LOADED_REGIONS) this.routers.delete(this.routers.keys().next().value as string);
    return router;
  }

  forget(file: string): void {
    this.routers.delete(file);
  }

  clear(): void {
    this.routers.clear();
  }
}

export async function runJob(cache: GraphCache, job: RouteJob): Promise<PaddleRouteLeg[]> {
  const router = await cache.get(job.file);
  return job.legs.map(({ from, to }) => router.route(from, to, job.profile));
}

/** The test runner: the same work on the calling thread. */
export class InlineRouterRunner implements RouterRunner {
  private readonly cache = new GraphCache();

  run(job: RouteJob): Promise<PaddleRouteLeg[]> {
    return runJob(this.cache, job);
  }

  forget(file: string): void {
    this.cache.forget(file);
  }

  close(): Promise<void> {
    this.cache.clear();
    return Promise.resolve();
  }
}
