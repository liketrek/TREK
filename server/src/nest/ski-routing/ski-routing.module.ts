import { AddonsModule } from '../addons/addons.module';
import { TrekPlacesWinterService } from '../maps/trek-places-winter.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { SkiAreasJob } from './ski-areas.job';
import { SkiAreasService } from './ski-areas.service';
import { InlineSkiRouterRunner, SKI_ROUTER_RUNNER } from './ski-router-runner';
import { SkiRoutingController } from './ski-routing.controller';
import { SkiRoutingMcp } from './ski-routing.mcp';
import { SkiRoutingService } from './ski-routing.service';
import { WorkerSkiRouterRunner } from './worker-router-runner';
import { Module } from '@nestjs/common';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The router's own thread where the build ships its script; on the calling thread under the TypeScript sources (the tests). */
function routerRunner() {
  const entry = join(__dirname, 'ski-router.worker.js');
  return existsSync(entry) ? new WorkerSkiRouterRunner(entry) : new InlineSkiRouterRunner();
}

/**
 * The piste router (spec 7): ski and winter tours planned on the ski areas
 * the TREK Places host builds from OpenStreetMap. The areas are downloaded by
 * id and kept in the data folder (SkiAreasService), searched in a worker
 * thread, and checked against the host's new builds once a day (SkiAreasJob).
 */
@Module({
  imports: [AddonsModule, PermissionsModule, TripMembershipModule, SchedulingModule],
  controllers: [SkiRoutingController],
  providers: [
    SkiRoutingService,
    SkiRoutingMcp,
    SkiAreasService,
    SkiAreasJob,
    TrekPlacesWinterService,
    { provide: SKI_ROUTER_RUNNER, useFactory: routerRunner },
  ],
  // A ski tour the assistant planned is planned again when it is saved (ToursModule).
  exports: [SkiRoutingService],
})
export class SkiRoutingModule {}
