// FE-REPO-PADDLEREGION-001 to FE-REPO-PADDLEREGION-008: the instance's paddle regions, managed with a connection only.
// FE-API-PADDLEREGIONS-001 to FE-API-PADDLEREGIONS-004: the admin calls behind them, held to the @trek/shared contract.
import {
  paddleRegionCatalogResponseSchema,
  paddleRegionListResponseSchema,
  paddleRegionRequestSchema,
  paddleRegionSchema,
  successResponseSchema,
  type PaddleRegion,
  type PaddleRegionCatalogEntry,
} from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { contractHandler } from '../../tests/helpers/msw/contract';
import { server } from '../../tests/helpers/msw/server';
import { paddleRegionsApi } from '../api/paddleRegions';
import { isEffectivelyOffline } from '../sync/networkMode';
import { paddleRegionErrorCode, paddleRegionRepo, PaddleRegionsOfflineError } from './paddleRegionRepo';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/paddleRegions', () => ({
  paddleRegionsApi: { list: vi.fn(), catalog: vi.fn(), add: vi.fn(), refresh: vi.fn(), remove: vi.fn() },
}));

const LIST = '/api/admin/paddle-regions';
const CATALOG = '/api/admin/paddle-regions/catalog';
const REFRESH = '/api/admin/paddle-regions/refresh';
const REMOVE = '/api/admin/paddle-regions/remove';

const REGION: PaddleRegion = {
  id: 'oberpfalz',
  name: 'Oberpfalz',
  status: 'ready',
  source_timestamp: '2026-09-30T20:21:02Z',
  imported_at: '2026-10-01T03:00:00.000Z',
  feature_count: 412,
  error: null,
  progress: null,
};
const QUEUED: PaddleRegion = {
  ...REGION,
  status: 'queued',
  source_timestamp: null,
  imported_at: null,
  feature_count: 0,
};
const READING: PaddleRegion = { ...REGION, status: 'importing', progress: { phase: 'download', fraction: 0.4 } };
const ENTRY: PaddleRegionCatalogEntry = { id: 'oberpfalz', name: 'Oberpfalz', path: ['Europe', 'Germany', 'Bayern'] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  vi.mocked(paddleRegionsApi.list).mockResolvedValue([REGION]);
  vi.mocked(paddleRegionsApi.catalog).mockResolvedValue([ENTRY]);
  vi.mocked(paddleRegionsApi.add).mockResolvedValue(QUEUED);
  vi.mocked(paddleRegionsApi.refresh).mockResolvedValue(READING);
  vi.mocked(paddleRegionsApi.remove).mockResolvedValue({ success: true });
});

describe('paddleRegionRepo online', () => {
  it('FE-REPO-PADDLEREGION-001: the list and the catalogue search go to the api and answer what it answers', async () => {
    const signal = new AbortController().signal;
    await expect(paddleRegionRepo.list()).resolves.toEqual([REGION]);
    await expect(paddleRegionRepo.catalog('ober', signal)).resolves.toEqual([ENTRY]);
    expect(paddleRegionsApi.list).toHaveBeenCalledTimes(1);
    expect(paddleRegionsApi.catalog).toHaveBeenCalledWith('ober', signal);
  });

  it('FE-REPO-PADDLEREGION-002: add, refresh and remove hand the region id on and answer the region as it stands', async () => {
    await expect(paddleRegionRepo.add('oberpfalz')).resolves.toEqual(QUEUED);
    await expect(paddleRegionRepo.refresh('oberpfalz')).resolves.toEqual(READING);
    await expect(paddleRegionRepo.remove('us/texas')).resolves.toEqual({ success: true });
    expect(paddleRegionsApi.add).toHaveBeenCalledWith('oberpfalz');
    expect(paddleRegionsApi.refresh).toHaveBeenCalledWith('oberpfalz');
    expect(paddleRegionsApi.remove).toHaveBeenCalledWith('us/texas');
  });

  it('FE-REPO-PADDLEREGION-003: a refusal from the server comes back unchanged, so its code is still read', async () => {
    const refusal = { response: { status: 502, data: { error: 'Refused', code: 'catalog_unavailable' } } };
    vi.mocked(paddleRegionsApi.catalog).mockRejectedValue(refusal);
    await expect(paddleRegionRepo.catalog('ober')).rejects.toBe(refusal);
    expect(paddleRegionErrorCode(refusal)).toBe('catalog_unavailable');
  });
});

describe('paddleRegionRepo offline', () => {
  it('FE-REPO-PADDLEREGION-004: every call refuses with PaddleRegionsOfflineError and asks nothing', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    const calls: Array<() => Promise<unknown>> = [
      () => paddleRegionRepo.list(),
      () => paddleRegionRepo.catalog('ober', new AbortController().signal),
      () => paddleRegionRepo.add('oberpfalz'),
      () => paddleRegionRepo.refresh('oberpfalz'),
      () => paddleRegionRepo.remove('oberpfalz'),
    ];
    for (const call of calls) await expect(call()).rejects.toBeInstanceOf(PaddleRegionsOfflineError);
    expect(paddleRegionsApi.list).not.toHaveBeenCalled();
    expect(paddleRegionsApi.catalog).not.toHaveBeenCalled();
    expect(paddleRegionsApi.add).not.toHaveBeenCalled();
    expect(paddleRegionsApi.refresh).not.toHaveBeenCalled();
    expect(paddleRegionsApi.remove).not.toHaveBeenCalled();
  });

  it('FE-REPO-PADDLEREGION-005: the refusal names itself and says that a connection is needed', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await expect(paddleRegionRepo.add('oberpfalz')).rejects.toThrow('managed with a connection only');
    const refusal = new PaddleRegionsOfflineError();
    expect(refusal).toBeInstanceOf(Error);
    expect(refusal.name).toBe('PaddleRegionsOfflineError');
  });

  it('FE-REPO-PADDLEREGION-006: the connection is read at each call, so the next call once it is back goes through', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValueOnce(true);
    await expect(paddleRegionRepo.list()).rejects.toBeInstanceOf(PaddleRegionsOfflineError);
    await expect(paddleRegionRepo.list()).resolves.toEqual([REGION]);
    expect(paddleRegionsApi.list).toHaveBeenCalledTimes(1);
  });
});

describe('paddleRegionErrorCode', () => {
  const refused = (code: unknown) => ({ response: { status: 400, data: { error: 'Refused', code } } });

  it('FE-REPO-PADDLEREGION-007: names the offline refusal and the two codes the server sends', () => {
    expect(paddleRegionErrorCode(new PaddleRegionsOfflineError())).toBe('offline');
    expect(paddleRegionErrorCode(refused('catalog_unavailable'))).toBe('catalog_unavailable');
    expect(paddleRegionErrorCode(refused('unknown_region'))).toBe('unknown_region');
  });

  it('FE-REPO-PADDLEREGION-008: anything else has no code, another code, a bare failure or no error at all included', () => {
    const others: unknown[] = [
      refused('AUTH_REQUIRED'),
      refused(42),
      refused(undefined),
      { response: { status: 500 } },
      { response: null },
      new Error('Network Error'),
      'catalog_unavailable',
      null,
      undefined,
    ];
    expect(others.map((err) => paddleRegionErrorCode(err))).toEqual(others.map(() => null));
  });
});

/** The real admin calls; the repo tests above run against a mock of this module. */
async function realApi() {
  const actual = await vi.importActual<typeof import('../api/paddleRegions')>('../api/paddleRegions');
  return actual.paddleRegionsApi;
}

const REGION_CONTRACT = { request: paddleRegionRequestSchema, response: paddleRegionSchema };
const REMOVE_CONTRACT = { request: paddleRegionRequestSchema, response: successResponseSchema };

describe('paddleRegionsApi', () => {
  it('FE-API-PADDLEREGIONS-001: the list unwraps its regions, the catalogue sends the search and unwraps its entries', async () => {
    const api = await realApi();
    const searches: Array<string | null> = [];
    server.use(
      contractHandler('get', LIST, { response: paddleRegionListResponseSchema }, () => ({
        regions: [REGION, READING],
      })),
      contractHandler('get', CATALOG, { response: paddleRegionCatalogResponseSchema }, ({ request }) => {
        searches.push(new URL(request.url).searchParams.get('q'));
        return { regions: [ENTRY] };
      })
    );

    await expect(api.list()).resolves.toEqual([REGION, READING]);
    await expect(api.catalog('ober')).resolves.toEqual([ENTRY]);
    expect(searches).toEqual(['ober']);
  });

  it('FE-API-PADDLEREGIONS-002: add, refresh and remove post the id to their own paths and answer the parsed reply', async () => {
    const api = await realApi();
    const posted: string[] = [];
    server.use(
      contractHandler('post', LIST, REGION_CONTRACT, ({ body }) => {
        posted.push(`add ${body.id}`);
        return { ...QUEUED, id: body.id };
      }),
      contractHandler('post', REFRESH, REGION_CONTRACT, ({ body }) => {
        posted.push(`refresh ${body.id}`);
        return READING;
      }),
      contractHandler('post', REMOVE, REMOVE_CONTRACT, ({ body }) => {
        posted.push(`remove ${body.id}`);
        return { success: true as const };
      })
    );

    await expect(api.add('us/texas')).resolves.toEqual({ ...QUEUED, id: 'us/texas' });
    await expect(api.refresh('oberpfalz')).resolves.toEqual(READING);
    await expect(api.remove('oberpfalz')).resolves.toEqual({ success: true });
    expect(posted).toEqual(['add us/texas', 'refresh oberpfalz', 'remove oberpfalz']);
  });

  it('FE-API-PADDLEREGIONS-003: an answer off the contract is refused instead of handed on', async () => {
    const api = await realApi();
    server.use(
      http.get(LIST, () => HttpResponse.json([REGION])),
      http.get(CATALOG, () => HttpResponse.json({ regions: [{ id: 'oberpfalz', name: 'Oberpfalz' }] })),
      http.post(LIST, () => HttpResponse.json({ ...REGION, status: 'done' })),
      http.post(REFRESH, () => HttpResponse.json({ ...REGION, progress: { phase: 'read', fraction: 2 } })),
      http.post(REMOVE, () => HttpResponse.json({ success: false }))
    );

    await expect(api.list()).rejects.toMatchObject({ name: 'ZodError' });
    await expect(api.catalog('ober')).rejects.toMatchObject({ name: 'ZodError' });
    await expect(api.add('oberpfalz')).rejects.toMatchObject({ name: 'ZodError' });
    await expect(api.refresh('oberpfalz')).rejects.toMatchObject({ name: 'ZodError' });
    await expect(api.remove('oberpfalz')).rejects.toMatchObject({ name: 'ZodError' });
  });

  it('FE-API-PADDLEREGIONS-004: the code the server puts next to a refusal reaches paddleRegionErrorCode', async () => {
    const api = await realApi();
    const refuse = (status: number, code: string) => () => HttpResponse.json({ error: 'Refused', code }, { status });
    server.use(http.get(CATALOG, refuse(502, 'catalog_unavailable')), http.post(LIST, refuse(400, 'unknown_region')));

    expect(paddleRegionErrorCode(await api.catalog('ober').catch((err: unknown) => err))).toBe('catalog_unavailable');
    expect(paddleRegionErrorCode(await api.add('atlantis').catch((err: unknown) => err))).toBe('unknown_region');
  });
});
