import { Places } from '../../db/entities/Places.entity';
import { Trips } from '../../db/entities/Trips.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { PlaceImportService } from '../place-import/place-import.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * A trip's places as KML for Google My Maps (#1866). Google Maps has no API
 * that writes to a saved list, but My Maps takes a KML file as a layer, which
 * is the closest a trip gets to a list of its places in Google Maps.
 *
 * Its own provider rather than a method beside PlacesService.exportGpx: the
 * GPX export also folds the day plan into routes, while a list of places is
 * just the places, and PlacesService has no room left to grow. The places are
 * the ones the GPX export reads, in the same order.
 */
@Injectable()
export class PlacesKmlService {
  constructor(
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    private readonly placeImport: PlaceImportService,
  ) {}

  /** The document and its file name; null for a trip that is gone or has no place with coordinates. */
  async exportKml(tripId: string): Promise<{ kml: string; filename: string } | null> {
    const title = await this.tripsRepo.getTitle(tripId);
    if (title === null) return null;
    const kml = this.placeImport.writeTripKml(title, await this.placesRepo.listForGpx(tripId));
    return kml ? { kml, filename: this.placeImport.tripKmlFilename(title) } : null;
  }
}
