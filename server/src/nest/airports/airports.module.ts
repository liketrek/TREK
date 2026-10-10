import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { AirportsController } from './airports.controller';
import { AirportsMcp } from './airports.mcp';
import { AirportsService } from './airports.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Airports domain (L2 leaf module). Registered in AppModule.
 *  MikroOrmModule.forFeature([Reservations, ReservationEndpoints]) (Plan 3h
 *  Task 4, AIR1-3): the flight-endpoint backfill's raw SQL is repository-backed
 *  now — registered explicitly here, not left to a transitive export, since
 *  the airports e2e TestingModule builds this module standalone. SchedulingModule
 *  (task-6-rereview.md M1) is imported for the same reason — it is deliberately
 *  NOT @Global — so the boot backfill can route through
 *  CronRegistrarService.runOnBoot instead of running outside a request context. */
@Module({
  imports: [MikroOrmModule.forFeature([Reservations, ReservationEndpoints]), SchedulingModule],
  controllers: [AirportsController],
  providers: [AirportsService, AirportsMcp],
})
export class AirportsModule {}
