import type { TourListItem } from '@trek/shared';
import en from '@trek/shared/i18n/en';
import { describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildPlace } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useTourVisitStore } from '../../../../store/tourVisitStore';
import { PlaceRow } from './MPlanTimelineRows';

const place = buildPlace({ id: 42, name: 'Ridge', route_geometry: '[[48,11],[49,12]]' });
const tour: TourListItem = {
  place_id: 42,
  name: 'Ridge',
  tour_type: 'hike',
  distance: 4,
  elevation_gain: 100,
  elevation_loss: 80,
  duration: 53,
  break_additional_minutes: 10,
  planned_duration_minutes: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: true,
  caution: false,
};
const props = {
  assignment: buildAssignment({ id: 9, day_id: 1, place }),
  fullPlace: place,
  linkedReservations: [],
  chrome: { editing: false, t: (key: string) => en[key] ?? key, language: 'en', timeFormat: '24h' },
  reorder: null,
  onOpen: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
};

describe('RC-01 mobile PLAN Tour rows', () => {
  it.each([false, true])(
    'renders Tour facet icon and facts without changing row activation (editing=%s)',
    (editing) => {
      const onOpen = vi.fn();
      render(<PlaceRow {...props} tour={tour} chrome={{ ...props.chrome, editing }} onOpen={onOpen} />);
      expect(screen.getByTestId('plan-tour-icon').querySelector('.lucide-mountain')).toBeTruthy();
      expect(screen.getByTestId('trip-plan-tour-planned-duration')).toHaveTextContent('1 h 3 min');
      fireEvent.click(screen.getByTestId('trip-plan-tour-walking-time'));
      expect(screen.getByRole('note')).toHaveTextContent('Walking time: 53 min');
      expect(onOpen).not.toHaveBeenCalled();
      fireEvent.click(screen.getByText('Ridge'));
      expect(onOpen).toHaveBeenCalledOnce();
    }
  );

  it('leaves a route-backed ordinary Place/Legacy Track on the existing avatar path', () => {
    render(<PlaceRow {...props} />);
    expect(screen.getByText('Ridge')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-tour-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plan-tour-facts')).not.toBeInTheDocument();
  });

  it("CW-03: a city walk's row shows the stops visited on its own day, a tap not opening the row", () => {
    useTourVisitStore.setState({
      tripId: '1',
      byAssignment: { 9: { 'stop-01': 'visited', 'stop-02': 'visited' }, 10: { 'stop-03': 'visited' } },
    });
    const onOpen = vi.fn();
    const walk: TourListItem = { ...tour, tour_type: 'walk', max_hiking_difficulty: null, station_count: 5 };
    render(<PlaceRow {...props} tour={walk} onOpen={onOpen} />);
    const progress = screen.getByTestId('plan-walk-progress');
    expect(progress).toHaveTextContent('2/5');
    fireEvent.click(progress);
    expect(screen.getByRole('note')).toHaveTextContent('2 of 5 visited');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('TIME-02-019: a tour with a start shows its end worked out in the time chip, and its overrun below', () => {
    const assignment = buildAssignment({
      id: 9,
      day_id: 1,
      assignment_time: '09:00',
      place: { ...place, place_time: '09:00' },
    });
    const overrun = { name: 'Lunch', time: '10:00', end: '10:03' };
    render(<PlaceRow {...props} assignment={assignment} tour={tour} overrun={overrun} />);
    // 53 min walking and 10 min of breaks.
    expect(screen.getByTestId('tour-day-end-worked-out')).toHaveTextContent('10:03');
    expect(screen.getByTestId('tour-day-overrun')).toHaveTextContent('Ends at 10:03, after Lunch starts at 10:00');
  });

  it('CW-03: a hike on a day with marks shows no progress', () => {
    useTourVisitStore.setState({ tripId: '1', byAssignment: { 9: { 'stop-01': 'visited' } } });
    render(<PlaceRow {...props} tour={tour} />);
    expect(screen.queryByTestId('plan-walk-progress')).not.toBeInTheDocument();
  });
});
