/**
 * The Naver list and Google directions sources on their own: every refusal
 * they hand the import route (status and exact message), the short-link hop
 * through the SSRF guard, and what a good link reads as. The persistence half
 * is PlacesService's and covered in places.service.test.ts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const { mockCheckSsrf, mockFollow, SsrfBlocked } = vi.hoisted(() => {
  class SsrfBlocked extends Error {}
  return {
    mockCheckSsrf: vi.fn(async (_url: string) => ({ allowed: true })),
    mockFollow: vi.fn(),
    SsrfBlocked,
  };
});
vi.mock('../../../../src/utils/ssrfGuard', () => ({
  checkSsrf: mockCheckSsrf,
  safeFetchFollow: mockFollow,
  SsrfBlockedError: SsrfBlocked,
}));

import { NaverListProvider } from '../../../../src/nest/place-import/providers/naver-list.provider';
import { GoogleDirectionsProvider } from '../../../../src/nest/place-import/providers/google-directions.provider';
import { MAX_LIST_RESPONSE_BYTES } from '../../../../src/nest/place-import/providers/google-list.provider';

const FOLDER_URL = 'https://map.naver.com/p/favorite/myPlace/folder/abc123';

const page = (bookmarkList: Record<string, unknown>[], folder: Record<string, unknown> = { name: 'Seoul', bookmarkCount: bookmarkList.length }) =>
  new Response(JSON.stringify({ folder, bookmarkList }), { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
  mockCheckSsrf.mockReset();
  mockCheckSsrf.mockResolvedValue({ allowed: true });
  mockFollow.mockReset();
});

describe('NaverListProvider.read', () => {
  const naver = () => new NaverListProvider();

  it('refuses what the SSRF guard blocks and an unparseable URL', async () => {
    mockCheckSsrf.mockResolvedValueOnce({ allowed: false });
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'URL is not allowed', status: 400 });
    expect(await naver().read('not a url')).toEqual({ error: 'Invalid URL', status: 400 });
  });

  it('follows a naver.me short link through the guard, and refuses a hop it blocks', async () => {
    mockFollow.mockResolvedValueOnce({ url: FOLDER_URL });
    vi.stubGlobal('fetch', vi.fn(async () => page([{ name: 'Cafe', py: '37.5', px: '127.0' }])));
    expect(await naver().read('https://naver.me/xyz')).toEqual({
      listName: 'Seoul',
      places: [{ name: 'Cafe', lat: 37.5, lng: 127, notes: null, address: null }],
    });

    mockFollow.mockRejectedValueOnce(new SsrfBlocked('blocked'));
    expect(await naver().read('https://naver.me/xyz')).toEqual({ error: 'URL is not allowed', status: 400 });

    mockFollow.mockRejectedValueOnce(new Error('network'));
    await expect(naver().read('https://naver.me/xyz')).rejects.toThrow('network');
  });

  it('needs a folder id in the link', async () => {
    expect(await naver().read('https://map.naver.com/p/somewhere')).toEqual({
      error: 'Could not extract folder ID from URL. Please use a shared Naver Maps list link.',
      status: 400,
    });
  });

  it('answers a failed, oversized or unreadable page with the provider message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'Failed to fetch list from Naver Maps', status: 502 });

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-length': String(MAX_LIST_RESPONSE_BYTES + 1) } })));
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'Failed to fetch list from Naver Maps', status: 502 });

    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })));
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'Invalid list data received from Naver Maps', status: 400 });
  });

  it('pages through a folder bigger than one page and keeps what has coordinates', async () => {
    const first = Array.from({ length: 20 }, (_, i) => ({ name: `P${i}`, py: '37', px: '127', memo: i === 0 ? ' note ' : '', address: i === 0 ? ' Addr ' : '' }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page(first, { name: 'Big', bookmarkCount: 22 }))
      .mockResolvedValueOnce(page([{ displayName: ' Second ', py: '36', px: '128' }, { name: 'No coords' }]));
    vi.stubGlobal('fetch', fetchMock);
    const out = await naver().read(FOLDER_URL);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('start=20');
    expect(out).toMatchObject({ listName: 'Big' });
    const places = (out as { places: unknown[] }).places;
    expect(places).toHaveLength(21);
    expect(places[0]).toEqual({ name: 'P0', lat: 37, lng: 127, notes: 'note', address: 'Addr' });
    expect(places[20]).toEqual({ name: 'Second', lat: 36, lng: 128, notes: null, address: null });
  });

  it('stops paging on an empty page and fails on a failed one', async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => ({ name: `P${i}`, py: '37', px: '127' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(page(twenty, { bookmarkCount: 60 })).mockResolvedValueOnce(page([])));
    expect(((await naver().read(FOLDER_URL)) as { places: unknown[]; listName: string }).listName).toBe('Naver Maps List');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(page(twenty, { bookmarkCount: 60 })).mockResolvedValueOnce(new Response('', { status: 503 })));
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'Failed to fetch list from Naver Maps', status: 502 });
  });

  it('refuses an empty folder and one without a single coordinate', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ folder: { name: 'Empty' } }), { status: 200 })));
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'List is empty or could not be read', status: 400 });

    vi.stubGlobal('fetch', vi.fn(async () => page([{ name: 'Nowhere' }])));
    expect(await naver().read(FOLDER_URL)).toEqual({ error: 'No places with coordinates found in list', status: 400 });
  });
});

describe('GoogleDirectionsProvider.read', () => {
  const directions = () => new GoogleDirectionsProvider();
  const ROUTE = 'https://www.google.com/maps/dir/52.52,13.405/51.05,13.74/';

  it('reads the stops of a route link, in driving order', async () => {
    expect(await directions().read(ROUTE)).toEqual([
      { name: null, lat: 52.52, lng: 13.405 },
      { name: null, lat: 51.05, lng: 13.74 },
    ]);
  });

  it('refuses what the SSRF guard blocks and an unparseable URL', async () => {
    mockCheckSsrf.mockResolvedValueOnce({ allowed: false });
    expect(await directions().read(ROUTE)).toEqual({ error: 'URL is not allowed', status: 400 });
    expect(await directions().read('not a url')).toEqual({ error: 'Invalid URL', status: 400 });
  });

  it('follows a short link through the guard and judges the host it lands on', async () => {
    mockFollow.mockResolvedValueOnce({ url: ROUTE });
    expect(await directions().read('https://maps.app.goo.gl/abc')).toHaveLength(2);

    mockFollow.mockResolvedValueOnce({ url: 'https://evil.example.com/maps/dir/A/B/' });
    expect(await directions().read('https://maps.app.goo.gl/abc')).toEqual({ error: 'That link is not a Google Maps link.', status: 400 });

    mockFollow.mockRejectedValueOnce(new SsrfBlocked('blocked'));
    expect(await directions().read('https://maps.app.goo.gl/abc')).toEqual({ error: 'URL is not allowed', status: 400 });

    mockFollow.mockRejectedValueOnce(new Error('network'));
    await expect(directions().read('https://maps.app.goo.gl/abc')).rejects.toThrow('network');
  });

  it('refuses a link with fewer than two stops', async () => {
    expect(await directions().read('https://www.google.com/maps/dir/Berlin/')).toEqual({
      error: 'Could not read any stops from that directions link. Open the route in Google Maps and use its Share button.',
      status: 400,
    });
  });
});
