import { describe, it, expect } from 'vitest';
import { readChargingInfo } from '../../../src/nest/maps/maps.helpers';

/**
 * The tag reading that turns an Overpass answer into something a traveller can filter on.
 *
 * Pure, so it is tested on its own: no request, no cache, no service. The query already
 * asks for the whole tag set, and every one of these fields was being dropped on the way
 * through.
 */
describe('readChargingInfo', () => {
  // The query has always asked for `out center tags` and the projection has always
  // thrown these away. Nothing here costs an extra request.
  it('MAPS-CHARGE-001: reads the socket families, their count and their power', () => {
    expect(readChargingInfo({
      'socket:type2': '4',
      'socket:type2:output': '22 kW',
      'socket:ccs': '2',
      'socket:ccs:output': '150',
    })).toEqual({
      sockets: [
        { type: 'type2', count: 4, kw: 22 },
        { type: 'ccs', count: 2, kw: 150 },
      ],
      capacity: null,
      fee: null,
    });
  });

  it('MAPS-CHARGE-002: a socket that states nothing beyond its presence still counts', () => {
    // `socket:type2=yes` is common. The family is the useful part; the rest is unknown
    // rather than zero, and a filter has to be able to tell those apart.
    expect(readChargingInfo({ 'socket:type2': 'yes' })?.sockets).toEqual([
      { type: 'type2', count: null, kw: null },
    ]);
  });

  it('MAPS-CHARGE-003: free text power is read off the front, comma or not', () => {
    expect(readChargingInfo({ 'socket:type2': '1', 'socket:type2:output': '11kW' })?.sockets[0].kw).toBe(11);
    expect(readChargingInfo({ 'socket:type2': '1', 'socket:type2:output': '2,3 kW' })?.sockets[0].kw).toBe(2.3);
    expect(readChargingInfo({ 'socket:type2': '1', 'socket:type2:output': 'unknown' })?.sockets[0].kw).toBeNull();
  });

  it('MAPS-CHARGE-004: fee is three answers, not two', () => {
    expect(readChargingInfo({ fee: 'yes' })?.fee).toBe(true);
    expect(readChargingInfo({ fee: 'no' })?.fee).toBe(false);
    // Half the charging stations in OSM say nothing about it, and "not stated" is not
    // "free". A value nobody can act on is read as unknown; with a socket alongside it
    // the station still reports, it just does not claim a price.
    expect(readChargingInfo({ 'socket:type2': '2', fee: 'interval' })?.fee).toBeNull();
    // On its own it says nothing at all, so there is nothing to report.
    expect(readChargingInfo({ fee: 'interval' })).toBeNull();
  });

  it('MAPS-CHARGE-005: a station that says nothing at all is null, not an empty shell', () => {
    // So the client can tell "no data" from "no sockets" without inspecting three fields.
    expect(readChargingInfo({ amenity: 'charging_station', name: 'Ionity' })).toBeNull();
  });

  it('MAPS-CHARGE-006: a nonsense count is dropped rather than written through', () => {
    expect(readChargingInfo({ 'socket:type2': '0' })?.sockets[0].count).toBeNull();
    expect(readChargingInfo({ capacity: '-2' })).toBeNull();
  });
});
