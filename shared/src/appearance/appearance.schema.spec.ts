import {
  APPEARANCE_SCALE_MAX,
  APPEARANCE_SCALE_MIN,
  DEFAULT_APPEARANCE,
  normalizeAppearance,
} from './appearance.schema';

import { describe, expect, it } from 'vitest';

describe('normalizeAppearance', () => {
  it('returns the neutral default for undefined / null / non-objects', () => {
    expect(normalizeAppearance(undefined)).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance('garbage')).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance(42)).toEqual(DEFAULT_APPEARANCE);
  });

  it('round-trips the default unchanged', () => {
    expect(normalizeAppearance(DEFAULT_APPEARANCE)).toEqual(DEFAULT_APPEARANCE);
  });

  it('fills missing fields from the default for a partial blob', () => {
    const out = normalizeAppearance({ schemeId: 'indigo' });
    expect(out.schemeId).toBe('indigo');
    expect(out.transparency).toBe(true);
    expect(out.density).toBe('comfortable');
    expect(out.typeScale).toEqual({ title: 1, subtitle: 1, body: 1, caption: 1 });
    expect(out.dashboard).toEqual(DEFAULT_APPEARANCE.dashboard);
  });

  it('falls back an unknown scheme to default without throwing', () => {
    expect(normalizeAppearance({ schemeId: 'neon-vaporwave' }).schemeId).toBe('default');
  });

  it('collapses an unknown version to the default look', () => {
    const out = normalizeAppearance({ version: 99, schemeId: 'teal' });
    expect(out.version).toBe(1);
    // unknown-version blobs still keep the fields we understand
    expect(out.schemeId).toBe('teal');
  });

  it('clamps font + type scales into the allowed band', () => {
    const out = normalizeAppearance({ fontScale: 9, typeScale: { title: 0.1, subtitle: 1.2, body: 5, caption: -3 } });
    expect(out.fontScale).toBe(APPEARANCE_SCALE_MAX);
    expect(out.typeScale.title).toBe(APPEARANCE_SCALE_MIN);
    expect(out.typeScale.subtitle).toBe(1.2);
    expect(out.typeScale.body).toBe(APPEARANCE_SCALE_MAX);
    expect(out.typeScale.caption).toBe(APPEARANCE_SCALE_MIN);
  });

  it('accepts a valid custom accent and rejects a malformed one', () => {
    const ok = normalizeAppearance({ schemeId: 'custom', accent: { light: '#4f46e5', dark: '#818cf8' } });
    expect(ok.accent).toEqual({ light: '#4f46e5', dark: '#818cf8' });

    const bad = normalizeAppearance({ schemeId: 'custom', accent: { light: 'not-a-color', dark: '#fff' } });
    expect(bad.accent).toBeNull();
  });

  it('keeps per-device dashboard widget flags and defaults missing ones to true', () => {
    const out = normalizeAppearance({ dashboard: { desktop: { sidebar: false, distanceFlown: false } } });
    expect(out.dashboard.desktop.sidebar).toBe(false);
    expect(out.dashboard.desktop.distanceFlown).toBe(false);
    expect(out.dashboard.desktop.atlas).toBe(true);
    expect(out.dashboard.mobile.tripsTotal).toBe(true);
  });

  it('round-trips the collections widget flag on desktop + mobile and defaults a legacy blob to true', () => {
    // explicit off on both devices survives normalization
    const off = normalizeAppearance({ dashboard: { desktop: { collections: false }, mobile: { collections: false } } });
    expect(off.dashboard.desktop.collections).toBe(false);
    expect(off.dashboard.mobile.collections).toBe(false);
    // a pre-collections blob (flag absent) defaults the widget on
    const legacy = normalizeAppearance({ dashboard: { desktop: { sidebar: true }, mobile: { tripsTotal: true } } });
    expect(legacy.dashboard.desktop.collections).toBe(true);
    expect(legacy.dashboard.mobile.collections).toBe(true);
  });

  it('ignores bogus dashboard values without throwing', () => {
    const out = normalizeAppearance({ dashboard: 'nope' });
    expect(out.dashboard).toEqual(DEFAULT_APPEARANCE.dashboard);
  });
});
