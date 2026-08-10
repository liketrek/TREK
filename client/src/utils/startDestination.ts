import { isTripTabId } from '../constants/tripTabs'
import type { Settings } from '../types'

/**
 * Where opening TREK lands. 'dashboard' is what TREK has always done; with
 * 'active_trip' the app skips straight into the trip the dashboard would
 * feature, on the tab picked below — three clicks and three loads less for
 * someone entering expenses while they're actually travelling.
 */
export type StartPage = 'dashboard' | 'active_trip'

export const DEFAULT_START_PAGE: StartPage = 'dashboard'
export const DEFAULT_START_TRIP_TAB = 'plan'

/**
 * The route that resolves the destination (RootRedirect in App.tsx). Anywhere
 * that used to navigate to '/dashboard' for lack of a better idea sends people
 * here instead, so the preference is applied in exactly one place.
 */
export const START_DESTINATION_ROUTE = '/'

/**
 * How long a device that has never seen the preference waits for the settings
 * before giving up and opening the dashboard. Long enough for a normal request,
 * short enough that a launch with no backend isn't stuck staring at a spinner.
 */
export const SETTINGS_WAIT_MS = 2500

export interface StartDestination {
  page: StartPage
  tab: string
}

// Mirrored in localStorage, not read from the settings store, because the
// redirect has to be decided on the first paint — waiting for GET /api/settings
// would put a spinner in front of every launch, including the default one that
// isn't redirecting anywhere. Same trick as 'app_language' and the theme boot
// snapshot: the server's answer wins on the next load, this is only what we
// knew last time.
const PAGE_KEY = 'trek_start_page'
const TAB_KEY = 'trek_start_trip_tab'

const isStartPage = (value: unknown): value is StartPage =>
  value === 'dashboard' || value === 'active_trip'

/**
 * What this device last knew, or null if it has never been told — a fresh
 * browser, another machine, or one that has logged out since.
 *
 * The null case matters: the preference lives on the server, so "this device
 * doesn't know" is not the same as "this user wants the dashboard". Callers
 * have to wait for the real settings rather than assume the default, or the
 * setting is silently ignored on every device that didn't set it.
 */
export function readStartDestination(): StartDestination | null {
  try {
    const page = localStorage.getItem(PAGE_KEY)
    if (!isStartPage(page)) return null
    const tab = localStorage.getItem(TAB_KEY)
    return { page, tab: isTripTabId(tab) ? tab : DEFAULT_START_TRIP_TAB }
  } catch {
    // Private-mode Safari and friends throw on access, not just on write.
    return null
  }
}

/** Called whenever the settings store learns a value — load, single or bulk save. */
export function rememberStartDestination(settings: Partial<Settings>): void {
  try {
    if ('start_page' in settings) {
      const page = settings.start_page
      if (isStartPage(page)) localStorage.setItem(PAGE_KEY, page)
      else localStorage.removeItem(PAGE_KEY)
    }
    if ('start_trip_tab' in settings) {
      const tab = settings.start_trip_tab
      if (isTripTabId(tab)) localStorage.setItem(TAB_KEY, tab)
      else localStorage.removeItem(TAB_KEY)
    }
  } catch {
    // A browser that won't persist this just falls back to the dashboard.
  }
}

/** On logout, so the next account on this browser starts on its own preference. */
export function forgetStartDestination(): void {
  try {
    localStorage.removeItem(PAGE_KEY)
    localStorage.removeItem(TAB_KEY)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/**
 * The planner URL for a startup redirect. The tab always goes on the query
 * string, including 'plan' — leaving it off would hand the decision back to
 * whichever tab the last session happened to end on.
 */
export function tripStartPath(tripId: number, tab: string): string {
  const safeTab = isTripTabId(tab) ? tab : DEFAULT_START_TRIP_TAB
  return `/trips/${tripId}?tab=${safeTab}`
}
