import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { logInfo, logError, logWarn } from '../audit/audit-log.logger';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { TripsRepository } from '../../db/repositories/Trips.repository';
import { TodoItemsRepository } from '../../db/repositories/TodoItems.repository';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { TodoItems } from '../../db/entities/TodoItems.entity';
import { NotificationsService, type NotificationDelivery, type NotificationPayload } from './notifications.service';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { addIsoDays } from '@trek/shared';
import { appClock } from '../common/timezoneService';
import { readAppSetting } from '../common/app-settings.registry';

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

/**
 * Not delivered: the send threw (a DB error resolving the recipients), or it
 * tried in-app and channels and none of them went out. A send nobody wanted
 * (every recipient opted out) counts as done, since a retry would reach no one.
 */
function undelivered(delivery: NotificationDelivery | null): boolean {
  return delivery === null || (delivery.attempted > 0 && delivery.delivered === 0);
}

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
        const reminderEnabled = (await readAppSetting(this.appSettings, 'notify_trip_reminder')) !== 'false';
        const channelsRaw = (await readAppSetting(this.appSettings, 'notification_channels')) || (await readAppSetting(this.appSettings, 'notification_channel')) || 'none';
        const activeChannels = channelsRaw === 'none' ? [] : channelsRaw.split(',').map(c => c.trim());
        if (!reminderEnabled) {
          logInfo('Trip reminders: disabled in settings');
        } else {
          const tripCount = await this.trips.countActiveWithReminders();
          logInfo(`Trip reminders: enabled via [${activeChannels.join(',')}]${tripCount > 0 ? `, ${tripCount} trip(s) with active reminders` : ''}`);
        }

        if ((await readAppSetting(this.appSettings, 'notify_todo_due')) !== 'false') {
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

  /**
   * Daily check for trips whose reminder is due: the reminder day has come,
   * the trip has not started yet, and no reminder went out for this start
   * date. A day the job did not run is caught up on the next one, and a trip
   * moved to a new start date is reminded again. "Today" is the date in the
   * TZ the job is scheduled in, not UTC.
   *
   * Each reminder is claimed before it is sent, so a second process running
   * the same tick skips it, and given back when the send fails, so the next
   * tick retries it until the trip starts.
   *
   * The upgrade backfill (`Migration20200101042100_…`) decides "already
   * reminded" by UTC `date('now')` while this job counts days in the app TZ.
   * That is deliberate, not a seam: the backfill stands in for the job before
   * it, which matched `start_date = date('now', '+N days')` in UTC, so UTC is
   * the clock those reminders went out by. Every UTC day had exactly one 9 AM
   * run, so nothing the backfill marks was left unsent. Its strict `<` leaves
   * the upgrade day's own reminders unmarked, because the boot may come before
   * that day's run; when it comes after, such a trip is reminded once more on
   * the first run after the upgrade. At most one extra reminder, never a lost
   * one, which is why the migration stays as it shipped.
   */
  async tripTick(): Promise<void> {
    try {
      if ((await readAppSetting(this.appSettings, 'notify_trip_reminder')) === 'false') return;

      const today = appClock().date;
      const candidates = await this.trips.listReminderCandidates();
      const trips = candidates.filter((t) =>
        t.reminder_sent_for !== t.start_date
        && t.start_date >= today
        && addIsoDays(t.start_date, -t.reminder_days) <= today);

      const sent: typeof trips = [];
      for (const trip of trips) {
        if (!(await this.trips.claimReminder(trip.id, trip.start_date))) continue;
        const delivery = await this.deliver({ event: 'trip_reminder', actorId: null, scope: 'trip', targetId: trip.id, params: { trip: trip.title, tripId: String(trip.id) } });
        if (undelivered(delivery)) {
          await this.trips.releaseReminder(trip.id, trip.start_date, trip.reminder_sent_for);
          logWarn(`Trip reminder for "${trip.title}" was not delivered; the next run tries again`);
          continue;
        }
        sent.push(trip);
      }

      if (sent.length > 0) {
        logInfo(`Trip reminders sent for ${sent.length} trip(s): ${sent.map(t => `"${t.title}" (${t.reminder_days}d)`).join(', ')}`);
      }
    } catch (err: unknown) {
      logError(`Trip reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** One send, with a failure logged and reported as null instead of ending the tick. */
  private async deliver(payload: NotificationPayload): Promise<NotificationDelivery | null> {
    try {
      return await this.notifications.send(payload);
    } catch (err: unknown) {
      logError(`Reminder ${payload.event} for ${payload.scope} ${payload.targetId} failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  /**
   * Daily check for unchecked todos due inside the lead window. Claimed before
   * the send and given back when it fails, like the trip reminders.
   */
  async todoTick(): Promise<void> {
    try {
      if ((await readAppSetting(this.appSettings, 'notify_todo_due')) === 'false') return;

      // `due_date` is canonical `YYYY-MM-DD` text, so a text-range bind
      // covers the lead window. "Today" is the date in the job's TZ.
      const todayDate = appClock().date;
      const cutoffDate = addIsoDays(todayDate, TODO_REMINDER_LEAD_DAYS);

      const todos = await this.todoItems.listDueForReminder(todayDate, cutoffDate);

      let sent = 0;
      for (const todo of todos) {
        if (!(await this.todoItems.claimReminder(todo.id))) continue;
        const targetScope: 'user' | 'trip' = todo.assigned_user_id ? 'user' : 'trip';
        const targetId = todo.assigned_user_id ?? todo.trip_id;
        const delivery = await this.deliver({
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
        });
        if (undelivered(delivery)) {
          await this.todoItems.releaseReminder(todo.id, todo.reminded_at);
          logWarn(`Todo reminder for "${todo.name}" was not delivered; the next run tries again`);
          continue;
        }
        sent += 1;
      }

      if (sent > 0) {
        logInfo(`Todo reminders sent for ${sent} item(s)`);
      }
    } catch (err: unknown) {
      logError(`Todo reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
