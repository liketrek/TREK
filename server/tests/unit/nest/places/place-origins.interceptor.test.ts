/**
 * The REST side of the origin tracking: the interceptor reads a place before
 * its route runs and records after the route answered, with the writer the
 * route's decorator names, and records nothing for a route that threw.
 */
import { PlaceOriginsInterceptor, TrackPlaceOrigins } from '../../../../src/nest/places/place-origins.interceptor';
import type { PlaceOriginsService } from '../../../../src/nest/places/place-origins.service';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { lastValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

class Routes {
  @TrackPlaceOrigins('client')
  update(): void {}

  @TrackPlaceOrigins('upload')
  upload(): void {}

  @TrackPlaceOrigins('attachment')
  fromFile(): void {}

  @TrackPlaceOrigins('import')
  importList(): void {}
}

const BEFORE = {
  website: 'https://old.example',
  phone: null,
  email: null,
  opening_hours: null,
  description: null,
  image: null,
};
const origins = {
  valuesBefore: vi.fn(async () => BEFORE),
  record: vi.fn(async () => undefined),
  recordImported: vi.fn(async () => undefined),
};
const interceptor = new PlaceOriginsInterceptor(origins as unknown as PlaceOriginsService, new Reflector());

function context(handler: keyof Routes, req: { params?: Record<string, string>; body?: unknown }): ExecutionContext {
  return {
    getHandler: () => Routes.prototype[handler],
    getClass: () => Routes,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

async function run(handler: keyof Routes, req: { params?: Record<string, string>; body?: unknown }, answer: unknown) {
  const next: CallHandler = { handle: () => of(answer) };
  return lastValueFrom(await interceptor.intercept(context(handler, req), next));
}

beforeEach(() => vi.clearAllMocks());

describe('PlaceOriginsInterceptor', () => {
  it('POI-001: an update reads the place first and records what the client reported', async () => {
    const body = { website: 'https://new.example', fieldOrigins: { website: 'user' } };
    const answer = { place: { id: 12 } };
    expect(await run('update', { params: { id: '12' }, body }, answer)).toBe(answer);
    expect(origins.valuesBefore).toHaveBeenCalledWith(12);
    expect(origins.record).toHaveBeenCalledWith(12, BEFORE, { kind: 'client', claims: { website: 'user' } });
  });

  it('POI-002: a create has no place before it; a malformed report counts as none', async () => {
    await run(
      'update',
      { params: {}, body: { name: 'New', fieldOrigins: { website: 'agent' } } },
      { place: { id: 5 } },
    );
    expect(origins.valuesBefore).not.toHaveBeenCalled();
    expect(origins.record).toHaveBeenCalledWith(5, null, { kind: 'client', claims: undefined });
  });

  it('POI-003: the upload is the user own picture, a trip file the attachment', async () => {
    await run('upload', { params: { id: '3' } }, { place: { id: 3 } });
    expect(origins.record).toHaveBeenLastCalledWith(3, BEFORE, { kind: 'fixed', origin: 'user', field: 'image' });
    await run('fromFile', { params: { id: '3' } }, { place: { id: 3 } });
    expect(origins.record).toHaveBeenLastCalledWith(3, BEFORE, { kind: 'fixed', origin: 'attachment', field: 'image' });
  });

  it('POI-004: an import records the places it answered with, in one pass', async () => {
    await run('importList', { params: {} }, { places: [{ id: 1 }, { id: 2 }, { id: 'x' }], count: 2 });
    expect(origins.recordImported).toHaveBeenCalledWith([1, 2]);
    expect(origins.record).not.toHaveBeenCalled();
  });

  it('POI-005: an answer without a place records nothing; a route that threw neither', async () => {
    await run('update', { params: { id: '4' } }, { deleted: true });
    expect(origins.record).not.toHaveBeenCalled();
    const failing: CallHandler = { handle: () => throwError(() => new Error('409')) };
    const observable = await interceptor.intercept(context('update', { params: { id: '4' } }), failing);
    await expect(lastValueFrom(observable)).rejects.toThrow('409');
    expect(origins.record).not.toHaveBeenCalled();
  });
});
