/**
 * PGMOVE-001..006: moving a SQLite install into Postgres
 * (`src/db/engine/postgres/sqlite-move/`), end to end on the lane's server.
 *
 * A SQLite file is migrated by the SQLite engine's own bootstrap and seeded
 * through the test factories with rows across the main tables, including a
 * reply to a chat message (a table that points at itself) and a plugin's own
 * database. The move copies it into this file's database, emptied first, and
 * the app then boots on the result: the rows read back through the entities
 * and the repositories exactly as they read from the SQLite file, the plugin
 * finds its rows in its schema, new ids continue after the copied ones, and
 * a second move into the now filled database is refused.
 */
import { buildApp } from '../../src/bootstrap';
import { buildOrmConfig, resolveEngine } from '../../src/db/engine';
import { readPostgresBaseline } from '../../src/db/engine/postgres/baseline';
import { PluginDataSlots, poolClients, PostgresPluginDataStore } from '../../src/db/engine/postgres/plugin-data-store';
import { moveSqliteToPostgres, type MoveSummary } from '../../src/db/engine/postgres/sqlite-move/move';
import { MoveRefusal } from '../../src/db/engine/postgres/sqlite-move/refusal';
import { SqliteEngine } from '../../src/db/engine/sqlite/sqlite-engine';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { CollabMessages } from '../../src/db/entities/CollabMessages.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { ReservationEndpoints } from '../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { knownMigrationNames } from '../../src/db/known-migrations';
import { runSchemaBootstrap, type AnyOrm } from '../../src/db/orm';
import { createBoundSqliteDriver } from '../../src/db/orm-driver';
import { makeBudgetItem } from '../helpers/factories/budget';
import { makeCollabMessage } from '../helpers/factories/collab';
import { inContext, type FactoryOrm } from '../helpers/factories/context';
import { makeTripFile } from '../helpers/factories/files';
import { makeDayAssignment } from '../helpers/factories/itinerary';
import { makePlace } from '../helpers/factories/places';
import { makeReservation, makeReservationEndpoint } from '../helpers/factories/reservations';
import { findRows } from '../helpers/factories/rows';
import { setAppSetting, setUserSetting } from '../helpers/factories/settings';
import { makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { databaseUrl, withAdmin } from './databases';
import { MikroORM, type EntityClass, type Options } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PLUGIN_ID = 'move-notes';

let dir: string;
let handle: Database.Database;
let sqliteOrm: AnyOrm;
let app: INestApplication;
let pgOrm: MikroORM;
let summary: MoveSummary;
let tripId: number;

/** An ORM on its own SQLite file, migrated and seeded the way the SQLite engine brings a file to head. */
async function migratedSqlite(file: string): Promise<AnyOrm> {
  handle = new Database(file);
  handle.pragma('foreign_keys = ON');
  const config = buildOrmConfig(new SqliteEngine());
  // Typed as the engine's plain Options: the bound driver alone would make
  // init infer the SQLite driver's own entity manager, which config does not name.
  const options: Options = {
    ...config,
    driver: createBoundSqliteDriver(() => handle),
    dbName: file,
    migrations: { ...config.migrations, silent: true },
  };
  const orm = await MikroORM.init(options);
  await runSchemaBootstrap(orm, { snapshot: false });
  return orm;
}

/** Rows across the main tables, through the factories. */
async function seed(orm: FactoryOrm): Promise<void> {
  const { user } = await makeUser(orm, { display_name: 'Ada Lovelace' });
  const { user: friend } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, {
    title: 'Lisbon in spring',
    start_date: '2027-04-01',
    end_date: '2027-04-03',
    currency: 'EUR',
  });
  tripId = trip.id;
  const days = await readTripDays(orm, trip.id);
  const tower = await makePlace(orm, trip.id, { name: 'Torre de Belém', lat: 38.6916, lng: -9.216, notes: 'Go early' });
  const tram = await makePlace(orm, trip.id, { name: 'Tram 28', lat: 38.7139, lng: -9.1334, category: null });
  await makeDayAssignment(orm, days[0].id, tower.id, { notes: 'Morning' });
  await makeDayAssignment(orm, days[1].id, tram.id);
  const flight = await makeReservation(orm, trip.id, { title: 'TP 1234', type: 'flight', day: days[0].id });
  await makeReservationEndpoint(orm, flight.id, { role: 'from', sequence: 0 });
  await makeReservationEndpoint(orm, flight.id, {
    role: 'to',
    sequence: 1,
    name: 'Lisbon Humberto Delgado',
    code: 'LIS',
    lat: 38.7742,
    lng: -9.1342,
  });
  await makeBudgetItem(orm, trip.id, { name: 'Flights', total_price: 412.37, category: 'Transport' });
  await makeBudgetItem(orm, trip.id, { name: 'Pastéis', total_price: 7.5, category: 'Food' });
  await makeTripFile(orm, trip.id, { original_name: 'Boarding pass.pdf', file_size: 52_431 });
  await setUserSetting(orm, user.id, 'temperature_unit', 'celsius');
  await setAppSetting(orm, 'move_test_marker', 'ünïcode ✓');
  const question = await makeCollabMessage(orm, trip.id, user.id, { text: 'Who books the tram?' });
  await makeCollabMessage(orm, trip.id, friend.id, { text: 'I do', replyToRef: question.id });
}

/** A plugin's own database, as the SQLite store keeps it. */
function seedPluginData(root: string): void {
  fs.mkdirSync(path.join(root, PLUGIN_ID), { recursive: true });
  const plugin = new Database(path.join(root, PLUGIN_ID, 'plugin.db'));
  plugin.exec(
    'create table _plugin_migrations (id text primary key, applied_at integer);' +
      "insert into _plugin_migrations values ('001-notes', 1700000000000);" +
      "create table notes (id integer primary key autoincrement, body text not null default '', score real, raw blob);" +
      'create unique index notes_body on notes (body);' +
      "insert into notes (body, score, raw) values ('first', 1.5, x'00ff'), ('second', null, null), ('gone', 2, null);" +
      "delete from notes where body = 'gone';" +
      // Text in a column declared BLOB, and numbers in a column without a type: both come back as the plugin stored them,
      // negative zero (which a column without a type keeps) with its sign.
      'create table docs (id integer primary key, payload blob, n);' +
      `insert into docs values (1, '{"a":1}', 5), (2, 'plain', 2.5), (3, 'signed', -0.0);`,
  );
  plugin.close();
}

/** The worker's database, emptied: the move fills an empty database only. */
async function emptyWorkerDatabase(): Promise<void> {
  const adminUrl = process.env.TREK_TEST_DB_URL as string;
  const name = new URL(process.env.TREK_DB_URL as string).pathname.slice(1);
  expect(process.env.TREK_DB_URL).toBe(databaseUrl(adminUrl, name));
  await withAdmin(adminUrl, async (run) => {
    await run(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await run(`CREATE DATABASE "${name}"`);
  });
}

/** Runs the move into the worker's database through an ORM of the Postgres engine's own config. */
async function move(): Promise<MoveSummary> {
  const config = buildOrmConfig(resolveEngine());
  const orm = await MikroORM.init({
    ...config,
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { ...config.migrations, silent: true },
  });
  try {
    return await moveSqliteToPostgres({
      sqliteFile: path.join(dir, 'travel.db'),
      pluginsDataDir: path.join(dir, 'plugins-data'),
      orm,
      known: knownMigrationNames(),
      baseline: readPostgresBaseline,
      log: () => undefined,
    });
  } finally {
    await orm.close(true);
  }
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-pg-move-'));
  sqliteOrm = await migratedSqlite(path.join(dir, 'travel.db'));
  await seed(sqliteOrm);
  seedPluginData(path.join(dir, 'plugins-data'));
  await emptyWorkerDatabase();
  summary = await move();
  app = await buildApp();
  pgOrm = app.get(MikroORM);
}, 180_000);

afterAll(async () => {
  await app?.close();
  await sqliteOrm?.close(true);
  if (handle?.open) handle.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

/** Rows in a stable order: Postgres and SQLite need not sort text alike. */
function sorted<T>(rows: T[]): T[] {
  return [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

/** Runs `read` on both databases in a request context of its own. */
async function bothSides<T>(read: (orm: FactoryOrm) => Promise<T>): Promise<{ sqlite: T; postgres: T }> {
  return { sqlite: await read(sqliteOrm), postgres: await read(pgOrm) };
}

describe('moving a SQLite install to Postgres', () => {
  it('PGMOVE-001: copies every table and reports what it moved', async () => {
    const byLabel = new Map(summary.tables.map((table) => [table.label, table.rows]));
    expect(byLabel.get('users')).toBe((await findRows(sqliteOrm, Users)).length);
    expect(byLabel.get('trips')).toBe(1);
    expect(byLabel.get('days')).toBe(3);
    expect(byLabel.get('reservation_endpoints')).toBe(2);
    expect(byLabel.has('mikro_orm_migrations')).toBe(false);
    expect(summary.sequences).toBeGreaterThan(100);
    expect(summary.plugins).toEqual([
      expect.objectContaining({
        pluginId: PLUGIN_ID,
        schema: 'trek_plugin_move_notes',
        tables: [
          expect.objectContaining({ label: '_plugin_migrations', rows: 1 }),
          expect.objectContaining({ label: 'docs', rows: 3 }),
          expect.objectContaining({ label: 'notes', rows: 2 }),
        ],
      }),
    ]);
  });

  const entities: Array<[string, EntityClass<object>]> = [
    ['users', Users],
    ['trips', Trips],
    ['days', Days],
    ['places', Places],
    ['day_assignments', DayAssignments],
    ['reservations', Reservations],
    ['reservation_endpoints', ReservationEndpoints],
    ['budget_items', BudgetItems],
    ['trip_files', TripFiles],
    ['settings', Settings],
    ['collab_messages', CollabMessages],
  ];
  it.each(entities)('PGMOVE-002: %s read through the entities exactly as on SQLite', async (_name, entity) => {
    const { sqlite, postgres } = await bothSides((orm) => findRows(orm, entity));
    expect(sqlite.length).toBeGreaterThan(0);
    expect(sorted(postgres)).toEqual(sorted(sqlite));
  });

  it('PGMOVE-002b: app_settings keeps every row of the file (the boot adds its own keys beside them)', async () => {
    const { sqlite, postgres } = await bothSides((orm) => findRows(orm, AppSettings));
    expect(sqlite.some((row) => row.key === 'move_test_marker')).toBe(true);
    expect(postgres).toEqual(expect.arrayContaining(sqlite));
  });

  it('PGMOVE-003: the repositories answer the same on both engines', async () => {
    const { sqlite, postgres } = await bothSides((orm) =>
      inContext(orm, async (em) => ({
        days: await em.getRepository(Days).listByTrip(tripId),
        places: await em.getRepository(Places).listAllForTrip(tripId),
        assignments: await em.getRepository(DayAssignments).listAllForTrip(tripId),
        reservations: await em.getRepository(Reservations).listForTrip(tripId),
        endpoints: await em.getRepository(Reservations).listEndpointsForShare(tripId),
        budget: await em.getRepository(BudgetItems).listWithCategoryOrder(tripId),
      })),
    );
    for (const key of Object.keys(sqlite) as Array<keyof typeof sqlite>) {
      expect(sorted(postgres[key] as unknown[]), key).toEqual(sorted(sqlite[key] as unknown[]));
    }
    expect(postgres.endpoints).toHaveLength(2);
  });

  it('PGMOVE-004: a reply keeps the message it answers (a table pointing at itself)', async () => {
    const messages = await findRows(pgOrm, CollabMessages);
    const reply = messages.find((message) => message.text === 'I do');
    const question = messages.find((message) => message.text === 'Who books the tram?');
    expect(reply?.reply_to).toBe(question?.id);
  });

  it('PGMOVE-005: new rows continue after the copied ids; the plugin finds its rows, typed as stored, and its migration record', async () => {
    const { user } = await makeUser(pgOrm);
    const highest = Math.max(...(await findRows(sqliteOrm, Users)).map((row) => row.id));
    expect(user.id).toBeGreaterThan(highest);

    // The lane connects as a superuser, for which plugin SQL is refused (PGPLUG-013); the move is what is read here.
    const store = new PostgresPluginDataStore(
      PLUGIN_ID,
      poolClients(pgOrm.em.getConnection()),
      new PluginDataSlots(1),
      {},
      { refuseIfPrivileged: async () => undefined },
    );
    expect(await store.query('select id, body, score from notes order by id')).toEqual([
      { id: 1, body: 'first', score: 1.5 },
      { id: 2, body: 'second', score: null },
    ]);
    // Text from a BLOB column is still a string, and numbers from a column without a type still numbers.
    expect(await store.query('select id, payload, n from docs order by id')).toEqual([
      { id: 1, payload: '{"a":1}', n: 5 },
      { id: 2, payload: 'plain', n: 2.5 },
      { id: 3, payload: 'signed', n: -0 },
    ]);
    // The migration the plugin ran on SQLite is not run again, and the next id skips the one SQLite handed out.
    expect(await store.migrate('001-notes', 'create table notes (id bigint)')).toEqual({ applied: false });
    await store.exec("insert into notes (body) values ('third')");
    expect(await store.query("select id from notes where body = 'third'")).toEqual([{ id: 4 }]);
    store.close();
  });

  it('PGMOVE-006: a second move into the filled database is refused and changes nothing', async () => {
    const before = await findRows(pgOrm, Trips);
    await expect(move()).rejects.toBeInstanceOf(MoveRefusal);
    await expect(move()).rejects.toThrow(/The Postgres database is not empty/);
    expect(await findRows(pgOrm, Trips)).toEqual(before);
  });
});
