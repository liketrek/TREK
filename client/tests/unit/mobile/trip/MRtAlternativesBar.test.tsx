import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import MRtAlternativesBar from '../../../../src/mobile/screens/trip/roadtrip/MRtAlternativesBar'
import { RT_ALT_BAR_HEIGHT, useMRtAlternatives } from '../../../../src/mobile/screens/trip/roadtrip/useMRtAlternatives'
import { buildAlternativeOverlays } from '../../../../src/components/Roadtrip/alternativeOverlays'
import type { LegAlternatives, OfferedRoute } from '../../../../src/components/Roadtrip/useRouteAlternatives'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'

// FE-MOB-RTALT-001 to FE-MOB-RTALT-011
//
// Rendered through the real controller hook, so a tap is checked all the way to what the
// planner is asked to do, and the pending state is the transition's own.

/**
 * Three ways of driving one leg: the road already driven, a slower offer, and a road
 * without the motorway that the avoidance router priced.
 */
const ROUTES: OfferedRoute[] = [
  { coordinates: [[35.7, 139.8], [35.4, 138.6], [34.98, 135.75]], distance: 210_000, duration: 9_600, divergence: null, current: true },
  { coordinates: [[35.7, 139.8], [35.9, 138.2], [34.98, 135.75]], distance: 198_000, duration: 10_320, divergence: { lat: 35.9, lng: 138.2 } },
  { coordinates: [[35.7, 139.8], [35.2, 138.9], [34.98, 135.75]], distance: 236_000, duration: 11_400, divergence: { lat: 35.2, lng: 138.9 }, avoids: 'motorway', engine: 'valhalla' },
]

function overlays(routes: OfferedRoute[] = ROUTES) {
  return buildAlternativeOverlays(routes, {
    fastest: 'Fastest', current: 'Current', noMotorway: 'No motorway', noToll: 'No tolls', noFerry: 'No ferry',
  })
}

function planner(open: Partial<LegAlternatives> | null, over: Partial<TripPlanner> = {}): TripPlanner {
  const base = buildPlanner()
  const leg = open ? { dayId: 2, index: 0, routes: ROUTES, loading: false, error: false, ...open } : null
  return buildPlanner({
    selectedDayId: 2,
    routeAlternatives: { ...base.routeAlternatives, open: leg },
    alternativeOverlays: leg ? overlays(leg.routes) : [],
    ...over,
  } as Partial<TripPlanner>)
}

function Harness({ planner: p }: { planner: TripPlanner }) {
  const alts = useMRtAlternatives(p, buildShell({ rtView: 'map' }))
  return <MRtAlternativesBar planner={p} alts={alts} />
}

function renderBar(p: TripPlanner) {
  return { planner: p, ...render(<Harness planner={p} />) }
}

const confirmButton = () => screen.getByRole('button', { name: 'common.confirm' })
const chips = () => screen.queryAllByRole('button', { pressed: false }).concat(screen.queryAllByRole('button', { pressed: true }))

describe('MRtAlternativesBar', () => {
  it('FE-MOB-RTALT-001: while the router is asked it says so, offers nothing and confirms nothing', () => {
    renderBar(planner({ loading: true, routes: [] }))

    const bar = screen.getByRole('region', { name: 'roadtrip.alt.title' })
    expect(within(bar).getByRole('status')).toHaveTextContent('roadtrip.alt.loading')
    expect(chips()).toHaveLength(0)
    expect(confirmButton()).toBeDisabled()
  })

  it('FE-MOB-RTALT-002: a router that did not answer is a failure, never a leg with one way', () => {
    renderBar(planner({ error: true, routes: [] }))

    expect(screen.getByRole('status')).toHaveTextContent('roadtrip.alt.failed')
    expect(screen.queryByText('roadtrip.alt.onlyOne')).toBeNull()
    expect(chips()).toHaveLength(0)
    expect(confirmButton()).toBeDisabled()
  })

  it('FE-MOB-RTALT-003: one road back is the only sensible way, with nothing to pick', () => {
    renderBar(planner({ routes: [ROUTES[0]] }))

    expect(screen.getByRole('status')).toHaveTextContent('roadtrip.alt.onlyOne')
    expect(chips()).toHaveLength(0)
    expect(confirmButton()).toBeDisabled()
  })

  it('FE-MOB-RTALT-004: one chip per road, its drive time first, then its length and what sets it apart', () => {
    const p = planner({})
    renderBar(p)

    const offered = chips()
    expect(offered).toHaveLength(3)
    const [driven, slower, noMotorway] = p.alternativeOverlays

    const second = screen.getByRole('button', { name: `${slower.label}, 198 km, roadtrip.alt.slower:12 min` })
    // The time pill's text leads, because that text is what ties the chip to its line.
    expect(second.textContent).toBe(`${slower.label}198 kmroadtrip.alt.slower:12 min`)
    // The length is a figure in a badge, in its unit's own case.
    const badge = within(second).getByText('198 km')
    expect(badge.className).toContain('rounded-full')
    expect(badge.className).not.toContain('uppercase')
    // The swatch is painted in the very colour the road is drawn in.
    const swatch = second.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(swatch).toHaveStyle({ background: slower.color })

    // Its own note wins over the difference: the road driven, the road without the motorway.
    expect(screen.getByRole('button', { name: `${driven.label}, 210 km, Current` })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: `${noMotorway.label}, 236 km, No motorway` })).toBeInTheDocument()
  })

  it('FE-MOB-RTALT-005: a tap on a chip lights its road and writes nothing', () => {
    const p = planner({})
    renderBar(p)

    fireEvent.click(chips()[1])

    expect(p.setHighlightedAlternative).toHaveBeenCalledWith(1)
    expect(p.chooseRouteAlternative).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTALT-006: confirm waits for a road other than the one driven, then takes it once', async () => {
    const none = renderBar(planner({}))
    expect(confirmButton()).toBeDisabled()
    none.unmount()

    const driven = renderBar(planner({}, { highlightedAlternative: 0 }))
    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(/Current/)
    expect(confirmButton()).toBeDisabled()
    driven.unmount()

    const { planner: p } = renderBar(planner({}, { highlightedAlternative: 1 }))
    expect(confirmButton()).toBeEnabled()
    // Awaited so the write the tap starts has landed before the test ends.
    await act(async () => { fireEvent.click(confirmButton()) })
    expect(p.chooseRouteAlternative).toHaveBeenCalledTimes(1)
    expect(p.chooseRouteAlternative).toHaveBeenCalledWith(1)
  })

  it('FE-MOB-RTALT-007: while the choice is saved nothing can be tapped twice, and it all comes back after', async () => {
    let land: () => void = () => {}
    const p = planner({}, {
      highlightedAlternative: 1,
      chooseRouteAlternative: vi.fn(() => new Promise<void>(resolve => { land = resolve })),
    })
    renderBar(p)

    fireEvent.click(confirmButton())

    const busy = confirmButton()
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(busy.querySelector('.animate-spin')).not.toBeNull()
    // Still filled: the button is busy with the choice, not unavailable.
    expect(busy.className).not.toContain('disabled:bg-')
    for (const chip of chips()) expect(chip).toBeDisabled()
    fireEvent.click(busy)
    expect(p.chooseRouteAlternative).toHaveBeenCalledTimes(1)

    await act(async () => { land() })

    expect(confirmButton()).toBeEnabled()
    expect(confirmButton().querySelector('.animate-spin')).toBeNull()
    for (const chip of chips()) expect(chip).toBeEnabled()
  })

  it('FE-MOB-RTALT-008: the close button closes the picker', () => {
    const p = planner({})
    renderBar(p)

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))

    expect(p.routeAlternatives.close).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTALT-009: a road timed by the other router says so beside the button, and only then', () => {
    const other = renderBar(planner({}, { highlightedAlternative: 2 }))
    const note = screen.getByText('roadtrip.alt.otherEngine')
    expect(note.className).toContain('line-clamp-2')
    // Beside the button it qualifies, which gives up its full width for the sentence.
    expect(note.parentElement).toBe(confirmButton().parentElement)
    expect(confirmButton().className).toContain('flex-none')
    other.unmount()

    renderBar(planner({}, { highlightedAlternative: 1 }))
    expect(screen.queryByText('roadtrip.alt.otherEngine')).toBeNull()
    expect(confirmButton().className).toContain('flex-1')
  })

  it('FE-MOB-RTALT-010: offline a valid pick still cannot be confirmed', () => {
    const base = buildPlanner()
    renderBar(planner({}, { highlightedAlternative: 1, roadtripVias: { ...base.roadtripVias, editable: false } }))

    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  it('FE-MOB-RTALT-011: the bar stands at the height the map lifts by, and says nothing once closed', () => {
    const open = renderBar(planner({}))
    const bar = screen.getByRole('region', { name: 'roadtrip.alt.title' })
    expect(bar).toHaveStyle({ height: `${RT_ALT_BAR_HEIGHT}px` })
    // A fixed height cannot take a second line, so the title truncates rather than wraps.
    expect(within(bar).getByText('roadtrip.alt.title').className).toContain('truncate')
    open.unmount()

    // The render the picker closes in: no leg, so no sentence about one.
    renderBar(planner(null))
    expect(screen.queryByRole('status')).toBeNull()
    expect(chips()).toHaveLength(0)
  })
})
