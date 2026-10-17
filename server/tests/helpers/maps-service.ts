import type { AppSettingsRepository } from '../../src/db/repositories/AppSettings.repository';
import type { PlaceDetailsCacheRepository } from '../../src/db/repositories/PlaceDetailsCache.repository';
import type { PlacesRepository } from '../../src/db/repositories/Places.repository';
import type { UsersRepository } from '../../src/db/repositories/Users.repository';
import type { GoogleQuotaService } from '../../src/nest/google-quota/google-quota.service';
import { MapsUrlResolver } from '../../src/nest/maps/maps-url.resolver';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PlaceDetailsResolver } from '../../src/nest/maps/place-details.resolver';
import { PlacePhotoResolver } from '../../src/nest/maps/place-photo.resolver';
import { PlacesProviderSelector } from '../../src/nest/maps/places-provider.selector';
import { GooglePlacesClient } from '../../src/nest/maps/providers/google-places.provider';
import { OsmClient } from '../../src/nest/maps/providers/osm.client';
import { WikimediaClient } from '../../src/nest/maps/providers/wikimedia.client';
import type { PlacePhotoCacheService } from '../../src/nest/place-photos/place-photo-cache.service';
import { noGoogleQuota } from './google-quota';

/** MapsService and the outbound clients it was wired with, for tests that reach a client directly. */
export interface MapsParts {
  svc: MapsService;
  google: GooglePlacesClient;
  osm: OsmClient;
  wiki: WikimediaClient;
  selector: PlacesProviderSelector;
}

/**
 * MapsService built by hand the way MapsModule wires it: the repositories and
 * caches a test hands in, and real clients over the global fetch the test
 * stubs. The argument order is MapsService's old six-argument constructor, so
 * a hand-built service reads the same as it did before the providers split out.
 */
export function buildMapsParts(
  photoCache: PlacePhotoCacheService,
  appSettings: AppSettingsRepository,
  users: UsersRepository,
  placeDetailsCache: PlaceDetailsCacheRepository,
  places: PlacesRepository,
  googleQuota: GoogleQuotaService = noGoogleQuota,
): MapsParts {
  const google = new GooglePlacesClient(googleQuota);
  const osm = new OsmClient();
  const wiki = new WikimediaClient();
  const selector = new PlacesProviderSelector(appSettings, users, googleQuota);
  const photos = new PlacePhotoResolver(photoCache, places, google, wiki, selector);
  const links = new MapsUrlResolver(osm);
  const details = new PlaceDetailsResolver(placeDetailsCache, google, osm, selector);
  const svc = new MapsService(photoCache, appSettings, google, osm, wiki, selector, photos, links, details);
  return { svc, google, osm, wiki, selector };
}

export function buildMapsService(
  photoCache: PlacePhotoCacheService,
  appSettings: AppSettingsRepository,
  users: UsersRepository,
  placeDetailsCache: PlaceDetailsCacheRepository,
  places: PlacesRepository,
  googleQuota: GoogleQuotaService = noGoogleQuota,
): MapsService {
  return buildMapsParts(photoCache, appSettings, users, placeDetailsCache, places, googleQuota).svc;
}
