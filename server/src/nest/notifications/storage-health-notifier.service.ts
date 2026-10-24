import { withRequestContext } from '../database/request-context';
import { StorageEventsService } from '../storage/storage-events.service';
import { NotificationsService } from './notifications.service';
import { ReplicaFailureDebouncer } from './replica-failure-debouncer';
import { MikroORM } from '@mikro-orm/core';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

const DEBOUNCE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Bridges storage replica failures into the admin notification channels.
 * Lives HERE (not in StorageModule) because NotificationsModule → AuthModule
 * → StorageModule — the reverse import would cycle. Subscribes at bootstrap;
 * the debouncer keeps an outage from becoming a notification storm.
 *
 * Plan 3f Task 4 (R3): Task 0's emitter trace found one ambiguous path — the
 * "Sync now" backfill sweep (`StorageJobsService.startBackfill`) detaches
 * from its originating admin request (`void driver.backfill(...)`,
 * fire-and-forget), so a failure it reports could reach this listener long
 * after that request's own EntityManager fork was meant to be done with. No
 * emitter was found with NO context at all, but wrapping here is cheap
 * insurance regardless (Task 0's own recommendation): the listener now forks
 * its OWN fresh request context on every invocation — the same
 * `withRequestContext` shape `CronRegistrarService.register`'s wrapped tick
 * uses — independent of whatever context (if any) was active at the call
 * site that triggered the failure. `orm` is a required constructor param
 * (L4, task-7-review.md): in production it is always injected, so
 * `@Optional()` was a fail-open seam that existed only to serve hand-built
 * test doubles — a DI miswire would have sent without a request context
 * instead of refusing. A test double now passes the shared test ORM, the
 * same real MikroORM instance STORAGE-HEALTH-CTX-001's full `buildApp()`
 * boot exercises this against.
 */
@Injectable()
export class StorageHealthNotifierService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StorageHealthNotifierService.name);
  private readonly debouncer = new ReplicaFailureDebouncer(DEBOUNCE_WINDOW_MS);

  constructor(
    private readonly events: StorageEventsService,
    private readonly notifications: NotificationsService,
    private readonly orm: MikroORM,
  ) {}

  onApplicationBootstrap(): void {
    this.events.onReplicaFailure((failure) => {
      const suppressed = this.debouncer.admit(failure.backend);
      if (suppressed === null) return;
      const sendNotification = () =>
        this.notifications
          .send({
            event: 'replica_failure',
            actorId: null,
            scope: 'admin',
            targetId: 0,
            params: {
              backend: failure.backend,
              key: failure.key,
              op: failure.op,
              error: failure.error,
              suppressed: String(suppressed),
            },
          })
          .catch((err: unknown) => {
            this.logger.error(
              `replica_failure notification failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          });
      void withRequestContext(this.orm, sendNotification);
    });
  }
}
