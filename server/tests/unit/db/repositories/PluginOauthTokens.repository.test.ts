/**
 * `PluginOauthTokensRepository.storeToken` (Plan 3j Task 4, PO11 — R-oauth-upsert):
 * the composite-key (`plugin_id`, `user_id`) upsert whose `refresh_token` column is
 * COALESCE-preserving. This is the repository-level proof the task brief names as
 * mandatory: `plugin-oauth.service.ts#getAccessToken`'s own refresh path pre-fills a
 * missing `refresh_token` in JS before calling `storeToken` (so it never actually
 * reaches this repository's COALESCE with a null), and a brand-new row has no
 * existing value for COALESCE to fall back to either way — so neither of those two
 * call sites, alone, proves the repository's own COALESCE branch. This file calls
 * `storeToken` directly, against an EXISTING row, with a genuinely omitted
 * `refresh_token`.
 */
import { currentTimestampKysely } from '../../../../src/db/dialect/sql-functions';
import { PluginOauthTokens } from '../../../../src/db/entities/PluginOauthTokens.entity';
import type { PluginOauthTokensRepository } from '../../../../src/db/repositories/PluginOauthTokens.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: PluginOauthTokensRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(PluginOauthTokens);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function storedRow(pluginId: string, userId: number) {
  return testDb
    .prepare(
      'SELECT plugin_id, user_id, access_token, refresh_token, expires_at, scope, updated_at FROM plugin_oauth_tokens WHERE plugin_id = ? AND user_id = ?',
    )
    .get(pluginId, userId) as
    | {
        plugin_id: string;
        user_id: number;
        access_token: string | null;
        refresh_token: string | null;
        expires_at: number | null;
        scope: string | null;
        updated_at: string;
      }
    | undefined;
}

describe('PluginOauthTokensRepository', () => {
  describe('storeToken (PO11, R-oauth-upsert — the COALESCE-preserving composite upsert)', () => {
    it('PO11REPO-001: pinned rendered SQL for the ON CONFLICT DO UPDATE target and SET clause', () => {
      const platform = t.em.getPlatform();
      const compiled = t.em
        .getKysely<{ plugin_oauth_tokens: Record<string, unknown> }>()
        .insertInto('plugin_oauth_tokens')
        .values({
          plugin_id: 'p',
          user_id: 1,
          access_token: 'AT',
          refresh_token: 'RT',
          expires_at: 111,
          scope: 'read',
          updated_at: currentTimestampKysely(platform),
        })
        .onConflict((oc) =>
          oc.columns(['plugin_id', 'user_id']).doUpdateSet({
            access_token: (eb) => eb.ref('excluded.access_token'),
            refresh_token: (eb) =>
              eb.fn.coalesce(eb.ref('excluded.refresh_token'), eb.ref('plugin_oauth_tokens.refresh_token')),
            expires_at: (eb) => eb.ref('excluded.expires_at'),
            scope: (eb) => eb.ref('excluded.scope'),
            updated_at: () => currentTimestampKysely(platform),
          }),
        )
        .compile();
      // Pinned for the task report — the exact ON CONFLICT clause Kysely renders
      // for this table. The COALESCE operand order is the load-bearing part
      // (R-oauth-upsert): NEW value (excluded) first, EXISTING second.
      expect(compiled.sql).toContain('on conflict ("plugin_id", "user_id") do update set');
      expect(compiled.sql).toContain('"access_token" = "excluded"."access_token"');
      expect(compiled.sql).toContain(
        '"refresh_token" = coalesce("excluded"."refresh_token", "plugin_oauth_tokens"."refresh_token")',
      );
      expect(compiled.sql).toContain('"expires_at" = "excluded"."expires_at"');
      expect(compiled.sql).toContain('"scope" = "excluded"."scope"');
      expect(compiled.sql).toContain('"updated_at" = CURRENT_TIMESTAMP');
      // Pinned in full, for the task report:
      expect(compiled.sql).toBe(
        'insert into "plugin_oauth_tokens" ("plugin_id", "user_id", "access_token", "refresh_token", "expires_at", "scope", "updated_at") values (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) on conflict ("plugin_id", "user_id") do update set "access_token" = "excluded"."access_token", "refresh_token" = coalesce("excluded"."refresh_token", "plugin_oauth_tokens"."refresh_token"), "expires_at" = "excluded"."expires_at", "scope" = "excluded"."scope", "updated_at" = CURRENT_TIMESTAMP',
      );
    });

    it('PO11REPO-002 (R-oauth-upsert parity): a refresh response that OMITS refresh_token keeps the existing stored value unchanged', async () => {
      // Seed an existing token row with a non-null refresh_token — the state a
      // previously-connected user is in when a later refresh comes back without one.
      await repo.storeToken({
        plugin_id: 'p',
        user_id: 42,
        access_token: 'AT-1',
        refresh_token: 'RT-original',
        expires_at: 1000,
        scope: 'read',
      });
      expect(storedRow('p', 42)).toMatchObject({ access_token: 'AT-1', refresh_token: 'RT-original' });

      // A refresh response that omits refresh_token — the repository call the
      // service makes when it has NOT pre-filled the field itself.
      await repo.storeToken({
        plugin_id: 'p',
        user_id: 42,
        access_token: 'AT-2',
        refresh_token: null,
        expires_at: 2000,
        scope: 'read write',
      });
      const row = storedRow('p', 42)!;
      // access_token/expires_at/scope always take the new value (plain excluded.* reassignment)...
      expect(row.access_token).toBe('AT-2');
      expect(row.expires_at).toBe(2000);
      expect(row.scope).toBe('read write');
      // ...but refresh_token is UNCHANGED — still the ORIGINAL value, not null, not overwritten.
      expect(row.refresh_token).toBe('RT-original');
      expect(row.refresh_token).not.toBeNull();
    });

    it('PO11REPO-003 (R-oauth-upsert, the other COALESCE direction): a refresh response that DOES supply a new refresh_token overwrites the stored one', async () => {
      await repo.storeToken({
        plugin_id: 'p',
        user_id: 42,
        access_token: 'AT-1',
        refresh_token: 'RT-original',
        expires_at: 1000,
        scope: 'read',
      });
      await repo.storeToken({
        plugin_id: 'p',
        user_id: 42,
        access_token: 'AT-2',
        refresh_token: 'RT-rotated',
        expires_at: 2000,
        scope: 'read',
      });
      const row = storedRow('p', 42)!;
      expect(row.refresh_token).toBe('RT-rotated');
    });

    it('PO11REPO-004: a brand-new row (no prior state) inserts plainly — no COALESCE fallback target to speak of yet', async () => {
      expect(storedRow('fresh', 7)).toBeUndefined();
      await repo.storeToken({
        plugin_id: 'fresh',
        user_id: 7,
        access_token: 'AT',
        refresh_token: null,
        expires_at: null,
        scope: null,
      });
      const row = storedRow('fresh', 7)!;
      expect(row.access_token).toBe('AT');
      expect(row.refresh_token).toBeNull();
    });

    it('PO11REPO-005: the composite key isolates rows — a second user of the same plugin gets its own row, the first is untouched', async () => {
      await repo.storeToken({
        plugin_id: 'p',
        user_id: 1,
        access_token: 'AT-1',
        refresh_token: 'RT-1',
        expires_at: null,
        scope: null,
      });
      await repo.storeToken({
        plugin_id: 'p',
        user_id: 2,
        access_token: 'AT-2',
        refresh_token: 'RT-2',
        expires_at: null,
        scope: null,
      });
      expect(storedRow('p', 1)).toMatchObject({ access_token: 'AT-1', refresh_token: 'RT-1' });
      expect(storedRow('p', 2)).toMatchObject({ access_token: 'AT-2', refresh_token: 'RT-2' });
    });
  });
});
