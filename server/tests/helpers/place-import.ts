import { PlaceImportService } from '../../src/nest/place-import/place-import.service';
import { GpxProvider } from '../../src/nest/place-import/providers/gpx.provider';
import { CollectionGpxProvider } from '../../src/nest/place-import/providers/collection-gpx.provider';
import { KmlProvider } from '../../src/nest/place-import/providers/kml.provider';
import { GoogleListProvider } from '../../src/nest/place-import/providers/google-list.provider';
import { GoogleDirectionsProvider } from '../../src/nest/place-import/providers/google-directions.provider';
import { NaverListProvider } from '../../src/nest/place-import/providers/naver-list.provider';

/**
 * PlaceImportService built by hand the way PlaceImportModule wires it: real
 * providers over the global fetch a test stubs.
 */
export function buildPlaceImportService(): PlaceImportService {
  return new PlaceImportService(
    new GpxProvider(),
    new CollectionGpxProvider(),
    new KmlProvider(),
    new GoogleListProvider(),
    new GoogleDirectionsProvider(),
    new NaverListProvider(),
  );
}
