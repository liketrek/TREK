/**
 * `runDemoSeed()` (`src/demo/demo-seed.ts`, called from `runSchemaBootstrap`
 * in `db/orm.ts:44`) used to run before the first `withRequestContext`
 * (`bootstrap.ts:108`) and on every restore (`db/orm.ts`'s reinitialize
 * hook) — entirely raw `better-sqlite3`, so nothing needed a context yet,
 * but the seed's own docstring pre-authorised the fix: "The domain phase
 * that gives demo seeding a repository read must wrap it in
 * `withRequestContext` then." `runSchemaBootstrap` (Plan 3c Task 0b) now
 * wraps the call in `withRequestContext(orm, …)`, the one place it already
 * has `orm` in scope — covering both of `runDemoSeed`'s real call sites
 * (`DatabaseLifecycle.open()` at boot and its restore hook) with no
 * second wrapper to keep in sync.
 *
 * This is a real `DEMO_MODE` boot proving that wrap doesn't change what the
 * seed does and logs no missing-context error, so Plan 3i's demo
 * conversion never meets a second C1 (task-6-review-parity.md's boot-sweep
 * finding).
 *
 * Does NOT use `buildDbMock`: its `runDemoSeed` is a deliberate no-op stub
 * (tests/helpers/db-mock.ts) so that other suites' app boots don't carry
 * demo-seed side effects, which would silence the very thing this file
 * exists to exercise. The suite boots on the real database module, on either
 * engine; the only thing it adds is a spy on `runDemoSeed` (Task 0b review
 * M2) that records the context and calls straight through to the real one.
 *
 * `seedDemoData`'s own `require('../demo/demo-seed')` (a deliberate dynamic
 * require — see that file's docstring) cannot resolve under vitest's SWC
 * transform (`Cannot find module '../demo/demo-seed'`), independent of this
 * task and of request-context wrapping — `runDemoSeed`'s own try/catch
 * already swallows that into a `[Demo] Seed error:` log line in every
 * environment, wrapped or not, which is exactly why `buildDbMock` stubs the
 * whole function out for every other suite rather than letting it run for
 * real. This test cannot assert the demo user was actually created for that
 * reason (a genuine environment gap, not a functional one — production runs
 * compiled Node, not a vitest/SWC transform); what it CAN and does assert is
 * the one thing Task 0b changed: no `cannotUseGlobalContext`/"global
 * EntityManager" line reaches the log, and the pre-existing module-resolution
 * failure is what actually gets logged instead, unchanged by the wrap.
 */
import { buildApp } from '../../src/bootstrap';
import * as database from '../../src/db/database';
import { RequestContext } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * Task 0b review M2: the pre-fix version of this file only asserted "no
 * `cannotUseGlobalContext`/`global EntityManager` line reached the log",
 * which cannot distinguish a wrapped call from an unwrapped one: `runDemoSeed`
 * produces neither line either way (verified: deleting the `withRequestContext`
 * wrap in `db/orm.ts` left this ratchet green, 1/1). Fixed by asserting the
 * context POSITIVELY: a spy on the module's `runDemoSeed` export, which
 * `db/orm.ts` calls through its import binding, records whether
 * `RequestContext.currentRequestContext()` is defined at the instant
 * `runDemoSeed` is entered and then runs the real function. This is exactly
 * what MikroORM's own `allowGlobalContext: false` gate reads at query time,
 * so it is the real signal, not a log-line proxy for it. Deleting the
 * `withRequestContext` wrap fails this test directly (verified on SQLite).
 */
const contextSeenOnEntry: boolean[] = [];
const actualRunDemoSeed = database.runDemoSeed;
vi.spyOn(database, 'runDemoSeed').mockImplementation(async () => {
  contextSeenOnEntry.push(RequestContext.currentRequestContext() !== undefined);
  return await actualRunDemoSeed();
});

describe('runDemoSeed runs inside a request context (Plan 3c Task 0b)', () => {
  let app: INestApplication | undefined;
  const prevDemo = process.env.DEMO_MODE;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    contextSeenOnEntry.length = 0;
    if (prevDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = prevDemo;
  });

  it('DEMO-SEED-001: a DEMO_MODE boot runs the seed inside a request context (no cannotUseGlobalContext)', async () => {
    process.env.DEMO_MODE = 'true';
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      app = await buildApp();

      // runDemoSeed ran at all (proven by SOME [Demo] line reaching the log —
      // in this environment always the pre-existing require() gap above, but
      // ANY [Demo] line proves the function was invoked, not skipped).
      const demoLines = errSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((line) => line.includes('[Demo]'));
      expect(demoLines.length).toBeGreaterThan(0);

      // The one thing this task could regress: a missing request context.
      const suspicious = demoLines.filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
      expect(suspicious).toEqual([]);

      // DEMO-SEED-002 (0b review M2): the positive ratchet. runDemoSeed was
      // actually entered (the spy fired) AND every entry saw a defined
      // request context.
      expect(contextSeenOnEntry.length).toBeGreaterThan(0);
      expect(contextSeenOnEntry.every(Boolean)).toBe(true);
    } finally {
      errSpy.mockRestore();
    }
  });
});
