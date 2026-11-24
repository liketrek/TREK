import { getCountryFromCoords } from '../../../src/utils/country-borders';

import { describe, expect, it } from 'vitest';

// A point that no admin0 polygon contains (just off a simplified coastline, or in a data
// gap) used to go to the candidate with the smallest bounding box. It now goes to the
// candidate whose border is nearest.

describe('getCountryFromCoords, a point no polygon contains', () => {
  it('ATLAS-SVC-056: a point just off a simplified coastline goes to the nearest border, not the smallest box', () => {
    // Central Nice lies about 80 m outside France's simplified coast and 20+ km from Italy,
    // so no polygon contains it. Both boxes cover it and Italy's is the smaller one, so the
    // smallest-box fallback put the whole Nice-Menton strip in Italy.
    expect(getCountryFromCoords(43.6947, 7.2578)).toBe('FR'); // Hôtel Negresco, Nice
    expect(getCountryFromCoords(43.6969, 7.2703)).toBe('FR'); // Place Masséna, Nice
    expect(getCountryFromCoords(43.6598, 7.2137)).toBe('FR'); // Nice Côte d'Azur airport
    expect(getCountryFromCoords(43.7753, 7.5029)).toBe('FR'); // Menton
  });

  it('ATLAS-SVC-057: the Riviera neighbours stay where they were', () => {
    expect(getCountryFromCoords(43.7392, 7.428)).toBe('MC'); // Casino de Monte-Carlo
    expect(getCountryFromCoords(43.7918, 7.6033)).toBe('IT'); // Ventimiglia
    expect(getCountryFromCoords(43.817, 7.7751)).toBe('IT'); // Sanremo
    expect(getCountryFromCoords(43.5814, 7.1237)).toBe('FR'); // Antibes
  });
});
