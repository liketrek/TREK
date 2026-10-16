import { describe, expect, it } from 'vitest';
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
    fireEvent.click(screen.getByRole('button', { name: /Paddle tour/ }));
    expect(hike.setTourType).toHaveBeenCalledWith('kayak');
  });

  it('a paddle tour asks for exactly one boat and its water, and says so until both are chosen', () => {
    const paddleTour = planner({ paddleIncomplete: true });
    render(<TourTypeFields planner={paddleTour} locked={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Canoe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lake' }));
    expect(paddleTour.paddle.setBoatType).toHaveBeenCalledWith('canoe');
    expect(paddleTour.paddle.setWaterContext).toHaveBeenCalledWith('lake');
    expect(screen.getByRole('status')).toBeInTheDocument();
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
