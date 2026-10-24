import { Trips } from '../../db/entities/Trips.entity';
import { TripsRepository } from '../../db/repositories/Trips.repository';
import { DomainError } from '../common/domain-error';
import { DawarichClient, DawarichError, type DawarichCreds, type DawarichTrackFeature } from './dawarich.client';
import { RECORDING_GAP, bucketPointsByDay, bucketTracksByDay, countPoints, offsetMinutesOf } from './dawarich.helpers';
import { DawarichService } from './dawarich.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { DAWARICH_TRACK_POINTS_PER_DAY, type DawarichTrack, type DawarichTrackSegment } from '@trek/shared';

/** One local day of recording, read for a journey to keep (JRN-01). */
export interface RecordedDayFetch {
  segments: DawarichTrackSegment[];
  sourceKind: 'tracks' | 'points';
  /** The zone the day was cut in, minutes east of UTC. */
  utcOffsetMinutes: number;
  offsetSource: 'source' | 'chosen';
  /** The zone Dawarich records in, where its answer shows one. */
  sourceOffsetMinutes: number | null;
  window: { from: string; to: string };
  fetchedAt: string;
  truncated: boolean;
}

const HOUR_MS = 3_600_000;

/**
 * The recorded route for a window, fetched on demand and never stored here.
 *
 * That is the point of the whole feature and the one rule it must not break:
 * Dawarich owns the location archive. TREK draws the part of it somebody is
 * looking at right now and forgets it again. There is no table here, no
 * `route_geometry` written to a place, no background import. The one copy is
 * a day a traveller takes over into a journey on purpose (`fetchDay`, JRN-01),
 * and the journey keeps that, not this service.
 *
 * What there is instead is a short in-memory cache, because "update the line
 * while the map is open" and "ask an instance for a month of GPS every few
 * seconds" are the same request otherwise. It lives for a minute, it is keyed
 * per user and window, and losing it on restart costs one extra fetch.
 */
@Injectable()
export class DawarichTracksService {
  private readonly cache = new Map<string, { at: number; value: DawarichTrack }>();

  /**
   * Long enough that panning and toggling the layer do not re-fetch, short
   * enough that a live recording visibly catches up.
   */
  private static readonly TTL_MS = 60_000;

  /**
   * A ceiling, not a sizing estimate: the cache holds whole days of geometry
   * and a user flipping through a year of trips would otherwise keep every one
   * of them alive. Oldest entry out first.
   */
  private static readonly MAX_ENTRIES = 64;

  constructor(
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly dawarich: DawarichService,
    private readonly client: DawarichClient,
  ) {}

  /**
   * The recorded route for a trip, grouped by local day.
   *
   * `from`/`to` narrow it further so the planner can ask for one day without
   * pulling the whole trip; without them the trip's own dates are the window.
   * Returns null when the caller cannot read the trip — the controller turns
   * that into the same 404 a missing trip gets.
   */
  async forTrip(
    userId: number,
    tripId: number,
    from?: string,
    to?: string,
    offsetMinutes = 0,
  ): Promise<DawarichTrack | null> {
    if (!(await this.trips.findAccessible(tripId, userId))) return null;

    const trip = await this.trips.findDatesById(tripId);
    if (!trip) return null;

    const start = from ?? trip.start_date;
    const end = to ?? trip.end_date ?? trip.start_date;
    if (!start || !end) {
      // A trip without dates has no window to ask about. An empty result says
      // so honestly; an error would suggest the connection is broken.
      return emptyTrack();
    }

    return this.forWindow(userId, `${start}T00:00:00Z`, `${end}T23:59:59Z`, offsetMinutes);
  }

  /**
   * The recorded route for an explicit instant range.
   *
   * Used by the journal, which has dated entries rather than a trip window.
   */
  async forWindow(
    userId: number,
    fromIso: string,
    toIso: string,
    offsetMinutes = offsetMinutesOf(fromIso),
  ): Promise<DawarichTrack> {
    const creds = await this.dawarich.getCredentials(userId);
    if (!creds) return emptyTrack();

    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from) {
      return emptyTrack();
    }

    // The offset is part of the key: the same window grouped by two different
    // days is two different answers, and one traveller can ask for both across
    // a timezone change.
    const key = `${userId}:${from.toISOString()}:${to.toISOString()}:${offsetMinutes}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < DawarichTracksService.TTL_MS) return hit.value;

    const value = await this.fetch(creds, userId, from, to, offsetMinutes);
    this.remember(key, value);
    return value;
  }

  /**
   * Tracks first, points as the fallback.
   *
   * `/tracks` returns lines Dawarich has already segmented and labelled with a
   * travel mode, which is both a smaller payload and a better line than raw
   * points. But tracks are produced by a background job, so a fresh import —
   * or an instance old enough not to have the endpoint — has points long before
   * it has tracks. Falling back keeps the overlay working on both, and the
   * result says which one answered so the UI can be honest about it.
   */
  private async fetch(
    creds: DawarichCreds,
    userId: number,
    from: Date,
    to: Date,
    offsetMinutes: number,
  ): Promise<DawarichTrack> {
    const capabilities = await this.dawarich.getCapabilities(userId);

    if (capabilities?.tracks !== false) {
      try {
        const { features, truncated } = await this.client.listTracks(creds, from, to);
        if (features.length > 0) {
          const days = bucketTracksByDay(features, { maxPointsPerDay: DAWARICH_TRACK_POINTS_PER_DAY });
          return {
            days,
            source: 'tracks',
            fetchedAt: new Date().toISOString(),
            pointCount: countPoints(days),
            truncated,
          };
        }
      } catch {
        // Fall through to points: an instance that cannot serve tracks can
        // usually still serve the points they would have been built from.
      }
    }

    const { points, truncated } = await this.client.listPoints(creds, from, to);
    // Points carry a Unix timestamp and no zone, so the local day has to come
    // from somewhere. It comes from the caller: the browser knows the offset the
    // reader is living in, and "which day was that" is their question, not the
    // server's. Zero — plain UTC — is the answer for a caller that says nothing,
    // which is what a Date can ever tell us (`toISOString` always ends in `Z`,
    // so deriving it from the window here only ever produced UTC).
    const days = bucketPointsByDay(points, offsetMinutes, { maxPointsPerDay: DAWARICH_TRACK_POINTS_PER_DAY });
    return {
      days,
      source: 'points',
      fetchedAt: new Date().toISOString(),
      pointCount: countPoints(days),
      truncated,
    };
  }

  /**
   * One local day of recording, read fresh past the cache: what a journey keeps
   * has to be what the instance says now, not what the map saw a minute ago.
   *
   * The day is cut in Dawarich's own zone when `useSourceOffset` asks for it and
   * the answer reveals one (track times carry it, points do not), else in the
   * zone given. The request spans every zone there is around the date, so the
   * day is the same day whichever zone cuts it. A gap in the recording stays a
   * gap. Refuses with a DomainError the controller and the MCP tool pass on:
   * 409 `not_connected`, or the instance's own reason.
   */
  async fetchDay(
    userId: number,
    date: string,
    zone: { offsetMinutes: number; useSourceOffset: boolean },
  ): Promise<RecordedDayFetch> {
    const creds = await this.dawarich.getCredentials(userId);
    if (!creds) throw new DomainError(409, 'Dawarich is not connected', { details: { code: 'not_connected' } });

    const dayStart = Date.parse(`${date}T00:00:00Z`);
    const from = new Date(dayStart - 14 * HOUR_MS);
    const to = new Date(dayStart + 36 * HOUR_MS);
    const capabilities = await this.dawarich.getCapabilities(userId);

    if (capabilities?.tracks !== false) {
      try {
        const { features, truncated } = await this.client.listTracks(creds, from, to);
        const sourceOffset = sourceOffsetOn(features, date);
        const offset = zoneOf(zone, sourceOffset);
        const day = bucketTracksByDay(features, {
          maxPointsPerDay: DAWARICH_TRACK_POINTS_PER_DAY,
          offsetMinutes: offset.minutes,
        }).find((d) => d.date === date);
        if (day && day.segments.length > 0) {
          return recordedDay(date, day.segments, 'tracks', offset, sourceOffset, truncated);
        }
      } catch {
        // Points next, as for the overlay: an instance that cannot serve tracks
        // can usually still serve what they are built from.
      }
    }

    const offset = zoneOf(zone, null);
    try {
      const { points, truncated } = await this.client.listPoints(creds, from, to);
      const day = bucketPointsByDay(points, offset.minutes, {
        maxPointsPerDay: DAWARICH_TRACK_POINTS_PER_DAY,
        gaps: RECORDING_GAP,
      }).find((d) => d.date === date);
      return recordedDay(date, day?.segments ?? [], 'points', offset, null, truncated);
    } catch (err) {
      if (err instanceof DawarichError) {
        const status = err.code === 'unauthorized' || err.code === 'forbidden' ? 400 : 502;
        throw new DomainError(status, err.message, { details: { code: err.code } });
      }
      throw err;
    }
  }

  private remember(key: string, value: DawarichTrack): void {
    if (this.cache.size >= DawarichTracksService.MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { at: Date.now(), value });
  }

  /** Drop everything cached for one user — used when a connection changes. */
  forget(userId: number): void {
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(`${userId}:`)) this.cache.delete(key);
    }
  }
}

/**
 * The zone Dawarich recorded the date in, read off the first track that starts
 * on it: the window opens on the day before, and a traveller who crossed zones
 * overnight was elsewhere then. A `Z` time names no zone, Dawarich just wrote
 * UTC, so it reveals nothing about where the day was.
 */
function sourceOffsetOn(features: DawarichTrackFeature[], date: string): number | null {
  for (const feature of features) {
    const startAt = feature.properties?.start_at;
    if (typeof startAt !== 'string' || !/[+-]\d{2}:?\d{2}$/.test(startAt)) continue;
    const offset = offsetMinutesOf(startAt);
    const localDate = new Date(Date.parse(startAt) + offset * 60_000).toISOString().slice(0, 10);
    if (localDate === date) return offset;
  }
  return null;
}

function zoneOf(
  zone: { offsetMinutes: number; useSourceOffset: boolean },
  sourceOffset: number | null,
): { minutes: number; source: 'source' | 'chosen' } {
  return zone.useSourceOffset && sourceOffset !== null
    ? { minutes: sourceOffset, source: 'source' }
    : { minutes: zone.offsetMinutes, source: 'chosen' };
}

function recordedDay(
  date: string,
  segments: DawarichTrackSegment[],
  sourceKind: 'tracks' | 'points',
  offset: { minutes: number; source: 'source' | 'chosen' },
  sourceOffsetMinutes: number | null,
  truncated: boolean,
): RecordedDayFetch {
  const from = Date.parse(`${date}T00:00:00Z`) - offset.minutes * 60_000;
  return {
    segments,
    sourceKind,
    utcOffsetMinutes: offset.minutes,
    offsetSource: offset.source,
    sourceOffsetMinutes,
    window: { from: new Date(from).toISOString(), to: new Date(from + 24 * HOUR_MS).toISOString() },
    fetchedAt: new Date().toISOString(),
    truncated,
  };
}

function emptyTrack(): DawarichTrack {
  return {
    days: [],
    source: 'tracks',
    fetchedAt: new Date().toISOString(),
    pointCount: 0,
    truncated: false,
  };
}
