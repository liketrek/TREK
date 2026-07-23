import { describe, expect, it } from 'vitest';
import { distanceBetweenGeoPoints, sortProviderPhotos } from './JourneyDetailPage.helpers';

describe('Journey provider photo ranking', () => {
  it('places GPS photos nearest the selected Journey location and keeps photos without GPS', () => {
    const photos = [
      { id: 'far', lat: 41.95, lng: 12.5 },
      { id: 'unknown', lat: null, lng: null },
      { id: 'near', lat: 41.901, lng: 12.501 },
    ];

    expect(sortProviderPhotos(photos, { lat: 41.9, lng: 12.5 }).map((photo) => photo.id)).toEqual([
      'near',
      'far',
      'unknown',
    ]);
  });

  it('preserves provider order when the selected entry has no valid location', () => {
    const photos = [{ id: 'first' }, { id: 'second' }];
    expect(sortProviderPhotos(photos, { lat: 200, lng: 12 }).map((photo) => photo.id)).toEqual(['first', 'second']);
  });

  it('calculates a zero distance for identical coordinates', () => {
    expect(distanceBetweenGeoPoints({ lat: 41.9, lng: 12.5 }, { lat: 41.9, lng: 12.5 })).toBe(0);
  });
});
