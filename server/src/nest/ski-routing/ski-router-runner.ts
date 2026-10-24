import { networkFeatures } from './engine/network';
import { SkiRouter, type LegInput } from './engine/plan';
import type { SkiProfile } from './engine/profile';
import { stitchGraphs } from './engine/stitch';
import { decodeSkiGraphGz } from './ski-graph';
import type { SkiNetworkFeature, SkiRouteLeg } from '@trek/shared';

import { readFile } from 'node:fs/promises';

/** The legs of one area (or of the pieces of one) to plan, on the graph files at `files`. */
export interface SkiRouteJob {
  kind: 'route';
  files: string[];
  areaIds: string[];
  legs: LegInput[];
  profile: SkiProfile;
  alternatives: number;
}

/** The drawn lines of one area, for the map. */
interface SkiNetworkJob {
  kind: 'network';
  files: string[];
}

export type SkiJob = SkiRouteJob | SkiNetworkJob;

interface SkiNetworkLines {
  features: SkiNetworkFeature[];
  simplified_m: number;
}

export type SkiJobResult<J extends SkiJob> = J extends SkiRouteJob ? SkiRouteLeg[] : SkiNetworkLines;

/** Plans on area graphs: in a worker thread in production, on the calling thread in tests. */
export interface SkiRouterRunner {
  run<J extends SkiJob>(job: J): Promise<SkiJobResult<J>>;
  /** Drops every network built from a file, after the area was fetched again or removed. */
  forget(file: string): void;
  close(): Promise<void>;
}

export const SKI_ROUTER_RUNNER = Symbol('SKI_ROUTER_RUNNER');

/** What the decoded and stitched networks of a thread may take together (spec 7.3). */
export const NETWORK_BUDGET_BYTES = 256 * 1024 * 1024;

/**
 * The networks a thread keeps decoded, the least recently used dropped first
 * once they take more than the budget together. Keyed by the files a network
 * was built from, so a network stitched of two areas is one entry.
 */
export class NetCache {
  private readonly routers = new Map<string, { router: Promise<SkiRouter>; bytes: number }>();

  constructor(private readonly budget = NETWORK_BUDGET_BYTES) {}

  get(files: readonly string[]): Promise<SkiRouter> {
    // Code unit order, so the key never depends on a locale.
    const key = [...files].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join('|');
    const known = this.routers.get(key);
    if (known) {
      this.routers.delete(key);
      this.routers.set(key, known);
      return known.router;
    }
    const entry = { router: this.load(files), bytes: 0 };
    this.routers.set(key, entry);
    void entry.router.then(
      (router) => {
        entry.bytes = router.net.bytes;
        this.trim(key);
      },
      () => this.routers.delete(key),
    );
    return entry.router;
  }

  private async load(files: readonly string[]): Promise<SkiRouter> {
    const graphs = await Promise.all(files.map(async (file) => decodeSkiGraphGz(await readFile(file))));
    return new SkiRouter(stitchGraphs(graphs));
  }

  /** Drops the oldest networks until the rest fit, never the one just loaded. */
  private trim(keep: string): void {
    let total = [...this.routers.values()].reduce((sum, entry) => sum + entry.bytes, 0);
    for (const [key, entry] of this.routers) {
      if (total <= this.budget) break;
      if (key === keep) continue;
      this.routers.delete(key);
      total -= entry.bytes;
    }
  }

  forget(file: string): void {
    for (const key of [...this.routers.keys()]) {
      if (key.split('|').includes(file)) this.routers.delete(key);
    }
  }

  clear(): void {
    this.routers.clear();
  }
}

export async function runSkiJob(cache: NetCache, job: SkiJob): Promise<SkiRouteLeg[] | SkiNetworkLines> {
  const router = await cache.get(job.files);
  if (job.kind === 'network') return networkFeatures(router.net);
  return router.plan({ legs: job.legs, profile: job.profile, alternatives: job.alternatives }, job.areaIds);
}

/** The test runner: the same work on the calling thread. */
export class InlineSkiRouterRunner implements SkiRouterRunner {
  private readonly cache = new NetCache();

  run<J extends SkiJob>(job: J): Promise<SkiJobResult<J>> {
    return runSkiJob(this.cache, job) as Promise<SkiJobResult<J>>;
  }

  forget(file: string): void {
    this.cache.forget(file);
  }

  close(): Promise<void> {
    this.cache.clear();
    return Promise.resolve();
  }
}
