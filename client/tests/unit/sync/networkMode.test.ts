/**
 * networkMode unit tests — the force-offline override + effective offline state.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  isEffectivelyOffline, isEffectivelyOnline, isForcedOffline,
  setForcedOffline, onNetworkModeChange, _resetNetworkMode,
} from '../../../src/sync/networkMode'

beforeEach(() => {
  _resetNetworkMode()
  try { localStorage.removeItem('trek_forced_offline') } catch { /* ignore */ }
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
})

describe('networkMode', () => {
  it('is online by default', () => {
    expect(isForcedOffline()).toBe(false)
    expect(isEffectivelyOffline()).toBe(false)
    expect(isEffectivelyOnline()).toBe(true)
  })

  it('forced offline overrides a real online connection', () => {
    setForcedOffline(true)
    expect(isForcedOffline()).toBe(true)
    expect(isEffectivelyOffline()).toBe(true)
    expect(isEffectivelyOnline()).toBe(false)
  })

  it('reports offline when the browser is offline even without the force flag', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    expect(isForcedOffline()).toBe(false)
    expect(isEffectivelyOffline()).toBe(true)
  })

  it('notifies subscribers on change, ignores no-op sets, and stops after unsubscribe', () => {
    let count = 0
    const unsub = onNetworkModeChange(() => { count++ })
    setForcedOffline(true)
    expect(count).toBe(1)
    setForcedOffline(true) // same value → no notification
    expect(count).toBe(1)
    setForcedOffline(false)
    expect(count).toBe(2)
    unsub()
    setForcedOffline(true)
    expect(count).toBe(2)
  })

  it('persists the forced flag to localStorage', () => {
    setForcedOffline(true)
    expect(localStorage.getItem('trek_forced_offline')).toBe('1')
    setForcedOffline(false)
    expect(localStorage.getItem('trek_forced_offline')).toBeNull()
  })
})
