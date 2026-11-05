import type { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { StorageHealthNotifierService } from '../../../../src/nest/notifications/storage-health-notifier.service';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';

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

const savedManaged = process.env.TREK_MANAGED;
afterEach(() => {
  if (savedManaged === undefined) delete process.env.TREK_MANAGED;
  else process.env.TREK_MANAGED = savedManaged;
});

/** The notifier over a fresh event bus and `send`, subscribed the way bootstrap does it. */
function subscribed(send: ReturnType<typeof vi.fn>): StorageEventsService {
  const events = new StorageEventsService();
  const notifier = new StorageHealthNotifierService(events, { send } as unknown as NotificationsService, t.orm);
  notifier.onApplicationBootstrap();
  return events;
}

describe('StorageHealthNotifierService', () => {
  it('NOTIF-001 subscribes on bootstrap and sends an admin-scoped replica_failure with params', () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const events = subscribed(send);
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
    const send = vi.fn().mockRejectedValue(new Error('smtp down'));
    const events = subscribed(send);
    expect(() => events.emitReplicaFailure({ backend: 'b', key: 'k', op: 'delete', error: 'e', at: 3 })).not.toThrow();
  });

  it('NOTIF-003 a managed install sends nothing, since its admins have no row to mute the alert', () => {
    process.env.TREK_MANAGED = '1';
    const send = vi.fn().mockResolvedValue(undefined);
    const events = subscribed(send);
    events.emitReplicaFailure({ backend: 's3-bkp', key: 'backups/db.zip', op: 'put', error: 'timeout', at: 4 });
    expect(send).not.toHaveBeenCalled();
  });
});
