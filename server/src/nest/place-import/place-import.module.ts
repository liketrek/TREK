import { Module } from '@nestjs/common';
import { PlaceImportService } from './place-import.service';
import { GpxProvider } from './providers/gpx.provider';
import { CollectionGpxProvider } from './providers/collection-gpx.provider';
import { KmlProvider } from './providers/kml.provider';
import { GoogleListProvider } from './providers/google-list.provider';
import { GoogleDirectionsProvider } from './providers/google-directions.provider';
import { NaverListProvider } from './providers/naver-list.provider';

/**
 * Place import (leaf module): reads places out of GPX, KML/KMZ, Google lists,
 * Google directions links and Naver lists, and writes GPX. No controller, no
 * table of its own: PlacesModule, CollectionsModule and ToursModule import it
 * and persist what it reads. It imports no other
 * domain: the stops of a directions link that carry only a name are geocoded
 * through a function the importer hands in (MapsService.geocodeQuery).
 */
@Module({
  providers: [
    PlaceImportService,
    GpxProvider,
    CollectionGpxProvider,
    KmlProvider,
    GoogleListProvider,
    GoogleDirectionsProvider,
    NaverListProvider,
  ],
  exports: [PlaceImportService],
})
export class PlaceImportModule {}
