import { GeoOnceError } from '../../hooks/useGeolocation';

// Shared by the desktop entry editor and the mobile entry sheet so a failed
// one-shot position fix surfaces the same translated message everywhere.
export function geoOnceErrorKey(err: unknown): string {
  const code = err instanceof GeoOnceError ? err.code : 'unavailable';
  return code === 'permission-denied'
    ? 'journey.editor.locationPermissionDenied'
    : code === 'timeout'
      ? 'journey.editor.locationTimeout'
      : code === 'insecure-context'
        ? 'journey.editor.locationInsecureContext'
        : 'journey.editor.locationUnavailable';
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export function isValidGeoPoint(point: Partial<GeoPoint> | null | undefined): point is GeoPoint {
  return (
    !!point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}
