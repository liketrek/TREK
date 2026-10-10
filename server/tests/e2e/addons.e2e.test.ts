/**
 * GET /api/addons e2e — exercises the AddonsController through the real
 * JwtAuthGuard against a real migrated-and-seeded temp SQLite db
 * (createSnapshotTestDb(), task-6-fix-brief.md item 5 — this used to hand-roll
 * four CREATE TABLEs, a second hand-maintained schema copy whose NOT
 * NULL/defaults/FK/UNIQUE drifted from the real migrations). getPhotoProviderConfig
 * is mocked; the addons/photo_providers/photo_provider_fields/app_settings reads
 * run against the temp db (the collab/bag-tracking flags are real AddonsService
 * reads since the admin-1 extraction). Asserts the byte-identical body the legacy
 * inline handler produced.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db } from '../../src/db/database';

// The snapshot ships the real seeded catalogue (production default addons +
// photo providers) — this suite wants a known, empty set of each so every
// case controls its own fixture rows exactly like the legacy hand-rolled
// tables did. Child table first for the FK on photo_provider_fields.
db.exec('DELETE FROM photo_provider_fields');
db.exec('DELETE FROM photo_providers');
db.exec('DELETE FROM addons');
db.exec('DELETE FROM app_settings');

const { getPhotoProviderConfig } = vi.hoisted(() => ({
  getPhotoProviderConfig: vi.fn(() => ({ url: 'https://immich.example' })),
}));
vi.mock('../../src/nest/common/photo-provider-config', () => ({ getPhotoProviderConfig }));

import { AddonsModule } from '../../src/nest/addons/addons.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { makeUser } from '../helpers/factories/users';
import { setAddonEnabled, setAppSetting } from '../helpers/factories/settings';
import { findRow, insertRow } from '../helpers/factories/rows';
import { Addons } from '../../src/db/entities/Addons.entity';
import { PhotoProviderFields } from '../../src/db/entities/PhotoProviderFields.entity';
import { PhotoProviders } from '../../src/db/entities/PhotoProviders.entity';

let orm: TestOrm;

describe('GET /api/addons e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), AddonsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // harness.ts's seedUser() omits password_hash, which the real migrated
    // schema requires NOT NULL (share.e2e.test.ts hit the same thing) — a
    // raw insert here instead, matching the SeededUser shape id/role/
    // password_version=0 that sessionCookie(1) needs.
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
    // bag tracking is opt-in (=== 'true'); collab flags default ON with no rows
    await setAppSetting(orm, 'bag_tracking_enabled', 'true');
    await insertRow(orm, Addons, { id: 'packing', name: 'Packing', type: 'trip', icon: 'Backpack', enabled: true, sort_order: 1 });
    await insertRow(orm, Addons, { id: 'disabled', name: 'Disabled', type: 'trip', icon: 'X', enabled: false, sort_order: 2 });
    // The providers ride the journey addon — without this row they are dropped from the listing.
    await insertRow(orm, Addons, { id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true, sort_order: 3 });
    await insertRow(orm, PhotoProviders, { id: 'immich', name: 'Immich', icon: 'Image', enabled: 1, sort_order: 1 });
    await insertRow(orm, PhotoProviderFields, {
      provider: 'immich', field_key: 'base_url', label: 'Base URL', input_type: 'text', placeholder: 'https://...', hint: null,
      required: 1, secret: 0, settings_key: 'immich_url', payload_key: null, sort_order: 1,
    });
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/addons')).status).toBe(401);
  });

  // Session 1 is a default-role ('user') account — i.e. a non-admin. Asserting the
  // global bagTracking flag here is present is the #1124 regression guard: reading the
  // toggle must not require admin.
  it('200 returns enabled addons + photo providers (disabled addon excluded)', async () => {
    const res = await request(server).get('/api/addons').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      collabFeatures: { chat: true, notes: true, links: true, polls: true, whatsnext: true },
      bagTracking: true,
      addons: [
        { id: 'packing', name: 'Packing', type: 'trip', icon: 'Backpack', enabled: true },
        { id: 'journey', name: 'Journey', type: 'global', icon: 'Compass', enabled: true },
        {
          id: 'immich',
          name: 'Immich',
          type: 'photo_provider',
          icon: 'Image',
          enabled: true,
          config: { url: 'https://immich.example' },
          fields: [
            {
              key: 'base_url',
              label: 'Base URL',
              input_type: 'text',
              placeholder: 'https://...',
              hint: null,
              required: true,
              secret: false,
              settings_key: 'immich_url',
              payload_key: null,
              sort_order: 1,
            },
          ],
        },
      ],
    });
  });

  it('200 drops the photo providers while the journey addon is off', async () => {
    await setAddonEnabled(orm, 'journey', false);
    try {
      const res = await request(server).get('/api/addons').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      // journey leaves the enabled list AND takes immich with it, its row untouched
      expect(res.body.addons).toEqual([
        { id: 'packing', name: 'Packing', type: 'trip', icon: 'Backpack', enabled: true },
      ]);
      expect((await findRow(orm, PhotoProviders, { id: 'immich' }))!.enabled).toBe(1);
    } finally {
      await setAddonEnabled(orm, 'journey', true);
    }
  });
});
