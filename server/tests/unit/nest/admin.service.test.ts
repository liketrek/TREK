/**
 * Unit tests for the DI-native AdminService — ADMIN-SVC-001 through
 * ADMIN-SVC-069, moved 1:1 from tests/unit/services/adminService.test.ts with
 * the 2026-08 fold (IDs preserved, including the pre-existing 029/030 gap and
 * the duplicated 069). The packing-template cases (031-044, 056-064) moved with
 * their functions to tests/unit/nest/packing.service.test.ts.
 * Constructs the service directly over a real in-memory SQLite DB (repo
 * convention — no TestingModule). Focuses on validation/error branches that the
 * integration tests don't exercise. VCJOB-001 pins the version-check cron path
 * (it replaced ADMIN-BR-001 when the old admin bridge died with the cron move).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { ADDON_IDS, MCP_GATED_ADDON_IDS } from '../../../src/addons';

// ── DB setup ──────────────────────────────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  encrypt_api_key: (v: string) => v,
  decrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: (v: string) => v,
}));
vi.mock('../../../src/mcp', () => ({
  revokeUserSessions: vi.fn(),
  invalidateMcpSessions: vi.fn(),
}));
vi.mock('../../../src/mcp/sessionManager', () => ({
  revokeUserSessions: vi.fn(),
  revokeUserSessionsForClient: vi.fn(),
}));
vi.mock('../../../src/demo/demo-reset', () => ({
  saveBaseline: vi.fn(),
}));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createUserWithMfa, createAdmin, createInviteToken } from '../../helpers/factories';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createTestAddonsService } from '../../helpers/test-addons';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { WebauthnConfigService } from '../../../src/nest/auth/webauthn-config.service';
import { AuthService } from '../../../src/nest/auth/auth.service';
import { PasskeyService } from '../../../src/nest/auth/passkey.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { AdminService } from '../../../src/nest/admin/admin.service';
import { VersionCheckJob } from '../../../src/nest/admin/version-check.job';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { __clearVersionCacheForTests } from '../../../src/nest/admin/admin.helpers';
import { makeNotificationsService, makeNotificationPreferencesService } from '../../helpers/notifications';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { AllowedFileTypesService } from '../../../src/nest/files/allowed-file-types.service';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestUsersRepo,
  createTestWebauthnCredentialsRepo,
  createTestWebauthnChallengesRepo,
  createTestInviteTokensRepo,
  createTestMcpTokensRepo,
  createTestOauthTokensRepo,
  createTestPasswordResetTokensRepo,
  createTestTripsRepo,
  createTestTripMembersRepo,
  createTestSettingsRepo,
  createTestPlacesRepo,
  sharedTestOrm,
} from '../../helpers/test-uow';
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import type { AuditLogRepository } from '../../../src/db/repositories/AuditLog.repository';
import { Addons } from '../../../src/db/entities/Addons.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { PhotoProviderFields } from '../../../src/db/entities/PhotoProviderFields.entity';
import { DocumentProviders } from '../../../src/db/entities/DocumentProviders.entity';
import { TripFiles } from '../../../src/db/entities/TripFiles.entity';
import { PushSubscriptions } from '../../../src/db/entities/PushSubscriptions.entity';
import type { McpTokensRepository } from '../../../src/db/repositories/McpTokens.repository';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import { createTestShareTokensRepo, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from '../../helpers/share-repos';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { createTestJourneysRepo, createTestJourneyEntriesRepo, createTestJourneyContributorsRepo } from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';
import { createTestPushSubscriptionsRepo } from '../../helpers/notifications-repos';

const realtime = new RealtimeService();

let webauthn: WebauthnConfigService;

// Positional and previously wrong: an AtlasService sat in the membership slot
// and the mailer was missing entirely, so `auth` was built with its last four
// collaborators shifted by one. Nothing failed, because none of the cases below
// reach a path that uses them.

let permissions: PermissionsService;
let userCleanup: UserCleanupService;
let auth: AuthService;
let svc: AdminService;
let mcpTokensRepo: McpTokensRepository;
let auditLogRepo: AuditLogRepository;
beforeAll(async () => {
  webauthn = new WebauthnConfigService(await createTestAppSettingsRepo(testDb));
  permissions = new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb));
  userCleanup = new UserCleanupService((await sharedTestOrm(testDb)).em, new BudgetService(permissions, new ExchangeRatesService(), realtime, await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb))), await createTestUnitOfWork(testDb), await createTestUsersRepo(testDb), await createTestTripMembersRepo(testDb), await createTestBudgetItemsRepo(testDb), await createTestJourneyShareTokensRepo(testDb), await createTestJourneysRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestJourneyContributorsRepo(testDb), await createTestShareTokensRepo(testDb), await createTestPluginsRepo(testDb), await createTestPluginUserErasureQueueRepo(testDb));
  auth = new AuthService(
    permissions, new TripMembershipService(await createTestTripsRepo(testDb), await createTestTripMembersRepo(testDb)), webauthn, userCleanup, new MailerService(await createTestUsersRepo(testDb), await createTestSettingsRepo(testDb), await createTestAppSettingsRepo(testDb)), new EphemeralTokenService(), new AllowedFileTypesService(await createTestAppSettingsRepo(testDb)), await createTestUnitOfWork(testDb),
    await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), await createTestInviteTokensRepo(testDb), await createTestMcpTokensRepo(testDb),
    await createTestOauthTokensRepo(testDb), await createTestWebauthnCredentialsRepo(testDb), await createTestPasswordResetTokensRepo(testDb),
    await createTestPushSubscriptionsRepo(testDb),
  );
  const t = await sharedTestOrm(testDb);
  mcpTokensRepo = await createTestMcpTokensRepo(testDb);
  auditLogRepo = t.repo(AuditLog);
  svc = new AdminService(
  await createTestUsersRepo(testDb),
  auditLogRepo,
  await createTestAppSettingsRepo(testDb),
  t.repo(Addons),
  t.repo(PhotoProviders),
  t.repo(PhotoProviderFields),
  t.repo(DocumentProviders),
  mcpTokensRepo,
  await createTestOauthTokensRepo(testDb),
  await createTestTripsRepo(testDb),
  await createTestPlacesRepo(testDb),
  t.repo(TripFiles),
  t.repo(PushSubscriptions),
  await createTestAddonsService(testDb),
  new PasskeyService(auth, webauthn, await createTestUnitOfWork(testDb), await createTestWebauthnCredentialsRepo(testDb), await createTestWebauthnChallengesRepo(testDb), await createTestUsersRepo(testDb)),
  auth,
  permissions,
  await makeNotificationsService(testDb, realtime),
  userCleanup,
  realtime,
  await createTestUnitOfWork(testDb),
);
});

// Legacy free-function names bound to the service, so the moved cases below read
// exactly as they did before the fold.
const listUsers = () => svc.listUsers();
const svcCreateUser = (d: Parameters<AdminService['createUser']>[0]) => svc.createUser(d);
const updateUser = (id: string, d: Parameters<AdminService['updateUser']>[1]) => svc.updateUser(id, d);
const deleteUser = (id: string, actingId: number) => svc.deleteUser(id, actingId);
const getStats = () => svc.getStats();
const getPermissions = () => svc.getPermissions();
const savePermissions = (p: Record<string, string>) => svc.savePermissions(p);
const getAuditLog = (q: { limit?: string; offset?: string }) => svc.getAuditLog(q);
const saveDemoBaseline = () => svc.saveDemoBaseline();
const getGithubReleases = (perPage?: string, page?: string) => svc.getGithubReleases(perPage, page);
const checkVersion = () => svc.checkVersion();
const listAddons = () => svc.listAddons();
const updateAddon = (id: string, d: Parameters<AdminService['updateAddon']>[1]) => svc.updateAddon(id, d);

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── listUsers ─────────────────────────────────────────────────────────────────

describe('listUsers', () => {
  it('ADMIN-SVC-001 — returns all users with online:false', async () => {
    createUser(testDb);
    createUser(testDb);
    const users = (await listUsers()) as any[];
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.every((u: any) => u.online === false)).toBe(true);
  });
});

// ── createUser ────────────────────────────────────────────────────────────────

describe('createUser (service)', () => {
  it('ADMIN-SVC-002 — creates a user successfully', async () => {
    const result = (await svcCreateUser({ username: 'newuser', email: 'new@test.com', password: 'ValidPass1!' })) as any;
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('new@test.com');
  });

  it('ADMIN-SVC-003 — returns 400 when username is missing', async () => {
    const result = (await svcCreateUser({ username: '', email: 'x@x.com', password: 'ValidPass1!' })) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-004 — returns 400 for invalid role', async () => {
    const result = (await svcCreateUser({ username: 'u1', email: 'u1@test.com', password: 'ValidPass1!', role: 'superuser' })) as any;
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/invalid role/i);
  });

  it('ADMIN-SVC-005 — returns 409 for duplicate username', async () => {
    createUser(testDb);
    const { user } = createUser(testDb);
    const result = (await svcCreateUser({ username: user.username, email: 'unique@test.com', password: 'ValidPass1!' })) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-006 — returns 409 for duplicate email', async () => {
    const { user } = createUser(testDb);
    const result = (await svcCreateUser({ username: 'uniqueuser', email: user.email, password: 'ValidPass1!' })) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-007 — returns 400 for weak password', async () => {
    const result = (await svcCreateUser({ username: 'weakpwuser', email: 'weakpw@test.com', password: 'short' })) as any;
    expect(result.status).toBe(400);
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('ADMIN-SVC-008 — updates username successfully', async () => {
    const { user } = createUser(testDb);
    const result = (await updateUser(String(user.id), { username: 'updatedname' })) as any;
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('updatedname');
  });

  it('ADMIN-SVC-009 — returns 404 for non-existent user', async () => {
    const result = (await updateUser('99999', { username: 'ghost' })) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-010 — returns 400 for invalid role', async () => {
    const { user } = createUser(testDb);
    const result = (await updateUser(String(user.id), { role: 'superadmin' })) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-011 — returns 409 when username is taken', async () => {
    const { user: u1 } = createUser(testDb);
    const { user: u2 } = createUser(testDb);
    const result = (await updateUser(String(u2.id), { username: u1.username })) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-012 — returns 409 when email is taken', async () => {
    const { user: u1 } = createUser(testDb);
    const { user: u2 } = createUser(testDb);
    const result = (await updateUser(String(u2.id), { email: u1.email })) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-013 — returns 400 for weak password', async () => {
    const { user } = createUser(testDb);
    const result = (await updateUser(String(user.id), { password: 'weak' })) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-014 — tracks changed fields in result', async () => {
    const { user } = createUser(testDb);
    const result = (await updateUser(String(user.id), { username: 'newname', role: 'admin' })) as any;
    expect(result.changed).toContain('username');
    expect(result.changed).toContain('role');
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────

describe('deleteUser', () => {
  it('ADMIN-SVC-015 — deletes user successfully', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user } = createUser(testDb);
    const result = await deleteUser(String(user.id), admin.id) as any;
    expect(result.email).toBe(user.email);
  });

  it('ADMIN-SVC-016 — returns 400 when deleting own account', async () => {
    const { user: admin } = createAdmin(testDb);
    const result = await deleteUser(String(admin.id), admin.id) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-017 — returns 404 for non-existent user', async () => {
    const { user: admin } = createAdmin(testDb);
    const result = await deleteUser('99999', admin.id) as any;
    expect(result.status).toBe(404);
  });
});

// ── getStats ──────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('ADMIN-SVC-018 — returns numeric counts for all stats', async () => {
    const stats = (await getStats()) as any;
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalTrips).toBe('number');
    expect(typeof stats.totalPlaces).toBe('number');
    expect(typeof stats.totalFiles).toBe('number');
  });
});

// ── getPermissions / savePermissions ─────────────────────────────────────────

describe('Permissions', () => {
  it('ADMIN-SVC-019 — getPermissions returns an array of actions', async () => {
    const result = await getPermissions() as any;
    expect(Array.isArray(result.permissions)).toBe(true);
    expect(result.permissions.length).toBeGreaterThan(0);
  });

  it('ADMIN-SVC-020 — savePermissions persists a permission change', async () => {
    await savePermissions({ trip_create: 'admin' });
    const result = await getPermissions() as any;
    const perm = result.permissions.find((p: any) => p.key === 'trip_create');
    expect(perm.level).toBe('admin');
  });
});

// ── getAuditLog ───────────────────────────────────────────────────────────────

describe('getAuditLog', () => {
  it('ADMIN-SVC-021 — returns entries array with total', async () => {
    const result = (await getAuditLog({})) as any;
    expect(Array.isArray(result.entries)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(0);
  });

  it('ADMIN-SVC-022 — respects limit and offset params', async () => {
    const result = (await getAuditLog({ limit: '10', offset: '0' })) as any;
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it('ADMIN-SVC-023 — caps limit at 500', async () => {
    const result = (await getAuditLog({ limit: '9999' })) as any;
    expect(result.limit).toBe(500);
  });
});

// ── getAuditLog — JSON details parsing ───────────────────────────────────────

describe('getAuditLog — JSON details', () => {
  it('ADMIN-SVC-045 — parses JSON details when present', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
      user.id, 'test_action', JSON.stringify({ key: 'val' })
    );
    const result = (await getAuditLog({})) as any;
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
    const entry = result.entries.find((e: any) => e.action === 'test_action');
    expect(entry).toBeDefined();
    expect(entry.details).toEqual({ key: 'val' });
  });

  it('ADMIN-SVC-046 — falls back to the raw string when details are not valid JSON', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
      user.id, 'bad_json_action', 'not-valid-json{'
    );
    const result = (await getAuditLog({})) as any;
    const entry = result.entries.find((e: any) => e.action === 'bad_json_action');
    expect(entry).toBeDefined();
    // Was { _parse_error: true } before the 2026-08 quirk fix — the admin UI
    // rendered that sentinel literally.
    expect(entry.details).toBe('not-valid-json{');
  });
});

// ── OIDC Settings ─────────────────────────────────────────────────────────────

// ── saveDemoBaseline ──────────────────────────────────────────────────────────

describe('saveDemoBaseline', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ADMIN-SVC-050 — returns 404 when DEMO_MODE is not "true"', async () => {
    vi.stubEnv('DEMO_MODE', 'false');
    const result = (await saveDemoBaseline()) as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('ADMIN-SVC-051 — returns a defined result object when DEMO_MODE is "true"', async () => {
    // saveDemoBaseline() uses a dynamic CJS require() whose mock cannot be
    // intercepted via vi.mock in this test environment (tsx runtime + CJS loader).
    // The function either succeeds (message) or falls through the catch to a
    // 500 error. Either way the result must be a defined, non-null object.
    vi.stubEnv('DEMO_MODE', 'true');
    const result = (await saveDemoBaseline()) as any;
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    // The 404 branch must NOT be taken — DEMO_MODE is "true".
    expect(result.status).not.toBe(404);
  });

  // Plan 3i Task 4 fix wave (must-land 3): before this fix, AdminService
  // #saveDemoBaseline called the now-async saveBaseline() without awaiting
  // it, so a copy failure (proven live in task-4-review.md with a real
  // EISDIR from fs.copyFileSync) went nowhere — the route answered 200 and
  // the rejection later surfaced as an unhandled rejection that crashed the
  // process. This suite's dynamic require()s of demo-reset.ts (and, inside
  // it, db/database.ts) bypass this file's top-of-file vi.mock, same
  // documented limitation as ADMIN-SVC-051 — so instead of mocking, this
  // test lets the REAL saveBaseline() run with no RequestContext
  // established, which deterministically rejects at its own
  // requireEntityManager() guard: the same "the copy failed" shape a real
  // EISDIR would produce, without touching the filesystem. Awaiting that
  // rejection (the fix) means the service's own try/catch converts it into
  // the legacy 500 body, and this test resolving cleanly (not hanging, no
  // unhandledRejection) is itself proof the rejection was actually caught.
  it('ADMIN-SVC-095 — a failed baseline save is awaited and answers the legacy 500, not an unhandled rejection', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const result = await saveDemoBaseline();
    expect(result).toEqual({ error: 'Failed to save baseline', status: 500 });
  });
});

// ── getGithubReleases ─────────────────────────────────────────────────────────

describe('getGithubReleases', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ADMIN-SVC-052 — returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await getGithubReleases();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('ADMIN-SVC-053 — returns releases array when fetch succeeds', async () => {
    const mockReleases = [
      { id: 1, tag_name: 'v3.0.0', name: 'Release 3.0.0', html_url: 'https://github.com/example/releases/tag/v3.0.0' },
      { id: 2, tag_name: 'v2.9.9', name: 'Release 2.9.9', html_url: 'https://github.com/example/releases/tag/v2.9.9' },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockReleases),
      json: async () => mockReleases,
    }));
    const result = await getGithubReleases();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect((result as any[])[0].tag_name).toBe('v3.0.0');
  });

  it('ADMIN-SVC-053a — clamps the paging query instead of interpolating it raw', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '[]' });
    vi.stubGlobal('fetch', fetchMock);

    await getGithubReleases('9999', '0');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/liketrek/TREK/releases?per_page=100&page=1',
    );

    await getGithubReleases('10&per_page=999', 'abc');
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/liketrek/TREK/releases?per_page=10&page=1',
    );
  });

  it('ADMIN-SVC-053b — round-trips the paging the admin UI actually sends', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '[]' });
    vi.stubGlobal('fetch', fetchMock);

    await getGithubReleases('20', '2');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/liketrek/TREK/releases?per_page=20&page=2',
    );
  });
});

// ── checkVersion ──────────────────────────────────────────────────────────────

describe('checkVersion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Since the 2026-08 quirk fix, failures cache too (on a 60s TTL), so each case
  // clears the module-scoped cache rather than reading the previous one's result.
  beforeEach(() => { __clearVersionCacheForTests(); });

  it('ADMIN-SVC-054 — returns update_available:false when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await checkVersion() as any;
    expect(result.update_available).toBe(false);
    expect(result.current).toBeDefined();
    expect(result.latest).toBeDefined();
  });

  it('ADMIN-SVC-055 — returns update_available:true when latest version is greater than current', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ tag_name: 'v999.0.0', html_url: 'https://github.com/example/releases/tag/v999.0.0' }),
      json: async () => ({ tag_name: 'v999.0.0', html_url: 'https://github.com/example/releases/tag/v999.0.0' }),
    }));
    const result = await checkVersion() as any;
    expect(result.update_available).toBe(true);
    expect(result.latest).toBe('999.0.0');
    expect(result.release_url).toBe('https://github.com/example/releases/tag/v999.0.0');
  });

  it('ADMIN-SVC-070 — a failed check is cached briefly instead of refetching per call', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);
    await checkVersion();
    await checkVersion();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── listAddons ────────────────────────────────────────────────────────────────

describe('listAddons', () => {
  it('ADMIN-SVC-065 — listAddons returns array containing seeded addon entries', async () => {
    const result = (await listAddons()) as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const addonIds = result.map((a: any) => a.id);
    expect(addonIds).toContain('packing');
    expect(addonIds).toContain('budget');
  });

  // Plan 3i Task 4 fix wave (AD28): `listAllOrderedForAdminShelf` used to
  // project the `persist(false)` shadow `provider_id`, which MikroORM never
  // hydrates through a narrowed `fields` selection — every photo provider's
  // `fields` grouped under `undefined` and every provider answered `fields:
  // []`. Immich's own connection settings live on `users` columns from an
  // earlier schema shape (see `users_add_immich_url`), so it seeds no
  // `photo_provider_fields` rows and is not useful for this assertion —
  // Synology Photos is the seeded provider that actually owns rows in the
  // generic catalog (url/username/password/otp/skip_ssl), so it is the one
  // that pins the defect: before the fix every one of its 5 seeded fields
  // vanished into the `undefined` group instead.
  it('ADMIN-SVC-066 — Synology Photos carries its seeded field catalog, not fields: []', async () => {
    const result = await listAddons();
    const immich = result.find((entry) => entry.id === 'immich');
    const synology = result.find((entry) => entry.id === 'synologyphotos');
    expect(immich).toBeDefined();
    expect(synology).toBeDefined();
    if (!synology || !('fields' in synology)) throw new Error('synologyphotos entry is missing a fields array');
    expect(synology.fields.map((f) => f.key)).toEqual([
      'synology_url',
      'synology_username',
      'synology_password',
      'synology_otp',
      'synology_skip_ssl',
    ]);
  });
});

// ── updateAddon ───────────────────────────────────────────────────────────────

describe('updateAddon', () => {
  it('ADMIN-SVC-066 — updateAddon enables and disables a seeded addon', async () => {
    const disabled = await updateAddon('mcp', { enabled: false }) as any;
    expect(disabled.addon).toBeDefined();
    expect(disabled.addon.enabled).toBe(false);

    const enabled = await updateAddon('mcp', { enabled: true }) as any;
    expect(enabled.addon.enabled).toBe(true);
  });

  it('ADMIN-SVC-067 — updateAddon returns 404 for unknown addon id', async () => {
    const result = await updateAddon('nonexistent-addon-xyz', { enabled: true }) as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('ADMIN-SVC-069 — mcpAffected only fires on a real enabled-flip of an MCP-relevant addon (#1414)', async () => {
    await updateAddon('packing', { enabled: true });
    // no-op save (enabled already true) → sessions survive
    expect((await updateAddon('packing', { enabled: true }) as any).mcpAffected).toBe(false);
    // config-only save → sessions survive
    expect((await updateAddon('packing', { config: { foo: 'bar' } }) as any).mcpAffected).toBe(false);
    // real flip of an MCP-relevant addon → invalidate
    expect((await updateAddon('packing', { enabled: false }) as any).mcpAffected).toBe(true);
    expect((await updateAddon('packing', { enabled: true }) as any).mcpAffected).toBe(true);
    // real flip of an addon with no MCP surface → sessions survive. Taken from
    // the list rather than named, because an addon that grows MCP tools joins it
    // and would otherwise turn this assertion false without changing anything
    // it is actually about (documents did, when document sync landed).
    const noMcp = Object.values(ADDON_IDS).find(id => !MCP_GATED_ADDON_IDS.includes(id));
    if (noMcp) {
      const flip = await updateAddon(noMcp, { enabled: false }) as any;
      if (!flip.error) expect(flip.mcpAffected).toBe(false);
    }

    // and the one this change put on the list carries the opposite verdict
    const docsFlip = await updateAddon('documents', { enabled: false }) as any;
    if (!docsFlip.error) expect(docsFlip.mcpAffected).toBe(true);
  });

  it('ADMIN-SVC-087 — refuses to enable a photo provider while journey is off', async () => {
    testDb.prepare("UPDATE addons SET enabled = 0 WHERE id = 'journey'").run();
    testDb.prepare("UPDATE photo_providers SET enabled = 0 WHERE id = 'immich'").run();

    const result = await updateAddon('immich', { enabled: true }) as any;
    expect(result).toEqual({ error: 'Enable the Journey addon first', status: 409 });
    expect(testDb.prepare("SELECT enabled FROM photo_providers WHERE id = 'immich'").get()).toEqual({ enabled: 0 });
  });

  it('ADMIN-SVC-088 — enables a provider under an enabled journey; disabling never needs journey', async () => {
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'journey'").run();
    const enabled = await updateAddon('immich', { enabled: true }) as any;
    expect(enabled.addon).toMatchObject({ id: 'immich', type: 'photo_provider', enabled: true });

    // Switching a provider OFF stays possible with journey off — cleanup must not dead-end.
    testDb.prepare("UPDATE addons SET enabled = 0 WHERE id = 'journey'").run();
    const disabled = await updateAddon('immich', { enabled: false }) as any;
    expect(disabled.addon.enabled).toBe(false);
  });

  it('ADMIN-SVC-089 — disabling journey cascades every photo provider off', async () => {
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'journey'").run();
    testDb.prepare('UPDATE photo_providers SET enabled = 1').run();

    const result = await updateAddon('journey', { enabled: false }) as any;
    expect(result.addon.enabled).toBe(false);
    const rows = testDb.prepare('SELECT enabled FROM photo_providers').all() as Array<{ enabled: number }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.enabled === 0)).toBe(true);
  });
});

// ── version-check cron ────────────────────────────────────────────────────────

describe('version-check job', () => {
  const registrarStub = { isEnabled: () => true, register: vi.fn(() => true), unregister: vi.fn() } as unknown as CronRegistrarService;
  const envStub = { isManaged: () => false } as unknown as RuntimeEnvService;

  it('VCJOB-001 — the cron tick notifies and shares the module-scoped version cache with the route', async () => {
    createAdmin(testDb);
    __clearVersionCacheForTests();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ tag_name: 'v99.9.9', html_url: 'https://example.test/r' }),
      json: async () => ({ tag_name: 'v99.9.9', html_url: 'https://example.test/r' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await new VersionCheckJob(svc, registrarStub, envStub).tick();

    const notified = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('last_notified_version') as { value: string } | undefined;
    expect(notified?.value).toBe('99.9.9');

    // The version cache is module-scoped in admin.helpers, so the cron and
    // GET /api/admin/version-check hit GitHub once between them.
    expect(await svc.checkVersion()).toMatchObject({ latest: '99.9.9' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    __clearVersionCacheForTests();
  });
});

// ── Quirk fixes landed after the 2026-08 fold ─────────────────────────────────

describe('admin quirk fixes (post-fold)', () => {

  it('ADMIN-SVC-072 — updateUser rejects an empty username/email instead of silently no-opping', async () => {
    const { user } = createUser(testDb);
    expect((await updateUser(String(user.id), { username: '' })) as any).toMatchObject({ status: 400, error: 'Username cannot be empty' });
    expect((await updateUser(String(user.id), { email: '  ' })) as any).toMatchObject({ status: 400, error: 'Email cannot be empty' });
    // The row is untouched.
    const row = testDb.prepare('SELECT username FROM users WHERE id = ?').get(user.id) as { username: string };
    expect(row.username).toBe(user.username);
  });

});

// ── What an admin password reset ends, and what an ordinary edit must not ─────

const pv = (id: number): number =>
  (testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(id) as { password_version: number | null })
    ?.password_version ?? 0;

const mcpTokenCount = (id: number): number =>
  (testDb.prepare('SELECT COUNT(*) AS n FROM mcp_tokens WHERE user_id = ?').get(id) as { n: number }).n;

const addPushDevice = (userId: number, endpoint: string): void => {
  testDb
    .prepare(
      "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, vapid_public_key) VALUES (?, ?, 'p', 'a', 'k')",
    )
    .run(userId, endpoint);
};

const pushDeviceCount = (id: number): number =>
  (testDb.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?').get(id) as { n: number }).n;

const passwordHash = (id: number): string =>
  (testDb.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as { password_hash: string }).password_hash;

describe('admin password reset revokes what an intruder already holds', () => {
  it('ADMIN-SVC-080 — setting a password bumps password_version, so existing cookies stop working', async () => {
    // An admin sets somebody else's password for one reason: the account is
    // believed compromised. Without the bump, verifyJwtAndLoadUser keeps
    // accepting every cookie the intruder holds, and the one action taken to
    // lock them out is the one action that did not.
    const { user } = createUser(testDb);
    const before = pv(user.id);

    await updateUser(String(user.id), { password: 'ANewStrongPass123!' });

    expect(pv(user.id)).toBe(before + 1);
  });

  it('ADMIN-SVC-081 — and clears the MCP tokens, which the version bump does not reach', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO mcp_tokens (user_id, token_hash, token_prefix, name) VALUES (?, 'hash', 'trek_ab', 'cli')").run(user.id);

    await updateUser(String(user.id), { password: 'ANewStrongPass123!' });

    expect(mcpTokenCount(user.id)).toBe(0);
  });

  it('ADMIN-SVC-081b: and forgets the push devices, which outlive every session, of that user only', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/intruder');
    addPushDevice(user.id, 'https://web.push.apple.com/owner');
    addPushDevice(other.id, 'https://fcm.googleapis.com/fcm/send/bystander');

    await updateUser(String(user.id), { password: 'ANewStrongPass123!' });

    expect(pushDeviceCount(user.id)).toBe(0);
    expect(pushDeviceCount(other.id)).toBe(1);
  });

  it('ADMIN-SVC-081c: drops them in the same transaction as the password, so a failure leaves the account as it was', async () => {
    const { user } = createUser(testDb);
    const before = pv(user.id);
    const hashBefore = passwordHash(user.id);
    testDb.prepare("INSERT INTO mcp_tokens (user_id, token_hash, token_prefix, name) VALUES (?, 'hash', 'trek_ab', 'cli')").run(user.id);
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/intruder');
    testDb.exec("CREATE TRIGGER boom BEFORE DELETE ON push_subscriptions BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      await expect(updateUser(String(user.id), { password: 'ANewStrongPass123!' })).rejects.toThrow('boom');
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }

    expect(pv(user.id)).toBe(before);
    expect(passwordHash(user.id)).toBe(hashBefore);
    expect(mcpTokenCount(user.id)).toBe(1);
    expect(pushDeviceCount(user.id)).toBe(1);
  });

  it('ADMIN-SVC-082 — renaming a user touches neither, so an ordinary edit stays ordinary', async () => {
    const { user } = createUser(testDb);
    const before = pv(user.id);
    testDb.prepare("INSERT INTO mcp_tokens (user_id, token_hash, token_prefix, name) VALUES (?, 'hash', 'trek_ab', 'cli')").run(user.id);
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/renamed');

    await updateUser(String(user.id), { username: 'renamed' });

    expect(pv(user.id)).toBe(before);
    expect(mcpTokenCount(user.id)).toBe(1);
    expect(pushDeviceCount(user.id)).toBe(1);
  });
});

describe('resetUserMfa', () => {
  it('ADMIN-SVC-083 — clears the three columns disableMfa clears, so both paths leave one state', async () => {
    // The passkey half has existed since passkeys landed; TOTP never had an
    // answer, which left "somebody on the trip lost their phone" with no way out
    // short of an operator reaching into the database.
    const admin = createAdmin(testDb);
    const { user } = createUserWithMfa(testDb);

    const result = (await svc.resetUserMfa(String(user.id), admin.user.id)) as { success?: boolean; email?: string };

    expect(result.success).toBe(true);
    expect(result.email).toBe(user.email);
    const row = testDb
      .prepare('SELECT mfa_enabled, mfa_secret, mfa_backup_codes FROM users WHERE id = ?')
      .get(user.id) as { mfa_enabled: number; mfa_secret: string | null; mfa_backup_codes: string | null };
    expect(row.mfa_enabled).toBe(0);
    expect(row.mfa_secret).toBeNull();
    expect(row.mfa_backup_codes).toBeNull();
  });

  it('ADMIN-SVC-084 — refuses to strip the callers own second factor', async () => {
    // Reachable from a stolen admin session otherwise, and it would take the
    // second factor off the very account that session came from. The
    // self-service path in Settings asks for the current password.
    const admin = createAdmin(testDb);

    const result = (await svc.resetUserMfa(String(admin.user.id), admin.user.id)) as { error?: string; status?: number };

    expect(result.status).toBe(400);
    expect(result.error).toMatch(/your own/i);
  });

  it('ADMIN-SVC-085 — 404 for a user that is not there', async () => {
    const admin = createAdmin(testDb);

    expect((await svc.resetUserMfa('99999', admin.user.id)) as { status?: number }).toMatchObject({ status: 404 });
  });
});

describe('checkVersion on a centrally administered install', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __clearVersionCacheForTests();
  });

  it('ADMIN-SVC-086 — answers "up to date" without asking GitHub', () => {
    // Answered rather than refused: the admin page calls this on open, and a 403
    // would put an error where a quiet surface belongs. The operator decides when
    // this instance upgrades, so from inside it there is nothing available.
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('TREK_MANAGED', 'true');
    vi.stubEnv('APP_VERSION', '3.4.1');

    return checkVersion().then((info) => {
      expect(info.update_available).toBe(false);
      expect(info.latest).toBe('3.4.1');
      expect(info.current).toBe('3.4.1');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});

// ── Plan 3i Task 1 — R4's guard-location + TX-boundary + AD22 parity proofs ──

describe('updateUser — last-admin guard (AD9/AD10, R4)', () => {
  it('ADMIN-SVC-090 — refuses to demote the sole remaining admin, row untouched', async () => {
    const { user: soleAdmin } = createAdmin(testDb);

    const result = (await updateUser(String(soleAdmin.id), { role: 'user' })) as { error?: string; status?: number };

    expect(result).toEqual({ error: 'Cannot remove the last admin', status: 400 });
    const row = testDb.prepare('SELECT role FROM users WHERE id = ?').get(soleAdmin.id) as { role: string };
    expect(row.role).toBe('admin');
  });

  it('ADMIN-SVC-091 — demoting one of SEVERAL admins is allowed', async () => {
    createAdmin(testDb);
    const { user: secondAdmin } = createAdmin(testDb);

    const result = (await updateUser(String(secondAdmin.id), { role: 'user' })) as { user?: { role: string }; error?: string };

    expect(result.error).toBeUndefined();
    const row = testDb.prepare('SELECT role FROM users WHERE id = ?').get(secondAdmin.id) as { role: string };
    expect(row.role).toBe('user');
  });
});

describe('getAuditLog — AD22 parity through the service (LEFT JOIN survives a deleted user, rule 16)', () => {
  it('ADMIN-SVC-092 — a deleted user\'s audit row keeps its row (not dropped) with username/user_email both null, matching the legacy raw LEFT JOIN', async () => {
    const { user: liveUser } = createUser(testDb);
    const { user: doomedUser } = createUser(testDb);

    testDb.prepare('INSERT INTO audit_log (user_id, action, resource, details, ip) VALUES (?, ?, ?, ?, ?)')
      .run(liveUser.id, 'live_user_action', 'trip', null, '127.0.0.1');
    testDb.prepare('INSERT INTO audit_log (user_id, action, resource, details, ip) VALUES (?, ?, ?, ?, ?)')
      .run(doomedUser.id, 'about_to_be_deleted_action', 'trip', null, '127.0.0.1');

    // audit_log.user_id is ON DELETE SET NULL (Task 0's report) — deleting the
    // user directly (not through the service) makes the row's user_id
    // genuinely NULL, the exact LEFT JOIN shape rule 16 warns about.
    testDb.prepare('DELETE FROM users WHERE id = ?').run(doomedUser.id);

    // The legacy statement, run raw on the SAME seeded rows — the parity anchor.
    const legacyRows = testDb
      .prepare(
        `SELECT a.id, a.created_at, a.user_id, u.username, u.email as user_email, a.action, a.resource, a.details, a.ip
         FROM audit_log a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(500, 0) as Array<{
        id: number; created_at: string; user_id: number | null; username: string | null;
        user_email: string | null; action: string; resource: string | null; details: string | null; ip: string | null;
      }>;

    const result = (await getAuditLog({ limit: '500', offset: '0' })) as {
      entries: Array<{ user_id: number | null; username: string | null; user_email: string | null; action: string }>;
      total: number;
    };

    expect(result.entries.length).toBe(legacyRows.length);

    const deletedEntry = result.entries.find((e) => e.action === 'about_to_be_deleted_action');
    const legacyDeletedRow = legacyRows.find((r) => r.action === 'about_to_be_deleted_action');
    expect(deletedEntry).toBeDefined();
    expect(legacyDeletedRow).toBeDefined();
    // The row survives the LEFT JOIN (never dropped): user_id is preserved,
    // username/user_email both null — never `undefined` (rule 16: T | null).
    expect(deletedEntry!.user_id).toBe(legacyDeletedRow!.user_id);
    expect(deletedEntry!.username).toBeNull();
    expect(deletedEntry!.user_email).toBeNull();
    expect(legacyDeletedRow!.username).toBeNull();
    expect(legacyDeletedRow!.user_email).toBeNull();

    const liveEntry = result.entries.find((e) => e.action === 'live_user_action');
    const legacyLiveRow = legacyRows.find((r) => r.action === 'live_user_action');
    expect(liveEntry!.username).toBe(legacyLiveRow!.username);
    expect(liveEntry!.user_email).toBe(legacyLiveRow!.user_email);
  });
});

describe('updateUser — password-reset transaction boundary (AD11/12/13)', () => {
  it('ADMIN-SVC-093 — a failure on the mcp_tokens delete (AD12, not try/caught) rolls back the already-run users UPDATE (AD11) too', async () => {
    const { user } = createUser(testDb);
    const before = testDb
      .prepare('SELECT username, password_version FROM users WHERE id = ?')
      .get(user.id) as { username: string; password_version: number };

    const spy = vi.spyOn(mcpTokensRepo, 'deleteAllForUser').mockRejectedValueOnce(new Error('simulated mcp_tokens failure'));

    await expect(
      updateUser(String(user.id), { username: 'should-roll-back', password: 'ANewStrongPass123!' }),
    ).rejects.toThrow('simulated mcp_tokens failure');

    const after = testDb
      .prepare('SELECT username, password_version FROM users WHERE id = ?')
      .get(user.id) as { username: string; password_version: number };

    // The users UPDATE (AD11) ran FIRST, inside the SAME uow.transactional
    // boundary as the failing mcp_tokens delete — proves the TX boundary
    // survived conversion (not just that each statement individually works):
    // an uncaught failure anywhere in the block rolls the whole thing back,
    // including a statement that already "succeeded" earlier in the same TX.
    expect(after.username).toBe(before.username);
    expect(after.password_version).toBe(before.password_version);

    spy.mockRestore();
  });
});

describe('createUser — the pre-existing uniqueness-check TOCTOU window (AD2-4, R4 "report, don\'t fix")', () => {
  it('ADMIN-SVC-094 — a race between the email pre-check and the INSERT is not caught by a transaction; the row-level UNIQUE constraint is what actually stops the duplicate, surfacing as a thrown error rather than a clean 409', async () => {
    const { user: existing } = createUser(testDb, { email: 'race@test.example.com' });

    // Simulates the concurrent-request race AD2-4's non-transactional shape
    // leaves open (unchanged by this conversion, per R4): the uniqueness
    // pre-check (AD3) reports no conflict, as it would if a second request's
    // own insert lands in the gap between this request's check and its own
    // INSERT — the two statements are two separate, un-transacted repository
    // calls, exactly as the legacy raw SQL was.
    const usersRepo = await createTestUsersRepo(testDb);
    const spy = vi.spyOn(usersRepo, 'findIdByEmailExact').mockResolvedValueOnce(null);

    // The pre-check said "clear," but `users.email` carries its own UNIQUE
    // index (`Migration20200101000000_baseline_schema.ts`) — that's what
    // actually stops the duplicate, at the SQL level, not this service's own
    // TOCTOU-vulnerable pre-check. Because nothing here catches that
    // failure, it propagates as an unhandled rejection rather than the
    // clean `{ error: 'Email already taken', status: 409 }` a request that
    // lost the race with more lead time would have gotten.
    await expect(
      svcCreateUser({ username: 'raceuser', email: existing.email, password: 'ValidPass1!' }),
    ).rejects.toThrow();

    spy.mockRestore();
  });
});
