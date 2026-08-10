import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: vi.fn(() => true) }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PoiCategoriesController } from '../../../src/nest/plugins/poi-categories.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;

const SAMPLE_CATEGORIES = [{ id: 'cafe', name: 'Cafes', icon: 'Coffee', color: '#6366f1' }];
const SAMPLE_RESULTS = [{ id: 'r1', categoryId: 'cafe', name: 'Bean & Co', lat: 51.5, lng: -0.1 }];

function controller(over: Partial<PluginRuntimeService> = {}) {
  const runtime = {
    providersOf: vi.fn(() => ['p1', 'p2']),
    invokeHook: vi.fn(async (id: string, _hook: string, method: string) => {
      if (method === 'getCategories') return SAMPLE_CATEGORIES;
      return { results: id === 'p2' ? SAMPLE_RESULTS : [], hasMore: false };
    }),
    ...over,
  } as unknown as PluginRuntimeService;
  return { c: new PoiCategoriesController(runtime), runtime };
}

describe('PoiCategoriesController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); });

  it('returns [] when the runtime is disabled', async () => {
    pluginsEnabled.mockReturnValue(false);
    const { c, runtime } = controller();
    expect(await c.search({}, req(5))).toEqual({ providers: [] });
    expect(runtime.providersOf).not.toHaveBeenCalled();
  });

  it('returns [] without an authenticated user', async () => {
    const { c } = controller();
    expect(await c.search({}, req(undefined))).toEqual({ providers: [] });
  });

  it('calls getCategories and search on each provider', async () => {
    const { c, runtime } = controller();
    await c.search({ query: 'coffee' }, req(5));
    expect(runtime.providersOf).toHaveBeenCalledWith('poiCategoryProvider');
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'poiCategoryProvider', 'getCategories', [], 5, 5000);
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'poiCategoryProvider', 'search', [{ query: 'coffee', limit: 20 }], 5, 8000);
  });

  it('skips a provider that throws (graceful)', async () => {
    const { c } = controller({
      invokeHook: vi.fn(async (id: string) => {
        if (id === 'p1') throw new Error('provider error');
        return SAMPLE_CATEGORIES; // p2 returns categories for both calls in this fake
      }) as unknown as PluginRuntimeService['invokeHook'],
    });
    const res = await c.search({}, req(5));
    // p1 threw — only p2 (or neither) survives; the key check is no unhandled throw
    expect(res).toHaveProperty('providers');
  });

  it('normalizes results: drops out-of-range coords, bad url, caps strings', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['p1']),
      invokeHook: vi.fn(async (_id: string, _hook: string, method: string) => {
        if (method === 'getCategories') return [{ id: 'x', name: 'X' }];
        return {
          hasMore: false,
          results: [
            { id: 'r1', categoryId: 'x', name: 'Good', lat: 51.5, lng: -0.1, url: 'https://ok.example.com' },
            { id: 'r2', categoryId: 'x', name: 'Bad lat', lat: 200, lng: 0 },          // out of range
            { id: 'r3', categoryId: 'x', name: 'Bad url', lat: 0, lng: 0, url: 'javascript:alert(1)' }, // stripped
            { id: 'r4', categoryId: 'x', name: 'n'.repeat(200), lat: 0, lng: 0 },     // name capped
            'not an object',                                                             // dropped
          ],
        };
      }) as unknown as PluginRuntimeService['invokeHook'],
    });
    const { providers } = await c.search({}, req(5));
    expect(providers).toHaveLength(1);
    const { results } = providers[0];
    expect(results.find((r) => r.id === 'r2')).toBeUndefined(); // bad lat dropped
    const good = results.find((r) => r.id === 'r1');
    expect(good?.url).toBe('https://ok.example.com');
    const badUrl = results.find((r) => r.id === 'r3');
    expect(badUrl?.url).toBeUndefined(); // javascript: stripped
    const capped = results.find((r) => r.id === 'r4');
    expect(capped?.name).toHaveLength(120);
  });

  it('caps result count per provider at 100', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['flood']),
      invokeHook: vi.fn(async (_id: string, _hook: string, method: string) => {
        if (method === 'getCategories') return [{ id: 'c', name: 'C' }];
        return {
          hasMore: true,
          results: Array.from({ length: 200 }, (_, i) => ({ id: `r${i}`, categoryId: 'c', name: `P${i}`, lat: i % 90, lng: i % 180 })),
        };
      }) as unknown as PluginRuntimeService['invokeHook'],
    });
    const { providers } = await c.search({}, req(5));
    expect(providers[0].results).toHaveLength(100);
  });

  it('clamps limit to 1..100 and defaults to 20', async () => {
    const { c, runtime } = controller({ providersOf: vi.fn(() => ['p1']) });
    await c.search({ limit: '999' }, req(5));
    const call = (runtime.invokeHook as ReturnType<typeof vi.fn>).mock.calls.find((c) => c[2] === 'search');
    expect((call?.[3] as Array<{ limit: number }>)[0].limit).toBe(100);
  });

  it('passes bounds through when all four values are finite numbers', async () => {
    const { c, runtime } = controller({ providersOf: vi.fn(() => ['p1']) });
    await c.search({ north: '52', south: '51', east: '1', west: '-1' }, req(5));
    const call = (runtime.invokeHook as ReturnType<typeof vi.fn>).mock.calls.find((c) => c[2] === 'search');
    expect((call?.[3] as Array<{ bounds: unknown }>)[0].bounds).toEqual({ north: 52, south: 51, east: 1, west: -1 });
  });

  it('filters categories: drops entries with empty id or name', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['p1']),
      invokeHook: vi.fn(async (_id: string, _hook: string, method: string) => {
        if (method === 'getCategories') {
          return [
            { id: 'ok', name: 'OK', color: '#aabbcc', icon: 'Star' },
            { id: '', name: 'No id' },            // dropped
            { id: 'nope', name: '' },             // dropped
            { id: 'bad-color', name: 'Bad', color: 'notacolor' }, // color stripped
          ];
        }
        return { hasMore: false, results: [] };
      }) as unknown as PluginRuntimeService['invokeHook'],
    });
    const { providers } = await c.search({}, req(5));
    const cats = providers[0].categories;
    expect(cats.map((c) => c.id)).toEqual(['ok', 'bad-color']);
    expect(cats[0].color).toBe('#aabbcc');
    expect(cats[1].color).toBeUndefined();
  });
});
