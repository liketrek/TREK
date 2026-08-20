import { describe, it, expect } from 'vitest';

import { parseLenientJson, toReservationList } from '../../../../src/nest/llm-parse/lenient-json';

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

/**
 * The shapes a forced tool call actually comes back in (#1968).
 *
 * The tool declares `reservations` as an array and the call forces the tool, so
 * the answer should be an array and usually is. Anthropic sometimes serialises
 * its tool input as a JSON-encoded string instead, and the check that only
 * accepted arrays dropped those extractions silently: no error, no log, and an
 * import that reported "no reservations found" — indistinguishable from a
 * document that really had none. Because it depends on how the model serialises
 * that particular call, the same file imported fine one minute and empty the
 * next.
 */
describe('toReservationList', () => {
  const node = { '@type': 'LodgingReservation', reservationNumber: 'ABC123' };

  it('passes an array straight through, which is the ordinary case', () => {
    expect(toReservationList([node])).toEqual([node]);
  });

  it('unwraps the object shape the OpenAI-compatible path produces', () => {
    expect(toReservationList({ reservations: [node] })).toEqual([node]);
  });

  it('parses a stringified array', () => {
    expect(toReservationList(JSON.stringify([node]))).toEqual([node]);
  });

  it('parses a stringified object that wraps the list again', () => {
    expect(toReservationList(JSON.stringify({ reservations: [node] }))).toEqual([node]);
  });

  it('takes the relaxed JSON a model might emit inside that string', () => {
    expect(toReservationList("[{'@type': 'FlightReservation', flightNumber: 'LH400',}]"))
      .toEqual([{ '@type': 'FlightReservation', flightNumber: 'LH400' }]);
  });

  /*
   * The other half of the fix: it must not reach so far that prose starts
   * counting as a booking. Anything that is not a list after one unwrap is not
   * a list.
   */
  it('answers empty for something that is genuinely not a list', () => {
    expect(toReservationList(undefined)).toEqual([]);
    expect(toReservationList(null)).toEqual([]);
    expect(toReservationList('there are no reservations in this document')).toEqual([]);
    expect(toReservationList({ hotel: 'Grand' })).toEqual([]);
    expect(toReservationList(42)).toEqual([]);
  });

  it('does not unwrap twice, so a doubly-encoded string stays refused', () => {
    expect(toReservationList(JSON.stringify(JSON.stringify([node])))).toEqual([]);
  });

  it('keeps an empty list an empty list', () => {
    expect(toReservationList([])).toEqual([]);
    expect(toReservationList('{"reservations":[]}')).toEqual([]);
  });
});
