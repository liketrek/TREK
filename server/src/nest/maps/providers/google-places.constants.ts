/**
 * The fields places:searchText is asked for.
 *
 * Beside the Google places provider that sends them, and in a constants file
 * because the admin panel's key test (auth/user-profile.service.ts) has to send
 * the same mask: a key restricted to a narrower set of Places SKUs answers a
 * one-field probe with 200 and the real search with 403, which is the second
 * way to reach the #1939 report ("test button green, searching fails").
 */
export const SEARCH_TEXT_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.websiteUri,places.nationalPhoneNumber,places.types,places.googleMapsUri,places.businessStatus';
