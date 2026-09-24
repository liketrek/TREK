import { Injectable } from '@nestjs/common';
import { DAWARICH_TRACK_POINTS_PER_DAY, type DawarichTrack } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { DawarichClient, type DawarichCreds } from './dawarich.client';
import { DawarichService } from './dawarich.service';
import {
  bucketPointsByDay,
  bucketTracksByDay,
  countPoints,
  offsetMinutesOf,
} from './dawarich.helpers';

/**
 * The recorded route for a window, fetched on demand and never stored.
 *
 * That is the point of the whole feature and the one rule it must not break:
 * Dawarich owns the location archive. TREK draws the part of it somebody is
 * looking at right now and forgets it again. There is no table here, no
 * `route_geometry` written to a place, no background import.
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
    private readonly db: DatabaseService,
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
    if (!this.db.canAccessTrip(tripId, userId)) return null;

    const trip = this.db.get<{ start_date: string | null; end_date: string | null }>(
      'SELECT start_date, end_date FROM trips WHERE id = ?',
      tripId,
    );
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
    const creds = this.dawarich.getCredentials(userId);
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
    const capabilities = this.dawarich.getCapabilities(userId);

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

function emptyTrack(): DawarichTrack {
  return {
    days: [],
    source: 'tracks',
    fetchedAt: new Date().toISOString(),
    pointCount: 0,
    truncated: false,
  };
}
