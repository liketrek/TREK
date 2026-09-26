import { Module } from '@nestjs/common';
import { MemoriesModule } from '../memories/memories.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyPhotoCaptureService } from './journey-photo-capture.service';

/**
 * The capture-time backfill as the journey surfaces use it: fill taken_at, then,
 * for a batch of provider photos, tell the journey (#1587).
 *
 * Its own module because two containers need the same instance of the rule:
 * JourneyModule (REST routes and the MCP tool) and JournalRpcModule (the plugin
 * RPC). Neither JourneyDomainModule nor MemoriesModule can own it, the first
 * because it stays free of the photo providers on purpose and the second
 * because the memories domain knows nothing about journeys.
 */
@Module({
  imports: [JourneyDomainModule, MemoriesModule],
  providers: [JourneyPhotoCaptureService],
  exports: [JourneyPhotoCaptureService],
})
export class JourneyPhotoCaptureModule {}
