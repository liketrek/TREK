/**
 * The stops of a shared Google Maps directions link, read off the link itself.
 *
 * The other half of the request the list import answers: people share a drive
 * far more often than they share a list. No API key is involved and no call is
 * made to Google for the link itself — the stops are in the URL, which is the
 * whole reason this is possible at all. A short link is followed hop by hop
 * through the SSRF guard first, and the host that counts is the one the link
 * lands on.
 *
 * A stop the link spells out in coordinates is taken as it stands; one that is
 * only a name comes back without coordinates for the caller to geocode. This
 * provider asks no geocoder: choosing which source answers is MapsService's
 * job, reached through PlaceImportService.
 */
import { checkSsrf, safeFetchFollow, SsrfBlockedError } from '../../../utils/ssrfGuard';
import { GOOGLE_SHORT_HOSTS, isGoogleMapsHost } from '../../common/google-maps-hosts';
import { parseDirectionsUrl, type DirWaypoint } from '../directions-url.helpers';
import type { ListImportError } from '../place-import.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleDirectionsProvider {
  /** The stops in driving order (two at least), or the refusal the route answers. */
  async read(url: string): Promise<DirWaypoint[] | ListImportError> {
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { error: 'URL is not allowed', status: 400 };

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { error: 'Invalid URL', status: 400 };
    }

    // Short links are resolved hop by hop through the guard, exactly as the list import
    // does it: a maps.app.goo.gl that 302s to an internal address is still blocked.
    let resolvedUrl = url;
    if (GOOGLE_SHORT_HOSTS.includes(parsed.hostname)) {
      try {
        const redirectRes = await safeFetchFollow(url, { signal: AbortSignal.timeout(10000) });
        resolvedUrl = redirectRes.url;
      } catch (err) {
        if (err instanceof SsrfBlockedError) return { error: 'URL is not allowed', status: 400 };
        throw err;
      }
    }

    // Checked after resolving, not before: the host that counts is the one the link lands
    // on, and `/maps/dir/` is a path anybody could serve.
    let host = '';
    try {
      host = new URL(resolvedUrl).hostname;
    } catch {
      /* an unparseable hop fails the check below */
    }
    if (!isGoogleMapsHost(host)) {
      return { error: 'That link is not a Google Maps link.', status: 400 };
    }

    const waypoints = parseDirectionsUrl(resolvedUrl);
    if (waypoints.length < 2) {
      return {
        error:
          'Could not read any stops from that directions link. Open the route in Google Maps and use its Share button.',
        status: 400,
      };
    }
    return waypoints;
  }
}
