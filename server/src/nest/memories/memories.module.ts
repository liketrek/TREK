import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MemoriesService } from './memories.service';
import { MemoriesAccessService } from './memories-access.service';
import { ImmichService } from './immich.service';
import { UserConnectionRepositoriesModule } from '../database/user-connection-repositories.module';
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
import { TripPhotos } from '../../db/entities/TripPhotos.entity';
import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../db/entities/TripAlbumLinks.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { TrekPhotoCacheMeta } from '../../db/entities/TrekPhotoCacheMeta.entity';
import { PhotoProviders } from '../../db/entities/PhotoProviders.entity';
import { Users } from '../../db/entities/Users.entity';
import { Journeys } from '../../db/entities/Journeys.entity';
import { JourneyContributors } from '../../db/entities/JourneyContributors.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';

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
 *
 * `MikroOrmModule.forFeature` registers `TripPhotosRepository`/
 * `TrekPhotosRepository`/`TripAlbumLinksRepository`/`TripsRepository`
 * (owned elsewhere, reached the same way every cross-domain module in this
 * program reaches another domain's entity) for `MemoriesAccessService`'s
 * `@InjectRepository` constructor params, and `TrekPhotoCacheMetaRepository`
 * for `TrekPhotoCacheService`'s (Plan 3e Task 6). `PhotoProviders` (owned by
 * this module) and `Users` (owned elsewhere, reached the same way `Trips`
 * is above) are added for `UnifiedMemoriesService`/`ImmichService`/
 * `SynologyService`/`MemoriesMcp`'s `@InjectRepository` constructor params
 * (Plan 3e Task 7). `Journeys`/`JourneyContributors`/`JourneyPhotos` are
 * Plan 3g Task 4's own addition: `MemoriesAccessService`'s MA1/MA2/MA6
 * (`canAccessUserPhoto`/`canAccessTrekPhoto`'s journey half) now inject
 * `JourneysRepository`/`JourneyContributorsRepository`/
 * `JourneyPhotosRepository` directly instead of raw `DatabaseService` reads.
 */
@Module({
  imports: [
    NotificationsModule, AddonsModule, AuditModule, TrekPhotosModule, RealtimeModule, SchedulingModule, StorageModule,
    UserConnectionRepositoriesModule,
    MikroOrmModule.forFeature([TripPhotos, TrekPhotos, TripAlbumLinks, Trips, TrekPhotoCacheMeta, PhotoProviders, Users, Journeys, JourneyContributors, JourneyPhotos]),
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
