import { Injectable } from '@nestjs/common';
import { CONTINENT_MAP, strongerVisitStatus, todayUtc, tripVisitStatus, VisitStatus } from '@trek/shared';
import type { AtlasLocateResponse } from '@trek/shared';
import { Trip, Place } from '../../types';
import { DatabaseService } from '../database/database.service';
import {
  getCountryFromCoords,
  getCountryGeoGz,
  getRegionFromCoords,
  getRegionGeo,
  geocodingInFlight,
  resolveCountryCodeSync,
  reverseGeocodeRegion,
} from './atlas-geo';
import { KNOWN_COUNTRIES } from './known-countries';
import { cityFromAddress } from './city-from-address';
import { transferEndpointIds } from './transfer-endpoints';
import type { FlightEndpointRow } from './transfer-endpoints';
import { haversineKm } from '../common/geo';

/**
 * A reservation endpoint plus the two booking columns that decide whether it may
 * take part in layover pairing at all (see transfer-endpoints.ts).
 */
type EndpointRow = FlightEndpointRow & {
  reservation_type: string | null;
  reservation_status: string | null;
};

export type CreateBucketData = {
  name: string;
  lat?: number | null;
  lng?: number | null;
  country_code?: string | null;
  notes?: string | null;
  target_date?: string | null;
};

export type UpdateBucketData = {
  name?: string;
  notes?: string;
  lat?: number | null;
  lng?: number | null;
  country_code?: string | null;
  target_date?: string | null;
};

/** The columns that decide whether two bucket-list rows are the same wish (#1898). */
type BucketIdentity = {
  name: string;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  target_date: string | null;
};

// Bundled/geocoded region codes are always "<countryCode>-<rest>" (ISO 3166-2 format, and
// buildRegionInfo's synthesized fallback follows the same convention) — used to recover a
// region's country when there's no visited_regions row to read it from (a place-derived
// region was never inserted there).
function countryCodeFromRegionCode(regionCode: string): string {
  return (regionCode.split('-')[0] || '').toUpperCase();
}

/**
 * The same bucket-list wish, added twice (#1898). Deliberately a plain Error and
 * not an HttpException: the service is shared with the MCP tools and the plugin
 * RPC host, which shape their own errors — only atlas.controller.ts turns this
 * into the 409.
 */
export class BucketItemExistsError extends Error {
  constructor() {
    super('Already on your bucket list');
    this.name = 'BucketItemExistsError';
  }
}

// An empty string and NULL are the same "not set" for a bucket item's country and
// target date, so they must not produce two different identities (#1898) — the
// bucket forms send '' where the map dialogs send null.
function blankToNull(value: string | null | undefined): string | null {
  return value === undefined || value === null || value === '' ? null : value;
}

/**
 * DI-native atlas domain service — the legacy services/atlasService SQL
 * (stats aggregation, visited countries/regions with the #1490 tombstones,
 * bucket-list CRUD) folded in verbatim over the injected DatabaseService.
 * The pure-geo machinery (bundled admin0/admin1 boundaries, point-in-polygon
 * indexes, Nominatim geocoding and its caches) lives in ./atlas-geo — a plain
 * module so the multi-MB caches stay process-global across the container
 * instance and test helpers (#1576).
 * Returns native service shapes; the client-facing contracts live in
 * @trek/shared. No broadcasts: atlas rows are uid-scoped, not trip-scoped.
 */
@Injectable()
export class AtlasService {
  constructor(private readonly db: DatabaseService) {}

  // ── Shared query: all trips the user owns or is a member of ───────────────

  private getUserTrips(userId: number): Trip[] {
    return this.db
      .prepare(
        `
    SELECT DISTINCT t.* FROM trips t
    LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
    WHERE t.user_id = ? OR m.user_id = ?
    ORDER BY t.start_date DESC
  `,
      )
      .all(userId, userId, userId) as Trip[];
  }

  private getPlacesForTrips(tripIds: number[]): Place[] {
    if (tripIds.length === 0) return [];
    const placeholders = tripIds.map(() => '?').join(',');
    return this.db.prepare(`SELECT * FROM places WHERE trip_id IN (${placeholders})`).all(...tripIds) as Place[];
  }

  /**
   * Trip id → whether that trip counts as visited, planned or a dateless idea (#1048).
   * Everything country-shaped downstream takes its status from here, so the map, the
   * counters and the country detail sheet can never disagree about the same trip.
   */
  private tripStatusMap(trips: Trip[], today: string): Map<number, VisitStatus> {
    return new Map(trips.map((t) => [t.id, tripVisitStatus(t.start_date, t.end_date, today)]));
  }

  // ── Country resolution (batch DB cache + sync fallback + background geocoding) ──

  private resolvePlaceCountries(places: Place[]): Map<number, string> {
    const out = new Map<number, string>();
    const geoPlaces = places.filter((p) => p.lat && p.lng);
    const placeIds = geoPlaces.map((p) => p.id);

    const cached =
      placeIds.length > 0
        ? (this.db
            .prepare(
              `SELECT place_id, country_code FROM place_regions WHERE place_id IN (${placeIds.map(() => '?').join(',')})`,
            )
            .all(...placeIds) as { place_id: number; country_code: string }[])
        : [];
    const cachedMap = new Map(cached.map((r) => [r.place_id, r.country_code]));

    const uncachedForGeocode: Place[] = [];
    for (const p of places) {
      const fromDb = cachedMap.get(p.id);
      if (fromDb) {
        out.set(p.id, fromDb);
        continue;
      }
      const sync = resolveCountryCodeSync(p);
      if (sync) {
        out.set(p.id, sync);
        continue;
      }
      if (p.lat && p.lng && !geocodingInFlight.has(p.id)) {
        uncachedForGeocode.push(p);
      }
    }

    if (uncachedForGeocode.length > 0) {
      const insertStmt = this.db.prepare(
        'INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)',
      );
      for (const p of uncachedForGeocode) geocodingInFlight.add(p.id);
      void (async () => {
        try {
          for (const place of uncachedForGeocode) {
            try {
              const info = await reverseGeocodeRegion(place.lat!, place.lng!, place.address);
              if (info) insertStmt.run(place.id, info.country_code, info.region_code, info.region_name);
            } catch {
              /* continue */
            } finally {
              geocodingInFlight.delete(place.id);
            }
          }
        } catch {
          for (const p of uncachedForGeocode) geocodingInFlight.delete(p.id);
        }
      })();
    }

    return out;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async stats(userId: number) {
    const trips = this.getUserTrips(userId);
    const tripIds = trips.map((t) => t.id);

    if (tripIds.length === 0) {
      const hiddenOnly = this.getHiddenCountries(userId);
      const manualCountries = this.db
        .prepare('SELECT country_code FROM visited_countries WHERE user_id = ?')
        .all(userId) as {
        country_code: string;
      }[];
      const countries = manualCountries
        .filter((mc) => !hiddenOnly.has(mc.country_code))
        .map((mc) => ({ code: mc.country_code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }));
      return {
        countries,
        trips: [],
        stats: { totalTrips: 0, totalPlaces: 0, totalCountries: countries.length, totalDays: 0 },
      };
    }

    const places = this.getPlacesForTrips(tripIds);
    const now = todayUtc();
    const tripStatus = this.tripStatusMap(trips, now);

    interface CountryEntry {
      code: string;
      places: { id: number; name: string; lat: number | null; lng: number | null }[];
      tripIds: Set<number>;
      status: VisitStatus;
    }
    const placeCountries = this.resolvePlaceCountries(places);
    const countrySet = new Map<string, CountryEntry>();
    for (const place of places) {
      const code = placeCountries.get(place.id);
      if (code) {
        const status = tripStatus.get(place.trip_id) ?? 'idea';
        const entry = countrySet.get(code);
        if (entry) {
          entry.status = strongerVisitStatus(entry.status, status);
        } else {
          countrySet.set(code, { code, places: [], tripIds: new Set(), status });
        }
        countrySet
          .get(code)!
          .places.push({ id: place.id, name: place.name, lat: place.lat ?? null, lng: place.lng ?? null });
        countrySet.get(code)!.tripIds.add(place.trip_id);
      }
    }

    let totalDays = 0;
    for (const trip of trips) {
      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diff > 0) totalDays += diff;
      }
    }

    const countries = [...countrySet.values()].map((c) => {
      const countryTrips = trips.filter((t) => c.tripIds.has(t.id));
      const dates = countryTrips
        .map((t) => t.start_date)
        .filter(Boolean)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      return {
        code: c.code,
        placeCount: c.places.length,
        tripCount: c.tripIds.size,
        firstVisit: dates[0] || null,
        lastVisit: dates[dates.length - 1] || null,
        status: c.status,
      };
    });

    const citySet = new Set<string>();
    for (const place of places) {
      if (place.address) {
        const parts = place.address
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        // The last part is the country; the city is usually right before it, but a
        // full formatted address can have a postal code sitting between them
        // (e.g. "Bucharest, 010071, Romania"). Walk back from the country and take
        // the first part that still has letters once digits/postal noise is stripped.
        const candidates = parts.length >= 2 ? parts.slice(0, -1) : parts;
        let city = '';
        for (let i = candidates.length - 1; i >= 0; i--) {
          const cleaned = candidates[i].replace(/[\d\-\u2212\u3012]+/g, '').trim();
          if (cleaned) {
            city = cleaned.toLowerCase();
            break;
          }
        }
        if (city) citySet.add(city);
      }
    }
    const totalCities = citySet.size;

    // Countries the user explicitly removed. Only the zero-count passes below are
    // suppressed — a country with real places isn't removable in the UI anyway, and once
    // the user adds a place there the tombstone should stop mattering (#1490).
    const hidden = this.getHiddenCountries(userId);

    // Merge manually marked countries
    const manualCountries = this.db
      .prepare('SELECT country_code FROM visited_countries WHERE user_id = ?')
      .all(userId) as {
      country_code: string;
    }[];
    for (const mc of manualCountries) {
      if (hidden.has(mc.country_code)) continue;
      const existing = countries.find((c) => c.code === mc.country_code);
      if (existing) {
        // Marking a country by hand is a statement of fact and outranks the dates of a
        // trip that happens to go there later (#1048).
        existing.status = 'visited';
      } else {
        countries.push({
          code: mc.country_code,
          placeCount: 0,
          tripCount: 0,
          firstVisit: null,
          lastVisit: null,
          status: 'visited',
        });
      }
    }

    // Merge countries reached only by a transport booking. Those store geocoded from/to
    // coordinates in reservation_endpoints but create no place row, so they never show up
    // via resolvePlaceCountries above and would otherwise be missed (#1366).
    // Only 'from'/'to' legs count as actually reached — a 'stop' is an intermediate
    // connection/layover (e.g. a plane change) the traveler never really visited.
    const endpointRows = this.db
      .prepare(
        `
    SELECT DISTINCT e.id, e.reservation_id, r.trip_id, e.role, e.code, e.lat, e.lng, e.local_date, e.local_time,
           r.type AS reservation_type, r.status AS reservation_status,
           CASE e.role
             WHEN 'to' THEN COALESCE(r.reservation_end_time, r.reservation_time)
             ELSE COALESCE(r.reservation_time, r.reservation_end_time)
           END AS fallback_time
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    WHERE r.trip_id IN (${tripIds.map(() => '?').join(',')}) AND e.role IN ('from', 'to')
      AND ${AtlasService.TRAVELER_OWNS}
  `,
      )
      .all(...tripIds, userId) as EndpointRow[];

    // A layover the traveler never left is only marked 'stop' while both its legs sit in
    // one booking. Split over two bookings it is a plain 'to' plus 'from' at the same
    // airport, so it has to be recognised from the times instead (#1535). Only flights
    // pair: a rental car picked up where a flight landed has its own from/to there and
    // must keep contributing its country (#1366).
    const transfers = transferEndpointIds(
      endpointRows.filter((e) => e.reservation_type === 'flight' && e.reservation_status !== 'cancelled'),
    );
    const endpoints = endpointRows.filter((e) => !transfers.has(e.id));

    // Collapse to one entry per coordinate before resolving countries —
    // getCountryFromCoords is a point-in-polygon scan and used to run once per point.
    const endpointStatus = new Map<string, { lat: number; lng: number; status: VisitStatus }>();
    for (const e of endpoints) {
      const status = tripStatus.get(e.trip_id) ?? 'idea';
      const key = `${e.lat},${e.lng}`;
      const seen = endpointStatus.get(key);
      if (seen) seen.status = strongerVisitStatus(seen.status, status);
      else endpointStatus.set(key, { lat: e.lat, lng: e.lng, status });
    }
    for (const e of endpointStatus.values()) {
      const code = getCountryFromCoords(e.lat, e.lng);
      if (!code || hidden.has(code)) continue;
      const existing = countries.find((c) => c.code === code);
      if (existing) existing.status = strongerVisitStatus(existing.status, e.status);
      else
        countries.push({ code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null, status: e.status });
    }

    // Everything below counts actual visits only. countries[] still carries planned and
    // dateless entries so the client can draw them once the user asks for them (#1048).
    const visited = countries.filter((c) => c.status === 'visited');
    const planned = countries.filter((c) => c.status === 'planned');

    const mostVisited =
      visited.length > 0 ? visited.reduce((a, b) => (a.placeCount > b.placeCount ? a : b), visited[0]) : null;

    const continents: Record<string, number> = {};
    visited.forEach((c) => {
      const cont = CONTINENT_MAP[c.code] || 'Other';
      continents[cont] = (continents[cont] || 0) + 1;
    });

    const continentsPlanned: Record<string, number> = {};
    planned.forEach((c) => {
      const cont = CONTINENT_MAP[c.code] || 'Other';
      continentsPlanned[cont] = (continentsPlanned[cont] || 0) + 1;
    });

    const pastTrips = trips
      .filter((t) => t.end_date && t.end_date <= now)
      .sort((a, b) => b.end_date!.localeCompare(a.end_date!));
    const lastTrip: {
      id: number;
      title: string;
      start_date?: string | null;
      end_date?: string | null;
      countryCode?: string;
    } | null = pastTrips[0]
      ? {
          id: pastTrips[0].id,
          title: pastTrips[0].title,
          start_date: pastTrips[0].start_date,
          end_date: pastTrips[0].end_date,
        }
      : null;
    if (lastTrip) {
      const lastTripPlaces = places.filter((p) => p.trip_id === lastTrip.id);
      for (const p of lastTripPlaces) {
        const code = resolveCountryCodeSync(p);
        if (code) {
          lastTrip.countryCode = code;
          break;
        }
      }
    }

    const futureTrips = trips
      .filter((t) => t.start_date && t.start_date > now)
      .sort((a, b) => a.start_date!.localeCompare(b.start_date!));
    const nextTrip: { id: number; title: string; start_date?: string | null; daysUntil?: number } | null = futureTrips[0]
      ? { id: futureTrips[0].id, title: futureTrips[0].title, start_date: futureTrips[0].start_date }
      : null;
    if (nextTrip) {
      const diff = Math.ceil((new Date(nextTrip.start_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      nextTrip.daysUntil = Math.max(0, diff);
    }

    const tripYears = new Set(trips.filter((t) => t.start_date).map((t) => Number.parseInt(t.start_date!.split('-')[0])));
    let streak = 0;
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2000; y--) {
      if (tripYears.has(y)) streak++;
      else break;
    }
    const firstYear = tripYears.size > 0 ? Math.min(...tripYears) : null;

    return {
      countries,
      stats: {
        totalTrips: trips.length,
        totalPlaces: places.length,
        totalCountries: visited.length,
        totalCountriesPlanned: planned.length,
        totalCountriesIdea: countries.length - visited.length - planned.length,
        totalDays,
        totalCities,
      },
      mostVisited,
      continents,
      continentsPlanned,
      lastTrip,
      nextTrip,
      streak,
      firstYear,
      tripsThisYear: trips.filter((t) => t.start_date && t.start_date.startsWith(String(currentYear))).length,
    };
  }

  // ── Country places ────────────────────────────────────────────────────────

  countryPlaces(userId: number, code: string) {
    const trips = this.getUserTrips(userId);
    const tripIds = trips.map((t) => t.id);
    if (tripIds.length === 0) {
      // Post-fold quirk fix: the legacy early return hardcoded manually_marked
      // false, so a trip-less user's manually marked country read as unmarked.
      const marked = !!this.db
        .prepare('SELECT 1 FROM visited_countries WHERE user_id = ? AND country_code = ?')
        .get(userId, code);
      return { places: [], trips: [], manually_marked: marked, status: marked ? 'visited' : 'idea' };
    }

    const places = this.getPlacesForTrips(tripIds);

    const matchingPlaces: {
      id: number;
      name: string;
      address: string | null;
      lat: number | null;
      lng: number | null;
      trip_id: number;
    }[] = [];
    const matchingTripIds = new Set<number>();

    for (const place of places) {
      const pCode = resolveCountryCodeSync(place);
      if (pCode === code) {
        matchingPlaces.push({
          id: place.id,
          name: place.name,
          address: place.address ?? null,
          lat: place.lat ?? null,
          lng: place.lng ?? null,
          trip_id: place.trip_id,
        });
        matchingTripIds.add(place.trip_id);
      }
    }

    const matchingTrips = trips
      .filter((t) => matchingTripIds.has(t.id))
      .map((t) => ({ id: t.id, title: t.title, start_date: t.start_date, end_date: t.end_date }));

    const isManuallyMarked = !!this.db
      .prepare('SELECT 1 FROM visited_countries WHERE user_id = ? AND country_code = ?')
      .get(userId, code);

    // Take the status from the same trip classification stats() uses rather than deriving
    // it again here — the detail sheet and the map must agree on what this country is.
    const tripStatus = this.tripStatusMap(trips, todayUtc());
    let status: VisitStatus = 'idea';
    for (const id of matchingTripIds) status = strongerVisitStatus(status, tripStatus.get(id) ?? 'idea');
    if (isManuallyMarked) status = 'visited';

    return { places: matchingPlaces, trips: matchingTrips, manually_marked: isManuallyMarked, status };
  }

  // ── Mark / unmark country ─────────────────────────────────────────────────

  listVisitedCountries(userId: number): { country_code: string; created_at: string }[] {
    return this.db
      .prepare('SELECT country_code, created_at FROM visited_countries WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as { country_code: string; created_at: string }[];
  }

  /** Countries the user explicitly removed, which stats() must not re-derive (#1490). */
  getHiddenCountries(userId: number): Set<string> {
    const rows = this.db.prepare('SELECT country_code FROM hidden_countries WHERE user_id = ?').all(userId) as {
      country_code: string;
    }[];
    return new Set(rows.map((r) => r.country_code));
  }

  markCountry(userId: number, code: string): void {
    this.db.transaction(() => {
      this.db.prepare('INSERT OR IGNORE INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(userId, code);
      // Marking it visited again lifts a previous removal.
      this.db.prepare('DELETE FROM hidden_countries WHERE user_id = ? AND country_code = ?').run(userId, code);
    });
  }

  unmarkCountry(userId: number, code: string): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM visited_countries WHERE user_id = ? AND country_code = ?').run(userId, code);
      this.db.prepare('DELETE FROM visited_regions WHERE user_id = ? AND country_code = ?').run(userId, code);
      // A country derived from a place or a transport endpoint has no visited_countries row,
      // so the deletes above are no-ops and stats() would re-derive it on the next request.
      // Tombstone it so the removal actually sticks (#1490).
      this.db.prepare('INSERT OR IGNORE INTO hidden_countries (user_id, country_code) VALUES (?, ?)').run(userId, code);
    });
  }

  // ── Mark / unmark region ──────────────────────────────────────────────────

  listManuallyVisitedRegions(userId: number): { region_code: string; region_name: string; country_code: string }[] {
    return this.db
      .prepare(
        'SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY created_at DESC',
      )
      .all(userId) as { region_code: string; region_name: string; country_code: string }[];
  }

  /** Regions the user explicitly removed, which visitedRegions() must not re-derive. */
  getHiddenRegions(userId: number): Set<string> {
    const rows = this.db.prepare('SELECT region_code FROM hidden_regions WHERE user_id = ?').all(userId) as {
      region_code: string;
    }[];
    return new Set(rows.map((r) => r.region_code));
  }

  markRegion(userId: number, code: string, name: string, countryCode: string): void {
    this.db.transaction(() => {
      this.db
        .prepare(
          'INSERT OR IGNORE INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)',
        )
        .run(userId, code, name, countryCode);
      // Re-marking lifts a previous removal of the region itself...
      this.db.prepare('DELETE FROM hidden_regions WHERE user_id = ? AND region_code = ?').run(userId, code);
      // ...and of the parent country, which the "last region removed" cascade in
      // unmarkRegion below may have hidden — otherwise marking a region visited again
      // would leave its country invisible.
      this.db
        .prepare('INSERT OR IGNORE INTO visited_countries (user_id, country_code) VALUES (?, ?)')
        .run(userId, countryCode);
      this.db.prepare('DELETE FROM hidden_countries WHERE user_id = ? AND country_code = ?').run(userId, countryCode);
    });
  }

  // True when the given country still has at least one region that would show as visited —
  // derived from place_regions or manually marked — after excluding the given user's hidden
  // regions. Used to decide whether removing a region should cascade into hiding the country.
  private hasVisibleRegionForCountry(userId: number, countryCode: string, hidden: Set<string>): boolean {
    const tripIds = this.getUserTrips(userId).map((t) => t.id);
    const placeIds = this.getPlacesForTrips(tripIds)
      .filter((p) => p.lat && p.lng)
      .map((p) => p.id);
    const placeRegionCodes =
      placeIds.length > 0
        ? (
            this.db
              .prepare(
                `SELECT DISTINCT region_code FROM place_regions WHERE country_code = ? AND place_id IN (${placeIds.map(() => '?').join(',')})`,
              )
              .all(countryCode, ...placeIds) as { region_code: string }[]
          ).map((r) => r.region_code)
        : [];
    const manualRegionCodes = (
      this.db
        .prepare('SELECT region_code FROM visited_regions WHERE user_id = ? AND country_code = ?')
        .all(userId, countryCode) as { region_code: string }[]
    ).map((r) => r.region_code);
    return [...placeRegionCodes, ...manualRegionCodes].some((code) => !hidden.has(code));
  }

  unmarkRegion(userId: number, code: string): void {
    // One transaction across the delete, the tombstone and the country cascade —
    // better-sqlite3 turns the nested unmarkCountry() transaction into a savepoint.
    this.db.transaction(() => {
      const region = this.db
        .prepare('SELECT country_code FROM visited_regions WHERE user_id = ? AND region_code = ?')
        .get(userId, code) as { country_code: string } | undefined;
      const countryCode = region?.country_code || countryCodeFromRegionCode(code);

      this.db.prepare('DELETE FROM visited_regions WHERE user_id = ? AND region_code = ?').run(userId, code);

      // Tombstone unconditionally, not just for a manually-marked region — a region derived
      // from real place data (the common case) needs to be dismissable too, mirroring
      // unmarkCountry's tombstone for a place-derived country (#1490).
      if (countryCode) {
        this.db
          .prepare('INSERT OR IGNORE INTO hidden_regions (user_id, region_code, country_code) VALUES (?, ?, ?)')
          .run(userId, code, countryCode);

        // If that was the country's last visible region, hide the country too — otherwise it
        // keeps showing "visited" on the world map with nothing left to drill into.
        const hidden = this.getHiddenRegions(userId);
        if (!this.hasVisibleRegionForCountry(userId, countryCode, hidden)) {
          this.unmarkCountry(userId, countryCode);
        }
      }
    });
  }

  // ── Visited regions ───────────────────────────────────────────────────────

  async visitedRegions(userId: number): Promise<{
    regions: Record<
      string,
      { code: string; name: string; placeCount: number; status: VisitStatus; manuallyMarked?: boolean }[]
    >;
  }> {
    const trips = this.getUserTrips(userId);
    const tripIds = trips.map((t) => t.id);
    const places = this.getPlacesForTrips(tripIds);

    // Regions carry the same status as their country, otherwise zooming into a merely
    // planned country would reveal regions painted as visited (#1048).
    const tripStatus = this.tripStatusMap(trips, todayUtc());
    const placeTrip = new Map(places.map((p) => [p.id, p.trip_id]));

    // Check DB cache first
    const placeIds = places.filter((p) => p.lat && p.lng).map((p) => p.id);
    const cached =
      placeIds.length > 0
        ? (this.db
            .prepare(`SELECT * FROM place_regions WHERE place_id IN (${placeIds.map(() => '?').join(',')})`)
            .all(...placeIds) as { place_id: number; country_code: string; region_code: string; region_name: string }[])
        : [];
    const cachedMap = new Map(cached.map((c) => [c.place_id, c]));

    // Kick off background geocoding for uncached places; return cached data immediately.
    const uncached = places.filter((p) => p.lat && p.lng && !cachedMap.has(p.id) && !geocodingInFlight.has(p.id));
    if (uncached.length > 0) {
      const insertStmt = this.db.prepare(
        'INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)',
      );
      for (const p of uncached) geocodingInFlight.add(p.id);
      void (async () => {
        try {
          for (const place of uncached) {
            try {
              const info = await reverseGeocodeRegion(place.lat!, place.lng!, place.address);
              if (info) insertStmt.run(place.id, info.country_code, info.region_code, info.region_name);
            } catch {
              // individual failure — continue with remaining places
            } finally {
              geocodingInFlight.delete(place.id);
            }
          }
        } catch {
          for (const p of uncached) geocodingInFlight.delete(p.id);
        }
      })();
    }

    // Group by country → regions with place counts
    const regionMap: Record<
      string,
      Map<string, { code: string; name: string; placeCount: number; status: VisitStatus }>
    > = {};
    for (const [placeId, entry] of cachedMap) {
      const tripId = placeTrip.get(placeId);
      const status = (tripId !== undefined ? tripStatus.get(tripId) : undefined) ?? 'idea';
      if (!regionMap[entry.country_code]) regionMap[entry.country_code] = new Map();
      const existing = regionMap[entry.country_code].get(entry.region_code);
      if (existing) {
        existing.placeCount++;
        existing.status = strongerVisitStatus(existing.status, status);
      } else {
        regionMap[entry.country_code].set(entry.region_code, {
          code: entry.region_code,
          name: entry.region_name,
          placeCount: 1,
          status,
        });
      }
    }

    const result: Record<
      string,
      { code: string; name: string; placeCount: number; status: VisitStatus; manuallyMarked?: boolean }[]
    > = {};
    for (const [country, regions] of Object.entries(regionMap)) {
      result[country] = [...regions.values()];
    }

    // Merge manually marked regions
    const manualRegions = this.listManuallyVisitedRegions(userId);
    for (const r of manualRegions) {
      if (!result[r.country_code]) result[r.country_code] = [];
      const existing = result[r.country_code].find((x) => x.code === r.region_code);
      if (existing) {
        existing.status = 'visited';
      } else {
        result[r.country_code].push({
          code: r.region_code,
          name: r.region_name,
          placeCount: 0,
          status: 'visited',
          manuallyMarked: true,
        });
      }
    }

    // Suppress regions the user explicitly removed, same as stats() does for countries
    // via getHiddenCountries (#1490) — otherwise a region derived fresh from place_regions
    // (or a manual mark) on every request could never actually be dismissed.
    const hidden = this.getHiddenRegions(userId);
    if (hidden.size > 0) {
      for (const country of Object.keys(result)) {
        result[country] = result[country].filter((r) => !hidden.has(r.code));
        if (result[country].length === 0) delete result[country];
      }
    }

    return { regions: result };
  }

  // ── Region GeoJSON / country geometry (delegates to the atlas-geo module) ──

  /**
   * Resolve a coordinate to the country and admin1 region the map draws (#1115), so
   * searching for a city can highlight the region it sits in without the user knowing
   * which one that is. Reads the same bundled polygons as the visited-region colouring,
   * so the answer is always a feature the client can highlight. A country with no admin1
   * coverage in the bundle resolves to a country and a null region, which is a real
   * answer rather than a failure: zooming to the country is still what the user wanted.
   */
  async locate(lat: number, lng: number): Promise<AtlasLocateResponse> {
    const countryCode = getCountryFromCoords(lat, lng);
    if (!countryCode) return { country_code: null, region_code: null, region_name: null };

    const region = await getRegionFromCoords(countryCode, lat, lng);
    return {
      country_code: countryCode.toUpperCase(),
      region_code: region?.region_code ?? null,
      region_name: region?.region_name ?? null,
    };
  }

  regionGeo(countries: string[]) {
    return getRegionGeo(countries);
  }

  countryGeoGz(): Buffer | null {
    return getCountryGeoGz();
  }

  // ── Bucket list CRUD ──────────────────────────────────────────────────────

  bucketList(userId: number) {
    return this.db.prepare('SELECT * FROM bucket_list WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  /**
   * What makes two bucket-list rows the same wish (#1898): the same user, the
   * same name (trimmed, case-insensitive) and the same country, target date and
   * coordinates. The coordinates are part of it so two genuinely different
   * places that share a name ("Altstadt") can sit side by side, and the target
   * date is part of it because one entry per planned date is exactly what the
   * report asks for. `IS` compares NULLs as equal, so "no coordinates" matches
   * "no coordinates" instead of the NULL-is-never-equal SQLite default.
   * `lower()` is ASCII-only in SQLite, which is what the client mirrors.
   */
  private findDuplicateBucketItem(userId: number, key: BucketIdentity, excludeId?: number): { id: number } | undefined {
    return this.db
      .prepare(
        `SELECT id FROM bucket_list
     WHERE user_id = ?
       AND lower(trim(name)) = lower(trim(?))
       AND country_code IS ?
       AND target_date IS ?
       AND lat IS ?
       AND lng IS ?
       AND id IS NOT ?
     LIMIT 1`,
      )
      .get(userId, key.name, key.country_code, key.target_date, key.lat, key.lng, excludeId ?? null) as
      | { id: number }
      | undefined;
  }

  createBucketItem(userId: number, data: CreateBucketData) {
    const identity: BucketIdentity = {
      name: data.name.trim(),
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      country_code: blankToNull(data.country_code),
      target_date: blankToNull(data.target_date),
    };
    // #1898: the same wish must not stack up. A different target date (or a
    // different place under the same name) is a different wish and still lands.
    if (this.findDuplicateBucketItem(userId, identity)) throw new BucketItemExistsError();
    const result = this.db
      .prepare(
        'INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        userId,
        identity.name,
        identity.lat,
        identity.lng,
        identity.country_code,
        data.notes ?? null,
        identity.target_date,
      );
    return this.db.prepare('SELECT * FROM bucket_list WHERE id = ?').get(result.lastInsertRowid);
  }

  updateBucketItem(userId: number, itemId: string | number, data: UpdateBucketData) {
    const item = this.db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId) as
      | (BucketIdentity & { id: number })
      | undefined;
    if (!item) return null;
    // #1898: an edit must not land on top of another wish either — same guard as
    // create, over the values the row will have once the UPDATE below ran. The
    // row itself is excluded, so re-saving it unchanged stays a no-op.
    const next: BucketIdentity = {
      name: data.name?.trim() || item.name,
      lat: data.lat !== undefined ? (data.lat ?? null) : item.lat,
      lng: data.lng !== undefined ? (data.lng ?? null) : item.lng,
      country_code: data.country_code !== undefined ? blankToNull(data.country_code) : blankToNull(item.country_code),
      target_date: data.target_date !== undefined ? blankToNull(data.target_date) : blankToNull(item.target_date),
    };
    if (this.findDuplicateBucketItem(userId, next, item.id)) throw new BucketItemExistsError();
    // Post-fold quirk fixes: the value bindings use `?? null` (the legacy
    // `|| null` wrote NULL for lat/lng 0 and empty-string notes), and the
    // UPDATE + re-select are user-scoped (defense-in-depth; the ownership
    // SELECT above stays the primary gate). The whitespace-only name no-op
    // (`?.trim() || null` + COALESCE) is deliberate and preserved.
    this.db
      .prepare(
        `UPDATE bucket_list SET
    name = COALESCE(?, name),
    notes = CASE WHEN ? THEN ? ELSE notes END,
    lat = CASE WHEN ? THEN ? ELSE lat END,
    lng = CASE WHEN ? THEN ? ELSE lng END,
    country_code = CASE WHEN ? THEN ? ELSE country_code END,
    target_date = CASE WHEN ? THEN ? ELSE target_date END
    WHERE id = ? AND user_id = ?`,
      )
      .run(
        data.name?.trim() || null,
        data.notes !== undefined ? 1 : 0,
        data.notes !== undefined ? (data.notes ?? null) : null,
        data.lat !== undefined ? 1 : 0,
        data.lat !== undefined ? (data.lat ?? null) : null,
        data.lng !== undefined ? 1 : 0,
        data.lng !== undefined ? (data.lng ?? null) : null,
        data.country_code !== undefined ? 1 : 0,
        data.country_code !== undefined ? next.country_code : null,
        data.target_date !== undefined ? 1 : 0,
        data.target_date !== undefined ? next.target_date : null,
        itemId,
        userId,
      );
    return this.db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
  }

  deleteBucketItem(userId: number, itemId: string | number): boolean {
    const item = this.db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
    if (!item) return false;
    // Post-fold quirk fix: user-scoped DELETE (defense-in-depth, see updateBucketItem).
    this.db.prepare('DELETE FROM bucket_list WHERE id = ? AND user_id = ?').run(itemId, userId);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Travel stats
  //
  // Moved here from AuthService, which owned it only for historical reasons. It
  // reads places/trips/visited_countries/place_regions and subtracts the same
  // hidden countries the Atlas map hides, so every one of its data sources is
  // already an Atlas concern. The move is what lets AuthModule drop its
  // AtlasModule import: that edge was the reason atlas.mcp.ts had to reach
  // AuthService through auth.bridge instead of injecting it.
  //
  // The route keeps its path (GET /api/auth/travel-stats) and is served by
  // travel-stats.controller.ts in this directory.
  // ---------------------------------------------------------------------------

  /**
   * The trip the user most recently took, with the countries it touched.
   *
   * Started, not created: a trip booked for next spring is not what anybody means
   * by their last trip, so the same `<= date('now')` cut the visited-country query
   * below uses applies here. All-future trips give null rather than a trip nobody
   * has been on yet.
   *
   * Ordered by end date with the start date as fallback, and the id as a
   * tie-break — two trips ending the same day is ordinary (a weekend away either
   * side of a work trip), and without the second key which one is "last" would be
   * whatever the storage engine happened to return first.
   *
   * Countries come from `place_regions`, Atlas's own cache, most-visited first.
   * No fallback to `getCountryFromCoords` here on purpose: this answers a
   * dashboard widget, and a point-in-polygon scan over 4MB of boundaries is too
   * much to spend on a label. An unresolved trip reports an empty list, which the
   * caller renders as "no country" rather than as a wrong one.
   */
  lastTrip(userId: number): { title: string; start_date: string | null; end_date: string | null; countries: string[] } | null {
    const trip = this.db.get<{ id: number; title: string; start_date: string | null; end_date: string | null }>(`
    SELECT t.id, t.title, t.start_date, t.end_date
    FROM trips t
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?)
      AND COALESCE(t.start_date, t.end_date) IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) <= date('now')
    ORDER BY COALESCE(t.end_date, t.start_date) DESC, t.id DESC
    LIMIT 1
  `, userId, userId);
    if (!trip) return null;

    const rows = this.db.all<{ country_code: string; places: number }>(`
    SELECT pr.country_code, COUNT(DISTINCT p.id) AS places
    FROM place_regions pr
    JOIN places p ON p.id = pr.place_id
    WHERE p.trip_id = ? AND pr.country_code IS NOT NULL
    GROUP BY pr.country_code
    ORDER BY places DESC, pr.country_code ASC
  `, trip.id);

    return {
      title: trip.title,
      start_date: trip.start_date,
      end_date: trip.end_date,
      countries: rows.map(r => r.country_code.toUpperCase()),
    };
  }

  getTravelStats(userId: number) {
    // The resolved region rides along so cityFromAddress can tell the city apart from
    // the region sitting right above it in the same address (#1115).
    const places = this.db.all<{ address: string | null; lat: number | null; lng: number | null; region_name: string | null }>(`
    SELECT DISTINCT p.address, p.lat, p.lng, pr.region_name
    FROM places p
    JOIN trips t ON p.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    LEFT JOIN place_regions pr ON pr.place_id = p.id
    WHERE t.user_id = ? OR tm.user_id = ?
  `, userId, userId);

    // Archived trips still count here, matching the places, countries and flight
    // distance widgets (which never filtered on is_archived) so the dashboard stats
    // stay consistent — archiving a trip no longer zeroes out trips/days.
    const tripStats = this.db.get<{ trips: number; days: number }>(`
    SELECT COUNT(DISTINCT t.id) as trips,
           COUNT(DISTINCT d.id) as days
    FROM trips t
    LEFT JOIN days d ON d.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?)
  `, userId, userId);

    const cities = new Set<string>();
    const coords: { lat: number; lng: number }[] = [];

    places.forEach(p => {
      // Explicit null checks: lat/lng of exactly 0 (equator / prime meridian)
      // are valid coordinates the former falsy check silently dropped.
      if (p.lat != null && p.lng != null) coords.push({ lat: p.lat, lng: p.lng });
      const cityPart = cityFromAddress(p.address, part => KNOWN_COUNTRIES.has(part), p.region_name);
      if (cityPart) cities.add(cityPart);
    });

    // Visited countries \u2014 same source the Atlas page uses: ISO-2 codes from
    // auto-resolved place regions plus countries the user marked manually.
    const countryCodes = new Set<string>();
    const manualCountries = this.db.all<{ country_code: string }>(
      'SELECT country_code FROM visited_countries WHERE user_id = ?',
      userId
    );
    manualCountries.forEach(m => { if (m.country_code) countryCodes.add(m.country_code.toUpperCase()); });

    // Only trips that have already started count as visited — a country you have merely
    // booked a trip to isn't stamped in the passport yet, and one you jotted down without
    // any dates even less so (#1048). date('now') is UTC, matching tripVisitStatus.
    const placeRegionCodes = this.db.all<{ country_code: string }>(`
    SELECT DISTINCT pr.country_code
    FROM place_regions pr
    JOIN places p ON p.id = pr.place_id
    JOIN trips t ON p.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?) AND pr.country_code IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) <= date('now')
  `, userId, userId);
    placeRegionCodes.forEach(r => { if (r.country_code) countryCodes.add(r.country_code.toUpperCase()); });

    // Transport bookings don't create a place row, so their geocoded endpoints never
    // reached place_regions — a country reached only by a flight/train (no lodging or
    // planned place there) was never counted as visited (#1366). Resolve each endpoint
    // coordinate to a country and fold it in too.
    // Only 'from'/'to' legs count as actually reached — a 'stop' is an intermediate
    // connection/layover (e.g. a plane change) the traveler never really visited (#1486),
    // and the same layover split over two bookings is recognised from its ground time
    // instead, because there it is stored as a legitimate 'to'/'from' pair (#1535).
    const endpointRows = this.db.all<EndpointRow>(`
    SELECT DISTINCT e.id, e.reservation_id, r.trip_id, e.role, e.code, e.lat, e.lng, e.local_date, e.local_time,
           r.type AS reservation_type, r.status AS reservation_status,
           CASE e.role
             WHEN 'to' THEN COALESCE(r.reservation_end_time, r.reservation_time)
             ELSE COALESCE(r.reservation_time, r.reservation_end_time)
           END AS fallback_time
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    JOIN trips t ON r.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?) AND e.role IN ('from', 'to')
      AND COALESCE(t.start_date, t.end_date) IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) <= date('now')
      AND ${AtlasService.TRAVELER_OWNS}
  `, userId, userId, userId);
    const transfers = transferEndpointIds(
      endpointRows.filter(e => e.reservation_type === 'flight' && e.reservation_status !== 'cancelled')
    );
    // The DISTINCT no longer collapses per coordinate now that the endpoint id has to be
    // in the projection, so collapse here instead: getCountryFromCoords is a
    // point-in-polygon scan and must stay at one run per coordinate.
    const endpointCoords = new Map<string, { lat: number; lng: number }>();
    for (const e of endpointRows) {
      if (transfers.has(e.id)) continue;
      endpointCoords.set(`${e.lat},${e.lng}`, { lat: e.lat, lng: e.lng });
    }
    for (const e of endpointCoords.values()) {
      const code = getCountryFromCoords(e.lat, e.lng);
      if (code) countryCodes.add(code.toUpperCase());
    }

    // Countries the user removed in Atlas stay removed on the dashboard too, so the
    // passport card and the Atlas map agree (#1490).
    for (const code of this.getHiddenCountries(userId)) countryCodes.delete(code.toUpperCase());

    return {
      countries: [...countryCodes],
      cities: [...cities],
      coords,
      totalTrips: tripStats?.trips || 0,
      totalDays: tripStats?.days || 0,
      totalPlaces: places.length,
      totalDistanceKm: this.flightDistanceKm(userId),
    };
  }

  /**
   * Total flight distance a user has covered, summed across every non-cancelled
   * flight reservation in their trips. Each flight stores its waypoints in
   * reservation_endpoints (from → stops → to, ordered by sequence); the legs
   * between consecutive points are added up so multi-stop flights count
   * correctly.
   */
  /**
   * Whether a reservation counts toward one person's own travel figures.
   *
   * It does when they are named on it (#1517 assigns members and guests to
   * bookings), and it does when nobody is named at all — an unassigned booking
   * still belongs to the whole trip, which is what every reservation made
   * before 4.0 looks like.
   *
   * That second half is what keeps this from being a breaking change: the
   * assignment table is empty on any install upgrading from 3.4.1, and a plain
   * join would have taken those users' flown distance to zero overnight. With
   * no assignments anywhere the result is identical to before (#1966).
   *
   * Binds ONE parameter, the user id, and expects the reservation aliased `r`.
   */
  private static readonly TRAVELER_OWNS = `
    (NOT EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id)
     OR EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id AND rt.user_id = ?))`;

  private flightDistanceKm(userId: number): number {
    const rows = this.db.all<{ reservation_id: number; lat: number; lng: number }>(`
      SELECT re.reservation_id, re.lat, re.lng
      FROM reservation_endpoints re
      JOIN reservations r ON r.id = re.reservation_id
      JOIN trips t ON t.id = r.trip_id
      LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = ?
      WHERE (t.user_id = ? OR tm.user_id IS NOT NULL)
        AND r.type = 'flight'
        AND r.status != 'cancelled'
        AND ${AtlasService.TRAVELER_OWNS}
      ORDER BY re.reservation_id, re.sequence
    `, userId, userId, userId);

    let total = 0;
    let prev: { id: number; lat: number; lng: number } | null = null;
    for (const point of rows) {
      if (prev && prev.id === point.reservation_id) {
        total += haversineKm(prev.lat, prev.lng, point.lat, point.lng);
      }
      prev = { id: point.reservation_id, lat: point.lat, lng: point.lng };
    }
    return Math.round(total);
  }
}
