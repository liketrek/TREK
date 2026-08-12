/**
 * Pull the settlement out of a formatted address, for the "cities visited" figure.
 *
 * The previous version scanned the parts left to right and took the first one that
 * was not a known country and matched a latin-only pattern. Both halves were wrong.
 * Left to right means the first part, which in a geocoder's output is the name of the
 * place itself, so "Shibuya Sky, 12, Shibuya 2, Shibuya, Tokyo, 150-0002, Japan"
 * counted "Shibuya Sky" as a city, and the pattern excluded every non-latin script,
 * so an address written in Japanese, Cyrillic, Greek or Korean counted nothing at all.
 *
 * Reading from the end instead lands on the administrative tail, where the settlement
 * lives. The trick for separating the city from the region above it is that we already
 * know the region: `place_regions.region_name` is filled by the geocoder, so it can
 * simply be skipped. For the address above, with the region resolved as Tokyo, walking
 * back past Japan (country), 150-0002 (digits) and Tokyo (the region) lands on Shibuya.
 *
 * This is still a heuristic over a formatted string. Structured `address.city` from the
 * geocoder would be exact, but the fast path for region resolution runs against bundled
 * polygons and never calls the geocoder at all, so storing a city would mean an extra
 * network round trip per place. Not worth it for one number on a stats card.
 */

/** A part carrying digits is a postcode, a house number or a numbered district. */
function hasDigits(part: string): boolean {
  return /\d/.test(part);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function cityFromAddress(
  address: string | null | undefined,
  isKnownCountry: (part: string) => boolean,
  regionName?: string | null,
): string | null {
  if (!address) return null;

  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  // One part is the place's own name, never an address with a city in it.
  if (parts.length < 2) return null;

  const region = regionName ? normalize(regionName) : null;

  // A geocoder always ends on the country, so drop the last part outright once the
  // address is long enough for that to be certain. The country-name list below still
  // runs for every part, but it is a finite list (it has no "Nederland", for one), and
  // this way a country it has never heard of cannot be counted as a city.
  const last = parts.length >= 3 ? parts.length - 2 : parts.length - 1;

  // Index 0 stays out of the running: geocoders lead with the place itself.
  for (let i = last; i >= 1; i--) {
    const part = parts[i];
    if (hasDigits(part)) continue;
    if (isKnownCountry(part)) continue;
    if (region && normalize(part) === region) continue;
    // Anything with no letter at all (stray punctuation, a lone dash) is not a name.
    if (!/\p{L}/u.test(part)) continue;
    return part;
  }
  return null;
}
