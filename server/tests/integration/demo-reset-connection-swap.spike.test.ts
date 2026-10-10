/**
 * Plan 3i Task 0 — R3's spike.
 *
 * `demo-reset.ts#resetDemoUser` runs inside a cron tick that
 * `CronRegistrarService.register()` already wraps in a `withRequestContext`
 * fork (`cron-registrar.service.ts:87-92`, `wrappedTick`). INSIDE that one
 * fork, the function reads credentials, calls `closeDb()` then
 * `await reinitialize()` (which closes the process's one better-sqlite3
 * handle, opens a new one, and (through the hook `DatabaseLifecycle.open()`
 * registers with `registerReinitializeHook`) closes and reconnects the ORM's own
 * Kysely-bound `Connection`, then re-runs `runSchemaBootstrap`), and only
 * THEN writes the preserved credentials back through a freshly re-required
 * `db` reference.
 *
 * The open question (plan3i-inputs.md correction #2): does a REPOSITORY
 * call issued through the SAME `EntityManager` fork the tick started with —
 * i.e. still inside the one `withRequestContext(orm, async () => { ... })`
 * call — still resolve correctly against the driver's connection after that
 * connection object has been closed and rebound to a new raw handle
 * mid-callback? This file measures it against a real `buildApp()` boot, not
 * a mock, exactly as `demo-seed-request-context.test.ts` (its closest
 * neighbour) measures `runDemoSeed`'s own, simpler wrap.
 *
 * Mechanism (for the report, not asserted directly here — this is the
 * reasoning the measurement below either confirms or refutes): MikroORM
 * forks an `EntityManager` per `RequestContext.create` call, but a fork does
 * NOT fork the `Connection`/`Driver` — those are singletons owned by the ORM
 * instance's `Configuration`, shared by every fork. `orm-driver.ts`'s
 * `BoundSqliteConnection.createKyselyDialect()` reads `getRawConnection()`
 * (the CURRENT `db/database.ts` handle) on every `connect()`, and
 * that hook calls `connection.close(true)` then
 * `connection.connect()` on that ONE shared `Connection` object — it never
 * replaces the object itself, only rebinds its internal Kysely client. So
 * any EM fork — pre-swap or fresh — that resolves a query calls
 * `this.driver.getConnection()` fresh each time, landing on the SAME,
 * now-rebound `Connection` object. The theoretical expectation is "safe";
 * this file is what turns that into a measured answer with real evidence
 * rather than an assumption.
 *
 * Test-mode nuance: `NODE_ENV=test` makes `db/database.ts#openDb()` reopen a
 * PRISTINE copy of the migrated schema snapshot on every call (a fresh
 * `better-sqlite3` instance deserialised from a fixed buffer), not the same
 * on-disk file demo-reset.ts restores in production — so a row inserted
 * before the swap is genuinely gone after `reinitialize()` resolves. That is
 * expected data loss (the same thing a real demo-reset baseline restore
 * does) and is NOT what this file is measuring; what it measures is whether
 * the post-swap call reaches the new, live connection at all (succeeds,
 * even returning null/creating a fresh row) versus throwing, hanging, or
 * silently targeting a stale/closed handle.
 */
import { buildApp } from '../../src/bootstrap';
import { closeDb, reinitialize } from '../../src/db/database';
import { Users } from '../../src/db/entities/Users.entity';
import type { UsersRepository } from '../../src/db/repositories/Users.repository';
import { withRequestContext } from '../../src/nest/database/request-context';
import { MikroORM } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import type { INestApplication } from '@nestjs/common';

import { afterEach, describe, expect, it } from 'vitest';

type Outcome = { ok: true; value: unknown } | { ok: false; error: string };

async function capture<T>(fn: () => Promise<T>): Promise<Outcome> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

describe('Plan 3i Task 0 spike: demo-reset connection swap', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("SPIKE-001: a repository read AND a repository write, issued through the pre-swap EntityManager fork after closeDb()+reinitialize(), inside the SAME withRequestContext call demo-reset.job.ts's wrappedTick uses", async () => {
    app = await buildApp();
    const orm = app.get(MikroORM);
    const users = app.get<UsersRepository>(getRepositoryToken(Users));

    let preSwapId: number | undefined;
    let readAfterSwap: Outcome | undefined;
    let writeAfterSwap: Outcome | undefined;

    // Exactly the shape of cron-registrar.service.ts's wrappedTick: one
    // withRequestContext call wrapping the whole tick, read -> swap -> write.
    await withRequestContext(orm, async () => {
      // Phase 1 — pre-close, proving the fork works before the swap at all
      // (mirrors demo-reset.ts's DMR1/DMR2 credential reads).
      const inserted = await users.insertUser({
        username: 'spike-pre-swap',
        email: 'spike-pre-swap@example.test',
        password_hash: 'x',
        role: 'user',
        first_seen_version: '0.0.0-spike',
      });
      preSwapId = inserted.id;
      const before = await users.findById(preSwapId);
      expect(before?.email).toBe('spike-pre-swap@example.test');

      // The swap — demo-reset.ts's own `closeDb(); await reinitialize();`,
      // called from inside the still-open fork, exactly where resetDemoUser
      // calls it between its pre-close reads and its post-reopen writes.
      closeDb();
      await reinitialize();

      // Phase 2 — SAME fork, AFTER the swap. A read first (mirrors nothing
      // demo-reset.ts does post-swap, but isolates read-only behaviour),
      // then a write (mirrors DMR5/DMR6, the credential/API-key restore).
      readAfterSwap = await capture(() => users.findById(preSwapId as number));
      writeAfterSwap = await capture(() =>
        users.insertUser({
          username: 'spike-post-swap',
          email: 'spike-post-swap@example.test',
          password_hash: 'x',
          role: 'user',
          first_seen_version: '0.0.0-spike',
        }),
      );
    });

    console.log('[SPIKE-001] readAfterSwap:', JSON.stringify(readAfterSwap));
    console.log('[SPIKE-001] writeAfterSwap:', JSON.stringify(writeAfterSwap));

    // The pre-swap fork's post-swap READ must not throw (test-mode reopens a
    // pristine snapshot, so the pre-swap row is gone — a defined `null` is
    // the CORRECT answer here, not a failure).
    expect(readAfterSwap?.ok).toBe(true);
    if (readAfterSwap?.ok) expect(readAfterSwap.value).toBeNull();

    // The pre-swap fork's post-swap WRITE must not throw either.
    expect(writeAfterSwap?.ok).toBe(true);

    // The decisive check: did that write actually land on the NEW, live
    // connection, or silently no-op / target a stale handle? Verify through
    // a completely FRESH request context (a new fork), reading the row back
    // by a value only the post-swap write could have created.
    let writeVisibleOnNewConnection = false;
    await withRequestContext(orm, async () => {
      const id = await users.findIdByEmailOrUsernameCI('spike-post-swap@example.test', 'spike-post-swap');
      writeVisibleOnNewConnection = id !== null;
    });
    console.log('[SPIKE-001] writeVisibleOnNewConnection:', writeVisibleOnNewConnection);
    expect(writeVisibleOnNewConnection).toBe(true);
  });

  it("SPIKE-002: a FRESH withRequestContext opened AFTER reinitialize() resolves works correctly for a post-swap write (R3's fallback-shape requirement)", async () => {
    app = await buildApp();
    const orm = app.get(MikroORM);
    const users = app.get<UsersRepository>(getRepositoryToken(Users));

    closeDb();
    await reinitialize();

    await withRequestContext(orm, async () => {
      const inserted = await users.insertUser({
        username: 'spike-fresh-fork',
        email: 'spike-fresh-fork@example.test',
        password_hash: 'x',
        role: 'user',
        first_seen_version: '0.0.0-spike',
      });
      const row = await users.findById(inserted.id);
      expect(row?.email).toBe('spike-fresh-fork@example.test');
    });
  });
});
