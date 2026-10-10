/**
 * db/database.ts opens the connection on first use, not at import.
 *
 * It used to call initDb() at module load, so importing anything that reached
 * it opened the database: index.ts had to defer loading the app until a
 * first-boot restore had put the backup's file in place. The connection is now
 * opened by its first reader (the ORM's first connect inside buildApp(), driven
 * by DatabaseLifecycle), and a connection closed on purpose for a restore stays
 * closed until it is reopened.
 *
 * The cases share the module's one connection and run in order.
 */
import {
  closeDb,
  db,
  getRawConnection,
  openDb,
  registerReinitializeHook,
  reinitialize,
} from '../../../src/db/database';

import { describe, expect, it, vi } from 'vitest';

const opened = vi.hoisted(() => ({ count: 0 }));

vi.mock('../../../src/db/connection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/db/connection')>();
  return {
    ...actual,
    openDatabase: (...args: Parameters<typeof actual.openDatabase>) => {
      opened.count++;
      return actual.openDatabase(...args);
    },
  };
});

describe('db/database.ts connection lifecycle', () => {
  it('DBOPEN-001: importing the module opens nothing', () => {
    expect(opened.count).toBe(0);
  });

  it('DBOPEN-002: the first reader opens it once, with the pragmas applied', () => {
    const handle = getRawConnection();
    expect(getRawConnection()).toBe(handle);
    expect(opened.count).toBe(1);
    expect(handle.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(handle.pragma('busy_timeout', { simple: true })).toBe(5000);
    // The Proxy reads through to the same handle.
    expect(db.open).toBe(true);
  });

  it('DBOPEN-003: a connection closed on purpose stays closed instead of quietly reopening', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      closeDb();
    } finally {
      log.mockRestore();
    }
    expect(() => getRawConnection()).toThrow('Database connection is not available (restore in progress?)');
    // test-sql-allow: tests that the raw db proxy itself refuses a statement while the connection is closed; no ORM is involved.
    expect(() => db.prepare('SELECT 1')).toThrow('Database connection is not available (restore in progress?)');
    expect(opened.count).toBe(1);
  });

  it('DBOPEN-004: openDb() reopens it, and opening an open connection is a no-op', () => {
    openDb();
    openDb();
    expect(opened.count).toBe(2);
    expect(getRawConnection().open).toBe(true);
  });

  it('DBOPEN-005: reinitialize() swaps in a fresh handle and then runs the registered hook', async () => {
    const before = getRawConnection();
    const seen: boolean[] = [];
    registerReinitializeHook(async () => {
      seen.push(getRawConnection() !== before && getRawConnection().open);
    });
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await reinitialize();
    } finally {
      log.mockRestore();
    }
    expect(before.open).toBe(false);
    expect(seen).toEqual([true]);
    expect(opened.count).toBe(3);
  });
});
