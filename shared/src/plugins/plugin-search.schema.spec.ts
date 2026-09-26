import { PLUGIN_SEARCH_SUGGEST_MAX, pluginSearchHitSchema, pluginSuggestResultSchema } from './plugin-search.schema';

import { describe, expect, it } from 'vitest';

/**
 * Plugin search rows (#2221). The client checks every typed-ahead answer against
 * this before a row reaches the list, so the spec pins what gets through: only a
 * namespaced plugin row, on the earth, with a rating on the five-point scale.
 */
const hit = {
  osm_id: 'plugin:all-the-places:ichiran-ueno',
  name: 'Ichiran Ueno',
  address: 'Ueno 6-11-12, Taito',
  lat: 35.7101,
  lng: 139.7745,
  rating: 4.3,
  website: 'https://ichiran.com/shop/ueno',
  phone: null,
  category: 'restaurant',
  description: null,
  source: 'plugin:all-the-places',
  pluginId: 'all-the-places',
};

describe('pluginSearchHitSchema', () => {
  it('accepts a row as the host normalizes it, unrated or rated', () => {
    expect(pluginSearchHitSchema.safeParse(hit).success).toBe(true);
    expect(pluginSearchHitSchema.safeParse({ ...hit, rating: null, website: null }).success).toBe(true);
  });

  it('refuses a row that is not namespaced as a plugin one', () => {
    expect(pluginSearchHitSchema.safeParse({ ...hit, osm_id: 'node:123' }).success).toBe(false);
    expect(pluginSearchHitSchema.safeParse({ ...hit, source: 'trek-places' }).success).toBe(false);
  });

  it('refuses a row with no name, off the globe, or rated past five', () => {
    expect(pluginSearchHitSchema.safeParse({ ...hit, name: '' }).success).toBe(false);
    expect(pluginSearchHitSchema.safeParse({ ...hit, lat: 91 }).success).toBe(false);
    expect(pluginSearchHitSchema.safeParse({ ...hit, lng: -181 }).success).toBe(false);
    expect(pluginSearchHitSchema.safeParse({ ...hit, rating: 7 }).success).toBe(false);
  });
});

describe('pluginSuggestResultSchema', () => {
  it(`keeps a typed-ahead answer to ${PLUGIN_SEARCH_SUGGEST_MAX} rows`, () => {
    const rows = (n: number) => Array.from({ length: n }, () => hit);
    expect(pluginSuggestResultSchema.safeParse({ places: rows(PLUGIN_SEARCH_SUGGEST_MAX) }).success).toBe(true);
    expect(pluginSuggestResultSchema.safeParse({ places: rows(PLUGIN_SEARCH_SUGGEST_MAX + 1) }).success).toBe(false);
  });
});
