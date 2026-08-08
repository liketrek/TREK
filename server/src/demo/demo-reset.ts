import fs from 'fs';
import path from 'path';
import { readEnv } from '../app-config';

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'travel.db');
const baselinePath = path.join(dataDir, 'travel-baseline.db');

function resetDemoUser(): void {
  if (!fs.existsSync(baselinePath)) {
    console.log('[Demo Reset] No baseline found, skipping. Admin must save baseline first.');
    return;
  }

  const { db, closeDb, reinitialize } = require('../db/database');

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

  console.log('[Demo Reset] Database restored from baseline');
}

function saveBaseline(): void {
  const { db } = require('../db/database');

  // Flush WAL so baseline file is self-contained
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (e) {}

  fs.copyFileSync(dbPath, baselinePath);
  console.log('[Demo] Baseline saved');
}

function hasBaseline(): boolean {
  return fs.existsSync(baselinePath);
}

export { resetDemoUser, saveBaseline, hasBaseline };
