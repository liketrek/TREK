import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { avatarUrl } from '../common/avatarUrl';
import type { GalleryPhoto, Journey, JourneyEntry, JourneyPhoto, JourneyContributor } from '../../types';
import { decodeEntryRow, type JourneyEntryWire } from './journey-entry-row';
import { UnitOfWork } from '../database/unit-of-work';
import { RealtimeService } from '../realtime/realtime.service';
import type { JourneyStats, JourneyTrack, TrekWsUserEventName } from '@trek/shared';
import { todayUtc } from '@trek/shared';
import { TrekPhotoRegistrationService } from '../photos/trek-photo-registration.service';
import { getCountryFromCoords } from '../atlas/atlas-geo';
import { computeJourneyStats, type StatsInputPoint } from './journey-stats';
import { Journeys } from '../../db/entities/Journeys.entity';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import { JourneyContributors } from '../../db/entities/JourneyContributors.entity';
import type { JourneyContributorsRepository } from '../../db/repositories/JourneyContributors.repository';
import { JourneyTrips } from '../../db/entities/JourneyTrips.entity';
import type { JourneyTripsRepository } from '../../db/repositories/JourneyTrips.repository';
import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import type { JourneyPhotosRepository } from '../../db/repositories/JourneyPhotos.repository';
import { JourneyEntryPhotos } from '../../db/entities/JourneyEntryPhotos.entity';
import type { JourneyEntryPhotosRepository } from '../../db/repositories/JourneyEntryPhotos.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { presenceSet } from '../../db/repositories/_shared/presence-set';

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

/**
 * What makes a journal skeleton unique: the place *and* the day assignment it
 * stands on (#2329). Keyed on the place alone, a stop kept across two days — the
 * city you land in at dusk and walk through the next morning — got one entry, and
 * the second day's photographs had nowhere to go.
 *
 * The assignment rather than the day, because moving a stop updates
 * `day_assignments.day_id` in place: keyed this way an entry follows the move
 * instead of being read as one stop leaving the plan and another arriving.
 */
function skeletonKey(placeId: number, assignmentId: number | null | undefined): string {
  return `${placeId}:${assignmentId ?? ''}`;
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
//
// Plan 3g Task 2: the module-level `JP_SELECT`/`JP_JOIN`/`GALLERY_SELECT`/
// `GALLERY_JOIN` raw-SQL-text consts these two comment paragraphs used to
// document are GONE — every site that folded them into a `this.db.prepare(...)`
// call now reads through `JourneyPhotosRepository`/`JourneyEntryPhotosRepository`
// instead (JG15/19/72/88-102/108-116, `journey-share.service.ts`'s own
// GALLERY_CHRONOLOGICAL_ORDER import for JS15 is unaffected — that constant
// lives in `journey-gallery-order.ts`, a separate file this task does not
// touch). The two comment paragraphs above are kept for the column-shape
// documentation; the repositories' own docstrings are the source of truth
// for the exact column lists now.

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
    private readonly realtime: RealtimeService,
    private readonly photos: TrekPhotoRegistrationService,
    private readonly uow: UnitOfWork,
    // Plan 3g Task 1 (Part A) — access control, journey/trip CRUD, the
    // trip-sync engine.
    @InjectRepository(Journeys) private readonly journeysRepo: JourneysRepository,
    @InjectRepository(JourneyContributors) private readonly contributorsRepo: JourneyContributorsRepository,
    @InjectRepository(JourneyTrips) private readonly journeyTripsRepo: JourneyTripsRepository,
    @InjectRepository(JourneyEntries) private readonly entriesRepo: JourneyEntriesRepository,
    // R7 — AP1's `this.db.canAccessTrip(...)` becomes a direct call to the
    // same repository `DatabaseService.canAccessTrip` already delegates to
    // (Task 0's confirmation: `canAccessTrip` IS `findAccessible`, not
    // merely equivalent to it). Also reused by `getJourneyFull`'s per-entry
    // `source_trip_name` lookup (JG16, via the already-existing `getTitle`).
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    // Plan 3g Task 2 (Part B) — the full photos surface (JG19/JG87-116),
    // finishing the two sites Task 1 left raw (JG15/JG19) because their
    // owning repositories did not exist yet. A genuine new constructor
    // parameter pair beyond what Task 1's own constructor-ripple fix
    // anticipated — flagged in task-2-report.md per the brief's own
    // contingency instruction, with the companion edits to
    // `journey-domain.module.ts`'s `forFeature` array and the two shared
    // test-wiring helpers (`plugin-host.ts`/`mcp-test-controllers.ts`,
    // both confirmed clean via `git status` before editing, per the
    // brief's "constructor-ripple rule" allowance) made in this same
    // change.
    @InjectRepository(JourneyPhotos) private readonly photosRepo: JourneyPhotosRepository,
    @InjectRepository(JourneyEntryPhotos) private readonly entryPhotosRepo: JourneyEntryPhotosRepository,
    // JG44 — `onPlaceUpdated`'s bare `SELECT * FROM places WHERE id = ?`,
    // finished via `PlacesRepository.findRaw` (this task's ONE append to
    // `Places.repository.ts`, per the task brief — nobody else holds it).
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
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
  async broadcastJourneyEvent(
    journeyId: number,
    // Typed against the shared WS registry rather than left as `string`: the
    // legacy broadcastToUser took anything, so a typo'd event name shipped as a
    // silent no-op in the client's remoteEventHandler.
    event: TrekWsUserEventName,
    data: Record<string, unknown>,
    excludeSocketId?: string | number,
  ): Promise<void> {
    // JG1/JG2 — one composed recipient-set read (`JourneysRepository
    // .listRecipientUserIds`), public because Task 2/3 reuse it for their
    // own `broadcastJourneyEvent` calls too.
    const userIds = await this.journeysRepo.listRecipientUserIds(journeyId);

    for (const uid of userIds) {
      this.realtime.broadcastToUser(uid, { type: event, journeyId, ...data }, excludeSocketId);
    }
  }

  // ── Access control ───────────────────────────────────────────────────────

  async canAccessJourney(journeyId: number, userId: number): Promise<Journey | null> {
    // `JourneyRow.status` is the raw TEXT column (`string`); `Journey.status`
    // (`src/types.ts`) narrows it to the app's own literal union — the same
    // narrowing the legacy `as Journey` cast performed silently on every
    // `SELECT *` read this repository now serves.
    const own = await this.journeysRepo.findOwnedByUser(journeyId, userId);
    if (own) return own as Journey;
    const isContributor = await this.contributorsRepo.existsForUser(journeyId, userId);
    if (isContributor) return ((await this.journeysRepo.findById(journeyId)) as Journey) || null;
    return null;
  }

  async isOwner(journeyId: number, userId: number): Promise<boolean> {
    return await this.journeysRepo.isOwnedByUser(journeyId, userId);
  }

  async canEdit(journeyId: number, userId: number): Promise<boolean> {
    if (await this.isOwner(journeyId, userId)) return true;
    const role = await this.contributorsRepo.findRole(journeyId, userId);
    return role === 'editor' || role === 'owner';
  }

  // ── Journey CRUD ─────────────────────────────────────────────────────────

  async listJourneys(userId: number) {
    return await this.journeysRepo.listForUser(userId);
  }

  async createJourney(
    userId: number,
    data: {
      title: string;
      subtitle?: string;
      trip_ids?: number[];
    },
  ): Promise<Journey> {
    const now = this.ts();
    const journeyId = await this.journeysRepo.insertJourney({
      user_id: userId,
      title: data.title,
      subtitle: data.subtitle || null,
      created_at: now,
      updated_at: now,
    });

    // add owner as contributor
    await this.contributorsRepo.insertOwner(journeyId, userId, now);

    // link trips and sync skeleton entries
    if (data.trip_ids?.length) {
      // Track the first trip that was ACTUALLY linked (addTripToJourney access-checks and
      // returns false for a foreign/inaccessible trip). Inheriting the cover from a raw
      // trip_ids[0] would otherwise leak an arbitrary trip's cover image cross-tenant.
      let coverTripId: number | undefined;
      for (const tripId of data.trip_ids) {
        if ((await this.addTripToJourney(journeyId, tripId, userId)) && coverTripId === undefined) coverTripId = tripId;
      }

      if (coverTripId !== undefined) {
        // JG11 — `SELECT cover_image FROM trips WHERE id = ?`; `TripsRepository.findRaw`
        // (already public, 3c) covers this column among every other trip column.
        const firstTrip = await this.tripsRepo.findRaw(coverTripId);
        if (firstTrip?.cover_image) {
          // trip stores full path (/uploads/covers/x.jpg), journey stores relative (covers/x.jpg)
          const relativePath = firstTrip.cover_image.replace(/^\/uploads\//, '');
          await this.journeysRepo.updateCoverImage(journeyId, relativePath);
        }
      }
    }

    return (await this.journeysRepo.findById(journeyId)) as Journey;
  }

  async getJourneyFull(journeyId: number, userId: number) {
    const journey = await this.canAccessJourney(journeyId, userId);
    if (!journey) return null;

    const entries = await this.entriesRepo.listForJourney(journeyId);

    // JG15 — the per-entry photo join (journey_entry_photos/journey_photos/
    // trek_photos, the JP_SELECT/JP_JOIN composite). Task 1 left this raw
    // (its owning repository, JourneyEntryPhotosRepository, did not exist
    // in Task 1's named file set) — finished here, Task 2's own build.
    const photos = await this.entryPhotosRepo.listForJourney(journeyId);

    // group photos by entry
    const photosByEntry: Record<number, JourneyPhoto[]> = {};
    for (const p of photos) {
      (photosByEntry[p.entry_id] ||= []).push(p);
    }

    // JG19 — the gallery read, folding in the dialect-hard
    // GALLERY_CHRONOLOGICAL_ORDER constant (R1). Task 1 left this raw for
    // the same reason as JG15 above — finished here, the FIRST real
    // consumer of Task 0's Kysely rebuild (`JourneyPhotosRepository
    // .galleryRead`).
    const gallery = await this.photosRepo.galleryRead(journeyId);

    const enrichedEntries = await Promise.all(
      entries.map(async (e) => ({
        ...decodeEntryRow(e),
        photos: photosByEntry[e.id] || [],
        // JG16 — reuses `TripsRepository.getTitle` (already public, 3c; same
        // statement text as this site's legacy `SELECT title FROM trips
        // WHERE id = ?`) rather than a new method.
        source_trip_name: e.source_trip_id ? await this.tripsRepo.getTitle(e.source_trip_id) : null,
      })),
    );

    // linked trips (JG17)
    const trips = await this.journeyTripsRepo.listForJourney(journeyId);

    // contributors (JG18)
    const contributorsRaw = await this.contributorsRepo.listForJourney(journeyId);
    const contributors = contributorsRaw.map((c) => ({
      ...c,
      avatar_url: avatarUrl(c),
    }));

    // stats
    const entryCount = entries.filter((e) => e.type === 'entry').length;
    const photoCount = gallery.length;
    const places = [...new Set(entries.map((e) => e.location_name).filter(Boolean))];

    // JG20
    const hideSkeletons = await this.contributorsRepo.getHideSkeletons(journeyId, userId);

    // Determine the viewer's role on this journey so the UI can gate edit/settings
    // actions. 'owner' = creator, 'editor' | 'viewer' = from journey_contributors.
    const journeyRow = journey as unknown as { user_id?: number };
    let myRole: 'owner' | 'editor' | 'viewer' | null;
    if (journeyRow.user_id === userId) {
      myRole = 'owner';
    } else {
      // JG21 — same text as JG7 (`findRole`).
      const role = await this.contributorsRepo.findRole(journeyId, userId);
      myRole = (role as 'editor' | 'viewer' | undefined) ?? null;
    }

    // JG22
    const dismissedCount = await this.entriesRepo.countDismissed(journeyId);

    return {
      ...journey,
      entries: enrichedEntries,
      gallery,
      trips,
      contributors,
      stats: { entries: entryCount, photos: photoCount, places: places.length },
      hide_skeletons: hideSkeletons,
      // What the eye toggle cannot say: how much was waved away one at a time, and
      // so whether a way back is worth any room at all.
      dismissed_count: dismissedCount,
      my_role: myRole,
    };
  }

  async updateJourney(
    journeyId: number,
    userId: number,
    data: Partial<{
      title: string;
      subtitle: string;
      cover_gradient: string;
      cover_image: string;
      status: string;
      status_override: string | null;
      show_trip_tracks: boolean | number;
      photo_location: boolean | number;
      show_verdict: boolean | number;
      show_mood: boolean | number;
      show_weather: boolean | number;
    }>,
  ): Promise<Journey | null> {
    // Journey-level settings (title, cover, status) are owner-only — editors
    // may only edit entries and photos, not reshape the journey itself.
    if (!(await this.isOwner(journeyId, userId))) return null;

    const ALLOWED_STATUSES = ['draft', 'active', 'completed', 'archived'];
    // null hands the state back to the trip dates (#762).
    const ALLOWED_OVERRIDES: (string | null)[] = [null, 'draft', 'live', 'completed'];
    // JG24 — R6's `presenceSet` conversion. The SERVICE resolves each field
    // to its final bound value (the `status` allow-list check, the
    // `show_*` boolean-to-0/1 coercion) before handing it to the repository;
    // a field absent here never reaches the SET clause, matching the legacy
    // dynamic-SET-list's own "not present, not touched" behavior.
    const patch = presenceSet<{
      title: string;
      subtitle: string | null;
      cover_gradient: string | null;
      cover_image: string | null;
      status: string;
      status_override: string | null;
      show_trip_tracks: number;
      photo_location: number;
      show_verdict: number;
      show_mood: number;
      show_weather: number;
    }>({
      title: [data.title !== undefined, data.title as string],
      subtitle: [data.subtitle !== undefined, data.subtitle as string],
      cover_gradient: [data.cover_gradient !== undefined, data.cover_gradient as string],
      cover_image: [data.cover_image !== undefined, data.cover_image as string],
      status: [data.status !== undefined && ALLOWED_STATUSES.includes(data.status as string), data.status as string],
      status_override: [
        data.status_override !== undefined && ALLOWED_OVERRIDES.includes(data.status_override as string | null),
        data.status_override as string | null,
      ],
      show_trip_tracks: [data.show_trip_tracks !== undefined, data.show_trip_tracks ? 1 : 0],
      photo_location: [data.photo_location !== undefined, data.photo_location ? 1 : 0],
      show_verdict: [data.show_verdict !== undefined, data.show_verdict ? 1 : 0],
      show_mood: [data.show_mood !== undefined, data.show_mood ? 1 : 0],
      show_weather: [data.show_weather !== undefined, data.show_weather ? 1 : 0],
    });

    if (Object.keys(patch).length === 0) return ((await this.journeysRepo.findById(journeyId)) as Journey) ?? null;

    await this.journeysRepo.updateFields(journeyId, { ...patch, updated_at: this.ts() });
    return ((await this.journeysRepo.findById(journeyId)) as Journey) ?? null;
  }

  /**
   * Entries without a place that just received a geotagged photo, on journeys
   * that asked for it (#1003): each takes the position of its first such photo.
   * An entry that already has coordinates is never moved. Answers what changed,
   * so the caller can name the places and tell the journeys.
   */
  async placeEntriesFromPhotos(trekPhotoIds: number[]): Promise<{ entryId: number; journeyId: number; lat: number; lng: number }[]> {
    if (!trekPhotoIds.length) return [];
    const rows = await this.entriesRepo.listPhotoPlacementCandidates(trekPhotoIds); // JG122
    const placed: { entryId: number; journeyId: number; lat: number; lng: number }[] = [];
    const seen = new Set<number>();
    const now = this.ts();
    for (const row of rows) {
      if (seen.has(row.entryId)) continue;
      seen.add(row.entryId);
      const changes = await this.entriesRepo.placeIfUnplaced(row.entryId, {
        location_lat: row.lat,
        location_lng: row.lng,
        country_code: this.countryFor(row.lat, row.lng),
        updated_at: now,
      }); // JG123
      if (changes > 0) placed.push(row);
    }
    return placed;
  }

  /** The place name for an entry placed from a photo, only while it still has none. */
  async nameEntryLocation(entryId: number, name: string): Promise<void> {
    await this.entriesRepo.nameLocationIfUnnamed(entryId, name); // JG124
  }

  async updateJourneyPreferences(journeyId: number, userId: number, data: { hide_skeletons?: boolean }) {
    if (!(await this.canAccessJourney(journeyId, userId))) return null;
    if (data.hide_skeletons !== undefined) {
      await this.contributorsRepo.setHideSkeletons(journeyId, userId, data.hide_skeletons ? 1 : 0);
    }
    const hideSkeletons = await this.contributorsRepo.getHideSkeletons(journeyId, userId);
    return { hide_skeletons: hideSkeletons };
  }

  /**
   * Bring every waved-away suggestion back.
   *
   * All of them at once rather than one at a time: dismissing is a per-card
   * gesture, undoing it is a change of mind about the plan, and a list of
   * things you have already said you did not want is not a screen worth
   * building. The count comes back so the caller can say what happened.
   */
  async restoreDismissedSuggestions(journeyId: number, userId: number): Promise<{ restored: number } | null> {
    if (!(await this.canEdit(journeyId, userId))) return null;
    const restored = await this.entriesRepo.restoreDismissed(journeyId);
    if (restored > 0) await this.broadcastJourneyEvent(journeyId, 'journey:entry:updated', { restored });
    return { restored };
  }

  async deleteJourney(journeyId: number, userId: number): Promise<boolean> {
    if (!(await this.isOwner(journeyId, userId))) return false;
    await this.journeysRepo.deleteById(journeyId);
    return true;
  }

  // ── Trip management ──────────────────────────────────────────────────────

  async addTripToJourney(journeyId: number, tripId: number, userId: number): Promise<boolean> {
    // Only attach a trip the caller can actually access — otherwise a journey
    // owner could pull an arbitrary trip's places + photos into their journey
    // (cross-tenant leak). Mirrors the trip-access gate every other trip-scoped
    // path enforces.
    if (!(await this.tripsRepo.findAccessible(tripId, userId))) return false;
    // And a journey the caller can actually reach. Without this, any logged-in user
    // could link a trip of theirs into a stranger's journey and seed entries and
    // photos there — the MCP tool has always checked this, the REST route never did.
    if (!(await this.canAccessJourney(journeyId, userId))) return false;
    const now = this.ts();
    try {
      await this.journeyTripsRepo.insertIgnore(journeyId, tripId, now);
    } catch {
      return false;
    }

    // sync skeleton entries for all places in this trip
    await this.syncTripPlaces(journeyId, tripId, userId);
    // Trip photos are deliberately NOT pulled in any more (#1614). Photos live in
    // journeys now: the trip-photo surface lost its UI in 3.1.0, nothing writes to
    // it on an install newer than that, and copying rows between the two was what
    // let a photo one member had chosen not to share reach a journey at all. The
    // table and its (unreferenced) routes stay for one more release rather than
    // being dropped in an append-only migration.
    await this.broadcastJourneyEvent(journeyId, 'journey:trip:synced', { tripId });
    return true;
  }

  async removeTripFromJourney(journeyId: number, tripId: number, userId: number): Promise<boolean> {
    if (!(await this.isOwner(journeyId, userId))) return false;

    // remove skeleton entries that haven't been filled in
    await this.entriesRepo.deleteSkeletonsForTrip(journeyId, tripId);

    // detach filled entries from this trip
    await this.entriesRepo.detachFilledForTrip(journeyId, tripId);

    await this.journeyTripsRepo.deleteLink(journeyId, tripId);
    return true;
  }

  // ── Sync engine ──────────────────────────────────────────────────────────

  async syncTripPlaces(journeyId: number, tripId: number, authorId: number) {
    // M2 (rule 11/24) — the existence read and the skeleton insert are
    // separate awaits now that the sync engine is async, so two concurrent
    // syncs for the same trip could both miss the same place and each insert
    // a skeleton for it. Wrapped whole: every statement inside is DB-only
    // (repository calls), and the connection mutex serializes a second
    // caller's statements behind this one until it commits.
    await this.uow.transactional(async () => {
      const places = await this.journeyTripsRepo.listAssignedPlacesForTrip(tripId);

      const now = this.ts();
      const existing = await this.entriesRepo.listSourceKeysForTrip(journeyId, tripId);
      const existingKeys = new Set(existing.map((e) => skeletonKey(e.source_place_id, e.source_assignment_id)));

      // Track next sort_order per date so synced skeletons get unique, sequential positions.
      const dateMaxOrder = new Map<string, number>();
      const maxRows = await this.entriesRepo.dateSortOrderMaxima(journeyId);
      for (const row of maxRows) dateMaxOrder.set(row.entry_date, row.m);

      for (const place of places) {
        const key = skeletonKey(place.id, place.assignment_id);
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);

        const entryDate = place.day_date || new Date().toISOString().split('T')[0];
        const entryTime = place.assignment_time || place.place_time || null;
        const nextOrder = (dateMaxOrder.get(entryDate) ?? -1) + 1;
        dateMaxOrder.set(entryDate, nextOrder);

        await this.insertSkeletonEntry({
          journeyId,
          tripId,
          placeId: place.id,
          assignmentId: place.assignment_id ?? null,
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
    });
  }

  // called when a trip place is created
  async onPlaceCreated(tripId: number, placeId: number) {
    const links = await this.journeyTripsRepo.listJourneyIdsForTrip(tripId);
    if (!links.length) return;

    // One row per assignment, not one per place: a place can already stand on
    // several days by the time this fires, and each of those days is its own
    // entry (#2329).
    const assignments = await this.journeyTripsRepo.listAssignedPlacesForPlace(placeId);
    if (!assignments.length) return; // not assigned to a day yet — skip

    const now = this.ts();
    // M2 (rule 11/24) — same fix as syncTripPlaces: the existence check
    // (`existsForPlaceAssignment`) and the insert are separate awaits, so a
    // concurrent reconcile racing this callback could both find nothing and
    // both insert. Wrapped whole; DB-only, no broadcast inside.
    await this.uow.transactional(async () => {
      for (const journeyId of links) {
        // JG40 — same text as JG2/JG54, resolved through `findOwnerId`. No
        // undefined-guard here (matching the legacy statement's own unchecked
        // `as { user_id: number }` cast): `journey_trips` cascades on the
        // owning journey's delete, so a linked journey can never be missing.
        const ownerId = (await this.journeysRepo.findOwnerId(journeyId)) as number;

        for (const place of assignments) {
          const already = await this.entriesRepo.existsForPlaceAssignment(journeyId, placeId, place.assignment_id ?? null);
          if (already) continue;

          const entryDate = place.day_date as string;
          const maxOrder = await this.entriesRepo.maxSortOrderForDate(journeyId, entryDate);
          const nextOrder = (maxOrder ?? -1) + 1;

          await this.insertSkeletonEntry({
            journeyId,
            tripId,
            placeId,
            assignmentId: place.assignment_id ?? null,
            authorId: ownerId,
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
    });
  }

  // called when a trip place is updated
  async onPlaceUpdated(placeId: number) {
    const entries = await this.entriesRepo.listBySourcePlace(placeId);
    if (!entries.length) return;

    // JG44 — `SELECT * FROM places WHERE id = ?`. Task 1 left this raw
    // (`Places.repository.ts` was outside its named file set); this task's
    // ONE append to that file (`PlacesRepository.findRaw`) finishes it.
    const place = await this.placesRepo.findRaw(placeId);
    if (!place) return;

    // Every day this place stands on, so each entry can follow its own rather
    // than all of them collapsing onto whichever assignment the join returned
    // first (#2329).
    const assignments = await this.journeyTripsRepo.listAssignmentTimesForPlace(placeId);
    const byAssignment = new Map(assignments.map((a) => [a.assignment_id, a]));
    const assignmentFor = (entry: JourneyEntry) =>
      (entry.source_assignment_id != null ? byAssignment.get(entry.source_assignment_id) : undefined) ?? assignments[0];

    const now = this.ts();
    for (const entry of entries) {
      const assignment = assignmentFor(entry);
      if (entry.type === 'skeleton') {
        // update everything on skeletons
        await this.entriesRepo.updateSkeletonSnapshot(entry.id, {
          title: place.name,
          entry_date: assignment?.day_date || entry.entry_date,
          entry_time: assignment?.assignment_time || place.place_time || entry.entry_time,
          location_name: place.address || place.name,
          location_lat: place.lat || null,
          location_lng: place.lng || null,
          // The pin moved, so the flag has to follow it — the same rule updateEntry
          // states, and the one every sync write here used to skip.
          country_code: this.countryFor(place.lat ?? null, place.lng ?? null),
          updated_at: now,
        });
      } else {
        // for filled entries, only update location silently
        await this.entriesRepo.updateLocationOnly(entry.id, {
          location_name: place.address || place.name,
          location_lat: place.lat || null,
          location_lng: place.lng || null,
          country_code: this.countryFor(place.lat ?? null, place.lng ?? null),
          updated_at: now,
        });
      }
    }
  }

  // called when a trip place is deleted
  async onPlaceDeleted(placeId: number) {
    const entries = await this.entriesRepo.listBySourcePlace(placeId);

    for (const entry of entries) {
      if (entry.type === 'skeleton') {
        // no content: just delete
        const hasPhotos = await this.entriesRepo.existsPhotoForEntry(entry.id);
        if (!hasPhotos && !entry.story) {
          await this.entriesRepo.deleteById(entry.id);
          continue;
        }
      }
      // entry has content: keep it, detach, add note
      const note = '\n\n> _Note: the original trip place was removed from the trip plan_';
      const newStory = (entry.story || '') + note;
      await this.entriesRepo.detachAndAnnotate(entry.id, {
        type: entry.type === 'skeleton' ? 'entry' : entry.type,
        story: newStory,
        updated_at: this.ts(),
      });
    }
  }

  // Shared skeleton INSERT, reused by syncTripPlaces / onPlaceCreated / reconcileTripSkeletons.
  /**
   * The country a pair of coordinates falls in, or null when there is no pair.
   *
   * Bundled polygons, no network: the timeline card wants a flag, and a flag is
   * not worth a geocoding request per entry. Wrapped because the boundary data is
   * an optional asset — an install without it should lose the flag, not the save.
   */
  private countryFor(lat: number | null | undefined, lng: number | null | undefined): string | null {
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    try {
      return getCountryFromCoords(lat, lng);
    } catch {
      return null;
    }
  }

  private async insertSkeletonEntry(p: {
    journeyId: number;
    tripId: number;
    placeId: number;
    assignmentId: number | null;
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
    await this.entriesRepo.insertSkeleton({
      journey_id: p.journeyId,
      source_trip_id: p.tripId,
      source_place_id: p.placeId,
      source_assignment_id: p.assignmentId,
      author_id: p.authorId,
      title: p.title,
      entry_date: p.entryDate,
      entry_time: p.entryTime,
      location_name: p.locationName,
      location_lat: p.lat,
      location_lng: p.lng,
      country_code: this.countryFor(p.lat, p.lng),
      sort_order: p.sortOrder,
      created_at: p.now,
      updated_at: p.now,
    });
  }

  // Make every journey linked to `tripId` mirror the trip's current day assignments:
  // one skeleton per assignment, so a place standing on two days is two entries (#2329);
  // refresh skeleton snapshots when a stop is moved to another day / its time changes;
  // and drop skeletons whose assignment is gone. Filled entries are never destroyed —
  // only detached + annotated, mirroring onPlaceDeleted. Idempotent: a second call with
  // no underlying change is a no-op (no writes, no broadcast). Called from every
  // assignment mutation path.
  async reconcileTripSkeletons(tripId: number, sid?: string | number) {
    const links = await this.journeyTripsRepo.listJourneyIdsForTrip(tripId);
    if (!links.length) return;

    // JG53 — a variant of JG34 sharing `listAssignedPlacesForTrip` (see that
    // method's docstring: the two extra columns JG53's raw text carried
    // beyond JG34's, `order_index`/no `assignment_end_time`, are never read
    // as JS fields by either caller, only used inside each legacy
    // statement's own ORDER BY — already reproduced by the method's
    // `.orderBy(...)` calls).
    const places = await this.journeyTripsRepo.listAssignedPlacesForTrip(tripId);

    // One skeleton per assignment, not per place: a stop kept across two days is
    // two days of the journal (#2329).
    const assignedKeys = new Set(places.map((p) => skeletonKey(p.id, p.assignment_id)));
    const assignedPlaceIds = new Set<number>(places.map((p) => p.id));

    const now = this.ts();
    for (const journeyId of links) {
      // M2 (rule 11/24) — the existence read (`listForTripReconcile`) and the
      // upsert/delete writes below are separate awaits, so two concurrent
      // reconciles for the same trip (or a reconcile racing `onPlaceCreated`)
      // could both read "not there yet" and both insert. Wrapped whole per
      // journey: every statement inside is DB-only, and the mutex serializes
      // a second caller's statements behind this one until it commits — the
      // broadcast (non-DB I/O) stays outside, after commit, per rule 24.
      const changed = await this.uow.transactional(async () => {
        const ownerId = await this.journeysRepo.findOwnerId(journeyId);
        if (ownerId === undefined) return false;

        let didChange = false;
        // JG55 — a wider column set than JG35 (`listSourceKeysForTrip`), not a dup.
        const existing = await this.entriesRepo.listForTripReconcile(journeyId, tripId);
        const existingByKey = new Map<string, (typeof existing)[number]>();
        // Rows from before the assignment link existed, and any the backfill could not
        // resolve. The place's earliest assignment claims one below, rather than the row
        // being read as "no longer in the plan" and annotated out from under its author.
        const unclaimed = new Map<number, (typeof existing)[number][]>();
        for (const e of existing) {
          if (e.source_place_id == null) continue;
          if (e.source_assignment_id == null) {
            const pool = unclaimed.get(e.source_place_id);
            if (pool) pool.push(e);
            else unclaimed.set(e.source_place_id, [e]);
          } else {
            existingByKey.set(skeletonKey(e.source_place_id, e.source_assignment_id), e);
          }
        }

        // Next sort_order per date for freshly inserted skeletons.
        const dateMaxOrder = new Map<string, number>();
        const maxRows = await this.entriesRepo.dateSortOrderMaxima(journeyId);
        for (const row of maxRows) dateMaxOrder.set(row.entry_date, row.m);

        // 1) Upsert a skeleton for every current day assignment.
        for (const place of places) {
          const entryDate = place.day_date || new Date().toISOString().split('T')[0];
          const entryTime = place.assignment_time || place.place_time || null;
          const locationName = place.address || place.name;
          const lat = place.lat || null;
          const lng = place.lng || null;
          let found = existingByKey.get(skeletonKey(place.id, place.assignment_id));

          if (!found) {
            // `places` is ordered by day, so the earliest assignment claims it.
            const adopted = unclaimed.get(place.id)?.shift();
            if (adopted) {
              await this.entriesRepo.claimAssignment(adopted.id, place.assignment_id ?? null);
              adopted.source_assignment_id = place.assignment_id ?? null;
              existingByKey.set(skeletonKey(place.id, place.assignment_id), adopted);
              found = adopted;
            }
          }

          if (!found) {
            const nextOrder = (dateMaxOrder.get(entryDate) ?? -1) + 1;
            dateMaxOrder.set(entryDate, nextOrder);
            await this.insertSkeletonEntry({
              journeyId,
              tripId,
              placeId: place.id,
              assignmentId: place.assignment_id ?? null,
              authorId: ownerId,
              title: place.name,
              entryDate,
              entryTime,
              locationName,
              lat,
              lng,
              sortOrder: nextOrder,
              now,
            });
            didChange = true;
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
              await this.entriesRepo.updateSkeletonSnapshot(found.id, {
                title: place.name,
                entry_date: entryDate,
                entry_time: entryTime,
                location_name: locationName,
                location_lat: lat,
                location_lng: lng,
                country_code: this.countryFor(lat, lng),
                updated_at: now,
              });
              didChange = true;
            }
          } else {
            // Filled entries keep the user's date/story; only location follows the place.
            const stale =
              found.location_name !== locationName || found.location_lat !== lat || found.location_lng !== lng;
            if (stale) {
              await this.entriesRepo.updateLocationOnly(found.id, {
                location_name: locationName,
                location_lat: lat,
                location_lng: lng,
                country_code: this.countryFor(lat, lng),
                updated_at: now,
              });
              didChange = true;
            }
          }
        }

        // 2) Drop skeletons whose assignment is gone. One still waiting to be claimed is
        //    spared while its place is on the plan somewhere: having no link yet is not
        //    the same as the stop having left.
        for (const e of existing) {
          if (e.source_place_id == null) continue;
          if (e.source_assignment_id == null && assignedPlaceIds.has(e.source_place_id)) continue;
          if (e.source_assignment_id != null && assignedKeys.has(skeletonKey(e.source_place_id, e.source_assignment_id))) {
            continue;
          }
          if (e.type === 'skeleton') {
            const hasPhotos = await this.entriesRepo.existsPhotoForEntry(e.id);
            if (!hasPhotos && !e.story) {
              await this.entriesRepo.deleteById(e.id);
              didChange = true;
              continue;
            }
          }
          const note = '\n\n> _Note: the original trip place was removed from the trip plan_';
          const newStory = (e.story || '') + note;
          await this.entriesRepo.detachAndAnnotate(e.id, {
            type: e.type === 'skeleton' ? 'entry' : e.type,
            story: newStory,
            updated_at: now,
          });
          didChange = true;
        }

        return didChange;
      });

      if (changed) await this.broadcastJourneyEvent(journeyId, 'journey:trip:synced', { tripId }, sid);
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
  async journeyTracks(journeyId: number, userId: number): Promise<JourneyTrack[] | null> {
    if (!(await this.canAccessJourney(journeyId, userId))) return null;

    const rows = await this.entriesRepo.listTracksSource(journeyId);

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
   *
   * ── Stops switched off ─────────────────────────────────────────────────
   *
   * An entry marked `stats_excluded` is in the journal and in nothing here:
   * not on the route, not in the distance, not a step, not a country
   * (discussion #2064). It is still named, under `excluded`, because the only
   * way to switch a stop back on is to be able to see it.
   */
  async journeyStats(journeyId: number, userId: number): Promise<JourneyStats | null> {
    if (!(await this.canAccessJourney(journeyId, userId))) return null;

    // JG64 — a narrow projection, read directly off HEAD rather than the
    // inventory's stale "same text as JG14" annotation (see
    // `JourneyEntriesRepository.listStatsRows`'s own docstring).
    const entryRows = await this.entriesRepo.listStatsRows(journeyId);

    /*
     * The trips themselves, named and dated.
     *
     * Ordered by the trip's own start date: `journey_trips` had a `sort_order`
     * for one migration and has not had one since 87, so the link row carries
     * no order to read. Undated trips sort last rather than first, where an
     * empty string would otherwise put them.
     */
    const tripRows = await this.entriesRepo.listStatsTrips(journeyId);

    const tripDates = tripRows.map(t => ({ start: t.start, end: t.end }));

    // Ordered the way the trip is walked: by day, then by the order within it.
    // A place can be assigned to more than one day (a hotel across three nights
    // is one place, three assignments), so the join is aggregated back down to
    // one row per place at its earliest day — otherwise the route would visit
    // the hotel three times and the distance would count those legs.
    const placeRows = await this.entriesRepo.listStatsPlaces(journeyId);

    const placeCountN = await this.entriesRepo.countStatsPlaces(journeyId);

    const photoCountN = await this.photosRepo.countForJourney(journeyId);

    /*
     * ── A photograph per stop, for a map that marks them with pictures ───
     *
     * The truthful source is the junction: the photos somebody actually
     * attached to that entry, earliest first, videos excluded because a video
     * poster inside a four-millimetre circle is not a photograph.
     */
    const entryPhotoRows = await this.entryPhotosRepo.listFirstPhotoPerEntry(journeyId);

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
    // JG70 — chunked in groups of 400 inside the repository method (SQLite's
    // bound-variable-count limit is why it's chunked at all).
    const cachedCountry = new Map<number, string>();
    const placeIds = placeRows.map(p => p.id);
    const cachedCountryRows = await this.entriesRepo.listCachedCountriesForPlaceIds(placeIds);
    for (const r of cachedCountryRows) if (r.country_code) cachedCountry.set(r.place_id, r.country_code.toUpperCase());

    const countryAt = (lat: number, lng: number, placeId?: number): string | null => {
      if (placeId != null) {
        const cached = cachedCountry.get(placeId);
        if (cached) return cached;
      }
      return getCountryFromCoords(lat, lng);
    };

    /*
     * The switch is honoured before anything is measured, on both routes.
     *
     * Only an entry with coordinates is listed under `excluded`: one without
     * a place was never a stop, and offering to switch it back on would offer
     * a stop that does not exist. It still stops being a step, because the
     * traveller said it does not count.
     *
     * The fallback has to honour it too. A skeleton is the entry TREK derives
     * from a trip place, so switching the skeleton off and then drawing the
     * place it came from would put the same stop straight back on the map
     * under its other name. Hence the set of places to leave out.
     */
    const hasCoords = (e: { location_lat: number | null; location_lng: number | null }) =>
      Number.isFinite(e.location_lat) && Number.isFinite(e.location_lng);
    const counting = entryRows.filter(e => !e.stats_excluded);
    const excluded = entryRows
      .filter(e => e.stats_excluded && hasCoords(e))
      .map(e => ({ entryId: e.id, label: e.title || e.location_name || '', date: e.entry_date ?? null }));
    const excludedPlaceIds = new Set(
      entryRows
        .filter(e => e.stats_excluded && e.source_place_id != null)
        .map(e => e.source_place_id as number),
    );

    const fromEntries: StatsInputPoint[] = counting
      .filter(hasCoords)
      .map(e => ({
        lat: e.location_lat as number,
        lng: e.location_lng as number,
        label: e.title || e.location_name || '',
        date: e.entry_date ?? null,
        country: countryAt(e.location_lat as number, e.location_lng as number),
        tripId: e.source_trip_id ?? null,
        photoId: photoByEntry.get(e.id) ?? null,
        entryId: e.id,
      }));

    /*
     * Which source wins is decided before the switches, not after.
     *
     * `fromEntries.length` was the test, and with a switch in the world it
     * answers the wrong question: a journey whose every stop has been switched
     * off has no entry points left, so the fallback would draw the trip's
     * places instead and put the whole route back under other names. The
     * journal is the source as soon as one entry carries a point, whether or
     * not it still counts.
     */
    const journalHasPoints = entryRows.some(hasCoords);
    const points: StatsInputPoint[] = journalHasPoints
      ? fromEntries
      : placeRows
        .filter(p => !excludedPlaceIds.has(p.id) && Number.isFinite(p.lat) && Number.isFinite(p.lng))
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
          // No entry to switch off, so a panel lists it and offers no switch.
          entryId: null,
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
      entries: counting.length,
      photos: photoCountN,
      // A place whose skeleton was switched off is not a place the journey
      // went to, whichever route drew it.
      places: placeCountN - placeRows.filter(p => excludedPlaceIds.has(p.id)).length,
      tripDates,
      countryNames: countryNamesFor(points),
      trips: tripRows.map(t => ({
        id: t.id,
        title: t.title || '',
        start: t.start,
        end: t.end,
        points: perTrip.get(t.id) ?? 0,
      })),
      excluded,
    });
  }

  async listEntries(journeyId: number, userId: number) {
    if (!(await this.canAccessJourney(journeyId, userId))) return null;

    // JG71 — same text as JG14, reused via `listForJourney`.
    const entries = await this.entriesRepo.listForJourney(journeyId);

    // JG72 — same JP_SELECT/JP_JOIN composite as JG15 (`getJourneyFull`).
    const photos = await this.entryPhotosRepo.listForJourney(journeyId);

    const photosByEntry: Record<number, JourneyPhoto[]> = {};
    for (const p of photos) {
      (photosByEntry[p.entry_id] ||= []).push(p);
    }

    // JG73 — same N+1-by-design shape as JG16, reusing `TripsRepository.getTitle`.
    return await Promise.all(
      entries.map(async (e) => ({
        ...decodeEntryRow(e),
        photos: photosByEntry[e.id] || [],
        source_trip_name: e.source_trip_id ? await this.tripsRepo.getTitle(e.source_trip_id) : null,
      })),
    );
  }

  async createEntry(
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
      is_draft?: boolean;
    },
    sid?: string,
  ): Promise<JourneyEntryWire | null> {
    if (!(await this.canEdit(journeyId, userId))) return null;

    const now = this.ts();
    // JG74 — same text as JG42 (`maxSortOrderForDate`).
    const maxOrder = await this.entriesRepo.maxSortOrderForDate(journeyId, data.entry_date);

    const prosConsJson =
      data.pros_cons && (data.pros_cons.pros.length || data.pros_cons.cons.length)
        ? JSON.stringify(data.pros_cons)
        : null;

    const insertedId = await this.entriesRepo.insertEntry({
      journey_id: journeyId,
      author_id: userId,
      type: data.type || 'entry',
      title: data.title || null,
      story: data.story || null,
      entry_date: data.entry_date,
      entry_time: data.entry_time || null,
      location_name: data.location_name || null,
      location_lat: data.location_lat ?? null,
      location_lng: data.location_lng ?? null,
      country_code: this.countryFor(data.location_lat, data.location_lng),
      mood: data.mood || null,
      weather: data.weather || null,
      tags: data.tags?.length ? JSON.stringify(data.tags) : null,
      pros_cons: prosConsJson,
      visibility: data.visibility || 'private',
      sort_order: (maxOrder ?? -1) + 1,
      is_draft: data.is_draft ? 1 : 0,
      created_at: now,
      updated_at: now,
    });

    const created = decodeEntryRow((await this.entriesRepo.findById(insertedId)) as JourneyEntry);
    await this.broadcastJourneyEvent(journeyId, 'journey:entry:created', { entry: created }, sid);
    return created;
  }

  async updateEntry(
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
      stats_excluded: boolean;
      dismissed: boolean;
      is_draft: boolean;
    }>,
    sid?: string,
  ): Promise<JourneyEntryWire | null> {
    // JG77 — same text as JG76.
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) return null;
    if (!(await this.canEdit(entry.journey_id, userId))) return null;

    // JG78 — R6's `presenceSet` conversion, the SECOND consumer of this
    // pattern (JG24's `updateJourney`, Task 1's, is the first — same shape,
    // not re-derived). The SERVICE resolves every field to its final bound
    // value first: `tags`/`pros_cons` JSON-encoded, `stats_excluded`/
    // `dismissed` boolean-coerced to 0/1 (better-sqlite3 refuses a JS
    // boolean bind), `country_code` recomputed whenever EITHER half of the
    // lat/lng pair is present in the patch — including when explicitly
    // `null`, which means "take this entry off the map" and must clear the
    // country rather than fall back to the old one, hence `!== undefined`,
    // never `??` — before handing any of it to the repository.
    //
    // The skeleton→entry promotion preserves a real legacy nuance: the
    // original dynamic-SET-list pushed a SECOND `type = ?` binding when a
    // story was added to a skeleton, even when the caller's own `data.type`
    // had already pushed one — SQLite's `SET col = a, col = b` keeps the
    // LAST assignment, so the promotion always won over an explicit
    // `data.type` whenever both applied. `presenceSet` takes one value per
    // key, so that "last one wins" resolution happens here instead, in the
    // same effective order the legacy statement's own field list built it.
    const promoteToEntry = entry.type === 'skeleton' && !!data.story && data.story.trim().length > 0;
    const patch = presenceSet<{
      type: string;
      title: string | null;
      story: string | null;
      entry_date: string;
      entry_time: string | null;
      location_name: string | null;
      location_lat: number | null;
      location_lng: number | null;
      mood: string | null;
      weather: string | null;
      tags: string | null;
      pros_cons: string | null;
      visibility: string;
      sort_order: number;
      stats_excluded: number;
      dismissed: number;
      is_draft: number;
      country_code: string | null;
      updated_at: number;
    }>({
      type: [data.type !== undefined || promoteToEntry, promoteToEntry ? 'entry' : (data.type as string)],
      title: [data.title !== undefined, data.title as string],
      story: [data.story !== undefined, data.story as string],
      entry_date: [data.entry_date !== undefined, data.entry_date as string],
      entry_time: [data.entry_time !== undefined, data.entry_time as string],
      location_name: [data.location_name !== undefined, data.location_name as string],
      location_lat: [data.location_lat !== undefined, data.location_lat as number | null],
      location_lng: [data.location_lng !== undefined, data.location_lng as number | null],
      mood: [data.mood !== undefined, data.mood as string],
      weather: [data.weather !== undefined, data.weather as string],
      // `Array.isArray(val) ? JSON.stringify(val) : val` (legacy) — a caller
      // sending `tags: null`/`pros_cons: null` explicitly (to CLEAR the
      // field, not touch it) must write SQL NULL, not the JSON string
      // `"null"` (`JSON.stringify(null)`) — caught live by
      // `tools-journey.test.ts`'s own "clears a field on null" case.
      tags: [data.tags !== undefined, Array.isArray(data.tags) ? JSON.stringify(data.tags) : null],
      pros_cons: [data.pros_cons !== undefined, data.pros_cons && typeof data.pros_cons === 'object' ? JSON.stringify(data.pros_cons) : null],
      visibility: [data.visibility !== undefined, data.visibility as string],
      sort_order: [data.sort_order !== undefined, data.sort_order as number],
      stats_excluded: [data.stats_excluded !== undefined, data.stats_excluded ? 1 : 0],
      dismissed: [data.dismissed !== undefined, data.dismissed ? 1 : 0],
      is_draft: [data.is_draft !== undefined, data.is_draft ? 1 : 0],
      country_code: [
        data.location_lat !== undefined || data.location_lng !== undefined,
        this.countryFor(
          data.location_lat !== undefined ? data.location_lat : entry.location_lat,
          data.location_lng !== undefined ? data.location_lng : entry.location_lng,
        ),
      ],
      updated_at: [true, this.ts()],
    });

    // M3 (parity) — the legacy no-op check (`fields.length === 0`) fires
    // exactly when NO allow-listed key made it into the dynamic SET list.
    // `Object.values(data).some(v => v !== undefined)` is the WRONG mirror
    // of that: `data` is `journeyEntryUpdateRequestSchema`'s `z.looseObject`,
    // so a PATCH body carrying only non-allow-listed keys (`{"foo":1}`) has
    // a defined value there and this used to write and broadcast anyway.
    // `patch` (built above by `presenceSet`) always carries `updated_at`
    // unconditionally, so its length is 1 exactly when nothing allow-listed
    // was provided — the same condition the legacy field-count check tested.
    if (Object.keys(patch).length === 1) return decodeEntryRow(entry);

    await this.entriesRepo.updateFields(entryId, patch);

    // touch the journey
    await this.journeysRepo.updateFields(entry.journey_id, { updated_at: this.ts() });

    // JG80 — same text as JG76.
    const updated = decodeEntryRow((await this.entriesRepo.findById(entryId)) as JourneyEntry);
    await this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:updated', { entry: updated }, sid);
    return updated;
  }

  // Reorder entries (typically within a single day). Caller passes the new
  // desired order of ids; each entry's sort_order is set to its index in the
  // array. Only entries owned by this journey are accepted.
  async reorderEntries(journeyId: number, userId: number, orderedIds: number[], sid?: string): Promise<boolean> {
    if (!(await this.canEdit(journeyId, userId))) return false;
    if (!orderedIds.length) return true;

    // JG81 — ownership verification.
    const matchedIds = await this.entriesRepo.listIdsIn(journeyId, orderedIds);
    if (matchedIds.length !== orderedIds.length) return false;

    const now = this.ts();
    // JG82/JG83 (the fourth `uow.transactional` block) — the legacy
    // statement prepared ONCE and reused across the loop; the repository
    // layer has no direct "one prepared statement, many binds" equivalent,
    // so this issues one `nativeUpdate` per id instead (a judgment call per
    // the task brief) — still one write per id, still inside the SAME
    // transaction, still walked in the caller's own `orderedIds` array
    // order (which has no OBSERVABLE effect on the final row state, only on
    // the write order/SQL trace).
    await this.uow.transactional(async () => {
      for (const [index, id] of orderedIds.entries()) {
        await this.entriesRepo.updateSortOrder(id, index, now);
      }
      await this.journeysRepo.updateFields(journeyId, { updated_at: now });
    });

    await this.broadcastJourneyEvent(journeyId, 'journey:entries:reordered', { orderedIds }, sid);
    return true;
  }

  /**
   * The photos of one entry in a new order (#824), in one transaction. The list has
   * to be exactly the entry's photos, each once, so a stale or foreign id cannot
   * slip in. The order is kept on this entry's own links: a photo that also sits on
   * another entry keeps its place there.
   */
  async reorderEntryPhotos(entryId: number, userId: number, orderedIds: number[], sid?: string): Promise<boolean> {
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry || !(await this.canEdit(entry.journey_id, userId))) return false;
    const held = await this.entryPhotosRepo.listPhotoIdsForEntry(entryId); // JG126
    const asked = new Set(orderedIds);
    if (asked.size !== orderedIds.length || held.length !== orderedIds.length || held.some(id => !asked.has(id))) return false;

    const now = this.ts();
    await this.uow.transactional(async () => {
      for (const [index, id] of orderedIds.entries()) {
        await this.entryPhotosRepo.updateEntryLinkSortOrder(entryId, id, index); // JG127
      }
      await this.entriesRepo.updateFields(entryId, { updated_at: now }); // JG78 reused: UPDATE journey_entries SET updated_at = ? WHERE id = ?
    });
    const updated = decodeEntryRow((await this.entriesRepo.findById(entryId)) as JourneyEntry);
    await this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:updated', { entry: updated }, sid);
    return true;
  }

  async deleteEntry(entryId: number, userId: number, sid?: string): Promise<boolean> {
    // JG84 — same text as JG76.
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) return false;
    if (!(await this.canEdit(entry.journey_id, userId))) return false;

    if (entry.source_trip_id && entry.source_place_id && entry.type !== 'skeleton') {
      // JG85 — revert filled entry back to skeleton instead of deleting.
      await this.entriesRepo.revertToSkeleton(entryId, this.ts());
      await this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:updated', { entryId }, sid);
    } else {
      // JG86 — same text as JG50/JG61, the true hard delete.
      await this.entriesRepo.deleteById(entryId);
      await this.broadcastJourneyEvent(entry.journey_id, 'journey:entry:deleted', { entryId }, sid);
    }

    return true;
  }

  // ── Photos ───────────────────────────────────────────────────────────────

  /**
   * The journey an entry belongs to, or null when there is no such entry.
   *
   * No access check: it answers for a caller that has already added photos to
   * the entry, and only decides which journey hears about their capture times.
   */
  async journeyIdOfEntry(entryId: number): Promise<number | null> {
    const row = await this.entriesRepo.findById(entryId);
    return row?.journey_id ?? null;
  }

  // Promote a skeleton suggestion to a concrete entry. Called whenever the user
  // adds content (photo upload, provider photo, gallery link) — a suggestion
  // with photos is no longer just a suggestion.
  private async promoteSkeletonIfNeeded(entry: JourneyEntry): Promise<void> {
    if (entry.type !== 'skeleton') return;
    // JG87
    await this.entriesRepo.markAsEntry(entry.id, this.ts());
  }

  // Ensure a trek_photo_id is in the journey gallery; return its gallery row id.
  private async ensureInGallery(journeyId: number, trekPhotoId: number, caption?: string, shared?: number): Promise<number> {
    const now = this.ts();
    // JG88 — same text as JG99.
    const maxOrder = await this.photosRepo.maxSortOrder(journeyId);
    // JG89
    await this.photosRepo.insertIgnore({
      journey_id: journeyId,
      photo_id: trekPhotoId,
      caption: caption || null,
      shared: shared ?? 0,
      sort_order: (maxOrder ?? -1) + 1,
      created_at: now,
    });
    // JG90
    const id = await this.photosRepo.findIdByJourneyAndPhoto(journeyId, trekPhotoId);
    return id as number;
  }

  // Link a gallery photo to an entry (idempotent). Returns the junction JP_SELECT row.
  private async linkGalleryPhotoToEntry(galleryId: number, entryId: number): Promise<JourneyPhoto | null> {
    const now = this.ts();
    // JG91
    const maxOrder = await this.entryPhotosRepo.maxSortOrderForEntry(entryId);
    // JG92 — R3's composite-PK upsert, checked against Task 1's
    // `JourneyTripsRepository.insertIgnore` reference (the IGNORE-shaped
    // one — `JourneyContributorsRepository.upsertContributor` is R3's OTHER
    // reference, but it is MERGE-shaped, for JG117; see `task-2-report.md`).
    await this.entryPhotosRepo.insertIgnore(entryId, galleryId, (maxOrder ?? -1) + 1, now);
    // JG93
    return (await this.entryPhotosRepo.findLink(entryId, galleryId)) ?? null;
  }

  /**
   * Attach an uploaded file to an entry.
   *
   * `media` carries what a clip needs beyond a picture: the type, so the viewer
   * plays it instead of trying to draw it, and the duration the browser measured
   * while it took the poster frame. The gallery route has taken both since #823;
   * the entry route could not, which is why a video dropped on an entry came
   * back as a 400 (issue #2341).
   */
  async addPhoto(
    entryId: number,
    userId: number,
    filePath: string,
    thumbnailPath?: string,
    caption?: string,
    media?: { mediaType?: string; durationMs?: number | null },
  ): Promise<JourneyPhoto | null> {
    // JG94 — same text as JG76.
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) return null;
    if (!(await this.canEdit(entry.journey_id, userId))) return null;

    const trekPhotoId = await this.photos.getOrCreateLocal(
      filePath,
      thumbnailPath,
      null,
      null,
      media?.mediaType || 'image',
      media?.durationMs ?? null,
    );
    // JG-TX1 — wraps ONLY the gallery-ensure step; `linkGalleryPhotoToEntry`
    // and `promoteSkeletonIfNeeded` run OUTSIDE the transaction, exactly as
    // the legacy code shipped it (the boundary looks inconsistent but
    // parity is law — not widened here, same for JG-TX2/JG-TX3 below).
    const galleryId = await this.uow.transactional(async () => await this.ensureInGallery(entry.journey_id, trekPhotoId, caption));
    const result = await this.linkGalleryPhotoToEntry(galleryId, entryId);
    await this.promoteSkeletonIfNeeded(entry);
    return result;
  }

  async addProviderPhoto(
    entryId: number,
    userId: number,
    provider: string,
    assetId: string,
    caption?: string,
    passphrase?: string,
    mediaType: string = 'image',
  ): Promise<JourneyPhoto | null> {
    // JG95 — same text as JG76.
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) return null;
    if (!(await this.canEdit(entry.journey_id, userId))) return null;

    const trekPhotoId = await this.photos.getOrCreate(provider, assetId, userId, passphrase, mediaType);

    // JG96 — skip if this photo is already linked to this entry.
    const alreadyLinked = await this.entryPhotosRepo.existsLink(entryId, trekPhotoId);
    if (alreadyLinked) return null;

    // JG-TX2
    const galleryId = await this.uow.transactional(async () => await this.ensureInGallery(entry.journey_id, trekPhotoId, caption));
    const result = await this.linkGalleryPhotoToEntry(galleryId, entryId);
    await this.promoteSkeletonIfNeeded(entry);
    return result;
  }

  // Link a gallery photo (by its journey_photos.id) to an entry — idempotent.
  async linkPhotoToEntry(entryId: number, journeyPhotoId: number, userId: number): Promise<JourneyPhoto | null> {
    // JG97 — same text as JG76.
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) return null;
    if (!(await this.canEdit(entry.journey_id, userId))) return null;

    // JG98 — verify the gallery photo belongs to this journey.
    const galleryRow = await this.photosRepo.findScopeById(journeyPhotoId);
    if (!galleryRow || galleryRow.journey_id !== entry.journey_id) return null;

    const result = await this.linkGalleryPhotoToEntry(galleryRow.id, entryId);
    await this.promoteSkeletonIfNeeded(entry);
    return result;
  }

  // Upload photos to the journey gallery only (no entry association).
  async uploadGalleryPhotos(
    journeyId: number,
    userId: number,
    filePaths: { path: string; thumbnail?: string; mediaType?: string; durationMs?: number | null }[],
  ): Promise<GalleryPhoto[]> {
    if (!(await this.canEdit(journeyId, userId))) return [];
    const results: GalleryPhoto[] = [];
    const now = this.ts();
    // JG99 — same text as JG88.
    const maxOrder = await this.photosRepo.maxSortOrder(journeyId);
    let nextOrder = (maxOrder ?? -1) + 1;

    for (const f of filePaths) {
      const trekPhotoId = await this.photos.getOrCreateLocal(f.path, f.thumbnail, null, null, f.mediaType || 'image', f.durationMs ?? null);
      // JG100 — the 5-column `INSERT OR IGNORE` variant (no `caption`),
      // distinct text from JG89 but the SAME repository method (`INSERT OR
      // IGNORE` never touches an existing row, so passing `caption: null`
      // here is equivalent).
      await this.photosRepo.insertIgnore({
        journey_id: journeyId,
        photo_id: trekPhotoId,
        caption: null,
        shared: 0,
        sort_order: nextOrder++,
        created_at: now,
      });
      // JG101
      const row = await this.photosRepo.galleryReadByJourneyAndPhoto(journeyId, trekPhotoId);
      if (row) results.push(row);
    }
    return results;
  }

  // Add a provider photo to the gallery only (no entry link).
  async addProviderPhotoToGallery(
    journeyId: number,
    userId: number,
    provider: string,
    assetId: string,
    caption?: string,
    passphrase?: string,
    mediaType: string = 'image',
  ): Promise<GalleryPhoto | null> {
    if (!(await this.canEdit(journeyId, userId))) return null;
    const trekPhotoId = await this.photos.getOrCreate(provider, assetId, userId, passphrase, mediaType);
    // JG-TX3
    const galleryId = await this.uow.transactional(async () => await this.ensureInGallery(journeyId, trekPhotoId, caption));
    // JG102
    return (await this.photosRepo.galleryReadOne(galleryId)) ?? null;
  }

  // Unlink a photo from a specific entry; gallery row is preserved.
  async unlinkPhotoFromEntry(entryId: number, journeyPhotoId: number, userId: number): Promise<boolean> {
    // JG103 — same text as JG76.
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) return false;
    if (!(await this.canEdit(entry.journey_id, userId))) return false;

    // JG104
    const changed = await this.entryPhotosRepo.deleteLink(entryId, journeyPhotoId);
    return changed > 0;
  }

  // Hard-delete a gallery photo (removes from all entries and the gallery).
  async deleteGalleryPhoto(
    journeyPhotoId: number,
    userId: number,
  ): Promise<{ photo_id: number; file_path?: string | null; thumbnail_path?: string | null } | null> {
    // JG105
    const row = await this.photosRepo.findFull(journeyPhotoId);
    if (!row) return null;
    if (!(await this.canEdit(row.journey_id, userId))) return null;

    // JG106 — reuses `TrekPhotoRegistrationService.resolve` (PH6, already
    // 3e-converted), the full `trek_photos` row this method only reads three
    // columns off.
    const trekRow = await this.photos.resolve(row.photo_id);

    // JG107 — cascade on journey_entry_photos.journey_photo_id handles junction cleanup.
    await this.photosRepo.deleteById(journeyPhotoId);
    await this.photos.deleteIfOrphan(row.photo_id);

    return { photo_id: row.photo_id, file_path: trekRow?.file_path ?? null, thumbnail_path: trekRow?.thumbnail_path ?? null };
  }

  async setPhotoProvider(photoId: number, provider: string, assetId: string, ownerId: number) {
    // photoId = journey_photos.id (gallery row); look up the trek_photo_id.
    // JG108
    const trekPhotoId = await this.photosRepo.findPhotoIdById(photoId);
    if (trekPhotoId === undefined) return;
    await this.photos.setProvider(trekPhotoId, provider, assetId, ownerId);
    // JG109 — also denorm on gallery row for fast reads. §7: a DELIBERATE
    // cache of `trek_photos`'s own columns, preserved exactly.
    await this.photosRepo.updateProvider(photoId, provider, assetId, ownerId);
  }

  async updatePhoto(
    photoId: number,
    userId: number,
    data: { caption?: string; sort_order?: number },
  ): Promise<JourneyPhoto | null> {
    // photoId = journey_photos.id (gallery row)
    // JG110 — same text as JG98.
    const row = await this.photosRepo.findScopeById(photoId);
    if (!row) return null;
    if (!(await this.canEdit(row.journey_id, userId))) return null;

    // JG111/JG112 — caption lives on the gallery row (`journey_photos`);
    // sort_order lives on the JUNCTION table (`journey_entry_photos`, NOT
    // `journey_photos` — the JP_SELECT the caller reads back projects
    // `jep.sort_order`, so writing `journey_photos.sort_order` would never
    // be reflected in the returned row). Two DIFFERENT tables for two
    // DIFFERENT columns both named-ish "sort order" — the file's own doc
    // comment calls this out explicitly, and it gets its own mutation-proof
    // test (`journey-domain.service.test.ts`).
    if (data.caption !== undefined) {
      await this.photosRepo.updateCaption(photoId, data.caption);
    }
    if (data.sort_order !== undefined) {
      await this.entryPhotosRepo.updateSortOrder(photoId, data.sort_order);
    }
    // JG113
    return (await this.entryPhotosRepo.findOneByGalleryId(photoId)) ?? null;
  }

  // deletePhoto: hard-delete (backwards compat name used by old route).
  async deletePhoto(
    photoId: number,
    userId: number,
  ): Promise<{ id: number; photo_id: number; file_path?: string | null; thumbnail_path?: string | null; journey_id: number } | null> {
    // JG114
    const row = await this.photosRepo.findScopeWithPhotoId(photoId);
    if (!row) return null;
    if (!(await this.canEdit(row.journey_id, userId))) return null;

    // JG115 — reuses `TrekPhotoRegistrationService.resolve`, same as JG106.
    const trekRow = await this.photos.resolve(row.photo_id);

    // JG116 — same text as JG107.
    await this.photosRepo.deleteById(photoId);
    await this.photos.deleteIfOrphan(row.photo_id);

    return { id: row.id, photo_id: row.photo_id, file_path: trekRow?.file_path ?? null, thumbnail_path: trekRow?.thumbnail_path ?? null, journey_id: row.journey_id };
  }

  // ── Contributors ─────────────────────────────────────────────────────────

  async addContributor(
    journeyId: number,
    userId: number,
    targetUserId: number,
    role: 'editor' | 'viewer',
  ): Promise<boolean> {
    if (!(await this.isOwner(journeyId, userId))) return false;
    if (targetUserId === userId) return false;
    try {
      // JG117 — R3's composite-PK upsert, Task 1's own pinned reference
      // (`JourneyContributorsRepository.upsertContributor`) — this task's
      // first real caller of it.
      await this.contributorsRepo.upsertContributor(journeyId, targetUserId, role, this.ts());
      await this.broadcastJourneyEvent(journeyId, 'journey:contributor:changed', { targetUserId, role });
      return true;
    } catch {
      return false;
    }
  }

  async updateContributorRole(
    journeyId: number,
    userId: number,
    targetUserId: number,
    role: 'editor' | 'viewer',
  ): Promise<boolean> {
    if (!(await this.isOwner(journeyId, userId))) return false;
    // JG118 — Task 1's `updateRole`. R5's pre-existing gap is preserved, not
    // fixed: nothing here (or in SQL) stops a caller from writing `role =
    // 'owner'` through this path — only the TypeScript parameter type
    // discourages it, and that boundary is bypassable from a raw HTTP body.
    await this.contributorsRepo.updateRole(journeyId, targetUserId, role);
    await this.broadcastJourneyEvent(journeyId, 'journey:contributor:changed', { targetUserId, role });
    return true;
  }

  async removeContributor(journeyId: number, userId: number, targetUserId: number): Promise<boolean> {
    if (!(await this.isOwner(journeyId, userId))) return false;
    // JG119 — R5: the owner-protection guard stays INSIDE the repository's
    // own statement (`deleteNonOwner`'s `role != 'owner'` condition, Task
    // 1's build), never split into a find-then-conditional-delete.
    await this.contributorsRepo.deleteNonOwner(journeyId, targetUserId);
    return true;
  }

  // ── Suggestions ──────────────────────────────────────────────────────────

  async getSuggestions(userId: number) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // JG120 — `date('now')` resolved in JS via `todayUtc()` (`@trek/shared`)
    // and bound as a plain parameter, the same pattern Plan 3f's atlas
    // conversion established for a bare `date('now')` comparison
    // (`Trips.repository.ts#lastStartedTrip`'s own docstring) — no new
    // dialect helper.
    return await this.entriesRepo.listSuggestedTrips(userId, thirtyDaysAgo, todayUtc());
  }

  // ── User trips (for trip picker) ─────────────────────────────────────────

  async listUserTrips(userId: number) {
    // JG121
    return await this.entriesRepo.listUserTripsPicker(userId);
  }
}
