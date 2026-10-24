// FE-REPO-PADDLEROUTE-001 to FE-REPO-PADDLEROUTE-006: paddle legs planned on the water, online only, remembered per leg.
// FE-API-PADDLEROUTE-001 to FE-API-PADDLEROUTE-002: the call behind them, held to the @trek/shared contract.
import {
  MAX_PADDLE_ROUTE_LEGS,
  paddleRouteRequestSchema,
  paddleRouteResponseSchema,
  type PaddleRouteLeg,
  type PaddleRoutePoint,
} from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { contractHandler } from '../../tests/helpers/msw/contract';
import { server } from '../../tests/helpers/msw/server';
import { paddleRouteApi } from '../api/paddleRoute';
import { isEffectivelyOffline } from '../sync/networkMode';
import { paddleRouteRepo, type PaddleRouteProfile } from './paddleRouteRepo';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/paddleRoute', () => ({ paddleRouteApi: { plan: vi.fn() } }));

const KAYAK: PaddleRouteProfile = { boat: 'kayak', lakeStyle: 'direct' };
const A = { lat: 49.1283, lng: 12.1303 };
const B = { lat: 49.0922, lng: 12.1108 };
const C = { lat: 49.022, lng: 12.111 };

/** The router's answer for a leg: straight on the water, its length the leg's index in metres. */
function okLeg(from: PaddleRoutePoint, to: PaddleRoutePoint, distance = 1000): PaddleRouteLeg {
  return {
    status: 'ok',
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    segments: [{ kind: 'water', from: 0, to: 1, name: null, source: null, osm_ref: null, grade: null }],
    distance_m: distance,
    snapped_m: { from: 0, to: 0 },
  };
}

/** Answers every leg it is asked for on the water. */
function answerAll() {
  vi.mocked(paddleRouteApi.plan).mockImplementation(async (_trip, request) => ({
    legs: request.legs.map(({ from, to }) => okLeg(from, to)),
    graph_rev: 'rev-1',
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  answerAll();
});

describe('paddleRouteRepo', () => {
  it('FE-REPO-PADDLEROUTE-001: asks the server for every leg once, with the boat and the lake style', async () => {
    const legs = await paddleRouteRepo.plan(
      101,
      [
        { from: A, to: B },
        { from: B, to: C },
      ],
      KAYAK
    );
    expect(legs.map((leg) => leg.status)).toEqual(['ok', 'ok']);
    expect(paddleRouteApi.plan).toHaveBeenCalledTimes(1);
    expect(vi.mocked(paddleRouteApi.plan).mock.calls[0]?.[1]).toEqual({
      legs: [
        { from: A, to: B },
        { from: B, to: C },
      ],
      boat: 'kayak',
      lake_style: 'direct',
    });
  });

  it('FE-REPO-PADDLEROUTE-002: a leg planned before comes from memory; moving one point asks only for its legs', async () => {
    await paddleRouteRepo.plan(
      102,
      [
        { from: A, to: B },
        { from: B, to: C },
      ],
      KAYAK
    );
    vi.mocked(paddleRouteApi.plan).mockClear();
    await paddleRouteRepo.plan(
      102,
      [
        { from: A, to: B },
        { from: B, to: C },
      ],
      KAYAK
    );
    expect(paddleRouteApi.plan).not.toHaveBeenCalled();

    const moved = { lat: C.lat + 0.001, lng: C.lng };
    await paddleRouteRepo.plan(
      102,
      [
        { from: A, to: B },
        { from: B, to: moved },
      ],
      KAYAK
    );
    expect(vi.mocked(paddleRouteApi.plan).mock.calls[0]?.[1].legs).toEqual([{ from: B, to: moved }]);
  });

  it('FE-REPO-PADDLEROUTE-003: another boat or lake style is another leg; a failed leg is asked again next time', async () => {
    await paddleRouteRepo.plan(103, [{ from: A, to: B }], KAYAK);
    await paddleRouteRepo.plan(103, [{ from: A, to: B }], { boat: 'sup', lakeStyle: 'direct' });
    await paddleRouteRepo.plan(103, [{ from: A, to: B }], { boat: 'kayak', lakeStyle: 'shore' });
    expect(paddleRouteApi.plan).toHaveBeenCalledTimes(3);

    vi.mocked(paddleRouteApi.plan).mockResolvedValue({
      legs: [{ status: 'failed', code: 'busy', at: null }],
      graph_rev: null,
    });
    await expect(paddleRouteRepo.plan(103, [{ from: B, to: C }], KAYAK)).resolves.toEqual([
      { status: 'failed', code: 'busy', at: null },
    ]);
    answerAll();
    const again = await paddleRouteRepo.plan(103, [{ from: B, to: C }], KAYAK);
    expect(again[0]?.status).toBe('ok');
  });

  it('FE-REPO-PADDLEROUTE-004: forgetting a leg asks the server again (P2A-05)', async () => {
    await paddleRouteRepo.plan(104, [{ from: A, to: B }], KAYAK);
    paddleRouteRepo.forget(104, A, B, KAYAK);
    await paddleRouteRepo.plan(104, [{ from: A, to: B }], KAYAK);
    expect(paddleRouteApi.plan).toHaveBeenCalledTimes(2);
  });

  it('FE-REPO-PADDLEROUTE-005: offline, a leg not planned before comes back failed as offline; a remembered one still answers', async () => {
    await paddleRouteRepo.plan(105, [{ from: A, to: B }], KAYAK);
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    vi.mocked(paddleRouteApi.plan).mockClear();
    const legs = await paddleRouteRepo.plan(
      105,
      [
        { from: A, to: B },
        { from: B, to: C },
      ],
      KAYAK
    );
    expect(legs.map((leg) => leg.status)).toEqual(['ok', 'failed']);
    expect(legs[1]).toEqual({ status: 'failed', code: 'offline', at: null });
    expect(paddleRouteApi.plan).not.toHaveBeenCalled();
  });

  it('FE-REPO-PADDLEROUTE-006: more legs than one request takes go in batches; a leg the answer leaves out stays unrouted', async () => {
    const many = Array.from({ length: MAX_PADDLE_ROUTE_LEGS + 3 }, (_, index) => ({
      from: { lat: 49 + index * 0.001, lng: 12 },
      to: { lat: 49 + (index + 1) * 0.001, lng: 12 },
    }));
    const legs = await paddleRouteRepo.plan(106, many, KAYAK);
    expect(paddleRouteApi.plan).toHaveBeenCalledTimes(2);
    expect(vi.mocked(paddleRouteApi.plan).mock.calls[1]?.[1].legs).toHaveLength(3);
    expect(legs.every((leg) => leg.status === 'ok')).toBe(true);

    vi.mocked(paddleRouteApi.plan).mockResolvedValue({ legs: [], graph_rev: null });
    await expect(paddleRouteRepo.plan(106, [{ from: C, to: A }], KAYAK)).resolves.toEqual([
      { status: 'failed', code: 'no_water_path', at: null },
    ]);
  });
});

/** The real call; the repo tests above run against a mock of this module. */
async function realApi() {
  const actual = await vi.importActual<typeof import('../api/paddleRoute')>('../api/paddleRoute');
  return actual.paddleRouteApi;
}

describe('paddleRouteApi', () => {
  it('FE-API-PADDLEROUTE-001: posts the legs to the trip and answers the parsed reply', async () => {
    const api = await realApi();
    server.use(
      contractHandler(
        'post',
        '/api/trips/7/paddle/route',
        { request: paddleRouteRequestSchema, response: paddleRouteResponseSchema },
        ({ body }) => ({ legs: body.legs.map(({ from, to }) => okLeg(from, to, 2400)), graph_rev: 'abc' })
      )
    );
    const answer = await api.plan(7, { legs: [{ from: A, to: B }], boat: 'canoe' });
    expect(answer.legs[0]).toMatchObject({ status: 'ok', distance_m: 2400 });
    expect(answer.graph_rev).toBe('abc');
  });

  it('FE-API-PADDLEROUTE-002: an answer off the contract is refused instead of handed on', async () => {
    const api = await realApi();
    server.use(http.post('/api/trips/7/paddle/route', () => HttpResponse.json({ legs: [{ status: 'maybe' }] })));
    await expect(api.plan(7, { legs: [{ from: A, to: B }] })).rejects.toThrow();
  });
});
