import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
