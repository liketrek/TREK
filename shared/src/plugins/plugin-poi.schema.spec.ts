import { PLUGIN_POI_ICONS } from './plugin-poi-facts';
import {
  isPluginPoiColor,
  isPluginPoiIcon,
  parsePluginPoiCategoryKey,
  pluginPoiCategoryKey,
  pluginPoiCategoryLabel,
  pluginPoiCategorySchema,
  pluginPoiQuerySchema,
  pluginPoiResponseSchema,
  pluginPoiSchema,
} from './plugin-poi.schema';

import { describe, expect, it } from 'vitest';

/**
 * Plugin POI categories (#1781). The declared category is what the explore pill
 * renders from, and its colour and icon end up inside marker markup, so the spec
 * pins exactly what gets through: nothing but `#rrggbb` and a name on the list.
 */
const category = { id: 'trailheads', label: 'Trailheads', icon: 'Signpost', color: '#2f855a' };

describe('pluginPoiCategorySchema', () => {
  it('PLUGPOI-SH-001: accepts a declared category with per-language labels', () => {
    const parsed = pluginPoiCategorySchema.parse({
      ...category,
      labels: { de: 'Wanderparkplätze', 'zh-TW': '登山口' },
    });
    expect(parsed.labels).toEqual({ de: 'Wanderparkplätze', 'zh-TW': '登山口' });
  });

  it('PLUGPOI-SH-002: refuses a colour that is not #rrggbb', () => {
    for (const color of ['red', '#fff', '#2f855a;background:url(x)', 'url(https://x)', '#2F855AFF', '']) {
      expect(pluginPoiCategorySchema.safeParse({ ...category, color }).success).toBe(false);
    }
    expect(pluginPoiCategorySchema.safeParse({ ...category, color: '#2F855A' }).success).toBe(true);
  });

  it('PLUGPOI-SH-003: refuses an icon off the allow-list and a malformed id or label', () => {
    expect(pluginPoiCategorySchema.safeParse({ ...category, icon: 'Toilet' }).success).toBe(false);
    expect(pluginPoiCategorySchema.safeParse({ ...category, icon: 'Blocks' }).success).toBe(false);
    expect(pluginPoiCategorySchema.safeParse({ ...category, id: 'Trail' }).success).toBe(false);
    expect(pluginPoiCategorySchema.safeParse({ ...category, id: 'a'.repeat(25) }).success).toBe(false);
    expect(pluginPoiCategorySchema.safeParse({ ...category, label: '   ' }).success).toBe(false);
    expect(pluginPoiCategorySchema.safeParse({ ...category, label: 'x'.repeat(41) }).success).toBe(false);
  });

  it('PLUGPOI-SH-004: refuses a label keyed by a language TREK does not have', () => {
    expect(pluginPoiCategorySchema.safeParse({ ...category, labels: { xx: 'Nope' } }).success).toBe(false);
    expect(pluginPoiCategorySchema.safeParse({ ...category, labels: { de: '' } }).success).toBe(false);
  });
});

describe('plugin POI helpers', () => {
  it('PLUGPOI-SH-005: the icon and colour guards agree with the schema', () => {
    for (const icon of PLUGIN_POI_ICONS) expect(isPluginPoiIcon(icon)).toBe(true);
    expect(isPluginPoiIcon('Toilet')).toBe(false);
    expect(isPluginPoiIcon(42)).toBe(false);
    expect(isPluginPoiColor('#00ff00')).toBe(true);
    expect(isPluginPoiColor('#00ff00 ')).toBe(false);
    expect(isPluginPoiColor(null)).toBe(false);
  });

  it('PLUGPOI-SH-006: the label follows the language and falls back to the default', () => {
    const c = { label: 'Trailheads', labels: { de: 'Wanderparkplätze' } };
    expect(pluginPoiCategoryLabel(c, 'de')).toBe('Wanderparkplätze');
    expect(pluginPoiCategoryLabel(c, 'fr')).toBe('Trailheads');
    expect(pluginPoiCategoryLabel({ label: 'Trailheads' }, 'de')).toBe('Trailheads');
    // An inherited property is not a label.
    expect(pluginPoiCategoryLabel(c, 'toString')).toBe('Trailheads');
  });

  it('PLUGPOI-SH-007: a category key round-trips and nothing else parses as one', () => {
    const key = pluginPoiCategoryKey('trail-finder', 'trailheads');
    expect(key).toBe('plugin:trail-finder/trailheads');
    expect(parsePluginPoiCategoryKey(key)).toEqual({ pluginId: 'trail-finder', categoryId: 'trailheads' });
    for (const bad of [
      'restaurant',
      'plugin:trail-finder',
      'plugin:trail-finder:x',
      'plugin:TF/x',
      'plugin:trail-finder/../x',
      'plugin:ab/x',
    ]) {
      expect(parsePluginPoiCategoryKey(bad)).toBeNull();
    }
  });
});

describe('pluginPoiQuerySchema', () => {
  const query = {
    pluginId: 'trail-finder',
    category: 'trailheads',
    south: '47.1',
    west: '11.2',
    north: '47.3',
    east: '11.5',
  };

  it('PLUGPOI-SH-008: coerces the bbox and keeps an unwrapped longitude', () => {
    expect(pluginPoiQuerySchema.parse(query)).toEqual({ ...query, south: 47.1, west: 11.2, north: 47.3, east: 11.5 });
    expect(pluginPoiQuerySchema.parse({ ...query, west: '179.8', east: '180.3' }).east).toBe(180.3);
  });

  it('PLUGPOI-SH-009: refuses a blank, non-numeric, inverted or off-globe bbox', () => {
    for (const over of [
      { south: '' },
      { north: 'abc' },
      { south: '48', north: '47' },
      { west: '12', east: '11' },
      { north: '91' },
      { east: 'Infinity' },
    ]) {
      expect(pluginPoiQuerySchema.safeParse({ ...query, ...over }).success).toBe(false);
    }
  });

  it('PLUGPOI-SH-010: refuses a malformed plugin or category id and an overlong lang', () => {
    expect(pluginPoiQuerySchema.safeParse({ ...query, pluginId: '../x' }).success).toBe(false);
    expect(pluginPoiQuerySchema.safeParse({ ...query, category: 'Trail heads' }).success).toBe(false);
    expect(pluginPoiQuerySchema.safeParse({ ...query, lang: 'x'.repeat(36) }).success).toBe(false);
    expect(pluginPoiQuerySchema.safeParse({ ...query, lang: 'de' }).success).toBe(true);
  });
});

describe('pluginPoiResponseSchema', () => {
  const poi = {
    osm_id: 'plugin:trail-finder:th-1',
    name: 'Trailhead',
    lat: 47.2,
    lng: 11.3,
    category: 'plugin:trail-finder/trailheads',
    poi_type: 'plugin:trail-finder/trailheads',
    address: null,
    website: 'https://example.test/th-1',
    phone: null,
    opening_hours: null,
    cuisine: null,
    brand: null,
    brand_wikidata: null,
    charging: null,
    source: 'plugin:trail-finder',
    pluginId: 'trail-finder',
    rating: 4.5,
    details: [{ label: 'Length', value: '12 km' }],
    icon: 'Signpost',
    color: '#2f855a',
  };

  it('PLUGPOI-SH-011: accepts the row the server builds', () => {
    expect(
      pluginPoiResponseSchema.parse({ pois: [poi], source: 'plugin:trail-finder', truncated: false, clamped: true })
        .pois,
    ).toHaveLength(1);
  });

  it('PLUGPOI-SH-012: pins the caps: rating range, seven details, an off-list icon', () => {
    expect(pluginPoiSchema.safeParse({ ...poi, rating: 6 }).success).toBe(false);
    expect(
      pluginPoiSchema.safeParse({ ...poi, details: Array.from({ length: 7 }, () => ({ label: 'a', value: 'b' })) })
        .success,
    ).toBe(false);
    expect(pluginPoiSchema.safeParse({ ...poi, icon: 'Skull' }).success).toBe(false);
    expect(pluginPoiSchema.safeParse({ ...poi, opening_hours: 'Mo-Fr 09:00-17:00' }).success).toBe(false);
  });
});
