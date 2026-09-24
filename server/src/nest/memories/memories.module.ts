import { Module } from '@nestjs/common';
import { MemoriesService } from './memories.service';
import { MemoriesAccessService } from './memories-access.service';
import { ImmichService } from './immich.service';
import { SynologyService } from './synology.service';
import { UnifiedMemoriesService } from './unified-memories.service';
import { PhotoResolverService } from './photo-resolver.service';
import { PhotoCaptureBackfillService } from './photo-capture-backfill.service';
import { ThumbnailService } from './thumbnail.service';
import { TrekPhotoCacheService } from './trek-photo-cache.service';
import { TrekPhotoCacheJob } from './trek-photo-cache.job';
import { JourneyThumbsJob } from './journey-thumbs.job';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { UnifiedMemoriesController } from './unified.controller';
import { ImmichMemoriesController } from './immich.controller';
import { SynologyMemoriesController } from './synology.controller';
import { MemoriesMcp } from './memories.mcp';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { TrekPhotosModule } from '../photos/trek-photos.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PHOTO_PROVIDERS } from './photo-provider';
import { PhotoProviderRegistry } from './photo-provider.registry';
import { ImmichPhotoProvider } from './providers/immich.provider';
import { SynologyPhotoProvider } from './providers/synology.provider';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

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
 *
 * PHOTO_PROVIDERS is the multi-provider array behind PhotoProviderRegistry
 * (#584): adding a photo backend means adding an adapter to this one list, not
 * finding every `switch (photo.provider)`. Registered here rather than in the
 * adapters themselves so the set is readable in one place.
 */
@Module({
  imports: [NotificationsModule, AddonsModule, AuditModule, TrekPhotosModule, RealtimeModule, SchedulingModule, StorageModule],
  controllers: [UnifiedMemoriesController, ImmichMemoriesController, SynologyMemoriesController],
  providers: [
    MemoriesService,
    MemoriesAccessService,
    ImmichService,
    SynologyService,
    UnifiedMemoriesService,
    PhotoResolverService,
    PhotoCaptureBackfillService,
    ThumbnailService,
    TrekPhotoCacheService,
    TrekPhotoCacheJob,
    JourneyThumbsJob,
    ImmichPhotoProvider,
    SynologyPhotoProvider,
    PhotoProviderRegistry,
    MemoriesMcp,
    {
      provide: PHOTO_PROVIDERS,
      useFactory: (immich: ImmichPhotoProvider, synology: SynologyPhotoProvider) => [immich, synology],
      inject: [ImmichPhotoProvider, SynologyPhotoProvider],
    },
  ],
  exports: [MemoriesAccessService, PhotoResolverService, PhotoCaptureBackfillService, ImmichService, SynologyService, PhotoProviderRegistry],
})
export class MemoriesModule {}
