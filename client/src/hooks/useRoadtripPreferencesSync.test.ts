import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRoadtripPreferencesSync } from './useRoadtripPreferencesSync'
import { useRoadtripSettings } from './useRoadtripSettings'
import { useRoadtripPreferencesStore } from '../store/roadtripPreferencesStore'
import { useAuthStore } from '../store/authStore'
import { addListener, removeListener } from '../api/websocket'

vi.mock('../api/websocket', () => ({ addListener: vi.fn(), removeListener: vi.fn() }))
vi.mock('../repo/roadtripPreferencesRepo', () => ({ cachedRoadtripPreferences: vi.fn(async () => ({})) }))
vi.mock('../db/offlineDb', () => ({ offlineDb: { roadtripPreferences: { put: vi.fn(async () => {}) } } }))

describe('shared Roadtrip settings', () => {
  it('scopes events and reads by trip and signed-in account', () => {
    useAuthStore.setState({ user: { id: 1 } as never })
    useRoadtripPreferencesStore.setState({ byTrip: {} })
    const hook = renderHook(() => {
      useRoadtripPreferencesSync()
      return useRoadtripSettings(s => s.roadtrip_day_start, 10)
    })
    const listener = vi.mocked(addListener).mock.calls[vi.mocked(addListener).mock.calls.length - 1][0]
    act(() => listener({ type: 'roadtripPreferences:changed', tripId: '10', preferences: { roadtrip_day_start: '07:00' } }))
    expect(hook.result.current).toBe('07:00')
    act(() => listener({ type: 'roadtripPreferences:changed', tripId: '11', preferences: { roadtrip_day_start: '09:00' } }))
    expect(hook.result.current).toBe('07:00')
    act(() => listener({ type: 'roadtripPreferences:changed', tripId: '10', preferences: { roadtrip_day_start: '99:00' } }))
    expect(hook.result.current).toBe('07:00')
    act(() => useAuthStore.setState({ user: { id: 2 } as never }))
    expect(hook.result.current).toBeUndefined()
    hook.unmount()
    expect(removeListener).toHaveBeenCalledWith(listener)
  })
})
