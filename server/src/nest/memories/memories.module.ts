import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrekPhotosModule } from '../photos/trek-photos.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { ImmichMemoriesController } from './immich.controller';
import { ImmichService } from './immich.service';
import { JourneyThumbsJob } from './journey-thumbs.job';
import { MemoriesAccessService } from './memories-access.service';
import { MemoriesService } from './memories.service';
import { PhotoCaptureBackfillService } from './photo-capture-backfill.service';
import { PHOTO_PROVIDERS } from './photo-provider';
import { PhotoProviderRegistry } from './photo-provider.registry';
import { PhotoResolverService } from './photo-resolver.service';
import { ImmichPhotoProvider } from './providers/immich.provider';
import { SynologyPhotoProvider } from './providers/synology.provider';
import { SynologyMemoriesController } from './synology.controller';
import { SynologyService } from './synology.service';
import { ThumbnailService } from './thumbnail.service';
import { TrekPhotoCacheJob } from './trek-photo-cache.job';
import { TrekPhotoCacheService } from './trek-photo-cache.service';
import { UnifiedMemoriesService } from './unified-memories.service';
import { UnifiedMemoriesController } from './unified.controller';
import { Module } from '@nestjs/common';

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
  imports: [
    NotificationsModule,
    AddonsModule,
    AuditModule,
    TrekPhotosModule,
    RealtimeModule,
    SchedulingModule,
    StorageModule,
  ],
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
    {
      provide: PHOTO_PROVIDERS,
      useFactory: (immich: ImmichPhotoProvider, synology: SynologyPhotoProvider) => [immich, synology],
      inject: [ImmichPhotoProvider, SynologyPhotoProvider],
    },
  ],
  exports: [
    MemoriesAccessService,
    PhotoResolverService,
    PhotoCaptureBackfillService,
    ImmichService,
    SynologyService,
    PhotoProviderRegistry,
  ],
})
export class MemoriesModule {}
