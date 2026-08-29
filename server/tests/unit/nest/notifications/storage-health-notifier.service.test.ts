import type { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { StorageHealthNotifierService } from '../../../../src/nest/notifications/storage-health-notifier.service';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';

import { describe, it, expect, vi } from 'vitest';

describe('StorageHealthNotifierService', () => {
  it('NOTIF-001 subscribes on bootstrap and sends an admin-scoped replica_failure with params', () => {
    const events = new StorageEventsService();
    const send = vi.fn().mockResolvedValue(undefined);
    const notifier = new StorageHealthNotifierService(events, { send } as unknown as NotificationsService);
    notifier.onApplicationBootstrap();
    events.emitReplicaFailure({ backend: 's3-bkp', key: 'backups/db.zip', op: 'put', error: 'timeout', at: 1 });
    expect(send).toHaveBeenCalledWith({
      event: 'replica_failure',
      actorId: null,
      scope: 'admin',
      targetId: 0,
      params: { backend: 's3-bkp', key: 'backups/db.zip', op: 'put', error: 'timeout', suppressed: '0' },
    });
    // Second failure inside the window: suppressed, no second send.
    events.emitReplicaFailure({ backend: 's3-bkp', key: 'backups/x.zip', op: 'put', error: 'timeout', at: 2 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('NOTIF-002 a rejected send never throws into the emitter (write path stays safe)', () => {
    const events = new StorageEventsService();
    const send = vi.fn().mockRejectedValue(new Error('smtp down'));
    const notifier = new StorageHealthNotifierService(events, { send } as unknown as NotificationsService);
    notifier.onApplicationBootstrap();
    expect(() => events.emitReplicaFailure({ backend: 'b', key: 'k', op: 'delete', error: 'e', at: 3 })).not.toThrow();
  });
});
