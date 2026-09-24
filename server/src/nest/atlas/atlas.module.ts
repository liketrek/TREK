import { Module } from '@nestjs/common';
import { AtlasController } from './atlas.controller';
import { TravelStatsController } from './travel-stats.controller';
import { AtlasService } from './atlas.service';
import { AtlasRpc } from './atlas.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { AtlasMcp } from './atlas.mcp';
import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { PublicStatsController } from './public-stats.controller';
import { ApiTokenGuard } from '../public-api/api-token.guard';
import { TokensModule } from '../tokens/tokens.module';
import { RateLimitModule } from '../common/rate-limit.module';

/**
 * Atlas addon domain (L7 leaf module). Registered in AppModule. Exports
 * AtlasService for the plugin RPC surface (AtlasRpc injects it).
 * AtlasMcp is a provider (not a controller) — the nest-mcp registry discovers
 * it after app.init().
 *
 * TravelStatsController serves GET /api/auth/travel-stats. The path stays where
 * the client expects it; the code sits here because getTravelStats reads Atlas
 * data. See the comment in that file.
 *
 * PublicStatsController serves GET /api/v1/stats on the same reasoning, one prefix
 * over: the public API's own module is deliberately a leaf and importing
 * AtlasModule there would drag AuthModule and the storage registry into it, so the
 * route comes to the data instead. ApiTokenGuard is listed as a provider rather
 * than pulled in with PublicApiModule: @UseGuards instantiates a guard in the
 * declaring controller's module, so exporting it from over there would still leave
 * its TokenService unresolvable here. TokensModule is a leaf, so the edge is free.
 */
@Module({
  imports: [AuthModule, PluginGuardsModule, AddonsModule, TokensModule, RateLimitModule],
  controllers: [AtlasController, TravelStatsController, PublicStatsController],
  providers: [AtlasService, AtlasMcp, AtlasRpc, ApiTokenGuard],
  exports: [AtlasService],
})
export class AtlasModule {}
