import { afterEach, describe, expect, it, vi } from 'vitest';
import { dayRouteTargets, generateAppleMapsUrl, generateGeoUrl, generateWazeUrl } from './dayRouteApps';

const A = { lat: 35.71, lng: 139.79, name: 'Senso-ji' };
const B = { lat: 35.72, lng: 139.77, name: 'Ueno Park' };
const C = { lat: 35.66, lng: 139.7, name: 'Shibuya' };

function userAgent(ua: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
}

afterEach(() => vi.restoreAllMocks());

describe('dayRouteApps', () => {
  it('opens one stop in Apple Maps as a named pin', () => {
    expect(generateAppleMapsUrl([A])).toBe('https://maps.apple.com/?ll=35.71,139.79&q=Senso-ji');
  });

  it('hands Apple Maps the whole day, the stops between as waypoints, in the travel mode', () => {
    expect(generateAppleMapsUrl([A, B, C], 'walking')).toBe(
      'https://maps.apple.com/directions?source=35.71,139.79&destination=35.66,139.7&waypoint=35.72,139.77&mode=walking'
    );
  });

  it('sends Waze and geo: to the first stop, since they take one place', () => {
    expect(generateWazeUrl([A, B])).toBe('https://waze.com/ul?ll=35.71,139.79&navigate=yes');
    expect(generateGeoUrl([A, B])).toBe('geo:35.71,139.79?q=35.71,139.79(Senso-ji)');
    expect(generateWazeUrl([])).toBeNull();
  });

  it('offers Apple Maps on an iPhone and marks the one-place apps for a multi-stop day', () => {
    userAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
    const targets = dayRouteTargets([A, B], 'driving');
    expect(targets.map((t) => t.id)).toEqual(['google', 'apple', 'comaps', 'waze']);
    expect(targets.find((t) => t.id === 'waze')?.firstStopOnly).toBe(true);
    expect(targets.find((t) => t.id === 'google')?.firstStopOnly).toBeUndefined();
  });

  it('offers the generic map-app link on Android instead of Apple Maps', () => {
    userAgent('Mozilla/5.0 (Linux; Android 15)');
    expect(dayRouteTargets([A], 'driving').map((t) => t.id)).toEqual(['google', 'comaps', 'waze', 'geo']);
    // A single stop is the whole day, so nothing is cut short.
    expect(dayRouteTargets([A], 'driving').some((t) => t.firstStopOnly)).toBe(false);
  });

  it('offers nothing for a day without a located stop', () => {
    expect(dayRouteTargets([], 'driving')).toEqual([]);
  });
});
