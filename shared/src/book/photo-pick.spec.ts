import {
  bookPhotoSuggestionsSchema,
  hashDistance,
  PHOTO_PICK,
  photoMoment,
  photosInScope,
  pickBookPhotos,
  type PhotoPickCandidate,
  type PhotoPickEntry,
  type PhotoPickSignals,
} from './photo-pick';

import { describe, expect, it } from 'vitest';

/**
 * Picking photos for a book without looking at them: days, places, bursts,
 * look-alikes by hash, the doubtful ones set aside, a cover's shape, the limit
 * shared out over the groups. Lisbon's Alfama and Belem are 6 km apart; two
 * points 0.001 degrees of latitude apart are 111 m apart.
 */

const ALFAMA = { lat: 38.7118, lng: -9.13 };
const BELEM = { lat: 38.6916, lng: -9.216 };

const signals = (over: Partial<PhotoPickSignals> = {}): PhotoPickSignals => ({
  phash: null,
  sharpness: null,
  clipped: null,
  origWidth: null,
  origHeight: null,
  ...over,
});

const photo = (photoId: number, over: Partial<PhotoPickCandidate> = {}): PhotoPickCandidate => ({
  photoId,
  takenAt: null,
  lat: null,
  lng: null,
  width: null,
  height: null,
  caption: null,
  entryIds: [],
  inBook: false,
  signals: null,
  ...over,
});

const entry = (id: number, over: Partial<PhotoPickEntry> = {}): PhotoPickEntry => ({
  id,
  date: '2026-07-03',
  title: null,
  location: null,
  lat: null,
  lng: null,
  ...over,
});

/** A photo in the Alfama on 3 July at hh:mm:ss local time (no zone). */
const at = (photoId: number, time: string, over: Partial<PhotoPickCandidate> = {}) =>
  photo(photoId, { takenAt: `2026-07-03T${time}`, ...ALFAMA, ...over });

const ids = (result: ReturnType<typeof pickBookPhotos>) => result.groups.map((g) => g.picks.map((p) => p.photoId));

describe('photoMoment', () => {
  it('PHOTOPICK-001: a time without a zone is the wall clock, a UTC time moves by the longitude, an offset is taken as written', () => {
    const wall = Date.UTC(2026, 6, 3, 23, 30) / 1000;
    expect(photoMoment('2026-07-03T23:30:00', 139.7)).toEqual({ day: '2026-07-03', at: wall });
    expect(photoMoment('2026-07-03T20:00:00.000Z', 139.7)?.day).toBe('2026-07-04');
    expect(photoMoment('2026-07-03T20:00:00Z', null)?.day).toBe('2026-07-03');
    expect(photoMoment('2026-07-03T01:00:00Z', -122.4)?.day).toBe('2026-07-02');
    expect(photoMoment('2026-07-03 23:30:00+02:00', 139.7)).toEqual({
      day: '2026-07-03',
      at: Date.UTC(2026, 6, 3, 21, 30) / 1000,
    });
    expect(photoMoment('2026-07-03', 10)).toEqual({ day: '2026-07-03', at: null });
    expect(photoMoment('yesterday', 10)).toBeNull();
    expect(photoMoment(null, 10)).toBeNull();
  });
});

describe('hashDistance', () => {
  it('PHOTOPICK-002: counts the differing bits of two 64-bit hex hashes and refuses anything else', () => {
    expect(hashDistance('0123456789abcdef', '0123456789abcdef')).toBe(0);
    expect(hashDistance('0000000000000000', '000000000000000f')).toBe(4);
    expect(hashDistance('ffffffffffffffff', '0000000000000000')).toBe(64);
    expect(hashDistance('0000', '0000000000000000')).toBeNull();
    expect(hashDistance('zzzzzzzzzzzzzzzz', '0000000000000000')).toBeNull();
  });
});

describe('pickBookPhotos', () => {
  it('PHOTOPICK-003: groups by the linked entry day first, then the capture day, undated last, and answers the shared shape', () => {
    const entries = [entry(7, { date: '2026-07-01', location: 'Porto' })];
    const late = '2026-07-05T10:00:00';
    const photos = [photo(1), photo(2, { takenAt: late }), photo(3, { takenAt: late, entryIds: [7] })];
    const result = pickBookPhotos(photos, entries, { signalsPending: 2 });
    expect(bookPhotoSuggestionsSchema.parse(result)).toEqual(result);
    expect(result.groups.map((g) => [g.day, g.entryId, g.place])).toEqual([
      ['2026-07-01', 7, 'Porto'],
      ['2026-07-05', null, null],
      ['undated', null, null],
    ]);
    expect(ids(result)).toEqual([[3], [2], [1]]);
    expect(result.signals_pending).toBe(2);
    expect(result.groups_more).toBe(0);
  });

  it('PHOTOPICK-004: splits a day into places 250 m apart, named after the nearest entry within 2 km, with its entry only on that day', () => {
    const entries = [
      entry(1, { location: 'Alfama', ...ALFAMA }),
      entry(2, { date: '2026-07-04', title: 'Belem tower', ...BELEM }),
    ];
    const result = pickBookPhotos(
      [
        at(10, '09:00:00'),
        at(11, '09:10:00', { lat: ALFAMA.lat + 0.001 }),
        at(12, '15:00:00', BELEM),
        at(13, '16:00:00', { lat: ALFAMA.lat + 0.01 }),
      ],
      entries,
    );
    expect(result.groups.map((g) => [g.place, g.entryId, g.picks.map((p) => p.photoId)])).toEqual([
      ['Alfama', 1, [10, 11]],
      ['Belem tower', null, [12]],
      ['Alfama', 1, [13]],
    ]);
  });

  it('PHOTOPICK-005: a burst keeps its sharpest photo and names the others near duplicates of it', () => {
    const result = pickBookPhotos(
      [
        at(1, '10:00:00', { signals: signals({ sharpness: 200 }) }),
        at(2, '10:00:04', { signals: signals({ sharpness: 400 }) }),
        at(3, '10:00:09', { signals: signals({ sharpness: 300 }) }),
        at(4, '10:05:00', { signals: signals({ sharpness: 250 }) }),
      ],
      [],
    );
    const [group] = result.groups;
    expect(group?.picks.map((p) => p.photoId)).toEqual([2, 4]);
    expect(group?.picks[0]?.why[0]).toBe('sharpest of 3 similar');
    expect(group?.dropped).toEqual([
      { photoId: 3, reason: 'near_duplicate_of', of: 2 },
      { photoId: 1, reason: 'near_duplicate_of', of: 2 },
    ]);
  });

  it('PHOTOPICK-006: photos far apart in time look alike when their hashes differ in at most 10 bits', () => {
    const result = pickBookPhotos(
      [
        at(1, '10:00:00', { signals: signals({ phash: '0000000000000000', sharpness: 100 }) }),
        at(2, '12:00:00', { signals: signals({ phash: '00000000000003ff', sharpness: 150 }) }),
        at(3, '14:00:00', { signals: signals({ phash: '0000000000000fff', sharpness: 120 }) }),
      ],
      [],
    );
    // 1 and 2 differ in 10 bits, 2 and 3 in 2, so all three are one set even though 1 and 3 differ in 12.
    expect(ids(result)).toEqual([[2]]);
    expect(result.groups[0]?.dropped.map((d) => d.photoId).sort()).toEqual([1, 3]);
    const apart = pickBookPhotos(
      [
        at(1, '10:00:00', { signals: signals({ phash: '0000000000000000' }) }),
        at(2, '12:00:00', { signals: signals({ phash: '0000000000000fff' }) }),
      ],
      [],
    );
    expect(ids(apart)).toEqual([[1, 2]]);
  });

  it('PHOTOPICK-007: a possibly blurry photo is set aside and said so, unless it is all its group has', () => {
    const sharp = (id: number, time: string, sharpness: number) => at(id, time, { signals: signals({ sharpness }) });
    const result = pickBookPhotos(
      [
        sharp(1, '09:00:00', 300),
        sharp(2, '10:00:00', 280),
        sharp(3, '11:00:00', 20),
        photo(4, { takenAt: '2026-07-04T10:00:00', signals: signals({ sharpness: 15 }) }),
      ],
      [],
    );
    expect(result.groups[0]?.picks.map((p) => p.photoId)).toEqual([1, 2]);
    expect(result.groups[0]?.dropped).toEqual([{ photoId: 3, reason: 'possibly_blurry' }]);
    expect(result.groups[1]?.picks).toEqual([{ photoId: 4, why: ['possibly blurry', 'not in the book yet'] }]);
    // Under 35 % of the typical photo but above the floor: not blurry.
    const soft = pickBookPhotos([sharp(1, '09:00:00', 900), sharp(2, '10:00:00', 1000), sharp(3, '11:00:00', 100)], []);
    expect(soft.groups[0]?.dropped).toEqual([]);
    // Fewer than three measured photos say nothing about what is typical.
    const two = pickBookPhotos([sharp(1, '09:00:00', 300), sharp(2, '10:00:00', 5)], []);
    expect(two.groups[0]?.dropped).toEqual([]);
    expect(PHOTO_PICK.minForMedian).toBe(3);
  });

  it('PHOTOPICK-008: an original too small for print is set aside, a cover asks for more pixels, an unknown size counts as fine', () => {
    const sized = (id: number, time: string, w: number | null) =>
      at(id, time, { signals: signals({ origWidth: w, origHeight: w === null ? null : Math.round(w * 0.75) }) });
    const photos = [
      sized(1, '09:00:00', 4000),
      sized(2, '10:00:00', 1000),
      sized(3, '11:00:00', 2000),
      sized(4, '12:00:00', null),
    ];
    const page = pickBookPhotos(photos, []);
    expect(page.groups[0]?.dropped).toEqual([{ photoId: 2, reason: 'low_resolution' }]);
    const cover = pickBookPhotos(photos, [], { purpose: 'cover' });
    expect(cover.groups[0]?.dropped.map((d) => d.photoId).sort()).toEqual([2, 3]);
    expect(cover.groups[0]?.picks.map((p) => p.photoId)).toEqual([1, 4]);
  });

  it('PHOTOPICK-009: a cover puts a wide or square photo before a sharper upright one, a page goes by sharpness', () => {
    const photos = [
      at(1, '09:00:00', { width: 600, height: 800, signals: signals({ sharpness: 900 }) }),
      at(2, '10:00:00', { width: 800, height: 600, signals: signals({ sharpness: 300 }) }),
      at(3, '11:00:00', { width: 800, height: 800, signals: signals({ sharpness: 200 }) }),
    ];
    const cover = pickBookPhotos(photos, [], { purpose: 'cover', limit: 2 });
    expect(cover.groups[0]?.picks.map((p) => [p.photoId, p.why[0]])).toEqual([
      [2, 'landscape'],
      [3, 'square'],
    ]);
    expect(cover.groups[0]?.more).toBe(1);
    const page = pickBookPhotos(photos, [], { limit: 1 });
    expect(page.groups[0]?.picks.map((p) => [p.photoId, p.why[0]])).toEqual([[1, 'portrait']]);
  });

  it('PHOTOPICK-010: without signals a caption wins, then a photo the book does not have yet, best first', () => {
    const result = pickBookPhotos(
      [at(1, '09:00:00', { inBook: true }), at(2, '10:00:00'), at(3, '11:00:00', { caption: 'Tram 28', inBook: true })],
      [],
      { limit: 2 },
    );
    expect(result.groups[0]?.picks).toEqual([
      { photoId: 3, why: ['in the book already', 'has a caption'] },
      { photoId: 2, why: ['not in the book yet'] },
    ]);
    expect(result.groups[0]?.more).toBe(1);
  });

  it('PHOTOPICK-011: the limit goes round the groups, so every group gets its best before any gets a second', () => {
    const day = (d: string, n: number) =>
      Array.from({ length: 3 }, (_, i) => photo(n + i, { takenAt: `2026-07-0${d}T1${i}:00:00` }));
    const photos = [...day('1', 10), ...day('2', 20), ...day('3', 30)];
    const four = pickBookPhotos(photos, [], { limit: 4 });
    expect(ids(four)).toEqual([[10, 11], [20], [30]]);
    expect(four.groups.map((g) => g.more)).toEqual([1, 2, 2]);
    const two = pickBookPhotos(photos, [], { limit: 2 });
    expect(ids(two)).toEqual([[10], [20]]);
    expect(two.groups_more).toBe(1);
    expect(pickBookPhotos(photos, [], { limit: 500 }).groups.flatMap((g) => g.picks)).toHaveLength(9);
  });

  it('PHOTOPICK-012: an entry narrows to its linked photos, or to its day when none is linked; a date narrows to that day', () => {
    const entries = [entry(1, { date: '2026-07-01' }), entry(2, { date: '2026-07-02' })];
    const photos = [
      photo(1, { entryIds: [1] }),
      photo(2, { takenAt: '2026-07-01T10:00:00' }),
      photo(3, { takenAt: '2026-07-02T10:00:00' }),
    ];
    expect(ids(pickBookPhotos(photos, entries, { entryId: 1 }))).toEqual([[1]]);
    expect(ids(pickBookPhotos(photos, entries, { entryId: 2 }))).toEqual([[3]]);
    expect(ids(pickBookPhotos(photos, entries, { entryId: 99 }))).toEqual([]);
    // Photo 1 has no capture time of its own, so it comes after the one that does.
    expect(ids(pickBookPhotos(photos, entries, { date: '2026-07-01' }))).toEqual([[2, 1]]);
    // The same narrowing, for the server to measure those photos first.
    expect([...photosInScope(photos, entries, { entryId: 2 })]).toEqual([3]);
    expect([...photosInScope(photos, entries, { date: '2026-07-01' })]).toEqual([1, 2]);
    expect([...photosInScope(photos, entries)]).toEqual([1, 2, 3]);
  });

  it('PHOTOPICK-013: a photo without a place takes its entry place, and a placeless group takes the name its one entry has', () => {
    const entries = [entry(5, { location: 'Sintra', lat: 38.7976, lng: -9.3906 }), entry(6, { location: 'Cascais' })];
    const result = pickBookPhotos(
      [photo(1, { entryIds: [5] }), photo(2, { entryIds: [6] }), photo(3, { entryIds: [6] })],
      entries,
    );
    expect(result.groups.map((g) => [g.place, g.entryId, g.picks.map((p) => p.photoId)])).toEqual([
      ['Sintra', 5, [1]],
      ['Cascais', 6, [2, 3]],
    ]);
  });

  it('PHOTOPICK-014: photos about as sharp compare by what comes next: clipping, then a caption, then not in the book', () => {
    const shot = (
      id: number,
      time: string,
      sharpness: number,
      clipped: number,
      over: Partial<PhotoPickCandidate> = {},
    ) => at(id, time, { inBook: true, signals: signals({ sharpness, clipped }), ...over });
    const result = pickBookPhotos(
      [
        shot(1, '09:00:00', 310, 0),
        shot(2, '10:00:00', 300, 0.012, { caption: 'Tram 28' }),
        shot(3, '11:00:00', 305, 0.005, { inBook: false }),
        shot(4, '12:00:00', 600, 0.05),
        shot(5, '13:00:00', 305, 0.1, { caption: 'Miradouro', inBook: false }),
      ],
      [],
    );
    // 4 is clearly the sharpest; 1, 2, 3 and 5 are within 15 % of each other, and 5 burns out a tenth of its pixels.
    expect(ids(result)).toEqual([[4, 2, 3, 1, 5]]);
    expect(PHOTO_PICK.bands).toEqual({ sharpness: 1.15, clipped: 0.02, pixels: 1.5 });
  });

  it('PHOTOPICK-015: shots seconds apart whose hashes clearly differ stay apart; a burst within 20 bits is one set', () => {
    const hashed = (id: number, time: string, phash: string) => at(id, time, { signals: signals({ phash }) });
    const walk = pickBookPhotos(
      [
        hashed(1, '10:00:00', '0000000000000000'),
        hashed(2, '10:00:08', 'ffffffff00000000'),
        hashed(3, '10:00:16', 'ffffffffffffffff'),
      ],
      [],
    );
    expect(ids(walk)).toEqual([[1, 2, 3]]);
    expect(walk.groups[0]?.dropped).toEqual([]);
    const burst = pickBookPhotos(
      [hashed(1, '10:00:00', '0000000000000000'), hashed(2, '10:00:08', '00000000000fffff')],
      [],
    );
    expect(ids(burst)).toEqual([[1]]);
    expect(burst.groups[0]?.picks[0]?.why[0]).toBe('best of 2 similar');
    expect(burst.groups[0]?.dropped).toEqual([{ photoId: 2, reason: 'near_duplicate_of', of: 1 }]);
    // The same 20 bits an hour apart are no longer alike.
    const later = pickBookPhotos(
      [hashed(1, '10:00:00', '0000000000000000'), hashed(2, '11:00:00', '00000000000fffff')],
      [],
    );
    expect(ids(later)).toEqual([[1, 2]]);
    expect(PHOTO_PICK.burstHashDistance).toBe(20);
  });

  it('PHOTOPICK-016: dropped names at most 30 per group and 120 in all, and dropped_more counts the rest', () => {
    const burst = (day: number, n: number) =>
      Array.from({ length: n }, (_, i) =>
        photo(day * 100 + i + 1, { takenAt: `2026-07-0${day}T10:00:${String(i).padStart(2, '0')}` }),
      );
    const one = pickBookPhotos(burst(1, 36), []);
    expect(ids(one)).toEqual([[101]]);
    expect(one.groups[0]?.dropped).toHaveLength(30);
    expect(one.groups[0]?.dropped_more).toBe(5);
    const five = pickBookPhotos(
      [1, 2, 3, 4, 5].flatMap((day) => burst(day, 31)),
      [],
    );
    expect(bookPhotoSuggestionsSchema.parse(five)).toEqual(five);
    expect(five.groups.map((g) => [g.dropped.length, g.dropped_more])).toEqual([
      [30, 0],
      [30, 0],
      [30, 0],
      [30, 0],
      [0, 30],
    ]);
  });

  it("PHOTOPICK-017: a photo's shape comes from its row before the original's size, which a provider may report turned", () => {
    const result = pickBookPhotos(
      [
        at(1, '09:00:00', { width: 600, height: 800, signals: signals({ origWidth: 4000, origHeight: 3000 }) }),
        at(2, '10:00:00', { signals: signals({ origWidth: 3000, origHeight: 2000 }) }),
      ],
      [],
      { purpose: 'cover' },
    );
    expect(result.groups[0]?.picks.map((p) => [p.photoId, p.why[0]])).toEqual([
      [2, 'landscape'],
      [1, 'portrait'],
    ]);
  });
});
