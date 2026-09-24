import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

import { NativeAuthController } from '../../../src/nest/native-auth/native-auth.controller';
import type { NativeAuthService } from '../../../src/nest/native-auth/native-auth.service';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import type { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import type { User } from '../../../src/types';

const challenge = 'a'.repeat(64);
const verifier = 'v'.repeat(43);

function build(opts: { redeem?: { token: string; userId: number } | null; allowed?: boolean } = {}) {
  const nativeAuth = {
    issueCode: vi.fn().mockReturnValue('code-1'),
    redeem: vi.fn().mockReturnValue(opts.redeem === undefined ? { token: 'jwt', userId: 7 } : opts.redeem),
  } as unknown as NativeAuthService;
  const auth = { setAuthCookie: vi.fn() } as unknown as AuthService;
  const audit = { writeAudit: vi.fn() } as unknown as AuditService;
  const rl = { check: vi.fn().mockReturnValue(opts.allowed ?? true) } as unknown as RateLimitService;
  return { controller: new NativeAuthController(nativeAuth, auth, audit, rl), nativeAuth, auth, audit, rl };
}

const req = { ip: '10.0.0.1', headers: {} } as unknown as Request;
const res = {} as Response;

beforeEach(() => vi.clearAllMocks());

describe('NativeAuthController.handoff', () => {
  it('issues a code for the signed-in user and the given challenge', () => {
    const { controller, nativeAuth } = build();

    expect(controller.handoff({ challenge }, { id: 7 } as User)).toEqual({ code: 'code-1' });
    expect(nativeAuth.issueCode).toHaveBeenCalledWith(7, challenge);
  });
});

describe('NativeAuthController.exchange', () => {
  it('sets a remembered session cookie and audits the login', () => {
    const { controller, auth, audit } = build();

    expect(controller.exchange({ code: 'code-1', verifier }, req, res)).toEqual({ ok: true });
    expect(auth.setAuthCookie).toHaveBeenCalledWith(res, 'jwt', req, true);
    expect(audit.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7, action: 'user.login', details: { method: 'native_app' },
    }));
  });

  it('answers 400 with the generic message when the code does not redeem', () => {
    const { controller, auth } = build({ redeem: null });

    expect(() => controller.exchange({ code: 'x', verifier }, req, res)).toThrow(
      expect.objectContaining({ status: 400, response: { error: 'Invalid or expired code' } }),
    );
    expect(auth.setAuthCookie).not.toHaveBeenCalled();
  });

  it('answers 429 once the per-ip bucket is exhausted, before touching the code', () => {
    const { controller, nativeAuth, rl } = build({ allowed: false });

    expect(() => controller.exchange({ code: 'x', verifier }, req, res)).toThrow(expect.objectContaining({ status: 429 }));
    expect(rl.check).toHaveBeenCalledWith('native-exchange', '10.0.0.1', 20, 15 * 60 * 1000, expect.any(Number));
    expect(nativeAuth.redeem).not.toHaveBeenCalled();
  });

  it('buckets requests without an ip under one key', () => {
    const { controller, rl } = build();
    controller.exchange({ code: 'x', verifier }, { headers: {} } as unknown as Request, res);

    expect(rl.check).toHaveBeenCalledWith('native-exchange', 'unknown', 20, expect.any(Number), expect.any(Number));
  });
});
