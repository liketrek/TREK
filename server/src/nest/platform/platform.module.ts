import { AddonsModule } from '../addons/addons.module';
import { ConsentCoopMiddleware } from './consent-coop.middleware';
import { DiscoveryMetadataService } from './discovery-metadata.service';
import { DiscoveryController } from './discovery.controller';
import { mcpMetadataMiddlewareProvider } from './mcp-metadata.middleware';
import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';

/**
 * The platform surface that lives behind the container: OAuth/OIDC discovery
 * (controller + SDK metadata middleware) and the /oauth/consent COOP override.
 * What remains pre-init in platform.routes.ts is path-prefixed static serving
 * (uploads, built client) plus — until the /mcp migration lands — the OAuth SDK
 * and /mcp transport mounts.
 *
 * This module is the repo's first MiddlewareConsumer. Express middleware that
 * needs DI has exactly two honest mounts:
 *   - consumer.apply(...).forRoutes('<concrete path>') — an Express prefix
 *     mount, identical semantics to the legacy app.use('/path', fn) calls
 *     (ConsentCoopMiddleware below);
 *   - a pathless app.use in bootstrap for middleware that must see the
 *     original req.url (MCP_METADATA_MIDDLEWARE — a wildcard forRoutes()
 *     would strip the matched prefix and break the SDK router's matching).
 */
@Module({
  imports: [AddonsModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryMetadataService, mcpMetadataMiddlewareProvider, ConsentCoopMiddleware],
})
export class PlatformModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Prefix mount: covers /oauth/consent and any sub-path, like the legacy
    // app.use('/oauth/consent', ...) it replaces.
    consumer.apply(ConsentCoopMiddleware).forRoutes('oauth/consent');
  }
}
