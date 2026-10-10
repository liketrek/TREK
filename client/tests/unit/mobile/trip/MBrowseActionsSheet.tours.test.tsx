import { describe, expect, it, vi } from 'vitest';
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell';
import MBrowseActionsSheet from '../../../../src/mobile/screens/trip/sheets/MBrowseActionsSheet';
import type { Place } from '../../../../src/types';
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip';
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';

function tourPlace(): Place {
  return {
    id: 42,
    trip_id: 1,
    name: 'Ridge walk',
    address: null,
    description: null,
    category_id: null,
    lat: 48,
    lng: 11,
    image_url: null,
    google_place_id: null,
    osm_id: null,
    route_geometry: '[[48,11],[49,12]]',
    route_color: null,
    tour_place_id: 42,
  } as unknown as Place;
}

const days = [
  { id: 7, trip_id: 1, day_number: 1, title: 'Day one', date: null },
  { id: 8, trip_id: 1, day_number: 2, title: 'Day two', date: null },
  { id: 9, trip_id: 1, day_number: 3, title: 'Day three', date: null },
] as never;

function mobilePlanner(overrides: Partial<TripPlanner> = {}) {
  const place = tourPlace();
  return buildPlanner({
    places: [place],
    days,
    assignments: { '7': [{ id: 70, day_id: 7, place_id: place.id }] } as never,
    isTourPlace: vi.fn((placeId: number) => placeId === place.id),
    ...overrides,
  } as Partial<TripPlanner>);
}

function renderDayPicker(planner = mobilePlanner()) {
  const shell = buildShell({ sheet: { id: 'bract', payload: { placeId: 42, dayPicker: true } } });
  const view = render(<MBrowseActionsSheet planner={planner} shell={shell} />);
  return { ...view, planner, shell };
}

describe('MBrowseActionsSheet Tour assignment picker', () => {
  it('disables assigned Tour days, blocks repeat clicks, and refreshes on reopen', async () => {
    resetAllStores();
    let finishAssignment!: (assigned: boolean) => void;
    const handleAssignToDay = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finishAssignment = resolve;
        })
    );
    const planner = mobilePlanner({ handleAssignToDay });
    const { rerender, shell } = renderDayPicker(planner);

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    const dayOne = screen.getByRole('button', { name: /Day one/ });
    const dayTwo = screen.getByRole('button', { name: /Day two/ });
    expect(dayOne).toBeDisabled();
    expect(dayTwo).toBeEnabled();
    fireEvent.click(dayOne);
    expect(handleAssignToDay).not.toHaveBeenCalled();

    fireEvent.click(dayTwo);
    fireEvent.click(dayTwo);
    expect(handleAssignToDay).toHaveBeenCalledTimes(1);
    expect(handleAssignToDay).toHaveBeenCalledWith(42, 8);

    await act(async () => {
      finishAssignment(true);
    });
    await waitFor(() => expect(shell.closeSheet).toHaveBeenCalledOnce());

    const reopened = mobilePlanner({
      assignments: {
        '7': [{ id: 70, day_id: 7, place_id: 42 }],
        '8': [{ id: 80, day_id: 8, place_id: 42 }],
      } as never,
    });
    rerender(<MBrowseActionsSheet planner={reopened} shell={shell} />);
    expect(screen.getByRole('button', { name: /Day one/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Day two/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Day three/ })).toBeEnabled();
  });

  it('leaves ordinary Place day choices enabled and preserves their assignment write behavior', () => {
    resetAllStores();
    const place = { ...tourPlace(), tour_place_id: undefined };
    const handleAssignToDay = vi.fn().mockResolvedValue(true);
    const planner = mobilePlanner({
      places: [place],
      isTourPlace: vi.fn(() => false),
      assignments: { '7': [{ id: 70, day_id: 7, place_id: place.id }] } as never,
      handleAssignToDay,
    });
    renderDayPicker(planner);
    const dayOne = screen.getByRole('button', { name: /Day one/ });
    expect(dayOne).toBeEnabled();
    fireEvent.click(dayOne);
    expect(handleAssignToDay).toHaveBeenCalledWith(place.id, 7);
  });
});
