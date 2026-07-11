import { All, Controller, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { extractToken, verifyJwtAndLoadUser } from '../../middleware/auth';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';

/**
 * Proxies a plugin's own HTTP routes at /api/plugins/:id/* (#plugins, M2).
 *
 * This is a SINGLE static Nest route — it never registers per-plugin routes at
 * runtime. It matches the request against the plugin's declared routes, enforces
 * per-route auth (routes with `auth:false` — OAuth callbacks/webhooks — skip the
 * session check), and forwards a minimal, whitelisted request view to the
 * isolated child over RPC. The plugin never sees raw headers or the session
 * cookie, so it cannot replay the user's credentials.
 */
// A plugin fully controls the reply's content-type + body, and this route is on
// TREK's REAL origin, so we must never let the browser RENDER it as a document
// (that would run plugin script at our origin, outside the iframe sandbox) nor
// follow a plugin-chosen redirect. `location` / `content-disposition` are NOT
// passthrough; every reply is forced to nosniff + attachment below. fetch-based
// consumers (the plugin's own client) are unaffected — fetch ignores both.
const SAFE_RESPONSE_HEADERS = new Set(['content-type', 'cache-control']);

// Inbound header allowlist for `auth:false` routes (webhooks). A plugin can verify a
// provider's signature, but ONLY over an explicit allowlist that NEVER carries an
// auth/session credential — mirroring the response-header allowlist above. Cookie,
// Authorization, X-Socket-Id and every forwarded-auth header are deliberately absent,
// so a forwarded header can never leak a TREK session or be replayed. Signature +
// event headers from the common providers (GitHub/Stripe/Svix/GitLab/generic) pass.
const SAFE_INBOUND_HEADERS = new Set([
  'content-type', 'user-agent', 'x-request-id', 'x-idempotency-key',
  'x-hub-signature', 'x-hub-signature-256', 'x-github-event', 'x-github-delivery',
  'stripe-signature',
  'svix-id', 'svix-timestamp', 'svix-signature',
  'x-gitlab-event', 'x-gitlab-token',
  'x-signature', 'x-signature-256', 'x-webhook-signature', 'x-event-type',
]);

function pickInboundHeaders(raw: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    if (!SAFE_INBOUND_HEADERS.has(k.toLowerCase())) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
  }
  return out;
}

// Origin used only to parse a plugin-supplied redirect target. Any host works as
// long as it can never match a real one, so a target that stays "same-origin"
// after WHATWG URL parsing is provably a relative in-app path.
const REDIRECT_BASE = 'https://trek.invalid';

/**
 * Return a plugin redirect `Location` ONLY if it is a same-origin (relative)
 * target, normalised to path+query+hash; otherwise `null`. Parsing (rather than
 * regex-matching the raw string) is what makes this safe against the open-redirect
 * bypasses browsers introduce for special schemes: `\` normalised to `/`, stripped
 * tab/newline, protocol-relative `//host`, and fully-qualified/other-scheme URLs
 * all resolve to a different origin and are rejected.
 */
function toRelativeLocation(loc: unknown): string | null {
  if (typeof loc !== 'string' || loc === '') return null;
  try {
    const u = new URL(loc, REDIRECT_BASE);
    if (u.origin !== REDIRECT_BASE) return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

@Controller('api/plugins/:pluginId')
export class PluginsProxyController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @All('*path')
  async proxy(@Param('pluginId') pluginId: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    if (!pluginsEnabled() || !this.runtime.isActive(pluginId)) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }

    const rest = (req.params as Record<string, unknown>).path ?? (req.params as Record<string, unknown>)[0] ?? '';
    const sub = '/' + (Array.isArray(rest) ? rest.join('/') : String(rest)).replace(/^\/+/, '');
    const route = this.runtime.routesOf(pluginId).find((r) => r.method === req.method && r.path === sub);
    if (!route) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // Per-route auth: default-on; `auth:false` routes are public (OAuth cb/webhook).
    let user: { id: number; username: string; is_admin?: boolean } | null = null;
    if (route.auth) {
      const token = extractToken(req);
      const loaded = token ? verifyJwtAndLoadUser(token) : null;
      if (!loaded) {
        res.status(401).json({ error: 'Access token required', code: 'AUTH_REQUIRED' });
        return;
      }
      user = loaded;
    }

    try {
      const reply = (await this.runtime.invoke(
        pluginId,
        'invoke.route',
        {
          routeId: route.i,
          req: {
            method: req.method,
            path: sub,
            query: req.query,
            body: req.body ?? null,
            // Webhook (auth:false) routes also receive the raw request bytes (base64,
            // so a non-UTF-8 signed body survives) — the plugin decodes and verifies a
            // provider's HMAC over the exact payload; the parsed JSON can't be
            // re-serialised identically.
            rawBodyBase64: route.auth === false ? ((req as { rawBody?: Buffer }).rawBody?.toString('base64') ?? null) : undefined,
            // Only auth:false routes (webhooks) get inbound headers, and only the
            // allowlisted, credential-free subset — an authenticated route never
            // needs them and must not see even the safe ones.
            headers: route.auth === false ? pickInboundHeaders(req.headers as Record<string, unknown>) : {},
            user: user ? { id: user.id, username: user.username, isAdmin: !!user.is_admin } : null,
          },
        },
        // Bind the authenticated session user as the acting user for any trip
        // reads this invocation makes — the plugin cannot override it.
        user?.id,
      )) as { status?: number; headers?: Record<string, string>; body?: unknown };

      const status = reply?.status ?? 200;
      const headers = reply?.headers ?? {};
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // A genuine redirect (301/302/303/307/308) may only target a RELATIVE in-app
      // path — never an external URL (open redirect / phishing). This still lets an
      // OAuth-callback route bounce the user back into the app. 300/304 aren't
      // redirects and fall through to the normal path.
      if ([301, 302, 303, 307, 308].includes(status)) {
        const loc = Object.entries(headers).find(([k]) => k.toLowerCase() === 'location')?.[1];
        // Resolve against a throwaway origin and require the result to stay on it:
        // only a same-origin (relative) target survives. A string check can't do
        // this safely — browsers normalise `\` to `/` and strip tab/newline for
        // http(s), so `/\evil.com`, `/<tab>/evil.com`, `//evil.com`, and any
        // absolute URL all resolve off-origin and must be rejected.
        const safeLoc = toRelativeLocation(loc);
        if (!safeLoc) {
          res.status(502).json({ error: 'Plugin error', detail: 'unsafe redirect target' });
          return;
        }
        res.status(status).setHeader('Location', safeLoc);
        res.end();
        return;
      }

      for (const [k, v] of Object.entries(headers)) {
        if (SAFE_RESPONSE_HEADERS.has(k.toLowerCase())) res.setHeader(k, v);
      }
      // Never let a non-redirect reply render as a document at TREK's origin
      // (that would run plugin script at our real origin, outside the sandbox).
      res.setHeader('Content-Disposition', 'attachment');
      res.status(status).send(reply?.body ?? '');
    } catch (e) {
      res.status(502).json({ error: 'Plugin error', detail: e instanceof Error ? e.message : 'unknown' });
    }
  }
}
