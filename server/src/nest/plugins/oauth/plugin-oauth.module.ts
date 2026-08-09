import { Module } from '@nestjs/common';
import { PluginOAuthController } from './plugin-oauth.controller';
import { PluginOAuthService } from './plugin-oauth.service';

/**
 * Host-brokered outbound OAuth for plugins: the host runs the authorization code
 * flow and holds the refresh token, and a plugin only ever gets a short-lived access
 * token for the acting user (`oauth.getToken`, HostSurfaceRpc).
 *
 * A leaf on purpose — it owns credentials and nothing else, so it must not depend on
 * the runtime or the registry. PluginsRuntimeModule imports it for the token read.
 */
@Module({
  controllers: [PluginOAuthController],
  providers: [PluginOAuthService],
  exports: [PluginOAuthService],
})
export class PluginOAuthModule {}
