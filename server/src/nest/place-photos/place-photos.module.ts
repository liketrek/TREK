import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { GooglePlacePhotoMeta } from '../../db/entities/GooglePlacePhotoMeta.entity';
import { Places } from '../../db/entities/Places.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { PlacePhotoCacheJob } from './place-photo-cache.job';
import { PlacePhotoCacheService } from './place-photo-cache.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** The marker-photo cache. No controller of its own — maps serves the bytes,
 *  places and share read through it, and PlacePhotoCacheJob sweeps it nightly.
 *
 *  Deliberately NOT @Global (permissions precedent), and AppConfigModule is
 *  imported explicitly because @Global only reaches modules that are in the
 *  graph — which a single-domain e2e TestingModule is not.
 *
 *  MikroOrmModule.forFeature registers GooglePlacePhotoMetaRepository/
 *  PlacesRepository for PlacePhotoCacheService's @InjectRepository
 *  constructor (Plan 3c Task 1); Plan 3h Task 6 adds CollectionPlaces for
 *  SV-PP6's `isReferenced` second existence check. */
@Module({
  imports: [
    AppConfigModule,
    SchedulingModule,
    StorageModule,
    MikroOrmModule.forFeature([GooglePlacePhotoMeta, Places, CollectionPlaces]),
  ],
  providers: [PlacePhotoCacheService, PlacePhotoCacheJob],
  exports: [PlacePhotoCacheService],
})
export class PlacePhotosModule {}
