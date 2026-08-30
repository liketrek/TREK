import { Injectable } from '@nestjs/common';
import { avatarUrl } from '../common/avatarUrl';
import type { Journey, JourneyEntry, JourneyPhoto, JourneyContributor } from '../../types';
import { decodeEntryRow, type JourneyEntryWire } from './journey-entry-row';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { JourneyStats, JourneyTrack, TrekWsUserEventName } from '@trek/shared';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
import { getCountryFromCoords } from '../atlas/atlas-geo';
import { computeJourneyStats, type StatsInputPoint } from './journey-stats';

/**
 * English country names for whatever codes a journey turned up.
 *
 * `Intl.DisplayNames` rather than a bundled table or the admin-0 properties:
 * Node has the CLDR data already, the names it gives are the ones every other
 * piece of software shows, and parsing 30MB of boundary GeoJSON to read a
 * `NAME` field would be an absurd way to learn that IS is Iceland.
 *
 * English on purpose — the client re-resolves these into the reader's language
 * when it places the element, and a book needs the country's name in the
 * language the book is written in, not the language of whoever's server it is.
 */
function regionNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    // A Node built without full ICU has no region names. Codes are a poor
    // label but a working one, and a book page is not worth a 500 over.
    return null;
  }
}

function countryNamesFor(points: { country: string | null }[]): Record<string, string> {
  const out: Record<string, string> = {};
  const display = regionNames();
  for (const p of points) {
    if (!p.country) continue;
    const code = p.country.toUpperCase();
    if (out[code]) continue;
    out[code] = (display?.of(code) ?? code) || code;
  }
  return out;
}



// Per-journey gallery view: journey_photos → trek_photos (no entry context).
// Per-entry photo view: join journey_entry_photos → journey_photos (gallery) → trek_photos.
// id = gp.id (gallery photo id) — used by clients for linkPhoto/updatePhoto/unlink/delete.
const JP_SELECT = `
  gp.id, jep.entry_id, gp.photo_id, gp.caption, jep.sort_order, gp.shared, gp.created_at,
  tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
  tp.media_type, tp.duration_ms, tp.taken_at, tp.lat, tp.lng
`;

const JP_JOIN = `journey_entry_photos jep
  JOIN journey_photos gp ON gp.id  = jep.journey_photo_id
  JOIN trek_photos    tp ON tp.id  = gp.photo_id`;

const GALLERY_SELECT = `
  gp.id, gp.journey_id, gp.photo_id, gp.caption, gp.shared, gp.sort_order, gp.created_at,
  tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
  tp.media_type, tp.duration_ms, tp.taken_at, tp.lat, tp.lng
`;

const GALLERY_JOIN = 'journey_photos gp JOIN trek_photos tp ON tp.id = gp.photo_id';

/**
 * The journey (travel journal) domain: journeys, their trips, entries, the
 * photo gallery, contributors and the trip-skeleton reconciliation.
 *
 * Folded 1:1 from services/journeyService.ts - every SQL statement, error and
 * broadcast is the one that shipped.
 */
@Injectable()
export class JourneyDomainService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly photos: TrekPhotosRepository,
  ) {}

  private ts(): number {
    return Date.now();
  }



  /**
   * Tell everyone on a journey that something changed.
   *
   * Public because the book service needs the same audience — who can see a
   * journey is one question with one answer, and a second copy of this walk
   * over contributors and owner would be a second answer waiting to disagree.
   */
  broadcastJourneyEvent(
    journeyId: number,
    // Typed against the shared WS registry rather than left as `string`: the
    // legacy broadcastToUser took anything, so a typo'd event name shipped as a
    // silent no-op in the client's remoteEventHandler.
    event: TrekWsUserEventName,
    data: Record<string, unknown>,
    excludeSocketId?: string | number,
  ) {
    const contributors = this.db.prepare('SELECT user_id FROM journey_contributors WHERE journey_id = ?').all(journeyId) as {
      user_id: number;
    }[];
    const owner = this.db.prepare('SELECT user_id FROM journeys WHERE id = ?').get(journeyId) as
      | { user_id: number }
      | undefined;

    const userIds = new Set(contributors.map((c) => c.user_id));
    if (owner) userIds.add(owner.user_id);

    for (const uid of userIds) {
      this.realtime.broadcastToUser(uid, { type: event, journeyId, ...data }, excludeSocketId);
    }
  }

  // ── Access control ───────────────────────────────────────────────────────

  canAccessJourney(journeyId: number, userId: number): Journey | null {
    const own = this.db.prepare('SELECT * FROM journeys WHERE id = ? AND user_id = ?').get(journeyId, userId) as
      | Journey
      | undefined;
    if (own) return own;
    const contrib = this.db
      .prepare('SELECT 1 FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journeyId, userId);
    if (contrib) return (this.db.prepare('SELECT * FROM journeys WHERE id = ?').get(journeyId) as Journey) || null;
    return null;
  }

  isOwner(journeyId: number, userId: number): boolean {
    return !!this.db.prepare('SELECT 1 FROM journeys WHERE id = ? AND user_id = ?').get(journeyId, userId);
  }

  canEdit(journeyId: number, userId: number): boolean {
    if (this.isOwner(journeyId, userId)) return true;
    const c = this.db
      .prepare('SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journeyId, userId) as { role: string } | undefined;
    return c?.role === 'editor' || c?.role === 'owner';
  }

  // ── Journey CRUD ─────────────────────────────────────────────────────────

  listJourneys(userId: number) {
    return this.db
      .prepare(
        `
      SELECT DISTINCT j.*,
        (SELECT COUNT(*) FROM journey_entries je WHERE je.journey_id = j.id AND je.type != 'skeleton') as entry_count,
        (SELECT COUNT(*) FROM journey_photos jp WHERE jp.journey_id = j.id) as photo_count,
        (SELECT COUNT(DISTINCT je3.location_name) FROM journey_entries je3 WHERE je3.journey_id = j.id AND je3.location_name IS NOT NULL AND je3.location_name != '') as place_count,
        (SELECT MIN(t.start_date) FROM journey_trips jt JOIN trips t ON jt.trip_id = t.id WHERE jt.journey_id = j.id) as trip_date_min,
        (SELECT MAX(t.end_date) FROM journey_trips jt JOIN trips t ON jt.trip_id = t.id WHERE jt.journey_id = j.id) as trip_date_max
      FROM journeys j
      LEFT JOIN journey_contributors jc ON j.id = jc.journey_id AND jc.user_id = ?
      WHERE j.user_id = ? OR jc.user_id = ?
      ORDER BY j.updated_at DESC
    `,
      )
      .all(userId, userId, userId) as (Journey & {
      entry_count: number;
      photo_count: number;
      place_count: number;
      trip_date_min: string | null;
      trip_date_max: string | null;
    })[];
  }

  createJourney(
    userId: number,
    data: {
      title: string;
      subtitle?: string;
      trip_ids?: number[];
    },
  ): Journey {
    const now = this.ts();
    const res = this.db
      .prepare(
        `
      INSERT INTO journeys (user_id, title, subtitle, status, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?)
    `,
      )
      .run(userId, data.title, data.subtitle || null, now, now);

    const journeyId = Number(res.lastInsertRowid);

    // add owner as contributor
    this.db.prepare('INSERT INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, ?, ?)').run(
      journeyId,
      userId,
      'owner',
      now,
    );

    // link trips and sync skeleton entries
    if (data.trip_ids?.length) {
      // Track the first trip that was ACTUALLY linked (addTripToJourney access-checks and
      // returns false for a foreign/inaccessible trip). Inheriting the cover from a raw
      // trip_ids[0] would otherwise leak an arbitrary trip's cover image cross-tenant.
      let coverTripId: number | undefined;
      for (const tripId of data.trip_ids) {
        if (this.addTripToJourney(journeyId, tripId, userId) && coverTripId === undefined) coverTripId = tripId;
      }

      if (coverTripId !== undefined) {
        const firstTrip = this.db.prepare('SELECT cover_image FROM trips WHERE id = ?').get(coverTripId) as
          | { cover_image: string | null }
          | undefined;
        if (firstTrip?.cover_image) {
          // trip stores full path (/uploads/covers/x.jpg), journey stores relative (covers/x.jpg)
          const relativePath = firstTrip.cover_image.replace(/^\/uploads\//, '');
          this.db.prepare('UPDATE journeys SET cover_image = ? WHERE id = ?').run(relativePath, journeyId);
        }
      }
    }

    return this.db.prepare('SELECT * FROM journeys WHERE id = ?').get(journeyId) as Journey;
  }

  getJourneyFull(journeyId: number, userId: number) {
    const journey = this.canAccessJourney(journeyId, userId);
    if (!journey) return null;

    const entries = this.db
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? ORDER BY entry_date ASC, sort_order ASC, id ASC')
      .all(journeyId) as JourneyEntry[];

    const photos = this.db
      .prepare(
        `SELECT ${JP_SELECT} FROM ${JP_JOIN} WHERE jep.entry_id IN (SELECT id FROM journey_entries WHERE journey_id = ?) ORDER BY jep.sort_order ASC`,
      )
      .all(journeyId) as JourneyPhoto[];

    // group photos by entry
    const photosByEntry: Record<number, JourneyPhoto[]> = {};
    for (const p of photos) {
      (photosByEntry[p.entry_id] ||= []).push(p);
    }

    const gallery = this.db
      .prepare(
        `SELECT ${GALLERY_SELECT} FROM ${GALLERY_JOIN} WHERE gp.journey_id = ? ORDER BY gp.sort_order ASC, gp.id ASC`,
      )
      .all(journeyId);

    const enrichedEntries = entries.map((e) => ({
      ...decodeEntryRow(e),
      photos: photosByEntry[e.id] || [],
      source_trip_name: e.source_trip_id
        ? (this.db.prepare('SELECT title FROM trips WHERE id = ?').get(e.source_trip_id) as { title: string } | undefined)
            ?.title || null
        : null,
    }));

    // linked trips
    const trips = this.db
      .prepare(
        `
      SELECT jt.trip_id, jt.added_at, t.title, t.start_date, t.end_date, t.cover_image, t.currency,
        (SELECT COUNT(*) FROM places WHERE trip_id = t.id) as place_count
      FROM journey_trips jt JOIN trips t ON jt.trip_id = t.id
      WHERE jt.journey_id = ? ORDER BY t.start_date ASC
    `,
      )
      .all(journeyId);

    // contributors
    const contributorsRaw = this.db
      .prepare(
        `
      SELECT jc.journey_id, jc.user_id, jc.role, jc.added_at, u.username, u.avatar
      FROM journey_contributors jc JOIN users u ON jc.user_id = u.id
      WHERE jc.journey_id = ? ORDER BY jc.added_at
    `,
      )
      .all(journeyId) as any[];
    const contributors = contributorsRaw.map((c) => ({
      ...c,
      avatar_url: avatarUrl(c),
    }));

    // stats
    const entryCount = entries.filter((e) => e.type === 'entry').length;
    const photoCount = (gallery as any[]).length;
    const places = [...new Set(entries.map((e) => e.location_name).filter(Boolean))];

    const userPrefs = this.db
      .prepare('SELECT hide_skeletons FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journeyId, userId) as { hide_skeletons: number } | undefined;

    // Determine the viewer's role on this journey so the UI can gate edit/settings
    // actions. 'owner' = creator, 'editor' | 'viewer' = from journey_contributors.
    const journeyRow = journey as unknown as { user_id?: number };
    let myRole: 'owner' | 'editor' | 'viewer' | null;
    if (journeyRow.user_id === userId) {
      myRole = 'owner';
    } else {
      const contribRow = this.db
        .prepare('SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
        .get(journeyId, userId) as { role: 'editor' | 'viewer' } | undefined;
      myRole = contribRow?.role ?? null;
    }

    return {
      ...journey,
      entries: enrichedEntries,
      gallery,
      trips,
      contributors,
      stats: { entries: entryCount, photos: photoCount, places: places.length },
      hide_skeletons: !!userPrefs?.hide_skeletons,
      my_role: myRole,
    };
  }

  updateJourney(
    journeyId: number,
    userId: number,
    data: Partial<{
      title: string;
      subtitle: string;
      cover_gradient: string;
      cover_image: string;
      status: string;
    }>,
  ): Journey | null {
    // Journey-level settings (title, cover, status) are owner-only — editors
    // may only edit entries and photos, not reshape the journey itself.
    if (!this.isOwner(journeyId, userId)) return null;

    const ALLOWED_STATUSES = ['draft', 'active', 'completed', 'archived'];
    const allowed = ['title', 'subtitle', 'cover_gradient', 'cover_image', 'status'];
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && allowed.includes(key)) {
        if (key === 'status' && !ALLOWED_STATUSES.includes(val as string)) continue;
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return this.db.prepare('SELECT * FROM journeys WHERE id = ?').get(journeyId) as Journey;

    fields.push('updated_at = ?');
    values.push(this.ts());
    values.push(journeyId);
    this.db.prepare(`UPDATE journeys SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.db.prepare('SELECT * FROM journeys WHERE id = ?').get(journeyId) as Journey;
  }

  updateJourneyPreferences(journeyId: number, userId: number, data: { hide_skeletons?: boolean }) {
    if (!this.canAccessJourney(journeyId, userId)) return null;
    if (data.hide_skeletons !== undefined) {
      this.db.prepare('UPDATE journey_contributors SET hide_skeletons = ? WHERE journey_id = ? AND user_id = ?').run(
        data.hide_skeletons ? 1 : 0,
        journeyId,
        userId,
      );
    }
    const row = this.db
      .prepare('SELECT hide_skeletons FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journeyId, userId) as { hide_skeletons: number };
    return { hide_skeletons: !!row.hide_skeletons };
  }

  deleteJourney(journeyId: number, userId: number): boolean {
    if (!this.isOwner(journeyId, userId)) return false;
    this.db.prepare('DELETE FROM journeys WHERE id = ?').run(journeyId);
    return true;
  }

  // ── Trip management ──────────────────────────────────────────────────────

  addTripToJourney(journeyId: number, tripId: number, userId: number): boolean {
    // Only attach a trip the caller can actually access — otherwise a journey
    // owner could pull an arbitrary trip's places + photos into their journey
    // (cross-tenant leak). Mirrors the trip-access gate every other trip-scoped
    // path enforces.
    if (!this.db.canAccessTrip(tripId, userId)) return false;
    // And a journey the caller can actually reach. Without this, any logged-in user
    // could link a trip of theirs into a stranger's journey and seed entries and
    // photos there — the MCP tool has always checked this, the REST route never did.
    if (!this.canAccessJourney(journeyId, userId)) return false;
    const now = this.ts();
    try {
      this.db.prepare('INSERT OR IGNORE INTO journey_trips (journey_id, trip_id, added_at) VALUES (?, ?, ?)').run(
        journeyId,
        tripId,
        now,
      );
    } catch {
      return false;
    }

    // sync skeleton entries for all places in this trip
    this.syncTripPlaces(journeyId, tripId, userId);
    // Trip photos are deliberately NOT pulled in any more (#1614). Photos live in
    // journeys now: the trip-photo surface lost its UI in 3.1.0, nothing writes to
    // it on an install newer than that, and copying rows between the two was what
    // let a photo one member had chosen not to share reach a journey at all. The
    // table and its (unreferenced) routes stay for one more release rather than
    // being dropped in an append-only migration.
    this.broadcastJourneyEvent(journeyId, 'journey:trip:synced', { tripId });
    return true;
  }

  removeTripFromJourney(journeyId: number, tripId: number, userId: number): boolean {
    if (!this.isOwner(journeyId, userId)) return false;

    // remove skeleton entries that haven't been filled in
    this.db.prepare(
      `
      DELETE FROM journey_entries
      WHERE journey_id = ? AND source_trip_id = ? AND type = 'skeleton'
    `,
    ).run(journeyId, tripId);

    // detach filled entries from this trip
    this.db.prepare(
      `
      UPDATE journey_entries SET source_trip_id = NULL, source_place_id = NULL
      WHERE journey_id = ? AND source_trip_id = ? AND type != 'skeleton'
    `,
    ).run(journeyId, tripId);

    this.db.prepare('DELETE FROM journey_trips WHERE journey_id = ? AND trip_id = ?').run(journeyId, tripId);
    return true;
  }

  // ── Sync engine ──────────────────────────────────────────────────────────

  syncTripPlaces(journeyId: number, tripId: number, authorId: number) {
    const places = this.db
      .prepare(
        `
      SELECT p.*, da.day_id, d.date as day_date, da.assignment_time, da.assignment_end_time, d.day_number
      FROM places p
      INNER JOIN day_assignments da ON da.place_id = p.id
      INNER JOIN days d ON da.day_id = d.id
      WHERE p.trip_id = ?
      ORDER BY d.day_number ASC, da.order_index ASC
    `,
      )
      .all(tripId) as any[];

    const now = this.ts();
    const existing = this.db
      .prepare('SELECT source_place_id FROM journey_entries WHERE journey_id = ? AND source_trip_id = ?')
      .all(journeyId, tripId) as { source_place_id: number }[];
    const existingPlaceIds = new Set(existing.map((e) => e.source_place_id));

    // Track next sort_order per date so synced skeletons get unique, sequential positions.
    const dateMaxOrder = new Map<string, number>();
    const maxRows = this.db
      .prepare(
        'SELECT entry_date, COALESCE(MAX(sort_order), -1) AS m FROM journey_entries WHERE journey_id = ? GROUP BY entry_date',
      )
      .all(journeyId) as { entry_date: string; m: number }[];
    for (const row of maxRows) dateMaxOrder.set(row.entry_date, row.m);

    for (const place of places) {
      if (existingPlaceIds.has(place.id)) continue;
      existingPlaceIds.add(place.id);

      const entryDate = place.day_date || new Date().toISOString().split('T')[0];
      const entryTime = place.assignment_time || place.place_time || null;
      const nextOrder = (dateMaxOrder.get(entryDate) ?? -1) + 1;
      dateMaxOrder.set(entryDate, nextOrder);

      this.insertSkeletonEntry({
        journeyId,
        tripId,
        placeId: place.id,
        authorId,
        title: place.name,
        entryDate,
        entryTime,
        locationName: place.address || place.name,
        lat: place.lat || null,
        lng: place.lng || null,
        sortOrder: nextOrder,
        now,
      });
    }
  }

  // called when a trip place is created
  onPlaceCreated(tripId: number, placeId: number) {
    const links = this.db.prepare('SELECT journey_id FROM journey_trips WHERE trip_id = ?').all(tripId) as {
      journey_id: number;
    }[];
    if (!links.length) return;

    const place = this.db
      .prepare(
        `
      SELECT p.*, da.day_id, d.date as day_date, da.assignment_time, d.day_number
      FROM places p
      INNER JOIN day_assignments da ON da.place_id = p.id
      INNER JOIN days d ON da.day_id = d.id
      WHERE p.id = ?
    `,
      )
      .get(placeId) as any;
    if (!place) return; // not assigned to a day yet — skip

    const now = this.ts();
    for (const link of links) {
      const already = this.db
        .prepare('SELECT 1 FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
        .get(link.journey_id, placeId);
      if (already) continue;

      const journey = this.db.prepare('SELECT user_id FROM journeys WHERE id = ?').get(link.journey_id) as { user_id: number };
      const entryDate = place.day_date;
      const maxOrder = this.db
        .prepare('SELECT MAX(sort_order) AS m FROM journey_entries WHERE journey_id = ? AND entry_date = ?')
        .get(link.journey_id, entryDate) as { m: number | null };
      const nextOrder = (maxOrder?.m ?? -1) + 1;

      this.insertSkeletonEntry({
        journeyId: link.journey_id,
        tripId,
        placeId,
        authorId: journey.user_id,
        title: place.name,
        entryDate,
        entryTime: place.assignment_time || place.place_time || null,
        locationName: place.address || place.name,
        lat: place.lat || null,
        lng: place.lng || null,
        sortOrder: nextOrder,
        now,
      });
    }
  }

  // called when a trip place is updated
  onPlaceUpdated(placeId: number) {
    const entries = this.db.prepare('SELECT * FROM journey_entries WHERE source_place_id = ?').all(placeId) as JourneyEntry[];
    if (!entries.length) return;

    const place = this.db
      .prepare(
        `
      SELECT p.*, da.day_id, d.date as day_date, da.assignment_time, d.day_number
      FROM places p
      LEFT JOIN day_assignments da ON da.place_id = p.id
      LEFT JOIN days d ON da.day_id = d.id
      WHERE p.id = ?
    `,
      )
      .get(placeId) as any;
    if (!place) return;

    const now = this.ts();
    for (const entry of entries) {
      if (entry.type === 'skeleton') {
        // update everything on skeletons
        this.db.prepare(
          `
          UPDATE journey_entries SET title = ?, entry_date = ?, entry_time = ?, location_name = ?, location_lat = ?, location_lng = ?, updated_at = ?
          WHERE id = ?
        `,
        ).run(
          place.name,
          place.day_date || entry.entry_date,
          place.assignment_time || place.place_time || entry.entry_time,
          place.address || place.name,
          place.lat || null,
          place.lng || null,
          now,
          entry.id,
        );
      } else {
        // for filled entries, only update location silently
        this.db.prepare(
          `
          UPDATE journey_entries SET location_name = ?, location_lat = ?, location_lng = ?, updated_at = ?
          WHERE id = ?
        `,
        ).run(place.address || place.name, place.lat || null, place.lng || null, now, entry.id);
      }
    }
  }

  // called when a trip place is deleted
  onPlaceDeleted(placeId: number) {
    const entries = this.db.prepare('SELECT * FROM journey_entries WHERE source_place_id = ?').all(placeId) as JourneyEntry[];

    for (const entry of entries) {
      if (entry.type === 'skeleton') {
        // no content: just delete
        const hasPhotos = this.db.prepare('SELECT 1 FROM journey_entry_photos WHERE entry_id = ?').get(entry.id);
        if (!hasPhotos && !entry.story) {
          this.db.prepare('DELETE FROM journey_entries WHERE id = ?').run(entry.id);
          continue;
        }
      }
      // entry has content: keep it, detach, add note
      const note = '\n\n> _Note: the original trip place was removed from the trip plan_';
      const newStory = (entry.story || '') + note;
      this.db.prepare(
        'UPDATE journey_entries SET source_place_id = NULL, source_trip_id = NULL, type = ?, story = ?, updated_at = ? WHERE id = ?',
      ).run(entry.type === 'skeleton' ? 'entry' : entry.type, newStory, this.ts(), entry.id);
    }
  }

  // Shared skeleton INSERT, reused by syncTripPlaces / onPlaceCreated / reconcileTripSkeletons.
  private insertSkeletonEntry(p: {
    journeyId: number;
    tripId: number;
    placeId: number;
    authorId: number;
    title: string;
    entryDate: string;
    entryTime: string | null;
    locationName: string;
    lat: number | null;
    lng: number | null;
    sortOrder: number;
    now: number;
  }) {
    this.db.prepare(
      `
      INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, entry_date, entry_time, location_name, location_lat, location_lng, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'skeleton', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      p.journeyId,
      p.tripId,
      p.placeId,
      p.authorId,
      p.title,
      p.entryDate,
      p.entryTime,
      p.locationName,
      p.lat,
      p.lng,
      p.sortOrder,
      p.now,
      p.now,
    );
  }

  // Make every journey linked to `tripId` mirror the trip's currently day-assigned
  // places: add skeletons for newly-assigned places, refresh skeleton snapshots when a
  // place is moved to another day / its time changes, and drop skeletons for places no
  // longer assigned. Filled entries are never destroyed — only detached + annotated,
  // mirroring onPlaceDeleted. Idempotent: a second call with no underlying change is a
  // no-op (no writes, no broadcast). Called from every assignment mutation path.
  reconcileTripSkeletons(tripId: number, sid?: string | number) {
    const links = this.db.prepare('SELECT journey_id FROM journey_trips WHERE trip_id = ?').all(tripId) as {
      journey_id: number;
    }[];
    if (!links.length) return;

    const places = this.db
      .prepare(
        `
      SELECT p.*, da.day_id, d.date as day_date, da.assignment_time, d.day_number, da.order_index
      FROM places p
      INNER JOIN day_assignments da ON da.place_id = p.id
      INNER JOIN days d ON da.day_id = d.id
      WHERE p.trip_id = ?
      ORDER BY d.day_number ASC, da.order_index ASC
    `,
      )
      .all(tripId) as any[];

    // One skeleton per place (a place on multiple days keeps its first-by-day/order row),
    // matching the one-skeleton-per-place model used by onPlaceCreated.
    const placeById = new Map<number, any>();
    for (const place of places) if (!placeById.has(place.id)) placeById.set(place.id, place);
    const assignedPlaceIds = new Set(placeById.keys());

    const now = this.ts();
    for (const { journey_id } of links) {
      const journey = this.db.prepare('SELECT user_id FROM journeys WHERE id = ?').get(journey_id) as
        | { user_id: number }
        | undefined;
      if (!journey) continue;

      let changed = false;
      const existing = this.db
        .prepare(
          `SELECT id, source_place_id, type, story, title, entry_date, entry_time, location_name, location_lat, location_lng
           FROM journey_entries WHERE journey_id = ? AND source_trip_id = ?`,
        )
        .all(journey_id, tripId) as {
        id: number;
        source_place_id: number | null;
        type: string;
        story: string | null;
        title: string | null;
        entry_date: string | null;
        entry_time: string | null;
        location_name: string | null;
        location_lat: number | null;
        location_lng: number | null;
      }[];
      const existingByPlace = new Map<number, (typeof existing)[number]>();
      for (const e of existing) if (e.source_place_id != null) existingByPlace.set(e.source_place_id, e);

      // Next sort_order per date for freshly inserted skeletons.
      const dateMaxOrder = new Map<string, number>();
      const maxRows = this.db
        .prepare(
          'SELECT entry_date, COALESCE(MAX(sort_order), -1) AS m FROM journey_entries WHERE journey_id = ? GROUP BY entry_date',
        )
        .all(journey_id) as { entry_date: string; m: number }[];
      for (const row of maxRows) dateMaxOrder.set(row.entry_date, row.m);

      // 1) Upsert a skeleton for every currently-assigned place.
      for (const place of placeById.values()) {
        const entryDate = place.day_date || new Date().toISOString().split('T')[0];
        const entryTime = place.assignment_time || place.place_time || null;
        const locationName = place.address || place.name;
        const lat = place.lat || null;
        const lng = place.lng || null;
        const found = existingByPlace.get(place.id);

        if (!found) {
          const nextOrder = (dateMaxOrder.get(entryDate) ?? -1) + 1;
          dateMaxOrder.set(entryDate, nextOrder);
          this.insertSkeletonEntry({
            journeyId: journey_id,
            tripId,
            placeId: place.id,
            authorId: journey.user_id,
            title: place.name,
            entryDate,
            entryTime,
            locationName,
            lat,
            lng,
            sortOrder: nextOrder,
            now,
          });
          changed = true;
        } else if (found.type === 'skeleton') {
          // Skeletons follow the place's day/time/location snapshot.
          const stale =
            found.title !== place.name ||
            found.entry_date !== entryDate ||
            found.entry_time !== entryTime ||
            found.location_name !== locationName ||
            found.location_lat !== lat ||
            found.location_lng !== lng;
          if (stale) {
            this.db.prepare(
              `UPDATE journey_entries SET title = ?, entry_date = ?, entry_time = ?, location_name = ?, location_lat = ?, location_lng = ?, updated_at = ? WHERE id = ?`,
            ).run(place.name, entryDate, entryTime, locationName, lat, lng, now, found.id);
            changed = true;
          }
        } else {
          // Filled entries keep the user's date/story; only location follows the place.
          const stale =
            found.location_name !== locationName || found.location_lat !== lat || found.location_lng !== lng;
          if (stale) {
            this.db.prepare(
              `UPDATE journey_entries SET location_name = ?, location_lat = ?, location_lng = ?, updated_at = ? WHERE id = ?`,
            ).run(locationName, lat, lng, now, found.id);
            changed = true;
          }
        }
      }

      // 2) Drop skeletons whose place is no longer assigned to a day in this trip.
      for (const e of existing) {
        if (e.source_place_id == null || assignedPlaceIds.has(e.source_place_id)) continue;
        if (e.type === 'skeleton') {
          const hasPhotos = this.db.prepare('SELECT 1 FROM journey_entry_photos WHERE entry_id = ?').get(e.id);
          if (!hasPhotos && !e.story) {
            this.db.prepare('DELETE FROM journey_entries WHERE id = ?').run(e.id);
            changed = true;
            continue;
          }
        }
        const note = '\n\n> _Note: the original trip place was removed from the trip plan_';
        const newStory = (e.story || '') + note;
        this.db.prepare(
          'UPDATE journey_entries SET source_place_id = NULL, source_trip_id = NULL, type = ?, story = ?, updated_at = ? WHERE id = ?',
        ).run(e.type === 'skeleton' ? 'entry' : e.type, newStory, now, e.id);
        changed = true;
      }

      if (changed) this.broadcastJourneyEvent(journey_id, 'journey:trip:synced', { tripId }, sid);
    }
  }

  // ── Entries ──────────────────────────────────────────────────────────────

  /**
   * The GPX tracks belonging to a journey (#1260). A journey has no trip of its own,
   * so the link runs through its entries: every entry records the trip it came from,
   * and a trip's routed geometries live on its places. Uploading a GPX in the planner
   * therefore already puts everything in place; nothing drew it in the journal.
   *
   * Only places that actually carry geometry are returned, so a journey whose trips
   * have no tracks answers with an empty list rather than a wall of null points.
   */
  journeyTracks(journeyId: number, userId: number): JourneyTrack[] | null {
    if (!this.canAccessJourney(journeyId, userId)) return null;

    const rows = this.db.prepare(`
      SELECT DISTINCT p.id AS place_id, p.trip_id, p.name, p.route_color, p.route_geometry
        FROM journey_entries je
        JOIN places p ON p.trip_id = je.source_trip_id
       WHERE je.journey_id = ?
         AND je.source_trip_id IS NOT NULL
         AND p.route_geometry IS NOT NULL
       ORDER BY p.trip_id, p.id
    `).all(journeyId) as {
      place_id: number; trip_id: number; name: string | null;
      route_color: string | null; route_geometry: string;
    }[];

    const tracks: JourneyTrack[] = [];
    for (const row of rows) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(row.route_geometry);
      } catch {
        continue; // A geometry that is not JSON is not worth failing the whole map over.
      }
      if (!Array.isArray(parsed)) continue;

      const points: [number, number][] = [];
      for (const entry of parsed) {
        if (!Array.isArray(entry) || entry.length < 2) continue;
        const lat = Number(entry[0]);
        const lng = Number(entry[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        points.push([lat, lng]);
      }
      // A single point is a pin, not a line, and the map already has the entry markers.
      if (points.length < 2) continue;

      tracks.push({
        place_id: row.place_id,
        trip_id: row.trip_id,
        name: row.name ?? '',
        color: row.route_color,
        points,
      });
    }
    return tracks;
  }

  /**
   * What this journey adds up to — the figures TREK Studio prints on a page.
   *
   * Derived, never stored: the trips added to the journey carry the places and
   * the dates, the journey carries the entries and the photographs, and the
   * numbers fall out of those. Nothing here is a column anyone has to keep in
   * step.
   *
   * ── Where the route comes from ─────────────────────────────────────────
   *
   * The journey's own entries when they carry coordinates, because an entry is
   * something that happened somewhere on a day and that is exactly what a route
   * is made of. A journey assembled from trips that nobody has written up yet
   * has no such entries, and falls back to the places on those trips — which is
   * the same route, told by the itinerary instead of by the traveller.
   *
   * Mixing the two would double back on itself: an entry written about a place
   * that is also on the trip would be two stops at one location, and the
   * distance would count the leg twice.
   *
   * ── Where the countries come from ──────────────────────────────────────
   *
   * `place_regions` first: Atlas already resolves a place to its country and
   * caches it there, and reading a cache beats repeating a point-in-polygon
   * test against 4MB of boundaries. What is missing falls through to
   * `getCountryFromCoords`, which is the same answer computed rather than
   * remembered. That import is a plain function from a module built to have no
   * DI and no Nest edges, so it costs this domain no coupling to Atlas.
   */
  journeyStats(journeyId: number, userId: number): JourneyStats | null {
    if (!this.canAccessJourney(journeyId, userId)) return null;

    const entryRows = this.db.prepare(`
      SELECT id, title, location_name, location_lat, location_lng, entry_date, source_trip_id
        FROM journey_entries
       WHERE journey_id = ?
       ORDER BY entry_date ASC, sort_order ASC, id ASC
    `).all(journeyId) as {
      id: number; title: string | null; location_name: string | null;
      location_lat: number | null; location_lng: number | null; entry_date: string | null;
      source_trip_id: number | null;
    }[];

    /*
     * The trips themselves, named and dated.
     *
     * Ordered by the trip's own start date: `journey_trips` had a `sort_order`
     * for one migration and has not had one since 87, so the link row carries
     * no order to read. Undated trips sort last rather than first, where an
     * empty string would otherwise put them.
     */
    const tripRows = this.db.prepare(`
      SELECT t.id, t.title, t.start_date AS start, t.end_date AS end
        FROM journey_trips jt JOIN trips t ON t.id = jt.trip_id
       WHERE jt.journey_id = ?
       ORDER BY t.start_date IS NULL, t.start_date ASC, t.id ASC
    `).all(journeyId) as { id: number; title: string | null; start: string | null; end: string | null }[];

    const tripDates = tripRows.map(t => ({ start: t.start, end: t.end }));

    // Ordered the way the trip is walked: by day, then by the order within it.
    // A place can be assigned to more than one day (a hotel across three nights
    // is one place, three assignments), so the join is aggregated back down to
    // one row per place at its earliest day — otherwise the route would visit
    // the hotel three times and the distance would count those legs.
    const placeRows = this.db.prepare(`
      SELECT p.id, p.name, p.lat, p.lng, p.trip_id AS tripId,
             MIN(d.date) AS day,
             MIN(da.order_index) AS ord
        FROM journey_trips jt
        JOIN places p ON p.trip_id = jt.trip_id
        LEFT JOIN day_assignments da ON da.place_id = p.id
        LEFT JOIN days d ON d.id = da.day_id
       WHERE jt.journey_id = ?
       GROUP BY p.id
       ORDER BY day IS NULL, day ASC, ord ASC, p.id ASC
    `).all(journeyId) as {
      id: number; name: string | null; lat: number | null; lng: number | null; tripId: number | null;
      day: string | null; ord: number | null;
    }[];

    const placeCount = this.db.prepare(`
      SELECT COUNT(*) AS n FROM journey_trips jt
        JOIN places p ON p.trip_id = jt.trip_id
       WHERE jt.journey_id = ?
    `).get(journeyId) as { n: number };

    const photoCount = this.db
      .prepare('SELECT COUNT(*) AS n FROM journey_photos WHERE journey_id = ?')
      .get(journeyId) as { n: number };

    /*
     * ── A photograph per stop, for a map that marks them with pictures ───
     *
     * The truthful source is the junction: the photos somebody actually
     * attached to that entry, earliest first, videos excluded because a video
     * poster inside a four-millimetre circle is not a photograph.
     */
    const entryPhotoRows = this.db.prepare(`
      SELECT jep.entry_id AS entryId, gp.photo_id AS photoId
        FROM journey_entry_photos jep
        JOIN journey_photos gp ON gp.id = jep.journey_photo_id
        JOIN trek_photos tp ON tp.id = gp.photo_id
       WHERE gp.journey_id = ?
         AND (tp.media_type IS NULL OR tp.media_type = 'image')
       ORDER BY jep.entry_id ASC, jep.sort_order ASC, gp.sort_order ASC, gp.id ASC
    `).all(journeyId) as { entryId: number; photoId: number }[];

    const photoByEntry = new Map<number, number>();
    for (const r of entryPhotoRows) if (!photoByEntry.has(r.entryId)) photoByEntry.set(r.entryId, r.photoId);

    /*
     * ── And no second tier, deliberately ─────────────────────────────────
     *
     * The obvious fallback is to hand the journey's gallery out in blocks, the
     * way the auto layout hands photographs to pages, so that a journey with
     * fifty-seven pictures and an empty junction still gets pictures on its
     * map. It was written that way first and it was wrong: a marker at
     * Akureyri showing a photograph taken in Vík is a caption that lies, and a
     * map is exactly where a reader trusts that a picture is OF the place it
     * sits on.
     *
     * So a stop shows its own first photograph or it shows a number. The
     * number is not a degraded state; it is the honest one.
     */

    // The cached country per place, for whichever of them Atlas has seen.
    const cachedCountry = new Map<number, string>();
    const placeIds = placeRows.map(p => p.id);
    for (let i = 0; i < placeIds.length; i += 400) {
      const chunk = placeIds.slice(i, i + 400);
      if (!chunk.length) continue;
      const rows = this.db
        .prepare(`SELECT place_id, country_code FROM place_regions WHERE place_id IN (${chunk.map(() => '?').join(',')})`)
        .all(...chunk) as { place_id: number; country_code: string }[];
      for (const r of rows) if (r.country_code) cachedCountry.set(r.place_id, r.country_code.toUpperCase());
    }

    const countryAt = (lat: number, lng: number, placeId?: number): string | null => {
      if (placeId != null) {
        const cached = cachedCountry.get(placeId);
        if (cached) return cached;
      }
      return getCountryFromCoords(lat, lng);
    };

    const fromEntries: StatsInputPoint[] = entryRows
      .filter(e => Number.isFinite(e.location_lat) && Number.isFinite(e.location_lng))
      .map(e => ({
        lat: e.location_lat as number,
        lng: e.location_lng as number,
        label: e.title || e.location_name || '',
        date: e.entry_date ?? null,
        country: countryAt(e.location_lat as number, e.location_lng as number),
        tripId: e.source_trip_id ?? null,
        photoId: photoByEntry.get(e.id) ?? null,
      }));

    const points: StatsInputPoint[] = fromEntries.length
      ? fromEntries
      : placeRows
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map(p => ({
          lat: p.lat as number,
          lng: p.lng as number,
          label: p.name || '',
          date: p.day ?? null,
          country: countryAt(p.lat as number, p.lng as number, p.id),
          tripId: p.tripId ?? null,
          // A trip place carries `image_url`, which is a provider photo behind
          // its own attribution rather than a trek_photos id. It must not be
          // smuggled into a field the book will print as one of the journey's
          // own pictures.
          photoId: null,
        }));

    /*
     * How many of the route's stops each trip owns.
     *
     * Counted rather than assumed: a linked trip whose entries nobody wrote,
     * or whose places carry no coordinates, contributes nothing to the line and
     * offering a map of it would produce an empty frame.
     */
    const perTrip = new Map<number, number>();
    for (const p of points) {
      if (p.tripId != null) perTrip.set(p.tripId, (perTrip.get(p.tripId) ?? 0) + 1);
    }

    return computeJourneyStats({
      journeyId,
      points,
      entries: entryRows.length,
      photos: photoCount?.n ?? 0,
      places: placeCount?.n ?? 0,
      tripDates,
      countryNames: countryNamesFor(points),
      trips: tripRows.map(t => ({
        id: t.id,
        title: t.title || '',
        start: t.start,
        end: t.end,
        points: perTrip.get(t.id) ?? 0,
      })),
    });
  }

  listEntries(journeyId: number, userId: number) {
    if (!this.canAccessJourney(journeyId, userId)) return null;

    const entries = this.db
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? ORDER BY entry_date ASC, sort_order ASC, id ASC')
      .all(journeyId) as JourneyEntry[];

    const photos = this.db
      .prepare(
        `SELECT ${JP_SELECT} FROM ${JP_JOIN} WHERE jep.entry_id IN (SELECT id FROM journey_entries WHERE journey_id = ?) ORDER BY jep.sort_order ASC`,
      )
      .all(journeyId) as JourneyPhoto[];

    const photosByEntry: Record<number, JourneyPhoto[]> = {};
    for (const p of photos) {
      (photosByEntry[p.entry_id] ||= []).push(p);
    }

    return entries.map((e) => ({
      ...decodeEntryRow(e),
      photos: photosByEntry[e.id] || [],
      source_trip_name: e.source_trip_id
        ? (this.db.prepare('SELECT title FROM trips WHERE id = ?').get(e.source_trip_id) as { title: string } | undefined)
            ?.title || null
        : null,
    }));
  }

  createEntry(
    journeyId: number,
    userId: number,
    data: {
      type?: string;
      title?: string;
      story?: string;
      entry_date: string;
      entry_time?: string;
      location_name?: string;
      location_lat?: number;
      location_lng?: number;
      mood?: string;
      weather?: string;
      tags?: string[];
      pros_cons?: { pros: string[]; cons: string[] };
      visibility?: string;
      sort_order?: number;
    },
    sid?: string,
  ): JourneyEntryWire | null {
    if (!this.canEdit(journeyId, userId)) return null;

    const now = this.ts();
    const maxOrder = this.db
      .prepare('SELECT MAX(sort_order) as m FROM journey_entries WHERE journey_id = ? AND entry_date = ?')
      .get(journeyId, data.entry_date) as { m: number | null };

    const prosConsJson =
      data.pros_cons && (data.pros_cons.pros.length || data.pros_cons.cons.length)
        ? JSON.stringify(data.pros_cons)
        : null;

    const res = this.db
      .prepare(
        `
      INSERT INTO journey_entries (journey_id, author_id, type, title, story, entry_date, entry_time, location_name, location_lat, location_lng, mood, weather, tags, pros_cons, visibility, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        journeyId,
        userId,
        data.type || 'entry',
        data.title || null,
        data.story || null,
        data.entry_date,
        data.entry_time || null,
        data.location_name || null,
        data.location_lat ?? null,
        data.location_lng ?? null,
        data.mood || null,
        data.weather || null,
        data.tags?.length ? JSON.stringify(data.tags) : null,
        prosConsJson,
        data.visibility || 'private',
        (maxOrder?.m ?? -1) + 1,
        now,
        now,
      );

    const created = decodeEntryRow(
      this.db
        .prepare('SELECT * FROM journey_entries WHERE id = ?')
        .get(Number(res.lastInsertRowid)) as JourneyEntry,
    );
    this.broadcastJourneyEvent(journeyId, 'journey:entry:created', { entry: created }, sid);
    return created;
  }

  updateEntry(
    entryId: number,
    userId: number,
    data: Partial<{
      type: string;
      title: string;
      story: string;
      entry_date: string;
      entry_time: string;
      location_name: string;
      location_lat: number;
      location_lng: number;
      mood: string;
      weather: string;
      tags: string[];
      pros_cons: { pros: string[]; cons: string[] };
      visibility: string;
      sort_order: number;
    }>,
    sid?: string,
  ): JourneyEntryWire | null {
    const entry = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry | undefined;
    if (!entry) return null;
    if (!this.canEdit(entry.journey_id, userId)) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    // Allow-list the columns a client may set: keys come from the request body
    // and are interpolated as SQL column names, so restrict them to the known
    // entry fields. Keep this in sync with the data type above.
    const allowed = new Set([
      'type',
      'title',
      'story',
      'entry_date',
      'entry_time',
      'location_name',
      'location_lat',
      'location_lng',
      'mood',
      'weather',
      'tags',
      'pros_cons',
      'visibility',
      'sort_order',
    ]);

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      if (!allowed.has(key)) continue;
      if (key === 'tags') {
        fields.push('tags = ?');
        values.push(Array.isArray(val) ? JSON.stringify(val) : val);
      } else if (key === 'pros_cons') {
        fields.push('pros_cons = ?');
        values.push(val && typeof val === 'object' ? JSON.stringify(val) : val);
      } else {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    // if adding story to a skeleton, promote to entry
    if (entry.type === 'skeleton' && data.story && data.story.trim()) {
      fields.push('type = ?');
      values.push('entry');
    }

    if (fields.length === 0) return decodeEntryRow(entry);

    fields.push('updated_at = ?');
    values.push(this.ts());
    values.push(entryId);
    this.db.prepare(`UPDATE journey_entries SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // touch the journey
    this.db.prepare('UPDATE journeys SET updated_at = ? WHERE id = ?').run(this.ts(), entry.journey_id);

    const updated = decodeEntryRow(
      this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry,
    );
    this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:updated', { entry: updated }, sid);
    return updated;
  }

  // Reorder entries (typically within a single day). Caller passes the new
  // desired order of ids; each entry's sort_order is set to its index in the
  // array. Only entries owned by this journey are accepted.
  reorderEntries(journeyId: number, userId: number, orderedIds: number[], sid?: string): boolean {
    if (!this.canEdit(journeyId, userId)) return false;
    if (!orderedIds.length) return true;

    const placeholders = orderedIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT id FROM journey_entries WHERE id IN (${placeholders}) AND journey_id = ?`)
      .all(...orderedIds, journeyId) as { id: number }[];
    if (rows.length !== orderedIds.length) return false;

    const now = this.ts();
    const update = this.db.prepare('UPDATE journey_entries SET sort_order = ?, updated_at = ? WHERE id = ?');
    const tx = this.db.connection.transaction(() => {
      orderedIds.forEach((id, index) => update.run(index, now, id));
      this.db.prepare('UPDATE journeys SET updated_at = ? WHERE id = ?').run(now, journeyId);
    });
    tx();

    this.broadcastJourneyEvent(journeyId, 'journey:entries:reordered', { orderedIds }, sid);
    return true;
  }

  deleteEntry(entryId: number, userId: number, sid?: string): boolean {
    const entry = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry | undefined;
    if (!entry) return false;
    if (!this.canEdit(entry.journey_id, userId)) return false;

    if (entry.source_trip_id && entry.source_place_id && entry.type !== 'skeleton') {
      // Revert filled entry back to skeleton instead of deleting
      this.db.prepare(
        `
        UPDATE journey_entries
        SET type = 'skeleton', story = NULL, mood = NULL, weather = NULL, pros_cons = NULL,
            visibility = 'private', updated_at = ?
        WHERE id = ?
      `,
      ).run(this.ts(), entryId);
      this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:updated', { entryId }, sid);
    } else {
      this.db.prepare('DELETE FROM journey_entries WHERE id = ?').run(entryId);
      this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:deleted', { entryId }, sid);
    }

    return true;
  }

  // ── Photos ───────────────────────────────────────────────────────────────

  // Promote a skeleton suggestion to a concrete entry. Called whenever the user
  // adds content (photo upload, provider photo, gallery link) — a suggestion
  // with photos is no longer just a suggestion.
  private promoteSkeletonIfNeeded(entry: JourneyEntry): void {
    if (entry.type !== 'skeleton') return;
    this.db.prepare('UPDATE journey_entries SET type = ?, updated_at = ? WHERE id = ?').run('entry', this.ts(), entry.id);
  }

  // Ensure a trek_photo_id is in the journey gallery; return its gallery row id.
  private ensureInGallery(journeyId: number, trekPhotoId: number, caption?: string, shared?: number): number {
    const now = this.ts();
    const maxOrderRow = this.db
      .prepare('SELECT MAX(sort_order) as m FROM journey_photos WHERE journey_id = ?')
      .get(journeyId) as { m: number | null };
    this.db.prepare(
      `
      INSERT OR IGNORE INTO journey_photos (journey_id, photo_id, caption, shared, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    ).run(journeyId, trekPhotoId, caption || null, shared ?? 0, (maxOrderRow?.m ?? -1) + 1, now);
    const row = this.db
      .prepare('SELECT id FROM journey_photos WHERE journey_id = ? AND photo_id = ?')
      .get(journeyId, trekPhotoId) as { id: number };
    return row.id;
  }

  // Link a gallery photo to an entry (idempotent). Returns the junction JP_SELECT row.
  private linkGalleryPhotoToEntry(galleryId: number, entryId: number): JourneyPhoto | null {
    const now = this.ts();
    const maxOrderRow = this.db
      .prepare('SELECT MAX(sort_order) as m FROM journey_entry_photos WHERE entry_id = ?')
      .get(entryId) as { m: number | null };
    this.db.prepare(
      `
      INSERT OR IGNORE INTO journey_entry_photos (entry_id, journey_photo_id, sort_order, created_at)
      VALUES (?, ?, ?, ?)
    `,
    ).run(entryId, galleryId, (maxOrderRow?.m ?? -1) + 1, now);
    return this.db
      .prepare(`SELECT ${JP_SELECT} FROM ${JP_JOIN} WHERE jep.entry_id = ? AND jep.journey_photo_id = ?`)
      .get(entryId, galleryId) as JourneyPhoto | null;
  }

  addPhoto(
    entryId: number,
    userId: number,
    filePath: string,
    thumbnailPath?: string,
    caption?: string,
  ): JourneyPhoto | null {
    const entry = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry | undefined;
    if (!entry) return null;
    if (!this.canEdit(entry.journey_id, userId)) return null;

    const trekPhotoId = this.photos.getOrCreateLocal(filePath, thumbnailPath);
    const galleryId = this.db.connection.transaction(() => this.ensureInGallery(entry.journey_id, trekPhotoId, caption))();
    const result = this.linkGalleryPhotoToEntry(galleryId, entryId);
    this.promoteSkeletonIfNeeded(entry);
    return result;
  }

  addProviderPhoto(
    entryId: number,
    userId: number,
    provider: string,
    assetId: string,
    caption?: string,
    passphrase?: string,
    mediaType: string = 'image',
  ): JourneyPhoto | null {
    const entry = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry | undefined;
    if (!entry) return null;
    if (!this.canEdit(entry.journey_id, userId)) return null;

    const trekPhotoId = this.photos.getOrCreate(provider, assetId, userId, passphrase, mediaType);

    // skip if this photo is already linked to this entry
    const alreadyLinked = this.db
      .prepare(
        `
      SELECT 1 FROM journey_entry_photos jep
      JOIN journey_photos gp ON gp.id = jep.journey_photo_id
      WHERE jep.entry_id = ? AND gp.photo_id = ?
    `,
      )
      .get(entryId, trekPhotoId);
    if (alreadyLinked) return null;

    const galleryId = this.db.connection.transaction(() => this.ensureInGallery(entry.journey_id, trekPhotoId, caption))();
    const result = this.linkGalleryPhotoToEntry(galleryId, entryId);
    this.promoteSkeletonIfNeeded(entry);
    return result;
  }

  // Link a gallery photo (by its journey_photos.id) to an entry — idempotent.
  linkPhotoToEntry(entryId: number, journeyPhotoId: number, userId: number): JourneyPhoto | null {
    const entry = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry | undefined;
    if (!entry) return null;
    if (!this.canEdit(entry.journey_id, userId)) return null;

    // Verify the gallery photo belongs to this journey
    const galleryRow = this.db.prepare('SELECT id, journey_id FROM journey_photos WHERE id = ?').get(journeyPhotoId) as
      | { id: number; journey_id: number }
      | undefined;
    if (!galleryRow || galleryRow.journey_id !== entry.journey_id) return null;

    const result = this.linkGalleryPhotoToEntry(galleryRow.id, entryId);
    this.promoteSkeletonIfNeeded(entry);
    return result;
  }

  // Upload photos to the journey gallery only (no entry association).
  uploadGalleryPhotos(
    journeyId: number,
    userId: number,
    filePaths: { path: string; thumbnail?: string; mediaType?: string; durationMs?: number | null }[],
  ): JourneyPhoto[] {
    if (!this.canEdit(journeyId, userId)) return [];
    const results: any[] = [];
    const now = this.ts();
    const maxOrderRow = this.db
      .prepare('SELECT MAX(sort_order) as m FROM journey_photos WHERE journey_id = ?')
      .get(journeyId) as { m: number | null };
    let nextOrder = (maxOrderRow?.m ?? -1) + 1;

    for (const f of filePaths) {
      const trekPhotoId = this.photos.getOrCreateLocal(f.path, f.thumbnail, null, null, f.mediaType || 'image', f.durationMs ?? null);
      this.db.prepare(
        `
        INSERT OR IGNORE INTO journey_photos (journey_id, photo_id, shared, sort_order, created_at)
        VALUES (?, ?, 0, ?, ?)
      `,
      ).run(journeyId, trekPhotoId, nextOrder++, now);
      const row = this.db
        .prepare(`SELECT ${GALLERY_SELECT} FROM ${GALLERY_JOIN} WHERE gp.journey_id = ? AND gp.photo_id = ?`)
        .get(journeyId, trekPhotoId);
      if (row) results.push(row);
    }
    return results;
  }

  // Add a provider photo to the gallery only (no entry link).
  addProviderPhotoToGallery(
    journeyId: number,
    userId: number,
    provider: string,
    assetId: string,
    caption?: string,
    passphrase?: string,
    mediaType: string = 'image',
  ): any | null {
    if (!this.canEdit(journeyId, userId)) return null;
    const trekPhotoId = this.photos.getOrCreate(provider, assetId, userId, passphrase, mediaType);
    const galleryId = this.db.connection.transaction(() => this.ensureInGallery(journeyId, trekPhotoId, caption))();
    return this.db.prepare(`SELECT ${GALLERY_SELECT} FROM ${GALLERY_JOIN} WHERE gp.id = ?`).get(galleryId) ?? null;
  }

  // Unlink a photo from a specific entry; gallery row is preserved.
  unlinkPhotoFromEntry(entryId: number, journeyPhotoId: number, userId: number): boolean {
    const entry = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry | undefined;
    if (!entry) return false;
    if (!this.canEdit(entry.journey_id, userId)) return false;

    const result = this.db
      .prepare('DELETE FROM journey_entry_photos WHERE entry_id = ? AND journey_photo_id = ?')
      .run(entryId, journeyPhotoId);
    return result.changes > 0;
  }

  // Hard-delete a gallery photo (removes from all entries and the gallery).
  deleteGalleryPhoto(
    journeyPhotoId: number,
    userId: number,
  ): { photo_id: number; file_path?: string | null; thumbnail_path?: string | null } | null {
    const row = this.db.prepare('SELECT * FROM journey_photos WHERE id = ?').get(journeyPhotoId) as
      | { id: number; journey_id: number; photo_id: number }
      | undefined;
    if (!row) return null;
    if (!this.canEdit(row.journey_id, userId)) return null;

    const trekRow = this.db.prepare('SELECT file_path, thumbnail_path, provider FROM trek_photos WHERE id = ?').get(row.photo_id) as
      | { file_path?: string; thumbnail_path?: string; provider?: string }
      | undefined;

    // cascade on journey_entry_photos.journey_photo_id handles junction cleanup
    this.db.prepare('DELETE FROM journey_photos WHERE id = ?').run(journeyPhotoId);
    this.photos.deleteIfOrphan(row.photo_id);

    return { photo_id: row.photo_id, file_path: trekRow?.file_path ?? null, thumbnail_path: trekRow?.thumbnail_path ?? null };
  }

  setPhotoProvider(photoId: number, provider: string, assetId: string, ownerId: number) {
    // photoId = journey_photos.id (gallery row); look up the trek_photo_id
    const jp = this.db.prepare('SELECT photo_id FROM journey_photos WHERE id = ?').get(photoId) as
      | { photo_id: number }
      | undefined;
    if (!jp) return;
    this.photos.setProvider(jp.photo_id, provider, assetId, ownerId);
    // also denorm on gallery row for fast reads
    this.db.prepare('UPDATE journey_photos SET provider = ?, asset_id = ?, owner_id = ? WHERE id = ?').run(
      provider,
      assetId,
      ownerId,
      photoId,
    );
  }

  updatePhoto(
    photoId: number,
    userId: number,
    data: { caption?: string; sort_order?: number },
  ): JourneyPhoto | null {
    // photoId = journey_photos.id (gallery row)
    const row = this.db.prepare('SELECT id, journey_id FROM journey_photos WHERE id = ?').get(photoId) as
      | { id: number; journey_id: number }
      | undefined;
    if (!row) return null;
    if (!this.canEdit(row.journey_id, userId)) return null;

    // caption lives on the gallery row; sort_order lives on the junction table
    // (JP_SELECT reads jep.sort_order, so updating journey_photos.sort_order
    // would not be reflected in the returned row).
    if (data.caption !== undefined) {
      this.db.prepare('UPDATE journey_photos SET caption = ? WHERE id = ?').run(data.caption, photoId);
    }
    if (data.sort_order !== undefined) {
      this.db.prepare('UPDATE journey_entry_photos SET sort_order = ? WHERE journey_photo_id = ?').run(
        data.sort_order,
        photoId,
      );
    }
    return this.db.prepare(`SELECT ${JP_SELECT} FROM ${JP_JOIN} WHERE gp.id = ? LIMIT 1`).get(photoId) as JourneyPhoto | null;
  }

  // deletePhoto: hard-delete (backwards compat name used by old route).
  deletePhoto(
    photoId: number,
    userId: number,
  ): { id: number; photo_id: number; file_path?: string | null; thumbnail_path?: string | null; journey_id: number } | null {
    const row = this.db.prepare('SELECT id, journey_id, photo_id FROM journey_photos WHERE id = ?').get(photoId) as
      | { id: number; journey_id: number; photo_id: number }
      | undefined;
    if (!row) return null;
    if (!this.canEdit(row.journey_id, userId)) return null;

    const trekRow = this.db.prepare('SELECT file_path, thumbnail_path, provider FROM trek_photos WHERE id = ?').get(row.photo_id) as
      | { file_path?: string; thumbnail_path?: string; provider?: string }
      | undefined;

    this.db.prepare('DELETE FROM journey_photos WHERE id = ?').run(photoId);
    this.photos.deleteIfOrphan(row.photo_id);

    return { id: row.id, photo_id: row.photo_id, file_path: trekRow?.file_path ?? null, thumbnail_path: trekRow?.thumbnail_path ?? null, journey_id: row.journey_id };
  }

  // ── Contributors ─────────────────────────────────────────────────────────

  addContributor(
    journeyId: number,
    userId: number,
    targetUserId: number,
    role: 'editor' | 'viewer',
  ): boolean {
    if (!this.isOwner(journeyId, userId)) return false;
    if (targetUserId === userId) return false;
    try {
      this.db.prepare(
        'INSERT OR REPLACE INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, ?, ?)',
      ).run(journeyId, targetUserId, role, this.ts());
      this.broadcastJourneyEvent(journeyId, 'journey:contributor:changed', { targetUserId, role });
      return true;
    } catch {
      return false;
    }
  }

  updateContributorRole(
    journeyId: number,
    userId: number,
    targetUserId: number,
    role: 'editor' | 'viewer',
  ): boolean {
    if (!this.isOwner(journeyId, userId)) return false;
    this.db.prepare('UPDATE journey_contributors SET role = ? WHERE journey_id = ? AND user_id = ?').run(
      role,
      journeyId,
      targetUserId,
    );
    this.broadcastJourneyEvent(journeyId, 'journey:contributor:changed', { targetUserId, role });
    return true;
  }

  removeContributor(journeyId: number, userId: number, targetUserId: number): boolean {
    if (!this.isOwner(journeyId, userId)) return false;
    this.db.prepare("DELETE FROM journey_contributors WHERE journey_id = ? AND user_id = ? AND role != 'owner'").run(
      journeyId,
      targetUserId,
    );
    return true;
  }

  // ── Suggestions ──────────────────────────────────────────────────────────

  getSuggestions(userId: number) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.db
      .prepare(
        `
      SELECT t.id, t.title, t.start_date, t.end_date, t.cover_image,
        (SELECT COUNT(*) FROM places p INNER JOIN day_assignments da ON da.place_id = p.id WHERE p.trip_id = t.id) as place_count
      FROM trips t
      LEFT JOIN trip_members tm ON t.id = tm.trip_id AND tm.user_id = ?
      WHERE (t.user_id = ? OR tm.user_id = ?)
        AND t.end_date IS NOT NULL
        AND t.end_date >= ?
        AND t.end_date <= date('now')
        AND t.id NOT IN (SELECT trip_id FROM journey_trips)
      ORDER BY t.end_date DESC
    `,
      )
      .all(userId, userId, userId, thirtyDaysAgo);
  }

  // ── User trips (for trip picker) ─────────────────────────────────────────

  listUserTrips(userId: number) {
    return this.db
      .prepare(
        `
      SELECT t.id, t.title, t.start_date, t.end_date, t.cover_image,
        (SELECT COUNT(*) FROM places p INNER JOIN day_assignments da ON da.place_id = p.id WHERE p.trip_id = t.id) as place_count
      FROM trips t
      LEFT JOIN trip_members tm ON t.id = tm.trip_id AND tm.user_id = ?
      WHERE t.user_id = ? OR tm.user_id = ?
      ORDER BY t.start_date DESC
    `,
      )
      .all(userId, userId, userId);
  }
}
