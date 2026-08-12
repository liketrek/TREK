import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { pluginCodeDir } from './paths';

/**
 * Serves a page/widget plugin's static client from /plugin-frame/:id/* (#plugins,
 * M3). The document is embedded in a sandbox WITHOUT allow-same-origin, so it
 * runs at an OPAQUE origin: it cannot read the trek_session cookie, cannot reach
 * the parent DOM, and its only channel to TREK is the postMessage bridge.
 *
 * Each response gets a locked-down, per-plugin CSP (default-src none; own scripts
 * only; connect-src limited to declared outbound hosts) and a strict path guard
 * so a plugin can only serve files under its own client/ directory.
 */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

@Controller('plugin-frame/:pluginId')
export class PluginFrameController {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Get('*path')
  serve(@Param('pluginId') pluginId: string, @Req() req: Request, @Res() res: Response): void {
    if (!pluginsEnabled() || !this.runtime.isActive(pluginId)) {
      res.status(404).send('Plugin not available');
      return;
    }

    const rest = (req.params as Record<string, unknown>).path ?? (req.params as Record<string, unknown>)[0] ?? '';
    const rel = (Array.isArray(rest) ? rest.join('/') : String(rest)).replace(/^\/+/, '') || 'index.html';

    const clientDir = path.join(pluginCodeDir(pluginId), 'client');
    const resolved = path.resolve(clientDir, rel);
    // Containment: never escape the plugin's own client/ dir.
    if (!resolved.startsWith(path.resolve(clientDir) + path.sep) && resolved !== path.resolve(clientDir)) {
      res.status(403).send('Forbidden');
      return;
    }
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      res.status(404).send('Not found');
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // The frame document runs at an OPAQUE origin (sandbox without
    // allow-same-origin), so its own <script src>/<link> subresource loads are
    // cross-origin — helmet's default CORP: same-origin makes the browser drop
    // them (ERR_BLOCKED_BY_RESPONSE) and a multi-file client dies on boot.
    // The sandbox + per-plugin CSP are the isolation boundary here, not CORP:
    // these files are the plugin's own public client code.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Security-Policy', this.frameCsp(pluginId, req.get('host')));
    // Explicit { root } + basename, not the absolute path: under the Nest
    // ExpressAdapter, res.sendFile(absolutePath) resolves against the rewritten
    // req.url and 404s spuriously (same trap as files-download.controller.ts).
    res.sendFile(path.basename(resolved), { root: path.dirname(resolved) });
  }

  /** Per-plugin, locked-down CSP for the sandboxed frame document. */
  private frameCsp(pluginId: string, host: string | undefined): string {
    // The frame must be able to reach exactly what the CHILD may reach. The child's egress
    // guard is the union of the manifest's http:outbound:<host> grants AND the hosts an admin
    // added post-install for an operatorEgress plugin (plugin-runtime.service: activate()).
    // Building connect-src from the grants alone left an operatorEgress plugin WITH A UI able
    // to call the operator's host from its server but CSP-blocked in its own iframe. The admin
    // consented to these hosts at install and the child already reaches them, so matching the
    // frame to the child widens no trust boundary that isn't already crossed.
    //
    // Defense in depth: both sources are validated upstream (the manifest validator; the
    // admin writer's EGRESS_HOST_RE), but never interpolate anything that isn't a clean
    // host/wildcard into connect-src — a stray space or `*` would inject an extra CSP source.
    const outbound = [
      ...new Set([...this.runtime.outboundHostsOf(pluginId), ...this.runtime.operatorEgressHosts(pluginId)]),
    ].filter((h) => /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i.test(h));
    // The frame runs at an OPAQUE origin (sandbox without allow-same-origin), so
    // 'self' matches nothing and the plugin's own <script src>/<link> files would
    // be blocked — a multi-file client build (Vite/React output) only worked
    // inlined. A scheme-less host-source pinned to THIS plugin's frame path
    // re-allows exactly its own assets and still no other host. Both interpolated
    // parts are charset-checked so a stray token can't widen the policy (the
    // Host header is client-controlled; a forged one only lames the forger's own
    // response), and a missing/odd Host just falls back to inline-only.
    const ownAssets =
      host && /^[a-z0-9.-]+(:\d+)?$/i.test(host) && /^[a-z][a-z0-9-]{2,39}$/.test(pluginId)
        ? ` ${host}/plugin-frame/${pluginId}/`
        : '';
    const connect = ["'self'", ...outbound.map((h) => `https://${h}`)].join(' ');
    return [
      "default-src 'none'",
      // 'unsafe-inline' is safe here: the sandbox (not this script-src) is the
      // isolation boundary, and the plugin author controls the frame's code
      // either way. What script-src must keep doing is denying REMOTE hosts —
      // a script URL is an egress channel connect-src never sees.
      `script-src 'self' 'unsafe-inline'${ownAssets}`,
      `style-src 'self' 'unsafe-inline'${ownAssets}`,
      `img-src 'self' data: blob:${ownAssets}`,
      `font-src 'self' data:${ownAssets}`,
      `connect-src ${connect}${ownAssets}`,
      "frame-ancestors 'self'",
      "base-uri 'none'",
      "form-action 'self'",
      // No allow-popups: window.open() ignores connect-src, so it would be an
      // egress/phishing bypass (open any URL / a fake full-page login). A future
      // OAuth-popup addon can re-request it as an explicit capability.
      'sandbox allow-scripts allow-forms',
    ].join('; ');
  }
}
