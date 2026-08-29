import { ADDON_IDS } from '../../addons';
import { ALL_SCOPES } from '../../mcp/scopes';
import { AddonsService } from '../addons/addons.service';
import { Public } from '../auth/public.decorator';
import { DiscoveryMetadataService } from './discovery-metadata.service';
import { All, Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';

import type { Request, Response } from 'express';

/**
 * The hand-rolled halves of OAuth discovery (the SDK metadata router itself is
 * the pre-init McpMetadataMiddleware). Every handler writes through @Res() and
 * never throws for its own paths: a thrown NotFoundException would reach
 * SpaFallbackFilter, which serves index.html for any unmatched production GET —
 * the exact "does not implement OAuth" bug the JSON catchall exists to prevent.
 *
 * Route declaration order is load-bearing (Nest registers in method order):
 * the two concrete documents come before the catchalls.
 */
@Public('OAuth/OIDC discovery metadata read by MCP clients before any session exists')
@Controller('.well-known')
export class DiscoveryController {
  constructor(
    private readonly meta: DiscoveryMetadataService,
    private readonly addons: AddonsService,
  ) {}

  // ChatGPT (and other OIDC-first clients) bootstrap OAuth discovery via
  // /.well-known/openid-configuration. Serve the AS metadata plus the OIDC
  // userinfo_endpoint so ChatGPT can fetch the authenticated user's email
  // for authorization domain claiming.
  @Get('openid-configuration')
  openidConfiguration(@Res() res: Response): void {
    const meta = this.meta.getOAuthMetadata();
    res.json({
      ...meta,
      userinfo_endpoint: `${meta.issuer}/oauth/userinfo`,
    });
  }

  // RFC 9728 flat well-known URL — served alongside the path-based form the SDK
  // already provides. Clients like ChatGPT probe /.well-known/oauth-protected-resource
  // (no path suffix) on every fresh discovery. Without this, they get 404, fall back
  // to the issuer URL as the resource parameter, and the authorize handler rejects
  // them with invalid_target — showing the user the TREK home page instead of the
  // consent form.
  @Get('oauth-protected-resource')
  protectedResource(@Res() res: Response): void {
    if (!this.addons.isAddonEnabled(ADDON_IDS.MCP)) {
      res.status(404).end();
      return;
    }
    const meta = this.meta.getOAuthMetadata();
    res.json({
      resource: `${meta.issuer}/mcp`,
      authorization_servers: [meta.issuer],
      bearer_methods_supported: ['header'],
      scopes_supported: ALL_SCOPES,
      resource_name: 'TREK MCP',
    });
  }

  // '/.well-known' and '/.well-known/' both land here (Express strict:false).
  // The trailing-slash form was inside the legacy catchall's startsWith match →
  // JSON 404. The bare form was NOT — it fell through to the router 404
  // (SpaFallbackFilter: index.html on production GETs, JSON envelope otherwise),
  // so the throw below deliberately reproduces the framework message and route.
  @All('/')
  wellKnownRoot(@Req() req: Request, @Res() res: Response): void {
    if (req.path === '/.well-known/') {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    throw new NotFoundException(`Cannot ${req.method} ${req.originalUrl}`);
  }

  // Return 404 JSON for any /.well-known/* path the SDK metadata router doesn't
  // handle. Without this, the SPA catch-all serves HTML — clients probing
  // /.well-known/openid-configuration or the RFC 8414 path-suffixed AS metadata
  // URL receive a 200 HTML response they can't parse as JSON, causing
  // "does not implement OAuth".
  @All('*path')
  wellKnownFallback(@Res() res: Response): void {
    res.status(404).json({ error: 'not_found' });
  }
}
