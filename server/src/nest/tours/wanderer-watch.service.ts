import { TourSourceHints } from '../../db/entities/TourSourceHints.entity';
import { TOUR_SOURCE_HINT_CHANGES } from '../../db/json-columns';
import type {
  TourSourceHintListRow,
  TourSourceHintRow,
  TourSourceHintsRepository,
  WatchedSourceRow,
} from '../../db/repositories/TourSourceHints.repository';
import { dbNow, utcSuffix } from '../../db/types';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { AddonsService } from '../addons/addons.service';
import { logError } from '../audit/audit-log.logger';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { NotificationsService } from '../notifications/notifications.service';
import { WandererService, type WandererTrailLook, type WandererWatchLooks } from '../wanderer/wanderer.service';
import {
  backoffMs,
  isNewHint,
  verdictOf,
  WATCH_CONNECTIONS_PER_RUN,
  WATCH_RECHECK_MS,
  WATCH_SOURCES_PER_RUN,
  type WatchVerdict,
} from './wanderer-watch.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TourSourceHint, TourSourceHintResponse, WandererSourceHintItem, WandererWatch } from '@trek/shared';

/** A hint as it goes out: the stored changes read back, the look's time in ISO. */
function hintOf(row: TourSourceHintRow): TourSourceHint {
  return {
    state: row.state,
    changes: decodeJson(TOUR_SOURCE_HINT_CHANGES, row.changes, `hint ${row.place_id}`),
    reason: row.reason,
    externalUpdated: row.external_updated,
    checkedAt: utcSuffix(row.checked_at) ?? '',
  };
}

function itemOf(row: TourSourceHintListRow): WandererSourceHintItem {
  return {
    ...hintOf(row),
    placeId: row.place_id,
    tripId: row.trip_id,
    tripTitle: row.trip_title,
    tourName: row.tour_name,
  };
}

/** A look that had nothing due: no trail asked, nothing read. */
const NOTHING_READ: WandererWatchLooks = { ok: true, looks: new Map() };

interface Finding {
  source: WatchedSourceRow;
  verdict: WatchVerdict;
}

/**
 * WAN-02: the optional background watch over a user's own wanderer snapshots.
 *
 * Off until the user switches it on for their connection. A run looks, within
 * the budget of `wanderer-watch.helpers.ts`, at the small records of the
 * trails the user imported into trips they can still open, and writes per
 * snapshot what the record suggests. New hints reach the user as a
 * notification that leads to the tour, where the manual check (MF-03) reads
 * the source in full and a confirmed reimport takes a change in.
 *
 * It never writes a tour, never downloads a GPX and never asks through anyone
 * else's connection. A removed connection, the switch off, a refused token or
 * wanderer switched off by the admin end the looks; the hints and snapshots
 * already there stay.
 */
@Injectable()
export class WandererWatchService {
  /** A run still going when the next is due is not started twice in this process. */
  private running = false;

  constructor(
    private readonly addons: AddonsService,
    private readonly wanderer: WandererService,
    private readonly notifications: NotificationsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(TourSourceHints) private readonly hints: TourSourceHintsRepository,
  ) {}

  /**
   * The cron's entry: every connection that may be asked now, one after another.
   *
   * @txIndependent one transaction per user: each user's hints land whole with
   * the note of the run, after a look at their own instance over the network, and
   * one user that fails keeps no other from theirs.
   */
  async run(now: Date = new Date()): Promise<void> {
    if (this.running || !(await this.addons.isWandererAvailable())) return;
    this.running = true;
    try {
      const userIds = await this.wanderer.watchableUserIds(dbNow(now), WATCH_CONNECTIONS_PER_RUN);
      await userIds.reduce(async (previous, userId) => {
        await previous;
        // One instance that fails must not keep the others from their turn.
        await this.watchUser(userId, now).catch((err: unknown) => {
          logError(`wanderer watch failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`);
        });
      }, Promise.resolve());
    } finally {
      this.running = false;
    }
  }

  /**
   * One user's due snapshots. An instance that fails is left alone for longer
   * after each failure in a row; the hints already there stay as they are.
   */
  private async watchUser(userId: number, now: Date): Promise<void> {
    const instance = await this.wanderer.instanceOf(userId);
    const checkedBefore = dbNow(new Date(now.getTime() - WATCH_RECHECK_MS));
    const due = await this.hints.listDue(userId, instance, checkedBefore, WATCH_SOURCES_PER_RUN);
    // Nothing due asks the instance nothing.
    const ids = due.map((source) => source.external_id);
    const read = ids.length > 0 ? await this.wanderer.lookAtTrails(userId, ids) : NOTHING_READ;
    if (!read.ok) {
      const failures = (await this.wanderer.watchState(userId)).failures + 1;
      await this.wanderer.noteWatchRun(userId, {
        lastRunAt: dbNow(now),
        failures,
        pausedUntil: dbNow(new Date(now.getTime() + backoffMs(failures))),
      });
      return;
    }
    const findings = due.map((source) => ({ source, verdict: verdictOf(source, read.looks.get(source.external_id)) }));
    await this.uow.transactional(async () => {
      await this.hints.record(
        findings.map(({ source, verdict }) => ({
          place_id: source.place_id,
          user_id: userId,
          state: verdict.state,
          changes: verdict.changes.length > 0 ? encodeJson(TOUR_SOURCE_HINT_CHANGES, verdict.changes) : null,
          reason: verdict.reason,
          external_updated: lookedUpdated(read.looks.get(source.external_id)),
          checked_at: dbNow(now),
        })),
      );
      await this.wanderer.noteWatchRun(userId, { lastRunAt: dbNow(now), failures: 0, pausedUntil: null });
    });
    await this.announce(
      userId,
      findings.filter(({ source, verdict }) => isNewHint(source, verdict)),
    );
  }

  /**
   * Tell the user about the hints they have not heard of, one notification per
   * tour so each leads to its own.
   * @txStandalone the notices stand on their own; a failed one never undoes what the look wrote
   */
  private async announce(userId: number, fresh: readonly Finding[]): Promise<void> {
    if (fresh.length === 0) return;
    const rows = new Map((await this.hints.listOpen(userId)).map((row) => [row.place_id, row]));
    await fresh.reduce(async (previous, { source, verdict }) => {
      await previous;
      const row = rows.get(source.place_id);
      if (!row || !verdict.state) return;
      await this.notifications
        .send({
          event: 'wanderer_source_hint',
          actorId: null,
          scope: 'user',
          targetId: userId,
          params: {
            state: verdict.state,
            tour: row.tour_name,
            trip: row.trip_title,
            tripId: String(row.trip_id),
            placeId: String(row.place_id),
          },
        })
        .catch((err: unknown) => {
          logError(`wanderer watch notice for ${source.place_id}: ${err instanceof Error ? err.message : String(err)}`);
        });
    }, Promise.resolve());
  }

  /** The watch of the user's connection, with the open hints. */
  async status(userId: number): Promise<WandererWatch> {
    const state = await this.wanderer.watchState(userId);
    return {
      enabled: state.enabled,
      connected: state.connected,
      lastRunAt: utcSuffix(state.lastRunAt),
      pausedUntil: utcSuffix(state.pausedUntil),
      blocked: state.blocked,
      hints: state.connected ? (await this.hints.listOpen(userId)).map(itemOf) : [],
    };
  }

  /** Switch the watch on or off; switching it off ends further looks at once. */
  async setEnabled(userId: number, enabled: boolean, clientIp: string | null): Promise<WandererWatch> {
    await this.wanderer.setWatch(userId, enabled, clientIp);
    return await this.status(userId);
  }

  /** The caller's own open hint on one snapshot of the trip; null when there is none. */
  async hintFor(tripId: string, userId: number, placeId: string): Promise<TourSourceHintResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    const row = tid === null || pid === null ? undefined : await this.hints.findOpen(userId, tid, pid);
    return { hint: row ? hintOf(row) : null };
  }

  /**
   * A manual check read the source in full: what it found is what the user has
   * seen now, so their open hint goes and later looks compare with this.
   * @txStandalone the note of what the user saw stands on its own; the check around it writes nothing else
   */
  async noteSeen(
    placeId: number,
    userId: number,
    seen: { contentHash: string; externalUpdated: string | null },
  ): Promise<void> {
    await this.hints.markSeen(placeId, userId, { ...seen, checkedAt: dbNow() });
  }
}

/** The change time a look read, kept for the hint to show; none when the trail could not be read. */
function lookedUpdated(look: WandererTrailLook | undefined): string | null {
  return look?.kind === 'record' ? look.updated : null;
}
