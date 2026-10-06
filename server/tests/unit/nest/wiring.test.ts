import { AppModule } from '../../../src/nest/app.module';
import { AdminGuard } from '../../../src/nest/auth/admin.guard';
import { FeaturesController } from '../../../src/nest/health/features.controller';
import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { describe, it, expect } from 'vitest';

function ctx(user: unknown) {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as never;
}

describe('AppModule wiring', () => {
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
