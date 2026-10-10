import { Type, type EntityProperty, type Platform } from '@mikro-orm/core';

/** The text every DATETIME column holds and every API response emits. */
export const DB_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

declare const dbTimestampBrand: unique symbol;

/**
 * The canonical text of a DATETIME column (`YYYY-MM-DD HH:MM:SS`, UTC). It is a
 * plain string at runtime; the brand only makes sure a value a repository
 * writes into such a column came from {@link dbNow} and not from
 * `toISOString()`, whose `T…Z` spelling does not compare against
 * `CURRENT_TIMESTAMP` in SQL.
 */
export type DbTimestamp = string & { readonly [dbTimestampBrand]: true };

/**
 * `CURRENT_TIMESTAMP` as SQLite renders it, produced in JS so it is the same on
 * every dialect: UTC, seconds precision, a space between date and time.
 */
export function dbNow(now: Date = new Date()): DbTimestamp {
  return now.toISOString().slice(0, 19).replace('T', ' ') as DbTimestamp;
}

/**
 * Read a stored timestamp as an instant. Takes the canonical text, which carries
 * no zone and is UTC (a bare `new Date()` would read it as local time), as well
 * as an ISO string some older writer left behind. Anything else is null.
 */
export function parseDbTimestamp(ts: string | null | undefined): Date | null {
  if (!ts) return null;
  const d = new Date(utcSuffix(ts) as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The stored text as the ISO spelling some responses have always carried
 * (`2026-01-02T03:04:05Z`); a value already ending in `Z` passes through.
 */
export function utcSuffix(ts: string | null | undefined): string | null {
  if (!ts) return null;
  return ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z';
}

type TimestampValue = string | null | undefined;

/**
 * A DATETIME column whose JS value is the stored text, not a `Date`.
 *
 * The stock `DateTimeType` maps to `Date`, and on SQLite the platform then
 * writes `+date` — an integer of milliseconds — next to the `'YYYY-MM-DD
 * HH:MM:SS'` text the schema's `DEFAULT CURRENT_TIMESTAMP` produces and every
 * consumer (the client, `ORDER BY created_at`, `date(created_at)`) expects.
 * This type keeps the wire format the app has always had and stays dialect
 * neutral: a driver that returns a `Date` (Postgres) is formatted to the same
 * text on the way in, and text is written as text on the way out.
 */
export class DbTimestampType extends Type<TimestampValue, TimestampValue> {
  // Both converters drop the base class's `platform`/`context` parameters: the
  // wire format is the same text on every dialect, so neither is consulted.
  override convertToDatabaseValue(value: TimestampValue): TimestampValue {
    if (value == null) {
      return value;
    }
    // At runtime, the ORM may pass a Date; handle it
    if ((value as unknown) instanceof Date) {
      return dbNow(value as unknown as Date);
    }
    return value;
  }

  override convertToJSValue(value: TimestampValue): TimestampValue {
    if (value == null) {
      return value;
    }
    // At runtime, database drivers may return a Date; handle it
    if ((value as unknown) instanceof Date) {
      return dbNow(value as unknown as Date);
    }
    // Handle millisecond integers (legacy format) — a Date written by the stock
    // DateTimeType reads back as a number.
    if (typeof value === 'number') {
      return dbNow(new Date(value as unknown as number));
    }
    return value;
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
  }

  override compareAsType(): string {
    return 'string';
  }

  override get runtimeType(): string {
    return 'string';
  }
}
