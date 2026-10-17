import { ADDON_IDS } from '../../addons';
import { BucketList } from '../../db/entities/BucketList.entity';
import { DawarichConnections } from '../../db/entities/DawarichConnections.entity';
import { DawarichVisitSuggestions } from '../../db/entities/DawarichVisitSuggestions.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { BucketListRepository } from '../../db/repositories/BucketList.repository';
import { DawarichConnectionsRepository } from '../../db/repositories/DawarichConnections.repository';
import { DawarichVisitSuggestionsRepository } from '../../db/repositories/DawarichVisitSuggestions.repository';
import { TripsRepository } from '../../db/repositories/Trips.repository';
import { AddonsService } from '../addons/addons.service';
import { getCountryFromCoords } from '../atlas/atlas-geo';
import { logError, logInfo } from '../audit/audit-log.logger';
import { UnitOfWork } from '../database/unit-of-work';
import { DawarichClient, DawarichError, type DawarichCreds } from './dawarich.client';
import { distanceMeters, localDateOf, normalizeVisit, syncWindow, visitHash } from './dawarich.helpers';
import { DawarichService } from './dawarich.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  DAWARICH_SYNC_LOOKAHEAD_DAYS,
  DAWARICH_SYNC_LOOKBACK_DAYS,
  DAWARICH_BUCKET_MATCH_RADIUS_M,
  DAWARICH_BUCKET_MATCH_MIN_MINUTES,
  type DawarichSyncState,
} from '@trek/shared';

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
    @InjectRepository(DawarichVisitSuggestions) private readonly suggestions: DawarichVisitSuggestionsRepository,
    private readonly addons: AddonsService,
    private readonly client: DawarichClient,
    private readonly dawarich: DawarichService,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(BucketList) private readonly bucketList: BucketListRepository,
    @InjectRepository(DawarichConnections) private readonly connections: DawarichConnectionsRepository,
    private readonly uow: UnitOfWork,
  ) {}

  /** The addon gate, evaluated per tick so an admin toggle lands without a restart. */
  async syncGloballyEnabled(): Promise<boolean> {
    return this.addons.isAddonEnabled(ADDON_IDS.DAWARICH);
  }

  /** Every connected user, one after another. The cron's entry point. */
  async runSync(): Promise<void> {
    if (!(await this.syncGloballyEnabled())) return;
    if (this.running) return;
    this.running = true;
    try {
      const userIds = await this.dawarich.listSyncableUserIds();
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
      const currentState = await this.connections.getLastSyncState(userId);
      return {
        state: (currentState as DawarichSyncState) ?? 'never',
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
    if (!(await this.syncGloballyEnabled())) {
      await this.dawarich.recordSyncResult(userId, 'failed', 'addon_disabled');
      return { state: 'failed', created: 0, updated: 0, missing: 0 };
    }

    const creds = await this.dawarich.getCredentials(userId);
    if (!creds) {
      await this.dawarich.recordSyncResult(userId, 'failed', 'not_connected');
      return { state: 'failed', created: 0, updated: 0, missing: 0 };
    }

    const trips = await this.listTripsToSync(userId);
    if (trips.length === 0) {
      // Nothing to ask about is a successful sync, not a failure — otherwise a
      // user with no dated trips sees a permanent red badge for doing nothing wrong.
      await this.dawarich.recordSyncResult(userId, 'ok', null);
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
        const result = await this.syncTripWindow(userId, trip.id, creds, window.from, window.to, trips);
        created += result.created;
        updated += result.updated;
        missing += result.missing;
      } catch (err) {
        failures++;
        lastError = err instanceof DawarichError ? err.code : 'unreachable';
      }
    }

    const state: DawarichSyncState = failures === 0 ? 'ok' : failures === trips.length ? 'failed' : 'partial';
    await this.dawarich.recordSyncResult(userId, state, state === 'ok' ? null : lastError);

    // The probe is cheap next to the windows just fetched, and re-running it is
    // how a Dawarich upgrade that finally ships `updated_at` starts being used
    // without anyone reconnecting.
    if (state !== 'failed') {
      try {
        await this.dawarich.storeCapabilities(userId, await this.dawarich.probeCapabilities(creds));
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
  private async listTripsToSync(userId: number): Promise<TripRow[]> {
    return this.trips.listTripsToSync(userId);
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
   *
   * `trips` is every trip this run walks. A window reaches past its own trip
   * on both sides, so a stay can be fetched by two neighbouring trips, and the
   * one whose dates actually hold it is the one that gets it (see `tripForVisit`).
   */
  async syncTripWindow(
    userId: number,
    tripId: number,
    creds: DawarichCreds,
    from: Date,
    to: Date,
    trips: TripRow[] = [],
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
      const existing = await this.suggestions.findByUserAndVisit(userId, visit.sourceVisitId);

      // Dawarich has no country code on a visit's place, so it is resolved here
      // from the coordinates against the same borders the Atlas draws. A code
      // the source does start sending one day wins, because it is the source's
      // own answer.
      const countryCode =
        visit.countryCodeFromSource ??
        (visit.lat !== null && visit.lng !== null ? getCountryFromCoords(visit.lat, visit.lng) : null);

      const ownerTripId = tripForVisit(visit.localDate, tripId, existing?.trip_id ?? null, trips);

      if (!existing) {
        await this.suggestions.insertVisit({
          user_id: userId,
          source_visit_id: visit.sourceVisitId,
          trip_id: ownerTripId,
          name: visit.name,
          lat: visit.lat,
          lng: visit.lng,
          started_at: visit.startedAt,
          ended_at: visit.endedAt,
          duration_minutes: visit.durationMinutes,
          local_date: visit.localDate,
          source_status: visit.status,
          confidence: visit.confidence,
          confidence_band: visit.confidenceBand,
          country_code: countryCode,
          source_hash: hash,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        });
        created++;
        await this.matchBucketList(userId, visit.sourceVisitId, visit.lat, visit.lng, visit.durationMinutes);
        continue;
      }

      const changed = existing.source_hash !== hash;

      if (existing.state === 'new') {
        // Nobody has acted on it yet, so the newest version of the source is
        // simply the better suggestion. Overwriting here loses nothing, and
        // that includes the trip: a stay parked on a neighbour by an earlier
        // run moves to the trip whose dates hold it.
        await this.suggestions.updateNewVisit(existing.id, {
          name: visit.name,
          lat: visit.lat,
          lng: visit.lng,
          started_at: visit.startedAt,
          ended_at: visit.endedAt,
          duration_minutes: visit.durationMinutes,
          local_date: visit.localDate,
          source_status: visit.status,
          confidence: visit.confidence,
          confidence_band: visit.confidenceBand,
          country_code: countryCode,
          source_hash: hash,
          trip_id: ownerTripId,
          last_seen_at: new Date().toISOString(),
        });
        if (changed) updated++;
        await this.matchBucketList(userId, visit.sourceVisitId, visit.lat, visit.lng, visit.durationMinutes);
        continue;
      }

      // Accepted or dismissed: the hash is refreshed so the flag is raised once
      // rather than on every tick, but nothing the user can see is rewritten.
      // `accepted_hash` is what they said yes to; the difference between that
      // and the current hash is what the UI reports.
      await this.suggestions.refreshHash(existing.id, hash, new Date().toISOString());
      if (changed) updated++;
    }

    const missing = await this.flagMissing(userId, tripId, from, to, seenIds);
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
  private async flagMissing(
    userId: number,
    tripId: number,
    from: Date,
    to: Date,
    seenIds: Set<string>,
  ): Promise<number> {
    // Bounded on `local_date`, not on `started_at`. Dawarich renders a visit's
    // start as local wall-clock plus an offset (`2026-09-01T14:23:00+02:00`)
    // while the window is UTC (`…Z`), and comparing those two shapes as strings
    // is only accurate to the date — on a statement that DELETES rows, "only
    // accurate to the date" is not good enough. `local_date` is a plain
    // YYYY-MM-DD on both sides of the comparison, and a day of slack at each
    // end is deliberate: a row just outside the window is left alone rather
    // than deleted for not having been seen.
    const candidates = await this.suggestions.listCandidatesForWindow(
      userId,
      tripId,
      localDateOf(from.toISOString()),
      localDateOf(to.toISOString()),
    );

    const gone = candidates.filter((row) => !seenIds.has(row.source_visit_id));
    if (gone.length === 0) return 0;

    const stamp = new Date().toISOString();
    await this.uow.transactional(async () => {
      for (const row of gone) {
        if (row.state === 'new') {
          await this.suggestions.deleteById(row.id);
        } else {
          await this.suggestions.stampMissingIfUnset(row.id, stamp);
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
  private async matchBucketList(
    userId: number,
    sourceVisitId: string,
    lat: number | null,
    lng: number | null,
    durationMinutes: number,
  ): Promise<void> {
    if (lat === null || lng === null) return;
    if (durationMinutes < DAWARICH_BUCKET_MATCH_MIN_MINUTES) return;

    // A rough box first so SQLite does not measure every wish in the world. One
    // degree of latitude is ~111 km, and longitude shrinks with latitude, so the
    // box is deliberately generous and the real test is the distance below.
    const degrees = (DAWARICH_BUCKET_MATCH_RADIUS_M / 111_000) * 2 + 0.01;
    const nearby = await this.bucketList.listInBoundingBox(
      userId,
      lat - degrees,
      lat + degrees,
      lng - degrees,
      lng + degrees,
    );

    let best: { id: number; lat: number; lng: number; distance: number } | null = null;
    for (const item of nearby) {
      if (item.lat === null || item.lng === null) continue;
      const distance = distanceMeters(lat, lng, item.lat, item.lng);
      if (distance > DAWARICH_BUCKET_MATCH_RADIUS_M) continue;
      if (!best || distance < best.distance) best = { id: item.id, lat: item.lat, lng: item.lng, distance };
    }
    if (!best) return;

    await this.claimWish(userId, sourceVisitId, best, lat, lng, durationMinutes);
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
  private async claimWish(
    userId: number,
    sourceVisitId: string,
    wish: { id: number; lat: number; lng: number; distance: number },
    lat: number,
    lng: number,
    durationMinutes: number,
  ): Promise<void> {
    const holders = await this.suggestions.listHoldersOfWish(userId, wish.id, sourceVisitId);

    for (const holder of holders) {
      if (holder.lat === null || holder.lng === null) continue;
      const distance = distanceMeters(holder.lat, holder.lng, wish.lat, wish.lng);
      const holderWins =
        distance < wish.distance || (distance === wish.distance && holder.duration_minutes > durationMinutes);
      if (holderWins) return;
    }

    await this.uow.transactional(async () => {
      await this.suggestions.clearWishHolders(userId, wish.id);
      await this.suggestions.assignWishHolder(userId, sourceVisitId, wish.id);
    });
  }
}

interface TripRow {
  id: number;
  start_date: string | null;
  end_date: string | null;
}

/**
 * Does the trip's own span, not its widened window, hold this local date?
 *
 * Plain string order, because both sides are `YYYY-MM-DD`. A start that is not
 * a date at all covers nothing: `syncWindow` skips such a trip, and it must
 * not claim other trips' stays from the sidelines either.
 */
function tripCovers(trip: TripRow, localDate: string): boolean {
  if (!trip.start_date || !Number.isFinite(Date.parse(`${trip.start_date}T00:00:00Z`))) return false;
  if (localDate < trip.start_date) return false;
  return !trip.end_date || localDate <= trip.end_date;
}

/**
 * The trip a stay belongs to.
 *
 * Every window is padded by the lookback, so two trips a few days apart both
 * fetch the last days of the earlier one, and whichever asked first would
 * otherwise keep those stays for good. The trip whose dates hold the stay
 * outranks the trip whose padding merely reached it. A row already sitting on
 * a trip that covers its date stays put, so two overlapping trips cannot hand
 * a stay back and forth on every run. A stay outside every trip, such as the
 * evening before departure, keeps the trip it has or goes to the window that
 * found it, exactly as before.
 */
function tripForVisit(
  localDate: string,
  currentTripId: number,
  existingTripId: number | null,
  trips: TripRow[],
): number {
  const existing = existingTripId === null ? undefined : trips.find((t) => t.id === existingTripId);
  if (existing && tripCovers(existing, localDate)) return existing.id;
  const current = trips.find((t) => t.id === currentTripId);
  if (current && tripCovers(current, localDate)) return current.id;
  const other = trips.find((t) => tripCovers(t, localDate));
  if (other) return other.id;
  return existingTripId ?? currentTripId;
}
