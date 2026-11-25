import { SUPPORTED_LANGUAGES } from '@trek/shared';

/**
 * Country names, English and German, used to tell a city apart from a country
 * when splitting a free-text place address. Moved here from auth.helpers.ts
 * together with getTravelStats, its only reader.
 *
 * Deliberately not ISO codes: it matches against whatever the geocoder wrote
 * into places.address, which is display text in the user's language.
 */
const KNOWN_COUNTRIES = new Set([
  // Nominatim inserts an extra tier above the country for France and its overseas
  // territories, which reads exactly like a place name and would otherwise be counted
  // as a city.
  'Metropolitanes Frankreich',
  'France métropolitaine',
  'Metropolitan France',
  'Japan',
  'Germany',
  'Deutschland',
  'France',
  'Frankreich',
  'Italy',
  'Italien',
  'Spain',
  'Spanien',
  'United States',
  'USA',
  'United Kingdom',
  'UK',
  'Thailand',
  'Australia',
  'Australien',
  'Canada',
  'Kanada',
  'Mexico',
  'Mexiko',
  'Brazil',
  'Brasilien',
  'China',
  'India',
  'Indien',
  'South Korea',
  'Sudkorea',
  'Indonesia',
  'Indonesien',
  'Turkey',
  'Turkei',
  'Turkiye',
  'Greece',
  'Griechenland',
  'Portugal',
  'Netherlands',
  'Niederlande',
  'Belgium',
  'Belgien',
  'Switzerland',
  'Schweiz',
  'Austria',
  'Osterreich',
  'Sweden',
  'Schweden',
  'Norway',
  'Norwegen',
  'Denmark',
  'Danemark',
  'Finland',
  'Finnland',
  'Poland',
  'Polen',
  'Czech Republic',
  'Tschechien',
  'Czechia',
  'Hungary',
  'Ungarn',
  'Croatia',
  'Kroatien',
  'Romania',
  'Rumanien',
  'Ireland',
  'Irland',
  'Iceland',
  'Island',
  'New Zealand',
  'Neuseeland',
  'Singapore',
  'Singapur',
  'Malaysia',
  'Vietnam',
  'Philippines',
  'Philippinen',
  'Egypt',
  'Agypten',
  'Morocco',
  'Marokko',
  'South Africa',
  'Sudafrika',
  'Kenya',
  'Kenia',
  'Argentina',
  'Argentinien',
  'Chile',
  'Colombia',
  'Kolumbien',
  'Peru',
  'Russia',
  'Russland',
  'United Arab Emirates',
  'UAE',
  'Vereinigte Arabische Emirate',
  'Israel',
  'Jordan',
  'Jordanien',
  'Taiwan',
  'Hong Kong',
  'Hongkong',
  'Cuba',
  'Kuba',
  'Costa Rica',
  'Panama',
  'Ecuador',
  'Bolivia',
  'Bolivien',
  'Uruguay',
  'Paraguay',
  'Luxembourg',
  'Luxemburg',
  'Malta',
  'Cyprus',
  'Zypern',
  'Estonia',
  'Estland',
  'Latvia',
  'Lettland',
  'Lithuania',
  'Litauen',
  'Slovakia',
  'Slowakei',
  'Slovenia',
  'Slowenien',
  'Bulgaria',
  'Bulgarien',
  'Serbia',
  'Serbien',
  'Montenegro',
  'Albania',
  'Albanien',
  'Sri Lanka',
  'Nepal',
  'Cambodia',
  'Kambodscha',
  'Laos',
  'Myanmar',
  'Mongolia',
  'Mongolei',
  'Saudi Arabia',
  'Saudi-Arabien',
  'Qatar',
  'Katar',
  'Oman',
  'Bahrain',
  'Kuwait',
  'Tanzania',
  'Tansania',
  'Ethiopia',
  'Athiopien',
  'Nigeria',
  'Ghana',
  'Tunisia',
  'Tunesien',
  'Dominican Republic',
  'Dominikanische Republik',
  'Jamaica',
  'Jamaika',
  'Ukraine',
  'Georgia',
  'Georgien',
  'Armenia',
  'Armenien',
  'Pakistan',
  'Bangladesh',
  'Bangladesch',
  'Senegal',
  'Mozambique',
  'Mosambik',
  'Moldova',
  'Moldawien',
  'Belarus',
  'Weissrussland',
]);

/**
 * Every country's name in every language TREK speaks, as the platform's ICU writes
 * it, lower-cased. The list above is English and German only, so an address ending
 * in "Maldives", "Österreich" or "Italia" counted the country as its city (#3200).
 * The TREK index writes its country with the same Intl names.
 */
const COUNTRY_NAMES: ReadonlySet<string> = (() => {
  const names = new Set<string>();
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const { locale } of SUPPORTED_LANGUAGES) {
    let display: Intl.DisplayNames;
    try {
      display = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
    } catch {
      continue;
    }
    for (const a of letters) {
      for (const b of letters) {
        const name = display.of(a + b);
        if (name) names.add(name.normalize('NFC').toLowerCase());
      }
    }
  }
  return names;
})();

/** Whether a part of an address names a country, in any language TREK speaks. */
export function isCountryName(part: string): boolean {
  return KNOWN_COUNTRIES.has(part) || COUNTRY_NAMES.has(part.trim().normalize('NFC').toLowerCase());
}
