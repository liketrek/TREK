/**
 * reset-admin.js and migrate-encryption.ts refuse a database they cannot write
 * (#2933). A read-only file stands in for the wrong user; root writes it
 * regardless, so the cases skip under root.
 */
import Database from 'better-sqlite3';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SERVER_ROOT = path.resolve(__dirname, '../../..');
const isRoot = process.getuid?.() === 0;

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-readonly-'));
  dbPath = path.join(tmpDir, 'travel.db');
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT,
      must_change_password INTEGER DEFAULT 0,
      password_version INTEGER NOT NULL DEFAULT 0
    );
  `);
  db.close();
});

afterEach(() => {
  fs.chmodSync(tmpDir, 0o700);
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

const resetAdmin = () => run(['reset-admin.js'], { TREK_DB_FILE: dbPath, RESET_ADMIN_PASSWORD: 'Recovery12345!' });

const migrateEncryption = () =>
  run(['--import', 'tsx', 'scripts/migrate-encryption.ts'], { DB_PATH: dbPath }, 'old-key\nnew-key\nyes\n');

describe.skipIf(isRoot)('maintenance scripts on a database they cannot write', () => {
  it('READONLY-001: reset-admin.js refuses a read-only file and names the user to run as', () => {
    fs.chmodSync(dbPath, 0o444);

    const r = resetAdmin();

    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`Cannot write to ${dbPath}`);
    expect(r.stderr).toContain('docker exec -it -u node trek node server/reset-admin.js');
    expect(r.stderr).not.toContain('SQLITE_READONLY');
  }, 60000);

  it('READONLY-002: reset-admin.js refuses a directory it cannot write', () => {
    fs.chmodSync(tmpDir, 0o555);

    const r = resetAdmin();

    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`Cannot write to ${tmpDir}`);
  }, 60000);

  it('READONLY-003: migrate-encryption.ts refuses before asking for a key, and writes no backup', () => {
    fs.chmodSync(dbPath, 0o444);

    const r = migrateEncryption();

    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('Old ENCRYPTION_KEY');
    expect(r.stderr).toContain(`Cannot write to ${dbPath}`);
    expect(r.stderr).toContain(
      'docker exec -it -u node -w /app/server trek node --import tsx scripts/migrate-encryption.ts',
    );
    expect(fs.readdirSync(tmpDir).filter((f) => f.includes('.backup-'))).toEqual([]);
  }, 120000);
});
