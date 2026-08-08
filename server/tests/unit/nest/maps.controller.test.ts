import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Response } from 'express';

const { createReadStream } = vi.hoisted(() => ({ createReadStream: vi.fn() }));
vi.mock('node:fs', () => ({ createReadStream }));

import { MapsController } from '../../../src/nest/maps/maps.controller';
import type { MapsService } from '../../../src/nest/maps/maps.service';
import type { User } from '../../../src/types';

const user = { id: 3 } as User;

function makeController(svc: Partial<MapsService>) {
  return new MapsController(svc as MapsService);
}

/** Run an async handler, expecting an HttpException; return its { status, body }. */
async function thrown(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

function withError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('MapsController (parity with the legacy /api/maps route)', () => {
  // Body validation (required query/input/url, locationBias shapes, input
  // length) moved to the @trek/shared maps schemas enforced by the global
  // ZodValidationPipe — the pipe's uniform envelope replaced the legacy
  // bespoke 400 strings, and the 400-status contract is pinned by the
  // integration/e2e suites. These unit cases cover the handler bodies only.
  describe('POST /search', () => {
    it('returns the service result', async () => {
      const search = vi.fn().mockResolvedValue({ places: [], source: 'osm' });
      const res = await makeController({ search }).search(user, { query: 'berlin' }, 'de');
      expect(res).toEqual({ places: [], source: 'osm' });
      expect(search).toHaveBeenCalledWith(3, 'berlin', 'de', undefined);
    });

    it('forwards a valid locationBias to the service', async () => {
      const search = vi.fn().mockResolvedValue({ places: [], source: 'osm' });
      const bias = { lat: 1, lng: 2, radius: 5000 };
      await makeController({ search }).search(user, { query: 'x', locationBias: bias }, 'de');
      expect(search).toHaveBeenCalledWith(3, 'x', 'de', bias);
    });

    it('maps a service error to its status + message', async () => {
      const search = vi.fn().mockRejectedValue(withError(429, 'Rate limited'));
      expect(await thrown(() => makeController({ search }).search(user, { query: 'x' }))).toEqual({
        status: 429, body: { error: 'Rate limited' },
      });
    });

    it('defaults a non-Error rejection to 500 + the fallback message', async () => {
      const search = vi.fn().mockRejectedValue('boom');
      expect(await thrown(() => makeController({ search }).search(user, { query: 'x' }))).toEqual({
        status: 500, body: { error: 'Search error' },
      });
    });
  });

  describe('GET /pois', () => {
    it('400 when category is missing', async () => {
      const pois = vi.fn();
      expect(await thrown(() => makeController({ pois }).pois(undefined, '1', '2', '3', '4'))).toEqual({
        status: 400, body: { error: 'A category is required' },
      });
      expect(pois).not.toHaveBeenCalled();
    });

    it('400 when the bbox has a non-finite value', async () => {
      const pois = vi.fn();
      expect(await thrown(() => makeController({ pois }).pois('cafe', 'x', '2', '3', '4'))).toEqual({
        status: 400, body: { error: 'A valid bbox (south, west, north, east) is required' },
      });
      expect(pois).not.toHaveBeenCalled();
    });

    it('delegates a valid request with a parsed numeric bbox and forwards lang', async () => {
      const pois = vi.fn().mockResolvedValue({ places: [] });
      const res = await makeController({ pois }).pois('cafe', '1', '2', '3', '4', 'fr');
      expect(res).toEqual({ places: [] });
      expect(pois).toHaveBeenCalledWith('cafe', { south: 1, west: 2, north: 3, east: 4 }, 'fr');
    });

    it('maps a service error, defaulting to 500', async () => {
      const pois = vi.fn().mockRejectedValue(new Error('Overpass down'));
      expect(await thrown(() => makeController({ pois }).pois('cafe', '1', '2', '3', '4'))).toEqual({
        status: 500, body: { error: 'Overpass down' },
      });
    });
  });

  describe('POST /autocomplete', () => {
    it('returns the disabled envelope when the kill-switch is off', async () => {
      const autocomplete = vi.fn();
      const res = await makeController({ autocompleteDisabled: () => true, autocomplete }).autocomplete(user, { input: 'be' });
      expect(res).toEqual({ suggestions: [], source: 'disabled' });
      expect(autocomplete).not.toHaveBeenCalled();
    });

    it('delegates a valid request', async () => {
      const autocomplete = vi.fn().mockResolvedValue({ suggestions: [], source: 'osm' });
      const bias = { low: { lat: 1, lng: 2 }, high: { lat: 3, lng: 4 } };
      await makeController({ autocompleteDisabled: () => false, autocomplete }).autocomplete(user, { input: 'be', lang: 'en', locationBias: bias });
      expect(autocomplete).toHaveBeenCalledWith(3, 'be', 'en', bias);
    });

    it('maps a service error', async () => {
      const autocomplete = vi.fn().mockRejectedValue(withError(503, 'Upstream down'));
      const c = makeController({ autocompleteDisabled: () => false, autocomplete });
      expect(await thrown(() => c.autocomplete(user, { input: 'be' }))).toEqual({
        status: 503, body: { error: 'Upstream down' },
      });
    });
  });

  describe('GET /details/:placeId', () => {
    it('returns the disabled envelope when off', async () => {
      const res = await makeController({ detailsDisabled: () => true }).details(user, 'p1');
      expect(res).toEqual({ place: null, disabled: true });
    });

    it('uses the expanded lookup when expand is set', async () => {
      const detailsExpanded = vi.fn().mockResolvedValue({ place: { id: 'p1' } });
      const details = vi.fn();
      await makeController({ detailsDisabled: () => false, detailsExpanded, details })
        .details(user, 'p1', 'full', 'de', '1');
      expect(detailsExpanded).toHaveBeenCalledWith(3, 'p1', 'de', true);
      expect(details).not.toHaveBeenCalled();
    });

    it('uses the plain lookup without expand', async () => {
      const details = vi.fn().mockResolvedValue({ place: { id: 'p1' } });
      await makeController({ detailsDisabled: () => false, details }).details(user, 'p1', undefined, 'de');
      expect(details).toHaveBeenCalledWith(3, 'p1', 'de');
    });

    it('maps a service error', async () => {
      const details = vi.fn().mockRejectedValue(withError(404, 'Not found'));
      expect(await thrown(() => makeController({ detailsDisabled: () => false, details }).details(user, 'p1'))).toEqual({
        status: 404, body: { error: 'Not found' },
      });
    });
  });

  describe('GET /place-photo/:placeId', () => {
    it('returns { photoUrl: null } when photos are disabled (non-coords)', async () => {
      const photo = vi.fn();
      const res = await makeController({ photosDisabled: () => true, photo }).placePhoto(user, 'p1', '1', '2');
      expect(res).toEqual({ photoUrl: null });
      expect(photo).not.toHaveBeenCalled();
    });

    it('bypasses the kill-switch for coords: ids', async () => {
      const photo = vi.fn().mockResolvedValue({ photoUrl: 'u', attribution: null });
      await makeController({ photosDisabled: () => true, photo }).placePhoto(user, 'coords:1,2', '1', '2', 'Spot');
      expect(photo).toHaveBeenCalledWith(3, 'coords:1,2', 1, 2, 'Spot');
    });

    it('maps a 4xx service error', async () => {
      const photo = vi.fn().mockRejectedValue(withError(429, 'Rate limited'));
      expect(await thrown(() => makeController({ photosDisabled: () => false, photo }).placePhoto(user, 'p1', '1', '2'))).toEqual({
        status: 429, body: { error: 'Rate limited' },
      });
    });

    // A place without a photo is an empty result, not a 404 — one 404 per photo-less
    // place gets the user banned by any 404-rate IPS in front of TREK (#1727).
    it('passes a photo-less place through as a 200 with photoUrl null', async () => {
      const photo = vi.fn().mockResolvedValue({ photoUrl: null, attribution: null });
      const res = await makeController({ photosDisabled: () => false, photo }).placePhoto(user, 'node:123', '1', '2');
      expect(res).toEqual({ photoUrl: null, attribution: null });
    });

    it('logs and maps a 5xx service error', async () => {
      const photo = vi.fn().mockRejectedValue(withError(502, 'Upstream failed'));
      expect(await thrown(() => makeController({ photosDisabled: () => false, photo }).placePhoto(user, 'p1', '1', '2'))).toEqual({
        status: 502, body: { error: 'Upstream failed' },
      });
      expect(console.error).toHaveBeenCalledWith('Place photo error:', expect.any(Error));
    });

    it('defaults a status-less error to 500 and parses NaN coords', async () => {
      const photo = vi.fn().mockRejectedValue(new Error('Error fetching photo'));
      expect(await thrown(() => makeController({ photosDisabled: () => false, photo }).placePhoto(user, 'p1'))).toEqual({
        status: 500, body: { error: 'Error fetching photo' },
      });
      const [, , lat, lng] = photo.mock.calls[0];
      expect(Number.isNaN(lat)).toBe(true);
      expect(Number.isNaN(lng)).toBe(true);
    });
  });

  describe('GET /place-photo/:placeId/bytes', () => {
    function makeRes() {
      const res = {
        statusCode: 200,
        headersSent: false,
        status: vi.fn(function (this: unknown, c: number) { (res as { statusCode: number }).statusCode = c; return res; }),
        json: vi.fn(),
        set: vi.fn(),
        type: vi.fn(),
        end: vi.fn(),
      };
      return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; type: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
    }

    beforeEach(() => createReadStream.mockReset());

    // Places persist this URL in image_url, so an evicted cache entry means one
    // request per place on a trip render. 404 for each of them is the ban vector
    // from #1727 — an uncached photo answers 204 with an empty body instead.
    it('204 without a body when the photo is not cached', () => {
      const res = makeRes();
      makeController({ photoBytesPath: () => null }).placePhotoBytes('p1', res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(createReadStream).not.toHaveBeenCalled();
    });

    it('streams the cached file with image/jpeg + an immutable cache header on a hit', () => {
      const stream = { on: vi.fn().mockReturnThis(), pipe: vi.fn() };
      createReadStream.mockReturnValue(stream);
      const res = makeRes();
      makeController({ photoBytesPath: () => '/cache/p1.jpg' }).placePhotoBytes('p1', res);
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=2592000, immutable');
      expect(res.type).toHaveBeenCalledWith('image/jpeg');
      expect(createReadStream).toHaveBeenCalledWith('/cache/p1.jpg');
      expect(stream.pipe).toHaveBeenCalledWith(res);
    });

    it('falls back to an empty 204 when the read stream errors', () => {
      let onError: () => void = () => {};
      const stream = { on: vi.fn((ev: string, cb: () => void) => { if (ev === 'error') onError = cb; return stream; }), pipe: vi.fn() };
      createReadStream.mockReturnValue(stream);
      const res = makeRes();
      makeController({ photoBytesPath: () => '/cache/p1.jpg' }).placePhotoBytes('p1', res);
      onError();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      // The hit path already asked for a month of immutable caching — that header
      // must not survive onto the empty answer, or the photo stays hidden once it
      // is back in the cache.
      expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'no-store');
    });

    it('does not re-send a 204 when the stream errors after headers were flushed', () => {
      let onError: () => void = () => {};
      const stream = { on: vi.fn((ev: string, cb: () => void) => { if (ev === 'error') onError = cb; return stream; }), pipe: vi.fn() };
      createReadStream.mockReturnValue(stream);
      const res = makeRes();
      (res as { headersSent: boolean }).headersSent = true;
      makeController({ photoBytesPath: () => '/cache/p1.jpg' }).placePhotoBytes('p1', res);
      onError();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
    });
  });

  describe('GET /reverse', () => {
    it('400 when lat/lng missing', async () => {
      expect(await thrown(() => makeController({}).reverse(undefined, '2'))).toEqual({
        status: 400, body: { error: 'lat and lng required' },
      });
    });

    it('returns the reverse result', async () => {
      const reverse = vi.fn().mockResolvedValue({ name: 'Spot', address: 'Street 1' });
      expect(await makeController({ reverse }).reverse('1', '2', 'de')).toEqual({ name: 'Spot', address: 'Street 1' });
    });

    it('swallows a failure into an empty result (no error)', async () => {
      const reverse = vi.fn().mockRejectedValue(new Error('boom'));
      expect(await makeController({ reverse }).reverse('1', '2')).toEqual({ name: null, address: null });
    });
  });

  describe('POST /resolve-url', () => {
    it('returns the resolved coordinates', async () => {
      const resolveUrl = vi.fn().mockResolvedValue({ lat: 1, lng: 2, name: null, address: null });
      expect(await makeController({ resolveUrl }).resolveUrl({ url: 'https://maps.app.goo.gl/x' })).toEqual({ lat: 1, lng: 2, name: null, address: null });
    });

    it('maps a service error, defaulting to 400', async () => {
      const resolveUrl = vi.fn().mockRejectedValue(new Error('Failed to resolve URL'));
      expect(await thrown(() => makeController({ resolveUrl }).resolveUrl({ url: 'bad' }))).toEqual({
        status: 400, body: { error: 'Failed to resolve URL' },
      });
    });

    it('honours an explicit status on the thrown error', async () => {
      const resolveUrl = vi.fn().mockRejectedValue(withError(422, 'Unsupported link'));
      expect(await thrown(() => makeController({ resolveUrl }).resolveUrl({ url: 'bad' }))).toEqual({
        status: 422, body: { error: 'Unsupported link' },
      });
    });

    it('falls back to the default message when a non-Error is thrown', async () => {
      const resolveUrl = vi.fn().mockRejectedValue('nope');
      expect(await thrown(() => makeController({ resolveUrl }).resolveUrl({ url: 'bad' }))).toEqual({
        status: 400, body: { error: 'Failed to resolve URL' },
      });
    });
  });

  describe('GET /reverse', () => {
    it('forwards lang through to the service', async () => {
      const reverse = vi.fn().mockResolvedValue({ name: null, address: null });
      await makeController({ reverse }).reverse('1', '2', 'fr');
      expect(reverse).toHaveBeenCalledWith('1', '2', 'fr');
    });
  });
});
