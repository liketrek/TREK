/**
 * Unit tests for PlaceEnrichmentController — ENRICH-040 through ENRICH-046.
 * Service and rate limiter are stubbed; this covers the rate-limit gate, the
 * pass-through and the deliberate swallowing of provider failures.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { PlaceEnrichmentController } from '../../../src/nest/place-enrichment/place-enrichment.controller';
import type { PlaceEnrichmentService } from '../../../src/nest/place-enrichment/place-enrichment.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import type { User } from '../../../src/types';

const USER = { id: 7 } as User;
const REQ = {} as Request;
const BODY = { lat: 50.9, lng: 6.96, name: 'Museum Ludwig', placeId: 'ChIJmuseum' };
const RESULT = { photos: [], description: null, facts: [] };

function make(over: Partial<PlaceEnrichmentService> = {}, rl = new RateLimitService()) {
  const service = { enrich: vi.fn(async () => RESULT), ...over } as unknown as PlaceEnrichmentService;
  return { controller: new PlaceEnrichmentController(service, rl), service, rl };
}

describe('PlaceEnrichmentController', () => {
  it('ENRICH-040: forwards the validated body with the signed-in user id', async () => {
    const { controller, service } = make();

    await expect(controller.enrich(USER, REQ, BODY)).resolves.toEqual(RESULT);
    expect(service.enrich).toHaveBeenCalledWith(7, BODY);
  });

  it('ENRICH-041: answers 429 once a user passes sixty calls a minute', async () => {
    const { controller, service } = make();

    for (let i = 0; i < 60; i++) await controller.enrich(USER, REQ, BODY);
    await expect(controller.enrich(USER, REQ, BODY)).rejects.toBeInstanceOf(HttpException);
    expect(service.enrich).toHaveBeenCalledTimes(60);
  });

  it('ENRICH-042: carries the 429 status and message', async () => {
    const rl = new RateLimitService();
    const { controller } = make({}, rl);
    vi.spyOn(rl, 'check').mockReturnValue(false);

    const err = await controller.enrich(USER, REQ, BODY).catch((e: HttpException) => e);

    expect((err as HttpException).getStatus()).toBe(429);
    expect((err as HttpException).getResponse()).toEqual({ error: 'Too many requests' });
  });

  it('ENRICH-043: buckets per user, so one busy account cannot lock out another', async () => {
    const { controller } = make();

    for (let i = 0; i < 60; i++) await controller.enrich(USER, REQ, BODY);
    await expect(controller.enrich(USER, REQ, BODY)).rejects.toBeInstanceOf(HttpException);
    await expect(controller.enrich({ id: 8 } as User, REQ, BODY)).resolves.toEqual(RESULT);
  });

  it('ENRICH-044: turns a provider failure into an empty result, not a 500', async () => {
    // The column is an aid, not a step — adding a place must not break because
    // Wikimedia is down.
    const { controller } = make({ enrich: vi.fn(async () => { throw new Error('commons down'); }) });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(controller.enrich(USER, REQ, BODY)).resolves.toEqual({ photos: [], description: null, facts: [] });
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('ENRICH-045: passes the disabled envelope through untouched', async () => {
    const disabled = { photos: [], description: null, facts: [], disabled: true };
    const { controller } = make({ enrich: vi.fn(async () => disabled) });

    await expect(controller.enrich(USER, REQ, BODY)).resolves.toEqual(disabled);
  });
});
