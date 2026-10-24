import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PROVIDER_SELECT_ALL_MAX_PAGES } from '@trek/shared';
import {
  createDraftJourneyEntry,
  distanceBetweenGeoPoints,
  fetchRemainingProviderPages,
  groupPhotosByDate,
  matchJourneyEntries,
  posterlessVideo,
  PROVIDER_SEARCH_LAST_PAGE,
  PROVIDER_SEARCH_PAGE_SIZE,
  sortByCaptureTimeAsc,
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

describe('posterlessVideo (#2341)', () => {
  it('is a local clip whose poster frame was never grabbed', () => {
    expect(posterlessVideo({ media_type: 'video', provider: 'local', thumbnail_path: null })).toBe(true);
    expect(posterlessVideo({ media_type: 'video', provider: 'local' })).toBe(true);
  });

  it('is not a clip that has its poster, whatever the file is called', () => {
    expect(posterlessVideo({ media_type: 'video', provider: 'local', thumbnail_path: 'journey/poster.jpg' })).toBe(false);
  });

  it('is never a photo, and never a provider clip, whose poster the provider serves', () => {
    expect(posterlessVideo({ media_type: 'image', provider: 'local', thumbnail_path: null })).toBe(false);
    expect(posterlessVideo({ provider: 'local', thumbnail_path: null })).toBe(false);
    expect(posterlessVideo({ media_type: 'video', provider: 'immich', thumbnail_path: null })).toBe(false);
  });
});

describe('fetchRemainingProviderPages (#1587)', () => {
  it('asks for every page from the one given until the provider says there are no more', async () => {
    const fetchPage = vi.fn(async (page: number) => ({ assets: [`p${page}`], hasMore: page < 4 }));
    const onPage = vi.fn();

    const result = await fetchRemainingProviderPages(fetchPage, 2, new AbortController().signal, onPage);

    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([2, 3, 4]);
    expect(onPage.mock.calls).toEqual([
      [['p2'], 2, true],
      [['p3'], 3, true],
      [['p4'], 4, false],
    ]);
    expect(result).toEqual({ assets: ['p2', 'p3', 'p4'], hasMore: false });
  });

  it('keeps going over a page the filter emptied, and treats a missing list as empty', async () => {
    const fetchPage = vi.fn(async (page: number) => (page === 1 ? { hasMore: true } : { assets: ['x'], hasMore: false }));

    const result = await fetchRemainingProviderPages(fetchPage, 1, new AbortController().signal, () => {});

    expect(result).toEqual({ assets: ['x'], hasMore: false });
  });

  it('stops at the last page and says there is still more', async () => {
    const fetchPage = vi.fn(async (page: number) => ({ assets: [page], hasMore: true }));

    const result = await fetchRemainingProviderPages(fetchPage, 5, new AbortController().signal, () => {}, 7);

    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ assets: [5, 6, 7], hasMore: true });
  });

  it('never asks past page 251 by default, wherever the run starts', async () => {
    const endless = () => vi.fn(async (page: number) => ({ assets: [page], hasMore: true }));

    // A run from the first page takes the 250 after it, and ends at photo 50,200.
    const fromStart = endless();
    await fetchRemainingProviderPages(fromStart, 2, new AbortController().signal, () => {});
    expect(fromStart).toHaveBeenCalledTimes(PROVIDER_SELECT_ALL_MAX_PAGES);
    expect(fromStart).toHaveBeenLastCalledWith(PROVIDER_SEARCH_LAST_PAGE);
    expect(PROVIDER_SEARCH_LAST_PAGE).toBe(251);
    expect(PROVIDER_SEARCH_LAST_PAGE * PROVIDER_SEARCH_PAGE_SIZE).toBe(50200);

    // Pages scrolled into view first do not push it deeper.
    const scrolled = endless();
    await fetchRemainingProviderPages(scrolled, 12, new AbortController().signal, () => {});
    expect(scrolled).toHaveBeenLastCalledWith(PROVIDER_SEARCH_LAST_PAGE);

    // A second press after the first stopped there asks for nothing, and the
    // search stays open: the count keeps its "+".
    const again = endless();
    const onPage = vi.fn();
    const result = await fetchRemainingProviderPages(again, PROVIDER_SEARCH_LAST_PAGE + 1, new AbortController().signal, onPage);
    expect(again).not.toHaveBeenCalled();
    expect(onPage).not.toHaveBeenCalled();
    expect(result).toEqual({ assets: [], hasMore: true });
  });

  it('stops quietly once aborted, before and between pages, and hands nothing on after the abort', async () => {
    const controller = new AbortController();
    const onPage = vi.fn();
    const fetchPage = vi.fn(async (page: number) => {
      if (page === 2) controller.abort();
      return { assets: [page], hasMore: true };
    });

    const result = await fetchRemainingProviderPages(fetchPage, 1, controller.signal, onPage);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(onPage).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ assets: [1], hasMore: true });

    const never = vi.fn();
    await fetchRemainingProviderPages(never, 1, controller.signal, onPage);
    expect(never).not.toHaveBeenCalled();
  });

  it('lets a failing page reject, so the caller can keep what arrived', async () => {
    const fetchPage = vi.fn(async (page: number) => {
      if (page === 2) throw new Error('502');
      return { assets: [page], hasMore: true };
    });
    const onPage = vi.fn();

    await expect(fetchRemainingProviderPages(fetchPage, 1, new AbortController().signal, onPage)).rejects.toThrow('502');
    expect(onPage).toHaveBeenCalledWith([1], 1, true);
  });
});

describe('sortByCaptureTimeAsc (#1587)', () => {
  it('puts the oldest first, by the photographer\'s wall clock where there is one', () => {
    const items = [
      { id: 'late', takenAt: '2026-03-15T12:00:00.000Z' },
      { id: 'early', takenAt: '2026-03-15T08:00:00.000Z' },
      { id: 'wallclock', takenAt: '2026-03-15T20:00:00.000Z', localTakenAt: '2026-03-15T06:00:00.000Z' },
    ];

    expect(sortByCaptureTimeAsc(items).map((i) => i.id)).toEqual(['wallclock', 'early', 'late']);
  });

  it('breaks a wall-clock tie on the instant, then on the order the items came in', () => {
    const items = [
      { id: 'b', localTakenAt: '2026-03-15T10:00:00.000Z', takenAt: '2026-03-15T09:00:00.000Z' },
      { id: 'a', localTakenAt: '2026-03-15T10:00:00.000Z', takenAt: '2026-03-15T08:00:00.000Z' },
      { id: 'c', takenAt: '2026-03-15T11:00:00.000Z' },
      { id: 'd', takenAt: '2026-03-15T11:00:00.000Z' },
    ];

    expect(sortByCaptureTimeAsc(items).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps photos without a readable time at the end, in the order they came in', () => {
    const items = [
      { id: 'none' },
      { id: 'garbage', takenAt: 'not a date' },
      { id: 'dated', takenAt: '2026-03-15T08:00:00.000Z' },
      { id: 'blank', takenAt: '', localTakenAt: null },
    ];

    expect(sortByCaptureTimeAsc(items).map((i) => i.id)).toEqual(['dated', 'none', 'garbage', 'blank']);
  });

  it('leaves the input alone', () => {
    const items = [{ id: 'b', takenAt: '2026-03-16T00:00:00Z' }, { id: 'a', takenAt: '2026-03-15T00:00:00Z' }];
    sortByCaptureTimeAsc(items);
    expect(items.map((i) => i.id)).toEqual(['b', 'a']);
  });
});
