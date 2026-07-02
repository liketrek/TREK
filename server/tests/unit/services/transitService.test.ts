/**
 * Unit tests for transitService — TRANSIT-SVC-001..010.
 * The Transitous/MOTIS proxy (#1065): input validation, mode whitelist,
 * response mapping (colors, walk time, wall-clock duration) and caching.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/services/notifications', () => ({ getAppUrl: () => 'https://trek.example.com' }));
vi.mock('../../../src/services/mapsService', () => ({ buildUserAgent: () => 'TREK-Test-UA' }));

import { geocode, plan } from '../../../src/services/transitService';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

function okJson(data: unknown) {
  return { ok: true, json: async () => data };
}

describe('geocode', () => {
  it('TRANSIT-SVC-001: returns [] without calling upstream for short queries', async () => {
    const r = await geocode('a');
    expect(r.results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TRANSIT-SVC-002: maps matches to compact places and sends the UA', async () => {
    fetchMock.mockResolvedValueOnce(okJson([
      { name: 'Alexanderplatz', lat: 52.52, lon: 13.41, type: 'STOP', areas: [{ name: 'Berlin', default: true }] },
      { name: 'no-coords' },
    ]));
    const r = await geocode('alexanderplatz-u1');
    expect(r.results).toEqual([{ name: 'Alexanderplatz', lat: 52.52, lng: 13.41, type: 'STOP', area: 'Berlin' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/v1/geocode?');
    expect(init.headers['User-Agent']).toBe('TREK-Test-UA');
  });

  it('TRANSIT-SVC-003: ignores an invalid near bias instead of forwarding it', async () => {
    fetchMock.mockResolvedValueOnce(okJson([]));
    await geocode('hauptbahnhof-x1', undefined, 'not,coords');
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('place=');
  });
});

describe('plan validation', () => {
  it('TRANSIT-SVC-004: rejects malformed coordinates with 400', async () => {
    await expect(plan({ from: 'x', to: '52.5,13.4' })).rejects.toMatchObject({ status: 400 });
    await expect(plan({ from: '95,13.4', to: '52.5,13.4' })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TRANSIT-SVC-005: rejects modes outside the whitelist', async () => {
    await expect(plan({ from: '52.50,13.40', to: '52.51,13.41', modes: 'BUS,CAR' })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TRANSIT-SVC-006: rejects out-of-range maxTransfers and bad time', async () => {
    await expect(plan({ from: '52.50,13.40', to: '52.51,13.41', maxTransfers: 99 })).rejects.toMatchObject({ status: 400 });
    await expect(plan({ from: '52.50,13.40', to: '52.51,13.41', time: 'not-a-date' })).rejects.toMatchObject({ status: 400 });
  });
});

describe('plan mapping', () => {
  const motisResponse = {
    itineraries: [
      {
        duration: 999, // deliberately wrong — mapping must use wall-clock instead
        startTime: '2026-07-13T08:00:00Z',
        endTime: '2026-07-13T08:30:00Z',
        transfers: 1,
        legs: [
          { mode: 'WALK', duration: 300, distance: 250.7, from: { name: 'A', lat: 1, lon: 2, departure: '2026-07-13T08:00:00Z' }, to: { name: 'Stop 1', lat: 1.1, lon: 2.1, arrival: '2026-07-13T08:05:00Z' } },
          { mode: 'BUS', duration: 1200, routeShortName: '100', routeColor: 'FF0000', routeTextColor: '#ffffff', headsign: 'Zoo', agencyName: 'BVG', intermediateStops: [{}, {}], from: { name: 'Stop 1', lat: 1.1, lon: 2.1, departure: '2026-07-13T08:07:00Z', track: '2' }, to: { name: 'Stop 2', lat: 1.2, lon: 2.2, arrival: '2026-07-13T08:27:00Z' } },
        ],
      },
    ],
  };

  it('TRANSIT-SVC-007: maps legs compactly, normalises GTFS colors and counts walk seconds', async () => {
    fetchMock.mockResolvedValueOnce(okJson(motisResponse));
    const r = await plan({ from: '52.5000,13.4000', to: '52.5100,13.4100' });
    expect(r.itineraries).toHaveLength(1);
    const it = r.itineraries[0];
    // Wall-clock 08:00→08:30, not the reported 999s.
    expect(it.duration).toBe(1800);
    expect(it.walkSeconds).toBe(300);
    expect(it.transfers).toBe(1);
    const bus = it.legs[1];
    expect(bus.line).toBe('100');
    expect(bus.lineColor).toBe('#FF0000');
    expect(bus.lineTextColor).toBe('#ffffff');
    expect(bus.intermediateStops).toBe(2);
    expect(bus.from.track).toBe('2');
    expect(it.legs[0].distance).toBe(251);
  });

  it('TRANSIT-SVC-008: forwards only whitelisted params and pins directModes=WALK', async () => {
    fetchMock.mockResolvedValueOnce(okJson({ itineraries: [] }));
    await plan({ from: '48.1000,11.5000', to: '48.2000,11.6000', modes: 'BUS,TRAM', maxTransfers: 2, arriveBy: true, time: '2026-07-13T09:00:00Z' });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/api/v6/plan?');
    expect(url).toContain('transitModes=BUS%2CTRAM');
    expect(url).toContain('maxTransfers=2');
    expect(url).toContain('arriveBy=true');
    expect(url).toContain('directModes=WALK');
  });

  it('TRANSIT-SVC-009: identical plans hit the cache (single upstream call)', async () => {
    fetchMock.mockResolvedValue(okJson({ itineraries: [] }));
    await plan({ from: '40.0000,-3.0000', to: '40.1000,-3.1000' });
    await plan({ from: '40.0000,-3.0000', to: '40.1000,-3.1000' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('TRANSIT-SVC-010: upstream failure surfaces as a 502-style error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(plan({ from: '41.0000,2.0000', to: '41.1000,2.1000' })).rejects.toMatchObject({ status: 502 });
  });
});
