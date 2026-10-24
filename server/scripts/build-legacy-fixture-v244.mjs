#!/usr/bin/env node
// Rebuilds tests/fixtures/legacy/legacy-v244.sql: a database as the v4.3.3 release left it.
//
// 1. `git archive v4.3.3` the server sources into a temp dir outside the repo and
//    point its node_modules at this checkout's (the runner only needs better-sqlite3,
//    bcryptjs and @trek/shared, none of which changed shape for it).
// 2. Boot that release's own database layer once against an empty file, so the
//    schema is exactly what its createTables() and positional runner produced.
// 3. Insert synthetic rows across the main tables, pin every timestamp, VACUUM.
// 4. Write the result as a sqlite3 `.dump`-style script, then delete the temp dir.
//
// Run from server/: node scripts/build-legacy-fixture-v244.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, '..');
const REPO = path.join(SERVER, '..');
const OUT = path.join(SERVER, 'tests', 'fixtures', 'legacy', 'legacy-v244.sql');
const TAG = 'v4.3.3';
const T = '2026-09-26 10:00:00';

const HEADER = `-- Legacy-runner install at schema_version 244: the ${TAG} release (the last one shipped
-- with the positional runner), booted once on an empty data dir with no DEMO_MODE, then
-- synthetic rows across the main tables (users, trips, members, days, places, assignments,
-- a booked stay, reservations with endpoints, budget with splits, packing, todos, notes,
-- file metadata, tags, a journey with an entry, a notification). Every timestamp is pinned.
-- No credential: every password_hash is a placeholder.
-- Built by scripts/build-legacy-fixture-v244.mjs. Loaded by tests/helpers/legacy-fixture.ts.`;

function bootRelease(tmp) {
  const archive = path.join(tmp, 'src.tar');
  execFileSync('git', [
    '-C',
    REPO,
    'archive',
    '-o',
    archive,
    TAG,
    'server/src',
    'server/package.json',
    'server/tsconfig.json',
  ]);
  // Relative names: GNU tar reads a drive letter as a remote host.
  execFileSync('tar', ['-xf', 'src.tar'], { cwd: tmp });
  fs.rmSync(archive);
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(tmp, 'node_modules'), 'junction');
  fs.symlinkSync(path.join(SERVER, 'node_modules'), path.join(tmp, 'server', 'node_modules'), 'junction');

  const dbFile = path.join(tmp, 'data', 'travel.db');
  const boot = path.join(tmp, 'server', 'boot.cjs');
  fs.writeFileSync(boot, "require('./src/db/database.ts').closeDb();\n");
  const env = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    NODE_ENV: 'production',
    TREK_DB_FILE: dbFile,
    ENCRYPTION_KEY: '0'.repeat(64),
    ADMIN_EMAIL: 'admin@example.test',
    ADMIN_PASSWORD: 'fixture-only-unused',
  };
  execFileSync(process.execPath, ['--import', 'tsx', boot], { cwd: path.join(tmp, 'server'), env, stdio: 'ignore' });
  return dbFile;
}

function seed(db) {
  const ins = (table, row) => {
    const cols = Object.keys(row);
    db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(
      ...cols.map((c) => row[c]),
    );
  };

  db.prepare(`UPDATE users SET password_hash = 'fixture-login-disabled' WHERE id = 1`).run();
  // Mixed case on purpose: the case-insensitive email index must accept it.
  ins('users', {
    id: 2,
    username: 'alice',
    email: 'Alice.Traveller@Example.test',
    password_hash: 'fixture-login-disabled',
    display_name: 'Alice',
  });
  ins('users', { id: 3, username: 'bob', email: 'bob@example.test', password_hash: 'fixture-login-disabled' });
  ins('settings', { user_id: 2, key: 'temperature_unit', value: 'celsius' });
  ins('settings', { user_id: 3, key: 'language', value: 'de' });

  // Trip 1 is upcoming and shared; trip 2 lies in the past with a reminder long due.
  ins('trips', {
    id: 1,
    user_id: 2,
    title: 'Lisbon long weekend',
    description: 'Synthetic upgrade fixture trip',
    start_date: '2027-05-10',
    end_date: '2027-05-12',
    currency: 'EUR',
    reminder_days: 3,
  });
  ins('trips', {
    id: 2,
    user_id: 3,
    title: 'Alps hiking',
    start_date: '2026-03-01',
    end_date: '2026-03-02',
    currency: 'CHF',
    reminder_days: 1,
    is_archived: 1,
  });
  ins('trip_members', { trip_id: 1, user_id: 3, invited_by: 2 });

  for (const [id, trip_id, day_number, date, title] of [
    [1, 1, 1, '2027-05-10', 'Arrival'],
    [2, 1, 2, '2027-05-11', null],
    [3, 1, 3, '2027-05-12', 'Departure'],
    [4, 2, 1, '2026-03-01', null],
    [5, 2, 2, '2026-03-02', null],
  ]) {
    ins('days', { id, trip_id, day_number, date, title });
  }

  ins('places', {
    id: 1,
    trip_id: 1,
    name: 'Hotel Alfama',
    lat: 38.7115,
    lng: -9.13,
    address: 'Rua dos Remedios 1, Lisboa',
    category_id: 1,
  });
  ins('places', {
    id: 2,
    trip_id: 1,
    name: 'Torre de Belem',
    lat: 38.6916,
    lng: -9.216,
    address: 'Av. Brasilia, Lisboa',
    category_id: 3,
    price: 12.5,
    currency: 'EUR',
    notes: 'Book online',
  });
  ins('places', {
    id: 3,
    trip_id: 1,
    name: 'Time Out Market',
    lat: 38.7069,
    lng: -9.1459,
    category_id: 2,
    place_time: '19:30',
  });
  ins('places', { id: 4, trip_id: 2, name: 'Gornergrat', lat: 45.9833, lng: 7.7847, category_id: 3 });
  ins('places', { id: 5, trip_id: 1, name: 'Fado bar', lat: 38.711, lng: -9.129, category_id: 2 });

  // The canaries tests/helpers/legacy-upgrade-suite.ts asserts on, as in legacy-v242:
  // user-set times on assignments 1 to 3 of day 2, and the booked night after them.
  ins('day_accommodations', {
    id: 1,
    trip_id: 1,
    place_id: 1,
    start_day_id: 1,
    end_day_id: 3,
    check_in: '15:00',
    check_out: '11:00',
    confirmation: 'HTL-4242',
  });
  ins('day_assignments', {
    id: 1,
    day_id: 2,
    place_id: 2,
    order_index: 0,
    assignment_time: '09:00',
    assignment_end_time: '12:00',
  });
  ins('day_assignments', { id: 2, day_id: 2, place_id: 3, order_index: 1, assignment_time: '18:00' });
  ins('day_assignments', { id: 3, day_id: 2, place_id: 5, order_index: 2, assignment_time: '20:00' });
  ins('day_assignments', { id: 4, day_id: 2, place_id: 1, order_index: 3, accommodation_id: 1 });
  ins('day_assignments', { id: 5, day_id: 1, place_id: 1, order_index: 0, accommodation_id: 1 });
  ins('day_assignments', { id: 6, day_id: 4, place_id: 4, order_index: 0 });
  ins('day_notes', { day_id: 2, trip_id: 1, text: 'Tram 15 to Belem', time: '09:30', sort_order: 0 });

  ins('reservations', {
    id: 1,
    trip_id: 1,
    day_id: 1,
    title: 'TP 1351 Frankfurt to Lisbon',
    reservation_time: '2027-05-10T08:15',
    reservation_end_time: '2027-05-10T10:05',
    confirmation_number: 'ABC123',
    status: 'confirmed',
    type: 'flight',
  });
  ins('reservation_endpoints', {
    reservation_id: 1,
    role: 'from',
    sequence: 0,
    name: 'Frankfurt',
    code: 'FRA',
    lat: 50.0379,
    lng: 8.5622,
    timezone: 'Europe/Berlin',
    local_time: '08:15',
    local_date: '2027-05-10',
  });
  ins('reservation_endpoints', {
    reservation_id: 1,
    role: 'to',
    sequence: 1,
    name: 'Lisbon',
    code: 'LIS',
    lat: 38.7742,
    lng: -9.1342,
    timezone: 'Europe/Lisbon',
    local_time: '10:05',
    local_date: '2027-05-10',
  });
  ins('reservations', {
    id: 2,
    trip_id: 1,
    day_id: 1,
    end_day_id: 3,
    place_id: 1,
    accommodation_id: 1,
    title: 'Hotel Alfama',
    confirmation_number: 'HTL-4242',
    status: 'confirmed',
    type: 'hotel',
  });

  ins('budget_items', {
    id: 1,
    trip_id: 1,
    category: 'Accommodation',
    name: 'Hotel Alfama, two nights',
    total_price: 312.4,
    persons: 2,
    days: 2,
    paid_by_user_id: 2,
    expense_date: '2027-05-10',
    reservation_id: 2,
    currency: 'EUR',
  });
  ins('budget_item_members', { budget_item_id: 1, user_id: 2, paid: 1, amount: 156.2 });
  ins('budget_item_members', { budget_item_id: 1, user_id: 3, paid: 0, amount: 156.2 });
  ins('budget_items', {
    id: 2,
    trip_id: 1,
    category: 'Food',
    name: 'Dinner at the market',
    total_price: 64,
    persons: 2,
    paid_by_user_id: 3,
    currency: 'EUR',
  });

  ins('packing_bags', {
    id: 1,
    trip_id: 1,
    name: 'Carry-on',
    color: '#3b82f6',
    weight_limit_grams: 8000,
    sort_order: 0,
    user_id: 2,
  });
  ins('packing_items', {
    trip_id: 1,
    name: 'Passport',
    checked: 1,
    category: 'Documents',
    sort_order: 0,
    bag_id: 1,
    quantity: 1,
  });
  ins('packing_items', {
    trip_id: 1,
    name: 'Sunscreen',
    checked: 0,
    category: 'Toiletries',
    sort_order: 1,
    weight_grams: 150,
    quantity: 1,
  });
  ins('packing_items', {
    trip_id: 1,
    name: 'Private charger',
    checked: 0,
    category: 'Tech',
    sort_order: 2,
    is_private: 1,
    owner_id: 3,
    quantity: 1,
  });

  ins('todo_items', {
    trip_id: 1,
    name: 'Buy Lisboa Card',
    checked: 0,
    category: 'Tickets',
    sort_order: 0,
    due_date: '2027-05-01',
    assigned_user_id: 3,
    priority: 1,
  });
  ins('collab_notes', {
    trip_id: 1,
    user_id: 2,
    category: 'Ideas',
    title: 'Fado evening',
    content: 'Ask the hotel for a tip',
  });

  ins('trip_files', {
    id: 1,
    trip_id: 1,
    reservation_id: 1,
    filename: 'fixture-boarding-pass.pdf',
    original_name: 'Boarding pass.pdf',
    file_size: 48213,
    mime_type: 'application/pdf',
    uploaded_by: 2,
  });
  ins('trip_files', {
    id: 2,
    trip_id: 1,
    place_id: 2,
    filename: 'fixture-tickets.pdf',
    original_name: 'Tickets.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    uploaded_by: 3,
    starred: 1,
  });

  ins('tags', { id: 1, user_id: 2, name: 'Must see', color: '#ef4444' });
  ins('place_tags', { place_id: 2, tag_id: 1 });

  ins('journeys', {
    id: 1,
    user_id: 2,
    title: 'Portugal 2027',
    subtitle: 'Three days by the river',
    status: 'draft',
    created_at: T,
    updated_at: T,
  });
  ins('journey_trips', { journey_id: 1, trip_id: 1, added_at: T });
  ins('journey_contributors', { journey_id: 1, user_id: 3, role: 'editor', added_at: T });
  ins('journey_entries', {
    id: 1,
    journey_id: 1,
    source_trip_id: 1,
    source_place_id: 2,
    author_id: 2,
    type: 'entry',
    title: 'Belem in the sun',
    story: 'Pasteis first, tower second.',
    entry_date: '2027-05-11',
    entry_time: '11:00',
    location_name: 'Belem',
    location_lat: 38.6916,
    location_lng: -9.216,
    mood: 'amazing',
    visibility: 'shared',
    sort_order: 0,
    created_at: T,
    updated_at: T,
  });

  ins('notifications', {
    type: 'simple',
    scope: 'trip',
    target: 1,
    sender_id: 2,
    recipient_id: 3,
    title_key: 'notif.test.title',
    text_key: 'notif.test.text',
    is_read: 0,
  });
}

/** Every timestamp the runner or a column default wrote is "now"; pin them so a rebuild is byte-stable. */
function pinTimestamps(db) {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).all();
  for (const { name } of tables) {
    for (const { name: col } of db.prepare('SELECT name FROM pragma_table_info(?)').all(name)) {
      if (['created_at', 'updated_at', 'added_at', 'last_login'].includes(col)) {
        db.prepare(`UPDATE "${name}" SET "${col}" = ? WHERE "${col}" IS NOT NULL`).run(T);
      }
    }
  }
  db.prepare(`UPDATE migrations SET timestamp = 0`).run();
}

function literal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (Buffer.isBuffer(v)) return `X'${v.toString('hex')}'`;
  return `'${String(v).replaceAll("'", "''")}'`;
}

/** The layout `sqlite3 .dump` writes, which is what the other legacy fixtures are. */
function dump(db) {
  const out = [HEADER, 'PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;'];
  const master = db.prepare(`SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY rowid`).all();
  for (const { type, name, sql } of master) {
    if (type !== 'table' || name === 'sqlite_sequence') continue;
    out.push(`${sql};`);
    for (const row of db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).raw().all()) {
      out.push(`INSERT INTO ${name} VALUES(${row.map(literal).join(',')});`);
    }
  }
  out.push('PRAGMA writable_schema=ON;', 'DELETE FROM sqlite_sequence;');
  for (const row of db.prepare('SELECT name, seq FROM sqlite_sequence ORDER BY rowid').raw().all()) {
    out.push(`INSERT INTO sqlite_sequence VALUES(${row.map(literal).join(',')});`);
  }
  for (const { type, sql } of master) if (type !== 'table') out.push(`${sql};`);
  out.push('PRAGMA writable_schema=OFF;', 'COMMIT;', '');
  return out.join('\n');
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-fixture-v244-'));
try {
  const db = new Database(bootRelease(tmp));
  db.pragma('foreign_keys = ON');
  const version = db.prepare('SELECT version FROM schema_version').get().version;
  if (version !== 244) throw new Error(`${TAG} left schema_version ${version}, expected 244`);
  db.transaction(() => {
    seed(db);
    pinTimestamps(db);
  })();
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.exec('VACUUM');
  fs.writeFileSync(OUT, dump(db));
  db.close();
  console.log(`Wrote ${path.relative(SERVER, OUT)}`);
} finally {
  // The node_modules junctions go first, so the recursive delete can never walk into this checkout's.
  for (const link of [path.join(tmp, 'node_modules'), path.join(tmp, 'server', 'node_modules')]) {
    if (fs.existsSync(link)) fs.unlinkSync(link);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
