import type { TourListItem } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { buildPlace } from '../../../tests/helpers/factories';
import { render, screen } from '../../../tests/helpers/render';
import { TourTypeSections } from './TourTypeSections';

// Each card stands in for itself with the props it was handed, so the test
// sees which cards a tour type gets without their own data fetching.
vi.mock('./walk/WalkStations', () => ({
  WalkStationsCard: (props: { canMark: boolean; route: unknown[] | null }) => (
    <div data-testid="walk" data-can-mark={String(props.canMark)} data-points={props.route?.length ?? 0} />
  ),
}));
vi.mock('./bike/BikeWaysCard', () => ({
  BikeWaysView: (props: { bikeProfile: string | null | undefined; active: boolean }) => (
    <div data-testid="bike" data-profile={String(props.bikeProfile)} data-active={String(props.active)} />
  ),
}));
vi.mock('./paddle/PaddleCheckSection', () => ({
  PaddleCheckSection: () => <div data-testid="paddle-check" />,
}));
vi.mock('./paddle/PaddleWindCard', () => ({
  PaddleWindSection: (props: { start: { lat: number; lng: number } | null }) => (
    <div data-testid="paddle-wind" data-start={JSON.stringify(props.start)} />
  ),
}));

const tourOf = (overrides: Partial<TourListItem>): TourListItem => ({
  place_id: 42,
  name: 'Loop',
  tour_type: 'hike',
  distance: 1,
  elevation_gain: 0,
  elevation_loss: 0,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: null,
  planned: false,
  caution: false,
  ...overrides,
});

const renderFor = (tour: TourListItem, place = buildPlace({ id: 42, lat: 48, lng: 11 })) =>
  render(
    <TourTypeSections
      tour={tour}
      place={place}
      assignment={null}
      canAssign
      days={[]}
      assignments={{}}
      route={[
        [48, 11],
        [48, 11.01],
      ]}
      measured
    />
  );

describe('TourTypeSections', () => {
  it('shows a walk its stations with the route and the assign right', () => {
    renderFor(tourOf({ tour_type: 'walk' }));
    const walk = screen.getByTestId('walk');
    expect(walk).toHaveAttribute('data-can-mark', 'true');
    expect(walk).toHaveAttribute('data-points', '2');
    expect(screen.queryByTestId('bike')).not.toBeInTheDocument();
  });

  it('shows a bike tour its ways for its profile once measured', () => {
    renderFor(tourOf({ tour_type: 'bike', bike_profile: 'mtb' }));
    const bike = screen.getByTestId('bike');
    expect(bike).toHaveAttribute('data-profile', 'mtb');
    expect(bike).toHaveAttribute('data-active', 'true');
  });

  it('shows a paddle tour its check and the wind at its start', () => {
    renderFor(tourOf({ tour_type: 'kayak' }));
    expect(screen.getByTestId('paddle-check')).toBeInTheDocument();
    expect(screen.getByTestId('paddle-wind')).toHaveAttribute('data-start', JSON.stringify({ lat: 48, lng: 11 }));
  });

  it('asks for no wind where the place has no coordinates', () => {
    renderFor(tourOf({ tour_type: 'kayak' }), buildPlace({ id: 42, lat: null, lng: null }));
    expect(screen.getByTestId('paddle-wind')).toHaveAttribute('data-start', 'null');
  });

  it('renders nothing for a tour type without its own cards', () => {
    const { container } = renderFor(tourOf({ tour_type: 'hike' }));
    expect(container).toBeEmptyDOMElement();
  });
});
