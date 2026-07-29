// FE-JRN-LISTWIRE-001 to FE-JRN-LISTWIRE-014
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../../tests/helpers/render';
import type { Journey } from '../store/journeyStore';
import JourneyPage from './JourneyPage';

const mocks = vi.hoisted(() => ({ journey: {} as Record<string, unknown> }));

vi.mock('./journey/useJourney', () => ({ useJourney: () => mocks.journey }));
vi.mock('../components/Layout/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('../mobile/screens/journey/MJourney', () => ({ default: () => <div data-testid="mobile-journey" /> }));

type ListItem = Journey & {
  entry_count?: number;
  photo_count?: number;
  place_count?: number;
  trip_date_min?: string | null;
  trip_date_max?: string | null;
};

function buildJourney(over: Partial<ListItem> = {}): ListItem {
  return {
    id: 1, user_id: 1, title: 'Japan 2026', subtitle: null,
    cover_gradient: null, cover_image: null, status: 'completed',
    created_at: new Date('2026-02-01T00:00:00Z').getTime(), updated_at: 0,
    ...over,
  };
}

function buildHook(over: Record<string, unknown> = {}): Record<string, unknown> {
  const journeys = (over.journeys as ListItem[]) ?? [];
  return {
    navigate: vi.fn(), journeys, loading: false,
    showCreate: false, setShowCreate: vi.fn(),
    newTitle: '', setNewTitle: vi.fn(),
    newSubtitle: '', setNewSubtitle: vi.fn(),
    availableTrips: [], selectedTripIds: new Set<number>(), setSelectedTripIds: vi.fn(),
    searchOpen: false, setSearchOpen: vi.fn(), searchQuery: '', setSearchQuery: vi.fn(),
    searchInputRef: { current: null },
    activeSuggestion: undefined, setDismissedSuggestions: vi.fn(),
    activeJourney: null, activeJourneyIsLive: false,
    filteredJourneys: journeys,
    openCreateModal: vi.fn(), handleCreate: vi.fn(), totalPlaces: 0,
    ...over,
  };
}

function setup(over: Record<string, unknown> = {}) {
  mocks.journey = buildHook(over);
  const view = render(<JourneyPage />);
  return { ...view, hook: mocks.journey };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('JourneyPage wiring', () => {
  it('FE-JRN-LISTWIRE-001: renders the section header and the create card', () => {
    setup();
    expect(screen.getByText('All Journeys')).toBeInTheDocument();
    expect(screen.getByText('Create a new Journey')).toBeInTheDocument();
  });

  it('FE-JRN-LISTWIRE-002: the mobile search button opens the field and focuses it', () => {
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');
    vi.useFakeTimers();
    try {
      const { hook, container } = setup({ searchInputRef: { current: input } });
      fireEvent.click(container.querySelectorAll('button')[0]);
      expect(hook.setSearchOpen).toHaveBeenCalledWith(true);
      vi.advanceTimersByTime(100);
      expect(focus).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-JRN-LISTWIRE-003: pressing the search button again closes it and clears the query', () => {
    const { hook, container } = setup({ searchOpen: true, searchQuery: 'kyoto' });
    fireEvent.click(container.querySelectorAll('button')[0]);
    expect(hook.setSearchOpen).toHaveBeenCalledWith(false);
    expect(hook.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('FE-JRN-LISTWIRE-004: typing filters and Escape resets the search box', () => {
    const { hook } = setup({ searchOpen: true, searchQuery: '' });
    const box = screen.getByPlaceholderText('Search journeys…');
    fireEvent.change(box, { target: { value: 'kyo' } });
    expect(hook.setSearchQuery).toHaveBeenCalledWith('kyo');

    fireEvent.keyDown(box, { key: 'Escape' });
    expect(hook.setSearchQuery).toHaveBeenCalledWith('');
    expect(hook.setSearchOpen).toHaveBeenCalledWith(false);

    fireEvent.keyDown(box, { key: 'a' });
    expect(hook.setSearchOpen).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-LISTWIRE-005: an active search reports how many journeys matched', () => {
    const journeys = [buildJourney({ id: 1, title: 'Kyoto trip' })];
    setup({ journeys, filteredJourneys: journeys, searchQuery: 'kyo' });
    expect(screen.getByText('1 journeys')).toBeInTheDocument();
    expect(screen.queryByText('All Journeys')).not.toBeInTheDocument();
  });

  it('FE-JRN-LISTWIRE-006: an empty search result says so', () => {
    setup({ journeys: [], filteredJourneys: [], searchQuery: 'zzz' });
    expect(screen.getByText(/zzz/)).toBeInTheDocument();
  });

  it('FE-JRN-LISTWIRE-007: the suggestion banner can be dismissed or turned into a journey', () => {
    const { hook } = setup({ activeSuggestion: { id: 42, title: 'Norway 2026' } });
    expect(screen.getByText('Trip just ended')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    const updater = (hook.setDismissedSuggestions as ReturnType<typeof vi.fn>).mock.calls[0][0] as
      (prev: Set<number>) => Set<number>;
    expect([...updater(new Set<number>())]).toEqual([42]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Create Journey' })[1]);
    expect(hook.openCreateModal).toHaveBeenCalledWith(42);
  });

  it('FE-JRN-LISTWIRE-008: the hero shows the active-journey eyebrow and opens the journey', () => {
    const activeJourney = buildJourney({ id: 3, title: 'Norway', subtitle: 'Fjords' });
    const { hook } = setup({ activeJourney, activeJourneyIsLive: true, journeys: [activeJourney], filteredJourneys: [] });

    expect(screen.getByText('Active Journey')).toBeInTheDocument();
    expect(screen.getByText('Fjords')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('heading', { name: 'Norway' }));
    expect(hook.navigate).toHaveBeenCalledWith('/journey/3');
  });

  it('FE-JRN-LISTWIRE-009: a non-live hero is labelled as the latest journey and uses its cover', () => {
    const activeJourney = buildJourney({ id: 3, title: 'Norway', cover_image: 'covers/n.jpg' });
    setup({ activeJourney, activeJourneyIsLive: false, journeys: [activeJourney], filteredJourneys: [] });
    expect(screen.getByText('Latest Journey')).toBeInTheDocument();
    expect(screen.getByText('Continue writing')).toBeInTheDocument();
  });

  it('FE-JRN-LISTWIRE-010: a journey card shows its counters and opens on click', () => {
    const journey = buildJourney({ id: 5, title: 'Iceland', subtitle: 'Ring road', entry_count: 4, photo_count: 9, place_count: 0, cover_image: 'covers/i.jpg' });
    const { hook } = setup({ journeys: [journey], filteredJourneys: [journey] });

    expect(screen.getByText('Ring road')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getAllByText('--')).toHaveLength(1);
    expect(document.querySelector('img[src="/uploads/covers/i.jpg"]')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Iceland'));
    expect(hook.navigate).toHaveBeenCalledWith('/journey/5');
  });

  it('FE-JRN-LISTWIRE-011: the dashed create card opens the modal', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByText('Create a new Journey'));
    expect(hook.openCreateModal).toHaveBeenCalledTimes(1);
    expect(hook.openCreateModal).toHaveBeenCalledWith();
  });

  it('FE-JRN-LISTWIRE-012: the spinner replaces the grid on the very first load', () => {
    setup({ loading: true, journeys: [], filteredJourneys: [] });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Create a new Journey')).not.toBeInTheDocument();
  });

  it('FE-JRN-LISTWIRE-013: the create modal edits name and subtitle and can be cancelled', () => {
    const { hook } = setup({ showCreate: true });
    fireEvent.change(screen.getByPlaceholderText('e.g. Southeast Asia 2026'), { target: { value: 'Japan' } });
    expect(hook.setNewTitle).toHaveBeenCalledWith('Japan');

    fireEvent.change(screen.getByPlaceholderText('e.g. Thailand, Vietnam & Cambodia'), { target: { value: 'Tokyo' } });
    expect(hook.setNewSubtitle).toHaveBeenCalledWith('Tokyo');

    const createButtons = screen.getAllByRole('button', { name: /Create Journey/ });
    expect(createButtons[createButtons.length - 1]).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(hook.setShowCreate).toHaveBeenCalledWith(false);
  });

  it('FE-JRN-LISTWIRE-014: modal trips render their status and toggle their selection', () => {
    const today = new Date().toISOString().split('T')[0];
    const availableTrips = [
      { id: 1, title: 'Past trip', start_date: '2020-01-01', end_date: '2020-01-05', place_count: 3, cover_image: '/uploads/t.jpg' },
      { id: 2, title: 'Running trip', start_date: today, end_date: '2099-01-01', place_count: 1 },
      { id: 3, title: 'Future trip', start_date: '2099-01-01', end_date: '2099-01-05', place_count: 0 },
    ];
    const { hook } = setup({ showCreate: true, newTitle: 'Japan', availableTrips, selectedTripIds: new Set([1]), totalPlaces: 3 });

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('places will be imported')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Future trip'));
    const updater = (hook.setSelectedTripIds as ReturnType<typeof vi.fn>).mock.calls[0][0] as
      (prev: Set<number>) => Set<number>;
    expect([...updater(new Set<number>([1]))]).toEqual([1, 3]);
    expect([...updater(new Set<number>([3]))]).toEqual([]);

    const createButtons = screen.getAllByRole('button', { name: /Create Journey/ });
    fireEvent.click(createButtons[createButtons.length - 1]);
    expect(hook.handleCreate).toHaveBeenCalledTimes(1);
  });
});
