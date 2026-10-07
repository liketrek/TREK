import { AppModule } from '../../../src/nest/app.module';
import { AdminGuard } from '../../../src/nest/auth/admin.guard';
import { FeaturesController } from '../../../src/nest/health/features.controller';
import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/config', async () => {
  const { readEnv } = await import('../../../src/app-config');
  const env = readEnv();
  return {
    ENCRYPTION_KEY: 'wiring-test-inert-encryption-key',
    JWT_SECRET: 'wiring-test-inert-jwt-secret',
    updateJwtSecret: vi.fn(),
    DEFAULT_LANGUAGE: env.app.defaultLanguage,
    SESSION_DURATION: env.session.duration,
    SESSION_DURATION_MS: env.session.durationMs,
    SESSION_DURATION_SECONDS: env.session.durationSeconds,
    SESSION_DURATION_REMEMBER: env.session.durationRemember,
    SESSION_DURATION_REMEMBER_MS: env.session.durationRememberMs,
    SESSION_DURATION_REMEMBER_SECONDS: env.session.durationRememberSeconds,
  };
});

function ctx(user: unknown) {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as never;
}

describe('AppModule wiring', () => {
  it('registers the upstream feature modules and Tours exactly once', () => {
    // Only plain class imports: forRoot()/forFeature() entries are dynamic
    // (MikroOrmModule legitimately appears twice) and some resolve async.
    const imports = Reflect.getMetadata('imports', AppModule) as unknown[];
    const names = imports
      .filter((entry): entry is { name: string } => typeof entry === 'function')
      .map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(
      expect.arrayContaining([
        'GoogleQuotaModule',
        'ReceiptScanModule',
        'SchoolHolidaysModule',
        'DocSyncModule',
        'DawarichModule',
        'NotificationsModule',
        'ToursModule',
      ]),
    );
    expect(names.filter((name) => name === 'ToursModule')).toHaveLength(1);
  });

  it('compiles with the global filter + DB provider and resolves the controller', async () => {
    // Plan 4 Task 4: `DatabaseService` is gone — nothing left in the graph
    // needs overriding for this to compile.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    // The one test that builds the whole AppModule: resolving a controller out of
    // it proves every module in the graph compiled, not just this one.
    expect(moduleRef.get(FeaturesController)).toBeInstanceOf(FeaturesController);
  });
});

describe('AdminGuard', () => {
  const guard = new AdminGuard();
  it('allows admins', () => {
    expect(guard.canActivate(ctx({ role: 'admin' }))).toBe(true);
  });
  it('blocks non-admins and anonymous with 403 { error }', () => {
    expect(() => guard.canActivate(ctx({ role: 'user' }))).toThrow(HttpException);
    expect(() => guard.canActivate(ctx(undefined))).toThrow(HttpException);
  });
});
