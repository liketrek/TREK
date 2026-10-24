/**
 * registration-invites.service.test.ts
 *
 * DB-centric unit tests for RegistrationInvitesService against a real in-memory
 * SQLite database. The cases moved here with the methods, out of
 * admin.service.test.ts; the ADMIN-SVC-* case IDs are preserved so the history
 * stays greppable. Constructed directly (no TestingModule, repo convention).
 */
import { db as testDb } from '../../../src/db/database';
import { InviteTokens } from '../../../src/db/entities/InviteTokens.entity';
import { RegistrationInvitesService } from '../../../src/nest/auth/registration-invites.service';
import { asLegacyResult } from '../../helpers/domain-error';
import { createUser, createAdmin, createTrip, createInviteToken } from '../../helpers/factories';
import { countRows, findRow, insertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestInviteTokensRepo, createTestTripsRepo } from '../../helpers/test-uow';
import { sharedTestOrm } from '../../helpers/test-uow';

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => undefined, isOwner: () => false };
});

let svc: RegistrationInvitesService;

beforeAll(async () => {
  svc = new RegistrationInvitesService(await createTestInviteTokensRepo(testDb), await createTestTripsRepo(testDb));
});
beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});
afterAll(() => {
  testDb.close();
});

// ── Invites ───────────────────────────────────────────────────────────────────

describe('Invites', () => {
  it('ADMIN-SVC-024 — createInvite returns invite with token', async () => {
    const { user: admin } = createAdmin(testDb);
    const result = (await svc.createInvite(admin.id, { max_uses: 5 })) as any;
    expect(result.invite.token).toBeDefined();
    expect(result.invite.max_uses).toBe(5);
  });

  it('ADMIN-SVC-025 — createInvite defaults to 1 use', async () => {
    const { user: admin } = createAdmin(testDb);
    const result = (await svc.createInvite(admin.id, {})) as any;
    expect(result.uses).toBe(1);
  });

  it('ADMIN-SVC-026 — listInvites returns array', async () => {
    const { user: admin } = createAdmin(testDb);
    await svc.createInvite(admin.id, {});
    const invites = (await svc.listInvites()) as any[];
    expect(invites.length).toBeGreaterThanOrEqual(1);
  });

  it('ADMIN-SVC-027 — deleteInvite removes invite', async () => {
    const { user: admin } = createAdmin(testDb);
    const invite = createInviteToken(testDb, { created_by: admin.id }) as any;
    const result = (await asLegacyResult(svc.deleteInvite(String(invite.id)))) as any;
    expect(result.error).toBeUndefined();
    const check = await findRow(await sharedTestOrm(testDb), InviteTokens, { id: invite.id });
    expect(check).toBeNull();
  });

  it('ADMIN-SVC-028 — deleteInvite returns 404 for non-existent invite', async () => {
    const result = (await asLegacyResult(svc.deleteInvite('99999'))) as any;
    expect(result.status).toBe(404);
  });

  it("ADMIN-SVC-029 — deleteInvite('0x10') is the legacy 404, not a hex-literal delete of invite id 16 (Plan 3b Task 3 review, F2)", async () => {
    const { user: admin } = createAdmin(testDb);
    await insertRow(await sharedTestOrm(testDb), InviteTokens, {
      id: 16,
      token: 'hex-survivor',
      max_uses: 1,
      used_count: 0,
      expires_at: null,
      createdByRef: admin.id,
    });

    const result = await asLegacyResult(svc.deleteInvite('0x10'));

    expect(result).toEqual({ error: 'Invite not found', status: 404 });
    expect(await findRow(await sharedTestOrm(testDb), InviteTokens, { id: 16 })).not.toBeNull();
  });
});

describe('Invites — trip binding', () => {
  it('ADMIN-SVC-073 — createInvite 404s on a trip_id that does not resolve', async () => {
    const { user: admin } = createAdmin(testDb);
    await expect(svc.createInvite(admin.id, { trip_id: 99999 })).rejects.toMatchObject({
      status: 404,
      publicMessage: 'Trip not found',
    });
    await expect(svc.createInvite(admin.id, { trip_id: 'not-a-number' })).rejects.toMatchObject({ status: 404 });
    expect(await countRows(await sharedTestOrm(testDb), InviteTokens)).toBe(0);
    // An absent/blank binding is still a plain registration invite.
    expect(((await svc.createInvite(admin.id, {})) as any).tripId).toBeNull();
  });
});
