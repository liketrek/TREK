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
import { db } from '../../src/db/database';
import { AddonsModule } from '../../src/nest/addons/addons.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { createTestMikroOrmModule } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

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
vi.mock('../../src/nest/memories/memories.helpers', () => ({ getPhotoProviderConfig }));

describe('GET /api/addons e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), AddonsModule],
    }).compile();
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
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)",
    ).run();
    // bag tracking is opt-in (=== 'true'); collab flags default ON with no rows
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('bag_tracking_enabled', 'true')").run();
    db.prepare(
      "INSERT INTO addons (id, name, type, icon, enabled, sort_order) VALUES ('packing','Packing','trip','Backpack',1,1)",
    ).run();
    db.prepare(
      "INSERT INTO addons (id, name, type, icon, enabled, sort_order) VALUES ('disabled','Disabled','trip','X',0,2)",
    ).run();
    // The providers ride the journey addon — without this row they are dropped from the listing.
    db.prepare(
      "INSERT INTO addons (id, name, type, icon, enabled, sort_order) VALUES ('journey','Journey','global','Compass',1,3)",
    ).run();
    db.prepare(
      "INSERT INTO photo_providers (id, name, icon, enabled, sort_order) VALUES ('immich','Immich','Image',1,1)",
    ).run();
    db.prepare(
      `INSERT INTO photo_provider_fields (provider_id, field_key, label, input_type, placeholder, hint, required, secret, settings_key, payload_key, sort_order)
      VALUES ('immich','base_url','Base URL','text','https://...',NULL,1,0,'immich_url',NULL,1)`,
    ).run();
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
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
    db.prepare("UPDATE addons SET enabled = 0 WHERE id = 'journey'").run();
    try {
      const res = await request(server).get('/api/addons').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      // journey leaves the enabled list AND takes immich with it, its row untouched
      expect(res.body.addons).toEqual([
        { id: 'packing', name: 'Packing', type: 'trip', icon: 'Backpack', enabled: true },
      ]);
      expect(db.prepare("SELECT enabled FROM photo_providers WHERE id = 'immich'").get()).toEqual({ enabled: 1 });
    } finally {
      db.prepare("UPDATE addons SET enabled = 1 WHERE id = 'journey'").run();
    }
  });
});
