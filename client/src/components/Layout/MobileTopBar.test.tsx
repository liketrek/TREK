// FE-COMP-MOBILETOPBAR-001 to FE-COMP-MOBILETOPBAR-007

vi.mock('./InAppNotificationBell', () => ({ default: () => null }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import MobileTopBar from './MobileTopBar';

const currentUser = buildUser({ id: 1, username: 'testuser', email: 'test@example.com' });

beforeEach(() => {
  resetAllStores();
  mockNavigate.mockClear();
  seedStore(useAuthStore, { user: currentUser, isAuthenticated: true });
});

describe('MobileTopBar', () => {
  it('FE-COMP-MOBILETOPBAR-001: renders the profile avatar (no brand logo)', () => {
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.queryByText('trek')).not.toBeInTheDocument();
  });

  it('FE-COMP-MOBILETOPBAR-002: avatar opens the profile sheet', async () => {
    const user = userEvent.setup();
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    await user.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('FE-COMP-MOBILETOPBAR-003: profile sheet shows Settings', async () => {
    const user = userEvent.setup();
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    await user.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('FE-COMP-MOBILETOPBAR-004: profile sheet shows Logout', async () => {
    const user = userEvent.setup();
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    await user.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('FE-COMP-MOBILETOPBAR-005: admin badge shown for admin users', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 2, username: 'adminuser', role: 'admin' }), isAuthenticated: true });
    const user = userEvent.setup();
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    await user.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('FE-COMP-MOBILETOPBAR-006: backdrop click closes the profile sheet', async () => {
    const user = userEvent.setup();
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    await user.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByText('testuser')).toBeInTheDocument();
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });

  it('FE-COMP-MOBILETOPBAR-007: profile label translates when language is fr', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'fr' }) });
    render(<MobileTopBar />, { initialEntries: ['/dashboard'] });
    expect(await screen.findByRole('button', { name: 'Profil' })).toBeInTheDocument();
  });
});
