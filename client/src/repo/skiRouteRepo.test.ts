// FE-REPO-SKIROUTE-001 to FE-REPO-SKIROUTE-007: ski legs planned on the piste data, online only, remembered per request.
// FE-API-SKIROUTE-001 to FE-API-SKIROUTE-002: the call behind them, held to the @trek/shared contract.
import {
  MAX_SKI_ROUTE_LEGS,
  skiRouteRequestSchema,
  skiRouteResponseSchema,
  type SkiRouteLeg,
  type SkiRoutePoint,
  type SkiRouteResponse,
} from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { contractHandler } from '../../tests/helpers/msw/contract';
import { server } from '../../tests/helpers/msw/server';
import { skiRouteApi } from '../api/skiRoute';
import { isEffectivelyOffline } from '../sync/networkMode';
import { skiRouteRepo, type SkiRouteAsk } from './skiRouteRepo';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/skiRoute', () => ({ skiRouteApi: { plan: vi.fn() } }));

const ALPINE: SkiRouteAsk = { discipline: 'alpine', technique: null, options: {} };
const A = { lat: 47.1, lng: 11.1 };
const B = { lat: 47.11, lng: 11.12 };
const C = { lat: 47.12, lng: 11.14 };

/** A planned leg: one easy run straight from one point to the next. */
function okLeg(from: SkiRoutePoint, to: SkiRoutePoint): SkiRouteLeg {
  return {
    status: 'ok',
    geometry: [
      [from.lat, from.lng, 1800],
      [to.lat, to.lng, 1500],
    ],
    segments: [
      {
        kind: 'run',
        from: 0,
        to: 1,
        name: 'Talabfahrt',
        ref: null,
        difficulty: 'easy',
        lift_type: null,
        grooming: [],
        seconds: 300,
        wait_seconds: 0,
        length_m: 1500,
        flags: [],
        osm_way: null,
      },
    ],
    distance_m: 1500,
    climb_m: 0,
    descent_m: 300,
    seconds: { ski: 300, lift: 0, wait: 0, walk: 0 },
    snapped_m: { from: 0, to: 0 },
    area_ids: ['w:1'],
    why: [],
    alternatives: [],
  };
}

function response(legs: SkiRouteLeg[], extra: Partial<SkiRouteResponse> = {}): SkiRouteResponse {
  return {
    legs,
    build: '2026-11-02',
    stale: false,
    area_names: ['Gletscherwelt'],
    colour_scheme: 'europe',
    attribution: '© OpenStreetMap contributors',
    ...extra,
  };
}

function answerAll() {
  vi.mocked(skiRouteApi.plan).mockImplementation(async (_tripId, request) =>
    response(request.legs.map(({ from, to }) => okLeg(from, to)))
  );
}

beforeEach(() => {
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  vi.mocked(skiRouteApi.plan).mockReset();
  answerAll();
});

describe('skiRouteRepo (SKI-02)', () => {
  it('FE-REPO-SKIROUTE-001: asks for the legs of a tour in one request and hands on the build, areas and colours', async () => {
    const answer = await skiRouteRepo.plan(
      201,
      [
        { from: A, to: B },
        { from: B, to: C },
      ],
      { discipline: 'cross_country', technique: 'skating', options: { lit_only: true } }
    );
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(1);
    expect(vi.mocked(skiRouteApi.plan).mock.calls[0]?.[1]).toEqual({
      legs: [
        { from: A, to: B },
        { from: B, to: C },
      ],
      discipline: 'cross_country',
      technique: 'skating',
      options: { lit_only: true },
    });
    expect(answer.legs.map((leg) => leg.status)).toEqual(['ok', 'ok']);
    expect(answer).toMatchObject({ build: '2026-11-02', stale: false, areaNames: ['Gletscherwelt'] });
    expect(answer.colourScheme).toBe('europe');
    expect(answer.attribution).toBe('© OpenStreetMap contributors');
  });

  it('FE-REPO-SKIROUTE-002: the same request again comes from memory, another option asks again', async () => {
    await skiRouteRepo.plan(202, [{ from: A, to: B }], ALPINE);
    await skiRouteRepo.plan(202, [{ from: A, to: B }], ALPINE);
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(1);
    await skiRouteRepo.plan(202, [{ from: A, to: B }], { ...ALPINE, options: { pace: 'sporty' } });
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(2);
  });

  it('FE-REPO-SKIROUTE-003: an answer that may change a moment later is not remembered', async () => {
    vi.mocked(skiRouteApi.plan).mockResolvedValueOnce(
      response([{ status: 'failed', code: 'loading', at: null, hint: null, detail: null }], { build: null })
    );
    const first = await skiRouteRepo.plan(203, [{ from: A, to: B }], ALPINE);
    expect(first.legs[0]).toMatchObject({ status: 'failed', code: 'loading' });
    const again = await skiRouteRepo.plan(203, [{ from: A, to: B }], ALPINE);
    expect(again.legs[0]?.status).toBe('ok');
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(2);
  });

  it('FE-REPO-SKIROUTE-004: offline every leg comes back failed as offline and nothing is sent', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    const answer = await skiRouteRepo.plan(204, [{ from: A, to: B }], ALPINE);
    expect(answer.legs).toEqual([{ status: 'failed', code: 'offline', at: null, hint: null, detail: null }]);
    expect(answer.build).toBeNull();
    expect(answer.attribution).toBeNull();
    expect(skiRouteApi.plan).not.toHaveBeenCalled();
  });

  it('FE-REPO-SKIROUTE-005: more legs than one request takes go in batches, merged in order, a stale copy said so', async () => {
    vi.mocked(skiRouteApi.plan).mockImplementation(async (_tripId, request) => {
      const legs = request.legs.map(({ from, to }) => okLeg(from, to));
      return response(legs, { stale: legs.length < MAX_SKI_ROUTE_LEGS, area_names: [`Area ${legs.length}`] });
    });
    const many = Array.from({ length: MAX_SKI_ROUTE_LEGS + 2 }, (_, index) => ({
      from: { lat: 47 + index * 0.001, lng: 11 },
      to: { lat: 47 + (index + 1) * 0.001, lng: 11 },
    }));
    const answer = await skiRouteRepo.plan(205, many, ALPINE);
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(2);
    expect(answer.legs).toHaveLength(MAX_SKI_ROUTE_LEGS + 2);
    expect(answer.stale).toBe(true);
    expect(answer.areaNames).toEqual([`Area ${MAX_SKI_ROUTE_LEGS}`, 'Area 2']);
  });

  it('FE-REPO-SKIROUTE-006: legs refused while piste routing is switched off are asked again once it is back on', async () => {
    vi.mocked(skiRouteApi.plan).mockResolvedValueOnce(
      response([{ status: 'failed', code: 'disabled', at: null, hint: null, detail: null }], { build: null })
    );
    const off = await skiRouteRepo.plan(206, [{ from: A, to: B }], ALPINE);
    expect(off.legs[0]).toMatchObject({ status: 'failed', code: 'disabled' });
    const on = await skiRouteRepo.plan(206, [{ from: A, to: B }], ALPINE);
    expect(on.legs[0]?.status).toBe('ok');
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(2);
  });

  it('FE-REPO-SKIROUTE-007: a plan on an older copy of the piste data is asked again, a current one comes from memory', async () => {
    vi.mocked(skiRouteApi.plan).mockResolvedValueOnce(response([okLeg(A, B)], { stale: true }));
    expect((await skiRouteRepo.plan(207, [{ from: A, to: B }], ALPINE)).stale).toBe(true);
    expect((await skiRouteRepo.plan(207, [{ from: A, to: B }], ALPINE)).stale).toBe(false);
    await skiRouteRepo.plan(207, [{ from: A, to: B }], ALPINE);
    expect(skiRouteApi.plan).toHaveBeenCalledTimes(2);
  });
});

/** The real call; the repo tests above run against a mock of this module. */
async function realApi() {
  const actual = await vi.importActual<typeof import('../api/skiRoute')>('../api/skiRoute');
  return actual.skiRouteApi;
}

describe('skiRouteApi', () => {
  it('FE-API-SKIROUTE-001: posts the legs to the trip and answers the parsed reply', async () => {
    const api = await realApi();
    server.use(
      contractHandler(
        'post',
        '/api/trips/7/ski/route',
        { request: skiRouteRequestSchema, response: skiRouteResponseSchema },
        ({ body }) => response(body.legs.map(({ from, to }) => okLeg(from, to)))
      )
    );
    const answer = await api.plan(7, { legs: [{ from: A, to: B }], discipline: 'touring' });
    expect(answer.legs[0]).toMatchObject({ status: 'ok', distance_m: 1500 });
    expect(answer.build).toBe('2026-11-02');
  });

  it('FE-API-SKIROUTE-002: an answer off the contract is refused instead of handed on', async () => {
    const api = await realApi();
    server.use(http.post('/api/trips/7/ski/route', () => HttpResponse.json({ legs: [{ status: 'maybe' }] })));
    await expect(api.plan(7, { legs: [{ from: A, to: B }], discipline: 'alpine' })).rejects.toThrow();
  });
});
