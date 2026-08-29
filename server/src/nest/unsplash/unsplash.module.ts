import { AppConfigModule } from '../app-config/app-config.module';
import { StorageModule } from '../storage/storage.module';
import { UnsplashService } from './unsplash.service';
import { Module } from '@nestjs/common';

/** Unsplash cover search and download. No controller of its own — trips and
 *  places both reach it. Deliberately NOT @Global, matching PermissionsModule:
 *  e2e TestingModules resolve it through each consumer's explicit import.
 *  AppConfigModule is imported explicitly because @Global only applies to
 *  modules that are in the graph, which a single-domain TestingModule is not. */
@Module({
  imports: [AppConfigModule, StorageModule],
  providers: [UnsplashService],
  exports: [UnsplashService],
})
export class UnsplashModule {}
