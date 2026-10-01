/**
 * GET /api/plugin-search and GET /api/plugin-search/suggest e2e (#2221): the real
 * guard chain and the real contribution module against a temp SQLite db, with only
 * the plugins played by spies.
 *
 * The unit tests pin the parsing and the normalizer. What only a booted container
 * shows is that both routes sit behind JwtAuthGuard, that the static `suggest`
 * segment is its own route rather than a query on the search, and that the typed-ahead
 * route asks exactly the providers whose hook carries `suggest`.
 */
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PluginContributionsModule } from '../../src/nest/plugins/contributions/plugin-contributions.module';
import { PluginHooks } from '../../src/nest/plugins/plugin-hooks.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { seedUser, sessionCookie } from './harness';
import { pluginSuggestResultSchema } from '@trek/shared';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db, pluginsEnabled } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  tmp.exec(`CREATE TABLE plugins (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT, icon TEXT,
    status TEXT NOT NULL DEFAULT 'inactive', sort_order INTEGER NOT NULL DEFAULT 0,
    capabilities TEXT, permissions TEXT DEFAULT '[]', granted_permissions TEXT DEFAULT '[]');`);
  tmp.exec('CREATE TABLE addons (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, name TEXT, description TEXT, category TEXT, sort_order INTEGER DEFAULT 0);');
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  // Off while the app boots, so the runtime does not go looking for plugins on disk;
  // the tests switch it on.
  return { db: tmp, pluginsEnabled: { value: false } };
});

vi.mock('../../src/db/database', () => ({
  db,
  canAccessTrip: () => undefined,
  isOwner: () => false,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: () => pluginsEnabled.value }));

const place = (id: string, name: string) => ({ id, name, lat: 35.66, lng: 139.7, address: 'Shibuya', rating: 4.4 });

describe('Plugin search e2e (real guard chain + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let providersOf: MockInstance;
  let searchPlaces: MockInstance;
  let suggestPlaces: MockInstance;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, PluginContributionsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    const hooks = app.get(PluginHooks, { strict: false });
    providersOf = vi.spyOn(hooks, 'providersOf');
    searchPlaces = vi.spyOn(hooks, 'searchPlaces');
    suggestPlaces = vi.spyOn(hooks, 'suggestPlaces');
    server = app.getHttpServer();
    pluginsEnabled.value = true;
  });

  beforeEach(() => {
    // Two installed indexes; only the local one takes a request per keystroke.
    providersOf.mockReset().mockImplementation((_hook: string, fn?: string) =>
      fn === 'suggest' ? ['local-index'] : ['local-index', 'remote-api'],
    );
    searchPlaces.mockReset().mockImplementation(async (pluginId: string) => [place('s1', `${pluginId} search`)]);
    suggestPlaces.mockReset().mockResolvedValue([
      place('a', 'Ichiran Shibuya'), place('b', 'Ichiran Harajuku'), place('c', 'Ichiran Ueno'), place('d', 'Ichiran Asakusa'),
    ]);
  });

  afterAll(async () => {
    await app?.close();
  });

  const cookie = () => sessionCookie(1);

  it('refuses a caller without a session on both routes before any plugin is asked', async () => {
    await request(server).get('/api/plugin-search').query({ q: 'ichiran' }).expect(401);
    await request(server).get('/api/plugin-search/suggest').query({ q: 'ichiran' }).expect(401);
    expect(searchPlaces).not.toHaveBeenCalled();
    expect(suggestPlaces).not.toHaveBeenCalled();
  });

  it('suggests from the providers that implement suggest only, three rows at most, in the shared row', async () => {
    const res = await request(server)
      .get('/api/plugin-search/suggest')
      .set('Cookie', cookie())
      .query({ q: 'ichi', lat: '35.66', lng: '139.7', lang: 'ja' })
      .expect(200);
    expect(pluginSuggestResultSchema.parse(res.body).places.map((p) => p.osm_id)).toEqual([
      'plugin:local-index:a', 'plugin:local-index:b', 'plugin:local-index:c',
    ]);
    expect(providersOf).toHaveBeenCalledWith('searchProvider', 'suggest');
    expect(suggestPlaces).toHaveBeenCalledTimes(1);
    expect(suggestPlaces).toHaveBeenCalledWith('local-index', { query: 'ichi', limit: 3, lang: 'ja', near: { lat: 35.66, lng: 139.7 } }, 1);
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('asks nobody for a single letter', async () => {
    const res = await request(server).get('/api/plugin-search/suggest').set('Cookie', cookie()).query({ q: 'i' }).expect(200);
    expect(res.body).toEqual({ places: [] });
    expect(suggestPlaces).not.toHaveBeenCalled();
  });

  it('keeps the explicit search on every provider, the typed-ahead route beside it', async () => {
    const res = await request(server).get('/api/plugin-search').set('Cookie', cookie()).query({ q: 'ichiran' }).expect(200);
    expect(res.body.places.map((p: { name: string }) => p.name)).toEqual(['local-index search', 'remote-api search']);
    expect(suggestPlaces).not.toHaveBeenCalled();
  });

  it('answers an empty list while the plugin runtime is switched off', async () => {
    pluginsEnabled.value = false;
    try {
      const res = await request(server).get('/api/plugin-search/suggest').set('Cookie', cookie()).query({ q: 'ichiran' }).expect(200);
      expect(res.body).toEqual({ places: [] });
      expect(suggestPlaces).not.toHaveBeenCalled();
    } finally {
      pluginsEnabled.value = true;
    }
  });
});
