/**
 * ReminderJobsService — the trip + todo reminder crons in their owning domain
 * (moved from src/scheduler.ts). Proves the bootstrap registration + banners,
 * the per-tick enable gates, the reminder selection windows, the todo 20h
 * dedup via reminded_at, the user-vs-trip scope routing, and that a failing
 * tick is contained to a log line.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { DatabaseService } from '../../../src/nest/database/database.service';
import type { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { ReminderJobsService } from '../../../src/nest/notifications/reminder-jobs.service';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import {
  createUser,
  createTrip,
  createTodoItem,
  setAppSetting,
  setNotificationChannels,
} from '../../helpers/factories';
import { notificationsStub } from '../../helpers/notifications';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => undefined,
      isOwner: () => false,
    },
  };
});

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a'.repeat(64),
  updateJwtSecret: () => {},
}));

interface Registered {
  name: string;
  expr: string;
  onTick: () => Promise<void> | void;
}

function makeJobs(overrides: { notifications?: NotificationsService } = {}) {
  const registered: Registered[] = [];
  const registrar = {
    isEnabled: vi.fn(() => true),
    register: vi.fn((name: string, expr: string, onTick: Registered['onTick']) => {
      registered.push({ name, expr, onTick });
      return true;
    }),
    unregister: vi.fn(),
  };
  const send = vi.fn().mockResolvedValue(undefined);
  const svc = new ReminderJobsService(
    new DatabaseService(testDb),
    overrides.notifications ?? notificationsStub(send),
    registrar as unknown as CronRegistrarService,
  );
  return { svc, registered, registrar, send };
}

/** A trip whose start_date sits exactly `days` ahead, with reminders on. */
function tripWithReminder(userId: number, days: number, title = 'Lisbon'): number {
  const trip = createTrip(testDb, userId, { title });
  testDb
    .prepare("UPDATE trips SET reminder_days = ?, start_date = date('now', '+' || ? || ' days') WHERE id = ?")
    .run(days, days, trip.id);
  return trip.id;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  testDb.exec(`
    DELETE FROM todo_items;
    DELETE FROM app_settings;
    DELETE FROM trip_members;
    DELETE FROM trips;
    DELETE FROM users;
  `);
});

describe('ReminderJobsService bootstrap', () => {
  it('RJOB-001 — registers both 9 AM crons under their names', () => {
    const { svc, registered } = makeJobs();
    svc.onApplicationBootstrap();
    expect(registered.map((r) => [r.name, r.expr])).toEqual([
      ['trip-reminders', '0 9 * * *'],
      ['todo-reminders', '0 9 * * *'],
    ]);
  });

  it('RJOB-002 — does nothing under the test gate (no crons, no banners)', () => {
    const { svc, registered, registrar } = makeJobs();
    registrar.isEnabled.mockReturnValue(false);
    svc.onApplicationBootstrap();
    expect(registered).toHaveLength(0);
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('RJOB-003 — logs the enabled banners by default and the disabled ones when toggled off', () => {
    const { svc } = makeJobs();
    svc.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith('Trip reminders: enabled via []');
    expect(logMock.logInfo).toHaveBeenCalledWith('Todo due reminders: enabled (lead 3d)');

    logMock.logInfo.mockClear();
    setAppSetting(testDb, 'notify_trip_reminder', 'false');
    setAppSetting(testDb, 'notify_todo_due', 'false');
    const { svc: svc2 } = makeJobs();
    svc2.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith('Trip reminders: disabled in settings');
    expect(logMock.logInfo).toHaveBeenCalledWith('Todo due reminders: disabled in settings');
  });

  it('RJOB-004 — the trip banner carries the active channels and the reminder-trip count', () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email');
    tripWithReminder(user.id, 5);
    const { svc } = makeJobs();
    svc.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith(
      'Trip reminders: enabled via [email], 1 trip(s) with active reminders',
    );
  });
});

describe('trip reminder tick', () => {
  it('RJOB-005 — sends for a trip starting exactly reminder_days out and logs the summary', async () => {
    const { user } = createUser(testDb);
    const tripId = tripWithReminder(user.id, 3);
    tripWithReminder(user.id, 5, 'Also due'); // its own window lines up too (start = now + reminder_days)
    // A trip whose start date does NOT line up with its reminder window:
    const off = createTrip(testDb, user.id, { title: 'Off-window' });
    testDb.prepare("UPDATE trips SET reminder_days = 2, start_date = date('now', '+9 days') WHERE id = ?").run(off.id);

    const { svc, send } = makeJobs();
    await svc.tripTick();

    const targets = send.mock.calls.map(([p]) => p.targetId);
    expect(targets).toContain(tripId);
    expect(targets).not.toContain(off.id);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'trip_reminder',
        scope: 'trip',
        targetId: tripId,
        params: expect.objectContaining({ trip: 'Lisbon', tripId: String(tripId) }),
      }),
    );
    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringMatching(/^Trip reminders sent for 2 trip\(s\): /));
  });

  it('RJOB-006 — the per-tick gate skips everything when notify_trip_reminder is false', async () => {
    const { user } = createUser(testDb);
    tripWithReminder(user.id, 3);
    setAppSetting(testDb, 'notify_trip_reminder', 'false');
    const { svc, send } = makeJobs();
    await svc.tripTick();
    expect(send).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('RJOB-007 — a failing tick is contained to the check-failed log line', async () => {
    const broken = { send: vi.fn() } as unknown as NotificationsService;
    const svc = new ReminderJobsService(
      {
        get: () => {
          throw new Error('db gone');
        },
        all: () => {
          throw new Error('db gone');
        },
        run: () => {
          throw new Error('db gone');
        },
      } as unknown as DatabaseService,
      broken,
      { isEnabled: () => true, register: () => true, unregister: () => {} } as unknown as CronRegistrarService,
    );
    await expect(svc.tripTick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Trip reminder check failed: db gone');
    await expect(svc.todoTick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Todo reminder check failed: db gone');
  });
});

describe('todo reminder tick', () => {
  it('RJOB-008 — sends for a due todo, routes trip-scope, stamps reminded_at, and dedups within 20h', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const todo = createTodoItem(testDb, trip.id, { name: 'Pack bags' });
    testDb.prepare("UPDATE todo_items SET due_date = date('now', '+1 day') WHERE id = ?").run(todo.id);

    const { svc, send } = makeJobs();
    await svc.todoTick();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'todo_due',
        scope: 'trip',
        targetId: trip.id,
        params: expect.objectContaining({ todo: 'Pack bags', trip: 'Lisbon' }),
      }),
    );
    expect(logMock.logInfo).toHaveBeenCalledWith('Todo reminders sent for 1 item(s)');
    const { reminded_at } = testDb.prepare('SELECT reminded_at FROM todo_items WHERE id = ?').get(todo.id) as {
      reminded_at: string | null;
    };
    expect(reminded_at).not.toBeNull();

    // The 20h dedup keeps a second same-day run silent.
    send.mockClear();
    await svc.todoTick();
    expect(send).not.toHaveBeenCalled();
  });

  it('RJOB-009 — an assigned todo notifies the assignee (user scope)', async () => {
    const { user } = createUser(testDb);
    const { user: assignee } = createUser(testDb, { email: 'b@example.test', username: 'assignee' });
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const todo = createTodoItem(testDb, trip.id, { name: 'Book train' });
    testDb
      .prepare("UPDATE todo_items SET due_date = date('now'), assigned_user_id = ? WHERE id = ?")
      .run(assignee.id, todo.id);

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'todo_due', scope: 'user', targetId: assignee.id }),
    );
  });

  it('RJOB-010 — checked, far-future and past-due todos are not selected', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const checked = createTodoItem(testDb, trip.id, { name: 'Done', checked: 1 });
    testDb.prepare("UPDATE todo_items SET due_date = date('now') WHERE id = ?").run(checked.id);
    const far = createTodoItem(testDb, trip.id, { name: 'Far' });
    testDb.prepare("UPDATE todo_items SET due_date = date('now', '+10 days') WHERE id = ?").run(far.id);
    const past = createTodoItem(testDb, trip.id, { name: 'Past' });
    testDb.prepare("UPDATE todo_items SET due_date = date('now', '-1 day') WHERE id = ?").run(past.id);

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('RJOB-011 — the per-tick gate skips everything when notify_todo_due is false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const todo = createTodoItem(testDb, trip.id, { name: 'Pack bags' });
    testDb.prepare("UPDATE todo_items SET due_date = date('now') WHERE id = ?").run(todo.id);
    setAppSetting(testDb, 'notify_todo_due', 'false');

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).not.toHaveBeenCalled();
  });
});
