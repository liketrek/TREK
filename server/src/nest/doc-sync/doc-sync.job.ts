import { ADDON_IDS } from '../../addons';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { AddonsService } from '../addons/addons.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { DocSyncConfigService } from './doc-sync-config.service';
import {
  DEFAULT_POLL_INTERVAL_SECONDS,
  MAX_POLL_INTERVAL_SECONDS,
  MIN_POLL_INTERVAL_SECONDS,
  SETTING_POLL_INTERVAL,
  SETTING_SYNC_ENABLED,
} from './doc-sync.constants';
import { DocSyncService } from './doc-sync.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The poll that carries document sync.
 *
 * It is the mechanism, not the fallback. Only Paperless lets TREK subscribe to
 * changes on its own; Papra's webhook API is closed to API keys, Nextcloud's
 * needs admin rights, OpenCloud has no registrable hook, and Synology has
 * nothing at all. On top of that no provider here emits an event for every
 * change that matters: Paperless has no deletion trigger, and a tag change in
 * Papra moves no timestamp. So the run enumerates, and a webhook only ever
 * makes it happen sooner.
 *
 * The addon gate and the interval are re-read per tick rather than at bootstrap
 * so an admin toggling either takes effect without a restart. That differs from
 * the Dawarich job on purpose: this one is driven by a per-trip binding an
 * ordinary user creates, and telling them "restart your server" is not an
 * answer.
 *
 * Which is why the cron itself runs every minute and the tick decides whether it
 * is due: baking the interval into the cron expression at bootstrap (as this
 * did until the claim above was checked against the code) meant a changed
 * interval did nothing until a restart, quietly, while the admin screen said
 * otherwise.
 */
@Injectable()
export class DocSyncJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly sync: DocSyncService,
    private readonly config: DocSyncConfigService,
    private readonly addons: AddonsService,
    private readonly registrar: CronRegistrarService,
  ) {}

  /** When the last pass started; null until the first one, which is never skipped. */
  private lastRunAt: number | null = null;

  async onApplicationBootstrap(): Promise<void> {
    if (!this.registrar.isEnabled()) return;
    // Through runOnBoot (task-6-review-parity.md C1: repository-backed as of
    // Plan 3h Task 5 — the wrap stays at the entrypoint regardless).
    await this.registrar.runOnBoot('docsync-boot', async () => {
      logInfo(`Document sync: polling every ${await this.intervalSeconds()}s`);
    });
    this.registrar.register('docsync', '* * * * *', () => this.tick());
  }

  /**
   * Whether enough time has passed for another pass.
   *
   * The minute the cron wakes up on is not the unit the setting is in, so a
   * 90-second interval must not become one minute or two depending on where the
   * boundaries fall. Comparing against the last run keeps the setting's own
   * resolution; the cost of the extra wake-ups is one read of app_settings.
   */
  private async isDue(now: number): Promise<boolean> {
    // Null rather than 0: comparing against the epoch means "due" only once the
    // clock has passed the interval since 1970, which is true in production and
    // false for any test that picks a small timestamp, a difference that would
    // have hidden here rather than in the behaviour it is supposed to describe.
    if (this.lastRunAt === null) return true;
    return now - this.lastRunAt >= (await this.intervalSeconds()) * 1000;
  }

  private async intervalSeconds(): Promise<number> {
    const raw = (await this.appSettings.getValue(SETTING_POLL_INTERVAL)) ?? undefined;
    const parsed = Number.parseInt(raw || '', 10);
    if (!Number.isFinite(parsed)) return DEFAULT_POLL_INTERVAL_SECONDS;
    return Math.min(MAX_POLL_INTERVAL_SECONDS, Math.max(MIN_POLL_INTERVAL_SECONDS, parsed));
  }

  async tick(): Promise<void> {
    try {
      if (!(await this.addons.isAddonEnabled(ADDON_IDS.DOCUMENTS))) return;
      const killSwitch = (await this.appSettings.getValue(SETTING_SYNC_ENABLED)) ?? undefined;
      // Unrecognised values mean ON here because the setting is absent by
      // default; only an explicit 'false' stops the sync.
      if (killSwitch === 'false') return;

      const now = Date.now();
      if (!(await this.isDue(now))) return;
      this.lastRunAt = now;

      // Cheap, and it catches a binding whose owner left the trip through a
      // path that has no hook to attach to: a transfer, a direct DB edit.
      const orphaned = await this.config.markOrphanedLinks();
      if (orphaned > 0) logInfo(`Document sync: ${orphaned} link(s) orphaned, owner no longer on the trip`);

      const links = await this.sync.dueLinks();
      for (const link of links) {
        // One failing provider must not stop the others: an unreachable NAS on
        // one trip is not a reason to skip a Paperless binding on another.
        try {
          await this.sync.syncLink(link);
        } catch (err: unknown) {
          logError(`Document sync: link ${link.id} failed: ${err instanceof Error ? err.message : err}`);
        }
      }
    } catch (err: unknown) {
      logError(`Document sync tick failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
