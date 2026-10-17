import type {
  DirectionsRead,
  DirectionsRedirect,
  GoogleListPlace,
  GpxImportOptions,
  KmlDocumentRead,
  ListImportError,
  ListRead,
  NaverListPlace,
  PreparedGpxPlace,
} from './place-import.types';
import { CollectionGpxProvider, type ExportedCollectionFile } from './providers/collection-gpx.provider';
import { GoogleDirectionsProvider } from './providers/google-directions.provider';
import { GoogleListProvider } from './providers/google-list.provider';
import { GpxProvider, type GpxExportInput, type GpxExportOptions } from './providers/gpx.provider';
import { KmlProvider } from './providers/kml.provider';
import { NaverListProvider } from './providers/naver-list.provider';
import { Injectable } from '@nestjs/common';
import type { CollectionGpxExport, CollectionGpxReadResult } from '@trek/shared';

// The directions-link reading is also what the road trip planner reads a
// shared route with, and what the import routes dispatch on.
export { isDirectionsUrl, parseDirectionsUrl, MAX_DIR_WAYPOINTS } from './directions-url.helpers';
export type { GpxExportDay, GpxExportInput, GpxExportOptions, GpxExportPlace } from './providers/gpx.provider';
export type { ExportedCollectionFile } from './providers/collection-gpx.provider';

/** Places a name, or says nobody can. */
export type Geocoder = (query: string) => Promise<{ lat: number; lng: number } | null>;

/**
 * Places out of files and shared lists: the one layer that reads GPX, KML/KMZ,
 * Google lists, Google directions links and Naver lists, and writes GPX.
 *
 * One provider per source behind it, over one GPX codec and one KML codec.
 * Nothing here persists: a trip import (PlacesService), the Tours import
 * (ToursService) and a list import or export (CollectionsService) each take
 * what comes back and write their own rows, so the dedup, the transactions and
 * the broadcasts stay with the domain that owns them.
 */
@Injectable()
export class PlaceImportService {
  constructor(
    private readonly gpx: GpxProvider,
    private readonly collectionGpx: CollectionGpxProvider,
    private readonly kml: KmlProvider,
    private readonly googleList: GoogleListProvider,
    private readonly googleDirections: GoogleDirectionsProvider,
    private readonly naverList: NaverListProvider,
  ) {}

  // ── GPX ────────────────────────────────────────────────────────────────────

  /** The places a trip GPX import would create, nothing written. */
  readGpx(fileBuffer: Buffer, opts: GpxImportOptions = {}): PreparedGpxPlace[] {
    return this.gpx.read(fileBuffer, opts);
  }

  /** A trip as a GPX document, or null when the selection yields nothing. */
  writeTripGpx(input: GpxExportInput, opts: GpxExportOptions = {}): string | null {
    return this.gpx.write(input, opts);
  }

  tripGpxFilename(tripTitle: string): string {
    return this.gpx.filename(tripTitle);
  }

  /** A list file as GPX (#2301). */
  writeCollectionGpx(file: ExportedCollectionFile): CollectionGpxExport {
    return this.collectionGpx.write(file);
  }

  /** A GPX document as the list file it amounts to. Throws CollectionGpxError on a refusal. */
  readCollectionGpx(source: string, fileName?: string): CollectionGpxReadResult {
    return this.collectionGpx.read(source, fileName);
  }

  // ── KML / KMZ ──────────────────────────────────────────────────────────────

  /** A .kml or .kmz upload, by its file name. */
  readMapFile(fileBuffer: Buffer, filename: string): Promise<KmlDocumentRead> {
    return this.kml.readMapFile(fileBuffer, filename);
  }

  readKmz(kmzBuffer: Buffer): Promise<KmlDocumentRead> {
    return this.kml.readKmz(kmzBuffer);
  }

  readKml(fileBuffer: Buffer): KmlDocumentRead {
    return this.kml.readKml(fileBuffer);
  }

  // ── Shared lists ───────────────────────────────────────────────────────────

  /** A Google Maps list, or the directions link a short link turned out to be. */
  readGoogleList(url: string): Promise<ListRead<GoogleListPlace> | DirectionsRedirect | ListImportError> {
    return this.googleList.read(url);
  }

  readNaverList(url: string): Promise<ListRead<NaverListPlace> | ListImportError> {
    return this.naverList.read(url);
  }

  /**
   * The stops of a shared directions link, placed on the map.
   *
   * `geocode` places a stop the link names without coordinates. It is handed
   * in rather than injected so this layer stays below the maps domain: the
   * importer passes MapsService.geocodeQuery.
   *
   * A stop the link spells out in coordinates is taken as it stands; one that
   * is only a name is geocoded, one request each. A name nobody can place is
   * left out rather than failing the import, because a route of six stops with
   * five findable is five stops more than the traveller had.
   */
  async readGoogleDirections(url: string, geocode: Geocoder): Promise<DirectionsRead | ListImportError> {
    const waypoints = await this.googleDirections.read(url);
    if (!Array.isArray(waypoints)) return waypoints;

    const places: GoogleListPlace[] = [];
    let unplaceable = 0;
    for (const wp of waypoints) {
      if (wp.lat !== null && wp.lng !== null) {
        // A stop written as coordinates has no name of its own, and the coordinates are a
        // better label than "Stop 3": they are what the traveller can look up.
        places.push({
          name: wp.name || `${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}`,
          lat: wp.lat,
          lng: wp.lng,
          notes: null,
          googleFtid: null,
        });
        continue;
      }
      if (!wp.name) continue;
      try {
        // Through geocodeQuery, which asks the TREK index first and only falls
        // through to Nominatim for what it does not know — and does so on the
        // BACKGROUND lane. That matters here more than anywhere: this loop runs
        // up to thirty times in one request, each Nominatim call taking the next
        // slot on a 1.1 s process-wide throttle, so on the interactive lane one
        // pasted link made everybody else's place search queue behind it for
        // half a minute. An index hit costs no slot at all.
        const hit = await geocode(wp.name);
        // The name from the link, not the one the geocoder answers with: somebody who
        // typed a nickname into Google should not find a street address on their trip.
        if (hit) places.push({ name: wp.name, lat: hit.lat, lng: hit.lng, notes: null, googleFtid: null });
        else unplaceable++;
      } catch {
        // A geocoder that is down or rate-limited costs this one stop, not the import.
        unplaceable++;
      }
    }

    if (places.length < 2) {
      return { error: 'None of the stops in that link could be placed on the map.', status: 400 };
    }
    return { places, unplaceable };
  }
}
