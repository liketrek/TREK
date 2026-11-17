// FE-COMP-MBOTTOMNAV-001 to FE-COMP-MBOTTOMNAV-011

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
import { useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { AiStatusResponse } from '@trek/shared';
import MBottomNav from './MBottomNav';

const currentUser = buildUser({ id: 1, username: 'testuser', email: 'test@example.com' });

const vacay = { id: 'vacay', name: 'Vacay', type: 'global', icon: 'calendar', enabled: true };
const atlas = { id: 'atlas', name: 'Atlas', type: 'global', icon: 'globe', enabled: true };
const assistantAddon = { id: 'ai_assistant', name: 'AI assistant', type: 'integration', icon: 'sparkles', enabled: true };

const withAssistant = () =>
  useAssistantStore.setState({ status: { available: true } as AiStatusResponse, window: { open: false, minimized: false } });

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

afterEach(() => {
  useAssistantStore.setState({ status: null, window: { open: false, minimized: false } });
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

  it('FE-COMP-MBOTTOMNAV-008: the assistant takes a free dock slot, so More does not hold it alone', async () => {
    const user = userEvent.setup();
    withAssistant();
    seedStore(useAddonStore, { addons: [atlas, assistantAddon] });
    render(<MBottomNav />, { initialEntries: ['/atlas'] });
    expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Assistant' }));
    expect(useAssistantStore.getState().window).toEqual({ open: true, minimized: false });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-COMP-MBOTTOMNAV-009: with the dock full the assistant waits under More, and opens the home chat from there', async () => {
    const user = userEvent.setup();
    withAssistant();
    seedStore(useAddonStore, { addons: [vacay, atlas, assistantAddon] });
    render(<MBottomNav />, { initialEntries: ['/atlas'] });
    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('button', { name: 'Assistant' }));
    expect(useAssistantStore.getState().window).toEqual({ open: true, minimized: false });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-COMP-MBOTTOMNAV-010: the assistant goes where the settings put it', () => {
    withAssistant();
    seedStore(useAddonStore, { addons: [vacay, atlas, assistantAddon] });
    seedStore(useSettingsStore, {
      settings: { ...useSettingsStore.getState().settings, appearance: { mobileNav: { bar: ['assistant', 'atlas'], more: ['vacay'] } } },
    });
    render(<MBottomNav />, { initialEntries: ['/atlas'] });
    expect(screen.getByRole('button', { name: 'Assistant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atlas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vacay' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
  });

  it('FE-COMP-MBOTTOMNAV-011: no assistant entry while its addon is off', () => {
    withAssistant();
    seedStore(useAddonStore, { addons: [atlas, { ...assistantAddon, enabled: false }] });
    render(<MBottomNav />, { initialEntries: ['/atlas'] });
    expect(screen.queryByRole('button', { name: 'Assistant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
  });
});
