import { MailIngestAddresses } from '../../db/entities/MailIngestAddresses.entity';
import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import type { MailIngestAddressesRepository } from '../../db/repositories/MailIngestAddresses.repository';
import type { MailIngestCursorRepository } from '../../db/repositories/MailIngestCursor.repository';
import { dbNow } from '../../db/types';
import { logError } from '../audit/audit-log.logger';
import { CronRegistrarService, LEASE_OWNER } from '../scheduling/cron-registrar.service';
import { MailIngestNotifyService } from './mail-ingest-notify.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** How long a run holds the notice before another process may take it over. */
const LEASE_MS = 10 * 60 * 1000;
/** The notice's row in the readers' cursor table: transport `notice`, this as its mailbox. */
const PAUSED = 'paused';

/**
 * Tells every person who holds a forwarding address, once, that the import
 * stopped: on the TREK Cloud a plan without it switches it off from outside
 * the server, and an admin can switch it off in the dialog. Checked every
 * hour. The notice's cursor row notes the pause it announced, and forgets it
 * once the import is back, so the next pause is announced again. A person
 * who switched their own import off hears nothing, having nothing to lose.
 */
@Injectable()
export class MailIngestPauseJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MailIngestCursor) private readonly cursor: MailIngestCursorRepository,
    @InjectRepository(MailIngestAddresses) private readonly addresses: MailIngestAddressesRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly notify: MailIngestNotifyService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('mail-ingest-pause-notice', '25 * * * *', () => this.tick());
  }

  /**
   * One run; answers how many people it told.
   *
   * @txIndependent the pause is noted before anyone is told, so a run that
   * dies halfway never tells anyone twice; each notice stands on its own.
   */
  async tick(now: Date = new Date()): Promise<number> {
    if (await this.settings.isAvailable()) {
      if ((await this.cursor.find('notice', PAUSED))?.last_ok_at) await this.cursor.forgetOk('notice', PAUSED);
      return 0;
    }
    const until = dbNow(new Date(now.getTime() + LEASE_MS));
    if (!(await this.cursor.acquireLease('notice', PAUSED, LEASE_OWNER, until, dbNow(now)))) return 0;
    try {
      if ((await this.cursor.find('notice', PAUSED))?.last_ok_at) return 0;
      const people = await this.peopleToTell();
      await this.cursor.recordOk('notice', PAUSED, dbNow(now));
      await Promise.all(people.map((userId) => this.notify.importPaused(userId)));
      return people.length;
    } catch (err) {
      logError(`[mail-ingest] The pause notice failed: ${err instanceof Error ? err.message : String(err)}`);
      return 0;
    } finally {
      await this.cursor.releaseLease('notice', PAUSED, LEASE_OWNER);
    }
  }

  /** The holders of a live address who have their own import on. */
  private async peopleToTell(): Promise<number[]> {
    const holders = await this.addresses.listHolders();
    const enabled = await Promise.all(holders.map(async (userId) => (await this.settings.prefsOf(userId)).enabled));
    return holders.filter((_, i) => enabled[i]);
  }
}
