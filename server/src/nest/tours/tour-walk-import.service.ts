import { DomainError } from '../common/domain-error';
import { isGoogleMapsLongLink, isGoogleMapsShortLink } from '../common/google-maps-hosts';
import {
  directionsTravelMode,
  isDirectionsUrl,
  parseDirectionsUrl,
  PlaceImportService,
  type DirWaypoint,
} from '../place-import/place-import.service';
import type { ShortLinkFailure } from '../place-import/place-import.types';
import { Injectable } from '@nestjs/common';
import {
  TOUR_STATION_NAME_MAX,
  WALK_IMPORT_STATIONS_MAX,
  type WalkImportPreviewResponse,
  type WalkImportRefusal,
  type WalkImportStation,
} from '@trek/shared';

/** What API and MCP clients read; the planner says the same in the reader's language, by reason. */
const REFUSAL_TEXT: Readonly<Record<WalkImportRefusal, string>> = {
  not_google_maps: 'Use a Google Maps route link: a maps.app.goo.gl short link or a google.com/maps/dir link.',
  not_a_route: 'That Google Maps link is not a route. Plan the walk in Google Maps and share the route.',
  not_walking: 'That route is not planned on foot. Switch Google Maps to walking and share the route again.',
  mode_unknown:
    'The link does not say clearly that the route is on foot. Choose walking in Google Maps and share it again.',
  short_link_refused: 'The short link leads somewhere other than Google Maps, so it was not followed.',
  short_link_failed: 'The short link could not be followed just now. Try again, or paste the long link.',
  short_link_unknown: 'Google Maps does not know that short link. Share the route in Google Maps again.',
  too_few_stops: 'Fewer than two stops could be read from that link.',
  too_many_stops: 'That route has more stops than a walk can take.',
};

/** Reasons that are Google's answer rather than the link's. */
const UPSTREAM: ReadonlySet<WalkImportRefusal> = new Set<WalkImportRefusal>(['short_link_failed']);

/**
 * Why a short link was not followed, as the walk import says it: a link that
 * leaves Google Maps, one Google does not know, and the rest a failure on
 * the way that may pass.
 */
const SHORT_LINK_REFUSAL: Readonly<Record<ShortLinkFailure, WalkImportRefusal>> = {
  refused: 'short_link_refused',
  not_found: 'short_link_unknown',
  unreachable: 'short_link_failed',
  too_many_redirects: 'short_link_failed',
  no_redirect: 'short_link_failed',
};

function refuse(reason: WalkImportRefusal): DomainError {
  return new DomainError(UPSTREAM.has(reason) ? 502 : 400, REFUSAL_TEXT[reason], { code: reason, details: { reason } });
}

/** A stop as the walk takes it: its name as the link spells it, cut to a station's length; no position guessed. */
function stationOf(stop: DirWaypoint): WalkImportStation {
  const name = stop.name?.trim().slice(0, TOUR_STATION_NAME_MAX).trim() || null;
  return { name, lat: stop.lat, lng: stop.lng };
}

/**
 * CW-07: the stops of a Google Maps walking route shared as a link, in their
 * order, for the planner to show before anything is taken over. Only a route
 * the link marks as on foot is read. A stop the link gives no position stays
 * without one: nothing is looked up or guessed. A short link is followed only
 * through the narrow resolver of CW-06. Nothing is stored.
 */
@Injectable()
export class TourWalkImportService {
  constructor(private readonly placeImport: PlaceImportService) {}

  async preview(raw: string): Promise<WalkImportPreviewResponse> {
    const link = this.linkOf(raw);
    const route = isGoogleMapsShortLink(link) ? await this.followed(link) : link;
    if (!isGoogleMapsLongLink(route)) throw refuse('not_google_maps');
    if (!isDirectionsUrl(route.href)) throw refuse('not_a_route');
    const mode = directionsTravelMode(route.href);
    if (mode !== 'walking') throw refuse(mode === 'unknown' ? 'mode_unknown' : 'not_walking');
    const stops = parseDirectionsUrl(route.href, WALK_IMPORT_STATIONS_MAX + 1, 'stop-blocks');
    if (stops.length > WALK_IMPORT_STATIONS_MAX) throw refuse('too_many_stops');
    if (stops.length < 2) throw refuse('too_few_stops');
    return { stations: stops.map(stationOf), resolved_url: route.href };
  }

  private linkOf(raw: string): URL {
    try {
      return new URL(raw.trim());
    } catch {
      throw refuse('not_google_maps');
    }
  }

  private async followed(link: URL): Promise<URL> {
    const outcome = await this.placeImport.resolveGoogleShortLink(link.href);
    if ('why' in outcome) throw refuse(SHORT_LINK_REFUSAL[outcome.why]);
    return new URL(outcome.url);
  }
}
