import {
  McpController, Tool, Resource, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  demoDenied, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from './notifications.service';

function jsonContent(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
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
    private readonly auth: AuthService,
  ) {}

  @Tool({
    name: 'list_notifications',
    description: 'List in-app notifications for the current user.',
    inputSchema: {
      limit: z.number().int().positive().optional().default(20),
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
    const result = this.notifications.listInApp(ctx.userId, { limit: limit ?? 20, offset: offset ?? 0, unreadOnly: unread_only ?? false });
    return ok(result);
  }

  @Tool({
    name: 'get_unread_notification_count',
    description: 'Get the number of unread in-app notifications.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'notifications', mode: 'read' },
  })
  async getUnreadNotificationCount(_input: Record<string, never>, ctx: McpContext) {
    const count = this.notifications.unreadCount(ctx.userId);
    return ok({ count });
  }

  @Tool({
    name: 'mark_notification_read',
    description: 'Mark a single notification as read.',
    inputSchema: {
      notificationId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async markNotificationRead({ notificationId }: { notificationId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const success = this.notifications.markRead(notificationId, ctx.userId);
    if (!success) return { content: [{ type: 'text' as const, text: 'Notification not found.' }], isError: true };
    return ok({ success: true });
  }

  @Tool({
    name: 'mark_notification_unread',
    description: 'Mark a single notification as unread.',
    inputSchema: {
      notificationId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async markNotificationUnread({ notificationId }: { notificationId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const success = this.notifications.markUnread(notificationId, ctx.userId);
    if (!success) return { content: [{ type: 'text' as const, text: 'Notification not found.' }], isError: true };
    return ok({ success: true });
  }

  @Tool({
    name: 'mark_all_notifications_read',
    description: "Mark all of the current user's notifications as read.",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'notifications', mode: 'write' },
  })
  async markAllNotificationsRead(_input: Record<string, never>, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const count = this.notifications.markAllRead(ctx.userId);
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
    const result = this.notifications.listInApp(ctx.userId, { limit: 50 });
    return jsonContent(uri.href, result);
  }
}
