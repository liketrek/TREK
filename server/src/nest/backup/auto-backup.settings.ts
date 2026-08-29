import { logInfo, logError } from '../audit/audit-log.logger';
import type { StorageService } from '../storage/storage.service';

import fs from 'node:fs';
import path from 'node:path';

/**
 * Auto-backup settings and retention — the pure half of the auto-backup cron
 * (moved from src/scheduler.ts). Stays a plain module beside backup.impl.ts
 * for the same reason that does: file I/O against data/backup-settings.json,
 * no container state. AutoBackupJob owns the scheduling and passes its
 * injected StorageService into cleanupOldBackups — retention addresses the
 * backups category through the facade so expired archives leave mirror
 * replicas too.
 */

const dataDir = path.join(__dirname, '../../../data');
const settingsFile = path.join(dataDir, 'backup-settings.json');

export const VALID_INTERVALS = ['hourly', 'daily', 'weekly', 'monthly'];
const VALID_DAYS_OF_WEEK = new Set([0, 1, 2, 3, 4, 5, 6]); // 0=Sunday
const VALID_HOURS = new Set(Array.from({ length: 24 }, (_, i) => i));

export interface BackupSettings {
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
    case 'hourly':
      return '0 * * * *';
    case 'daily':
      return `0 ${hour} * * *`;
    case 'weekly':
      return `0 ${hour} * * ${dow}`;
    case 'monthly':
      return `0 ${hour} ${dom} * *`;
    default:
      return `0 ${hour} * * *`;
  }
}

function getDefaults(): BackupSettings {
  return { enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 };
}

export function loadSettings(): BackupSettings {
  let settings = getDefaults();
  try {
    if (fs.existsSync(settingsFile)) {
      const saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      settings = { ...settings, ...saved };
    }
  } catch {
    /* corrupt settings file — fall back to the defaults */
  }
  return settings;
}

export function saveSettings(settings: BackupSettings): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

function autoBackupTimestampMs(filename: string): number | null {
  // auto-backup-2026-04-27T00-00-00.zip → 2026-04-27T00:00:00
  const stamp = filename.slice('auto-backup-'.length, -'.zip'.length);
  const iso = stamp.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export async function cleanupOldBackups(
  storage: StorageService,
  keepDays: number,
  now: number = Date.now(),
): Promise<void> {
  try {
    const cutoff = now - keepDays * 24 * 60 * 60 * 1000;
    for await (const obj of storage.list('backups')) {
      if (obj.key.includes('/')) continue; // list() recurses; retention is top-level-only like the readdir it replaces
      if (!obj.key.startsWith('auto-backup-') || !obj.key.endsWith('.zip')) continue; // manual backup-*.zip is never auto-deleted
      const ageMs = autoBackupTimestampMs(obj.key) ?? obj.mtimeMs;
      if (ageMs < cutoff) {
        await storage.delete('backups', obj.key); // fans out to mirror replicas too
        logInfo(`Auto-Backup old backup deleted: ${obj.key}`);
      }
    }
  } catch (err: unknown) {
    logError(`Auto-Backup cleanup: ${err instanceof Error ? err.message : err}`);
  }
}
