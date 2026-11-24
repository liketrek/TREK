/**
 * reset-admin.js and migrate-encryption.ts on an install whose database is
 * Postgres (TREK_DB_URL): neither opens or creates a SQLite file there, and
 * both refuse a SQLite path beside the URL. The key rotation checks that it
 * reaches the database before it asks for a key. The rotation itself on
 * Postgres is tests/postgres/migrate-encryption.test.ts; the reset on Postgres
 * goes through the built server's engine, which these SQLite-lane tests do
 * not have.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SERVER_ROOT = path.resolve(__dirname, '../../..');
/** Nothing listens there: the scripts stop before they connect, or fail to. */
const PG_URL = 'postgres://trek:secret@127.0.0.1:1/trek?sslmode=disable';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-scripts-pg-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function run(
  args: string[],
  env: Record<string, string>,
  input = '',
): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(process.execPath, args, {
      cwd: SERVER_ROOT,
      env: { ...process.env, ...env },
      input,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout, stderr: e.stderr };
  }
}

describe('maintenance scripts with TREK_DB_URL', () => {
  it('PGSCRIPTS-001: migrate-encryption.ts refuses DB_PATH beside TREK_DB_URL before it asks for a key, and touches no file', () => {
    const dbPath = path.join(tmpDir, 'travel.db');
    const r = run(
      ['--import', 'tsx', 'scripts/migrate-encryption.ts'],
      { TREK_DB_URL: PG_URL, DB_PATH: dbPath },
      'old-key\nnew-key\nyes\n',
    );
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('Old ENCRYPTION_KEY');
    expect(r.stderr).toContain('TREK_DB_URL and DB_PATH are both set');
    expect(r.stderr).toContain('nothing was changed');
    expect(fs.readdirSync(tmpDir)).toEqual([]);
  }, 60000);

  it('PGSCRIPTS-003: migrate-encryption.ts stops before it asks for a key when the database cannot be reached', () => {
    const r = run(
      ['--import', 'tsx', 'scripts/migrate-encryption.ts'],
      { TREK_DB_URL: PG_URL, DB_PATH: '', TREK_DB_FILE: '' },
      'old-key\nnew-key\nyes\n',
    );
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('Old ENCRYPTION_KEY');
    expect(r.stderr).toMatch(/Could not reach the database TREK_DB_URL names|Cannot write to/);
    expect(r.stdout).not.toContain('Backup created');
  }, 60000);

  it('PGSCRIPTS-002: reset-admin.js refuses TREK_DB_FILE beside TREK_DB_URL and creates no SQLite file', () => {
    const dbPath = path.join(tmpDir, 'travel.db');
    const r = run(['reset-admin.js'], { TREK_DB_URL: PG_URL, TREK_DB_FILE: dbPath, RESET_ADMIN_PASSWORD: 'x' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('TREK_DB_URL and TREK_DB_FILE are both set');
    expect(fs.readdirSync(tmpDir)).toEqual([]);
  }, 60000);
});

describe('maintenance scripts with TREK_DB_URL in the .env beside them', () => {
  /** The server's own dependencies, for a copy of a script outside server/. */
  const NODE_PATH = [path.join(SERVER_ROOT, 'node_modules'), path.join(SERVER_ROOT, '..', 'node_modules')].join(
    path.delimiter,
  );

  /** Copies `files` (relative to server/) into the temp dir, with a .env naming the Postgres database. */
  function install(files: string[]): void {
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(tmpDir, file)), { recursive: true });
      fs.copyFileSync(path.join(SERVER_ROOT, file), path.join(tmpDir, file));
    }
    fs.writeFileSync(path.join(tmpDir, '.env'), `TREK_DB_URL=${PG_URL}\n`);
  }

  it('PGSCRIPTS-004: reset-admin.js reads TREK_DB_URL from its .env, as the server does', () => {
    install(['reset-admin.js']);
    const dbPath = path.join(tmpDir, 'travel.db');
    const r = run([path.join(tmpDir, 'reset-admin.js')], {
      NODE_PATH,
      TREK_DB_FILE: dbPath,
      RESET_ADMIN_PASSWORD: 'x',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('TREK_DB_URL and TREK_DB_FILE are both set');
    expect(fs.existsSync(dbPath)).toBe(false);
  }, 60000);

  it('PGSCRIPTS-005: migrate-encryption.ts reads TREK_DB_URL from the .env, as the server does', () => {
    install(['scripts/migrate-encryption.ts', 'scripts/migrate-encryption-stores.ts']);
    const dbPath = path.join(tmpDir, 'travel.db');
    const r = run(
      ['--import', 'tsx', path.join(tmpDir, 'scripts', 'migrate-encryption.ts')],
      { NODE_PATH, DB_PATH: dbPath },
      'old-key\nnew-key\nyes\n',
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('TREK_DB_URL and DB_PATH are both set');
    expect(fs.existsSync(dbPath)).toBe(false);
  }, 60000);
});
