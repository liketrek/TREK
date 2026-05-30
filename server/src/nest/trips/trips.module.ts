import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

/** Trips aggregate root (C1 — Phase 3). Uses exact strangler prefixes so it does
 *  not capture the nested sub-domain mounts (collab, files, ...). */
@Module({
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
