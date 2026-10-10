import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ADDON_IDS } from '../../addons';
import { Reservations } from '../../db/entities/Reservations.entity';
import { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { ReservationEndpointsRepository } from '../../db/repositories/ReservationEndpoints.repository';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { RealtimeService } from '../realtime/realtime.service';
import { AddonsService } from '../addons/addons.service';
import { ReservationsReadService } from '../reservations/reservations-read.service';
import { logError } from '../audit/audit-log.logger';
import { AirtrailAuthError, type AirtrailCreds, type AirtrailFlightRaw } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import { AirtrailService } from './airtrail.service';
import { canonicalHash } from './airtrail.mapper';
import { buildSavePayload } from './airtrail-sync.helpers';
import { RESERVATION_METADATA } from '../../db/json-columns';
import { decodeJson } from '../../utils/json-column';
import { readAppSetting } from '../common/app-settings.registry';

/**
 * The AirTrail link lifecycle — the enablement gate, the detach policy, the
 * multi-leg guard (#1535) and the TREK → AirTrail write-back (#1240) — split
 * out of AirtrailSyncService so ReservationsModule can inject it: it reads
 * reservations through the leaf ReservationsReadService, never through
 * ReservationsService, so AirtrailCoreModule stays off the
 * ReservationsModule → AirtrailModule → ReservationsModule loop that used to
 * force airtrail.bridge. The pull half stays in AirtrailSyncService, which
 * genuinely needs ReservationsService (remote changes apply through the real
 * update path) and delegates these shared pieces back here.
 */
@Injectable()
export class AirtrailLinkService {
  constructor(
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ReservationEndpoints) private readonly endpointsRepo: ReservationEndpointsRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly realtime: RealtimeService,
    private readonly addons: AddonsService,
    private readonly reads: ReservationsReadService,
    private readonly client: AirtrailClient,
    private readonly airtrail: AirtrailService,
  ) {}

  /** Global on/off: the addon must be enabled and sync not explicitly turned off. */
  async syncGloballyEnabled(): Promise<boolean> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.AIRTRAIL))) return false;
    const value = await readAppSetting(this.appSettings, 'airtrail_sync_enabled');
    return value !== 'false';
  }

  async broadcastUpdated(tripId: number, reservationId: number): Promise<void> {
    try {
      const reservation = await this.reads.getReservationWithJoins(reservationId);
      if (reservation) this.realtime.broadcast(String(tripId), 'reservation:updated', { reservation } as never, undefined);
    } catch {
      /* broadcast failure is non-fatal */
    }
  }

  async detach(tripId: number, reservationId: number): Promise<void> {
    await this.reservationsRepo.setAirtrailSyncDisabled(reservationId);
    await this.broadcastUpdated(tripId, reservationId);
  }

  /**
   * True when the reservation has grown into a multi-leg booking locally (extra
   * stops / metadata.legs) — a shape the single AirTrail flight it is linked to
   * cannot represent. Syncing such a row in either direction would corrupt one
   * side: a pull flattens the layover chain back to from→to, a push rewrites the
   * AirTrail flight to span the whole route (#1535).
   */
  async hasLocalMultiLegShape(reservationId: number, metadataJson: string | null | undefined): Promise<boolean> {
    // Malformed metadata falls through to the endpoint count.
    const legs = decodeJson(RESERVATION_METADATA, metadataJson, `reservation ${reservationId}`).legs;
    if (Array.isArray(legs) && legs.length > 1) return true;
    const n = await this.endpointsRepo.count({ reservation: reservationId });
    return n > 2;
  }

  /**
   * Push a locally-edited linked reservation back to AirTrail using the importer's
   * (owner's) credentials — even if a different member made the edit. If the owner
   * is gone or the flight no longer exists in AirTrail, the link is detached so the
   * next pull's AirTrail-wins policy can't silently revert the local edit.
   */
  async pushReservationToAirtrail(reservationId: number, tripId: number): Promise<void> {
    if (!(await this.syncGloballyEnabled())) return;

    const row = await this.reservationsRepo.findAirtrailLinked(reservationId);
    if (!row || !row.sync_enabled) return;

    // An edit that turned this linked flight into a multi-leg booking severs the
    // 1:1 mapping to the AirTrail flight: pushing would rewrite that flight to the
    // full span, and the next pull would flatten the layover again. Detach — the
    // merge is a deliberate local restructuring, like a joined import (#1535).
    const reservation = await this.reads.getReservationWithJoins(row.id);
    if (!reservation) return;
    if (await this.hasLocalMultiLegShape(row.id, (reservation as { metadata?: string | null }).metadata)) {
      await this.detach(tripId, row.id);
      return;
    }

    // AirTrail is read-only by default (#1240). Only push when the flight's owner has
    // explicitly opted in. A no-op skip (not a detach): the link stays active so the
    // inbound, AirTrail-wins pull keeps the reservation up to date.
    if (!row.external_owner_user_id || !(await this.airtrail.isAirtrailWriteEnabled(row.external_owner_user_id))) return;

    const creds: AirtrailCreds | null = await this.airtrail.getAirtrailCredentials(row.external_owner_user_id);
    if (!creds) {
      await this.detach(tripId, row.id); // owner disconnected — cannot push, so stop syncing
      return;
    }

    let existing: AirtrailFlightRaw | null;
    try {
      existing = await this.client.getFlight(creds, Number(row.external_id));
    } catch (err) {
      if (err instanceof AirtrailAuthError) await this.detach(tripId, row.id);
      else logError(`AirTrail push: get failed for reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
      return;
    }
    if (!existing) {
      await this.detach(tripId, row.id); // gone in AirTrail → treat like a remote delete
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
        await this.reservationsRepo.setAirtrailSyncStamp(row.id, canonicalHash(saved), new Date().toISOString());
      }
    } catch (err) {
      logError(`AirTrail push failed for reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
