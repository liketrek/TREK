/**
 * PGLANE-001..005: the Postgres lane (vitest.pg.config.ts) is worked out from
 * the test files by tests/postgres/lane.ts. This suite runs in the SQLite lane,
 * so every change is checked, and keeps that discovery and its two exception
 * lists honest: a suite that boots the app either runs on Postgres too, or is
 * named with the reason it cannot.
 */
import { postgresLane, readSnapshotBaseline, scanSuites, SQLITE_ONLY, type LaneScan } from '../postgres/lane';

import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const SERVER_ROOT = path.resolve(__dirname, '..', '..');

let scan: LaneScan;

beforeAll(() => {
  scan = scanSuites();
}, 60_000);

describe('the Postgres lane', () => {
  it('PGLANE-001: every suite that names a boot entry point is one the discovery follows', () => {
    // A suite that uses buildApp, bootTestApp or AppModule without the import
    // walk in lane.ts reaching src/bootstrap.ts or src/nest/app.module.ts got
    // there some other way (a helper outside tests/, a computed import). Teach
    // lane.ts that way; until then the suite would silently stay on SQLite.
    expect(
      scan.undiscovered,
      'These suites name buildApp/bootTestApp/AppModule but tests/postgres/lane.ts does not see them boot the app. ' +
        'Import the boot module (or a tests/ helper that does) statically, or extend the import walk in lane.ts.',
    ).toEqual([]);
  });

  it('PGLANE-002: every SQLite-only exclusion names a suite that would otherwise run on Postgres', () => {
    const stale = Object.keys(SQLITE_ONLY).filter((file) => !scan.realDatabase.includes(file));
    expect(
      stale,
      'These SQLITE_ONLY entries in tests/postgres/lane.ts no longer name a suite that boots the app on the real ' +
        'database module (renamed, deleted or rewritten). Remove or rename the entry.',
    ).toEqual([]);
    for (const [file, reason] of Object.entries(SQLITE_ONLY)) {
      expect(reason.trim().length, `${file} needs a reason in SQLITE_ONLY`).toBeGreaterThan(20);
    }
  });

  it('PGLANE-003: a new suite that boots the app does it on the real database module, so it runs on Postgres too', () => {
    const baseline = new Set(readSnapshotBaseline());
    const added = scan.snapshot.filter((file) => !baseline.has(file));
    expect(
      added,
      'These suites boot the app over the SQLite snapshot mock (vi.mock of src/db/database), so they can never ' +
        'run on Postgres. Drop the mock and seed through tests/helpers/factories with app.get(MikroORM), as ' +
        'tests/e2e/packing-mcp.e2e.test.ts does; the suite then joins the Postgres lane by itself. If it tests ' +
        'SQLite itself, keep it on the real database module and add it to SQLITE_ONLY in tests/postgres/lane.ts ' +
        'with the reason.',
    ).toEqual([]);
  });

  it('PGLANE-004: the snapshot baseline only shrinks', () => {
    const current = new Set(scan.snapshot);
    const gone = readSnapshotBaseline().filter((file) => !current.has(file));
    expect(
      gone,
      'These entries of tests/postgres/snapshot-suites-baseline.json no longer boot the app over the snapshot ' +
        'mock (ported to the real database module, renamed or deleted). Remove them from the baseline.',
    ).toEqual([]);
  });

  it('PGLANE-005: the lane holds the Postgres-only suites and every discovered suite but the exclusions, and they exist', () => {
    const lane = postgresLane(scan);
    expect(lane[0]).toBe('tests/postgres/**/*.test.ts');
    const files = lane.slice(1);
    expect(files.length).toBe(scan.realDatabase.length - Object.keys(SQLITE_ONLY).length);
    for (const file of files) {
      expect(fs.existsSync(path.join(SERVER_ROOT, file)), file).toBe(true);
      expect(file in SQLITE_ONLY, file).toBe(false);
    }
    // A suite of each kind the lane exists for: an MCP e2e, an HTTP integration
    // flow and a unit suite on a booted container.
    expect(files).toEqual(
      expect.arrayContaining([
        'tests/e2e/packing-mcp.e2e.test.ts',
        'tests/integration/trip-invite-removal.test.ts',
        'tests/unit/nest/assistant/assistant-tools.service.test.ts',
      ]),
    );
  });
});
