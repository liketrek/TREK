import { TrekPlacesLayersService } from '../../../src/nest/maps/trek-places-layers.service';
import { OverpassElementsClient } from '../../../src/nest/overpass/overpass-elements.service';
import { TourTrailGradeService } from '../../../src/nest/tours/tour-trail-grade.service';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// TOUR-GRADE-001 to TOUR-GRADE-017

const query = vi.fn<(q: string, caller: string) => Promise<unknown[]>>();
const wayTags = vi.fn<TrekPlacesLayersService['wayTags']>();
let service: TourTrailGradeService;

beforeEach(async () => {
  query.mockReset();
  // The TREK Places ways layer not built yet, unless a case says otherwise: the Overpass path.
  wayTags.mockReset().mockResolvedValue({ ok: false, miss: 'not_built' });
  const moduleRef = await Test.createTestingModule({
    providers: [
      TourTrailGradeService,
      { provide: OverpassElementsClient, useValue: { query } },
      { provide: TrekPlacesLayersService, useValue: { wayTags } },
    ],
  }).compile();
  service = moduleRef.get(TourTrailGradeService);
});

const way = (id: number, tags: Record<string, string>) => ({ type: 'way', id, tags });
const NO_SAC = { sac_scale: null, sac_scale_unclear: null };
const NO_MTB = { mtb_scale: null, mtb_scale_uphill: null, mtb_scale_imba: null };
const NO_WAY = { surface: null, highway: null };

describe('TourTrailGradeService (BIK-05)', () => {
  it('TOUR-GRADE-001: reads each scale to its steps and leaves a way without any value out', async () => {
    query.mockResolvedValue([
      way(1, { 'mtb:scale': '2+', 'mtb:scale:uphill': '3' }),
      way(2, { 'mtb:scale': 'S1', 'mtb:scale:imba': '2' }),
      way(3, { name: 'Forstweg' }),
      way(4, { 'mtb:scale': '9', 'mtb:scale:imba': 'hard' }),
    ]);
    const answer = await service.grades({ way_ids: [1, 2, 3, 4, 5] });
    expect(answer).toEqual({
      ways: [
        { ...NO_SAC, ...NO_WAY, id: 1, mtb_scale: '2+', mtb_scale_uphill: '3', mtb_scale_imba: null },
        { ...NO_SAC, ...NO_WAY, id: 2, mtb_scale: '1', mtb_scale_uphill: null, mtb_scale_imba: '2' },
      ],
      unanswered: [],
    });
    expect(query).toHaveBeenCalledWith('[out:json][timeout:25];way(id:1,2,3,4,5);out tags;', 'Tours');
  });

  it('TOUR-GRADE-002: names the ways it could not ask about, never guesses them', async () => {
    query.mockRejectedValue(new Error('all mirrors down'));
    expect(await service.grades({ way_ids: [7, 8] })).toEqual({ ways: [], unanswered: [7, 8] });
  });

  it('TOUR-GRADE-003: asks a long tour in parts, one after another, and keeps what one part answered', async () => {
    const ids = Array.from({ length: 900 }, (_, index) => index + 1);
    query
      .mockResolvedValueOnce([way(1, { 'mtb:scale': '0' })])
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce([way(900, { 'mtb:scale': '5' })]);
    const answer = await service.grades({ way_ids: ids });
    expect(query).toHaveBeenCalledTimes(3);
    expect(answer.ways.map((grade) => grade.id)).toEqual([1, 900]);
    expect(answer.unanswered).toHaveLength(400);
    expect(answer.unanswered[0]).toBe(401);
  });

  it('TOUR-GRADE-004: asks a way it already read only again a day later', async () => {
    vi.useFakeTimers();
    try {
      query.mockResolvedValue([way(1, { 'mtb:scale': '3' })]);
      await service.grades({ way_ids: [1, 1] });
      await service.grades({ way_ids: [1] });
      expect(query).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      await service.grades({ way_ids: [1] });
      expect(query).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('TOUR-GRADE-005: skips what is no way in the answer', async () => {
    query.mockResolvedValue([{ type: 'node', id: 1, tags: { 'mtb:scale': '1' } }, { nonsense: true }]);
    expect(await service.grades({ way_ids: [1] })).toEqual({ ways: [], unanswered: [] });
  });

  it('TOUR-GRADE-006: keeps at most fifty thousand ways, forgetting the longest kept first', async () => {
    query.mockResolvedValue([]);
    // One request after another, as the planner sends them.
    await Array.from({ length: 26 }, (_, part) => part).reduce(async (previous, part) => {
      await previous;
      await service.grades({ way_ids: Array.from({ length: 2000 }, (_, index) => part * 2000 + index + 1) });
    }, Promise.resolve());
    query.mockClear();
    // The first way was forgotten, so it is asked about again; the last one is still kept.
    await service.grades({ way_ids: [1] });
    expect(query).toHaveBeenCalledTimes(1);
    query.mockClear();
    await service.grades({ way_ids: [52_000] });
    expect(query).not.toHaveBeenCalled();
  });

  it('TOUR-GRADE-007: reads sac_scale exactly as OpenStreetMap wrote it and hands any other value on as written (MAP-03)', async () => {
    query.mockResolvedValue([
      way(1, { sac_scale: 'demanding_mountain_hiking' }),
      way(2, { sac_scale: ' Alpine_Hiking ', 'mtb:scale': '3' }),
      way(3, { sac_scale: 'T3' }),
      way(4, { sac_scale: 'hiking;mountain_hiking' }),
      way(5, { sac_scale: '   ' }),
      way(6, { sac_scale: `x${'y'.repeat(80)}` }),
      way(7, { sac_scale: ' mountain_hiking ' }),
    ]);
    const answer = await service.grades({ way_ids: [1, 2, 3, 4, 5, 6, 7] });
    expect(answer.ways).toEqual([
      { ...NO_MTB, ...NO_WAY, id: 1, sac_scale: 'demanding_mountain_hiking', sac_scale_unclear: null },
      { ...NO_MTB, ...NO_WAY, id: 2, mtb_scale: '3', sac_scale: null, sac_scale_unclear: 'Alpine_Hiking' },
      { ...NO_MTB, ...NO_WAY, id: 3, sac_scale: null, sac_scale_unclear: 'T3' },
      { ...NO_MTB, ...NO_WAY, id: 4, sac_scale: null, sac_scale_unclear: 'hiking;mountain_hiking' },
      { ...NO_MTB, ...NO_WAY, id: 6, sac_scale: null, sac_scale_unclear: `x${'y'.repeat(63)}` },
      { ...NO_MTB, ...NO_WAY, id: 7, sac_scale: 'mountain_hiking', sac_scale_unclear: null },
    ]);
  });

  it('TOUR-GRADE-008: never reads a hiking grade from anything but sac_scale (MAP-03)', async () => {
    query.mockResolvedValue([
      way(1, { trail_visibility: 'bad', 'osmc:symbol': 'blue:white:blue_bar', highway: 'path', incline: '30%' }),
    ]);
    expect(await service.grades({ way_ids: [1] })).toEqual({
      ways: [{ ...NO_MTB, ...NO_SAC, id: 1, surface: null, highway: 'path' }],
      unanswered: [],
    });
  });

  it('TOUR-GRADE-009: hands the surface and the kind of way on as written, only trimmed and bounded (MAP-04)', async () => {
    query.mockResolvedValue([
      way(1, { surface: 'fine_gravel', highway: 'track' }),
      way(2, { surface: ' Asphalt ', highway: 'footway' }),
      way(3, { surface: 'gravel;ground' }),
      way(4, { surface: '  ', highway: `x${'y'.repeat(80)}` }),
    ]);
    const answer = await service.grades({ way_ids: [1, 2, 3, 4] });
    expect(answer.ways).toEqual([
      { ...NO_MTB, ...NO_SAC, id: 1, surface: 'fine_gravel', highway: 'track' },
      { ...NO_MTB, ...NO_SAC, id: 2, surface: 'Asphalt', highway: 'footway' },
      { ...NO_MTB, ...NO_SAC, id: 3, surface: 'gravel;ground', highway: null },
      { ...NO_MTB, ...NO_SAC, id: 4, surface: null, highway: `x${'y'.repeat(63)}` },
    ]);
  });

  it('TOUR-GRADE-010: never reads a surface from anything but the surface tag (MAP-04)', async () => {
    query.mockResolvedValue([way(1, { tracktype: 'grade1', smoothness: 'good', 'surface:note': 'gravel' })]);
    expect(await service.grades({ way_ids: [1] })).toEqual({ ways: [], unanswered: [] });
  });

  it('TOUR-GRADE-011: reads the ways from the TREK Places ways layer first and asks no mirror', async () => {
    wayTags.mockResolvedValue({
      ok: true,
      value: {
        complete: true,
        ways: [
          { type: 'way', id: 1, tags: { 'mtb:scale': '2', sac_scale: 'hiking', surface: 'gravel', highway: 'path' } },
          { type: 'way', id: 2, tags: { highway: 'track' } },
        ],
      },
    });
    const answer = await service.grades({ way_ids: [1, 2, 3, 1] });
    expect(wayTags).toHaveBeenCalledWith([1, 2, 3]);
    expect(query).not.toHaveBeenCalled();
    expect(answer).toEqual({
      ways: [
        {
          ...NO_MTB,
          id: 1,
          mtb_scale: '2',
          sac_scale: 'hiking',
          sac_scale_unclear: null,
          surface: 'gravel',
          highway: 'path',
        },
        { ...NO_MTB, ...NO_SAC, id: 2, surface: null, highway: 'track' },
      ],
      unanswered: [],
    });
  });

  it('TOUR-GRADE-012: hands a long tour to the layer whole, which asks it in batches itself', async () => {
    wayTags.mockResolvedValue({
      ok: true,
      value: { complete: true, ways: [{ type: 'way', id: 900, tags: { 'mtb:scale': '5' } }] },
    });
    const ids = Array.from({ length: 900 }, (_, index) => index + 1);
    const answer = await service.grades({ way_ids: ids });
    expect(wayTags).toHaveBeenCalledTimes(1);
    expect(wayTags.mock.calls[0]?.[0]).toHaveLength(900);
    expect(answer.ways.map((grade) => grade.id)).toEqual([900]);
    expect(answer.unanswered).toEqual([]);
  });

  it('TOUR-GRADE-013: a layer not built yet sends the ways to the mirrors as before', async () => {
    query.mockResolvedValue([way(1, { 'mtb:scale': '1' })]);
    const answer = await service.grades({ way_ids: [1] });
    expect(wayTags).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith('[out:json][timeout:25];way(id:1);out tags;', 'Tours');
    expect(answer.ways.map((grade) => grade.mtb_scale)).toEqual(['1']);
  });

  it('TOUR-GRADE-014: a layer that fails or is switched off sends the ways to the mirrors, and none answering is said', async () => {
    wayTags.mockResolvedValueOnce({ ok: false, miss: 'failed' }).mockResolvedValueOnce({ ok: false, miss: 'off' });
    query.mockRejectedValueOnce(new Error('all mirrors down')).mockResolvedValueOnce([way(2, { surface: 'sand' })]);
    expect(await service.grades({ way_ids: [1] })).toEqual({ ways: [], unanswered: [1] });
    expect(await service.grades({ way_ids: [2] })).toEqual({
      ways: [{ ...NO_MTB, ...NO_SAC, id: 2, surface: 'sand', highway: null }],
      unanswered: [],
    });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('TOUR-GRADE-015: keeps what the layer answered a day, a way it left out as having no grade', async () => {
    vi.useFakeTimers();
    try {
      wayTags.mockResolvedValue({
        ok: true,
        value: { complete: true, ways: [{ type: 'way', id: 1, tags: { 'mtb:scale': '3' } }] },
      });
      expect(await service.grades({ way_ids: [1, 2] })).toMatchObject({ unanswered: [] });
      expect(await service.grades({ way_ids: [2, 1] })).toMatchObject({ ways: [{ id: 1 }], unanswered: [] });
      expect(wayTags).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      await service.grades({ way_ids: [1] });
      expect(wayTags).toHaveBeenCalledTimes(2);
      expect(query).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('TOUR-GRADE-016: skips what is no way in the layer answer as it does in a mirror answer', async () => {
    wayTags.mockResolvedValue({
      ok: true,
      // Typed rows from the client, but read through the same check as the mirrors' answer.
      value: { complete: true, ways: [{ type: 'way', id: 0, tags: { 'mtb:scale': '1' } }] },
    });
    expect(await service.grades({ way_ids: [1] })).toEqual({ ways: [], unanswered: [] });
  });

  it('TOUR-GRADE-017: a layer that stopped part way keeps what it answered and asks the mirrors only for the rest', async () => {
    const ids = Array.from({ length: 1000 }, (_, index) => index + 1);
    const rest = ids.slice(500);
    wayTags.mockResolvedValue({
      ok: true,
      value: {
        complete: false,
        ways: [{ type: 'way', id: 7, tags: { 'mtb:scale': '2' } }],
        unanswered: rest,
        failure: new Error('TREK Places API 503'),
      },
    });
    query.mockResolvedValueOnce([way(600, { surface: 'gravel' })]).mockRejectedValueOnce(new Error('all mirrors down'));
    const answer = await service.grades({ way_ids: ids });
    // 500 ways left in parts of 400: two questions, none of them naming a way the layer answered.
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[0]).toBe(`[out:json][timeout:25];way(id:${rest.slice(0, 400).join(',')});out tags;`);
    expect(query.mock.calls[1]?.[0]).toBe(`[out:json][timeout:25];way(id:${rest.slice(400).join(',')});out tags;`);
    expect(answer.ways.map((grade) => grade.id)).toEqual([7, 600]);
    expect(answer.unanswered).toEqual(rest.slice(400));
    // The ways the layer answered are kept: asked again, nothing goes out for them.
    query.mockClear();
    wayTags.mockClear();
    await service.grades({ way_ids: ids.slice(0, 500) });
    expect(wayTags).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });
});
