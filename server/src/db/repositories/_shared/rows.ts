import { wrap, type Collection, type EntityDTO, type Reference } from '@mikro-orm/core';

/**
 * The plain row a service (and, through it, the API) sees.
 *
 * `toObject()` drops the ORM machinery — `Ref` wrappers, hidden relations,
 * collections that were never loaded — and leaves the column-named scalars,
 * which is exactly the `SELECT *` row the legacy code returned. Repositories
 * return this, never a live entity, so a service cannot lazy-load or mutate
 * state behind the repository's back.
 */
export function toRow<T extends object>(entity: T): EntityDTO<T> {
  return wrap(entity).toObject() as EntityDTO<T>;
}

/**
 * The scalar (column-backed) keys of an entity class: everything that is not
 * a relation or a collection. `Exclude<keyof T, symbol>` drops MikroORM's
 * internal meta-properties (`[PrimaryKeyProp]`, `[OptionalProps]`, …) —
 * `unique symbol`-keyed, declared on an entity whose primary key isn't a
 * plain autoincrement `id` (e.g. `AppSettings`'s `[PrimaryKeyProp]?: 'key'`)
 * — which are not columns and have no place in a hand-written row interface.
 */
export type ScalarKeys<T> = {
  [K in Exclude<keyof T, symbol>]-?: NonNullable<T[K]> extends Collection<object> | Reference<object> ? never : K;
}[Exclude<keyof T, symbol>];

/**
 * Compile-time parity between a hand-written row interface and the entity's
 * scalar keys: a column added to or removed from the entity fails `tsc` here
 * instead of leaking silently through `toRow`'s cast. Types (nullability)
 * stay hand-maintained in the interface on purpose — that is where the API
 * shape is documented.
 */
export type AssertRowKeys<Row, Entity> = [
  Exclude<keyof Row, ScalarKeys<Entity>>,
  Exclude<ScalarKeys<Entity>, keyof Row>,
] extends [never, never]
  ? true
  : never;
