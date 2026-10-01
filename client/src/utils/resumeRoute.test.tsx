// FE-UTIL-RESUME-001 to FE-UTIL-RESUME-005
import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { forgetResumeRoute, rememberRoute, RESUME_MAX_AGE_MS, takeResumeDay, takeResumeRoute, useRememberRoute } from './resumeRoute'

const NOW = 1_800_000_000_000

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('resume route (#1024)', () => {
  it('FE-UTIL-RESUME-001: an installed relaunch goes back to the trip and its tab, once', () => {
    sessionStorage.setItem('trip-tab-7', 'buchungen')
    rememberRoute('/trips/7?tab=plan', NOW)
    sessionStorage.clear() // the system threw the app away
    expect(takeResumeRoute(NOW + 60_000, true)).toBe('/trips/7')
    expect(sessionStorage.getItem('trip-tab-7')).toBe('buchungen')
    // Within the same run the start page is the start page again.
    expect(takeResumeRoute(NOW + 120_000, true)).toBeNull()
  })

  it('FE-UTIL-RESUME-002: a deep-linked tab is kept when the planner never switched', () => {
    rememberRoute('/trips/7?tab=finanzplan', NOW)
    sessionStorage.clear()
    expect(takeResumeRoute(NOW, true)).toBe('/trips/7')
    expect(sessionStorage.getItem('trip-tab-7')).toBe('finanzplan')
  })

  it('FE-UTIL-RESUME-003: not in a browser tab, not when stale, not for places that are no destination', () => {
    rememberRoute('/journey/3', NOW)
    expect(takeResumeRoute(NOW, false)).toBeNull()
    sessionStorage.clear()
    expect(takeResumeRoute(NOW + RESUME_MAX_AGE_MS + 1, true)).toBeNull()
    sessionStorage.clear()
    rememberRoute('/settings', NOW)
    expect(localStorage.getItem('trek:resume-route')).toBeNull()
    expect(takeResumeRoute(NOW, true)).toBeNull()
  })

  it('FE-UTIL-RESUME-004: logout forgets it, and a broken record is ignored', () => {
    rememberRoute('/atlas', NOW)
    forgetResumeRoute()
    expect(takeResumeRoute(NOW, true)).toBeNull()
    sessionStorage.clear()
    localStorage.setItem('trek:resume-route', '{nope')
    expect(takeResumeRoute(NOW, true)).toBeNull()
  })

  it('FE-UTIL-RESUME-005: the hook records the route it renders on, and again when the page is hidden', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/journey/9']}>{children}</MemoryRouter>
    renderHook(() => useRememberRoute(), { wrapper })
    expect(JSON.parse(localStorage.getItem('trek:resume-route')!).path).toBe('/journey/9')
    localStorage.clear()
    window.dispatchEvent(new Event('pagehide'))
    expect(JSON.parse(localStorage.getItem('trek:resume-route')!).path).toBe('/journey/9')
  })
  it('FE-UTIL-RESUME-666: the plan day comes back once, for its own trip only', () => {
    rememberRoute('/trips/7', NOW, 55)
    sessionStorage.clear()
    takeResumeRoute(NOW, true)
    expect(takeResumeDay(8)).toBeNull()
    expect(takeResumeDay(7)).toBe(55)
    expect(takeResumeDay(7)).toBeNull()
    rememberRoute('/journey/1', NOW, 55)
    expect(JSON.parse(localStorage.getItem('trek:resume-route')!).day).toBeUndefined()
  })
})
