import { beforeEach, describe, expect, it, vi } from 'vitest'
import MRtDraftSheet from '../../../../src/mobile/screens/trip/roadtrip/MRtDraftSheet'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { RoadtripStopDraft } from '../../../../src/components/Roadtrip/RoadtripStopPopup'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-RTDRAFT-001 to FE-MOB-RTDRAFT-015
//
// The sheet takes its copy from `planner.t`, which the fixture echoes, so the
// assertions are on keys rather than on the English wording. Durations come out
// of formatDurationShort and are real text.

function draftOf(category: string, over: Partial<RoadtripStopDraft> = {}): RoadtripStopDraft {
  return {
    poi: {
      osm_id: `node/${category}`,
      name: 'Aral Dammtor',
      lat: 53.5,
      lng: 9.9,
      category,
      poi_type: category,
      address: 'B4, Hamburg',
      website: null,
      phone: null,
      opening_hours: null,
      cuisine: null,
      offRouteKm: 0.2,
      alongKm: 43,
    },
    dayId: 11,
    dayNumber: 1,
    position: 2,
    ...over,
  } as RoadtripStopDraft
}

function renderSheet(overrides: Record<string, unknown> = {}) {
  const planner = buildPlanner({
    stopDraft: draftOf('fuel'),
    setStopDraft: vi.fn(),
    saveStopDraft: vi.fn(async () => undefined),
    stopDraftDuplicate: null,
    ...overrides,
  } as unknown as Partial<TripPlanner>)
  render(<MRtDraftSheet planner={planner} />)
  return { planner }
}

const kind = (key: string) => screen.getByRole('button', { name: `roadtrip.poi.${key}` })
const dwell = (label: string) => screen.getByRole('button', { name: label })
const isActive = (el: HTMLElement) => el.classList.contains('bg-m-act')

describe('MRtDraftSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-RTDRAFT-001: renders nothing while no draft is in play', () => {
    renderSheet({ stopDraft: null })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-002: opens as soon as the planner carries a draft, whoever set it', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Aral Dammtor' })).toBeInTheDocument()
    expect(screen.getByText('B4, Hamburg')).toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-003: says which day and which position the stop lands on, counted from one', () => {
    renderSheet()
    expect(screen.getByText('roadtrip.stop.landsOn:1,3')).toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-004: preselects the kind from the hit and the stay from that kind', () => {
    renderSheet()
    expect(isActive(kind('fuel'))).toBe(true)
    expect(isActive(dwell('10 min'))).toBe(true)
  })

  it('FE-MOB-RTDRAFT-005: a charging hit is a charge, not a fuel stop, and takes its own half hour', () => {
    renderSheet({ stopDraft: draftOf('charging') })
    expect(isActive(kind('charging'))).toBe(true)
    expect(isActive(dwell('30 min'))).toBe(true)
  })

  it('FE-MOB-RTDRAFT-006: an unknown category leaves the kind open and falls back to 30 minutes', () => {
    renderSheet({ stopDraft: draftOf('pharmacy') })
    for (const key of ['fuel', 'charging', 'rest', 'food', 'sights']) {
      expect(isActive(kind(key))).toBe(false)
    }
    expect(isActive(dwell('30 min'))).toBe(true)
  })

  it('FE-MOB-RTDRAFT-007: changing the kind pulls its usual length along', () => {
    renderSheet()
    fireEvent.click(kind('rest'))
    expect(isActive(kind('rest'))).toBe(true)
    expect(isActive(dwell('20 min'))).toBe(true)
    expect(isActive(dwell('10 min'))).toBe(false)
  })

  it('FE-MOB-RTDRAFT-008: tapping the kind already chosen leaves a hand-set length standing', () => {
    renderSheet()
    fireEvent.click(kind('charging'))
    expect(isActive(dwell('30 min'))).toBe(true)
    fireEvent.click(dwell('45 min'))
    fireEvent.click(kind('charging'))
    expect(isActive(dwell('45 min'))).toBe(true)
    expect(isActive(dwell('30 min'))).toBe(false)
  })

  it('FE-MOB-RTDRAFT-009: saving hands the kind and the length to the planner', async () => {
    const { planner } = renderSheet()
    fireEvent.click(kind('charging'))
    fireEvent.click(dwell('45 min'))
    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.poi.add' }))
    await waitFor(() => expect(planner.saveStopDraft).toHaveBeenCalledWith({ stopType: 'charging', dwellMinutes: 45 }))
  })

  it('FE-MOB-RTDRAFT-010: an edit answers with what the stop already says, and saves rather than adds', async () => {
    const { planner } = renderSheet({
      stopDraft: draftOf('fuel', { editing: { placeId: 908, dwellMinutes: 20, stopType: 'rest_area' } }),
    })
    expect(isActive(kind('rest'))).toBe(true)
    expect(isActive(dwell('20 min'))).toBe(true)
    expect(screen.queryByRole('button', { name: 'roadtrip.poi.add' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))
    await waitFor(() => expect(planner.saveStopDraft).toHaveBeenCalledWith({ stopType: 'rest_area', dwellMinutes: 20 }))
  })

  it('FE-MOB-RTDRAFT-011: warns about a stop this trip already has', () => {
    renderSheet({ stopDraftDuplicate: 'Aral A1' })
    expect(screen.getByText('roadtrip.stop.duplicate:Aral A1')).toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-012: a hotel is a night, so it points at the desktop and offers no save', () => {
    renderSheet({ stopDraft: draftOf('hotel') })
    expect(screen.getByText('mobileTrip.rtNightDesktopOnly')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.poi.add' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.save' })).not.toBeInTheDocument()
    // Only the way out and the way to drop it.
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'common.close' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.discard' })).toBeInTheDocument()
    // Neither question is asked, because neither answer could be written.
    expect(screen.queryByText('roadtrip.stop.kind')).not.toBeInTheDocument()
    expect(screen.queryByText('roadtrip.stop.stay')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-013: a campsite is treated the same way, because a night can be booked there too', () => {
    renderSheet({ stopDraft: draftOf('campsite') })
    expect(screen.getByText('mobileTrip.rtNightDesktopOnly')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.poi.add' })).not.toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-014: a draft that already carries an overnight offer is night-only whatever its category', () => {
    renderSheet({
      stopDraft: draftOf('fuel', { overnight: { days: [{ id: 11, number: 1, date: '2026-05-01' }], defaultEndDayId: 12 } }),
    })
    expect(screen.getByText('mobileTrip.rtNightDesktopOnly')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.poi.add' })).not.toBeInTheDocument()
  })

  it('FE-MOB-RTDRAFT-015: discarding clears the draft and writes nothing', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'common.discard' }))
    expect(planner.setStopDraft).toHaveBeenCalledWith(null)
    expect(planner.saveStopDraft).not.toHaveBeenCalled()
  })
})
