import { currentTimestamp } from '../dialect/sql-functions';
import type { TripInviteTokens } from '../entities/TripInviteTokens.entity';
import { TrekRepository } from './_shared/trek-repository';

/** `trip-invite.service.ts::get`'s projection. */
export interface TripInviteInfoRow {
  token: string;
  expires_at: string | null;
  created_at: string;
}

/** `trip-invite.service.ts::resolve`'s joined projection. */
export interface TripInviteResolvedRow {
  trip_id: number;
  title: string;
  expires_at: string | null;
}

interface TripInviteResolveKyselyDB {
  trip_invite_tokens: { token: string; trip_id: number; expires_at: string | null };
  trips: { id: number; title: string };
}

/**
 * `trip_invite_tokens` (Plan 4 Task 1). One row per trip (`uniques: [{
 * properties: ['trip'] }]`, `TripInviteTokens.entity.ts`) — every method
 * here is scoped by `trip_id`, raw-bind (`number | string`, D4's T5 escape
 * hatch): `TripInviteService`'s own methods take `tripId: string | number`
 * and bind it unconverted, matching the legacy statements exactly.
 */
export class TripInviteTokensRepository extends TrekRepository<TripInviteTokens> {
  /** `get()` — `SELECT token, expires_at, created_at FROM trip_invite_tokens WHERE trip_id = ?`. */
  async findInfoByTrip(trip_id: number | string): Promise<TripInviteInfoRow | undefined> {
    return await this.qb('t')
      .select(['t.token', 't.expires_at', 't.created_at'])
      .where('t.trip_id = ?', [trip_id])
      .execute<TripInviteInfoRow | undefined>('get', false);
  }

  /**
   * `createOrRotate`'s probe, inside `uow.transactional` — `SELECT id FROM
   * trip_invite_tokens WHERE trip_id = ?`, a bare existence check deciding
   * the UPDATE-vs-INSERT branch below.
   */
  async existsForTrip(trip_id: number | string): Promise<boolean> {
    const row = await this.qb('t')
      .select(['t.id'])
      .where('t.trip_id = ?', [trip_id])
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `createOrRotate`'s UPDATE branch (rotate) — `UPDATE trip_invite_tokens
   * SET token = ?, expires_at = ?, created_by = ?, created_at =
   * CURRENT_TIMESTAMP WHERE trip_id = ?`. `created_by` writes through
   * `createdByRef`, the real joined-column relation property — `created_by`
   * itself is a `persist(false)` mirror (`TripInviteTokens.entity.ts`).
   * `CURRENT_TIMESTAMP` through the shared dialect helper (rule 5), matching
   * the column's own `defaultRaw` literal exactly.
   */
  async updateForTrip(
    trip_id: number | string,
    input: { token: string; expires_at: string | null; created_by: number },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb('t')
      .update({
        token: input.token,
        expires_at: input.expires_at,
        createdByRef: input.created_by,
        created_at: currentTimestamp(platform),
      })
      .where('t.trip_id = ?', [trip_id])
      .execute('run');
  }

  /**
   * `createOrRotate`'s INSERT branch (first link) — `INSERT INTO
   * trip_invite_tokens (trip_id, token, created_by, expires_at) VALUES (?,
   * ?, ?, ?)`. `created_at` is not in the legacy column set — left to the
   * column's own `defaultRaw` (`CURRENT_TIMESTAMP`), same as
   * `DayNotesRepository.createNote`'s documented shape for an unnamed
   * `defaultRaw` column. `trip`, not the raw `trip_id`: `insert()`'s typed
   * relation property wants the entity's own primary-key type — the caller
   * (`TripInviteService`) only ever calls this once a trip-scoped route has
   * already resolved a REAL numeric trip id through `TripAccessGuard`, so
   * `Number(...)` here mirrors the same seam `DayNotesService.create`'s own
   * `Number(dayId)`/`Number(tripId)` conversion documents.
   */
  async insertForTrip(input: {
    trip_id: number | string;
    token: string;
    created_by: number;
    expires_at: string | null;
  }): Promise<void> {
    await this.insert({
      trip: Number(input.trip_id),
      token: input.token,
      createdByRef: input.created_by,
      expires_at: input.expires_at,
    });
  }

  /** `remove()` — `DELETE FROM trip_invite_tokens WHERE trip_id = ?`. */
  async deleteByTrip(trip_id: number | string): Promise<void> {
    await this.qb('t').delete().where('t.trip_id = ?', [trip_id]).execute('run');
  }

  /**
   * `resolve(token)` — `SELECT t.id AS trip_id, t.title AS title,
   * ti.expires_at AS expires_at FROM trip_invite_tokens ti JOIN trips t ON
   * ti.trip_id = t.id WHERE ti.token = ?`. Kysely (a cross-table join to
   * `trips`, the same escape-hatch order every other cross-table read in
   * this program uses) — expiry itself is checked in JS by the caller
   * (`TripInviteService.resolve`'s own docstring), never in this query.
   */
  async resolveTokenToTrip(token: string): Promise<TripInviteResolvedRow | undefined> {
    const row = await this.kysely<TripInviteResolveKyselyDB>()
      .selectFrom('trip_invite_tokens as ti')
      .innerJoin('trips as t', 't.id', 'ti.trip_id')
      .select(['t.id as trip_id', 't.title as title', 'ti.expires_at as expires_at'])
      .where('ti.token', '=', token)
      .executeTakeFirst();
    return row as TripInviteResolvedRow | undefined;
  }
}
