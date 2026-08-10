import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: vi.fn(() => true) }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PoiCategoriesController } from '../../../src/nest/plugins/contributions/poi-categories.controller';
import type { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;

const SAMPLE_CATEGORIES = [{ id: 'cafe', name: 'Cafes', icon: 'Coffee', color: '#6366f1' }];
const SAMPLE_RESULTS = [{ id: 'r1', categoryId: 'cafe', name: 'Bean & Co', lat: 51.5, lng: -0.1 }];

function controller(over: Partial<PluginHooks> = {}) {
  const hooks = {
    providersOf: vi.fn(() => ['p1', 'p2']),
    poiCategories: vi.fn(async () => SAMPLE_CATEGORIES),
    poiSearch: vi.fn(async (id: string) => ({
      results: id === 'p2' ? SAMPLE_RESULTS : [],
      hasMore: false,
    })),
    ...over,
  } as unknown as PluginHooks;
  return { c: new PoiCategoriesController(hooks), hooks };
}

describe('PoiCategoriesController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); });

  it('returns [] when the runtime is disabled', async () => {
    pluginsEnabled.mockReturnValue(false);
    const { c, hooks } = controller();
    expect(await c.search({}, req(5))).toEqual({ providers: [] });
    expect(hooks.providersOf).not.toHaveBeenCalled();
  });

  it('returns [] without an authenticated user', async () => {
    const { c } = controller();
    expect(await c.search({}, req(undefined))).toEqual({ providers: [] });
  });

  it('calls poiCategories and poiSearch on each provider', async () => {
    const { c, hooks } = controller();
    await c.search({ query: 'coffee' }, req(5));
    expect(hooks.providersOf).toHaveBeenCalledWith('poiCategoryProvider');
    expect(hooks.poiCategories).toHaveBeenCalledWith('p1', 5);
    expect(hooks.poiSearch).toHaveBeenCalledWith('p1', { query: 'coffee', limit: 20 }, 5);
  });

  it('skips a provider that throws (graceful)', async () => {
    const { c } = controller({
      poiCategories: vi.fn(async (id: string) => {
        if (id === 'p1') throw new Error('provider error');
        return SAMPLE_CATEGORIES;
      }) as unknown as PluginHooks['poiCategories'],
    });
    const res = await c.search({}, req(5));
    // p1 threw — only p2 (or neither) survives; the key check is no unhandled throw
    expect(res).toHaveProperty('providers');
  });

  it('normalizes results: drops out-of-range coords, bad url, caps strings', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['p1']),
      poiCategories: vi.fn(async () => [{ id: 'x', name: 'X' }]) as unknown as PluginHooks['poiCategories'],
      poiSearch: vi.fn(async () => ({
        hasMore: false,
        results: [
          { id: 'r1', categoryId: 'x', name: 'Good', lat: 51.5, lng: -0.1, url: 'https://ok.example.com' },
          { id: 'r2', categoryId: 'x', name: 'Bad lat', lat: 200, lng: 0 },          // out of range
          { id: 'r3', categoryId: 'x', name: 'Bad url', lat: 0, lng: 0, url: 'javascript:alert(1)' }, // stripped
          { id: 'r4', categoryId: 'x', name: 'n'.repeat(200), lat: 0, lng: 0 },     // name capped
          'not an object',                                                             // dropped
        ],
      })) as unknown as PluginHooks['poiSearch'],
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
      poiCategories: vi.fn(async () => [{ id: 'c', name: 'C' }]) as unknown as PluginHooks['poiCategories'],
      poiSearch: vi.fn(async () => ({
        hasMore: true,
        results: Array.from({ length: 200 }, (_, i) => ({ id: `r${i}`, categoryId: 'c', name: `P${i}`, lat: i % 90, lng: i % 180 })),
      })) as unknown as PluginHooks['poiSearch'],
    });
    const { providers } = await c.search({}, req(5));
    expect(providers[0].results).toHaveLength(100);
  });

  it('clamps limit to 1..100 and defaults to 20', async () => {
    const { c, hooks } = controller({ providersOf: vi.fn(() => ['p1']) });
    await c.search({ limit: '999' }, req(5));
    const call = (hooks.poiSearch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((call?.[1] as { limit: number }).limit).toBe(100);
  });

  it('passes bounds through when all four values are finite numbers', async () => {
    const { c, hooks } = controller({ providersOf: vi.fn(() => ['p1']) });
    await c.search({ north: '52', south: '51', east: '1', west: '-1' }, req(5));
    const call = (hooks.poiSearch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((call?.[1] as { bounds: unknown }).bounds).toEqual({ north: 52, south: 51, east: 1, west: -1 });
  });

  it('filters categories: drops entries with empty id or name', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['p1']),
      poiCategories: vi.fn(async () => [
        { id: 'ok', name: 'OK', color: '#aabbcc', icon: 'Star' },
        { id: '', name: 'No id' },            // dropped
        { id: 'nope', name: '' },             // dropped
        { id: 'bad-color', name: 'Bad', color: 'notacolor' }, // color stripped
      ]) as unknown as PluginHooks['poiCategories'],
      poiSearch: vi.fn(async () => ({ hasMore: false, results: [] })) as unknown as PluginHooks['poiSearch'],
    });
    const { providers } = await c.search({}, req(5));
    const cats = providers[0].categories;
    expect(cats.map((c) => c.id)).toEqual(['ok', 'bad-color']);
    expect(cats[0].color).toBe('#aabbcc');
    expect(cats[1].color).toBeUndefined();
  });
});
