import { AppSettings } from '../../db/entities/AppSettings.entity';
import { TodoItems } from '../../db/entities/TodoItems.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { TodoItemsRepository } from '../../db/repositories/TodoItems.repository';
import { TripsRepository } from '../../db/repositories/Trips.repository';
import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { NotificationsService } from './notifications.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The trip-reminder and todo-due reminder crons, in the domain that owns them
 * (moved from src/scheduler.ts — they were the last consumers of the old
 * notifications bridge, which died with the move). Both run daily at 9 AM
 * app-tz and read their enable gate from app_settings per tick, so toggling
 * notify_trip_reminder / notify_todo_due takes effect at the next run without
 * a restart.
 *
 * Plan 3f Task 4: converted off raw SQL onto `AppSettingsRepository` (the
 * shared `getValue(key)` — RJ1, one of six identical `app_settings` reads
 * across this plan, per R4/the inventory's own duplication note — never a
 * bespoke local wrapper), `TripsRepository` (RJ2/RJ3) and `TodoItemsRepository`
 * (RJ4/RJ5). RJ3/RJ4's column-concatenated `date()` modifiers restructure to
 * plain JS date arithmetic per Task 0's verified R9 shape (`Date.UTC`-based,
 * matching SQLite's own UTC `date('now')`).
 */

// Each todo is reminded at most once per ~24 h (tracked via
// todo_items.reminded_at) so the cron doesn't spam the user every morning
// leading up to the deadline.
const TODO_REMINDER_LEAD_DAYS = 3;

@Injectable()
export class ReminderJobsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(TodoItems) private readonly todoItems: TodoItemsRepository,
    private readonly notifications: NotificationsService,
    private readonly registrar: CronRegistrarService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.registrar.isEnabled()) return;

    // Boot banners only — the enable gates are read per tick below; these
    // reflect the state at boot. Through runOnBoot (task-6-review-parity.md
    // C1: raw SQL today, but the wrap belongs at the entrypoint so it stays
    // safe if this dependency graph goes repository-backed later).
    await this.registrar.runOnBoot('reminder-jobs-boot', async () => {
      try {
        const reminderEnabled = (await this.appSettings.getValue('notify_trip_reminder')) !== 'false';
        const channelsRaw =
          (await this.appSettings.getValue('notification_channels')) ||
          (await this.appSettings.getValue('notification_channel')) ||
          'none';
        const activeChannels = channelsRaw === 'none' ? [] : channelsRaw.split(',').map((c) => c.trim());
        if (!reminderEnabled) {
          logInfo('Trip reminders: disabled in settings');
        } else {
          const tripCount = await this.trips.countActiveWithReminders();
          logInfo(
            `Trip reminders: enabled via [${activeChannels.join(',')}]${tripCount > 0 ? `, ${tripCount} trip(s) with active reminders` : ''}`,
          );
        }

        if ((await this.appSettings.getValue('notify_todo_due')) !== 'false') {
          logInfo(`Todo due reminders: enabled (lead ${TODO_REMINDER_LEAD_DAYS}d)`);
        } else {
          logInfo('Todo due reminders: disabled in settings');
        }
      } catch {
        /* banners are best-effort */
      }
    });

    this.registrar.register('trip-reminders', '0 9 * * *', () => this.tripTick());
    this.registrar.register('todo-reminders', '0 9 * * *', () => this.todoTick());
  }

  /** Daily check for trips starting exactly reminder_days from now. */
  async tripTick(): Promise<void> {
    try {
      if ((await this.appSettings.getValue('notify_trip_reminder')) === 'false') return;

      // RJ3 (Task 0's R9 ruling): the legacy statement concatenated a
      // per-row column (`t.reminder_days`) into a `date('now', '+' ||
      // t.reminder_days || ' days')` modifier — no bound-parameter or
      // JS-constant-spelled helper can express that. Read the narrower
      // candidate set (reminder_days set, start_date set) and do the
      // per-row date-equality check in JS instead. `Date.UTC(...)` matches
      // SQLite's own `date('now')`, which is UTC, not server-local time.
      const candidates = await this.trips.listReminderCandidates();
      const todayUtc = new Date();
      const trips = candidates.filter((t) => {
        const target = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
        target.setUTCDate(target.getUTCDate() + t.reminder_days);
        return t.start_date === target.toISOString().slice(0, 10);
      });

      for (const trip of trips) {
        await this.notifications
          .send({
            event: 'trip_reminder',
            actorId: null,
            scope: 'trip',
            targetId: trip.id,
            params: { trip: trip.title, tripId: String(trip.id) },
          })
          .catch(() => {});
      }

      if (trips.length > 0) {
        logInfo(
          `Trip reminders sent for ${trips.length} trip(s): ${trips.map((t) => `"${t.title}" (${t.reminder_days}d)`).join(', ')}`,
        );
      }
    } catch (err: unknown) {
      logError(`Trip reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** Daily check for unchecked todos due inside the lead window. */
  async todoTick(): Promise<void> {
    try {
      if ((await this.appSettings.getValue('notify_todo_due')) === 'false') return;

      // RJ4 (Task 0's R9 ruling): `date('now', '+' || ? || ' days')`
      // concatenates a bound parameter into the modifier — resolved in JS
      // the same way RJ3 is (`Date.UTC`-based, matching SQLite's UTC
      // `date('now')`). `due_date` is documented as always canonical
      // `YYYY-MM-DD` text, so a direct text-range bind reproduces
      // `date(ti.due_date) <= / >= ...` for well-formed rows.
      const todayUtc = new Date();
      const today = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
      const todayDate = today.toISOString().slice(0, 10);
      const cutoff = new Date(today);
      cutoff.setUTCDate(cutoff.getUTCDate() + TODO_REMINDER_LEAD_DAYS);
      const cutoffDate = cutoff.toISOString().slice(0, 10);

      const todos = await this.todoItems.listDueForReminder(todayDate, cutoffDate);

      for (const todo of todos) {
        const targetScope: 'user' | 'trip' = todo.assigned_user_id ? 'user' : 'trip';
        const targetId = todo.assigned_user_id ?? todo.trip_id;
        await this.notifications
          .send({
            event: 'todo_due',
            actorId: null,
            scope: targetScope,
            targetId,
            params: {
              todo: todo.name,
              trip: todo.trip_title,
              tripId: String(todo.trip_id),
              due: todo.due_date,
            },
          })
          .catch(() => {});
        // RJ5 stays AFTER the send, unchanged (plan3f-inputs.md correction #8).
        await this.todoItems.markReminded(todo.id);
      }

      if (todos.length > 0) {
        logInfo(`Todo reminders sent for ${todos.length} item(s)`);
      }
    } catch (err: unknown) {
      logError(`Todo reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
