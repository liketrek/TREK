/**
 * D6 regression (task-2-review.md C3): a plugin's `ctx.*` call arrives over a
 * child-process `message` event, not an HTTP request, so nothing has forked an
 * EntityManager for it. `PluginSupervisor.onMessage` (plugin-supervisor.ts:~553)
 * is the single choke point every plugin RPC dispatch passes through, and it now
 * wraps `sup.rpcHost.dispatch(...)` in `withRequestContext` there.
 *
 * The reviewer's probe, reproduced here through the REAL call chain
 * (PluginSupervisor.onMessage → PluginGuards.canCreateAs →
 * PermissionsService.checkPermission → AppSettingsRepository.findByKeyPrefix),
 * not just `checkPermission` in isolation: with `perm_trip_create` tightened
 * from its 'everybody' default to 'admin', a role-'user' actor's check must
 * come back `false`. Before the fix (dispatch outside any context, and
 * loadPermissions serving defaults on any error) it came back `true` — a
 * fail-open security regression. Task 2's round fixed it two switches away
 * from the choke point — the wrapper here, and `loadPermissions` rethrowing a
 * MikroORM `ValidationError` instead of degrading (permissions.service.ts) —
 * so an unwrapped dispatch failed CLOSED (a HOST_ERROR envelope) but only
 * because BOTH switches held. task-6-fix-brief.md item 1 (task-6-review-
 * template.md's Important 1 / M-B) moves the fail-closed decision TO the
 * choke point itself: an absent `resolveOrm` now makes the dispatch THROW
 * before it ever reaches `rpcHost.dispatch`, so the child gets no response at
 * all — not even the old HOST_ERROR envelope — and the security property no
 * longer depends on `loadPermissions`' rethrow holding too.
 *
 * Global context is disallowed on purpose (`{ allowGlobalContext: false }`),
 * like `tests/unit/nest/database/request-context.test.ts` — the production
 * setting — NOT the `createTestOrm` default (`true`) that `test-uow.ts`'s
 * shared helpers use to let ordinary unit tests call a repository with no
 * request wrapper at all: that default would hide this exact bug.
 */
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { PluginGuards } from '../../../src/nest-rpc/plugin-guards.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RpcRateLimiter, DEFAULT_RPC_LIMIT } from '../../../src/nest/plugins/host/rate-limit';
import type { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import type { RpcRequest, RpcResponse, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { PluginSupervisor } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { setAppSetting } from '../../helpers/factories/settings';
import { createTestAddonsService } from '../../helpers/test-addons';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import type { EntityManager } from '@mikro-orm/core';

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/** The slice of Supervisor's private `Supervised` shape a 'req' dispatch touches. */
interface DispatchEntry {
  rpcHost: Pick<PluginRpcHost, 'dispatch'>;
  child: { send: (msg: unknown) => void } | null;
  rpcLimiter: RpcRateLimiter;
  invocations: Map<string, number | undefined>;
}
/** `onMessage` is private; this is the narrowest structural view that reaches it
 * without an `any` cast. */
interface SupervisorPrivate {
  onMessage(sup: DispatchEntry, msg: RpcRequest): Promise<void>;
}

const testDb = createSnapshotTestDb();

let t: TestOrm;
let permissions: PermissionsService;
let guards: PluginGuards;
let userId: number;

beforeAll(async () => {
  t = await createTestOrm(testDb, { allowGlobalContext: false });
  permissions = new PermissionsService(t.repo(AppSettings), new UnitOfWork(t.em));
  // Plan 3j Task 1: PluginGuards' own role lookup (canCreateAs, PG4) now goes
  // through UsersRepository.getRole — a REAL repository bound to `t.em`
  // (allowGlobalContext: false, same as `permissions`' AppSettingsRepository
  // above), not a stub, because this suite's whole point is proving that
  // read fails outside withRequestContext and succeeds inside it (D6/C3).
  // A mocked UsersRepository would defeat that regression coverage.
  // Plan 4 Task 2 — PluginGuards' own canAccessTrip delegate is now
  // TripsRepository.findAccessible; same REAL-repository reasoning applies.
  guards = new PluginGuards(t.repo(Trips), permissions, await createTestAddonsService(testDb), t.repo(Users));
  userId = createUser(testDb, { role: 'user' }).user.id;
  // An admin has tightened trip_create from its 'everybody' default.
  await setAppSetting(t, 'perm_trip_create', 'admin');
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

/**
 * Wires one supervisor whose fake rpcHost.dispatch calls straight into
 * PluginGuards.canCreateAs — the same chain the review traced
 * (plugin-guards.service.ts:74,84 → PermissionsService.checkPermission) — and
 * envelope-shapes the result exactly like the real PluginRpcHost.handle()
 * catch (rpc-host.ts): a thrown error becomes a HOST_ERROR response, never an
 * unhandled rejection. `resolveOrm` is the exact 4th constructor arg
 * PluginRuntimeService passes in production (plugin-runtime.service.ts).
 */
function makeSupervisor(resolveOrm?: () => { em: EntityManager } | undefined) {
  const sent: Array<RpcResponse | RpcError> = [];
  const dispatch: PluginRpcHost['dispatch'] = async (req, actingUserId) => {
    try {
      const result = await guards.canCreateAs('trip_create', actingUserId as number);
      return { k: 'res', id: req.id, ok: true, result };
    } catch (e) {
      return {
        k: 'res',
        id: req.id,
        ok: false,
        error: { code: 'HOST_ERROR', message: e instanceof Error ? e.message : String(e) },
      };
    }
  };
  const createRpcHost = () => ({ dispatch }) as unknown as PluginRpcHost;
  const supervisor = new PluginSupervisor(createRpcHost, {}, {}, resolveOrm) as unknown as SupervisorPrivate;
  const sup: DispatchEntry = {
    rpcHost: { dispatch },
    child: { send: (msg) => sent.push(msg as RpcResponse | RpcError) },
    rpcLimiter: new RpcRateLimiter(DEFAULT_RPC_LIMIT, Date.now()),
    invocations: new Map([['inv-1', userId]]),
  };
  return { supervisor, sup, sent };
}

describe('PluginSupervisor request context (D6, C3)', () => {
  it("CTX-PLUGIN-001: without a resolveOrm thunk, the dispatch THROWS (host-side visibility) but the child still gets answered first (task-6-rereview.md §5 RULING: an unanswered 'req' hangs the plugin forever — plugin-host-entry.ts's pending map has no timeout)", async () => {
    await permissions.invalidatePermissionsCache();
    const { supervisor, sup, sent } = makeSupervisor(); // no resolveOrm — the bug's exact reproduction
    const canCreateAsSpy = vi.spyOn(guards, 'canCreateAs');
    try {
      await expect(
        supervisor.onMessage(sup, { k: 'req', id: 'r1', method: 'trips.create', params: { _inv: 'inv-1' } }),
      ).rejects.toThrow(/no ORM available/i);
      // The dispatch itself never ran — same fail-closed guarantee as before.
      expect(canCreateAsSpy).not.toHaveBeenCalled();
      // But unlike the previous wave, the child DOES get a response: a HOST_ERROR
      // envelope, matching the rate-limiter refusal's shape, so its ctx.* promise
      // settles instead of hanging forever.
      expect(sent).toHaveLength(1);
      const res = sent[0];
      expect(res.ok).toBe(false);
      if (res.ok === false) {
        expect(res.error.code).toBe('HOST_ERROR');
        expect(res.error.message).toMatch(/no ORM available/i);
      }
    } finally {
      // task-6-rereview2.md M5: never restored before — a leak waiting for the
      // first mockImplementation another test in this file adds to `guards`.
      canCreateAsSpy.mockRestore();
    }
  });

  it('CTX-PLUGIN-002: wrapped in withRequestContext, the same dispatch enforces the stored override — a "user" role is refused', async () => {
    await permissions.invalidatePermissionsCache();
    const { supervisor, sup, sent } = makeSupervisor(() => t.orm);

    await supervisor.onMessage(sup, { k: 'req', id: 'r2', method: 'trips.create', params: { _inv: 'inv-1' } });

    expect(sent).toHaveLength(1);
    const res = sent[0];
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.result).toBe(false); // role 'user' against a stored 'admin' override
  });
});
