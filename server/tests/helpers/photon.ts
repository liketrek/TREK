import { deriveServices } from '../../src/app-config/boot-derive';
import { PhotonClient } from '../../src/nest/maps/providers/photon.client';
import { ServiceIdentityPort } from '../../src/nest/service-identity/service-identity.interface';

/** Photon with the TREK services off, so an OsmClient built by hand asks Nominatim as it always did. */
export function photonOff(): PhotonClient {
  return new PhotonClient(deriveServices({ TREK_SERVICES: 'off' }));
}

/**
 * The installation identity as the service-identity module hands it out, with
 * a key to send or none, and the status of every answer it was shown.
 */
export class FakeServiceIdentity extends ServiceIdentityPort {
  bearer: string | null = 'tk1.kid.payload.signature';
  readonly observed: { host: string; status: number }[] = [];

  headersFor(): Record<string, string> {
    const headers: Record<string, string> = { 'User-Agent': 'TREK/test' };
    if (this.bearer) headers.Authorization = `Bearer ${this.bearer}`;
    return headers;
  }

  observe(url: URL, response: Response): void {
    this.observed.push({ host: url.hostname, status: response.status });
  }
}

/** The Brandenburg Gate as Photon answers a search for it. */
export function gateFeature(properties: Record<string, unknown> = {}) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [13.3777, 52.5163] },
    properties: {
      osm_type: 'W',
      osm_id: 518071791,
      osm_key: 'tourism',
      osm_value: 'attraction',
      type: 'house',
      name: 'Brandenburger Tor',
      street: 'Pariser Platz',
      postcode: '10117',
      district: 'Mitte',
      city: 'Berlin',
      state: 'Berlin',
      country: 'Deutschland',
      countrycode: 'DE',
      extra: { wikidata: 'Q82425', wikipedia: 'de:Brandenburger Tor' },
      ...properties,
    },
  };
}

/** A Photon answer over the given features, as the service sends it. */
export function photonAnswer(features: unknown[], status = 200): Response {
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
