import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyEntryStays } from '../../db/entities/JourneyEntryStays.entity';
import { JourneyShareTokens } from '../../db/entities/JourneyShareTokens.entity';
import { JourneyTrips } from '../../db/entities/JourneyTrips.entity';
import { Journeys } from '../../db/entities/Journeys.entity';
import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';
import type { JourneyEntryStaysRepository } from '../../db/repositories/JourneyEntryStays.repository';
import type { JourneyShareTokensRepository } from '../../db/repositories/JourneyShareTokens.repository';
import type { JourneyTripsRepository } from '../../db/repositories/JourneyTrips.repository';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import { logWarn } from '../audit/audit-log.logger';
import { notFound } from '../common/domain-error';
import { JourneyDomainService } from './journey-domain.service';
import { isValidGeoPoint, parseRouteGeometry } from './journey-geometry';
import { JourneyRecordedDaysService } from './journey-recorded-days.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  JourneyMapLayerResult,
  JourneyMapLayersResponse,
  JourneyMapPlace,
  JourneyMapRecording,
  JourneyMapStay,
  JourneyPublicMapLayersResponse,
  JourneyTrack,
} from '@trek/shared';

/** The entries a map may tie its plan and its stays to: who can read them is decided by the caller. */
interface EntryRef {
  id: number;
  source_place_id?: number | null;
  entry_date: string;
  type: string;
}

const WITHHELD = { status: 'withheld' } as const;

/**
 * What the journey map shows besides its entries and photos (JRN-04): the plan
 * of the linked trips, their GPX routes, the days of route the journey keeps
 * and the stays its entries were taken over from.
 *
 * Every source is read on its own, and one that fails answers `unavailable`
 * while the others still draw. Nothing is stored here and nothing is written:
 * a layer switched on in a browser only ever hides what the reader may see.
 * The public answer is cut on the server, by the link's flags, never by the
 * client: the map switched off shares nothing of it, and the stays, being
 * taken from a recording, travel only with the recorded days.
 */
@Injectable()
export class JourneyMapService {
  constructor(
    private readonly journeys: JourneyDomainService,
    private readonly recordedDays: JourneyRecordedDaysService,
    @InjectRepository(JourneyTrips) private readonly tripsRepo: JourneyTripsRepository,
    @InjectRepository(JourneyEntries) private readonly entriesRepo: JourneyEntriesRepository,
    @InjectRepository(JourneyEntryStays) private readonly staysRepo: JourneyEntryStaysRepository,
    @InjectRepository(JourneyShareTokens) private readonly shareTokensRepo: JourneyShareTokensRepository,
    @InjectRepository(Journeys) private readonly journeysRepo: JourneysRepository,
  ) {}

  /** The map layers of a journey for one of its people: the owner or a contributor. */
  async mapLayers(journeyId: number, userId: number): Promise<JourneyMapLayersResponse> {
    const journey = await this.journeys.canAccessJourney(journeyId, userId);
    if (!journey) throw notFound('Journey not found');
    const entries = await this.entriesRepo.listForJourney(journeyId);
    // A skeleton is the plan mirrored into the timeline, not something written.
    const written = entries.filter((entry) => entry.type !== 'skeleton');
    const [places, routes, stays] = await Promise.all([
      this.layer('places', journeyId, () => this.places(journeyId, written)),
      this.layer('routes', journeyId, () => (journey.show_trip_tracks ? this.routes(journeyId) : Promise.resolve([]))),
      this.layer('stays', journeyId, () => this.stays(journeyId, written)),
    ]);
    return { places, routes, stays };
  }

  /**
   * The map layers a share link shows, null for a link that does not exist.
   * Drafts never reach it: the entries it ties places and stays to are the
   * published ones, and a recorded day shows only beside a published entry.
   */
  async publicMapLayers(token: string): Promise<JourneyPublicMapLayersResponse | null> {
    const link = await this.shareTokensRepo.findByToken(token);
    if (!link) return null;
    const journey = await this.journeysRepo.findById(link.journey_id);
    if (!journey) return null;
    if (!link.share_map) return { places: WITHHELD, routes: WITHHELD, stays: WITHHELD, recordings: WITHHELD };

    const journeyId = link.journey_id;
    const published = await this.entriesRepo.listPublicEntries(journeyId);
    const sharePlan = !!link.share_plan;
    const [places, routes, stays, recordings] = await Promise.all([
      sharePlan ? this.layer('places', journeyId, () => this.places(journeyId, published)) : WITHHELD,
      sharePlan && journey.show_trip_tracks ? this.layer('routes', journeyId, () => this.routes(journeyId)) : WITHHELD,
      link.share_recordings ? this.layer('stays', journeyId, () => this.stays(journeyId, published)) : WITHHELD,
      link.share_recordings
        ? this.layer('recordings', journeyId, () => this.recordings(journeyId, published))
        : WITHHELD,
    ]);
    return { places, routes, stays, recordings };
  }

  private async layer<T>(name: string, journeyId: number, read: () => Promise<T[]>): Promise<JourneyMapLayerResult<T>> {
    try {
      return { status: 'ok', items: await read() };
    } catch (err) {
      logWarn(`[journey-map] the ${name} of journey ${journeyId} could not be read: ${(err as Error).message}`);
      return { status: 'unavailable' };
    }
  }

  /**
   * One pin per planned place, with every day the plan puts it on. A place an
   * entry came from points at that entry, the earliest one when several did,
   * so the map can show plan and memory as one; a plan alone proves no visit.
   */
  private async places(journeyId: number, entries: EntryRef[]): Promise<JourneyMapPlace[]> {
    const rows = await this.tripsRepo.listMapPlacesForJourney(journeyId);
    const entryByPlace = new Map<number, number>();
    for (const entry of [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))) {
      if (entry.source_place_id != null && !entryByPlace.has(entry.source_place_id)) {
        entryByPlace.set(entry.source_place_id, entry.id);
      }
    }
    const byPlace = new Map<number, JourneyMapPlace>();
    for (const row of rows) {
      if (!isValidGeoPoint(row.lat, row.lng)) continue;
      const known = byPlace.get(row.place_id);
      if (known) {
        if (row.day_date && !known.days.includes(row.day_date)) known.days.push(row.day_date);
        continue;
      }
      byPlace.set(row.place_id, {
        place_id: row.place_id,
        trip_id: row.trip_id,
        trip_title: row.trip_title,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        days: row.day_date ? [row.day_date] : [],
        time: row.time,
        category_color: row.category_color,
        category_icon: row.category_icon,
        entry_id: entryByPlace.get(row.place_id) ?? null,
      });
    }
    for (const place of byPlace.values()) place.days.sort();
    return [...byPlace.values()];
  }

  private async routes(journeyId: number): Promise<JourneyTrack[]> {
    const tracks: JourneyTrack[] = [];
    for (const row of await this.tripsRepo.listRouteSourcesForJourney(journeyId)) {
      const points = parseRouteGeometry(row.route_geometry);
      if (!points) continue;
      tracks.push({
        place_id: row.place_id,
        trip_id: row.trip_id,
        name: row.name,
        color: row.route_color,
        points,
        kind: 'trip_gpx',
      });
    }
    return tracks;
  }

  /** The located stays of the given entries, each where it was recorded; one without a place is left out. */
  private async stays(journeyId: number, entries: EntryRef[]): Promise<JourneyMapStay[]> {
    const visible = new Set(entries.map((entry) => entry.id));
    return (await this.staysRepo.listLocatedForJourney(journeyId)).filter(
      (stay) => visible.has(stay.entry_id) && isValidGeoPoint(stay.lat, stay.lng),
    );
  }

  /** The kept days that have one of the given entries on them, their pieces apart. */
  private async recordings(journeyId: number, entries: EntryRef[]): Promise<JourneyMapRecording[]> {
    const days = new Set(entries.map((entry) => entry.entry_date));
    return (await this.recordedDays.list(journeyId))
      .filter((day) => days.has(day.date))
      .map((day) => ({
        date: day.date,
        pieces: day.segments
          .map((segment) => segment.points.filter(([lat, lng]) => isValidGeoPoint(lat, lng)))
          .filter((points) => points.length > 1),
        distance_m: day.stats.distanceMeters,
      }));
  }
}
