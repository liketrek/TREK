import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapsMcp } from './maps.mcp';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { StorageModule } from '../storage/storage.module';
import { GoogleQuotaModule } from '../google-quota/google-quota.module';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Users } from '../../db/entities/Users.entity';
import { PlaceDetailsCache } from '../../db/entities/PlaceDetailsCache.entity';
import { Places } from '../../db/entities/Places.entity';

/**
 * Maps / geo domain (L3 leaf module). Registered in AppModule. Exports
 * MapsService for the in-container consumers (BookingImportModule's Nominatim
 * geocoding, PlacesModule's search_place tool and list-import enrichment).
 * Nothing outside the container consumes this domain, so there is no bridge.
 *
 * MikroOrmModule.forFeature([AppSettings, Users, PlaceDetailsCache, Places]):
 * MapsService passes its own AppSettingsRepository/UsersRepository to
 * instance-api-keys.ts's resolveApiKey (Plan 3a Task 5). Plan 3h Task 4 (R8)
 * adds `PlaceDetailsCache` (MAP3-8 reuse `PlaceDetailsCacheRepository`, built
 * for `place-enrichment.service.ts` — only the entity class is imported
 * here, not that domain's own Nest module, so there is no new module edge/
 * cycle risk) and `Places` (MAP9's additive `setImageUrlIfUnset`).
 */
@Module({
  imports: [PlacePhotosModule, StorageModule, GoogleQuotaModule, MikroOrmModule.forFeature([AppSettings, Users, PlaceDetailsCache, Places])],
  controllers: [MapsController],
  providers: [MapsService, MapsMcp],
  exports: [MapsService],
})
export class MapsModule {}
