/** The issuer of installation keys: the Places host itself, so no new egress domain is needed. */
export const SERVICE_ISSUER_ORIGIN = 'https://places.liketrek.com';

/** The TREK services' Photon, the address search that stands in for the public Nominatim. */
export const PHOTON_ORIGIN = 'https://photon.liketrek.com';

/** The Nominatim TREK asks when NOMINATIM_URL names none of the admin's own. */
export const PUBLIC_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
