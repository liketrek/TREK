import { AppConfigModule } from '../app-config/app-config.module';
import { AmapPhotoService } from './amap-photo.service';
import { Module } from '@nestjs/common';

/** Amap POI cover search. No controller of its own — TripsService reaches it. */
@Module({
  imports: [AppConfigModule],
  providers: [AmapPhotoService],
  exports: [AmapPhotoService],
})
export class AmapPhotoModule {}
