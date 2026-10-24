// FE-PLANNER-PLACEFORM-125: the place form of a tour (TIME-02)
import type { TourListItem } from '@trek/shared';

import { buildAssignment, buildPlace } from '../../../tests/helpers/factories';
import { placeFormProps, seedPlaceFormStores } from '../../../tests/helpers/placeFormSetup';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import PlaceFormModal from './PlaceFormModal';

// CustomTimePicker as a plain text input, see TimePickerStub.
vi.mock('../shared/CustomTimePicker', async () => ({
  default: (await import('../../../tests/helpers/placeForm')).TimePickerStub,
}));

beforeEach(() => {
  resetAllStores();
  seedPlaceFormStores();
});

describe('PlaceFormModal for a tour', () => {
  it('FE-PLANNER-PLACEFORM-125: a tour with a start and no end says below its times the end it works out to (TIME-02)', () => {
    const place = buildPlace({ id: 7, name: 'Ridge', place_time: '09:00', end_time: null });
    const assignment = buildAssignment({ id: 42, day_id: 3, place });
    const tour: TourListItem = {
      place_id: 7,
      name: 'Ridge',
      tour_type: 'hike',
      distance: 8,
      elevation_gain: 300,
      elevation_loss: 300,
      duration: 150,
      planned_duration_minutes: null,
      break_additional_minutes: 30,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: 2,
      planned: true,
      caution: false,
    };
    const { unmount } = render(
      <PlaceFormModal {...placeFormProps} place={place} assignmentId={42} dayAssignments={[assignment]} tour={tour} />
    );
    expect(screen.getByTestId('tour-day-end-hint')).toHaveTextContent(
      'Left empty, the end is worked out: 12:00, the start plus the tour time of 3 h.'
    );
    unmount();
    render(<PlaceFormModal {...placeFormProps} place={place} assignmentId={42} dayAssignments={[assignment]} />);
    expect(screen.queryByTestId('tour-day-end-hint')).not.toBeInTheDocument();
  });
});
