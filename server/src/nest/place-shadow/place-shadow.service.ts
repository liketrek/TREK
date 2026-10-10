import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type {
  PlaceShadowExportResult,
  PlaceShadowPickRequest,
  PlaceShadowRow,
  PlaceShadowSummaryResult,
} from '@trek/shared';
import { PlaceShadowPicks } from '../../db/entities/PlaceShadowPicks.entity';
import type { PlaceShadowPicksRepository, PlaceShadowPickRow } from '../../db/repositories/PlaceShadowPicks.repository';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { readAppSetting } from '../common/app-settings.registry';

/** Rows older than this are removed nightly. */
export const RETENTION_DAYS = 180;

/** Cap on one export page, so a large corpus cannot be pulled in one response. */
export const EXPORT_PAGE_SIZE = 2000;

/**
 * Coordinates are stored at three decimals, matching what the client sends for
 * the bias. That is about 100 m, which is far finer than any ranking decision
 * and far coarser than a home address.
 */
const COORD_DECIMALS = 3;

function round(value: number, decimals = COORD_DECIMALS): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function toRow(r: PlaceShadowPickRow): PlaceShadowRow {
  return {
    id: r.id,
    createdAt: r.created_at,
    query: r.query,
    lang: r.lang,
    biasLat: r.bias_lat,
    biasLng: r.bias_lng,
    source: r.source,
    liveRank: r.live_rank,
    liveCount: r.live_count,
    pickedName: r.picked_name,
    pickedLat: r.picked_lat,
    pickedLng: r.picked_lng,
    pickedPlaceId: r.picked_place_id,
  };
}

/**
 * Records which search result a user actually picked, so a different index can
 * be judged against real queries later.
 *
 * Off unless an admin switches it on, and it reads `=== 'true'` rather than
 * `!== 'false'`: an absent row means off. That is the opposite of the three
 * older places switches, which had to fail open because installs were already
 * using those features when the switches arrived. Nothing is using this one, so
 * the safe default is the silent one — an instance that upgrades and never
 * visits the admin panel logs nothing.
 */
@Injectable()
export class PlaceShadowService {
  constructor(
    @InjectRepository(PlaceShadowPicks) private readonly picks: PlaceShadowPicksRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
  ) {}

  async enabled(): Promise<boolean> {
    const value = await readAppSetting(this.appSettings, 'place_shadow_enabled');
    return value === 'true';
  }

  /**
   * Returns whether the row was written. A disabled log is not an error: the
   * client fires this and forgets it, and a 403 in the console every time
   * somebody adds a place would be noise about a feature that is off on
   * purpose.
   */
  async record(pick: PlaceShadowPickRequest): Promise<boolean> {
    if (!(await this.enabled())) return false;
    // A rank outside the returned list means the client and the server disagree
    // about what was on screen. Storing it would poison the very number the
    // corpus exists to produce, so the row is dropped instead.
    if (pick.liveRank >= pick.liveCount) return false;

    await this.picks.insertPick({
      query: pick.query,
      lang: pick.lang ?? null,
      bias_lat: pick.biasLat === undefined ? null : round(pick.biasLat),
      bias_lng: pick.biasLng === undefined ? null : round(pick.biasLng),
      source: pick.source,
      live_rank: pick.liveRank,
      live_count: pick.liveCount,
      picked_name: pick.pickedName,
      picked_lat: round(pick.pickedLat),
      picked_lng: round(pick.pickedLng),
      picked_place_id: pick.pickedPlaceId ?? null,
    });
    return true;
  }

  /**
   * One page of the corpus, oldest first. `after` is the last id of the
   * previous page; paging by id rather than by offset keeps the pages stable
   * while new rows arrive underneath.
   */
  async export(after?: number, limit = EXPORT_PAGE_SIZE): Promise<PlaceShadowExportResult> {
    const size = Math.min(Math.max(1, limit), EXPORT_PAGE_SIZE);
    const rows = await this.picks.page(after ?? 0, size);
    const page = rows.slice(0, size);
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      rows: page.map(toRow),
      nextAfter: rows.length > size && page.length > 0 ? page[page.length - 1].id : null,
    };
  }

  async summary(): Promise<PlaceShadowSummaryResult> {
    const enabled = await this.enabled();
    const totals = await this.picks.totals();
    const total = totals.total;

    const bySource = await this.picks.countBySource();

    // Buckets rather than a mean: the question is "did the user find it near
    // the top", and an average rank is dragged around by the rare query that
    // scrolled to result 40.
    const ranks = await this.picks.countByLiveRank();
    const counted = (test: (rank: number) => boolean): number =>
      ranks.filter(r => test(r.live_rank)).reduce((sum, r) => sum + r.count, 0);

    const topOne = counted(r => r === 0);
    const topFive = counted(r => r < 5);

    return {
      enabled,
      total,
      oldest: totals.oldest,
      newest: totals.newest,
      retentionDays: RETENTION_DAYS,
      bySource,
      liveRankBuckets: [
        { bucket: '1', count: topOne },
        { bucket: '2-5', count: counted(r => r >= 1 && r < 5) },
        { bucket: '6-10', count: counted(r => r >= 5 && r < 10) },
        { bucket: '11+', count: counted(r => r >= 10) },
      ],
      liveTopOneShare: total ? topOne / total : 0,
      liveTopFiveShare: total ? topFive / total : 0,
    };
  }

  /** Admin wipe. Returns how many rows went. */
  async clear(): Promise<number> {
    return this.picks.deleteAll();
  }

  /** Nightly retention. Returns how many rows went. */
  async purgeExpired(retentionDays = RETENTION_DAYS): Promise<number> {
    return this.picks.purgeOlderThan(retentionDays);
  }
}
