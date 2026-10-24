import { PlaceImportService } from './place-import.service';
import { CollectionGpxProvider } from './providers/collection-gpx.provider';
import { GoogleDirectionsProvider } from './providers/google-directions.provider';
import { GoogleListProvider } from './providers/google-list.provider';
import { GoogleMapsShortLinkProvider } from './providers/google-maps-short-link.provider';
import { GpxProvider } from './providers/gpx.provider';
import { KmlProvider } from './providers/kml.provider';
import { NaverListProvider } from './providers/naver-list.provider';
import { Module } from '@nestjs/common';

/**
 * Place import (leaf module): reads places out of GPX, KML/KMZ, Google lists,
 * Google directions links and Naver lists, and writes GPX. No controller, no
 * table of its own: PlacesModule, CollectionsModule and ToursModule import it
 * and persist what it reads. It imports no other
 * domain: the stops of a directions link that carry only a name are geocoded
 * through a function the importer hands in (MapsService.geocodeQuery). A
 * Google Maps short link the city walk import is given is followed through
 * GoogleMapsShortLinkProvider, hop by hop against its own allow-list (CW-06).
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
    GoogleMapsShortLinkProvider,
  ],
  exports: [PlaceImportService],
})
export class PlaceImportModule {}
