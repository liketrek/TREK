/**
 * The one reader of `capabilities.poiCategories` (#1781). The manifest parser, the
 * feed and the plugin-pois route all go through it, so these pin the rules once:
 * what refuses an entry, what is cleaned rather than refused, and that the lenient
 * readers skip exactly what the install would refuse.
 */
import { describe, it, expect } from 'vitest';
import { poiCategoriesFrom, poiCategoriesOf, readPoiCategory } from '../../../src/nest/plugins/poi-categories';

const cat = { id: 'water', label: 'Drinking water', icon: 'Droplet', color: '#2B6CB0' };

describe('readPoiCategory', () => {
  it('POICAT-001: reads a declaration into the feed shape', () => {
    expect(readPoiCategory({ ...cat, labels: { fr: 'Eau potable', 'zh-TW': '飲用水' } })).toEqual({
      ok: true,
      value: { id: 'water', label: 'Drinking water', labels: { fr: 'Eau potable', 'zh-TW': '飲用水' }, icon: 'Droplet', color: '#2b6cb0' },
    });
  });

  it('POICAT-002: drops a well-formed language TREK does not ship, and a label that cleans to nothing', () => {
    const read = readPoiCategory({ ...cat, labels: { fi: 'Juomavesi', de: '\u{1F6B0}' } });
    expect(read).toEqual({ ok: true, value: { id: 'water', label: 'Drinking water', icon: 'Droplet', color: '#2b6cb0' } });
  });

  it('POICAT-003: flattens a label to one line', () => {
    const read = readPoiCategory({ ...cat, label: 'Drinking\n\u202Ewater' });
    expect(read.ok && read.value.label).toBe('Drinking water');
  });

  it('POICAT-004: gives the reason for a refusal', () => {
    expect(readPoiCategory(null)).toEqual({ ok: false, reason: 'entries must be objects' });
    expect(readPoiCategory([cat])).toEqual({ ok: false, reason: 'entries must be objects' });
    expect(readPoiCategory({ ...cat, id: 7 })).toEqual({ ok: false, reason: 'id must be lowercase [a-z][a-z0-9-], max 24 chars' });
    expect(readPoiCategory({ ...cat, label: 42 })).toEqual({ ok: false, reason: '"water" label is required (max 40 chars)' });
    expect(readPoiCategory({ ...cat, icon: 'droplet' })).toMatchObject({ ok: false, reason: expect.stringContaining('"water" icon must be one of Footprints') });
    expect(readPoiCategory({ ...cat, color: 12 })).toEqual({ ok: false, reason: '"water" color must be a #rrggbb hex colour' });
    expect(readPoiCategory({ ...cat, labels: { 'de-de': 'x' } })).toEqual({ ok: false, reason: '"water" labels: "de-de" is not a language code' });
    expect(readPoiCategory({ ...cat, labels: { de: 'L'.repeat(41) } })).toEqual({ ok: false, reason: '"water" labels.de is required (max 40 chars)' });
    expect(readPoiCategory({ ...cat, labels: 'de' })).toEqual({ ok: false, reason: '"water" labels must be an object of language code to label' });
  });
});

describe('poiCategoriesFrom / poiCategoriesOf', () => {
  it('POICAT-005: skips refused entries and repeated ids, and reads at most four', () => {
    const list = [{ ...cat, color: 'blue' }, cat, { ...cat, label: 'Again' }, { ...cat, id: 'wc', icon: 'Bath' }, { ...cat, id: 'late' }];
    expect(poiCategoriesFrom(list).map((c) => c.id)).toEqual(['water', 'wc']);
    expect(poiCategoriesFrom('water')).toEqual([]);
  });

  it('POICAT-006: reads a capabilities column and survives a broken one', () => {
    expect(poiCategoriesOf(JSON.stringify({ poiCategories: [cat] }))).toHaveLength(1);
    expect(poiCategoriesOf('{broken')).toEqual([]);
    expect(poiCategoriesOf(null)).toEqual([]);
    expect(poiCategoriesOf('null')).toEqual([]);
  });
});
