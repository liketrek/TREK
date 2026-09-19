import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../helpers/render'
import { buildPlanner } from '../../../helpers/mobileTrip'
import MRtCorridorBar from '../../../../src/mobile/screens/trip/roadtrip/MRtCorridorBar'
import type { MRtCorridorController } from '../../../../src/mobile/screens/trip/roadtrip/useMRtCorridor'
import type { CorridorPoi } from '../../../../src/components/Roadtrip/useCorridorPois'

// FE-MOB-RTBAR-001 to FE-MOB-RTBAR-009

const hits = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ osm_id: `h${i}` })) as unknown as CorridorPoi[]

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

function renderBar(over: Partial<MRtCorridorController> = {}) {
  const c = corridor(over)
  const onOpen = vi.fn()
  const view = render(<MRtCorridorBar planner={buildPlanner()} corridor={c} onOpen={onOpen} />)
  return { ...view, corridor: c, onOpen }
}

describe('MRtCorridorBar', () => {
  it('FE-MOB-RTBAR-001: idle it names the question and how far the next search reaches', () => {
    renderBar()

    expect(screen.getByText('roadtrip.poi.title')).toBeInTheDocument()
    expect(screen.getByText('mobileTrip.rtReachAhead:50 km')).toBeInTheDocument()
  })

  it('FE-MOB-RTBAR-002: a whole-stage search says so instead of quoting a distance', () => {
    renderBar({ reach: 'stage' })

    expect(screen.getByText('roadtrip.poi.wholeDay')).toBeInTheDocument()
    expect(screen.queryByText('mobileTrip.rtReachAhead:50 km')).toBeNull()
  })

  it('FE-MOB-RTBAR-003: idle there is nothing to clear, so no second button', () => {
    renderBar()

    // The bar is one target until there is an answer or a run to stop. A permanently
    // present X would be a control that does nothing most of the time.
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('FE-MOB-RTBAR-004: running it counts the boxes and offers to stop', () => {
    const { corridor: c } = renderBar({ loading: true, progress: { done: 2, total: 5 } })

    expect(screen.getByText('roadtrip.poi.searching:2,5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(c.clear).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTBAR-005: answered it counts what is on the way and offers to drop it', () => {
    const { corridor: c } = renderBar({ answered: true, hits: hits(7) })

    expect(screen.getByText('roadtrip.poi.found:7')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.poi.clearResults' }))
    expect(c.clear).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTBAR-006: an answer of none still counts, rather than looking unasked', () => {
    renderBar({ answered: true, hits: [] })

    expect(screen.getByText('roadtrip.poi.found:0')).toBeInTheDocument()
  })

  it('FE-MOB-RTBAR-007: offline it says why instead of pretending it can search', () => {
    renderBar({ offline: true, canSearch: false })

    expect(screen.getByText('mobileTrip.rtSearchOffline')).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.poi.title')).toBeNull()
  })

  it('FE-MOB-RTBAR-008: the bar itself opens the sheet', () => {
    const { onOpen } = renderBar()

    fireEvent.click(screen.getByText('roadtrip.poi.title'))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
  it('FE-MOB-RTBAR-009: a failed search is not a count of nothing', () => {
    renderBar({ answered: true, error: true, hits: [] })

    expect(screen.getByText('roadtrip.poi.failed')).toBeInTheDocument()
    // "0 on the way" after a search that never checked reads as an empty stretch of road.
    expect(screen.queryByText('roadtrip.poi.found:0')).toBeNull()
  })
})
