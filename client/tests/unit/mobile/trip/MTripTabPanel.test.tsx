import { describe, expect, it, vi } from 'vitest'
import MTripTabPanel from '../../../../src/mobile/screens/trip/tabs/MTripTabPanel'
import type { MTabScreenProps } from '../../../../src/mobile/screens/trip/tabs/tabModel'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { render, screen } from '../../../helpers/render'

// FE-MOB-TABPANEL-001 to FE-MOB-TABPANEL-010

/** Each tab is stubbed so the routing itself is what gets asserted. */
function stub(name: string) {
  return function Stub({ planner, shell }: MTabScreenProps) {
    return <div data-testid={name} data-trip={String(planner.tripId)} data-tab={shell.trTab} />
  }
}

vi.mock('../../../../src/mobile/screens/trip/tabs/MTransportsTab', () => ({ default: stub('transports') }))
vi.mock('../../../../src/mobile/screens/trip/tabs/MBookingsTab', () => ({ default: stub('bookings') }))
vi.mock('../../../../src/mobile/screens/trip/tabs/MCostsTab', () => ({ default: stub('costs') }))
vi.mock('../../../../src/mobile/screens/trip/tabs/MFilesTab', () => ({ default: stub('files') }))
vi.mock('../../../../src/mobile/screens/trip/tabs/MCollabTab', () => ({ default: stub('collab') }))
vi.mock('../../../../src/mobile/screens/trip/tabs/MListsTab', () => ({ default: stub('lists') }))
vi.mock('../../../../src/components/Plugins/PluginFrame', () => ({
  default: ({ pluginId, tripId, fill, surface }: { pluginId: string; tripId: string | null; fill?: boolean; surface?: string }) => (
    <div data-testid="plugin-frame" data-plugin={pluginId} data-trip={String(tripId)} data-fill={String(!!fill)} data-surface={surface} />
  ),
}))

function renderTab(tab: string, plannerOverrides = {}) {
  const planner = buildPlanner(plannerOverrides)
  const shell = buildShell({ trTab: tab })
  return { ...render(<MTripTabPanel planner={planner} shell={shell} tab={tab} />), planner, shell }
}

describe('MTripTabPanel', () => {
  it('FE-MOB-TABPANEL-001: routes transports and hands both props down', () => {
    renderTab('transports')
    const panel = screen.getByTestId('transports')
    expect(panel).toHaveAttribute('data-trip', '1')
    expect(panel).toHaveAttribute('data-tab', 'transports')
    expect(screen.queryByTestId('bookings')).not.toBeInTheDocument()
  })

  it('FE-MOB-TABPANEL-002: routes buchungen to the bookings panel', () => {
    renderTab('buchungen')
    expect(screen.getByTestId('bookings')).toBeInTheDocument()
  })

  it('FE-MOB-TABPANEL-003: routes finanzplan to the costs panel', () => {
    renderTab('finanzplan')
    expect(screen.getByTestId('costs')).toBeInTheDocument()
  })

  it('FE-MOB-TABPANEL-004: routes dateien to the files panel', () => {
    renderTab('dateien')
    expect(screen.getByTestId('files')).toBeInTheDocument()
  })

  it('FE-MOB-TABPANEL-005: routes collab to the collab panel', () => {
    renderTab('collab')
    expect(screen.getByTestId('collab')).toBeInTheDocument()
  })

  it('FE-MOB-TABPANEL-006: routes listen to the lists panel', () => {
    renderTab('listen')
    expect(screen.getByTestId('lists')).toBeInTheDocument()
  })

  it('FE-MOB-TABPANEL-007: mounts the sandboxed frame for a plugin tab', () => {
    renderTab('plugin:trip-todos')
    const frame = screen.getByTestId('plugin-frame')
    expect(frame).toHaveAttribute('data-plugin', 'trip-todos')
    expect(frame).toHaveAttribute('data-trip', '1')
    expect(frame).toHaveAttribute('data-fill', 'true')
    // Both clearances come from the variables TabScroller uses, so the frame
    // cannot drift away from the native tabs. The top one was missing entirely,
    // which put the plugin's first row under the floating back button; the bottom
    // one was a hard-coded 84 that ignored the safe area.
    const wrapper = frame.parentElement as HTMLElement
    expect(wrapper.className).toContain('--m-safe-top')
    expect(wrapper.className).toContain('--bottom-nav-h')
  })

  it('FE-MOB-TABPANEL-007b: tells the plugin which surface it is mounted in', () => {
    // A trip tab fills and scrolls itself; a widget reports its height. The plugin
    // cannot see the difference from inside the frame.
    renderTab('plugin:trip-todos')
    expect(screen.getByTestId('plugin-frame')).toHaveAttribute('data-surface', 'trip-tab')
  })

  it('FE-MOB-TABPANEL-008: passes a null tripId to the plugin frame before the trip is known', () => {
    renderTab('plugin:koffi', { tripId: null })
    expect(screen.getByTestId('plugin-frame')).toHaveAttribute('data-trip', 'null')
  })

  it('FE-MOB-TABPANEL-009: keeps a plugin id that itself contains a colon intact', () => {
    renderTab('plugin:acme:maps')
    expect(screen.getByTestId('plugin-frame')).toHaveAttribute('data-plugin', 'acme:maps')
  })

  it('FE-MOB-TABPANEL-010: an unbuilt tab falls back to the empty scroll body', () => {
    const { container } = renderTab('plan')
    expect(container.querySelector('[data-testid]')).toBeNull()
    const body = container.querySelector('.overflow-y-auto') as HTMLElement
    expect(body).not.toBeNull()
    expect(body).toBeEmptyDOMElement()
  })
})
