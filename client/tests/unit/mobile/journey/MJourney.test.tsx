// FE-MOB-JLIST-001 to FE-MOB-JLIST-013
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../helpers/render';
import MJourney from '../../../../src/mobile/screens/journey/MJourney';
import type { Journey } from '../../../../src/store/journeyStore';

const mocks = vi.hoisted(() => ({ journey: {} as Record<string, unknown> }));

vi.mock('../../../../src/pages/journey/useJourney', () => ({
  useJourney: () => mocks.journey,
}));

type ListItem = Journey & { entry_count?: number; photo_count?: number; place_count?: number };

function buildJourney(over: Partial<ListItem> = {}): ListItem {
  return {
    id: 1,
    user_id: 1,
    title: 'Japan 2026',
    subtitle: null,
    cover_gradient: null,
    cover_image: null,
    status: 'active',
    created_at: 0,
    updated_at: 0,
    ...over,
  };
}

function buildHook(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    navigate: vi.fn(),
    journeys: [] as ListItem[],
    loading: false,
    showCreate: false,
    setShowCreate: vi.fn(),
    newTitle: '',
    setNewTitle: vi.fn(),
    availableTrips: [],
    selectedTripIds: new Set<number>(),
    setSelectedTripIds: vi.fn(),
    openCreateModal: vi.fn(),
    handleCreate: vi.fn(),
    activeJourney: null,
    ...over,
  };
}

function setup(over: Record<string, unknown> = {}) {
  mocks.journey = buildHook(over);
  render(<MJourney />);
  return mocks.journey;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MJourney', () => {
  it('FE-MOB-JLIST-001: shows a spinner while the first load is running', () => {
    setup({ loading: true, journeys: [] });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Other journeys')).not.toBeInTheDocument();
  });

  it('FE-MOB-JLIST-002: shows the mascot empty state when there are no journeys', () => {
    setup();
    expect(screen.getByText('Create a new Journey')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('FE-MOB-JLIST-003: renders the active journey as hero with its counters', () => {
    const hero = buildJourney({ id: 4, title: 'Norway', entry_count: 12, photo_count: 40, place_count: 7 });
    setup({ journeys: [hero], activeJourney: hero });

    expect(screen.getByText('Latest journey')).toBeInTheDocument();
    expect(screen.getByText('Norway')).toBeInTheDocument();
    expect(screen.getByText('12 entries')).toBeInTheDocument();
    expect(screen.getByText('40 photos')).toBeInTheDocument();
    expect(screen.getByText('7 places')).toBeInTheDocument();
  });

  it('FE-MOB-JLIST-004: falls back to the first list entry when no journey is active', () => {
    const first = buildJourney({ id: 9, title: 'Fallback hero' });
    setup({ journeys: [first], activeJourney: null });
    expect(screen.getByText('Fallback hero')).toBeInTheDocument();
  });

  it('FE-MOB-JLIST-005: renders the hero cover image when one is set', () => {
    const hero = buildJourney({ id: 4, title: 'Norway', cover_image: 'covers/n.jpg' });
    setup({ journeys: [hero], activeJourney: hero });
    expect(document.querySelector('img')).toHaveAttribute('src', '/uploads/covers/n.jpg');
  });

  it('FE-MOB-JLIST-006: opening the hero navigates to its detail route', () => {
    const hero = buildJourney({ id: 4, title: 'Norway' });
    const hook = setup({ journeys: [hero], activeJourney: hero });
    fireEvent.click(screen.getByText('Norway'));
    expect(hook.navigate).toHaveBeenCalledWith('/journey/4');
  });

  it('FE-MOB-JLIST-007: lists the remaining journeys in the grid with their counters', () => {
    const hero = buildJourney({ id: 4, title: 'Norway' });
    const other = buildJourney({ id: 5, title: 'Iceland', entry_count: 3, photo_count: 0, place_count: 0 });
    setup({ journeys: [hero, other], activeJourney: hero });

    expect(screen.getByText('Other journeys')).toBeInTheDocument();
    expect(screen.getByText('Iceland')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('FE-MOB-JLIST-008: hides the counter row on a grid card without any stats', () => {
    const hero = buildJourney({ id: 4, title: 'Norway' });
    const empty = buildJourney({ id: 5, title: 'Iceland' });
    setup({ journeys: [hero, empty], activeJourney: hero });

    expect(screen.getByText('Iceland')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('FE-MOB-JLIST-009: opening a grid card navigates to that journey', () => {
    const hero = buildJourney({ id: 4, title: 'Norway' });
    const other = buildJourney({ id: 5, title: 'Iceland' });
    const hook = setup({ journeys: [hero, other], activeJourney: hero });
    fireEvent.click(screen.getByText('Iceland'));
    expect(hook.navigate).toHaveBeenCalledWith('/journey/5');
  });

  it('FE-MOB-JLIST-010: the header pill opens the create modal', () => {
    const hook = setup();
    fireEvent.click(screen.getByRole('button', { name: /Create Journey/ }));
    expect(hook.openCreateModal).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-JLIST-011: toggling a trip in the create sheet adds and removes the id', () => {
    const trips = [{ id: 21, title: 'Tokyo', start_date: '2026-05-01', end_date: '2026-05-04', place_count: 3 }];
    const hook = setup({ showCreate: true, newTitle: 'Japan', availableTrips: trips });

    fireEvent.click(screen.getByText('Tokyo'));
    const setSelected = hook.setSelectedTripIds as ReturnType<typeof vi.fn>;
    const updater = setSelected.mock.calls[0][0] as (prev: Set<number>) => Set<number>;
    expect([...updater(new Set<number>())]).toEqual([21]);
    expect([...updater(new Set<number>([21]))]).toEqual([]);
  });

  it('FE-MOB-JLIST-012: closing the create sheet clears the flag on the hook', () => {
    const hook = setup({ showCreate: true, newTitle: 'Japan' });
    const cancels = screen.getAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancels[cancels.length - 1]);
    expect(hook.setShowCreate).toHaveBeenCalledWith(false);
  });

  it('FE-MOB-JLIST-013: the feed keeps its own scroller on a self-measured screen', () => {
    // #1809: the shell hands down no definite height any more, so the screen
    // sets one and the feed keeps scrolling inside it.
    mocks.journey = buildHook();
    const { container } = render(<MJourney />);

    expect(container.firstElementChild).toHaveClass('h-dvh');
    expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument();
  });
});
