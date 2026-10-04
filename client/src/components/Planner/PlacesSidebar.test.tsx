// FE-COMP-PLACES-001 to FE-COMP-PLACES-015 + FE-PLANNER-SIDEBAR-016 to 067
import { render, screen, fireEvent, waitFor, act, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { placesApi } from '../../api/client';
import { installTouchDragBridge } from '../../utils/touchDragBridge';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip, buildPlace, buildCategory, buildDay, buildAssignment } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import PlacesSidebar from './PlacesSidebar';

// Mock photoService so PlaceAvatar doesn't trigger API calls
vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
}));

// PlaceAvatar uses `new IntersectionObserver(...)` — needs a class-based mock
class MockIO {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
beforeAll(() => { (globalThis as any).IntersectionObserver = MockIO; });

const defaultProps = {
  tripId: 1,
  places: [],
  categories: [],
  assignments: {},
  selectedDayId: null,
  selectedPlaceId: null,
  onPlaceClick: vi.fn(),
  onAddPlace: vi.fn(),
  onAssignToDay: vi.fn(),
  onEditPlace: vi.fn(),
  onDeletePlace: vi.fn(),
  days: [],
  isMobile: false,
};

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
});

type User = ReturnType<typeof userEvent.setup>;

/** The "show" choice sits behind its dropdown: open it, then pick the option by its label (the count follows it). */
async function pickFilter(user: User, label: string) {
  if (!screen.queryByTestId('places-filter')) await user.click(screen.getByRole('button', { name: 'Show' }));
  await user.click(within(screen.getByTestId('places-filter')).getByRole('button', { name: new RegExp(`^${label}`) }));
}

/** The categories open from their icon beside the show dropdown. */
async function openCategories(user: User) {
  const trigger = screen.getByRole('button', { name: 'Categories' });
  if (trigger.getAttribute('aria-expanded') !== 'true') await user.click(trigger);
}

/** The rating floors open from the star beside the categories. */
async function openRating(user: User) {
  const trigger = screen.getByRole('button', { name: 'Filter by rating' });
  if (trigger.getAttribute('aria-expanded') !== 'true') await user.click(trigger);
}

/** File and list import sit behind one Import button now. */
async function openImportMenu(user: User, item: RegExp) {
  await user.click(screen.getByRole('button', { name: 'Import Places' }));
  await user.click(await screen.findByRole('button', { name: item }));
}

/** A dialog's own button, apart from the sidebar's buttons of the same name. */
const inDialog = (name: RegExp) => within(screen.getByRole('dialog')).getByRole('button', { name });

describe('PlacesSidebar', () => {
  it('FE-COMP-PLACES-2093: the sort menu reorders the list and remembers the choice', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('trek:places-sort');
    const places = [
      buildPlace({ id: 1, name: 'Zeppelin Museum', rating_avg: 3, created_at: '2026-01-02' }),
      buildPlace({ id: 2, name: 'Alpine Hut', rating_avg: 5, created_at: '2026-01-01' }),
    ];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    const order = () => screen.getAllByText(/Zeppelin Museum|Alpine Hut/).map(el => el.textContent);
    expect(order()).toEqual(['Zeppelin Museum', 'Alpine Hut']);

    await user.click(screen.getByRole('button', { name: 'Sort by' }));
    await user.click(screen.getByRole('button', { name: 'Name (A–Z)' }));
    expect(order()).toEqual(['Alpine Hut', 'Zeppelin Museum']);
    expect(localStorage.getItem('trek:places-sort')).toBe('name');
    localStorage.removeItem('trek:places-sort');
  });

  it('FE-COMP-PLACES-001: renders without crashing', () => {
    render(<PlacesSidebar {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-002: shows search input', () => {
    render(<PlacesSidebar {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search');
    expect(searchInput).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-003: renders places from props', () => {
    const places = [
      buildPlace({ name: 'Eiffel Tower' }),
      buildPlace({ name: 'Louvre Museum' }),
    ];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('Louvre Museum')).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-004: shows Add Place button', () => {
    render(<PlacesSidebar {...defaultProps} />);
    // Multiple "Add Place/Activity" buttons may exist (top toolbar + empty state)
    const addBtns = screen.getAllByText(/Add Place\/Activity/i);
    expect(addBtns.length).toBeGreaterThan(0);
  });

  it('FE-COMP-PLACES-005: clicking Add Place calls onAddPlace', async () => {
    const user = userEvent.setup();
    const onAddPlace = vi.fn();
    render(<PlacesSidebar {...defaultProps} onAddPlace={onAddPlace} />);
    const addBtns = screen.getAllByText(/Add Place\/Activity/i);
    await user.click(addBtns[0]);
    expect(onAddPlace).toHaveBeenCalled();
  });

  /**
   * The split add button (a day is open).
   *
   * Two buttons rather than one, because the pool sits a click away from the plan
   * and a place you already know belongs to today should not need a second trip
   * through the day picker. The second one stays mounted and collapsed so it has
   * something to animate out of.
   */
  it('FE-COMP-PLACES-005b: with no day open there is one add button, at full length', () => {
    render(<PlacesSidebar {...defaultProps} selectedDayId={null} onAddPlaceToSelectedDay={vi.fn()} />);

    expect(screen.getAllByText(/Add Place\/Activity/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('New place')).not.toBeInTheDocument();
    // Present in the DOM so it can animate, but out of reach until a day is open.
    const quick = screen.getByTestId('add-place-to-day');
    expect(quick).toHaveAttribute('aria-hidden', 'true');
    expect(quick).toHaveAttribute('tabindex', '-1');
  });

  it('FE-COMP-PLACES-005c: an open day splits the button and shortens the main label', async () => {
    const user = userEvent.setup();
    const onAddPlaceToSelectedDay = vi.fn();
    render(<PlacesSidebar {...defaultProps} selectedDayId={7} onAddPlaceToSelectedDay={onAddPlaceToSelectedDay} />);

    // Shortened so both fit side by side without either truncating.
    expect(screen.getByText('New place')).toBeInTheDocument();

    const quick = screen.getByTestId('add-place-to-day');
    expect(quick).toHaveAttribute('tabindex', '0');
    await user.click(quick);
    expect(onAddPlaceToSelectedDay).toHaveBeenCalled();
  });

  it('FE-COMP-PLACES-006: clicking a place calls onPlaceClick with place id', async () => {
    const user = userEvent.setup();
    const onPlaceClick = vi.fn();
    const place = buildPlace({ id: 42, name: 'Notre Dame' });
    render(<PlacesSidebar {...defaultProps} places={[place]} onPlaceClick={onPlaceClick} />);
    await user.click(screen.getByText('Notre Dame'));
    expect(onPlaceClick).toHaveBeenCalled();
  });

  it('FE-COMP-PLACES-007: search filters places by name', async () => {
    const user = userEvent.setup();
    const places = [
      buildPlace({ name: 'Arc de Triomphe' }),
      buildPlace({ name: 'Sacre Coeur' }),
    ];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Arc');
    expect(screen.getByText('Arc de Triomphe')).toBeInTheDocument();
    expect(screen.queryByText('Sacre Coeur')).not.toBeInTheDocument();
  });

  it('FE-COMP-PLACES-008: search is case-insensitive', async () => {
    const user = userEvent.setup();
    const places = [buildPlace({ name: 'Museum of Art' })];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'museum');
    expect(screen.getByText('Museum of Art')).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-009: selected place is highlighted', () => {
    const place = buildPlace({ id: 10, name: 'Central Park' });
    render(<PlacesSidebar {...defaultProps} places={[place]} selectedPlaceId={10} />);
    expect(screen.getByText('Central Park')).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-009a: selected visible place is scrolled into view', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    scrollIntoView.mockClear();
    const places = [
      buildPlace({ id: 10, name: 'First Place' }),
      buildPlace({ id: 42, name: 'Map Click Target' }),
    ];

    render(<PlacesSidebar {...defaultProps} places={places} selectedPlaceId={42} />);

    const selectedRow = screen.getByText('Map Click Target').closest('[data-place-id="42"]');
    expect(selectedRow).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });
  });

  it('FE-COMP-PLACES-009b: selected place hidden by search is not scrolled', async () => {
    const user = userEvent.setup();
    const scrollIntoView = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    const places = [
      buildPlace({ id: 10, name: 'Visible Cafe' }),
      buildPlace({ id: 42, name: 'Hidden Museum' }),
    ];
    const { rerender } = render(<PlacesSidebar {...defaultProps} places={places} selectedPlaceId={null} />);

    await user.type(screen.getByPlaceholderText('Search'), 'Visible');
    scrollIntoView.mockClear();
    rerender(<PlacesSidebar {...defaultProps} places={places} selectedPlaceId={42} />);

    expect(screen.queryByText('Hidden Museum')).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('FE-COMP-PLACES-010: shows place count', () => {
    const places = [buildPlace({ name: 'P1' }), buildPlace({ name: 'P2' }), buildPlace({ name: 'P3' })];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    // The count rides on the show dropdown in the head.
    expect(screen.getByRole('button', { name: 'Show' })).toHaveTextContent('3');
  });

  it('FE-COMP-PLACES-011: empty list shows no place names', () => {
    render(<PlacesSidebar {...defaultProps} places={[]} />);
    expect(screen.queryByText(/Eiffel/)).not.toBeInTheDocument();
  });

  it('FE-COMP-PLACES-012: categories from props render without error', () => {
    const cats = [buildCategory({ name: 'Restaurant' }), buildCategory({ name: 'Hotel' })];
    render(<PlacesSidebar {...defaultProps} categories={cats} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-013: clearing search shows all places again', async () => {
    const user = userEvent.setup();
    const places = [buildPlace({ name: 'Place A' }), buildPlace({ name: 'Place B' })];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Place A');
    expect(screen.queryByText('Place B')).not.toBeInTheDocument();
    await user.clear(searchInput);
    expect(screen.getByText('Place B')).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-014: renders with days prop for day assignment', () => {
    const days = [buildDay({ id: 1, date: '2025-06-01' })];
    render(<PlacesSidebar {...defaultProps} days={days} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-PLACES-015: onEditPlace passed to component correctly', () => {
    const onEditPlace = vi.fn();
    const place = buildPlace({ name: 'Test Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} onEditPlace={onEditPlace} />);
    expect(screen.getByText('Test Place')).toBeInTheDocument();
  });
});

// ── Filter tabs ───────────────────────────────────────────────────────────────

describe('Filter tabs', () => {
  it('FE-PLANNER-SIDEBAR-016: "All" tab is active by default', () => {
    const places = [buildPlace({ name: 'Place Alpha' }), buildPlace({ name: 'Place Beta' })];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    expect(screen.getByText('Place Alpha')).toBeInTheDocument();
    expect(screen.getByText('Place Beta')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-017: "Unplanned" tab filters out planned places', async () => {
    const user = userEvent.setup();
    const planned = buildPlace({ name: 'Planned Place' });
    const unplanned = buildPlace({ name: 'Unplanned Place' });
    const assignments = { '1': [buildAssignment({ place: planned, day_id: 1 })] };
    render(<PlacesSidebar {...defaultProps} places={[planned, unplanned]} assignments={assignments} />);
    await pickFilter(user, 'Unplanned');
    expect(screen.queryByText('Planned Place')).not.toBeInTheDocument();
    expect(screen.getByText('Unplanned Place')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-018: "All" tab re-shows planned places', async () => {
    const user = userEvent.setup();
    const planned = buildPlace({ name: 'Planned Place' });
    const unplanned = buildPlace({ name: 'Unplanned Place' });
    const assignments = { '1': [buildAssignment({ place: planned, day_id: 1 })] };
    render(<PlacesSidebar {...defaultProps} places={[planned, unplanned]} assignments={assignments} />);
    await pickFilter(user, 'Unplanned');
    await pickFilter(user, 'All');
    expect(screen.getByText('Planned Place')).toBeInTheDocument();
    expect(screen.getByText('Unplanned Place')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-019: unplanned empty state shows "All places are planned"', async () => {
    const user = userEvent.setup();
    const place = buildPlace({ name: 'Assigned Place' });
    const assignments = { '1': [buildAssignment({ place, day_id: 1 })] };
    render(<PlacesSidebar {...defaultProps} places={[place]} assignments={assignments} />);
    await pickFilter(user, 'Unplanned');
    expect(screen.getByText(/All places are planned/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-019b: "Planned" filter shows only planned places', () => {
    const planned = buildPlace({ name: 'Planned Place' });
    const unplanned = buildPlace({ name: 'Unplanned Place' });
    const assignments = { '1': [buildAssignment({ place: planned, day_id: 1 })] };
    // Seed the pool filter directly: the tab label resolves from @trek/shared, but the
    // filter behaviour (only day-assigned places survive) is what this guards.
    seedStore(useTripStore, { placesFilter: 'planned' });
    render(<PlacesSidebar {...defaultProps} places={[planned, unplanned]} assignments={assignments} />);
    expect(screen.getByText('Planned Place')).toBeInTheDocument();
    expect(screen.queryByText('Unplanned Place')).not.toBeInTheDocument();
  });

  // ── The open day narrows the pool, and says so ──────────────────────────────
  //
  // The map has followed the selected day on this filter since #2024 while the list
  // did not, so a trip with everything planned read "55" in the pool beside five pins
  // on the map. Reported twice in the same Discord thread as the map being broken.

  it('FE-PLANNER-SIDEBAR-052: with a day open, "Planned" shows that day, not the whole trip', () => {
    const today = buildPlace({ id: 91, name: 'On This Day' });
    const otherDay = buildPlace({ id: 92, name: 'On Another Day' });
    const assignments = {
      '1': [buildAssignment({ place: today, day_id: 1 })],
      '2': [buildAssignment({ place: otherDay, day_id: 2 })],
    };
    seedStore(useTripStore, { placesFilter: 'planned' });
    render(
      <PlacesSidebar
        {...defaultProps}
        places={[today, otherDay]}
        assignments={assignments}
        days={[{ id: 1 }, { id: 2 }] as never}
        selectedDayId={1}
      />,
    );

    expect(screen.getByText('On This Day')).toBeInTheDocument();
    expect(screen.queryByText('On Another Day')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-053: without a day open it is the whole trip again', () => {
    const dayOne = buildPlace({ id: 91, name: 'On This Day' });
    const dayTwo = buildPlace({ id: 92, name: 'On Another Day' });
    const assignments = {
      '1': [buildAssignment({ place: dayOne, day_id: 1 })],
      '2': [buildAssignment({ place: dayTwo, day_id: 2 })],
    };
    seedStore(useTripStore, { placesFilter: 'planned' });
    render(
      <PlacesSidebar
        {...defaultProps}
        places={[dayOne, dayTwo]}
        assignments={assignments}
        days={[{ id: 1 }, { id: 2 }] as never}
        selectedDayId={null}
      />,
    );

    expect(screen.getByText('On This Day')).toBeInTheDocument();
    expect(screen.getByText('On Another Day')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-054: the note only appears while the day is actually narrowing', () => {
    const today = buildPlace({ id: 91, name: 'On This Day' });
    const assignments = { '1': [buildAssignment({ place: today, day_id: 1 })] };
    const onClearSelectedDay = vi.fn();
    seedStore(useTripStore, { placesFilter: 'planned' });
    const { rerender } = render(
      <PlacesSidebar
        {...defaultProps}
        places={[today]}
        assignments={assignments}
        days={[{ id: 1 }] as never}
        selectedDayId={1}
        onClearSelectedDay={onClearSelectedDay}
      />,
    );
    expect(screen.getByText('Showing the open day only')).toBeInTheDocument();

    // Dismissing it asks for the day to be closed rather than changing the filter.
    fireEvent.click(screen.getByLabelText('Show the whole trip'));
    expect(onClearSelectedDay).toHaveBeenCalledTimes(1);

    // No day open, nothing narrowed, no note.
    rerender(
      <PlacesSidebar
        {...defaultProps}
        places={[today]}
        assignments={assignments}
        days={[{ id: 1 }] as never}
        selectedDayId={null}
        onClearSelectedDay={onClearSelectedDay}
      />,
    );
    expect(screen.queryByText('Showing the open day only')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-055: "Unplanned" stays trip-wide while a day is open', () => {
    // A place assigned to some other day is planned, whichever day happens to be open,
    // so it must not reappear in the unplanned pool.
    const otherDay = buildPlace({ id: 92, name: 'On Another Day' });
    const loose = buildPlace({ id: 93, name: 'Not Planned At All' });
    const assignments = { '2': [buildAssignment({ place: otherDay, day_id: 2 })] };
    seedStore(useTripStore, { placesFilter: 'unplanned' });
    render(
      <PlacesSidebar
        {...defaultProps}
        places={[otherDay, loose]}
        assignments={assignments}
        days={[{ id: 1 }, { id: 2 }] as never}
        selectedDayId={1}
      />,
    );

    expect(screen.getByText('Not Planned At All')).toBeInTheDocument();
    expect(screen.queryByText('On Another Day')).not.toBeInTheDocument();
    expect(screen.queryByText('Showing the open day only')).not.toBeInTheDocument();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe('Search', () => {
  it('FE-PLANNER-SIDEBAR-020: search filters by address', async () => {
    const user = userEvent.setup();
    const place = buildPlace({ name: 'UK Office', address: '10 Downing Street' });
    const other = buildPlace({ name: 'Other Place', address: null });
    render(<PlacesSidebar {...defaultProps} places={[place, other]} />);
    await user.type(screen.getByPlaceholderText('Search'), 'Downing');
    expect(screen.getByText('UK Office')).toBeInTheDocument();
    expect(screen.queryByText('Other Place')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-021: clear search (X) button appears and resets search', async () => {
    const user = userEvent.setup();
    const places = [buildPlace({ name: 'Paris Hotel' }), buildPlace({ name: 'Rome Cafe' })];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Paris');
    expect(screen.queryByText('Rome Cafe')).not.toBeInTheDocument();
    // The X that clears it carries its own name now.
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Rome Cafe')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});

// ── Category filter dropdown ──────────────────────────────────────────────────

describe('Category filter dropdown', () => {
  it('FE-PLANNER-SIDEBAR-022: the category filter is offered when categories are present', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Museum', color: '#3b82f6' });
    const { unmount } = render(<PlacesSidebar {...defaultProps} categories={[cat]} />);
    await openCategories(user);
    expect(screen.getByRole('button', { name: 'Museum' })).toBeInTheDocument();
    unmount();

    // Without categories there is nothing to pick, so there is no category filter either.
    render(<PlacesSidebar {...defaultProps} categories={[]} />);
    expect(screen.queryByRole('button', { name: 'Categories' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-023: opening the category filter lists the categories', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Museum', color: '#3b82f6' });
    render(<PlacesSidebar {...defaultProps} categories={[cat]} />);
    expect(screen.queryByText('Museum')).not.toBeInTheDocument();
    await openCategories(user);
    expect(screen.getByRole('button', { name: 'Museum' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-PLANNER-SIDEBAR-024: selecting a category filters places', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Park', color: '#22c55e' });
    // Give places addresses so category name doesn't appear as subtitle
    const withCat = buildPlace({ name: 'Central Park', category_id: cat.id, address: 'New York, NY' });
    const noCat = buildPlace({ name: 'Random Shop', category_id: null, address: 'London, UK' });
    render(<PlacesSidebar {...defaultProps} places={[withCat, noCat]} categories={[cat]} />);
    await openCategories(user);
    // Click the category option in the panel (only one 'Park' now — no subtitle conflict)
    await user.click(screen.getByText('Park'));
    expect(screen.getByText('Central Park')).toBeInTheDocument();
    expect(screen.queryByText('Random Shop')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Park' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-PLANNER-SIDEBAR-025: "Clear filter" button appears when filter active and clears it', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Museum', color: '#3b82f6' });
    // Give places addresses so category name doesn't appear as subtitle
    const withCat = buildPlace({ name: 'Art Museum', category_id: cat.id, address: 'Paris' });
    const noCat = buildPlace({ name: 'Untagged Place', category_id: null, address: 'Berlin' });
    render(<PlacesSidebar {...defaultProps} places={[withCat, noCat]} categories={[cat]} />);
    await openCategories(user);
    await user.click(screen.getByText('Museum'));
    expect(screen.queryByText('Untagged Place')).not.toBeInTheDocument();
    // Clear filter button should appear
    expect(screen.getByText(/Clear filter/i)).toBeInTheDocument();
    await user.click(screen.getByText(/Clear filter/i));
    expect(screen.getByText('Untagged Place')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-026: multi-category selection shows count', async () => {
    const user = userEvent.setup();
    const cat1 = buildCategory({ name: 'Museum', color: '#3b82f6' });
    const cat2 = buildCategory({ name: 'Park', color: '#22c55e' });
    render(<PlacesSidebar {...defaultProps} categories={[cat1, cat2]} />);
    await openCategories(user);
    const museumOpts = screen.getAllByText('Museum');
    await user.click(museumOpts[museumOpts.length - 1]);
    const parkOpts = screen.getAllByText('Park');
    await user.click(parkOpts[parkOpts.length - 1]);
    expect(screen.getByRole('button', { name: 'Categories' })).toHaveTextContent('2');
  });

  it('FE-PLANNER-SIDEBAR-047: category filter survives unmount/remount (#1541)', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Hotel', color: '#3b82f6' });
    const withCat = buildPlace({ name: 'Grand Palace', category_id: cat.id, address: 'Vienna' });
    const noCat = buildPlace({ name: 'Street Market', category_id: null, address: 'Lisbon' });
    const { unmount } = render(<PlacesSidebar {...defaultProps} places={[withCat, noCat]} categories={[cat]} />);
    await openCategories(user);
    await user.click(screen.getByText('Hotel'));
    expect(screen.queryByText('Street Market')).not.toBeInTheDocument();
    // Switching planner tabs unmounts the sidebar; the filter must come back
    // both applied and visible instead of silently sticking on the map only.
    unmount();
    render(<PlacesSidebar {...defaultProps} places={[withCat, noCat]} categories={[cat]} />);
    // Visible as the badge on the category filter, with its list closed.
    expect(screen.getByRole('button', { name: 'Categories' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Categories' })).toHaveTextContent('1');
    expect(screen.getByText('Grand Palace')).toBeInTheDocument();
    expect(screen.queryByText('Street Market')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-048: filter tab survives unmount/remount (#1541)', async () => {
    const user = userEvent.setup();
    const planned = buildPlace({ name: 'Planned Place' });
    const unplanned = buildPlace({ name: 'Unplanned Place' });
    const assignments = { '1': [buildAssignment({ place: planned, day_id: 1 })] };
    const { unmount } = render(<PlacesSidebar {...defaultProps} places={[planned, unplanned]} assignments={assignments} />);
    await pickFilter(user, 'Unplanned');
    expect(screen.queryByText('Planned Place')).not.toBeInTheDocument();
    unmount();
    render(<PlacesSidebar {...defaultProps} places={[planned, unplanned]} assignments={assignments} />);
    expect(screen.queryByText('Planned Place')).not.toBeInTheDocument();
    expect(screen.getByText('Unplanned Place')).toBeInTheDocument();
  });
});

// ── Place list interaction ─────────────────────────────────────────────────────

describe('Place list interaction', () => {
  it('FE-PLANNER-SIDEBAR-027: "+" assign button appears when selectedDayId set and place not in day', () => {
    const place = buildPlace({ name: 'Unassigned Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} selectedDayId={5} assignments={{}} />);
    // Plus button should be visible next to the place, named like the menu entry it mirrors
    const placeRow = screen.getByRole('option', { name: 'Unassigned Place' });
    expect(within(placeRow).getByRole('button', { name: '+ Day' })).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-028: clicking "+" assign button calls onAssignToDay with placeId', async () => {
    const user = userEvent.setup();
    const onAssignToDay = vi.fn();
    const place = buildPlace({ id: 99, name: 'Place To Assign' });
    const onPlaceClick = vi.fn();
    render(<PlacesSidebar {...defaultProps} places={[place]} selectedDayId={5} assignments={{}} onAssignToDay={onAssignToDay} onPlaceClick={onPlaceClick} />);
    // The + button inside the place row acts on its own: it does not select the row as well.
    const placeRow = screen.getByText('Place To Assign').closest('div[draggable]') as HTMLElement;
    await user.click(within(placeRow).getByRole('button', { name: '+ Day' }));
    expect(onAssignToDay).toHaveBeenCalledWith(99);
    expect(onPlaceClick).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-SIDEBAR-029: "+" button not shown when place already assigned to selectedDay', () => {
    const place = buildPlace({ id: 55, name: 'Already Assigned' });
    const assignments = { '5': [buildAssignment({ place, day_id: 5 })] };
    render(<PlacesSidebar {...defaultProps} places={[place]} selectedDayId={5} assignments={assignments} />);
    const placeRow = screen.getByText('Already Assigned').closest('div[draggable]') as HTMLElement;
    expect(within(placeRow).queryByRole('button', { name: '+ Day' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-030: place address shown as subtitle', () => {
    const place = buildPlace({ name: 'Paris Spot', address: 'Rue de Rivoli', description: null });
    render(<PlacesSidebar {...defaultProps} places={[place]} />);
    expect(screen.getByText('Rue de Rivoli')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-031: no edit buttons shown when canEditPlaces=false', () => {
    seedStore(usePermissionsStore, { permissions: { place_edit: 'admin' } });
    render(<PlacesSidebar {...defaultProps} />);
    expect(screen.queryByText(/Add Place\/Activity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GPX/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google List/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import Places' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
    // Filtering is for everyone.
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-032: place count shows singular form for 1 place', () => {
    const place = buildPlace({ name: 'Solo Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} />);
    expect(screen.getByRole('button', { name: 'Show' })).toHaveTextContent('1');
  });
});

// ── Mobile day-picker (portal) ─────────────────────────────────────────────────

describe('Mobile day-picker (portal)', () => {
  it('FE-PLANNER-SIDEBAR-033: on mobile, clicking a place opens day-picker bottom sheet', async () => {
    const user = userEvent.setup();
    const place = buildPlace({ name: 'Mobile Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} isMobile={true} />);
    await user.click(screen.getByText('Mobile Place'));
    // The bottom sheet portal renders an extra copy of the place name + action buttons
    expect(await screen.findAllByText('Mobile Place')).toHaveLength(2);
    // Sheet-specific button is always present
    expect(screen.getByText(/View details/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-034: day-picker lists days and clicking a day calls onAssignToDay', async () => {
    const user = userEvent.setup();
    const onAssignToDay = vi.fn();
    const place = buildPlace({ id: 77, name: 'Day Picker Place' });
    const day = buildDay({ id: 7, title: 'Day 1' });
    render(<PlacesSidebar {...defaultProps} places={[place]} isMobile={true} days={[day]} onAssignToDay={onAssignToDay} />);
    await user.click(screen.getByText('Day Picker Place'));
    // Click "Add to which day?" to expand the day list
    const assignBtn = await screen.findByText(/Add to which day\?/i);
    await user.click(assignBtn);
    // Click Day 1
    expect(await screen.findByText('Day 1')).toBeInTheDocument();
    await user.click(screen.getByText('Day 1'));
    expect(onAssignToDay).toHaveBeenCalledWith(77, 7);
  });

  it('FE-PLANNER-SIDEBAR-035: day-picker backdrop click dismisses sheet', async () => {
    const user = userEvent.setup();
    const place = buildPlace({ name: 'Dismissable Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} isMobile={true} />);
    await user.click(screen.getByText('Dismissable Place'));
    // Wait for the sheet to open (always shows "View details")
    await screen.findByText(/View details/i);
    expect(screen.getAllByText('Dismissable Place')).toHaveLength(2);
    // Click the backdrop (fixed overlay div — first fixed overlay in body)
    const backdrop = document.querySelector('[style*="position: fixed"][style*="inset: 0"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);
    await waitFor(() => {
      expect(screen.queryByText(/View details/i)).not.toBeInTheDocument();
    });
  });

  it('FE-PLANNER-SIDEBAR-036: day-picker Edit button calls onEditPlace', async () => {
    const user = userEvent.setup();
    const onEditPlace = vi.fn();
    const place = buildPlace({ id: 88, name: 'Editable Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} isMobile={true} onEditPlace={onEditPlace} />);
    await user.click(screen.getByText('Editable Place'));
    const editBtn = await screen.findByText(/^Edit$/i);
    await user.click(editBtn);
    expect(onEditPlace).toHaveBeenCalledWith(expect.objectContaining({ id: 88 }));
  });

  it('FE-PLANNER-SIDEBAR-037: day-picker Delete button calls onDeletePlace', async () => {
    const user = userEvent.setup();
    const onDeletePlace = vi.fn();
    const place = buildPlace({ id: 66, name: 'Deletable Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} isMobile={true} onDeletePlace={onDeletePlace} />);
    await user.click(screen.getByText('Deletable Place'));
    const deleteBtn = await screen.findByText(/^Delete$/i);
    await user.click(deleteBtn);
    expect(onDeletePlace).toHaveBeenCalledWith(66);
  });
});

// ── GPX import ────────────────────────────────────────────────────────────────

describe('GPX import', () => {
  it('FE-PLANNER-SIDEBAR-038: "Import file" button opens the file import modal', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} />);
    await openImportMenu(user, /^Import file$/);
    expect(await screen.findByText(/\.gpx.*\.kml.*\.kmz/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-039: successful GPX import via modal shows success toast', async () => {
    const importSpy = vi.spyOn(placesApi, 'importGpx').mockResolvedValueOnce({ count: 2, places: [{ id: 10 }, { id: 11 }] });
    const loadTrip = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadTrip });
    const addToast = vi.fn();
    (window as any).__addToast = addToast;
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} pushUndo={vi.fn()} />);
    await openImportMenu(user, /^Import file$/);
    const fileInput = document.querySelector('input[type="file"][accept=".gpx,.kml,.kmz"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const file = new File(['track data'], 'route.gpx', { type: 'application/gpx+xml' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await user.click(inDialog(/^import$/i));
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        'success',
        undefined,
      );
    });
    importSpy.mockRestore();
  });
});

// ── Google Maps list import ───────────────────────────────────────────────────

describe('Google Maps list import', () => {
  it('FE-PLANNER-SIDEBAR-040: "Google List" button opens the URL dialog', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} />);
    await openImportMenu(user, /^List Import$/);
    expect(await screen.findByPlaceholderText(/maps\.app\.goo\.gl/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-041: import button disabled when URL input is empty', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} />);
    await openImportMenu(user, /^List Import$/);
    await screen.findByPlaceholderText(/maps\.app\.goo\.gl/i);
    const importBtn = inDialog(/^Import$/i);
    expect(importBtn).toBeDisabled();
  });

  it('FE-PLANNER-SIDEBAR-042: successful Google list import shows success toast and closes dialog', async () => {
    server.use(
      http.post('/api/trips/1/places/import/google-list', () =>
        HttpResponse.json({ count: 3, listName: 'My List', places: [{ id: 20 }, { id: 21 }, { id: 22 }] })
      ),
    );
    const loadTrip = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadTrip });
    const addToast = vi.fn();
    (window as any).__addToast = addToast;
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} pushUndo={vi.fn()} />);
    await openImportMenu(user, /^List Import$/);
    const urlInput = await screen.findByPlaceholderText(/maps\.app\.goo\.gl/i);
    await user.type(urlInput, 'https://maps.app.goo.gl/abc123');
    await user.click(inDialog(/^Import$/i));
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(
        expect.stringContaining('3'),
        'success',
        undefined,
      );
    });
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/maps\.app\.goo\.gl/i)).not.toBeInTheDocument();
    });
  });

  it('FE-PLANNER-SIDEBAR-043: pressing Enter in URL field triggers import', async () => {
    server.use(
      http.post('/api/trips/1/places/import/google-list', () =>
        HttpResponse.json({ count: 1, listName: 'Test', places: [{ id: 30 }] })
      ),
    );
    const loadTrip = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadTrip });
    const addToast = vi.fn();
    (window as any).__addToast = addToast;
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} pushUndo={vi.fn()} />);
    await openImportMenu(user, /^List Import$/);
    const urlInput = await screen.findByPlaceholderText(/maps\.app\.goo\.gl/i);
    await user.type(urlInput, 'https://maps.app.goo.gl/xyz{Enter}');
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(
        expect.stringContaining('1'),
        'success',
        undefined,
      );
    });
  });

});

// #1616: a tablet is a coarse pointer at a desktop width, and it sees both panes, so
// it has somewhere to drag a place to. A coarse pointer used to switch the drag off by
// itself, which left the reporter's iPad selecting text instead of picking up a row.
// Width is the only gate now: below lg the places live in their own tab.
describe('touch device at desktop width (#1616)', () => {
  const tabletProps = { ...defaultProps, isMobile: false };

  it('FE-PLANNER-SIDEBAR-044: place rows are draggable and opt into the touch bridge', () => {
    const place = buildPlace({ id: 7, name: 'Tablet Place' });
    const { container } = render(<PlacesSidebar {...tabletProps} places={[place]} />);
    const placeRow = screen.getByText('Tablet Place').closest('div[draggable]')!;
    expect(placeRow.getAttribute('draggable')).toBe('true');
    expect((container.firstChild as HTMLElement).hasAttribute('data-touch-drag')).toBe(true);
  });

  it('FE-PLANNER-SIDEBAR-045: dragging over the sidebar raises the drop-to-import overlay', () => {
    const place = buildPlace({ id: 7, name: 'Tablet Place' });
    const { container } = render(<PlacesSidebar {...tabletProps} places={[place]} />);
    fireEvent.dragEnter(container.firstChild as HTMLElement);
    expect(screen.getByText('Drop to import')).toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-046: below lg the rows stay undraggable and the bridge stays out', () => {
    const place = buildPlace({ id: 7, name: 'Narrow Place' });
    const { container } = render(<PlacesSidebar {...defaultProps} isMobile places={[place]} />);
    const placeRow = screen.getByText('Narrow Place').closest('div[draggable]')!;
    expect(placeRow.getAttribute('draggable')).toBe('false');
    expect((container.firstChild as HTMLElement).hasAttribute('data-touch-drag')).toBe(false);
    fireEvent.dragEnter(container.firstChild as HTMLElement);
    expect(screen.queryByText('Drop to import')).not.toBeInTheDocument();
  });
});

// The map draws no legend of its own, so the stroke in the row is the only
// thing tying a coloured line back to a place (#776).
describe('track colour legend (#776)', () => {
  it('FE-PLANNER-SIDEBAR-049: a track row carries a stroke in the colour the map draws', () => {
    const track = buildPlace({ id: 11, name: 'Coloured Track', route_geometry: '[[48.0,2.0],[49.0,3.0]]', route_color: '#e11d48' });
    render(<PlacesSidebar {...defaultProps} places={[track]} />);
    const row = screen.getByText('Coloured Track').closest('div[draggable]')!;
    const strokes = Array.from(row.querySelectorAll('span')).filter(el => (el as HTMLElement).style.borderRadius === '999px');
    expect(strokes.some(el => (el as HTMLElement).style.background.includes('225, 29, 72') || (el as HTMLElement).style.background.includes('#e11d48'))).toBe(true);
  });

  it('FE-PLANNER-SIDEBAR-050: a place without geometry gets no stroke at all', () => {
    const plain = buildPlace({ id: 12, name: 'Plain Place' });
    render(<PlacesSidebar {...defaultProps} places={[plain]} />);
    const row = screen.getByText('Plain Place').closest('div[draggable]')!;
    const strokes = Array.from(row.querySelectorAll('span')).filter(el => (el as HTMLElement).style.borderRadius === '999px');
    expect(strokes).toHaveLength(0);
  });

  it('FE-PLANNER-SIDEBAR-051: the star button filters the list down to a minimum rating', async () => {
    // Replaces the old sort toggle: sorting put the best first but still left
    // every other place on the list, which is no help when the point is to see
    // only what the group actually wants to do.
    const user = userEvent.setup();
    const places = [
      buildPlace({ id: 20, name: 'Loved Place', rating_avg: 4.6 }),
      buildPlace({ id: 21, name: 'Meh Place', rating_avg: 2.1 }),
      buildPlace({ id: 22, name: 'Unrated Place' }),
    ];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    expect(screen.getByText('Meh Place')).toBeInTheDocument();

    await openRating(user);
    await user.click(screen.getByRole('button', { name: /4\+/ }));

    expect(screen.getByText('Loved Place')).toBeInTheDocument();
    expect(screen.queryByText('Meh Place')).not.toBeInTheDocument();
    // An unrated place has no average to clear the floor with.
    expect(screen.queryByText('Unrated Place')).not.toBeInTheDocument();
  });
});

// #1616 — the other half of the reporter's gesture: the pickup. A tablet cannot
// start an HTML5 drag with a finger, so the bridge's long press has to do it, and
// the row has to hand over the placeId the day plan reads back on drop.
describe('picking a place up with a finger (#1616)', () => {
  it('FE-PLANNER-SIDEBAR-047: a long press on a place row starts a drag carrying its id', async () => {
    const place = buildPlace({ id: 42, name: 'Tablet Place' });
    render(<PlacesSidebar {...defaultProps} isMobile={false} places={[place]} />);
    const teardown = installTouchDragBridge();
    try {
      const row = screen.getByText('Tablet Place').closest('[draggable="true"]')!;
      fireEvent.touchStart(row, { touches: [{ identifier: 1, clientX: 20, clientY: 40 }] });
      await new Promise(resolve => setTimeout(resolve, 400));
      expect(window.__dragData).toEqual({ placeId: '42' });
    } finally {
      teardown();
      window.__dragData = null;
    }
  });

  it('FE-PLANNER-SIDEBAR-048: a swipe down the list scrolls instead of picking the row up', async () => {
    const place = buildPlace({ id: 42, name: 'Tablet Place' });
    render(<PlacesSidebar {...defaultProps} isMobile={false} places={[place]} />);
    const teardown = installTouchDragBridge();
    try {
      const row = screen.getByText('Tablet Place').closest('[draggable="true"]')!;
      fireEvent.touchStart(row, { touches: [{ identifier: 1, clientX: 20, clientY: 40 }] });
      const moved = fireEvent.touchMove(document, { touches: [{ identifier: 1, clientX: 20, clientY: 140 }] });
      await new Promise(resolve => setTimeout(resolve, 400));
      expect(moved).toBe(true);
      expect(window.__dragData).toBeFalsy();
    } finally {
      teardown();
      window.__dragData = null;
    }
  });
});

// ── The decluttered head: one filter panel, chips for what is in force ─────────

describe('filter panel and chips', () => {
  it('FE-PLANNER-SIDEBAR-056: a filter list closes on Escape and on a click outside it', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} places={[buildPlace({ name: 'Somewhere' })]} />);
    const trigger = screen.getByRole('button', { name: 'Show' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByPlaceholderText('Search'));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('FE-PLANNER-SIDEBAR-057: each filter says what it narrows to and lifts again', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Museum', color: '#3b82f6' });
    const places = [
      buildPlace({ id: 1, name: 'Rated Museum', category_id: cat.id, rating_avg: 4.5, rating_count: 2, address: 'A' }),
      buildPlace({ id: 2, name: 'Plain Spot', category_id: null, address: 'B' }),
    ];
    render(<PlacesSidebar {...defaultProps} places={places} categories={[cat]} />);
    const categoriesBtn = screen.getByRole('button', { name: 'Categories' });
    const ratingBtn = screen.getByRole('button', { name: 'Filter by rating' });
    expect(categoriesBtn).not.toHaveTextContent(/\d/);

    await pickFilter(user, 'Unplanned');
    expect(screen.getByRole('button', { name: 'Show' })).toHaveTextContent('Unplanned');
    await openCategories(user);
    await user.click(screen.getByRole('button', { name: 'Museum' }));
    await user.keyboard('{Escape}');
    await openRating(user);
    await user.click(screen.getByRole('button', { name: /4\+/ }));
    expect(categoriesBtn).toHaveTextContent('1');
    expect(ratingBtn).toHaveTextContent('4+');

    expect(screen.getByText('Rated Museum')).toBeInTheDocument();
    expect(screen.queryByText('Plain Spot')).not.toBeInTheDocument();

    await pickFilter(user, 'All');
    await openCategories(user);
    await user.click(screen.getByRole('button', { name: 'Clear filter' }));
    await user.keyboard('{Escape}');
    await openRating(user);
    await user.click(screen.getByRole('button', { name: /^All$/ }));

    expect(screen.getByText('Plain Spot')).toBeInTheDocument();
    expect(useTripStore.getState().placesFilter).toBe('all');
    expect(useTripStore.getState().placesCategoryFilter.size).toBe(0);
    expect(categoriesBtn).not.toHaveTextContent(/\d/);
    expect(ratingBtn).not.toHaveTextContent('+');
  });

  it('FE-PLANNER-SIDEBAR-058: the counts beside each choice ignore the rating floor', async () => {
    const user = userEvent.setup();
    const planned = buildPlace({ id: 1, name: 'Planned One', rating_avg: 1, rating_count: 1 });
    const loose = buildPlace({ id: 2, name: 'Loose One' });
    const assignments = { '1': [buildAssignment({ place: planned, day_id: 1 })] };
    render(<PlacesSidebar {...defaultProps} places={[planned, loose]} assignments={assignments} />);
    await openRating(user);
    await user.click(screen.getByRole('button', { name: /5\+/ }));

    await user.click(screen.getByRole('button', { name: 'Show' }));
    const show = screen.getByTestId('places-filter');
    expect(within(show).getByRole('button', { name: /^All/ })).toHaveTextContent('2');
    expect(within(show).getByRole('button', { name: /^Unplanned/ })).toHaveTextContent('1');
    expect(within(show).getByRole('button', { name: /^Planned/ })).toHaveTextContent('1');
    // Tracks is only offered once a place carries one.
    expect(within(show).queryByRole('button', { name: /^Tracks/ })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-059: the day chip has no X when there is no way to close the day from here', () => {
    const today = buildPlace({ id: 91, name: 'On This Day' });
    const assignments = { '1': [buildAssignment({ place: today, day_id: 1 })] };
    seedStore(useTripStore, { placesFilter: 'planned' });
    render(<PlacesSidebar {...defaultProps} places={[today]} assignments={assignments} days={[{ id: 1 }] as never} selectedDayId={1} />);
    expect(screen.getByText('Showing the open day only')).toBeInTheDocument();
    expect(screen.queryByLabelText('Show the whole trip')).not.toBeInTheDocument();
  });
});

// ── Rows: the "…" mirrors the right-click ───────────────────────────────────────

describe('row actions', () => {
  it('FE-PLANNER-SIDEBAR-060: the "…" offers the right-click entries and acts without selecting the row', async () => {
    const user = userEvent.setup();
    const onEditPlace = vi.fn();
    const onPlaceClick = vi.fn();
    const place = buildPlace({ id: 5, name: 'Menu Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} selectedDayId={3} onEditPlace={onEditPlace} onPlaceClick={onPlaceClick} />);
    const row = screen.getByRole('option', { name: 'Menu Place' });

    await user.click(within(row).getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    // The row's own "+" and the menu's "+ Day".
    expect(screen.getAllByRole('button', { name: '+ Day' })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEditPlace).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
    expect(onPlaceClick).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-061: the right-click menu stays, with the same entries', async () => {
    const onDeletePlace = vi.fn();
    const user = userEvent.setup();
    const place = buildPlace({ id: 6, name: 'Right Click Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} onDeletePlace={onDeletePlace} />);
    fireEvent.contextMenu(screen.getByRole('option', { name: 'Right Click Place' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeletePlace).toHaveBeenCalledWith(6);
  });

  it('FE-PLANNER-SIDEBAR-062: no "…" while selecting, nor below lg where a tap opens the day sheet', async () => {
    const user = userEvent.setup();
    const place = buildPlace({ id: 7, name: 'Quiet Place' });
    const { unmount } = render(<PlacesSidebar {...defaultProps} places={[place]} />);
    const row = () => screen.getByRole('option', { name: 'Quiet Place' });
    expect(within(row()).getByRole('button', { name: 'More options' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(within(row()).queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
    unmount();

    render(<PlacesSidebar {...defaultProps} places={[place]} isMobile />);
    expect(within(row()).queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-063: Enter selects a focused row and Space ticks it in select mode', async () => {
    const user = userEvent.setup();
    const onPlaceClick = vi.fn();
    const place = buildPlace({ id: 8, name: 'Keyboard Place' });
    render(<PlacesSidebar {...defaultProps} places={[place]} onPlaceClick={onPlaceClick} />);
    const row = screen.getByRole('option', { name: 'Keyboard Place' });
    act(() => { row.focus(); });
    await user.keyboard('{Enter}');
    expect(onPlaceClick).toHaveBeenCalledWith(8);

    await user.click(screen.getByRole('button', { name: 'Select' }));
    act(() => { row.focus(); });
    await user.keyboard(' ');
    expect(screen.getByRole('status', { name: '1 selected' })).toHaveTextContent('1');
  });
});

// ── Select mode and the import menu ─────────────────────────────────────────────

describe('select mode and import menu', () => {
  it('FE-PLANNER-SIDEBAR-064: select mode raises the selection bar at the foot, and takes it away again', async () => {
    const user = userEvent.setup();
    const places = [buildPlace({ name: 'One' }), buildPlace({ name: 'Two' })];
    render(<PlacesSidebar {...defaultProps} places={places} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Select' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status', { name: '0 selected' })).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(screen.getByRole('status', { name: '2 selected' })).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-065: the Import button opens its menu and a second click closes it', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: 'Import Places' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Import file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List Import' })).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole('button', { name: 'Import file' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SIDEBAR-066: the list import closes on Cancel and keeps its enrich switch behind the maps key', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { hasMapsKey: true });
    render(<PlacesSidebar {...defaultProps} />);
    await openImportMenu(user, /^List Import$/);
    const enrich = screen.getByRole('button', { name: 'Enrich places via Google' });
    expect(enrich).toHaveAttribute('aria-pressed', 'false');
    await user.click(enrich);
    expect(enrich).toHaveAttribute('aria-pressed', 'true');

    // Switching the provider swaps the example link.
    await user.click(screen.getByRole('button', { name: 'Naver List' }));
    expect(screen.getByPlaceholderText(/naver\.me/)).toBeInTheDocument();

    await user.click(inDialog(/^Cancel$/));
    expect(screen.queryByPlaceholderText(/naver\.me/)).not.toBeInTheDocument();
  });
});

describe('Category filter: places without a category', () => {
  it('FE-PLANNER-SIDEBAR-067: "No Category" keeps only the places without one, and is offered only while there are some', async () => {
    const user = userEvent.setup();
    const cat = buildCategory({ name: 'Cafe', color: '#f97316' });
    const withCat = buildPlace({ name: 'Blue Bottle', category_id: cat.id, address: 'Kyoto' });
    const noCat = buildPlace({ name: 'Loose Stop', category_id: null, address: 'Osaka' });
    const { unmount } = render(<PlacesSidebar {...defaultProps} places={[withCat, noCat]} categories={[cat]} />);
    await openCategories(user);
    await user.click(screen.getByRole('button', { name: 'No Category' }));
    expect(screen.getByRole('button', { name: 'No Category' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Loose Stop')).toBeInTheDocument();
    expect(screen.queryByText('Blue Bottle')).not.toBeInTheDocument();
    unmount();

    render(<PlacesSidebar {...defaultProps} places={[withCat]} categories={[cat]} />);
    await openCategories(user);
    expect(screen.queryByRole('button', { name: 'No Category' })).not.toBeInTheDocument();
  });
});
