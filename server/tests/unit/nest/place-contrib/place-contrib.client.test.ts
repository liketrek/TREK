/**
 * The client of the contribution routes, with fetch stubbed: every request
 * carries the installation key or does not go, every answer is read with a
 * cap and checked against the service's wire format, and a refusal comes back
 * with the service's reason code.
 */
import { PlaceContribClient } from '../../../../src/nest/place-contrib/place-contrib.client';
import { ServiceIdentityPort } from '../../../../src/nest/service-identity/service-identity.interface';
import type { PlaceContribPlaceBody } from '@trek/shared';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
const identity = {
  headersFor: vi.fn((): Record<string, string> => ({ 'User-Agent': 'TREK/test', Authorization: 'Bearer tk1.key' })),
  observe: vi.fn(),
};
const client = new PlaceContribClient(identity as unknown as ServiceIdentityPort);

const BODY: PlaceContribPlaceBody = {
  v: 1,
  termsVersion: 1,
  cid: 'abcdefgh-1234',
  key: 'osm:node/1',
  fields: { website: { value: 'https://a.de', baseHash: null } },
  place: { name: 'A', lat: 1, lng: 2, country: 'DE' },
};

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  identity.observe.mockClear();
  identity.headersFor.mockImplementation(() => ({ 'User-Agent': 'TREK/test', Authorization: 'Bearer tk1.key' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PlaceContribClient', () => {
  it('PCC-001: posts a place with the key, a deadline and JSON, and reads the answer', async () => {
    fetchMock.mockResolvedValue(
      json(200, {
        ok: true,
        cid: BODY.cid,
        duplicate: false,
        key: BODY.key,
        community: { version: 2 },
        results: { website: { result: 'published', flags: [] } },
      }),
    );
    const answer = await client.postPlace(BODY);
    expect(answer).toMatchObject({ kind: 'ok', body: { results: { website: { result: 'published' } } } });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Record<string, string> }];
    expect(String(url)).toBe('https://places.liketrek.com/v1/contrib/place');
    expect(init.method).toBe('POST');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers.Authorization).toBe('Bearer tk1.key');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual(BODY);
    expect(identity.observe).toHaveBeenCalledTimes(1);
  });

  it('PCC-002: without a key nothing leaves', async () => {
    identity.headersFor.mockImplementation(() => ({ 'User-Agent': 'TREK/test' }));
    expect(client.hasKey()).toBe(false);
    expect(client.keyFingerprint()).toBeNull();
    expect(await client.postPlace(BODY)).toEqual({ kind: 'refused', status: 401, error: 'no_key', retryAfterMs: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PCC-003: the key has a stable fingerprint that is not the key', () => {
    expect(client.hasKey()).toBe(true);
    const fingerprint = client.keyFingerprint();
    expect(fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(fingerprint).toBe(client.keyFingerprint());
    expect(fingerprint).not.toContain('tk1');
  });

  it('PCC-004: a refusal carries the service reason and its Retry-After', async () => {
    fetchMock.mockResolvedValue(json(429, { error: 'field_allowance' }, { 'retry-after': '30' }));
    expect(await client.postPlace(BODY)).toEqual({
      kind: 'refused',
      status: 429,
      error: 'field_allowance',
      retryAfterMs: 30_000,
    });
    fetchMock.mockResolvedValue(json(503, { error: 'not_accepting' }));
    expect(await client.postPlace(BODY)).toMatchObject({ kind: 'refused', status: 503, error: 'not_accepting' });
    fetchMock.mockResolvedValue(new Response('nope', { status: 403 }));
    expect(await client.postPlace(BODY)).toMatchObject({ kind: 'refused', status: 403, error: 'status_403' });
  });

  it('PCC-005: no answer, a server error, an oversized or an unexpected answer is a failure to try again', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
    expect(await client.postPlace(BODY)).toEqual({ kind: 'failed', reason: 'TimeoutError', retryAfterMs: null });
    fetchMock.mockResolvedValue(json(502, { error: 'bad_gateway' }));
    expect(await client.postPlace(BODY)).toMatchObject({ kind: 'failed', reason: 'status_502' });
    fetchMock.mockResolvedValue(json(200, { ok: true, cid: 'x' }));
    expect(await client.postPlace(BODY)).toMatchObject({ kind: 'failed', reason: 'answer_unreadable' });
    fetchMock.mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-length': String(1024 * 1024) } }),
    );
    expect(await client.postPlace(BODY)).toMatchObject({ kind: 'failed', reason: 'answer_too_large' });
  });

  it('PCC-006: posts a picture as raw JPEG with its key and id in headers', async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true, result: { result: 'review', image: null } }));
    const answer = await client.postImage('gers:abc', 'cid-12345678', Buffer.from([0xff, 0xd8, 0xff]));
    expect(answer).toMatchObject({ kind: 'ok', body: { result: { result: 'review' } } });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Record<string, string> }];
    expect(String(url)).toBe('https://places.liketrek.com/v1/contrib/image');
    expect(init.headers).toMatchObject({
      'Content-Type': 'image/jpeg',
      'X-TREK-Contrib-Key': 'gers:abc',
      'X-TREK-Contrib-Cid': 'cid-12345678',
    });
    expect(init.body).toBeInstanceOf(Uint8Array);
  });

  it('PCC-007: withdraws everything, or one field', async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true, withdrawn: { website: 2 } }));
    expect(await client.withdraw()).toEqual({ kind: 'ok', body: { ok: true, withdrawn: { website: 2 } } });
    await client.withdraw({ field: 'phone' });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([
      'https://places.liketrek.com/v1/contrib/install',
      'https://places.liketrek.com/v1/contrib/install?field=phone',
    ]);
    expect((fetchMock.mock.calls[0] as [URL, RequestInit])[1].method).toBe('DELETE');
  });

  it('PCC-008: reads what the index serves for a place, and null when it cannot say', async () => {
    fetchMock.mockResolvedValue(
      json(200, {
        place: {
          gers: 'abc',
          contact: { website: 'https://a.de', phone: '+49 1', email: null },
          hours: { osm: 'Mo-Fr 09:00-17:00', source: 'website' },
          description: { text: 'Text', source: 'website' },
        },
      }),
    );
    expect(await client.servedPlace('abc')).toEqual({
      website: 'https://a.de',
      phone: '+49 1',
      email: null,
      opening_hours: 'Mo-Fr 09:00-17:00',
      description: 'Text',
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://places.liketrek.com/v1/place/abc');
    fetchMock.mockResolvedValue(json(404, { error: 'not_found' }));
    expect(await client.servedPlace('missing')).toBeNull();
  });
});
