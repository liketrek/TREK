import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Collections } from '../../db/entities/Collections.entity';
import { CollectionMembers } from '../../db/entities/CollectionMembers.entity';
import { CollectionLabels } from '../../db/entities/CollectionLabels.entity';
import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { CollectionPlaceRatings } from '../../db/entities/CollectionPlaceRatings.entity';
import { Categories } from '../../db/entities/Categories.entity';
import { Users } from '../../db/entities/Users.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Places } from '../../db/entities/Places.entity';
import { PlaceRatings } from '../../db/entities/PlaceRatings.entity';
import { Tags } from '../../db/entities/Tags.entity';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionsRpc } from './collections.rpc';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { CollectionsMcp } from './collections.mcp';
import { AddonsModule } from '../addons/addons.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { MAX_COVER_SIZE } from './collections.controller';
import { PlaceImportModule } from '../place-import/place-import.module';

/** Collections domain (saved-places library). Registered in AppModule.
 *  Exports CollectionsService for in-container consumers (PluginsModule's
 *  RPC host deps factory). */
@Module({
  imports: [
    // Two upload routes, two categories: the per-file resolver routes each part
    // to the right spool. Fieldname routing is exact — FileInterceptor('cover')/
    // FileInterceptor('image') reject any other part with LIMIT_UNEXPECTED_FILE
    // before the storage callbacks run. Both routes pass their fileFilter
    // inline (cover keeps its plain-Error 500 quirk; image its statusCode 400).
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [StorageService],
      useFactory: (storage: StorageService) =>
        buildStorageUploadOptions(storage, {
          category: (_req, file) => (file.fieldname === 'image' ? 'places' : 'covers'),
          maxSize: MAX_COVER_SIZE, // same 20 MB cap for covers and place images
        }),
    }),
    StorageModule,
    NotificationsModule, AddonsModule, PermissionsModule, AppConfigModule, PluginGuardsModule, PlaceImportModule,
    MikroOrmModule.forFeature([
      Collections, CollectionMembers, CollectionLabels, CollectionPlaces, CollectionPlaceRatings,
      Categories, Users, Trips, TripMembers, Places, PlaceRatings, Tags,
    ])],
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionsMcp, CollectionsRpc],
  exports: [CollectionsService],
})
export class CollectionsModule {}
