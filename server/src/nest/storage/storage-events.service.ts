import type { ReplicaFailure } from './drivers/mirror.driver';
import { Injectable } from '@nestjs/common';

/**
 * In-process pub/sub for storage health events. Exists so consumers OUTSIDE
 * StorageModule (the notifications notifier) can observe replica failures
 * without StorageModule importing NotificationsModule — that would cycle
 * (Notifications → Auth → Storage).
 */
@Injectable()
export class StorageEventsService {
  private readonly replicaFailureSubscribers: Array<(failure: ReplicaFailure) => void> = [];

  onReplicaFailure(subscriber: (failure: ReplicaFailure) => void): void {
    this.replicaFailureSubscribers.push(subscriber);
  }

  emitReplicaFailure(failure: ReplicaFailure): void {
    for (const subscriber of this.replicaFailureSubscribers) {
      try {
        subscriber(failure);
      } catch {
        // A broken subscriber must never break the write path.
      }
    }
  }
}
