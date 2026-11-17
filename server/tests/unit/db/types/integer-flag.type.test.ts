/**
 * IntegerFlagType (src/db/types/integer-flag.type.ts): a boolean in the
 * entity, the integer 0/1 in the column on both engines, so `addons.enabled`
 * has the storage model of every other flag on Postgres as well.
 */
import { IntegerFlagType } from '../../../../src/db/types';
import { BasePostgreSqlPlatform, SqlitePlatform } from '@mikro-orm/sql';

import { describe, expect, it } from 'vitest';

const flag = new IntegerFlagType();

describe('IntegerFlagType', () => {
  it('INTFLAG-001: writes 1 and 0, and leaves a missing value missing', () => {
    expect(flag.convertToDatabaseValue(true)).toBe(1);
    expect(flag.convertToDatabaseValue(false)).toBe(0);
    expect(flag.convertToDatabaseValue(null)).toBeNull();
    expect(flag.convertToDatabaseValue(undefined)).toBeUndefined();
  });

  it('INTFLAG-002: reads the integer either driver hands back, or a boolean set in JS, as a boolean', () => {
    expect(flag.convertToJSValue(1)).toBe(true);
    expect(flag.convertToJSValue(0)).toBe(false);
    expect(flag.convertToJSValue(true)).toBe(true);
    expect(flag.convertToJSValue(null)).toBeNull();
  });

  it('INTFLAG-003: declares the integer column of the platform, which the Postgres schema widens to bigint', () => {
    const prop = { name: 'enabled' } as Parameters<IntegerFlagType['getColumnType']>[0];
    expect(flag.getColumnType(prop, new SqlitePlatform())).toBe('integer');
    expect(flag.getColumnType(prop, new BasePostgreSqlPlatform())).toBe('int');
    expect(flag.runtimeType).toBe('boolean');
  });
});
