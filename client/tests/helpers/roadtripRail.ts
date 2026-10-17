import { act, fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'
import type { RoadtripPreferences } from '@trek/shared'
import { useAuthStore } from '../../src/store/authStore'
import { useRoadtripPreferencesStore } from '../../src/store/roadtripPreferencesStore'
import { useSettingsStore } from '../../src/store/settingsStore'
import { useTripStore } from '../../src/store/tripStore'

/** Scaffolding for the tests of the road trip rail's parts, each rendered on its own. */

/**
 * What the tooltip says once the pointer has rested on the element long enough.
 *
 * The pointer leaves again and the real clock is back before it returns, so a case can
 * read one tooltip after another and render on with real timers.
 */
export function tooltipOf(el: Element): string {
  vi.useFakeTimers()
  fireEvent.mouseEnter(el)
  act(() => { vi.advanceTimersByTime(300) })
  const text = screen.getByRole('tooltip').textContent ?? ''
  fireEvent.mouseLeave(el)
  vi.useRealTimers()
  return text
}

const USER_ID = 7
const TRIP_ID = 4

/** The traveller's road trip settings for the trip on screen. */
export function preferences(p: RoadtripPreferences): void {
  useAuthStore.setState({ user: { id: USER_ID } } as never)
  useTripStore.setState({ trip: { id: TRIP_ID } } as never)
  useRoadtripPreferencesStore.setState({ byTrip: { [`${USER_ID}:${TRIP_ID}`]: p } })
}

/** Metric distances on a 24-hour clock, the settings each case starts from. */
export function seedRailSettings(): void {
  useSettingsStore.setState({ settings: { distance_unit: 'metric', time_format: '24h' } as never })
}

/** The real clock, and no road trip settings, trip or user, once a case is done. */
export function resetRailStores(): void {
  vi.useRealTimers()
  useRoadtripPreferencesStore.setState({ byTrip: {} })
  useTripStore.setState({ trip: null } as never)
  useAuthStore.setState({ user: null } as never)
}
