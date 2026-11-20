import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { PublicMediaService } from './public-media.service';
import { ThumbnailService } from './thumbnail.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Journey thumbnail cleanup: daily — reclaim journey/thumbs/ objects whose
 * photo row is gone (spec In-scope fix #2: delete sites only started removing
 * the derived thumb with this slice, so historical orphans need a sweeper).
 * The Journey addon gate lives inside sweepOrphanThumbs, so toggling the
 * addon takes effect without a restart. The same pass drops the location-free
 * copies (PublicMediaService) whose source is gone.
 */
@Injectable()
export class JourneyThumbsJob implements OnApplicationBootstrap {
  constructor(
    private readonly thumbnails: ThumbnailService,
    private readonly publicMedia: PublicMediaService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    // Run once on startup to reclaim orphans left over from before this
    // sweeper existed — through runOnBoot (task-6-review-parity.md C1), not
    // the bare `void this.sweep()` this used to be: sweepOrphanThumbs reaches
    // AddonsService.isAddonEnabled, which is repository-backed, and this call
    // has no HTTP request (or registered-tick wrapper) behind it.
    void this.registrar.runOnBoot('journey-thumbs-boot', () => this.sweep());
    this.registrar.register('journey-thumbs', '0 4 * * *', () => {
      void this.sweep();
    });
  }

  async sweep(): Promise<void> {
    await contained('Journey thumbnail cleanup', async () => {
      const removed = await this.thumbnails.sweepOrphanThumbs();
      if (removed > 0) logInfo(`Journey thumbnail cleanup: removed ${removed} orphaned thumbnail(s)`);
    });
    // Its own pass and log line, so one failing never hides or stops the other.
    await contained('Public media cleanup', async () => {
      const renditions = await this.publicMedia.sweepOrphans();
      if (renditions > 0) logInfo(`Public media cleanup: removed ${renditions} location-free copies of deleted media`);
    });
  }
}

/** Runs one cleanup pass and logs its failure under `label` instead of throwing. */
async function contained(label: string, pass: () => Promise<void>): Promise<void> {
  try {
    await pass();
  } catch (err: unknown) {
    logError(`${label}: ${err instanceof Error ? err.message : err}`);
  }
}
