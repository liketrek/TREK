import { PaddleRegionRequests } from '../../db/entities/PaddleRegionRequests.entity';
import { PaddleRegions } from '../../db/entities/PaddleRegions.entity';
import { PADDLE_REGION_BOUNDARY } from '../../db/json-columns';
import type { PaddleRegionRequestsRepository } from '../../db/repositories/PaddleRegionRequests.repository';
import type { PaddleRegionRow, PaddleRegionsRepository } from '../../db/repositories/PaddleRegions.repository';
import { dbNow, utcSuffix } from '../../db/types';
import type { User } from '../../types';
import { decodeJson } from '../../utils/json-column';
import { logError, logInfo } from '../audit/audit-log.logger';
import { DemoService } from '../common/demo.service';
import { DomainError } from '../common/domain-error';
import { NotificationsService } from '../notifications/notifications.service';
import { PaddleRoutingService } from '../paddle-routing/paddle-routing.service';
import { SettingsService } from '../settings/settings.service';
import { GeofabrikClient, type GeofabrikRegion } from './geofabrik.client';
import { boundaryContains, boxOfBoundary } from './paddle-geo';
import { PaddleRegionsService, REGION_NOT_FOUND_MESSAGE } from './paddle-regions.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  PADDLE_AUTO_MAX_MB,
  PADDLE_AUTO_REGIONS_PER_DAY,
  paddleRegionAutoModeSchema,
  type PaddleRegionLoadRequest,
  type PaddleRegionLoadState,
  type PaddleRegionPending,
  type PaddleRegionSettings,
  type PaddleRegionWaitReason,
  type PaddleRoutePoint,
} from '@trek/shared';

const DAY_MS = 24 * 60 * 60 * 1000;
const MB = 1024 * 1024;

type RegionRef = { id: string; name: string };

/** Where a place stands before anything is decided: covered, in a region TREK holds, in one of Geofabrik's, or nowhere. */
type Place =
  | { kind: 'covered'; region: RegionRef }
  | { kind: 'held'; row: PaddleRegionRow }
  | { kind: 'catalogue'; region: GeofabrikRegion }
  | { kind: 'none'; reason: 'off' | 'no_extract' | 'catalog_unavailable' };

function areaOf(box: { south: number; west: number; north: number; east: number }): number {
  return (box.north - box.south) * (box.east - box.west);
}

/** The smallest of the regions around a place, by the area of its box: the most local extract is the cheapest to read. */
function smallest<T>(candidates: readonly T[], area: (candidate: T) => number): T | null {
  return candidates.reduce<T | null>(
    (best, candidate) => (best && area(best) <= area(candidate) ? best : candidate),
    null,
  );
}

function rowArea(row: PaddleRegionRow): number {
  if (row.min_lat === null || row.max_lat === null || row.min_lng === null || row.max_lng === null) return Infinity;
  return areaOf({ south: row.min_lat, west: row.min_lng, north: row.max_lat, east: row.max_lng });
}

function toPending(row: Awaited<ReturnType<PaddleRegionRequestsRepository['list']>>[number]): PaddleRegionPending {
  return {
    id: row.region_id,
    name: row.name,
    reason: row.reason,
    bytes: row.bytes,
    requested_by: row.requested_by,
    requested_at: utcSuffix(row.requested_at) ?? row.requested_at,
    declined: row.declined_at !== null,
  };
}

/**
 * PAD-11C: the water data of a place a paddler plans in, fetched without an
 * admin's round trip. The planner asks for the places its unplanned legs end
 * at; for each this finds the region that covers it or would, the smallest of
 * Geofabrik's regions around it, and per the admin's setting loads it right
 * away (within a size and a few a day), files it as a request for the admins,
 * or does neither. Asking again is how the planner follows a load, so an
 * answer never starts a second one and a request is filed and announced once.
 * Only the region's id ever leaves the server, never the place.
 */
@Injectable()
export class PaddleRegionLoadService {
  constructor(
    private readonly regionsService: PaddleRegionsService,
    private readonly geofabrik: GeofabrikClient,
    private readonly routing: PaddleRoutingService,
    private readonly notifications: NotificationsService,
    private readonly demo: DemoService,
    private readonly instanceSettings: SettingsService,
    @InjectRepository(PaddleRegions) private readonly regions: PaddleRegionsRepository,
    @InjectRepository(PaddleRegionRequests) private readonly requests: PaddleRegionRequestsRepository,
  ) {}

  async settings(): Promise<PaddleRegionSettings> {
    const mode = paddleRegionAutoModeSchema.safeParse(await this.instanceSettings.getAppSetting('paddle_auto_load'));
    const maxMb = Number.parseInt((await this.instanceSettings.getAppSetting('paddle_auto_max_mb')) ?? '', 10);
    return {
      mode: mode.success ? mode.data : 'auto',
      max_mb:
        Number.isSafeInteger(maxMb) && maxMb >= PADDLE_AUTO_MAX_MB.min && maxMb <= PADDLE_AUTO_MAX_MB.max
          ? maxMb
          : PADDLE_AUTO_MAX_MB.default,
    };
  }

  async updateSettings(settings: PaddleRegionSettings): Promise<PaddleRegionSettings> {
    await this.instanceSettings.setAppSettings({
      paddle_auto_load: settings.mode,
      paddle_auto_max_mb: String(settings.max_mb),
    });
    return await this.settings();
  }

  async pending(): Promise<PaddleRegionPending[]> {
    return (await this.requests.list()).map(toPending);
  }

  /** An admin declines a request: it stays, marked, so the planner says so and does not ask for it again. */
  async decline(id: string): Promise<void> {
    if (!(await this.requests.decline(id))) throw new DomainError(404, REGION_NOT_FOUND_MESSAGE);
  }

  /**
   * Where the water data around each place stands, in the order asked, after
   * starting what the setting allows. Places in one region share one decision.
   *
   * @txIndependent one decision per region, with Geofabrik asked for a size between them: a region added or a
   * request filed is whole on its own and stays when a later place fails
   */
  async load(user: User, request: PaddleRegionLoadRequest): Promise<PaddleRegionLoadState[]> {
    // With downloads switched off nothing new is ever loaded, so Geofabrik is not asked at all.
    const downloads = (await this.settings()).mode !== 'off';
    const places = await Promise.all(request.points.map((point) => this.placeOf(point, downloads)));
    const decided = new Map<string, PaddleRegionLoadState>();
    // One after the other: two places in one region must not both add it or file it.
    const answers: PaddleRegionLoadState[] = [];
    await places.reduce(async (previous, place) => {
      await previous;
      const key = place.kind === 'none' ? null : place.kind === 'held' ? place.row.id : place.region.id;
      const known = key === null ? undefined : decided.get(key);
      const answer = known ?? (await this.decide(place, user, request.retry ?? false));
      if (key !== null) decided.set(key, answer);
      answers.push(answer);
    }, Promise.resolve());
    return answers;
  }

  private async placeOf(point: PaddleRoutePoint, downloads: boolean): Promise<Place> {
    const covering = await this.routing.regionsCovering(point.lat, point.lng);
    const held = (await this.regions.aroundPoint(point.lat, point.lng)).filter((row) => {
      const boundary = decodeJson(PADDLE_REGION_BOUNDARY, row.boundary, row.id);
      return boundary === null || boundaryContains(boundary, point.lat, point.lng);
    });
    // A network reaching the place plans it, whichever region's boundary it lies in.
    const coveringRow =
      held.find((row) => covering.includes(row.id)) ??
      (covering[0] === undefined ? undefined : await this.regions.findById(covering[0]));
    if (coveringRow) return { kind: 'covered', region: { id: coveringRow.id, name: coveringRow.name } };
    const row = smallest(held, rowArea);
    if (row) return { kind: 'held', row };
    if (!downloads) return { kind: 'none', reason: 'off' };
    let catalogue: Map<string, GeofabrikRegion>;
    try {
      catalogue = await this.geofabrik.regions();
    } catch (err) {
      logError(`[Paddle] Geofabrik index: ${err instanceof Error ? err.message : String(err)}`);
      return { kind: 'none', reason: 'catalog_unavailable' };
    }
    const around = [...catalogue.values()].filter(
      (region) => region.boundary !== null && boundaryContains(region.boundary, point.lat, point.lng),
    );
    // Every region in the list has a boundary of its own; one without is never picked for a place.
    const region = smallest(around, (candidate) =>
      candidate.boundary ? areaOf(boxOfBoundary(candidate.boundary)) : Infinity,
    );
    return region ? { kind: 'catalogue', region } : { kind: 'none', reason: 'no_extract' };
  }

  private async decide(place: Place, user: User, retry: boolean): Promise<PaddleRegionLoadState> {
    switch (place.kind) {
      case 'covered':
        return { state: 'ready', region: place.region };
      case 'none':
        return { state: 'unavailable', region: null, reason: place.reason };
      case 'held':
        return await this.decideHeld(place.row, retry);
      case 'catalogue':
        return await this.decideNew(place.region, user);
    }
  }

  /** A region TREK holds already: being read, failed, or read and still without water at the place. */
  private async decideHeld(row: PaddleRegionRow, retry: boolean): Promise<PaddleRegionLoadState> {
    const region = { id: row.id, name: row.name };
    if (row.status === 'queued' || row.status === 'importing') return await this.loading(region);
    if (row.status === 'failed' && !retry) return { state: 'failed', region };
    // Read before networks were built (or failed and asked again): the next read builds one.
    const networks = await this.routing.networks();
    if (row.status === 'failed' || !networks.has(row.id)) {
      await this.regionsService.refresh(row.id);
      return await this.loading(region);
    }
    return { state: 'no_water', region };
  }

  /** A region TREK does not hold: loaded, filed as a request, or neither, as the setting says. */
  private async decideNew(region: GeofabrikRegion, user: User): Promise<PaddleRegionLoadState> {
    const ref = { id: region.id, name: region.name };
    const { mode, max_mb } = await this.settings();
    // A demo account plans on what is there; it never sets a download going.
    if (mode === 'off' || (await this.demo.isDemoUserId(user.id)))
      return { state: 'unavailable', region: ref, reason: 'off' };
    const filed = await this.requests.findByRegion(region.id);
    if (filed?.declined_at) return { state: 'declined', region: ref };
    // An admin planning is an admin deciding: their region loads at once, whatever its size.
    if (user.role === 'admin') return await this.add(ref, 'admin');
    if (filed) return { state: 'requested', region: ref, reason: filed.reason };
    if (mode === 'ask') return await this.request(ref, 'ask', null, user);
    const bytes = await this.geofabrik.sizeOf(region.pbfUrl);
    if (bytes !== null && bytes > max_mb * MB) return await this.request(ref, 'too_large', bytes, user);
    const since = dbNow(new Date(Date.now() - DAY_MS));
    if ((await this.regions.countAddedAutomaticallySince(since)) >= PADDLE_AUTO_REGIONS_PER_DAY) {
      return await this.request(ref, 'limit', bytes, user);
    }
    return await this.add(ref, 'auto');
  }

  private async add(region: RegionRef, origin: 'admin' | 'auto'): Promise<PaddleRegionLoadState> {
    await this.regionsService.add(region.id, origin);
    logInfo(`[Paddle] ${region.id}: added for a paddler's planning (${origin})`);
    return await this.loading(region);
  }

  private async loading(region: RegionRef): Promise<PaddleRegionLoadState> {
    return { state: 'loading', region, ...(await this.regionsService.readState(region.id)) };
  }

  /** Files a request and tells the admins, once per region. */
  private async request(
    region: RegionRef,
    reason: PaddleRegionWaitReason,
    bytes: number | null,
    user: User,
  ): Promise<PaddleRegionLoadState> {
    const filed = await this.requests.file({
      region_id: region.id,
      name: region.name,
      reason,
      bytes,
      requested_by: user.username,
    });
    if (filed) await this.announce(region, user);
    return { state: 'requested', region, reason };
  }

  /** @txStandalone the notice to the admins stands on its own; a failed one never undoes the request */
  private async announce(region: RegionRef, user: User): Promise<void> {
    try {
      await this.notifications.send({
        event: 'paddle_region_requested',
        actorId: user.id,
        scope: 'admin',
        targetId: 0,
        params: { region: region.name, actor: user.username },
      });
    } catch (err) {
      logError(`[Paddle] telling the admins about ${region.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
