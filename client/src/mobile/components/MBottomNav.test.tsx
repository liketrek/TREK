// FE-COMP-MBOTTOMNAV-001 to FE-COMP-MBOTTOMNAV-007

vi.mock('../../api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { useAddonStore } from '../../store/addonStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser } from '../../../tests/helpers/factories';
import MBottomNav from './MBottomNav';

const currentUser = buildUser({ id: 1, username: 'testuser', email: 'test@example.com' });

const withCollections = () =>
  seedStore(useAddonStore, {
    addons: [{ id: 'collections', name: 'Collections', type: 'global', icon: 'bookmark', enabled: true }],
  });

beforeEach(() => {
  resetAllStores();
  mockNavigate.mockClear();
  sessionStorage.clear();
  seedStore(useAuthStore, { user: currentUser, isAuthenticated: true });
});

describe('MBottomNav', () => {
  it('FE-COMP-MBOTTOMNAV-001: the dock "+" creates a trip on an unclaimed route', async () => {
    const user = userEvent.setup();
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });
    await user.click(screen.getByRole('button', { name: 'New Trip' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?create=1');
  });

  it('FE-COMP-MBOTTOMNAV-002: on the collections overview the "+" adds a place', async () => {
    const user = userEvent.setup();
    withCollections();
    render(<MBottomNav />, { initialEntries: ['/collections'] });
    await user.click(screen.getByRole('button', { name: 'Add a place' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections?create=place');
  });

  // #1930: picking a list moves the route to /collections/:id, which the exact
  // match missed — the "+" then created a trip instead of adding a place.
  it('FE-COMP-MBOTTOMNAV-003: inside a collection the "+" adds a place, not a trip', async () => {
    const user = userEvent.setup();
    withCollections();
    render(<MBottomNav />, { initialEntries: ['/collections/7'] });
    await user.click(screen.getByRole('button', { name: 'Add a place' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections/7?create=place');
    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard?create=1');
  });

  it('FE-COMP-MBOTTOMNAV-004: the handoff keeps the list the user is looking at', async () => {
    const user = userEvent.setup();
    withCollections();
    render(<MBottomNav />, { initialEntries: ['/collections/123'] });
    await user.click(screen.getByRole('button', { name: 'Add a place' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections/123?create=place');
  });

  it('FE-COMP-MBOTTOMNAV-005: on the journey list the "+" starts a journey', async () => {
    const user = userEvent.setup();
    seedStore(useAddonStore, {
      addons: [{ id: 'journey', name: 'Journey', type: 'global', icon: 'compass', enabled: true }],
    });
    render(<MBottomNav />, { initialEntries: ['/journey'] });
    await user.click(screen.getByRole('button', { name: 'New Journey' }));
    expect(mockNavigate).toHaveBeenCalledWith('/journey?create=1');
  });

  it('FE-COMP-MBOTTOMNAV-006: inside a journey the "+" adds an entry', async () => {
    const user = userEvent.setup();
    seedStore(useAddonStore, {
      addons: [{ id: 'journey', name: 'Journey', type: 'global', icon: 'compass', enabled: true }],
    });
    render(<MBottomNav />, { initialEntries: ['/journey/5'] });
    await user.click(screen.getByRole('button', { name: 'Add Entry' }));
    expect(mockNavigate).toHaveBeenCalledWith('/journey/5?create=entry');
  });

  it('FE-COMP-MBOTTOMNAV-007: /vacay yields the centre slot to the screen (#1811)', () => {
    render(<MBottomNav />, { initialEntries: ['/vacay'] });
    expect(screen.queryByRole('button', { name: 'New Trip' })).not.toBeInTheDocument();
  });
});
