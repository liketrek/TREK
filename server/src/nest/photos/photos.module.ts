import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { TrekPhotosModule } from './trek-photos.module';
import { MemoriesModule } from '../memories/memories.module';

/**
 * /api/photos — the trek_photo read surface. Access control and the byte
 * fetching both come from the memories domain, which owns provider dispatch;
 * the row store comes from TrekPhotosModule, which memories imports too. That
 * shared leaf is what keeps this a straight line instead of a forwardRef.
 */
@Module({
  imports: [TrekPhotosModule, MemoriesModule],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [TrekPhotosModule],
})
export class PhotosModule {}
