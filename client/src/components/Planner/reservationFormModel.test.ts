// FE-PLANNER-RESFORM-001 to -014: the booking form both the desktop ReservationModal
// and the phone's booking sheet save through.
import { describe, expect, it } from 'vitest';

import { buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories';
import type { Accommodation, Reservation } from '../../types';
import type { BookingReviewDraft } from './parsedItemToDraft';
import {
  RESERVATION_TYPE_OPTIONS,
  type ReservationFields,
  isEndBeforeStart,
  reservationFieldsFrom,
  reservationFieldsFromPrefill,
  reservationSaveData,
  splitEndTime,
  startParts,
  tripDateBounds,
  withHotelEnd,
  withHotelPlace,
  withHotelStart,
  withLinkedPlace,
  withLinkedStopDay,
  withStartDate,
  withStartTime,
} from './reservationFormModel';

const days = [
  buildDay({ id: 1, date: '2026-07-03' }),
  buildDay({ id: 2, date: '2026-07-01' }),
  buildDay({ id: 3, date: '2026-07-02' }),
];

const EMPTY: ReservationFields = {
  title: '',
  type: 'other',
  status: 'pending',
  reservation_time: '',
  reservation_end_time: '',
  end_date: '',
  location: '',
  confirmation_number: '',
  notes: '',
  url: '',
  place_id: '',
  accommodation_id: '',
  meta_check_in_time: '',
  meta_check_out_time: '',
  hotel_place_id: '',
  hotel_start_day: '',
  hotel_end_day: '',
  hotel_address: '',
};

describe('reservation form fields', () => {
  it('FE-PLANNER-RESFORM-001: the type picker offers the six booking types, hotel first', () => {
    expect(RESERVATION_TYPE_OPTIONS.map((o) => o.value)).toEqual([
      'hotel',
      'restaurant',
      'event',
      'tour',
      'parking',
      'other',
    ]);
  });

  it('FE-PLANNER-RESFORM-002: a stored end splits into its date and its time', () => {
    expect(splitEndTime('2026-07-02T18:30:00')).toEqual({ endDate: '2026-07-02', endTime: '18:30' });
    expect(splitEndTime('2026-07-02')).toEqual({ endDate: '2026-07-02', endTime: '' });
    expect(splitEndTime('18:30')).toEqual({ endDate: '', endTime: '18:30' });
    expect(splitEndTime('')).toEqual({ endDate: '', endTime: '' });
  });

  it('FE-PLANNER-RESFORM-003: a saved hotel booking reads its stay; only the desktop keeps the check-in window', () => {
    const acc = { id: 9, place_id: 4, start_day_id: 2, end_day_id: 3 } as Accommodation;
    const res = buildReservation({
      type: 'hotel',
      status: 'confirmed',
      reservation_time: '2026-07-01T15:00:00',
      reservation_end_time: '2026-07-02T11:00',
      accommodation_id: 9,
      location: 'Typed street',
      url: 'https://h.test',
      metadata: JSON.stringify({ check_in_time: '15:00', check_in_end_time: '22:00', check_out_time: '11:00' }),
    } as Partial<Reservation>);
    const places = [buildPlace({ id: 4, address: 'Hotel street 1' })];
    const desktop = reservationFieldsFrom(res, [acc], places, true);
    expect(desktop).toMatchObject({
      type: 'hotel',
      status: 'confirmed',
      reservation_time: '2026-07-01T15:00',
      reservation_end_time: '11:00',
      end_date: '2026-07-02',
      url: 'https://h.test',
      accommodation_id: 9,
      meta_check_in_time: '15:00',
      meta_check_in_end_time: '22:00',
      meta_check_out_time: '11:00',
      hotel_place_id: 4,
      hotel_start_day: 2,
      hotel_end_day: 3,
      hotel_address: 'Hotel street 1',
    });
    const phone = reservationFieldsFrom(res, [acc], places, false);
    expect(phone).not.toHaveProperty('meta_check_in_end_time');
    expect(reservationFieldsFrom(res, [acc], [], false).hotel_address).toBe('Typed street');
    expect(reservationFieldsFrom(buildReservation({ type: undefined }), [], [], false)).toMatchObject({
      type: 'other',
      hotel_place_id: '',
      place_id: '',
    });
  });

  it('FE-PLANNER-RESFORM-004: an import under review resolves its stay days and keeps its source details', () => {
    const pf = {
      title: 'Inn',
      type: 'hotel',
      reservation_time: '2026-07-01T14:00:00',
      reservation_end_time: '2026-07-02',
      metadata: { check_in_time: '14:00', check_in_end_time: '20:00' },
      url: 'https://inn.test',
      _accommodation: { check_in: '2026-07-01', check_out: '2026-07-03' },
      _venue: { name: 'Inn', address: 'Lane 2' },
    } as unknown as BookingReviewDraft;
    expect(reservationFieldsFromPrefill(pf, days, true)).toEqual({
      title: 'Inn',
      type: 'hotel',
      status: 'pending',
      reservation_time: '2026-07-01T14:00',
      reservation_end_time: '',
      end_date: '2026-07-02',
      location: '',
      confirmation_number: '',
      notes: '',
      url: 'https://inn.test',
      meta_check_in_time: '14:00',
      meta_check_in_end_time: '20:00',
      meta_check_out_time: '',
      hotel_start_day: 2,
      hotel_end_day: 1,
      hotel_address: 'Lane 2',
    });
    const bare = reservationFieldsFromPrefill({ metadata: null } as BookingReviewDraft, days, false);
    expect(bare).toMatchObject({ type: 'other', reservation_time: '', hotel_start_day: '', hotel_address: '' });
    expect(bare).not.toHaveProperty('meta_check_in_end_time');
  });
});

describe('reservation dates', () => {
  const form = (patch: Partial<ReservationFields>) => ({ ...EMPTY, ...patch });

  it('FE-PLANNER-RESFORM-005: an end before the start blocks; an all-day end on the start day does not (#2107)', () => {
    expect(
      isEndBeforeStart(
        form({ reservation_time: '2026-07-02T10:00', end_date: '2026-07-02', reservation_end_time: '09:00' })
      )
    ).toBe(true);
    expect(
      isEndBeforeStart(
        form({ reservation_time: '2026-07-02T10:00', end_date: '2026-07-02', reservation_end_time: '10:00' })
      )
    ).toBe(true);
    expect(
      isEndBeforeStart(
        form({ reservation_time: '2026-07-02T10:00', end_date: '2026-07-02', reservation_end_time: '11:00' })
      )
    ).toBe(false);
    expect(
      isEndBeforeStart(form({ reservation_time: '2026-07-02', end_date: '2026-07-02', reservation_end_time: '09:00' }))
    ).toBe(false);
    expect(isEndBeforeStart(form({ reservation_time: '2026-07-02T10:00', end_date: '2026-07-01' }))).toBe(true);
    expect(isEndBeforeStart(form({ type: 'hotel', reservation_time: '2026-07-02', end_date: '2026-07-01' }))).toBe(
      false
    );
    expect(isEndBeforeStart(form({ end_date: '2026-07-01' }))).toBe(false);
  });

  it('FE-PLANNER-RESFORM-006: the start is edited as a date and a time', () => {
    expect(startParts('2026-07-02T10:00')).toEqual({ date: '2026-07-02', time: '10:00' });
    expect(startParts('')).toEqual({ date: '', time: '' });
    expect(withStartDate('2026-07-02T10:00', '2026-07-03')).toBe('2026-07-03T10:00');
    expect(withStartDate('2026-07-02', '2026-07-03')).toBe('2026-07-03');
    expect(withStartDate('2026-07-02T10:00', '')).toBe('');
    expect(withStartDate('2026-07-02T10:00', null)).toBe('');
    expect(withStartTime('2026-07-02', '09:15', '2026-01-01')).toBe('2026-07-02T09:15');
    expect(withStartTime('', '09:15', '2026-01-01')).toBe('2026-01-01T09:15');
    expect(withStartTime('2026-07-02T09:15', '', '2026-01-01')).toBe('2026-07-02');
    expect(withStartTime('', '09:15', '')).toBe('T09:15');
  });

  it('FE-PLANNER-RESFORM-007: the pickers are bounded by the earliest and latest dated day', () => {
    expect(tripDateBounds(days)).toEqual({ min: '2026-07-01', max: '2026-07-03' });
    expect(tripDateBounds([{ date: null }] as { date: string }[])).toEqual({ min: undefined, max: undefined });
  });

  it('FE-PLANNER-RESFORM-008: linking a stop dates only an undated booking', () => {
    const undated = form({});
    expect(withLinkedStopDay(undated, '2026-07-02').reservation_time).toBe('2026-07-02');
    const dated = form({ reservation_time: '2026-07-03' });
    expect(withLinkedStopDay(dated, '2026-07-02')).toBe(dated);
  });
});

describe('reservation place and stay picks', () => {
  const places = [
    buildPlace({ id: 1, name: 'Museum', address: 'Museum road' }),
    buildPlace({ id: 2, name: 'Bare', address: null }),
  ];

  it('FE-PLANNER-RESFORM-009: a linked place fills a missing title and address only', () => {
    expect(withLinkedPlace(EMPTY, 1, places)).toMatchObject({ place_id: 1, title: 'Museum', location: 'Museum road' });
    const typed = { ...EMPTY, title: 'Mine', location: 'Here' };
    expect(withLinkedPlace(typed, 1, places)).toMatchObject({ place_id: 1, title: 'Mine', location: 'Here' });
    expect(withLinkedPlace(EMPTY, 2, places)).toMatchObject({ place_id: 2, title: 'Bare', location: '' });
    expect(withLinkedPlace({ ...EMPTY, place_id: 1 }, '', places)).toMatchObject({ place_id: '', title: '' });
  });

  it('FE-PLANNER-RESFORM-010: a picked hotel shows its address and keeps a typed one when it has none', () => {
    expect(withHotelPlace(EMPTY, 1, places)).toMatchObject({
      hotel_place_id: 1,
      title: 'Museum',
      hotel_address: 'Museum road',
    });
    const typed = { ...EMPTY, title: 'Stay', hotel_address: 'Typed' };
    expect(withHotelPlace(typed, 1, places)).toMatchObject({ title: 'Stay', hotel_address: 'Museum road' });
    expect(withHotelPlace(typed, 2, places)).toMatchObject({ hotel_place_id: 2, hotel_address: 'Typed' });
  });

  it('FE-PLANNER-RESFORM-011: the stay range never ends before it starts', () => {
    const order = [{ id: 10 }, { id: 11 }, { id: 12 }];
    const stay = { ...EMPTY, hotel_start_day: 10, hotel_end_day: 11 };
    expect(withHotelStart(stay, 12, order)).toMatchObject({ hotel_start_day: 12, hotel_end_day: 12 });
    expect(withHotelStart(stay, 11, order)).toMatchObject({ hotel_start_day: 11, hotel_end_day: 11 });
    expect(withHotelStart({ ...stay, hotel_end_day: 12 }, 11, order)).toMatchObject({ hotel_end_day: 12 });
    expect(withHotelEnd({ ...stay, hotel_start_day: 12 }, 11, order)).toMatchObject({
      hotel_start_day: 11,
      hotel_end_day: 11,
    });
    expect(withHotelEnd(stay, 12, order)).toMatchObject({ hotel_start_day: 10, hotel_end_day: 12 });
  });
});

describe('reservationSaveData', () => {
  it('FE-PLANNER-RESFORM-012: a booking sends its times, links and an empty metadata object; an edit leaves the endpoints alone', () => {
    const form = {
      ...EMPTY,
      title: 'Dinner',
      type: 'restaurant',
      reservation_time: '2026-07-02T19:00',
      reservation_end_time: '21:00',
      location: 'Old town',
      place_id: 4,
      url: 'u',
    };
    expect(reservationSaveData(form, { assignmentId: 7, isEdit: false, withCheckInEnd: true })).toEqual({
      title: 'Dinner',
      type: 'restaurant',
      status: 'pending',
      reservation_time: '2026-07-02T19:00',
      reservation_end_time: '2026-07-02T21:00',
      location: 'Old town',
      confirmation_number: '',
      notes: '',
      url: 'u',
      assignment_id: 7,
      accommodation_id: null,
      place_id: 4,
      metadata: {},
      endpoints: [],
      needs_review: false,
    });
    const edit = reservationSaveData(
      { ...form, end_date: '2026-07-03' },
      { assignmentId: '', isEdit: true, withCheckInEnd: false }
    );
    expect(edit).not.toHaveProperty('endpoints');
    expect(edit).toMatchObject({ assignment_id: null, reservation_end_time: '2026-07-03T21:00' });
    expect(
      reservationSaveData(
        { ...form, reservation_end_time: '', end_date: '2026-07-03' },
        { assignmentId: '', isEdit: true, withCheckInEnd: false }
      ).reservation_end_time
    ).toBe('2026-07-03');
    expect(
      reservationSaveData(
        { ...form, reservation_time: '', reservation_end_time: '' },
        { assignmentId: '', isEdit: true, withCheckInEnd: false }
      )
    ).toMatchObject({
      reservation_time: null,
      reservation_end_time: null,
    });
  });

  it('FE-PLANNER-RESFORM-013: a hotel sends its address, its stay and the check-in window only from the desktop', () => {
    const hotel = {
      ...EMPTY,
      title: 'Inn',
      type: 'hotel',
      reservation_time: '2026-07-01T10:00',
      location: 'ignored',
      hotel_address: 'Lane 2',
      hotel_start_day: 2,
      hotel_end_day: '',
      meta_check_in_time: '15:00',
      meta_check_in_end_time: '22:00',
      meta_check_out_time: '11:00',
      confirmation_number: 'C1',
    };
    const desktop = reservationSaveData(hotel, { assignmentId: 7, isEdit: false, withCheckInEnd: true });
    expect(desktop).toMatchObject({
      reservation_time: null,
      reservation_end_time: null,
      location: 'Lane 2',
      assignment_id: null,
      accommodation_id: null,
      place_id: null,
      metadata: { check_in_time: '15:00', check_in_end_time: '22:00', check_out_time: '11:00' },
    });
    expect(desktop.create_accommodation).toEqual({
      place_id: null,
      venue: { name: 'Inn', address: 'Lane 2' },
      address: 'Lane 2',
      start_day_id: 2,
      end_day_id: 2,
      check_in: '15:00',
      check_in_end: '22:00',
      check_out: '11:00',
      confirmation: 'C1',
    });
    const phone = reservationSaveData(hotel, { assignmentId: 7, isEdit: false, withCheckInEnd: false });
    expect(phone.metadata).toEqual({ check_in_time: '15:00', check_out_time: '11:00' });
    expect(phone.create_accommodation).not.toHaveProperty('check_in_end');
  });

  it('FE-PLANNER-RESFORM-014: a hotel with a picked place and a linked stay keeps both; one without days creates no stay', () => {
    const linked = reservationSaveData(
      { ...EMPTY, type: 'hotel', title: 'Inn', hotel_place_id: 4, accommodation_id: 9, hotel_end_day: 3 },
      { assignmentId: 7, isEdit: true, withCheckInEnd: true }
    );
    expect(linked).toMatchObject({ assignment_id: 7, accommodation_id: 9 });
    expect(linked.create_accommodation).toMatchObject({ place_id: 4, venue: null, start_day_id: 3, end_day_id: 3 });
    const noDays = reservationSaveData(
      { ...EMPTY, type: 'hotel' },
      { assignmentId: '', isEdit: true, withCheckInEnd: true }
    );
    expect(noDays).not.toHaveProperty('create_accommodation');
    expect(noDays.metadata).toEqual({});
  });
});
