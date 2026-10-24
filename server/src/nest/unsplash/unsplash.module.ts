import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Users } from '../../db/entities/Users.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { StorageModule } from '../storage/storage.module';
import { UnsplashService } from './unsplash.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Unsplash cover search and download. No controller of its own — trips and
 *  places both reach it. Deliberately NOT @Global, matching PermissionsModule:
 *  e2e TestingModules resolve it through each consumer's explicit import.
 *  AppConfigModule is imported explicitly because @Global only applies to
 *  modules that are in the graph, which a single-domain TestingModule is not.
 *  MikroOrmModule.forFeature registers AppSettingsRepository/UsersRepository
 *  for UnsplashService's @InjectRepository constructor params (Plan 3a Task
 *  5): getUnsplashKey passes them straight into instance-api-keys.ts's
 *  resolveApiKey, which no longer reads a raw connection at all. */
@Module({
  imports: [AppConfigModule, StorageModule, MikroOrmModule.forFeature([AppSettings, Users])],
  providers: [UnsplashService],
  exports: [UnsplashService],
})
export class UnsplashModule {}
