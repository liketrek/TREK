/**
 * Admin recovery — reset (or create) an admin account when you are locked out.
 *
 * Usage inside the container:
 *   docker exec -it trek node server/reset-admin.js
 *   docker exec -it -e RESET_ADMIN_EMAIL=me@example.com -e RESET_ADMIN_PASSWORD=secret trek node server/reset-admin.js
 *
 * Defaults to admin@trek.local with a generated password (printed below). The
 * account is flagged must_change_password, so you are prompted to set a new one
 * on first login. Honours TREK_DB_FILE the same way the server does.
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

const dbPath = process.env.TREK_DB_FILE || path.join(__dirname, 'data/travel.db');
const db = new Database(dbPath);

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
