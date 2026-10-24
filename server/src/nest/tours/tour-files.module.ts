import { PlaceImportModule } from '../place-import/place-import.module';
import { PlacesModule } from '../places/places.module';
import { TourFileReadService } from './tour-file-read.service';
import { Module } from '@nestjs/common';

/**
 * P7: a route file read into tours without storing anything, for the
 * assistant's chat (a GPX, KML or KMZ file the user attaches). It reads the
 * file as the Tours import does, through PlaceImportModule's readers, and
 * marks the tracks the trip has already through PlacesModule; the import
 * itself stays import_tour_gpx's. A module of its own so the assistant takes
 * this one reader without the whole Tours module.
 */
@Module({
  imports: [PlaceImportModule, PlacesModule],
  providers: [TourFileReadService],
  exports: [TourFileReadService],
})
export class TourFilesModule {}
