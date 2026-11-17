import { Type, type EntityProperty, type Platform } from '@mikro-orm/core';

type FlagValue = boolean | null | undefined;
type FlagColumn = number | null | undefined;

/**
 * A flag the entity reads as a boolean and the database stores as SQLite
 * stores every flag: the integer 0 or 1, in an INTEGER column (a `bigint` on
 * Postgres, `schema-adjust.ts`).
 *
 * MikroORM's own `BooleanType` declares a `boolean` column on Postgres and
 * writes `true`/`false`, so that one column would hold a different type on
 * each engine: a migration's `SET enabled = 1` would fail there, and a Kysely
 * read would answer `true` where SQLite answers 1. This type keeps the storage
 * model of every other flag on both engines while the entity's field stays a
 * boolean. A query value goes through it as well, so `find({ enabled: true })`
 * compares with 1.
 */
export class IntegerFlagType extends Type<FlagValue, FlagColumn> {
  override convertToDatabaseValue(value: FlagValue): FlagColumn {
    // Spelled out: the server compiles without strictNullChecks, where returning the narrowed `value` keeps its full type.
    if (value === null) return null;
    if (value === undefined) return undefined;
    return value ? 1 : 0;
  }

  /** 0/1 from either driver (Postgres's `bigint` reads as a number); a boolean from a value set in JS passes through. */
  override convertToJSValue(value: FlagColumn | boolean): FlagValue {
    // Spelled out: the server compiles without strictNullChecks, where returning the narrowed `value` keeps its full type.
    if (value === null) return null;
    if (value === undefined) return undefined;
    return Boolean(Number(value));
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getIntegerTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'boolean';
  }

  override get runtimeType(): string {
    return 'boolean';
  }

  override ensureComparable(): boolean {
    return false;
  }
}
