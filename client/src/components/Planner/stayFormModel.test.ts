// FE-PLANNER-STAYFORM-001 to -008: the stay editor rules the desktop hotel picker
// and the phone accommodation sheet share.
import { describe, expect, it } from 'vitest';

import { buildDay, buildPlace } from '../../../tests/helpers/factories';
import type { Accommodation } from '../../types';
import {
  stayCheckoutDay,
  stayDayOptions,
  stayFormFrom,
  stayPlaceChoices,
  stayRangeFromEnd,
  stayRangeFromStart,
  stayRequestBody,
} from './stayFormModel';

const t = (key: string, params?: Record<string, string | number>) => (params ? `${key}:${params.n}` : key);
const DAYS = [{ id: 10 }, { id: 20 }, { id: 30 }];

describe('stayDayOptions', () => {
  it('FE-PLANNER-STAYFORM-001: a titled day keeps its number as the badge, a dated one its date', () => {
    const days = [
      buildDay({ id: 1, title: null, date: '2026-07-04' }),
      buildDay({ id: 2, title: 'Beach', date: null }),
      buildDay({ id: 3, title: null, date: null }),
    ];
    expect(stayDayOptions(days, t, 'en-US')).toEqual([
      { value: 1, label: 'planner.dayN:1', badge: 'Jul 4' },
      { value: 2, label: 'Beach', badge: 'planner.dayN:2' },
      { value: 3, label: 'planner.dayN:3', badge: undefined },
    ]);
  });
});

describe('stay ranges', () => {
  it('FE-PLANNER-STAYFORM-002: a later first day pulls the end along, an earlier one leaves it', () => {
    expect(stayRangeFromStart(DAYS, { start: 10, end: 20 }, 30)).toEqual({ start: 30, end: 30 });
    expect(stayRangeFromStart(DAYS, { start: 20, end: 30 }, 10)).toEqual({ start: 10, end: 30 });
    expect(stayRangeFromStart(DAYS, { start: undefined, end: undefined }, 20)).toEqual({ start: 20, end: 20 });
  });

  it('FE-PLANNER-STAYFORM-003: an earlier last day pulls the start back, a later one leaves it', () => {
    expect(stayRangeFromEnd(DAYS, { start: 20, end: 30 }, 10)).toEqual({ start: 10, end: 10 });
    expect(stayRangeFromEnd(DAYS, { start: 10, end: 20 }, 30)).toEqual({ start: 10, end: 30 });
  });

  it('FE-PLANNER-STAYFORM-004: a new stay checks out the next day, if the trip has one', () => {
    expect(stayCheckoutDay(DAYS, 10)).toBe(20);
    expect(stayCheckoutDay(DAYS, 30)).toBeUndefined();
    expect(stayCheckoutDay(DAYS, 99)).toBeUndefined();
    expect(stayCheckoutDay(DAYS, undefined)).toBeUndefined();
  });
});

describe('stayFormFrom and stayRequestBody', () => {
  const acc = {
    check_in: '15:00',
    check_in_end: null,
    check_out: '10:00',
    confirmation: 'ABC',
    place_id: 7,
  } as Pick<Accommodation, 'check_in' | 'check_in_end' | 'check_out' | 'confirmation' | 'place_id'>;

  it('FE-PLANNER-STAYFORM-005: an existing stay fills the editor, empty fields as blanks', () => {
    expect(stayFormFrom(acc, null)).toEqual({
      check_in: '15:00',
      check_in_end: '',
      check_out: '10:00',
      confirmation: 'ABC',
      place_id: 7,
    });
    expect(stayFormFrom({ ...acc, place_id: null }, '').place_id).toBe('');
    expect(stayFormFrom({ ...acc, place_id: undefined }, null).place_id).toBeNull();
  });

  it('FE-PLANNER-STAYFORM-006: the request sends the range and blank times and codes as null', () => {
    expect(
      stayRequestBody(
        { check_in: '', check_in_end: '22:00', check_out: '', confirmation: '', place_id: 7 },
        {
          start: 10,
          end: 20,
        }
      )
    ).toEqual({
      place_id: 7,
      start_day_id: 10,
      end_day_id: 20,
      check_in: null,
      check_in_end: '22:00',
      check_out: null,
      confirmation: null,
    });
  });
});

describe('stayPlaceChoices', () => {
  const hotel = buildPlace({ id: 1, category_id: 2 });
  const museum = buildPlace({ id: 2, category_id: 3 });
  const track = buildPlace({ id: 3, category_id: 2, route_geometry: 'abc' });

  it('FE-PLANNER-STAYFORM-007: a track is never a place to stay, unless it is the one already picked', () => {
    expect(stayPlaceChoices([hotel, museum, track], null, null).map((p) => p.id)).toEqual([1, 2]);
    expect(stayPlaceChoices([hotel, museum, track], 3, null).map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('FE-PLANNER-STAYFORM-008: a chosen category narrows the choice', () => {
    expect(stayPlaceChoices([hotel, museum, track], 3, 2).map((p) => p.id)).toEqual([1, 3]);
  });
});
