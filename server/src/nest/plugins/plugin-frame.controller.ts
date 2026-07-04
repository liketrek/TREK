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
    res.setHeader('Content-Security-Policy', this.frameCsp(pluginId));
    res.sendFile(resolved);
  }

  /** Per-plugin, locked-down CSP for the sandboxed frame document. */
  private frameCsp(pluginId: string): string {
    // Defense in depth: the manifest validator already constrains these hosts, but
    // never interpolate anything that isn't a clean host/wildcard into connect-src
    // (a stray space or `*` would inject an extra CSP source token).
    const outbound = this.runtime
      .outboundHostsOf(pluginId)
      .filter((h) => /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i.test(h));
    const connect = ["'self'", ...outbound.map((h) => `https://${h}`)].join(' ');
    return [
      "default-src 'none'",
      // The frame runs at an OPAQUE origin (sandbox without allow-same-origin),
      // so 'self' matches nothing — inline is the only way its own script can run.
      // Safe here: the sandbox (not this script-src) is the isolation boundary,
      // and the plugin author controls the frame's code either way.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src ${connect}`,
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
