import tzlookup from 'tz-lookup';

export function resolveTimeZone(lat: unknown, lng: unknown): string | null {
  if (
    typeof lat !== 'number'
    || typeof lng !== 'number'
    || !Number.isFinite(lat)
    || !Number.isFinite(lng)
  ) {
    return null;
  }
  try {
    return tzlookup(lat, lng);
  } catch {
    return null;
  }
}
