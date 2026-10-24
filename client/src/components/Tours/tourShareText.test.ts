import type { TourListItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { formatDistance, formatElevation } from '../../utils/units';
import { formatPlannedTourDuration } from './tourPresentation';
import { plannerShareFacts, tourShareFactsOf, tourShareText, type TourShareFacts } from './tourShareText';

/** A translator that names the key and fills its placeholders, so the lines can be read. */
const t = (key: string, params?: Record<string, unknown>) =>
  params
    ? `${key}(${Object.entries(params)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(',')})`
    : key;

const facts: TourShareFacts = { tourType: 'hike', distanceKm: 12.4, gain: 830, minutes: 245 };

function listed(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    tour_type: 'hike',
    distance: 9,
    elevation_gain: 500,
    elevation_loss: 480,
    duration: 180,
    planned_duration_minutes: null,
    break_additional_minutes: null,
    has_waypoints: true,
    ...overrides,
  } as TourListItem;
}

describe('tourShareText', () => {
  it('says the name, type, distance, ascent, time and the trip, one per line', () => {
    expect(tourShareText({ name: ' Kramer ', facts, tripName: 'Alps 2026' }, t, 'metric').split('\n')).toEqual([
      'Kramer',
      'tourTypes.hike',
      `tours.detail.distance: ${formatDistance(12.4, 'metric')}`,
      `tours.detail.ascent: ${formatElevation(830, 'metric')}`,
      `tours.gpxExport.shareDuration(time=${formatPlannedTourDuration(245)})`,
      'tours.gpxExport.shareTrip(name=Alps 2026)',
    ]);
  });

  it('speaks the units the reader set', () => {
    const text = tourShareText({ name: 'Kramer', facts, tripName: null }, t, 'imperial');
    expect(text).toContain(formatDistance(12.4, 'imperial'));
    expect(text).toContain(formatElevation(830, 'imperial'));
  });

  it('leaves out what is not known: no facts, no values, a blank trip name', () => {
    expect(tourShareText({ name: 'Kramer', facts: null, tripName: '  ' }, t, 'metric')).toBe('Kramer');
    expect(
      tourShareText(
        { name: 'Kramer', facts: { tourType: 'bike', distanceKm: null, gain: null, minutes: null }, tripName: null },
        t,
        'metric'
      )
    ).toBe('Kramer\ntourTypes.bike');
  });
});

describe('tourShareFactsOf', () => {
  it('measures from the line where there is one, and takes the planned total over the walking time', () => {
    expect(tourShareFactsOf(listed({ planned_duration_minutes: 300 }), { distanceKm: 10.5, gain: 640 })).toEqual({
      tourType: 'hike',
      distanceKm: 10.5,
      gain: 640,
      minutes: 300,
    });
  });

  it('falls back to the saved values without a line', () => {
    expect(tourShareFactsOf(listed(), null)).toMatchObject({ distanceKm: 9, gain: 500, minutes: 180 });
  });

  it('keeps the heights of a paddle tour unknown', () => {
    expect(tourShareFactsOf(listed({ tour_type: 'kayak' }), { distanceKm: 4, gain: 12 }).gain).toBeNull();
  });
});

describe('plannerShareFacts', () => {
  const planner = {
    tourType: 'bike' as const,
    isPaddle: false,
    routeAnalysis: { distanceKm: 42, gain: 310 },
    plannedTotalMinutes: null,
    walkingDurationMinutes: 150,
  };

  it('reads the line as it is now, and the walking time where nothing is planned', () => {
    expect(plannerShareFacts(planner)).toEqual({ tourType: 'bike', distanceKm: 42, gain: 310, minutes: 150 });
    expect(plannerShareFacts({ ...planner, plannedTotalMinutes: 200 }).minutes).toBe(200);
  });

  it('knows nothing without a line, and no heights on the water', () => {
    expect(plannerShareFacts({ ...planner, routeAnalysis: null })).toMatchObject({ distanceKm: null, gain: null });
    expect(plannerShareFacts({ ...planner, tourType: 'kayak', isPaddle: true }).gain).toBeNull();
  });
});
