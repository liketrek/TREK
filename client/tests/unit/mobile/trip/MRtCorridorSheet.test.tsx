import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import MRtCorridorSheet from '../../../../src/mobile/screens/trip/roadtrip/MRtCorridorSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { MRtCorridorController } from '../../../../src/mobile/screens/trip/roadtrip/useMRtCorridor'
import type { CorridorPoi } from '../../../../src/components/Roadtrip/useCorridorPois'

// FE-MOB-RTSRCH-001 to FE-MOB-RTSRCH-015

// The controller is exercised on its own in useMRtCorridor.test; here the sheet is
// the unit, so what it reads is handed to it rather than derived from a planner.
const mocks = vi.hoisted(() => ({ corridor: {} as MRtCorridorController }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/useMRtCorridor', () => ({
  useMRtCorridor: () => mocks.corridor,
}))

const hit = (over: Partial<CorridorPoi> = {}): CorridorPoi => ({
  osm_id: 'n1', name: 'Shell Ebina', lat: 35.44, lng: 139.39,
  category: 'fuel', poi_type: 'amenity=fuel',
  address: null, website: null, phone: null, opening_hours: null, cuisine: null,
  source: 'openstreetmap', offRouteKm: 0.4, alongKm: 82,
  ...over,
} as unknown as CorridorPoi)

function corridor(over: Partial<MRtCorridorController> = {}): MRtCorridorController {
  return {
    categories: ['fuel'], toggleCategory: vi.fn(),
    reach: 'ahead', setReach: vi.fn(), reachKm: 50, anchored: false,
    run: vi.fn(), clear: vi.fn(), canSearch: true,
    loading: false, progress: { done: 0, total: 0 }, hits: [], answered: false,
    offline: false, error: false, capped: false, failedAreas: 0, truncatedAreas: 0,
    ...over,
  }
}

function renderSheet(
  over: Partial<MRtCorridorController> = {},
  p: Partial<TripPlanner> = {},
  shellOver: Partial<MTripShellApi> = {},
) {
  mocks.corridor = corridor(over)
  const planner = buildPlanner({ can: () => true, ...p } as Partial<TripPlanner>)
  const shell = buildShell({ sheet: { id: 'rtsearch' }, ...shellOver })
  const view = render(<MRtCorridorSheet planner={planner} shell={shell} />)
  return { ...view, planner, shell, corridor: mocks.corridor }
}

beforeEach(() => { mocks.corridor = corridor() })

describe('MRtCorridorSheet', () => {
  it('FE-MOB-RTSRCH-001: offers every corridor category, with the active ones pressed', () => {
    renderSheet({ categories: ['fuel', 'charging'] })

    // Several at once, not one at a time: the kinds ride one query per box, so a
    // second category is free and a picker that forces one is three searches.
    expect(screen.getByText('roadtrip.poi.fuel')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.charging')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.rest')).toBeInTheDocument()
    expect(screen.getByText('poi.cat.hotels')).toBeInTheDocument()
  })

  it('FE-MOB-RTSRCH-002: tapping a category toggles it', () => {
    const { corridor: c } = renderSheet()

    fireEvent.click(screen.getByText('roadtrip.poi.charging'))
    expect(c.toggleCategory).toHaveBeenCalledWith('charging')
  })

  it('FE-MOB-RTSRCH-003: the two reaches are the whole of the narrowing', () => {
    renderSheet()

    expect(screen.getByText('mobileTrip.rtReach')).toBeInTheDocument()
    expect(screen.getByText('mobileTrip.rtReachAhead:50 km')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.wholeDay')).toBeInTheDocument()
    // No corridor width, no section, no plug type, no minimum power: four ways of
    // narrowing an answer already on screen are a desk activity.
    expect(screen.queryByText('roadtrip.poi.within')).toBeNull()
    expect(screen.queryByText('roadtrip.poi.anySocket')).toBeNull()
  })

  it('FE-MOB-RTSRCH-004: picking a reach goes through the controller', () => {
    const { corridor: c } = renderSheet()

    fireEvent.click(screen.getByText('roadtrip.poi.wholeDay'))
    expect(c.setReach).toHaveBeenCalledWith('stage')
  })

  it('FE-MOB-RTSRCH-005: says where "ahead" starts, because that is what it means', () => {
    const fromStart = renderSheet()
    expect(screen.getByText('mobileTrip.rtFromStart')).toBeInTheDocument()
    fromStart.unmount()

    renderSheet({ anchored: true })
    expect(screen.getByText('mobileTrip.rtFromNext')).toBeInTheDocument()
  })

  it('FE-MOB-RTSRCH-006: the search button asks, and counts the boxes while it runs', () => {
    const idle = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: /roadtrip.poi.search/ }))
    expect(idle.corridor.run).toHaveBeenCalledTimes(1)
    idle.unmount()

    renderSheet({ loading: true, progress: { done: 1, total: 3 } })
    expect(screen.getByRole('button', { name: /roadtrip.poi.searching:1,3/ })).toBeDisabled()
  })

  it('FE-MOB-RTSRCH-007: a search nothing can answer is a dead button, so it is disabled', () => {
    renderSheet({ canSearch: false, categories: [] })

    expect(screen.getByRole('button', { name: /roadtrip.poi.search/ })).toBeDisabled()
    expect(screen.getByText('roadtrip.poi.empty')).toBeInTheDocument()
  })

  it('FE-MOB-RTSRCH-008: offline it says so rather than counting an empty answer', () => {
    renderSheet({ offline: true, canSearch: false, answered: true })

    expect(screen.getByText('mobileTrip.rtSearchOffline')).toBeInTheDocument()
    expect(screen.queryByText('mobileTrip.rtNoneAhead')).toBeNull()
  })

  it('FE-MOB-RTSRCH-009: a failed search is not an empty stretch of road', () => {
    renderSheet({ error: true, answered: true })

    expect(screen.getByText('roadtrip.poi.failed')).toBeInTheDocument()
    expect(screen.queryByText('mobileTrip.rtNoneAhead')).toBeNull()
  })

  it('FE-MOB-RTSRCH-010: nothing ahead points at the second tap; nothing on the stage does not', () => {
    const ahead = renderSheet({ answered: true, hits: [] })
    expect(screen.getByText('mobileTrip.rtNoneAhead')).toBeInTheDocument()
    ahead.unmount()

    renderSheet({ answered: true, hits: [], reach: 'stage' })
    expect(screen.getByText('mobileTrip.rtNoneOnStage')).toBeInTheDocument()
  })

  it('FE-MOB-RTSRCH-011: says what the search could not cover, so a short list is not read as a complete one', () => {
    renderSheet({ answered: true, hits: [hit()], capped: true, failedAreas: 2, truncatedAreas: 1 })

    expect(screen.getByText('roadtrip.poi.capped')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.partial:2')).toBeInTheDocument()
    // The phone's own wording: the desk's ends in "narrow the corridor", and the
    // corridor width is a control this screen does not have. One stretch takes the
    // singular key, because one key with {count} in it would read as "1 stretches".
    expect(screen.getByText('mobileTrip.rtTruncated.one:1')).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.poi.truncated:1')).toBeNull()
  })

  it('FE-MOB-RTSRCH-011b: more than one truncated stretch takes the plural key', () => {
    renderSheet({ answered: true, hits: [hit()], truncatedAreas: 3 })

    expect(screen.getByText('mobileTrip.rtTruncated.other:3')).toBeInTheDocument()
  })

  it('FE-MOB-RTSRCH-012: a hit says what it is and where on the drive it sits', () => {
    renderSheet({ answered: true, hits: [hit()] })

    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.alongRoute:82 km · roadtrip.poi.offRoute:400 m')).toBeInTheDocument()
  })

  it('FE-MOB-RTSRCH-013: tapping a hit shows it on the map, which means closing and switching', () => {
    const { planner, shell } = renderSheet({ answered: true, hits: [hit()] })

    fireEvent.click(screen.getByText('Shell Ebina'))

    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.focusRoadtripPoint).toHaveBeenCalledWith(35.44, 139.39)
    expect(shell.toggleRtView).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTSRCH-014: adding a hit goes through the road trip door, and never without permission', () => {
    const allowed = renderSheet({ answered: true, hits: [hit()] })
    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.poi.add' }))
    // The planner's own handler: it reads the distance the hit carries and sends it to
    // the draft sheet with the stop kind and the position in the chain worked out.
    expect(allowed.planner.handlePoiClick).toHaveBeenCalledWith(expect.objectContaining({ osm_id: 'n1' }))
    expect(allowed.shell.closeSheet).toHaveBeenCalledTimes(1)
    allowed.unmount()

    renderSheet({ answered: true, hits: [hit()] }, { can: () => false })
    expect(screen.queryByRole('button', { name: 'roadtrip.poi.add' })).toBeNull()
  })
  it('FE-MOB-RTSRCH-015: a very long answer stops at sixty rows and says how many there were', () => {
    const many = Array.from({ length: 84 }, (_, i) => hit({ osm_id: `n${i}`, name: `Stop ${i}` }))
    renderSheet({ answered: true, hits: many })

    expect(screen.getByText('Stop 59')).toBeInTheDocument()
    expect(screen.queryByText('Stop 60')).toBeNull()
    // Silently cutting the list would read as the whole answer; the rest are pins on
    // the map behind this sheet.
    expect(screen.getByText('roadtrip.poi.foundFiltered:60,84')).toBeInTheDocument()
  })
})
