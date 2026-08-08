import {
  preferencesUpdateRequestSchema,
  notificationRespondRequestSchema,
  channelTestResultSchema,
  inAppListResultSchema,
  testNtfyRequestSchema,
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
