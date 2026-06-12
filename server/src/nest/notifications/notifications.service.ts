import { Injectable } from '@nestjs/common';
import type { ChannelTestResult } from '@trek/shared';
import {
  testSmtp,
  testWebhook,
  testNtfy,
  getAdminWebhookUrl,
  getUserWebhookUrl,
  getUserNtfyConfig,
  getAdminNtfyConfig,
} from '../../services/notifications';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markUnread,
  markAllRead,
  deleteNotification,
  deleteAll,
  respondToBoolean,
} from '../../services/inAppNotifications';
import { getPreferencesMatrix, setPreferences } from '../../services/notificationPreferencesService';

type NtfyConfig = ReturnType<typeof getAdminNtfyConfig>;
type RespondResult = Awaited<ReturnType<typeof respondToBoolean>>;
type PreferencesMatrix = ReturnType<typeof getPreferencesMatrix>;

/**
 * Thin Nest wrapper around the existing notification services. Channel delivery
 * (including the WebSocket push in inAppNotifications) and the preference
 * persistence all stay in the upstream services, so behaviour — including
 * real-time delivery — is unchanged. The webhook/ntfy fallback resolution that
 * the legacy route does inline is exposed here as small accessors so the
 * controller can reproduce it exactly.
 */
@Injectable()
export class NotificationsService {
  getPreferences(userId: number, role: string): PreferencesMatrix {
    return getPreferencesMatrix(userId, role, 'user');
  }

  setPreferences(userId: number, body: Parameters<typeof setPreferences>[1]): void {
    setPreferences(userId, body);
  }

  testSmtp(to: string): Promise<ChannelTestResult> {
    return testSmtp(to);
  }

  testWebhook(url: string): Promise<ChannelTestResult> {
    return testWebhook(url);
  }

  testNtfy(cfg: { topic: string; server?: string | null; token?: string | null }): Promise<ChannelTestResult> {
    return testNtfy(cfg);
  }

  userWebhookUrl(userId: number): string | null {
    return getUserWebhookUrl(userId);
  }

  adminWebhookUrl(): string | null {
    return getAdminWebhookUrl();
  }

  userNtfyConfig(userId: number): NtfyConfig | null {
    return getUserNtfyConfig(userId);
  }

  adminNtfyConfig(): NtfyConfig {
    return getAdminNtfyConfig();
  }

  // Returns the native service shape (NotificationRow[] is a superset of the
  // client-facing InAppListResult contract); the controller surfaces it as-is.
  listInApp(userId: number, options: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    return getNotifications(userId, options);
  }

  unreadCount(userId: number): number {
    return getUnreadCount(userId);
  }

  markRead(id: number, userId: number): boolean {
    return markRead(id, userId);
  }

  markUnread(id: number, userId: number): boolean {
    return markUnread(id, userId);
  }

  markAllRead(userId: number): number {
    return markAllRead(userId);
  }

  deleteOne(id: number, userId: number): boolean {
    return deleteNotification(id, userId);
  }

  deleteAll(userId: number): number {
    return deleteAll(userId);
  }

  respond(id: number, userId: number, response: 'positive' | 'negative'): Promise<RespondResult> {
    return respondToBoolean(id, userId, response);
  }
}
