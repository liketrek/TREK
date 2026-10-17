# Test factories over the ORM

The server tests used to seed and read their database with raw SQLite on the
synchronous better-sqlite3 handle (`testDb.prepare(...).run(...)`): thousands of
hand-written statements that skip the repositories, restate the schema by hand
and run on no other engine. The helpers in this folder do the same work through
MikroORM, the way the app does, and are what new fixtures use.
`npm run lint:test-sql` holds the raw statements that are left to a shrinking
baseline (see [Ratchet](#ratchet)).

## Getting an ORM handle

Every helper takes a `FactoryOrm` (anything with the ORM's global `em`) as its
first argument and runs in a request context of its own, so the same call works
in every kind of suite:

| Suite | Handle |
|---|---|
| `buildApp()` integration test | `const orm = nestApp.get(MikroORM)` (from `@mikro-orm/core`) after the app is built |
| partial-module e2e (`Test.createTestingModule`) | `const orm = await createTestOrm(db)` from `../helpers/test-orm`, closed with `await orm.close()` |
| unit test over `createSnapshotTestDb()` | `createTestOrm(testDb)`, as above |

The handle must sit on the migrated schema (`createSnapshotTestDb()`): an
entity reads and writes every mapped column, so a hand-rolled `CREATE TABLE`
with a few columns is not enough. A suite that still builds its own tables
switches to the snapshot when it converts (`tests/e2e/tags.e2e.test.ts` is the
example). `resetTestDb(testDb)` between tests keeps working: each helper call
opens a fresh context, so no identity map remembers a row the reset deleted.

## What is here

One file per domain, each returning the row as the app reads it (`EntityDTO`
of the entity, the `SELECT *` shape with the `*_id` columns filled in):

| File | Helpers |
|---|---|
| `users.ts` | `makeUser`, `makeAdmin`, `makeUserWithMfa`, `readUser`, `setImmichCredentials`, `setSynologyCredentials` |
| `trips.ts` | `makeTrip` (with one day per date), `makeDay`, `readTripDays`, `addTripMember`, `makeShareToken` |
| `places.ts` | `makePlace`, `makeCategory`, `makeTag`, `tagPlace` |
| `itinerary.ts` | `makeDayAssignment`, `makeDayNote`, `makeDayAccommodation` |
| `reservations.ts` | `makeReservation`, `makeReservationEndpoint`, `addReservationTraveler` |
| `budget.ts` | `makeBudgetItem`, `addBudgetItemMember`, `addBudgetItemPayer` |
| `packing.ts` | `makePackingItem`, `makePackingBag`, `addPackingBagMembers`, `addPackingItemRecipients` |
| `todos.ts` | `makeTodoItem` |
| `files.ts` | `makeTripFile`, `linkFile` |
| `journeys.ts` | `makeJourney` (owner added as contributor), `makeJourneyEntry`, `addJourneyContributor`, `linkTripToJourney` |
| `tours.ts` | `makeTour`, `addTourWaypoints` |
| `collections.ts` | `makeCollection`, `addCollectionMember`, `makeCollectionPlace`, `tagCollectionPlace`, `labelCollectionPlace` |
| `notifications.ts` | `makeNotification`, `setNotificationChannels`, `disableNotificationPref` |
| `settings.ts` | `setAppSetting`, `readAppSetting`, `setUserSetting`, `readUserSetting`, `setAddonEnabled`, `setCollabFeature` |
| `plugins.ts` | `makePlugin`, `makePluginSettingsField`, `setPluginUserConfig` |
| `tokens.ts` | `makeMcpToken`, `makeOauthClient`, `makeInviteToken` |
| `atlas.ts` | `makeBucketListItem`, `markCountryVisited`, `markRegionVisited` |
| `vacay.ts` | `makeVacayPlan`, `addVacayPlanMember`, `makeVacayEntry` |
| `photos.ts` | `addTripPhoto`, `addAlbumLink` |
| `collab.ts` | `makeCollabNote`, `makeCollabMessage` |

Each `make*` has defaults that make a valid row on its own and takes an
`overrides` object of the entity's columns for everything else. Pivot tables
without an entity of their own (`place_tags`, `packing_bag_members`, …) are
written through the repository method the app uses for them.

`rows.ts` holds the generic building blocks for any table, with or without a
dedicated factory:

| Helper | Replaces |
|---|---|
| `createRow(orm, Entity, data)` | `INSERT` + `SELECT * WHERE id = lastInsertRowid` |
| `insertRow(orm, Entity, data)` / `insertRows` | a bare `INSERT` (returns the primary key) |
| `insertRowIgnoringConflict(orm, Entity, data)` | `INSERT OR IGNORE` |
| `upsertRow(orm, Entity, data, mergeFields?)` | `INSERT OR REPLACE`, `ON CONFLICT DO UPDATE` |
| `findRow(orm, Entity, where)` | `SELECT * ... LIMIT 1` (`null`, not `undefined`, when there is none) |
| `findRows(orm, Entity, where, orderBy?)` | `SELECT * ... ORDER BY` |
| `countRows(orm, Entity, where)` | `SELECT COUNT(*)` |
| `updateRows(orm, Entity, where, data)` | `UPDATE ... SET` (returns the affected count) |
| `deleteRows(orm, Entity, where)` | `DELETE FROM` (all rows for `{}`) |

## Conversion guide

### Write relations by their relation name

Most foreign keys appear twice on an entity: the relation (`trip`, `user`,
`createdByRef`), which is written, and its `trip_id` twin, which is read only.
Write `{ trip: tripId }`, read `row.trip_id`. The helpers throw on a write to a
read-only twin and name the relation to use, because MikroORM would otherwise
drop the value without a word.

### Insert a row

```ts
// before
const res = testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(userId, 'Beach', '#ff0000');
const id = Number(res.lastInsertRowid);

// after
const { id } = await makeTag(orm, userId, { name: 'Beach', color: '#ff0000' });
// or, for a table without a factory
const row = await createRow(orm, Tags, { user: userId, name: 'Beach', color: '#ff0000' });
```

The legacy `createUser(testDb)` / `createTrip(testDb, …)` from
`tests/helpers/factories.ts` map one to one onto `await makeUser(orm)` /
`await makeTrip(orm, …)`; the returned rows carry the same columns.

### Read a row

```ts
// before
const row = testDb.prepare('SELECT * FROM tags WHERE id = ?').get(id) as { name: string } | undefined;
expect(row).toBeUndefined();

// after
const row = await findRow(orm, Tags, { id });
expect(row).toBeNull();
```

### Count rows

```ts
// before
const { n } = testDb.prepare('SELECT COUNT(*) AS n FROM tour_waypoints WHERE place_id = ?').get(placeId) as { n: number };

// after
const n = await countRows(orm, TourWaypoints, { place: placeId });
```

### Update a row

```ts
// before
testDb.prepare('UPDATE users SET must_change_password = 1 WHERE id = ?').run(user.id);

// after
await updateRows(orm, Users, { id: user.id }, { must_change_password: 1 });
```

### Delete rows between tests

```ts
// before
beforeEach(() => db.exec('DELETE FROM tags'));

// after
beforeEach(async () => {
  await deleteRows(orm, Tags);
});
```

### Worked examples

These three were converted in full and show the setups side by side:

- `tests/integration/categories.test.ts`: a `buildApp()` suite on the app's
  own ORM (`nestApp.get(MikroORM)`).
- `tests/e2e/tags.e2e.test.ts`: a partial-module e2e that also moved from
  hand-rolled tables to the migrated snapshot, with users pinned to the ids
  its session cookies are signed for.
- `tests/e2e/calendar-feed-visibility.e2e.test.ts`: a partial-module e2e
  seeding a user, a dated trip and staged and live bookings.

## What stays raw

Some tests are about raw SQL itself, and converting them would test nothing:

- the dialect functions (`tests/unit/db/dialect/sql-functions.test.ts`), which
  pin the SQL each function renders and what the engine returns for it;
- schema introspection: `PRAGMA table_info`, `foreign_key_list`, `index_list`,
  `EXPLAIN QUERY PLAN`, `sqlite_master` (entity/schema parity, foreign-key
  indexes, the table walk in `resetTestDb`);
- databases no ORM is bound to: the legacy upgrade fixtures and the legacy
  baseline, the pre-migrate snapshot copy, a restored file before the boot, the
  bare database `scripts/migrate-encryption.ts` works on;
- the driver itself (NUL and NaN binding, the shared connection behind
  `createTestOrm`).

Mark them in one of two ways:

- **a whole file** whose subject is raw SQL goes into the `exempt` list of
  `scripts/test-sql-baseline.json`, with the reason as its value;
- **a single statement** carries a comment with `test-sql-allow:` and a reason,
  on its own line or on the line directly above:

  ```ts
  // test-sql-allow: the table list comes from sqlite_master, which no entity or repository maps.
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  ```

  A marker without a reason does not count.

Seeding a migration test with the rows the migration is about to transform is
also raw by nature (the entities describe the schema after the migration); use
the allow marker there.

## Ratchet

`scripts/test-sql-ratchet.mjs` (`npm run lint:test-sql`, a CI gate) counts every
`.prepare(` under `tests/` per file, comments included, against the `counts` in
`scripts/test-sql-baseline.json`:

- a file holding more than its entry fails, and a file without an entry may
  hold none, so new fixtures go through the factories;
- an entry above what its file holds now fails too, so a conversion lands with
  `npm run lint:test-sql -- --update`, which lowers and drops entries and never
  raises or adds one;
- an exemption for a file that is gone fails until it is removed.

When a file needs a raw statement that is not raw by nature, add a factory or a
reader here instead.
