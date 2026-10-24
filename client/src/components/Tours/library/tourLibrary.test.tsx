import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourCreateResponse, TourLibraryItem, TourLibraryResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourLibraryRepo } from '../../../repo/tourLibraryRepo';
import { TourLibraryDialog } from './TourLibraryDialog';
import { useTourLibrary } from './useTourLibrary';

// FE-TOUR-LIBRARY-001 to FE-TOUR-LIBRARY-009

vi.mock('../../Map/MapViewAuto', () => ({
  MapViewAuto: ({ route }: { route: Array<Array<[number, number]>> }) => (
    <div data-testid="library-map" data-points={route[0]?.length ?? 0} />
  ),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

function item(over: Partial<TourLibraryItem> & Pick<TourLibraryItem, 'place_id' | 'name'>): TourLibraryItem {
  return {
    description: null,
    tour_type: 'hike',
    distance: 8.2,
    elevation_gain: 600,
    elevation_loss: 590,
    duration: 180,
    planned_duration_minutes: null,
    break_additional_minutes: null,
    max_hiking_difficulty: 2,
    has_waypoints: true,
    origin: 'trek',
    trip: { id: 2, title: 'Alps' },
    ...over,
  } as TourLibraryItem;
}

const RIDGE = item({ place_id: 11, name: 'Ridge' });
const LAKE = item({
  place_id: 12,
  name: 'Lake loop',
  tour_type: 'kayak',
  distance: null,
  elevation_gain: 40,
  trip: { id: 3, title: 'Lakes' },
});
const LIST: TourLibraryResponse = {
  tours: [RIDGE, LAKE],
  trips: [
    { id: 3, title: 'Lakes', tour_count: 1 },
    { id: 2, title: 'Alps', tour_count: 1 },
  ],
  truncated: false,
};

let list: ReturnType<typeof vi.spyOn>;
let detail: ReturnType<typeof vi.spyOn>;
let takeOver: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  list = vi.spyOn(tourLibraryRepo, 'list').mockResolvedValue(LIST);
  detail = vi.spyOn(tourLibraryRepo, 'detail').mockResolvedValue({
    tour: RIDGE,
    line: [
      [47, 11],
      [47.1, 11.1],
    ],
    waypoint_count: 4,
  });
  takeOver = vi.spyOn(tourLibraryRepo, 'takeOver').mockResolvedValue({
    tour: { place_id: 99, name: 'My ridge' },
    waypoints: [],
  } as unknown as TourCreateResponse);
});
afterEach(() => vi.restoreAllMocks());

describe('useTourLibrary', () => {
  it('FE-TOUR-LIBRARY-001: asks nothing until opened, then lists the other trips’ tours, the asking trip left out', async () => {
    const { result } = renderHook(() => useTourLibrary({ tripId: 5, onTakenOver: vi.fn() }));
    expect(list).not.toHaveBeenCalled();
    act(() => result.current.show());
    await waitFor(() => expect(result.current.listStatus).toBe('ready'));
    expect(list).toHaveBeenCalledWith({ exclude_trip_id: 5 }, expect.any(AbortSignal));
    expect(result.current.list?.tours).toHaveLength(2);
  });

  it('FE-TOUR-LIBRARY-002: narrows by name after a pause, and by trip and type at once', async () => {
    const { result } = renderHook(() => useTourLibrary({ tripId: 5, onTakenOver: vi.fn() }));
    act(() => result.current.show());
    await waitFor(() => expect(result.current.listStatus).toBe('ready'));
    act(() => result.current.filter({ query: ' rid ', tripFilter: 2, typeFilter: 'hike' }));
    expect(result.current.listStatus).toBe('loading');
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        { q: 'rid', trip_id: 2, type: 'hike', exclude_trip_id: 5 },
        expect.any(AbortSignal)
      )
    );
  });

  it('FE-TOUR-LIBRARY-003: says when it is offline or failed, and asks again on retry', async () => {
    list.mockRejectedValueOnce(new OnlineOnlyError()).mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useTourLibrary({ tripId: 5, onTakenOver: vi.fn() }));
    act(() => result.current.show());
    await waitFor(() => expect(result.current.listStatus).toBe('offline'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.listStatus).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.listStatus).toBe('ready'));
  });

  it('FE-TOUR-LIBRARY-004: previews the tour chosen and takes it over under the name given, then hands it in', async () => {
    const onTakenOver = vi.fn();
    const { result } = renderHook(() => useTourLibrary({ tripId: 5, onTakenOver }));
    act(() => result.current.show());
    act(() => result.current.choose(RIDGE));
    expect(result.current.name).toBe('Ridge');
    await waitFor(() => expect(result.current.previewStatus).toBe('ready'));
    expect(detail).toHaveBeenCalledWith(11, expect.any(AbortSignal));
    act(() => result.current.setName('  My ridge '));
    await act(() => result.current.confirm());
    expect(takeOver).toHaveBeenCalledWith(5, { source_trip_id: 2, source_place_id: 11, name: 'My ridge' });
    expect(onTakenOver).toHaveBeenCalledWith(expect.objectContaining({ place_id: 99 }));
    expect(result.current.open).toBe(false);
    expect(toast.success).toHaveBeenCalled();
  });

  it('FE-TOUR-LIBRARY-005: nothing is taken over without a name, and a failed take-over keeps the dialog', async () => {
    takeOver.mockRejectedValueOnce(new Error('500'));
    const onTakenOver = vi.fn();
    const { result } = renderHook(() => useTourLibrary({ tripId: 5, onTakenOver }));
    act(() => result.current.show());
    act(() => result.current.choose(RIDGE));
    act(() => result.current.setName('   '));
    expect(result.current.canConfirm).toBe(false);
    await act(() => result.current.confirm());
    expect(takeOver).not.toHaveBeenCalled();
    act(() => result.current.setName('Ridge'));
    await act(() => result.current.confirm());
    expect(onTakenOver).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('TourLibraryDialog', () => {
  function Harness({ onTakenOver = vi.fn() }: { onTakenOver?: () => void }) {
    const library = useTourLibrary({ tripId: 5, onTakenOver });
    // The way in is the rail's Add tour menu (TourAddMenu); here a plain button stands in for it.
    return (
      <>
        <button type="button" data-testid="tour-rail-library" onClick={library.show}>
          open
        </button>
        <TourLibraryDialog library={library} />
      </>
    );
  }

  it('FE-TOUR-LIBRARY-006: lists the tours with their trip and measures, a missing one left out', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('tour-rail-library'));
    const ridge = await screen.findByTestId('tour-library-row-11');
    expect(ridge).toHaveTextContent('Ridge');
    expect(ridge).toHaveTextContent('Alps');
    expect(within(ridge).getByTestId('tour-library-distance')).toHaveTextContent('8.2 km');
    const lake = screen.getByTestId('tour-library-row-12');
    // No distance known, and a paddle tour's climb says nothing: neither is shown.
    expect(within(lake).queryByTestId('tour-library-distance')).toBeNull();
    expect(within(lake).queryByTestId('tour-library-ascent')).toBeNull();
    expect(screen.getByTestId('tour-library-confirm')).toBeDisabled();
  });

  it('FE-TOUR-LIBRARY-007: choosing a tour shows it on a map with its facts and the name field; the button takes it over', async () => {
    const onTakenOver = vi.fn();
    render(<Harness onTakenOver={onTakenOver} />);
    fireEvent.click(screen.getByTestId('tour-rail-library'));
    fireEvent.click(await screen.findByTestId('tour-library-row-11'));
    const preview = screen.getByTestId('tour-library-preview');
    expect(await within(preview).findByTestId('library-map')).toHaveAttribute('data-points', '2');
    expect(preview).toHaveTextContent('Alps');
    expect(preview).toHaveTextContent('4');
    expect(within(preview).getByDisplayValue('Ridge')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tour-library-confirm'));
    await waitFor(() => expect(onTakenOver).toHaveBeenCalled());
    expect(screen.queryByTestId('tour-library-preview')).toBeNull();
  });

  it('FE-TOUR-LIBRARY-009: plans a city walk with its stays, at least that much while a stay is not entered (CW-02)', async () => {
    const walk = item({
      place_id: 13,
      name: 'Old town',
      tour_type: 'walk',
      duration: 45,
      break_additional_minutes: 15,
      station_count: 3,
      station_stay_minutes: 90,
      station_stays_unknown: 1,
    });
    list.mockResolvedValue({ ...LIST, tours: [walk] });
    detail.mockResolvedValue({ tour: walk, line: [], waypoint_count: 3 });
    render(<Harness />);
    fireEvent.click(screen.getByTestId('tour-rail-library'));
    const row = await screen.findByTestId('tour-library-row-13');
    const time = within(row).getByTestId('tour-library-time');
    expect(time).toHaveTextContent('≥ 2 h 15 min');
    expect(time).toHaveAccessibleName('Planned total duration: at least 2 h 15 min');
    fireEvent.click(row);
    expect(
      await within(screen.getByTestId('tour-library-preview')).findByText('at least 2 h 15 min')
    ).toBeInTheDocument();
  });

  it('FE-TOUR-LIBRARY-008: says when the other trips have no tours', async () => {
    list.mockResolvedValue({ tours: [], trips: [], truncated: false });
    render(<Harness />);
    fireEvent.click(screen.getByTestId('tour-rail-library'));
    expect(await screen.findByText('Your other trips have no tours yet.')).toBeInTheDocument();
  });
});
