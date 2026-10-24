// FE-COMP-JOURNEYGEO-001 to FE-COMP-JOURNEYGEO-002: the location helpers the journey
// entry form shares between the desktop editor and the phone sheet.
import { describe, expect, it } from 'vitest';

import { GeoOnceError } from '../../hooks/useGeolocation';
import { geoOnceErrorKey, isValidGeoPoint } from './journeyGeo';

describe('journeyGeo', () => {
  it('FE-COMP-JOURNEYGEO-001: names a failed position fix by its code, anything else as unavailable', () => {
    expect(geoOnceErrorKey(new GeoOnceError('permission-denied'))).toBe('journey.editor.locationPermissionDenied');
    expect(geoOnceErrorKey(new GeoOnceError('timeout'))).toBe('journey.editor.locationTimeout');
    expect(geoOnceErrorKey(new GeoOnceError('insecure-context'))).toBe('journey.editor.locationInsecureContext');
    expect(geoOnceErrorKey(new GeoOnceError('unsupported'))).toBe('journey.editor.locationUnavailable');
    expect(geoOnceErrorKey(new Error('boom'))).toBe('journey.editor.locationUnavailable');
  });

  it('FE-COMP-JOURNEYGEO-002: a point needs finite coordinates inside the globe', () => {
    expect(isValidGeoPoint({ lat: 48.86, lng: 2.33 })).toBe(true);
    expect(isValidGeoPoint({ lat: -90, lng: 180 })).toBe(true);
    expect(isValidGeoPoint({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidGeoPoint({ lat: 0, lng: -181 })).toBe(false);
    expect(isValidGeoPoint({ lat: Number.NaN, lng: 0 })).toBe(false);
    expect(isValidGeoPoint({ lat: 0 })).toBe(false);
    expect(isValidGeoPoint(null)).toBe(false);
    expect(isValidGeoPoint(undefined)).toBe(false);
  });
});
