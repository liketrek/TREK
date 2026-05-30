import { Module } from '@nestjs/common';
import { PackingController } from './packing.controller';
import { PackingService } from './packing.service';

/** Packing domain (S2 — Phase 2 trip sub-domain). Registered in AppModule. */
@Module({
  controllers: [PackingController],
  providers: [PackingService],
})
export class PackingModule {}
