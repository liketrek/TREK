import { DomainError } from '../common/domain-error';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import crypto from 'crypto';
import { InviteTokens } from '../../db/entities/InviteTokens.entity';
import type { InviteTokensRepository } from '../../db/repositories/InviteTokens.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { toRowId } from '../common/row-id';

/**
 * Registration invites: the tokens an admin hands out so someone can create an
 * account on a closed instance, optionally dropping them straight into a trip.
 *
 * This lives in auth/ and not in trip-invite/, which is the trap the name sets.
 * invite_tokens and trip_invite_tokens are different tables for different
 * things — the first gates signup, the second adds an existing user to a trip.
 * The consumer of this one is the registration path in AuthService, so the
 * table belongs to the auth domain.
 *
 * The four methods moved verbatim out of AdminService, which held them only
 * because the management routes are under /api/admin. Those routes keep their
 * paths and their guards; AdminController now injects this instead of carrying
 * another domain's SQL.
 *
 * Plan 3b Task 3: `invite_tokens` reads/writes go through
 * `InviteTokensRepository` (RI1, RI4–RI7). RI2/RI3 (`trips`) went through
 * `DatabaseService` until Plan 4 Task 1: `trips` is `nest/trips`' table, not
 * this domain's, and the carve-out was pending `TripsRepository`'s
 * existence — it now exists (Plan 3c) and both reads are additive methods
 * on it (`listIdTitleOrderedByTitle`/`existsById`).
 */
@Injectable()
export class RegistrationInvitesService {
  constructor(
    @InjectRepository(InviteTokens) private readonly inviteTokens: InviteTokensRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
  ) {}

  /** RI1 — `InviteTokensRepository.listWithCreatorAndTrip()`'s joined projection. */
  async listInvites() {
    return this.inviteTokens.listWithCreatorAndTrip();
  }

  /**
   * Trips an admin can bind an invite to — id + title only, for the picker
   * (#1402). RI2 — `TripsRepository.listIdTitleOrderedByTitle()`.
   */
  async listTripsForInvite() {
    return this.trips.listIdTitleOrderedByTitle();
  }

  async createInvite(
    createdBy: number,
    data: { max_uses?: string | number; expires_in_days?: string | number; trip_id?: string | number | null },
  ) {
    const rawUses = Number.parseInt(String(data.max_uses));
    const uses = rawUses === 0 ? 0 : Math.min(Math.max(rawUses || 1, 1), 5);
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = data.expires_in_days
      ? new Date(Date.now() + Number.parseInt(String(data.expires_in_days)) * 86400000).toISOString()
      : null;

    // Optional trip binding: only persist a trip that actually exists, so a stale
    // or forged id can never bind (and never auto-adds anyone on registration).
    // RI3 — `TripsRepository.existsById()`, the same bare `SELECT id FROM
    // trips WHERE id = ?` existence probe.
    let tripId: number | null = null;
    if (data.trip_id != null && String(data.trip_id).trim() !== '') {
      const parsed = Number.parseInt(String(data.trip_id));
      if (!Number.isInteger(parsed) || !(await this.trips.existsById(parsed))) {
        // Used to bind null silently, handing back a plain registration invite
        // the admin never asked for. Thrown, so the controller writes neither
        // the invite nor its audit row and the admin sees the 404.
        throw new DomainError(404, 'Trip not found');
      }
      tripId = parsed;
    }

    // RI4: the write. RI5: the same joined re-select RI1 projects, filtered
    // to the new row — `insertInvite`'s column set already matches this
    // INSERT exactly (Task 0).
    const created = await this.inviteTokens.insertInvite({ token, max_uses: uses, expires_at: expiresAt, created_by: createdBy, trip_id: tripId });
    const invite = await this.inviteTokens.findWithCreatorAndTrip(created.id);

    return { invite, inviteId: created.id, uses, expiresInDays: data.expires_in_days ?? null, tripId };
  }

  async deleteInvite(id: string) {
    // A non-numeric id can never match an `invite_tokens.id` row — resolved
    // here rather than handed to the repository as `NaN` (SQLite's driver
    // has no representation for it as a bind parameter; the legacy raw
    // statement tolerated a non-numeric string bind and simply matched no
    // row, so the 404 below reproduces that same observable outcome without
    // routing an invalid value into the query layer).
    //
    // `toRowId`, not a bare `Number.isInteger(Number(id))` guard: the plain
    // guard accepted prefixed numeric literals JS understands and SQLite's
    // INTEGER affinity does not (`'0x10'` → `16`, `'0b100'` → `4`), which is
    // a genuine parity break, not just stricter validation (Plan 3b Task 3
    // review, F2) — `toRowId` requires the digits-only shape the legacy
    // raw-string bind actually matched.
    const numericId = toRowId(id);
    // RI6 — the 404 check.
    if (numericId === null || (await this.inviteTokens.findIdById(numericId)) === null) {
      throw new DomainError(404, 'Invite not found');
    }
    // RI7.
    await this.inviteTokens.deleteById(numericId);
    return {};
  }
}
