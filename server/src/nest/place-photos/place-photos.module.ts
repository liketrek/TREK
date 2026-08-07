import { Module } from '@nestjs/common';
import { PlacePhotoCacheService } from './place-photo-cache.service';
import { AppConfigModule } from '../app-config/app-config.module';

/** The marker-photo cache. No controller of its own — maps serves the bytes,
 *  places and share read through it, and the scheduler sweeps it nightly.
 *
 *  Deliberately NOT @Global (permissions precedent), and AppConfigModule is
 *  imported explicitly because @Global only reaches modules that are in the
 *  graph — which a single-domain e2e TestingModule is not. */
@Module({
  imports: [AppConfigModule],
  providers: [PlacePhotoCacheService],
  exports: [PlacePhotoCacheService],
})
export class PlacePhotosModule {}
