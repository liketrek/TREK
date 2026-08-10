import { Module } from '@nestjs/common';
import { TrekPhotosRepository } from './trek-photos.repository';

/**
 * The trek_photos store on its own, so both halves can have it without
 * importing each other.
 *
 * Memories needs it to record a row when an album sync pulls provider assets
 * in; the /api/photos read surface needs the memories resolver to fetch the
 * bytes. That is a genuine mutual need, and a module this small breaks it
 * without a forwardRef: PhotosModule -> MemoriesModule -> TrekPhotosModule is
 * a straight line.
 */
@Module({
  providers: [TrekPhotosRepository],
  exports: [TrekPhotosRepository],
})
export class TrekPhotosModule {}
