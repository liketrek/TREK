import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../db/entities/TripPhotos.entity';
import { TrekPhotoRegistrationService } from './trek-photo-registration.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The trek_photos store on its own, so both halves can have it without
 * importing each other.
 *
 * Memories needs it to record a row when an album sync pulls provider assets
 * in; the /api/photos read surface needs the memories resolver to fetch the
 * bytes. That is a genuine mutual need, and a module this small breaks it
 * without a forwardRef: PhotosModule -> MemoriesModule -> TrekPhotosModule is
 * a straight line.
 *
 * `MikroOrmModule.forFeature` registers `TrekPhotosRepository`/
 * `TripPhotosRepository` (the ORM ones) for `TrekPhotoRegistrationService`'s
 * `@InjectRepository` constructor params (Plan 3e Task 6). `JourneyPhotos` is
 * Plan 3g Task 4's own addition — PH10's `journey_photos` orphan-check half
 * (`deleteIfOrphan`) now injects `JourneyPhotosRepository` too.
 */
@Module({
  imports: [MikroOrmModule.forFeature([TrekPhotos, TripPhotos, JourneyPhotos])],
  providers: [TrekPhotoRegistrationService],
  exports: [TrekPhotoRegistrationService],
})
export class TrekPhotosModule {}
