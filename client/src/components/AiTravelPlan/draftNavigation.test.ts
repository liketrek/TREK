import type { TravelPlanDraftItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  amapDayNavigationUrl,
  amapPlaceNavigationUrl,
  dayNavigationUrl,
  googleDayNavigationUrl,
  googlePlaceNavigationUrl,
  placeNavigationUrl,
} from './draftNavigation';

function stop(name: string, lat: number, lng: number): TravelPlanDraftItem {
  return {
    place: { provider: 'amap', providerId: `${lat},${lng}`, name, lat, lng },
    arriveAt: null,
    leaveAt: null,
    activity: null,
    travelFromPrevious: null,
    estimatedCostCny: null,
    source: { provider: 'amap', sourceId: null, checkedAt: '2026-11-19 00:00:00', freshness: 'live' },
  };
}

const FIRST = stop('忻州古城', 38.416, 112.733);
const MIDDLE = stop('五台山', 38.45, 112.8);
const LAST = stop('雁门关', 38.5, 112.9);

const PARIS = stop('Paris', 48.8566, 2.3522);
const LOUVRE = stop('Louvre', 48.8606, 2.3376);

describe('draft navigation links', () => {
  it('AMAPNAV-001: a domestic day runs first → via → last in visit order, names encoded', () => {
    const url = amapDayNavigationUrl([FIRST, MIDDLE, LAST]);
    expect(url).not.toBeNull();

    expect(url?.startsWith('https://uri.amap.com/navigation?')).toBe(true);
    expect(url).toContain(`from=112.733,38.416,${encodeURIComponent('忻州古城')}`);
    expect(url).toContain(`via=112.8,38.45,${encodeURIComponent('五台山')}`);
    expect(url).toContain(`to=112.9,38.5,${encodeURIComponent('雁门关')}`);
    expect(url).toContain('mode=car');
    expect(url).toContain('coordinate=gaode');
  });

  it('AMAPNAV-002: a one-stop day has no route, a two-stop day has no empty via', () => {
    expect(amapDayNavigationUrl([FIRST])).toBeNull();
    expect(amapDayNavigationUrl([])).toBeNull();

    const url = amapDayNavigationUrl([FIRST, LAST]);
    expect(url).not.toBeNull();
    expect(url).not.toContain('via=');
    expect(url).toContain('from=112.733,38.416,');
    expect(url).toContain('to=112.9,38.5,');
  });

  it('AMAPNAV-003: “navigate here” omits from, so Amap starts at the current location', () => {
    const url = amapPlaceNavigationUrl(MIDDLE.place);

    expect(url).toContain(`to=112.8,38.45,${encodeURIComponent('五台山')}`);
    expect(url).not.toContain('from=');
    expect(url).not.toContain('via=');
    expect(url).toContain('callnative=1');
  });

  it('AMAPNAV-004: a comma inside a name never breaks the point list', () => {
    const url = amapPlaceNavigationUrl(stop('A,B 店', 1, 2).place);

    expect(url).toContain(`to=2,1,${encodeURIComponent('A,B 店')}`);
  });

  it('AMAPNAV-005: the walking toggle asks both apps for walking, not driving', () => {
    expect(amapDayNavigationUrl([FIRST, LAST], 'walk')).toContain('mode=walk');
    expect(amapPlaceNavigationUrl(FIRST.place, 'walk')).toContain('mode=walk');

    const google = new URL(googleDayNavigationUrl([PARIS, LOUVRE], 'walk') ?? '');
    expect(google.searchParams.get('travelmode')).toBe('walking');

    const googlePlace = new URL(googlePlaceNavigationUrl(PARIS.place, 'walk'));
    expect(googlePlace.searchParams.get('travelmode')).toBe('walking');
  });

  it('AMAPNAV-006: an overseas day goes to Google Maps with the visit order, never Amap', () => {
    const url = dayNavigationUrl([PARIS, LOUVRE, stop('Eiffel', 48.8584, 2.2945)]);
    expect(url).not.toBeNull();
    expect(url).not.toContain('uri.amap.com');

    const parsed = new URL(url ?? '');
    expect(parsed.origin).toBe('https://www.google.com');
    expect(parsed.pathname).toBe('/maps/dir/');
    expect(parsed.searchParams.get('origin')).toBe('48.8566,2.3522');
    expect(parsed.searchParams.get('destination')).toBe('48.8584,2.2945');
    expect(parsed.searchParams.get('waypoints')).toBe('48.8606,2.3376');
    expect(parsed.searchParams.get('travelmode')).toBe('driving');
  });

  it('AMAPNAV-007: a day crossing the border counts as overseas — one link cannot cover both maps', () => {
    const url = dayNavigationUrl([FIRST, PARIS]);
    expect(url).toContain('https://www.google.com/maps/dir/');
  });

  it('AMAPNAV-008: “navigate here” routes a domestic stop to Amap and a foreign one to Google', () => {
    expect(placeNavigationUrl(FIRST.place)).toContain('https://uri.amap.com/navigation?');

    const parsed = new URL(placeNavigationUrl(PARIS.place));
    expect(parsed.origin).toBe('https://www.google.com');
    expect(parsed.searchParams.get('destination')).toBe('48.8566,2.3522');
  });

  it('AMAPNAV-009: a domestic day stays on Amap through the same picker', () => {
    expect(dayNavigationUrl([FIRST, MIDDLE, LAST])).toContain('https://uri.amap.com/navigation?');
  });
});
