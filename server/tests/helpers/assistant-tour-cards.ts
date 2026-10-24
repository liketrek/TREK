import type { TourListCard, TourRouteCard } from '@trek/shared';

/**
 * Tour cards as the tours package builds them, valid against the card union,
 * for suites that hand a card through the stream, a stored part or a change
 * preview and need one the strict write accepts.
 */

/** A short routed hike with every field the kind declares. */
export function tourRouteCard(extra: Partial<TourRouteCard> = {}): TourRouteCard {
  return {
    kind: 'tourRoute',
    source: 'proposal',
    activity: 'hike',
    placeId: null,
    name: 'Ridge walk',
    label: null,
    distanceM: 1112,
    ascentM: 80,
    descentM: 0,
    minEleM: 800,
    maxEleM: 880,
    minutes: 22,
    minutesBasis: 'din33466',
    limit: 2,
    grades: null,
    routed: true,
    problem: null,
    line: [
      [47.6, 11.3, 800],
      [47.605, 11.3, 840],
      [47.61, 11.3, 880],
    ],
    stretches: [],
    stops: [
      {
        role: 'start',
        kind: null,
        name: 'Car park',
        lat: 47.6,
        lng: 11.3,
        atM: 0,
        offM: null,
        minutes: 0,
        clock: null,
        stayMinutes: null,
        stageEnd: false,
        flag: null,
      },
      {
        role: 'end',
        kind: 'peak',
        name: 'Summit',
        lat: 47.61,
        lng: 11.3,
        atM: 1112,
        offM: null,
        minutes: 22,
        clock: null,
        stayMinutes: null,
        stageEnd: false,
        flag: null,
      },
    ],
    stages: null,
    skiScheme: null,
    schedule: null,
    warnings: [],
    previous: null,
    ...extra,
  };
}

/** One saved tour of a trip as a list. */
export function tourListCard(extra: Partial<TourListCard> = {}): TourListCard {
  return {
    kind: 'tourList',
    dayId: null,
    more: 0,
    rows: [
      {
        placeId: 77,
        name: 'Ridge walk',
        activity: 'hike',
        limit: 2,
        distanceM: 1112,
        ascentM: 80,
        minutes: 22,
        stages: null,
        days: [2],
      },
    ],
    ...extra,
  };
}
