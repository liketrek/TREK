import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

/** Places domain (S8 — Phase 2 trip sub-domain). Depends on L4 Categories + L5 Tags. */
@Module({
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
