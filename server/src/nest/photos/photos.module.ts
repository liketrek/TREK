import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { TrekPhotosRepository } from './trek-photos.repository';

/**
 * The trek_photos store plus the /api/photos read surface. The repository is
 * exported because the trip-photo and journey domains register rows in it
 * without caring which provider the bytes come from — that dispatch stays in
 * memories/.
 */
@Module({
  controllers: [PhotosController],
  providers: [PhotosService, TrekPhotosRepository],
  exports: [TrekPhotosRepository],
})
export class PhotosModule {}
