/**
 * NativeAuthController: the HTTP half of the native sign-in hand-off. The
 * handoff route hands the signed-in user's id and the challenge to the
 * service; the exchange route is rate-limited per ip before the code is
 * touched, sets the remembered session cookie and writes the login row.
 */
import type { AuditService } from '../../../src/nest/audit/audit.service';
import { DomainError } from '../../../src/nest/common/domain-error';
import type { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { NativeAuthController } from '../../../src/nest/native-auth/native-auth.controller';
import type { NativeAuthService } from '../../../src/nest/native-auth/native-auth.service';
import type { User } from '../../../src/types';
import { nativeHandoffResponseSchema, successResponseSchema } from '@trek/shared';

import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const challenge = 'a'.repeat(64);
const verifier = 'v'.repeat(43);

function build(opts: { redeem?: () => Promise<{ token: string; userId: number }>; allowed?: boolean } = {}) {
  const nativeAuth = {
    issueCode: vi.fn().mockResolvedValue('code-1'),
    redeem: vi.fn(opts.redeem ?? (() => Promise.resolve({ token: 'jwt', userId: 7 }))),
  };
  const audit = { writeAudit: vi.fn().mockResolvedValue(undefined) };
  const rl = { check: vi.fn().mockResolvedValue(opts.allowed ?? true) };
  const controller = new NativeAuthController(
    nativeAuth as unknown as NativeAuthService,
    audit as unknown as AuditService,
    rl as unknown as RateLimitService,
  );
  return { controller, nativeAuth, audit, rl };
}

const req = { ip: '10.0.0.1', headers: { 'user-agent': 'TREK Android' } } as unknown as Request;

function makeRes() {
  return { cookie: vi.fn() } as unknown as Response & { cookie: ReturnType<typeof vi.fn> };
}

beforeEach(() => vi.clearAllMocks());

describe('NativeAuthController.handoff', () => {
  it('NATIVE-CTL-001: issues a code for the signed-in user and the given challenge', async () => {
    const { controller, nativeAuth } = build();

    expect(await controller.handoff({ challenge }, { id: 7 } as User)).toEqual({ code: 'code-1' });
    expect(nativeAuth.issueCode).toHaveBeenCalledWith(7, challenge);
  });
});

describe('NativeAuthController.exchange', () => {
  it('NATIVE-CTL-002: sets a remembered session cookie, passes the device on and audits the login', async () => {
    const { controller, nativeAuth, audit } = build();
    const res = makeRes();

    expect(await controller.exchange({ code: 'code-1', verifier }, req, res)).toEqual({ success: true });
    expect(nativeAuth.redeem).toHaveBeenCalledWith('code-1', verifier, { userAgent: 'TREK Android' });
    expect(res.cookie).toHaveBeenCalledWith('trek_session', 'jwt', expect.objectContaining({ httpOnly: true }));
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, action: 'user.login', details: { method: 'native_app' } }),
    );
  });

  it('NATIVE-CTL-003: a code that does not redeem sets no cookie and writes no login', async () => {
    const { controller, audit } = build({
      redeem: () => Promise.reject(new DomainError(400, 'Invalid or expired code')),
    });
    const res = makeRes();

    await expect(controller.exchange({ code: 'x', verifier }, req, res)).rejects.toEqual(
      expect.objectContaining({ status: 400, response: { error: 'Invalid or expired code' } }),
    );
    expect(res.cookie).not.toHaveBeenCalled();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('NATIVE-CTL-004: answers 429 once the per-ip bucket is exhausted, before touching the code', async () => {
    const { controller, nativeAuth, rl } = build({ allowed: false });

    await expect(controller.exchange({ code: 'x', verifier }, req, makeRes())).rejects.toEqual(
      expect.objectContaining({ status: 429 }),
    );
    expect(rl.check).toHaveBeenCalledWith('native-exchange', '10.0.0.1', 20, 15 * 60 * 1000, expect.any(Number));
    expect(nativeAuth.redeem).not.toHaveBeenCalled();
  });

  it('NATIVE-CTL-005: buckets requests without an ip under one key', async () => {
    const { controller, rl } = build();
    await controller.exchange({ code: 'x', verifier }, { headers: {} } as unknown as Request, makeRes());

    expect(rl.check).toHaveBeenCalledWith('native-exchange', 'unknown', 20, expect.any(Number), expect.any(Number));
  });

  it('NATIVE-CTL-006: both routes declare their shared response contracts', () => {
    const proto = NativeAuthController.prototype;
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, proto.handoff)).toBe(nativeHandoffResponseSchema);
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, proto.exchange)).toBe(successResponseSchema);
  });
});
