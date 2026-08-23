/**
 * demo-reset's DB path.
 *
 * demo-reset closes the live connection, copies the baseline over the database
 * file and reopens. It used to compute that file itself as data/travel.db, which
 * is wrong the moment TREK_DB_FILE moves the database elsewhere: the baseline
 * lands on an unrelated file and the real database is never reset. The path has
 * to come from the connection that database.ts actually opened, so what these
 * cases assert is which file each copy names.
 *
 * demo-reset resolves ../db/database through a runtime require() — the module is
 * a boot-time singleton — and vitest's mock registry never sees that call: it
 * goes to Node's own resolver, which cannot load a .ts file and throws
 * "Cannot find module '../db/database'". Hence the loader below, which is the
 * seam that lets the module run at all. The file system is spied rather than
 * written to, because the baseline path is fixed at data/travel-baseline.db and
 * a developer running a demo instance has a real one sitting there.
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require('node:module');

const BASELINE = path.resolve(__dirname, '..', '..', '..', 'data', 'travel-baseline.db');
const LIVE_DB = path.join(path.sep, 'srv', 'trek', 'custom-name.db');

const dbStub = {
  name: LIVE_DB,
  exec: vi.fn(),
  prepare: vi.fn(() => ({ get: () => undefined, all: () => [], run: () => undefined })),
};
const databaseModule = { db: dbStub, closeDb: vi.fn(), reinitialize: vi.fn() };

// Teach Node's require how to answer the one runtime require demo-reset makes.
const previousLoader = Module._extensions['.ts'];
Module._extensions['.ts'] = (mod: { exports: unknown }, filename: string) => {
  if (filename.endsWith(path.join('src', 'db', 'database.ts'))) {
    mod.exports = databaseModule;
    return;
  }
  throw new Error(`unexpected runtime require of ${filename}`);
};
afterAll(() => {
  if (previousLoader) Module._extensions['.ts'] = previousLoader;
  else delete Module._extensions['.ts'];
});

import { resetDemoUser, saveBaseline } from '../../../src/demo/demo-reset';

describe('demo-reset DB path', () => {
  let copyFileSync: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dbStub.name = LIVE_DB;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    copyFileSync = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'existsSync').mockImplementation(((p: fs.PathLike) => String(p) === BASELINE) as typeof fs.existsSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DEMORESET-001: saves the baseline from the file the connection has open', () => {
    saveBaseline();
    expect(copyFileSync).toHaveBeenCalledWith(LIVE_DB, BASELINE);
  });

  it('DEMORESET-002: restores the baseline onto that same file, not data/travel.db', () => {
    resetDemoUser();
    expect(copyFileSync).toHaveBeenCalledWith(BASELINE, LIVE_DB);
    // Closed before the copy and reopened after it — copying over an open
    // SQLite file is how a database ends up half of each.
    expect(databaseModule.closeDb).toHaveBeenCalled();
    expect(databaseModule.reinitialize).toHaveBeenCalled();
  });

  it('DEMORESET-003: an in-memory database is left alone rather than copied around', () => {
    dbStub.name = ':memory:';
    saveBaseline();
    resetDemoUser();
    expect(copyFileSync).not.toHaveBeenCalled();
  });
});
