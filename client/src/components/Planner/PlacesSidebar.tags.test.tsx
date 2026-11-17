// FE-PLANNER-SIDEBAR-TAGS-001 to FE-PLANNER-SIDEBAR-TAGS-005: the tags in the category filter
// of the desktop places list. The predicate itself is covered in utils/placesFilter.test.ts.
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCategory, buildPlace, buildTag, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { render, screen, within } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import PlacesSidebar from './PlacesSidebar';

// The rows' pictures would ask the server for photos.
vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => undefined),
}));

const monument = buildTag({ id: 7, trip_id: 1, name: 'Monument', color: '#6366f1' });
const zone = buildTag({ id: 8, trip_id: 1, name: 'Zone', color: '#10b981' });
const park = buildCategory({ id: 4, name: 'Park', color: '#22c55e' });

const tower = buildPlace({
  name: 'Belem Tower',
  address: 'Lisbon',
  category_id: 4,
  tags: [{ id: 7, name: 'Monument' }],
});
const garden = buildPlace({ name: 'Estrela Garden', address: 'Lisbon', category_id: 4 });
const market = buildPlace({
  name: 'Time Out Market',
  address: 'Lisbon',
  category_id: null,
  // A traveller's personal tag, put on the place through the API: the trip does not list it.
  tags: [
    { id: 8, name: 'Zone' },
    { id: 50, name: 'Hidden gem' },
  ],
});

const props = {
  tripId: 1,
  places: [tower, garden, market],
  categories: [park],
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

type User = ReturnType<typeof userEvent.setup>;

const trigger = () => screen.getByRole('button', { name: 'Categories' });

async function openFilter(user: User) {
  if (trigger().getAttribute('aria-expanded') !== 'true') await user.click(trigger());
}

/** What the closed filter says is in force, read from its tooltip. */
async function filterLabel(user: User) {
  if (trigger().getAttribute('aria-expanded') === 'true') await user.click(trigger());
  // The tip opens when the pointer comes in, so it leaves first.
  await user.unhover(trigger());
  await user.hover(trigger());
  const text = (await screen.findByRole('tooltip')).textContent;
  await user.unhover(trigger());
  return text;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }), tripTags: [monument, zone] });
});

describe('PlacesSidebar category filter: tags', () => {
  it('FE-PLANNER-SIDEBAR-TAGS-001: lists the tags under the categories, the ones of the trip and any other a place carries', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...props} />);
    await openFilter(user);
    expect(screen.getByText('Tags')).toBeInTheDocument();
    for (const name of ['Park', 'No Category', 'Hidden gem', 'Monument', 'Zone']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('FE-PLANNER-SIDEBAR-TAGS-002: a ticked tag keeps the places that carry it', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...props} />);
    await openFilter(user);
    await user.click(screen.getByRole('button', { name: 'Monument' }));
    expect(screen.getByRole('button', { name: 'Monument' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Belem Tower')).toBeInTheDocument();
    expect(screen.queryByText('Estrela Garden')).not.toBeInTheDocument();
    expect(screen.queryByText('Time Out Market')).not.toBeInTheDocument();
    expect(useTripStore.getState().placesCategoryFilter).toEqual(new Set(['tag:7']));
    expect(await filterLabel(user)).toBe('Categories: Monument');
  });

  it('FE-PLANNER-SIDEBAR-TAGS-003: a category and a tag ticked together both have to hold, and the filter names them', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...props} />);
    await openFilter(user);
    await user.click(screen.getByRole('button', { name: 'Park' }));
    expect(screen.getByText('Estrela Garden')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Monument' }));
    expect(screen.getByText('Belem Tower')).toBeInTheDocument();
    expect(screen.queryByText('Estrela Garden')).not.toBeInTheDocument();
    expect(within(trigger()).getByText('2')).toBeInTheDocument();
    expect(await filterLabel(user)).toBe('Categories: Park, Monument');
  });

  it('FE-PLANNER-SIDEBAR-TAGS-004: clearing the filter unticks the tags as well', async () => {
    const user = userEvent.setup();
    render(<PlacesSidebar {...props} />);
    await openFilter(user);
    await user.click(screen.getByRole('button', { name: 'Zone' }));
    await user.click(screen.getByRole('button', { name: 'No Category' }));
    expect(screen.getByText('Time Out Market')).toBeInTheDocument();
    expect(screen.queryByText('Belem Tower')).not.toBeInTheDocument();
    expect(await filterLabel(user)).toBe('Categories: No Category, Zone');

    await openFilter(user);
    await user.click(screen.getByText('Clear filter'));
    expect(useTripStore.getState().placesCategoryFilter.size).toBe(0);
    expect(screen.getByText('Belem Tower')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zone' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-PLANNER-SIDEBAR-TAGS-005: a trip with tags and no category still has the filter; with neither it has none', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PlacesSidebar {...props} categories={[]} />);
    await openFilter(user);
    expect(screen.getByRole('button', { name: 'Monument' })).toBeInTheDocument();
    unmount();

    seedStore(useTripStore, { tripTags: [] });
    render(<PlacesSidebar {...props} categories={[]} places={[garden]} />);
    expect(screen.queryByRole('button', { name: 'Categories' })).not.toBeInTheDocument();
  });
});
