import { describe, it, expect } from 'vitest';
import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/nest/app.module';
import { HealthController } from '../../../src/nest/health/health.controller';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AdminGuard } from '../../../src/nest/auth/admin.guard';

function ctx(user: unknown) {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as never;
}

describe('AppModule wiring', () => {
  it('compiles with the global filter + DB provider and resolves the controller', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({ get: () => ({ n: 0 }) })
      .compile();
    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
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

describe('DatabaseService (shared connection)', () => {
  it('runs real queries against the existing SQLite connection', () => {
    const svc = new DatabaseService();
    expect(svc.get('SELECT 1 AS one')).toEqual({ one: 1 });
    expect(svc.all('SELECT 1 AS one')).toEqual([{ one: 1 }]);
  });
});
