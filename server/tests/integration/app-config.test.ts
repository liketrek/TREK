/**
 * AppConfigModule wired into the real buildApp(): boot-stable registerAs
 * snapshots must re-derive on every app build (the env-mutate-then-rebuild
 * pattern the integration suite relies on), and RuntimeEnvService must stay
 * live within a single app's lifetime.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb } from '../helpers/test-db';
import { buildApp } from '../../src/bootstrap';
import { httpConfig, RuntimeEnvService } from '../../src/nest/app-config';
import type { ConfigType } from '@nestjs/config';

describe('AppConfigModule in the real buildApp()', () => {
  let app: INestApplication | undefined;
  let prevForceHttps: string | undefined;
  let prevDemo: string | undefined;

  beforeAll(() => {
    createTables(testDb);
    runMigrations(testDb);
    resetTestDb(testDb);
    prevForceHttps = process.env.FORCE_HTTPS;
    prevDemo = process.env.DEMO_MODE;
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    if (prevForceHttps === undefined) delete process.env.FORCE_HTTPS;
    else process.env.FORCE_HTTPS = prevForceHttps;
    if (prevDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = prevDemo;
  });

  it('boot-stable snapshots re-derive per app build (mutate → rebuild → new value)', async () => {
    process.env.FORCE_HTTPS = 'true';
    app = await buildApp();
    let http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
    expect(http.forceHttps).toBe(true);
    await app.close();

    process.env.FORCE_HTTPS = 'off';
    app = await buildApp();
    http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
    expect(http.forceHttps).toBe(false);
  });

  it('a snapshot does NOT move within one app lifetime, RuntimeEnvService does', async () => {
    delete process.env.FORCE_HTTPS;
    delete process.env.DEMO_MODE;
    app = await buildApp();
    const http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
    const runtime = app.get(RuntimeEnvService);

    process.env.FORCE_HTTPS = 'true';
    process.env.DEMO_MODE = 'true';
    expect(http.forceHttps).toBe(false); // frozen at build — by design
    expect(runtime.isDemoMode()).toBe(true); // live — by design
  });
});
