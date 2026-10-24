import { AddonsService } from '../addons/addons.service';
import { logInfo, logWarn } from '../audit/audit-log.logger';
import { DomainError, notFound } from '../common/domain-error';
import type { LegInput } from './engine/plan';
import type { SkiProfile } from './engine/profile';
import {
  DEFAULT_ATTRIBUTION,
  pickAreas,
  SkiAreasService,
  type AreaFile,
  type IndexedArea,
  type SkiIndex,
} from './ski-areas.service';
import { SKI_ROUTER_RUNNER, type SkiRouterRunner } from './ski-router-runner';
import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import {
  skiOptionsForDiscipline,
  skiUsesLifts,
  type SkiAreaNearResponse,
  type SkiAreaState,
  type SkiFailCode,
  type SkiNetworkResponse,
  type SkiRouteFailedLeg,
  type SkiRouteLeg,
  type SkiRouteRequest,
  type SkiRouteResponse,
} from '@trek/shared';

/** A leg whose area is not here within this long is answered `loading`; the download goes on. */
export const LOADING_MS = 2000;

type Settled<T> = { status: 'done'; value: T } | { status: 'failed'; error: unknown } | { status: 'pending' };

/**
 * A promise's outcome if it settles within `ms`, else `pending`. The promise
 * is always handled, so one that fails after the wait never goes unhandled.
 */
export function settleWithin<T>(promise: Promise<T>, ms: number): Promise<Settled<T>> {
  const settled = promise.then(
    (value): Settled<T> => ({ status: 'done', value }),
    (error: unknown): Settled<T> => ({ status: 'failed', error }),
  );
  let timer: NodeJS.Timeout | undefined;
  const waited = new Promise<Settled<T>>((resolve) => {
    timer = setTimeout(() => resolve({ status: 'pending' }), ms);
  });
  return Promise.race([settled, waited]).finally(() => clearTimeout(timer));
}

function failed(code: SkiFailCode, at: { lat: number; lng: number } | null = null): SkiRouteFailedLeg {
  return { status: 'failed', code, at, hint: null, detail: null };
}

/** A leg that cannot be planned here at all: the planner draws it freely. */
function freeDraw(code: SkiFailCode): SkiRouteFailedLeg {
  return { status: 'failed', code, at: null, hint: { free_draw: true }, detail: null };
}

const samePoint = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7;

/** What the router is asked: the request's discipline with its own options and technique, the defaults resolved. */
export function profileOf(request: SkiRouteRequest): SkiProfile {
  const options = skiOptionsForDiscipline(request.discipline, request.options);
  return {
    discipline: request.discipline,
    technique: request.discipline === 'cross_country' ? (request.technique ?? 'unknown') : null,
    options,
    useLifts: skiUsesLifts(request.discipline, options),
  };
}

interface Group {
  areas: IndexedArea[];
  indices: number[];
}

/**
 * The piste router (spec 7): plans the legs of a ski and winter tour on the
 * ski areas the Places host serves, for the REST route and the MCP tool
 * alike. A leg is planned on the areas holding its ends; the legs of the same
 * areas go to the router's thread as one job, in order, so each goes on from
 * where the one before ended. Nothing is written; nothing of the trip is read.
 */
@Injectable()
export class SkiRoutingService implements OnApplicationShutdown {
  constructor(
    private readonly areas: SkiAreasService,
    private readonly addons: AddonsService,
    @Inject(SKI_ROUTER_RUNNER) private readonly runner: SkiRouterRunner,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.runner.close();
  }

  /** Why nothing can be planned here at all, or null: TREK Places off, or the admin's switch off. */
  private async refusal(): Promise<SkiFailCode | null> {
    if (!this.areas.enabled()) return 'places_unavailable';
    return (await this.addons.getToursSkiRouting()).enabled ? null : 'disabled';
  }

  async route(request: SkiRouteRequest): Promise<SkiRouteResponse> {
    const all = (leg: SkiRouteLeg): SkiRouteResponse => ({
      legs: request.legs.map(() => leg),
      build: null,
      stale: false,
      area_names: [],
      colour_scheme: 'europe',
      attribution: DEFAULT_ATTRIBUTION,
    });
    const refused = await this.refusal();
    if (refused) return all(freeDraw(refused));
    const index = await settleWithin(this.areas.index(), LOADING_MS);
    if (index.status === 'pending') return all(failed('loading'));
    if (index.status === 'failed' || !index.value) return all(freeDraw('places_unavailable'));
    return this.routeOn(index.value, request);
  }

  private async routeOn(index: SkiIndex, request: SkiRouteRequest): Promise<SkiRouteResponse> {
    const legs: SkiRouteLeg[] = new Array<SkiRouteLeg>(request.legs.length);
    const groups = new Map<string, Group>();
    request.legs.forEach((leg, position) => {
      const pick = pickAreas(index, leg);
      if (pick.status !== 'ok') {
        legs[position] = failed(pick.status, pick.at);
        return;
      }
      const key = pick.areas.map((area) => area.row.id).join('+');
      const group: Group = groups.get(key) ?? { areas: pick.areas, indices: [] };
      group.indices.push(position);
      groups.set(key, group);
    });
    const profile = profileOf(request);
    const used = new Set<IndexedArea>();
    let stale = false;
    await Promise.all(
      [...groups.values()].map(async (group) => {
        const planned = await this.planGroup(group, request, profile);
        group.indices.forEach((position, at) => {
          legs[position] = planned.legs[at] as SkiRouteLeg;
        });
        if (planned.used) group.areas.forEach((area) => used.add(area));
        stale ||= planned.stale;
      }),
    );
    const names = [...new Set([...used].flatMap((area) => (area.row.name ? [area.row.name] : [])))];
    return {
      legs,
      build: used.size > 0 ? index.build : null,
      stale,
      area_names: names,
      colour_scheme: [...used][0]?.row.colourScheme ?? 'europe',
      attribution: index.attribution,
    };
  }

  /** One group's legs on its areas: downloaded within the wait, then planned in the router's thread. */
  private async planGroup(
    group: Group,
    request: SkiRouteRequest,
    profile: SkiProfile,
  ): Promise<{ legs: SkiRouteLeg[]; used: boolean; stale: boolean }> {
    const answer = (leg: SkiRouteLeg) => ({ legs: group.indices.map(() => leg), used: false, stale: false });
    const downloads = Promise.all(group.areas.map((area) => this.areas.ensureArea(area.row)));
    const files = await settleWithin(downloads, LOADING_MS);
    if (files.status === 'pending') {
      return answer({ ...failed('loading'), detail: { name: group.areas[0]?.row.name ?? null } });
    }
    if (files.status === 'failed') {
      logInfo(`[Ski] no graph for ${group.areas.map((area) => area.row.id).join(', ')}: ${String(files.error)}`);
      return answer(freeDraw('places_unavailable'));
    }
    const legs: LegInput[] = group.indices.map((position, at) => {
      const leg = request.legs[position] as SkiRouteRequest['legs'][number];
      // A leg goes on from the one before only where that one is the tour's leg right before it.
      const previous = at > 0 && group.indices[at - 1] === position - 1 ? request.legs[position - 1] : undefined;
      return { from: leg.from, to: leg.to, continues: !!previous && samePoint(previous.to, leg.from) };
    });
    try {
      const planned = await this.runner.run({
        kind: 'route',
        files: files.value.map((file: AreaFile) => file.file),
        areaIds: group.areas.map((area) => area.row.id),
        legs,
        profile,
        alternatives: request.alternatives,
      });
      return { legs: planned, used: true, stale: files.value.some((file) => file.stale) };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logWarn(`[Ski] routing on ${group.areas.map((area) => area.row.id).join(', ')}: ${message}`);
      if (message === 'timeout' || message === 'busy') return answer(failed(message));
      return answer(freeDraw('places_unavailable'));
    }
  }

  /** The ski area at a point and whether its graph is here; asking starts its download (spec 7.3, prefetch). */
  async areaNear(lat: number, lng: number): Promise<SkiAreaNearResponse> {
    const index = await settleWithin(this.areas.index(), LOADING_MS);
    if (index.status !== 'done' || !index.value) return { area: null };
    const row = index.value.areas.find(
      (area) => lat >= area.minLat && lat <= area.maxLat && lng >= area.minLng && lng <= area.maxLng,
    )?.row;
    if (!row) return { area: null };
    const refused = await this.refusal();
    let state: SkiAreaState = refused ? 'unavailable' : this.areas.stateOf(row);
    if (state === 'loading') {
      const fetched = await settleWithin(this.areas.ensureArea(row), 0);
      if (fetched.status === 'done') state = 'ready';
    }
    return {
      area: {
        id: row.id,
        name: row.name,
        kind: row.kind,
        colour_scheme: row.colourScheme,
        build: index.value.build,
        state,
      },
    };
  }

  /** An area's runs, lifts and trails as lines for the map; the area is downloaded first if it has to be. */
  async network(areaId: string): Promise<SkiNetworkResponse & { sha256: string }> {
    if (await this.refusal()) throw new DomainError(503, 'Piste data is not available');
    const index = await this.areas.index();
    const area = index?.areas.find((candidate) => candidate.row.id === areaId);
    if (!index || !area) throw notFound('Ski area not found');
    let file: AreaFile;
    try {
      file = await this.areas.ensureArea(area.row);
    } catch {
      throw new DomainError(503, 'Piste data is not available');
    }
    const lines = await this.runner.run({ kind: 'network', files: [file.file] });
    return {
      area_id: area.row.id,
      build: index.build,
      colour_scheme: area.row.colourScheme,
      ...lines,
      sha256: area.row.sha256,
    };
  }
}
