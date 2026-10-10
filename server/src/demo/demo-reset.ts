import { readEnv } from '../app-config';
import { resolveDataPaths } from '../app-config/data-paths';
import { UserSessions } from '../db/entities/UserSessions.entity';
import {
  DemoRepository,
  type DemoAdminCredentialsRow,
  type DemoInstanceKeyRow,
} from '../db/repositories/DemoRepository';
import type { CarriedUserSessionRow } from '../db/repositories/UserSessions.repository';
import { dbNow } from '../db/types';
import { DatabaseConnectionLostError, type DatabaseBackupStrategy } from '../nest/database/database-backup.interface';
import { RequestContext, type EntityManager } from '@mikro-orm/core';

import fs from 'fs';
import path from 'path';

const baselinePath = path.join(resolveDataPaths().dataDir, 'travel-baseline.db');

/**
 * The active fork's `EntityManager`, resolved via `RequestContext.getEntityManager()`
 * — the same static accessor MikroORM's own per-request middleware and
 * `CronRegistrarService`'s `wrappedTick` populate. `demo-seed.ts` and this
 * file are plain function modules, not Nest providers, so neither can take
 * an `EntityManager` by constructor injection the way `CronRegistrarService`
 * does; this is their equivalent choke point. Throws
 * its own clear error — never MikroORM's generic "global EntityManager"
 * wording — matching `CronRegistrarService.runOnBoot`'s own fail-closed
 * shape: a direct call to `resetDemoUser`/`saveBaseline`/`seedDemoData`
 * outside a request context fails loudly and distinctly.
 */
export function requireEntityManager(): EntityManager {
  const em = RequestContext.getEntityManager();
  if (!em) {
    throw new Error(
      "demo/demo-reset.ts: no EntityManager available — must run inside a request context (CronRegistrarService wraps demo-reset.job.ts's tick; runSchemaBootstrap wraps seedDemoData; a direct call — including a test — needs its own withRequestContext)",
    );
  }
  return em;
}

/**
 * Puts the live database back to the saved baseline, keeping the admin's
 * credentials and the instance API keys from the current one.
 *
 * The database steps go through the backup port, the same one an admin restore
 * uses: it knows where the live database is (so `TREK_DB_FILE` is honoured),
 * closes the connection, swaps the baseline in atomically and reopens it.
 */
async function resetDemoUser(database: DatabaseBackupStrategy): Promise<void> {
  if (!fs.existsSync(baselinePath)) {
    console.log('[Demo Reset] No baseline found, skipping. Admin must save baseline first.');
    return;
  }

  if (!database.canSnapshot()) {
    console.log('[Demo Reset] In-memory database, nothing to restore.');
    return;
  }

  // Plan 3i Task 3 / R3 (SAFE spike verdict, task-0-report.md §7): the
  // pre-close reads (DMR1/DMR2) run through THIS fork — the one
  // `CronRegistrarService.register()`'s `wrappedTick` already opened for the
  // whole tick — since no swap has happened yet at this point.
  const preSwapEm = requireEntityManager();
  const demo = new DemoRepository(preSwapEm);

  // Save admin's current credentials and API keys (these should survive the reset)
  // NOTE: different default than demo-seed (admin@trek.app) — pinned legacy quirk.
  const adminEmail = readEnv().demo.adminEmailRaw || 'admin@nomad.app';
  let adminData: DemoAdminCredentialsRow | undefined = undefined;
  try {
    adminData = (await demo.getAdminCredentials(adminEmail)) ?? undefined;
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to read admin data:', e instanceof Error ? e.message : e);
  }

  // The Places/Unsplash keys the searches actually use live in app_settings
  // since #1939, so they have to survive the restore alongside the columns —
  // otherwise the demo instance loses map search on every reset.
  let instanceKeys: DemoInstanceKeyRow[] = [];
  try {
    instanceKeys = await demo.getInstanceApiKeys();
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to read instance API keys:', e instanceof Error ? e.message : e);
  }

  // Everyone signed in stays signed in. The baseline was saved at first seed,
  // before anybody logged in, so it holds no session rows, and a session
  // token whose row is gone is refused: without this every demo visitor and
  // the demo admin would be signed out on the hour.
  let liveSessions: CarriedUserSessionRow[] = [];
  try {
    liveSessions = await preSwapEm.getRepository(UserSessions).listActiveToCarry(dbNow());
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to read the active sessions:', e instanceof Error ? e.message : e);
  }

  // Flush the WAL into the main file before the connection closes. Best effort.
  try {
    await database.checkpoint();
  } catch {
    /* the swap below does not depend on it */
  }

  // Close, swap the baseline in, reopen. The reopen runs even when the swap
  // fails, so the instance is never left without a connection. A failed swap
  // alone is logged and the reset skipped; a failed swap whose reopen failed as
  // well goes up to the tick's log line, because the connection is gone.
  let reopenError: unknown;
  try {
    ({ reopenError } = await database.replace(baselinePath));
  } catch (e: unknown) {
    if (e instanceof DatabaseConnectionLostError) throw e;
    console.error('[Demo Reset] Failed to restore baseline:', e instanceof Error ? e.message : e);
    return;
  }
  if (reopenError) throw reopenError;

  // R3's ruling, applied regardless of the spike's specific finding: the
  // post-reopen writes (DMR5/DMR6) run inside a FRESH request context,
  // opened AFTER the reopen resolves, never the pre-swap fork above,
  // even though the spike found the pre-swap fork would also still resolve
  // correctly post-swap (task-0-report.md §7 — "appears to work in the
  // spike's specific test shape" is not the same guarantee as "correct by
  // construction"). `RequestContext.create` forks a genuinely NEW
  // EntityManager off `preSwapEm` — a different object from the one the
  // pre-close reads used — while resolving the SAME shared Connection/Driver
  // singleton either way (the spike's own mechanism finding: a fork never
  // forks the Connection, only the EntityManager).
  await RequestContext.create(preSwapEm, async () => {
    const freshEm = requireEntityManager();
    const demoFresh = new DemoRepository(freshEm);

    // Restore admin's latest credentials (in case admin changed password/API keys after baseline was saved)
    if (adminData) {
      try {
        await demoFresh.restoreAdminCredentials(adminEmail, adminData);
      } catch (e: unknown) {
        console.error('[Demo Reset] Failed to restore admin credentials:', e instanceof Error ? e.message : e);
      }
    }

    if (instanceKeys.length) {
      try {
        await demoFresh.restoreInstanceApiKeys(instanceKeys);
      } catch (e: unknown) {
        console.error('[Demo Reset] Failed to restore instance API keys:', e instanceof Error ? e.message : e);
      }
    }

    if (liveSessions.length) {
      try {
        await freshEm.getRepository(UserSessions).restoreCarried(liveSessions);
      } catch (e: unknown) {
        console.error('[Demo Reset] Failed to restore the active sessions:', e instanceof Error ? e.message : e);
      }
    }
  });

  console.log('[Demo Reset] Database restored from baseline');
}

/**
 * Saves the current database as the baseline the hourly reset returns to.
 *
 * A snapshot through the backup port, written beside the baseline and renamed
 * over it, so a failed save leaves the previous baseline intact.
 */
async function saveBaseline(database: DatabaseBackupStrategy): Promise<void> {
  if (!database.canSnapshot()) {
    console.log('[Demo] In-memory database, no baseline to save.');
    return;
  }

  const pending = baselinePath + '.tmp';
  fs.rmSync(pending, { force: true });
  await database.snapshot(pending);
  fs.renameSync(pending, baselinePath);
  console.log('[Demo] Baseline saved');
}

function hasBaseline(): boolean {
  return fs.existsSync(baselinePath);
}

/**
 * Whether the demo seed put the example trips in since this mark was last read.
 *
 * The first baseline is saved only after a real seed, as it always was: a demo
 * database that already holds data but has no baseline keeps it that way, and
 * the hourly reset stays a logged no-op until the admin saves one. The seed
 * runs inside the schema bootstrap, at boot before the container exists and
 * again after every reopen (a restore, the hourly swap), where it has no backup
 * port either. So it leaves this mark, and DemoResetJob, which has the port,
 * reads it once the app is up and again after each reopen
 * (`DatabaseLifecycle.onReopened`), saving the baseline when it is set.
 */
let seededExampleTrips = false;

function markExampleTripsSeeded(): void {
  seededExampleTrips = true;
}

/** Reads the mark and clears it, so one seed saves at most one baseline. */
function takeExampleTripsSeeded(): boolean {
  const seeded = seededExampleTrips;
  seededExampleTrips = false;
  return seeded;
}

export { resetDemoUser, saveBaseline, hasBaseline, markExampleTripsSeeded, takeExampleTripsSeeded };
