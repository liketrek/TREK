import type { TourListCard, TourRouteCard, TourRouteStop } from '@trek/shared';

/**
 * Tour cards as the server builds them, for the tour card tests: a hike up
 * the Hochfelln from Bergen on day 2 at 8:00, graded T3 at the top, with a
 * hut and a water tap on the way, thunder forecast for late morning; and the
 * saved tours of a trip as the sidebar lists them.
 */

export function tourStop(extra: Partial<TourRouteStop> = {}): TourRouteStop {
  return {
    role: 'via',
    kind: null,
    name: null,
    lat: 47.77,
    lng: 12.59,
    atM: 0,
    offM: null,
    minutes: null,
    clock: null,
    stayMinutes: null,
    stageEnd: false,
    flag: null,
    ...extra,
  };
}

/** The line, about 4.1 km up and as far back down, each point with its height. */
export const HIKE_LINE: TourRouteCard['line'] = [
  [47.77, 12.59, 600],
  [47.775, 12.6, 760],
  [47.78, 12.61, 920],
  [47.785, 12.615, 1080],
  [47.79, 12.62, 1240],
  [47.795, 12.625, 1400],
  [47.79, 12.63, 1240],
  [47.78, 12.62, 920],
  [47.77, 12.59, 600],
];

export const HIKE: TourRouteCard = {
  kind: 'tourRoute',
  source: 'proposal',
  activity: 'hike',
  placeId: null,
  name: 'Hochfelln from Bergen',
  label: null,
  distanceM: 8200,
  ascentM: 640,
  descentM: 640,
  minEleM: 600,
  maxEleM: 1400,
  minutes: 200,
  minutesBasis: 'din33466',
  limit: 3,
  grades: { highest: 3, unknownShare: 0.1 },
  routed: true,
  problem: null,
  line: HIKE_LINE,
  stretches: [
    { facet: 'sac', fromM: 0, toM: 3000, step: 2 },
    { facet: 'sac', fromM: 3000, toM: 4100, step: 3 },
  ],
  stops: [
    tourStop({ role: 'start', name: 'Bergen', atM: 0, minutes: 0, clock: '08:00' }),
    tourStop({ role: 'along', kind: 'drinking_water', name: null, lat: 47.776, atM: 1200, offM: 80 }),
    tourStop({
      role: 'via',
      kind: 'shelter',
      name: 'Strausshütte',
      lat: 47.78,
      atM: 2400,
      minutes: 100,
      clock: '09:40',
    }),
    tourStop({ role: 'via', kind: 'peak', name: 'Hochfelln', lat: 47.795, atM: 4100, minutes: 150, clock: '10:30' }),
    tourStop({ role: 'end', name: 'Bergen', atM: 8200, minutes: 200, clock: '11:20' }),
  ],
  stages: null,
  skiScheme: null,
  schedule: {
    date: '2026-10-14',
    dayId: 22,
    dayNumber: 2,
    start: '08:00',
    arrive: '11:20',
    nextDay: false,
    sunrise: '07:00',
    sunset: '18:00',
    latestStart: null,
    weather: 'forecast',
    hours: [
      { hour: 8, main: 'Clear', tempC: 9, rainPct: 0, windKmh: 10 },
      { hour: 9, main: 'Clouds', tempC: 11, rainPct: 10, windKmh: 12 },
      { hour: 10, main: 'Rain', tempC: 13, rainPct: 40, windKmh: 15 },
      { hour: 11, main: 'Thunderstorm', tempC: 14, rainPct: 70, windKmh: 30 },
    ],
  },
  warnings: [{ kind: 'thunder', at: '11:00', count: null }],
  previous: null,
};

/** Another way up, longer and gentler, as a second proposal of one answer. */
export const GENTLE: TourRouteCard = {
  ...HIKE,
  label: 'Long and gentle',
  distanceM: 9800,
  ascentM: 520,
  descentM: 520,
  minutes: 225,
  grades: { highest: 2, unknownShare: 0.6 },
  stretches: [{ facet: 'sac', fromM: 0, toM: 9800, step: 2 }],
};

/** A saved tour as get_tour_plan reads it: no schedule, no grades, the line in brief. */
export const SAVED: TourRouteCard = {
  ...HIKE,
  source: 'saved',
  placeId: 41,
  label: null,
  minutesBasis: 'planned',
  grades: null,
  schedule: null,
  warnings: [],
  stops: [HIKE.stops[0] as TourRouteStop, HIKE.stops[4] as TourRouteStop],
};

export const TOUR_LIST: TourListCard = {
  kind: 'tourList',
  dayId: null,
  more: 2,
  rows: [
    {
      placeId: 41,
      name: 'Hochfelln from Bergen',
      activity: 'hike',
      limit: 3,
      distanceM: 8200,
      ascentM: 640,
      minutes: 200,
      stages: null,
      days: [2],
    },
    {
      placeId: 42,
      name: 'Chiemsee by kayak',
      activity: 'kayak',
      limit: null,
      distanceM: 12000,
      ascentM: null,
      minutes: null,
      stages: null,
      days: [],
    },
  ],
};
