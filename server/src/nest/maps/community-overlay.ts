import { buildOsmDetails } from './maps.helpers';
import type { TrekCommunityValues } from './trek-community.schema';
import { communityKeyOf } from './trek-community.service';
import { trekCommunityByKeys } from './trek-places.client';
import { normalizePlaceWebsite } from '@trek/shared';

/**
 * Community values for places TREK did not find in its own index: a relation
 * Photon returned, a way from Overpass. The index rows carry them already
 * (the service lays them over its own answers); these places get them from
 * /v1/community, so a value one installation sent shows on the next open of
 * the same place everywhere.
 */

/** The details record with what the community published laid over it; untouched where nothing was. */
export function withCommunityValues(
  details: Record<string, unknown>,
  values: TrekCommunityValues | undefined,
): Record<string, unknown> {
  if (!values?.community) return details;
  const out: Record<string, unknown> = { ...details };
  const website = normalizePlaceWebsite(values.contact?.website);
  if (website) out.website = website;
  if (values.contact?.phone) out.phone = values.contact.phone;
  if (values.contact?.email) out.email = values.contact.email;
  if (values.hours?.osm) {
    // The same shape OSM's own hours take in the details: one line per day, open now, the periods.
    const hours = buildOsmDetails({ opening_hours: values.hours.osm }, '', '');
    if (hours.opening_hours) {
      out.opening_hours = hours.opening_hours;
      out.open_now = hours.open_now;
      out.opening_periods = hours.opening_periods;
    }
  }
  if (values.description?.text) {
    out.summary = values.description.text;
    // The details panel credits it to the community, not to OpenStreetMap.
    out.summary_source = 'community';
  }
  if (typeof values.community.version === 'number') out.community_version = values.community.version;
  return out;
}

/** Records built from TREK's own details layer, which carry the community answer already. */
const asked = new WeakSet<object>();

export function markCommunityAsked(details: Record<string, unknown>): Record<string, unknown> {
  asked.add(details);
  return details;
}

/** OSM details as Overpass and Photon gave them, with the community's values for the same element. */
export async function osmDetailsWithCommunity(
  placeId: string,
  details: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  const key = communityKeyOf(placeId);
  if (!details || !key || asked.has(details)) return details;
  const published = await trekCommunityByKeys([key]);
  return withCommunityValues(details, published[key]);
}
