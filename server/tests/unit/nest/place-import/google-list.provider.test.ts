/**
 * The Google list source on its own: the feature-id parsing (moved from
 * places.helpers.test.ts with its code) and the answers the import route
 * gets back from it.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const { mockCheckSsrf, mockFollow } = vi.hoisted(() => ({
  mockCheckSsrf: vi.fn(async (_url: string) => ({ allowed: true })),
  mockFollow: vi.fn(),
}));
vi.mock('../../../../src/utils/ssrfGuard', () => ({
  checkSsrf: mockCheckSsrf,
  safeFetchFollow: mockFollow,
  SsrfBlockedError: class SsrfBlockedError extends Error {},
}));

import {
  GoogleListProvider,
  googleMapsFeatureIdFromItem,
  googleMapsHexId,
} from '../../../../src/nest/place-import/providers/google-list.provider';
import { SsrfBlockedError } from '../../../../src/utils/ssrfGuard';

afterEach(() => {
  vi.unstubAllGlobals();
  mockCheckSsrf.mockReset();
  mockCheckSsrf.mockResolvedValue({ allowed: true });
  mockFollow.mockReset();
});

// ── Google Maps feature ids ───────────────────────────────────────────────────

describe('googleMapsHexId / googleMapsFeatureIdFromItem', () => {
  it('passes an already-hex id through lower-cased', () => {
    expect(googleMapsHexId('0x882BF179E806D471')).toBe('0x882bf179e806d471');
  });

  it("converts Google's signed 64-bit decimals to unsigned hex", () => {
    expect(googleMapsHexId('-8634542354666695567')).toBe('0x882bf179e806d471');
    expect(googleMapsHexId(255)).toBe('0xff');
  });

  it('rejects anything that is not a hex or decimal id', () => {
    expect(googleMapsHexId('not-an-id')).toBeNull();
    expect(googleMapsHexId(null)).toBeNull();
    expect(googleMapsHexId({})).toBeNull();
  });

  it('reads the ftid pair from either item slot, else null', () => {
    expect(googleMapsFeatureIdFromItem([null, [0, 0, 0, 0, 0, 0, ['0x1', '0x2']]])).toBe('0x1:0x2');
    expect(googleMapsFeatureIdFromItem([null, null, null, null, null, null, null, [null, ['0x3', '0x4']]])).toBe('0x3:0x4');
    expect(googleMapsFeatureIdFromItem([null, [0, 0, 0, 0, 0, 0, ['0x1']]])).toBeNull();
    expect(googleMapsFeatureIdFromItem('not an array')).toBeNull();
  });
});

describe('GoogleListProvider.read', () => {
  it('refuses a URL the SSRF guard blocks, before fetching anything', async () => {
    mockCheckSsrf.mockResolvedValueOnce({ allowed: false });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await new GoogleListProvider().read('https://10.0.0.1/maps')).toEqual({ error: 'URL is not allowed', status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hands a short link that lands on a route back as a directions link', async () => {
    mockFollow.mockResolvedValueOnce({ url: 'https://www.google.com/maps/dir/Berlin/Dresden/' });
    expect(await new GoogleListProvider().read('https://maps.app.goo.gl/abc')).toEqual({
      directions: 'https://www.google.com/maps/dir/Berlin/Dresden/',
    });
  });

  it('points a single-place link at the search box', async () => {
    const out = await new GoogleListProvider().read('https://www.google.com/maps/place/Berlin');
    expect(out).toMatchObject({ status: 400 });
    expect((out as { error: string }).error).toContain('single place, not a list');
  });

  it('reads the list name and the places that carry coordinates', async () => {
    const items = [
      [null, [null, null, null, null, null, [null, null, 52.5, 13.4], ['0x1', '0x2']], 'Cafe', 'note'],
      [null, [null, null, null, null, null, [null, null, null, null]], 'No coords'],
    ];
    const body = `)]}'\n${JSON.stringify([[null, null, null, null, 'Trip ideas', null, null, null, items]])}`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })));
    expect(await new GoogleListProvider().read('https://www.google.com/maps/placelists/list/ABCDEFGHIJKLMNOP')).toEqual({
      listName: 'Trip ideas',
      places: [{ name: 'Cafe', lat: 52.5, lng: 13.4, notes: 'note', googleFtid: '0x1:0x2' }],
    });
  });
});

describe('GoogleListProvider.read: what Google sends back', () => {
  const LIST = 'https://www.google.com/maps/@52,13,10z/data=!4m3!11m2!2sABCDEFGHIJKLMNOPQRS!3e3';
  const respond = (body: string, init: ResponseInit = { status: 200 }) => vi.stubGlobal('fetch', vi.fn(async () => new Response(body, init)));
  const read = () => new GoogleListProvider().read(LIST);

  it('finds the list id in the data parameter too', async () => {
    const fetchMock = vi.fn(async () => new Response('x', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    await read();
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('!1sABCDEFGHIJKLMNOPQRS');
  });

  it('answers a failed or oversized fetch with the provider message', async () => {
    respond('x', { status: 500 });
    expect(await read()).toEqual({ error: 'Failed to fetch list from Google Maps', status: 502 });
    respond('x', { status: 200, headers: { 'content-length': String(9 * 1024 * 1024) } });
    expect(await read()).toEqual({ error: 'Failed to fetch list from Google Maps', status: 502 });
  });

  it('answers an unreadable payload with the invalid-data message', async () => {
    respond('prefix\nnot json');
    expect(await read()).toEqual({ error: 'Invalid list data received from Google Maps', status: 400 });
    respond('prefix\n{"a":1}');
    expect(await read()).toEqual({ error: 'Invalid list data received from Google Maps', status: 400 });
    respond('prefix\n[]');
    expect(await read()).toEqual({ error: 'Invalid list data received from Google Maps', status: 400 });
  });

  it('refuses an empty list and one without a single coordinate', async () => {
    respond('prefix\n[[null,null,null,null,"L",null,null,null,[]]]');
    expect(await read()).toEqual({ error: 'List is empty or could not be read', status: 400 });
    respond('prefix\n[[null,null,null,null,null,null,null,null,[[null,[],"Nowhere"]]]]');
    expect(await read()).toEqual({ error: 'No places with coordinates found in list', status: 400 });
  });

  it('refuses a short link the guard blocks on a hop, and lets a network failure through', async () => {
    mockFollow.mockRejectedValueOnce(new SsrfBlockedError('blocked'));
    expect(await new GoogleListProvider().read('https://maps.app.goo.gl/x')).toEqual({ error: 'URL is not allowed', status: 400 });
    mockFollow.mockRejectedValueOnce(new Error('network'));
    await expect(new GoogleListProvider().read('https://maps.app.goo.gl/x')).rejects.toThrow('network');
  });

  it('needs a list id', async () => {
    expect(await new GoogleListProvider().read('https://www.google.com/maps/@52,13,10z')).toEqual({
      error: 'Could not extract list ID from URL. Please use a shared Google Maps list link.',
      status: 400,
    });
  });
});
