import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { FerratasController, parseFerratasQuery } from '../../../src/nest/ferratas/ferratas.controller';
import type { FerratasService } from '../../../src/nest/ferratas/ferratas.service';
import { TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';
import { HttpException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  FERRATA_BBOX_INVALID_MESSAGE,
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  FERRATAS_ATTRIBUTION,
  ferratasResponseSchema,
  type FerratasResponse,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected a throw');
}

const answer: FerratasResponse = {
  ferratas: [],
  truncated: false,
  source: 'openstreetmap',
  attribution: FERRATAS_ATTRIBUTION,
};

describe('parseFerratasQuery', () => {
  it('answers the named edges', () => {
    expect(parseFerratasQuery({ bbox: '47.1,11.2,47.4,11.6' }).bbox).toEqual({
      south: 47.1,
      west: 11.2,
      north: 47.4,
      east: 11.6,
    });
  });

  it.each([{}, { bbox: '' }, { bbox: '1,2,3' }, { bbox: '47.4,11.2,47.1,11.6' }, { bbox: ['1', '2'] }])(
    '400 with the invalid-bbox message for %j',
    (raw) => {
      expect(thrown(() => parseFerratasQuery(raw))).toEqual({
        status: 400,
        body: { error: FERRATA_BBOX_INVALID_MESSAGE },
      });
    },
  );

  it('400 with its own message for a box that is too large', () => {
    expect(thrown(() => parseFerratasQuery({ bbox: '46,11,47,11.4' }))).toEqual({
      status: 400,
      body: { error: FERRATA_BBOX_TOO_LARGE_MESSAGE },
    });
  });
});

describe('FerratasController', () => {
  it('hands the parsed box to the service and answers what it returns', async () => {
    const list = vi.fn().mockResolvedValue(answer);
    const controller = new FerratasController({ list } as unknown as FerratasService);
    await expect(controller.list({ bbox: '47.1,11.2,47.4,11.6' })).resolves.toBe(answer);
    expect(list).toHaveBeenCalledWith({ south: 47.1, west: 11.2, north: 47.4, east: 11.6 });
  });

  it('refuses a bad box before asking the service', async () => {
    const list = vi.fn();
    const controller = new FerratasController({ list } as unknown as FerratasService);
    await expect(controller.list({ bbox: 'x' })).rejects.toBeInstanceOf(HttpException);
    expect(list).not.toHaveBeenCalled();
  });

  it('passes a service refusal through unchanged', async () => {
    const refusal = new HttpException({ error: 'down', code: 'ferratas_unavailable' }, 502);
    const controller = new FerratasController({
      list: vi.fn().mockRejectedValue(refusal),
    } as unknown as FerratasService);
    await expect(controller.list({ bbox: '47.1,11.2,47.4,11.6' })).rejects.toBe(refusal);
  });

  it('is trip-scoped behind the auth and trip-access guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, FerratasController)).toEqual([JwtAuthGuard, TripAccessGuard]);
  });

  it('declares the shared response contract', () => {
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, FerratasController.prototype.list)).toBe(ferratasResponseSchema);
  });
});
