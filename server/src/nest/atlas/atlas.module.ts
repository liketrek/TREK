import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { AtlasController } from './atlas.controller';
import { AtlasMcp } from './atlas.mcp';
import { AtlasRpc } from './atlas.rpc';
import { AtlasService } from './atlas.service';
import { TravelStatsController } from './travel-stats.controller';
import { Module } from '@nestjs/common';

/**
 * Atlas addon domain (L7 leaf module). Registered in AppModule. Exports
 * AtlasService for the plugin RPC surface (AtlasRpc injects it).
 * AtlasMcp is a provider (not a controller) — the nest-mcp registry discovers
 * it after app.init().
 *
 * TravelStatsController serves GET /api/auth/travel-stats. The path stays where
 * the client expects it; the code sits here because getTravelStats reads Atlas
 * data. See the comment in that file.
 */
@Module({
  imports: [AuthModule, PluginGuardsModule, AddonsModule],
  controllers: [AtlasController, TravelStatsController],
  providers: [AtlasService, AtlasMcp, AtlasRpc],
  exports: [AtlasService],
})
export class AtlasModule {}
