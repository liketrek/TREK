import type { EntityManager } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/sql';
import { Users } from '../entities/Users.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * The AirTrail connection a user keeps on their own `users` row
 * (`airtrail_url`, `airtrail_api_key`, `airtrail_allow_insecure_tls`,
 * `airtrail_write_enabled`): the statements `AirtrailService` issues, apart
 * from the rest of the account in `UsersRepository`. Same table, no move of
 * the columns.
 *
 * The encrypt-in-service discipline of `DawarichConnectionsRepository`: every
 * value below is exactly what the SERVICE hands this repository — encrypted,
 * plaintext or null, at the same point in the pipeline the raw SQL saw it.
 * This repository never calls maybe_encrypt_api_key/decrypt_api_key itself.
 */
export class UserAirtrailRepository extends TrekRepository<Users> {
  /** Built over the context-resolving EntityManager, like the repositories MikroORM hands out per entity. */
  constructor(em: EntityManager) {
    super(em as SqlEntityManager, Users);
  }

  /** ATC1 (`airtrail.service.ts#readRow`) — `SELECT airtrail_url, airtrail_api_key, airtrail_allow_insecure_tls, airtrail_write_enabled FROM users WHERE id = ?`. */
  async getAirtrailConnRow(id: number): Promise<{
    airtrail_url: string | null;
    airtrail_api_key: string | null;
    airtrail_allow_insecure_tls: number | null;
    airtrail_write_enabled: number | null;
  } | null> {
    const row = await this.findOne(
      { id },
      { fields: ['airtrail_url', 'airtrail_api_key', 'airtrail_allow_insecure_tls', 'airtrail_write_enabled'] },
    );
    return row
      ? {
          airtrail_url: row.airtrail_url ?? null,
          airtrail_api_key: row.airtrail_api_key ?? null,
          airtrail_allow_insecure_tls: row.airtrail_allow_insecure_tls ?? null,
          airtrail_write_enabled: row.airtrail_write_enabled ?? null,
        }
      : null;
  }

  /** ATC2 (`airtrail.service.ts#isAirtrailWriteEnabled`) — `SELECT airtrail_write_enabled FROM users WHERE id = ?`. */
  async getAirtrailWriteEnabled(id: number): Promise<number | null> {
    const row = await this.findOne({ id }, { fields: ['airtrail_write_enabled'] });
    return row?.airtrail_write_enabled ?? null;
  }

  /**
   * ATC3 (`airtrail.service.ts#saveSettings`, newKey branch) — `UPDATE users
   * SET airtrail_url = ?, airtrail_api_key = ?, airtrail_allow_insecure_tls
   * = ?, airtrail_write_enabled = ? WHERE id = ?`. **No transaction** — the
   * plan's Risks section flags this as a pre-existing asymmetry with
   * `DawarichConnectionsRepository`'s equivalent `saveSettings` (which DOES
   * wrap its writes in `uow.transactional`): preserved exactly, not
   * "fixed" to match Dawarich's shape.
   */
  async setAirtrailSettingsWithKey(id: number, url: string | null, apiKey: string, allowInsecureTls: number, writeEnabled: number): Promise<void> {
    await this.nativeUpdate(
      { id },
      { airtrail_url: url, airtrail_api_key: apiKey, airtrail_allow_insecure_tls: allowInsecureTls, airtrail_write_enabled: writeEnabled },
    );
  }

  /**
   * ATC4 (`airtrail.service.ts#saveSettings`, no-newKey branch) — `UPDATE
   * users SET airtrail_url = ?, airtrail_allow_insecure_tls = ?,
   * airtrail_write_enabled = ? WHERE id = ?`. Same no-transaction asymmetry
   * as {@link setAirtrailSettingsWithKey} — preserved, not fixed.
   */
  async setAirtrailSettings(id: number, url: string | null, allowInsecureTls: number, writeEnabled: number): Promise<void> {
    await this.nativeUpdate({ id }, { airtrail_url: url, airtrail_allow_insecure_tls: allowInsecureTls, airtrail_write_enabled: writeEnabled });
  }

  /**
   * ATC5 (`airtrail.service.ts#saveSettings`, URL-cleared branch) — `UPDATE
   * users SET airtrail_api_key = NULL WHERE id = ?`. **SECURITY**:
   * credential scrub — a cleared URL with no key left makes the connection
   * meaningless, so the key is dropped too. Same no-transaction asymmetry
   * as the two methods above — this is a THIRD, separate statement in the
   * legacy `saveSettings` (its own `if (!trimmedUrl)` branch), not folded
   * into {@link setAirtrailSettings}.
   */
  async clearAirtrailApiKey(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { airtrail_api_key: null });
  }
}
