import { Module } from '@nestjs/common';
import { MemoriesService } from './memories.service';
import { UnifiedMemoriesController } from './unified.controller';
import { ImmichMemoriesController } from './immich.controller';
import { SynologyMemoriesController } from './synology.controller';

/**
 * Memories (photo-providers) domain — mounted at /api/integrations/memories.
 *
 * Ports the legacy Express router (routes/memories/unified.ts, which composes
 * immich.ts + synology.ts) to Nest, reusing services/memories/* unchanged. No
 * module-level addon gate — enablement is per-provider-row inside the services,
 * exactly as the legacy mount had it.
 */
@Module({
  controllers: [UnifiedMemoriesController, ImmichMemoriesController, SynologyMemoriesController],
  providers: [MemoriesService],
})
export class MemoriesModule {}
