/**
 * ReminderJobsService — the trip + todo reminder crons in their owning domain
 * (moved from src/scheduler.ts). Proves the bootstrap registration + banners,
 * the per-tick enable gates, the reminder selection windows, the todo 20h
 * dedup via reminded_at, the user-vs-trip scope routing, that a failing
 * tick is contained to a log line, and the claim before each send: a second
 * process skips a claimed reminder, a failed send gives the claim back.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
    return { db, closeDb: () => {}, reinitialize: () => {}, getPlaceWithTags: () => null, canAccessTrip: () => undefined, isOwner: () => false };
});

const logMock = vi.hoisted(() => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));

vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

import { db as testDb } from '../../../src/db/database';
import { createUser, createTrip, createTodoItem, setAppSetting, setNotificationChannels } from '../../helpers/factories';
import { ReminderJobsService } from '../../../src/nest/notifications/reminder-jobs.service';
import { notificationsStub } from '../../helpers/notifications';
import type { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import { createTestAppSettingsRepo, createTestTripsRepo } from '../../helpers/test-uow';
import { createTestTodoItemsRepo } from '../../helpers/todo-repos';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { TodoItemsRepository } from '../../../src/db/repositories/TodoItems.repository';
import { sharedTestOrm } from '../../helpers/test-uow';
import { findRow, updateRows } from '../../helpers/factories/rows';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { TodoItems } from '../../../src/db/entities/TodoItems.entity';

/** The stored reminded_at of a to-do; fails the case when the item is gone. */
async function remindedAtOf(id: number): Promise<string | null | undefined> {
  const todo = await findRow(await sharedTestOrm(testDb), TodoItems, { id });
  if (!todo) throw new Error(`no to-do ${id}`);
  return todo.reminded_at;
}

interface Registered {
  name: string;
  expr: string;
  onTick: () => Promise<void> | void;
}

let appSettingsRepo: AppSettingsRepository;
let tripsRepo: TripsRepository;
let todoItemsRepo: TodoItemsRepository;

function makeJobs(overrides: { notifications?: NotificationsService } = {}) {
  const registered: Registered[] = [];
  const registrar = {
    isEnabled: vi.fn(() => true),
    register: vi.fn((name: string, expr: string, onTick: Registered['onTick']) => {
      registered.push({ name, expr, onTick });
      return true;
    }),
    unregister: vi.fn(),
    // task-6-fix-brief.md item 7: the boot-time banner block now runs through
    // CronRegistrarService.runOnBoot instead of directly inline — this
    // double just runs fn immediately, reproducing the pre-fix behaviour
    // exactly, so every existing assertion below is unaffected.
    runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => { await fn(); }),
  };
  const send = vi.fn().mockResolvedValue({ attempted: 1, delivered: 1 });
  const svc = new ReminderJobsService(
    appSettingsRepo,
    tripsRepo,
    todoItemsRepo,
    overrides.notifications ?? notificationsStub(send),
    registrar as unknown as CronRegistrarService,
  );
  return { svc, registered, registrar, send };
}

/** A trip whose start_date sits exactly `days` ahead, with reminders on. */
/** The UTC calendar date `days` from today, as SQLite's `date('now', '+N days')` renders it. */
const dayFromToday = (days: number): string => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const orm = () => sharedTestOrm(testDb);

async function setTrip(tripId: number, data: { reminder_days?: number; start_date?: string }): Promise<void> {
  await updateRows(await orm(), Trips, { id: tripId }, data);
}

async function setTodo(todoId: number, data: { due_date?: string; assignedUser?: number }): Promise<void> {
  await updateRows(await orm(), TodoItems, { id: todoId }, data);
}

async function tripWithReminder(userId: number, days: number, title = 'Lisbon'): Promise<number> {
  const trip = createTrip(testDb, userId, { title });
  await setTrip(trip.id, { reminder_days: days, start_date: dayFromToday(days) });
  return trip.id;
}

beforeAll(async () => {
  appSettingsRepo = await createTestAppSettingsRepo(testDb);
  tripsRepo = await createTestTripsRepo(testDb);
  todoItemsRepo = await createTestTodoItemsRepo(testDb);
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
  it('RJOB-001 — registers both 9 AM crons under their names', async () => {
    const { svc, registered } = makeJobs();
    await svc.onApplicationBootstrap();
    expect(registered.map(r => [r.name, r.expr])).toEqual([
      ['trip-reminders', '0 9 * * *'],
      ['todo-reminders', '0 9 * * *'],
    ]);
  });

  it('RJOB-002 — does nothing under the test gate (no crons, no banners)', async () => {
    const { svc, registered, registrar } = makeJobs();
    registrar.isEnabled.mockReturnValue(false);
    await svc.onApplicationBootstrap();
    expect(registered).toHaveLength(0);
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('RJOB-002b — the boot banner block goes through CronRegistrarService.runOnBoot (task-6-review-parity.md C1 — the boot-sweep choke point)', async () => {
    const { svc, registrar } = makeJobs();
    await svc.onApplicationBootstrap();
    expect(registrar.runOnBoot).toHaveBeenCalledWith('reminder-jobs-boot', expect.any(Function));
  });

  it('RJOB-003 — logs the enabled banners by default and the disabled ones when toggled off', async () => {
    const { svc } = makeJobs();
    await svc.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith('Trip reminders: enabled via []');
    expect(logMock.logInfo).toHaveBeenCalledWith('Todo due reminders: enabled (lead 3d)');

    logMock.logInfo.mockClear();
    setAppSetting(testDb, 'notify_trip_reminder', 'false');
    setAppSetting(testDb, 'notify_todo_due', 'false');
    const { svc: svc2 } = makeJobs();
    await svc2.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith('Trip reminders: disabled in settings');
    expect(logMock.logInfo).toHaveBeenCalledWith('Todo due reminders: disabled in settings');
  });

  it('RJOB-004 — the trip banner carries the active channels and the reminder-trip count', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email');
    await tripWithReminder(user.id, 5);
    const { svc } = makeJobs();
    await svc.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith('Trip reminders: enabled via [email], 1 trip(s) with active reminders');
  });
});

describe('trip reminder tick', () => {
  it('RJOB-005 — sends for a trip starting exactly reminder_days out and logs the summary', async () => {
    const { user } = createUser(testDb);
    const tripId = await tripWithReminder(user.id, 3);
    await tripWithReminder(user.id, 5, 'Also due'); // its own window lines up too (start = now + reminder_days)
    // A trip whose start date does NOT line up with its reminder window:
    const off = createTrip(testDb, user.id, { title: 'Off-window' });
    await setTrip(off.id, { reminder_days: 2, start_date: dayFromToday(9) });

    const { svc, send } = makeJobs();
    await svc.tripTick();

    const targets = send.mock.calls.map(([p]) => p.targetId);
    expect(targets).toContain(tripId);
    expect(targets).not.toContain(off.id);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event: 'trip_reminder', scope: 'trip', targetId: tripId, params: expect.objectContaining({ trip: 'Lisbon', tripId: String(tripId) }) }));
    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringMatching(/^Trip reminders sent for 2 trip\(s\): /));
  });

  it('RJOB-012: catches up a reminder the job missed, sends each one once, and again for a moved trip', async () => {
    const { user } = createUser(testDb);
    // Due yesterday (start in 2 days, reminder 3 days ahead): the job did not run then.
    const missed = createTrip(testDb, user.id, { title: 'Missed' });
    await setTrip(missed.id, { reminder_days: 3, start_date: dayFromToday(2) });
    // Already started: no reminder any more.
    const started = createTrip(testDb, user.id, { title: 'Started' });
    await setTrip(started.id, { reminder_days: 3, start_date: dayFromToday(-1) });

    const { svc, send } = makeJobs();
    await svc.tripTick();
    expect(send.mock.calls.map(([p]) => p.targetId)).toEqual([missed.id]);

    send.mockClear();
    await svc.tripTick();
    expect(send).not.toHaveBeenCalled();

    await setTrip(missed.id, { start_date: dayFromToday(1) });
    await svc.tripTick();
    expect(send.mock.calls.map(([p]) => p.targetId)).toEqual([missed.id]);
  });

  it('RJOB-006 — the per-tick gate skips everything when notify_trip_reminder is false', async () => {
    const { user } = createUser(testDb);
    await tripWithReminder(user.id, 3);
    setAppSetting(testDb, 'notify_trip_reminder', 'false');
    const { svc, send } = makeJobs();
    await svc.tripTick();
    expect(send).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('RJOB-007 — a failing tick is contained to the check-failed log line', async () => {
    const broken = { send: vi.fn() } as unknown as NotificationsService;
    const throwGone = () => { throw new Error('db gone'); };
    const svc = new ReminderJobsService(
      { getValue: throwGone } as unknown as AppSettingsRepository,
      { listReminderCandidates: throwGone, countActiveWithReminders: throwGone } as unknown as TripsRepository,
      { listDueForReminder: throwGone, claimReminder: throwGone } as unknown as TodoItemsRepository,
      broken,
      { isEnabled: () => true, register: () => true, unregister: () => {} } as unknown as CronRegistrarService,
    );
    await expect(svc.tripTick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Trip reminder check failed: db gone');
    await expect(svc.todoTick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Todo reminder check failed: db gone');
  });
});

describe('trip reminder claims', () => {
  const sentFor = async (id: number) => {
    const trip = await findRow(await orm(), Trips, { id });
    if (!trip) throw new Error(`no trip ${id}`);
    return trip.reminder_sent_for;
  };

  it('RJOB-013: a send that throws gives the claim back, logs it, and the next run sends again', async () => {
    const { user } = createUser(testDb);
    const tripId = await tripWithReminder(user.id, 2);
    const { svc, send } = makeJobs();
    send.mockRejectedValueOnce(new Error('db gone mid-send'));

    await svc.tripTick();
    expect(await sentFor(tripId)).toBeNull();
    expect(logMock.logError).toHaveBeenCalledWith(expect.stringContaining('db gone mid-send'));
    expect(logMock.logWarn).toHaveBeenCalledWith('Trip reminder for "Lisbon" was not delivered; the next run tries again');
    expect(logMock.logInfo).not.toHaveBeenCalledWith(expect.stringMatching(/^Trip reminders sent/));

    await svc.tripTick();
    expect(send).toHaveBeenCalledTimes(2);
    expect(await sentFor(tripId)).not.toBeNull();
  });

  it('RJOB-014: every channel failing is retried, a send nobody wanted is not', async () => {
    const { user } = createUser(testDb);
    const failing = await tripWithReminder(user.id, 2, 'Failing');
    const unwanted = await tripWithReminder(user.id, 3, 'Unwanted');
    const { svc, send } = makeJobs();
    send.mockImplementation(async (payload: { targetId: number }) =>
      payload.targetId === failing ? { attempted: 2, delivered: 0 } : { attempted: 0, delivered: 0 },
    );

    await svc.tripTick();
    expect(await sentFor(failing)).toBeNull();
    expect(await sentFor(unwanted)).not.toBeNull();
  });

  it('RJOB-015: a reminder another process claimed first is not sent again', async () => {
    const { user } = createUser(testDb);
    const tripId = await tripWithReminder(user.id, 2);
    // Both processes read the candidates; the other one claims first.
    const stale = await tripsRepo.listReminderCandidates();
    const start = stale.find((t) => t.id === tripId)!.start_date;
    await expect(tripsRepo.claimReminder(tripId, start)).resolves.toBe(true);
    vi.spyOn(tripsRepo, 'listReminderCandidates').mockResolvedValueOnce(stale);

    const { svc, send } = makeJobs();
    await svc.tripTick();
    expect(send).not.toHaveBeenCalled();
    await expect(tripsRepo.claimReminder(tripId, start)).resolves.toBe(false);
  });
});

describe('todo reminder tick', () => {
  it('RJOB-008 — sends for a due todo, routes trip-scope, stamps reminded_at, and dedups within 20h', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const todo = createTodoItem(testDb, trip.id, { name: 'Pack bags' });
    await setTodo(todo.id, { due_date: dayFromToday(1) });

    const { svc, send } = makeJobs();
    await svc.todoTick();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event: 'todo_due', scope: 'trip', targetId: trip.id, params: expect.objectContaining({ todo: 'Pack bags', trip: 'Lisbon' }) }));
    expect(logMock.logInfo).toHaveBeenCalledWith('Todo reminders sent for 1 item(s)');
    expect(await remindedAtOf(todo.id)).not.toBeNull();

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
    await setTodo(todo.id, { due_date: dayFromToday(0), assignedUser: assignee.id });

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event: 'todo_due', scope: 'user', targetId: assignee.id }));
  });

  it('RJOB-010 — checked, far-future and past-due todos are not selected', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const checked = createTodoItem(testDb, trip.id, { name: 'Done', checked: 1 });
    await setTodo(checked.id, { due_date: dayFromToday(0) });
    const far = createTodoItem(testDb, trip.id, { name: 'Far' });
    await setTodo(far.id, { due_date: dayFromToday(10) });
    const past = createTodoItem(testDb, trip.id, { name: 'Past' });
    await setTodo(past.id, { due_date: dayFromToday(-1) });

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('RJOB-011 — the per-tick gate skips everything when notify_todo_due is false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const todo = createTodoItem(testDb, trip.id, { name: 'Pack bags' });
    await setTodo(todo.id, { due_date: dayFromToday(0) });
    setAppSetting(testDb, 'notify_todo_due', 'false');

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('todo reminder claims', () => {
  async function dueTodo(): Promise<number> {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const todo = createTodoItem(testDb, trip.id, { name: 'Pack bags' });
    await setTodo(todo.id, { due_date: dayFromToday(1) });
    return todo.id;
  }
  const remindedAt = remindedAtOf;

  it('RJOB-016: a failed send gives the claim back, so the next run sends again', async () => {
    const todoId = await dueTodo();
    const { svc, send } = makeJobs();
    send.mockResolvedValueOnce({ attempted: 1, delivered: 0 });

    await svc.todoTick();
    expect(await remindedAt(todoId)).toBeNull();
    expect(logMock.logWarn).toHaveBeenCalledWith('Todo reminder for "Pack bags" was not delivered; the next run tries again');
    expect(logMock.logInfo).not.toHaveBeenCalledWith(expect.stringMatching(/^Todo reminders sent/));

    await svc.todoTick();
    expect(send).toHaveBeenCalledTimes(2);
    expect(await remindedAt(todoId)).not.toBeNull();
  });

  it('RJOB-017: a todo another process claimed first is not sent again', async () => {
    const todoId = await dueTodo();
    const stale = await todoItemsRepo.listDueForReminder(new Date().toISOString().slice(0, 10), '2999-12-31');
    await expect(todoItemsRepo.claimReminder(todoId)).resolves.toBe(true);
    vi.spyOn(todoItemsRepo, 'listDueForReminder').mockResolvedValueOnce(stale);

    const { svc, send } = makeJobs();
    await svc.todoTick();
    expect(send).not.toHaveBeenCalled();
    await expect(todoItemsRepo.claimReminder(todoId)).resolves.toBe(false);
  });
});
