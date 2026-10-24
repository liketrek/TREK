import { Places } from '../../db/entities/Places.entity';
import { TourSources } from '../../db/entities/TourSources.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { TourSnapshotRow, TourSourcesRepository } from '../../db/repositories/TourSources.repository';
import type { TourProvenanceRow, ToursRepository } from '../../db/repositories/Tours.repository';
import { thinLine } from '../../utils/polyline';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { PlaceImportService } from '../place-import/place-import.service';
import { PlacesService } from '../places/places.service';
import { WandererService } from '../wanderer/wanderer.service';
import { changedParts, computeTourMetrics, contentHashOf, localHashOf, parseRouteGeometry } from './tours.helpers';
import { ToursService } from './tours.service';
import { WandererWatchService } from './wanderer-watch.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';
import type {
  WandererImportPreview,
  WandererImportRequest,
  WandererImportResponse,
  TourSourceCheckResponse,
  WandererSearchRequest,
  WandererSearchResponse,
} from '@trek/shared';
import { wandererDifficultyToSac } from '@trek/shared';

const PROVIDER = 'wanderer';
/** The line the preview draws: the whole tour, thinned for the map. */
const PREVIEW_LINE_POINTS = 800;

/** The trip id the guard already resolved; a malformed one never got this far, and still answers 404. */
/** The instance and trail a snapshot came from: its import record, else the reference the tour carries. */
function sourceIdentity(row: TourProvenanceRow): { instance: string; externalId: string } {
  if (row.source_instance !== null && row.source_external_id !== null) {
    return { instance: row.source_instance, externalId: row.source_external_id };
  }
  const ref = row.wanderer_ref ?? '';
  const at = ref.lastIndexOf('#');
  return { instance: ref.slice(0, Math.max(at, 0)), externalId: ref.slice(at + 1) };
}

function tripRowId(tripId: string): number {
  const tid = toRowId(tripId);
  if (tid === null) throw new DomainError(404, 'Trip not found');
  return tid;
}

/**
 * wanderer trails into a trip: the search marked with what the trip already
 * holds, the preview of one trail measured from its original GPX and compared
 * with an earlier snapshot, and the import that writes the snapshot.
 *
 * A snapshot is an independent tour. Nothing here updates, replaces or deletes
 * one: a changed trail can only be imported again, as a new tour beside the old.
 */
@Injectable()
export class ToursWandererService {
  private readonly logger = new Logger(ToursWandererService.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly wanderer: WandererService,
    private readonly placeImport: PlaceImportService,
    private readonly places: PlacesService,
    private readonly tours: ToursService,
    private readonly watch: WandererWatchService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(TourSources) private readonly sources: TourSourcesRepository,
  ) {}

  async search(
    tripId: string,
    userId: number,
    request: Required<Pick<WandererSearchRequest, 'q' | 'page'>> & Pick<WandererSearchRequest, 'bbox'>,
  ): Promise<WandererSearchResponse> {
    const tid = tripRowId(tripId);
    const found = await this.wanderer.search(userId, request);
    const snapshots = await this.sources.listSnapshots(
      tid,
      PROVIDER,
      found.instance,
      found.trails.map((trail) => trail.id),
    );
    return {
      trails: found.trails.map((trail) => ({
        ...trail,
        importedAs: snapshots
          .filter((snapshot) => snapshot.external_id === trail.id)
          .map((snapshot) => snapshot.place_id),
      })),
      total: found.total,
      page: request.page,
      pageSize: found.pageSize,
    };
  }

  /** Download and measure one trail, without writing anything. */
  private async fetchTrail(userId: number, trailId: string) {
    const summary = await this.wanderer.findTrail(userId, trailId);
    if (!summary)
      throw new DomainError(404, 'Trail not found', { code: 'wanderer_not_found', details: { code: 'not_found' } });
    const { instance, trail, gpx } = await this.wanderer.download(userId, trailId);
    const rows = this.placeImport.readGpx(Buffer.from(gpx, 'utf8'), {
      importWaypoints: false,
      importRoutes: true,
      importTracks: true,
      defaultName: trail.name,
    });
    // A trail with several segments arrives as several tracks; together they are the one tour.
    const route = rows.flatMap((row) => parseRouteGeometry(row.routeGeometry));
    if (route.length < 2) {
      throw new DomainError(422, 'The trail has no track or route', {
        code: 'wanderer_no_track',
        details: { code: 'no_track' },
      });
    }
    const description = trail.description?.trim() || null;
    // The search index can lag behind an edit; the record itself is what gets imported.
    return {
      summary: { ...summary, name: trail.name, description },
      instance,
      trail,
      route,
      description,
      contentHash: contentHashOf(trail.name, description, route),
    };
  }

  /** Every snapshot of the trail in the trip, newest first. */
  private async snapshotsOf(tid: number, instance: string, trailId: string): Promise<TourSnapshotRow[]> {
    return await this.sources.listSnapshots(tid, PROVIDER, instance, [trailId]);
  }

  /**
   * MF-03: ask the source of one wanderer snapshot whether the trail changed
   * since it came in, on the caller's own connection. Reads only: the
   * snapshot stays as it is whatever the source says, and taking a change
   * over is the confirmed reimport, with the hash this answer carries. What
   * the check read is what the caller has now seen of the trail, so their
   * background hint on the snapshot goes (WAN-02).
   */
  async checkSource(tripId: string, userId: number, placeId: string): Promise<TourSourceCheckResponse> {
    const tid = tripRowId(tripId);
    const pid = toRowId(placeId);
    const row = pid === null ? undefined : await this.toursRepo.findProvenance(tid, pid);
    if (!row || pid === null) throw new DomainError(404, 'Tour not found');
    if (row.origin !== 'wanderer') {
      throw new DomainError(400, 'This tour has no wanderer source', {
        code: 'wanderer_no_source',
        details: { code: 'no_source' },
      });
    }
    const { instance, externalId } = sourceIdentity(row);
    const editedLocally =
      row.source_local_hash === null
        ? null
        : localHashOf(row.name, parseRouteGeometry(row.route_geometry)) !== row.source_local_hash;
    const answer = (state: TourSourceCheckResponse['state']): TourSourceCheckResponse => ({
      state,
      changes: [],
      externalUpdated: null,
      importedUpdated: row.source_external_updated,
      editedLocally,
      reimport: null,
    });

    const connected = await this.wanderer.getConnection(userId);
    if (!connected.connected) return answer('not_connected');
    if ((await this.wanderer.instanceOf(userId)) !== instance) return answer('other_instance');
    let fetched: Awaited<ReturnType<ToursWandererService['fetchTrail']>>;
    try {
      fetched = await this.fetchTrail(userId, externalId);
    } catch (err: unknown) {
      // Gone, or no longer the caller's to read: said as such, the snapshot is not touched.
      if (err instanceof DomainError && (err.getStatus() === 404 || err.getStatus() === 403))
        return answer('unavailable');
      throw err;
    }
    const reimport = { trailId: externalId, contentHash: fetched.contentHash };
    const externalUpdated = fetched.trail.updated ?? null;
    await this.watch.noteSeen(pid, userId, { contentHash: fetched.contentHash, externalUpdated });
    if (row.source_content_hash === null) return { ...answer('unknown'), externalUpdated, reimport };
    const changes = changedParts(row.source_content_hash, fetched.contentHash);
    return changes.length === 0
      ? { ...answer('unchanged'), externalUpdated }
      : { ...answer('changed'), changes, externalUpdated, reimport };
  }

  async preview(tripId: string, userId: number, trailId: string): Promise<WandererImportPreview> {
    const tid = tripRowId(tripId);
    const fetched = await this.fetchTrail(userId, trailId);
    const metrics = computeTourMetrics(fetched.route);
    const snapshots = await this.snapshotsOf(tid, fetched.instance, trailId);
    const latest = snapshots[0];
    const changes = latest ? changedParts(latest.content_hash, fetched.contentHash) : [];
    return {
      trail: { ...fetched.summary, importedAs: snapshots.map((row) => row.place_id) },
      distanceKm: metrics.distanceKm ?? 0,
      elevationGainM: metrics.elevationGainM,
      elevationLossM: metrics.elevationLossM,
      hasElevation: metrics.hasElevation,
      points: fetched.route.length,
      line: thinLine(fetched.route, PREVIEW_LINE_POINTS).map(([lat, lng]) => [lat, lng] as [number, number]),
      contentHash: fetched.contentHash,
      state: latest ? (changes.length === 0 ? 'unchanged' : 'changed') : 'new',
      snapshot: latest
        ? {
            placeId: latest.place_id,
            name: latest.name,
            importedAt: latest.imported_at ?? '',
            // The tour as it stands now against the tour as it was saved at the import.
            editedLocally: localHashOf(latest.name, parseRouteGeometry(latest.route_geometry)) !== latest.local_hash,
          }
        : null,
      changes,
    };
  }

  /**
   * Write the snapshot: the place with the full line, its tour facet and its
   * provenance, all or nothing. Refused when the trail is no longer what the
   * preview showed, and when the trip holds a snapshot of exactly this content.
   */
  async import(
    tripId: string,
    userId: number,
    request: WandererImportRequest,
    socketId?: string,
  ): Promise<WandererImportResponse> {
    const tid = tripRowId(tripId);
    const trailId = request.trailId;
    const fetched = await this.fetchTrail(userId, trailId);
    if (fetched.contentHash !== request.contentHash) {
      throw new DomainError(409, 'The trail changed since the preview', {
        code: 'wanderer_preview_stale',
        details: { code: 'preview_stale' },
      });
    }
    const same = (await this.snapshotsOf(tid, fetched.instance, trailId)).find(
      (row) => row.content_hash === fetched.contentHash,
    );
    if (same) {
      throw new DomainError(409, 'This trail is already in the trip', {
        code: 'wanderer_already_imported',
        details: { code: 'already_imported', placeId: same.place_id },
      });
    }
    const metrics = computeTourMetrics(fetched.route);
    const [startLat, startLng] = fetched.route[0];
    const name = fetched.trail.name.trim().slice(0, 255) || fetched.summary.name;

    const placeId = await this.uow.transactional(async () => {
      const id = await this.placesRepo.insertTourPlace({
        trip_id: tid,
        name,
        lat: startLat,
        lng: startLng,
        route_geometry: JSON.stringify(fetched.route),
        description: fetched.description,
        website: null,
      });
      await this.toursRepo.insertTour({
        place_id: id,
        tour_type: 'hike',
        distance: metrics.distanceKm,
        elevation_gain: metrics.elevationGainM,
        elevation_loss: metrics.elevationLossM,
        duration: null,
        planned_duration_minutes: null,
        break_additional_minutes: null,
        match_confidence: metrics.hasElevation ? 1 : 0.3,
        // The one scale tours use; the source's own word stays in `difficulty`.
        max_hiking_difficulty: wandererDifficultyToSac(fetched.summary.difficulty),
        wanderer_ref: `${fetched.instance}#${trailId}`,
        difficulty: fetched.summary.difficulty,
        origin: 'wanderer',
      });
      await this.sources.insertSource({
        place_id: id,
        provider: PROVIDER,
        instance: fetched.instance,
        external_id: trailId,
        external_url: fetched.summary.externalUrl,
        external_updated: fetched.trail.updated ?? null,
        content_hash: fetched.contentHash,
        local_hash: localHashOf(name, fetched.route),
        imported_by: userId,
      });
      return id;
    });

    const { tour } = await this.tours.getTour(tripId, String(placeId));
    const place = await this.placesRepo.findWithTagsAndRatings(placeId);
    try {
      this.places.broadcast(tripId, 'tours:changed', { placeIds: [placeId] }, socketId);
      if (place) this.places.broadcast(tripId, 'place:created', { place }, socketId);
    } catch {
      this.logger.warn(`Committed wanderer import ${placeId}: realtime notification failed`);
    }
    return { tour };
  }
}
