import {
  McpController,
  Tool,
  Resource,
  type McpContext,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  ok,
  okStructured,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { NotificationsService } from './notifications.service';
import {
  idSchema,
  notificationPreferencesOutputSchema,
  notificationReadStateRequestSchema,
  preferencesUpdateRequestSchema,
  type PreferencesUpdateRequest,
} from '@trek/shared';

import { z } from 'zod';

function jsonContent(uri: string, data: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Notifications MCP surface — ported 1:1 from the legacy registrars: the five
 * tools from src/mcp/tools/notifications.ts and the trek://notifications/in-app
 * resource from src/mcp/resources.ts (identical names, descriptions, zod input
 * schemas, annotations and error/payload shapes — including the legacy
 * 'Notification not found.' wording, which differs from the REST route's
 * 'Not found'). The legacy `if (R)` / `if (W)` scope checks map to the
 * declarative notifications read/write access markers (resolved by
 * trekMcpAccessPolicy); there is no `when:` gate — notifications are core,
 * not addon-gated. The WS notification:new/updated broadcasts live inside
 * NotificationsService, so no safeBroadcast here.
 */
@McpController()
export class NotificationsMcp {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  /** The matrix GET /api/notifications/preferences answers, for the caller's own role. */
  private async preferencesOf(userId: number) {
    const role = (await this.guards.isAdminUser(userId)) ? 'admin' : 'user';
    return await this.notifications.getPreferences(userId, role);
  }

  @Tool({
    name: 'list_notifications',
    title: 'List notifications',
    description: 'List in-app notifications for the current user.',
    inputSchema: {
      limit: idSchema.optional().default(20),
      offset: z.number().int().min(0).optional().default(0),
      unread_only: z.boolean().optional().default(false),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'notifications', mode: 'read' },
  })
  async listNotifications(
    { limit, offset, unread_only }: { limit?: number; offset?: number; unread_only?: boolean },
    ctx: McpContext,
  ) {
    const result = await this.notifications.listInApp(ctx.userId, {
      limit: limit ?? 20,
      offset: offset ?? 0,
      unreadOnly: unread_only ?? false,
    });
    return ok(result);
  }

  @Tool({
    name: 'get_unread_notification_count',
    title: 'Count unread notifications',
    description: 'Get the number of unread in-app notifications.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'notifications', mode: 'read' },
  })
  async getUnreadNotificationCount(_input: Record<string, never>, ctx: McpContext) {
    const count = await this.notifications.unreadCount(ctx.userId);
    return ok({ count });
  }

  @Tool({
    name: 'mark_notification_read',
    title: 'Mark notification read',
    description: 'Deprecated: use set_notification_read.',
    inputSchema: {
      notificationId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async markNotificationRead({ notificationId }: { notificationId: number }, ctx: McpContext) {
    // No socket to leave out: every tab of the user, the asking one included, follows the bell.
    const success = await this.notifications.markRead(notificationId, ctx.userId, undefined);
    if (!success) return { content: [{ type: 'text' as const, text: 'Notification not found.' }], isError: true };
    return ok({ success: true });
  }

  @Tool({
    name: 'mark_notification_unread',
    title: 'Mark notification unread',
    description: 'Deprecated: use set_notification_read.',
    inputSchema: {
      notificationId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async markNotificationUnread({ notificationId }: { notificationId: number }, ctx: McpContext) {
    const success = await this.notifications.markUnread(notificationId, ctx.userId, undefined);
    if (!success) return { content: [{ type: 'text' as const, text: 'Notification not found.' }], isError: true };
    return ok({ success: true });
  }

  @Tool({
    name: 'set_notification_read',
    title: 'Set notification read',
    description: 'Mark a single notification read, or unread again.',
    inputSchema: {
      notificationId: idSchema,
      ...notificationReadStateRequestSchema.shape,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async setNotificationRead({ notificationId, read }: { notificationId: number; read: boolean }, ctx: McpContext) {
    return read
      ? this.markNotificationRead({ notificationId }, ctx)
      : this.markNotificationUnread({ notificationId }, ctx);
  }

  @Tool({
    name: 'mark_all_notifications_read',
    title: 'Mark all notifications read',
    description: "Mark all of the current user's notifications as read.",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async markAllNotificationsRead(_input: Record<string, never>, ctx: McpContext) {
    const count = await this.notifications.markAllRead(ctx.userId, undefined);
    return ok({ success: true, count });
  }

  @Resource({
    name: 'notifications-in-app',
    uri: 'trek://notifications/in-app',
    description: "The current user's in-app notifications (most recent 50)",
    mimeType: 'application/json',
    access: { group: 'notifications', mode: 'read' },
  })
  async inAppNotificationsResource(uri: URL, ctx: McpContext) {
    const result = await this.notifications.listInApp(ctx.userId, { limit: 50 });
    return jsonContent(uri.href, result);
  }

  @Tool({
    name: 'get_notification_preferences',
    title: 'Notification preferences',
    description:
      'Which notifications you get over which channel: preferences maps an event type to its channels (true on, false off), channels lists the channels, implemented_combos the channels each event can use at all, locked the cells the admin switched off for everyone.',
    inputSchema: {},
    outputSchema: notificationPreferencesOutputSchema,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'notifications', mode: 'read' },
  })
  async getNotificationPreferences(_args: Record<string, never>, ctx: McpContext) {
    return okStructured({ ...(await this.preferencesOf(ctx.userId)) });
  }

  @Tool({
    name: 'set_notification_preferences',
    title: 'Set notification preferences',
    description:
      'Switch notifications on or off per event and channel: { eventType: { channel: true|false } }. Cells left out keep their value; take the names from get_notification_preferences. Returns the whole matrix.',
    inputSchema: {
      preferences: preferencesUpdateRequestSchema.describe('Event type to channel to on (true) or off (false)'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async setNotificationPreferences({ preferences }: { preferences: PreferencesUpdateRequest }, ctx: McpContext) {
    await this.notifications.setPreferences(ctx.userId, preferences);
    return ok(await this.preferencesOf(ctx.userId));
  }
}
