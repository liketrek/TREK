import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapsMcp } from './maps.mcp';
import { GooglePlacesClient } from './providers/google-places.provider';
import { OsmClient } from './providers/osm.client';
import { WikimediaClient } from './providers/wikimedia.client';
import { PlacesProviderSelector } from './places-provider.selector';
import { PlacePhotoResolver } from './place-photo.resolver';
import { MapsUrlResolver } from './maps-url.resolver';
import { PlaceDetailsResolver } from './place-details.resolver';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { StorageModule } from '../storage/storage.module';
import { GoogleQuotaModule } from '../google-quota/google-quota.module';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Users } from '../../db/entities/Users.entity';
import { PlaceDetailsCache } from '../../db/entities/PlaceDetailsCache.entity';
import { Places } from '../../db/entities/Places.entity';

/**
 * Maps / geo domain (L3 leaf module). Registered in AppModule.
 *
 * MapsService is the orchestrator every consumer injects (BookingImportModule's
 * geocoding, PlacesModule's search_place tool and list-import enrichment, the
 * road trip search). Behind it sit one provider per outbound source
 * (GooglePlacesClient, OsmClient, WikimediaClient; Amap is built per request by
 * PlacesProviderSelector) and the resolvers it delegates to. The three clients
 * are exported too, so the enrichment column asks Google, OpenStreetMap and
 * Wikimedia directly rather than through a MapsService facade. Nothing outside
 * the container consumes this domain, so there is no bridge.
 *
 * MikroOrmModule.forFeature: AppSettings and Users for the key chain
 * (instance-api-keys.ts's resolveApiKey) and the kill switches,
 * PlaceDetailsCache for the details cache (the entity only, not
 * place-enrichment's module, so there is no new module edge) and Places for the
 * marker photo's `setImageUrlIfUnset`.
 */
@Module({
  imports: [PlacePhotosModule, StorageModule, GoogleQuotaModule, MikroOrmModule.forFeature([AppSettings, Users, PlaceDetailsCache, Places])],
  controllers: [MapsController],
  providers: [
    MapsService,
    MapsMcp,
    GooglePlacesClient,
    OsmClient,
    WikimediaClient,
    PlacesProviderSelector,
    PlacePhotoResolver,
    MapsUrlResolver,
    PlaceDetailsResolver,
  ],
  exports: [MapsService, GooglePlacesClient, OsmClient, WikimediaClient],
})
export class MapsModule {}
