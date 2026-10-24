import {
  clockOf,
  minutesOf,
  openWindows,
  placeWindows,
  stationArrivals,
  stationFit,
  stationHoursOn,
  stationShares,
  type StationHours,
} from './walk-hours';

import { describe, expect, it } from 'vitest';

// 2026-10-19 is a Monday.
const MONDAY = '2026-10-19';
const TUESDAY = '2026-10-20';
const WEDNESDAY = '2026-10-21';
const THURSDAY = '2026-10-22';
const FRIDAY = '2026-10-23';
const SATURDAY = '2026-10-24';
const SUNDAY = '2026-10-25';

const at = (clock: string, atLeast = false) => ({ arrival: minutesOf(clock) ?? Number.NaN, atLeast });
const osm = (windows: Array<[number, number]>, continues = false): StationHours => ({
  source: 'osm',
  windows,
  continues,
});

describe('minutesOf and clockOf', () => {
  it('reads a time as TREK stores it, with or without seconds or a leading zero', () => {
    expect(minutesOf('09:30')).toBe(570);
    expect(minutesOf('9:30')).toBe(570);
    expect(minutesOf(' 17:20:45 ')).toBe(1040);
    expect(minutesOf('00:00')).toBe(0);
  });

  it('reads a time typed in twelve hours', () => {
    expect(minutesOf('9:30 PM')).toBe(1290);
    expect(minutesOf('9:30pm')).toBe(1290);
    expect(minutesOf('12:00 AM')).toBe(0);
    expect(minutesOf('12:15 PM')).toBe(735);
    expect(minutesOf('7 AM')).toBe(420);
  });

  it('reads nothing that is no time of a day', () => {
    for (const text of ['24:00', '9:60', '13:00 PM', '0:30 AM', 'noon', '', null, undefined]) {
      expect(minutesOf(text)).toBeNull();
    }
  });

  it('writes minutes after midnight as HH:MM, round the day', () => {
    expect(clockOf(0)).toBe('00:00');
    expect(clockOf(1290)).toBe('21:30');
    expect(clockOf(570.4)).toBe('09:30');
    expect(clockOf(1440)).toBe('00:00');
    expect(clockOf(1500)).toBe('01:00');
    expect(clockOf(-30)).toBe('23:30');
  });
});

describe('openWindows (OpenStreetMap)', () => {
  const week = 'Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off';

  it('reads the plain forms for the weekday of the date', () => {
    expect(openWindows(week, MONDAY)).toEqual([[540, 1080]]);
    expect(openWindows(week, SATURDAY)).toEqual([[600, 840]]);
    expect(openWindows(week, SUNDAY)).toEqual([]);
    expect(openWindows('24/7', TUESDAY)).toEqual([[0, 1440]]);
    expect(openWindows('Mo 10:00-12:00,14:00-18:00;', MONDAY)).toEqual([
      [600, 720],
      [840, 1080],
    ]);
    expect(openWindows('Mo 10:00-24:00', MONDAY)).toEqual([[600, 1440]]);
  });

  it('lets a later rule replace an earlier one, and a range wrap round the week', () => {
    expect(openWindows('Mo-Su 09:00-18:00; We 12:00-14:00', WEDNESDAY)).toEqual([[720, 840]]);
    expect(openWindows('Mo-Su 09:00-18:00; We closed', WEDNESDAY)).toEqual([]);
    expect(openWindows('Sa-Mo 10:00-16:00', MONDAY)).toEqual([[600, 960]]);
    expect(openWindows('Sa-Mo 10:00-16:00', WEDNESDAY)).toEqual([]);
  });

  it('leaves anything else unread, rather than guessed', () => {
    for (const text of [
      'PH off',
      'Mo-Fr 09:00-18:00; PH off',
      'Mo 18:00-02:00',
      'sunrise-sunset',
      '09:00-18:00',
      'Mo-Fr-Sa 09:00-18:00',
      'Mo 09:00-12:00-14:00',
      'Mo 12:00-10:00',
      'Mo',
    ]) {
      expect(openWindows(text, MONDAY)).toBeNull();
    }
    expect(openWindows(week, '19.10.2026')).toBeNull();
    expect(openWindows(week, '2026-02-31')).toBeNull();
    expect(openWindows(week, '2026-13-01')).toBeNull();
  });
});

describe("placeWindows (a trip place's own hours, Monday first)", () => {
  const week = JSON.stringify([
    { closed: false, open: '10:00', close: '18:00' },
    { closed: true },
    { closed: false },
    { closed: false, open: '10:00' },
    { closed: false, open: '18:00', close: '02:00' },
    { closed: false, open: '09:00', close: '13:00' },
    { closed: true },
  ]);

  it('gives the window of the weekday, none on a closed day', () => {
    expect(placeWindows(week, MONDAY)).toEqual([[600, 1080]]);
    expect(placeWindows(week, TUESDAY)).toEqual([]);
    expect(placeWindows(week, SUNDAY)).toEqual([]);
  });

  it('runs a closing at or before the opening past midnight into the next date', () => {
    expect(placeWindows(week, FRIDAY)).toEqual([[1080, 1440]]);
    expect(placeWindows(week, SATURDAY)).toEqual([
      [0, 120],
      [540, 780],
    ]);
    const sundayNight = JSON.stringify([
      { closed: true },
      ...Array.from({ length: 5 }, () => ({ closed: true })),
      { closed: false, open: '22:00', close: '01:00' },
    ]);
    expect(placeWindows(sundayNight, MONDAY)).toEqual([[0, 60]]);
    const allDay = JSON.stringify(Array.from({ length: 7 }, () => ({ closed: false, open: '00:00', close: '00:00' })));
    expect(placeWindows(allDay, TUESDAY)).toEqual([[0, 1440]]);
  });

  it('says nothing for a day without both times, without hours, or for a date it cannot read', () => {
    expect(placeWindows(week, WEDNESDAY)).toBeNull();
    expect(placeWindows(week, THURSDAY)).toBeNull();
    expect(placeWindows(null, MONDAY)).toBeNull();
    expect(placeWindows('', MONDAY)).toBeNull();
    expect(placeWindows('{broken', MONDAY)).toBeNull();
    expect(placeWindows(week, 'someday')).toBeNull();
  });
});

describe('stationHoursOn', () => {
  const place = JSON.stringify([
    { closed: false, open: '11:00', close: '17:00' },
    ...Array.from({ length: 6 }, () => ({ closed: false })),
  ]);

  it("takes the trip place's own hours first, with their source", () => {
    expect(stationHoursOn({ place, osm: 'Mo-Fr 09:00-18:00' }, MONDAY)).toEqual({
      source: 'place',
      windows: [[660, 1020]],
      continues: false,
    });
  });

  it('falls back to OpenStreetMap where the place says nothing that day', () => {
    expect(stationHoursOn({ place, osm: 'Mo-Fr 09:00-18:00' }, TUESDAY)).toEqual({
      source: 'osm',
      windows: [[540, 1080]],
      continues: false,
    });
    expect(stationHoursOn({ osm: 'sunrise-sunset' }, TUESDAY)).toEqual({ source: 'osm', unread: 'sunrise-sunset' });
  });

  it('is null where neither says anything, or for a date it cannot read', () => {
    expect(stationHoursOn({ place, osm: '  ' }, TUESDAY)).toBeNull();
    expect(stationHoursOn({}, MONDAY)).toBeNull();
    expect(stationHoursOn({ place, osm: 'Mo-Fr 09:00-18:00' }, '2026-02-31')).toBeNull();
  });

  it('runs an OpenStreetMap last window on past midnight only where the next date opens at midnight', () => {
    const continuesOn = (text: string, date: string) => {
      const hours = stationHoursOn({ osm: text }, date);
      return hours && 'continues' in hours ? hours.continues : null;
    };
    expect(continuesOn('24/7', SUNDAY)).toBe(true);
    expect(continuesOn('Mo 18:00-24:00; Tu 00:00-02:00', MONDAY)).toBe(true);
    expect(continuesOn('Mo-Su 10:00-24:00', MONDAY)).toBe(false);
    expect(continuesOn('Mo-Su 10:00-18:00', MONDAY)).toBe(false);
    expect(continuesOn('Mo 18:00-24:00; Tu off', MONDAY)).toBe(false);
  });

  it("runs a trip place's last window on past midnight only where the next date opens at midnight", () => {
    const week = (monday: object, tuesday: object) =>
      JSON.stringify([monday, tuesday, ...Array.from({ length: 5 }, () => ({ closed: true }))]);
    const continuesOn = (raw: string) => {
      const hours = stationHoursOn({ place: raw }, MONDAY);
      return hours && 'continues' in hours ? hours.continues : null;
    };
    expect(continuesOn(week({ closed: false, open: '18:00', close: '02:00' }, { closed: true }))).toBe(true);
    const allDay = { closed: false, open: '00:00', close: '00:00' };
    expect(continuesOn(week(allDay, allDay))).toBe(true);
    expect(continuesOn(week({ closed: false, open: '18:00', close: '00:00' }, { closed: true }))).toBe(false);
    expect(continuesOn(week({ closed: false, open: '18:00', close: '00:00' }, { closed: false }))).toBe(false);
    expect(continuesOn(week({ closed: true }, allDay))).toBe(false);
  });
});

describe('stationFit', () => {
  const museum = osm([[600, 1080]]);

  it('names a closing during the stay: arrival 17:20, a stay until 18:20 and closing at 18:00', () => {
    expect(stationFit(museum, at('17:20'), 60)).toEqual({ kind: 'closes', source: 'osm', window: [600, 1080] });
  });

  it('is open from the arrival to the end of the stay, and checks the arrival alone without a stay', () => {
    expect(stationFit(museum, at('16:30'), 90)).toEqual({ kind: 'open', source: 'osm', window: [600, 1080] });
    expect(stationFit(museum, at('17:59'), 0)).toEqual({ kind: 'open', source: 'osm', window: [600, 1080] });
    expect(stationFit(museum, at('17:50'), null)).toEqual({ kind: 'open', source: 'osm', window: [600, 1080] });
  });

  it('is closed at an arrival outside the windows, with the windows of the day', () => {
    expect(stationFit(museum, at('09:00'), 30)).toEqual({ kind: 'closed', source: 'osm', windows: [[600, 1080]] });
    expect(stationFit(museum, at('18:00'), null)).toEqual({ kind: 'closed', source: 'osm', windows: [[600, 1080]] });
    expect(stationFit({ source: 'place', windows: [], continues: false }, at('12:00'), 30)).toEqual({
      kind: 'closedAllDay',
      source: 'place',
    });
  });

  it('takes a window to midnight as open past it only where the hours run on into the next date', () => {
    expect(stationFit(osm([[600, 1440]], true), at('23:20'), 90).kind).toBe('open');
    expect(stationFit(osm([[600, 1440]]), at('23:30'), 60)).toEqual({
      kind: 'closes',
      source: 'osm',
      window: [600, 1440],
    });
    expect(stationFit(osm([[600, 1440]]), at('23:20'), 30).kind).toBe('open');
    expect(stationFit(osm([[600, 1440]]), at('23:30', true), 60).kind).toBe('closes');
  });

  it('names the closing at midnight of OpenStreetMap hours ending at 24:00 for a stay past it', () => {
    const hours = stationHoursOn({ osm: 'Mo-Su 10:00-24:00' }, MONDAY);
    expect(stationFit(hours, at('23:30'), 60)).toEqual({ kind: 'closes', source: 'osm', window: [600, 1440] });
    expect(stationFit(stationHoursOn({ osm: '24/7' }, MONDAY), at('23:30'), 60).kind).toBe('open');
  });

  it('says nothing for hours not known, and gives unread hours back as written', () => {
    expect(stationFit(null, at('12:00'), 30)).toEqual({ kind: 'unknown' });
    expect(stationFit({ source: 'osm', unread: 'PH off' }, at('12:00'), 30)).toEqual({
      kind: 'unread',
      text: 'PH off',
    });
  });

  it('checks no arrival at or after midnight against the next day', () => {
    expect(stationFit(museum, { arrival: 1440, atLeast: false }, 30)).toEqual({ kind: 'nextDay' });
    expect(stationFit(null, { arrival: 1510, atLeast: true }, null)).toEqual({ kind: 'nextDay' });
  });

  it('for an arrival that may come later, names only a conflict no later arrival escapes', () => {
    const lunch = osm([
      [600, 720],
      [840, 1080],
    ]);
    expect(stationFit(museum, at('09:00', true), 30)).toEqual({ kind: 'uncertain', source: 'osm' });
    expect(stationFit(museum, at('12:00', true), 30)).toEqual({ kind: 'uncertain', source: 'osm' });
    expect(stationFit(museum, at('17:20', true), 60).kind).toBe('closes');
    expect(stationFit(museum, at('18:30', true), 30).kind).toBe('closed');
    expect(stationFit(lunch, at('11:30', true), 60)).toEqual({ kind: 'uncertain', source: 'osm' });
    expect(stationFit(lunch, at('13:00', true), 60)).toEqual({ kind: 'uncertain', source: 'osm' });
    expect(stationFit(osm([]), at('13:00', true), 60).kind).toBe('closedAllDay');
  });
});

describe('stationArrivals', () => {
  const line: Array<[number, number]> = [
    [48, 11],
    [48.001, 11],
    [48.002, 11],
  ];
  const stop = (lat: number, lng: number, stayMinutes?: number | null) => ({ lat, lng, stayMinutes });

  it('shares the walking time out by distance and adds the stays before each stop', () => {
    const stops = [stop(48, 11, 90), stop(48.001, 11, 30), stop(48.002, 11, 15)];
    expect(stationArrivals(stops, line, 600, 40)).toEqual([
      { arrival: 600, atLeast: false },
      { arrival: 710, atLeast: false },
      { arrival: 760, atLeast: false },
    ]);
  });

  it('makes every arrival after a stay not known a lower bound; a stay of 0 is known', () => {
    expect(stationArrivals([stop(48, 11), stop(48.001, 11, 30), stop(48.002, 11)], line, 600, 40)).toEqual([
      { arrival: 600, atLeast: false },
      { arrival: 620, atLeast: true },
      { arrival: 670, atLeast: true },
    ]);
    expect(stationArrivals([stop(48, 11, 0), stop(48.002, 11, null)], line, 600, 40)).toEqual([
      { arrival: 600, atLeast: false },
      { arrival: 640, atLeast: false },
    ]);
  });

  it("gives a loop's end the end of the walk, not its start", () => {
    const loop: Array<[number, number]> = [
      [48, 11],
      [48.001, 11],
      [48.001, 11.0015],
      [48, 11.0015],
      [48, 11],
    ];
    const arrivals = stationArrivals([stop(48, 11, 0), stop(48.001, 11.0015, 0), stop(48, 11, 0)], loop, 540, 60);
    expect(arrivals?.map((arrival) => arrival.arrival)).toEqual([540, 570, 600]);
  });

  it('matches a stop passed out and back where the walk passes it in its turn', () => {
    const outAndBack: Array<[number, number]> = [...line, [48.001, 11], [48, 11]];
    const back = stationArrivals([stop(48, 11, 0), stop(48.002, 11, 0), stop(48.001, 11, 0)], outAndBack, 600, 40);
    expect(back?.map((arrival) => arrival.arrival)).toEqual([600, 620, 630]);
    const out = stationArrivals([stop(48, 11, 0), stop(48.001, 11, 0), stop(48.002, 11, 0)], outAndBack, 600, 40);
    expect(out?.map((arrival) => arrival.arrival)).toEqual([600, 610, 620]);
  });

  it('gives each stop its share of the route, from 0 at the start to 1 at the end', () => {
    const shares = stationShares([stop(48, 11), stop(48.001, 11), stop(48.002, 11)], line) ?? [];
    expect(shares).toHaveLength(3);
    expect(shares[0]).toBe(0);
    expect(shares[1]).toBeCloseTo(0.5, 6);
    expect(shares[2]).toBe(1);
    expect(stationShares([stop(48, 11)], [[48, 11]])).toBeNull();
  });

  it('is null without a start, a walking time or a route', () => {
    const stops = [stop(48, 11, 10)];
    expect(stationArrivals(stops, line, null, 40)).toBeNull();
    expect(stationArrivals(stops, line, 600, null)).toBeNull();
    expect(stationArrivals(stops, [[48, 11]], 600, 40)).toBeNull();
    expect(stationArrivals([], line, 600, 40)).toEqual([]);
  });
});
