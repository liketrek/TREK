import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Test } from '@nestjs/testing';
import { ConfigService, ConfigType } from '@nestjs/config';

import { AppConfigModule } from '../../../src/nest/app-config/app-config.module';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { httpConfig, mcpConfig, BOOT_STABLE_TOKENS } from '../../../src/nest/app-config/tokens';

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

describe('boot-stable tokens', () => {
  it('factories re-derive from the current env on each invocation', () => {
    const prev = process.env.FORCE_HTTPS;
    try {
      process.env.FORCE_HTTPS = 'on';
      expect(httpConfig().forceHttps).toBe(true);
      process.env.FORCE_HTTPS = 'off';
      expect(httpConfig().forceHttps).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.FORCE_HTTPS;
      else process.env.FORCE_HTTPS = prev;
    }
  });

  it('every token carries a namespaced KEY for @Inject', () => {
    for (const token of BOOT_STABLE_TOKENS) {
      expect(token.KEY).toMatch(/^CONFIGURATION\(.+\)$/);
    }
  });
});

describe('AppConfigModule', () => {
  it('provides ConfigService, RuntimeEnvService and the loaded namespaces', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppConfigModule] }).compile();
    try {
      const config = moduleRef.get(ConfigService);
      const runtime = moduleRef.get(RuntimeEnvService);
      const mcp = moduleRef.get<ConfigType<typeof mcpConfig>>(mcpConfig.KEY);
      expect(runtime).toBeInstanceOf(RuntimeEnvService);
      expect(mcp.rateLimitMax).toBe(300);
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
