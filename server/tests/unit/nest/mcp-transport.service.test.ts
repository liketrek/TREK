import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  getMcpSafeUrl: vi.fn(() => 'https://trek.example.test'),
}));

vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/app-config')>();
  return { ...actual, getMcpSafeUrl: h.getMcpSafeUrl };
});
vi.mock('../../../src/db/database', () => ({ db: {}, closeDb: () => {}, reinitialize: () => {} }));

import {
  McpTransportService,
  armSseKeepalive,
  countSessionsForUser,
  jsonRpcError,
  sameScopes,
  setAuthChallenge,
} from '../../../src/nest/mcp-transport/mcp-transport.service';
import { McpTransportController } from '../../../src/nest/mcp-transport/mcp-transport.controller';
import { sessions } from '../../../src/mcp/sessionManager';
import { KEEPALIVE_MS } from '../../../src/mcp';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import type { TokenService } from '../../../src/nest/tokens/token.service';
import type { OauthService } from '../../../src/nest/oauth/oauth.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import type { McpRegistryService } from '../../../src/nest-mcp';
import { IS_PUBLIC } from '../../../src/nest/auth/public.decorator';

const user = { id: 7, username: 'u', email: 'u@example.com', role: 'user' as const };

function makeService(overrides: {
  auth?: Partial<Record<'verifyJwtToken', unknown>>;
  tokens?: Partial<Record<'verifyMcpToken', unknown>>;
  oauth?: Partial<Record<'getUserByAccessToken', unknown>>;
  addons?: Partial<Record<'isAddonEnabled', unknown>>;
} = {}) {
  const auth = { verifyJwtToken: vi.fn(() => null), ...overrides.auth } as unknown as AuthService;
  const tokens = { verifyMcpToken: vi.fn(() => null), ...overrides.tokens } as unknown as TokenService;
  const oauth = { getUserByAccessToken: vi.fn(() => null), ...overrides.oauth } as unknown as OauthService;
  const addons = { isAddonEnabled: vi.fn(() => true), ...overrides.addons } as unknown as AddonsService;
  const audit = { writeAudit: vi.fn() } as unknown as AuditService;
  const registry = { attach: vi.fn() } as unknown as McpRegistryService;
  return { svc: new McpTransportService(auth, tokens, oauth, addons, audit, registry), auth, tokens, oauth, addons, audit };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getMcpSafeUrl.mockReturnValue('https://trek.example.test');
});

describe('jsonRpcError', () => {
  it('MCPT-001: shapes a valid JSON-RPC 2.0 error frame', () => {
    expect(jsonRpcError('nope')).toEqual({ jsonrpc: '2.0', error: { code: -32000, message: 'nope' }, id: null });
    expect(jsonRpcError('custom', -32601)).toEqual({ jsonrpc: '2.0', error: { code: -32601, message: 'custom' }, id: null });
  });
});

describe('setAuthChallenge', () => {
  it('MCPT-002: writes the RFC 9728 path-suffixed challenge with the given error code', () => {
    const res = { set: vi.fn() };
    setAuthChallenge(res as never);
    expect(res.set).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer realm="TREK MCP", resource_metadata="https://trek.example.test/.well-known/oauth-protected-resource/mcp", error="invalid_token"',
    );
    setAuthChallenge(res as never, 'insufficient_scope');
    expect(res.set).toHaveBeenLastCalledWith('WWW-Authenticate', expect.stringContaining('error="insufficient_scope"'));
  });
});

describe('sameScopes', () => {
  it('MCPT-008: full access only matches full access', () => {
    expect(sameScopes(null, null)).toBe(true);
    expect(sameScopes(null, ['trips:read'])).toBe(false);
    expect(sameScopes(['trips:read'], null)).toBe(false);
  });

  it('MCPT-009: order does not matter, membership does', () => {
    expect(sameScopes(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameScopes(['a', 'b'], ['a'])).toBe(false);
    expect(sameScopes(['a'], ['b'])).toBe(false);
    expect(sameScopes([], [])).toBe(true);
  });
});

describe('countSessionsForUser', () => {
  afterEach(() => sessions.clear());

  it('MCPT-003: counts only live sessions belonging to the user', () => {
    const now = Date.now();
    const fake = (userId: number, lastActivity: number) =>
      ({ userId, lastActivity, server: {}, transport: {}, scopes: null, clientId: null, isStaticToken: false }) as never;
    sessions.set('a', fake(7, now));
    sessions.set('b', fake(7, now - 1));
    sessions.set('c', fake(8, now));
    sessions.set('d', fake(7, 0)); // long expired
    expect(countSessionsForUser(7)).toBe(2);
    expect(countSessionsForUser(9)).toBe(0);
  });
});

describe('armSseKeepalive', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function makeRes(contentType: string) {
    return {
      headersSent: true,
      writableEnded: false,
      destroyed: false,
      getHeader: vi.fn(() => contentType),
      write: vi.fn(),
      once: vi.fn(),
    };
  }

  it('MCPT-004: pings an open event stream and touches the session', () => {
    const res = makeRes('text/event-stream');
    const touch = vi.fn();
    armSseKeepalive(res as never, touch);
    vi.advanceTimersByTime(KEEPALIVE_MS + 5);
    expect(res.write).toHaveBeenCalledWith(': keepalive\n\n');
    expect(touch).toHaveBeenCalled();
  });

  it('MCPT-005: stops as soon as the response is not an open event stream', () => {
    const res = makeRes('application/json');
    armSseKeepalive(res as never, vi.fn());
    vi.advanceTimersByTime(KEEPALIVE_MS + 5);
    expect(res.write).not.toHaveBeenCalled();
    // Timer cleared: a second window writes nothing either.
    vi.advanceTimersByTime(KEEPALIVE_MS + 5);
    expect(res.write).not.toHaveBeenCalled();
  });

  it('MCPT-006: waits for headers before judging the stream', () => {
    const res = makeRes('text/event-stream');
    res.headersSent = false;
    armSseKeepalive(res as never, vi.fn());
    vi.advanceTimersByTime(KEEPALIVE_MS + 5);
    expect(res.write).not.toHaveBeenCalled();
    res.headersSent = true;
    vi.advanceTimersByTime(KEEPALIVE_MS + 5);
    expect(res.write).toHaveBeenCalled();
  });

  it('MCPT-007: clears its interval when the response closes', () => {
    const res = makeRes('text/event-stream');
    armSseKeepalive(res as never);
    expect(res.once).toHaveBeenCalledWith('close', expect.any(Function));
  });
});

describe('McpTransportService.verifyToken', () => {
  it('MCPT-010: rejects a missing header, a schemeless token, and non-Bearer schemes', () => {
    const { svc } = makeService();
    expect(svc.verifyToken(undefined)).toBeNull();
    expect(svc.verifyToken('token-without-scheme')).toBeNull();
    expect(svc.verifyToken('Basic dXNlcjpwdw==')).toBeNull();
    expect(svc.verifyToken('Bearer ')).toBeNull();
  });

  it('MCPT-011: trekoa_ tokens resolve through OauthService and enforce the RFC 8707 audience', () => {
    const info = { user, scopes: ['trips:read'], clientId: 'cid-1', audience: 'https://trek.example.test/mcp' };
    const { svc, oauth } = makeService({ oauth: { getUserByAccessToken: vi.fn(() => info) } });
    expect(svc.verifyToken('Bearer trekoa_x')).toEqual({
      user, scopes: ['trips:read'], clientId: 'cid-1', isStaticToken: false,
    });
    expect(oauth.getUserByAccessToken).toHaveBeenCalledWith('trekoa_x');

    const wrongAudience = makeService({
      oauth: { getUserByAccessToken: vi.fn(() => ({ ...info, audience: 'https://other.example.com' })) },
    });
    expect(wrongAudience.svc.verifyToken('Bearer trekoa_x')).toBeNull();

    const unknown = makeService();
    expect(unknown.svc.verifyToken('Bearer trekoa_dead')).toBeNull();
  });

  it('MCPT-012: trek_ static tokens resolve through TokenService with full access + notice flag', () => {
    const { svc, tokens } = makeService({ tokens: { verifyMcpToken: vi.fn(() => user) } });
    expect(svc.verifyToken('Bearer trek_x')).toEqual({ user, scopes: null, clientId: null, isStaticToken: true });
    expect(tokens.verifyMcpToken).toHaveBeenCalledWith('trek_x');
    expect(makeService().svc.verifyToken('Bearer trek_dead')).toBeNull();
  });

  it('MCPT-013: everything else falls back to the JWT path', () => {
    const { svc, auth } = makeService({ auth: { verifyJwtToken: vi.fn(() => user) } });
    expect(svc.verifyToken('Bearer some.jwt.token')).toEqual({ user, scopes: null, clientId: null, isStaticToken: false });
    expect(auth.verifyJwtToken).toHaveBeenCalledWith('some.jwt.token');
    expect(makeService().svc.verifyToken('Bearer not-a-jwt')).toBeNull();
  });
});

describe('McpTransportController', () => {
  it('MCPT-020: is a @Public controller on the /mcp path with the three transport verbs', () => {
    expect(Reflect.getMetadata('path', McpTransportController)).toBe('mcp');
    expect(Reflect.getMetadata(IS_PUBLIC, McpTransportController)).toBeTruthy();
    for (const method of ['post', 'get', 'delete'] as const) {
      expect(typeof McpTransportController.prototype[method]).toBe('function');
    }
  });

  it('MCPT-021: every verb passes straight through to the service', async () => {
    const handle = vi.fn(async () => {});
    const ctrl = new McpTransportController({ handle } as unknown as McpTransportService);
    const req = {} as never;
    const res = {} as never;
    await ctrl.post(req, res);
    await ctrl.get(req, res);
    await ctrl.delete(req, res);
    expect(handle).toHaveBeenCalledTimes(3);
    expect(handle).toHaveBeenCalledWith(req, res);
  });
});
