import { describe, expect, it, vi } from 'vitest';
import { buildReservation, buildTrip } from '../../../tests/helpers/factories';
import type { DayPlanSidebarProps } from './DayPlanSidebar';
import { withDayPlanDefaults } from './DayPlanSidebar.defaults';

function required(): DayPlanSidebarProps {
  return {
    tripId: 1,
    trip: buildTrip({ id: 1 }),
    days: [],
    places: [],
    categories: [],
    assignments: {},
    selectedDayId: null,
    selectedPlaceId: null,
    selectedAssignmentId: null,
    onSelectDay: vi.fn(),
    onPlaceClick: vi.fn(),
    onDayDetail: vi.fn(),
    onReorder: vi.fn(),
    onUpdateDayTitle: vi.fn(),
    onRouteCalculated: vi.fn(),
    onAssignToDay: vi.fn(),
    onRemoveAssignment: vi.fn(),
    onEditPlace: vi.fn(),
    onDeletePlace: vi.fn(),
    onAddReservation: vi.fn(),
  };
}

describe('withDayPlanDefaults', () => {
  it('fills in every optional prop the plan reads without a value', () => {
    const resolved = withDayPlanDefaults(required());
    expect(resolved.accommodations).toEqual([]);
    expect(resolved.reservations).toEqual([]);
    expect(resolved.visibleConnectionIds).toEqual([]);
    expect(resolved.allConnectionsShown).toBe(false);
    expect(resolved.routeShown).toBe(false);
    expect(resolved.routeProfile).toBe('driving');
    expect(resolved.canUndo).toBe(false);
    expect(resolved.lastActionLabel).toBeNull();
    expect(resolved.showRouteToolsWhenExpanded).toBe(false);
    expect(resolved.isMobile).toBe(false);
  });

  it('keeps the values that are given, falsy ones included', () => {
    const reservations = [buildReservation({ id: 5 })];
    const resolved = withDayPlanDefaults({
      ...required(),
      reservations,
      routeShown: true,
      routeProfile: 'walking',
      canUndo: true,
      lastActionLabel: '',
      isMobile: true,
    });
    expect(resolved.reservations).toBe(reservations);
    expect(resolved.routeShown).toBe(true);
    expect(resolved.routeProfile).toBe('walking');
    expect(resolved.canUndo).toBe(true);
    expect(resolved.lastActionLabel).toBe('');
    expect(resolved.isMobile).toBe(true);
  });

  it('passes the other props through untouched', () => {
    const props = required();
    const onClearDay = vi.fn();
    const resolved = withDayPlanDefaults({ ...props, onClearDay });
    expect(resolved.tripId).toBe(1);
    expect(resolved.trip).toBe(props.trip);
    expect(resolved.onSelectDay).toBe(props.onSelectDay);
    expect(resolved.onClearDay).toBe(onClearDay);
  });

  it('treats an explicit undefined as missing, like a default parameter', () => {
    const resolved = withDayPlanDefaults({ ...required(), accommodations: undefined, routeProfile: undefined });
    expect(resolved.accommodations).toEqual([]);
    expect(resolved.routeProfile).toBe('driving');
  });
});
