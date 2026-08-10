import cron, { type ScheduledTask } from 'node-cron';
import { readEnv } from './app-config';
import path from 'node:path';
import fs from 'node:fs';
import { logInfo, logError } from './nest/audit/audit-log.logger';

const dataDir = path.join(__dirname, '../data');
const backupsDir = path.join(dataDir, 'backups');
const settingsFile = path.join(dataDir, 'backup-settings.json');

const VALID_INTERVALS = ['hourly', 'daily', 'weekly', 'monthly'];
const VALID_DAYS_OF_WEEK = new Set([0, 1, 2, 3, 4, 5, 6]); // 0=Sunday
const VALID_HOURS = new Set(Array.from({length: 24}, (_, i) => i));

interface BackupSettings {
  enabled: boolean;
  interval: string;
  keep_days: number;
  hour: number;
  day_of_week: number;
  day_of_month: number;
}

export function buildCronExpression(settings: BackupSettings): string {
  const hour = VALID_HOURS.has(settings.hour) ? settings.hour : 2;
  const dow = VALID_DAYS_OF_WEEK.has(settings.day_of_week) ? settings.day_of_week : 0;
  const dom = settings.day_of_month >= 1 && settings.day_of_month <= 28 ? settings.day_of_month : 1;

  switch (settings.interval) {
    case 'hourly':  return '0 * * * *';
    case 'daily':   return `0 ${hour} * * *`;
    case 'weekly':  return `0 ${hour} * * ${dow}`;
    case 'monthly': return `0 ${hour} ${dom} * *`;
    default:        return `0 ${hour} * * *`;
  }
}

let currentTask: ScheduledTask | null = null;

function getDefaults(): BackupSettings {
  return { enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 };
}

function loadSettings(): BackupSettings {
  let settings = getDefaults();
  try {
    if (fs.existsSync(settingsFile)) {
      const saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      settings = { ...settings, ...saved };
    }
  } catch (e) {}
  return settings;
}

function saveSettings(settings: BackupSettings): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

/**
 * What the scheduler needs from the Nest container.
 *
 * The shapes are structural on purpose: the scheduler names the capability it
 * wants, never the provider class. Importing BackupService here would drag in
 * src/nest/backup → src/nest/backup/backup.impl → src/scheduler and put the
 * cycle straight back — the same cycle the lazy `await import()` in runBackup
 * existed to dodge.
 *
 * index.ts fills this in from the container after buildApp(), the way
 * bootstrap.ts hands the /mcp handler its registry. Nothing here is resolved at
 * import time, so the scheduler stays loadable without a container (which is
 * what its unit tests rely on).
 */
export interface SchedulerDeps {
  backups: { createBackup(prefix?: 'backup' | 'auto-backup'): Promise<{ filename: string }> };
  placePhotos: { sweepOrphans(): number };
}

let deps: SchedulerDeps | undefined;

/** Hand the scheduler its container-resolved dependencies. Call after app.init(). */
export function setSchedulerDeps(next: SchedulerDeps): void {
  deps = next;
}

async function runBackup(): Promise<void> {
  try {
    // Same archive the admin panel builds, only under the auto-backup name: it
    // snapshots travel.db with VACUUM INTO instead of archiving the live file
    // (the archiver reads its entries during finalize, so a WAL auto-checkpoint
    // landing in between tears the copy), and it carries .encryption_key and the
    // plugin trees — without the key a scheduled backup cannot be decrypted on
    // another install.
    if (!deps) {
      logError('Auto-Backup: skipped, the scheduler was started without its container dependencies');
      return;
    }
    const { filename } = await deps.backups.createBackup('auto-backup');
    logInfo(`Auto-Backup created: ${filename}`);
  } catch (err: unknown) {
    // createBackup removes its own half-written zip before rethrowing.
    logError(`Auto-Backup: ${err instanceof Error ? err.message : err}`);
    return;
  }

  const settings = loadSettings();
  if (settings.keep_days > 0) {
    cleanupOldBackups(settings.keep_days);
  }
}

function autoBackupTimestampMs(filename: string): number | null {
  // auto-backup-2026-04-27T00-00-00.zip → 2026-04-27T00:00:00
  const stamp = filename.slice('auto-backup-'.length, -'.zip'.length);
  const iso = stamp.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export function cleanupOldBackups(keepDays: number, now: number = Date.now()): void {
  try {
    const cutoff = now - keepDays * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('auto-backup-') && f.endsWith('.zip'));
    for (const file of files) {
      const filePath = path.join(backupsDir, file);
      const ageMs = autoBackupTimestampMs(file) ?? fs.statSync(filePath).mtimeMs;
      if (ageMs < cutoff) {
        fs.unlinkSync(filePath);
        logInfo(`Auto-Backup old backup deleted: ${file}`);
      }
    }
  } catch (err: unknown) {
    logError(`Auto-Backup cleanup: ${err instanceof Error ? err.message : err}`);
  }
}

function start(): void {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  const settings = loadSettings();
  if (!settings.enabled) {
    logInfo('Auto-Backup disabled');
    return;
  }

  const expression = buildCronExpression(settings);
  const tz = readEnv().app.tz || 'UTC';
  currentTask = cron.schedule(expression, runBackup, { timezone: tz });
  logInfo(`Auto-Backup scheduled: ${settings.interval} (${expression}), tz: ${tz}, retention: ${settings.keep_days === 0 ? 'forever' : settings.keep_days + ' days'}`);
}

// Demo mode: hourly reset of demo user data
let demoTask: ScheduledTask | null = null;

function startDemoReset(): void {
  if (demoTask) { demoTask.stop(); demoTask = null; }
  if (!readEnv().demo.enabled) return;

  demoTask = cron.schedule('0 * * * *', () => {
    try {
      const { resetDemoUser } = require('./demo/demo-reset');
      resetDemoUser();
    } catch (err: unknown) {
      logError(`Demo reset: ${err instanceof Error ? err.message : err}`);
    }
  });
  logInfo('Demo hourly reset scheduled');
}

// Trip reminders: daily check at 9 AM local time for trips starting tomorrow
let reminderTask: ScheduledTask | null = null;

function startTripReminders(): void {
  if (reminderTask) { reminderTask.stop(); reminderTask = null; }

  try {
    const { db } = require('./db/database');
    const getSetting = (key: string) => (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;
    const reminderEnabled = getSetting('notify_trip_reminder') !== 'false';
    const channelsRaw = getSetting('notification_channels') || getSetting('notification_channel') || 'none';
    const activeChannels = channelsRaw === 'none' ? [] : channelsRaw.split(',').map((c: string) => c.trim());
    if (!reminderEnabled) {
      logInfo('Trip reminders: disabled in settings');
      return;
    }

    const tripCount = (db.prepare('SELECT COUNT(*) as c FROM trips WHERE reminder_days > 0 AND start_date IS NOT NULL').get() as { c: number }).c;
    logInfo(`Trip reminders: enabled via [${activeChannels.join(',')}]${tripCount > 0 ? `, ${tripCount} trip(s) with active reminders` : ''}`);
  } catch {
    return;
  }

  const tz = readEnv().app.tz || 'UTC';
  reminderTask = cron.schedule('0 9 * * *', async () => {
    try {
      const { db } = require('./db/database');
      const { send } = require('./nest/notifications/notifications.bridge');

      const trips = db.prepare(`
        SELECT t.id, t.title, t.user_id, t.reminder_days FROM trips t
        WHERE t.reminder_days > 0
          AND t.start_date IS NOT NULL
          AND t.start_date = date('now', '+' || t.reminder_days || ' days')
      `).all() as { id: number; title: string; user_id: number; reminder_days: number }[];

      for (const trip of trips) {
        await send({ event: 'trip_reminder', actorId: null, scope: 'trip', targetId: trip.id, params: { trip: trip.title, tripId: String(trip.id) } }).catch(() => {});
      }

      if (trips.length > 0) {
        logInfo(`Trip reminders sent for ${trips.length} trip(s): ${trips.map(t => `"${t.title}" (${t.reminder_days}d)`).join(', ')}`);
      }
    } catch (err: unknown) {
      logError(`Trip reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }, { timezone: tz });
}

// Todo due-date reminders: daily check at 9 AM for unchecked todos
// whose due_date falls within the next TODO_REMINDER_LEAD_DAYS days.
// Each todo gets reminded at most once per 24 h (tracked via
// todo_items.reminded_at) so the scheduler doesn't spam the user every
// morning leading up to the deadline.
const TODO_REMINDER_LEAD_DAYS = 3;
let todoReminderTask: ScheduledTask | null = null;

function startTodoReminders(): void {
  if (todoReminderTask) { todoReminderTask.stop(); todoReminderTask = null; }

  const { db } = require('./db/database');
  const getSetting = (key: string) => (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;
  const enabled = getSetting('notify_todo_due') !== 'false';
  if (!enabled) {
    logInfo('Todo due reminders: disabled in settings');
    return;
  }
  logInfo(`Todo due reminders: enabled (lead ${TODO_REMINDER_LEAD_DAYS}d)`);

  const tz = readEnv().app.tz || 'UTC';
  todoReminderTask = cron.schedule('0 9 * * *', async () => {
    try {
      const { send } = require('./nest/notifications/notifications.bridge');

      // Select unchecked todos with a due date inside the lead window
      // that haven't been reminded in the last 24 hours. `due_date` is
      // stored as a YYYY-MM-DD text; SQLite date() handles it directly.
      const todos = db.prepare(`
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
      `).all(TODO_REMINDER_LEAD_DAYS) as {
        id: number; trip_id: number; name: string; due_date: string;
        assigned_user_id: number | null; trip_title: string; trip_owner_id: number;
      }[];

      for (const todo of todos) {
        const targetScope: 'user' | 'trip' = todo.assigned_user_id ? 'user' : 'trip';
        const targetId = todo.assigned_user_id ?? todo.trip_id;
        await send({
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
        }).catch(() => {});
        db.prepare('UPDATE todo_items SET reminded_at = CURRENT_TIMESTAMP WHERE id = ?').run(todo.id);
      }

      if (todos.length > 0) {
        logInfo(`Todo reminders sent for ${todos.length} item(s)`);
      }
    } catch (err: unknown) {
      logError(`Todo reminder check failed: ${err instanceof Error ? err.message : err}`);
    }
  }, { timezone: tz });
}

// Version check: daily at 9 AM — notify admins if a new TREK release is available
let versionCheckTask: ScheduledTask | null = null;

function startVersionCheck(): void {
  if (versionCheckTask) { versionCheckTask.stop(); versionCheckTask = null; }

  const tz = readEnv().app.tz || 'UTC';
  versionCheckTask = cron.schedule('0 9 * * *', async () => {
    try {
      const { checkAndNotifyVersion } = require('./nest/admin/admin.bridge');
      await checkAndNotifyVersion();
    } catch (err: unknown) {
      logError(`Version check: ${err instanceof Error ? err.message : err}`);
    }
  }, { timezone: tz });
}

// Idempotency key cleanup: nightly at 3 AM — delete keys past their TTL.
// The TTL must exceed any realistic offline window: the TREK client replays
// queued mutations with their X-Idempotency-Key when it reconnects, so a key
// GC'd before the device comes back online would let the replay create a
// duplicate. 24h was far too short for a multi-day offline trip; default 30d,
// overridable via IDEMPOTENCY_TTL_SECONDS (default lives in app-config).
let idempotencyCleanupTask: ScheduledTask | null = null;

function idempotencyTtlSeconds(): number {
  return readEnv().session.idempotencyTtlSeconds;
}

interface PurgeDb {
  prepare(sql: string): { run(...args: unknown[]): { changes: number } };
}

/** Delete idempotency keys older than the configured TTL. Returns rows removed.
 *  The db is injectable for testing; the cron job uses the default. */
function purgeExpiredIdempotencyKeys(
  now: number = Date.now(),
  ttlSeconds: number = idempotencyTtlSeconds(),
  database: PurgeDb = require('./db/database').db,
): number {
  const cutoff = Math.floor(now / 1000) - ttlSeconds;
  const result = database.prepare('DELETE FROM idempotency_keys WHERE created_at < ?').run(cutoff);
  return result.changes;
}

function startIdempotencyCleanup(): void {
  if (idempotencyCleanupTask) { idempotencyCleanupTask.stop(); idempotencyCleanupTask = null; }

  const tz = readEnv().app.tz || 'UTC';
  idempotencyCleanupTask = cron.schedule('0 3 * * *', () => {
    try {
      const removed = purgeExpiredIdempotencyKeys();
      if (removed > 0) {
        logInfo(`Idempotency cleanup: removed ${removed} expired key(s)`);
      }
    } catch (err: unknown) {
      logError(`Idempotency cleanup: ${err instanceof Error ? err.message : err}`);
    }
  }, { timezone: tz });
}

// Trek photo cache cleanup: every 2 hours — evict disk files and DB rows past their 1h TTL
/**
 * The cache sweep, reached from outside the container.
 *
 * Constructed per call rather than injected: the cron runs before/independently
 * of any request, and the service holds no state of its own — the stampede
 * guard it does own is a module-scoped Map, deliberately shared with the
 * container instance. Required lazily so a boot without the nest graph (some
 * tests) does not pull it in.
 */
function sweepTrekPhotoCache(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TrekPhotoCacheService } = require('./nest/memories/trek-photo-cache.service');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseService } = require('./nest/database/database.service');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { db } = require('./db/database');
  new TrekPhotoCacheService(new DatabaseService(db)).sweepExpired();
}

let trekPhotoCacheTask: ScheduledTask | null = null;

function startTrekPhotoCacheCleanup(): void {
  if (trekPhotoCacheTask) { trekPhotoCacheTask.stop(); trekPhotoCacheTask = null; }

  // Run once immediately on startup to evict any entries left over from a previous run
  try {
    sweepTrekPhotoCache();
  } catch { /* cache dir may not exist yet — harmless */ }

  trekPhotoCacheTask = cron.schedule('0 */2 * * *', () => {
    try {
      sweepTrekPhotoCache();
    } catch (err: unknown) {
      logError(`Trek photo cache cleanup: ${err instanceof Error ? err.message : err}`);
    }
  });
}

// Place-photo (Google/Wikimedia) cache cleanup: nightly — reclaim cached files and
// meta rows no place references anymore (deleted places/trips, overwritten image_url).
let placePhotoCacheTask: ScheduledTask | null = null;

function startPlacePhotoCacheCleanup(): void {
  if (placePhotoCacheTask) { placePhotoCacheTask.stop(); placePhotoCacheTask = null; }

  const sweep = () => {
    try {
      if (!deps) {
        logError('Place-photo cache cleanup: skipped, the scheduler was started without its container dependencies');
        return;
      }
      const removed = deps.placePhotos.sweepOrphans();
      if (removed > 0) logInfo(`Place-photo cache cleanup: removed ${removed} orphaned file(s)/row(s)`);
    } catch (err: unknown) {
      logError(`Place-photo cache cleanup: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Run once on startup to reclaim orphans left over from before this sweeper existed.
  sweep();

  const tz = readEnv().app.tz || 'UTC';
  placePhotoCacheTask = cron.schedule('30 3 * * *', sweep, { timezone: tz });
}

// AirTrail sync: poll connected instances on an interval and reconcile linked
// flights both ways (#214). The per-tick enable gate (addon + setting) lives in
// runAirtrailSync, so toggling the addon takes effect without a restart.
let airtrailSyncTask: ScheduledTask | null = null;

function startAirTrailSync(): void {
  if (airtrailSyncTask) { airtrailSyncTask.stop(); airtrailSyncTask = null; }

  const { db } = require('./db/database');
  const getSetting = (key: string) => (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;
  const raw = parseInt(getSetting('airtrail_poll_interval_minutes') || '5', 10);
  const minutes = Number.isFinite(raw) && raw >= 1 && raw <= 59 ? raw : 5;
  const tz = readEnv().app.tz || 'UTC';
  logInfo(`AirTrail sync: scheduled every ${minutes}m`);

  airtrailSyncTask = cron.schedule(`*/${minutes} * * * *`, async () => {
    try {
      const { runAirtrailSync } = require('./services/airtrail/airtrailSync');
      await runAirtrailSync();
    } catch (err: unknown) {
      logError(`AirTrail sync tick failed: ${err instanceof Error ? err.message : err}`);
    }
  }, { timezone: tz });
}

function stop(): void {
  if (currentTask) { currentTask.stop(); currentTask = null; }
  if (demoTask) { demoTask.stop(); demoTask = null; }
  if (reminderTask) { reminderTask.stop(); reminderTask = null; }
  if (versionCheckTask) { versionCheckTask.stop(); versionCheckTask = null; }
  if (idempotencyCleanupTask) { idempotencyCleanupTask.stop(); idempotencyCleanupTask = null; }
  if (trekPhotoCacheTask) { trekPhotoCacheTask.stop(); trekPhotoCacheTask = null; }
  if (placePhotoCacheTask) { placePhotoCacheTask.stop(); placePhotoCacheTask = null; }
  if (airtrailSyncTask) { airtrailSyncTask.stop(); airtrailSyncTask = null; }
}

export { start, stop, startDemoReset, startTripReminders, startTodoReminders, startVersionCheck, startIdempotencyCleanup, purgeExpiredIdempotencyKeys, startTrekPhotoCacheCleanup, startPlacePhotoCacheCleanup, startAirTrailSync, loadSettings, saveSettings, VALID_INTERVALS };
