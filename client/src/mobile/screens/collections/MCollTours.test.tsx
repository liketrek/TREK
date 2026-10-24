import type { CollectionTourDetailResponse, CollectionTourItem, TourCreateResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '../../../../tests/helpers/render';
import { collectionToursRepo } from '../../../repo/collectionToursRepo';
import { useAddonStore } from '../../../store/addonStore';
import { useAuthStore } from '../../../store/authStore';
import { ALL_SAVED, useCollectionStore } from '../../../store/collectionStore';
import { useCollectionTourStore } from '../../../store/collectionTourStore';
import MCollTours from './MCollTours';

// FE-M-COLLECTION-TOURS-001 to FE-M-COLLECTION-TOURS-004

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../components/shared/Toast', () => ({ useToast: () => toast }));

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
    { role: 'end', name: null, shaping: false },
  ],
  trips: [
    { id: 6, title: 'Coast', start_date: '2026-07-01', end_date: '2026-07-08', can_add: true },
    { id: 7, title: 'Away', start_date: null, end_date: null, can_add: false },
  ],
};

const before = useCollectionStore.getState();

beforeEach(() => {
  useAuthStore.setState({ user: { id: 7 } as never });
  useAddonStore.setState({
    addons: [
      { id: 'tours', enabled: true },
      { id: 'collections', enabled: true },
    ] as never,
  });
  useCollectionTourStore.getState().clear();
  useCollectionStore.setState({ activeId: 3, collections: [{ id: 3, is_owner: true }] as never, members: [] });
  vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({
    tours: [kept(), kept({ id: 5, name: 'Lake loop', tour_type: 'kayak', max_hiking_difficulty: null })],
  });
  vi.spyOn(collectionToursRepo, 'detail').mockResolvedValue(DETAIL);
});
afterEach(() => {
  useCollectionStore.setState(before, true);
  vi.restoreAllMocks();
});

describe('MCollTours', () => {
  it('FE-M-COLLECTION-TOURS-001: lists the kept tours as rows with their grade or type and their measures', async () => {
    render(<MCollTours search="" />);
    const ridge = await screen.findByTestId('m-kept-tour-4');
    expect(ridge).toHaveTextContent('Ridge');
    expect(ridge).toHaveTextContent('T2');
    expect(within(ridge).getByLabelText(/8\.2 km/)).toBeInTheDocument();
    expect(screen.getByTestId('m-kept-tour-5')).toHaveTextContent('Lake loop');
  });

  it('FE-M-COLLECTION-TOURS-002: the list search narrows the tours by name, and "All saved" shows none', async () => {
    const { rerender } = render(<MCollTours search="lake" />);
    expect(await screen.findByTestId('m-kept-tour-5')).toBeInTheDocument();
    expect(screen.queryByTestId('m-kept-tour-4')).toBeNull();
    rerender(<MCollTours search="nothing" />);
    expect(screen.queryByTestId('m-collection-tours')).toBeNull();
    useCollectionStore.setState({ activeId: ALL_SAVED });
    rerender(<MCollTours search="" />);
    expect(screen.queryByTestId('m-collection-tours')).toBeNull();
  });

  it('FE-M-COLLECTION-TOURS-003: a tap opens the sheet, a trip the user may not add to is dimmed, and the tour goes in with its points', async () => {
    const takeOver = vi
      .spyOn(collectionToursRepo, 'takeOver')
      .mockResolvedValue({ tour: { name: 'Ridge' } } as TourCreateResponse);
    render(<MCollTours search="" />);
    fireEvent.click(within(await screen.findByTestId('m-kept-tour-4')).getByText('Ridge'));
    const coast = await screen.findByRole('radio', { name: /Coast/ });
    expect(screen.getByRole('radio', { name: /Away/ })).toBeDisabled();
    fireEvent.click(coast);
    fireEvent.click(screen.getByRole('radio', { name: /4 waypoints/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add to a trip/ }));
    await waitFor(() =>
      expect(takeOver).toHaveBeenCalledWith(6, {
        collection_id: 3,
        collection_tour_id: 4,
        include_waypoints: true,
        name: 'Ridge',
      })
    );
    expect(await screen.findByRole('button', { name: /Open trip/ })).toBeInTheDocument();
  });

  it('FE-M-COLLECTION-TOURS-004: its owner removes a tour from the sheet after the question', async () => {
    const remove = vi.spyOn(collectionToursRepo, 'remove').mockResolvedValue(undefined);
    render(<MCollTours search="" />);
    fireEvent.click(within(await screen.findByTestId('m-kept-tour-4')).getByText('Ridge'));
    await screen.findByRole('radio', { name: /Coast/ });
    fireEvent.click(screen.getByRole('button', { name: 'Remove from the collection' }));
    const confirms = await screen.findAllByRole('button', { name: 'Remove from the collection' });
    fireEvent.click(confirms[confirms.length - 1] as HTMLElement);
    await waitFor(() => expect(remove).toHaveBeenCalledWith(3, 4));
  });
});
