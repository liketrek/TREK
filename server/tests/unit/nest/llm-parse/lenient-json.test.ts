import { describe, it, expect } from 'vitest';

import { parseLenientJson } from '../../../../src/nest/llm-parse/lenient-json';

describe('parseLenientJson', () => {
  it('parses strict JSON', () => {
    expect(parseLenientJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' });
  });

  it('strips a ```json code fence', () => {
    expect(parseLenientJson('```json\n[{"@type":"FlightReservation"}]\n```')).toEqual([
      { '@type': 'FlightReservation' },
    ]);
  });

  it('parses single-quoted, unquoted-key, trailing-comma output (Gemini, #1638)', () => {
    const gemini = `[
      {
        '@type': 'LodgingReservation',
        checkinTime: '2026-08-28T00:00:00',
        checkoutTime: '2026-08-30T11:00:00',
        price: 146.25,
        priceCurrency: 'EUR',
      }
    ]`;
    expect(parseLenientJson(gemini)).toEqual([
      {
        '@type': 'LodgingReservation',
        checkinTime: '2026-08-28T00:00:00',
        checkoutTime: '2026-08-30T11:00:00',
        price: 146.25,
        priceCurrency: 'EUR',
      },
    ]);
  });

  it('parses a code-fenced non-strict object', () => {
    expect(parseLenientJson("```\n{ reservations: [{ '@type': 'TrainReservation' }] }\n```")).toEqual({
      reservations: [{ '@type': 'TrainReservation' }],
    });
  });

  it('returns null on empty or truly unparseable input', () => {
    expect(parseLenientJson('')).toBeNull();
    expect(parseLenientJson(null)).toBeNull();
    expect(parseLenientJson(undefined)).toBeNull();
    expect(parseLenientJson('this is prose, not json')).toBeNull();
  });
});
