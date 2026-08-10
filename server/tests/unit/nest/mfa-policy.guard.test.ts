/**
 * MfaPolicyGuard — the require_mfa policy, moved off the Express layer.
 *
 * The cases that matter here are the exemptions, because that is where the
 * middleware had drifted: it decided on two literal path lists, and every public
 * /api endpoint added after those lists were written answered a logged-in user
 * without MFA with a 403 while answering a stranger fine. MFA-011 pins the
 * correction.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaExempt, MFA_EXEMPT, MfaPolicyGuard } from '../../../src/nest/auth/mfa-policy.guard';
import { Public, IS_PUBLIC } from '../../../src/nest/auth/public.decorator';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { DEMO_EMAIL_PRIMARY } from '../../../src/nest/common/demo';
import type { User } from '../../../src/types';

const user = { id: 7, email: 'u@example.test', role: 'user' } as User;

interface Rows {
  requireMfa?: string;
  mfaEnabled?: number | boolean | undefined;
  hasPasskey?: boolean;
  userMissing?: boolean;
}

function makeGuard(rows: Rows = {}, meta: { public?: boolean; exempt?: boolean } = {}, demo = false) {
  const get = vi.fn((sql: string) => {
    if (sql.includes('app_settings')) return rows.requireMfa === undefined ? undefined : { value: rows.requireMfa };
    if (sql.includes('FROM users')) return rows.userMissing ? undefined : { mfa_enabled: rows.mfaEnabled ?? 0 };
    if (sql.includes('webauthn_credentials')) return rows.hasPasskey ? { 1: 1 } : undefined;
    return undefined;
  });
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      (key === IS_PUBLIC && meta.public) || (key === MFA_EXEMPT && meta.exempt) ? { reason: 'x' } : undefined,
    ),
  } as unknown as Reflector;
  const guard = new MfaPolicyGuard(
    { get } as unknown as DatabaseService,
    { isDemoMode: () => demo } as unknown as RuntimeEnvService,
    reflector,
  );
  return { guard, get };
}

function ctx(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as never;
}

const thrown = (run: () => unknown) => {
  try {
    run();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
};

const ENFORCED: Rows = { requireMfa: 'true', mfaEnabled: 0 };

describe('MfaPolicyGuard', () => {
  it('MFA-001: refuses a user without MFA while the policy is on, with the legacy body', () => {
    const { guard } = makeGuard(ENFORCED);
    expect(thrown(() => guard.canActivate(ctx({ user })))).toEqual({
      status: 403,
      body: {
        error: 'Two-factor authentication is required. Complete setup in Settings.',
        code: 'MFA_REQUIRED',
      },
    });
  });

  it('MFA-002: lets a user with TOTP through', () => {
    const { guard } = makeGuard({ requireMfa: 'true', mfaEnabled: 1 });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
  });

  it('MFA-003: a user-verified passkey satisfies the policy like TOTP does', () => {
    const { guard } = makeGuard({ requireMfa: 'true', mfaEnabled: 0, hasPasskey: true });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
  });

  it('MFA-004: does nothing when the policy is off, and never reads the users row', () => {
    const { guard, get } = makeGuard({ requireMfa: 'false', mfaEnabled: 0 });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
    expect(get.mock.calls.some((c) => String(c[0]).includes('FROM users'))).toBe(false);
  });

  it('MFA-005: does nothing when the setting row is absent at all', () => {
    const { guard } = makeGuard({ mfaEnabled: 0 });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
  });

  it('MFA-006: an anonymous request is not the policy business', () => {
    const { guard, get } = makeGuard(ENFORCED);
    expect(guard.canActivate(ctx({}))).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it('MFA-007: the demo account is exempt while demo mode is on', () => {
    const demoUser = { id: 1, email: DEMO_EMAIL_PRIMARY, role: 'user' } as User;
    expect(makeGuard(ENFORCED, {}, true).guard.canActivate(ctx({ user: demoUser }))).toBe(true);
    // …and not otherwise.
    expect(thrown(() => makeGuard(ENFORCED, {}, false).guard.canActivate(ctx({ user: demoUser })))).toEqual({
      status: 403,
      body: expect.objectContaining({ code: 'MFA_REQUIRED' }),
    });
  });

  it('MFA-008: a user row that vanished mid-request is let through, not 403d', () => {
    const { guard } = makeGuard({ requireMfa: 'true', userMissing: true });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
  });

  it('MFA-009: @MfaExempt is the way out — setup would be unreachable otherwise', () => {
    const { guard } = makeGuard(ENFORCED, { exempt: true });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
  });

  it('MFA-010: it reads req.user rather than verifying the token again', () => {
    // The middleware this replaces called jwt.verify and SELECTed the users row a
    // second time on every /api request, then discarded the result.
    const { guard, get } = makeGuard({ requireMfa: 'true', mfaEnabled: 1 });
    guard.canActivate(ctx({ user, headers: { authorization: 'Bearer nonsense' } }));
    expect(get.mock.calls.map((c) => c[0]).every((sql) => !String(sql).includes('password_version'))).toBe(true);
  });

  it('MFA-011: a @Public route no longer 403s a logged-in user without MFA', () => {
    // The correction. /api/config, /api/help/*, the public journey and share
    // routes and /api/health/features all answered a stranger fine and answered
    // this user with a 403, because they were added after the middleware path
    // lists were written and nobody noticed.
    const { guard, get } = makeGuard(ENFORCED, { public: true });
    expect(guard.canActivate(ctx({ user }))).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it('MFA-012: the decorators write what the guard reads', () => {
    class Probe {
      @MfaExempt('setup would be unreachable')
      exempt() {}
      @Public('anonymous')
      open() {}
    }
    expect(Reflect.getMetadata(MFA_EXEMPT, Probe.prototype.exempt)).toEqual({ reason: 'setup would be unreachable' });
    expect(Reflect.getMetadata(IS_PUBLIC, Probe.prototype.open)).toEqual({ reason: 'anonymous' });
  });
});
