import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useTripStore } from '../store/tripStore'

/**
 * Where the installed app was when it went to the background (#1024).
 *
 * iOS throws a home-screen app away soon after it is switched out (to Google
 * Maps, say), and the relaunch opens the start URL: back on the dashboard, the
 * trip and the tab the traveller was in gone. The route and the trip's tab are
 * kept here instead, and RootRedirect resumes them on a relaunch that comes soon
 * enough to still be the same session of use.
 *
 * Installed app only: in a browser tab, typing the address means "start".
 */
const KEY = 'trek:resume-route'
const CHECKED_KEY = 'trek:resume-checked'
const DAY_KEY = 'trek:resume-day-'

/**
 * The day the plan was on when the app went away (#666), handed over once to
 * whoever seeds the trip's first day selection. Null when there is none.
 */
export function takeResumeDay(tripId: number): number | null {
  try {
    const raw = sessionStorage.getItem(`${DAY_KEY}${tripId}`)
    if (raw == null) return null
    sessionStorage.removeItem(`${DAY_KEY}${tripId}`)
    const day = Number(raw)
    return Number.isInteger(day) ? day : null
  } catch {
    return null
  }
}
/** Older than this, a relaunch is a fresh start again. */
export const RESUME_MAX_AGE_MS = 6 * 60 * 60 * 1000

interface ResumeRecord { path: string; tab?: string; day?: number; at: number }

/** True in a display mode that has no tab strip, i.e. launched from the home screen. */
export function isInstalledApp(): boolean {
  if (typeof window === 'undefined') return false
  const standalone = ['standalone', 'fullscreen', 'minimal-ui'].some(
    mode => window.matchMedia?.(`(display-mode: ${mode})`).matches,
  )
  // iOS predates the display-mode query for home-screen apps.
  return standalone || (window.navigator as { standalone?: boolean }).standalone === true
}

/** Routes that are a place to come back to; the root, auth pages and settings are not. */
function resumable(path: string): boolean {
  return /^\/(trips\/\d+|journey(\/\d+)?|collections|vacay|atlas|files)(\/|\?|$)/.test(path)
}

const tripIdOf = (path: string): string | null => /^\/trips\/(\d+)/.exec(path)?.[1] ?? null

function withoutTabParam(path: string): string {
  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)
  params.delete('tab')
  const rest = params.toString()
  return rest ? `${pathname}?${rest}` : pathname
}

/** Called on every protected navigation and when the app is hidden. */
export function rememberRoute(path: string, now = Date.now(), day: number | null = null): void {
  try {
    if (!resumable(path)) {
      localStorage.removeItem(KEY)
      return
    }
    const tripId = tripIdOf(path)
    // The tab the planner last switched to, else the one the address asked for. Kept
    // apart from the address, where a ?tab= would outrank a tab switched to since.
    const asked = new URLSearchParams(path.split('?')[1] ?? '').get('tab') ?? undefined
    const tab = tripId ? sessionStorage.getItem(`trip-tab-${tripId}`) ?? asked : undefined
    const kept = tripId ? withoutTabParam(path) : path
    const record: ResumeRecord = { path: kept, at: now, ...(tab ? { tab } : {}), ...(tripId && day != null ? { day } : {}) }
    localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    // Storage refused: the relaunch simply starts where it always did.
  }
}

/**
 * The route to resume on this launch, or null. A trip's tab is put back where
 * the planner reads it, so the tab opens rather than the plan.
 */
export function takeResumeRoute(now = Date.now(), installed = isInstalledApp()): string | null {
  if (!installed) return null
  try {
    // Once per launch. sessionStorage dies with the app the system threw away and
    // survives everything else, so a later trip to the start page within the same
    // run goes to the start page, not back into the trip.
    if (sessionStorage.getItem(CHECKED_KEY)) return null
    sessionStorage.setItem(CHECKED_KEY, '1')
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const record = JSON.parse(raw) as Partial<ResumeRecord>
    if (typeof record.path !== 'string' || typeof record.at !== 'number') return null
    if (now - record.at > RESUME_MAX_AGE_MS || !resumable(record.path)) return null
    const tripId = tripIdOf(record.path)
    if (tripId && record.tab) sessionStorage.setItem(`trip-tab-${tripId}`, record.tab)
    if (tripId && typeof record.day === 'number') sessionStorage.setItem(`${DAY_KEY}${tripId}`, String(record.day))
    return record.path
  } catch {
    return null
  }
}

/** On logout, so the next account on this device does not resume someone else's trip. */
export function forgetResumeRoute(): void {
  try { localStorage.removeItem(KEY) } catch { /* nothing to forget */ }
}

/**
 * Keeps the record current: on each navigation, and once more as the app is
 * hidden, which is the last moment a tab switched inside the trip gets saved.
 */
export function useRememberRoute(): void {
  const location = useLocation()
  const path = location.pathname + location.search
  useEffect(() => {
    const save = () => rememberRoute(path, Date.now(), useTripStore.getState().selectedDayId ?? null)
    save()
    const onVisibility = () => { if (document.visibilityState === 'hidden') save() }
    const onPageHide = () => save()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [path])
}
