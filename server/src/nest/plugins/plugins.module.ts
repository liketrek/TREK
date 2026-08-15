import { Module } from '@nestjs/common';
import { PluginsController } from './plugins.controller';
import { PluginsFeedController } from './plugins-feed.controller';
import { PluginsProxyController } from './plugins-proxy.controller';
import { PluginFrameController } from './plugin-frame.controller';
import { PluginActivityController } from './plugin-activity.controller';
import { PluginUserSettingsController } from './plugin-user-settings.controller';
import { PluginsRuntimeModule } from './plugins-runtime.module';
import { PluginOAuthModule } from './oauth/plugin-oauth.module';
import { PluginContributionsModule } from './contributions/plugin-contributions.module';
import { AppConfigModule } from '../app-config/app-config.module';

/**
 * Plugin system (#plugins), composition root.
 *
 * It used to be one module with 21 controllers, 24 domain imports and 10 providers,
 * which made it the hub almost the whole Nest graph ran through — AdminModule
 * imported it for one method and inherited all of that. It is now three pieces plus
 * this one:
 *
 * - `PluginsRuntimeModule` — supervisor, capability router, hook contracts. The half
 *   with the domain imports, and the only half AdminModule needs.
 * - `PluginContributionsModule` — the 14 read-only hook controllers.
 * - `PluginOAuthModule` — the outbound-OAuth leaf.
 *
 * What is left here is the CRUD and delivery surface: install/activate/configure, the
 * feed the client reads, the proxy to a child's HTTP routes, and the sandboxed frame
 * that serves page and widget assets.
 */
@Module({
  imports: [AppConfigModule, PluginsRuntimeModule, PluginOAuthModule, PluginContributionsModule],
  controllers: [
    PluginsController,
    PluginsFeedController,
    PluginsProxyController,
    PluginFrameController,
    PluginUserSettingsController,
    PluginActivityController,
  ],
  // Re-exported so AppModule keeps working unchanged. A consumer that only needs the
  // runtime imports PluginsRuntimeModule directly instead — that is the point of the
  // split.
  exports: [PluginsRuntimeModule],
})
export class PluginsModule {}
