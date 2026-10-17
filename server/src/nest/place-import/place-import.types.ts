/**
 * What the place-import layer hands its callers: places read out of a file or
 * a shared list, not yet persisted. Persisting them (dedup against the trip,
 * insert, track colours, enrichment) stays with the domain that owns the rows,
 * PlacesService for a trip and CollectionsService for a list.
 */
import type { CollectionGpxProblem } from '@trek/shared';

/** One place parsed out of a GPX file, not yet persisted. */
export interface PreparedGpxPlace {
  name: string;
  lat: number;
  lng: number;
  description: string | null;
  routeGeometry?: string;
}

export interface GpxImportOptions {
  importWaypoints?: boolean;
  importRoutes?: boolean;
  importTracks?: boolean;
  /** Source filename used to name unnamed routes/tracks (keeps multiple imports distinct). */
  defaultName?: string;
}

export interface KmlImportOptions {
  importPoints?: boolean;
  importPaths?: boolean;
}

export interface KmlImportSummary {
  totalPlacemarks: number;
  createdCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
}

export interface ParsedKmlPlacemark {
  name: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  folderName: string | null;
  routeGeometry: string | null;
}

/** A KML document read: every placemark, and the summary the import fills in. */
export interface KmlDocumentRead {
  placemarks: ParsedKmlPlacemark[];
  summary: KmlImportSummary;
}

/** An import that could not happen, with the status and the exact message the route answers. */
export interface ListImportError {
  error: string;
  status: number;
}

/** A place out of a Google list or a directions link. */
export interface GoogleListPlace {
  name: string;
  lat: number;
  lng: number;
  notes: string | null;
  googleFtid: string | null;
}

/** A place out of a Naver list. */
export interface NaverListPlace {
  name: string;
  lat: number;
  lng: number;
  notes: string | null;
  address: string | null;
}

/** A shared list read: its name and the places that carried coordinates. */
export interface ListRead<P> {
  listName: string;
  places: P[];
}

/** A Google link that turned out to be a route once its redirect was followed. */
export interface DirectionsRedirect {
  directions: string;
}

/** The stops of a directions link, placed on the map; `unplaceable` counts the ones nobody could find. */
export interface DirectionsRead {
  places: GoogleListPlace[];
  unplaceable: number;
}

/** Why a GPX document was refused for a list, carried to the controller as the response's `code`. */
export class CollectionGpxError extends Error {
  constructor(
    readonly code: CollectionGpxProblem,
    message: string,
  ) {
    super(message);
    this.name = 'CollectionGpxError';
  }
}
