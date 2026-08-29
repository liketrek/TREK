import { AppConfigModule } from '../app-config/app-config.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { PlacePhotoCacheJob } from './place-photo-cache.job';
import { PlacePhotoCacheService } from './place-photo-cache.service';
import { Module } from '@nestjs/common';

/** The marker-photo cache. No controller of its own — maps serves the bytes,
 *  places and share read through it, and PlacePhotoCacheJob sweeps it nightly.
 *
 *  Deliberately NOT @Global (permissions precedent), and AppConfigModule is
 *  imported explicitly because @Global only reaches modules that are in the
 *  graph — which a single-domain e2e TestingModule is not. */
@Module({
  imports: [AppConfigModule, SchedulingModule, StorageModule],
  providers: [PlacePhotoCacheService, PlacePhotoCacheJob],
  exports: [PlacePhotoCacheService],
})
export class PlacePhotosModule {}
