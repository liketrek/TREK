/**
 * From a booked flight number to the callsign an aircraft transmits: the
 * spellings a traveller types, the ICAO form taken as it is, an airline code
 * borrowed from the airline field, and what cannot be told.
 */
import { airlineTable, toCallsign } from '../../../../src/nest/flight-live/flight-live.callsign';

import { describe, expect, it } from 'vitest';

const TABLE = new Map([
  ['LH', 'DLH'],
  ['U2', 'EZY'],
  ['4U', 'GWI'],
]);

describe('toCallsign', () => {
  it('FLCS-001: "LH 716", "LH0716", "lh716" and "LH-716" all fly as DLH716', () => {
    for (const booked of ['LH 716', 'LH0716', 'lh716', 'LH-716', ' LH 0716 ']) {
      expect(toCallsign(booked, null, TABLE)).toBe('DLH716');
    }
  });

  it('FLCS-002: codes with a digit map like any other, and a letter suffix stays', () => {
    expect(toCallsign('U2 1234', null, TABLE)).toBe('EZY1234');
    expect(toCallsign('4U9520', null, TABLE)).toBe('GWI9520');
    expect(toCallsign('LH 7A', null, TABLE)).toBe('DLH7A');
  });

  it('FLCS-003: a number already in ICAO form is taken as it is, its zeros trimmed', () => {
    expect(toCallsign('DLH716', null, TABLE)).toBe('DLH716');
    expect(toCallsign('BAW0012', null, TABLE)).toBe('BAW12');
    expect(toCallsign('EZY0', null, TABLE)).toBe('EZY0');
  });

  it('FLCS-004: a bare number borrows the airline code, never an airline name', () => {
    expect(toCallsign('716', 'LH', TABLE)).toBe('DLH716');
    expect(toCallsign('0716', 'dlh', TABLE)).toBe('DLH716');
    expect(toCallsign('716', 'Lufthansa', TABLE)).toBeNull();
    expect(toCallsign('716', 'XX', TABLE)).toBeNull();
    expect(toCallsign('716', null, TABLE)).toBeNull();
  });

  it('FLCS-005: an unknown code, an empty or odd number and no number at all answer null', () => {
    expect(toCallsign('XX 716', null, TABLE)).toBeNull();
    expect(toCallsign('', null, TABLE)).toBeNull();
    expect(toCallsign('   ', null, TABLE)).toBeNull();
    expect(toCallsign('LH 12345', null, TABLE)).toBeNull();
    expect(toCallsign('Lufthansa', null, TABLE)).toBeNull();
    expect(toCallsign(null, 'LH', TABLE)).toBeNull();
    expect(toCallsign(undefined, 'LH', TABLE)).toBeNull();
  });

  it('FLCS-006: the bundled table maps the big carriers, once read and then kept', () => {
    const table = airlineTable();
    expect(table.get('LH')).toBe('DLH');
    expect(table.get('BA')).toBe('BAW');
    expect(table.get('U2')).toBe('EZY');
    expect(airlineTable()).toBe(table);
    expect(toCallsign('LH 400')).toBe('DLH400');
  });
});
