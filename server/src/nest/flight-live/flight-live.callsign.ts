import { logWarn } from '../audit/audit-log.logger';

import fs from 'node:fs';
import path from 'node:path';

/**
 * From the flight number a traveller booked to the callsign the aircraft
 * transmits: "LH 716", "LH0716" and "lh716" all fly as DLH716.
 *
 * The IATA to ICAO table is server/assets/airlines-icao.json, built by
 * scripts/build-airlines.mjs from the VRS standing data (CC0); where IATA hands
 * one code to several airlines the one with the most recorded routes wins (the
 * script says why). Read once and kept, like the airports.
 */

let table: ReadonlyMap<string, string> | null = null;

/** The IATA airline code to ICAO callsign prefix table, empty when the asset is missing. */
export function airlineTable(): ReadonlyMap<string, string> {
  if (table) return table;
  const file = path.join(__dirname, '..', '..', '..', 'assets', 'airlines-icao.json');
  if (!fs.existsSync(file)) {
    logWarn('[flight-live] airlines-icao.json missing: run `node scripts/build-airlines.mjs`');
    table = new Map();
    return table;
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
  table = new Map(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  return table;
}

const ICAO_FORM = /^([A-Z]{3})(\d{1,4}[A-Z]?)$/;
/** Two characters with at least one letter, then the number: LH716, U21234, 4U9520. */
const IATA_FORM = /^([A-Z][A-Z0-9]|[0-9][A-Z])(\d{1,4}[A-Z]?)$/;
const NUMBER_ONLY = /^(\d{1,4}[A-Z]?)$/;

/** "0716" -> "716", "0007A" -> "7A", "0" stays "0". */
function trimNumber(number: string): string {
  return number.replace(/^0+(?=\d)/, '');
}

/** The ICAO prefix an airline field names, when it is a code at all ("LH", "DLH"); a name is not looked up. */
function prefixOfAirline(airline: string, airlines: ReadonlyMap<string, string>): string | null {
  const code = airline.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) return code;
  if (/^(?:[A-Z][A-Z0-9]|[0-9][A-Z])$/.test(code)) return airlines.get(code) ?? null;
  return null;
}

/**
 * The ICAO callsign of a booked flight, or null when it cannot be told.
 *
 * A number already in ICAO form (three letters and digits) is taken as it is.
 * A number without an airline code borrows one from `airline` when that holds
 * a code. Spaces and dashes are dropped and leading zeros of the number go,
 * as the transponder sends them.
 */
export function toCallsign(
  flightNumber: string | null | undefined,
  airline?: string | null,
  airlines: ReadonlyMap<string, string> = airlineTable(),
): string | null {
  if (typeof flightNumber !== 'string') return null;
  const compact = flightNumber.toUpperCase().replace(/[\s-]/g, '');
  if (!compact) return null;
  const icao = ICAO_FORM.exec(compact);
  if (icao) return icao[1] + trimNumber(icao[2]);
  const iata = IATA_FORM.exec(compact);
  if (iata) {
    const prefix = airlines.get(iata[1]);
    return prefix ? prefix + trimNumber(iata[2]) : null;
  }
  const bare = NUMBER_ONLY.exec(compact);
  if (bare && typeof airline === 'string') {
    const prefix = prefixOfAirline(airline, airlines);
    return prefix ? prefix + trimNumber(bare[1]) : null;
  }
  return null;
}
