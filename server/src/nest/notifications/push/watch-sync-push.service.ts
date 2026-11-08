import { logError } from '../../audit/audit-log.logger';
import { withRequestContext } from '../../database/request-context';
import { RealtimeService } from '../../realtime/realtime.service';
import { TripMembershipService } from '../../trip-membership/trip-membership.service';
import { WebPushService } from '../transports/web-push.service';
import { MikroORM } from '@mikro-orm/core';
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

/**
 * How long the changes of one trip are gathered into one sync. Ticking off a
 * list goes in runs, and Apple throttles background pushes to a device that
 * gets too many, so a run of ticks becomes one push a couple of seconds later.
 */
export const WATCH_SYNC_SETTLE_MS = 2000;

/** The lists the watch shows: the packing lists (items and bags) and the to-dos. */
const LIST_EVENT = /^(packing|todo):/;

interface PendingSync {
  timer: ReturnType<typeof setTimeout>;
  /** A change everyone on the trip sees; otherwise only `users` (a private packing item). */
  everyone: boolean;
  users: Set<number>;
}

/**
 * Keeps the Apple Watches of a trip's members current while their iPhone app is
 * in the background. The watch only gets what its phone sends it, and a phone
 * app in the background hears nothing over the WebSocket, so a tick by someone
 * else used to reach a watch only once its phone app was next opened.
 *
 * Every trip broadcast of a list event (whoever made it, over REST, MCP or a
 * plugin's RPC) is noted here; a couple of seconds later each member with the
 * iPhone app gets a silent push (WebPushService.sendWatchSync), which wakes the
 * app to read the lists and pass them to its watch. The push carries no content
 * and no trip: the app reads what it needs from this server with its own
 * session. A private packing item syncs only its owner.
 */
@Injectable()
export class WatchSyncPushService implements OnModuleInit, OnModuleDestroy {
  private readonly pending = new Map<string, PendingSync>();
  private stopListening: (() => void) | null = null;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly push: WebPushService,
    private readonly membership: TripMembershipService,
    private readonly orm: MikroORM,
  ) {}

  onModuleInit(): void {
    this.stopListening = this.realtime.onTripBroadcast((tripId, eventType, onlyUserId) =>
      this.note(tripId, eventType, onlyUserId),
    );
  }

  onModuleDestroy(): void {
    this.stopListening?.();
    this.stopListening = null;
    for (const entry of this.pending.values()) clearTimeout(entry.timer);
    this.pending.clear();
  }

  /** A broadcast went out: a list event joins its trip's next sync. */
  note(tripId: number | string, eventType: string, onlyUserId?: number): void {
    if (!LIST_EVENT.test(eventType)) return;
    const key = String(tripId);
    let entry = this.pending.get(key);
    if (!entry) {
      const timer = setTimeout(() => void this.flush(key), WATCH_SYNC_SETTLE_MS);
      // A sync still waiting never holds the process open on shutdown.
      timer.unref?.();
      entry = { timer, everyone: false, users: new Set() };
      this.pending.set(key, entry);
    }
    if (onlyUserId == null) entry.everyone = true;
    else entry.users.add(onlyUserId);
  }

  /** Everyone on the trip: the owner and the members. */
  private async roster(tripId: string): Promise<Set<number>> {
    const [owner, members] = await Promise.all([
      this.membership.getOwnerId(tripId),
      this.membership.listMemberUserIds(tripId),
    ]);
    const users = new Set(members);
    if (owner != null) users.add(owner);
    return users;
  }

  /** Sends one trip's gathered sync. */
  async flush(key: string): Promise<void> {
    const entry = this.pending.get(key);
    if (!entry) return;
    this.pending.delete(key);
    clearTimeout(entry.timer);
    try {
      const users = entry.everyone ? await withRequestContext(this.orm, () => this.roster(key)) : entry.users;
      await Promise.all([...users].map((userId) => this.push.sendWatchSync(userId)));
    } catch (err) {
      logError(`Watch sync failed trip=${key}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
