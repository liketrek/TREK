import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { SkiAreasService } from './ski-areas.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The daily look at the Places host's winter layer (spec 7.2): when it serves
 * a new build, the index is fetched, and every area kept here whose graph
 * changed is fetched again, so a planner opening a tour tomorrow does not
 * wait for it. Area files unused for 90 days go. Nothing runs while TREK
 * Places is switched off.
 */
/** How many changed areas are downloaded at once. */
const REFRESH_CONCURRENCY = 2;

@Injectable()
export class SkiAreasJob implements OnApplicationBootstrap {
  constructor(
    private readonly areas: SkiAreasService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('ski-areas', '40 4 * * *', () => this.tick());
  }

  async tick(): Promise<void> {
    try {
      const swept = await this.areas.sweep(Date.now());
      if (swept > 0) logInfo(`[Ski] ${swept} ski area files unused for 90 days removed`);
      if (!this.areas.enabled()) return;
      if ((await this.areas.refresh()) !== 'updated') return;
      await this.refreshKept();
    } catch (err: unknown) {
      logError(`[Ski] daily ski area check: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * The areas kept here whose graph the new build changed, fetched again two
   * at a time so a build that changed many does not open dozens of downloads
   * against the host at once. Once the host's breaker opens the rest wait:
   * their kept copies still plan, and a planner that needs one fetches it.
   */
  private async refreshKept(): Promise<void> {
    const index = await this.areas.index();
    if (!index) return;
    const kept = await this.areas.keptAreas();
    const changed = index.areas.filter((area) =>
      kept.some((copy) => copy.id === area.row.id && copy.sha8 !== area.row.sha256.slice(0, 8)),
    );
    if (changed.length === 0) return;
    const pending = [...changed];
    let fetched = 0;
    // One area at a time per lane, the next asked only once the last is in.
    const fetchOne = async (): Promise<void> => {
      if (this.areas.placesHeldBack()) return;
      const area = pending.shift();
      if (!area) return;
      try {
        if (!(await this.areas.ensureArea(area.row)).stale) fetched += 1;
      } catch {
        // The kept copy stays; the next planner to need the area asks again.
      }
      return fetchOne();
    };
    await Promise.all(Array.from({ length: REFRESH_CONCURRENCY }, fetchOne));
    const left = pending.length;
    logInfo(
      `[Ski] ${fetched} of ${changed.length} kept ski areas fetched anew` +
        (left > 0 ? `, ${left} left for later while TREK Places is unreachable` : ''),
    );
  }
}
