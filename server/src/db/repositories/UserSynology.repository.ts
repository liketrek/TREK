import { Users } from '../entities/Users.entity';
import { TrekRepository } from './_shared/trek-repository';
import type { EntityManager } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/sql';

/**
 * The six Synology credential/session columns `_readSynologyUser` reads
 * selectively — a closed union, not a dynamic column string, matching
 * `InstanceApiKeyName`'s reasoning in `Users.repository.ts`.
 */
export type SynologyUserColumn =
  'synology_url' | 'synology_username' | 'synology_password' | 'synology_sid' | 'synology_did' | 'synology_skip_ssl';

/**
 * {@link UserSynologyRepository.getSynologyFields}'s return shape — structurally
 * identical to `synology.service.ts`'s own `SynologyUserRecord` (every field
 * optional, so an unrequested column is simply absent), deliberately
 * defined here rather than imported from the service: a repository does not
 * depend on a domain service's types, and the two stay structurally
 * assignable without either side casting.
 */
export interface SynologyFieldsRow {
  synology_url?: string | null;
  synology_username?: string | null;
  synology_password?: string | null;
  synology_sid?: string | null;
  synology_did?: string | null;
  synology_skip_ssl?: number | null;
}

/**
 * The Synology Photos connection a user keeps on their own `users` row
 * (`synology_url`, `synology_username`, `synology_password`, `synology_sid`,
 * `synology_did`, `synology_skip_ssl`): the statements `SynologyService`
 * issues, apart from the rest of the account in `UsersRepository`. Same
 * table, no move of the columns. Values stay as the service hands them in
 * (the password encrypted by the service, never here).
 */
export class UserSynologyRepository extends TrekRepository<Users> {
  /** Built over the context-resolving EntityManager, like the repositories MikroORM hands out per entity. */
  constructor(em: EntityManager) {
    super(em as SqlEntityManager, Users);
  }

  /**
   * SY1 (`SynologyService._readSynologyUser`) — `SELECT synology_url,
   * synology_username, synology_password, synology_sid, synology_did,
   * synology_skip_ssl FROM users WHERE id = ?`, column-filtered in JS by the
   * legacy code. This method selects only the requested columns (MikroORM's
   * typed `fields`) rather than all six and filtering after — the RESULT is
   * identical (only the requested keys populated, matching the legacy
   * `filtered` object exactly; an unrequested key is `undefined`, same as
   * the legacy object never having had it set). `null` means no such user
   * row (SY1's "User not found" branch).
   *
   * Explicit per-column `if` guards, not a generic `Pick<UserRow, K>` +
   * indexed-assignment loop: MikroORM's `fields` option types against
   * `AutoPath<Users, K, ...>`, which does not resolve for a free type
   * parameter `K` the way it does for the concrete literal union used here
   * (the same reason `getApiKeyColumn` above stays non-generic); an
   * indexed-assignment loop over a union key has the identical problem on
   * the write side. Six `if`s reads worse but needs neither a generic nor a
   * cast.
   */
  async getSynologyFields(id: number, columns: SynologyUserColumn[]): Promise<SynologyFieldsRow | null> {
    const row = await this.findOne({ id }, { fields: columns });
    if (!row) return null;
    const result: SynologyFieldsRow = {};
    if (columns.includes('synology_url')) result.synology_url = row.synology_url ?? null;
    if (columns.includes('synology_username')) result.synology_username = row.synology_username ?? null;
    if (columns.includes('synology_password')) result.synology_password = row.synology_password ?? null;
    if (columns.includes('synology_sid')) result.synology_sid = row.synology_sid ?? null;
    if (columns.includes('synology_did')) result.synology_did = row.synology_did ?? null;
    if (columns.includes('synology_skip_ssl')) result.synology_skip_ssl = row.synology_skip_ssl;
    return result;
  }

  /** SY2 (`SynologyService._clearSynologySID`) — `UPDATE users SET synology_sid = NULL WHERE id = ?`. */
  async clearSynologySID(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { synology_sid: null });
  }

  /** SY3 (`SynologyService._clearSynologySession`) — `UPDATE users SET synology_sid = NULL, synology_did = NULL WHERE id = ?`. */
  async clearSynologySession(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { synology_sid: null, synology_did: null });
  }

  /**
   * SY4/SY7 (`SynologyService._getSynologySession`'s session-refresh write,
   * `testSynologyConnection`'s sid persist) — byte-identical `UPDATE users
   * SET synology_sid = ? WHERE id = ?` at both legacy sites, one method (D4).
   */
  async setSynologySid(id: number, synology_sid: string): Promise<void> {
    await this.nativeUpdate({ id }, { synology_sid });
  }

  /** SY5 (`SynologyService.updateSynologySettings`) — `UPDATE users SET synology_url = ?, synology_username = ?, synology_password = ?, synology_skip_ssl = ? WHERE id = ?`. */
  async setSynologySettings(
    id: number,
    synology_url: string,
    synology_username: string,
    synology_password: string | null,
    synology_skip_ssl: number,
  ): Promise<void> {
    await this.nativeUpdate({ id }, { synology_url, synology_username, synology_password, synology_skip_ssl });
  }

  /** SY6 (`SynologyService.getSynologyStatus`) — `SELECT synology_username FROM users WHERE id = ?`. */
  async getSynologyUsername(id: number): Promise<string | null> {
    const row = await this.findOne({ id }, { fields: ['synology_username'] });
    return row?.synology_username ?? null;
  }

  /** SY8 (`SynologyService.testSynologyConnection`'s did persist) — `UPDATE users SET synology_did = ? WHERE id = ?`. */
  async setSynologyDid(id: number, synology_did: string): Promise<void> {
    await this.nativeUpdate({ id }, { synology_did });
  }
}
