/**
 * GET /api/plugin-pois e2e (#1781): the real guard chain and the real contribution
 * module against a temp SQLite db, with only the plugin itself played by a spy.
 *
 * The unit tests pin the parsing and the normalizer. What only a booted container
 * shows is that the route sits behind JwtAuthGuard (401 before anything else), that
 * the bespoke 400s survive the global pipe, and that the declaration it re-reads is
 * the plugins row, so a category the manifest never declared is a 404 however
 * willing the plugin would be to answer it.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PluginContributionsModule } from '../../src/nest/plugins/contributions/plugin-contributions.module';
import { PluginHooks } from '../../src/nest/plugins/plugin-hooks.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

// Off while the app boots, so the runtime does not go looking for plugins on disk;
// the tests switch it on.
const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: { value: false } }));

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    canAccessTrip: () => undefined,
    isOwner: () => false,
    getPlaceWithTags: () => null,
    closeDb: () => {},
    reinitialize: () => {},
  };
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: () => pluginsEnabled.value }));

import { db } from '../../src/db/database';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule } from '../helpers/test-orm';

const trailheads = { id: 'trailheads', label: 'Trailheads', icon: 'Signpost', color: '#2f855a' };
const query = { pluginId: 'trail-finder', category: 'trailheads', south: '47', west: '11', north: '47.5', east: '11.5', lang: 'de' };

describe('Plugin POIs e2e (real guard chain + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let providersOf: MockInstance;
  let categoryPois: MockInstance;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, PluginContributionsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // harness.ts's seedUser() omits password_hash, which the migrated schema
    // requires NOT NULL (addons.e2e.test.ts does the same) — the same SeededUser
    // shape sessionCookie(1) needs, with the hash filled in.
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)",
    ).run();
    db.prepare("INSERT INTO plugins (id, name, status, capabilities, granted_permissions) VALUES (?, ?, 'active', ?, ?)")
      .run('trail-finder', 'Trail Finder', JSON.stringify({ poiCategories: [trailheads] }), JSON.stringify(['hook:poi-category-provider']));
    app = await build();
    const hooks = app.get(PluginHooks, { strict: false });
    providersOf = vi.spyOn(hooks, 'providersOf');
    categoryPois = vi.spyOn(hooks, 'categoryPois');
    server = app.getHttpServer();
    pluginsEnabled.value = true;
  });

  beforeEach(() => {
    providersOf.mockReset().mockReturnValue(['trail-finder']);
    categoryPois.mockReset().mockResolvedValue([
      { id: 'th-1', name: 'Trailhead', lat: 47.2, lng: 11.2, details: [{ label: 'Length', value: '12 km' }] },
      { id: 'far', name: 'Elsewhere', lat: 49, lng: 11.2 },
    ]);
  });

  afterAll(async () => {
    await app?.close();
  });

  const cookie = () => sessionCookie(1);

  it('refuses a caller without a session before anything else', async () => {
    await request(server).get('/api/plugin-pois').query(query).expect(401);
    expect(categoryPois).not.toHaveBeenCalled();
  });

  it('answers the bespoke 400s of /api/maps/pois', async () => {
    const res = await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query({ ...query, category: '' }).expect(400);
    expect(res.body).toMatchObject({ error: 'A category is required' });
    const bbox = await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query({ ...query, north: 'x' }).expect(400);
    expect(bbox.body).toMatchObject({ error: 'A valid bbox (south, west, north, east) is required' });
    expect(categoryPois).not.toHaveBeenCalled();
  });

  it('answers 404 for a category the manifest never declared, or a plugin that is not a provider', async () => {
    await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query({ ...query, category: 'huts' }).expect(404);
    providersOf.mockReturnValue([]);
    await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query(query).expect(404);
    expect(categoryPois).not.toHaveBeenCalled();
  });

  it('returns the declared category, answered by its plugin and clipped to the box', async () => {
    const res = await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query(query).expect(200);
    expect(res.body).toMatchObject({ source: 'plugin:trail-finder', truncated: false, clamped: false });
    expect(res.body.pois).toEqual([expect.objectContaining({
      osm_id: 'plugin:trail-finder:th-1',
      category: 'plugin:trail-finder/trailheads',
      icon: 'Signpost',
      color: '#2f855a',
      details: [{ label: 'Length', value: '12 km' }],
    })]);
    expect(categoryPois).toHaveBeenCalledWith(
      'trail-finder',
      { category: 'trailheads', bounds: { south: 47, west: 11, north: 47.5, east: 11.5 }, lang: 'de', limit: 60 },
      1,
    );
  });

  it('turns a failing plugin into a 502 for that chip only', async () => {
    categoryPois.mockRejectedValue(new Error('plugin invoke timed out'));
    const res = await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query(query).expect(502);
    expect(res.body).toMatchObject({ error: 'The plugin did not answer' });
  });

  it('answers 404 while the plugin runtime is switched off', async () => {
    pluginsEnabled.value = false;
    try {
      await request(server).get('/api/plugin-pois').set('Cookie', cookie()).query(query).expect(404);
      expect(categoryPois).not.toHaveBeenCalled();
    } finally {
      pluginsEnabled.value = true;
    }
  });
});
