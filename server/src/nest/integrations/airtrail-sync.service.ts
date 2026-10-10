import { Reservations } from '../../db/entities/Reservations.entity';
import { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { logError, logInfo } from '../audit/audit-log.logger';
import { ReservationsService } from '../reservations/reservations.service';
import { AirtrailLinkService } from './airtrail-link.service';
import { AirtrailAuthError, type AirtrailFlightRaw } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import { canonicalHash, mapFlightToReservation } from './airtrail.mapper';
import { AirtrailService } from './airtrail.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

export { buildSavePayload } from './airtrail-sync.helpers';

/**
 * The AirTrail → TREK pull: the background poll that reconciles linked
 * reservations against the owner's current flights. Remote changes apply
 * through the REAL reservation update path (endpoint restamping and all),
 * which is why this service injects ReservationsService and lives in
 * AirtrailModule. The shared link lifecycle — enablement gate, detach policy,
 * multi-leg guard — and the TREK → AirTrail push moved to AirtrailLinkService
 * (AirtrailCoreModule) so the reservations controller can inject the write-back
 * trigger without a module cycle; this class delegates to it.
 *
 * Folded out of services/airtrail/airtrailSync.ts. Every rule is unchanged —
 * the snapshot-hash change detection, the detach-instead-of-delete policy, the
 * multi-leg guard (#1535) and the self-write suppression.
 */
@Injectable()
export class AirtrailSyncService {
  constructor(
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    private readonly link: AirtrailLinkService,
    private readonly reservations: ReservationsService,
    private readonly client: AirtrailClient,
    private readonly airtrail: AirtrailService,
  ) {}

  /** Guards the background poll against overlapping ticks. Instance state rather
   *  than a module-level flag, because the service is a container singleton. */
  private running = false;

  async syncGloballyEnabled(): Promise<boolean> {
    return this.link.syncGloballyEnabled();
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
    const creds = await this.airtrail.getAirtrailCredentials(uid);
    if (!creds) return 0; // owner disconnected — leave their linked rows as-is

    let flights: AirtrailFlightRaw[];
    try {
      flights = await this.client.listFlights(creds);
    } catch (err) {
      if (err instanceof AirtrailAuthError) logError(`AirTrail sync: invalid API key for user ${uid}`);
      return 0;
    }
    const byId = new Map(flights.map((f) => [String(f.id), f]));

    const linked = await this.reservationsRepo.listAirtrailSyncCandidatesForOwner(uid);

    let changed = 0;
    for (const row of linked) {
      const flight = byId.get(String(row.external_id));
      if (!flight) {
        await this.link.detach(row.trip_id, row.id); // deleted in AirTrail → keep row, stop syncing
        changed++;
        continue;
      }

      const hash = canonicalHash(flight);
      if (hash === row.external_hash) continue;

      const current = await this.reservations.getReservation(row.id, row.trip_id);
      if (!current) continue;
      if (await this.link.hasLocalMultiLegShape(row.id, (current as any).metadata)) {
        // The user connected this flight into a multi-leg booking; applying the
        // remote single-flight shape would flatten it. Stop syncing instead.
        await this.link.detach(row.trip_id, row.id);
        changed++;
        continue;
      }
      try {
        await this.reservations.update(row.id, row.trip_id, mapFlightToReservation(flight) as any, current as any);
        await this.reservationsRepo.setAirtrailSyncStamp(row.id, hash, new Date().toISOString());
        await this.link.broadcastUpdated(row.trip_id, row.id);
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
    if (!(await this.link.syncGloballyEnabled())) return;
    this.running = true;
    let changed = 0;
    try {
      const owners = await this.reservationsRepo.listAirtrailSyncOwners();
      for (const uid of owners) changed += await this.syncOwner(uid);
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
    if (!(await this.link.syncGloballyEnabled())) return { changed: 0 };
    try {
      return { changed: await this.syncOwner(userId) };
    } catch (err) {
      logError(`AirTrail sync (user ${userId}) failed: ${err instanceof Error ? err.message : err}`);
      return { changed: 0 };
    }
  }
}
