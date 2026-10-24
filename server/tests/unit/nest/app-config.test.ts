import { imageVersion } from '../../../src/app-config/image-version';
import { AppConfigModule } from '../../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../../src/nest/app-config/data-paths.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { httpConfig, storageConfig, BOOT_STABLE_TOKENS } from '../../../src/nest/app-config/tokens';
import { ConfigService, ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('RuntimeEnvService', () => {
  const service = new RuntimeEnvService();
  let prevDemo: string | undefined;

  beforeEach(() => {
    prevDemo = process.env.DEMO_MODE;
  });
  afterEach(() => {
    if (prevDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = prevDemo;
  });

  it('reads live — a mid-lifetime env mutation is visible on the next call', () => {
    process.env.DEMO_MODE = 'true';
    expect(service.isDemoMode()).toBe(true);
    process.env.DEMO_MODE = 'off';
    expect(service.isDemoMode()).toBe(false);
    delete process.env.DEMO_MODE;
    expect(service.isDemoMode()).toBe(false);
  });

  it('env() exposes the full live-derived namespaces', () => {
    process.env.DEMO_MODE = 'yes';
    expect(service.env().demo.enabled).toBe(true);
    expect(service.env().app.port).toBeTypeOf('number');
  });
});

describe('RuntimeEnvService getters (live per call)', () => {
  const service = new RuntimeEnvService();
  const KEYS = ['NODE_ENV', 'TREK_MANAGED', 'APP_VERSION', 'APP_URL'] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  });
  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('APPCFG-RT-001: isManaged is on only for an explicit true, and follows a change without a rebuild', () => {
    process.env.TREK_MANAGED = 'true';
    expect(service.isManaged()).toBe(true);
    process.env.TREK_MANAGED = 'maybe';
    expect(service.isManaged()).toBe(false);
    delete process.env.TREK_MANAGED;
    expect(service.isManaged()).toBe(false);
  });

  it('APPCFG-RT-002: isTest matches NODE_ENV=test case-sensitively, while production and development ignore case', () => {
    process.env.NODE_ENV = 'TEST';
    expect(service.isTest()).toBe(false);
    expect(service.nodeEnv()).toBe('TEST');

    process.env.NODE_ENV = 'Production';
    expect(service.isProduction()).toBe(true);
    expect(service.isDevelopment()).toBe(false);

    process.env.NODE_ENV = 'DEVELOPMENT';
    expect(service.isDevelopment()).toBe(true);
    expect(service.isProduction()).toBe(false);

    process.env.NODE_ENV = 'test';
    expect(service.isTest()).toBe(true);
  });

  it('APPCFG-RT-003: appUrl is handed out raw, trailing slash and all', () => {
    process.env.APP_URL = 'https://trip.example.org/';
    expect(service.appUrl()).toBe('https://trip.example.org/');
    delete process.env.APP_URL;
    expect(service.appUrl()).toBeUndefined();
  });

  // A checkout has no image VERSION file; inside a built image the file would
  // win over APP_VERSION (derive.ts), so this case only means something here.
  it.skipIf(imageVersion() !== null)(
    'APPCFG-RT-004: appVersion reads APP_VERSION live when the image ships no VERSION file',
    () => {
      process.env.APP_VERSION = '4.4.0';
      expect(service.appVersion()).toBe('4.4.0');
      process.env.APP_VERSION = '4.4.1';
      expect(service.appVersion()).toBe('4.4.1');
      delete process.env.APP_VERSION;
      expect(service.appVersion()).toBeUndefined();
    },
  );
});

describe('boot-stable tokens', () => {
  it('factories re-derive from the current env on each invocation', () => {
    const prev = process.env.HSTS_INCLUDE_SUBDOMAINS;
    try {
      process.env.HSTS_INCLUDE_SUBDOMAINS = 'on';
      expect(httpConfig().hstsIncludeSubdomains).toBe(true);
      process.env.HSTS_INCLUDE_SUBDOMAINS = 'off';
      expect(httpConfig().hstsIncludeSubdomains).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.HSTS_INCLUDE_SUBDOMAINS;
      else process.env.HSTS_INCLUDE_SUBDOMAINS = prev;
    }
  });

  it('every token carries a namespaced KEY for @Inject', () => {
    for (const token of BOOT_STABLE_TOKENS) {
      expect(token.KEY).toMatch(/^CONFIGURATION\(.+\)$/);
    }
  });
});

describe('AppConfigModule', () => {
  it('provides ConfigService, RuntimeEnvService, DataPathsService and the loaded namespaces', async () => {
    const prev = process.env.TREK_PLACE_PHOTO_DIR;
    process.env.TREK_PLACE_PHOTO_DIR = '/srv/place-photos';
    const moduleRef = await Test.createTestingModule({ imports: [AppConfigModule] }).compile();
    if (prev === undefined) delete process.env.TREK_PLACE_PHOTO_DIR;
    else process.env.TREK_PLACE_PHOTO_DIR = prev;
    try {
      const config = moduleRef.get(ConfigService);
      const runtime = moduleRef.get(RuntimeEnvService);
      const storage = moduleRef.get<ConfigType<typeof storageConfig>>(storageConfig.KEY);
      expect(runtime).toBeInstanceOf(RuntimeEnvService);
      expect(moduleRef.get(DataPathsService)).toBeInstanceOf(DataPathsService);
      // A snapshot taken when the module was built, not a live read.
      expect(storage.placePhotoDir).toBe('/srv/place-photos');
      // Plain get() falls through to live process.env (cache: false).
      expect(config.get('NODE_ENV')).toBe('test');
    } finally {
      await moduleRef.close();
    }
  });

  // Guards `ignoreEnvFile: true`: a marker var present only in server/.env must
  // stay invisible. Skipped locally when a real server/.env exists (we won't
  // clobber it); CI has none, so the regression is always covered there.
  const envPath = path.resolve(process.cwd(), '.env');
  it.skipIf(fs.existsSync(envPath))('never reads a .env file (dotenv stays index.ts-only)', async () => {
    fs.writeFileSync(envPath, 'TREK_TEST_ENVFILE_MARKER=leaked\n');
    try {
      const moduleRef = await Test.createTestingModule({ imports: [AppConfigModule] }).compile();
      try {
        const config = moduleRef.get(ConfigService);
        expect(config.get('TREK_TEST_ENVFILE_MARKER')).toBeUndefined();
        expect(process.env.TREK_TEST_ENVFILE_MARKER).toBeUndefined();
      } finally {
        await moduleRef.close();
      }
    } finally {
      fs.rmSync(envPath, { force: true });
    }
  });
});
