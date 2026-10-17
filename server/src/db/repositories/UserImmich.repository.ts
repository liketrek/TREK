import { coalesceOverrideWhileSame } from '../dialect/sql-functions';
import { Users } from '../entities/Users.entity';
import { TrekRepository } from './_shared/trek-repository';
import type { EntityManager } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/sql';

/**
 * The Immich connection a user keeps on their own `users` row (`immich_url`,
 * `immich_api_key`, `immich_allow_insecure_tls`, `immich_auto_upload`): the
 * statements `ImmichService` and `JourneyService` issue, apart from the rest
 * of the account in `UsersRepository`. Same table, no move of the columns.
 *
 * Every value stays exactly what the SERVICE hands this repository —
 * encrypted, plaintext or null, at the same point in the pipeline the raw SQL
 * saw it. This repository never calls `encrypt_api_key`/`decrypt_api_key`/
 * `maybe_encrypt_api_key` itself.
 */
export class UserImmichRepository extends TrekRepository<Users> {
  /** Built over the context-resolving EntityManager, like the repositories MikroORM hands out per entity. */
  constructor(em: EntityManager) {
    super(em as SqlEntityManager, Users);
  }

  /**
   * IM1 (`ImmichService.getImmichCredentials`) — `SELECT immich_url,
   * immich_api_key, immich_allow_insecure_tls FROM users WHERE id = ?`
   * (the TLS switch joined the read with #2475).
   */
  async getImmichCredentials(id: number): Promise<{
    immich_url: string | null;
    immich_api_key: string | null;
    immich_allow_insecure_tls: number | null;
  } | null> {
    const row = await this.findOne({ id }, { fields: ['immich_url', 'immich_api_key', 'immich_allow_insecure_tls'] });
    return row
      ? {
          immich_url: row.immich_url ?? null,
          immich_api_key: row.immich_api_key ?? null,
          immich_allow_insecure_tls: row.immich_allow_insecure_tls ?? null,
        }
      : null;
  }

  /** JV1 (`JourneyService.immichAutoUploadEnabled`) — `SELECT immich_auto_upload FROM users WHERE id = ?`. */
  async getImmichAutoUpload(id: number): Promise<number | null> {
    const row = await this.findOne({ id }, { fields: ['immich_auto_upload'] });
    return row?.immich_auto_upload ?? null;
  }

  /**
   * IM2 (`ImmichService.getConnectionSettings`'s prefs read) — `SELECT
   * immich_auto_upload, immich_allow_insecure_tls FROM users WHERE id = ?`
   * (the TLS switch joined the read with #2475).
   */
  async getImmichConnectionPrefs(
    id: number,
  ): Promise<{ immich_auto_upload: number | null; immich_allow_insecure_tls: number | null } | null> {
    const row = await this.findOne({ id }, { fields: ['immich_auto_upload', 'immich_allow_insecure_tls'] });
    return row
      ? {
          immich_auto_upload: row.immich_auto_upload ?? null,
          immich_allow_insecure_tls: row.immich_allow_insecure_tls ?? null,
        }
      : null;
  }

  /** IM3 (`ImmichService.setImmichAutoUpload`) — `UPDATE users SET immich_auto_upload = ? WHERE id = ?`. */
  async setImmichAutoUpload(id: number, enabled: number): Promise<void> {
    await this.nativeUpdate({ id }, { immich_auto_upload: enabled });
  }

  /**
   * IM4 (`ImmichService.saveImmichSettings`'s URL branch) — `UPDATE users SET
   * immich_url = ?, immich_api_key = ?, immich_allow_insecure_tls = CASE WHEN
   * immich_url IS ? THEN COALESCE(?, immich_allow_insecure_tls) ELSE
   * COALESCE(?, 0) END WHERE id = ?` (#2475).
   *
   * One statement, as the legacy write was: SET expressions read the row as
   * it was, so the CASE compares the STORED url with the new one and decides
   * the switch inside the UPDATE itself (`coalesceOverrideWhileSame`).
   * `allow_insecure_tls` null keeps the stored choice while the URL stays the
   * same, and a new URL without an explicit value starts off.
   */
  async setImmichSettings(
    id: number,
    immich_url: string,
    immich_api_key: string | null,
    allow_insecure_tls: number | null,
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        immich_url,
        immich_api_key,
        immich_allow_insecure_tls: coalesceOverrideWhileSame(
          platform,
          allow_insecure_tls,
          'immich_allow_insecure_tls',
          'immich_url',
          immich_url,
        ),
      },
    );
  }

  /**
   * IM5 (`ImmichService.saveImmichSettings`'s disconnect branch) — `UPDATE
   * users SET immich_url = ?, immich_api_key = ?, immich_allow_insecure_tls = 0
   * WHERE id = ?` with a `null` URL: disconnecting always turns the switch off.
   */
  async clearImmichSettings(id: number, immich_api_key: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { immich_url: null, immich_api_key, immich_allow_insecure_tls: 0 });
  }
}
