import { describe, it, expect } from 'vitest';
import { FileText, Image as ImageIcon, Ticket } from 'lucide-react';
import {
  FILE_FILTERS,
  buildFileLinkLabels,
  formatFileDate,
  getFileTypeCategory,
  getFileTypeMeta,
  matchesFileFilter,
  sortFilesStarredFirst,
  type FileFilterId,
} from '../../../../src/mobile/screens/trip/tabs/filesModel';
import { buildPlace, buildReservation, buildTripFile } from '../../../helpers/factories';
import type { TranslationFn, TripFile } from '../../../../src/types';

// FE-MOB-FILM-001 to FE-MOB-FILM-017

const t: TranslationFn = key => key;

describe('filesModel — type categorisation', () => {
  it('FE-MOB-FILM-001: detects wallet passes ahead of everything else', () => {
    expect(getFileTypeCategory({ mime_type: 'application/vnd.apple.pkpass', original_name: 'boardingpass' })).toBe('pass');
    // extension wins even when the browser sent a generic MIME
    expect(getFileTypeCategory({ mime_type: 'application/octet-stream', original_name: 'ticket.pkpass' })).toBe('pass');
  });

  it('FE-MOB-FILM-002: detects PDFs and media', () => {
    expect(getFileTypeCategory({ mime_type: 'application/pdf', original_name: 'invoice.pdf' })).toBe('pdf');
    expect(getFileTypeCategory({ mime_type: 'image/jpeg', original_name: 'beach.jpg' })).toBe('image');
    // video folds into the image bucket (#823) since both open in the lightbox
    expect(getFileTypeCategory({ mime_type: 'video/mp4', original_name: 'clip.mp4' })).toBe('image');
  });

  it('FE-MOB-FILM-003: detects spreadsheets by extension and by MIME', () => {
    expect(getFileTypeCategory({ mime_type: '', original_name: 'budget.xlsx' })).toBe('xls');
    expect(getFileTypeCategory({ mime_type: '', original_name: 'list.csv' })).toBe('xls');
    expect(getFileTypeCategory({ mime_type: '', original_name: 'sheet.ods' })).toBe('xls');
    expect(getFileTypeCategory({ mime_type: 'application/vnd.ms-excel', original_name: 'legacy' })).toBe('xls');
    expect(getFileTypeCategory({ mime_type: 'text/csv', original_name: 'export' })).toBe('xls');
    expect(getFileTypeCategory({ mime_type: 'application/vnd.oasis.opendocument.spreadsheet', original_name: 'x' })).toBe('xls');
  });

  it('FE-MOB-FILM-004: falls back to "other" for plain attachments', () => {
    expect(getFileTypeCategory({ mime_type: 'application/zip', original_name: 'trip.zip' })).toBe('other');
    expect(getFileTypeCategory({ mime_type: null, original_name: null })).toBe('other');
  });

  it('FE-MOB-FILM-005: getFileTypeMeta pairs the category with its tile icon, colour and caption', () => {
    expect(getFileTypeMeta({ mime_type: 'application/pdf', original_name: 'a.pdf' })).toEqual({
      category: 'pdf',
      icon: FileText,
      color: '#D6273B',
      label: 'PDF',
    });
    expect(getFileTypeMeta({ mime_type: 'image/png', original_name: 'a.png' }).icon).toBe(ImageIcon);
    expect(getFileTypeMeta({ mime_type: null, original_name: 'a.pkpass' }).icon).toBe(Ticket);
    expect(getFileTypeMeta({ mime_type: 'application/zip', original_name: 'a.zip' }).label).toBe('FILE');
  });
});

describe('filesModel — filters', () => {
  const pdf = buildTripFile({ id: 1, mime_type: 'application/pdf', original_name: 'invoice.pdf' });
  const image = buildTripFile({ id: 2, mime_type: 'image/jpeg', original_name: 'beach.jpg' });
  const sheet = buildTripFile({ id: 3, mime_type: 'text/csv', original_name: 'budget.csv' });
  const pass = buildTripFile({ id: 4, mime_type: 'application/vnd.apple.pkpass', original_name: 'bp.pkpass' });
  const zip = buildTripFile({ id: 5, mime_type: 'application/zip', original_name: 'stuff.zip' });
  const starred = buildTripFile({ id: 6, mime_type: 'application/pdf', original_name: 's.pdf', starred: 1 });
  const collab = buildTripFile({ id: 7, mime_type: 'application/pdf', original_name: 'c.pdf', note_id: 42 });
  const all = [pdf, image, sheet, pass, zip, starred, collab];

  const idsFor = (filter: FileFilterId) => all.filter(f => matchesFileFilter(f, filter)).map(f => f.id);

  it('FE-MOB-FILM-006: the filter grid is defined in display order', () => {
    expect(FILE_FILTERS.map(f => f.id)).toEqual(['all', 'pdf', 'image', 'doc', 'starred', 'collab']);
    expect(FILE_FILTERS.every(f => f.labelKey.startsWith('files.filter'))).toBe(true);
  });

  it('FE-MOB-FILM-007: "all" keeps everything, "pdf" and "image" keep their type', () => {
    expect(idsFor('all')).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(idsFor('pdf')).toEqual([1, 6, 7]);
    expect(idsFor('image')).toEqual([2]);
  });

  it('FE-MOB-FILM-008: "doc" is the catch-all for xls, passes and generic files', () => {
    expect(idsFor('doc')).toEqual([3, 4, 5]);
  });

  it('FE-MOB-FILM-009: "starred" and "collab" read their flags', () => {
    expect(idsFor('starred')).toEqual([6]);
    expect(idsFor('collab')).toEqual([7]);
    expect(matchesFileFilter(buildTripFile({ starred: 0 }), 'starred')).toBe(false);
  });

  it('FE-MOB-FILM-010: the filter tiles fully partition the list', () => {
    const covered = new Set([...idsFor('pdf'), ...idsFor('image'), ...idsFor('doc')]);
    expect(covered.size).toBe(all.length);
  });

  it('FE-MOB-FILM-011: an unknown filter id keeps every file', () => {
    expect(matchesFileFilter(pdf, 'bogus' as FileFilterId)).toBe(true);
  });
});

describe('filesModel — sorting and dates', () => {
  it('FE-MOB-FILM-012: sortFilesStarredFirst hoists starred files and keeps the rest stable', () => {
    const files = [
      buildTripFile({ id: 1 }),
      buildTripFile({ id: 2, starred: 1 }),
      buildTripFile({ id: 3 }),
      buildTripFile({ id: 4, starred: 1 }),
    ];
    const sorted = sortFilesStarredFirst(files);

    expect(sorted.map(f => f.id)).toEqual([2, 4, 1, 3]);
    expect(files.map(f => f.id)).toEqual([1, 2, 3, 4]);
  });

  it('FE-MOB-FILM-013: formatFileDate renders a compact day/month label', () => {
    expect(formatFileDate('2026-07-16T10:00:00.000Z', 'en-US')).toMatch(/Jul\s16|16\sJul/);
    expect(formatFileDate('2026-07-16T10:00:00.000Z', 'de-DE')).toMatch(/16\.\s?Juli/);
  });

  it('FE-MOB-FILM-014: formatFileDate returns an empty string for missing or broken dates', () => {
    expect(formatFileDate(null, 'en-US')).toBe('');
    expect(formatFileDate(undefined, 'en-US')).toBe('');
    expect(formatFileDate('', 'en-US')).toBe('');
    expect(formatFileDate('not-a-date', 'en-US')).toBe('');
  });
});

describe('filesModel — link labels', () => {
  const places = [buildPlace({ id: 11, name: 'Louvre' }), buildPlace({ id: 12, name: 'Eiffel Tower' })];
  const reservations = [
    buildReservation({ id: 21, type: 'flight', title: 'LH123' }),
    buildReservation({ id: 22, type: 'hotel', title: 'Hotel Ritz' }),
    buildReservation({ id: 23, type: 'hotel', title: '' }),
  ];
  const transportTypes = new Set(['flight', 'train']);

  function file(overrides: Partial<TripFile>): TripFile {
    return buildTripFile({ id: 1, ...overrides });
  }

  it('FE-MOB-FILM-015: merges the single and multi link columns and skips unknown ids', () => {
    const labels = buildFileLinkLabels(
      file({ place_id: 11, linked_place_ids: [11, 12, null, 99] }),
      places,
      reservations,
      transportTypes,
      t,
    );
    // 11 appears in both columns but is listed once; 99 does not exist any more
    expect(labels).toEqual(['files.sourcePlan · Louvre', 'files.sourcePlan · Eiffel Tower']);
  });

  it('FE-MOB-FILM-016: splits reservations into transport and booking and appends the collab note', () => {
    const labels = buildFileLinkLabels(
      file({
        reservation_id: 21,
        linked_reservation_ids: [22, 23, null, 98],
        note_id: 5,
      }),
      places,
      reservations,
      transportTypes,
      t,
    );

    expect(labels).toEqual([
      'files.sourceTransport · LH123',
      'files.sourceBooking · Hotel Ritz',
      // an untitled reservation repeats its own source label
      'files.sourceBooking · files.sourceBooking',
      'files.sourceCollab',
    ]);
  });

  it('FE-MOB-FILM-017: an unlinked file has no labels', () => {
    expect(buildFileLinkLabels(file({}), places, reservations, transportTypes, t)).toEqual([]);
  });
});
