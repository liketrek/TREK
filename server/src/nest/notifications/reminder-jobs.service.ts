import { logInfo, logError } from '../audit/audit-log.logger';
import { DatabaseService } from '../database/database.service';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { NotificationsService } from './notifications.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The trip-reminder and todo-due reminder crons, in the domain that owns them
 * (moved from src/scheduler.ts — they were the last consumers of the old
 * notifications bridge, which died with the move). Both run daily at 9 AM
 * app-tz and read their enable gate from app_settings per tick, so toggling
 * notify_trip_reminder / notify_todo_due takes effect at the next run without
 * a restart.
 */

// Each todo is reminded at most once per ~24 h (tracked via
// todo_items.reminded_at) so the cron doesn't spam the user every morning
// leading up to the deadline.
const TODO_REMINDER_LEAD_DAYS = 3;

@Injectable()
export class ReminderJobsService implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationsService,
    private readonly registrar: CronRegistrarService,
  ) {}

  private getSetting(key: string): string | undefined {
    return this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key)?.value;
  }

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;

    // Boot banners only — the enable gates are read per tick below; these
    // reflect the state at boot.
    try {
      const reminderEnabled = this.getSetting('notify_trip_reminder') !== 'false';
      const channelsRaw = this.getSetting('notification_channels') || this.getSetting('notification_channel') || 'none';
      const activeChannels = channelsRaw === 'none' ? [] : channelsRaw.split(',').map((c) => c.trim());
      if (!reminderEnabled) {
        logInfo('Trip reminders: disabled in settings');
      } else {
        const tripCount =
          this.db.get<{ c: number }>(
            'SELECT COUNT(*) as c FROM trips WHERE reminder_days > 0 AND start_date IS NOT NULL',
          )?.c ?? 0;
        logInfo(
          `Trip reminders: enabled via [${activeChannels.join(',')}]${tripCount > 0 ? `, ${tripCount} trip(s) with active reminders` : ''}`,
        );
      }

      if (this.getSetting('notify_todo_due') !== 'false') {
        logInfo(`Todo due reminders: enabled (lead ${TODO_REMINDER_LEAD_DAYS}d)`);
      } else {
        logInfo('Todo due reminders: disabled in settings');
      }
    } catch {
      /* banners are best-effort */
    }

    this.registrar.register('trip-reminders', '0 9 * * *', () => this.tripTick());
    this.registrar.register('todo-reminders', '0 9 * * *', () => this.todoTick());
  }

  /** Daily check for trips starting exactly reminder_days from now. */
  async tripTick(): Promise<void> {
    try {
      if (this.getSetting('notify_trip_reminder') === 'false') return;

      const trips = this.db.all<{ id: number; title: string; user_id: number; reminder_days: number }>(`
        SELECT t.id, t.title, t.user_id, t.reminder_days FROM trips t
        WHERE t.reminder_days > 0
          AND t.start_date IS NOT NULL
          AND t.start_date = date('now', '+' || t.reminder_days || ' days')
      `);

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
      if (this.getSetting('notify_todo_due') === 'false') return;

      // Select unchecked todos with a due date inside the lead window
      // that haven't been reminded in the last 24 hours. `due_date` is
      // stored as a YYYY-MM-DD text; SQLite date() handles it directly.
      const todos = this.db.all<{
        id: number;
        trip_id: number;
        name: string;
        due_date: string;
        assigned_user_id: number | null;
        trip_title: string;
        trip_owner_id: number;
      }>(
        `
        SELECT ti.id, ti.trip_id, ti.name, ti.due_date, ti.assigned_user_id,
               t.title AS trip_title, t.user_id AS trip_owner_id
        FROM todo_items ti
        JOIN trips t ON t.id = ti.trip_id
        WHERE ti.checked = 0
          AND ti.due_date IS NOT NULL
          AND ti.due_date <> ''
          AND date(ti.due_date) <= date('now', '+' || ? || ' days')
          AND date(ti.due_date) >= date('now')
          AND (ti.reminded_at IS NULL OR ti.reminded_at <= datetime('now', '-20 hours'))
      `,
        TODO_REMINDER_LEAD_DAYS,
      );

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
        this.db.run('UPDATE todo_items SET reminded_at = CURRENT_TIMESTAMP WHERE id = ?', todo.id);
      }

      if (todos.length > 0) {
        logInfo(`Todo reminders sent for ${todos.length} item(s)`);
      }
    } catch (err: unknown) {
      logError(`Todo reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
