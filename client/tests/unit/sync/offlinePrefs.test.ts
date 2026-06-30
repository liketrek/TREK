/**
 * offlinePrefs unit tests — device-local "what to store offline" + conflict strategy.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOfflinePrefs, setCacheTiles, setConflictStrategy,
  isTripOfflineEnabled, setTripOfflineEnabled, onOfflinePrefsChange, _resetOfflinePrefs,
} from '../../../src/sync/offlinePrefs'

beforeEach(() => {
  _resetOfflinePrefs()
  try { localStorage.removeItem('trek_offline_prefs') } catch { /* ignore */ }
})

describe('offlinePrefs', () => {
  it('defaults to tiles on, no disabled trips, ask strategy', () => {
    const p = getOfflinePrefs()
    expect(p.cacheTiles).toBe(true)
    expect(p.disabledTripIds).toEqual([])
    expect(p.conflictStrategy).toBe('ask')
    expect(isTripOfflineEnabled(5)).toBe(true)
  })

  it('toggles tile caching and persists it', () => {
    setCacheTiles(false)
    expect(getOfflinePrefs().cacheTiles).toBe(false)
    expect(JSON.parse(localStorage.getItem('trek_offline_prefs')!).cacheTiles).toBe(false)
  })

  it('disables and re-enables a single trip', () => {
    setTripOfflineEnabled(7, false)
    expect(isTripOfflineEnabled(7)).toBe(false)
    expect(getOfflinePrefs().disabledTripIds).toContain(7)

    setTripOfflineEnabled(7, true)
    expect(isTripOfflineEnabled(7)).toBe(true)
    expect(getOfflinePrefs().disabledTripIds).not.toContain(7)
  })

  it('does not duplicate a trip id when disabled twice', () => {
    setTripOfflineEnabled(3, false)
    setTripOfflineEnabled(3, false)
    expect(getOfflinePrefs().disabledTripIds.filter(id => id === 3)).toHaveLength(1)
  })

  it('sets the conflict strategy', () => {
    setConflictStrategy('mine')
    expect(getOfflinePrefs().conflictStrategy).toBe('mine')
  })

  it('notifies subscribers and stops after unsubscribe', () => {
    let n = 0
    const unsub = onOfflinePrefsChange(() => { n++ })
    setCacheTiles(false)
    expect(n).toBe(1)
    unsub()
    setCacheTiles(true)
    expect(n).toBe(1)
  })
})
