/**
 * ApiTokenGuard — the only door into /api/v1.
 *
 * The cases that matter here are the refusals. A guard that lets the right token
 * through is easy; one that also lets a session JWT, an OAuth bearer or a random
 * string through is a credential-confusion bug, and those are the tests below.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ApiTokenGuard } from '../../../src/nest/public-api/api-token.guard';
import type { TokenService } from '../../../src/nest/tokens/token.service';
import type { User } from '../../../src/types';

const USER: User = { id: 7, username: 'ada', email: 'ada@example.com', role: 'user' } as User;

function contextWith(headers: Record<string, string | undefined>) {
  const req: Record<string, unknown> = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    req,
  } as unknown as ExecutionContext & { req: Record<string, unknown> };
}

function makeGuard(verify: (raw: string) => User | null) {
  return new ApiTokenGuard({ verifyApiToken: verify } as unknown as TokenService);
}

/** Run the guard, expecting a refusal; return its { status, body }. */
function refused(fn: () => boolean): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the guard to refuse');
}

describe('ApiTokenGuard', () => {
  it('accepts a trek_ token via Authorization: Bearer and resolves the user', () => {
    const verify = vi.fn().mockReturnValue(USER);
    const ctx = contextWith({ authorization: 'Bearer trek_abc123' });
    expect(makeGuard(verify).canActivate(ctx)).toBe(true);
    expect(verify).toHaveBeenCalledWith('trek_abc123');
    expect(ctx.req.user).toBe(USER);
  });

  it('accepts the same token via X-API-Key', () => {
    const verify = vi.fn().mockReturnValue(USER);
    const ctx = contextWith({ 'x-api-key': 'trek_abc123' });
    expect(makeGuard(verify).canActivate(ctx)).toBe(true);
    expect(verify).toHaveBeenCalledWith('trek_abc123');
  });

  it('trims surrounding whitespace before looking a token up', () => {
    const verify = vi.fn().mockReturnValue(USER);
    makeGuard(verify).canActivate(contextWith({ 'x-api-key': '  trek_abc123  ' }));
    expect(verify).toHaveBeenCalledWith('trek_abc123');
  });

  it('401s without any credential', () => {
    const verify = vi.fn();
    expect(refused(() => makeGuard(verify).canActivate(contextWith({})))).toEqual({
      status: 401,
      body: { error: 'API token required', code: 'API_TOKEN_REQUIRED' },
    });
    expect(verify).not.toHaveBeenCalled();
  });

  it('never reaches for the MCP verifier, so the two credentials cannot swap', () => {
    const verifyApiToken = vi.fn().mockReturnValue(USER);
    const verifyMcpToken = vi.fn();
    const guard = new ApiTokenGuard({ verifyApiToken, verifyMcpToken } as unknown as TokenService);
    guard.canActivate(contextWith({ authorization: 'Bearer trek_abc123' }));
    expect(verifyApiToken).toHaveBeenCalledTimes(1);
    expect(verifyMcpToken).not.toHaveBeenCalled();
  });

  it('401s on a token the store does not know, without saying which part was wrong', () => {
    const verify = vi.fn().mockReturnValue(null);
    expect(
      refused(() => makeGuard(verify).canActivate(contextWith({ authorization: 'Bearer trek_nope' }))),
    ).toEqual({
      status: 401,
      body: { error: 'Invalid API token', code: 'API_TOKEN_INVALID' },
    });
  });

  /**
   * The credential-confusion cases. Each of these is a valid credential somewhere
   * else in TREK, and none of them may open this door — a session cookie that ends
   * up in a third-party integration is precisely what a machine token prevents.
   */
  it.each([
    ['a session JWT', { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig' }],
    ['an OAuth bearer', { authorization: 'Bearer mcp_at_9f3a2b' }],
    ['a bare random string', { authorization: 'Bearer hunter2' }],
    ['a non-Bearer scheme', { authorization: 'Basic dHJlazpwdw==' }],
    ['a trek_ token in the wrong scheme', { authorization: 'Token trek_abc123' }],
    ['an X-API-Key that is not a trek_ token', { 'x-api-key': 'eyJhbGciOiJIUzI1NiJ9.p.s' }],
  ])('refuses %s without ever hitting the token store', (_label, headers) => {
    const verify = vi.fn();
    expect(refused(() => makeGuard(verify).canActivate(contextWith(headers)))).toEqual({
      status: 401,
      body: { error: 'API token required', code: 'API_TOKEN_REQUIRED' },
    });
    expect(verify).not.toHaveBeenCalled();
  });

  it('ignores an array-valued Authorization header rather than coercing it', () => {
    const verify = vi.fn();
    const ctx = contextWith({ authorization: ['Bearer trek_abc'] as unknown as string });
    expect(refused(() => makeGuard(verify).canActivate(ctx)).status).toBe(401);
    expect(verify).not.toHaveBeenCalled();
  });
});
