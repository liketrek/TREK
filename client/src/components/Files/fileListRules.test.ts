// FE-FILES-LIST-001 to FE-FILES-LIST-012: the filter tabs and the link list the desktop file
// manager and the phone's files tab share, with the type and id reading each view keeps.
import { describe, expect, it } from 'vitest';

import { buildPlace, buildReservation, buildTripFile } from '../../../tests/helpers/factories';
import {
  DESKTOP_FILE_LINK_LIST_RULES,
  PHONE_FILE_FILTER_RULES,
  getFileTypeCategory,
  linkedFileIds,
  linkedFileTargets,
  matchesFileFilter,
} from './fileListRules';

const TRANSPORT = new Set(['flight', 'train']);

describe('getFileTypeCategory', () => {
  it('FE-FILES-LIST-001: a pass wins over its mime type, video counts as image, sheets are xls', () => {
    expect(getFileTypeCategory({ mime_type: 'application/pdf', original_name: 'ticket.pkpass' })).toBe('pass');
    expect(getFileTypeCategory({ mime_type: 'application/pdf', original_name: 'a.pdf' })).toBe('pdf');
    expect(getFileTypeCategory({ mime_type: 'video/mp4', original_name: 'a.mp4' })).toBe('image');
    expect(getFileTypeCategory({ mime_type: 'text/csv', original_name: 'export' })).toBe('xls');
    expect(getFileTypeCategory({ mime_type: 'application/zip', original_name: 'a.zip' })).toBe('other');
  });
});

describe('matchesFileFilter', () => {
  const pdf = buildTripFile({ mime_type: 'application/pdf', original_name: 'a.pdf' });
  const passAsPdf = buildTripFile({ mime_type: 'application/pdf', original_name: 'ticket.pkpass' });
  const photo = buildTripFile({ mime_type: 'image/jpeg', original_name: 'a.jpg' });
  const video = buildTripFile({ mime_type: 'video/mp4', original_name: 'a.mp4' });
  const word = buildTripFile({ mime_type: 'application/msword', original_name: 'a.doc' });
  const text = buildTripFile({ mime_type: 'text/plain', original_name: 'a.txt' });
  const zip = buildTripFile({ mime_type: 'application/zip', original_name: 'a.zip' });
  const all = [pdf, passAsPdf, photo, video, word, text, zip];
  const ids = (filter: string, rules?: typeof PHONE_FILE_FILTER_RULES) =>
    all.filter((f) => matchesFileFilter(f, filter, rules)).map((f) => f.id);

  it('FE-FILES-LIST-002: desktop reads the mime type for pdf, image and doc', () => {
    expect(ids('pdf')).toEqual([pdf.id, passAsPdf.id]);
    expect(ids('image')).toEqual([photo.id]);
    expect(ids('doc')).toEqual([word.id, text.id]);
  });

  it('FE-FILES-LIST-003: the phone partitions by type category', () => {
    expect(ids('pdf', PHONE_FILE_FILTER_RULES)).toEqual([pdf.id]);
    expect(ids('image', PHONE_FILE_FILTER_RULES)).toEqual([photo.id, video.id]);
    expect(ids('doc', PHONE_FILE_FILTER_RULES)).toEqual([passAsPdf.id, word.id, text.id, zip.id]);
  });

  it('FE-FILES-LIST-004: all and an unknown filter show everything in both views', () => {
    for (const rules of [undefined, PHONE_FILE_FILTER_RULES]) {
      expect(ids('all', rules)).toEqual(all.map((f) => f.id));
      expect(ids('bogus', rules)).toEqual(all.map((f) => f.id));
    }
  });

  it('FE-FILES-LIST-005: starred follows the flag in both views', () => {
    for (const rules of [undefined, PHONE_FILE_FILTER_RULES]) {
      expect(matchesFileFilter(buildTripFile({ starred: 1 }), 'starred', rules)).toBe(true);
      expect(matchesFileFilter(buildTripFile({ starred: 0 }), 'starred', rules)).toBe(false);
    }
  });

  it('FE-FILES-LIST-006: a note id of 0 is collab on the phone only', () => {
    const zeroNote = buildTripFile({ note_id: 0 });
    expect(matchesFileFilter(zeroNote, 'collab')).toBe(false);
    expect(matchesFileFilter(zeroNote, 'collab', PHONE_FILE_FILTER_RULES)).toBe(true);
    for (const rules of [undefined, PHONE_FILE_FILTER_RULES]) {
      expect(matchesFileFilter(buildTripFile({ note_id: 4 }), 'collab', rules)).toBe(true);
      expect(matchesFileFilter(buildTripFile({ note_id: null }), 'collab', rules)).toBe(false);
    }
  });
});

describe('linkedFileTargets', () => {
  const zeroPlace = buildPlace({ id: 0, name: 'Zero' });
  const louvre = buildPlace({ id: 1, name: 'Louvre' });
  const orsay = buildPlace({ id: 2, name: 'Orsay' });
  const flight = buildReservation({ id: 10, type: 'flight', title: 'LH 123' });
  const hotel = buildReservation({ id: 11, type: 'hotel', title: 'Hotel' });
  const places = [zeroPlace, louvre, orsay];
  const reservations = [flight, hotel];

  it('FE-FILES-LIST-007: own column first, then each extra link once, unknown ids left out', () => {
    const file = buildTripFile({
      place_id: 2,
      linked_place_ids: [1, 2, 99],
      reservation_id: 11,
      linked_reservation_ids: [10, 11],
    });
    for (const rules of [undefined, DESKTOP_FILE_LINK_LIST_RULES]) {
      const linked = linkedFileTargets(file, places, reservations, TRANSPORT, rules);
      expect(linked.places).toEqual([orsay, louvre]);
      expect(linked.reservations).toEqual([
        { reservation: hotel, transport: false },
        { reservation: flight, transport: true },
      ]);
    }
  });

  it('FE-FILES-LIST-008: an own column of 0 counts on the phone and not on desktop', () => {
    const file = buildTripFile({ place_id: 0, linked_place_ids: [], reservation_id: null });
    expect(linkedFileTargets(file, places, reservations, TRANSPORT).places).toEqual([zeroPlace]);
    expect(linkedFileTargets(file, places, reservations, TRANSPORT, DESKTOP_FILE_LINK_LIST_RULES).places).toEqual([]);
  });

  it('FE-FILES-LIST-009: null entries in the extra links are skipped', () => {
    const file = buildTripFile({
      place_id: null,
      linked_place_ids: [null as unknown as number, 1],
      reservation_id: null,
      linked_reservation_ids: [null as unknown as number],
    });
    const linked = linkedFileTargets(file, places, reservations, TRANSPORT, DESKTOP_FILE_LINK_LIST_RULES);
    expect(linked.places).toEqual([louvre]);
    expect(linked.reservations).toEqual([]);
  });

  it('FE-FILES-LIST-010: missing place and booking lists give empty links', () => {
    const file = buildTripFile({ place_id: 1, reservation_id: 10 });
    expect(linkedFileTargets(file, undefined, undefined, TRANSPORT)).toEqual({ places: [], reservations: [] });
  });

  it('FE-FILES-LIST-011: a booking column of 0 counts on the phone and not on desktop', () => {
    const zeroBooking = buildReservation({ id: 0, type: 'hotel', title: 'Zero' });
    const file = buildTripFile({ place_id: null, reservation_id: 0, linked_reservation_ids: [] });
    expect(linkedFileTargets(file, places, [zeroBooking], TRANSPORT).reservations).toEqual([
      { reservation: zeroBooking, transport: false },
    ]);
    expect(
      linkedFileTargets(file, places, [zeroBooking], TRANSPORT, DESKTOP_FILE_LINK_LIST_RULES).reservations
    ).toEqual([]);
  });
});

describe('linkedFileIds', () => {
  it('FE-FILES-LIST-012: own column first, extras once, nulls skipped, 0 kept only on the phone', () => {
    const file = buildTripFile({
      place_id: 0,
      linked_place_ids: [2, null as unknown as number, 0, 2],
      reservation_id: 11,
      linked_reservation_ids: [10, 11],
    });
    expect(linkedFileIds(file, 'place_id')).toEqual([0, 2]);
    expect(linkedFileIds(file, 'place_id', DESKTOP_FILE_LINK_LIST_RULES)).toEqual([2, 0]);
    expect(linkedFileIds(file, 'reservation_id')).toEqual([11, 10]);
    expect(linkedFileIds(file, 'reservation_id', DESKTOP_FILE_LINK_LIST_RULES)).toEqual([11, 10]);
    const empty = buildTripFile({ place_id: null, linked_place_ids: undefined });
    expect(linkedFileIds(empty, 'place_id')).toEqual([]);
  });
});
