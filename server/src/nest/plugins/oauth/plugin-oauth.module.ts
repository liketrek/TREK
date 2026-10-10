import { PluginOauthState } from '../../../db/entities/PluginOauthState.entity';
import { PluginOauthTokens } from '../../../db/entities/PluginOauthTokens.entity';
import { PluginSettingsFields } from '../../../db/entities/PluginSettingsFields.entity';
import { Plugins } from '../../../db/entities/Plugins.entity';
import { PluginOAuthController } from './plugin-oauth.controller';
import { PluginOAuthService } from './plugin-oauth.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Host-brokered outbound OAuth for plugins: the host runs the authorization code
 * flow and holds the refresh token, and a plugin only ever gets a short-lived access
 * token for the acting user (`oauth.getToken`, HostSurfaceRpc).
 *
 * A leaf on purpose — it owns credentials and nothing else, so it must not depend on
 * the runtime or the registry. PluginsRuntimeModule imports it for the token read.
 *
 * Plan 3j Task 4 — `PluginOAuthService` now injects `PluginsRepository` (PO1, the
 * provider-config read), `PluginOauthTokensRepository`, `PluginOauthStateRepository`
 * and `PluginSettingsFieldsRepository` (the manifest-default fold `settingDefaults`
 * now needs, per Task 3's own conversion of `settings-defaults.ts`); this module is
 * where the class is actually constructed, so it (not PluginsRuntimeModule, which is
 * where the OTHER copies of these same entities are registered for
 * `PluginRuntimeService`/`PluginsService`/`PluginUserSettingsService`) owns this
 * `forFeature` list — `MikroOrmModule.forFeature` is idempotent per entity within one
 * DI graph, so the two modules registering the same entities is not a conflict.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Plugins, PluginOauthTokens, PluginOauthState, PluginSettingsFields])],
  controllers: [PluginOAuthController],
  providers: [PluginOAuthService],
  exports: [PluginOAuthService],
})
export class PluginOAuthModule {}
