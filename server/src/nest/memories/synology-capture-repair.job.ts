import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import type { TrekPhotosRepository } from '../../db/repositories/TrekPhotos.repository';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { SettingsService } from '../settings/settings.service';
import { PhotoCaptureBackfillService } from './photo-capture-backfill.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** The app_settings row that says every Synology photo has been asked again. */
export const SYNOLOGY_CAPTURE_REPAIR_DONE_KEY = 'synology_capture_repair_3019' as const;
/** How many starts have tried so far, while some photo could not be confirmed. */
export const SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY = 'synology_capture_repair_3019_tries' as const;

const PROVIDER = 'synologyphotos';
const PAGE = 200;
/**
 * Starts that try again while photos stay unconfirmed. A NAS that was off for
 * one restart gets its photos put right on the next; one taken away for good
 * is not asked on every start forever.
 */
const MAX_TRIES = 3;

/**
 * One pass over every Synology photo on the first start after #3019.
 *
 * Until then the capture time and GPS of a Synology photo were read from the
 * item one after it, which on many libraries is the next photo: journeys came
 * out in the wrong order with pins in the wrong places, and nobody can edit a
 * photo's capture time to put it right. The lookup now names the photo itself
 * (SynologyService.getSynologyAssetInfo), and this asks again for every row,
 * through each owner's own library, and puts in what Synology confirms.
 * A photo it cannot confirm keeps what it has; on a library that was right all
 * along the answers are the same and nothing changes.
 *
 * Not a cron: once the stored rows are right, the fixed lookup keeps them so.
 * In the background through `CronRegistrarService.runOnBoot`, like the other
 * boot repairs: the server does not wait for it.
 */
@Injectable()
export class SynologyCaptureRepairJob implements OnApplicationBootstrap {
  constructor(
    private readonly backfill: PhotoCaptureBackfillService,
    private readonly registrar: CronRegistrarService,
    private readonly settings: SettingsService,
    @InjectRepository(TrekPhotos) private readonly trekPhotos: TrekPhotosRepository,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    void this.registrar.runOnBoot('synology-capture-repair-boot', () => this.runOnce());
  }

  /**
   * The pages after `after`, one after the other: each page's lookups run at
   * once, held to a few per library by the backfill's slots.
   */
  private async walk(after: number): Promise<{ changed: number; failed: number }> {
    const page = await this.trekPhotos.listByProviderAfter(PROVIDER, after, PAGE);
    if (page.length === 0) return { changed: 0, failed: 0 };
    const outcomes = await Promise.all(page.map((photo) => this.backfill.reconfirm(photo.id, photo.owner_id)));
    const rest = await this.walk(page.at(-1)?.id ?? after);
    return {
      changed: rest.changed + outcomes.filter((o) => o === 'changed').length,
      failed: rest.failed + outcomes.filter((o) => o === 'failed').length,
    };
  }

  async runOnce(): Promise<void> {
    try {
      if ((await this.settings.getAppSetting(SYNOLOGY_CAPTURE_REPAIR_DONE_KEY)) !== null) return;
      const tries = Number(await this.settings.getAppSetting(SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY)) || 0;

      const { changed, failed } = await this.walk(0);

      if (failed > 0 && tries + 1 < MAX_TRIES) {
        await this.settings.setAppSettings({ [SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY]: String(tries + 1) });
      } else {
        await this.settings.setAppSettings({ [SYNOLOGY_CAPTURE_REPAIR_DONE_KEY]: new Date().toISOString() });
        await this.settings.deleteAppSettings([SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY]);
      }
      if (changed + failed > 0) {
        logInfo(
          `Synology capture repair: ${changed} photo(s) given their own capture time and place, ${failed} not confirmed by their library`,
        );
      }
    } catch (err: unknown) {
      logError(`Synology capture repair: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
