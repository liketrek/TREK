import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { AirportsController } from '../../../src/nest/airports/airports.controller';
import type { AirportsService } from '../../../src/nest/airports/airports.service';
import type { Airport } from '@trek/shared';

function makeController(svc: Partial<AirportsService>) {
  return new AirportsController(svc as AirportsService);
}

const BER: Airport = {
  iata: 'BER', icao: 'EDDB', name: 'Berlin Brandenburg', city: 'Berlin',
  country: 'DE', lat: 52.36, lng: 13.5, tz: 'Europe/Berlin',
};

/** Run `fn`, expecting an HttpException; return its { status, body }. */
function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('AirportsController (parity with the legacy /api/airports route)', () => {
  describe('GET /api/airports/search', () => {
    it('returns [] without calling the service when the query is absent', () => {
      const search = vi.fn();
      const res = makeController({ search }).search(undefined);
      expect(res).toEqual([]);
      expect(search).not.toHaveBeenCalled();
    });

    it('returns [] for an empty query', () => {
      const search = vi.fn();
      expect(makeController({ search }).search('')).toEqual([]);
      expect(search).not.toHaveBeenCalled();
    });

    it('returns [] when the query arrives as an array (Express typeof guard)', () => {
      const search = vi.fn();
      expect(makeController({ search }).search(['a', 'b'])).toEqual([]);
      expect(search).not.toHaveBeenCalled();
    });

    it('delegates a non-empty query to the service and returns its result', () => {
      const search = vi.fn().mockReturnValue([BER]);
      const res = makeController({ search }).search('ber');
      expect(res).toEqual([BER]);
      expect(search).toHaveBeenCalledWith('ber');
    });
  });

  describe('GET /api/airports/:iata', () => {
    it('returns the airport when found', () => {
      const findByIata = vi.fn().mockReturnValue(BER);
      expect(makeController({ findByIata }).findByIata('BER')).toEqual(BER);
      expect(findByIata).toHaveBeenCalledWith('BER');
    });

    it('404 { error } with the exact legacy message when not found', () => {
      const findByIata = vi.fn().mockReturnValue(null);
      expect(thrown(() => makeController({ findByIata }).findByIata('ZZZ'))).toEqual({
        status: 404,
        body: { error: 'Airport not found' },
      });
    });
  });
});
