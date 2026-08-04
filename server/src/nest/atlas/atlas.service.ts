import { Injectable } from '@nestjs/common';
import { CONTINENT_MAP, strongerVisitStatus, todayUtc, tripVisitStatus, VisitStatus } from '@trek/shared';
import { Trip, Place } from '../../types';
import { DatabaseService } from '../database/database.service';
import {
  getCountryFromCoords,
  getCountryGeoGz,
  getRegionGeo,
  geocodingInFlight,
  resolveCountryCodeSync,
  reverseGeocodeRegion,
} from './atlas-geo';

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

// Bundled/geocoded region codes are always "<countryCode>-<rest>" (ISO 3166-2 format, and
// buildRegionInfo's synthesized fallback follows the same convention) — used to recover a
// region's country when there's no visited_regions row to read it from (a place-derived
// region was never inserted there).
function countryCodeFromRegionCode(regionCode: string): string {
  return (regionCode.split('-')[0] || '').toUpperCase();
}

/**
 * DI-native atlas domain service — the legacy services/atlasService SQL
 * (stats aggregation, visited countries/regions with the #1490 tombstones,
 * bucket-list CRUD) folded in verbatim over the injected DatabaseService.
 * The pure-geo machinery (bundled admin0/admin1 boundaries, point-in-polygon
 * indexes, Nominatim geocoding and its caches) lives in ./atlas-geo — a plain
 * module so the multi-MB caches stay process-global across the container
 * instance, the auth.bridge.ts instance, and test helpers (#1576).
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
        .sort();
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
    const endpoints = this.db
      .prepare(
        `
    SELECT DISTINCT r.trip_id, e.lat, e.lng
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    WHERE r.trip_id IN (${tripIds.map(() => '?').join(',')}) AND e.role IN ('from', 'to')
  `,
      )
      .all(...tripIds) as { trip_id: number; lat: number; lng: number }[];

    // Selecting trip_id makes the DISTINCT per trip, so the same airport comes back once
    // per booking. Collapse to one entry per coordinate before resolving countries —
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

    const mostVisited = visited.length > 0 ? visited.reduce((a, b) => (a.placeCount > b.placeCount ? a : b)) : null;

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

    const tripYears = new Set(trips.filter((t) => t.start_date).map((t) => parseInt(t.start_date!.split('-')[0])));
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

  createBucketItem(userId: number, data: CreateBucketData) {
    const result = this.db
      .prepare(
        'INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        userId,
        data.name.trim(),
        data.lat ?? null,
        data.lng ?? null,
        data.country_code ?? null,
        data.notes ?? null,
        data.target_date ?? null,
      );
    return this.db.prepare('SELECT * FROM bucket_list WHERE id = ?').get(result.lastInsertRowid);
  }

  updateBucketItem(userId: number, itemId: string | number, data: UpdateBucketData) {
    const item = this.db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
    if (!item) return null;
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
        data.country_code !== undefined ? (data.country_code ?? null) : null,
        data.target_date !== undefined ? 1 : 0,
        data.target_date !== undefined ? (data.target_date ?? null) : null,
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
}
