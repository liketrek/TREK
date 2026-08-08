/**
 * Admin recovery — reset (or create) an admin account when you are locked out.
 *
 * Usage inside the container:
 *   docker exec -it trek node server/reset-admin.js
 *   docker exec -it -e RESET_ADMIN_EMAIL=me@example.com -e RESET_ADMIN_PASSWORD=secret trek node server/reset-admin.js
 *
 * Defaults to admin@trek.local with a generated password (printed below). The
 * account is flagged must_change_password, so you are prompted to set a new one
 * on first login. Honours TREK_DB_FILE, TREK_DB_JOURNAL_MODE and
 * TREK_DB_SYNCHRONOUS the same way the server does.
 */
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Kept in sync with the seeder/authService cost factor.
const BCRYPT_COST = 12;

const email = process.env.RESET_ADMIN_EMAIL || 'admin@trek.local';
const password = process.env.RESET_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
const generated = !process.env.RESET_ADMIN_PASSWORD;

// journal_mode is stored in the database file header, not per connection, so
// opening the file here decides the mode for the server too. Plain JS outside
// the Nest context can't reach src/app-config, hence the direct read — the
// defaults must match parsers.resolveDurability() (WAL + NORMAL, FULL once a
// rollback journal is in play). Run this via `docker exec` and the container's
// environment applies, same as for the server.
const journalModes = ['DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'WAL', 'OFF'];
const syncLevels = ['OFF', 'NORMAL', 'FULL', 'EXTRA'];

const wantedJournal = (process.env.TREK_DB_JOURNAL_MODE || '').trim().toUpperCase();
const journalMode = journalModes.includes(wantedJournal) ? wantedJournal : 'WAL';
if (wantedJournal && journalMode !== wantedJournal) {
  console.warn(`TREK_DB_JOURNAL_MODE="${process.env.TREK_DB_JOURNAL_MODE}" is not a SQLite journal mode — using ${journalMode}.`);
}

const wantedSync = (process.env.TREK_DB_SYNCHRONOUS || '').trim().toUpperCase();
const defaultSync = journalMode === 'WAL' ? 'NORMAL' : 'FULL';
const synchronous = syncLevels.includes(wantedSync) ? wantedSync : defaultSync;
if (wantedSync && synchronous !== wantedSync) {
  console.warn(`TREK_DB_SYNCHRONOUS="${process.env.TREK_DB_SYNCHRONOUS}" is not a SQLite synchronous level — using ${synchronous}.`);
}

const dbPath = process.env.TREK_DB_FILE || path.join(__dirname, 'data/travel.db');
const db = new Database(dbPath);
// Spelled out rather than left to better-sqlite3's default, so switching the
// journal mode below waits for a busy server instead of failing on the spot.
// Five seconds, same as src/db/database.ts.
db.exec('PRAGMA busy_timeout = 5000');
db.exec(`PRAGMA journal_mode = ${journalMode}`);
db.exec(`PRAGMA synchronous = ${synchronous}`);

const hash = bcrypt.hashSync(password, BCRYPT_COST);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, role = ?, must_change_password = 1 WHERE email = ?')
    .run(hash, 'admin', email);
  console.log(`\n✓ Admin password reset: ${email}`);
} else {
  // 'admin' is usually taken by the first-run seed — pick the first free username
  // so the insert can't trip the UNIQUE(username) constraint.
  let username = 'admin';
  let n = 1;
  while (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    username = `admin${n++}`;
  }
  db.prepare('INSERT INTO users (username, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)')
    .run(username, email, hash, 'admin');
  console.log(`\n✓ Admin account created: ${email} (username: ${username})`);
}

if (generated) console.log(`  Password: ${password}`);
console.log('  You will be asked to change the password on first login.\n');

db.close();
