import type { ChargingCard, RoadtripCard, RoadtripCardDay, RoadtripCardStop } from '@trek/shared';

/**
 * Road trip cards as the server builds them, for the road trip card tests: a
 * day from Munich over a charger to the airport, a flight to Rome and the
 * night booked there, and a second day on to Florence.
 */

export function cardStop(name: string, extra: Partial<RoadtripCardStop> = {}): RoadtripCardStop {
  return {
    placeId: 1,
    assignmentId: 10,
    name,
    lat: 48.137,
    lng: 11.575,
    stopType: null,
    time: null,
    leaveAt: null,
    dwellMinutes: 30,
    offRoadM: null,
    fillPercent: null,
    night: null,
    autoNight: null,
    bookend: null,
    carrier: null,
    arrival: '08:00',
    departure: '08:30',
    anchored: false,
    dayOffset: 0,
    late: [],
    findings: [],
    ...extra,
  };
}

export const MUNICH_DAY: RoadtripCardDay = {
  dayId: 31,
  dayNumber: 1,
  date: '2026-10-01',
  title: 'Munich to Rome',
  distanceM: 110_000,
  durationS: 12_300,
  stops: [
    cardStop('Munich'),
    cardStop('Ionity Holzkirchen', {
      placeId: 2,
      assignmentId: 20,
      lat: 47.883,
      lng: 11.701,
      stopType: 'charging',
      arrival: '09:00',
      departure: '09:30',
      findings: [{ code: 'leg', overMinutes: 25, sinceKm: null }],
    }),
    cardStop('Munich Airport', {
      placeId: null,
      assignmentId: null,
      lat: 48.354,
      lng: 11.786,
      carrier: { reservationId: 9, type: 'flight', role: 'departure', title: 'LH 1840', code: 'MUC', at: '11:05' },
      arrival: '10:15',
      late: [{ code: 'late', minutes: 15 }],
    }),
    cardStop('Rome Fiumicino', {
      placeId: null,
      assignmentId: null,
      lat: 41.8,
      lng: 12.25,
      carrier: { reservationId: 9, type: 'flight', role: 'arrival', title: 'LH 1840', code: 'FCO', at: '12:50' },
      arrival: '12:50',
    }),
    cardStop('Hotel Roma', {
      placeId: 5,
      assignmentId: null,
      lat: 41.9,
      lng: 12.5,
      stopType: 'hotel',
      bookend: {
        phase: 'evening',
        reservationId: null,
        checkingIn: true,
        checkingOut: false,
        checkIn: '15:00',
        checkOut: null,
      },
      arrival: '14:00',
      departure: null,
    }),
  ],
  moreStops: 2,
  legs: [
    { distanceM: 30_000, durationS: 1800, mode: 'driving' },
    { distanceM: 52_000, durationS: 2700, mode: 'driving' },
    { distanceM: 0, durationS: 6300, mode: 'flight' },
    { distanceM: 28_000, durationS: 1500, mode: 'driving' },
  ],
  dayOver: { minutes: 400, limitMinutes: 360 },
  avoidMissed: ['toll'],
  dryKm: null,
  lines: [
    [
      [48.137, 11.575],
      [47.883, 11.701],
      [48.354, 11.786],
    ],
    [
      [41.8, 12.25],
      [41.9, 12.5],
    ],
  ],
};

export const FLORENCE_DAY: RoadtripCardDay = {
  dayId: 32,
  dayNumber: 2,
  date: '2026-10-02',
  title: null,
  distanceM: 275_000,
  durationS: 10_800,
  stops: [
    cardStop('Rome', { placeId: 6, assignmentId: 60, lat: 41.9, lng: 12.5 }),
    cardStop('Florence', { placeId: 7, assignmentId: 70, lat: 43.77, lng: 11.25, arrival: '12:30', departure: null }),
  ],
  moreStops: 0,
  legs: [{ distanceM: 275_000, durationS: 10_800, mode: 'driving' }],
  dayOver: null,
  avoidMissed: [],
  dryKm: null,
  lines: [
    [
      [41.9, 12.5],
      [43.77, 11.25],
    ],
  ],
};

export const DRIVE: RoadtripCard = {
  kind: 'roadtrip',
  complete: true,
  problem: null,
  previewKeys: [],
  vehicle: 'electric',
  defaultFill: 80,
  dayColors: true,
  distanceM: 385_000,
  durationS: 23_100,
  stopCount: 7,
  chargingCount: 1,
  days: [MUNICH_DAY, FLORENCE_DAY],
  moreDays: 3,
  quietDays: 0,
  undatedRides: 0,
};

export function charger(extra: Partial<ChargingCard> = {}): ChargingCard {
  return {
    kind: 'charging',
    placeId: 2,
    name: 'Ionity Holzkirchen',
    station: null,
    lat: 47.883,
    lng: 11.701,
    status: 'ok',
    stale: false,
    available: 4,
    total: 6,
    checkedAt: '2026-10-01T07:38:00Z',
    updatedAt: null,
    energy: { amount: 0.59, currency: 'EUR' },
    otherPrices: 1,
    source: 'MobiData BW',
    license: 'CC BY 4.0',
    ...extra,
  };
}
