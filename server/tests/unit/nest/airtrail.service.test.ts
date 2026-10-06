/**
 * `AirtrailService` — 3h L3 carry (`phase3h-reports/task-7-review.md`'s L3:
 * "`users.airtrail_api_key` has no at-rest pin"). The credential lives in a
 * plain `users` column, not a dedicated secrets table, so this is the
 * service-level pin `dawarich.service.test.ts`'s DAWARICH-SVC-050 already
 * gives the Dawarich connection: save through the real service, read the raw
 * column, assert it is `enc:v1:`-prefixed ciphertext (never the plaintext),
 * and assert `getAirtrailCredentials` round-trips it back to the original
 * value. The database is real in-memory SQLite (`createSnapshotTestDb()`) —
 * a stubbed repository would only prove some string was handed along, and
 * "the key is never in the column as typed" is the one thing worth pinning.
 * `checkSsrf` and the `AirtrailClient` are the only two fakes: both would
 * otherwise leave the process.
 */
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { AuditService } from '../../../src/nest/audit/audit.service';
import type { AirtrailClient } from '../../../src/nest/integrations/airtrail.client';
import { AirtrailService } from '../../../src/nest/integrations/airtrail.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { checkSsrf } = vi.hoisted(() => ({ checkSsrf: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf,
  safeFetch: vi.fn(),
}));

const testDb = createSnapshotTestDb();
let t: TestOrm;
let usersRepo: UsersRepository;
let svc: AirtrailService;
const listFlights = vi.fn();

beforeAll(async () => {
  t = await createTestOrm(testDb);
  usersRepo = t.repo(Users);
  svc = new AirtrailService(usersRepo, new AuditService(t.repo(AuditLog), usersRepo), {
    listFlights,
  } as unknown as AirtrailClient);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  checkSsrf.mockReset();
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false });
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawAirtrailKey(userId: number): string | null {
  return (
    testDb.prepare('SELECT airtrail_api_key FROM users WHERE id = ?').get(userId) as { airtrail_api_key: string | null }
  ).airtrail_api_key;
}

describe('AirtrailService — at-rest encryption (3h L3)', () => {
  it('AIRTRAIL-SVC-ENC-001: saveSettings stores the key enc:v1:-prefixed, never as typed, and round-trips through getAirtrailCredentials', async () => {
    const { user } = createUser(testDb);

    await svc.saveSettings(user.id, 'https://airtrail.example.test', 'super-secret-key', false, false, null);

    const stored = rawAirtrailKey(user.id);
    expect(stored).toMatch(/^enc:v1:/);
    expect(stored).not.toContain('super-secret-key');

    const creds = await svc.getAirtrailCredentials(user.id);
    expect(creds?.apiKey).toBe('super-secret-key');
  });

  it('AIRTRAIL-SVC-ENC-002: a second save with a new key re-encrypts to a different ciphertext that still round-trips', async () => {
    const { user } = createUser(testDb);
    await svc.saveSettings(user.id, 'https://airtrail.example.test', 'first-key', false, false, null);
    const first = rawAirtrailKey(user.id);

    await svc.saveSettings(user.id, 'https://airtrail.example.test', 'second-key', false, false, null);
    const second = rawAirtrailKey(user.id);

    expect(second).toMatch(/^enc:v1:/);
    expect(second).not.toBe(first);
    expect(second).not.toContain('second-key');
    expect((await svc.getAirtrailCredentials(user.id))?.apiKey).toBe('second-key');
  });
});
