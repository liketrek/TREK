/**
 * What the airports domain offers other domains without its service: the
 * bundled airport of an IATA code. The place search reads it to turn "JFK"
 * into the airport it names (maps/providers/osm-geocoding.ts), a lookup in
 * memory that needs neither the database nor the module.
 */
import { findByIata } from './airports.data';

/** An airport by name and coordinate, the part of it a lookup by code hands on. */
export interface AirportByCode {
  iata: string;
  name: string;
  lat: number;
  lng: number;
}

export function airportByCode(code: string): AirportByCode | null {
  const airport = findByIata(code);
  return airport ? { iata: airport.iata, name: airport.name, lat: airport.lat, lng: airport.lng } : null;
}
