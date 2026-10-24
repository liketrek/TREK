import { act, renderHook, waitFor } from '@testing-library/react';
import type { Collection, CollectionTourDetailResponse, CollectionTourItem, TourCreateResponse } from '@trek/shared';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { collectionToursRepo } from '../../../repo/collectionToursRepo';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { useAddonStore } from '../../../store/addonStore';
import { useAuthStore } from '../../../store/authStore';
import { ALL_SAVED, useCollectionStore } from '../../../store/collectionStore';
import { useCollectionTourStore } from '../../../store/collectionTourStore';
import { useSaveToCollectionStore } from '../../../store/saveToCollectionStore';
import { CollectionTourTakeOverDialog, KeptPointsStrip } from './CollectionTourTakeOverDialog';
import { ActiveCollectionTours, CollectionToursSection } from './CollectionToursSection';
import { SaveTourToCollectionDialog } from './SaveTourToCollectionDialog';
import { TourSaveToCollectionBarButton, TourSaveToCollectionButton } from './TourSaveToCollectionButton';
import TourSaveToCollectionHost from './TourSaveToCollectionHost';
import { useCollectionTourTakeOver } from './useCollectionTourTakeOver';
import { useSaveTourToCollection } from './useSaveTourToCollection';

// FE-COLLECTION-TOURS-001 to FE-COLLECTION-TOURS-020

vi.mock('../../Map/MapViewAuto', () => ({
  MapViewAuto: ({ route }: { route: Array<Array<[number, number]>> }) => (
    <div data-testid="kept-map" data-points={route[0]?.length ?? 0} />
  ),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const LISTS = [
  {
    id: 1,
    owner_id: 9,
    name: 'Shared',
    is_owner: false,
    members: [{ user_id: 7, username: 'me', status: 'accepted', role: 'viewer' }],
  },
  { id: 2, owner_id: 7, name: 'Hikes', is_owner: true, place_count: 4, color: '#123456' },
  { id: 3, owner_id: 7, name: 'Later', is_owner: true },
] as Collection[];

function kept(over: Partial<CollectionTourItem> = {}): CollectionTourItem {
  return {
    id: 4,
    collection_id: 3,
    name: 'Ridge',
    description: null,
    tour_type: 'hike',
    distance: 8.2,
    elevation_gain: 600,
    elevation_loss: 590,
    duration: 180,
    planned_duration_minutes: null,
    break_additional_minutes: null,
    max_hiking_difficulty: 2,
    wanderer_ref: null,
    origin: 'trek',
    has_line: true,
    waypoint_count: 4,
    source: { tripTitle: 'Alps', tourName: 'Ridge' },
    saved_by: 'mia',
    saved_at: '2026-10-20 10:00:00',
    ...over,
  } as CollectionTourItem;
}

const DETAIL: CollectionTourDetailResponse = {
  tour: kept(),
  line: [
    [47, 11],
    [47.1, 11.1],
  ],
  points: [
    { role: 'start', name: null, shaping: false },
    { role: 'via', name: 'Hut', shaping: false },
    { role: 'via', name: null, shaping: true },
    { role: 'end', name: null, shaping: false },
  ],
  trips: [
    { id: 6, title: 'Coast', start_date: '2026-07-01', end_date: '2026-07-08', can_add: true },
    { id: 7, title: 'Away', start_date: null, end_date: null, can_add: false },
  ],
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <TranslationProvider>{children}</TranslationProvider>
    </MemoryRouter>
  );
}

const target = { tripId: '5', placeId: 11, name: 'Ridge' };

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  useAuthStore.setState({ user: { id: 7 } as never });
  useAddonStore.setState({
    addons: [
      { id: 'tours', enabled: true },
      { id: 'collections', enabled: true },
    ] as never,
  });
  useCollectionTourStore.getState().clear();
  vi.spyOn(collectionToursRepo, 'lists').mockResolvedValue(LISTS);
  vi.spyOn(collectionToursRepo, 'detail').mockResolvedValue(DETAIL);
});
afterEach(() => vi.restoreAllMocks());

describe('useSaveTourToCollection', () => {
  it('FE-COLLECTION-TOURS-001: offers every list, picks the first one it may add to and keeps the tour on confirm', async () => {
    const save = vi.spyOn(collectionToursRepo, 'save').mockResolvedValue({ tour: kept({ name: 'My ridge' }) });
    const { result } = renderHook(() => useSaveTourToCollection(target), { wrapper });
    act(() => result.current.show());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.choices.map((choice) => [choice.collection.id, choice.canAdd])).toEqual([
      [1, false],
      [2, true],
      [3, true],
    ]);
    expect(result.current.listId).toBe(2);
    act(() => result.current.choose(1));
    expect(result.current.listId).toBe(2);
    act(() => result.current.choose(3));
    act(() => result.current.setName('  My ridge '));
    await act(() => result.current.confirm());
    expect(save).toHaveBeenCalledWith(3, { source_trip_id: 5, source_place_id: 11, name: 'My ridge' });
    expect(toast.success).toHaveBeenCalledWith('“My ridge” is now kept in “Later”.');
    expect(result.current.open).toBe(false);
  });

  it('FE-COLLECTION-TOURS-002: a failed keep leaves the dialog open, and the lists can be read again', async () => {
    const save = vi
      .spyOn(collectionToursRepo, 'save')
      .mockRejectedValueOnce(new OnlineOnlyError())
      .mockRejectedValueOnce(new Error('500'));
    vi.mocked(collectionToursRepo.lists).mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useSaveTourToCollection(target), { wrapper });
    act(() => result.current.show());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.canConfirm).toBe(false);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(() => result.current.confirm());
    expect(toast.error).toHaveBeenLastCalledWith('Collections need a connection.');
    await act(() => result.current.confirm());
    expect(toast.error).toHaveBeenLastCalledWith('The tour could not be kept.');
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.open).toBe(true);
    act(() => result.current.setName(' '));
    expect(result.current.canConfirm).toBe(false);
  });
});

describe('SaveTourToCollectionDialog', () => {
  function Harness() {
    const keep = useSaveTourToCollection(target);
    return (
      <>
        <button type="button" onClick={keep.show}>
          open
        </button>
        <SaveTourToCollectionDialog keep={keep} tourName={target.name} />
      </>
    );
  }

  it('FE-COLLECTION-TOURS-003: shows the lists, the one it may only read dimmed, and keeps through the foot', async () => {
    const save = vi.spyOn(collectionToursRepo, 'save').mockResolvedValue({ tour: kept() });
    render(<Harness />);
    fireEvent.click(screen.getByText('open'));
    const shared = await screen.findByTestId('keep-tour-list-1');
    expect(shared).toBeDisabled();
    expect(screen.getByTestId('keep-tour-list-2')).toHaveAttribute('aria-checked', 'true');
    expect(within(screen.getByTestId('keep-tour-list-2')).getByText('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ridge')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('keep-tour-confirm'));
    await waitFor(() => expect(save).toHaveBeenCalled());
  });

  it('FE-COLLECTION-TOURS-004: without a list it says so and leads to the collections', async () => {
    vi.mocked(collectionToursRepo.lists).mockResolvedValue([]);
    render(<Harness />);
    fireEvent.click(screen.getByText('open'));
    expect(await screen.findByText('You have no collection yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Open collections'));
    expect(screen.queryByText('You have no collection yet.')).toBeNull();
  });
});

describe('TourSaveToCollectionButton', () => {
  it('FE-COLLECTION-TOURS-005: is there only with the Collections addon, and waits for the save in the planner', async () => {
    const { unmount } = render(<TourSaveToCollectionButton target={target} />);
    fireEvent.click(screen.getByTestId('tour-keep-in-collection'));
    expect(await screen.findByTestId('keep-tour-list-2')).toBeInTheDocument();
    unmount();
    render(<TourSaveToCollectionBarButton target={target} unsaved />);
    expect(screen.getByTestId('tour-bar-keep-in-collection')).toBeDisabled();
    expect(screen.getByTestId('tour-bar-keep-in-collection')).toHaveAccessibleName(
      'Save the tour first to keep it in a collection'
    );
  });

  it('FE-COLLECTION-TOURS-006: shows nothing while the Collections addon is off', () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never });
    render(
      <>
        <TourSaveToCollectionButton target={target} />
        <TourSaveToCollectionBarButton target={target} unsaved={false} />
      </>
    );
    expect(screen.queryByTestId('tour-keep-in-collection')).toBeNull();
    expect(screen.queryByTestId('tour-bar-keep-in-collection')).toBeNull();
  });
});

describe('TourSaveToCollectionHost', () => {
  beforeEach(() => useSaveToCollectionStore.setState({ target: null, tour: null }));

  it('FE-COLLECTION-TOURS-018: useSaveTourToCollection can start open and reads the lists at once', async () => {
    const { result } = renderHook(() => useSaveTourToCollection(target, { startOpen: true }), { wrapper });
    expect(result.current.open).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.listId).toBe(2);
    expect(result.current.name).toBe('Ridge');
  });

  it('FE-COLLECTION-TOURS-019: shows nothing until a row opens a tour, then keeps it with its route', async () => {
    const save = vi.spyOn(collectionToursRepo, 'save').mockResolvedValue({ tour: kept() });
    render(<TourSaveToCollectionHost />);
    expect(screen.queryByTestId('keep-tour-confirm')).toBeNull();
    act(() => useSaveToCollectionStore.getState().openTour(target));
    expect(await screen.findByTestId('keep-tour-list-2')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByDisplayValue('Ridge')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('keep-tour-confirm'));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(2, { source_trip_id: 5, source_place_id: 11, name: 'Ridge' })
    );
    await waitFor(() => expect(useSaveToCollectionStore.getState().tour).toBeNull());
    expect(screen.queryByTestId('keep-tour-confirm')).toBeNull();
    expect(useSaveToCollectionStore.getState().target).toBeNull();
  });

  it('FE-COLLECTION-TOURS-020: cancelling writes nothing and clears the tour, the next row opens afresh', async () => {
    const save = vi.spyOn(collectionToursRepo, 'save');
    render(<TourSaveToCollectionHost />);
    act(() => useSaveToCollectionStore.getState().openTour(target));
    await screen.findByTestId('keep-tour-list-2');
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(useSaveToCollectionStore.getState().tour).toBeNull());
    expect(save).not.toHaveBeenCalled();
    act(() => useSaveToCollectionStore.getState().openTour({ tripId: 5, placeId: 12, name: 'Valley' }));
    expect(await screen.findByDisplayValue('Valley')).toBeInTheDocument();
  });
});

describe('useCollectionTourTakeOver', () => {
  const answer = { tour: { place_id: 9, name: 'Ridge' }, waypoints: [] } as unknown as TourCreateResponse;

  it('FE-COLLECTION-TOURS-007: takes it into a trip it may add to, only once the waypoints are decided, then opens that trip', async () => {
    const takeOver = vi.spyOn(collectionToursRepo, 'takeOver').mockResolvedValue(answer);
    const { result } = renderHook(() => ({ flow: useCollectionTourTakeOver(3), location: useLocation() }), {
      wrapper,
    });
    act(() => result.current.flow.show(kept()));
    await waitFor(() => expect(result.current.flow.detailStatus).toBe('ready'));
    expect(result.current.flow.points).toBeNull();
    act(() => result.current.flow.chooseTrip(7));
    expect(result.current.flow.tripId).toBeNull();
    act(() => result.current.flow.chooseTrip(6));
    expect(result.current.flow.canConfirm).toBe(false);
    act(() => result.current.flow.choosePoints('without'));
    expect(result.current.flow.canConfirm).toBe(true);
    await act(() => result.current.flow.confirm());
    expect(takeOver).toHaveBeenCalledWith(6, {
      collection_id: 3,
      collection_tour_id: 4,
      include_waypoints: false,
      name: 'Ridge',
    });
    expect(result.current.flow.done).toEqual({ tripId: 6, tripTitle: 'Coast', tourName: 'Ridge' });
    // The dialog's last word says it; a toast would only repeat it.
    expect(toast.success).not.toHaveBeenCalled();
    act(() => result.current.flow.openTrip());
    expect(result.current.location.pathname).toBe('/trips/6');
    expect(result.current.flow.open).toBe(false);
  });

  it('FE-COLLECTION-TOURS-008: a tour without a line brings its waypoints, and a failure keeps the dialog', async () => {
    vi.spyOn(collectionToursRepo, 'takeOver')
      .mockRejectedValueOnce(new Error('500'))
      .mockRejectedValueOnce(new OnlineOnlyError());
    const { result } = renderHook(() => useCollectionTourTakeOver(3), { wrapper });
    act(() => result.current.show(kept({ has_line: false })));
    expect(result.current.points).toBe('with');
    act(() => result.current.choosePoints('without'));
    expect(result.current.points).toBe('with');
    await waitFor(() => expect(result.current.detailStatus).toBe('ready'));
    act(() => result.current.chooseTrip(6));
    await act(() => result.current.confirm());
    expect(toast.error).toHaveBeenLastCalledWith('The tour could not be added to the trip.');
    await act(() => result.current.confirm());
    expect(toast.error).toHaveBeenLastCalledWith('Collections need a connection.');
    expect(result.current.done).toBeNull();
    expect(result.current.open).toBe(true);
    act(() => result.current.close());
    expect(result.current.open).toBe(false);
  });

  it('FE-COLLECTION-TOURS-009: a preview that cannot be read says so and can be asked again', async () => {
    vi.mocked(collectionToursRepo.detail).mockRejectedValueOnce(new OnlineOnlyError());
    const { result } = renderHook(() => useCollectionTourTakeOver(3), { wrapper });
    act(() => result.current.show(kept()));
    await waitFor(() => expect(result.current.detailStatus).toBe('offline'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.detailStatus).toBe('ready'));
  });
});

describe('CollectionTourTakeOverDialog', () => {
  function Harness({ tour = kept() }: { tour?: CollectionTourItem }) {
    const flow = useCollectionTourTakeOver(3);
    return (
      <>
        <button type="button" onClick={() => flow.show(tour)}>
          open
        </button>
        <CollectionTourTakeOverDialog takeOver={flow} />
      </>
    );
  }

  it('FE-COLLECTION-TOURS-010: shows the kept tour, the trips and the choice, and says where the new tour is', async () => {
    vi.spyOn(collectionToursRepo, 'takeOver').mockResolvedValue({
      tour: { place_id: 9, name: 'Ridge' },
      waypoints: [],
    } as unknown as TourCreateResponse);
    render(<Harness />);
    fireEvent.click(screen.getByText('open'));
    const preview = screen.getByTestId('kept-tour-preview');
    expect(await within(preview).findByTestId('kept-map')).toHaveAttribute('data-points', '2');
    expect(preview).toHaveTextContent('Alps');
    expect(screen.getByTestId('kept-tour-trip-7')).toBeDisabled();
    expect(screen.getByTestId('kept-tour-confirm')).toBeDisabled();
    fireEvent.click(screen.getByTestId('kept-tour-trip-6'));
    fireEvent.click(screen.getByTestId('kept-tour-points-with'));
    expect(screen.getByTestId('kept-tour-points-with')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByTestId('kept-tour-confirm'));
    expect(await screen.findByRole('status')).toHaveTextContent('“Ridge” is now a tour of “Coast”.');
    expect(screen.getByText('Open trip')).toBeInTheDocument();
  });

  it('FE-COLLECTION-TOURS-011: numbers the waypoints as the map does, a shaping point a dot, and dims them when left out', () => {
    const { rerender } = render(<KeptPointsStrip points={DETAIL.points} dimmed={false} />);
    const strip = screen.getByTestId('kept-points');
    expect(within(strip).getByLabelText('Start')).toHaveTextContent('1');
    expect(within(strip).getByLabelText('Waypoint 2: Hut')).toHaveTextContent('2');
    expect(within(strip).getByLabelText('Shaping point')).toBeInTheDocument();
    expect(within(strip).getByLabelText('End')).toHaveTextContent('3');
    expect(strip).not.toHaveClass('opacity-40');
    rerender(<KeptPointsStrip points={DETAIL.points} dimmed />);
    expect(screen.getByTestId('kept-points')).toHaveClass('opacity-40');
  });

  it('FE-COLLECTION-TOURS-014: a tour kept without a line says so in the map box and under the choice', async () => {
    vi.mocked(collectionToursRepo.detail).mockResolvedValue({
      ...DETAIL,
      tour: kept({ has_line: false }),
      line: [],
    });
    render(<Harness tour={kept({ has_line: false })} />);
    fireEvent.click(screen.getByText('open'));
    const preview = screen.getByTestId('kept-tour-preview');
    expect(await within(preview).findByTestId('tour-preview-no-line')).toHaveTextContent(
      'No line yet, only its waypoints'
    );
    expect(within(preview).queryByTestId('kept-map')).toBeNull();
    expect(screen.getByText('This tour has no line yet, so its waypoints have to come along.')).toBeInTheDocument();
    const lineOnly = screen.getByTestId('kept-tour-points-without');
    expect(lineOnly).toBeDisabled();
    // A disabled tile sits in a span, so its tooltip still has something to hover.
    expect(lineOnly.parentElement?.tagName).toBe('SPAN');
    expect(screen.getByTestId('kept-tour-points-with')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('kept-tour-points-with').parentElement?.tagName).not.toBe('SPAN');
  });
});

describe('CollectionToursSection', () => {
  it('FE-COLLECTION-TOURS-012: shows the kept tours as cards, removes one after asking, and nothing while there is none', async () => {
    vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: [kept()] });
    const remove = vi.spyOn(collectionToursRepo, 'remove').mockResolvedValue(undefined);
    render(<CollectionToursSection collectionId={3} canRemove />);
    const card = await screen.findByTestId('kept-tour-4');
    expect(card).toHaveTextContent('Ridge');
    expect(card).toHaveTextContent('Alps');
    expect(within(card).getByTestId('kept-tour-distance')).toHaveTextContent('8.2 km');
    expect(within(card).getByLabelText('4 waypoints')).toBeInTheDocument();
    // Dimmed, never hidden: a touch screen has no hover to bring it out.
    expect(within(card).getByTestId('kept-tour-remove-4')).toHaveClass('opacity-50');
    expect(within(card).getByTestId('kept-tour-remove-4')).not.toHaveClass('opacity-0');
    fireEvent.click(within(card).getByTestId('kept-tour-remove-4'));
    // The card's own button and the question's confirm share the name; the question's comes last.
    const removeButtons = await screen.findAllByRole('button', { name: 'Remove from the collection' });
    fireEvent.click(removeButtons[removeButtons.length - 1] as HTMLElement);
    await waitFor(() => expect(remove).toHaveBeenCalledWith(3, 4));
    expect(toast.success).toHaveBeenCalledWith('The tour was removed from the collection.');
    await waitFor(() => expect(screen.queryByTestId('collection-tours')).toBeNull());
  });

  it('FE-COLLECTION-TOURS-015: a kept tour looks as it did in its trip list: ski mark, run pace and stages', async () => {
    vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({
      tours: [
        kept({ id: 5, tour_type: 'ski', max_hiking_difficulty: null, ski_discipline: 'snowshoe', stage_count: 3 }),
        kept({
          id: 6,
          tour_type: 'run',
          max_hiking_difficulty: null,
          run_profile: 'trail',
          run_pace_seconds_per_km: 360,
        }),
      ],
    });
    render(<CollectionToursSection collectionId={3} canRemove={false} />);
    const ski = await screen.findByTestId('kept-tour-5');
    expect(within(ski).getByTestId('tour-ski-mark')).toBeInTheDocument();
    expect(within(ski).getByTestId('kept-tour-stages')).toHaveTextContent('3 stages');
    expect(within(ski).queryByTestId('kept-tour-pace')).toBeNull();
    const run = screen.getByTestId('kept-tour-6');
    expect(within(run).getByTestId('kept-tour-pace')).toHaveTextContent('6:00');
    expect(within(run).queryByTestId('kept-tour-stages')).toBeNull();
  });

  it('FE-COLLECTION-TOURS-013: a viewer sees no remove, a failed read says so, and the Tours addon off shows nothing', async () => {
    const list = vi.spyOn(collectionToursRepo, 'list').mockRejectedValueOnce(new Error('500'));
    list.mockResolvedValue({ tours: [kept()] });
    const { unmount } = render(<CollectionToursSection collectionId={3} canRemove={false} />);
    expect(await screen.findByText('The tours of this list could not be loaded.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    const card = await screen.findByTestId('kept-tour-4');
    expect(within(card).queryByTestId('kept-tour-remove-4')).toBeNull();
    fireEvent.click(within(card).getByText('Add to a trip'));
    expect(await screen.findByTestId('kept-tour-preview')).toBeInTheDocument();
    unmount();
    useAddonStore.setState({ addons: [{ id: 'collections', enabled: true }] as never });
    render(<CollectionToursSection collectionId={3} canRemove />);
    expect(screen.queryByTestId('collection-tours')).toBeNull();
  });

  it('FE-COLLECTION-TOURS-016: the open list shows its tours, removable by its owner or an admin only, and "All saved" none', async () => {
    const before = useCollectionStore.getState();
    const list = vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: [kept()] });
    try {
      useCollectionStore.setState({ activeId: 3, collections: [{ id: 3, is_owner: false }] as never, members: [] });
      useAuthStore.setState({ user: { id: 7 } as never });
      const viewer = render(<ActiveCollectionTours />);
      const card = await screen.findByTestId('kept-tour-4');
      expect(list).toHaveBeenCalled();
      expect(within(card).queryByTestId('kept-tour-remove-4')).toBeNull();
      viewer.unmount();

      useCollectionStore.setState({ members: [{ user_id: 7, is_owner: false, role: 'admin' }] as never });
      const admin = render(<ActiveCollectionTours />);
      expect(await screen.findByTestId('kept-tour-remove-4')).toBeInTheDocument();
      admin.unmount();

      useCollectionStore.setState({ activeId: ALL_SAVED });
      render(<ActiveCollectionTours />);
      expect(screen.queryByTestId('collection-tours')).toBeNull();
    } finally {
      useCollectionStore.setState(before, true);
    }
  });

  it('FE-COLLECTION-TOURS-017: the rows follow the list search by name, and a click on the row itself starts the take-over', async () => {
    vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: [kept(), kept({ id: 5, name: 'Lake loop' })] });
    const { rerender } = render(<CollectionToursSection collectionId={3} canRemove search="lake" />);
    expect(await screen.findByTestId('kept-tour-5')).toBeInTheDocument();
    expect(screen.queryByTestId('kept-tour-4')).toBeNull();
    rerender(<CollectionToursSection collectionId={3} canRemove search="nothing" />);
    expect(screen.queryByTestId('collection-tours')).toBeNull();
    rerender(<CollectionToursSection collectionId={3} canRemove search="" />);
    fireEvent.click(await screen.findByTestId('kept-tour-4'));
    expect(await screen.findByTestId('kept-tour-preview')).toBeInTheDocument();
  });
});
