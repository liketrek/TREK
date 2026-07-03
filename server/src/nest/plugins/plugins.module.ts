import { Module } from '@nestjs/common';
import { PluginsController } from './plugins.controller';
import { PluginsProxyController } from './plugins-proxy.controller';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService } from './plugin-runtime.service';

/**
 * Plugin system (#plugins). M0 read side + M2 isolated runtime: the runtime
 * service owns the process supervisor and boots active plugins on startup; the
 * proxy controller forwards /api/plugins/:id/* to the isolated child.
 */
@Module({
  controllers: [PluginsController, PluginsProxyController],
  providers: [PluginsService, PluginRuntimeService],
})
export class PluginsModule {}
