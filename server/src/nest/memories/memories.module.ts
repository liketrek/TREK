import { Module } from '@nestjs/common';
import { MemoriesService } from './memories.service';
import { MemoriesAccessService } from './memories-access.service';
import { ImmichService } from './immich.service';
import { SynologyService } from './synology.service';
import { UnifiedMemoriesService } from './unified-memories.service';
import { PhotoResolverService } from './photo-resolver.service';
import { ThumbnailService } from './thumbnail.service';
import { TrekPhotoCacheService } from './trek-photo-cache.service';
import { UnifiedMemoriesController } from './unified.controller';
import { ImmichMemoriesController } from './immich.controller';
import { SynologyMemoriesController } from './synology.controller';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { TrekPhotosModule } from '../photos/trek-photos.module';
import { RealtimeModule } from '../realtime/realtime.module';

/**
 * Memories (photo-providers) domain — mounted at /api/integrations/memories.
 *
 * No module-level addon gate: enablement is per-provider-row inside the
 * services, exactly as the legacy mount had it. TrekPhotosModule supplies the
 * trek_photos repository — storage lives there, provider dispatch here.
 *
 * RealtimeModule is imported explicitly even though it is @Global: an e2e
 * TestingModule built around one domain does not get a global AppModule never
 * loaded, and MemoriesService broadcasts.
 *
 * PhotoResolverService and MemoriesAccessService are exported because the
 * /api/photos surface and the journey domain resolve provider assets through
 * them.
 */
@Module({
  imports: [AddonsModule, AuditModule, TrekPhotosModule, RealtimeModule],
  controllers: [UnifiedMemoriesController, ImmichMemoriesController, SynologyMemoriesController],
  providers: [
    MemoriesService,
    MemoriesAccessService,
    ImmichService,
    SynologyService,
    UnifiedMemoriesService,
    PhotoResolverService,
    ThumbnailService,
    TrekPhotoCacheService,
  ],
  exports: [MemoriesAccessService, PhotoResolverService, ImmichService, SynologyService],
})
export class MemoriesModule {}
