import {
  preferencesUpdateRequestSchema,
  notificationRespondRequestSchema,
  channelTestResultSchema,
  inAppListResultSchema,
  webPushConfigResultSchema,
  webPushCurrentResultSchema,
  webPushCurrentRequestSchema,
  webPushDeviceListResultSchema,
  webPushRenameRequestSchema,
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

describe('Web Push contracts', () => {
  const subscription = {
    endpoint: 'https://push.example.test/send/abc',
    expirationTime: null,
    keys: {
      p256dh: 'BNcR5mVzY3JpcHRpb24ta2V5',
      auth: 'YXV0aC1zZWNyZXQ',
    },
  };

  it('accepts an explicit current-device enable request', () => {
    expect(
      webPushCurrentRequestSchema.parse({
        intent: 'enable',
        installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
        label: 'Safari on iPhone',
        subscription,
      }),
    ).toEqual({
      intent: 'enable',
      installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
      label: 'Safari on iPhone',
      subscription,
    });
  });

  it('rejects insecure endpoints and unbounded device labels', () => {
    expect(
      webPushCurrentRequestSchema.safeParse({
        intent: 'enable',
        installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
        label: 'Phone',
        subscription: { ...subscription, endpoint: 'http://push.example.test/send/abc' },
      }).success,
    ).toBe(false);
    expect(
      webPushCurrentRequestSchema.safeParse({
        intent: 'enable',
        installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
        label: 'x'.repeat(81),
        subscription,
      }).success,
    ).toBe(false);
  });

  it('pins the public config and safe device-list envelopes', () => {
    expect(
      webPushConfigResultSchema.safeParse({
        enabled: true,
        available: true,
        publicKey: 'BPUBLIC',
        canonicalOrigin: 'https://trek.example.test',
        maxDevices: 10,
      }).success,
    ).toBe(true);
    expect(
      webPushDeviceListResultSchema.safeParse({
        devices: [
          {
            id: 7,
            installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
            label: 'Safari on iPhone',
            createdAt: '2026-08-25T08:00:00.000Z',
            lastSeenAt: '2026-08-25T08:05:00.000Z',
            lastSuccessAt: null,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('accepts bounded rename and current-state results', () => {
    expect(webPushRenameRequestSchema.parse({ label: 'Trip phone' })).toEqual({ label: 'Trip phone' });
    expect(webPushRenameRequestSchema.safeParse({ label: 'x'.repeat(81) }).success).toBe(false);
    expect(
      webPushCurrentResultSchema.safeParse({
        state: 'active',
        device: {
          id: 7,
          installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
          label: 'Trip phone',
          createdAt: '2026-08-25T08:00:00.000Z',
          lastSeenAt: '2026-08-25T08:05:00.000Z',
          lastSuccessAt: null,
        },
      }).success,
    ).toBe(true);
    expect(webPushCurrentResultSchema.safeParse({ state: 'revoked' }).success).toBe(true);
  });
});
