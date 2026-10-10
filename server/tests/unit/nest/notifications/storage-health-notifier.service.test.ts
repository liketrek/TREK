import type { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { StorageHealthNotifierService } from '../../../../src/nest/notifications/storage-health-notifier.service';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// L4 (task-7-review.md): `orm` is now a required constructor param — in
// production it is always injected, so `@Optional()` was a fail-open seam
// (a DI miswire would silently send without a request context instead of
// refusing to boot). These hand-built doubles pass the shared test ORM
// instead (STORAGE-HEALTH-CTX-001's own precedent for a real one).
const testDb = createSnapshotTestDb();
let t: TestOrm;
beforeAll(async () => {
  t = await createTestOrm(testDb);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('StorageHealthNotifierService', () => {
  it('NOTIF-001 subscribes on bootstrap and sends an admin-scoped replica_failure with params', () => {
    const events = new StorageEventsService();
    const send = vi.fn().mockResolvedValue(undefined);
    const notifier = new StorageHealthNotifierService(events, { send } as unknown as NotificationsService, t.orm);
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
    const notifier = new StorageHealthNotifierService(events, { send } as unknown as NotificationsService, t.orm);
    notifier.onApplicationBootstrap();
    expect(() => events.emitReplicaFailure({ backend: 'b', key: 'k', op: 'delete', error: 'e', at: 3 })).not.toThrow();
  });
});
