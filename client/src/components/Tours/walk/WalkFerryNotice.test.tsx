import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import type { WalkFerryCrossing } from '../planner/tourRouting';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { WalkFerryNotice } from './WalkFerryNotice';

// FE-WALK-FERRY-NOTICE-001 to FE-WALK-FERRY-NOTICE-005: a city walk's crossings by boat in the planner (CW-12).

const crossing = (extra: Partial<WalkFerryCrossing> = {}): WalkFerryCrossing => ({
  leg: 0,
  geometry: [
    [45.43, 12.33],
    [45.429, 12.329],
    [45.427, 12.33],
  ],
  crossings: [[1, 2]],
  metres: 268,
  seconds: 396,
  walkSeconds: 120,
  accepted: false,
  ...extra,
});

const ZATTERE_TO_STOP_2 = [
  { id: 'a', lat: 45.43, lng: 12.33, role: 'start', name: 'Zattere' },
  { id: 'b', lat: 45.427, lng: 12.33, role: 'end', name: null },
];

function plannerWith(
  walkFerries: Partial<TourPlannerController['walkFerries']>,
  waypoints: unknown[] = ZATTERE_TO_STOP_2
) {
  const actions = { accept: vi.fn(), release: vi.fn(), show: vi.fn(), select: vi.fn() };
  const planner = {
    walkFerries: {
      crossings: [],
      pending: [],
      blocksSave: false,
      gap: null,
      acceptable: () => true,
      ...actions,
      ...walkFerries,
    },
    waypoints,
    setSelectedWaypointId: actions.select,
    canEdit: true,
    isSaving: false,
  } as unknown as TourPlannerController;
  return { planner, actions };
}

describe('WalkFerryNotice (CW-12)', () => {
  it('FE-WALK-FERRY-NOTICE-001: a crossing not taken yet names its stops, its boat time, and how to go on', () => {
    const pending = crossing();
    const { planner, actions } = plannerWith({ crossings: [pending], pending: [pending], blocksSave: true });
    render(<WalkFerryNotice planner={planner} />);
    expect(screen.getByTestId('walk-ferry')).toHaveTextContent(
      'There is no way on foot between Zattere and Stop 2: the router crosses the water by ferry here.'
    );
    expect(screen.getByTestId('walk-ferry-time')).toHaveTextContent('7 min by boat');
    fireEvent.click(screen.getByRole('button', { name: 'Take ferry' }));
    expect(actions.accept).toHaveBeenCalledWith(pending);
    fireEvent.click(screen.getByRole('button', { name: 'Show crossing' }));
    expect(actions.show).toHaveBeenCalledWith(pending);
    fireEvent.click(screen.getByRole('button', { name: 'Select stop 2' }));
    expect(actions.select).toHaveBeenCalledWith('b');
  });

  it('FE-WALK-FERRY-NOTICE-002: a crossing taken says so, and a boat time the router did not give is said to be unknown', () => {
    const kept = crossing({ accepted: true, seconds: null });
    const { planner } = plannerWith({ crossings: [kept] });
    render(<WalkFerryNotice planner={planner} />);
    expect(screen.getByTestId('walk-ferry')).toHaveTextContent('Ferry from Zattere to Stop 2, taken on purpose.');
    expect(screen.getByTestId('walk-ferry-time')).toHaveTextContent('Boat time unknown');
    expect(screen.queryByRole('button', { name: 'Take ferry' })).toBeNull();
  });

  it('FE-WALK-FERRY-NOTICE-003: stops no way joins are named, with the stop to move', () => {
    const { planner, actions } = plannerWith({ gap: { leg: 0 } });
    render(<WalkFerryNotice planner={planner} />);
    expect(screen.getByTestId('walk-ferry-gap')).toHaveTextContent(
      'No way joins Zattere and Stop 2, neither on foot nor by ferry.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select stop 2' }));
    expect(actions.select).toHaveBeenCalledWith('b');
  });

  it('FE-WALK-FERRY-NOTICE-004: a leg through a shaping point is named by the stations around it, numbered as the stop list numbers them', () => {
    const { planner, actions } = plannerWith({ gap: { leg: 1 } }, [
      { id: 'a', lat: 45.43, lng: 12.33, role: 'start', name: 'Zattere' },
      { id: 's', lat: 45.429, lng: 12.331, role: 'via', shaping: true },
      { id: 'b', lat: 45.428, lng: 12.332, role: 'via', name: null },
      { id: 'c', lat: 45.427, lng: 12.33, role: 'end', name: 'Redentore' },
    ]);
    render(<WalkFerryNotice planner={planner} />);
    expect(screen.getByTestId('walk-ferry-gap')).toHaveTextContent(
      'No way joins Zattere and Stop 2, neither on foot nor by ferry.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select stop 2' }));
    expect(actions.select).toHaveBeenCalledWith('b');
  });

  it('FE-WALK-FERRY-NOTICE-005: a crossing too long to keep cannot be taken, and says why', () => {
    const pending = crossing();
    const { planner, actions } = plannerWith({
      crossings: [pending],
      pending: [pending],
      blocksSave: true,
      acceptable: () => false,
    });
    render(<WalkFerryNotice planner={planner} />);
    const take = screen.getByRole('button', { name: 'Take ferry' });
    expect(take).toBeDisabled();
    fireEvent.click(take);
    expect(actions.accept).not.toHaveBeenCalled();
    expect(screen.getByTestId('walk-ferry-accept-too-long')).toBeInTheDocument();
  });
});
