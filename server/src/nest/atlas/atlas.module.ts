import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
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
import { BucketList } from '../../db/entities/BucketList.entity';
import { HiddenCountries } from '../../db/entities/HiddenCountries.entity';
import { HiddenRegions } from '../../db/entities/HiddenRegions.entity';
import { VisitedCountries } from '../../db/entities/VisitedCountries.entity';
import { VisitedRegions } from '../../db/entities/VisitedRegions.entity';
import { PlaceRegions } from '../../db/entities/PlaceRegions.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Places } from '../../db/entities/Places.entity';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { PlaceRegionsRepairJob } from './place-regions-repair.job';

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
 *
 * `MikroOrmModule.forFeature` registers every entity `AtlasService`'s
 * `@InjectRepository` constructor needs (Plan 3f Task 1) — the six
 * atlas-owned tables (`BucketList`/`HiddenCountries`/`HiddenRegions`/
 * `VisitedCountries`/`VisitedRegions`/`PlaceRegions`) plus the three it
 * reads additive methods on (`Trips`/`Places`/`ReservationEndpoints`).
 *
 * PlaceRegionsRepairJob puts right, once, the place_regions rows cached before #2527;
 * `AppSettings` is in the feature list for the marker row it reads and writes.
 */
@Module({
  imports: [
    AuthModule,
    PluginGuardsModule,
    AddonsModule,
    TokensModule,
    RateLimitModule,
    SchedulingModule,
    MikroOrmModule.forFeature([BucketList, HiddenCountries, HiddenRegions, VisitedCountries, VisitedRegions, PlaceRegions, Trips, Places, ReservationEndpoints, AppSettings]),
  ],
  controllers: [AtlasController, TravelStatsController, PublicStatsController],
  providers: [AtlasService, AtlasMcp, AtlasRpc, ApiTokenGuard, PlaceRegionsRepairJob],
  exports: [AtlasService],
})
export class AtlasModule {}
