import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { McpRegistryService } from '../../nest-mcp';
import type { User } from '../../types';
import { ADDON_IDS } from '../../addons';
import { getMcpSafeUrl } from '../../app-config';
import { registerTools } from '../../mcp/tools';
import { sessions, evictOldestSessionForUser } from '../../mcp/sessionManager';
import { SESSION_TTL_MS, MAX_SESSIONS_PER_USER, KEEPALIVE_MS, isRateLimited } from '../../mcp';
import { BASE_MCP_INSTRUCTIONS, STATIC_TOKEN_DEPRECATION_NOTICE } from './mcp-transport.constants';
import { AuthService } from '../auth/auth.service';
import { TokenService } from '../tokens/token.service';
import { OauthService } from '../oauth/oauth.service';
import { AddonsService } from '../addons/addons.service';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';

/**
 * The MCP transport handler behind the container — the former non-Nest
 * mcpHandler (src/mcp/index.ts) with its bridge imports turned into
 * injections. The controller passes every request straight through; all
 * responses are written by hand (SDK JSON-RPC frames or the bespoke error
 * bodies below), never thrown — nothing here may reach the global filters.
 *
 * /mcp bodies are RAW by design: bootstrap's parser wrappers skip the path,
 * the SDK transport reads the stream itself (its own size handling and
 * -32700/406/415 bodies), and `req.body` stays undefined — which is also why
 * handleRequest's parsedBody argument is passed as-is. Never @Body() on /mcp.
 *
 * Process-wide state (session map, rate-limit map, sweep interval, tuning
 * knobs) stays module-scoped in src/mcp — one instance per process no matter
 * how many app instances the test workers build.
 */

/**
 * Write SSE comment frames on an interval while the response is an open
 * event stream. A no-op for JSON/error responses (content-type gate) and for
 * per-POST streams that end quickly (writableEnded gate). `touch` refreshes
 * the session's lastActivity so the sweep never evicts a session whose GET
 * stream is still connected.
 */
export function armSseKeepalive(res: Response, touch?: () => void): void {
  // With pings disabled (MCP_SSE_KEEPALIVE=0) an open stream must STILL count
  // as session activity, or the sweep would evict a live idle client — keep
  // the interval for touch() and only skip the writes.
  const writePings = KEEPALIVE_MS > 0;
  if (!writePings && !touch) return;
  const intervalMs = writePings ? KEEPALIVE_MS : 25_000;
  const timer = setInterval(() => {
    if (!res.headersSent) return;
    const ct = String(res.getHeader('content-type') ?? '');
    if (!ct.includes('text/event-stream') || res.writableEnded || res.destroyed) {
      clearInterval(timer);
      return;
    }
    if (writePings) res.write(': keepalive\n\n');
    touch?.();
  }, intervalMs);
  timer.unref();
  res.once('close', () => clearInterval(timer));
}

export function countSessionsForUser(userId: number): number {
  const cutoff = Date.now() - SESSION_TTL_MS;
  let count = 0;
  for (const session of sessions.values()) {
    if (session.userId === userId && session.lastActivity >= cutoff) count++;
  }
  return count;
}

/** JSON-RPC 2.0 error body. MCP clients parse this and show `message`; a bare `{ error }`
 *  envelope isn't valid JSON-RPC, so they fall back to a generic "tool execution failed". */
export function jsonRpcError(message: string, code = -32000): object {
  return { jsonrpc: '2.0', error: { code, message }, id: null };
}

/** Scope sets as the session froze them: null (full access) only matches null. */
export function sameScopes(a: string[] | null, b: string[] | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  const right = [...b].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  return left.every((scope, i) => scope === right[i]);
}

/**
 * Drop the trailing slashes of a base URL, as a scan rather than /\/+$/: that pattern
 * is unanchored at the front, so the engine restarts it at every slash of a run and
 * rescans to the end each time (quadratic — 25s on 200k). Same string either way.
 */
function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end--;
  return value.slice(0, end);
}

export function setAuthChallenge(res: Response, error = 'invalid_token'): void {
  const base = trimTrailingSlashes(getMcpSafeUrl() || '');
  // RFC 9728 §5: resource with path component /mcp → PRM URL must include the path
  res.set('WWW-Authenticate',
      `Bearer realm="TREK MCP", resource_metadata="${base}/.well-known/oauth-protected-resource/mcp", error="${error}"`);
}

export interface VerifyTokenResult {
  user: User;
  /** null = full access (static token or JWT); string[] = OAuth 2.1 scoped access */
  scopes: string[] | null;
  /** OAuth client_id when authenticated via OAuth 2.1; null otherwise */
  clientId: string | null;
  isStaticToken: boolean;
}

@Injectable()
export class McpTransportService {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly oauth: OauthService,
    private readonly addons: AddonsService,
    private readonly audit: AuditService,
    private readonly registry: McpRegistryService,
  ) {}

  verifyToken(authHeader: string | undefined): VerifyTokenResult | null {
    if (!authHeader) return null;
    // M8: strictly require "Bearer" scheme (RFC 6750)
    const spaceIdx = authHeader.indexOf(' ');
    if (spaceIdx === -1) return null;
    const scheme = authHeader.slice(0, spaceIdx);
    const token  = authHeader.slice(spaceIdx + 1);
    if (scheme.toLowerCase() !== 'bearer' || !token) return null;

    // OAuth 2.1 access token (trekoa_...)
    if (token.startsWith('trekoa_')) {
      const result = this.oauth.getUserByAccessToken(token);
      if (!result) return null;
      // RFC 8707: audience must always match this resource endpoint.
      // Pre-audit tokens with audience=null are revoked by the SEC-H6 migration.
      const expected = `${trimTrailingSlashes(getMcpSafeUrl() || '')}/mcp`;
      if (result.audience !== expected) return null;
      return { user: result.user, scopes: result.scopes, clientId: result.clientId, isStaticToken: false };
    }

    // Long-lived static MCP token (trek_...) — full access + deprecation notice
    if (token.startsWith('trek_')) {
      const user = this.tokens.verifyMcpToken(token);
      if (!user) return null;
      return { user, scopes: null, clientId: null, isStaticToken: true };
    }

    // Short-lived JWT (TREK web session used directly) — full access, no notice
    const user = this.auth.verifyJwtToken(token);
    if (!user) return null;
    return { user, scopes: null, clientId: null, isStaticToken: false };
  }

  async handle(req: Request, res: Response): Promise<void> {
    if (!this.addons.isAddonEnabled(ADDON_IDS.MCP)) {
      res.status(403).json({ error: 'MCP is not enabled' });
      return;
    }

    const tokenResult = this.verifyToken(req.headers['authorization']);
    if (!tokenResult) {
      setAuthChallenge(res);
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    const { user, scopes, clientId, isStaticToken } = tokenResult;

    if (isRateLimited(user.id, clientId)) {
      res.status(429).json({ error: 'Too many requests. Please slow down.' });
      return;
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Resume an existing session
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      if (session.userId !== user.id) {
        setAuthChallenge(res);
        res.status(403).json({ error: 'Session belongs to a different user' });
        return;
      }
      if (session.clientId !== clientId) {
        setAuthChallenge(res);
        res.status(403).json({ error: 'Session was created with a different OAuth client' });
        return;
      }
      // The tool surface is frozen at initialize (registerTools takes the scopes
      // the session was created with), so a token that was later narrowed would
      // otherwise ride the old session's full set of tools. Refusing here makes
      // the client re-initialize, which is what re-authorizing should cost.
      if (!sameScopes(session.scopes, scopes)) {
        setAuthChallenge(res, 'insufficient_scope');
        res.status(403).json({ error: 'Session was created with different scopes' });
        return;
      }
      session.lastActivity = Date.now();
      session.lastClientIp = getClientIp(req);
      armSseKeepalive(res, () => { session.lastActivity = Date.now(); });
      try {
        await session.transport.handleRequest(req, res, req.body);
      } catch (err) {
        console.error('[MCP] transport.handleRequest error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal MCP error' });
        }
      }
      return;
    }

    // Only POST can initialize a new session
    if (req.method !== 'POST') {
      res.status(400).json({ error: 'Missing mcp-session-id header' });
      return;
    }

    // A client that reuses its session sends the header on every call after initialize, so a
    // steady stream of session-less POSTs means the id isn't making it back to the client —
    // usually a reverse proxy dropping Mcp-Session-Id, or a client that ignores it. Say so,
    // because the visible symptom (sessions piling up to the cap) points nowhere near the cause.
    console.warn(
        `[MCP] POST without mcp-session-id for user ${user.id} — starting a new session. ` +
        'If this repeats on every tool call, the Mcp-Session-Id response header is not reaching ' +
        'the client (check that your reverse proxy forwards it).',
    );

    // At the cap, evict this user's coldest session rather than refusing the request: a client
    // stuck re-initializing would otherwise be locked out until the process restarted.
    if (countSessionsForUser(user.id) >= MAX_SESSIONS_PER_USER) {
      const evicted = evictOldestSessionForUser(user.id);
      if (!evicted) {
        res.status(429).json(jsonRpcError('Session limit reached. Close an existing session before opening a new one.'));
        return;
      }
      console.log(`[MCP] Session limit (${MAX_SESSIONS_PER_USER}) reached for user ${user.id} — evicted idle session ${evicted}`);
    }

    // Create a new per-user MCP server and session
    const server = new McpServer(
        {
          name: 'TREK MCP',
          version: '1.0.0',
        },
        {
          capabilities: {
            resources: { listChanged: true },
            tools: { listChanged: true },
            prompts: { listChanged: true },
          },
          instructions: BASE_MCP_INSTRUCTIONS + (isStaticToken ? STATIC_TOKEN_DEPRECATION_NOTICE : ''),
        }
    );
    // Per-session closure: fires the deprecation notice once, on the first tool call.
    // Tool results are the only mechanism Claude reliably surfaces to the user;
    // the instructions field is only background context and won't trigger a proactive warning.
    let _noticeEmitted = false;
    const getDeprecationNotice = (): string | null => {
      if (!isStaticToken || _noticeEmitted) return null;
      _noticeEmitted = true;
      return STATIC_TOKEN_DEPRECATION_NOTICE;
    };

    // Tool-call audit trail: who called which tool, when, from where. Fired by
    // the registry immediately before each tool handler runs (the nest-mcp
    // onInvoke seam) — transport-level body sniffing can't see tool names
    // because /mcp bodies are raw. The IP is the session's most recent
    // authorized request (tool calls arrive on resumed requests); an audit
    // failure must never fail the tool call, so the closure catches its own.
    const createIp = getClientIp(req);
    const transportHolder: { current: StreamableHTTPServerTransport | null } = { current: null };
    const onInvoke = (info: { kind: string; name: string }): void => {
      if (info.kind !== 'tool') return;
      try {
        const sid = transportHolder.current?.sessionId;
        const ip = (sid ? sessions.get(sid)?.lastClientIp : null) ?? createIp;
        this.audit.writeAudit({
          userId: user.id,
          action: 'mcp.tool_call',
          resource: info.name,
          details: { clientId: clientId ?? 'native' },
          ip,
        });
      } catch (err) {
        console.error('[MCP] tool-call audit failed:', (err as Error | undefined)?.message ?? err);
      }
    };

    registerTools(this.registry, server, user.id, scopes, isStaticToken, getDeprecationNotice, onInvoke);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        sessions.set(sid, { server, transport, userId: user.id, scopes, clientId, isStaticToken, lastActivity: Date.now(), lastClientIp: createIp });
        // The cap was checked before the handler ran, and registration only
        // happens here — so concurrent initializes all passed the same
        // pre-registration count. Re-check now that the entry exists, or the
        // overshoot stays in the map (each entry holding a full McpServer)
        // until the TTL sweep. The new session has the freshest lastActivity,
        // so it is never the one evicted; the sid guard covers a cap of 1.
        while (countSessionsForUser(user.id) > MAX_SESSIONS_PER_USER) {
          const dropped = evictOldestSessionForUser(user.id);
          if (!dropped || dropped === sid) break;
          console.log(`[MCP] Session limit (${MAX_SESSIONS_PER_USER}) exceeded for user ${user.id} — evicted idle session ${dropped}`);
        }
        const authMethod = isStaticToken ? 'static-token' : scopes ? `oauth(${scopes.join(',')})` : 'jwt';
        console.log(`[MCP] Session ${sid} created for user ${user.id} [${authMethod}]. Active sessions: ${sessions.size}`);
      },
      onsessionclosed: (sid) => {
        sessions.delete(sid);
      },
    });
    // Belt-and-braces: whenever the SDK closes the transport for any reason, drop the map entry.
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
    transportHolder.current = transport;

    armSseKeepalive(res);
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[MCP] transport.handleRequest error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal MCP error' });
      }
    } finally {
      // Only an `initialize` request assigns a sessionId (via onsessioninitialized). Any other
      // session-less POST is rejected by the SDK with "Server not initialized" — and this server,
      // with its ~200 registered tools, would otherwise be orphaned: never in `sessions`, never
      // swept, never closed. Reap it here.
      if (!transport.sessionId) {
        try { server.close(); } catch { /* ignore */ }
        try { transport.close(); } catch { /* ignore */ }
      }
    }
  }
}
