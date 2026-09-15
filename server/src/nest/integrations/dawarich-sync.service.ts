import { Injectable } from '@nestjs/common';
import {
  DAWARICH_SYNC_LOOKAHEAD_DAYS,
  DAWARICH_SYNC_LOOKBACK_DAYS,
  DAWARICH_BUCKET_MATCH_RADIUS_M,
  DAWARICH_BUCKET_MATCH_MIN_MINUTES,
  type DawarichSyncState,
} from '@trek/shared';
import { ADDON_IDS } from '../../addons';
import { DatabaseService } from '../database/database.service';
import { AddonsService } from '../addons/addons.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { getCountryFromCoords } from '../atlas/atlas-geo';
import { DawarichClient, DawarichError, type DawarichCreds } from './dawarich.client';
import { DawarichService } from './dawarich.service';
import { distanceMeters, localDateOf, normalizeVisit, syncWindow, visitHash } from './dawarich.helpers';

/** What one user's sync produced — plus whether it ran at all. */
export interface DawarichSyncOutcome {
  state: DawarichSyncState;
  created: number;
  updated: number;
  missing: number;
  /** True when a sync for this user was already in flight, so nothing was asked. */
  alreadyRunning?: boolean;
}

/**
 * Pulls Dawarich visits into TREK as reviewable suggestions.
 *
 * Three rules run through everything here, and they are the whole reason this
 * is a sync rather than an import:
 *
 * 1. **A sync never changes shared trip content.** It writes rows into
 *    `dawarich_visit_suggestions`, which belong to the person whose credentials
 *    fetched them. A place or a journal entry appears only when that person
 *    accepts one, in `DawarichSuggestionsService`.
 * 2. **Repeating a sync is free.** Identity is (user, Dawarich visit id) with a
 *    UNIQUE behind it, so the tenth run over the same window produces the same
 *    rows as the first.
 * 3. **The source is allowed to change its mind; TREK is not allowed to act on
 *    that alone.** A visit whose content hash moved is flagged `source_changed`
 *    and one that vanished from a full re-read is flagged `source_missing` —
 *    both visible, neither applied. A suggestion the user already accepted and
 *    then edited is their text now; rewriting or deleting it because a detector
 *    ran again would be the integration overwriting someone's journal.
 */
@Injectable()
export class DawarichSyncService {
  /**
   * Module-level rather than per-call: a cron tick that overlaps the previous
   * one would ask the same instance for the same window twice and race on the
   * same rows.
   */
  private running = false;

  /**
   * Who is being synced right now, cron or button.
   *
   * The module-level flag only guards the cron against itself. "Check now" calls
   * `syncUser` directly, so without this a held-down button — or a button pressed
   * while the cron is working — would ask the same instance for the same windows
   * several times over, each walking up to 20 pages, and let two passes race on
   * the same rows. A second request is answered with the truth: one is running.
   */
  private readonly inFlight = new Set<number>();

  constructor(
    private readonly db: DatabaseService,
    private readonly addons: AddonsService,
    private readonly client: DawarichClient,
    private readonly dawarich: DawarichService,
  ) {}

  /** The addon gate, evaluated per tick so an admin toggle lands without a restart. */
  syncGloballyEnabled(): boolean {
    return this.addons.isAddonEnabled(ADDON_IDS.DAWARICH);
  }

  /** Every connected user, one after another. The cron's entry point. */
  async runSync(): Promise<void> {
    if (!this.syncGloballyEnabled()) return;
    if (this.running) return;
    this.running = true;
    try {
      const userIds = this.dawarich.listSyncableUserIds();
      for (const userId of userIds) {
        try {
          await this.syncUser(userId);
        } catch (err) {
          // One unreachable instance must not stop the others.
          logError(`Dawarich sync failed for user ${userId}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } finally {
      this.running = false;
    }
  }

  /**
   * One user's trips.
   *
   * The result is deliberately three-valued. `partial` is the interesting one:
   * some windows came back and some did not, which is what a flaky instance or
   * a very long trip actually looks like, and calling that either "ok" or
   * "failed" would mislead the person reading the connection card.
   */
  async syncUser(userId: number): Promise<DawarichSyncOutcome> {
    if (this.inFlight.has(userId)) {
      // Not a failure and not a fresh result: the run that is already going will
      // record its own. Reporting the state the connection currently holds keeps
      // the card honest, and `alreadyRunning` lets the caller say so.
      const current = this.db.get<{ last_sync_state: string }>(
        'SELECT last_sync_state FROM dawarich_connections WHERE user_id = ?',
        userId,
      );
      return {
        state: (current?.last_sync_state as DawarichSyncState) ?? 'never',
        created: 0,
        updated: 0,
        missing: 0,
        alreadyRunning: true,
      };
    }
    this.inFlight.add(userId);
    try {
      return await this.syncUserOnce(userId);
    } finally {
      this.inFlight.delete(userId);
    }
  }

  /** The body of a sync, with the guard above already held. */
  private async syncUserOnce(userId: number): Promise<DawarichSyncOutcome> {
    if (!this.syncGloballyEnabled()) {
      this.dawarich.recordSyncResult(userId, 'failed', 'addon_disabled');
      return { state: 'failed', created: 0, updated: 0, missing: 0 };
    }

    const creds = this.dawarich.getCredentials(userId);
    if (!creds) {
      this.dawarich.recordSyncResult(userId, 'failed', 'not_connected');
      return { state: 'failed', created: 0, updated: 0, missing: 0 };
    }

    const trips = this.listTripsToSync(userId);
    if (trips.length === 0) {
      // Nothing to ask about is a successful sync, not a failure — otherwise a
      // user with no dated trips sees a permanent red badge for doing nothing wrong.
      this.dawarich.recordSyncResult(userId, 'ok', null);
      return { state: 'ok', created: 0, updated: 0, missing: 0 };
    }

    let created = 0;
    let updated = 0;
    let missing = 0;
    let failures = 0;
    let lastError: string | null = null;
    const now = new Date();

    for (const trip of trips) {
      const window = syncWindow(
        trip.start_date,
        trip.end_date,
        now,
        DAWARICH_SYNC_LOOKBACK_DAYS,
        DAWARICH_SYNC_LOOKAHEAD_DAYS,
      );
      if (!window) continue;

      try {
        const result = await this.syncTripWindow(userId, trip.id, creds, window.from, window.to);
        created += result.created;
        updated += result.updated;
        missing += result.missing;
      } catch (err) {
        failures++;
        lastError = err instanceof DawarichError ? err.code : 'unreachable';
      }
    }

    const state: DawarichSyncState =
      failures === 0 ? 'ok' : failures === trips.length ? 'failed' : 'partial';
    this.dawarich.recordSyncResult(userId, state, state === 'ok' ? null : lastError);

    // The probe is cheap next to the windows just fetched, and re-running it is
    // how a Dawarich upgrade that finally ships `updated_at` starts being used
    // without anyone reconnecting.
    if (state !== 'failed') {
      try {
        this.dawarich.storeCapabilities(userId, await this.dawarich.probeCapabilities(creds));
      } catch {
        // Capabilities are an optimisation; a failed probe is not a failed sync.
      }
    }

    if (created || updated || missing) {
      logInfo(`Dawarich sync for user ${userId}: ${created} new, ${updated} changed, ${missing} gone`);
    }
    return { state, created, updated, missing };
  }

  /**
   * Trips worth asking about: the ones the user owns or is on, not archived,
   * with a start date, and either still running or recent enough that a
   * recording could still arrive.
   *
   * A trip five years past is not re-polled every five minutes. The cut-off is
   * generous rather than tight, because someone who connects Dawarich for the
   * first time wants their last holiday filled in, not just today's.
   */
  private listTripsToSync(userId: number): TripRow[] {
    return this.db.all<TripRow>(
      `SELECT DISTINCT t.id, t.start_date, t.end_date
         FROM trips t
         LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE (t.user_id = ? OR m.user_id IS NOT NULL)
          AND COALESCE(t.is_archived, 0) = 0
          AND t.start_date IS NOT NULL
          AND (t.end_date IS NULL OR t.end_date >= date('now', '-400 days'))
          AND t.start_date <= date('now', '+1 day')
        ORDER BY t.start_date DESC`,
      userId,
      userId,
    );
  }

  /**
   * One trip's window: fetch, reconcile, flag what disappeared.
   *
   * The reconciliation is a full re-read of the window rather than a delta,
   * and that is not laziness. Dawarich sends no `updated_at` to build a delta
   * from, and deleting a visit removes it from the list rather than tombstoning
   * it — so a changed-since filter, even if one existed, could never see a
   * deletion. Comparing the whole window against what TREK already holds is the
   * only thing that can.
   */
  async syncTripWindow(
    userId: number,
    tripId: number,
    creds: DawarichCreds,
    from: Date,
    to: Date,
  ): Promise<{ created: number; updated: number; missing: number }> {
    const { visits } = await this.client.listVisits(creds, from, to);

    const seenIds = new Set<string>();
    let created = 0;
    let updated = 0;

    for (const raw of visits) {
      const visit = normalizeVisit(raw);
      if (!visit) continue;
      seenIds.add(visit.sourceVisitId);

      const hash = visitHash(raw);
      const existing = this.db.get<SuggestionRow>(
        'SELECT * FROM dawarich_visit_suggestions WHERE user_id = ? AND source_visit_id = ?',
        userId,
        visit.sourceVisitId,
      );

      // Dawarich has no country code on a visit's place, so it is resolved here
      // from the coordinates against the same borders the Atlas draws. A code
      // the source does start sending one day wins, because it is the source's
      // own answer.
      const countryCode =
        visit.countryCodeFromSource ??
        (visit.lat !== null && visit.lng !== null ? getCountryFromCoords(visit.lat, visit.lng) : null);

      if (!existing) {
        this.db.run(
          `INSERT INTO dawarich_visit_suggestions
             (user_id, source_visit_id, trip_id, name, lat, lng, started_at, ended_at,
              duration_minutes, local_date, source_status, confidence, confidence_band,
              country_code, state, source_hash, first_seen_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
          userId,
          visit.sourceVisitId,
          tripId,
          visit.name,
          visit.lat,
          visit.lng,
          visit.startedAt,
          visit.endedAt,
          visit.durationMinutes,
          visit.localDate,
          visit.status,
          visit.confidence,
          visit.confidenceBand,
          countryCode,
          hash,
          new Date().toISOString(),
          new Date().toISOString(),
        );
        created++;
        this.matchBucketList(userId, visit.sourceVisitId, visit.lat, visit.lng, visit.durationMinutes);
        continue;
      }

      const changed = existing.source_hash !== hash;

      if (existing.state === 'new') {
        // Nobody has acted on it yet, so the newest version of the source is
        // simply the better suggestion. Overwriting here loses nothing.
        this.db.run(
          `UPDATE dawarich_visit_suggestions
              SET name = ?, lat = ?, lng = ?, started_at = ?, ended_at = ?, duration_minutes = ?,
                  local_date = ?, source_status = ?, confidence = ?, confidence_band = ?,
                  country_code = ?, source_hash = ?, source_missing_at = NULL,
                  trip_id = COALESCE(trip_id, ?), last_seen_at = ?
            WHERE id = ?`,
          visit.name,
          visit.lat,
          visit.lng,
          visit.startedAt,
          visit.endedAt,
          visit.durationMinutes,
          visit.localDate,
          visit.status,
          visit.confidence,
          visit.confidenceBand,
          countryCode,
          hash,
          tripId,
          new Date().toISOString(),
          existing.id,
        );
        if (changed) updated++;
        this.matchBucketList(userId, visit.sourceVisitId, visit.lat, visit.lng, visit.durationMinutes);
        continue;
      }

      // Accepted or dismissed: the hash is refreshed so the flag is raised once
      // rather than on every tick, but nothing the user can see is rewritten.
      // `accepted_hash` is what they said yes to; the difference between that
      // and the current hash is what the UI reports.
      this.db.run(
        `UPDATE dawarich_visit_suggestions
            SET source_hash = ?, source_missing_at = NULL, last_seen_at = ?
          WHERE id = ?`,
        hash,
        new Date().toISOString(),
        existing.id,
      );
      if (changed) updated++;
    }

    const missing = this.flagMissing(userId, tripId, from, to, seenIds);
    return { created, updated, missing };
  }

  /**
   * Mark everything TREK holds for this window that the source no longer lists.
   *
   * Untouched suggestions are removed outright — nobody has seen them, and a
   * list of stays that no longer exist is worse than an empty list. Anything the
   * user acted on keeps its row and gets a timestamp instead, so the panel can
   * say "this is gone in Dawarich" next to an entry they wrote. Deleting that
   * would delete their work.
   */
  private flagMissing(
    userId: number,
    tripId: number,
    from: Date,
    to: Date,
    seenIds: Set<string>,
  ): number {
    // Bounded on `local_date`, not on `started_at`. Dawarich renders a visit's
    // start as local wall-clock plus an offset (`2026-09-01T14:23:00+02:00`)
    // while the window is UTC (`…Z`), and comparing those two shapes as strings
    // is only accurate to the date — on a statement that DELETES rows, "only
    // accurate to the date" is not good enough. `local_date` is a plain
    // YYYY-MM-DD on both sides of the comparison, and a day of slack at each
    // end is deliberate: a row just outside the window is left alone rather
    // than deleted for not having been seen.
    const candidates = this.db.all<{ id: number; source_visit_id: string; state: string }>(
      `SELECT id, source_visit_id, state
         FROM dawarich_visit_suggestions
        WHERE user_id = ? AND trip_id = ?
          AND local_date >= ? AND local_date <= ?`,
      userId,
      tripId,
      localDateOf(from.toISOString()),
      localDateOf(to.toISOString()),
    );

    const gone = candidates.filter((row) => !seenIds.has(row.source_visit_id));
    if (gone.length === 0) return 0;

    const stamp = new Date().toISOString();
    this.db.transaction(() => {
      for (const row of gone) {
        if (row.state === 'new') {
          this.db.run('DELETE FROM dawarich_visit_suggestions WHERE id = ?', row.id);
        } else {
          this.db.run(
            'UPDATE dawarich_visit_suggestions SET source_missing_at = COALESCE(source_missing_at, ?) WHERE id = ?',
            stamp,
            row.id,
          );
        }
      }
    });
    return gone.length;
  }

  /**
   * Link a stay to a bucket-list wish it sits on top of.
   *
   * Both tests have to pass: close enough, and long enough. Proximity alone is
   * what makes a detector untrustworthy — driving past a cathedral puts you
   * within 250 m of it — and the dwell time is what separates being somewhere
   * from going past it. The link is only a hint; ticking the wish off still
   * needs the user.
   */
  private matchBucketList(
    userId: number,
    sourceVisitId: string,
    lat: number | null,
    lng: number | null,
    durationMinutes: number,
  ): void {
    if (lat === null || lng === null) return;
    if (durationMinutes < DAWARICH_BUCKET_MATCH_MIN_MINUTES) return;

    // A rough box first so SQLite does not measure every wish in the world. One
    // degree of latitude is ~111 km, and longitude shrinks with latitude, so the
    // box is deliberately generous and the real test is the distance below.
    const degrees = (DAWARICH_BUCKET_MATCH_RADIUS_M / 111_000) * 2 + 0.01;
    const nearby = this.db.all<{ id: number; lat: number; lng: number }>(
      `SELECT id, lat, lng FROM bucket_list
        WHERE user_id = ? AND lat IS NOT NULL AND lng IS NOT NULL
          AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`,
      userId,
      lat - degrees,
      lat + degrees,
      lng - degrees,
      lng + degrees,
    );

    let best: { id: number; lat: number; lng: number; distance: number } | null = null;
    for (const item of nearby) {
      const distance = distanceMeters(lat, lng, item.lat, item.lng);
      if (distance > DAWARICH_BUCKET_MATCH_RADIUS_M) continue;
      if (!best || distance < best.distance) best = { id: item.id, lat: item.lat, lng: item.lng, distance };
    }
    if (!best) return;

    this.claimWish(userId, sourceVisitId, best, lat, lng, durationMinutes);
  }

  /**
   * Give a wish to the one stay that best answers it.
   *
   * 250 m is a city block, and a block in a city centre holds a dozen stays: a
   * coffee across the square from the museum satisfies the radius exactly as
   * the museum does. Attaching the wish to each of them turns one achievement
   * into five claims and invites ticking it off from the wrong one, so the
   * closest stay keeps it — and the longest wins a tie, because standing
   * somewhere for two hours is a better answer to "were you there" than passing
   * within the same few metres.
   *
   * Every previous claim on the same wish is cleared, so re-running a sync after
   * the recordings change cannot leave two stays holding it.
   */
  private claimWish(
    userId: number,
    sourceVisitId: string,
    wish: { id: number; lat: number; lng: number; distance: number },
    lat: number,
    lng: number,
    durationMinutes: number,
  ): void {
    const holders = this.db.all<{
      id: number;
      source_visit_id: string;
      lat: number | null;
      lng: number | null;
      duration_minutes: number;
    }>(
      `SELECT id, source_visit_id, lat, lng, duration_minutes
         FROM dawarich_visit_suggestions
        WHERE user_id = ? AND matched_bucket_list_item_id = ? AND source_visit_id <> ?`,
      userId,
      wish.id,
      sourceVisitId,
    );

    for (const holder of holders) {
      if (holder.lat === null || holder.lng === null) continue;
      const distance = distanceMeters(holder.lat, holder.lng, wish.lat, wish.lng);
      const holderWins =
        distance < wish.distance ||
        (distance === wish.distance && holder.duration_minutes > durationMinutes);
      if (holderWins) return;
    }

    this.db.transaction(() => {
      this.db.run(
        'UPDATE dawarich_visit_suggestions SET matched_bucket_list_item_id = NULL WHERE user_id = ? AND matched_bucket_list_item_id = ?',
        userId,
        wish.id,
      );
      this.db.run(
        'UPDATE dawarich_visit_suggestions SET matched_bucket_list_item_id = ? WHERE user_id = ? AND source_visit_id = ?',
        wish.id,
        userId,
        sourceVisitId,
      );
    });
  }
}

interface TripRow {
  id: number;
  start_date: string | null;
  end_date: string | null;
}

interface SuggestionRow {
  id: number;
  state: string;
  source_hash: string;
}
