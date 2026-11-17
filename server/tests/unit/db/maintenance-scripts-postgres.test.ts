/**
 * reset-admin.js and migrate-encryption.ts on an install whose database is
 * Postgres (TREK_DB_URL): neither opens or creates a SQLite file there. The
 * key rotation refuses outright, since it cannot re-encrypt the secrets in
 * Postgres yet; the reset refuses a TREK_DB_FILE beside the URL, as the server
 * does. The reset itself on Postgres goes through the built server's engine,
 * which these SQLite-lane tests do not have.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SERVER_ROOT = path.resolve(__dirname, '../../..');
/** Never reached: both scripts stop before they connect. */
const PG_URL = 'postgres://trek:secret@127.0.0.1:1/trek?sslmode=disable';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-scripts-pg-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function run(args: string[], env: Record<string, string>, input = ''): { status: number; stderr: string } {
  try {
    execFileSync(process.execPath, args, {
      cwd: SERVER_ROOT,
      env: { ...process.env, ...env },
      input,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { status: 0, stderr: '' };
  } catch (err) {
    const e = err as { status: number; stderr: string };
    return { status: e.status, stderr: e.stderr };
  }
}

describe('maintenance scripts with TREK_DB_URL', () => {
  it('PGSCRIPTS-001: migrate-encryption.ts refuses before it asks for a key, and touches no file', () => {
    const dbPath = path.join(tmpDir, 'travel.db');
    const r = run(
      ['--import', 'tsx', 'scripts/migrate-encryption.ts'],
      { TREK_DB_URL: PG_URL, DB_PATH: dbPath },
      'old-key\nnew-key\nyes\n',
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('TREK_DB_URL is set');
    expect(r.stderr).toContain('Nothing was changed');
    expect(fs.readdirSync(tmpDir)).toEqual([]);
  }, 60000);

  it('PGSCRIPTS-002: reset-admin.js refuses TREK_DB_FILE beside TREK_DB_URL and creates no SQLite file', () => {
    const dbPath = path.join(tmpDir, 'travel.db');
    const r = run(['reset-admin.js'], { TREK_DB_URL: PG_URL, TREK_DB_FILE: dbPath, RESET_ADMIN_PASSWORD: 'x' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('TREK_DB_URL and TREK_DB_FILE are both set');
    expect(fs.readdirSync(tmpDir)).toEqual([]);
  }, 60000);
});
