import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../helpers/render';
import MDashboard from '../../../../src/mobile/screens/dashboard/MDashboard';
import { useAuthStore } from '../../../../src/store/authStore';
import { useInAppNotificationStore } from '../../../../src/store/inAppNotificationStore';
import type { DashboardTrip } from '../../../../src/pages/dashboard/dashboardModel';

// FE-MOB-DASH-001 onwards

const mocks = vi.hoisted(() => ({ dash: {} as Record<string, unknown> }));

vi.mock('../../../../src/pages/dashboard/useDashboard', () => ({
  useDashboard: () => mocks.dash,
}));

const iso = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
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
    setTrips: vi.fn(),
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
});
