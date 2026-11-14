import { describe, expect, it } from 'vitest';

import { addressWithoutCoordinates } from './placeCoordinates';

describe('addressWithoutCoordinates', () => {
  it('FE-PLANNER-COORDS-001: an address without coordinates is flagged, from a saved place or the form (#2837)', () => {
    expect(addressWithoutCoordinates({ address: 'Rue de Rivoli 1, Paris', lat: null, lng: null })).toBe(true);
    expect(addressWithoutCoordinates({ address: 'Rue de Rivoli 1, Paris', lat: '', lng: '' })).toBe(true);
    // One half is not a position either.
    expect(addressWithoutCoordinates({ address: 'Rue de Rivoli 1, Paris', lat: 48.86, lng: null })).toBe(true);
    expect(addressWithoutCoordinates({ address: 'Rue de Rivoli 1, Paris', lat: '48.86', lng: ' ' })).toBe(true);
  });

  it('FE-PLANNER-COORDS-002: a place with coordinates, zero included, is not flagged', () => {
    expect(addressWithoutCoordinates({ address: 'Rue de Rivoli 1, Paris', lat: 48.86, lng: 2.35 })).toBe(false);
    expect(addressWithoutCoordinates({ address: 'Rue de Rivoli 1, Paris', lat: '48.86', lng: '2.35' })).toBe(false);
    expect(addressWithoutCoordinates({ address: 'Null Island', lat: 0, lng: 0 })).toBe(false);
  });

  it('FE-PLANNER-COORDS-003: a place without an address is a note on purpose and is not flagged', () => {
    expect(addressWithoutCoordinates({ address: null, lat: null, lng: null })).toBe(false);
    expect(addressWithoutCoordinates({ address: '   ', lat: null, lng: null })).toBe(false);
    expect(addressWithoutCoordinates({})).toBe(false);
  });
});
