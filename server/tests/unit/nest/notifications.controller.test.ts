import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { NotificationsController } from '../../../src/nest/notifications/notifications.controller';
import type { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import type { User } from '../../../src/types';

const MASKED = '••••••••';
const user = { id: 4, role: 'user', email: 'u@example.test' } as User;
const admin = { id: 1, role: 'admin', email: 'admin@example.test' } as User;

function makeController(svc: Partial<NotificationsService>) {
  return new NotificationsController(svc as NotificationsService);
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('NotificationsController (parity with the legacy /api/notifications route)', () => {
  describe('preferences', () => {
    it('GET returns the matrix for the user', () => {
      const getPreferences = vi.fn().mockReturnValue({ preferences: {} });
      expect(makeController({ getPreferences }).getPreferences(user)).toEqual({ preferences: {} });
      expect(getPreferences).toHaveBeenCalledWith(4, 'user');
    });

    it('PUT saves then returns the refreshed matrix', () => {
      const setPreferences = vi.fn();
      const getPreferences = vi.fn().mockReturnValue({ preferences: { a: { inapp: true } } });
      const body = { a: { inapp: true } };
      expect(makeController({ setPreferences, getPreferences }).setPreferences(user, body)).toEqual({ preferences: { a: { inapp: true } } });
      expect(setPreferences).toHaveBeenCalledWith(4, body);
    });
  });

  describe('test-smtp', () => {
    it('403 { error: Admin only } for a non-admin (distinct from AdminGuard wording)', async () => {
      const testSmtp = vi.fn();
      expect(await thrown(() => makeController({ testSmtp }).testSmtp(user))).toEqual({
        status: 403, body: { error: 'Admin only' },
      });
      expect(testSmtp).not.toHaveBeenCalled();
    });

    it('falls back to the admin\'s own email when none given', async () => {
      const testSmtp = vi.fn().mockResolvedValue({ success: true });
      await makeController({ testSmtp }).testSmtp(admin);
      expect(testSmtp).toHaveBeenCalledWith('admin@example.test');
    });
  });

  describe('test-webhook', () => {
    it('uses the provided url', async () => {
      const testWebhook = vi.fn().mockResolvedValue({ success: true });
      await makeController({ testWebhook }).testWebhook(user, 'https://hooks.example/x');
      expect(testWebhook).toHaveBeenCalledWith('https://hooks.example/x');
    });

    it('falls back to the saved user url when the masked placeholder is sent', async () => {
      const testWebhook = vi.fn().mockResolvedValue({ success: true });
      const userWebhookUrl = vi.fn().mockReturnValue('https://saved.example/u');
      await makeController({ testWebhook, userWebhookUrl }).testWebhook(user, MASKED);
      expect(userWebhookUrl).toHaveBeenCalledWith(4);
      expect(testWebhook).toHaveBeenCalledWith('https://saved.example/u');
    });

    it('400 when no url is configured', async () => {
      const userWebhookUrl = vi.fn().mockReturnValue(null);
      expect(await thrown(() => makeController({ userWebhookUrl }).testWebhook(user, undefined))).toEqual({
        status: 400, body: { error: 'No webhook URL configured' },
      });
    });

    it('400 on an invalid url', async () => {
      expect(await thrown(() => makeController({}).testWebhook(user, 'not a url'))).toEqual({
        status: 400, body: { error: 'Invalid URL' },
      });
    });
  });

  describe('test-ntfy', () => {
    it('400 when no topic can be resolved', async () => {
      const userNtfyConfig = vi.fn().mockReturnValue(null);
      const adminNtfyConfig = vi.fn().mockReturnValue({ server: null, token: null });
      expect(await thrown(() => makeController({ userNtfyConfig, adminNtfyConfig }).testNtfy(user))).toEqual({
        status: 400, body: { error: 'No ntfy topic configured' },
      });
    });

    it('resolves topic/server/token with fallbacks and reuses a saved token for the placeholder', async () => {
      const testNtfy = vi.fn().mockResolvedValue({ success: true });
      const userNtfyConfig = vi.fn().mockReturnValue({ topic: 'saved-topic', server: 'https://ntfy.me', token: 'saved-token' });
      const adminNtfyConfig = vi.fn().mockReturnValue({ server: null, token: null });
      await makeController({ testNtfy, userNtfyConfig, adminNtfyConfig }).testNtfy(user, undefined, undefined, MASKED);
      expect(testNtfy).toHaveBeenCalledWith({ topic: 'saved-topic', server: 'https://ntfy.me', token: 'saved-token' });
    });
  });

  describe('in-app list + counts', () => {
    it('clamps limit to 50 and defaults offset/unread', () => {
      const listInApp = vi.fn().mockReturnValue({ notifications: [], total: 0, unread_count: 0 });
      makeController({ listInApp }).listInApp(user, '100', '5', 'true');
      expect(listInApp).toHaveBeenCalledWith(4, { limit: 50, offset: 5, unreadOnly: true });
    });

    it('defaults limit to 20 when absent/non-numeric', () => {
      const listInApp = vi.fn().mockReturnValue({ notifications: [], total: 0, unread_count: 0 });
      makeController({ listInApp }).listInApp(user, undefined, undefined, undefined);
      expect(listInApp).toHaveBeenCalledWith(4, { limit: 20, offset: 0, unreadOnly: false });
    });

    it('GET unread-count wraps the number', () => {
      const unreadCount = vi.fn().mockReturnValue(7);
      expect(makeController({ unreadCount }).unreadCount(user)).toEqual({ count: 7 });
    });
  });

  describe('bulk + single mutations', () => {
    it('read-all returns success + count', () => {
      const markAllRead = vi.fn().mockReturnValue(3);
      expect(makeController({ markAllRead }).readAll(user)).toEqual({ success: true, count: 3 });
    });

    it('delete-all returns success + count', () => {
      const deleteAll = vi.fn().mockReturnValue(5);
      expect(makeController({ deleteAll }).deleteAll(user)).toEqual({ success: true, count: 5 });
    });

    it('400 on a non-numeric id', () => {
      const markRead = vi.fn();
      return thrown(() => makeController({ markRead }).markRead(user, 'abc')).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'Invalid id' } }));
    });

    it('404 when mark-read finds nothing', async () => {
      const markRead = vi.fn().mockReturnValue(false);
      expect(await thrown(() => makeController({ markRead }).markRead(user, '9'))).toEqual({
        status: 404, body: { error: 'Not found' },
      });
    });

    it('mark-read success', () => {
      const markRead = vi.fn().mockReturnValue(true);
      expect(makeController({ markRead }).markRead(user, '5')).toEqual({ success: true });
      expect(markRead).toHaveBeenCalledWith(5, 4);
    });

    it('delete single success', () => {
      const deleteOne = vi.fn().mockReturnValue(true);
      expect(makeController({ deleteOne }).deleteOne(user, '5')).toEqual({ success: true });
    });
  });

  describe('respond', () => {
    it('400 on an invalid response value', async () => {
      expect(await thrown(() => makeController({}).respond(user, '5', 'maybe'))).toEqual({
        status: 400, body: { error: 'response must be "positive" or "negative"' },
      });
    });

    it('400 with the service error when the response fails', async () => {
      const respond = vi.fn().mockResolvedValue({ success: false, error: 'Already responded' });
      expect(await thrown(() => makeController({ respond }).respond(user, '5', 'positive'))).toEqual({
        status: 400, body: { error: 'Already responded' },
      });
    });

    it('returns success + the updated notification', async () => {
      const respond = vi.fn().mockResolvedValue({ success: true, notification: { id: 5, response: 'positive' } });
      expect(await makeController({ respond }).respond(user, '5', 'positive')).toEqual({
        success: true, notification: { id: 5, response: 'positive' },
      });
      expect(respond).toHaveBeenCalledWith(5, 4, 'positive');
    });
  });
});
