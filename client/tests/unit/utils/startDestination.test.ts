// FE-UTIL-START-001 to FE-UTIL-START-009
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  readStartDestination,
  rememberStartDestination,
  forgetStartDestination,
  tripStartPath,
  DEFAULT_START_PAGE,
  DEFAULT_START_TRIP_TAB,
} from '../../../src/utils/startDestination'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readStartDestination', () => {
  // Not the dashboard: the preference lives on the server, so a device that has
  // never seen it has to say "I don't know" and let the caller wait for the
  // settings. Answering 'dashboard' here ignored the setting on every device
  // that hadn't set it — including any browser that had logged out since.
  it('FE-UTIL-START-001: reports "unknown" when nothing was ever mirrored', () => {
    expect(readStartDestination()).toBeNull()
  })

  it('FE-UTIL-START-002: returns what was mirrored', () => {
    rememberStartDestination({ start_page: 'active_trip', start_trip_tab: 'finanzplan' })
    expect(readStartDestination()).toEqual({ page: 'active_trip', tab: 'finanzplan' })
  })

  it('FE-UTIL-START-002b: an explicitly mirrored dashboard is an answer, not "unknown"', () => {
    rememberStartDestination({ start_page: 'dashboard' })
    expect(readStartDestination()).toEqual({ page: DEFAULT_START_PAGE, tab: DEFAULT_START_TRIP_TAB })
  })

  // A value a user (or an older/newer build) could have written by hand must not
  // become a route we then navigate to.
  it('FE-UTIL-START-003: ignores values that are not a known page or tab', () => {
    localStorage.setItem('trek_start_page', 'somewhere_else')
    expect(readStartDestination()).toBeNull()

    localStorage.setItem('trek_start_page', 'active_trip')
    localStorage.setItem('trek_start_trip_tab', '../../etc/passwd')
    expect(readStartDestination()).toEqual({ page: 'active_trip', tab: DEFAULT_START_TRIP_TAB })
  })

  it('FE-UTIL-START-004: survives a browser that refuses storage access', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readStartDestination()).toBeNull()
  })
})

describe('rememberStartDestination', () => {
  it('FE-UTIL-START-005: only touches the keys present in the patch', () => {
    rememberStartDestination({ start_page: 'active_trip', start_trip_tab: 'dateien' })
    rememberStartDestination({ start_trip_tab: 'buchungen' })
    expect(readStartDestination()).toEqual({ page: 'active_trip', tab: 'buchungen' })
  })

  it('FE-UTIL-START-006: clears a key that comes back invalid instead of keeping a stale one', () => {
    rememberStartDestination({ start_page: 'active_trip' })
    rememberStartDestination({ start_page: undefined })
    expect(localStorage.getItem('trek_start_page')).toBeNull()
  })

  it('FE-UTIL-START-007: swallows a quota error rather than failing the settings save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => rememberStartDestination({ start_page: 'active_trip' })).not.toThrow()
  })
})

describe('forgetStartDestination', () => {
  it('FE-UTIL-START-008: leaves the next account on this browser knowing nothing', () => {
    rememberStartDestination({ start_page: 'active_trip', start_trip_tab: 'finanzplan' })
    forgetStartDestination()
    // "unknown", so the next login waits for its own settings instead of
    // inheriting the previous account's preference.
    expect(readStartDestination()).toBeNull()
  })
})

describe('tripStartPath', () => {
  it('FE-UTIL-START-009: always spells the tab out, and never a tab that does not exist', () => {
    // Explicit even for 'plan', or the last session's tab would decide instead.
    expect(tripStartPath(7, 'plan')).toBe('/trips/7?tab=plan')
    expect(tripStartPath(7, 'finanzplan')).toBe('/trips/7?tab=finanzplan')
    expect(tripStartPath(7, 'nonsense')).toBe('/trips/7?tab=plan')
  })
})
