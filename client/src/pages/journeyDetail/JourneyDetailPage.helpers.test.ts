import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDraftJourneyEntry,
  distanceBetweenGeoPoints,
  groupPhotosByDate,
  matchJourneyEntries,
  sortProviderPhotos,
  utcOffsetMinutesForDay,
} from './JourneyDetailPage.helpers';

// Photo days are read off the reader's wall clock now, so the assertions below
// would follow whichever zone the runner happens to sit in. Nothing in the
// vitest config or tests/setup.ts pins one, so this file pins its own.
const runnerTimeZone = process.env.TZ;

function setTimeZone(tz: string | undefined): void {
  if (tz === undefined) delete process.env.TZ;
  else process.env.TZ = tz;
}

function inTimeZone<T>(tz: string, fn: () => T): T {
  setTimeZone(tz);
  try {
    return fn();
  } finally {
    setTimeZone('UTC');
  }
}

beforeAll(() => setTimeZone('UTC'));
afterAll(() => setTimeZone(runnerTimeZone));

describe('Journey provider photo ranking', () => {
  it('places GPS photos nearest the selected Journey location and keeps photos without GPS', () => {
    const photos = [
      { id: 'far', lat: 41.95, lng: 12.5 },
      { id: 'unknown', lat: null, lng: null },
      { id: 'near', lat: 41.901, lng: 12.501 },
    ];

    expect(sortProviderPhotos(photos, { lat: 41.9, lng: 12.5 }).map((photo) => photo.id)).toEqual([
      'near',
      'far',
      'unknown',
    ]);
  });

  it('falls back to newest-taken-first when the selected entry has no valid location', () => {
    const photos = [
      { id: 'older', takenAt: '2026-03-14T09:00:00Z' },
      { id: 'newer', takenAt: '2026-03-16T09:00:00Z' },
    ];
    expect(sortProviderPhotos(photos, { lat: 200, lng: 12 }).map((photo) => photo.id)).toEqual(['newer', 'older']);
  });

  it('keeps original relative order for photos without a valid location and without takenAt', () => {
    const photos = [{ id: 'first' }, { id: 'second' }];
    expect(sortProviderPhotos(photos, { lat: 200, lng: 12 }).map((photo) => photo.id)).toEqual(['first', 'second']);
  });

  it('calculates a zero distance for identical coordinates', () => {
    expect(distanceBetweenGeoPoints({ lat: 41.9, lng: 12.5 }, { lat: 41.9, lng: 12.5 })).toBe(0);
  });
});

describe('Journey provider photo grouping', () => {
  it('orders the date headings newest first, whatever order the photos arrive in', () => {
    const photos = [
      { id: 'b', takenAt: '2026-03-14T09:00:00Z' },
      { id: 'a', takenAt: '2026-03-16T09:00:00Z' },
      { id: 'c', takenAt: '2026-03-15T09:00:00Z' },
    ];
    expect(groupPhotosByDate(photos).map((g) => g.date)).toEqual(['2026-03-16', '2026-03-15', '2026-03-14']);
  });

  it('keeps the distance sort inside a day but not across days', () => {
    // What sortProviderPhotos hands over: nearest first, so the 14th leads the list.
    const sorted = [
      { id: 'near', takenAt: '2026-03-14T10:00:00Z' },
      { id: 'mid', takenAt: '2026-03-16T10:00:00Z' },
      { id: 'far', takenAt: '2026-03-14T11:00:00Z' },
    ];
    const groups = groupPhotosByDate(sorted);
    expect(groups.map((g) => g.date)).toEqual(['2026-03-16', '2026-03-14']);
    expect(groups[1].assets.map((a: { id: string }) => a.id)).toEqual(['near', 'far']);
  });

  it('sorts photos without a date to the end', () => {
    const photos = [{ id: 'x' }, { id: 'y', takenAt: '2026-03-16T09:00:00Z' }];
    expect(groupPhotosByDate(photos).map((g) => g.date)).toEqual(['2026-03-16', '__unknown__']);
  });

  it('files a photo under the day the photographer saw, not the UTC one', () => {
    // 20:32Z on the 14th is 07:32 on the 15th in Sydney, and Immich says so in
    // localTakenAt. It used to land under the 14th (#2336).
    const photos = [
      { id: 'morning', takenAt: '2026-03-14T20:32:00Z', localTakenAt: '2026-03-15T07:32:00.000Z' },
      { id: 'evening', takenAt: '2026-03-15T09:00:00Z', localTakenAt: '2026-03-15T20:00:00.000Z' },
    ];
    const groups = groupPhotosByDate(photos);
    expect(groups.map((g) => g.date)).toEqual(['2026-03-15']);
    expect(groups[0].assets.map((a: { id: string }) => a.id)).toEqual(['morning', 'evening']);
  });

  it('falls back to the local day of the instant when no local stamp is sent', () => {
    inTimeZone('Australia/Sydney', () => {
      expect(groupPhotosByDate([{ id: 'a', takenAt: '2026-03-14T20:32:00Z' }]).map((g) => g.date)).toEqual([
        '2026-03-15',
      ]);
    });
    // The same instant in UTC stays on the 14th.
    expect(groupPhotosByDate([{ id: 'a', takenAt: '2026-03-14T20:32:00Z' }]).map((g) => g.date)).toEqual([
      '2026-03-14',
    ]);
  });

  it('leaves a bare date alone rather than shifting it by a zone it never carried', () => {
    inTimeZone('America/New_York', () => {
      expect(groupPhotosByDate([{ id: 'a', takenAt: '2026-02-02' }]).map((g) => g.date)).toEqual(['2026-02-02']);
    });
  });

  it('groups an unreadable timestamp the way it always did instead of dropping it', () => {
    // Ten characters long, so it is taken for the calendar date it looks like
    // and passed through untouched — the branch above.
    expect(groupPhotosByDate([{ id: 'a', takenAt: 'not-a-date' }]).map((g) => g.date)).toEqual(['not-a-date']);
    // Longer than a date and nothing Date can read: the heading falls back to
    // the leading ten characters. Without that fallback every such photo would
    // pile up under one heading reading NaN-NaN-NaN.
    expect(groupPhotosByDate([{ id: 'b', takenAt: 'unknown-time' }]).map((g) => g.date)).toEqual(['unknown-ti']);
    expect(groupPhotosByDate([{ id: 'c', takenAt: '2026-13-45T10:00' }]).map((g) => g.date)).toEqual(['2026-13-45']);
  });
});

describe('utcOffsetMinutesForDay', () => {
  it('reads the offset of the day being searched, not of today', () => {
    inTimeZone('Australia/Sydney', () => {
      // Sydney is +11 on 15 March 2026 and +10 in July: a summer day looked up
      // in winter would otherwise be an hour off.
      expect(utcOffsetMinutesForDay('2026-03-15')).toBe(660);
      expect(utcOffsetMinutesForDay('2026-07-15')).toBe(600);
    });
  });

  it('reads the offset where the day starts, which is the bound the server builds from it', () => {
    inTimeZone('Europe/Berlin', () => {
      // 25 October 2026 opens on summer time and closes on winter time. Read at
      // midday it would be +1 and the window would open an hour after the day
      // did, dropping a photo taken at 00:30 (#2336).
      expect(utcOffsetMinutesForDay('2026-10-25')).toBe(120);
      // 29 March is the mirror — summer time arrives at 02:00, so the day still
      // starts on +1 however the afternoon reads.
      expect(utcOffsetMinutesForDay('2026-03-29')).toBe(60);
    });
  });

  it('falls back to the current offset when there is no usable day', () => {
    expect(utcOffsetMinutesForDay('')).toBe(0);
    expect(utcOffsetMinutesForDay(undefined)).toBe(0);
    expect(utcOffsetMinutesForDay('not-a-day')).toBe(0);
    expect(utcOffsetMinutesForDay('2026-13-45')).toBe(0);
  });
});


describe('createDraftJourneyEntry', () => {
  it('starts on today when nobody says otherwise', () => {
    const draft = createDraftJourneyEntry(7, new Date('2026-03-15T14:30:00'));
    expect(draft.entry_date).toBe('2026-03-15');
    expect(draft.entry_time).toBe('14:30');
  });

  it('takes the day it was started from, so a plus in an earlier day header lands there', () => {
    // The whole point of the day-header plus: it used to open on today no matter
    // where in the journal you pressed it (discussion #2299).
    const draft = createDraftJourneyEntry(7, new Date('2026-03-15T14:30:00'), '2026-03-09');
    expect(draft.entry_date).toBe('2026-03-09');
    expect(draft.entry_time).toBe('14:30');
  });
});

describe('matchJourneyEntries', () => {
  const entries = [
    { id: 1, title: 'Mercado da Ribeira', story: 'Ate too much', location_name: 'Lisbon', tags: ['food'] },
    { id: 2, title: 'Tram 28', story: null, location_name: 'Lisbon', tags: [] },
    { id: 3, title: null, story: 'Long drive north', location_name: 'Café Central, Porto', tags: ['drive'] },
  ];

  it('an empty query is not a filter', () => {
    expect(matchJourneyEntries(entries, '')).toBe(entries);
    expect(matchJourneyEntries(entries, '   ')).toBe(entries);
  });

  it('matches the words a reader would remember: title, story, place and tags', () => {
    expect(matchJourneyEntries(entries, 'mercado').map((e) => e.id)).toEqual([1]);
    expect(matchJourneyEntries(entries, 'drive').map((e) => e.id)).toEqual([3]);
    expect(matchJourneyEntries(entries, 'lisbon').map((e) => e.id)).toEqual([1, 2]);
    expect(matchJourneyEntries(entries, 'food').map((e) => e.id)).toEqual([1]);
  });

  it('is blind to case and to accents, so a query typed plainly still finds the place', () => {
    expect(matchJourneyEntries(entries, 'cafe').map((e) => e.id)).toEqual([3]);
    expect(matchJourneyEntries(entries, 'CAFÉ').map((e) => e.id)).toEqual([3]);
  });

  it('answers with nothing rather than everything when nothing matches', () => {
    expect(matchJourneyEntries(entries, 'reykjavik')).toEqual([]);
  });
});
