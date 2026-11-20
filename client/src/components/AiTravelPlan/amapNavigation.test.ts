import type { TravelPlanDraftItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { amapDayNavigationUrl, amapPlaceNavigationUrl } from './amapNavigation';

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

describe('amap navigation links', () => {
  it('AMAPNAV-001: a day runs first → via → last in visit order, names encoded', () => {
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
});
