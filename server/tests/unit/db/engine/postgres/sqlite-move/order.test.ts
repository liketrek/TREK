/**
 * MOVEORD-001..005: the order the move fills the tables in, and the foreign
 * keys it sets only once every row is in (src/db/engine/postgres/sqlite-move/order.ts),
 * plus how the target's tables are paired with the SQLite file's (catalog.ts).
 */
import {
  planTrekTables,
  readTargetSchema,
  type TargetSchema,
} from '../../../../../../src/db/engine/postgres/sqlite-move/catalog';
import { planCopyOrder } from '../../../../../../src/db/engine/postgres/sqlite-move/order';
import { FakePostgres } from '../../../../../helpers/fake-postgres-move';

import type { Transaction } from 'kysely';
import { describe, expect, it } from 'vitest';

describe('planCopyOrder', () => {
  it('MOVEORD-001: puts every table after the tables it points at, ties by name', () => {
    const plan = planCopyOrder(
      ['places', 'trips', 'users', 'days', 'categories'],
      [
        { table: 'trips', columns: ['user_id'], references: 'users' },
        { table: 'days', columns: ['trip_id'], references: 'trips' },
        { table: 'places', columns: ['trip_id'], references: 'trips' },
        { table: 'places', columns: ['category_id'], references: 'categories' },
      ],
    );
    expect(plan.order).toEqual(['categories', 'users', 'trips', 'days', 'places']);
    expect(plan.deferred.size).toBe(0);
  });

  it('MOVEORD-002: a table pointing at itself has those columns set after its rows are in', () => {
    const plan = planCopyOrder(
      ['collab_messages'],
      [
        { table: 'collab_messages', columns: ['reply_to'], references: 'collab_messages' },
        { table: 'collab_messages', columns: ['reply_to'], references: 'collab_messages' },
      ],
    );
    expect(plan.order).toEqual(['collab_messages']);
    expect(plan.deferred.get('collab_messages')).toEqual(['reply_to']);
  });

  it('MOVEORD-003: a cycle is broken at the first table by name, deferring its keys into the cycle', () => {
    const plan = planCopyOrder(
      ['b', 'a', 'c'],
      [
        { table: 'a', columns: ['b_id'], references: 'b' },
        { table: 'b', columns: ['a_id'], references: 'a' },
        { table: 'c', columns: ['a_id'], references: 'a' },
      ],
    );
    expect(plan.order).toEqual(['a', 'b', 'c']);
    expect([...plan.deferred]).toEqual([['a', ['b_id']]]);
  });

  it('MOVEORD-004: a key to a table the move does not copy is ignored', () => {
    const plan = planCopyOrder(['trips'], [{ table: 'trips', columns: ['user_id'], references: 'users' }]);
    expect(plan.order).toEqual(['trips']);
  });
});

describe('planTrekTables', () => {
  const target: TargetSchema = {
    tables: [
      {
        name: 'mikro_orm_migrations',
        columns: [{ name: 'name', dataType: 'text', nullable: false }],
        primaryKey: [],
        uniqueKeys: [],
      },
      {
        name: 'messages',
        columns: [
          { name: 'id', dataType: 'bigint', nullable: false },
          { name: 'reply_to', dataType: 'bigint', nullable: true },
        ],
        primaryKey: ['id'],
        uniqueKeys: [{ name: 'messages_pkey', key: 'id', columns: ['id'], expression: false }],
      },
      {
        name: 'users',
        columns: [
          { name: 'id', dataType: 'bigint', nullable: false },
          { name: 'avatar', dataType: 'bytea', nullable: true },
        ],
        primaryKey: ['id'],
        uniqueKeys: [],
      },
    ],
    foreignKeys: [{ table: 'messages', columns: ['reply_to'], references: 'messages' }],
    sequences: [{ table: 'users', column: 'id', sequence: 'public.users_id_seq' }],
  };

  it('MOVEORD-005: pairs the tables by name, leaves the history out and quotes every name', () => {
    const plan = planTrekTables(
      target,
      new Map([
        ['mikro_orm_migrations', ['name']],
        ['messages', ['id', 'reply_to']],
        ['users', ['id', 'avatar']],
      ]),
    );
    expect(plan.differences).toEqual([]);
    expect(plan.problems).toEqual([]);
    expect(plan.specs.map((spec) => spec.target)).toEqual(['"messages"', '"users"']);
    expect(plan.specs[0]).toMatchObject({
      deferred: ['reply_to'],
      primaryKey: ['id'],
      label: 'messages',
      exact: false,
      uniqueKeys: [{ name: 'messages_pkey', key: 'id', columns: ['id'], expression: false }],
    });
    expect(plan.specs[1].columns).toEqual([
      { name: 'id', kind: 'integer' },
      { name: 'avatar', kind: 'bytes' },
    ]);
    expect(plan.sequences).toEqual([
      { table: 'users', column: 'id', sequence: 'public.users_id_seq', target: '"users"' },
    ]);
  });

  it('MOVEORD-006: names every difference between the two schemas instead of copying around it', () => {
    const odd: TargetSchema = {
      ...target,
      tables: [
        ...target.tables.filter((table) => table.name !== 'messages'),
        {
          name: 'messages',
          columns: [
            { name: 'id', dataType: 'bigint', nullable: false },
            { name: 'reply_to', dataType: 'bigint', nullable: false },
            { name: 'sent_at', dataType: 'timestamp with time zone', nullable: true },
          ],
          primaryKey: ['id'],
          uniqueKeys: [],
        },
        { name: 'extra', columns: [], primaryKey: [], uniqueKeys: [] },
      ],
    };
    const plan = planTrekTables(
      odd,
      new Map([
        ['messages', ['id', 'reply_to', 'sent_at', 'legacy']],
        ['users', ['id']],
        ['leftover', ['id']],
      ]),
    );
    expect(plan.differences).toEqual([
      'the SQLite table leftover has no Postgres table',
      'the Postgres table extra has no SQLite table',
      'the SQLite column messages.legacy has no Postgres column',
      'the Postgres column users.avatar has no SQLite column',
    ]);
    // What the schema itself holds that the move cannot copy is kept apart from what the file lacks.
    expect(plan.problems).toEqual([
      'the Postgres column messages.sent_at has the type timestamp with time zone, which the move does not know',
      'messages.reply_to refers back to a table filled later and cannot be NULL meanwhile',
    ]);
  });
});

describe('readTargetSchema', () => {
  it('MOVEORD-007: reads the columns, keys, unique keys and sequences of the current schema', async () => {
    const pg = new FakePostgres([
      {
        name: 'trips',
        columns: [
          { name: 'id', dataType: 'bigint', nullable: false },
          { name: 'user_id', dataType: 'bigint' },
        ],
        primaryKey: ['id'],
        foreignKeys: [{ columns: ['user_id'], references: 'users' }],
        serial: ['id'],
        unique: [
          { name: 'trips_user_id_unique', columns: ['user_id'] },
          { name: 'trips_user_id_abs', columns: ['user_id'], keys: ['abs(user_id)'], expression: true },
        ],
      },
      { name: 'users', columns: [{ name: 'id', dataType: 'bigint', nullable: false }], primaryKey: ['id'] },
    ]);
    const schema = await readTargetSchema(pg.asKysely() as Transaction<object>);
    expect(schema.tables).toEqual([
      {
        name: 'trips',
        primaryKey: ['id'],
        columns: [
          { name: 'id', dataType: 'bigint', nullable: false },
          { name: 'user_id', dataType: 'bigint', nullable: true },
        ],
        uniqueKeys: [
          { name: 'trips_pkey', key: 'id', columns: ['id'], expression: false },
          { name: 'trips_user_id_unique', key: 'user_id', columns: ['user_id'], expression: false },
          { name: 'trips_user_id_abs', key: 'abs(user_id)', columns: ['user_id'], expression: true },
        ],
      },
      {
        name: 'users',
        primaryKey: ['id'],
        columns: [{ name: 'id', dataType: 'bigint', nullable: false }],
        uniqueKeys: [{ name: 'users_pkey', key: 'id', columns: ['id'], expression: false }],
      },
    ]);
    expect(schema.foreignKeys).toEqual([{ table: 'trips', columns: ['user_id'], references: 'users' }]);
    expect(schema.sequences).toEqual([{ table: 'trips', column: 'id', sequence: 'public.trips_id_seq' }]);
  });
});
