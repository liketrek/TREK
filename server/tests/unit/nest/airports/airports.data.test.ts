/**
 * The bundled airport dataset — AIRPORT-DATA-001..010.
 *
 * These have no predecessor: the file lived in services/, outside the coverage
 * gate, so its scoring ladder was only ever exercised incidentally through the
 * e2e route. Moving it into src/nest made the gap visible.
 *
 * fs is stubbed with a four-airport fixture rather than reading the real
 * assets/airports.json, so the ranking assertions stay deterministic and the
 * missing-file branch is reachable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { readFileSync, existsSync } = vi.hoisted(() => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));
vi.mock('node:fs', () => ({ default: { readFileSync, existsSync }, readFileSync, existsSync }));

const FIXTURE = [
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', lat: 50, lng: 8.5, tz: 'Europe/Berlin' },
  { iata: 'FRO', icao: 'ENFL', name: 'Floro Airport', city: 'Floro', country: 'NO', lat: 61, lng: 5, tz: 'Europe/Oslo' },
  { iata: 'JFK', icao: 'KJFK', name: 'John F Kennedy International', city: 'New York', country: 'US', lat: 40, lng: -73, tz: 'America/New_York' },
  { iata: 'BER', icao: 'EDDB', name: 'Berlin Brandenburg', city: 'Berlin', country: 'DE', lat: 52, lng: 13, tz: 'Europe/Berlin' },
];

/** A fresh module registry per case: the dataset is cached after the first load. */
async function load(opts: { missing?: boolean; body?: string } = {}) {
  vi.resetModules();
  existsSync.mockReturnValue(!opts.missing);
  readFileSync.mockReturnValue(opts.body ?? JSON.stringify(FIXTURE));
  return import('../../../../src/nest/airports/airports.data');
}

beforeEach(() => vi.clearAllMocks());

describe('findByIata', () => {
  it('AIRPORT-DATA-001: finds an airport by its IATA code, case-insensitively', async () => {
    const { findByIata } = await load();
    expect(findByIata('fra')?.name).toBe('Frankfurt Airport');
    expect(findByIata('FRA')?.icao).toBe('EDDF');
  });

  it('AIRPORT-DATA-002: returns null for an unknown code', async () => {
    const { findByIata } = await load();
    expect(findByIata('ZZZ')).toBeNull();
  });

  it('AIRPORT-DATA-003: returns null for every code when the dataset file is missing', async () => {
    const { findByIata } = await load({ missing: true });
    expect(findByIata('FRA')).toBeNull();
  });
});

describe('searchAirports ranking', () => {
  it('AIRPORT-DATA-004: an exact three-letter IATA match short-circuits to that one airport', async () => {
    const { searchAirports } = await load();
    expect(searchAirports('JFK').map(a => a.iata)).toEqual(['JFK']);
  });

  it('AIRPORT-DATA-005: an exact ICAO match outranks a prefix match', async () => {
    const { searchAirports } = await load();
    // 'EDDF' is FRA's ICAO; nothing else starts with it.
    expect(searchAirports('EDDF')[0].iata).toBe('FRA');
  });

  it('AIRPORT-DATA-006: an IATA prefix outranks a city prefix', async () => {
    const { searchAirports } = await load();
    // 'FR' prefixes the IATA of FRA and FRO, and the city of Frankfurt.
    const iatas = searchAirports('FR').map(a => a.iata);
    expect(iatas.slice(0, 2).sort()).toEqual(['FRA', 'FRO']);
  });

  it('AIRPORT-DATA-007: a city prefix outranks a substring match', async () => {
    const { searchAirports } = await load();
    // 'Berlin' is BER's city (prefix) and appears inside its name too.
    expect(searchAirports('Berlin')[0].iata).toBe('BER');
  });

  it('AIRPORT-DATA-008: matches a name substring when nothing better applies', async () => {
    const { searchAirports } = await load();
    expect(searchAirports('Kennedy').map(a => a.iata)).toEqual(['JFK']);
  });

  it('AIRPORT-DATA-009: an empty or whitespace query returns nothing', async () => {
    const { searchAirports } = await load();
    expect(searchAirports('')).toEqual([]);
    expect(searchAirports('   ')).toEqual([]);
  });

  it('AIRPORT-DATA-010: honours the result limit', async () => {
    const { searchAirports } = await load();
    // Every fixture airport matches on country or name somewhere; cap it at one.
    expect(searchAirports('a', 1)).toHaveLength(1);
  });
});
