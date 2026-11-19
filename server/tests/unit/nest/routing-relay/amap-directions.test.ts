/**
 * routeByAmap: the questions inside China that never reach the Valhalla.
 *
 * What matters here is the translation, not the transport: Amap speaks GCJ-02
 * and answers in metre/step lists, while the planner decodes a precision-6
 * polyline and reads kilometres and seconds. The datum shift and the per-pair
 * legs are the two things a wrong answer would silently ruin (a shape a few
 * hundred metres off, or one leg for a three-stop day, prints as a plausible
 * wrong timetable). The fetch behind safeFetchFollow is a stub.
 */
import { routeByAmap } from '../../../../src/nest/routing-relay/amap-directions.client';
import { safeFetchFollow } from '../../../../src/utils/ssrfGuard';
import { gcj02ToWgs84, wgs84ToGcj02 } from '@trek/shared';

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchFollow: vi.fn() }));

const SHANGHAI = { lat: 31.230416, lon: 121.473701, radius: 50 };
const SUZHOU = { lat: 31.298886, lon: 120.585316, radius: 50 };
const QUANZHOU = { lat: 24.874132, lon: 118.675676, radius: 50 };

const ROUTE = {
  locations: [SHANGHAI, SUZHOU],
  costing: 'auto' as const,
  costing_options: { auto: { use_tolls: 0 } },
};

/** One Amap driving/walking path, as the v3 envelope carries it. */
function pathOf(distance: string, duration: string, tolls: string, roads: string[]) {
  const from = wgs84ToGcj02(SHANGHAI.lat, SHANGHAI.lon);
  const to = wgs84ToGcj02(SUZHOU.lat, SUZHOU.lon);
  return {
    distance,
    duration,
    tolls,
    steps: roads.map((road) => ({
      road,
      instruction: road,
      polyline: `${from.lng.toFixed(6)},${from.lat.toFixed(6)};${to.lng.toFixed(6)},${to.lat.toFixed(6)}`,
    })),
  };
}

function v3(paths: unknown[]) {
  return new Response(JSON.stringify({ status: '1', info: 'OK', infocode: '10000', route: { paths } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

/** The URL the last stubbed call was made with. */
function calledUrl(): URL {
  const calls = vi.mocked(safeFetchFollow).mock.calls;
  return new URL(String(calls[calls.length - 1]?.[0]));
}

/** A precision-6 polyline back to points, so the datum can be checked independently of the encoder. */
function decode(shape: string): [number, number][] {
  const out: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = shape.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < shape.length) {
    lat += next();
    lng += next();
    out.push([lat / 1e6, lng / 1e6]);
  }
  return out;
}

beforeEach(() => {
  vi.mocked(safeFetchFollow).mockReset();
});

describe('routeByAmap', () => {
  it('ROUTE-AMAP-001: asks the driving endpoint in GCJ-02 and answers in Valhalla kilometres and seconds', async () => {
    vi.mocked(safeFetchFollow).mockResolvedValueOnce(v3([pathOf('104300', '7056', '35', ['延安高架路'])]));

    const answer = await routeByAmap(ROUTE, 'amap-test-key', 10_000);

    expect(answer.kind).toBe('route');
    const url = calledUrl();
    expect(url.origin + url.pathname).toBe('https://restapi.amap.com/v3/direction/driving');
    expect(url.searchParams.get('key')).toBe('amap-test-key');
    expect(url.searchParams.get('extensions')).toBe('all');
    // The origin went out as GCJ-02, not as the WGS-84 the planner speaks.
    const sent = (url.searchParams.get('origin') ?? '').split(',').map(Number);
    const gcj = wgs84ToGcj02(SHANGHAI.lat, SHANGHAI.lon);
    expect(sent[0]).toBeCloseTo(gcj.lng, 4);
    expect(sent[1]).toBeCloseTo(gcj.lat, 4);

    const trip = (answer as { body: { trip: { legs: { shape: string; summary: Record<string, unknown> }[] } } }).body
      .trip;
    expect(trip.legs).toHaveLength(1);
    expect(trip.legs[0]?.summary).toMatchObject({
      length: 104.3,
      time: 7056,
      has_toll: true,
      has_highway: false,
      has_ferry: false,
    });
    // The shape comes back in WGS-84: the head of the leg is where Shanghai is, not
    // the half-kilometre east Amap's datum would put it.
    const [first] = decode(trip.legs[0]?.shape ?? '');
    expect(first?.[0]).toBeCloseTo(SHANGHAI.lat, 3);
    expect(first?.[1]).toBeCloseTo(SHANGHAI.lon, 3);
    expect(first?.[0]).toBeCloseTo(gcj02ToWgs84(gcj.lat, gcj.lng).lat, 6);
  });

  it('ROUTE-AMAP-002: maps the avoid weightings onto strategies and leaves other profiles alone', async () => {
    vi.mocked(safeFetchFollow).mockResolvedValue(v3([pathOf('104300', '7056', '0', [])]));

    await routeByAmap(ROUTE, 'k', 10_000);
    expect(calledUrl().searchParams.get('strategy')).toBe('1');

    await routeByAmap({ ...ROUTE, costing_options: { auto: { use_highways: 0 } } }, 'k', 10_000);
    expect(calledUrl().searchParams.get('strategy')).toBe('6');

    await routeByAmap({ ...ROUTE, costing_options: { auto: { use_highways: 0, use_tolls: 0 } } }, 'k', 10_000);
    expect(calledUrl().searchParams.get('strategy')).toBe('7');

    vi.mocked(safeFetchFollow).mockClear();
    await routeByAmap({ ...ROUTE, costing: 'pedestrian' }, 'k', 10_000);
    expect(calledUrl().pathname).toBe('/v3/direction/walking');
    expect(calledUrl().searchParams.has('strategy')).toBe(false);
  });

  it('ROUTE-AMAP-003: reads the v4 cycling envelope, which has no tolls and no road class', async () => {
    const cycling = {
      errcode: 0,
      errmsg: 'OK',
      data: { paths: [pathOf('4200', '900', '0', ['沿江高速'])] },
    };
    vi.mocked(safeFetchFollow).mockResolvedValueOnce(new Response(JSON.stringify(cycling), { status: 200 }));

    const answer = await routeByAmap({ ...ROUTE, costing: 'bicycle' }, 'k', 10_000);

    expect(calledUrl().pathname).toBe('/v4/direction/bicycling');
    const trip = (answer as { body: { trip: { legs: { summary: Record<string, unknown> }[] } } }).body.trip;
    expect(trip.legs[0]?.summary).toMatchObject({
      length: 4.2,
      time: 900,
      has_toll: false,
      has_highway: false,
      has_ferry: false,
    });
  });

  it('ROUTE-AMAP-004: gathers one leg per pair of stops, in the order they were asked', async () => {
    vi.mocked(safeFetchFollow)
      .mockResolvedValueOnce(v3([pathOf('104300', '7056', '35', ['延安高架路'])]))
      .mockResolvedValueOnce(v3([pathOf('902900', '39168', '427', ['沈海高速'])]));

    const answer = await routeByAmap({ ...ROUTE, locations: [SHANGHAI, SUZHOU, QUANZHOU] }, 'k', 30_000);

    expect(answer.kind).toBe('route');
    const trip = (
      answer as { body: { trip: { legs: { summary: Record<string, unknown> }[]; summary: Record<string, number> } } }
    ).body.trip;
    expect(vi.mocked(safeFetchFollow)).toHaveBeenCalledTimes(2);
    expect(trip.legs).toHaveLength(2);
    expect(trip.legs[1]?.summary).toMatchObject({ length: 902.9, time: 39168, has_toll: true, has_highway: true });
    expect(trip.summary.length).toBeCloseTo(1007.2, 5);
  });

  it('ROUTE-AMAP-005: a refusal is a failure, an empty way is none, and a dead host is a failure', async () => {
    vi.mocked(safeFetchFollow).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: '0', info: 'INVALID_USER_KEY', infocode: '10001' }), { status: 200 }),
    );
    expect((await routeByAmap(ROUTE, 'k', 10_000)).kind).toBe('failed');

    vi.mocked(safeFetchFollow).mockResolvedValueOnce(v3([]));
    expect((await routeByAmap(ROUTE, 'k', 10_000)).kind).toBe('none');

    vi.mocked(safeFetchFollow).mockResolvedValueOnce(
      new Response(JSON.stringify({ errcode: 30001, errmsg: 'QUOTA' }), { status: 200 }),
    );
    expect((await routeByAmap({ ...ROUTE, costing: 'bicycle' }, 'k', 10_000)).kind).toBe('failed');

    vi.mocked(safeFetchFollow).mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    expect((await routeByAmap(ROUTE, 'k', 10_000)).kind).toBe('failed');
  });

  it('ROUTE-AMAP-006: does not ask a leg once the question has spent its budget', async () => {
    // Nothing was answered and the deadline is already behind us.
    const answer = await routeByAmap(ROUTE, 'k', 0);
    expect(answer.kind).toBe('failed');
    expect(vi.mocked(safeFetchFollow)).not.toHaveBeenCalled();
  });

  it('ROUTE-AMAP-007: asks a 10021 refusal again and still lands the leg (the free key is ~3 QPS)', async () => {
    vi.mocked(safeFetchFollow)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: '0', info: 'CUQPS_HAS_EXCEEDED_THE_LIMIT', infocode: '10021' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(v3([pathOf('104300', '7056', '0', ['延安高架路'])]));

    const answer = await routeByAmap(ROUTE, 'k', 10_000);

    expect(answer.kind).toBe('route');
    expect(vi.mocked(safeFetchFollow)).toHaveBeenCalledTimes(2);
  });

  it('ROUTE-AMAP-008: a spent daily quota (10003) is refused for good, never asked again', async () => {
    vi.mocked(safeFetchFollow).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: '0', info: 'DAILY_QUERY_OVER_LIMIT', infocode: '10003' }), {
        status: 200,
      }),
    );

    expect((await routeByAmap(ROUTE, 'k', 10_000)).kind).toBe('failed');
    expect(vi.mocked(safeFetchFollow)).toHaveBeenCalledTimes(1);
  });
});
