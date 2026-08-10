import { Injectable } from '@nestjs/common';
import { ADDON_IDS } from '../../addons';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AddonsService } from '../addons/addons.service';
import { ReservationsService } from '../reservations/reservations.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { AirtrailAuthError, type AirtrailCreds, type AirtrailFlightRaw } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import { AirtrailService } from './airtrail.service';
import { canonicalHash, mapFlightToReservation } from './airtrail.mapper';
import { buildSavePayload } from './airtrail-sync.helpers';

export { buildSavePayload } from './airtrail-sync.helpers';

/**
 * Two-way AirTrail sync: the background pull that reconciles linked reservations
 * against the owner's current flights, and the push that writes a local edit
 * back.
 *
 * Folded out of services/airtrail/airtrailSync.ts. Every rule is unchanged — the
 * snapshot-hash change detection, the detach-instead-of-delete policy, the
 * multi-leg guard (#1535), the write opt-in (#1240) and the self-write
 * suppression. What moved is the wiring: the db singleton, the raw websocket
 * broadcast and three bridges (addons, reservations) were module imports and are
 * injected now.
 */
@Injectable()
export class AirtrailSyncService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly addons: AddonsService,
    private readonly reservations: ReservationsService,
    private readonly client: AirtrailClient,
    private readonly airtrail: AirtrailService,
  ) {}

  /** Guards the background poll against overlapping ticks. Instance state rather
   *  than a module-level flag, because the service is a container singleton. */
  private running = false;

  /** Global on/off: the addon must be enabled and sync not explicitly turned off. */
  syncGloballyEnabled(): boolean {
    if (!this.addons.isAddonEnabled(ADDON_IDS.AIRTRAIL)) return false;
    const row = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'airtrail_sync_enabled'");
    return row?.value !== 'false';
  }

  private broadcastUpdated(tripId: number, reservationId: number): void {
    try {
      const reservation = this.reservations.getReservationWithJoins(reservationId);
      if (reservation) this.realtime.broadcast(String(tripId), 'reservation:updated', { reservation } as never, undefined);
    } catch {
      /* broadcast failure is non-fatal */
    }
  }

  private detach(tripId: number, reservationId: number): void {
    this.db.run('UPDATE reservations SET sync_enabled = 0 WHERE id = ?', reservationId);
    this.broadcastUpdated(tripId, reservationId);
  }

  /**
   * True when the reservation has grown into a multi-leg booking locally (extra
   * stops / metadata.legs) — a shape the single AirTrail flight it is linked to
   * cannot represent. Syncing such a row in either direction would corrupt one
   * side: a pull flattens the layover chain back to from→to, a push rewrites the
   * AirTrail flight to span the whole route (#1535).
   */
  private hasLocalMultiLegShape(reservationId: number, metadataJson: string | null | undefined): boolean {
    try {
      const meta = metadataJson ? JSON.parse(metadataJson) : {};
      if (Array.isArray(meta?.legs) && meta.legs.length > 1) return true;
    } catch {
      /* malformed metadata — fall through to the endpoint count */
    }
    const row = this.db.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM reservation_endpoints WHERE reservation_id = ?',
      reservationId,
    ) as { n: number };
    return row.n > 2;
  }

  // ── AirTrail → TREK (poll) ───────────────────────────────────────────────────

  /**
   * Reconcile one owner's linked reservations against their current AirTrail
   * flights: apply field changes (detected by snapshot hash, since AirTrail has no
   * updated_at) and, when a flight is gone from AirTrail, keep the TREK row but
   * stop syncing it. Only already-imported flights are touched — new AirTrail
   * flights are never auto-added to a trip. Returns how many rows changed.
   */
  private async syncOwner(uid: number): Promise<number> {
    const creds = this.airtrail.getAirtrailCredentials(uid);
    if (!creds) return 0; // owner disconnected — leave their linked rows as-is

    let flights: AirtrailFlightRaw[];
    try {
      flights = await this.client.listFlights(creds);
    } catch (err) {
      if (err instanceof AirtrailAuthError) logError(`AirTrail sync: invalid API key for user ${uid}`);
      return 0;
    }
    const byId = new Map(flights.map((f) => [String(f.id), f]));

    const linked = this.db.all<{ id: number; trip_id: number; external_id: string; external_hash: string | null }>(
      "SELECT id, trip_id, external_id, external_hash FROM reservations WHERE external_source = 'airtrail' AND sync_enabled = 1 AND external_owner_user_id = ?",
      uid,
    );

    let changed = 0;
    for (const row of linked) {
      const flight = byId.get(String(row.external_id));
      if (!flight) {
        this.detach(row.trip_id, row.id); // deleted in AirTrail → keep row, stop syncing
        changed++;
        continue;
      }

      const hash = canonicalHash(flight);
      if (hash === row.external_hash) continue;

      const current = this.reservations.getReservation(row.id, row.trip_id);
      if (!current) continue;
      if (this.hasLocalMultiLegShape(row.id, (current as any).metadata)) {
        // The user connected this flight into a multi-leg booking; applying the
        // remote single-flight shape would flatten it. Stop syncing instead.
        this.detach(row.trip_id, row.id);
        changed++;
        continue;
      }
      try {
        this.reservations.update(row.id, row.trip_id, mapFlightToReservation(flight) as any, current as any);
        this.db.run(
          'UPDATE reservations SET external_hash = ?, external_synced_at = ? WHERE id = ?',
          hash,
          new Date().toISOString(),
          row.id,
        );
        this.broadcastUpdated(row.trip_id, row.id);
        changed++;
      } catch (err) {
        logError(`AirTrail sync: failed to update reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
    return changed;
  }

  /** Background poll across every connected owner (scheduler). */
  async runAirtrailSync(): Promise<void> {
    if (this.running) return;
    if (!this.syncGloballyEnabled()) return;
    this.running = true;
    let changed = 0;
    try {
      const owners = this.db.all<{ uid: number }>(
        "SELECT DISTINCT external_owner_user_id AS uid FROM reservations WHERE external_source = 'airtrail' AND sync_enabled = 1 AND external_owner_user_id IS NOT NULL",
      );
      for (const { uid } of owners) changed += await this.syncOwner(uid);
      if (changed > 0) logInfo(`AirTrail sync: applied ${changed} change(s)`);
    } catch (err) {
      logError(`AirTrail sync failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      this.running = false;
    }
  }

  /**
   * On-demand sync of just this user's linked flights — called when the user opens
   * a trip so AirTrail-side edits show up immediately instead of waiting for the
   * background poll.
   */
  async runAirtrailSyncForUser(userId: number): Promise<{ changed: number }> {
    if (!this.syncGloballyEnabled()) return { changed: 0 };
    try {
      return { changed: await this.syncOwner(userId) };
    } catch (err) {
      logError(`AirTrail sync (user ${userId}) failed: ${err instanceof Error ? err.message : err}`);
      return { changed: 0 };
    }
  }

  // ── TREK → AirTrail (push) ───────────────────────────────────────────────────

  /**
   * Push a locally-edited linked reservation back to AirTrail using the importer's
   * (owner's) credentials — even if a different member made the edit. If the owner
   * is gone or the flight no longer exists in AirTrail, the link is detached so the
   * next pull's AirTrail-wins policy can't silently revert the local edit.
   */
  async pushReservationToAirtrail(reservationId: number, tripId: number): Promise<void> {
    if (!this.syncGloballyEnabled()) return;

    const row = this.db.get<{
      id: number; trip_id: number; external_id: string; external_owner_user_id: number | null; sync_enabled: number;
    }>(
      "SELECT id, trip_id, external_id, external_owner_user_id, sync_enabled FROM reservations WHERE id = ? AND external_source = 'airtrail'",
      reservationId,
    );
    if (!row || !row.sync_enabled) return;

    // An edit that turned this linked flight into a multi-leg booking severs the
    // 1:1 mapping to the AirTrail flight: pushing would rewrite that flight to the
    // full span, and the next pull would flatten the layover again. Detach — the
    // merge is a deliberate local restructuring, like a joined import (#1535).
    const reservation = this.reservations.getReservationWithJoins(row.id);
    if (!reservation) return;
    if (this.hasLocalMultiLegShape(row.id, (reservation as { metadata?: string | null }).metadata)) {
      this.detach(tripId, row.id);
      return;
    }

    // AirTrail is read-only by default (#1240). Only push when the flight's owner has
    // explicitly opted in. A no-op skip (not a detach): the link stays active so the
    // inbound, AirTrail-wins pull keeps the reservation up to date.
    if (!row.external_owner_user_id || !this.airtrail.isAirtrailWriteEnabled(row.external_owner_user_id)) return;

    const creds: AirtrailCreds | null = this.airtrail.getAirtrailCredentials(row.external_owner_user_id);
    if (!creds) {
      this.detach(tripId, row.id); // owner disconnected — cannot push, so stop syncing
      return;
    }

    let existing: AirtrailFlightRaw | null;
    try {
      existing = await this.client.getFlight(creds, Number(row.external_id));
    } catch (err) {
      if (err instanceof AirtrailAuthError) this.detach(tripId, row.id);
      else logError(`AirTrail push: get failed for reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
      return;
    }
    if (!existing) {
      this.detach(tripId, row.id); // gone in AirTrail → treat like a remote delete
      return;
    }

    const payload = buildSavePayload(reservation, existing);
    if (!payload) return;

    try {
      await this.client.saveFlight(creds, payload);
      // Self-write suppression: re-read the saved flight and store its hash so the
      // next poll doesn't treat our own write as an inbound change.
      const saved = await this.client.getFlight(creds, Number(row.external_id));
      if (saved) {
        this.db.run(
          'UPDATE reservations SET external_hash = ?, external_synced_at = ? WHERE id = ?',
          canonicalHash(saved),
          new Date().toISOString(),
          row.id,
        );
      }
    } catch (err) {
      logError(`AirTrail push failed for reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
