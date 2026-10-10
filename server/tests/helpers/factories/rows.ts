import { toRow } from '../../../src/db/repositories/_shared/rows';
import { inContext, type FactoryOrm } from './context';
import type {
  EntityClass,
  EntityManager,
  EntityData,
  EntityDTO,
  FilterQuery,
  FindOptions,
  Primary,
  RequiredEntityData,
  UpsertOptions,
} from '@mikro-orm/core';

/**
 * Typed row access for tests, through MikroORM instead of raw SQL.
 *
 * These are the generic building blocks the domain factories next to this
 * file are made of, and the readers a test uses to check what a request left
 * behind. Every helper runs in a request context of its own (`inContext`), so
 * it works the same against the app's ORM and a `createTestOrm()` one.
 *
 * Writes are native statements (`em.insert`, `em.nativeUpdate`,
 * `em.nativeDelete`), the same calls the repositories build on: one INSERT
 * with exactly the columns given, so a column left out takes its database
 * default, as it did in the raw `INSERT` these replace. Reads skip the
 * identity map and come back as plain rows (`toRow`), the shape a
 * `SELECT *` returned.
 */

/** Inserts one row and returns its primary key (the autoincrement id for most tables). */
export function insertRow<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  data: RequiredEntityData<T>,
): Promise<Primary<T>> {
  // async, so a refused column rejects the returned promise rather than
  // throwing before the caller has one to await.
  return inContext(orm, async (em) => {
    assertWritable(em, entity, data);
    return em.insert(entity, data);
  });
}

/**
 * Inserts several rows and returns their primary keys in order. One INSERT per
 * row: `em.insertMany` on plain data hands back only the last insert id (it
 * returns `[insertId]` unless the driver reports `insertedIds`, which the SQL
 * drivers never do), so a caller zipping ids with its rows would get one id.
 */
export function insertRows<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  data: RequiredEntityData<T>[],
): Promise<Primary<T>[]> {
  if (data.length === 0) return Promise.resolve([]);
  return inContext(orm, async (em) => {
    for (const row of data) assertWritable(em, entity, row);
    const ids: Primary<T>[] = [];
    for (const row of data) ids.push(await em.insert(entity, row));
    return ids;
  });
}

/**
 * Inserts one row into a table keyed by a single autoincrement `id` and reads
 * it back, defaults and all. For a table with a composite or natural key use
 * `insertRow` and then `findRow` with the key columns.
 */
export async function createRow<T extends { id: number }>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  data: RequiredEntityData<T>,
): Promise<EntityDTO<T>> {
  const id = await insertRow(orm, entity, data);
  const row = await findRow(orm, entity, { id } as FilterQuery<T>);
  if (!row) throw new Error(`createRow: ${entity.name} ${String(id)} is not there after its insert`);
  return row;
}

/**
 * The first row matching `where`, or null. An empty `where` asks for any row,
 * which MikroORM's findOne refuses, so that one reads the first row instead.
 */
export function findRow<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  where: FilterQuery<T>,
): Promise<EntityDTO<T> | null> {
  return inContext(orm, async (em) => {
    const anyRow = typeof where === 'object' && where !== null && Object.keys(where).length === 0;
    const found = anyRow
      ? (await em.find(entity, where, { limit: 1, disableIdentityMap: true }))[0]
      : await em.findOne(entity, where, { disableIdentityMap: true });
    return found ? toRow<T>(found) : null;
  });
}

/** Every row matching `where` (all rows for `{}`), optionally ordered. */
export function findRows<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  where: FilterQuery<T> = {} as FilterQuery<T>,
  orderBy?: FindOptions<T>['orderBy'],
): Promise<EntityDTO<T>[]> {
  return inContext(orm, async (em) => {
    const found = await em.find(entity, where, { disableIdentityMap: true, orderBy });
    return found.map((row) => toRow<T>(row));
  });
}

/** How many rows match `where` (all rows for `{}`). */
export function countRows<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  where: FilterQuery<T> = {} as FilterQuery<T>,
): Promise<number> {
  return inContext(orm, (em) => em.count(entity, where));
}

/** Writes `data` to every row matching `where` and returns how many it touched. */
export function updateRows<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  where: FilterQuery<T>,
  data: EntityData<T>,
): Promise<number> {
  return inContext(orm, async (em) => {
    assertWritable(em, entity, data);
    return em.nativeUpdate(entity, where, data);
  });
}

/** Deletes every row matching `where` (all rows for `{}`) and returns how many it removed. */
export function deleteRows<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  where: FilterQuery<T> = {} as FilterQuery<T>,
): Promise<number> {
  return inContext(orm, (em) => em.nativeDelete(entity, where));
}

/**
 * Inserts the row, or overwrites the given columns when its key already
 * exists: the `INSERT OR REPLACE` / `ON CONFLICT DO UPDATE` of the raw
 * fixtures, for tables keyed by a natural key (`app_settings.key`, the
 * `notification_channel_preferences` triple, an addon id). `mergeFields`
 * narrows what an existing row gets overwritten with, like an
 * `ON CONFLICT ... DO UPDATE SET enabled = excluded.enabled`.
 */
export function upsertRow<T extends object, Fields extends string = never>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  data: EntityData<T>,
  mergeFields?: UpsertOptions<T, Fields>['onConflictMergeFields'],
): Promise<void> {
  return inContext(orm, async (em) => {
    assertWritable(em, entity, data);
    await em.upsert<T, Fields>(entity, data, mergeFields ? { onConflictMergeFields: mergeFields } : undefined);
  });
}

/** Inserts the row unless its key already exists: the raw fixtures' `INSERT OR IGNORE`. */
export function insertRowIgnoringConflict<T extends object>(
  orm: FactoryOrm,
  entity: EntityClass<T>,
  data: EntityData<T>,
): Promise<void> {
  return inContext(orm, async (em) => {
    assertWritable(em, entity, data);
    await em.upsert(entity, data, { onConflictAction: 'ignore' });
  });
}

/**
 * Refuses a column the entity maps read-only. Most foreign keys appear twice
 * on an entity: the relation (`trip`), which is written, and its `trip_id`
 * twin, which is only read (`persist(false)`). MikroORM drops a value given
 * for the twin without a word, so a fixture written as `{ trip_id: 3 }`
 * would insert a row with no trip at all; this names the relation instead.
 */
export function assertWritable<T extends object>(em: EntityManager, entity: EntityClass<T>, data: object): void {
  const meta = em.getMetadata().get(entity);
  for (const key of Object.keys(data)) {
    const prop = meta.props.find((p) => p.name === key);
    if (!prop || prop.persist !== false) continue;
    const column = prop.fieldNames?.[0];
    const owner = meta.props.find((p) => p !== prop && p.persist !== false && column && p.fieldNames?.includes(column));
    throw new Error(
      `${entity.name}.${key} is read-only in the entity` + (owner ? `; write it through '${owner.name}'` : ''),
    );
  }
}
