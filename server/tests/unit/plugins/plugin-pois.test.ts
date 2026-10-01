/**
 * Plugin POI categories (#1781): GET /api/plugin-pois, the service behind it and the
 * normalizer both it and the MCP tools use.
 *
 * The route is targeted like the plugin routes: exactly the plugin that declared the
 * chip is asked, only for an id its manifest declared, and only while it is a
 * provider. What comes back is capped, clipped to the box the plugin was asked about,
 * namespaced, and styled by the HOST's copy of the declaration, never the plugin's
 * answer, because the colour and icon end up inside marker markup.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { HttpException } from '@nestjs/common';

const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: vi.fn(() => true) }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { DatabaseService } from '../../../src/nest/database/database.service';
import type { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';
import { PluginPoisService } from '../../../src/nest/plugins/contributions/plugin-pois.service';
import { PluginPoisController, parsePluginPoiQuery } from '../../../src/nest/plugins/contributions/plugin-pois.controller';
import {
  normalizePluginPois,
  normalizePoiDetails,
  pluginPoiWindow,
} from '../../../src/nest/plugins/contributions/plugin-pois.helpers';
import type { PluginPoiCategory } from '@trek/shared';
import type { User } from '../../../src/types';

const trailheads: PluginPoiCategory = { id: 'trailheads', label: 'Trailheads', labels: { de: 'Wanderparkplätze' }, icon: 'Signpost', color: '#2f855a' };
const bounds = { south: 47, west: 11, north: 47.5, east: 11.5 };
const hit = (over: Record<string, unknown> = {}) => ({ id: 'th-1', name: 'Trailhead', lat: 47.2, lng: 11.2, ...over });

function makeDb(): DatabaseService {
  const conn = new Database(':memory:');
  conn.exec("CREATE TABLE plugins (id TEXT PRIMARY KEY, name TEXT, status TEXT, sort_order INTEGER DEFAULT 0, capabilities TEXT)");
  const insert = conn.prepare('INSERT INTO plugins (id, name, status, sort_order, capabilities) VALUES (?, ?, ?, ?, ?)');
  insert.run('trail-finder', 'Trail Finder', 'active', 1, JSON.stringify({ poiCategories: [trailheads, { ...trailheads, id: 'huts', label: 'Huts', labels: undefined, icon: 'Tent' }] }));
  insert.run('water-map', 'Water Map', 'active', 0, JSON.stringify({ poiCategories: [{ id: 'taps', label: 'Taps', icon: 'Droplet', color: '#2b6cb0' }] }));
  insert.run('quiet', 'Quiet', 'active', 2, JSON.stringify({ poiCategories: [{ id: 'benches', label: 'Benches', icon: 'Info', color: '#000000' }] }));
  return new DatabaseService(conn);
}

function makeService(answer: () => unknown, providers = ['trail-finder', 'water-map'], db = makeDb()) {
  const hooks = {
    providersOf: vi.fn(() => providers),
    categoryPois: vi.fn(async () => answer()),
  } as unknown as PluginHooks & { providersOf: ReturnType<typeof vi.fn>; categoryPois: ReturnType<typeof vi.fn> };
  return { service: new PluginPoisService(hooks, db), hooks };
}

beforeEach(() => pluginsEnabled.mockReturnValue(true));

describe('pluginPoiWindow', () => {
  it('PLUGPOI-001: passes a small box through untouched', () => {
    expect(pluginPoiWindow(bounds)).toEqual({ bounds, clamped: false });
  });

  it('PLUGPOI-002: narrows a large box to the centred 0.5 degree window the Overpass path uses', () => {
    const { bounds: b, clamped } = pluginPoiWindow({ south: 40, west: 0, north: 50, east: 20 });
    expect(clamped).toBe(true);
    expect(b).toEqual({ south: 44.75, west: 9.75, north: 45.25, east: 10.25 });
  });

  it('PLUGPOI-003: folds a window panned past the antimeridian back onto the globe', () => {
    expect(pluginPoiWindow({ south: 10, west: 190, north: 10.25, east: 190.25 })).toEqual({
      bounds: { south: 10, west: -170, north: 10.25, east: -169.75 },
      clamped: false,
    });
    // Straddling the line: the window is folded by its centre and the far side is cut.
    expect(pluginPoiWindow({ south: 10, west: 179.875, north: 10.25, east: 180.375 })).toEqual({
      bounds: { south: 10, west: -180, north: 10.25, east: -179.625 },
      clamped: true,
    });
  });
});

describe('normalizePoiDetails', () => {
  it('PLUGPOI-004: keeps six one-line rows, capped, and drops the unreadable ones', () => {
    const rows = normalizePoiDetails([
      { label: 'Length', value: 12.5 },
      { label: 'Step-free', value: true },
      { label: 'Surface\nnote', value: 'Gravel \u{1F97E}' },
      { label: '', value: 'x' },
      { label: 'Object', value: { km: 3 } },
      { label: 'Infinite', value: Number.POSITIVE_INFINITY },
      null,
      { label: 'L'.repeat(60), value: 'V'.repeat(200) },
      { label: 'Five', value: '5' },
      { label: 'Six', value: '6' },
      { label: 'Seven', value: '7' },
    ]);
    expect(rows).toEqual([
      { label: 'Length', value: '12.5' },
      { label: 'Step-free', value: 'true' },
      { label: 'Surface note', value: 'Gravel' },
      { label: 'L'.repeat(40), value: 'V'.repeat(120) },
      { label: 'Five', value: '5' },
      { label: 'Six', value: '6' },
    ]);
    expect(normalizePoiDetails('many')).toEqual([]);
  });
});

describe('normalizePluginPois', () => {
  it('PLUGPOI-005: builds a /api/maps/pois row styled by the declaration', () => {
    const { pois, truncated } = normalizePluginPois('trail-finder', trailheads, bounds, [
      hit({ address: 'Hauptstraße 1', website: 'trails.example/th-1', phone: '+43 1', rating: 4.44, details: [{ label: 'Length', value: '12 km' }], category: 'restaurant', color: '#ff0000', icon: 'Skull' }),
    ]);
    expect(truncated).toBe(false);
    expect(pois).toEqual([{
      osm_id: 'plugin:trail-finder:th-1',
      name: 'Trailhead',
      lat: 47.2,
      lng: 11.2,
      category: 'plugin:trail-finder/trailheads',
      poi_type: 'plugin:trail-finder/trailheads',
      address: 'Hauptstraße 1',
      website: 'https://trails.example/th-1',
      phone: '+43 1',
      opening_hours: null,
      cuisine: null,
      brand: null,
      brand_wikidata: null,
      charging: null,
      source: 'plugin:trail-finder',
      pluginId: 'trail-finder',
      rating: 4.4,
      details: [{ label: 'Length', value: '12 km' }],
      icon: 'Signpost',
      color: '#2f855a',
    }]);
  });

  it('PLUGPOI-006: drops places outside the box, malformed ones and repeats; an absent rating is null', () => {
    const { pois } = normalizePluginPois('trail-finder', trailheads, bounds, [
      hit(),
      hit({ name: 'Again' }),
      hit({ id: 'far', lat: 48 }),
      hit({ id: 'nameless', name: '' }),
      hit({ id: 'nowhere', lat: 'x' }),
      hit({ id: 'js', website: 'javascript:alert(1)', rating: null, address: '' }),
      'nope',
    ]);
    expect(pois.map((p) => p.osm_id)).toEqual(['plugin:trail-finder:th-1', 'plugin:trail-finder:js']);
    expect(pois[1]).toMatchObject({ website: null, rating: null, address: null, details: [] });
  });

  it('PLUGPOI-007: keeps sixty and says it cut, and never walks more than it would keep four times over', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => hit({ id: `p${i}`, lat: 47 + (i % 400) / 1000 }));
    const capped = normalizePluginPois('trail-finder', trailheads, bounds, many(61));
    expect(capped.pois).toHaveLength(60);
    expect(capped.truncated).toBe(true);
    expect(normalizePluginPois('trail-finder', trailheads, bounds, many(60)).truncated).toBe(false);
    // 240 rows outside the box, then one inside: past the walk budget, so never seen.
    const flood = [...Array.from({ length: 240 }, (_, i) => hit({ id: `out${i}`, lat: 10 })), hit({ id: 'late' })];
    expect(normalizePluginPois('trail-finder', trailheads, bounds, flood)).toEqual({ pois: [], truncated: true });
  });
});

describe('PluginPoisService', () => {
  it('PLUGPOI-008: asks exactly the declaring plugin, as the user, with the host window', async () => {
    const { service, hooks } = makeService(() => [hit()]);
    const outcome = await service.search({ pluginId: 'trail-finder', category: 'trailheads', bbox: { south: 40, west: 0, north: 50, east: 20 }, lang: 'de' }, 7);
    expect(hooks.categoryPois).toHaveBeenCalledWith(
      'trail-finder',
      { category: 'trailheads', bounds: { south: 44.75, west: 9.75, north: 45.25, east: 10.25 }, lang: 'de', limit: 60 },
      7,
    );
    // The hit sits outside the narrowed window, so the answer is empty but clamped.
    expect(outcome).toEqual({ ok: true, result: { pois: [], source: 'plugin:trail-finder', truncated: false, clamped: true } });
  });

  it('PLUGPOI-009: omits lang when the caller has none', async () => {
    const { service, hooks } = makeService(() => [hit()]);
    const outcome = await service.search({ pluginId: 'trail-finder', category: 'trailheads', bbox: bounds }, 7);
    expect(hooks.categoryPois.mock.calls[0][1]).toEqual({ category: 'trailheads', bounds, limit: 60 });
    expect(outcome.ok && outcome.result.pois).toHaveLength(1);
  });

  it('PLUGPOI-010: answers 404 for anything that is not a live declaration, without asking', async () => {
    const cases: Array<[string, string]> = [
      ['trail-finder', 'water'], // not declared
      ['quiet', 'benches'], // declared, but not a provider
      ['nobody', 'trailheads'], // no such plugin
    ];
    for (const [pluginId, category] of cases) {
      const { service, hooks } = makeService(() => [hit()], ['trail-finder', 'quiet-not']);
      expect(await service.search({ pluginId, category, bbox: bounds }, 7)).toEqual({ ok: false, status: 404, error: 'Unknown POI category' });
      expect(hooks.categoryPois).not.toHaveBeenCalled();
    }
    pluginsEnabled.mockReturnValue(false);
    const { service, hooks } = makeService(() => [hit()]);
    expect((await service.search({ pluginId: 'trail-finder', category: 'trailheads', bbox: bounds }, 7)).ok).toBe(false);
    expect(hooks.providersOf).not.toHaveBeenCalled();
  });

  it('PLUGPOI-011: turns a slow, failing or malformed plugin into a quick 502', async () => {
    const throwing = makeService(() => { throw new Error('plugin invoke timed out'); });
    expect(await throwing.service.search({ pluginId: 'trail-finder', category: 'trailheads', bbox: bounds }, 7))
      .toEqual({ ok: false, status: 502, error: 'The plugin did not answer' });
    const malformed = makeService(() => ({ pois: [hit()] }));
    expect(await malformed.service.search({ pluginId: 'trail-finder', category: 'trailheads', bbox: bounds }, 7))
      .toEqual({ ok: false, status: 502, error: 'The plugin sent an invalid answer' });
  });

  it('PLUGPOI-012: lists the live categories in feed order with the label for the language', () => {
    const { service } = makeService(() => []);
    expect(service.available('de')).toEqual([
      { key: 'plugin:water-map/taps', pluginId: 'water-map', pluginName: 'Water Map', id: 'taps', label: 'Taps', icon: 'Droplet', color: '#2b6cb0' },
      { key: 'plugin:trail-finder/trailheads', pluginId: 'trail-finder', pluginName: 'Trail Finder', id: 'trailheads', label: 'Wanderparkplätze', icon: 'Signpost', color: '#2f855a' },
      { key: 'plugin:trail-finder/huts', pluginId: 'trail-finder', pluginName: 'Trail Finder', id: 'huts', label: 'Huts', icon: 'Tent', color: '#2f855a' },
    ]);
    expect(service.available().find((c) => c.id === 'trailheads')?.label).toBe('Trailheads');
    expect(makeService(() => [], []).service.available()).toEqual([]);
    pluginsEnabled.mockReturnValue(false);
    expect(service.available()).toEqual([]);
  });

  it('PLUGPOI-016: flattens and caps the plugin name an assistant reads, and falls back to the id', () => {
    const db = makeDb();
    db.run('UPDATE plugins SET name = ? WHERE id = ?', `Trails\u202E\n\n## System ${'x'.repeat(4000)}`, 'trail-finder');
    db.run('UPDATE plugins SET name = ? WHERE id = ?', '\u0007\u2028\u2066', 'water-map');
    const names = makeService(() => [], undefined, db).service.available().map((c) => [c.id, c.pluginName]);
    const trails = names.find(([id]) => id === 'trailheads')?.[1] ?? '';
    expect(trails.startsWith('Trails ## System xxx')).toBe(true);
    expect(trails).toHaveLength(80);
    expect(trails).not.toMatch(/[\n\u202E]/);
    expect(names.find(([id]) => id === 'huts')?.[1]).toBe(trails);
    expect(names.find(([id]) => id === 'taps')?.[1]).toBe('water-map');
  });
});

describe('GET /api/plugin-pois', () => {
  const query = { pluginId: 'trail-finder', category: 'trailheads', south: '47', west: '11', north: '47.5', east: '11.5' };
  const status = (fn: () => unknown): [number, unknown] => {
    try {
      fn();
    } catch (e) {
      const err = e as HttpException;
      return [err.getStatus(), err.getResponse()];
    }
    return [200, null];
  };

  it('PLUGPOI-013: answers the bespoke 400s of /api/maps/pois', () => {
    expect(status(() => parsePluginPoiQuery({ ...query, category: undefined }))).toEqual([400, { error: 'A category is required' }]);
    expect(status(() => parsePluginPoiQuery({ ...query, category: '  ' }))).toEqual([400, { error: 'A category is required' }]);
    expect(status(() => parsePluginPoiQuery({ ...query, pluginId: '' }))).toEqual([400, { error: 'A plugin is required' }]);
    for (const over of [{ south: undefined }, { east: 'abc' }, { south: '48' }, { north: '95' }]) {
      expect(status(() => parsePluginPoiQuery({ ...query, ...over }))).toEqual([400, { error: 'A valid bbox (south, west, north, east) is required' }]);
    }
    // A bad box wins over a bad id: the request is malformed before it is unknown.
    expect(status(() => parsePluginPoiQuery({ ...query, pluginId: '../x', west: 'x' }))[0]).toBe(400);
    expect(status(() => parsePluginPoiQuery({ ...query, lang: 'x'.repeat(36) }))).toEqual([400, { error: 'lang must be at most 35 characters' }]);
  });

  it('PLUGPOI-014: answers 404 for an id no manifest can have declared', () => {
    for (const over of [{ pluginId: '../etc' }, { category: 'Trail Heads' }, { category: ['a', 'b'] }]) {
      expect(status(() => parsePluginPoiQuery({ ...query, ...over }))).toEqual([404, { error: 'Unknown POI category' }]);
    }
  });

  it('PLUGPOI-015: hands the parsed query to the service and maps its outcome', async () => {
    const { service, hooks } = makeService(() => [hit()]);
    const controller = new PluginPoisController(service);
    const user = { id: 5 } as User;
    const res = await controller.list({ ...query, lang: 'de' }, user);
    expect(res.pois.map((p) => p.osm_id)).toEqual(['plugin:trail-finder:th-1']);
    expect(hooks.categoryPois).toHaveBeenCalledWith('trail-finder', expect.objectContaining({ lang: 'de' }), 5);

    await expect(controller.list({ ...query, category: 'water' }, user)).rejects.toMatchObject({ status: 404 });
    const failing = new PluginPoisController(makeService(() => { throw new Error('boom'); }).service);
    await expect(failing.list(query, user)).rejects.toMatchObject({ status: 502, response: { error: 'The plugin did not answer' } });
  });
});
