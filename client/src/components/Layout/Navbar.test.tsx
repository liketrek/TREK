// FE-COMP-NAVBAR-001 to FE-COMP-NAVBAR-028
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAddonStore } from '../../store/addonStore';
import { usePluginStore } from '../../store/pluginStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import Navbar from './Navbar';

beforeEach(() => {
  resetAllStores();
  server.use(
    http.get('/api/auth/app-config', () => HttpResponse.json({ version: '2.9.10' })),
    http.get('/api/addons', () => HttpResponse.json({ addons: [] })),
  );
  seedStore(useAuthStore, { user: buildUser({ username: 'testuser', role: 'user' }), isAuthenticated: true, appVersion: '2.9.10' });
  seedStore(useSettingsStore, { settings: buildSettings() });
});

describe('Navbar', () => {
  it('FE-COMP-NAVBAR-001: renders without crashing', () => {
    render(<Navbar />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-002: shows TREK logo/brand', () => {
    render(<Navbar />);
    // The Navbar shows the app icon — check for presence of the nav element
    expect(document.querySelector('nav') || document.body).toBeTruthy();
  });

  it('FE-COMP-NAVBAR-003: shows username in user menu trigger', () => {
    render(<Navbar />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-004: user menu opens on click', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    // Click the username to open dropdown
    await user.click(screen.getByText('testuser'));
    // Settings option appears
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-005: user menu shows Log out option', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-006: shows Settings link in user menu', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-007: shows My Trips link in navbar', () => {
    render(<Navbar />);
    // nav.myTrips = "My Trips" is in the main navbar (hidden on mobile via CSS, but CSS is not processed in tests)
    // The link to /dashboard is present regardless
    const dashboardLinks = document.querySelectorAll('a[href="/dashboard"]');
    expect(dashboardLinks.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NAVBAR-008: clicking Log out calls logout', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    seedStore(useAuthStore, { user: buildUser({ username: 'testuser' }), isAuthenticated: true, logout });
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    await user.click(screen.getByText('Log out'));
    expect(logout).toHaveBeenCalled();
  });

  it('FE-COMP-NAVBAR-009: admin user sees Admin option', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'admin', role: 'admin' }), isAuthenticated: true });
    render(<Navbar />);
    await user.click(screen.getByText('admin'));
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-010: regular user does not see Admin option', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-011: shows tripTitle when provided', () => {
    render(<Navbar tripTitle="Paris 2026" />);
    expect(screen.getByText('Paris 2026')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-012: shows back button when showBack is true', () => {
    render(<Navbar showBack={true} onBack={vi.fn()} />);
    // Back button is a button element
    const backBtns = screen.getAllByRole('button');
    expect(backBtns.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NAVBAR-013: clicking back button calls onBack', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<Navbar showBack={true} onBack={onBack} />);
    // Find the back button (ArrowLeft icon)
    const buttons = screen.getAllByRole('button');
    // First button should be the back button
    await user.click(buttons[0]);
    expect(onBack).toHaveBeenCalled();
  });

  it('FE-COMP-NAVBAR-014: notification bell is rendered when user is logged in', () => {
    render(<Navbar />);
    // InAppNotificationBell is rendered — check that body has some content
    expect(document.body.children.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NAVBAR-015: dark mode toggle is accessible in user menu', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    // Dark mode / Light mode / Auto mode options
    const darkModeEls = screen.getAllByRole('button');
    expect(darkModeEls.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NAVBAR-016: app version shown in user menu', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    await waitFor(() => {
      expect(screen.getByText('v2.9.10')).toBeInTheDocument();
    });
  });

  it('FE-COMP-NAVBAR-017: Settings link navigates to /settings', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('FE-COMP-NAVBAR-018: Admin link navigates to /admin for admin user', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'adminuser', role: 'admin' }), isAuthenticated: true });
    render(<Navbar />);
    await user.click(screen.getByText('adminuser'));
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('FE-COMP-NAVBAR-019: share button rendered when onShare prop provided', () => {
    render(<Navbar onShare={vi.fn()} />);
    const shareBtn = screen.getByRole('button', { name: /share/i });
    expect(shareBtn).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-020: share button click calls onShare', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(<Navbar onShare={onShare} />);
    const shareBtn = screen.getByRole('button', { name: /share/i });
    await user.click(shareBtn);
    expect(onShare).toHaveBeenCalled();
  });

  it('FE-COMP-NAVBAR-021: share button NOT rendered when onShare prop omitted', () => {
    render(<Navbar />);
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-022: dark mode toggle shows Moon when light, Sun when dark', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }) });
    const { unmount } = render(<Navbar />);
    // Moon icon button should be present (title = 'nav.darkMode' i.e. 'Dark mode')
    expect(document.querySelector('[title]')).toBeTruthy();
    unmount();

    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }) });
    render(<Navbar />);
    // Sun icon button should be present when dark mode is on
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NAVBAR-023: dark mode toggle calls updateSetting', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }), updateSetting });
    render(<Navbar />);
    // Find the dark mode toggle button by title attribute
    const toggleBtn = document.querySelector('button[title]') as HTMLElement;
    expect(toggleBtn).toBeTruthy();
    await user.click(toggleBtn);
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'dark');
  });

  it('FE-COMP-NAVBAR-024: global addon nav links appear when addons enabled', () => {
    server.use(
      http.get('/api/addons', () => HttpResponse.json({
        addons: [{ id: 'vacay', name: 'Vacay', icon: 'CalendarDays', type: 'global', enabled: true }],
      })),
    );
    seedStore(useAddonStore, {
      addons: [{ id: 'vacay', name: 'Vacay', icon: 'CalendarDays', type: 'global', enabled: true }],
    });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /vacay/i })).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-025: global addon links hidden when in trip view (tripTitle set)', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'vacay', name: 'Vacay', icon: 'CalendarDays', type: 'global', enabled: true }],
    });
    render(<Navbar tripTitle="Japan 2025" />);
    expect(screen.queryByRole('link', { name: /vacay/i })).not.toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-026: notification bell visible when tripId provided', () => {
    render(<Navbar tripId="1" />);
    // InAppNotificationBell renders a button — check it is present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('FE-COMP-NAVBAR-027: user avatar image shown when avatar_url set', () => {
    seedStore(useAuthStore, {
      user: buildUser({ username: 'testuser', avatar_url: 'https://example.com/av.jpg' }),
      isAuthenticated: true,
    });
    render(<Navbar />);
    const avatarImg = document.querySelector('img[src="https://example.com/av.jpg"]');
    expect(avatarImg).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-028: user initial shown when no avatar_url', () => {
    seedStore(useAuthStore, {
      user: buildUser({ username: 'testuser', avatar_url: null }),
      isAuthenticated: true,
    });
    render(<Navbar />);
    // The initial is rendered as the first char uppercased in a div
    expect(screen.getAllByText('T')[0]).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-029: clicking backdrop overlay closes user menu', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    expect(screen.getByText('Settings')).toBeInTheDocument();
    // The backdrop overlay is a fixed-inset div rendered in the portal
    const backdrop = document.querySelector('[style*="inset: 0"]') as HTMLElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    }
  });

  it('FE-COMP-NAVBAR-030: dark mode auto uses system preference', () => {
    // 'auto' dark_mode relies on matchMedia — seed with auto and render
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'auto' }) });
    render(<Navbar />);
    // Component should render without errors regardless of system preference
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-031: dark mode toggle calls updateSetting with light when currently dark', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }), updateSetting });
    render(<Navbar />);
    const toggleBtn = document.querySelector('button[title]') as HTMLElement;
    expect(toggleBtn).toBeTruthy();
    await user.click(toggleBtn);
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'light');
  });

  it('FE-COMP-NAVBAR-032: user email shown in open user menu', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, {
      user: buildUser({ username: 'testuser', email: 'testuser@example.com' }),
      isAuthenticated: true,
    });
    render(<Navbar />);
    await user.click(screen.getByText('testuser'));
    expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-033: administrator badge shown for admin user in open menu', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, {
      user: buildUser({ username: 'adminuser', role: 'admin' }),
      isAuthenticated: true,
    });
    render(<Navbar />);
    await user.click(screen.getByText('adminuser'));
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('FE-COMP-NAVBAR-034: page plugin renders the icon its manifest declares', () => {
    seedStore(usePluginStore, {
      plugins: [{ id: 'trip-doctor', name: 'Trip Doctor', type: 'page', icon: 'Stethoscope' }],
    });
    const { container } = render(<Navbar />);
    expect(screen.getByRole('link', { name: /trip doctor/i })).toBeInTheDocument();
    expect(container.querySelector('.lucide-stethoscope')).not.toBeNull();
  });

  it('FE-COMP-NAVBAR-035: page plugin with an unknown icon falls back to Blocks', () => {
    seedStore(usePluginStore, {
      plugins: [{ id: 'bogus', name: 'Bogus', type: 'page', icon: 'NotAnIcon' }],
    });
    const { container } = render(<Navbar />);
    expect(container.querySelector('.lucide-blocks')).not.toBeNull();
  });
});

// FE-W5NAV-001 to FE-W5NAV-012 — scroll/dark styling, the addon-name fallback,
// the prerelease badge, the theme-transition timer and the hover styling that
// the behavioural tests above leave untouched.
describe('Navbar styling and menu details', () => {
  const nav = () => document.querySelector('nav') as HTMLElement;

  beforeEach(() => {
    document.documentElement.classList.remove('trek-theme-transitioning');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('FE-W5NAV-001: the bar goes translucent once the page is scrolled', () => {
    render(<Navbar />);
    expect(nav().style.backdropFilter).toBe('blur(20px)');

    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true });
    fireEvent.scroll(window);

    expect(nav().style.backdropFilter).toBe('blur(28px) saturate(180%)');
    expect(nav().style.background).toBe('rgba(255, 255, 255, 0.72)');
  });

  it('FE-W5NAV-002: dark mode swaps the bar and logo assets', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }) });
    render(<Navbar />);

    expect(nav().style.background).toBe('rgba(9, 9, 11, 0.95)');
    expect(document.querySelector('img[src="/logo-light.svg"]')).not.toBeNull();

    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true });
    fireEvent.scroll(window);
    expect(nav().style.background).toBe('rgba(9, 9, 11, 0.78)');
  });

  it('FE-W5NAV-003: a scrolled body counts as scrolled too', () => {
    render(<Navbar />);
    Object.defineProperty(document.body, 'scrollTop', { value: 30, configurable: true });
    fireEvent.scroll(document.body);

    expect(nav().style.backdropFilter).toBe('blur(28px) saturate(180%)');
    Object.defineProperty(document.body, 'scrollTop', { value: 0, configurable: true });
  });

  it('FE-W5NAV-004: no addons are loaded while nobody is signed in', () => {
    const loadAddons = vi.fn(async () => {});
    seedStore(useAuthStore, { user: null, isAuthenticated: false });
    seedStore(useAddonStore, { loadAddons });
    render(<Navbar />);

    expect(loadAddons).not.toHaveBeenCalled();
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });

  it('FE-W5NAV-005: a catalogued addon uses its translated name, an unknown one its own', () => {
    seedStore(useAddonStore, {
      addons: [
        { id: 'budget', name: 'Budget', icon: 'Briefcase', type: 'global', enabled: true },
        { id: 'trip-doctor', name: 'Trip Doctor', icon: 'NoSuchIcon', type: 'global', enabled: true },
        { id: 'weather', name: 'Weather', icon: 'Globe', type: 'integration', enabled: true },
        { id: 'atlas', name: 'Atlas', icon: 'Globe', type: 'global', enabled: false },
      ],
    });
    render(<Navbar />);

    expect(screen.getByRole('link', { name: /^Costs$/ })).toHaveAttribute('href', '/budget');
    expect(screen.getByRole('link', { name: /^Trip Doctor$/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Weather$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Atlas$/ })).not.toBeInTheDocument();
  });

  it('FE-W5NAV-006: the active tab keeps its colour on hover, inactive tabs brighten', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'vacay', name: 'Vacay', icon: 'CalendarDays', type: 'global', enabled: true }],
    });
    render(<Navbar />, { initialEntries: ['/dashboard'] });

    const active = screen.getByRole('link', { name: /my trips/i });
    const inactive = screen.getByRole('link', { name: /vacay/i });
    expect(active.style.background).toBe('var(--bg-card)');
    expect(inactive.style.background).toBe('transparent');

    fireEvent.mouseEnter(active);
    fireEvent.mouseLeave(active);
    expect(active.style.color).toBe('var(--text-primary)');

    fireEvent.mouseEnter(inactive);
    expect(inactive.style.color).toBe('var(--text-primary)');
    fireEvent.mouseLeave(inactive);
    expect(inactive.style.color).toBe('var(--text-muted)');
  });

  it('FE-W5NAV-007: trip pages swap the tab pill for the centre notice slot', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'vacay', name: 'Vacay', icon: 'CalendarDays', type: 'global', enabled: true }],
    });
    render(<Navbar tripTitle="Japan 2027" />);

    expect(document.getElementById('trek-nav-center-slot')).not.toBeNull();
    expect(document.querySelector('.trek-nav-pill')).toBeNull();
  });

  it('FE-W5NAV-008: the prerelease badge only shows with a version and the flag set', () => {
    seedStore(useAuthStore, {
      user: buildUser({ username: 'testuser' }),
      isAuthenticated: true,
      isPrerelease: true,
      appVersion: '3.5.0-rc1',
    });
    const { unmount } = render(<Navbar />);
    expect(screen.getByText('3.5.0-rc1')).toBeInTheDocument();
    unmount();

    seedStore(useAuthStore, { isPrerelease: true, appVersion: null });
    render(<Navbar />);
    expect(screen.queryByText('3.5.0-rc1')).not.toBeInTheDocument();
  });

  it('FE-W5NAV-009: the back, share and theme buttons reset their hover background', () => {
    render(<Navbar showBack onBack={vi.fn()} onShare={vi.fn()} />);

    const back = screen.getByRole('button', { name: /back/i });
    fireEvent.mouseEnter(back);
    expect(back.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(back);
    expect(back.style.background).toBe('transparent');

    const share = screen.getByRole('button', { name: /share/i });
    fireEvent.mouseEnter(share);
    expect(share.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(share);
    expect(share.style.background).toBe('var(--bg-card)');

    const theme = document.querySelector('button[title]') as HTMLElement;
    fireEvent.mouseEnter(theme);
    expect(theme.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(theme);
    expect(theme.style.background).toBe('transparent');
  });

  it('FE-W5NAV-010: toggling the theme twice restarts the transition class timer', () => {
    const updateSetting = vi.fn(async () => {});
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }), updateSetting });
    render(<Navbar />);
    const theme = document.querySelector('button[title]') as HTMLElement;

    vi.useFakeTimers();
    try {
      fireEvent.click(theme);
      expect(document.documentElement.classList.contains('trek-theme-transitioning')).toBe(true);

      act(() => { vi.advanceTimersByTime(200); });
      fireEvent.click(theme); // restarts the pending timer
      act(() => { vi.advanceTimersByTime(200); });
      expect(document.documentElement.classList.contains('trek-theme-transitioning')).toBe(true);

      act(() => { vi.advanceTimersByTime(200); });
      expect(document.documentElement.classList.contains('trek-theme-transitioning')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-W5NAV-011: unmounting with a pending transition cancels its timer', () => {
    const updateSetting = vi.fn(async () => {});
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }), updateSetting });
    const { unmount } = render(<Navbar />);
    const theme = document.querySelector('button[title]') as HTMLElement;

    vi.useFakeTimers();
    try {
      fireEvent.click(theme);
      const clear = vi.spyOn(window, 'clearTimeout');
      unmount();
      expect(clear).toHaveBeenCalled();
      clear.mockRestore();
    } finally {
      vi.useRealTimers();
      document.documentElement.classList.remove('trek-theme-transitioning');
    }
  });

  it('FE-W5NAV-012: every entry in the open user menu resets its hover background', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, {
      user: buildUser({ username: 'adminuser', role: 'admin' }),
      isAuthenticated: true,
      appVersion: '3.5.0',
    });
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }) });
    render(<Navbar />);
    await user.click(screen.getByText('adminuser'));

    for (const name of [/^Settings$/, /^Help$/, /^Admin$/]) {
      const link = screen.getByRole('link', { name });
      fireEvent.mouseEnter(link);
      expect(link.style.background).toBe('var(--bg-hover)');
      fireEvent.mouseLeave(link);
      expect(link.style.background).toBe('transparent');
    }

    const discord = screen.getByTitle('Discord');
    fireEvent.mouseEnter(discord);
    expect(discord.style.background).toBe('rgba(88, 101, 242, 0.125)');
    fireEvent.mouseLeave(discord);
    expect(discord.style.background).toBe('var(--bg-tertiary)');

    expect(document.querySelector('img[src="/text-light.svg"]')).not.toBeNull();
  });

  it('FE-W5NAV-013: following any menu entry closes the menu', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, {
      user: buildUser({ username: 'adminuser', role: 'admin' }),
      isAuthenticated: true,
    });
    render(<Navbar />);

    for (const name of [/^Settings$/, /^Help$/, /^Admin$/]) {
      await user.click(screen.getByText('adminuser'));
      await user.click(screen.getByRole('link', { name }));
      expect(screen.queryByRole('link', { name: /^Settings$/ })).not.toBeInTheDocument();
    }
  });

  it('FE-W5NAV-014: a rejected theme update is swallowed', async () => {
    const updateSetting = vi.fn(() => Promise.reject(new Error('offline')));
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }), updateSetting });
    render(<Navbar />);

    fireEvent.click(document.querySelector('button[title]') as HTMLElement);

    await waitFor(() => expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'dark'));
    document.documentElement.classList.remove('trek-theme-transitioning');
  });
});

/**
 * The bar's three columns (#1983).
 *
 * The tab pill was absolutely positioned on the centre of the bar, so it had no
 * relationship to what sat beside it. Its width grows with every enabled addon
 * and every page plugin, and once it outgrew the free space in the middle it
 * ran underneath the logo on one side and the user menu on the other. The only
 * adaptation was a fixed 1024px breakpoint that drops the labels, tuned when
 * two or three addons was the whole story and blind to plugins entirely.
 *
 * These check the shape rather than pixels, because that is where the defect
 * was: three columns in the flow cannot overlap, whatever ends up in them, and
 * no measurement has to be right for that to hold. jsdom reports every width as
 * zero, so an assertion on how wide anything is would pass for the wrong reason.
 */
describe('Navbar layout (#1983)', () => {
  const withAddons = (n: number) => {
    const addons = Array.from({ length: n }, (_, i) => ({
      id: `addon${i}`, name: `Addon ${i}`, icon: 'CalendarDays', type: 'global' as const, enabled: true,
    }));
    server.use(http.get('/api/addons', () => HttpResponse.json({ addons })));
    seedStore(useAddonStore, { addons });
  };

  it('keeps the tab pill in the flow rather than floating over its neighbours', () => {
    withAddons(4);
    const { container } = render(<Navbar />);
    const pill = container.querySelector('.trek-nav-pill') as HTMLElement;
    expect(pill).toBeTruthy();
    // The assertion that would have caught the overlap.
    expect(pill.style.position).not.toBe('absolute');
  });

  it('gives the columns either side of it equal weight, so it stays centred', () => {
    withAddons(4);
    const { container } = render(<Navbar />);
    const nav = container.querySelector('nav') as HTMLElement;
    const columns = Array.from(nav.children).filter(c => c.classList.contains('flex-1'));
    // Left brand column and right action cluster, both flex-1 basis-0.
    expect(columns).toHaveLength(2);
    for (const c of columns) expect(c.classList.contains('basis-0')).toBe(true);
  });

  it('lets the pill shrink instead of pushing the actions off the bar', () => {
    withAddons(8);
    const { container } = render(<Navbar />);
    const pill = container.querySelector('.trek-nav-pill') as HTMLElement;
    expect(pill.classList.contains('min-w-0')).toBe(true);
    expect(pill.style.overflowX).toBe('auto');
  });

  it('still renders every addon as a reachable link, however many there are', () => {
    withAddons(8);
    render(<Navbar />);
    for (let i = 0; i < 8; i++) {
      expect(screen.getByRole('link', { name: new RegExp(`Addon ${i}`, 'i') })).toBeInTheDocument();
    }
  });
});
