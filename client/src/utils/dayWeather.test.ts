// FE-UTIL-DAYWEATHER-001 to -005: the day-local weather anchor the desktop day
// plan, the desktop day panel, the phone timeline and the phone day sheet read.
import { describe, expect, it, vi } from 'vitest';

import { buildAssignment, buildPlace } from '../../tests/helpers/factories';
import { dayWeatherAnchor, hasWeatherCoords } from './dayWeather';

const HOTEL = { place_lat: 46.2, place_lng: 7.1, place_name: 'Hotel Alpina' };
const stop = (lat: number | null, lng: number | null, name = 'Stop') =>
  buildAssignment({ place: buildPlace({ lat, lng, name }) });

describe('dayWeatherAnchor', () => {
  it('FE-UTIL-DAYWEATHER-001: the first stop with coordinates wins and the hotel is never looked up', () => {
    const wakeUpHotel = vi.fn(() => HOTEL);
    const anchor = dayWeatherAnchor(
      [stop(null, null, 'Unlocated'), stop(48.1, 11.5, 'Museum'), stop(1, 2)],
      wakeUpHotel
    );
    expect(anchor).toEqual({ lat: 48.1, lng: 11.5, name: 'Museum' });
    expect(wakeUpHotel).not.toHaveBeenCalled();
  });

  it('FE-UTIL-DAYWEATHER-002: without a located stop the hotel you wake up in stands in', () => {
    expect(dayWeatherAnchor([stop(null, 3)], () => HOTEL)).toEqual({ lat: 46.2, lng: 7.1, name: 'Hotel Alpina' });
    expect(dayWeatherAnchor([], () => ({ place_lat: 1, place_lng: 2, place_name: null }))).toEqual({
      lat: 1,
      lng: 2,
      name: null,
    });
  });

  it('FE-UTIL-DAYWEATHER-003: neither a stop nor a hotel leaves the day without an anchor', () => {
    expect(dayWeatherAnchor([stop(null, null)], () => undefined)).toEqual({ lat: null, lng: null, name: null });
  });

  it('FE-UTIL-DAYWEATHER-004: by default a zero coordinate does not count as located', () => {
    expect(hasWeatherCoords(stop(0, 9))).toBe(false);
    expect(hasWeatherCoords(stop(9, 9))).toBe(true);
    expect(hasWeatherCoords(buildAssignment({ place: undefined as never }))).toBe(false);
    expect(dayWeatherAnchor([stop(0, 9, 'Equator'), stop(5, 6, 'Inland')], () => HOTEL).name).toBe('Inland');
  });

  it('FE-UTIL-DAYWEATHER-005: the phone timeline counts any set coordinate, zero included', () => {
    const anyCoords = (a: ReturnType<typeof stop>) => a.place?.lat != null && a.place?.lng != null;
    expect(dayWeatherAnchor([stop(0, 9, 'Equator'), stop(5, 6, 'Inland')], () => HOTEL, anyCoords)).toEqual({
      lat: 0,
      lng: 9,
      name: 'Equator',
    });
  });
});
