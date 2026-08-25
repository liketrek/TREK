import { Injectable } from '@nestjs/common';
import type express from 'express';
import { mcpAuthMetadataRouter } from '@modelcontextprotocol/sdk/server/auth/router';
import type { OAuthMetadata } from '@modelcontextprotocol/sdk/shared/auth';
import { ALL_SCOPES } from '../../mcp/scopes';
import { getMcpSafeUrl } from '../../app-config';

/**
 * OAuth/MCP discovery metadata, built lazily on first request so the issuer URL
 * is resolved from the live env, not frozen at buildApp() time. One instance per
 * app (DI singleton) replaces the per-applyPlatformTransport-call closures the
 * pre-init Express mount used — same laziness, same per-app cache scope.
 *
 * mcpAuthMetadataRouter serves:
 *   /.well-known/oauth-authorization-server   — RFC 8414 AS metadata
 *   /.well-known/oauth-protected-resource/mcp — RFC 9728 path-based PRM (fixes issue #959 bug 1)
 */
@Injectable()
export class DiscoveryMetadataService {
  private oauthMetadata: OAuthMetadata | null = null;
  private sdkMetaRouter: express.Router | null = null;

  getOAuthMetadata(): OAuthMetadata {
    if (this.oauthMetadata) return this.oauthMetadata;
    const base = getMcpSafeUrl().replace(/(?<!\/)\/+$/, '');
    this.oauthMetadata = {
      issuer:                                base,
      authorization_endpoint:                `${base}/oauth/authorize`,
      token_endpoint:                        `${base}/oauth/token`,
      revocation_endpoint:                   `${base}/oauth/revoke`,
      registration_endpoint:                 `${base}/oauth/register`,
      response_types_supported:              ['code'],
      grant_types_supported:                 ['authorization_code', 'refresh_token', 'client_credentials'],
      code_challenge_methods_supported:      ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
      scopes_supported:                      ALL_SCOPES,
    };
    return this.oauthMetadata;
  }

  getMetaRouter(): express.Router {
    if (this.sdkMetaRouter) return this.sdkMetaRouter;
    const metadata = this.getOAuthMetadata();
    this.sdkMetaRouter = mcpAuthMetadataRouter({
      oauthMetadata: metadata,
      resourceServerUrl: new URL(`${metadata.issuer}/mcp`),
      scopesSupported: ALL_SCOPES as string[],
      resourceName: 'TREK MCP',
    });
    return this.sdkMetaRouter;
  }
}
