/**
 * Unit tests for the settings MCP surface (SettingsMcp):
 * get_display_settings and update_display_settings.
 *
 * The security half carries the weight here. `settings` is one flat key/value
 * table that holds display preferences next to encrypted credentials, and
 * SettingsService.getUserSettings hands several of those back decrypted, so
 * these tests pin that the allow-list is the only thing either tool can see or
 * touch: a stored mapbox_access_token must not appear in a read, and neither
 * that key nor llm_api_key nor an unknown name may be written.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { encrypt_api_key } from '../../../src/nest/common/crypto/apiKeyCrypto';
import { MASKED_SETTING_VALUE } from '@trek/shared';
import { DISPLAY_PREFERENCE_KEYS } from '../../../src/nest/settings/settings.mcp';
import { MANAGED_LOCKED_SETTING_KEYS } from '../../../src/nest/common/managed';
import { isAdminOnlyLlmSetting, ENCRYPTED_SETTING_KEYS, MASKED_SETTING_KEYS } from '../../../src/nest/settings/settings.service';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setSetting(userId: number, key: string, value: string): void {
  testDb.prepare(
    'INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ' +
      'ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value',
  ).run(userId, key, value);
}

function readSetting(userId: number, key: string): string | undefined {
  const row = testDb.prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?').get(userId, key) as
    | { value: string }
    | undefined;
  return row?.value;
}

function countSettings(userId: number): number {
  return (testDb.prepare('SELECT COUNT(*) as c FROM settings WHERE user_id = ?').get(userId) as { c: number }).c;
}

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

async function withScopedHarness(userId: number, scopes: string[] | null, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false, scopes });
  try { await fn(h); } finally { await h.cleanup(); }
}

async function update(h: McpHarness, settings: Record<string, unknown>) {
  return h.client.callTool({ name: 'update_display_settings', arguments: { settings } });
}

/** The message of an isError result, for asserting the wording a model reads. */
function errorText(result: any): string {
  return String(result.content?.[0]?.text ?? '');
}

// ---------------------------------------------------------------------------
// get_display_settings
// ---------------------------------------------------------------------------

describe('Tool: get_display_settings', () => {
  it('returns an empty object for a user who has set nothing', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings).toEqual({});
    });
  });

  it('returns the display preferences the user has stored', async () => {
    const { user } = createUser(testDb);
    setSetting(user.id, 'temperature_unit', '"fahrenheit"');
    setSetting(user.id, 'distance_unit', '"imperial"');
    setSetting(user.id, 'time_format', '"12h"');
    setSetting(user.id, 'language', '"de"');
    setSetting(user.id, 'default_currency', '"USD"');
    setSetting(user.id, 'start_page', '"active_trip"');
    setSetting(user.id, 'blur_booking_codes', 'true');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings).toEqual({
        start_page: 'active_trip',
        default_currency: 'USD',
        language: 'de',
        temperature_unit: 'fahrenheit',
        distance_unit: 'imperial',
        time_format: '12h',
        blur_booking_codes: true,
      });
    });
  });

  it('falls back to the admin-set instance default for a key the user has not set', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)')
      .run('default_user_setting_temperature_unit', '"fahrenheit"');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings.temperature_unit).toBe('fahrenheit');
    });
  });

  it('does not return stored credentials, not even to a settings:read token', async () => {
    const { user } = createUser(testDb);
    // mapbox_access_token and carto_api_key are encrypted-but-NOT-masked, so
    // getUserSettings hands them back in cleartext. That is the leak this
    // surface must not have: store them the way the real write path does and
    // assert they are nowhere in the result.
    setSetting(user.id, 'mapbox_access_token', String(encrypt_api_key('pk.super-secret-token')));
    setSetting(user.id, 'carto_api_key', String(encrypt_api_key('carto-secret')));
    setSetting(user.id, 'llm_api_key', String(encrypt_api_key('sk-secret')));
    setSetting(user.id, 'ntfy_token', String(encrypt_api_key('ntfy-secret')));
    setSetting(user.id, 'webhook_url', String(encrypt_api_key('https://hook.example/secret')));
    setSetting(user.id, 'temperature_unit', '"celsius"');

    await withScopedHarness(user.id, ['settings:read'], async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings).toEqual({ temperature_unit: 'celsius' });
      const serialized = JSON.stringify(data);
      expect(serialized).not.toContain('pk.super-secret-token');
      expect(serialized).not.toContain('carto-secret');
      expect(serialized).not.toContain('sk-secret');
      expect(serialized).not.toContain('ntfy-secret');
      expect(serialized).not.toContain('hook.example');
      for (const key of ['mapbox_access_token', 'carto_api_key', 'llm_api_key', 'ntfy_token', 'webhook_url']) {
        expect(Object.keys(data.settings)).not.toContain(key);
      }
    });
  });

  it('leaves out settings that are neither display preferences nor credentials', async () => {
    const { user } = createUser(testDb);
    setSetting(user.id, 'map_tile_url', '"https://tiles.example/{z}/{x}/{y}.png"');
    setSetting(user.id, 'dashboard_fx_from', '"EUR"');
    setSetting(user.id, 'time_format', '"24h"');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings).toEqual({ time_format: '24h' });
    });
  });

  it('does not leak another user\'s preferences', async () => {
    const { user: mine } = createUser(testDb);
    const { user: theirs } = createUser(testDb);
    setSetting(theirs.id, 'temperature_unit', '"fahrenheit"');

    await withHarness(mine.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// update_display_settings: happy paths
// ---------------------------------------------------------------------------

describe('Tool: update_display_settings', () => {
  it('writes several preferences at once and reports what changed', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { temperature_unit: 'fahrenheit', distance_unit: 'imperial' });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(data.updated).toBe(2);
      expect(data.settings).toEqual({ temperature_unit: 'fahrenheit', distance_unit: 'imperial' });
      expect(readSetting(user.id, 'temperature_unit')).toBe('fahrenheit');
      expect(readSetting(user.id, 'distance_unit')).toBe('imperial');
    });
  });

  it('leaves untouched keys alone', async () => {
    const { user } = createUser(testDb);
    setSetting(user.id, 'time_format', '"12h"');
    await withHarness(user.id, async (h) => {
      await update(h, { temperature_unit: 'celsius' });
      expect(readSetting(user.id, 'time_format')).toBe('"12h"');
    });
  });

  it('accepts every non-boolean display preference in one call', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, {
        start_page: 'active_trip',
        start_trip_tab: 'finanzplan',
        default_currency: 'JPY',
        language: 'ja',
        temperature_unit: 'celsius',
        distance_unit: 'metric',
        time_format: '24h',
        dark_mode: 'auto',
      });
      const data = parseToolResult(result) as any;
      expect(data.updated).toBe(8);
      expect(data.settings.start_trip_tab).toBe('finanzplan');
      expect(data.settings.dark_mode).toBe('auto');
      expect(data.settings.language).toBe('ja');
    });
  });

  it('accepts every boolean display preference', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, {
        map_booking_labels: true,
        map_always_show_routes: false,
        map_poi_pill_enabled: true,
        blur_booking_codes: false,
        optimize_from_accommodation: true,
      });
      const data = parseToolResult(result) as any;
      expect(data.updated).toBe(5);
      expect(data.settings).toEqual({
        map_booking_labels: true,
        map_always_show_routes: false,
        map_poi_pill_enabled: true,
        blur_booking_codes: false,
        optimize_from_accommodation: true,
      });
    });
  });

  it('accepts a boolean dark_mode, the pre-auto form still sitting in older rows', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { dark_mode: false });
      const data = parseToolResult(result) as any;
      expect(data.settings.dark_mode).toBe(false);
      expect(readSetting(user.id, 'dark_mode')).toBe('false');
    });
  });

  it('accepts an empty default_currency, which falls back to each trip\'s own', async () => {
    const { user } = createUser(testDb);
    setSetting(user.id, 'default_currency', '"USD"');
    await withHarness(user.id, async (h) => {
      const result = await update(h, { default_currency: '' });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(readSetting(user.id, 'default_currency')).toBe('');
    });
  });

  it('reads back the admin default rather than echoing the input', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)')
      .run('default_user_setting_distance_unit', '"imperial"');
    await withHarness(user.id, async (h) => {
      const result = await update(h, { temperature_unit: 'celsius' });
      const data = parseToolResult(result) as any;
      expect(data.settings.distance_unit).toBe('imperial');
    });
  });
});

// ---------------------------------------------------------------------------
// update_display_settings: refusals
// ---------------------------------------------------------------------------

describe('Tool: update_display_settings, refusals', () => {
  it('refuses a credential key and stores nothing', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { mapbox_access_token: 'pk.attacker-token' });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('mapbox_access_token');
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses llm_api_key and stores nothing, even for a settings:write token', async () => {
    const { user } = createUser(testDb);
    await withScopedHarness(user.id, ['settings:write'], async (h) => {
      const result = await update(h, { llm_api_key: 'sk-attacker' });
      expect(result.isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses the two admin-only LLM endpoint keys the REST route answers 403 for', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      for (const settings of [{ llm_base_url: 'http://127.0.0.1:11434' }, { llm_provider: 'local' }]) {
        const result = await update(h, settings);
        expect(result.isError).toBe(true);
      }
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses a key nobody has heard of rather than storing it', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { made_up_preference: 'whatever' });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('made_up_preference');
      expect(countSettings(user.id)).toBe(0);
      expect(readSetting(user.id, 'made_up_preference')).toBeUndefined();
    });
  });

  it('refuses an inherited Object property name, which a plain `in` check would wave through', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { toString: 'gotcha' });
      expect(result.isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('writes nothing at all when one key of a multi-key call is refused', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { temperature_unit: 'fahrenheit', llm_api_key: 'sk-attacker' });
      expect(result.isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('writes nothing when one value of a multi-key call is invalid', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { temperature_unit: 'fahrenheit', time_format: '36h' });
      expect(result.isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses a value outside the allowed set and names the key', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { temperature_unit: 'kelvin' });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('temperature_unit');
      expect(readSetting(user.id, 'temperature_unit')).toBeUndefined();
    });
  });

  it('refuses an unsupported language code', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const bad = await update(h, { language: 'xx' });
      expect(bad.isError).toBe(true);
      const good = await update(h, { language: 'fr' });
      expect(good.isError).toBeFalsy();
      expect(readSetting(user.id, 'language')).toBe('fr');
    });
  });

  it('refuses a currency that is not a three-letter uppercase code', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      for (const value of ['eur', 'EUROS', 'E']) {
        const result = await update(h, { default_currency: value });
        expect(result.isError).toBe(true);
      }
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses a non-boolean for a boolean preference', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { blur_booking_codes: 'yes' });
      expect(result.isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses a start_trip_tab that is empty or absurdly long', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      expect((await update(h, { start_trip_tab: '' })).isError).toBe(true);
      expect((await update(h, { start_trip_tab: 'x'.repeat(65) })).isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses the redaction placeholder instead of silently skipping it', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, { start_trip_tab: MASKED_SETTING_VALUE });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('start_trip_tab');
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('refuses an empty settings object and says what it takes', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await update(h, {});
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('temperature_unit');
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('blocks the demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    await withHarness(user.id, async (h) => {
      const result = await update(h, { temperature_unit: 'fahrenheit' });
      expect(result.isError).toBe(true);
      expect(countSettings(user.id)).toBe(0);
    });
  });

  it('lets the demo user read', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    setSetting(user.id, 'temperature_unit', '"celsius"');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_display_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings.temperature_unit).toBe('celsius');
    });
  });
});

// ---------------------------------------------------------------------------
// The allow-list itself
// ---------------------------------------------------------------------------

describe('Display-preference allow-list', () => {
  it('holds no key the operator owns on a managed install', () => {
    // The REST route needs isManagedLockedKey because it takes any key at all.
    // Here the two lists must simply not overlap, which is what makes the
    // managed lock unreachable rather than merely duplicated.
    const overlap = DISPLAY_PREFERENCE_KEYS.filter((key) =>
      (MANAGED_LOCKED_SETTING_KEYS as readonly string[]).includes(key));
    expect(overlap).toEqual([]);
  });

  it('holds no key assertMayWriteLlmEndpoint would have to refuse', () => {
    // isAdminOnlyLlmSetting is value-dependent, so probe it with the values
    // that trip it rather than matching on the key name.
    const offenders = DISPLAY_PREFERENCE_KEYS.filter((key) =>
      isAdminOnlyLlmSetting(key, 'http://127.0.0.1:11434') || isAdminOnlyLlmSetting(key, 'local'));
    expect(offenders).toEqual([]);
  });

  // Against the live sets, not a copy of them: a sixth encrypted key added to
  // the service has to fail here, which is the whole point of the allow-list.
  it('holds no key that is encrypted at rest', () => {
    const overlap = [...ENCRYPTED_SETTING_KEYS].filter(key => (DISPLAY_PREFERENCE_KEYS as readonly string[]).includes(key));
    expect(overlap).toEqual([]);
  });

  it('holds no key that is masked on the way out', () => {
    const overlap = [...MASKED_SETTING_KEYS].filter(key => (DISPLAY_PREFERENCE_KEYS as readonly string[]).includes(key));
    expect(overlap).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Scope gating
// ---------------------------------------------------------------------------

describe('Settings tools, scope gating', () => {
  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers both tools with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    expect(names).toContain('get_display_settings');
    expect(names).toContain('update_display_settings');
  });

  it('registers only the read tool with settings:read', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['settings:read']);
    expect(names).toContain('get_display_settings');
    expect(names).not.toContain('update_display_settings');
  });

  it('registers both with settings:write, since write implies read', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['settings:write']);
    expect(names).toContain('get_display_settings');
    expect(names).toContain('update_display_settings');
  });

  it('registers neither for a token without a settings scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['trips:read']);
    expect(names).not.toContain('get_display_settings');
    expect(names).not.toContain('update_display_settings');
  });
});
