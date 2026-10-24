import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { hikePlannerDefaults } from '../../../../tests/helpers/tourPlannerStub';
import { TourTypeFields } from './TourTypeFields';
import type { TourPlannerController } from './useTourPlanner';

/** A planner as far as the type fields read it: a paddle tour unless told otherwise. */
function planner(overrides: Record<string, unknown> = {}, paddle: Record<string, unknown> = {}) {
  const base = hikePlannerDefaults();
  return {
    ...base,
    tourType: 'kayak',
    isPaddle: true,
    paddle: { ...base.paddle, recommendedSpeedKmh: 4, effectiveSpeedKmh: 4, ...paddle },
    ...overrides,
  } as unknown as TourPlannerController;
}

describe('TourTypeFields (PAD-01)', () => {
  it('a hike shows the type switch only, and choosing paddle is handed to the planner', () => {
    const hike = planner({ tourType: 'hike', isPaddle: false });
    render(<TourTypeFields planner={hike} locked={false} />);
    expect(screen.queryByTestId('tour-planner-paddle-fields')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-planner-bike-fields')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tour-type-select'));
    fireEvent.click(screen.getByTestId('tour-type-option-kayak'));
    expect(hike.setTourType).toHaveBeenCalledWith('kayak');
  });

  it('BIK-01: the type is one field that lists every type with what it plans, the one chosen marked', () => {
    const hike = planner({ tourType: 'hike', isPaddle: false });
    render(<TourTypeFields planner={hike} locked={false} />);
    const field = screen.getByTestId('tour-type-select');
    expect(field).toHaveTextContent('Hike');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(field);
    expect(field).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('tour-type-option-hike')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('tour-type-option-bike')).toHaveTextContent(
      'By bike, routed for touring, road, gravel or MTB'
    );
    // SKI-02: ski and winter tours are planned too, under the type's new name.
    expect(screen.getByTestId('tour-type-option-ski')).toHaveTextContent('Ski & winter');
    fireEvent.click(screen.getByTestId('tour-type-option-bike'));
    expect(hike.setTourType).toHaveBeenCalledWith('bike');
    expect(field).toHaveAttribute('aria-expanded', 'false');
  });

  it('CW-01: a city walk is a type of its own, on foot from stop to stop, with no fields of a bike or a boat', () => {
    const hike = planner({ tourType: 'hike', isPaddle: false });
    const { unmount } = render(<TourTypeFields planner={hike} locked={false} />);
    fireEvent.click(screen.getByTestId('tour-type-select'));
    const option = screen.getByTestId('tour-type-option-walk');
    expect(option).toHaveTextContent('City / sightseeing walk');
    expect(option).toHaveTextContent('On foot from stop to stop, without a hiking limit');
    fireEvent.click(option);
    expect(hike.setTourType).toHaveBeenCalledWith('walk');
    unmount();

    render(<TourTypeFields planner={planner({ tourType: 'walk', isPaddle: false })} locked={false} />);
    expect(screen.getByTestId('tour-type-select')).toHaveTextContent('City / sightseeing walk');
    expect(screen.queryByTestId('tour-planner-paddle-fields')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-planner-bike-fields')).not.toBeInTheDocument();
  });

  it('BIK-01 to BIK-04: a bike tour names its profile like a boat, with what the profile asks for', () => {
    const bike = planner({ tourType: 'bike', isPaddle: false, isBike: true, bikeProfile: 'gravel' });
    render(<TourTypeFields planner={bike} locked={false} />);
    expect(screen.queryByTestId('tour-planner-paddle-fields')).not.toBeInTheDocument();
    const fields = screen.getByTestId('tour-planner-bike-fields');
    expect(fields).toHaveTextContent('Takes gravel and farm tracks, not technical singletrails.');
    fireEvent.click(screen.getByRole('button', { name: 'MTB' }));
    expect(bike.setBikeProfile).toHaveBeenCalledWith('mtb');
  });

  it('a paddle tour asks for exactly one boat and its water, and says so until both are chosen', () => {
    const paddleTour = planner({ paddleIncomplete: true });
    render(<TourTypeFields planner={paddleTour} locked={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Canoe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lake' }));
    expect(paddleTour.paddle.setBoatType).toHaveBeenCalledWith('canoe');
    expect(paddleTour.paddle.setWaterContext).toHaveBeenCalledWith('lake');
    // What the tour still needs speaks here; the obstacles on the water moved into the checklist card.
    const notes = screen.getAllByRole('status').map((note) => note.textContent);
    expect(notes).toContain('Choose the boat and the water to save this paddle tour.');
    expect(notes).not.toContain('Loading the obstacles along the route …');
  });

  it('reads a typed speed with either decimal separator, and an empty field as the suggestion', () => {
    const paddleTour = planner();
    render(<TourTypeFields planner={paddleTour} locked={false} />);
    const input = screen.getByPlaceholderText('4');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '4,5' } });
    expect(paddleTour.paddle.setSpeedKmh).toHaveBeenLastCalledWith(4.5);
    fireEvent.change(input, { target: { value: 'fast' } });
    expect(paddleTour.paddle.setSpeedKmh).toHaveBeenLastCalledWith(Number.NaN);
    fireEvent.change(input, { target: { value: '' } });
    expect(paddleTour.paddle.setSpeedKmh).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
  });

  it('offers the boat suggestion beside a speed of the paddler own, taken only on purpose', () => {
    const paddleTour = planner({}, { boatType: 'kayak', speedKmh: 6 });
    render(<TourTypeFields planner={paddleTour} locked={false} />);
    fireEvent.click(screen.getByRole('button', { name: /4 km\/h/ }));
    expect(paddleTour.paddle.adoptRecommendedSpeed).toHaveBeenCalled();
  });

  it('names a speed that does not hold, and asks for one where the boat has no suggestion', () => {
    const { unmount } = render(
      <TourTypeFields planner={planner({ paddleSpeedInvalid: true }, { speedKmh: Number.NaN })} locked={false} />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    unmount();
    render(
      <TourTypeFields
        planner={planner({}, { boatType: 'other', recommendedSpeedKmh: null, effectiveSpeedKmh: null })}
        locked={false}
      />
    );
    expect(screen.getByText(/enter a speed|speed of your own/i)).toBeInTheDocument();
  });
});

describe('TourTypeFields ski and winter (SKI-02)', () => {
  const skiPlanner = (overrides: Record<string, unknown> = {}) =>
    planner({ tourType: 'ski', isPaddle: false, isSki: true, skiMissing: 'discipline', ...overrides });

  it('offers six disciplines with nothing chosen, says what is missing and how the legs are drawn', () => {
    const ski = skiPlanner();
    render(<TourTypeFields planner={ski} locked={false} />);
    const fields = screen.getByTestId('tour-planner-ski-fields');
    for (const name of ['Alpine', 'Snowboard', 'Cross-country', 'Ski touring', 'Snowshoeing', 'Winter hiking']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
    expect(fields).toHaveTextContent('Choose a discipline to save the tour.');
    expect(fields).toHaveTextContent('Legs follow runs, lifts and trails from OpenStreetMap');
    // No router options before a discipline is chosen.
    expect(screen.queryByTestId('tour-planner-ski-options')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-planner-paddle-fields')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Snowshoeing' }));
    expect(ski.ski.change).toHaveBeenCalledWith({ discipline: 'snowshoe', technique: null });
  });

  it('asks a cross-country tour for its technique and keeps it dimmed for any other discipline', () => {
    const crossCountry = skiPlanner({
      ski: {
        choice: { discipline: 'cross_country', technique: null },
        change: vi.fn(),
        setOption: vi.fn(),
        load: vi.fn(),
      },
      skiMissing: 'technique',
    });
    const { unmount } = render(<TourTypeFields planner={crossCountry} locked={false} />);
    expect(screen.getByTestId('tour-ski-technique')).not.toBeDisabled();
    expect(screen.getByTestId('tour-planner-ski-fields')).toHaveTextContent('Choose the technique, or Unknown.');
    fireEvent.click(screen.getByRole('button', { name: 'Skating' }));
    expect(crossCountry.ski.change).toHaveBeenCalledWith({ discipline: 'cross_country', technique: 'skating' });
    unmount();

    const alpine = skiPlanner({
      ski: { choice: { discipline: 'alpine', technique: null }, change: vi.fn(), setOption: vi.fn(), load: vi.fn() },
      skiMissing: null,
    });
    render(<TourTypeFields planner={alpine} locked={false} />);
    expect(screen.getByTestId('tour-ski-technique')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Alpine' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // The piste router's options for the discipline chosen, each change handed to the planner.
    expect(screen.getByTestId('tour-planner-ski-options')).toHaveTextContent('Hardest runs');
    fireEvent.click(screen.getByRole('button', { name: 'Sporty' }));
    expect(alpine.ski.setOption).toHaveBeenCalledWith({ pace: 'sporty' });
  });

  it('shows no ski fields on any other tour', () => {
    render(<TourTypeFields planner={planner({ tourType: 'hike', isPaddle: false })} locked={false} />);
    expect(screen.queryByTestId('tour-planner-ski-fields')).not.toBeInTheDocument();
  });
});

describe('TourTypeFields lake style (PAD-11)', () => {
  it('asks how to cross lakes on lake water or a route over a lake, straight over by default, and hands a change on', () => {
    const river = planner({}, { waterContext: 'river' });
    const { rerender } = render(<TourTypeFields planner={river} locked={false} />);
    expect(screen.queryByTestId('tour-planner-lake-style')).not.toBeInTheDocument();

    const lake = planner({}, { waterContext: 'lake' });
    rerender(<TourTypeFields planner={lake} locked={false} />);
    expect(screen.getByRole('button', { name: 'Straight over' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('The shortest line across open water.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Near the shore' }));
    expect(lake.paddle.setLakeStyle).toHaveBeenCalledWith('shore');

    const lakeLeg = {
      status: 'ok',
      geometry: [
        [53.4, 12.7],
        [53.5, 12.7],
      ],
      segments: [{ kind: 'lake', from: 0, to: 1, name: null, source: null, osm_ref: null, grade: null }],
      distance_m: 11000,
      snapped_m: { from: 0, to: 0 },
    };
    const crossing = planner({ paddleRoute: { legs: [lakeLeg] } }, { waterContext: 'river', lakeStyle: 'shore' });
    rerender(<TourTypeFields planner={crossing} locked={false} />);
    expect(screen.getByRole('button', { name: 'Near the shore' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Stays near the bank, for windy days: longer, but land is never far.')).toBeInTheDocument();
  });
});
