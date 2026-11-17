/**
 * RESETDB-001..005: resetDatabase (tests/helpers/reset-database.ts), the
 * per-test reset of every suite on the real database module, leaves the state
 * resetTestDb leaves on the SQLite snapshot: user data gone, the kept tables
 * and their rows still there, ids still growing, the defaults back. This
 * suite boots the app, so it runs on SQLite and in the Postgres lane alike,
 * and each engine's half of the helper is held here.
 */
import { buildApp } from '../../../src/bootstrap';
import { Addons } from '../../../src/db/entities/Addons.entity';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { Categories } from '../../../src/db/entities/Categories.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { FactoryOrm } from '../../helpers/factories/context';
import { makeCategory } from '../../helpers/factories/places';
import { countRows, deleteRows, findRow } from '../../helpers/factories/rows';
import { setAddonEnabled, setAppSetting } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetDatabase } from '../../helpers/reset-database';
import { DEFAULT_ADDONS, DEFAULT_CATEGORIES, DEFAULT_PHOTO_PROVIDERS } from '../../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: FactoryOrm;

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
});

afterAll(async () => {
  await app?.close();
});

describe('resetDatabase', () => {
  // First on purpose: the boot's seeded admin is still there until the first reset.
  it('RESETDB-001: the first reset removes the seeded admin and the next user gets id 1', async () => {
    expect(await countRows(orm, Users)).toBeGreaterThan(0);
    await resetDatabase(orm);
    expect(await countRows(orm, Users)).toBe(0);
    const { user } = await makeUser(orm);
    expect(user.id).toBe(1);
  });

  it('RESETDB-002: later resets empty the user data but keep the ids growing', async () => {
    await resetDatabase(orm);
    const { user: first } = await makeUser(orm);
    const trip = await makeTrip(orm, first.id);
    await setAppSetting(orm, 'reset_probe', 'x');

    await resetDatabase(orm);
    expect(await countRows(orm, Users)).toBe(0);
    expect(await countRows(orm, Trips)).toBe(0);
    expect(await findRow(orm, AppSettings, { key: 'reset_probe' })).toBeNull();

    const { user: second } = await makeUser(orm);
    expect(second.id).toBeGreaterThan(first.id);
    expect((await makeTrip(orm, second.id)).id).toBeGreaterThan(trip.id);
  });

  it('RESETDB-003: the kept tables keep their rows, a category a deleted user made included', async () => {
    await resetDatabase(orm);
    const { user } = await makeUser(orm);
    const own = await makeCategory(orm, { name: 'Made by a user', user: user.id });
    const before = await countRows(orm, Categories);

    await resetDatabase(orm);
    expect(await countRows(orm, Categories)).toBe(before);
    expect(await findRow(orm, Categories, { id: own.id })).toMatchObject({ name: 'Made by a user' });
  });

  it('RESETDB-004: the default categories, addons and photo providers come back, once each', async () => {
    await deleteRows(orm, Categories, { name: DEFAULT_CATEGORIES[0].name });
    await deleteRows(orm, Addons, { id: DEFAULT_ADDONS[0].id });
    await deleteRows(orm, PhotoProviders, { id: DEFAULT_PHOTO_PROVIDERS[0].id });

    await resetDatabase(orm);
    await resetDatabase(orm);
    for (const cat of DEFAULT_CATEGORIES) expect(await countRows(orm, Categories, { name: cat.name })).toBe(1);
    for (const addon of DEFAULT_ADDONS) expect(await countRows(orm, Addons, { id: addon.id })).toBe(1);
    for (const p of DEFAULT_PHOTO_PROVIDERS) expect(await countRows(orm, PhotoProviders, { id: p.id })).toBe(1);
    const addon = await findRow(orm, Addons, { id: DEFAULT_ADDONS[0].id });
    expect(addon?.name).toBe(DEFAULT_ADDONS[0].name);
    expect(Boolean(addon?.enabled)).toBe(DEFAULT_ADDONS[0].enabled === 1);
  });

  it('RESETDB-005: an addon a test switched keeps its setting, as resetTestDb leaves it', async () => {
    await setAddonEnabled(orm, 'packing', false);
    await resetDatabase(orm);
    expect(Boolean((await findRow(orm, Addons, { id: 'packing' }))?.enabled)).toBe(false);
    await setAddonEnabled(orm, 'packing', true);
  });
});
