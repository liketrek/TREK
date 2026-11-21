// FE-UTIL-TRIPADDONS-001 to FE-UTIL-TRIPADDONS-003
import type { TripAddon } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { pluginPageShown, tripAddonEnabled } from './tripAddons';

const addon = (id: string, enabled: boolean): TripAddon => ({
  id,
  name: id,
  icon: null,
  enabled,
  instanceEnabled: !enabled,
  overridden: true,
});

describe('tripAddonEnabled', () => {
  it('FE-UTIL-TRIPADDONS-001: the trip’s own list decides, both ways', () => {
    expect(tripAddonEnabled([addon('budget', true)], 'budget', false)).toBe(true);
    expect(tripAddonEnabled([addon('budget', false)], 'budget', true)).toBe(false);
  });

  it('FE-UTIL-TRIPADDONS-002: an addon the list does not name, or no list at all, follows the instance', () => {
    expect(tripAddonEnabled([addon('budget', false)], 'dawarich', true)).toBe(true);
    expect(tripAddonEnabled(null, 'tours', true)).toBe(true);
    expect(tripAddonEnabled(undefined, 'tours', false)).toBe(false);
    expect(tripAddonEnabled([], 'packing', false)).toBe(false);
  });
});

describe('pluginPageShown', () => {
  it('FE-UTIL-TRIPADDONS-003: a page that replaces core tabs shows while one of their addons is on', () => {
    const on = (ids: string[]) => (id: string) => ids.includes(id);
    expect(pluginPageShown(undefined, on([]))).toBe(true);
    expect(pluginPageShown([], on([]))).toBe(true);
    expect(pluginPageShown(['finanzplan'], on(['budget']))).toBe(true);
    expect(pluginPageShown(['finanzplan'], on(['packing']))).toBe(false);
    expect(pluginPageShown(['finanzplan', 'listen'], on(['packing']))).toBe(true);
    expect(pluginPageShown(['dateien', 'collab'], on([]))).toBe(false);
    // A tab no addon owns does not hide the page.
    expect(pluginPageShown(['plan'], on([]))).toBe(true);
  });
});
