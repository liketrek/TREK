import { Module } from '@nestjs/common';
import { AtlasController } from './atlas.controller';
import { AtlasService } from './atlas.service';
import { AtlasRpc } from './atlas.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { AtlasMcp } from './atlas.mcp';

/**
 * Atlas addon domain (L7 leaf module). Registered in AppModule. Exports
 * AtlasService for the plugin RPC surface (AtlasRpc injects it).
 * AtlasMcp is a provider (not a controller) — the nest-mcp registry discovers
 * it after app.init().
 */
@Module({
  imports: [PluginGuardsModule],
  controllers: [AtlasController],
  providers: [AtlasService, AtlasMcp, AtlasRpc],
  exports: [AtlasService],
})
export class AtlasModule {}
