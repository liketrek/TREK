import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: vi.fn(() => true) }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PluginSearchController } from '../../../src/nest/plugins/contributions/plugin-search.controller';
import type { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;

const hit = (over: Record<string, unknown> = {}) => ({ id: 'a', name: 'Ristorante', lat: 45.4, lng: 9.2, ...over });

function controller(over: Partial<PluginHooks> = {}) {
  const hooks = {
    providersOf: vi.fn(() => ['p1']),
    searchPlaces: vi.fn(async () => [hit()]),
    ...over,
  } as unknown as PluginHooks;
  return { c: new PluginSearchController(hooks), hooks };
}

describe('PluginSearchController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); });

  it('returns [] when the runtime is disabled (no plugin calls)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const { c, hooks } = controller();
    expect(await c.search('milan', undefined, undefined, undefined, undefined, req(5))).toEqual({ places: [] });
    expect(hooks.providersOf).not.toHaveBeenCalled();
  });

  it('returns [] without an authenticated user, and for a blank query', async () => {
    const { c, hooks } = controller();
    expect(await c.search('milan', undefined, undefined, undefined, undefined, req(undefined))).toEqual({ places: [] });
    expect(await c.search('   ', undefined, undefined, undefined, undefined, req(5))).toEqual({ places: [] });
    expect(await c.search(undefined, undefined, undefined, undefined, undefined, req(5))).toEqual({ places: [] });
    expect(hooks.searchPlaces).not.toHaveBeenCalled();
  });

  it('asks no provider when none implements the hook', async () => {
    const { c, hooks } = controller({ providersOf: vi.fn(() => []) });
    expect(await c.search('milan', undefined, undefined, undefined, undefined, req(5))).toEqual({ places: [] });
    expect(hooks.searchPlaces).not.toHaveBeenCalled();
  });

  it('passes the query, the bias and a capped limit, and drops a bias that is not a coordinate', async () => {
    const { c, hooks } = controller();
    await c.search('  milan  ', '45.4', '9.2', 'it', '999', req(5));
    expect(hooks.searchPlaces).toHaveBeenCalledWith(
      'p1',
      { query: 'milan', limit: 20, lang: 'it', near: { lat: 45.4, lng: 9.2 } },
      5,
    );

    await c.search('milan', '91', '9.2', undefined, undefined, req(5)); // latitude out of range
    expect(hooks.searchPlaces).toHaveBeenLastCalledWith(
      'p1',
      { query: 'milan', limit: 10, lang: undefined, near: undefined },
      5,
    );
  });

  it('skips a provider that throws and keeps the other one (graceful)', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['slow', 'ok']),
      searchPlaces: vi.fn(async (id: string) => {
        if (id === 'slow') throw new Error('timed out');
        return [hit({ name: 'Trattoria' })];
      }) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Trattoria');
    expect(places[0].pluginId).toBe('ok');
  });

  it('interleaves two providers so neither one buries the other', async () => {
    const { c } = controller({
      providersOf: vi.fn(() => ['a', 'b']),
      searchPlaces: vi.fn(async (id: string) =>
        id === 'a'
          ? [hit({ id: 'a1', name: 'A1' }), hit({ id: 'a2', name: 'A2' }), hit({ id: 'a3', name: 'A3' })]
          : [hit({ id: 'b1', name: 'B1' })],
      ) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places.map(p => p.name)).toEqual(['A1', 'B1', 'A2', 'A3']);
  });

  it('normalizes a hit into the shape the core search returns, and namespaces the id', async () => {
    const { c } = controller({
      searchPlaces: vi.fn(async () => [
        hit({ address: 'Via Roma 1', rating: 4.5, website: 'https://ok.example', phone: '+39 02', category: 'restaurant', description: 'Good' }),
      ]) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places[0]).toEqual({
      osm_id: 'plugin:p1:a',
      name: 'Ristorante',
      address: 'Via Roma 1',
      lat: 45.4,
      lng: 9.2,
      rating: 4.5,
      website: 'https://ok.example',
      phone: '+39 02',
      category: 'restaurant',
      description: 'Good',
      source: 'plugin:p1',
      pluginId: 'p1',
    });
  });

  it('falls back to the coordinate when a hit carries no id of its own', async () => {
    const { c } = controller({
      searchPlaces: vi.fn(async () => [{ name: 'Nameless index', lat: 45.4, lng: 9.2 }]) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places[0].osm_id).toBe('plugin:p1:45.4,9.2');
  });

  it('drops a hit with no name or no place on the earth', async () => {
    const { c } = controller({
      searchPlaces: vi.fn(async () => [
        { name: '', lat: 45.4, lng: 9.2 },
        { name: 'No coords' },
        { name: 'Off the globe', lat: 91, lng: 9.2 },
        { name: 'Off the globe too', lat: 45.4, lng: 181 },
        'not an object',
        hit({ name: 'Keeper' }),
      ]) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places.map(p => p.name)).toEqual(['Keeper']);
  });

  it('strips a javascript: website, clamps the rating and caps every string', async () => {
    const { c } = controller({
      searchPlaces: vi.fn(async () => [
        hit({ id: 'x', name: 'n'.repeat(400), address: 'a'.repeat(600), website: 'javascript:alert(1)', rating: 9.7 }),
        hit({ id: 'y', name: 'Low', rating: -3, website: 'http://plain.example' }),
        hit({ id: 'z', name: 'Unrated', rating: 'not a number' }),
      ]) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places[0].name).toHaveLength(200);
    expect(places[0].address).toHaveLength(300);
    expect(places[0].website).toBeNull();
    expect(places[0].rating).toBe(5);
    expect(places[1].rating).toBe(0);
    expect(places[1].website).toBe('http://plain.example');
    expect(places[2].rating).toBeNull();
  });

  it('caps one provider at 20 hits', async () => {
    const { c } = controller({
      searchPlaces: vi.fn(async () =>
        Array.from({ length: 50 }, (_v, i) => hit({ id: `h${i}`, name: `H${i}` })),
      ) as unknown as PluginHooks['searchPlaces'],
    });
    const { places } = await c.search('milan', undefined, undefined, undefined, undefined, req(5));
    expect(places).toHaveLength(20);
  });
});
