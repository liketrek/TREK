/**
 * Notifications integration tests.
 * Covers NOTIF-001 to NOTIF-014.
 *
 * External SMTP / webhook calls are not made — tests focus on preferences,
 * in-app notification CRUD, and authentication.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../src/services/notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/notifications')>();
  return {
    ...actual,
    testSmtp: vi.fn().mockResolvedValue({ success: true }),
    testWebhook: vi.fn().mockResolvedValue({ success: true }),
  };
});

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createAdmin, disableNotificationPref } from '../helpers/factories';
import { authCookie } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Notification preferences', () => {
  it('NOTIF-001 — GET /api/notifications/preferences returns defaults', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('preferences');
  });

  it('NOTIF-001 — PUT /api/notifications/preferences updates settings', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id))
      .send({ notify_trip_invite: true, notify_booking_change: false });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('preferences');
  });

  it('NOTIF — GET preferences without auth returns 401', async () => {
    const res = await request(app).get('/api/notifications/preferences');
    expect(res.status).toBe(401);
  });
});

describe('In-app notifications', () => {
  it('NOTIF-008 — GET /api/notifications/in-app returns notifications array', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/notifications/in-app')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it('NOTIF-008 — GET /api/notifications/in-app/unread-count returns count', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/notifications/in-app/unread-count')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(typeof res.body.count).toBe('number');
  });

  it('NOTIF-009 — PUT /api/notifications/in-app/read-all marks all read', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/notifications/in-app/read-all')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('NOTIF-010 — DELETE /api/notifications/in-app/all deletes all notifications', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .delete('/api/notifications/in-app/all')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('NOTIF-011 — PUT /api/notifications/in-app/:id/read on non-existent returns 404', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/notifications/in-app/99999/read')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });

  it('NOTIF-012 — DELETE /api/notifications/in-app/:id on non-existent returns 404', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .delete('/api/notifications/in-app/99999')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// New preferences matrix API (NROUTE series)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/notifications/preferences — matrix format', () => {
  it('NROUTE-002 — returns preferences, available_channels, event_types, implemented_combos', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('preferences');
    expect(res.body).toHaveProperty('available_channels');
    expect(res.body).toHaveProperty('event_types');
    expect(res.body).toHaveProperty('implemented_combos');
    expect(res.body.available_channels.inapp).toBe(true);
  });

  it('NROUTE-003 — regular user does not see version_available in event_types', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.event_types).not.toContain('version_available');
  });

  it('NROUTE-004 — user preferences endpoint excludes version_available even for admins', async () => {
    const { user } = createAdmin(testDb);
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.event_types).not.toContain('version_available');
  });

  it('NROUTE-004b — admin notification preferences endpoint returns version_available', async () => {
    const { user } = createAdmin(testDb);
    const res = await request(app)
      .get('/api/admin/notification-preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.event_types).toContain('version_available');
  });

  it('NROUTE-005 — all preferences default to true for new user with no stored prefs', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    const { preferences } = res.body;
    for (const [, channels] of Object.entries(preferences)) {
      for (const [, enabled] of Object.entries(channels as Record<string, boolean>)) {
        expect(enabled).toBe(true);
      }
    }
  });
});

describe('PUT /api/notifications/preferences — matrix format', () => {
  it('NROUTE-007 — disabling a preference persists and is reflected in subsequent GET', async () => {
    const { user } = createUser(testDb);

    const putRes = await request(app)
      .put('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id))
      .send({ trip_invite: { email: false } });

    expect(putRes.status).toBe(200);
    expect(putRes.body.preferences['trip_invite']['email']).toBe(false);

    const getRes = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(getRes.body.preferences['trip_invite']['email']).toBe(false);
  });

  it('NROUTE-008 — re-enabling a preference restores default state', async () => {
    const { user } = createUser(testDb);
    disableNotificationPref(testDb, user.id, 'trip_invite', 'email');

    const res = await request(app)
      .put('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id))
      .send({ trip_invite: { email: true } });

    expect(res.status).toBe(200);
    expect(res.body.preferences['trip_invite']['email']).toBe(true);

    const row = testDb.prepare(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    ).get(user.id, 'trip_invite', 'email');
    expect(row).toBeUndefined();
  });

  it('NROUTE-009 — partial update does not affect other preferences', async () => {
    const { user } = createUser(testDb);
    disableNotificationPref(testDb, user.id, 'booking_change', 'email');

    await request(app)
      .put('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id))
      .send({ trip_invite: { email: false } });

    const getRes = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(getRes.body.preferences['booking_change']['email']).toBe(false);
    expect(getRes.body.preferences['trip_invite']['email']).toBe(false);
    expect(getRes.body.preferences['trip_reminder']['email']).toBe(true);
  });
});

describe('implemented_combos — in-app channel coverage', () => {
  it('NROUTE-010 — implemented_combos includes inapp for all event types', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    const { implemented_combos } = res.body as { implemented_combos: Record<string, string[]> };
    const eventTypes = ['trip_invite', 'booking_change', 'trip_reminder', 'vacay_invite', 'photos_shared', 'collab_message', 'packing_tagged'];
    for (const event of eventTypes) {
      expect(implemented_combos[event], `${event} should support inapp`).toContain('inapp');
      expect(implemented_combos[event], `${event} should support email`).toContain('email');
      expect(implemented_combos[event], `${event} should support webhook`).toContain('webhook');
    }
  });
});

describe('Notification test endpoints', () => {
  it('NOTIF-005 — POST /api/notifications/test-smtp requires admin', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/test-smtp')
      .set('Cookie', authCookie(user.id));
    // Non-admin gets 403
    expect(res.status).toBe(403);
  });

  it('NOTIF-006 — POST /api/notifications/test-webhook returns 400 when url is missing', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/test-webhook')
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(400);
  });

  it('NOTIF-006b — POST /api/notifications/test-webhook returns 400 for invalid URL', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/test-webhook')
      .set('Cookie', authCookie(user.id))
      .send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('NOTIF-005b — admin can call test-smtp and gets a result', async () => {
    const { user } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/notifications/test-smtp')
      .set('Cookie', authCookie(user.id))
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
  });

  it('NOTIF-006c — POST /api/notifications/test-webhook with valid URL calls testWebhook', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/test-webhook')
      .set('Cookie', authCookie(user.id))
      .send({ url: 'https://webhook.site/test-endpoint' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
  });

  it('NOTIF-007 — POST /api/notifications/test-ntfy returns 400 when no topic configured', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/test-ntfy')
      .set('Cookie', authCookie(user.id))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('NOTIF-008 — POST /api/notifications/test-ntfy with explicit topic returns 200', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/test-ntfy')
      .set('Cookie', authCookie(user.id))
      .send({ topic: 'trek-integration-test-topic' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
  });

  it('NOTIF-009 — POST /api/notifications/test-ntfy falls back to user saved topic', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'ntfy_topic', 'saved-user-topic')").run(user.id);

    const res = await request(app)
      .post('/api/notifications/test-ntfy')
      .set('Cookie', authCookie(user.id))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: insert a boolean notification directly into the DB
// ─────────────────────────────────────────────────────────────────────────────

function insertBooleanNotification(recipientId: number): number {
  const result = testDb.prepare(`
    INSERT INTO notifications (
      type, scope, target, sender_id, recipient_id,
      title_key, title_params, text_key, text_params,
      positive_text_key, negative_text_key, positive_callback, negative_callback
    ) VALUES ('boolean', 'user', ?, NULL, ?, 'notif.test.title', '{}', 'notif.test.text', '{}',
      'notif.action.accept', 'notif.action.decline',
      '{"action":"test_approve","payload":{}}', '{"action":"test_deny","payload":{}}'
    )
  `).run(recipientId, recipientId);
  return result.lastInsertRowid as number;
}

function insertSimpleNotification(recipientId: number): number {
  const result = testDb.prepare(`
    INSERT INTO notifications (
      type, scope, target, sender_id, recipient_id,
      title_key, title_params, text_key, text_params
    ) VALUES ('simple', 'user', ?, NULL, ?, 'notif.test.title', '{}', 'notif.test.text', '{}')
  `).run(recipientId, recipientId);
  return result.lastInsertRowid as number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /in-app/:id/respond
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/in-app/:id/respond', () => {
  it('NROUTE-011 — valid positive response returns success and updated notification', async () => {
    const { user } = createUser(testDb);
    const id = insertBooleanNotification(user.id);

    const res = await request(app)
      .post(`/api/notifications/in-app/${id}/respond`)
      .set('Cookie', authCookie(user.id))
      .send({ response: 'positive' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notification).toBeDefined();
    expect(res.body.notification.response).toBe('positive');
  });

  it('NROUTE-012 — invalid response value returns 400', async () => {
    const { user } = createUser(testDb);
    const id = insertBooleanNotification(user.id);

    const res = await request(app)
      .post(`/api/notifications/in-app/${id}/respond`)
      .set('Cookie', authCookie(user.id))
      .send({ response: 'maybe' });

    expect(res.status).toBe(400);
  });

  it('NROUTE-013 — response on non-existent notification returns 400', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/notifications/in-app/99999/respond')
      .set('Cookie', authCookie(user.id))
      .send({ response: 'positive' });

    expect(res.status).toBe(400);
  });

  it('NROUTE-014 — double response returns 400', async () => {
    const { user } = createUser(testDb);
    const id = insertBooleanNotification(user.id);

    await request(app)
      .post(`/api/notifications/in-app/${id}/respond`)
      .set('Cookie', authCookie(user.id))
      .send({ response: 'positive' });

    const res = await request(app)
      .post(`/api/notifications/in-app/${id}/respond`)
      .set('Cookie', authCookie(user.id))
      .send({ response: 'negative' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already responded/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/notification-preferences
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/admin/notification-preferences', () => {
  it('NROUTE-015 — admin can disable email for version_available, persists in GET', async () => {
    const { user } = createAdmin(testDb);

    const putRes = await request(app)
      .put('/api/admin/notification-preferences')
      .set('Cookie', authCookie(user.id))
      .send({ version_available: { email: false } });

    expect(putRes.status).toBe(200);
    expect(putRes.body.preferences['version_available']['email']).toBe(false);

    const getRes = await request(app)
      .get('/api/admin/notification-preferences')
      .set('Cookie', authCookie(user.id));
    expect(getRes.status).toBe(200);
    expect(getRes.body.preferences['version_available']['email']).toBe(false);
  });

  it('NROUTE-016 — non-admin is rejected with 403', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .put('/api/admin/notification-preferences')
      .set('Cookie', authCookie(user.id))
      .send({ version_available: { email: false } });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// In-app CRUD with actual notification data
// ─────────────────────────────────────────────────────────────────────────────

describe('In-app notifications — CRUD with data', () => {
  it('NROUTE-017 — GET /in-app returns created notifications', async () => {
    const { user } = createUser(testDb);
    insertSimpleNotification(user.id);
    insertSimpleNotification(user.id);

    const res = await request(app)
      .get('/api/notifications/in-app')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBe(2);
    expect(res.body.total).toBe(2);
    expect(res.body.unread_count).toBe(2);
  });

  it('NROUTE-018 — unread count reflects actual unread notifications', async () => {
    const { user } = createUser(testDb);
    insertSimpleNotification(user.id);
    insertSimpleNotification(user.id);

    const res = await request(app)
      .get('/api/notifications/in-app/unread-count')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('NROUTE-019 — mark-read on existing notification succeeds and decrements unread count', async () => {
    const { user } = createUser(testDb);
    const id = insertSimpleNotification(user.id);

    const markRes = await request(app)
      .put(`/api/notifications/in-app/${id}/read`)
      .set('Cookie', authCookie(user.id));
    expect(markRes.status).toBe(200);
    expect(markRes.body.success).toBe(true);

    const countRes = await request(app)
      .get('/api/notifications/in-app/unread-count')
      .set('Cookie', authCookie(user.id));
    expect(countRes.body.count).toBe(0);
  });

  it('NROUTE-020 — mark-unread on a read notification succeeds', async () => {
    const { user } = createUser(testDb);
    const id = insertSimpleNotification(user.id);
    // Mark read first
    testDb.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);

    const res = await request(app)
      .put(`/api/notifications/in-app/${id}/unread`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const row = testDb.prepare('SELECT is_read FROM notifications WHERE id = ?').get(id) as { is_read: number };
    expect(row.is_read).toBe(0);
  });

  it('NROUTE-021 — DELETE on existing notification removes it', async () => {
    const { user } = createUser(testDb);
    const id = insertSimpleNotification(user.id);

    const res = await request(app)
      .delete(`/api/notifications/in-app/${id}`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const row = testDb.prepare('SELECT id FROM notifications WHERE id = ?').get(id);
    expect(row).toBeUndefined();
  });

  it('NROUTE-022 — unread_only=true filter returns only unread notifications', async () => {
    const { user } = createUser(testDb);
    const id1 = insertSimpleNotification(user.id);
    insertSimpleNotification(user.id);
    // Mark first one read
    testDb.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id1);

    const res = await request(app)
      .get('/api/notifications/in-app?unread_only=true')
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBe(1);
    expect(res.body.notifications[0].is_read).toBe(0);
  });
});
