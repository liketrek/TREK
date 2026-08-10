import { Injectable } from '@nestjs/common';
import { avatarUrl } from '../common/avatarUrl';
import type { Journey, JourneyEntry, JourneyPhoto, JourneyContributor } from '../../types';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { TrekWsUserEventName } from '@trek/shared';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';



// Per-journey gallery view: journey_photos → trek_photos (no entry context).
// Per-entry photo view: join journey_entry_photos → journey_photos (gallery) → trek_photos.
// id = gp.id (gallery photo id) — used by clients for linkPhoto/updatePhoto/unlink/delete.
const JP_SELECT = `
  gp.id, jep.entry_id, gp.photo_id, gp.caption, jep.sort_order, gp.shared, gp.created_at,
  tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
  tp.media_type, tp.duration_ms
`;

const JP_JOIN = `journey_entry_photos jep
  JOIN journey_photos gp ON gp.id  = jep.journey_photo_id
  JOIN trek_photos    tp ON tp.id  = gp.photo_id`;

const GALLERY_SELECT = `
  gp.id, gp.journey_id, gp.photo_id, gp.caption, gp.shared, gp.sort_order, gp.created_at,
  tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
  tp.media_type, tp.duration_ms
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



  private broadcastJourneyEvent(
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
      ...e,
      tags: e.tags ? JSON.parse(e.tags) : [],
      pros_cons: e.pros_cons ? JSON.parse(e.pros_cons) : null,
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
    // import existing trip photos (Immich/Synology) with sharing settings
    this.syncTripPhotos(journeyId, tripId);
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

  // import trip_photos into journey gallery when a trip is linked
  private syncTripPhotos(journeyId: number, tripId: number) {
    const tripPhotos = this.db
      .prepare('SELECT tp.photo_id, tp.shared FROM trip_photos tp WHERE tp.trip_id = ?')
      .all(tripId) as { photo_id: number; shared: number }[];
    if (!tripPhotos.length) return;

    const now = this.ts();
    const maxOrderRow = this.db
      .prepare('SELECT MAX(sort_order) as m FROM journey_photos WHERE journey_id = ?')
      .get(journeyId) as { m: number | null };
    let nextOrder = (maxOrderRow?.m ?? -1) + 1;

    for (const tp of tripPhotos) {
      this.db.prepare(
        `
        INSERT OR IGNORE INTO journey_photos (journey_id, photo_id, shared, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run(journeyId, tp.photo_id, tp.shared, nextOrder++, now);
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
      ...e,
      tags: e.tags ? JSON.parse(e.tags) : [],
      pros_cons: e.pros_cons ? JSON.parse(e.pros_cons) : null,
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
  ): JourneyEntry | null {
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

    const created = this.db
      .prepare('SELECT * FROM journey_entries WHERE id = ?')
      .get(Number(res.lastInsertRowid)) as JourneyEntry;
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
  ): JourneyEntry | null {
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

    if (fields.length === 0) return entry;

    fields.push('updated_at = ?');
    values.push(this.ts());
    values.push(entryId);
    this.db.prepare(`UPDATE journey_entries SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // touch the journey
    this.db.prepare('UPDATE journeys SET updated_at = ? WHERE id = ?').run(this.ts(), entry.journey_id);

    const updated = this.db.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as JourneyEntry;
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
  ): { photo_id: number; file_path?: string | null } | null {
    const row = this.db.prepare('SELECT * FROM journey_photos WHERE id = ?').get(journeyPhotoId) as
      | { id: number; journey_id: number; photo_id: number }
      | undefined;
    if (!row) return null;
    if (!this.canEdit(row.journey_id, userId)) return null;

    const trekRow = this.db.prepare('SELECT file_path, provider FROM trek_photos WHERE id = ?').get(row.photo_id) as
      | { file_path?: string; provider?: string }
      | undefined;

    // cascade on journey_entry_photos.journey_photo_id handles junction cleanup
    this.db.prepare('DELETE FROM journey_photos WHERE id = ?').run(journeyPhotoId);
    this.photos.deleteIfOrphan(row.photo_id);

    return { photo_id: row.photo_id, file_path: trekRow?.file_path ?? null };
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
  ): { id: number; photo_id: number; file_path?: string | null; journey_id: number } | null {
    const row = this.db.prepare('SELECT id, journey_id, photo_id FROM journey_photos WHERE id = ?').get(photoId) as
      | { id: number; journey_id: number; photo_id: number }
      | undefined;
    if (!row) return null;
    if (!this.canEdit(row.journey_id, userId)) return null;

    const trekRow = this.db.prepare('SELECT file_path, provider FROM trek_photos WHERE id = ?').get(row.photo_id) as
      | { file_path?: string; provider?: string }
      | undefined;

    this.db.prepare('DELETE FROM journey_photos WHERE id = ?').run(photoId);
    this.photos.deleteIfOrphan(row.photo_id);

    return { id: row.id, photo_id: row.photo_id, file_path: trekRow?.file_path ?? null, journey_id: row.journey_id };
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
