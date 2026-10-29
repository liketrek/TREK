/**
 * PHOTON-001..016: when Photon is asked, what it is asked, and every way it
 * hands the question back to Nominatim. The network is a stubbed global fetch,
 * the installation identity a fake in the slot the service-identity module fills.
 */
import { deriveServices } from '../../../src/app-config/boot-derive';
import { PhotonClient } from '../../../src/nest/maps/providers/photon.client';
import { serviceIdentitySlot } from '../../../src/nest/service-identity/service-identity.interface';
import { oneByOne } from '../../helpers/one-by-one';
import { FakeServiceIdentity, gateFeature, photonAnswer } from '../../helpers/photon';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let identity: FakeServiceIdentity;
let fetchMock: ReturnType<typeof vi.fn>;

const client = (env: Record<string, string> = {}) => new PhotonClient(deriveServices(env));

/** The URL and headers of the n-th request that went out. */
function request(n = 0): { url: URL; headers: Record<string, string> } {
  const [url, init] = fetchMock.mock.calls[n] as [URL, RequestInit & { headers: Record<string, string> }];
  return { url: new URL(String(url)), headers: init.headers };
}

beforeEach(() => {
  identity = new FakeServiceIdentity();
  serviceIdentitySlot.install(identity);
  fetchMock = vi.fn(async () => photonAnswer([gateFeature()]));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NOMINATIM_URL', '');
});

afterEach(() => {
  serviceIdentitySlot.release(identity);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('which installations ask Photon', () => {
  it('PHOTON-001: one with a key for the TREK services, at photon.liketrek.com with the key', async () => {
    const found = await client().search('Brandenburger Tor', { lang: 'de' });
    expect(found).toHaveLength(1);
    const { url, headers } = request();
    expect(`${url.origin}${url.pathname}`).toBe('https://photon.liketrek.com/api');
    expect(headers.Authorization).toBe('Bearer tk1.kid.payload.signature');
    expect(headers['User-Agent']).toBe('TREK/test');
    expect(identity.observed).toEqual([{ host: 'photon.liketrek.com', status: 200 }]);
  });

  it('PHOTON-002: none without a key, since Photon has no shared pool', async () => {
    identity.bearer = null;
    expect(await client().search('Brandenburger Tor')).toBeNull();
    expect(await client().reverse(52.5, 13.4)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PHOTON-003: none with the TREK services off', async () => {
    expect(await client({ TREK_SERVICES: 'off' }).search('Brandenburger Tor')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PHOTON-004: none beside a Nominatim the operator runs, which keeps answering', async () => {
    vi.stubEnv('NOMINATIM_URL', 'http://nominatim:8080');
    expect(await client().search('Brandenburger Tor')).toBeNull();
    expect(await client().reverse(52.5, 13.4)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PHOTON-005: one pointed at another copy by TREK_PHOTON_URL', async () => {
    await client({ TREK_PHOTON_URL: 'https://geo.example.org/photon/' }).search('Rostock');
    const { url } = request();
    expect(`${url.origin}${url.pathname}`).toBe('https://geo.example.org/photon/api');
  });
});

describe('what Photon is asked', () => {
  it('PHOTON-006: a search carries the query, the limit, the language and the bias', async () => {
    await client().search('Hase-dera', { lang: 'br', bias: { lat: 35.31, lng: 139.53 } });
    const { searchParams } = request().url;
    expect(Object.fromEntries(searchParams)).toEqual({
      q: 'Hase-dera',
      limit: '10',
      lang: 'pt',
      lat: '35.31',
      lon: '139.53',
      zoom: '10',
    });
  });

  it('PHOTON-007: a search without a bias carries none, and one without a language the names on the spot', async () => {
    await client().search('Rostock');
    const { searchParams } = request().url;
    expect(searchParams.has('lat')).toBe(false);
    expect(searchParams.get('lang')).toBe('default');
  });

  it('PHOTON-008: a reverse lookup asks /reverse for the nearest feature', async () => {
    await client().reverse(52.5163, 13.3777, 'gr');
    const { url } = request();
    expect(url.pathname).toBe('/reverse');
    expect(Object.fromEntries(url.searchParams)).toEqual({ lat: '52.5163', lon: '13.3777', limit: '1', lang: 'el' });
  });

  it('PHOTON-009: a point that is not one is not sent', async () => {
    expect(await client().reverse(Number.NaN, 13.4)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('when Nominatim has to answer instead', () => {
  it.each([401, 403, 429, 500, 503])('PHOTON-010: an answer of %i', async (status) => {
    fetchMock.mockResolvedValueOnce(photonAnswer([], status));
    expect(await client().search('Rostock')).toBeNull();
    expect(identity.observed).toEqual([{ host: 'photon.liketrek.com', status }]);
  });

  it('PHOTON-011: no answer at all, or none in time', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(await client().search('Rostock')).toBeNull();
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    expect(await client().search('Rostock')).toBeNull();
  });

  it("PHOTON-012: an answer that is not Photon's, or one far too long", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"results":[]}', { status: 200 }));
    expect(await client().search('Rostock')).toBeNull();
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    expect(await client().search('Rostock')).toBeNull();
    fetchMock.mockResolvedValueOnce(photonAnswer([gateFeature({ name: 'x'.repeat(600_000) })]));
    expect(await client().search('Rostock')).toBeNull();
  });

  it('PHOTON-013: an empty answer is an answer, not a miss', async () => {
    fetchMock.mockResolvedValueOnce(photonAnswer([]));
    expect(await client().search('Qwxzv')).toEqual([]);
  });
});

describe('the pause after misses in a row', () => {
  it('PHOTON-014: four misses stop the asking for a minute, then one try goes out, and an answer resets it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    const photon = client();
    fetchMock.mockImplementation(async () => photonAnswer([], 503));
    expect(await oneByOne([1, 2, 3, 4], () => photon.search('Rostock'))).toEqual([null, null, null, null]);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    expect(await photon.search('Rostock')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);

    vi.setSystemTime(new Date('2026-10-29T10:01:01Z'));
    expect(await photon.search('Rostock')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(await photon.search('Rostock')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(5);

    vi.setSystemTime(new Date('2026-10-29T10:02:02Z'));
    fetchMock.mockImplementation(async () => photonAnswer([gateFeature()]));
    expect(await photon.search('Rostock')).toHaveLength(1);
    fetchMock.mockImplementation(async () => photonAnswer([], 503));
    expect(await oneByOne([1, 2, 3], () => photon.search('Rostock'))).toEqual([null, null, null]);
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });
});

describe('a spent allowance and a short deadline', () => {
  it('PHOTON-015: a refusal with Retry-After pauses for that long, an hour at most', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    const photon = client();
    const spent = (retryAfter: string) =>
      new Response('{}', { status: 429, headers: { 'content-type': 'application/json', 'retry-after': retryAfter } });
    fetchMock.mockResolvedValueOnce(spent('30'));
    expect(await photon.search('Rostock')).toBeNull();
    expect(await photon.reverse(52.5, 13.4)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-10-29T10:00:31Z'));
    fetchMock.mockResolvedValueOnce(spent('50400'));
    expect(await photon.search('Rostock')).toBeNull();
    vi.setSystemTime(new Date('2026-10-29T10:59:00Z'));
    expect(await photon.search('Rostock')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date('2026-10-29T11:00:32Z'));
    expect(await photon.search('Rostock')).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("PHOTON-016: a reverse lookup leaves Nominatim at least half of the caller's deadline", async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    await client().reverse(52.5, 13.4, 'de', 3000);
    await client().reverse(52.5, 13.4, 'de', 8000);
    await client().reverse(52.5, 13.4, 'de');
    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([1500, 2500, 2500]);
    timeout.mockRestore();
  });
});
