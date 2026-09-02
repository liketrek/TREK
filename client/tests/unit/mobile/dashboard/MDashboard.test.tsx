import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../helpers/render';
import MDashboard from '../../../../src/mobile/screens/dashboard/MDashboard';
import { tripsApi } from '../../../../src/api/client';
import { useAuthStore } from '../../../../src/store/authStore';
import { useInAppNotificationStore } from '../../../../src/store/inAppNotificationStore';
import { usePluginStore } from '../../../../src/store/pluginStore';
import type { TripCardBadge } from '../../../../src/api/client';
import type { DashboardTrip } from '../../../../src/pages/dashboard/dashboardModel';

// FE-MOB-DASH-001 onwards

const mocks = vi.hoisted(() => ({
  dash: {} as Record<string, unknown>,
  badges: {} as Record<number, unknown[]>,
}));

vi.mock('../../../../src/pages/dashboard/useDashboard', () => ({
  useDashboard: () => mocks.dash,
}));

// The badge lookup is a network hook of its own; the screen only cares what it returns.
vi.mock('../../../../src/components/Plugins/TripCardBadges', () => ({
  useTripCardBadges: () => (tripId: number) => mocks.badges[tripId] ?? [],
}));

// Local-calendar date string — NOT toISOString(), which is the UTC date and
// disagrees with the badge logic's wall-clock classification between local
// midnight and the UTC rollover (these tests flaked in exactly that window).
const iso = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function buildTrip(over: Partial<DashboardTrip> = {}): DashboardTrip {
  return {
    id: 1, user_id: 1, title: 'Japan 2026', currency: 'EUR', is_archived: 0,
    reminder_days: 0, start_date: iso(-3), end_date: iso(10),
    day_count: 14, place_count: 32, shared_count: 2,
    ...over,
  };
}

function buildDash(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    locale: 'en',
    t: (key: string) => key,
    navigate: vi.fn(),
    spotlight: null,
    upcoming: [],
    gridTrips: [],
    isLoading: false,
    loadError: false,
    retryLoad: vi.fn(),
    tripFilter: 'planned',
    setTripFilter: vi.fn(),
    viewMode: 'grid',
    toggleViewMode: vi.fn(),
    showForm: false,
    setShowForm: vi.fn(),
    editingTrip: null,
    setEditingTrip: vi.fn(),
    deleteTrip: null,
    setDeleteTrip: vi.fn(),
    copyTrip: null,
    setCopyTrip: vi.fn(),
    applyCoverUpdate: vi.fn(),
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    confirmDelete: vi.fn(),
    handleArchive: vi.fn(),
    handleUnarchive: vi.fn(),
    confirmCopy: vi.fn(),
    ...over,
  };
}

describe('MDashboard', () => {
  beforeEach(() => {
    mocks.dash = buildDash();
    mocks.badges = {};
    usePluginStore.setState({ plugins: [], loaded: true });
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, username: 'Maurice', email: 'maurice@trek.app', role: 'user', avatar_url: '' } as never,
    });
    useInAppNotificationStore.setState({ unreadCount: 0, fetchUnreadCount: async () => {} });
  });

  it('FE-MOB-DASH-001: renders the ongoing spotlight with badge, progress and grid cards', () => {
    mocks.dash = buildDash({
      spotlight: buildTrip(),
      gridTrips: [buildTrip({ id: 2, title: 'Lisbon', start_date: iso(30), end_date: iso(40) })],
    });
    render(<MDashboard />);

    expect(screen.getByText('Japan 2026')).toBeInTheDocument();
    expect(screen.getByText('dashboard.status.ongoing')).toBeInTheDocument();
    expect(screen.getByText('dashboard.mobile.spotlightDayOf')).toBeInTheDocument();
    // Stat pills reuse the desktop hero keys (no mobile-only duplicates).
    expect(screen.getByText('dashboard.hero.destinationMany')).toBeInTheDocument();
    expect(screen.getByText('dashboard.hero.travelerMany')).toBeInTheDocument();
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
  });

  it('FE-MOB-DASH-002: archived filter swaps card actions to restore + permanent delete', () => {
    const handleUnarchive = vi.fn();
    mocks.dash = buildDash({
      tripFilter: 'archive',
      handleUnarchive,
      gridTrips: [buildTrip({ id: 3, title: 'Iceland', is_archived: 1 })],
    });
    render(<MDashboard />);

    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.restore' }));
    expect(handleUnarchive).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: 'common.delete' })).toBeInTheDocument();
  });

  it('FE-MOB-DASH-003: the view toggle persists through the shared hook action', () => {
    const toggleViewMode = vi.fn();
    mocks.dash = buildDash({ toggleViewMode, gridTrips: [buildTrip()] });
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.aria.toggleView' }));
    expect(toggleViewMode).toHaveBeenCalled();
  });

  it('FE-MOB-DASH-004: an upcoming reservation opens the trip on its bookings tab', () => {
    mocks.dash = buildDash({
      upcoming: [{ id: 9, trip_id: 7, title: 'teamLab Planets', type: 'ticket', reservation_time: null, day_date: iso(2) }],
    });
    render(<MDashboard />);

    fireEvent.click(screen.getByText('teamLab Planets'));
    expect(sessionStorage.getItem('trip-tab-7')).toBe('buchungen');
  });

  it('FE-MOB-DASH-005: a failed load shows the retry banner', () => {
    const retryLoad = vi.fn();
    mocks.dash = buildDash({ loadError: true, retryLoad });
    render(<MDashboard />);

    expect(screen.getByRole('alert')).toHaveTextContent('dashboard.loadErrorBanner');
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.retry' }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-DASH-006: the empty state opens a blank create sheet', () => {
    const setShowForm = vi.fn();
    const setEditingTrip = vi.fn();
    mocks.dash = buildDash({ setShowForm, setEditingTrip });
    render(<MDashboard />);

    expect(screen.getByText('dashboard.emptyTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.emptyButton' }));

    expect(setEditingTrip).toHaveBeenCalledWith(null);
    expect(setShowForm).toHaveBeenCalledWith(true);
  });

  it('FE-MOB-DASH-007: a still-loading dashboard shows no empty state', () => {
    mocks.dash = buildDash({ isLoading: true });
    render(<MDashboard />);

    expect(screen.queryByText('dashboard.emptyTitle')).not.toBeInTheDocument();
  });

  it('FE-MOB-DASH-008: demo mode adds the banner', () => {
    mocks.dash = buildDash({ demoMode: true });
    render(<MDashboard />);

    expect(screen.getByText(/demo/i)).toBeInTheDocument();
  });

  it('FE-MOB-DASH-009: unread notifications mark the bell and it opens the list', () => {
    const navigate = vi.fn();
    mocks.dash = buildDash({ navigate });
    useInAppNotificationStore.setState({ unreadCount: 3, fetchUnreadCount: async () => {} });
    render(<MDashboard />);

    const bell = screen.getByRole('button', { name: 'notifications.title' });
    expect(bell.querySelector('span[aria-hidden]')).toBeInTheDocument();

    fireEvent.click(bell);
    expect(navigate).toHaveBeenCalledWith('/notifications');
  });

  it('FE-MOB-DASH-010: the avatar button toggles the user menu', () => {
    render(<MDashboard />);
    const avatar = screen.getByRole('button', { name: 'nav.profile' });

    expect(avatar).toHaveTextContent('M');
    expect(avatar).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(avatar);
    expect(avatar).toHaveAttribute('aria-expanded', 'true');
  });

  it('FE-MOB-DASH-011: a stored avatar replaces the initial', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, username: 'Maurice', email: 'm@trek.app', role: 'user', avatar_url: '/uploads/avatars/m.jpg' } as never,
    });
    render(<MDashboard />);

    const avatar = screen.getByRole('button', { name: 'nav.profile' });
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/m.jpg');
  });

  it('FE-MOB-DASH-012: the calendar action opens the all-trips subscribe dialog', () => {
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.subscribeAllTrips' }));

    expect(screen.getByText('dashboard.subscribeAllTripsDesc')).toBeInTheDocument();
  });

  it('FE-MOB-DASH-013: the delete sheet names the trip and runs the confirm action', () => {
    const confirmDelete = vi.fn();
    const setDeleteTrip = vi.fn();
    mocks.dash = buildDash({ deleteTrip: buildTrip({ title: 'Iceland' }), confirmDelete, setDeleteTrip });
    render(<MDashboard />);

    const sheet = screen.getByRole('dialog', { name: 'common.delete' });
    expect(within(sheet).getByText('dashboard.confirm.delete')).toBeInTheDocument();

    // The sheet's own chrome uses the real translations, the props the mocked t.
    fireEvent.click(within(sheet).getByText('Cancel'));
    expect(setDeleteTrip).toHaveBeenCalledWith(null);

    fireEvent.click(within(sheet).getAllByText('common.delete')[1]);
    expect(confirmDelete).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-DASH-014: the copy sheet confirms the duplicate', () => {
    const confirmCopy = vi.fn();
    mocks.dash = buildDash({ copyTrip: buildTrip({ title: 'Iceland' }), confirmCopy });
    render(<MDashboard />);

    const sheet = screen.getByRole('dialog', { name: 'dashboard.confirm.copy.title' });
    expect(within(sheet).getByText('Iceland')).toBeInTheDocument();

    fireEvent.click(within(sheet).getByText('dashboard.confirm.copy.confirm'));
    expect(confirmCopy).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-DASH-015: the list layout adds an archive action and the day/place stats', () => {
    const handleArchive = vi.fn();
    mocks.dash = buildDash({
      viewMode: 'list',
      handleArchive,
      gridTrips: [buildTrip({ id: 4, title: 'Lisbon', day_count: 12, place_count: 30, shared_count: 1 })],
    });
    render(<MDashboard />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('dashboard.card.buddyOne')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.archive' }));
    expect(handleArchive).toHaveBeenCalledWith(4);
  });

  it('FE-MOB-DASH-016: an undated trip renders dashes instead of a range', () => {
    mocks.dash = buildDash({ gridTrips: [buildTrip({ id: 5, start_date: null, end_date: null })] });
    render(<MDashboard />);

    const card = screen.getByText('Japan 2026').closest('[role="button"]') as HTMLElement;
    expect(within(card).getAllByText('—')).toHaveLength(2);
    expect(within(card).getByText('dashboard.card.idea')).toBeInTheDocument();
  });

  it.each([
    [{ is_archived: 1 }, 'dashboard.archived'],
    [{ start_date: iso(0), end_date: null }, 'dashboard.status.today'],
    [{ start_date: iso(1), end_date: null }, 'dashboard.status.tomorrow'],
    [{ start_date: iso(10), end_date: null }, 'dashboard.mobile.inDays'],
    [{ start_date: iso(200), end_date: null }, 'dashboard.mobile.inMonths'],
    [{ start_date: iso(-20), end_date: iso(-10) }, 'dashboard.mobile.completed'],
  ] as Array<[Partial<DashboardTrip>, string]>)(
    'FE-MOB-DASH-017: the card badge follows the trip state (%#)',
    (over, label) => {
      mocks.dash = buildDash({ gridTrips: [buildTrip({ id: 6, ...over })] });
      render(<MDashboard />);

      // The filter segments reuse some of these labels, so assert on the card itself.
      const card = screen.getByText('Japan 2026').closest('[role="button"]') as HTMLElement;
      expect(within(card).getByText(label)).toBeInTheDocument();
    },
  );

  it('FE-MOB-DASH-018: plugin badges render as chips, linked ones as anchors', () => {
    mocks.badges = {
      8: [
        { pluginId: 'p', id: 'a', label: 'Weather', value: '21°', tone: 'success' },
        { pluginId: 'p', id: 'b', label: 'Docs', value: '', tone: 'warn', url: 'https://example.com' },
      ] as TripCardBadge[],
    };
    mocks.dash = buildDash({ gridTrips: [buildTrip({ id: 8, title: 'Oslo' })] });
    render(<MDashboard />);

    expect(screen.getByText('21°')).toBeInTheDocument();
    const link = screen.getByText('Docs').closest('a') as HTMLAnchorElement;
    expect(link).toHaveAttribute('href', 'https://example.com');
    // The chip must not open the card underneath it.
    fireEvent.click(link);
    expect((mocks.dash.navigate as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('FE-MOB-DASH-019: dashboard widget plugins render below the blocks', () => {
    usePluginStore.setState({
      plugins: [
        { id: 'w1', name: 'Packing helper', type: 'widget', icon: null },
        { id: 'h1', name: 'Hero widget', type: 'widget', icon: null, slot: 'hero' },
      ] as never,
      loaded: true,
    });
    mocks.dash = buildDash({ spotlight: buildTrip() });
    render(<MDashboard />);

    expect(screen.getByText('Packing helper')).toBeInTheDocument();
    expect(screen.queryByText('Hero widget')).not.toBeInTheDocument();
  });

  it('FE-MOB-DASH-020: a card action does not open the trip underneath it', () => {
    const navigate = vi.fn();
    const setCopyTrip = vi.fn();
    mocks.dash = buildDash({ navigate, setCopyTrip, gridTrips: [buildTrip({ id: 9, title: 'Oslo' })] });
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.aria.duplicate' }));

    expect(setCopyTrip).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('FE-MOB-DASH-021: pressing Enter on a card opens the trip', () => {
    const navigate = vi.fn();
    mocks.dash = buildDash({ navigate, gridTrips: [buildTrip({ id: 9, title: 'Oslo' })] });
    render(<MDashboard />);

    fireEvent.keyDown(screen.getByText('Oslo').closest('[role="button"]') as HTMLElement, { key: 'Enter' });

    expect(navigate).toHaveBeenCalledWith('/trips/9');
  });

  it('FE-MOB-DASH-022: an upcoming spotlight counts down instead of showing progress', () => {
    mocks.dash = buildDash({
      spotlight: buildTrip({ start_date: iso(4), end_date: iso(9), cover_image: '/uploads/covers/x.jpg' }),
    });
    const { container } = render(<MDashboard />);

    expect(screen.getByText('dashboard.hero.badgeNext')).toBeInTheDocument();
    expect(screen.getByText('dashboard.mobile.inDays')).toBeInTheDocument();
    expect(container.querySelector('img[src="/uploads/covers/x.jpg"]')).toBeInTheDocument();
  });

  it('FE-MOB-DASH-023: a finished spotlight is labelled as recent', () => {
    mocks.dash = buildDash({ spotlight: buildTrip({ start_date: iso(-20), end_date: iso(-10), day_count: 1 }) });
    render(<MDashboard />);

    expect(screen.getByText('dashboard.hero.badgeRecent')).toBeInTheDocument();
    expect(screen.getByText('dashboard.mobile.spotlightDayOne')).toBeInTheDocument();
  });

  it('FE-MOB-DASH-024: the spotlight opens on Enter as well as on click', () => {
    const navigate = vi.fn();
    mocks.dash = buildDash({ navigate, spotlight: buildTrip({ id: 12 }) });
    render(<MDashboard />);

    fireEvent.keyDown(screen.getByText('Japan 2026').closest('[role="button"]') as HTMLElement, { key: 'Enter' });

    expect(navigate).toHaveBeenCalledWith('/trips/12');
  });

  it('FE-MOB-DASH-025: editing a card hands the trip to the create/edit sheet', () => {
    const setEditingTrip = vi.fn();
    const setShowForm = vi.fn();
    const trip = buildTrip({ id: 13, title: 'Oslo' });
    mocks.dash = buildDash({ setEditingTrip, setShowForm, gridTrips: [trip] });
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }));

    expect(setEditingTrip).toHaveBeenCalledWith(trip);
    expect(setShowForm).toHaveBeenCalledWith(true);
  });

  it('FE-MOB-DASH-026: the mobile widgets render in the configured block order', () => {
    mocks.dash = buildDash();
    render(<MDashboard />);

    // The widget panels bring their own translations rather than the mocked hook's t.
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Timezones')).toBeInTheDocument();
    expect(screen.getByText('Upcoming reservations')).toBeInTheDocument();
  });

  it('FE-MOB-DASH-027: a malformed date renders a dash instead of crashing', () => {
    mocks.dash = buildDash({ gridTrips: [buildTrip({ id: 14, start_date: 'not-a-date', end_date: iso(3) })] });
    render(<MDashboard />);

    const card = screen.getByText('Japan 2026').closest('[role="button"]') as HTMLElement;
    expect(within(card).getAllByText('—')).toHaveLength(1);
  });

  it('FE-MOB-DASH-028: the archived card duplicates and deletes through the hook', () => {
    const setCopyTrip = vi.fn();
    const setDeleteTrip = vi.fn();
    const trip = buildTrip({ id: 15, title: 'Iceland', is_archived: 1 });
    mocks.dash = buildDash({ tripFilter: 'archive', setCopyTrip, setDeleteTrip, gridTrips: [trip] });
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.aria.duplicate' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));

    expect(setCopyTrip).toHaveBeenCalledWith(trip);
    expect(setDeleteTrip).toHaveBeenCalledWith(trip);
  });

  it('FE-MOB-DASH-029: a grid card deletes through the hook', () => {
    const setDeleteTrip = vi.fn();
    const trip = buildTrip({ id: 16, title: 'Oslo' });
    mocks.dash = buildDash({ setDeleteTrip, gridTrips: [trip] });
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));

    expect(setDeleteTrip).toHaveBeenCalledWith(trip);
  });

  it('FE-MOB-DASH-030: a list card opens its trip by click and by Enter', () => {
    const navigate = vi.fn();
    mocks.dash = buildDash({ viewMode: 'list', navigate, gridTrips: [buildTrip({ id: 17, title: 'Oslo' })] });
    render(<MDashboard />);
    const card = screen.getByText('Oslo').closest('[role="button"]') as HTMLElement;

    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(navigate).toHaveBeenNthCalledWith(1, '/trips/17');
    expect(navigate).toHaveBeenNthCalledWith(2, '/trips/17');
  });

  it('FE-MOB-DASH-031: the brand tile scrolls the page back to the top', () => {
    // Since #1809 the document itself is the scroller on a phone, so there is no
    // shell container left to walk up to.
    const scrollTo = vi.fn();
    const original = window.scrollTo;
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'TREK' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    window.scrollTo = original;
  });

  it('FE-MOB-DASH-032: the user menu backdrop closes it again', () => {
    const { container } = render(<MDashboard />);
    const avatar = screen.getByRole('button', { name: 'nav.profile' });

    fireEvent.click(avatar);
    fireEvent.click(container.querySelector('.fixed.inset-0') as HTMLElement);

    expect(avatar).toHaveAttribute('aria-expanded', 'false');
  });

  it('FE-MOB-DASH-033: closing the trip sheet resets the form state', () => {
    const setShowForm = vi.fn();
    const setEditingTrip = vi.fn();
    mocks.dash = buildDash({ showForm: true, setShowForm, setEditingTrip });
    render(<MDashboard />);

    fireEvent.click(within(screen.getByRole('dialog')).getByText('Cancel'));

    expect(setShowForm).toHaveBeenCalledWith(false);
    expect(setEditingTrip).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-DASH-034: archiving from the edit sheet runs the matching hook action', () => {
    const handleArchive = vi.fn();
    const handleUnarchive = vi.fn();
    mocks.dash = buildDash({
      showForm: true, editingTrip: buildTrip({ id: 18 }), handleArchive, handleUnarchive,
    });
    render(<MDashboard />);

    fireEvent.click(screen.getByText('Archive'));
    expect(handleArchive).toHaveBeenCalledWith(18);

    mocks.dash = buildDash({
      showForm: true, editingTrip: buildTrip({ id: 18, is_archived: 1 }), handleArchive, handleUnarchive,
    });
    render(<MDashboard />);

    fireEvent.click(screen.getByText('Restore'));
    expect(handleUnarchive).toHaveBeenCalledWith(18);
  });

  it('FE-MOB-DASH-035: a cover uploaded in the sheet is patched into the trip list', async () => {
    const applyCoverUpdate = vi.fn();
    vi.spyOn(tripsApi, 'uploadCover').mockResolvedValue({ cover_image: '/uploads/covers/n.jpg' });
    mocks.dash = buildDash({ showForm: true, editingTrip: buildTrip({ id: 19 }), applyCoverUpdate });
    render(<MDashboard />);

    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['x'], 'c.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(applyCoverUpdate).toHaveBeenCalledWith(19, '/uploads/covers/n.jpg'));
  });

  it('FE-MOB-DASH-036: dismissing the copy sheet clears the pending trip', () => {
    const setCopyTrip = vi.fn();
    mocks.dash = buildDash({ copyTrip: buildTrip({ title: 'Iceland' }), setCopyTrip });
    render(<MDashboard />);

    const sheet = screen.getByRole('dialog', { name: 'dashboard.confirm.copy.title' });
    fireEvent.click(within(sheet).getByText('Cancel'));

    expect(setCopyTrip).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-DASH-037: the subscribe dialog can be closed again', async () => {
    render(<MDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.subscribeAllTrips' }));
    expect(screen.getByText('dashboard.subscribeAllTripsDesc')).toBeInTheDocument();

    // The dialog's close control is icon-only; it is the first button of the card.
    const card = screen.getByText('dashboard.subscribeAllTripsDesc').parentElement as HTMLElement;
    fireEvent.click(card.querySelector('button') as HTMLElement);

    await waitFor(() =>
      expect(screen.queryByText('dashboard.subscribeAllTripsDesc')).not.toBeInTheDocument());
  });

  it('FE-MOB-DASH-038: the filter row cannot widen the document on narrow phones (#discord S26)', async () => {
    render(<MDashboard />);

    // The chip track scrolls inside its own flexible box; without this the row
    // was the widest element on the page and dragged the fixed bars off-screen
    // under Android's forced zoom.
    const chip = await screen.findByText('dashboard.filter.planned');
    const track = chip.closest('button')!.parentElement as HTMLElement;
    expect(track.className).toContain('min-w-max');
    const wrapper = track.parentElement as HTMLElement;
    expect(wrapper.className).toContain('m-hscroll');
    expect(wrapper.className).toContain('min-w-0');
    expect(wrapper.className).toContain('flex-1');
  });
});
