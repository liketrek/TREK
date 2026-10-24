/**
 * TrekPlacesLayersService: the TREK Places ways and routes layers for the
 * domains that used to ask Overpass themselves. What it hands on, how it reads
 * a failure, and that it says why a layer is not used once rather than on
 * every request.
 */
import { logInfo, logWarn } from '../../../src/nest/audit/audit-log.logger';
import { TrekPlacesLayersService } from '../../../src/nest/maps/trek-places-layers.service';
import { trekPlacesRoutes, trekPlacesWays } from '../../../src/nest/maps/trek-places.client';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// TREK-LAYERS-001 to TREK-LAYERS-007

vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

// The client's requests are its own suite's subject; here only what they answer matters.
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesWays: vi.fn(),
  trekPlacesRoutes: vi.fn(),
}));

const ways = vi.mocked(trekPlacesWays);
const routes = vi.mocked(trekPlacesRoutes);
const info = vi.mocked(logInfo);
const warn = vi.mocked(logWarn);

const notBuilt = () => Object.assign(new Error('TREK Places API 404'), { status: 404 });
const down = () => Object.assign(new Error('TREK Places API 503'), { status: 503 });
// The client's own refusal when the operator switched the index off.
const off = () => new Error('TREK Places API is switched off on this instance');

const BOX = { south: 47.1, west: 11.2, north: 47.2, east: 11.3 };
const CAPS = { relations: 60, ways: 4000 };

let service: TrekPlacesLayersService;

beforeEach(async () => {
  ways.mockReset();
  routes.mockReset();
  info.mockClear();
  warn.mockClear();
  const moduleRef = await Test.createTestingModule({ providers: [TrekPlacesLayersService] }).compile();
  service = moduleRef.get(TrekPlacesLayersService);
});

describe('TrekPlacesLayersService', () => {
  it('TREK-LAYERS-001: hands on what a layer answered, asked as the caller asked', async () => {
    ways.mockResolvedValue({ complete: true, ways: [{ type: 'way', id: 1, tags: { highway: 'path' } }] });
    routes.mockResolvedValue({ elements: [], truncated: true });
    expect(await service.wayTags([1, 2])).toEqual({
      ok: true,
      value: { complete: true, ways: [{ type: 'way', id: 1, tags: { highway: 'path' } }] },
    });
    expect(await service.routes(BOX, 'horse', CAPS)).toEqual({ ok: true, value: { elements: [], truncated: true } });
    expect(ways).toHaveBeenCalledWith([1, 2]);
    expect(routes).toHaveBeenCalledWith(BOX, 'horse', CAPS);
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('TREK-LAYERS-002: a layer not built yet is said once, however often it is asked', async () => {
    ways.mockRejectedValue(notBuilt());
    expect(await service.wayTags([1])).toEqual({ ok: false, miss: 'not_built' });
    expect(await service.wayTags([2])).toEqual({ ok: false, miss: 'not_built' });
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[0]).toContain('/v1/ways');
    expect(info.mock.calls[0]?.[0]).toContain('not built');
    expect(warn).not.toHaveBeenCalled();
  });

  it('TREK-LAYERS-003: a failure is a warning with its reason, once until the reason changes', async () => {
    routes.mockRejectedValue(down());
    expect(await service.routes(BOX, 'horse', CAPS)).toEqual({ ok: false, miss: 'failed' });
    await service.routes(BOX, 'horse', CAPS);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('/v1/routes');
    expect(warn.mock.calls[0]?.[0]).toContain('TREK Places API 503');
    routes.mockRejectedValue(notBuilt());
    await service.routes(BOX, 'horse', CAPS);
    expect(info).toHaveBeenCalledTimes(1);
    routes.mockRejectedValue('not an error');
    expect(await service.routes(BOX, 'horse', CAPS)).toEqual({ ok: false, miss: 'failed' });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1]?.[0]).toContain('not an error');
  });

  it('TREK-LAYERS-004: the off switch is said once as a note, not a warning', async () => {
    ways.mockRejectedValue(off());
    expect(await service.wayTags([1])).toEqual({ ok: false, miss: 'off' });
    await service.wayTags([1]);
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[0]).toContain('switched off');
    expect(warn).not.toHaveBeenCalled();
  });

  it('TREK-LAYERS-005: after a layer answered, the same failure is said again', async () => {
    ways
      .mockRejectedValueOnce(down())
      .mockResolvedValueOnce({ complete: true, ways: [] })
      .mockRejectedValueOnce(down());
    await service.wayTags([1]);
    expect(await service.wayTags([1])).toEqual({ ok: true, value: { complete: true, ways: [] } });
    await service.wayTags([1]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('TREK-LAYERS-006: each layer is said for itself', async () => {
    ways.mockRejectedValue(notBuilt());
    routes.mockRejectedValue(notBuilt());
    await service.wayTags([1]);
    await service.routes(BOX, 'horse', CAPS);
    await service.wayTags([1]);
    await service.routes(BOX, 'horse', CAPS);
    expect(info.mock.calls.map(([line]) => line.includes('/v1/ways'))).toEqual([true, false]);
  });

  it('TREK-LAYERS-007: an answer that stopped part way is handed on, and why it stopped is said once', async () => {
    const partial = {
      complete: false as const,
      ways: [{ type: 'way' as const, id: 1, tags: {} }],
      unanswered: [501, 502],
      failure: down(),
    };
    ways.mockResolvedValue(partial);
    expect(await service.wayTags([1, 501, 502])).toEqual({ ok: true, value: partial });
    await service.wayTags([1, 501, 502]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('/v1/ways');
    expect(warn.mock.calls[0]?.[0]).toContain('TREK Places API 503');
    // A whole answer in between clears it, so the next stop is said again.
    ways.mockResolvedValueOnce({ complete: true, ways: [] });
    await service.wayTags([1]);
    await service.wayTags([1, 501, 502]);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(info).not.toHaveBeenCalled();
  });
});
