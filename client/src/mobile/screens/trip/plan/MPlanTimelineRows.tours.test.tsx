import type { TourListItem } from '@trek/shared';
import en from '@trek/shared/i18n/en';
import { describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildPlace } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
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
});
