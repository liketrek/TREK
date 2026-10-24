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
  /**
   * ACT-01: when a track was recorded, ISO 8601 in UTC: its first and last
   * point's time, only when every point carries one. Never on a route.
   */
  trackTimes?: { startedAt: string; endedAt: string };
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

/** What a KML document holds that a line import leaves out, counted by kind. */
export interface KmlLeftOut {
  /** Single points (pins). */
  points: number;
  /** Polygons. */
  areas: number;
  /** Everything else: models, overlays, links to other files, placemarks without a geometry, too short lines. */
  other: number;
}

/** One line of a KML document: a LineString or a gx:Track, as route geometry `[lat, lng]` or `[lat, lng, ele]`. */
export interface KmlLineRead {
  name: string | null;
  description: string | null;
  geometry: number[][];
}

/** A KML document read for its lines (IO-02). */
export interface KmlLinesRead {
  lines: KmlLineRead[];
  leftOut: KmlLeftOut;
  warnings: string[];
}

/** The lines of a KML or KMZ file as the rows a Tours import stores, and what it leaves out. */
export interface KmlTracksRead {
  tracks: PreparedGpxPlace[];
  leftOut: KmlLeftOut;
}

/** Why a KML or KMZ file could not be read. */
export type KmlReadFailure = 'malformed' | 'archive_invalid' | 'archive_without_kml' | 'archive_too_large';

/**
 * A KML or KMZ file that could not be read, with the message the place import
 * route has always answered and the reason a caller can tell apart.
 */
export class KmlReadError extends Error {
  constructor(
    readonly reason: KmlReadFailure,
    message: string,
  ) {
    super(message);
    this.name = 'KmlReadError';
  }
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

/**
 * CW-06: where a Google Maps short link led. `refused` when a hop or the
 * landing link is not one the walk import may follow or read, `unreachable`
 * when the chain could not be followed in time, a name did not resolve, or it
 * answered nonsense, `not_found` when Google answered that it has no such
 * link (404 or 410), `too_many_redirects` and `no_redirect` as they say.
 */
export type ShortLinkOutcome = { ok: true; url: string } | { ok: false; why: ShortLinkFailure };

export type ShortLinkFailure = 'refused' | 'unreachable' | 'not_found' | 'too_many_redirects' | 'no_redirect';
