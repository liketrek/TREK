// The dashboard's order of visited countries (#2648).
import { CountryVisits, latestPerCoordinate } from '../../../src/nest/atlas/atlas-visit-order';

import { describe, it, expect } from 'vitest';

describe('CountryVisits', () => {
  it('ATLAS-ORDER-001: puts the latest reached country first and the hand-marked ones after', () => {
    const visits = new CountryVisits();
    visits.note('pt', '2025-04-10');
    visits.note('JP', '2026-05-02');
    visits.note('pt', '2026-01-20');
    visits.note(null, '2026-09-01');
    expect(visits.ordered(['IS', 'JP'])).toEqual(['JP', 'PT', 'IS']);
  });

  it('ATLAS-ORDER-002: keeps the order a country of one trip was found in', () => {
    const visits = new CountryVisits();
    visits.note('FR', '2026-03-01');
    visits.note('ES', '2026-03-01');
    visits.note('IT', null);
    expect(visits.ordered([])).toEqual(['FR', 'ES', 'IT']);
  });
});

describe('latestPerCoordinate', () => {
  it('ATLAS-ORDER-003: keeps one row per coordinate, the one of the latest trip', () => {
    const rows = [
      { id: 1, lat: 1, lng: 2, trip_last_date: '2025-01-01' },
      { id: 2, lat: 1, lng: 2, trip_last_date: '2026-01-01' },
      { id: 3, lat: 3, lng: 4, trip_last_date: null },
    ];
    expect(latestPerCoordinate(rows).map((r) => r.id)).toEqual([2, 3]);
  });
});
