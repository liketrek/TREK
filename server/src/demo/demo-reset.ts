import fs from 'fs';
import path from 'path';
import { readEnv } from '../app-config';

const dataDir = path.join(__dirname, '../../data');
const baselinePath = path.join(dataDir, 'travel-baseline.db');

// Where the live DB actually is. database.ts honours TREK_DB_FILE, so hardcoding
// data/travel.db here would copy the baseline over an unrelated file and leave
// the database we just closed untouched. The open connection knows its own path.
function liveDbPath(db: { name: string }): string {
  return db.name;
}

function resetDemoUser(): void {
  if (!fs.existsSync(baselinePath)) {
    console.log('[Demo Reset] No baseline found, skipping. Admin must save baseline first.');
    return;
  }

  const { db, closeDb, reinitialize } = require('../db/database');
  const dbPath = liveDbPath(db);
  if (dbPath === ':memory:') {
    console.log('[Demo Reset] In-memory database, nothing to restore.');
    return;
  }

  // Save admin's current credentials and API keys (these should survive the reset)
  // NOTE: different default than demo-seed (admin@trek.app) — pinned legacy quirk.
  const adminEmail = readEnv().demo.adminEmailRaw || 'admin@nomad.app';
  interface AdminData { password_hash: string; maps_api_key: string | null; openweather_api_key: string | null; unsplash_api_key: string | null; avatar: string | null; }
  let adminData: AdminData | undefined = undefined;
  try {
    adminData = db.prepare(
      'SELECT password_hash, maps_api_key, openweather_api_key, unsplash_api_key, avatar FROM users WHERE email = ?'
    ).get(adminEmail) as AdminData | undefined;
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to read admin data:', e instanceof Error ? e.message : e);
  }

  // The Places/Unsplash keys the searches actually use live in app_settings
  // since #1939, so they have to survive the restore alongside the columns —
  // otherwise the demo instance loses map search on every reset.
  interface InstanceKeyRow { key: string; value: string | null }
  let instanceKeys: InstanceKeyRow[] = [];
  try {
    instanceKeys = db.prepare(
      "SELECT key, value FROM app_settings WHERE key IN ('maps_api_key', 'unsplash_api_key')"
    ).all() as InstanceKeyRow[];
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to read instance API keys:', e instanceof Error ? e.message : e);
  }

  // Flush WAL to main DB file
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (e) {}

  // Close DB connection
  closeDb();

  // Restore baseline
  try {
    fs.copyFileSync(baselinePath, dbPath);
    // Remove WAL/SHM files if they exist (stale from old connection)
    try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
    try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}
  } catch (e: unknown) {
    console.error('[Demo Reset] Failed to restore baseline:', e instanceof Error ? e.message : e);
    reinitialize();
    return;
  }

  // Reinitialize DB connection with restored baseline
  reinitialize();

  // Restore admin's latest credentials (in case admin changed password/API keys after baseline was saved)
  if (adminData) {
    try {
      const { db: freshDb } = require('../db/database');
      freshDb.prepare(
        'UPDATE users SET password_hash = ?, maps_api_key = ?, openweather_api_key = ?, unsplash_api_key = ?, avatar = ? WHERE email = ?'
      ).run(
        adminData.password_hash,
        adminData.maps_api_key,
        adminData.openweather_api_key,
        adminData.unsplash_api_key,
        adminData.avatar,
        adminEmail
      );
    } catch (e: unknown) {
      console.error('[Demo Reset] Failed to restore admin credentials:', e instanceof Error ? e.message : e);
    }
  }

  if (instanceKeys.length) {
    try {
      const { db: freshDb } = require('../db/database');
      const upsert = freshDb.prepare(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      );
      for (const row of instanceKeys) upsert.run(row.key, row.value);
    } catch (e: unknown) {
      console.error('[Demo Reset] Failed to restore instance API keys:', e instanceof Error ? e.message : e);
    }
  }

  console.log('[Demo Reset] Database restored from baseline');
}

function saveBaseline(): void {
  const { db } = require('../db/database');
  const dbPath = liveDbPath(db);
  if (dbPath === ':memory:') {
    console.log('[Demo] In-memory database, no baseline to save.');
    return;
  }

  // Flush WAL so baseline file is self-contained
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (e) {}

  fs.copyFileSync(dbPath, baselinePath);
  console.log('[Demo] Baseline saved');
}

function hasBaseline(): boolean {
  return fs.existsSync(baselinePath);
}

export { resetDemoUser, saveBaseline, hasBaseline };
