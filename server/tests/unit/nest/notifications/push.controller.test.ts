/**
 * PushController parity (PUSHCTL-*): status codes, bodies and the bespoke 400
 * strings of /api/notifications/push, over stubbed providers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { createECDH } from 'node:crypto';
import { PushController } from '../../../../src/nest/notifications/push/push.controller';
import { PUSH_SUBSCRIPTION_ERRORS } from '../../../../src/nest/notifications/push/push-subscription.helpers';
import type { PushSubscriptionsService } from '../../../../src/nest/notifications/push/push-subscriptions.service';
import {
  PUSH_UNAVAILABLE_ERROR,
  PushUnavailableError,
  type VapidKeysService,
} from '../../../../src/nest/notifications/push/vapid-keys.service';
import type { User } from '../../../../src/types';

const keys = { getPublicKey: vi.fn(async (): Promise<string> => 'server-public-key') };
const subscriptions = { upsert: vi.fn(async () => 2), removeForUser: vi.fn(async () => true) };
const controller = new PushController(
  keys as unknown as VapidKeysService,
  subscriptions as unknown as PushSubscriptionsService,
);
const user = { id: 5 } as User;

function subscription(endpoint = 'https://fcm.googleapis.com/fcm/send/abc') {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  return {
    endpoint,
    expirationTime: null,
    keys: { p256dh: ua.getPublicKey('base64url'), auth: Buffer.alloc(16, 1).toString('base64url') },
  };
}

async function thrown(fn: () => Promise<unknown>): Promise<HttpException> {
  try {
    await fn();
  } catch (err) {
    return err as HttpException;
  }
  throw new Error('expected a throw');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PushController', () => {
  it('PUSHCTL-001: GET public-key answers the key browsers subscribe with', async () => {
    expect(await controller.publicKey()).toEqual({ publicKey: 'server-public-key' });
  });

  it('PUSHCTL-002: POST subscriptions stores the checked subscription against the current key and answers 200', async () => {
    const sub = subscription();
    expect(await controller.subscribe(user, { subscription: sub }, 'Firefox/130')).toEqual({ success: true, devices: 2 });
    expect(subscriptions.upsert).toHaveBeenCalledWith(
      5,
      { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      'server-public-key',
      'Firefox/130',
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, PushController.prototype.subscribe)).toBe(200);
  });

  it('PUSHCTL-003: POST subscriptions answers the bespoke 400 and stores nothing', async () => {
    const err = await thrown(() => controller.subscribe(user, { subscription: subscription('https://example.com/collect') }));
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(400);
    expect(err.getResponse()).toEqual({ error: PUSH_SUBSCRIPTION_ERRORS.service });
    expect(subscriptions.upsert).not.toHaveBeenCalled();
  });

  it('PUSHCTL-004: DELETE subscriptions removes only the caller’s endpoint and is idempotent', async () => {
    expect(await controller.unsubscribe(user, { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' })).toEqual({
      success: true,
    });
    expect(subscriptions.removeForUser).toHaveBeenCalledWith(5, 'https://fcm.googleapis.com/fcm/send/abc');
    subscriptions.removeForUser.mockResolvedValueOnce(false);
    expect(await controller.unsubscribe(user, { endpoint: 'https://fcm.googleapis.com/fcm/send/gone' })).toEqual({
      success: true,
    });
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, PushController.prototype.unsubscribe)).toBe(200);
  });

  it('PUSHCTL-005: while the stored key pair is unusable, public-key and subscribe answer 503 and store nothing', async () => {
    keys.getPublicKey.mockImplementation(async () => {
      throw new PushUnavailableError();
    });
    try {
      const fromKey = await thrown(() => controller.publicKey());
      expect(fromKey.getStatus()).toBe(503);
      expect(fromKey.getResponse()).toEqual({ error: PUSH_UNAVAILABLE_ERROR });

      const fromSubscribe = await thrown(() => controller.subscribe(user, { subscription: subscription() }));
      expect(fromSubscribe.getStatus()).toBe(503);
      expect(fromSubscribe.getResponse()).toEqual({ error: PUSH_UNAVAILABLE_ERROR });
      expect(subscriptions.upsert).not.toHaveBeenCalled();

      // A device can still be forgotten.
      expect(await controller.unsubscribe(user, { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' })).toEqual({
        success: true,
      });
    } finally {
      keys.getPublicKey.mockImplementation(async () => 'server-public-key');
    }
  });

  it('PUSHCTL-006: any other key failure is not dressed up as a 503', async () => {
    keys.getPublicKey.mockRejectedValueOnce(new Error('database is locked'));
    await expect(controller.publicKey()).rejects.toThrow('database is locked');
  });
});
