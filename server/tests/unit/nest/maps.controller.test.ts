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
  describe('POST /search', () => {
    it('400 when query is missing', async () => {
      expect(await thrown(() => makeController({}).search(user, undefined))).toEqual({
        status: 400, body: { error: 'Search query is required' },
      });
    });

    it('returns the service result', async () => {
      const search = vi.fn().mockResolvedValue({ places: [], source: 'osm' });
      const res = await makeController({ search }).search(user, 'berlin', 'de');
      expect(res).toEqual({ places: [], source: 'osm' });
      expect(search).toHaveBeenCalledWith(3, 'berlin', 'de', undefined);
    });

    it('400 on a malformed locationBias (non-finite lat/lng)', async () => {
      const search = vi.fn();
      const bad = { lat: NaN, lng: 2 };
      expect(await thrown(() => makeController({ search }).search(user, 'x', 'de', bad))).toEqual({
        status: 400, body: { error: 'Invalid locationBias: lat and lng must be finite numbers' },
      });
      expect(search).not.toHaveBeenCalled();
    });

    it('forwards a valid locationBias to the service', async () => {
      const search = vi.fn().mockResolvedValue({ places: [], source: 'osm' });
      const bias = { lat: 1, lng: 2, radius: 5000 };
      await makeController({ search }).search(user, 'x', 'de', bias);
      expect(search).toHaveBeenCalledWith(3, 'x', 'de', bias);
    });

    it('maps a service error to its status + message', async () => {
      const search = vi.fn().mockRejectedValue(withError(429, 'Rate limited'));
      expect(await thrown(() => makeController({ search }).search(user, 'x'))).toEqual({
        status: 429, body: { error: 'Rate limited' },
      });
    });

    it('defaults a non-Error rejection to 500 + the fallback message', async () => {
      const search = vi.fn().mockRejectedValue('boom');
      expect(await thrown(() => makeController({ search }).search(user, 'x'))).toEqual({
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

    it('delegates a valid request with a parsed numeric bbox', async () => {
      const pois = vi.fn().mockResolvedValue({ places: [] });
      const res = await makeController({ pois }).pois('cafe', '1', '2', '3', '4');
      expect(res).toEqual({ places: [] });
      expect(pois).toHaveBeenCalledWith('cafe', { south: 1, west: 2, north: 3, east: 4 });
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
      const res = await makeController({ autocompleteDisabled: () => true, autocomplete }).autocomplete(user, 'be');
      expect(res).toEqual({ suggestions: [], source: 'disabled' });
      expect(autocomplete).not.toHaveBeenCalled();
    });

    it('400 when input is missing or not a string', async () => {
      const c = makeController({ autocompleteDisabled: () => false });
      expect(await thrown(() => c.autocomplete(user, undefined))).toEqual({ status: 400, body: { error: 'Input is required' } });
      expect(await thrown(() => c.autocomplete(user, 123 as unknown as string))).toEqual({ status: 400, body: { error: 'Input is required' } });
    });

    it('400 when input is too long', async () => {
      const c = makeController({ autocompleteDisabled: () => false });
      expect(await thrown(() => c.autocomplete(user, 'x'.repeat(201)))).toEqual({
        status: 400, body: { error: 'Input too long (max 200 chars)' },
      });
    });

    it('400 on a malformed locationBias', async () => {
      const c = makeController({ autocompleteDisabled: () => false });
      const bad = { low: { lat: 1, lng: NaN }, high: { lat: 2, lng: 3 } };
      expect(await thrown(() => c.autocomplete(user, 'be', undefined, bad))).toEqual({
        status: 400, body: { error: 'Invalid locationBias: low and high must have finite lat and lng' },
      });
    });

    it('400 when locationBias is missing the high corner', async () => {
      const c = makeController({ autocompleteDisabled: () => false });
      const bad = { low: { lat: 1, lng: 2 } } as never;
      expect(await thrown(() => c.autocomplete(user, 'be', undefined, bad))).toEqual({
        status: 400, body: { error: 'Invalid locationBias: low and high must have finite lat and lng' },
      });
    });

    it('delegates a valid request', async () => {
      const autocomplete = vi.fn().mockResolvedValue({ suggestions: [], source: 'osm' });
      const bias = { low: { lat: 1, lng: 2 }, high: { lat: 3, lng: 4 } };
      await makeController({ autocompleteDisabled: () => false, autocomplete }).autocomplete(user, 'be', 'en', bias);
      expect(autocomplete).toHaveBeenCalledWith(3, 'be', 'en', bias);
    });

    it('maps a service error', async () => {
      const autocomplete = vi.fn().mockRejectedValue(withError(503, 'Upstream down'));
      const c = makeController({ autocompleteDisabled: () => false, autocomplete });
      expect(await thrown(() => c.autocomplete(user, 'be'))).toEqual({
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
      const photo = vi.fn().mockRejectedValue(withError(404, 'No photo available'));
      expect(await thrown(() => makeController({ photosDisabled: () => false, photo }).placePhoto(user, 'p1', '1', '2'))).toEqual({
        status: 404, body: { error: 'No photo available' },
      });
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
      };
      return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; type: ReturnType<typeof vi.fn> };
    }

    beforeEach(() => createReadStream.mockReset());

    it('404 when the photo is not cached', () => {
      const res = makeRes();
      makeController({ photoBytesPath: () => null }).placePhotoBytes('p1', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not cached' });
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

    it('falls back to 404 when the read stream errors', () => {
      let onError: () => void = () => {};
      const stream = { on: vi.fn((ev: string, cb: () => void) => { if (ev === 'error') onError = cb; return stream; }), pipe: vi.fn() };
      createReadStream.mockReturnValue(stream);
      const res = makeRes();
      makeController({ photoBytesPath: () => '/cache/p1.jpg' }).placePhotoBytes('p1', res);
      onError();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not cached' });
    });

    it('does not re-send a 404 when the stream errors after headers were flushed', () => {
      let onError: () => void = () => {};
      const stream = { on: vi.fn((ev: string, cb: () => void) => { if (ev === 'error') onError = cb; return stream; }), pipe: vi.fn() };
      createReadStream.mockReturnValue(stream);
      const res = makeRes();
      (res as { headersSent: boolean }).headersSent = true;
      makeController({ photoBytesPath: () => '/cache/p1.jpg' }).placePhotoBytes('p1', res);
      onError();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
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
    it('400 when url missing or not a string', async () => {
      expect(await thrown(() => makeController({}).resolveUrl(undefined))).toEqual({ status: 400, body: { error: 'URL is required' } });
    });

    it('returns the resolved coordinates', async () => {
      const resolveUrl = vi.fn().mockResolvedValue({ lat: 1, lng: 2, name: null, address: null });
      expect(await makeController({ resolveUrl }).resolveUrl('https://maps.app.goo.gl/x')).toEqual({ lat: 1, lng: 2, name: null, address: null });
    });

    it('400 when url is not a string', async () => {
      expect(await thrown(() => makeController({}).resolveUrl(42 as unknown as string))).toEqual({
        status: 400, body: { error: 'URL is required' },
      });
    });

    it('maps a service error, defaulting to 400', async () => {
      const resolveUrl = vi.fn().mockRejectedValue(new Error('Failed to resolve URL'));
      expect(await thrown(() => makeController({ resolveUrl }).resolveUrl('bad'))).toEqual({
        status: 400, body: { error: 'Failed to resolve URL' },
      });
    });

    it('honours an explicit status on the thrown error', async () => {
      const resolveUrl = vi.fn().mockRejectedValue(withError(422, 'Unsupported link'));
      expect(await thrown(() => makeController({ resolveUrl }).resolveUrl('bad'))).toEqual({
        status: 422, body: { error: 'Unsupported link' },
      });
    });

    it('falls back to the default message when a non-Error is thrown', async () => {
      const resolveUrl = vi.fn().mockRejectedValue('nope');
      expect(await thrown(() => makeController({ resolveUrl }).resolveUrl('bad'))).toEqual({
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
