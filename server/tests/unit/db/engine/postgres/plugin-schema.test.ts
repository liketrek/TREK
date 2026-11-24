/**
 * The schema a plugin's own data lives in on Postgres
 * (src/db/engine/postgres/plugin-schema.ts), the restore's statements for the
 * plugin schemas (clear-schema.ts) and the pool slots the plugin stores share
 * (plugin-data-store.ts), without a database.
 */
import { pluginSchemasSql } from '../../../../../src/db/engine/postgres/clear-schema';
import { PluginDataSlots, pluginDataSlots } from '../../../../../src/db/engine/postgres/plugin-data-store';
import {
  isPluginId,
  isPluginSchemaName,
  PLUGIN_SCHEMA_PREFIX,
  pluginSchemaName,
  quotePluginSchema,
} from '../../../../../src/db/engine/postgres/plugin-schema';
import { PLUGIN_ID_RE } from '../../../../../src/nest/plugins/protocol/manifest-rules';

import { describe, expect, it } from 'vitest';

describe('plugin schema names', () => {
  it('PGSCHEMA-001: a name is the prefix plus the id, each dash an underscore', () => {
    expect(pluginSchemaName('notes')).toBe('trek_plugin_notes');
    expect(pluginSchemaName('trip-weather-2')).toBe('trek_plugin_trip_weather_2');
    expect(quotePluginSchema(pluginSchemaName('trip-weather-2'))).toBe('"trek_plugin_trip_weather_2"');
  });

  it('PGSCHEMA-002: accepts exactly the ids the manifest accepts', () => {
    const samples = ['abc', 'a-b', 'a--b', 'z9', 'notes', 'Notes', '9abc', '-abc', 'a_b', 'a.b', '', 'a'.repeat(40)];
    samples.push('a'.repeat(41), '../x', 'abc ', 'ab"c', 'abc;drop');
    for (const id of samples) expect(isPluginId(id), id).toBe(PLUGIN_ID_RE.test(id));
    expect(String(PLUGIN_ID_RE)).toBe('/^[a-z][a-z0-9-]{2,39}$/');
  });

  it('PGSCHEMA-003: refuses anything that is not an id, before any SQL is written', () => {
    for (const id of ['Notes', '../x', 'a"b', 'ab', 'a b', 'a'.repeat(41)]) {
      expect(() => pluginSchemaName(id), id).toThrow(/is not a plugin id/);
    }
    expect(() => quotePluginSchema('public')).toThrow(/is not a plugin schema name/);
    expect(() => quotePluginSchema('trek_plugin_x"; drop')).toThrow(/is not a plugin schema name/);
  });

  it('PGSCHEMA-004: two ids never share a name, and every name fits in a Postgres identifier', () => {
    expect(pluginSchemaName('a-b-c')).not.toBe(pluginSchemaName('a--bc'));
    const longest = pluginSchemaName(`a${'-'.repeat(39)}`);
    expect(longest.length).toBeLessThanOrEqual(63);
    expect(isPluginSchemaName(longest)).toBe(true);
    expect(isPluginSchemaName('trek_plugin_ab')).toBe(false);
    expect(isPluginSchemaName('public')).toBe(false);
    expect(isPluginSchemaName(`${PLUGIN_SCHEMA_PREFIX}Notes`)).toBe(false);
  });

  it("PGSCHEMA-005: a restore drops only the role's own plugin schemas, then creates the dump's", () => {
    const sql = pluginSchemasSql(['trek_plugin_alpha', 'trek_plugin_beta']);
    expect(sql).toContain("starts_with(nspname, 'trek_plugin_')");
    expect(sql).toContain('pg_get_userbyid(nspowner) = current_user');
    expect(sql).toContain("EXECUTE format('DROP SCHEMA %I CASCADE', r.nspname);");
    expect(sql.endsWith('CREATE SCHEMA "trek_plugin_alpha";\nCREATE SCHEMA "trek_plugin_beta";\n')).toBe(true);
    expect(pluginSchemasSql([])).not.toContain('CREATE SCHEMA');
    expect(() => pluginSchemasSql(['auth'])).toThrow(/is not a plugin schema name/);
  });
});

describe('plugin data pool slots', () => {
  it('PGSCHEMA-006: plugins hold at most half of the pool, at least one connection', () => {
    expect(pluginDataSlots(10)).toBe(5);
    expect(pluginDataSlots(3)).toBe(1);
    expect(pluginDataSlots(1)).toBe(1);
  });

  it('PGSCHEMA-007: no more than `size` pieces of work run at once, and the rest run in order', async () => {
    const slots = new PluginDataSlots(2);
    let running = 0;
    let most = 0;
    const order: number[] = [];
    const work = (n: number) =>
      slots.run(async () => {
        running++;
        most = Math.max(most, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push(n);
        running--;
        if (n === 2) throw new Error('fails');
        return n;
      });
    const results = await Promise.allSettled([1, 2, 3, 4, 5].map(work));
    expect(most).toBe(2);
    expect(order.slice(2)).toEqual([3, 4, 5]);
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled', 'fulfilled', 'fulfilled']);
    // A failure gives its slot back like a success does.
    await expect(slots.run(async () => 'next')).resolves.toBe('next');
  });
});
