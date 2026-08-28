import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTripWebSocket } from '../../../src/hooks/useTripWebSocket';
import { useTripStore } from '../../../src/store/tripStore';

vi.mock('../../../src/api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => 'mock-socket-id'),
  joinTrip: vi.fn(),
  leaveTrip: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
}));

// Import the mocked module AFTER vi.mock
const wsMock = await import('../../../src/api/websocket');

describe('useTripWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FE-HOOK-WS-001: on mount, joinTrip(tripId) is called', () => {
    const { unmount } = renderHook(() => useTripWebSocket(42));
    expect(wsMock.joinTrip).toHaveBeenCalledWith(42);
    unmount();
  });

  it('FE-HOOK-WS-002: on mount, addListener is called (registers event handlers)', () => {
    const { unmount } = renderHook(() => useTripWebSocket(42));
    // addListener is called twice: once for handleRemoteEvent, once for collabFileSync
    expect(wsMock.addListener).toHaveBeenCalled();
    expect((wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(1);
    unmount();
  });

  it('FE-HOOK-WS-003: on unmount, leaveTrip(tripId) is called', () => {
    const { unmount } = renderHook(() => useTripWebSocket(42));
    unmount();
    expect(wsMock.leaveTrip).toHaveBeenCalledWith(42);
  });

  it('FE-HOOK-WS-004: on unmount, removeListener is called', () => {
    const { unmount } = renderHook(() => useTripWebSocket(42));
    unmount();
    expect(wsMock.removeListener).toHaveBeenCalled();
  });

  it('FE-HOOK-WS-005: when tripId changes, leaves old trip and joins new one', () => {
    const { rerender, unmount } = renderHook(({ id }) => useTripWebSocket(id), {
      initialProps: { id: 1 as number | undefined },
    });
    expect(wsMock.joinTrip).toHaveBeenCalledWith(1);

    rerender({ id: 2 });

    expect(wsMock.leaveTrip).toHaveBeenCalledWith(1);
    expect(wsMock.joinTrip).toHaveBeenCalledWith(2);
    unmount();
  });

  it('FE-HOOK-WS-006: one of the registered listeners is handleRemoteEvent from tripStore', () => {
    const handler = useTripStore.getState().handleRemoteEvent;
    renderHook(() => useTripWebSocket(42));

    const addListenerCalls = (wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls;
    const registeredFunctions = addListenerCalls.map((call) => call[0]);
    expect(registeredFunctions).toContain(handler);
  });

  it('FE-HOOK-WS-006b: collab and fork synchronization listeners are registered', () => {
    const { unmount } = renderHook(() => useTripWebSocket(42));
    // handleRemoteEvent + collabFileSync + forkSync
    expect((wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
    unmount();
  });

  it('FE-HOOK-WS-006f: fork events refresh their authoritative trip slices', () => {
    const loadBudgetItems = vi.fn();
    const hydrateActiveTrip = vi.fn();
    useTripStore.setState({ loadBudgetItems, hydrateActiveTrip } as any);
    renderHook(() => useTripWebSocket(42));

    const forkSync = (wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls[2]?.[0];
    act(() => forkSync({ type: 'budget:exchange-rates-applied' }));
    act(() => forkSync({ type: 'guest:identity-transferred' }));

    expect(loadBudgetItems).toHaveBeenCalledWith(42);
    expect(hydrateActiveTrip).toHaveBeenCalledWith(42);
  });

  it('FE-HOOK-WS-006c: collab file sync listener reacts to collab:note:deleted events', () => {
    const mockLoadFiles = vi.fn();
    useTripStore.setState({ loadFiles: mockLoadFiles } as any);

    renderHook(() => useTripWebSocket(42));

    // The second addListener call is the collabFileSync function
    const addListenerCalls = (wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls;
    const collabFileSync = addListenerCalls[1]?.[0];
    expect(collabFileSync).toBeTypeOf('function');

    act(() => {
      collabFileSync({ type: 'collab:note:deleted' });
    });

    expect(mockLoadFiles).toHaveBeenCalledWith(42);
  });

  it('FE-HOOK-WS-006d: collab file sync listener reacts to collab:note:updated events', () => {
    const mockLoadFiles = vi.fn();
    useTripStore.setState({ loadFiles: mockLoadFiles } as any);

    renderHook(() => useTripWebSocket(42));

    const addListenerCalls = (wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls;
    const collabFileSync = addListenerCalls[1]?.[0];

    act(() => {
      collabFileSync({ type: 'collab:note:updated' });
    });

    expect(mockLoadFiles).toHaveBeenCalledWith(42);
  });

  it('FE-HOOK-WS-006e: collab file sync listener ignores unrelated event types', () => {
    const mockLoadFiles = vi.fn();
    useTripStore.setState({ loadFiles: mockLoadFiles } as any);

    renderHook(() => useTripWebSocket(42));

    const addListenerCalls = (wsMock.addListener as ReturnType<typeof vi.fn>).mock.calls;
    const collabFileSync = addListenerCalls[1]?.[0];

    act(() => {
      collabFileSync({ type: 'place:created' });
    });

    expect(mockLoadFiles).not.toHaveBeenCalled();
  });

  it('FE-HOOK-WS-007: no joinTrip call when tripId is undefined', () => {
    renderHook(() => useTripWebSocket(undefined));
    expect(wsMock.joinTrip).not.toHaveBeenCalled();
  });
});
