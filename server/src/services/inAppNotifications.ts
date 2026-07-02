import { db } from '../db/database';
import { avatarUrl } from './avatarUrl';
import { broadcastToUser } from '../websocket';
import { getAction } from './inAppNotificationActions';
import { isEnabledForEvent, type NotifEventType } from './notificationPreferencesService';

// SQLite's CURRENT_TIMESTAMP is UTC but the string ('YYYY-MM-DD HH:MM:SS') has
// no 'T'/'Z', so `new Date(...)` parses it as LOCAL time. Normalize to ISO-UTC
// so the client renders notification times in the viewer's own timezone (#1149).
function toUtcIso(ts: string): string {
  return ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z';
}

type NotificationType = 'simple' | 'boolean' | 'navigate';
type NotificationScope = 'trip' | 'user' | 'admin';
type NotificationResponse = 'positive' | 'negative';

interface BaseNotificationInput {
  type: NotificationType;
  scope: NotificationScope;
  target: number;
  sender_id: number | null;
  event_type?: NotifEventType;
  title_key: string;
  title_params?: Record<string, string>;
  text_key: string;
  text_params?: Record<string, string>;
}

interface SimpleNotificationInput extends BaseNotificationInput {
  type: 'simple';
}

interface BooleanNotificationInput extends BaseNotificationInput {
  type: 'boolean';
  positive_text_key: string;
  negative_text_key: string;
  positive_callback: { action: string; payload: Record<string, unknown> };
  negative_callback: { action: string; payload: Record<string, unknown> };
}

interface NavigateNotificationInput extends BaseNotificationInput {
  type: 'navigate';
  navigate_text_key: string;
  navigate_target: string;
}

type NotificationInput = SimpleNotificationInput | BooleanNotificationInput | NavigateNotificationInput;

interface NotificationRow {
  id: number;
  type: NotificationType;
  scope: NotificationScope;
  target: number;
  sender_id: number | null;
  sender_username?: string | null;
  sender_avatar?: string | null;
  recipient_id: number;
  title_key: string;
  title_params: string;
  text_key: string;
  text_params: string;
  positive_text_key: string | null;
  negative_text_key: string | null;
  positive_callback: string | null;
  negative_callback: string | null;
  response: NotificationResponse | null;
  navigate_text_key: string | null;
  navigate_target: string | null;
  is_read: number;
  created_at: string;
}

export function resolveRecipients(scope: NotificationScope, target: number, excludeUserId?: number | null): number[] {
  let userIds: number[] = [];

  // Guests (#1362) are trip members for assignment purposes but have no inbox/email,
  // so they must never be resolved as notification recipients on any scope. This is the
  // single chokepoint for in-app/email/webhook/ntfy, so filtering here covers all channels.
  if (scope === 'trip') {
    const owner = db.prepare('SELECT user_id FROM trips WHERE id = ?').get(target) as { user_id: number } | undefined;
    const members = db.prepare('SELECT m.user_id FROM trip_members m JOIN users u ON u.id = m.user_id WHERE m.trip_id = ? AND COALESCE(u.is_guest, 0) = 0').all(target) as { user_id: number }[];
    const ids = new Set<number>();
    if (owner) ids.add(owner.user_id);
    for (const m of members) ids.add(m.user_id);
    userIds = Array.from(ids);
  } else if (scope === 'user') {
    // A guest can be a todo assignee (scope='user'); never notify them.
    const u = db.prepare('SELECT is_guest FROM users WHERE id = ?').get(target) as { is_guest?: number } | undefined;
    userIds = u && u.is_guest ? [] : [target];
  } else if (scope === 'admin') {
    const admins = db.prepare("SELECT id FROM users WHERE role = ? AND COALESCE(is_guest, 0) = 0").all('admin') as { id: number }[];
    userIds = admins.map(a => a.id);
  }

  // Only exclude sender for group scopes (trip/admin) — for user scope, the target is explicit
  if (excludeUserId != null && scope !== 'user') {
    userIds = userIds.filter(id => id !== excludeUserId);
  }

  return userIds;
}

function createNotification(input: NotificationInput): number[] {
  const recipients = resolveRecipients(input.scope, input.target, input.sender_id);
  if (recipients.length === 0) return [];

  const titleParams = JSON.stringify(input.title_params ?? {});
  const textParams = JSON.stringify(input.text_params ?? {});

  // Track inserted id → recipientId pairs (some recipients may be skipped by pref check)
  const insertedPairs: Array<{ id: number; recipientId: number }> = [];

  const insert = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO notifications (
        type, scope, target, sender_id, recipient_id,
        title_key, title_params, text_key, text_params,
        positive_text_key, negative_text_key, positive_callback, negative_callback,
        navigate_text_key, navigate_target
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const recipientId of recipients) {
      // Check per-user in-app preference if an event_type is provided
      if (input.event_type && !isEnabledForEvent(recipientId, input.event_type, 'inapp')) {
        continue;
      }

      let positiveTextKey: string | null = null;
      let negativeTextKey: string | null = null;
      let positiveCallback: string | null = null;
      let negativeCallback: string | null = null;
      let navigateTextKey: string | null = null;
      let navigateTarget: string | null = null;

      if (input.type === 'boolean') {
        positiveTextKey = input.positive_text_key;
        negativeTextKey = input.negative_text_key;
        positiveCallback = JSON.stringify(input.positive_callback);
        negativeCallback = JSON.stringify(input.negative_callback);
      } else if (input.type === 'navigate') {
        navigateTextKey = input.navigate_text_key;
        navigateTarget = input.navigate_target;
      }

      const result = stmt.run(
        input.type, input.scope, input.target, input.sender_id, recipientId,
        input.title_key, titleParams, input.text_key, textParams,
        positiveTextKey, negativeTextKey, positiveCallback, negativeCallback,
        navigateTextKey, navigateTarget
      );

      insertedPairs.push({ id: result.lastInsertRowid as number, recipientId });
    }
  });

  insert();

  // Fetch sender info once for WS payloads
  const sender = input.sender_id
    ? (db.prepare('SELECT username, avatar FROM users WHERE id = ?').get(input.sender_id) as { username: string; avatar: string | null } | undefined)
    : null;

  // Broadcast to each recipient
  for (const { id: notificationId, recipientId } of insertedPairs) {
    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId) as NotificationRow;
    if (!row) continue;

    broadcastToUser(recipientId, {
      type: 'notification:new',
      notification: {
        ...row,
        sender_username: sender?.username ?? null,
        sender_avatar: avatarUrl({ avatar: sender?.avatar }),
      },
    });
  }

  return insertedPairs.map(p => p.id);
}

/**
 * Insert a single in-app notification for one pre-resolved recipient and broadcast via WebSocket.
 * Used by notificationService.send() which handles recipient resolution externally.
 */
export function createNotificationForRecipient(
  input: NotificationInput,
  recipientId: number,
  sender: { username: string; avatar: string | null } | null
): number | null {
  const titleParams = JSON.stringify(input.title_params ?? {});
  const textParams = JSON.stringify(input.text_params ?? {});

  let positiveTextKey: string | null = null;
  let negativeTextKey: string | null = null;
  let positiveCallback: string | null = null;
  let negativeCallback: string | null = null;
  let navigateTextKey: string | null = null;
  let navigateTarget: string | null = null;

  if (input.type === 'boolean') {
    positiveTextKey = input.positive_text_key;
    negativeTextKey = input.negative_text_key;
    positiveCallback = JSON.stringify(input.positive_callback);
    negativeCallback = JSON.stringify(input.negative_callback);
  } else if (input.type === 'navigate') {
    navigateTextKey = input.navigate_text_key;
    navigateTarget = input.navigate_target;
  }

  const result = db.prepare(`
    INSERT INTO notifications (
      type, scope, target, sender_id, recipient_id,
      title_key, title_params, text_key, text_params,
      positive_text_key, negative_text_key, positive_callback, negative_callback,
      navigate_text_key, navigate_target
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.type, input.scope, input.target, input.sender_id, recipientId,
    input.title_key, titleParams, input.text_key, textParams,
    positiveTextKey, negativeTextKey, positiveCallback, negativeCallback,
    navigateTextKey, navigateTarget
  );

  const notificationId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId) as NotificationRow | undefined;
  if (!row) return null;

  broadcastToUser(recipientId, {
    type: 'notification:new',
    notification: {
      ...row,
      created_at: toUtcIso(row.created_at),
      sender_username: sender?.username ?? null,
      sender_avatar: avatarUrl({ avatar: sender?.avatar }),
    },
  });

  return notificationId;
}

function getNotifications(
  userId: number,
  options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
): { notifications: NotificationRow[]; total: number; unread_count: number } {
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = options.offset ?? 0;
  const unreadOnly = options.unreadOnly ?? false;

  const whereAliased = unreadOnly ? 'WHERE n.recipient_id = ? AND n.is_read = 0' : 'WHERE n.recipient_id = ?';
  const wherePlain = unreadOnly ? 'WHERE recipient_id = ? AND is_read = 0' : 'WHERE recipient_id = ?';

  const rows = db.prepare(`
    SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    ${whereAliased}
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as NotificationRow[];

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM notifications ${wherePlain}`).get(userId) as { total: number };
  const { unread_count } = db.prepare('SELECT COUNT(*) as unread_count FROM notifications WHERE recipient_id = ? AND is_read = 0').get(userId) as { unread_count: number };

  const mapped = rows.map(r => ({
    ...r,
    created_at: toUtcIso(r.created_at),
    sender_avatar: avatarUrl({ avatar: r.sender_avatar }),
  }));

  return { notifications: mapped, total, unread_count };
}

function getUnreadCount(userId: number): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0').get(userId) as { count: number };
  return row.count;
}

function markRead(notificationId: number, userId: number): boolean {
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(notificationId, userId);
  return result.changes > 0;
}

function markUnread(notificationId: number, userId: number): boolean {
  const result = db.prepare('UPDATE notifications SET is_read = 0 WHERE id = ? AND recipient_id = ?').run(notificationId, userId);
  return result.changes > 0;
}

function markAllRead(userId: number): number {
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0').run(userId);
  return result.changes;
}

function deleteNotification(notificationId: number, userId: number): boolean {
  const result = db.prepare('DELETE FROM notifications WHERE id = ? AND recipient_id = ?').run(notificationId, userId);
  return result.changes > 0;
}

function deleteAll(userId: number): number {
  const result = db.prepare('DELETE FROM notifications WHERE recipient_id = ?').run(userId);
  return result.changes;
}

async function respondToBoolean(
  notificationId: number,
  userId: number,
  response: NotificationResponse
): Promise<{ success: boolean; error?: string; notification?: NotificationRow }> {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND recipient_id = ?').get(notificationId, userId) as NotificationRow | undefined;

  if (!notification) return { success: false, error: 'Notification not found' };
  if (notification.type !== 'boolean') return { success: false, error: 'Not a boolean notification' };
  if (notification.response !== null) return { success: false, error: 'Already responded' };

  const callbackJson = response === 'positive' ? notification.positive_callback : notification.negative_callback;
  if (!callbackJson) return { success: false, error: 'No callback defined' };

  let callback: { action: string; payload: Record<string, unknown> };
  try {
    callback = JSON.parse(callbackJson);
  } catch {
    return { success: false, error: 'Invalid callback format' };
  }

  const handler = getAction(callback.action);
  if (!handler) return { success: false, error: `Unknown action: ${callback.action}` };

  try {
    await handler(callback.payload, userId);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Action failed' };
  }

  // Atomic update — only updates if response is still NULL (prevents double-response)
  const result = db.prepare(
    'UPDATE notifications SET response = ?, is_read = 1 WHERE id = ? AND recipient_id = ? AND response IS NULL'
  ).run(response, notificationId, userId);

  if (result.changes === 0) return { success: false, error: 'Already responded' };

  const updated = db.prepare(`
    SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.id = ?
  `).get(notificationId) as NotificationRow;

  const mappedUpdated = {
    ...updated,
    sender_avatar: avatarUrl({ avatar: updated.sender_avatar }),
  };

  broadcastToUser(userId, { type: 'notification:updated', notification: mappedUpdated });

  return { success: true, notification: mappedUpdated };
}

export {
  createNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markUnread,
  markAllRead,
  deleteNotification,
  deleteAll,
  respondToBoolean,
};

export type { NotificationInput, NotificationRow, NotificationType, NotificationScope, NotificationResponse };
