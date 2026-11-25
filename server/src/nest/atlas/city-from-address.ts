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
 * A city written beside its postcode ("10178 Berlin") counts without the postcode (#3137).
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

/**
 * The postcodes geocoders write into the same part as the city: German, French or US
 * five digits ("10178 Berlin", "NY 10118"), Japanese "150-0002", Dutch "1012 LG", British
 * "SW1A 2AA" and Canadian "M5V 3L9". A house number ("Unter den Linden 77") or a numbered
 * district ("Shibuya 2") is none of these and keeps its part out of the running.
 */
const POSTCODES = [
  /\b\d{4}\s?[A-Z]{2}\b/g,
  /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g,
  /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g,
  /\b\d{3}-\d{4}\b/g,
  /\b\d{4,}(?:-\d{4})?\b/g,
];

/**
 * The name left in a part once its postcode is taken out, or null when the part holds
 * no postcode or nothing but one. The short state or province code that stands beside
 * a postcode ("NY 10118", "Roma RM", "ON M5V 3L9") goes with it.
 */
function besidePostcode(part: string): string | null {
  let rest = part;
  for (const pattern of POSTCODES) rest = rest.replace(pattern, ' ');
  if (rest === part) return null;
  rest = rest
    .split(/\s+/)
    .filter((word) => word && !/^[A-Z]{2}$/.test(word))
    .join(' ');
  return rest && !hasDigits(rest) && /\p{L}/u.test(rest) ? rest : null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** A part that is a postcode and nothing else ("10117", "150-0002"), as the TREK index writes it. */
function isBarePostcode(part: string): boolean {
  let rest = part;
  for (const pattern of POSTCODES) rest = rest.replace(pattern, ' ');
  return rest !== part && !/[\p{L}\d]/u.test(rest);
}

/**
 * The generic word a geocoder writes after a region's own name: "Kaafu Atoll" for
 * the region the map calls Kaafu. Without it the atoll was read as the city, and
 * every island in it counted as one (#3200).
 */
const REGION_WORD = /\s+(?:atoll|province|region|state|prefecture|county|governorate|oblast)$/i;

function sameRegion(part: string, region: string): boolean {
  const name = normalize(part);
  return name === region || name.replace(REGION_WORD, '') === region;
}

export function cityFromAddress(
  address: string | null | undefined,
  isKnownCountry: (part: string) => boolean,
  regionName?: string | null,
): string | null {
  if (!address) return null;

  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  // One part is the place's own name, never an address with a city in it.
  if (parts.length < 2) return null;

  const region = regionName ? normalize(regionName) : null;

  // The TREK index writes "street, postcode, locality" with no country: the locality
  // is the city, whatever the region is called (#3200).
  const tail = parts[parts.length - 1] as string;
  if (
    parts.length >= 3 &&
    isBarePostcode(parts[parts.length - 2] as string) &&
    !isKnownCountry(tail) &&
    !hasDigits(tail) &&
    /\p{L}/u.test(tail)
  ) {
    return tail;
  }

  // A geocoder always ends on the country, so drop the last part outright once the
  // address is long enough for that to be certain. The country-name list below still
  // runs for every part, but it is a finite list (it has no "Nederland", for one), and
  // this way a country it has never heard of cannot be counted as a city.
  const last = parts.length >= 3 ? parts.length - 2 : parts.length - 1;

  // A city that is its own region (Berlin, Wien, Malé) is skipped like any region,
  // but written beside its postcode ("10117 Berlin") it is the city of the address.
  // It counts when no part before it names a city (#3200).
  let cityRegion: string | null = null;

  // Index 0 stays out of the running: geocoders lead with the place itself.
  for (let i = last; i >= 1; i--) {
    const withPostcode = hasDigits(parts[i]);
    const part = withPostcode ? besidePostcode(parts[i]) : parts[i];
    if (!part) continue;
    if (isKnownCountry(part)) continue;
    if (region && sameRegion(part, region)) {
      if (withPostcode) cityRegion ??= part;
      continue;
    }
    // Anything with no letter at all (stray punctuation, a lone dash) is not a name.
    if (!/\p{L}/u.test(part)) continue;
    return part;
  }
  return cityRegion;
}
