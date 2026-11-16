import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Users } from '../../db/entities/Users.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { AmapPhotoService } from './amap-photo.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Amap POI cover search. No controller of its own — TripsService reaches it. */
@Module({
  imports: [AppConfigModule, MikroOrmModule.forFeature([AppSettings, Users])],
  providers: [AmapPhotoService],
  exports: [AmapPhotoService],
})
export class AmapPhotoModule {}
