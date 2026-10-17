// FE-PADDLE-PLACE-001 to 004: a put-in, slipway or egress set as the next waypoint from its card (PAD-05B).
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { PaddleObstaclePlaceButton, placeOf } from './PaddleObstaclePlaceButton';

describe('placeOf', () => {
  it('FE-PADDLE-PLACE-001: takes a point as it is, the middle of a way and the middle of an outline', () => {
    expect(placeOf({ type: 'Point', coordinates: [12.9, 53.2] })).toEqual({ lat: 53.2, lng: 12.9 });
    expect(
      placeOf({
        type: 'LineString',
        coordinates: [
          [12.9, 53.2],
          [12.91, 53.21],
          [12.92, 53.22],
        ],
      })
    ).toEqual({ lat: 53.21, lng: 12.91 });
    const middle = placeOf({
      type: 'Polygon',
      coordinates: [
        [
          [12, 53],
          [12.02, 53],
          [12.02, 53.02],
          [12, 53.02],
          [12, 53],
        ],
      ],
    });
    expect(middle?.lat).toBeCloseTo(53.01, 9);
    expect(middle?.lng).toBeCloseTo(12.01, 9);
  });
});

describe('PaddleObstaclePlaceButton', () => {
  it('FE-PADDLE-PLACE-002: sets a slipway as a put-in at its spot', () => {
    const onPlace = vi.fn();
    render(
      <PaddleObstaclePlaceButton
        kind="slipway"
        geometry={{ type: 'Point', coordinates: [12.9, 53.2] }}
        onPlace={onPlace}
      />
    );
    fireEvent.click(screen.getByTestId('paddle-obstacle-place'));
    expect(onPlace).toHaveBeenCalledWith(53.2, 12.9);
    expect(screen.getByTestId('paddle-obstacle-place')).toHaveTextContent('Put in here');
  });

  it('FE-PADDLE-PLACE-003: names an egress as the place to get out', () => {
    render(
      <PaddleObstaclePlaceButton
        kind="egress"
        geometry={{ type: 'Point', coordinates: [12.9, 53.2] }}
        onPlace={vi.fn()}
      />
    );
    expect(screen.getByTestId('paddle-obstacle-place')).toHaveTextContent('Take out here');
  });

  it('FE-PADDLE-PLACE-004: offers nothing on an obstacle', () => {
    render(
      <PaddleObstaclePlaceButton
        kind="weir"
        geometry={{ type: 'Point', coordinates: [12.9, 53.2] }}
        onPlace={vi.fn()}
      />
    );
    expect(screen.queryByTestId('paddle-obstacle-place')).toBeNull();
  });
});
