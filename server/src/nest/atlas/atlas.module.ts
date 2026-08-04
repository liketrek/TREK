import { Module } from '@nestjs/common';
import { AtlasController } from './atlas.controller';
import { AtlasService } from './atlas.service';
import { AtlasMcp } from './atlas.mcp';

/**
 * Atlas addon domain (L7 leaf module). Registered in AppModule. Exports
 * AtlasService for the plugin RPC host (PluginHostDepsFactory injects it).
 * AtlasMcp is a provider (not a controller) — the nest-mcp registry discovers
 * it after app.init().
 */
@Module({
  controllers: [AtlasController],
  providers: [AtlasService, AtlasMcp],
  exports: [AtlasService],
})
export class AtlasModule {}
