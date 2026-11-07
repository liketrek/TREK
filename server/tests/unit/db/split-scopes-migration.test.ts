/**
 * `Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own`:
 * the grants already stored (OAuth clients, consents, tokens) keep the tools
 * they covered when tours, road trip and the Studio got scopes of their own.
 */
import { Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own as SplitScopes } from '../../../src/db/migrations/Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own';
import { IMPLIED_SCOPE_GROUPS } from '../../../src/mcp/scopes';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

import { describe, expect, it } from 'vitest';

const extendedGrant = (stored: string) => SplitScopes.extendedGrant(stored);

const TARGET = 'Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own';

describe('extendedGrant', () => {
  it('SPLITMIG-001: adds the split-off scopes mode for mode, once, and keeps the order', () => {
    expect(extendedGrant('["trips:read","trips:write","journey:read"]')).toBe(
      JSON.stringify([
        'trips:read',
        'trips:write',
        'journey:read',
        'tours:read',
        'roadtrip:read',
        'tours:write',
        'roadtrip:write',
        'studio:read',
      ]),
    );
    expect(extendedGrant('["places:write","roadtrip:write"]')).toBeNull();
  });

  it('SPLITMIG-002: leaves a grant without a split group, a delete or share scope, or a broken value alone', () => {
    expect(extendedGrant('["budget:read","trips:delete","journey:share"]')).toBeNull();
    expect(extendedGrant('not json')).toBeNull();
    expect(extendedGrant('{"trips:read":true}')).toBeNull();
    expect(extendedGrant('[1,2]')).toBeNull();
  });

  it('SPLITMIG-003: the frozen copy agrees with the live map it was taken from', () => {
    for (const [from, targets] of Object.entries(IMPLIED_SCOPE_GROUPS)) {
      const added = JSON.parse(extendedGrant(JSON.stringify([`${from}:read`])) ?? '[]') as string[];
      expect(added.slice(1)).toEqual((targets ?? []).map((t) => `${t}:read`));
    }
  });
});

describe('the migration', () => {
  it('SPLITMIG-004: extends every stored client, consent and token grant', async () => {
    const orm = await createMigrationOrm();
    try {
      const names = await pendingNames(orm);
      const idx = names.indexOf(TARGET);
      expect(idx).toBeGreaterThan(0);
      await migrateTo(orm, names[idx - 1]);
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')",
      );
      await rawExec(
        orm,
        `INSERT INTO oauth_clients (id, user_id, name, client_id, client_secret_hash, allowed_scopes)
         VALUES ('a', 1, 'Old', 'old', 'h', ?), ('b', 1, 'Core', 'core', 'h', ?)`,
        ['["trips:read","trips:write"]', '["budget:read"]'],
      );
      await rawExec(orm, 'INSERT INTO oauth_consents (client_id, user_id, scopes) VALUES (?, 1, ?)', [
        'old',
        '["journey:write"]',
      ]);
      await rawExec(
        orm,
        `INSERT INTO oauth_tokens (client_id, user_id, access_token_hash, refresh_token_hash, scopes,
           access_token_expires_at, refresh_token_expires_at)
         VALUES ('old', 1, 'a1', 'r1', ?, '2030-01-01', '2030-01-01'), ('old', 1, 'a2', 'r2', ?, '2030-01-01', '2030-01-01')`,
        ['["places:read"]', '["places:read"]'],
      );

      await migrateTo(orm, TARGET);

      const clients = await rawQuery<{ client_id: string; allowed_scopes: string }>(
        orm,
        'SELECT client_id, allowed_scopes FROM oauth_clients ORDER BY client_id',
      );
      expect(clients.map((c) => [c.client_id, JSON.parse(c.allowed_scopes)])).toEqual([
        ['core', ['budget:read']],
        ['old', ['trips:read', 'trips:write', 'tours:read', 'roadtrip:read', 'tours:write', 'roadtrip:write']],
      ]);
      const consents = await rawQuery<{ scopes: string }>(orm, 'SELECT scopes FROM oauth_consents');
      expect(JSON.parse(consents[0].scopes)).toEqual(['journey:write', 'studio:write']);
      const tokens = await rawQuery<{ scopes: string }>(orm, 'SELECT scopes FROM oauth_tokens ORDER BY id');
      expect(tokens.map((t) => JSON.parse(t.scopes))).toEqual([
        ['places:read', 'roadtrip:read'],
        ['places:read', 'roadtrip:read'],
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
