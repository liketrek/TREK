import { readEnv } from '../../app-config';
import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { StorageService } from '../storage/storage.service';
import {
  buildCronExpression,
  cleanupOldBackups,
  loadSettings,
  saveSettings,
  type BackupSettings,
} from './auto-backup.settings';
import { parseAutoBackupBody } from './backup.impl';
import { BackupService } from './backup.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The auto-backup cron, in the domain that owns it (moved from
 * src/scheduler.ts). The job is dynamic: its expression comes from
 * data/backup-settings.json, so saving new settings re-arms it via start() —
 * the same method onApplicationBootstrap uses, replacing the old
 * scheduler.start() restart that backup.impl reached out of the container for.
 */
@Injectable()
export class AutoBackupJob implements OnApplicationBootstrap {
  constructor(
    private readonly backup: BackupService,
    private readonly registrar: CronRegistrarService,
    private readonly storage: StorageService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.start();
  }

  /** (Re)arm the cron from the settings file — also the restart path after a settings save. */
  start(): void {
    const settings = loadSettings();
    if (!settings.enabled) {
      this.registrar.unregister('auto-backup');
      logInfo('Auto-Backup disabled');
      return;
    }

    const expression = buildCronExpression(settings);
    const tz = readEnv().app.tz || 'UTC';
    const armed = this.registrar.register('auto-backup', expression, () => this.runBackup());
    if (armed) {
      logInfo(
        `Auto-Backup scheduled: ${settings.interval} (${expression}), tz: ${tz}, retention: ${settings.keep_days === 0 ? 'forever' : settings.keep_days + ' days'}`,
      );
    }
  }

  async runBackup(): Promise<void> {
    try {
      // Same archive the admin panel builds, only under the auto-backup name: it
      // snapshots travel.db with VACUUM INTO instead of archiving the live file
      // (the archiver reads its entries during finalize, so a WAL auto-checkpoint
      // landing in between tears the copy), and it carries .encryption_key and the
      // plugin trees — without the key a scheduled backup cannot be decrypted on
      // another install.
      const { filename } = await this.backup.createBackup('auto-backup');
      logInfo(`Auto-Backup created: ${filename}`);
    } catch (err: unknown) {
      // createBackup removes its own half-written zip before rethrowing.
      logError(`Auto-Backup: ${err instanceof Error ? err.message : err}`);
      return;
    }

    const settings = loadSettings();
    if (settings.keep_days > 0) {
      await cleanupOldBackups(this.storage, settings.keep_days);
    }
  }

  getAutoSettings(): { settings: BackupSettings; timezone: string } {
    const tz = readEnv().app.tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return { settings: loadSettings(), timezone: tz };
  }

  updateAutoSettings(body: Record<string, unknown>): BackupSettings {
    const settings = parseAutoBackupBody(body);
    saveSettings(settings);
    this.start();
    return settings;
  }
}
