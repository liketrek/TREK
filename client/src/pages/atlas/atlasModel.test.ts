import { describe, it, expect } from 'vitest';
import { normalizeRegionName } from './atlasModel';

describe('normalizeRegionName', () => {
  it('matches names that only differ by diacritics (Ile-de-France vs Île-de-France)', () => {
    expect(normalizeRegionName('Ile-de-France')).toBe(normalizeRegionName('Île-de-France'));
  });

  it('matches names that only differ by dash style and surrounding spaces', () => {
    expect(normalizeRegionName('Bourgogne – Franche-Comté')).toBe(normalizeRegionName('Bourgogne-Franche-Comté'));
  });

  it('is case-insensitive', () => {
    expect(normalizeRegionName('PROVENCE')).toBe(normalizeRegionName('provence'));
  });

  it('still distinguishes genuinely different names', () => {
    expect(normalizeRegionName('Bretagne')).not.toBe(normalizeRegionName('Brittany'));
  });
});
