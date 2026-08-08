import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './store/authStore'
import { useAddonStore } from './store/addonStore'
import { resetAllStores } from '../tests/helpers/store'
import { buildUser } from '../tests/helpers/factories'
import App from './App'

/**
 * The viewport decides which chunk gets fetched, so the switch lives in App.tsx
 * and no longer in the pages. This is that contract, for all ten routes in one
 * place — it used to be five scattered spot checks, one per page test.
 *
 * A stub per screen keeps the test about one thing: below the breakpoint the M
 * root hangs off the route, and the desktop page is never rendered at all.
 */

const isPhone = vi.hoisted(() => ({ value: false }))
vi.mock('./mobile/useIsPhone', () => ({ useIsPhone: () => isPhone.value }))

vi.mock('./mobile/screens/dashboard/MDashboard', () => ({ default: () => <div>m-dashboard</div> }))
vi.mock('./mobile/screens/trip/MTripShell', () => ({ default: () => <div>m-trip</div> }))
vi.mock('./mobile/screens/admin/MAdmin', () => ({ default: () => <div>m-admin</div> }))
vi.mock('./mobile/screens/settings/MSettings', () => ({ default: () => <div>m-settings</div> }))
vi.mock('./mobile/screens/vacay/MVacay', () => ({ default: () => <div>m-vacay</div> }))
vi.mock('./mobile/screens/atlas/MAtlas', () => ({ default: () => <div>m-atlas</div> }))
vi.mock('./mobile/screens/journey/MJourney', () => ({ default: () => <div>m-journey</div> }))
vi.mock('./mobile/screens/journey/MJourneyDetail', () => ({ default: () => <div>m-journey-detail</div> }))
vi.mock('./mobile/screens/collections/MCollections', () => ({ default: () => <div>m-collections</div> }))
vi.mock('./mobile/screens/notifications/MNotifications', () => ({ default: () => <div>m-notifications</div> }))

vi.mock('./pages/DashboardPage', () => ({ default: () => <div>d-dashboard</div> }))
vi.mock('./pages/TripPlannerPage', () => ({ default: () => <div>d-trip</div> }))
vi.mock('./pages/AdminPage', () => ({ default: () => <div>d-admin</div> }))
vi.mock('./pages/SettingsPage', () => ({ default: () => <div>d-settings</div> }))
vi.mock('./pages/VacayPage', () => ({ default: () => <div>d-vacay</div> }))
vi.mock('./pages/AtlasPage', () => ({ default: () => <div>d-atlas</div> }))
vi.mock('./pages/JourneyPage', () => ({ default: () => <div>d-journey</div> }))
vi.mock('./pages/JourneyDetailPage', () => ({ default: () => <div>d-journey-detail</div> }))
vi.mock('./pages/CollectionsPage', () => ({ default: () => <div>d-collections</div> }))
vi.mock('./pages/InAppNotificationsPage.tsx', () => ({ default: () => <div>d-notifications</div> }))

// The notification listener opens a WebSocket on mount.
vi.mock('./hooks/useInAppNotificationListener.ts', () => ({
  useInAppNotificationListener: vi.fn(),
}))

/** path, mobile marker, desktop marker */
const ROUTES: [string, string, string][] = [
  ['/dashboard', 'm-dashboard', 'd-dashboard'],
  ['/trips/1', 'm-trip', 'd-trip'],
  ['/admin', 'm-admin', 'd-admin'],
  ['/settings', 'm-settings', 'd-settings'],
  ['/vacay', 'm-vacay', 'd-vacay'],
  ['/atlas', 'm-atlas', 'd-atlas'],
  ['/journey', 'm-journey', 'd-journey'],
  ['/journey/1', 'm-journey-detail', 'd-journey-detail'],
  ['/collections', 'm-collections', 'd-collections'],
  ['/collections/1', 'm-collections', 'd-collections'],
  ['/notifications', 'm-notifications', 'd-notifications'],
]

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  isPhone.value = false
  // An admin passes the role check on /admin; every other route ignores it.
  useAuthStore.setState({
    isLoading: false,
    isAuthenticated: true,
    user: buildUser({ role: 'admin', mfa_enabled: true }),
    appRequireMfa: false,
    loadUser: vi.fn().mockResolvedValue(undefined),
  })
  // /journey and /collections sit behind addons; without this they redirect to
  // the dashboard and the route under test never renders.
  useAddonStore.setState({ loaded: true, isEnabled: () => true })
})

describe('App — viewport routing', () => {
  it.each(ROUTES)(
    'FE-COMP-APPVP-001: %s renders the mobile screen below the breakpoint',
    async (path, mobile, desktop) => {
      isPhone.value = true
      renderAt(path)

      expect(await screen.findByText(mobile)).toBeInTheDocument()
      expect(screen.queryByText(desktop)).not.toBeInTheDocument()
    }
  )

  it.each(ROUTES)(
    'FE-COMP-APPVP-002: %s renders the desktop page above the breakpoint',
    async (path, mobile, desktop) => {
      renderAt(path)

      expect(await screen.findByText(desktop)).toBeInTheDocument()
      expect(screen.queryByText(mobile)).not.toBeInTheDocument()
    }
  )
})
