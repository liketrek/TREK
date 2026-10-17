import { PaddleWaterGraphs } from '../../db/entities/PaddleWaterGraphs.entity';
import { AddonsModule } from '../addons/addons.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { PaddleRoutingController } from './paddle-routing.controller';
import { PaddleRoutingMcp } from './paddle-routing.mcp';
import { PaddleRoutingService } from './paddle-routing.service';
import { InlineRouterRunner, PADDLE_ROUTER_RUNNER } from './router-runner';
import { WorkerRouterRunner } from './worker-router-runner';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The router's own thread where the build ships its script; on the calling thread under the TypeScript sources (the tests). */
function routerRunner() {
  const entry = join(__dirname, 'paddle-router.worker.js');
  return existsSync(entry) ? new WorkerRouterRunner(entry) : new InlineRouterRunner();
}

/**
 * PAD-11: routing for paddle tours on a water network TREK builds itself,
 * from the regions the paddle obstacles domain reads. The search runs in a
 * worker thread of the server; PaddleRoutingService is exported for that
 * domain to hand over each region's network as it is built.
 */
@Module({
  imports: [AddonsModule, PermissionsModule, TripMembershipModule, MikroOrmModule.forFeature([PaddleWaterGraphs])],
  controllers: [PaddleRoutingController],
  providers: [PaddleRoutingService, PaddleRoutingMcp, { provide: PADDLE_ROUTER_RUNNER, useFactory: routerRunner }],
  exports: [PaddleRoutingService],
})
export class PaddleRoutingModule {}
