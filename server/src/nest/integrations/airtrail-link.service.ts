import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { logError } from '../audit/audit-log.logger';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsReadRepository } from '../reservations/reservations-read.repository';
import { buildSavePayload } from './airtrail-sync.helpers';
import { AirtrailAuthError, type AirtrailCreds, type AirtrailFlightRaw } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import { canonicalHash } from './airtrail.mapper';
import { AirtrailService } from './airtrail.service';
import { Injectable } from '@nestjs/common';

/**
 * The AirTrail link lifecycle — the enablement gate, the detach policy, the
 * multi-leg guard (#1535) and the TREK → AirTrail write-back (#1240) — split
 * out of AirtrailSyncService so ReservationsModule can inject it: it reads
 * reservations through the leaf ReservationsReadRepository, never through
 * ReservationsService, so AirtrailCoreModule stays off the
 * ReservationsModule → AirtrailModule → ReservationsModule loop that used to
 * force airtrail.bridge. The pull half stays in AirtrailSyncService, which
 * genuinely needs ReservationsService (remote changes apply through the real
 * update path) and delegates these shared pieces back here.
 */
@Injectable()
export class AirtrailLinkService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly addons: AddonsService,
    private readonly reads: ReservationsReadRepository,
    private readonly client: AirtrailClient,
    private readonly airtrail: AirtrailService,
  ) {}

  /** Global on/off: the addon must be enabled and sync not explicitly turned off. */
  syncGloballyEnabled(): boolean {
    if (!this.addons.isAddonEnabled(ADDON_IDS.AIRTRAIL)) return false;
    const row = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'airtrail_sync_enabled'");
    return row?.value !== 'false';
  }

  broadcastUpdated(tripId: number, reservationId: number): void {
    try {
      const reservation = this.reads.getReservationWithJoins(reservationId);
      if (reservation)
        this.realtime.broadcast(String(tripId), 'reservation:updated', { reservation } as never, undefined);
    } catch {
      /* broadcast failure is non-fatal */
    }
  }

  detach(tripId: number, reservationId: number): void {
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
  hasLocalMultiLegShape(reservationId: number, metadataJson: string | null | undefined): boolean {
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

  /**
   * Push a locally-edited linked reservation back to AirTrail using the importer's
   * (owner's) credentials — even if a different member made the edit. If the owner
   * is gone or the flight no longer exists in AirTrail, the link is detached so the
   * next pull's AirTrail-wins policy can't silently revert the local edit.
   */
  async pushReservationToAirtrail(reservationId: number, tripId: number): Promise<void> {
    if (!this.syncGloballyEnabled()) return;

    const row = this.db.get<{
      id: number;
      trip_id: number;
      external_id: string;
      external_owner_user_id: number | null;
      sync_enabled: number;
    }>(
      "SELECT id, trip_id, external_id, external_owner_user_id, sync_enabled FROM reservations WHERE id = ? AND external_source = 'airtrail'",
      reservationId,
    );
    if (!row || !row.sync_enabled) return;

    // An edit that turned this linked flight into a multi-leg booking severs the
    // 1:1 mapping to the AirTrail flight: pushing would rewrite that flight to the
    // full span, and the next pull would flatten the layover again. Detach — the
    // merge is a deliberate local restructuring, like a joined import (#1535).
    const reservation = this.reads.getReservationWithJoins(row.id);
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
