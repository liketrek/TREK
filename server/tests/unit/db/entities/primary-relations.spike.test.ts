import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { BudgetCategoryOrder } from '../../../../src/db/entities/BudgetCategoryOrder.entity';
import { VacayUserSettings } from '../../../../src/db/entities/VacayUserSettings.entity';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { defineEntity, p, wrap, type Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Plan 2 (ORM entity rewrite) Task 1 — the primary-relation spike.
 *
 * `BudgetCategoryOrder`/`VacayUserSettings` are the first entities to carry
 * the Phase 0 shape (hidden relation + `persist(false)` scalar twin,
 * snake_case scalars) on a relation that is (part of) the PRIMARY KEY. Before
 * Task 3's bulk rewrite relies on that shape for the ~15 other
 * primary-relation entities, this file pins that it actually works: a hidden
 * PRIMARY relation still hydrates its twin, `findOne`/`find` accept the
 * composite/one-to-one PK condition, and `toObject()` keeps emitting the twin
 * column and omitting the relation — exactly as it does for a non-PRIMARY
 * hidden relation (`DayNotes.day`/`DayNotes.trip`).
 *
 * Also pins the `.name()` vs `.joinColumn()` semantics Task 0 found on
 * `SchoolHolidayRegions.country` (target PK is not `id`): `.name()` is an
 * alias for `.fieldName()`, which a *relation* ignores when computing its FK
 * column (the naming strategy still derives it from the property name + the
 * target's PK) — only `.joinColumn()` overrides the column MikroORM emits.
 */

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('primary-relation entities (Task 1 spike)', () => {
  it('SPIKE-001: BudgetCategoryOrder — composite PK (trip relation + category text) round-trips create, findOne, find and toObject', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const created = t.em.create(BudgetCategoryOrder, { trip: trip.id, category: 'Food', sort_order: 2 });
    await t.em.persist(created).flush();
    t.em.clear();

    const rawInsert = testDb
      .prepare('SELECT * FROM budget_category_order WHERE trip_id = ? AND category = ?')
      .get(trip.id, 'Food');
    expect(rawInsert).toEqual({ trip_id: trip.id, category: 'Food', sort_order: 2 });

    const found = await t.repo(BudgetCategoryOrder).findOne({ trip: trip.id, category: 'Food' });
    expect(found).not.toBeNull();

    t.em.clear();
    const [hydrated] = await t.repo(BudgetCategoryOrder).find({ trip: trip.id });
    expect(hydrated.trip_id).toBe(trip.id);
    expect(hydrated.trip.isInitialized()).toBe(false);
    expect(wrap(hydrated).toObject()).toStrictEqual(rawInsert);
  });

  it('SPIKE-002: VacayUserSettings — one-to-one PRIMARY relation (user) round-trips the same four facts', async () => {
    const { user } = createUser(testDb);

    const created = t.em.create(VacayUserSettings, {
      user: user.id,
      year_type: 'fiscal',
      year_start_month: 4,
      year_start_day: 1,
      hire_date: '2020-01-01',
    });
    await t.em.persist(created).flush();
    t.em.clear();

    const rawInsert = testDb.prepare('SELECT * FROM vacay_user_settings WHERE user_id = ?').get(user.id);
    expect(rawInsert).toEqual({
      user_id: user.id,
      year_type: 'fiscal',
      year_start_month: 4,
      year_start_day: 1,
      hire_date: '2020-01-01',
    });

    const found = await t.repo(VacayUserSettings).findOne({ user: user.id });
    expect(found).not.toBeNull();

    t.em.clear();
    const [hydrated] = await t.repo(VacayUserSettings).find({ user: user.id });
    expect(hydrated.user_id).toBe(user.id);
    expect(hydrated.user?.isInitialized()).toBe(false);
    expect(wrap(hydrated).toObject()).toStrictEqual(rawInsert);
  });

  it("SPIKE-003: .name() sets the property's fieldName, but a relation's FK column is only overridden by .joinColumn()", async () => {
    // A throwaway target whose PK is NOT `id` — the exact shape that made
    // SchoolHolidayRegions.country_code (Task 0) a real bug: the naming
    // strategy composes the FK column from the property name plus the
    // target's PK name (`<prop>_<targetPk>`), independent of `.name()`.
    class SpikeTarget {
      code!: string;
    }
    const SpikeTargetSchema = defineEntity({
      class: SpikeTarget,
      properties: {
        code: p.text().primary(),
      },
    });

    class SpikeSourceName {
      id?: number;
      country!: Ref<SpikeTarget>;
    }
    const SpikeSourceNameSchema = defineEntity({
      class: SpikeSourceName,
      properties: {
        id: p.integer().primary().autoincrement(),
        country: () => p.manyToOne(SpikeTarget).ref().name('country'),
      },
    });

    class SpikeSourceJoinColumn {
      id?: number;
      country!: Ref<SpikeTarget>;
    }
    const SpikeSourceJoinColumnSchema = defineEntity({
      class: SpikeSourceJoinColumn,
      properties: {
        id: p.integer().primary().autoincrement(),
        country: () => p.manyToOne(SpikeTarget).ref().joinColumn('country'),
      },
    });

    const spikeOrm = await MikroORM.init({
      entities: [SpikeTargetSchema, SpikeSourceNameSchema, SpikeSourceJoinColumnSchema],
      dbName: ':memory:',
      discovery: { warnWhenNoEntities: false },
    });
    try {
      const namedMeta = spikeOrm.getMetadata().get(SpikeSourceName);
      const joinColumnMeta = spikeOrm.getMetadata().get(SpikeSourceJoinColumn);
      // `.name('country')` is an alias for `.fieldName('country')` (per
      // node_modules/@mikro-orm/core/entity/defineEntity.d.ts) — it does not
      // reach the FK-column computation for a relation, so the naming
      // strategy still derives `<prop>_<targetPk>`.
      expect(namedMeta.properties.country.fieldNames).toEqual(['country_code']);
      // `.joinColumn('country')` overrides the computed FK column directly.
      expect(joinColumnMeta.properties.country.fieldNames).toEqual(['country']);
    } finally {
      await spikeOrm.close(true);
    }
  });

  it('SPIKE-004: a nullable text PRIMARY KEY (AppSettings.key) round-trips create → findOne unchanged, and toObject keeps the key', async () => {
    const created = t.em.create(AppSettings, { key: 'spike_setting', value: 'on' });
    await t.em.persist(created).flush();
    t.em.clear();

    const found = await t.repo(AppSettings).findOne({ key: 'spike_setting' });
    expect(found?.key).toBe('spike_setting');
    expect(found?.value).toBe('on');

    const raw = testDb.prepare('SELECT * FROM app_settings WHERE key = ?').get('spike_setting');
    expect(wrap(found).toObject()).toStrictEqual(raw);
  });
});
