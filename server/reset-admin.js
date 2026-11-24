/**
 * Admin recovery — reset (or create) an admin account when you are locked out.
 *
 * Usage inside the container:
 *   docker exec -it -u node trek node server/reset-admin.js
 *   docker exec -it -u node -e RESET_ADMIN_EMAIL=me@example.com -e RESET_ADMIN_PASSWORD=secret trek node server/reset-admin.js
 *
 * Defaults to admin@trek.local with a generated password (printed below). The
 * account is flagged must_change_password, so you are prompted to set a new one
 * on first login.
 *
 * It works on the database the server runs on. With TREK_DB_URL set, that is
 * the Postgres database, reached through the server's own engine (its pool,
 * SSL settings and write lock, from the built server in dist/); no SQLite file
 * is opened or created then. Otherwise it is the SQLite file, honouring
 * TREK_DB_FILE, TREK_DB_JOURNAL_MODE and TREK_DB_SYNCHRONOUS the same way the
 * server does.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// The server reads its .env too (src/index.ts), so TREK_DB_URL kept there picks the same database here.
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

// Kept in sync with the seeder/authService cost factor.
const BCRYPT_COST = 12;

const email = process.env.RESET_ADMIN_EMAIL || 'admin@trek.local';
const password = process.env.RESET_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
const generated = !process.env.RESET_ADMIN_PASSWORD;

/** What the script prints once the account is reset or created. */
function report(outcome) {
  if (outcome.created) console.log(`\n✓ Admin account created: ${email} (username: ${outcome.username})`);
  else console.log(`\n✓ Admin password reset: ${email}`);
  if (generated) console.log(`  Password: ${password}`);
  console.log('  You will be asked to change the password on first login.\n');
}

/** The SQLite file the server runs on, reset with better-sqlite3. */
function resetOnSqlite() {
  const Database = require('better-sqlite3');

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
  // SQLite silently opens an unwritable file read-only (#2933); db.readonly can't tell.
  const notWritable = [dbPath, path.dirname(dbPath)].find((p) => {
    if (!fs.existsSync(p)) return false;
    try {
      fs.accessSync(p, fs.constants.W_OK);
      return false;
    } catch {
      return true;
    }
  });
  if (notWritable) {
    console.error(`Cannot write to ${notWritable} as uid ${process.getuid?.() ?? '?'}.`);
    console.error('Run this script as the user that owns the data directory. In the Docker image that is node:');
    console.error('  docker exec -it -u node trek node server/reset-admin.js');
    process.exit(1);
  }

  const db = new Database(dbPath);
  // Spelled out rather than left to better-sqlite3's default, so switching the
  // journal mode below waits for a busy server instead of failing on the spot.
  // Five seconds, same as src/db/database.ts.
  db.exec('PRAGMA busy_timeout = 5000');
  // Temp files in memory, like every connection src/db/connection.ts opens: a
  // container with a read-only root and no tmpfs on /tmp has nowhere to put them
  // (#2518).
  db.exec('PRAGMA temp_store = MEMORY');
  db.exec(`PRAGMA journal_mode = ${journalMode}`);
  db.exec(`PRAGMA synchronous = ${synchronous}`);

  const hash = bcrypt.hashSync(password, BCRYPT_COST);
  // Case-insensitive like login, so Admin@example.com is found as admin@example.com.
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);

  let outcome;
  if (existing) {
    // password_version moves on, as on every password change in the app: it is
    // what ends the sessions still signed in to an account that needed resetting.
    db.prepare('UPDATE users SET password_hash = ?, role = ?, must_change_password = 1, password_version = COALESCE(password_version, 0) + 1 WHERE id = ?')
      .run(hash, 'admin', existing.id);
    // Its sessions end too, so the account's session list shows none of them
    // as live. The table is missing on a database that no server tracking
    // sessions has booted yet; the password_version bump above already refuses
    // every token there.
    const sessionsTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_sessions'").get();
    if (sessionsTable) {
      db.prepare('UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL')
        .run(existing.id);
    }
    outcome = { created: false };
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
    outcome = { created: true, username };
  }

  report(outcome);
  db.close();
}

/**
 * The Postgres database in TREK_DB_URL, reset through the built server's
 * engine (dist/db/engine): the same pool options and SSL verification as the
 * server, and the same write lock, taken in one transaction with the reset.
 * The statements are the SQLite branch's, but for the session end, whose time
 * is written as the canonical `YYYY-MM-DD HH:MM:SS` UTC text the column holds.
 */
async function resetOnPostgres() {
  if ((process.env.TREK_DB_FILE || '').trim()) {
    console.error('TREK_DB_URL and TREK_DB_FILE are both set, so it is not clear which database is meant; nothing was changed.');
    process.exit(1);
  }
  let engineModule;
  try {
    engineModule = require('./dist/db/engine');
  } catch (err) {
    console.error(`The built server (${path.join(__dirname, 'dist')}) is needed to reach a Postgres database: ${err.message}`);
    console.error('Run this inside the TREK container, or run `npm run build --workspace=server` first.');
    process.exit(1);
  }
  const { MikroORM } = require('@mikro-orm/core');
  const engine = engineModule.resolveEngine();
  const orm = await MikroORM.init({ ...engineModule.buildOrmConfig(engine), pool: { min: 0, max: 1 } });
  try {
    const em = orm.em.fork();
    const hash = bcrypt.hashSync(password, BCRYPT_COST);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const outcome = await em.transactional(async (tx) => {
      await engine.serializeWrites(tx);
      const connection = tx.getConnection();
      const query = (sql, params = []) => connection.execute(sql, params, 'all', tx.getTransactionContext());
      const [existing] = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (existing) {
        await query(
          'UPDATE users SET password_hash = ?, role = ?, must_change_password = 1, password_version = COALESCE(password_version, 0) + 1 WHERE id = ?',
          [hash, 'admin', existing.id],
        );
        const [sessions] = await query("SELECT to_regclass('user_sessions') IS NOT NULL AS present");
        if (sessions && sessions.present) {
          await query('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [now, existing.id]);
        }
        return { created: false };
      }
      let username = 'admin';
      let n = 1;
      while ((await query('SELECT 1 FROM users WHERE username = ?', [username])).length > 0) {
        username = `admin${n++}`;
      }
      await query('INSERT INTO users (username, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)', [
        username,
        email,
        hash,
        'admin',
      ]);
      return { created: true, username };
    });
    report(outcome);
  } finally {
    await orm.close(true);
  }
}

if ((process.env.TREK_DB_URL || '').trim()) {
  resetOnPostgres().catch((err) => {
    console.error(`Could not reset the admin account on the Postgres database: ${err && err.message ? err.message : err}`);
    process.exit(1);
  });
} else {
  resetOnSqlite();
}
