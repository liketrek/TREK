import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '../../../../tests/helpers/render';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { useShapingClick } from '../planner/useShapingClick';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { WaypointLegRows } from '../planner/WaypointLegRows';
import { TourDayRowIcon } from '../TourDayRowFacts';
import { tourDayRowIcon } from '../tourDayRowIcon';
import { movingTimeLabel } from '../tourFacts';
import { HorseLegRow } from './HorseLegRow';
import type { HorseSectionLeg } from './horseSection';
import { Horseshoe } from './HorseshoeIcon';

// FE-HORSE-LEG-001 to FE-HORSE-LEG-005

const section: HorseSectionLeg = {
  kind: 'horse_route',
  ref: 'relation/42',
  name: 'Reitweg Isartal',
  geometry: [
    [48, 11],
    [48.01, 11],
  ],
  signposted: 'against',
  access: [
    { value: 'designated', length_m: 800 },
    { value: 'no', length_m: 312 },
  ],
};

function legRows(point: TourPlannerWaypoint, isHorse: boolean) {
  const planner = { isHorse, toggleWaypointFreeLeg: vi.fn() } as unknown as TourPlannerController;
  return (
    <ul>
      <WaypointLegRows
        planner={planner}
        point={point}
        index={0}
        routedLegs={null}
        paddleLayout={null}
        editable
        portageRouting={{} as never}
        regionLoad={{ byLeg: new Map(), retry: vi.fn() } as never}
      />
    </ul>
  );
}

describe('a ride in the waypoint list (HOR-01)', () => {
  it('FE-HORSE-LEG-001: a section shows its route, its length, the other signposted way and what its tags say', () => {
    render(
      <ul>
        <HorseLegRow leg={section} />
      </ul>
    );
    const row = screen.getByTestId('tour-planner-horse-leg');
    expect(row).toHaveTextContent('Reitweg Isartal');
    expect(row).toHaveTextContent('1.1 km');
    expect(within(row).getByTestId('tour-planner-horse-leg-against')).toHaveAccessibleName(
      'This section is signposted the other way.'
    );
    expect(within(row).getByTestId('tour-planner-horse-leg-access')).toHaveAccessibleName('Closed in part');
  });

  it('FE-HORSE-LEG-002: a section without a name or tags is said to have neither', () => {
    render(
      <ul>
        <HorseLegRow leg={{ ...section, name: null, access: undefined, signposted: null }} />
      </ul>
    );
    const row = screen.getByTestId('tour-planner-horse-leg');
    expect(row).toHaveTextContent('Unnamed horse route');
    expect(within(row).queryByTestId('tour-planner-horse-leg-against')).not.toBeInTheDocument();
    expect(within(row).getByTestId('tour-planner-horse-leg-access')).toHaveAccessibleName('Access not in the data');
  });

  it('FE-HORSE-LEG-003: a ride names its legs drawn by hand manual and unchecked, its sections as sections', () => {
    const drawn = { kind: 'free' as const, geometry: section.geometry };
    const { rerender } = render(legRows({ id: 'a', lat: 48, lng: 11, role: 'start', fixedLeg: drawn }, true));
    expect(screen.getByTestId('tour-planner-free-leg')).toHaveTextContent('Manual, unchecked');
    rerender(legRows({ id: 'a', lat: 48, lng: 11, role: 'start', fixedLeg: drawn }, false));
    expect(screen.getByTestId('tour-planner-free-leg')).not.toHaveTextContent('Manual, unchecked');
    rerender(legRows({ id: 'a', lat: 48, lng: 11, role: 'start', fixedLeg: section }, true));
    expect(screen.getByTestId('tour-planner-horse-leg')).toBeInTheDocument();
  });

  it('FE-HORSE-LEG-004: a ride wears the horseshoe, is named a horse ride and its time riding time', () => {
    expect(tourDayRowIcon('horse')).toBe(Horseshoe);
    render(<TourDayRowIcon type="horse" />);
    expect(screen.getByTestId('plan-tour-icon')).toHaveAttribute('aria-label', 'Horse ride');
    expect(screen.getByTestId('plan-tour-icon').querySelector('.lucide-horseshoe')).toBeTruthy();
    expect(movingTimeLabel({ tour_type: 'horse' }, 'Walking time', (key) => key)).toBe('tours.horse.time');
  });

  it('FE-HORSE-LEG-005: a click on a ride sets no shaping point', () => {
    const planner = { waypoints: [], route: null, insertShapingPoint: vi.fn(), setSelectedWaypointId: vi.fn() };
    const ride = renderHook(() => useShapingClick({ ...planner, isHorse: true }, { editable: true, picking: false }));
    expect(ride.result.current).toBeUndefined();
    const hike = renderHook(() => useShapingClick(planner, { editable: true, picking: false }));
    expect(hike.result.current).toBeTypeOf('function');
  });
});
