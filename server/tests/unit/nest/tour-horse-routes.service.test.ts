import { DomainError } from '../../../src/nest/common/domain-error';
import { TrekPlacesLayersService } from '../../../src/nest/maps/trek-places-layers.service';
import { OverpassElementsClient } from '../../../src/nest/overpass/overpass-elements.service';
import { HORSE_ROUTE_WAYS_CAP } from '../../../src/nest/tours/tour-horse-routes.helpers';
import {
  HORSE_ROUTES_KEPT_MAX,
  HORSE_ROUTES_KEPT_MS,
  HORSE_ROUTES_KEPT_POINTS_MAX,
  HORSE_ROUTES_UNAVAILABLE_MESSAGE,
  TourHorseRoutesService,
} from '../../../src/nest/tours/tour-horse-routes.service';
import { Test } from '@nestjs/testing';
import {
  HORSE_ROUTES_ATTRIBUTION,
  HORSE_ROUTES_RESULT_CAP,
  HORSE_ROUTES_UNAVAILABLE_CODE,
  horseRoutesResponseSchema,
} from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// HORSE-SVC-001 to HORSE-SVC-010

const query = vi.fn<(q: string, caller: string) => Promise<unknown[]>>();
const routes = vi.fn<TrekPlacesLayersService['routes']>();
let service: TourHorseRoutesService;

const NOW = 1_800_000_000_000;
const box = { south: 47.12, west: 11.21, north: 47.18, east: 11.29 };
const elements = [
  { type: 'relation', id: 7, tags: { route: 'horse', name: 'Reitweg' }, members: [{ type: 'way', ref: 1, role: '' }] },
  {
    type: 'way',
    id: 1,
    tags: { horse: 'designated' },
    nodes: [1, 2],
    geometry: [
      { lat: 47.15, lon: 11.25 },
      { lat: 47.16, lon: 11.25 },
    ],
  },
];

// The same routes as the layer answers them: every way of the relation's members, tags limited to its keys.
const layerElements = [
  {
    type: 'relation' as const,
    id: 7,
    tags: { route: 'horse', name: 'Reitweg' },
    members: [{ type: 'way' as const, ref: 1, role: '' }],
  },
  {
    type: 'way' as const,
    id: 1,
    tags: { horse: 'designated' },
    nodes: [1, 2],
    geometry: [
      { lat: 47.15, lon: 11.25 },
      { lat: 47.16, lon: 11.25 },
    ],
  },
];

beforeEach(async () => {
  query.mockReset();
  // The TREK Places routes layer not built yet, unless a case says otherwise: the Overpass path.
  routes.mockReset().mockResolvedValue({ ok: false, miss: 'not_built' });
  const moduleRef = await Test.createTestingModule({
    providers: [
      TourHorseRoutesService,
      { provide: OverpassElementsClient, useValue: { query } },
      { provide: TrekPlacesLayersService, useValue: { routes } },
    ],
  }).compile();
  service = moduleRef.get(TourHorseRoutesService);
});

describe('TourHorseRoutesService (HOR-01)', () => {
  it('HORSE-SVC-001: asks Overpass for the box grown to the grid and answers the contract', async () => {
    query.mockResolvedValue(elements);
    const answer = await service.list(box, NOW);
    expect(horseRoutesResponseSchema.parse(answer)).toEqual(answer);
    expect(answer).toMatchObject({ truncated: false, source: 'openstreetmap', attribution: HORSE_ROUTES_ATTRIBUTION });
    expect(answer.routes.map((route) => route.id)).toEqual(['relation/7']);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toContain('(47.1,11.2,47.2,11.3)');
    expect(query.mock.calls[0]?.[1]).toBe('HorseRoutes');
  });

  it('HORSE-SVC-002: keeps an answer for nearby views, and asks again once it is old', async () => {
    query.mockResolvedValue(elements);
    await service.list(box, NOW);
    await service.list({ south: 47.11, west: 11.22, north: 47.19, east: 11.28 }, NOW + 1000);
    expect(query).toHaveBeenCalledTimes(1);
    await service.list(box, NOW + HORSE_ROUTES_KEPT_MS);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('HORSE-SVC-003: two requests for the same box at once share one query', async () => {
    let answer: (value: unknown[]) => void = () => undefined;
    query.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const both = Promise.all([service.list(box, NOW), service.list(box, NOW)]);
    answer(elements);
    const [first, second] = await both;
    expect(first).toEqual(second);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('HORSE-SVC-004: no mirror answering is a 502 the client can show, and the next request asks again', async () => {
    query.mockRejectedValueOnce(new Error('all mirrors down'));
    const failure = await service.list(box, NOW).catch((err: unknown) => err);
    expect(failure).toBeInstanceOf(DomainError);
    expect((failure as DomainError).getStatus()).toBe(502);
    expect((failure as DomainError).getResponse()).toEqual({
      error: HORSE_ROUTES_UNAVAILABLE_MESSAGE,
      code: HORSE_ROUTES_UNAVAILABLE_CODE,
    });
    query.mockResolvedValueOnce(elements);
    expect((await service.list(box, NOW)).routes).toHaveLength(1);
  });

  it('HORSE-SVC-005: keeps a bounded number of answers, letting the one kept longest go', async () => {
    query.mockResolvedValue([]);
    const nth = (n: number) => ({ south: 40 + n * 0.1, west: 5, north: 40.05 + n * 0.1, east: 5.05 });
    // Asked all at once, the answers are kept in the order they were asked for.
    await Promise.all(Array.from({ length: HORSE_ROUTES_KEPT_MAX + 1 }, (_, n) => service.list(nth(n), NOW)));
    expect(query).toHaveBeenCalledTimes(HORSE_ROUTES_KEPT_MAX + 1);
    await service.list(nth(HORSE_ROUTES_KEPT_MAX), NOW);
    await service.list(nth(1), NOW);
    expect(query).toHaveBeenCalledTimes(HORSE_ROUTES_KEPT_MAX + 1);
    await service.list(nth(0), NOW);
    expect(query).toHaveBeenCalledTimes(HORSE_ROUTES_KEPT_MAX + 2);
  });

  it('HORSE-SVC-006: keeps no more section points than its budget, letting the one kept longest go', async () => {
    // Ways of ten thousand points, together just over half the budget: two such answers never fit at once.
    const perWay = 10_000;
    const wayCount = Math.ceil((HORSE_ROUTES_KEPT_POINTS_MAX / 2 + 1) / perWay);
    const ids = Array.from({ length: wayCount }, (_, w) => w + 1);
    const dense = [
      {
        type: 'relation',
        id: 7,
        tags: { route: 'horse' },
        members: ids.map((ref) => ({ type: 'way', ref, role: '' })),
      },
      ...ids.map((id) => ({
        type: 'way',
        id,
        tags: { horse: 'designated' },
        nodes: Array.from({ length: perWay }, (_, i) => id * perWay + i + 1),
        geometry: Array.from({ length: perWay }, (_, i) => ({ lat: 47.15 + i * 1e-5, lon: 11 + id * 0.001 })),
      })),
    ];
    query.mockResolvedValue(dense);
    const other = { south: 48.12, west: 11.21, north: 48.18, east: 11.29 };
    await service.list(box, NOW);
    await service.list(other, NOW);
    expect(query).toHaveBeenCalledTimes(2);
    // The second answer pushed the first out, and stays itself.
    await service.list(other, NOW);
    expect(query).toHaveBeenCalledTimes(2);
    await service.list(box, NOW);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('HORSE-SVC-007: reads the routes from the TREK Places routes layer first, for the box grown to the grid', async () => {
    routes.mockResolvedValue({ ok: true, value: { elements: layerElements, truncated: false } });
    const answer = await service.list(box, NOW);
    expect(horseRoutesResponseSchema.parse(answer)).toEqual(answer);
    expect(answer).toMatchObject({ truncated: false, source: 'openstreetmap', attribution: HORSE_ROUTES_ATTRIBUTION });
    expect(answer.routes.map((route) => route.id)).toEqual(['relation/7']);
    expect(routes).toHaveBeenCalledWith({ south: 47.1, west: 11.2, north: 47.2, east: 11.3 }, 'horse', {
      relations: HORSE_ROUTES_RESULT_CAP,
      ways: HORSE_ROUTE_WAYS_CAP,
    });
    expect(query).not.toHaveBeenCalled();
    // Kept like any answer: a nearby view asks nobody.
    await service.list({ south: 47.11, west: 11.22, north: 47.19, east: 11.28 }, NOW + 1000);
    expect(routes).toHaveBeenCalledTimes(1);
  });

  it('HORSE-SVC-008: says truncated when the layer stopped at one of its caps', async () => {
    routes.mockResolvedValue({ ok: true, value: { elements: layerElements, truncated: true } });
    const answer = await service.list(box, NOW);
    expect(answer.truncated).toBe(true);
    expect(answer.routes).toHaveLength(1);
  });

  it('HORSE-SVC-009: a layer not built, failing or switched off sends the box to the mirrors', async () => {
    routes
      .mockResolvedValueOnce({ ok: false, miss: 'not_built' })
      .mockResolvedValueOnce({ ok: false, miss: 'failed' })
      .mockResolvedValueOnce({ ok: false, miss: 'off' });
    query.mockResolvedValue(elements);
    const boxes = [box, { ...box, south: 48.12, north: 48.18 }, { ...box, south: 49.12, north: 49.18 }];
    const answers = await boxes.reduce<Promise<number[]>>(
      async (done, view) => [...(await done), (await service.list(view, NOW)).routes.length],
      Promise.resolve([]),
    );
    expect(answers).toEqual([1, 1, 1]);
    expect(routes).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('HORSE-SVC-010: the layer failing and no mirror answering is the 502 the client can show', async () => {
    routes.mockResolvedValue({ ok: false, miss: 'failed' });
    query.mockRejectedValue(new Error('all mirrors down'));
    const failure = await service.list(box, NOW).catch((err: unknown) => err);
    expect(failure).toBeInstanceOf(DomainError);
    expect((failure as DomainError).getStatus()).toBe(502);
  });
});
