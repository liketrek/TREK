// FE-UTIL-TRIPADDONS-001 to FE-UTIL-TRIPADDONS-002
import type { TripAddon } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { tripAddonEnabled } from './tripAddons';

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
