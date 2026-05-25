import { describe, it, expect } from 'vitest';
import { HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';

function context(req: unknown) {
  return { switchToHttp: () => ({ getRequest: () => req }) } as never;
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('rejects with the legacy 401 { error, code } when no token is present', () => {
    let thrown: unknown;
    try {
      guard.canActivate(context({ headers: {}, cookies: {} }));
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(401);
    expect((thrown as HttpException).getResponse()).toEqual({
      error: 'Access token required',
      code: 'AUTH_REQUIRED',
    });
  });
});
