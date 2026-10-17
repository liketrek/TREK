/**
 * AppConfigModule wired into the real buildApp(): boot-stable registerAs
 * snapshots must re-derive on every app build (the env-mutate-then-rebuild
 * pattern the integration suite relies on), and RuntimeEnvService must stay
 * live within a single app's lifetime.
 */
import { buildApp, getHttpServer } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { httpConfig, RuntimeEnvService } from '../../src/nest/app-config';
import { resetTestDb } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

describe('AppConfigModule in the real buildApp()', () => {
  let app: INestApplication | undefined;
  let prevHsts: string | undefined;
  let prevDemo: string | undefined;

  beforeAll(() => {
    resetTestDb(testDb);
    prevHsts = process.env.HSTS_INCLUDE_SUBDOMAINS;
    prevDemo = process.env.DEMO_MODE;
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    if (prevHsts === undefined) delete process.env.HSTS_INCLUDE_SUBDOMAINS;
    else process.env.HSTS_INCLUDE_SUBDOMAINS = prevHsts;
    if (prevDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = prevDemo;
    delete process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS;
  });

  it("the HTTP server outlasts a proxy's idle timeout, with the headers timeout above it", async () => {
    app = await buildApp();
    expect(getHttpServer().keepAliveTimeout).toBe(95_000);
    expect(getHttpServer().headersTimeout).toBe(96_000);
    await app.close();

    process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS = '120000';
    app = await buildApp();
    expect(getHttpServer().keepAliveTimeout).toBe(120_000);
    expect(getHttpServer().headersTimeout).toBe(121_000);
  });

  it('boot-stable snapshots re-derive per app build (mutate → rebuild → new value)', async () => {
    process.env.HSTS_INCLUDE_SUBDOMAINS = 'true';
    app = await buildApp();
    let http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
    expect(http.hstsIncludeSubdomains).toBe(true);
    await app.close();

    process.env.HSTS_INCLUDE_SUBDOMAINS = 'off';
    app = await buildApp();
    http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
    expect(http.hstsIncludeSubdomains).toBe(false);
  });

  it('a snapshot does NOT move within one app lifetime, RuntimeEnvService does', async () => {
    delete process.env.HSTS_INCLUDE_SUBDOMAINS;
    delete process.env.DEMO_MODE;
    app = await buildApp();
    const http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
    const runtime = app.get(RuntimeEnvService);

    process.env.HSTS_INCLUDE_SUBDOMAINS = 'true';
    process.env.DEMO_MODE = 'true';
    expect(http.hstsIncludeSubdomains).toBe(false); // frozen at build, by design
    expect(runtime.isDemoMode()).toBe(true); // live — by design
  });
});
