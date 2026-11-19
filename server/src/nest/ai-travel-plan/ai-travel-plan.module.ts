import { AiTravelPlanRevisions } from '../../db/entities/AiTravelPlanRevisions.entity';
import { AiTravelPlans } from '../../db/entities/AiTravelPlans.entity';
import { AiConnectionsModule } from '../ai-connections/ai-connections.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { AuditModule } from '../audit/audit.module';
import { DaysModule } from '../days/days.module';
import { MapsModule } from '../maps/maps.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RoutingRelayModule } from '../routing-relay/routing-relay.module';
import { SettingsModule } from '../settings/settings.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { TripsModule } from '../trips/trips.module';
import { AiTravelPlanController } from './ai-travel-plan.controller';
import { AiTravelPlanService } from './ai-travel-plan.service';
import { PlannerApplyService } from './planner-apply.service';
import { PlannerRequestParser } from './planner-prompt';
import { PlannerProvider } from './planner-provider';
import { PlannerQuotaService } from './planner-quota.service';
import { PlannerService } from './planner.service';
import { RealTravelPlanEngine } from './real-travel-plan.engine';
import { TRAVEL_PLAN_ENGINE } from './travel-plan-engine';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * AI travel plans domain (China MVP, phase 2).
 *
 * The planner sits behind `TRAVEL_PLAN_ENGINE`. Phase 2 binds the in-process
 * engine: the model parses the sentence, `MapsService` and
 * `RoutingRelayService` provide the only facts, and a deterministic scheduler
 * and validator build the draft. Replacing the binding with an HTTP client for
 * the Java/Spring AI service changes nothing else — the service, the routes
 * and the shared contract stay.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([AiTravelPlans, AiTravelPlanRevisions]),
    PermissionsModule,
    AuditModule,
    TripMembershipModule,
    MapsModule,
    RoutingRelayModule,
    AiConnectionsModule,
    TripsModule,
    DaysModule,
    PlacesModule,
    AssignmentsDomainModule,
    RealtimeModule,
    SettingsModule,
  ],
  controllers: [AiTravelPlanController],
  providers: [
    AiTravelPlanService,
    PlannerQuotaService,
    PlannerApplyService,
    PlannerRequestParser,
    PlannerProvider,
    PlannerService,
    RealTravelPlanEngine,
    { provide: TRAVEL_PLAN_ENGINE, useExisting: RealTravelPlanEngine },
  ],
  exports: [AiTravelPlanService],
})
export class AiTravelPlanModule {}
