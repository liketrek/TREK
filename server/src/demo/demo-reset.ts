import { readEnv } from '../app-config';
import { closeDb, getRawConnection, reinitialize } from '../db/database';
import {
  DemoRepository,
  type DemoAdminCredentialsRow,
  type DemoInstanceKeyRow,
} from '../db/repositories/DemoRepository';
import { MaintenanceRepository } from '../db/repositories/MaintenanceRepository';
import { RequestContext, type EntityManager } from '@mikro-orm/core';

import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '../../data');
const baselinePath = path.join(dataDir, 'travel-baseline.db');

// Where the live DB actually is. database.ts honours TREK_DB_FILE, so hardcoding
// data/travel.db here would copy the baseline over an unrelated file and leave
// the database we just closed untouched. The open connection knows its own path —
// read off the raw handle (the same accessor the ORM driver binds), not the `db`
// Proxy, and before `closeDb()` drops it.
function liveDbPath(): string {
  return getRawConnection().name;
}

/**
 * The active fork's `EntityManager`, resolved via `RequestContext.getEntityManager()`
 * — the same static accessor MikroORM's own per-request middleware and
 * `CronRegistrarService`'s `wrappedTick` populate. `demo-seed.ts` and this
 * file are plain function modules, not Nest providers, so neither can take
 * an `EntityManager` by constructor injection the way `DatabaseService`/
 * `CronRegistrarService` do — this is their equivalent choke point. Throws
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

async function resetDemoUser(): Promise<void> {
  if (!fs.existsSync(baselinePath)) {
    console.log('[Demo Reset] No baseline found, skipping. Admin must save baseline first.');
    return;
  }

  const dbPath = liveDbPath();
  if (dbPath === ':memory:') {
    console.log('[Demo Reset] In-memory database, nothing to restore.');
    return;
  }

  // Plan 3i Task 3 / R3 (SAFE spike verdict, task-0-report.md §7): the
  // pre-close reads (DMR1/DMR2) run through THIS fork — the one
  // `CronRegistrarService.register()`'s `wrappedTick` already opened for the
  // whole tick — since no swap has happened yet at this point.
  const preSwapEm = requireEntityManager();
  const demo = new DemoRepository(preSwapEm);
  const maintenance = new MaintenanceRepository(preSwapEm);

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

  // Flush WAL to main DB file. DMR3 — raw-by-nature exactly like backup's
  // BK1, converted onto the SAME shared `MaintenanceRepository.walCheckpoint()`
  // backup's own createBackup uses — it runs BEFORE the close/reopen below,
  // so it never waits on R3's spike at all.
  try {
    await maintenance.walCheckpoint();
  } catch (e) {}

  // Close DB connection
  closeDb();

  // Restore baseline
  try {
    fs.copyFileSync(baselinePath, dbPath);
    // Remove WAL/SHM files if they exist (stale from old connection)
    try {
      fs.unlinkSync(dbPath + '-wal');
    } catch (e) {}
    try {
      fs.unlinkSync(dbPath + '-shm');
    } catch (e) {}
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to restore baseline:', e instanceof Error ? e.message : e);
    await reinitialize();
    return;
  }

  // Reinitialize DB connection with restored baseline
  await reinitialize();

  // R3's ruling, applied regardless of the spike's specific finding: the
  // post-reopen writes (DMR5/DMR6) run inside a FRESH request context,
  // opened AFTER reinitialize() resolves — never the pre-swap fork above,
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
  });

  console.log('[Demo Reset] Database restored from baseline');
}

async function saveBaseline(): Promise<void> {
  const dbPath = liveDbPath();
  if (dbPath === ':memory:') {
    console.log('[Demo] In-memory database, no baseline to save.');
    return;
  }

  const em = requireEntityManager();
  const maintenance = new MaintenanceRepository(em);

  // Flush WAL so baseline file is self-contained. DMR3's dup — the SAME
  // shared `MaintenanceRepository.walCheckpoint()` `resetDemoUser`/backup's
  // `createBackup` use, not a second near-duplicate raw statement.
  try {
    await maintenance.walCheckpoint();
  } catch (e) {}

  fs.copyFileSync(dbPath, baselinePath);
  console.log('[Demo] Baseline saved');
}

function hasBaseline(): boolean {
  return fs.existsSync(baselinePath);
}

export { resetDemoUser, saveBaseline, hasBaseline };
