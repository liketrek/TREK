/**
 * PluginsFeedController (#plugins): the authenticated active-plugin feed. Focused
 * on the parts that re-validate hand-editable DB JSON: capability-derived fields
 * must never surface values the manifest parser would have rejected, and
 * routeProfiles must only appear for plugins whose hook:route-provider grant is
 * actually recorded — a declared-but-ungranted provider can never serve a route,
 * so offering its profiles in the picker would produce dead buttons.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rows, pluginsEnabled } = vi.hoisted(() => ({
  rows: { value: [] as Array<Record<string, unknown>> },
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ all: () => rows.value }) } }));
import { db as dbConn } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PluginsFeedController } from '../../../src/nest/plugins/plugins-feed.controller';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'p1', name: 'P', type: 'integration', icon: null,
  capabilities: '{}', granted_permissions: '[]',
  ...over,
});

describe('PluginsFeedController', () => {
  const c = new PluginsFeedController(new DatabaseService(dbConn));
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); rows.value = []; });

  it('marks a plugin as a search provider only alongside the recorded hook:search-provider grant (#2221)', () => {
    rows.value = [
      row({ id: 'index', granted_permissions: JSON.stringify(['hook:search-provider']) }),
      row({ id: 'asked-only', permissions: JSON.stringify(['hook:search-provider']) }),
      row({ id: 'poi-only', granted_permissions: JSON.stringify(['hook:poi-category-provider']) }),
    ];
    const { plugins } = c.list();
    expect(plugins.find(p => p.id === 'index')?.searchProvider).toBe(true);
    expect(plugins.find(p => p.id === 'asked-only')).not.toHaveProperty('searchProvider');
    expect(plugins.find(p => p.id === 'poi-only')).not.toHaveProperty('searchProvider');
  });

  it('returns an empty feed when the runtime is disabled', () => {
    pluginsEnabled.mockReturnValue(false);
    rows.value = [row()];
    expect(c.list()).toEqual({ plugins: [] });
  });

  it('serves routeProfiles only alongside the recorded hook:route-provider grant', () => {
    rows.value = [
      row({ id: 'granted', capabilities: JSON.stringify({ routeProfiles: [{ id: 'ev', label: 'EV' }] }), granted_permissions: JSON.stringify(['hook:route-provider']) }),
      row({ id: 'ungranted', capabilities: JSON.stringify({ routeProfiles: [{ id: 'ev', label: 'EV' }] }) }),
    ];
    const { plugins } = c.list();
    expect(plugins.find(p => p.id === 'granted')?.routeProfiles).toEqual([{ id: 'ev', label: 'EV' }]);
    expect(plugins.find(p => p.id === 'ungranted')?.routeProfiles).toBeUndefined();
  });

  it('re-validates hand-edited routeProfiles rows (bad ids dropped, labels capped, max 3)', () => {
    rows.value = [row({
      id: 'edited',
      capabilities: JSON.stringify({
        routeProfiles: [
          { id: '../up', label: 'bad id' },
          { id: 'ok', label: '  L  '.padEnd(60, 'x') },
          { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' },
        ],
      }),
      granted_permissions: JSON.stringify(['hook:route-provider']),
    })];
    const profiles = c.list().plugins[0].routeProfiles!;
    expect(profiles.every(p => /^[a-z][a-z0-9-]{0,23}$/.test(p.id))).toBe(true);
    expect(profiles.length).toBeLessThanOrEqual(3);
    expect(profiles.every(p => p.label.length <= 40)).toBe(true);
  });

  describe('poiCategories (#1781)', () => {
    const cat = { id: 'trailheads', label: 'Trailheads', labels: { de: 'Wanderparkplätze' }, icon: 'Signpost', color: '#2f855a' };
    const granted = JSON.stringify(['hook:poi-category-provider']);

    it('serves them only alongside the recorded hook:poi-category-provider grant', () => {
      rows.value = [
        row({ id: 'granted', capabilities: JSON.stringify({ poiCategories: [cat] }), granted_permissions: granted }),
        row({ id: 'ungranted', capabilities: JSON.stringify({ poiCategories: [cat] }) }),
        row({ id: 'searchOnly', capabilities: JSON.stringify({ poiCategories: [cat] }), granted_permissions: JSON.stringify(['hook:search-provider']) }),
      ];
      const { plugins } = c.list();
      expect(plugins.find(p => p.id === 'granted')?.poiCategories).toEqual([cat]);
      expect(plugins.find(p => p.id === 'ungranted')?.poiCategories).toBeUndefined();
      expect(plugins.find(p => p.id === 'searchOnly')?.poiCategories).toBeUndefined();
    });

    it('re-validates a hand-edited row: bad colour, icon or id dropped, duplicates and the fifth one gone', () => {
      rows.value = [row({
        capabilities: JSON.stringify({
          poiCategories: [
            { ...cat, color: '#fff;background:url(https://tracker.example)' },
            { ...cat, id: 'x', icon: 'Skull' },
            { ...cat, id: '../x' },
            { ...cat, id: 'ok', label: 'Water \u{1F6B0}' },
            { ...cat, id: 'ok' },
            { ...cat, id: 'late' },
          ],
        }),
        granted_permissions: granted,
      })];
      // The first four entries are the ones read (the cap), and only one of them survives.
      expect(c.list().plugins[0].poiCategories).toEqual([{ ...cat, id: 'ok', label: 'Water' }]);
    });

    it('omits the field when nothing survives', () => {
      rows.value = [row({ capabilities: JSON.stringify({ poiCategories: [{ ...cat, color: 'red' }] }), granted_permissions: granted })];
      expect(c.list().plugins[0]).not.toHaveProperty('poiCategories');
    });
  });

  it('flags geolocation only when the grant is recorded', () => {
    rows.value = [
      row({ id: 'granted', granted_permissions: JSON.stringify(['geolocation:read']) }),
      row({ id: 'ungranted' }),
    ];
    const { plugins } = c.list();
    expect(plugins.find(p => p.id === 'granted')?.geolocation).toBe(true);
    expect(plugins.find(p => p.id === 'ungranted')?.geolocation).toBeUndefined();
  });

  it('survives malformed JSON blobs without dropping the plugin', () => {
    rows.value = [row({ capabilities: '{not json', granted_permissions: 'also not' })];
    const { plugins } = c.list();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].routeProfiles).toBeUndefined();
    expect(plugins[0].slot).toBe('sidebar');
  });
});
