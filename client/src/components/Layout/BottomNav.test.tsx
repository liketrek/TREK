// FE-COMP-BOTTOMNAV-001 to FE-COMP-BOTTOMNAV-006

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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAddonStore } from '../../store/addonStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import BottomNav from './BottomNav';

const currentUser = buildUser({ id: 1, username: 'testuser', email: 'test@example.com' });

beforeEach(() => {
  resetAllStores();
  mockNavigate.mockClear();
  seedStore(useAuthStore, { user: currentUser, isAuthenticated: true });
});

describe('BottomNav', () => {
  it('FE-COMP-BOTTOMNAV-001: renders without crashing', () => {
    render(<BottomNav />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-BOTTOMNAV-002: shows the dashboard nav item', () => {
    render(<BottomNav />);
    expect(screen.getByText('My Trips')).toBeInTheDocument();
  });

  it('FE-COMP-BOTTOMNAV-003: centre create button creates a new trip by default', async () => {
    const user = userEvent.setup();
    render(<BottomNav />);
    await user.click(screen.getByRole('button', { name: 'New Trip' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?create=1');
  });

  it('FE-COMP-BOTTOMNAV-004: dashboard label translates when language is fr', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'fr' }) });
    render(<BottomNav />);
    expect(await screen.findByText('Mes voyages')).toBeInTheDocument();
  });

  it('FE-COMP-BOTTOMNAV-005: addon labels translate when language is fr', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'fr' }) });
    seedStore(useAddonStore, {
      addons: [
        { id: 'vacay', name: 'Vacay', type: 'global', icon: 'calendar', enabled: true },
        { id: 'atlas', name: 'Atlas', type: 'global', icon: 'globe', enabled: true },
        { id: 'journey', name: 'Journey', type: 'global', icon: 'compass', enabled: true },
      ],
    });
    render(<BottomNav />);
    expect(await screen.findByText('Vacances')).toBeInTheDocument();
    expect(await screen.findByText('Atlas')).toBeInTheDocument();
    expect(await screen.findByText('Journal de voyage')).toBeInTheDocument();
  });

  it('FE-COMP-BOTTOMNAV-006: unknown addon id is not rendered', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'foo', name: 'Foo Addon', type: 'global', icon: 'star', enabled: true }],
    });
    render(<BottomNav />);
    expect(screen.queryByText('Foo Addon')).not.toBeInTheDocument();
  });
});
