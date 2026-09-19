import { Injectable } from '@nestjs/common';
import {
  DAWARICH_BUCKET_MATCH_MIN_MINUTES,
  DAWARICH_BUCKET_MATCH_RADIUS_M,
  DAWARICH_BUCKET_SCAN_LIMIT,
  type DawarichAccept,
  type DawarichAcceptResult,
  type DawarichAtlasCountry,
  type DawarichAtlasSuggestions,
  type DawarichBucketMatch,
  type DawarichBucketScan,
  type DawarichSuggestion,
  type DawarichSuggestionList,
} from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { AtlasService } from '../atlas/atlas.service';
import { PlacesService } from '../places/places.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { PermissionsService } from '../permissions/permissions.service';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { NAME_TO_CODE } from '../atlas/atlas-geo';
import { DawarichClient, type DawarichCreds } from './dawarich.client';
import { DawarichService } from './dawarich.service';
import { minutesBetween, toNumber } from './dawarich.helpers';

/**
 * What a user does with the stays a sync brought in.
 *
 * Everything here is an explicit act by the person the suggestion belongs to.
 * That is the whole point of the split: the sync may look at a shared trip, but
 * only this service is ever allowed to write to one, and only because somebody
 * pressed something.
 *
 * Three destinations, deliberately not one:
 *   - **a place on the trip**, for a stay that was a stop worth planning around;
 *   - **a journal entry**, for one that was a moment worth writing about;
 *   - **a bucket-list tick**, for one that fulfilled a wish.
 * They are separate because accepting into the wrong one is a mess to undo, and
 * a single "import" button would have to guess which was meant.
 *
 * The trip UI offers the first two. A wish belongs to the Atlas — it is reached
 * once, and it is confirmed there, against the whole wishlist at once — so the
 * third is reached from the Atlas and from MCP, not from a row in a trip's rail.
 */
@Injectable()
export class DawarichSuggestionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly dawarich: DawarichService,
    private readonly client: DawarichClient,
    private readonly atlas: AtlasService,
    private readonly places: PlacesService,
    private readonly assignments: AssignmentsService,
    private readonly permissions: PermissionsService,
    private readonly journey: JourneyDomainService,
  ) {}

  /**
   * The review list, newest stay first.
   *
   * Scoped by `user_id` in SQL rather than filtered afterwards: these rows are
   * someone's location history, and a forgotten filter over a wider read is how
   * that leaks.
   */
  list(userId: number, filter: { tripId?: number; state?: string }): DawarichSuggestionList {
    this.reopenOrphaned(userId);

    const clauses = ['s.user_id = ?'];
    const params: unknown[] = [userId];
    if (filter.tripId !== undefined) {
      clauses.push('s.trip_id = ?');
      params.push(filter.tripId);
    }
    if (filter.state) {
      clauses.push('s.state = ?');
      params.push(filter.state);
    }

    const rows = this.db.all<SuggestionJoinRow>(
      `SELECT s.*, t.title AS trip_title, b.name AS matched_bucket_name
         FROM dawarich_visit_suggestions s
         LEFT JOIN trips t ON t.id = s.trip_id
         LEFT JOIN bucket_list b ON b.id = s.matched_bucket_list_item_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY s.started_at DESC, s.id DESC`,
      ...params,
    );

    const connection = this.dawarich.getConnection(userId);
    return {
      suggestions: rows.map(toWire),
      connected: connection.connected,
      lastSyncAt: connection.lastSyncAt,
      lastSyncState: connection.lastSyncState,
      lastSyncError: connection.lastSyncError,
    };
  }

  /**
   * Put back into review every acceptance whose result no longer exists.
   *
   * Deleting the place an acceptance created is how somebody says "not that
   * one" after the fact, and the stay then has nothing to show for itself: it
   * is unhandled again, and leaving it in the handled list is a dead end — the
   * row points at a place that is gone and accepting it again is refused as a
   * duplicate.
   *
   * The place and bucket columns are `ON DELETE SET NULL`, so a NULL beside a
   * target that names them IS the deletion. Journey entries are written by
   * another domain without a foreign key, so that one is asked directly.
   *
   * A write on a read path, deliberately: the alternative is computing the state
   * at read time, which would make the list say "back in review" while `accept`
   * still refused the row as already accepted.
   */
  private reopenOrphaned(userId: number): void {
    this.db.run(
      `UPDATE dawarich_visit_suggestions
          SET state = 'new', target = NULL, accepted_hash = NULL,
              accepted_place_id = NULL, accepted_journal_entry_id = NULL,
              accepted_bucket_list_item_id = NULL
        WHERE user_id = ? AND state = 'accepted'
          AND (
            (target = 'place' AND accepted_place_id IS NULL)
            OR (target = 'bucket_list' AND accepted_bucket_list_item_id IS NULL)
            OR (target = 'journal' AND (
                  accepted_journal_entry_id IS NULL
                  OR NOT EXISTS (
                    SELECT 1 FROM journey_entries je WHERE je.id = accepted_journal_entry_id
                  )
               ))
          )`,
      userId,
    );
  }

  getOne(userId: number, id: number): DawarichSuggestion | null {
    const row = this.db.get<SuggestionJoinRow>(
      `SELECT s.*, t.title AS trip_title, b.name AS matched_bucket_name
         FROM dawarich_visit_suggestions s
         LEFT JOIN trips t ON t.id = s.trip_id
         LEFT JOIN bucket_list b ON b.id = s.matched_bucket_list_item_id
        WHERE s.id = ? AND s.user_id = ?`,
      id,
      userId,
    );
    return row ? toWire(row) : null;
  }

  /**
   * Put a suggestion back into review, or take it out of the list.
   *
   * Reversible on purpose: dismissing is the cheap action people take to clear
   * a backlog, and the one they regret. Restoring an *accepted* suggestion is
   * not offered — the place or entry it produced is a separate thing now, and
   * "undo" would have to guess whether to delete it.
   */
  setState(userId: number, id: number, state: 'new' | 'dismissed'): DawarichSuggestion | null {
    const row = this.db.get<{ id: number; state: string }>(
      'SELECT id, state FROM dawarich_visit_suggestions WHERE id = ? AND user_id = ?',
      id,
      userId,
    );
    if (!row) return null;
    if (row.state === 'accepted') return this.getOne(userId, id);

    this.db.run('UPDATE dawarich_visit_suggestions SET state = ? WHERE id = ?', state, id);
    return this.getOne(userId, id);
  }

  /**
   * Accept a suggestion into TREK.
   *
   * Throws `AcceptError` rather than an HttpException so the controller, the
   * MCP tool and any future caller each shape the failure their own way — the
   * atlas domain's `BucketItemExistsError` is the precedent.
   */
  accept(userId: number, id: number, body: DawarichAccept, sid?: string): DawarichAcceptResult {
    const row = this.db.get<SuggestionRow>(
      'SELECT * FROM dawarich_visit_suggestions WHERE id = ? AND user_id = ?',
      id,
      userId,
    );
    if (!row) throw new AcceptError('not_found', 'Suggestion not found', 404);
    if (row.state === 'accepted') throw new AcceptError('already_accepted', 'Suggestion has already been accepted', 409);

    switch (body.target) {
      case 'place':
        return this.acceptAsPlace(userId, row, body, sid);
      case 'journal':
        return this.acceptAsJournalEntry(userId, row, body, sid);
      case 'bucket_list':
        return this.acceptAsBucketTick(userId, row, body);
    }
  }

  /**
   * A stay becomes a place on a trip, optionally pinned to one of its days.
   *
   * Every referenced id is verified against the trip before anything is
   * written: permission to touch the trip is not permission to attach a place
   * to somebody else's day.
   */
  private acceptAsPlace(
    userId: number,
    row: SuggestionRow,
    body: DawarichAccept,
    sid?: string,
  ): DawarichAcceptResult {
    const tripId = body.tripId ?? row.trip_id;
    if (!tripId) throw new AcceptError('trip_required', 'A trip is required to create a place', 400);

    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) throw new AcceptError('not_found', 'Trip not found', 404);

    // Being on the roster is not permission to write to it. Every other way of
    // putting a place on a trip asks `place_edit` (and `day_edit` for the
    // assignment), and on an instance where an admin narrowed either to the
    // owner, a member accepting a stay must be refused exactly as they would be
    // in the planner. Asked here rather than in the controller so the MCP tool
    // cannot take a different route to the same write.
    this.requirePermission('place_edit', access.user_id, userId);

    if (body.dayId !== undefined) {
      this.requirePermission('day_edit', access.user_id, userId);
      if (!this.assignments.dayExists(body.dayId, tripId)) {
        throw new AcceptError('day_not_on_trip', 'Day does not belong to this trip', 400);
      }
    }

    const lat = body.lat ?? row.lat ?? undefined;
    const lng = body.lng ?? row.lng ?? undefined;

    // One transaction for the four writes an acceptance makes. Half of it —
    // a place with no assignment, or a place nobody recorded as accepted — is
    // worse than none: the stay would come back as unhandled while the place it
    // already produced sat on the trip.
    const { created, placeId, assignment } = this.db.transaction(() => {
      const place = this.places.create(String(tripId), {
        name: body.name?.trim() || row.name,
        lat,
        lng,
        notes: body.notes ?? null,
        place_time: body.time ?? timeOf(row.started_at),
        end_time: body.endTime ?? timeOf(row.ended_at),
        duration_minutes: row.duration_minutes > 0 ? row.duration_minutes : undefined,
      } as Parameters<PlacesService['create']>[1]);

      const id = Number((place as { id: number }).id);
      // Stamped here rather than passed through PlacesService.create: `source`
      // is not part of the create contract and should not become something a
      // request body can set — a place claims to come from a recording only
      // because this path made it.
      this.db.run("UPDATE places SET source = 'dawarich' WHERE id = ?", id);

      const day = body.dayId !== undefined ? this.assignments.createAssignment(body.dayId, id, null) : undefined;
      this.markAccepted(row.id, 'place', { placeId: id });
      // Re-read, so what goes out on the wire carries the source: everyone else
      // on the trip should see the Dawarich mark on it too, not only the person
      // who accepted it.
      return { created: this.db.getPlaceWithTags(id) ?? place, placeId: id, assignment: day };
    });

    // Outside the transaction, because both reach past the database: a
    // broadcast of a write that then rolls back is a lie every other client
    // believes, and the journey mirror writes on its own.
    //
    // The same two side effects the places controller performs, because this IS
    // a place somebody added to the trip. Skipping them is why an accepted stay
    // used to need a page reload to show up.
    this.places.broadcast(String(tripId), 'place:created', { place: created }, sid);
    this.places.onCreated(String(tripId), placeId);
    if (assignment) {
      this.assignments.broadcast(String(tripId), 'assignment:created', { assignment }, sid);
    }

    return {
      suggestion: this.getOne(userId, row.id)!,
      createdPlaceId: placeId,
      createdJournalEntryId: null,
      bucketListItemId: null,
    };
  }

  /**
   * A stay becomes a dated journal entry.
   *
   * The date comes from the stay's own local date unless corrected, and the
   * arrival time fills the entry's time — the two fields a person would
   * otherwise copy off the suggestion by hand.
   */
  private acceptAsJournalEntry(
    userId: number,
    row: SuggestionRow,
    body: DawarichAccept,
    sid?: string,
  ): DawarichAcceptResult {
    if (body.journalId === undefined) {
      throw new AcceptError('journal_required', 'A journey is required to create an entry', 400);
    }
    // canEdit is the journey domain's own answer, and createEntry asks it again.
    // Asking here too is what turns "silently did nothing" into a 403.
    if (!this.journey.canEdit(body.journalId, userId)) {
      throw new AcceptError('journal_forbidden', 'Journey not found', 404);
    }

    // The entry and the record that it was written commit together. Apart, a
    // failure between them leaves an entry in the journal with the stay still
    // listed as unhandled — and the next acceptance writes a second copy of it.
    //
    // The journey domain broadcasts the new entry from inside `createEntry`, so
    // that one notification can still outrun a rollback. Moving it out means
    // changing that domain's contract, which this integration has no business
    // doing; the write itself is what had to stop being two.
    const entry = this.db.transaction(() => {
      const created = this.journey.createEntry(
        body.journalId,
        userId,
        {
          type: 'entry',
          title: body.name?.trim() || row.name,
          story: body.notes ?? undefined,
          entry_date: body.date ?? row.local_date,
          entry_time: body.time ?? timeOf(row.started_at) ?? undefined,
          location_name: body.name?.trim() || row.name,
          location_lat: body.lat ?? row.lat ?? undefined,
          location_lng: body.lng ?? row.lng ?? undefined,
        },
        sid,
      );
      if (!created) throw new AcceptError('journal_forbidden', 'Journey not found', 404);
      this.markAccepted(row.id, 'journal', { journalEntryId: created.id });
      return created;
    });
    return {
      suggestion: this.getOne(userId, row.id)!,
      createdPlaceId: null,
      createdJournalEntryId: entry.id,
      bucketListItemId: null,
    };
  }

  /** A stay ticks off a wish. The wish must be the caller's own. */
  private acceptAsBucketTick(userId: number, row: SuggestionRow, body: DawarichAccept): DawarichAcceptResult {
    const itemId = body.bucketListItemId ?? row.matched_bucket_list_item_id;
    if (!itemId) {
      throw new AcceptError('bucket_required', 'A bucket-list entry is required', 400);
    }
    const item = this.db.get<{ id: number }>(
      'SELECT id FROM bucket_list WHERE id = ? AND user_id = ?',
      itemId,
      userId,
    );
    if (!item) throw new AcceptError('not_found', 'Bucket-list entry not found', 404);

    this.db.transaction(() => {
      this.db.run(
        "UPDATE bucket_list SET visited_at = ?, visited_source = 'dawarich' WHERE id = ? AND user_id = ?",
        row.started_at,
        itemId,
        userId,
      );
      this.markAccepted(row.id, 'bucket_list', { bucketItemId: itemId });
    });

    return {
      suggestion: this.getOne(userId, row.id)!,
      createdPlaceId: null,
      createdJournalEntryId: null,
      bucketListItemId: itemId,
    };
  }

  /**
   * The instance's answer to "may this person do this on this trip".
   *
   * The role comes out of the users table because the only thing every caller
   * has in common is a user id: the REST controller holds the full user, the MCP
   * tool holds `ctx.userId`, and a permission that depended on which door
   * somebody came through would not be a permission.
   */
  private requirePermission(action: 'place_edit' | 'day_edit', tripOwnerId: number, userId: number): void {
    const actor = this.db.get<{ role: string }>('SELECT role FROM users WHERE id = ?', userId);
    const allowed = this.permissions.checkPermission(
      action,
      actor?.role ?? 'user',
      tripOwnerId,
      userId,
      tripOwnerId !== userId,
    );
    if (!allowed) throw new AcceptError('forbidden', 'No permission', 403);
  }

  /**
   * Record what the acceptance produced, and freeze the hash it was accepted at.
   *
   * `accepted_hash` is what makes "the source changed since you accepted this"
   * answerable at all: without it there is nothing to compare the current hash
   * against, and the flag would either never fire or fire forever.
   */
  private markAccepted(
    id: number,
    target: 'place' | 'journal' | 'bucket_list',
    ids: { placeId?: number; journalEntryId?: number; bucketItemId?: number },
  ): void {
    this.db.run(
      `UPDATE dawarich_visit_suggestions
          SET state = 'accepted', target = ?, accepted_place_id = ?,
              accepted_journal_entry_id = ?, accepted_bucket_list_item_id = ?,
              accepted_hash = source_hash
        WHERE id = ?`,
      target,
      ids.placeId ?? null,
      ids.journalEntryId ?? null,
      ids.bucketItemId ?? null,
      id,
    );
  }

  // ── Bucket-list scan ───────────────────────────────────────────────────────

  /**
   * Ask Dawarich, wish by wish, whether the user ever actually got there.
   *
   * This is the thorough half of the bucket-list match. The sync already links
   * a wish to a stay when Dawarich's own detector happened to produce one
   * nearby; this asks the recordings directly, which finds the places the
   * detector never called a visit — the viewpoint you stopped at for half an
   * hour on the way somewhere else.
   *
   * One upstream request per wish, so it is capped and explicitly triggered
   * rather than run on a timer. The cap is reported, never silent: a user with
   * eighty wishes must not be told their other thirty had no match.
   */
  async scanBucketList(userId: number): Promise<DawarichBucketScan> {
    const creds = this.dawarich.getCredentials(userId);
    if (!creds) throw new AcceptError('not_connected', 'Dawarich is not connected', 400);

    const items = this.db.all<BucketRow>(
      `SELECT id, name, lat, lng, visited_at
         FROM bucket_list WHERE user_id = ?
        ORDER BY (visited_at IS NOT NULL), created_at DESC, id DESC`,
      userId,
    );
    const withCoords = items.filter((item) => item.lat !== null && item.lng !== null);
    const skipped = items.length - withCoords.length;
    const batch = withCoords.slice(0, DAWARICH_BUCKET_SCAN_LIMIT);

    const matches: DawarichBucketMatch[] = [];
    for (const item of batch) {
      matches.push({
        itemId: item.id,
        name: item.name,
        match: await this.bestStayNear(creds, item.lat!, item.lng!),
        alreadyVisited: item.visited_at !== null,
      });
    }

    return {
      matches,
      skippedWithoutCoordinates: skipped,
      truncated: withCoords.length > batch.length,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * The longest recorded stay near a coordinate that clears both thresholds.
   *
   * Longest rather than nearest: of two stays at the same landmark, the one
   * that lasted two hours is the visit and the one that lasted four minutes is
   * the bus stopping outside.
   */
  private async bestStayNear(
    creds: DawarichCreds,
    lat: number,
    lng: number,
  ): Promise<DawarichBucketMatch['match']> {
    let stays;
    try {
      stays = await this.client.findVisitsNear(creds, lat, lng, DAWARICH_BUCKET_MATCH_RADIUS_M, 20);
    } catch {
      // One wish that could not be checked is not a failed scan; it reports as
      // "no match found" and the user can run it again.
      return null;
    }

    let best: DawarichBucketMatch['match'] = null;
    for (const stay of stays) {
      const details = stay.visit_details ?? null;
      const minutes =
        toNumber(details?.duration_minutes) ??
        (details?.start_time && details?.end_time ? minutesBetween(details.start_time, details.end_time) : 0);
      if (minutes < DAWARICH_BUCKET_MATCH_MIN_MINUTES) continue;

      const distance = toNumber(stay.distance_meters) ?? DAWARICH_BUCKET_MATCH_RADIUS_M;
      if (distance > DAWARICH_BUCKET_MATCH_RADIUS_M) continue;

      // A stay with no readable timestamp at either end cannot be dated, and a
      // wish ticked off on 1970-01-01 is worse than one that is not offered.
      const at = details?.start_time ?? isoFromUnix(toNumber(stay.timestamp));
      if (!at) continue;
      if (!best || minutes > best.minutes) {
        best = {
          at,
          minutes,
          distanceMeters: Math.round(distance),
          points: toNumber(stay.points_count) ?? 0,
        };
      }
    }
    return best;
  }

  /** Tick off wishes the user confirmed after reading a scan. */
  confirmBucketVisits(userId: number, itemIds: number[], visitedAt?: string): number {
    const now = new Date().toISOString();
    let updated = 0;
    this.db.transaction(() => {
      for (const itemId of itemIds) {
        // The date is the one the wish was actually reached on. A wish somebody
        // got to in 2023 ticked off with today's date is a wrong entry in a list
        // people keep for years, so "now" is only the answer when nothing else
        // knows better: the caller's own value first, then the stay this wish
        // was matched to, then the clock.
        const stamp = visitedAt ?? this.matchedStayStart(userId, itemId) ?? now;
        const result = this.db.run(
          "UPDATE bucket_list SET visited_at = ?, visited_source = 'dawarich' WHERE id = ? AND user_id = ? AND visited_at IS NULL",
          stamp,
          itemId,
          userId,
        );
        updated += result.changes;
      }
    });
    return updated;
  }

  /** When the stay that claimed this wish began, if one did. */
  private matchedStayStart(userId: number, itemId: number): string | null {
    const row = this.db.get<{ started_at: string }>(
      `SELECT started_at FROM dawarich_visit_suggestions
        WHERE user_id = ? AND matched_bucket_list_item_id = ?
        ORDER BY started_at DESC LIMIT 1`,
      userId,
      itemId,
    );
    return row?.started_at ?? null;
  }

  /** Undo a tick. Clears the source with it, so the entry reads as untouched again. */
  clearBucketVisit(userId: number, itemId: number): boolean {
    const result = this.db.run(
      'UPDATE bucket_list SET visited_at = NULL, visited_source = NULL WHERE id = ? AND user_id = ?',
      itemId,
      userId,
    );
    return result.changes > 0;
  }

  // ── Atlas ──────────────────────────────────────────────────────────────────

  /**
   * Countries and cities the recordings put the user in, offered to the Atlas.
   *
   * Offered, never applied. The Atlas is a thing people curate — it has
   * tombstones precisely so a country somebody removed stays removed — and a
   * background job that ticked countries off would fight that. `alreadyVisited`
   * marks the ones TREK already counts, so the list reads as "these are new"
   * rather than as a wall of things the user has known for years.
   *
   * Dawarich names countries rather than coding them, so the name is mapped
   * through the Atlas's own table. Anything that does not resolve is listed by
   * name instead of being dropped: a country TREK cannot code is still a
   * country the user went to, and silently losing it would be the worse bug.
   */
  async atlasSuggestions(userId: number, from: Date, to: Date): Promise<DawarichAtlasSuggestions> {
    const creds = this.dawarich.getCredentials(userId);
    if (!creds) throw new AcceptError('not_connected', 'Dawarich is not connected', 400);

    const countries = await this.client.listVisitedCities(creds, from, to);
    const visited = new Set(
      this.db
        .all<{ country_code: string }>('SELECT country_code FROM visited_countries WHERE user_id = ?', userId)
        .map((r) => r.country_code.toUpperCase()),
    );

    const resolved: DawarichAtlasCountry[] = [];
    const unresolved: string[] = [];

    for (const entry of countries) {
      const name = (entry?.country ?? '').trim();
      if (!name) continue;
      const code = NAME_TO_CODE[name.toLowerCase()];
      if (!code) {
        unresolved.push(name);
        continue;
      }
      resolved.push({
        countryCode: code,
        sourceName: name,
        cities: (entry.cities ?? []).map((city) => ({
          name: city?.city ?? '',
          minutes: toNumber(city?.stayed_for) ?? 0,
          lastSeenAt: isoFromUnix(toNumber(city?.timestamp)),
        })).filter((city) => city.name !== ''),
        alreadyVisited: visited.has(code),
      });
    }

    return { countries: resolved, unresolved, fetchedAt: new Date().toISOString() };
  }

  /**
   * Confirm a batch of countries into the Atlas.
   *
   * Goes through `AtlasService.markCountry`, which is what lifts the tombstone
   * a previous removal left behind and keeps the two write paths from drifting.
   * `INSERT OR IGNORE` underneath means a country already marked by hand keeps
   * its own provenance — confirming it again does not relabel it as imported.
   */
  acceptAtlasCountries(userId: number, codes: string[]): number {
    let marked = 0;
    this.db.transaction(() => {
      for (const raw of codes) {
        const code = raw.trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(code)) continue;
        // Counted only when it was actually added: "3 countries added" must not
        // include ones that were already on the map.
        if (this.atlas.markCountry(userId, code, 'dawarich')) marked++;
      }
    });
    return marked;
  }
}

/** A refusal with a code the controller and the MCP tool each render their own way. */
export class AcceptError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AcceptError';
    this.code = code;
    this.status = status;
  }
}

/** `HH:MM` out of an ISO timestamp, in the offset the timestamp carries. */
function timeOf(iso: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.slice(11, 16) : null;
}

function toWire(row: SuggestionJoinRow): DawarichSuggestion {
  return {
    id: row.id,
    sourceVisitId: row.source_visit_id,
    tripId: row.trip_id,
    tripTitle: row.trip_title ?? null,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    localDate: row.local_date,
    sourceStatus: row.source_status === 'confirmed' ? 'confirmed' : 'suggested',
    confidence: row.confidence,
    confidenceBand: row.confidence_band,
    state: row.state === 'accepted' || row.state === 'dismissed' ? row.state : 'new',
    target:
      row.target === 'place' || row.target === 'journal' || row.target === 'bucket_list' ? row.target : null,
    acceptedPlaceId: row.accepted_place_id,
    acceptedJournalEntryId: row.accepted_journal_entry_id,
    acceptedBucketListItemId: row.accepted_bucket_list_item_id,
    // Only meaningful once something was accepted: before that there is no
    // "what you agreed to" to have diverged from.
    sourceChanged: row.accepted_hash !== null && row.accepted_hash !== row.source_hash,
    sourceMissing: row.source_missing_at !== null,
    matchedBucketListItemId: row.matched_bucket_list_item_id,
    matchedBucketListName: row.matched_bucket_name ?? null,
    countryCode: row.country_code,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

/** A Unix timestamp as ISO-8601, or null when there was none to read. */
function isoFromUnix(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

interface SuggestionRow {
  id: number;
  user_id: number;
  source_visit_id: string;
  trip_id: number | null;
  name: string;
  lat: number | null;
  lng: number | null;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  local_date: string;
  source_status: string;
  confidence: number | null;
  confidence_band: string | null;
  country_code: string | null;
  state: string;
  target: string | null;
  accepted_place_id: number | null;
  accepted_journal_entry_id: number | null;
  accepted_bucket_list_item_id: number | null;
  matched_bucket_list_item_id: number | null;
  source_hash: string;
  accepted_hash: string | null;
  source_missing_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

interface SuggestionJoinRow extends SuggestionRow {
  trip_title: string | null;
  matched_bucket_name: string | null;
}

interface BucketRow {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  visited_at: string | null;
}
