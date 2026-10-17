import {
  preferencesUpdateRequestSchema,
  notificationRespondRequestSchema,
  channelTestResultSchema,
  inAppListResultSchema,
  testNtfyRequestSchema,
  pushSubscriptionSchema,
  pushSubscribeRequestSchema,
  pushUnsubscribeRequestSchema,
  pushPublicKeyResultSchema,
  pushSubscribeResultSchema,
  pushUnsubscribeResultSchema,
  pushPayloadSchema,
  MAX_PUSH_ENDPOINT_LENGTH,
} from './notification.schema';

import { describe, it, expect } from 'vitest';

describe('preferencesUpdateRequestSchema', () => {
  it('accepts a nested event/channel/enabled matrix', () => {
    expect(
      preferencesUpdateRequestSchema.safeParse({
        trip_invite: { inapp: true, email: false },
      }).success,
    ).toBe(true);
    expect(
      preferencesUpdateRequestSchema.safeParse({
        trip_invite: { inapp: 'yes' },
      }).success,
    ).toBe(false);
  });
});

describe('notificationRespondRequestSchema', () => {
  it('only accepts positive/negative', () => {
    expect(notificationRespondRequestSchema.safeParse({ response: 'positive' }).success).toBe(true);
    expect(notificationRespondRequestSchema.safeParse({ response: 'maybe' }).success).toBe(false);
  });
});

describe('testNtfyRequestSchema', () => {
  it('accepts null server/token — the client sends null to mean "use the saved value"', () => {
    expect(testNtfyRequestSchema.safeParse({ topic: 't', server: null, token: null }).success).toBe(true);
    expect(testNtfyRequestSchema.safeParse({}).success).toBe(true);
    expect(testNtfyRequestSchema.safeParse({ topic: 1 }).success).toBe(false);
  });
});

describe('channelTestResultSchema', () => {
  it('accepts a success result and an error result', () => {
    expect(channelTestResultSchema.safeParse({ success: true }).success).toBe(true);
    expect(channelTestResultSchema.safeParse({ success: false, error: 'SMTP down' }).success).toBe(true);
  });
});

describe('inAppListResultSchema', () => {
  it('accepts the list envelope with open notification rows', () => {
    expect(
      inAppListResultSchema.safeParse({
        notifications: [{ id: 1, type: 'info', anything: 'goes' }],
        total: 1,
        unread_count: 0,
      }).success,
    ).toBe(true);
  });
});

// ── Web Push ────────────────────────────────────────────────────────────────

const SUBSCRIPTION = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  expirationTime: null,
  keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA', auth: 'tBHItJI5svbpez7KI4CCXg' },
};

describe('pushSubscriptionSchema', () => {
  it('accepts what PushSubscription.toJSON() hands over, with or without an expiry', () => {
    expect(pushSubscriptionSchema.safeParse(SUBSCRIPTION).success).toBe(true);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, expirationTime: 1767225600000 }).success).toBe(true);
    expect(pushSubscriptionSchema.safeParse({ endpoint: SUBSCRIPTION.endpoint, keys: SUBSCRIPTION.keys }).success).toBe(
      true,
    );
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, expirationTime: 'tomorrow' }).success).toBe(false);
  });

  it('refuses a subscription without keys, or with one of them missing or empty', () => {
    expect(pushSubscriptionSchema.safeParse({ endpoint: SUBSCRIPTION.endpoint, expirationTime: null }).success).toBe(
      false,
    );
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { p256dh: 'x' } }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { auth: 'x' } }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { p256dh: '', auth: 'x' } }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: '' }).success).toBe(false);
  });

  it('refuses an endpoint that is not a string, and leaves checking the URL itself to the server', () => {
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: 42 }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: null }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ keys: SUBSCRIPTION.keys }).success).toBe(false);
    // Only the shape is the contract's: a string that is not an https URL on a push
    // service passes here, so the server can refuse it with its own 400 body.
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: 'not a url' }).success).toBe(true);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: 'http://example.com/push' }).success).toBe(
      true,
    );
  });

  it('refuses keys that are not strings', () => {
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: 'p256dh,auth' }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { p256dh: 1, auth: 'x' } }).success).toBe(false);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { p256dh: 'x', auth: null } }).success).toBe(
      false,
    );
  });

  it('caps the endpoint at MAX_PUSH_ENDPOINT_LENGTH characters and the keys at 200 and 100', () => {
    const at = (n: number) => 'a'.repeat(n);
    expect(MAX_PUSH_ENDPOINT_LENGTH).toBe(2048);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: at(MAX_PUSH_ENDPOINT_LENGTH) }).success).toBe(
      true,
    );
    expect(
      pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, endpoint: at(MAX_PUSH_ENDPOINT_LENGTH + 1) }).success,
    ).toBe(false);
    const keys = SUBSCRIPTION.keys;
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { ...keys, p256dh: at(200) } }).success).toBe(
      true,
    );
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { ...keys, p256dh: at(201) } }).success).toBe(
      false,
    );
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { ...keys, auth: at(100) } }).success).toBe(true);
    expect(pushSubscriptionSchema.safeParse({ ...SUBSCRIPTION, keys: { ...keys, auth: at(101) } }).success).toBe(false);
  });
});

describe('pushSubscribeRequestSchema', () => {
  it('wants the subscription under `subscription`', () => {
    expect(pushSubscribeRequestSchema.safeParse({ subscription: SUBSCRIPTION }).success).toBe(true);
    expect(pushSubscribeRequestSchema.safeParse(SUBSCRIPTION).success).toBe(false);
    expect(pushSubscribeRequestSchema.safeParse({}).success).toBe(false);
  });

  it('checks the subscription inside it like a bare one', () => {
    expect(pushSubscribeRequestSchema.safeParse({ subscription: { ...SUBSCRIPTION, keys: {} } }).success).toBe(false);
    expect(
      pushSubscribeRequestSchema.safeParse({
        subscription: { ...SUBSCRIPTION, endpoint: 'a'.repeat(MAX_PUSH_ENDPOINT_LENGTH + 1) },
      }).success,
    ).toBe(false);
  });
});

describe('pushUnsubscribeRequestSchema', () => {
  it('takes one endpoint, non-empty and at most MAX_PUSH_ENDPOINT_LENGTH characters, like a subscription', () => {
    expect(pushUnsubscribeRequestSchema.safeParse({ endpoint: SUBSCRIPTION.endpoint }).success).toBe(true);
    expect(pushUnsubscribeRequestSchema.safeParse({ endpoint: '' }).success).toBe(false);
    expect(pushUnsubscribeRequestSchema.safeParse({ endpoint: 'a'.repeat(MAX_PUSH_ENDPOINT_LENGTH) }).success).toBe(
      true,
    );
    expect(pushUnsubscribeRequestSchema.safeParse({ endpoint: 'a'.repeat(MAX_PUSH_ENDPOINT_LENGTH + 1) }).success).toBe(
      false,
    );
    expect(pushUnsubscribeRequestSchema.safeParse({}).success).toBe(false);
    expect(pushUnsubscribeRequestSchema.safeParse({ endpoint: 42 }).success).toBe(false);
  });
});

describe('pushPublicKeyResultSchema', () => {
  it('is the key as a string', () => {
    expect(pushPublicKeyResultSchema.safeParse({ publicKey: 'BP4z9KsN6nGRTbVY' }).success).toBe(true);
    expect(pushPublicKeyResultSchema.safeParse({ publicKey: null }).success).toBe(false);
    expect(pushPublicKeyResultSchema.safeParse({}).success).toBe(false);
  });
});

describe('pushSubscribeResultSchema', () => {
  it('is success true with the device count', () => {
    expect(pushSubscribeResultSchema.safeParse({ success: true, devices: 2 }).success).toBe(true);
    expect(pushSubscribeResultSchema.safeParse({ success: false, devices: 2 }).success).toBe(false);
    expect(pushSubscribeResultSchema.safeParse({ success: true }).success).toBe(false);
  });
});

describe('pushUnsubscribeResultSchema', () => {
  it('is success true, nothing else', () => {
    expect(pushUnsubscribeResultSchema.safeParse({ success: true }).success).toBe(true);
    expect(pushUnsubscribeResultSchema.safeParse({ success: false }).success).toBe(false);
    expect(pushUnsubscribeResultSchema.safeParse({}).success).toBe(false);
  });
});

describe('pushPayloadSchema', () => {
  it('needs a title and a body; url and tag are optional', () => {
    expect(pushPayloadSchema.safeParse({ title: 'T', body: 'B' }).success).toBe(true);
    expect(
      pushPayloadSchema.safeParse({ title: 'T', body: 'B', url: '/trips/1', tag: 'collab_message:/trips/1' }).success,
    ).toBe(true);
    expect(pushPayloadSchema.safeParse({ title: 'T' }).success).toBe(false);
    expect(pushPayloadSchema.safeParse({ body: 'B' }).success).toBe(false);
    expect(pushPayloadSchema.safeParse({ title: 'T', body: 'B', tag: 5 }).success).toBe(false);
  });
});
