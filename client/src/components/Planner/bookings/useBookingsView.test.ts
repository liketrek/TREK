// FE-PLANNER-BKVIEW-001 to FE-PLANNER-BKVIEW-016
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBookingsView } from './useBookingsView';

const stored = (store: Storage, key: string) => JSON.parse(store.getItem(key) ?? 'null');

afterEach(() => { vi.restoreAllMocks(); });

describe('useBookingsView', () => {
  it('FE-PLANNER-BKVIEW-001: starts on cards grouped by status, sorted by date, nothing filtered', () => {
    const { result } = renderHook(() => useBookingsView('transports', 1));
    expect(result.current.view).toBe('cards');
    expect(result.current.group).toBe('status');
    expect(result.current.sort).toEqual({ by: 'date', dir: 'asc' });
    expect(result.current.timeline).toEqual({ zoom: 'trip', byType: true, context: true });
    expect(result.current.transitApart).toBe(false);
    expect(result.current.status).toBe('all');
    expect(result.current.types.size).toBe(0);
    expect(result.current.travelers.size).toBe(0);
    expect(result.current.filtering).toBe(false);
    expect(result.current.viewIsDefault).toBe(true);
    expect(result.current.selectedId).toBeNull();
  });

  it('FE-PLANNER-BKVIEW-002: the view is remembered per tab', () => {
    const { result, unmount } = renderHook(() => useBookingsView('transports', 1));
    act(() => result.current.setView('list'));
    expect(result.current.view).toBe('list');
    expect(stored(localStorage, 'trek:bookings-transports-view')).toBe('list');
    unmount();
    expect(renderHook(() => useBookingsView('transports', 1)).result.current.view).toBe('list');
    expect(renderHook(() => useBookingsView('bookings', 1)).result.current.view).toBe('cards');
  });

  it('FE-PLANNER-BKVIEW-003: the list groups by day, and each view keeps its own grouping', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    act(() => result.current.setGroup('type'));
    expect(result.current.group).toBe('type');
    act(() => result.current.setView('list'));
    expect(result.current.group).toBe('day');
    act(() => result.current.setGroup('none'));
    expect(stored(localStorage, 'trek:bookings-bookings-group')).toEqual({ cards: 'type', list: 'none' });
  });

  it('FE-PLANNER-BKVIEW-004: the timeline is never grouped, and grouping there changes nothing', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    act(() => result.current.setView('timeline'));
    expect(result.current.group).toBe('none');
    act(() => result.current.setGroup('type'));
    expect(result.current.group).toBe('none');
    expect(localStorage.getItem('trek:bookings-bookings-group')).toBeNull();
    expect(result.current.transitApart).toBe(true);
  });

  it('FE-PLANNER-BKVIEW-005: a new sort key starts ascending, the same key keeps its direction, flip turns it', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    act(() => result.current.flipSort());
    expect(result.current.sort).toEqual({ by: 'date', dir: 'desc' });
    act(() => result.current.setSort('date'));
    expect(result.current.sort).toEqual({ by: 'date', dir: 'desc' });
    act(() => result.current.setSort('title'));
    expect(result.current.sort).toEqual({ by: 'title', dir: 'asc' });
    act(() => result.current.flipSort());
    act(() => result.current.flipSort());
    expect(result.current.sort).toEqual({ by: 'title', dir: 'asc' });
    expect(stored(localStorage, 'trek:bookings-bookings-sort')).toEqual({ by: 'title', dir: 'asc' });
  });

  it('FE-PLANNER-BKVIEW-006: the timeline zoom, type rows and context are remembered', () => {
    const { result } = renderHook(() => useBookingsView('transports', 1));
    act(() => result.current.setZoom('day'));
    act(() => result.current.toggleByType());
    act(() => result.current.toggleContext());
    expect(result.current.timeline).toEqual({ zoom: 'day', byType: false, context: false });
    expect(stored(localStorage, 'trek:bookings-transports-timeline')).toEqual({ zoom: 'day', byType: false, context: false });
  });

  it('FE-PLANNER-BKVIEW-007: a zoom stored by an older build opens on the whole trip', () => {
    localStorage.setItem('trek:bookings-transports-timeline', JSON.stringify({ zoom: 'week', byType: false, context: true }));
    const { result } = renderHook(() => useBookingsView('transports', 1));
    expect(result.current.timeline).toEqual({ zoom: 'trip', byType: false, context: true });
  });

  it('FE-PLANNER-BKVIEW-008: cards can put transit in its own section', () => {
    const { result } = renderHook(() => useBookingsView('transports', 1));
    act(() => result.current.toggleTransitApart());
    expect(result.current.transitApart).toBe(true);
    expect(result.current.viewIsDefault).toBe(false);
    expect(stored(localStorage, 'trek:bookings-transports-transitApart')).toBe(true);
  });

  it('FE-PLANNER-BKVIEW-009: status, types and travelers filter, per trip in the session', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 9));
    act(() => result.current.setStatus('pending'));
    act(() => result.current.toggleType('hotel'));
    act(() => result.current.toggleType('tour'));
    act(() => result.current.toggleTraveler(3));
    expect(result.current.status).toBe('pending');
    expect([...result.current.types]).toEqual(['hotel', 'tour']);
    expect([...result.current.travelers]).toEqual([3]);
    expect(result.current.filtering).toBe(true);
    expect(stored(sessionStorage, 'trek-bookings-filters-bookings-9')).toEqual({ types: ['hotel', 'tour'], status: 'pending', travelers: [3] });

    act(() => result.current.toggleType('hotel'));
    act(() => result.current.toggleTraveler(3));
    expect([...result.current.types]).toEqual(['tour']);
    expect(result.current.travelers.size).toBe(0);

    // Another trip starts unfiltered.
    expect(renderHook(() => useBookingsView('bookings', 10)).result.current.status).toBe('all');
  });

  it('FE-PLANNER-BKVIEW-010: clearing types and travelers leaves the status alone', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    act(() => result.current.setStatus('confirmed'));
    act(() => result.current.toggleType('hotel'));
    act(() => result.current.toggleTraveler(4));
    act(() => result.current.clearTypes());
    act(() => result.current.clearTravelers());
    expect(result.current.types.size).toBe(0);
    expect(result.current.travelers.size).toBe(0);
    expect(result.current.status).toBe('confirmed');
  });

  it('FE-PLANNER-BKVIEW-011: a search counts as filtering, and reset clears it along with the filters', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    act(() => result.current.setQuery('   '));
    expect(result.current.filtering).toBe(false);
    act(() => result.current.setQuery('kyoto'));
    act(() => result.current.toggleType('hotel'));
    expect(result.current.filtering).toBe(true);
    act(() => result.current.resetFilters());
    expect(result.current.query).toBe('');
    expect(result.current.types.size).toBe(0);
    expect(result.current.filtering).toBe(false);
  });

  it('FE-PLANNER-BKVIEW-012: reset view on cards restores grouping, sort and the transit section', () => {
    const { result } = renderHook(() => useBookingsView('transports', 1));
    act(() => result.current.setGroup('type'));
    act(() => result.current.setSort('title'));
    act(() => result.current.toggleTransitApart());
    expect(result.current.viewIsDefault).toBe(false);
    act(() => result.current.resetView());
    expect(result.current.group).toBe('status');
    expect(result.current.sort).toEqual({ by: 'date', dir: 'asc' });
    expect(result.current.transitApart).toBe(false);
    expect(result.current.viewIsDefault).toBe(true);
  });

  it('FE-PLANNER-BKVIEW-013: reset view on the list and on the timeline', () => {
    const { result } = renderHook(() => useBookingsView('transports', 1));
    act(() => result.current.setView('list'));
    act(() => result.current.flipSort());
    expect(result.current.viewIsDefault).toBe(false);
    act(() => result.current.resetView());
    expect(result.current.viewIsDefault).toBe(true);
    expect(result.current.group).toBe('day');

    act(() => result.current.setView('timeline'));
    act(() => result.current.toggleContext());
    expect(result.current.viewIsDefault).toBe(false);
    act(() => result.current.resetView());
    expect(result.current.timeline).toMatchObject({ byType: true, context: true });
    expect(result.current.viewIsDefault).toBe(true);
  });

  it('FE-PLANNER-BKVIEW-014: collapsed groups are remembered per trip and per grouping', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 5));
    expect(result.current.collapsed('pending')).toBe(false);
    act(() => result.current.toggleGroup('pending'));
    expect(result.current.collapsed('pending')).toBe(true);
    expect(stored(localStorage, 'trek:bookings-bookings-collapsed:5')).toEqual({ 'status:pending': true });
    act(() => result.current.setGroup('type'));
    expect(result.current.collapsed('pending')).toBe(false);
    act(() => result.current.setGroup('status'));
    act(() => result.current.toggleGroup('pending'));
    expect(result.current.collapsed('pending')).toBe(false);
  });

  it('FE-PLANNER-BKVIEW-015: blocked or garbled storage starts fresh and choices still apply', () => {
    localStorage.setItem('trek:bookings-bookings-sort', '{not json');
    expect(renderHook(() => useBookingsView('bookings', 1)).result.current.sort).toEqual({ by: 'date', dir: 'asc' });

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    expect(result.current.view).toBe('cards');
    act(() => result.current.setView('timeline'));
    expect(result.current.view).toBe('timeline');
  });

  it('FE-PLANNER-BKVIEW-016: remembers the selected booking while mounted', () => {
    const { result } = renderHook(() => useBookingsView('bookings', 1));
    act(() => result.current.setSelectedId(12));
    expect(result.current.selectedId).toBe(12);
  });
});
