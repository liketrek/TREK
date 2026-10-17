/**
 * A shared Google Maps list, read from Google's own list endpoint.
 *
 * The link is user input, so it is checked by the SSRF guard first and a short
 * link is followed hop by hop through it. A short link that lands on a route
 * (the Share sheet on a phone produces exactly that) is handed back as a
 * directions link for the directions source; everything else must carry a list
 * id. The answer is capped before and after it is read, because its size is
 * attacker-influenced through the list id. Every refusal is the exact message
 * and status the import route has always answered.
 */
import { checkSsrf, safeFetchFollow, SsrfBlockedError } from '../../../utils/ssrfGuard';
import { isDirectionsUrl } from '../directions-url.helpers';
import type { DirectionsRedirect, GoogleListPlace, ListImportError, ListRead } from '../place-import.types';
import { Injectable } from '@nestjs/common';

/** Cap on a provider list-import response body — the payload is attacker-influenced via the list id. */
export const MAX_LIST_RESPONSE_BYTES = 8 * 1024 * 1024; // 8 MB

/** The browser user agent the list endpoints answer. */
export const LIST_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function googleMapsHexId(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (/^0x[0-9a-f]+$/i.test(raw)) return raw.toLowerCase();
  if (!/^-?\d+$/.test(raw)) return null;
  try {
    const parsed = BigInt(raw);
    const unsigned = parsed < 0n ? (1n << 64n) + parsed : parsed;
    return `0x${unsigned.toString(16)}`;
  } catch {
    return null;
  }
}

export function googleMapsFeatureIdFromItem(item: unknown): string | null {
  if (!Array.isArray(item)) return null;
  const candidates = [Array.isArray(item[1]) ? item[1][6] : null, Array.isArray(item[7]) ? item[7][1] : null];

  for (const ids of candidates) {
    if (!Array.isArray(ids) || ids.length < 2) continue;
    const first = googleMapsHexId(ids[0]);
    const second = googleMapsHexId(ids[1]);
    if (first && second) return `${first}:${second}`;
  }

  return null;
}

@Injectable()
export class GoogleListProvider {
  async read(url: string): Promise<ListRead<GoogleListPlace> | DirectionsRedirect | ListImportError> {
    let listId: string | null = null;
    let resolvedUrl = url;

    // SSRF guard: validate user-supplied URL before fetching
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { error: 'URL is not allowed', status: 400 };

    // Follow redirects for short URLs (maps.app.goo.gl, goo.gl). Redirects are
    // followed manually so every hop is re-checked against the SSRF guard — a
    // short link that 302s to an internal IP is blocked even though the initial
    // host is public.
    if (url.includes('goo.gl') || url.includes('maps.app')) {
      try {
        const redirectRes = await safeFetchFollow(url, { signal: AbortSignal.timeout(10000) });
        resolvedUrl = redirectRes.url;
      } catch (err) {
        if (err instanceof SsrfBlockedError) return { error: 'URL is not allowed', status: 400 };
        throw err;
      }
    }

    // A route, once the redirect is followed. The dispatch upstream decides on
    // the raw URL, and a short link's path is `/<code>` — it matches nothing, so
    // every route shared from the Google Maps app arrived here and was answered
    // with "could not extract list ID", which is the complaint the directions
    // import was written to remove. The Share sheet on a phone produces exactly
    // this shape, and the box says a directions link works.
    //
    // Handed on with the resolved URL, so the hop is not made twice.
    if (isDirectionsUrl(resolvedUrl)) return { directions: resolvedUrl };

    // Pattern: /placelists/list/{ID}
    const plMatch = resolvedUrl.match(/placelists\/list\/([A-Za-z0-9_-]+)/);
    if (plMatch) listId = plMatch[1];

    // Pattern: !2s{ID} in data URL params
    if (!listId) {
      const dataMatch = resolvedUrl.match(/!2s([A-Za-z0-9_-]{15,})/);
      if (dataMatch) listId = dataMatch[1];
    }

    if (!listId) {
      // A single-place share link (…/maps/place/…) carries no list id — point the user at
      // the place search box instead of a cryptic "could not extract list ID" (#1304).
      if (resolvedUrl.includes('/maps/place/')) {
        return {
          error:
            'That link points to a single place, not a list. To add it, paste the link into the place search box instead of using the list import.',
          status: 400,
        };
      }
      return { error: 'Could not extract list ID from URL. Please use a shared Google Maps list link.', status: 400 };
    }

    // Fetch list data from Google Maps internal API
    const apiUrl = `https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=en&gl=us&pb=!1m1!1s${encodeURIComponent(listId)}!2e2!3e2!4i500!16b1`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': LIST_USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });

    if (!apiRes.ok) {
      return { error: 'Failed to fetch list from Google Maps', status: 502 };
    }

    // Cap the declared body before reading it (transit.service precedent): the
    // response is attacker-influenced via the list id, and buffering it whole
    // used to be unbounded.
    const declared = Number(apiRes.headers?.get('content-length') ?? 0);
    if (declared > MAX_LIST_RESPONSE_BYTES) {
      return { error: 'Failed to fetch list from Google Maps', status: 502 };
    }

    const rawText = await apiRes.text();
    if (rawText.length > MAX_LIST_RESPONSE_BYTES) {
      return { error: 'Failed to fetch list from Google Maps', status: 502 };
    }
    const jsonStr = rawText.substring(rawText.indexOf('\n') + 1);
    // The provider hands back a JS-prefixed array; a malformed body is a
    // provider problem, not a crash — surface the same 400 an unreadable
    // payload already produced instead of throwing a SyntaxError.
    let listData: unknown;
    try {
      listData = JSON.parse(jsonStr);
    } catch {
      return { error: 'Invalid list data received from Google Maps', status: 400 };
    }
    if (!Array.isArray(listData)) {
      return { error: 'Invalid list data received from Google Maps', status: 400 };
    }

    const meta = listData[0];
    if (!meta) {
      return { error: 'Invalid list data received from Google Maps', status: 400 };
    }

    const listName = meta[4] || 'Google Maps List';
    const items = meta[8];

    if (!Array.isArray(items) || items.length === 0) {
      return { error: 'List is empty or could not be read', status: 400 };
    }

    // Parse place data from items
    const places: GoogleListPlace[] = [];
    for (const item of items) {
      const coords = item?.[1]?.[5];
      const lat = coords?.[2];
      const lng = coords?.[3];
      const name = item?.[2];
      const note = item?.[3] || null;

      if (name && typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        places.push({ name, lat, lng, notes: note || null, googleFtid: googleMapsFeatureIdFromItem(item) });
      }
    }

    if (places.length === 0) {
      return { error: 'No places with coordinates found in list', status: 400 };
    }

    return { listName, places };
  }
}
