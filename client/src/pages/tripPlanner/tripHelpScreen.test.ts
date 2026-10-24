import { describe, expect, it } from 'vitest';
import { tripHelpScreen, type TripHelpState } from './tripHelpScreen';

const base: TripHelpState = {
  activeTab: 'plan',
  roadtripActive: false,
  tourCardOpen: false,
  placeOpen: false,
  dayDetailOpen: false,
  toursList: false,
  plannerMode: 'neutral',
  plannerTourType: 'hike',
};
const all = () => true;

describe('tripHelpScreen', () => {
  it('names the frame on a bare plan', () => {
    expect(tripHelpScreen(base, all)).toBe('trip');
  });

  it('names the tour card before the place it also selects', () => {
    expect(tripHelpScreen({ ...base, tourCardOpen: true, placeOpen: true }, all)).toBe('trip-tour-detail');
  });

  it('names the tours list while the column shows it', () => {
    expect(tripHelpScreen({ ...base, toursList: true }, all)).toBe('trip-tours');
  });

  it('keeps the place card and the day details ahead of the tours list', () => {
    expect(tripHelpScreen({ ...base, toursList: true, placeOpen: true }, all)).toBe('trip-place');
    expect(tripHelpScreen({ ...base, toursList: true, dayDetailOpen: true }, all)).toBe('trip-day-detail');
  });

  it('names the road trip over everything on the plan', () => {
    expect(tripHelpScreen({ ...base, roadtripActive: true, tourCardOpen: true }, all)).toBe('trip-roadtrip');
  });

  it('maps the historical tab ids to their screens', () => {
    expect(tripHelpScreen({ ...base, activeTab: 'buchungen' }, all)).toBe('trip-bookings');
    expect(tripHelpScreen({ ...base, activeTab: 'transports' }, all)).toBe('trip-transports');
  });

  it('names the kind of tour the Tours tab is drawing', () => {
    const tab = { ...base, activeTab: 'tour-planner' };
    expect(tripHelpScreen({ ...tab, plannerMode: 'new-draft', plannerTourType: 'run' }, all)).toBe('trip-tour-hike');
    expect(tripHelpScreen({ ...tab, plannerMode: 'edit-saved', plannerTourType: 'kayak' }, all)).toBe(
      'trip-tour-paddle'
    );
    expect(tripHelpScreen({ ...tab, plannerMode: 'view-gpx' }, all)).toBe('trip-tour-import');
    expect(tripHelpScreen(tab, all)).toBe('trip-tour-planner');
  });

  it('falls back to the next screen up when one has no help', () => {
    const only =
      (...ids: string[]) =>
      (id: string) =>
        ids.includes(id);
    expect(tripHelpScreen({ ...base, tourCardOpen: true }, only('trip-tours'))).toBe('trip-tours');
    expect(
      tripHelpScreen(
        { ...base, activeTab: 'tour-planner', plannerMode: 'new-draft', plannerTourType: 'ski' },
        only('trip-tour-planner')
      )
    ).toBe('trip-tour-planner');
    expect(tripHelpScreen({ ...base, activeTab: 'journal' }, only())).toBe('trip');
    expect(tripHelpScreen({ ...base, activeTab: 'plugin:koffi' }, only())).toBe('trip');
  });
});
