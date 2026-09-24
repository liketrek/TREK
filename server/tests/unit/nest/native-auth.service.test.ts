import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

import { NativeAuthService, NATIVE_HANDOFF_CODE_TTL_MS } from '../../../src/nest/native-auth/native-auth.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { AuthService } from '../../../src/nest/auth/auth.service';

const verifier = 'v'.repeat(43);
const challenge = crypto.createHash('sha256').update(verifier).digest('hex');

function build(user: { id: number; password_version: number } | null = { id: 7, password_version: 2 }) {
  const db = { get: vi.fn().mockReturnValue(user ?? undefined), run: vi.fn() } as unknown as DatabaseService;
  const auth = { generateToken: vi.fn().mockReturnValue('jwt') } as unknown as AuthService;
  return { service: new NativeAuthService(db, auth), db, auth };
}

describe('NativeAuthService', () => {
  let services: NativeAuthService[] = [];
  const make = (...args: Parameters<typeof build>) => {
    const built = build(...args);
    services.push(built.service);
    return built;
  };

  beforeEach(() => { services = []; });
  afterEach(() => {
    services.forEach((s) => s.onModuleDestroy());
    vi.useRealTimers();
  });

  it('redeems a code with the matching verifier into a remembered session', () => {
    const { service, db, auth } = make();
    const code = service.issueCode(7, challenge);

    expect(service.redeem(code, verifier)).toEqual({ token: 'jwt', userId: 7 });
    expect(auth.generateToken).toHaveBeenCalledWith({ id: 7, password_version: 2 }, true);
    expect(db.run).toHaveBeenCalledWith(expect.stringContaining('last_login'), 7);
  });

  it('refuses a wrong verifier and burns the code with it', () => {
    const { service } = make();
    const code = service.issueCode(7, challenge);

    expect(service.redeem(code, 'w'.repeat(43))).toBeNull();
    expect(service.redeem(code, verifier)).toBeNull();
  });

  it('is single use', () => {
    const { service } = make();
    const code = service.issueCode(7, challenge);

    expect(service.redeem(code, verifier)).not.toBeNull();
    expect(service.redeem(code, verifier)).toBeNull();
  });

  it('refuses an unknown code', () => {
    const { service } = make();
    expect(service.redeem('nope', verifier)).toBeNull();
  });

  it('refuses a code older than its ttl', () => {
    vi.useFakeTimers();
    const { service } = make();
    const code = service.issueCode(7, challenge);
    vi.advanceTimersByTime(NATIVE_HANDOFF_CODE_TTL_MS + 1);

    expect(service.redeem(code, verifier)).toBeNull();
  });

  it('refuses a code whose user was deleted in the meantime', () => {
    const { service, auth } = make(null);
    const code = service.issueCode(7, challenge);

    expect(service.redeem(code, verifier)).toBeNull();
    expect(auth.generateToken).not.toHaveBeenCalled();
  });

  it('sweeps expired codes', () => {
    vi.useFakeTimers();
    const { service } = make();
    const code = service.issueCode(7, challenge);
    vi.advanceTimersByTime(5 * 60_000 + 1);
    vi.useRealTimers();

    expect(service.redeem(code, verifier)).toBeNull();
  });
});
