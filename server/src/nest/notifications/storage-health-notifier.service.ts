import { StorageEventsService } from '../storage/storage-events.service';
import { NotificationsService } from './notifications.service';
import { ReplicaFailureDebouncer } from './replica-failure-debouncer';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

const DEBOUNCE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Bridges storage replica failures into the admin notification channels.
 * Lives HERE (not in StorageModule) because NotificationsModule → AuthModule
 * → StorageModule — the reverse import would cycle. Subscribes at bootstrap;
 * the debouncer keeps an outage from becoming a notification storm.
 */
@Injectable()
export class StorageHealthNotifierService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StorageHealthNotifierService.name);
  private readonly debouncer = new ReplicaFailureDebouncer(DEBOUNCE_WINDOW_MS);

  constructor(
    private readonly events: StorageEventsService,
    private readonly notifications: NotificationsService,
  ) {}

  onApplicationBootstrap(): void {
    this.events.onReplicaFailure((failure) => {
      const suppressed = this.debouncer.admit(failure.backend);
      if (suppressed === null) return;
      void this.notifications
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
          this.logger.error(`replica_failure notification failed: ${err instanceof Error ? err.message : String(err)}`);
        });
    });
  }
}
