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
const SAFE_RESPONSE_HEADERS = new Set(['content-type', 'cache-control', 'content-disposition', 'location']);

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
      const reply = (await this.runtime.invoke(pluginId, 'invoke.route', {
        routeId: route.i,
        req: {
          method: req.method,
          path: sub,
          query: req.query,
          body: req.body ?? null,
          user: user ? { id: user.id, username: user.username, isAdmin: !!user.is_admin } : null,
        },
      })) as { status?: number; headers?: Record<string, string>; body?: unknown };

      res.status(reply?.status ?? 200);
      for (const [k, v] of Object.entries(reply?.headers ?? {})) {
        if (SAFE_RESPONSE_HEADERS.has(k.toLowerCase())) res.setHeader(k, v);
      }
      res.send(reply?.body ?? '');
    } catch (e) {
      res.status(502).json({ error: 'Plugin error', detail: e instanceof Error ? e.message : 'unknown' });
    }
  }
}
