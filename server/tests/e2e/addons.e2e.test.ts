/**
 * GET /api/addons e2e — exercises the AddonsController through the real
 * JwtAuthGuard against a temp SQLite db. getCollabFeatures + getPhotoProviderConfig
 * are mocked; the addons/photo_providers/photo_provider_fields reads run against
 * the temp db. Asserts the byte-identical body the legacy inline handler produced.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec(`CREATE TABLE addons (id TEXT PRIMARY KEY, name TEXT, type TEXT, icon TEXT, enabled INTEGER, sort_order INTEGER);`);
  tmp.exec(`CREATE TABLE photo_providers (id TEXT PRIMARY KEY, name TEXT, icon TEXT, enabled INTEGER, sort_order INTEGER);`);
  tmp.exec(`CREATE TABLE photo_provider_fields (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id TEXT, field_key TEXT,
    label TEXT, input_type TEXT, placeholder TEXT, hint TEXT, required INTEGER, secret INTEGER,
    settings_key TEXT, payload_key TEXT, sort_order INTEGER);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db, canAccessTrip: vi.fn(), isOwner: vi.fn(), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));

const { getCollabFeatures, getBagTracking, getPhotoProviderConfig } = vi.hoisted(() => ({
  getCollabFeatures: vi.fn(() => ({ chat: true, notes: true, polls: true, whatsnext: true })),
  getBagTracking: vi.fn(() => ({ enabled: true })),
  getPhotoProviderConfig: vi.fn(() => ({ url: 'https://immich.example' })),
}));
vi.mock('../../src/services/adminService', () => ({ getCollabFeatures, getBagTracking }));
vi.mock('../../src/services/memories/helpersService', () => ({ getPhotoProviderConfig }));

import { AddonsModule } from '../../src/nest/addons/addons.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('GET /api/addons e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [AddonsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    db.prepare("INSERT INTO addons (id, name, type, icon, enabled, sort_order) VALUES ('packing','Packing','trip','Backpack',1,1)").run();
    db.prepare("INSERT INTO addons (id, name, type, icon, enabled, sort_order) VALUES ('disabled','Disabled','trip','X',0,2)").run();
    db.prepare("INSERT INTO photo_providers (id, name, icon, enabled, sort_order) VALUES ('immich','Immich','Image',1,1)").run();
    db.prepare(`INSERT INTO photo_provider_fields (provider_id, field_key, label, input_type, placeholder, hint, required, secret, settings_key, payload_key, sort_order)
      VALUES ('immich','base_url','Base URL','text','https://...',NULL,1,0,'immich_url',NULL,1)`).run();
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
      collabFeatures: { chat: true, notes: true, polls: true, whatsnext: true },
      bagTracking: true,
      addons: [
        { id: 'packing', name: 'Packing', type: 'trip', icon: 'Backpack', enabled: true },
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
});
