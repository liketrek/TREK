import { act, useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '../../../../tests/helpers/render';
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { resetAllStores, seedStore } from '../../../../tests/helpers/store'
import { useSettingsStore } from '../../../store/settingsStore'
import { analyzeRouteGeometry } from '../../../utils/routeGeometry'
import type { TourPlannerController } from './useTourPlanner'
import type { PaddleChecklist } from '../paddle/usePaddleChecklist'
import type { Day } from '../../../types'
import { toggleTourPlacing } from '../../../store/tourPlaceToolStore'
import { publishTourFerrataCrossings } from '../../../store/tourFerrataCrossingStore'
import { TourPlannerRail, TourPlannerToursRail } from './TourPlannerPanels'
import { hikePlannerDefaults } from '../../../../tests/helpers/tourPlannerStub'
import { tourRepo } from '../../../repo/tourRepo'
import { useTripStore } from '../../../store/tripStore'
import type { TourStage } from '../stages/tourStages'

vi.mock('../../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in client tests') })
vi.mock('../../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in client tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in client tests') })
// The checklist card is its own suite's; here it only has to sit where the rails put it.
// The stops of a tour's stages are named by a reverse lookup; here they go without names.
vi.mock('./useWaypointPlaceNames', () => ({ useWaypointPlaceNames: () => ({}) }))
vi.mock('../paddle/PaddleCheckCard', () => ({
  PaddleCheckCard: ({ checklist }: { checklist: PaddleChecklist }) => (
    <div data-testid="paddle-check-card" data-status={checklist.status} />
  ),
}))

// MAP-03 and MAP-04: the hike's ways card is its own suite's; here it only has to sit where the rails put it, with what they hand it.
vi.mock('../hike/HikeWaysCard', () => ({
  HikeWaysCard: ({ route, routeCurrent, routingLimit }: { route: [number, number][] | null; routeCurrent?: boolean; routingLimit: number | null }) => (
    <div data-testid="hike-ways-card" data-route={route ? route.length : 'none'} data-current={String(routeCurrent ?? true)}
      data-limit={String(routingLimit)} />
  ),
}))

const tour: TourListItem = {
  place_id: 42,
  name: 'Saved ridge walk',
  tour_type: 'hike',
  distance: 4,
  elevation_gain: 100,
  elevation_loss: 80,
  duration: 60,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

const days = [{ id: 7, title: 'Summit day', date: '2026-05-15' } as Day]
const railProps = {
  days,
  loading: false,
  onAssignToDay: vi.fn(),
  onViewGpxTour: vi.fn(),
}

const routeAnalysis = analyzeRouteGeometry(JSON.stringify([[48, 11, 500], [48.036, 11, 550]]))

function planner(overrides: Partial<TourPlannerController> = {}): TourPlannerController {
  const state = {
    ...hikePlannerDefaults(),
    canEdit: true,
    canAssign: true,
    isSaving: false,
    maxHikingDifficulty: 2,
    setMaxHikingDifficulty: vi.fn(),
    name: '',
    description: '',
    setDescription: vi.fn(),
    website: '',
    setWebsite: vi.fn(),
    websiteInvalid: false,
    plannedDurationMinutes: null,
    setPlannedDurationMinutes: vi.fn(),
    plannedDurationInvalid: false,
    breakAdditionalMinutes: null,
    setBreakAdditionalMinutes: vi.fn(),
    breakAdditionalInvalid: false,
    walkingDurationMinutes: null,
    plannedTotalMinutes: null,
    plannedTotalInvalid: false,
    startNewTour: vi.fn(),
    newTourConfirmationOpen: false,
    cancelNewTour: vi.fn(),
    elevationProfileExpanded: true,
    toggleElevationProfile: vi.fn(),
    routeProfileFocus: null,
    setRouteProfileFocus: vi.fn(),
    draftRestored: false,
    returnToNeutral: vi.fn(),
    waypoints: [],
    route: [[48, 11], [48.01, 11.02]],
    routeAnalysis,
    distanceMeters: 4000,
    durationSeconds: 3600,
    editingPlaceId: null,
    openingTourId: null,
    openTour: vi.fn().mockResolvedValue(true),
    reorderWaypoint: vi.fn(),
    moveWaypoint: vi.fn(),
    removeWaypoint: vi.fn(),
    saveOutcome: null,
    hasUnsavedChanges: false,
    discard: vi.fn(),
    readOnlyGpxTour: null,
    readOnlyGpxAnalysis: null,
    closeGpxTour: vi.fn(),
    ...overrides,
  }
  const mode = overrides.mode ?? (state.readOnlyGpxTour
    ? { type: 'view-gpx' as const, placeId: state.readOnlyGpxTour.tour.place_id, tour: state.readOnlyGpxTour.tour }
    : state.editingPlaceId != null
      ? { type: 'edit-saved' as const, placeId: state.editingPlaceId }
      : state.hasUnsavedChanges || state.waypoints.length > 0 || state.name !== '' || state.status !== undefined && state.status !== 'empty'
      ? { type: 'new-draft' as const }
      : { type: 'neutral' as const })
  return {
    ...state,
    mode,
  } as unknown as TourPlannerController
}

beforeEach(() => {
  resetAllStores()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

describe('TourPlannerToursRail', () => {
  it('MDT-02: a multi-day tour unfolds its stages in the list, a day tour has nothing to unfold', async () => {
    vi.spyOn(tourRepo, 'detail').mockResolvedValue({ tour, waypoints: [] })
    const hutToHut = { ...tour, place_id: 43, name: 'Hut to hut', stage_count: 2 }
    render(<TourPlannerToursRail planner={planner({ mode: { type: 'new-draft' } })} tours={[tour, hutToHut]} {...railProps} />)
    expect(screen.getAllByRole('button', { name: 'Show stages' })).toHaveLength(1)
    // The count sits on the fold button, always in sight, never in the row's line of badges.
    const unfold = screen.getByRole('button', { name: 'Show stages' })
    expect(unfold).toHaveAccessibleDescription('2 stages')
    expect(within(unfold).getByTestId('tour-stages-count')).toHaveTextContent('2')
    const row = screen.getByRole('option', { name: /Hut to hut/ })
    expect(within(within(row).getByTestId('tour-metrics')).queryByText(/stages/)).toBeNull()
    expect(screen.queryByTestId('tour-stage-overview')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Show stages' }))
    expect(screen.getByTestId('tour-stage-overview')).toHaveAttribute('id', 'tour-stages-43')
    expect(screen.getByRole('button', { name: 'Hide stages' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('TOUR-PLANNER-RAIL-023: MDT-02 a stage asked for while the changes are kept is let go, and shown once they are discarded', async () => {
    seedStore(useTripStore, { trip: { id: 9 } as never })
    const hutToHut = { ...tour, place_id: 43, name: 'Hut to hut', stage_count: 2, revision: 1 }
    vi.spyOn(tourRepo, 'detail').mockResolvedValue({
      tour: hutToHut,
      waypoints: [
        { lat: 47, lng: 11, role: 'start', sequence: 0, key: 'stop-start' },
        { lat: 47.01, lng: 11, role: 'via', sequence: 1, key: 'stop-hut', stage_end: true },
        { lat: 47.03, lng: 11, role: 'end', sequence: 2, key: 'stop-end' },
      ],
    })
    const stage = (number: number, fromId: string, toId: string): TourStage => ({
      number, from: number - 1, to: number, fromId, toId,
      distanceKm: null, gain: null, loss: null, minutes: null, fromM: null, toM: null, overDay: false,
    })
    // The hut tour as the planner holds it once opened: its points in, its two stages cut from them.
    const openedHut = () => planner({
      mode: { type: 'edit-saved', placeId: 43 },
      editingPlaceId: 43,
      route: null,
      waypoints: [
        { id: 'p1', lat: 47, lng: 11, role: 'start', key: 'stop-start' },
        { id: 'p2', lat: 47.01, lng: 11, role: 'via', key: 'stop-hut', stageEnd: true },
        { id: 'p3', lat: 47.03, lng: 11, role: 'end', key: 'stop-end' },
      ],
      stages: { ...hikePlannerDefaults().stages, multiDay: true, endCount: 1, stages: [stage(1, 'p1', 'p2'), stage(2, 'p2', 'p3')] },
      setSelectedWaypointId: vi.fn(),
      setRouteProfileFocus: vi.fn(),
    } as Partial<TourPlannerController>)
    const dirty = planner({ mode: { type: 'edit-saved', placeId: 42 }, editingPlaceId: 42, hasUnsavedChanges: true })
    const rail = (controller: TourPlannerController) => <TourPlannerToursRail planner={controller} tours={[tour, hutToHut]} {...railProps} />
    const view = render(rail(dirty))
    await userEvent.click(screen.getByRole('button', { name: 'Show stages' }))
    const openSecondStage = async () => {
      const items = await screen.findAllByTestId('tour-stage-item')
      await userEvent.click(within(items[1]).getByTestId('tour-stage-open'))
    }

    await openSecondStage()
    expect(screen.getByRole('heading', { name: 'Discard unsaved tour changes?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(dirty.openTour).not.toHaveBeenCalled()
    // The hut tour opened later from its row shows no stage nobody asked for then.
    const kept = openedHut()
    view.rerender(rail(kept))
    expect(kept.setSelectedWaypointId).not.toHaveBeenCalled()

    view.rerender(rail(dirty))
    await openSecondStage()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(dirty.openTour).toHaveBeenCalledWith(hutToHut)
    const discarded = openedHut()
    view.rerender(rail(discarded))
    expect(discarded.setSelectedWaypointId).toHaveBeenCalledWith('p3')
  })

  it('RS-02: keeps calculated Walking time visible in the right Tour metrics rail', () => {
    render(<TourPlannerToursRail planner={planner({
      mode: { type: 'new-draft' }, durationSeconds: 4800,
      walkingDurationMinutes: 80, breakAdditionalMinutes: 50, plannedTotalMinutes: 130,
    })} tours={[tour]} {...railProps} />)

    expect(screen.getByText(/^(Estimated walking time|Est. walking time)$/)).toBeInTheDocument()
    expect(screen.getByText('1 h 20 min')).toBeInTheDocument()
  })

  it('CW-02: shows a walk its walking time, its stays and their total, a total entered by hand beside the computed one', () => {
    const walk = {
      mode: { type: 'new-draft' as const }, tourType: 'walk' as const,
      walkingDurationMinutes: 45, plannedTotalMinutes: 135,
      stationStays: { walkingMinutes: 45, stayMinutes: 90, unknownStays: 1, stations: 3, totalMinutes: 135, partial: true },
    }
    const facts = () => screen.getAllByRole('definition').map(value => [value.previousElementSibling?.textContent, value.textContent])
    const view = render(<TourPlannerToursRail planner={planner(walk)} tours={[tour]} {...railProps} />)
    expect(facts()).toEqual(expect.arrayContaining([
      [expect.stringMatching(/^Est\. walking time/), '45 min'],
      ['Stays', 'at least 1 h 30 min'],
      ['Planned', 'at least 2 h 15 min'],
    ]))
    expect(screen.queryByText('Breaks')).not.toBeInTheDocument()

    view.rerender(<TourPlannerToursRail planner={planner({ ...walk, plannedDurationMinutes: 240, plannedTotalMinutes: 240 })} tours={[tour]} {...railProps} />)
    expect(facts()).toEqual(expect.arrayContaining([
      ['Planned (Manual override)', '4 h'],
      ['Computed', 'at least 2 h 15 min'],
    ]))
  })

  it('disables saved-tour switching while a Save is pending', () => {
    const controller = planner({
      isSaving: true,
      saveOutcome: tour,
      hasUnsavedChanges: true,
      mode: { type: 'edit-saved', placeId: tour.place_id },
      editingPlaceId: tour.place_id,
    })
    render(<TourPlannerToursRail planner={controller} tours={[tour]} {...railProps} />)

    const row = screen.getByRole('option', { name: /Saved ridge walk/i })
    expect(row).toHaveAttribute('aria-disabled', 'true')
    expect(row).toHaveAttribute('tabindex', '-1')
    fireEvent.click(row)
    expect(controller.openTour).not.toHaveBeenCalled()
  })

  it('TOUR-PLANNER-RAIL-001: shows saved Tours rows and route stats without hiding the safety note in navigation', () => {
    render(<TourPlannerToursRail planner={planner({ mode: { type: 'new-draft' } })} tours={[tour]} {...railProps} />)

    expect(screen.getByRole('complementary', { name: 'Tours of this trip' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveTextContent('4 km')
    const overview = screen.getByTestId('tour-planner-overview')
    expect(within(overview).getByText('Ascent')).toBeInTheDocument()
    expect(within(overview).getByText('50 m')).toBeInTheDocument()
    expect(document.querySelector('svg[viewBox="0 0 440 100"]')).toBeInTheDocument()
    expect(screen.queryByText('Routing is planning assistance, not a safety guarantee.')).not.toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-020: warns over the overview when the route climbs a via ferrata, with the stretch in the tooltip', () => {
    publishTourFerrataCrossings([{ id: 'group/way/1', name: 'Alpspitz Ferrata', grade: 'K2', fromM: 1000, toM: 1600, afterWaypoint: null }])
    try {
      render(<TourPlannerToursRail planner={planner({ mode: { type: 'new-draft' } })} tours={[tour]} {...railProps} />)
      const badges = screen.getByTestId('tour-ferrata-crossings')
      expect(badges).toHaveTextContent('Via ferrata K2')
      expect(within(badges).getByLabelText(/climbs 600 m of “Alpspitz Ferrata”/)).toBeInTheDocument()
      expect(document.querySelectorAll('[data-profile-band]').length).toBeGreaterThan(0)
    } finally {
      publishTourFerrataCrossings([])
    }
  })

  it('exposes permanent deletion in the visible TOUR-PLANNER Tours rail', () => {
    const onDeleteTour = vi.fn()
    render(<TourPlannerToursRail planner={planner()} tours={[tour]} {...railProps} canEdit onDeleteTour={onDeleteTour} />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete Saved ridge walk' }))

    expect(onDeleteTour).toHaveBeenCalledOnce()
    expect(onDeleteTour).toHaveBeenCalledWith(tour.place_id)
  })

  it('TOUR-PLANNER-RAIL-002: guards a saved-tour open while the current draft is unsaved', () => {
    const controller = planner({ hasUnsavedChanges: true })
    render(<TourPlannerToursRail planner={controller} tours={[tour]} {...railProps} />)

    fireEvent.click(screen.getByRole('option', { name: /Saved ridge walk/i }))
    expect(controller.openTour).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Discard unsaved tour changes?' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(controller.openTour).toHaveBeenCalledWith(tour)
  })

  it('keeps the post-save confirmation compact and assigns through the saved TOUR-PLANNER row action', async () => {
    const controller = planner({ saveOutcome: tour, editingPlaceId: tour.place_id })
    const onAssignToDay = vi.fn().mockResolvedValue(undefined)
    render(<TourPlannerToursRail planner={controller} tours={[tour]} {...railProps} onAssignToDay={onAssignToDay} />)

    expect(screen.queryByRole('button', { name: 'Assign to a day' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Plan another' })).not.toBeInTheDocument()
    expect(onAssignToDay).not.toHaveBeenCalled()
    expect(controller.discard).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Add to day: Saved ridge walk' }))
    const dayOption = screen.getByRole('button', { name: /Summit day/ })
    expect(dayOption).toHaveTextContent(/Day 1/i)
    expect(dayOption).toHaveTextContent(/May 15/i)
    expect(dayOption).toHaveTextContent(/Fri/i)
    fireEvent.click(dayOption)
    await waitFor(() => expect(onAssignToDay).toHaveBeenCalledWith(42, 7))
  })

  it('keeps the save confirmation and row assignment action available when row assignment fails', async () => {
    const controller = planner({ saveOutcome: tour, editingPlaceId: tour.place_id })
    const onAssignToDay = vi.fn().mockResolvedValue(false)
    render(<TourPlannerToursRail planner={controller} tours={[tour]} {...railProps} onAssignToDay={onAssignToDay} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add to day: Saved ridge walk' }))
    fireEvent.click(screen.getByRole('button', { name: /Summit day/ }))

    await waitFor(() => expect(onAssignToDay).toHaveBeenCalledWith(42, 7))
    expect(screen.queryByRole('button', { name: 'Assign to a day' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to day: Saved ridge walk' })).toBeEnabled()
  })

  it('TOUR-PLANNER-RAIL-004: protects a dirty draft before selecting a GPX Tour', () => {
    const gpxTour = { ...tour, has_waypoints: false }
    const controller = planner({ hasUnsavedChanges: true, mode: { type: 'new-draft' } })
    const onViewGpxTour = vi.fn()
    render(<TourPlannerToursRail planner={controller} tours={[gpxTour]} {...railProps} onViewGpxTour={onViewGpxTour} />)

    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveTextContent('GPX')
    fireEvent.click(screen.getByRole('option', { name: /Saved ridge walk/i }))
    expect(onViewGpxTour).not.toHaveBeenCalled()
    expect(controller.openTour).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Discard unsaved tour changes?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onViewGpxTour).not.toHaveBeenCalled()
    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).not.toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('option', { name: /Saved ridge walk/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onViewGpxTour).toHaveBeenCalledWith(gpxTour)
  })

  it('TOUR-PLANNER-RAIL-020: cancelling a dirty saved-tour switch preserves the selected row', () => {
    const otherTour = { ...tour, place_id: 43, name: 'Other ridge walk' }
    const controller = planner({
      mode: { type: 'edit-saved', placeId: tour.place_id },
      editingPlaceId: tour.place_id,
      hasUnsavedChanges: true,
    })
    render(<TourPlannerToursRail planner={controller} tours={[tour, otherTour]} {...railProps} />)

    fireEvent.click(screen.getByRole('option', { name: /Other ridge walk/i }))
    expect(screen.getByRole('heading', { name: 'Discard unsaved tour changes?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: /Other ridge walk/i })).not.toHaveAttribute('aria-selected', 'true')
    expect(controller.openTour).not.toHaveBeenCalled()
  })

  it('TOUR-PLANNER-RAIL-005: shows analyzed GPX metrics and profile without editable controls', () => {
    const geometry = JSON.stringify([[48, 11, 500], [48, 11.01, 550], [48, 11.02, 520]])
    const controller = planner({
      readOnlyGpxTour: { tour: { ...tour, has_waypoints: false }, routeGeometry: geometry },
      readOnlyGpxAnalysis: analyzeRouteGeometry(geometry),
    })
    const { container } = render(<TourPlannerRail planner={controller} />)

    expect(screen.getByRole('heading', { name: 'GPX tour' })).toBeInTheDocument()
    expect(screen.getByText('Saved ridge walk')).toBeInTheDocument()
    expect(screen.getByText('Walking time')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
    expect(screen.getByText('Minimum altitude')).toBeInTheDocument()
    expect(screen.getByText('Ascent')).toBeInTheDocument()
    expect(screen.getByText('50 m')).toBeInTheDocument()
    expect(container.querySelector('svg[viewBox="0 0 440 100"]')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tour name')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to Tours' }))
    expect(controller.returnToNeutral).toHaveBeenCalledOnce()
  })

  it.each(['editable', 'GPX'] as const)('uses the same interactive profile focus contract for %s Tours', kind => {
    let scheduledFrame: FrameRequestCallback | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      scheduledFrame = callback
      return 1
    })
    const geometry = JSON.stringify([[48, 11, 500], [48.01, 11.02, 550]])
    const focus = { distanceMeters: 500, elevationMeters: 525, lat: 48.005, lng: 11.01, sampleIndex: 1 }
    const setRouteProfileFocus = vi.fn()
    const controller = kind === 'GPX'
      ? planner({ routeProfileFocus: focus, setRouteProfileFocus, readOnlyGpxTour: { tour: { ...tour, has_waypoints: false }, routeGeometry: geometry }, readOnlyGpxAnalysis: analyzeRouteGeometry(geometry) })
      : planner({ mode: { type: 'new-draft' }, routeProfileFocus: focus, setRouteProfileFocus })
    expect(controller.routeAnalysis?.distanceIndexedProfileSamples[0]).toMatchObject({ lat: 48, lng: 11 })
    const { container } = kind === 'GPX'
      ? render(<TourPlannerRail planner={controller} />)
      : render(<TourPlannerToursRail planner={controller} tours={[tour]} {...railProps} />)
    const profile = container.querySelector('svg[viewBox="0 0 440 100"]') as SVGSVGElement | null
    expect(profile).not.toBeNull()
    expect(profile).toHaveAttribute('tabindex', '0')
    expect(profile).toHaveAttribute('aria-label', 'Elevation profile')
    const line = container.querySelector('[data-profile-focus-line]')
    expect(line).toBeInTheDocument()
    expect(container.querySelector('[data-profile-focus-readout]')?.textContent).toContain('At ')

    vi.spyOn(profile!, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 440, bottom: 100, width: 440, height: 100,
      toJSON: () => ({}),
    } as DOMRect)
    fireEvent.pointerMove(profile!, { clientX: 220, pointerType: 'mouse' })
    expect(scheduledFrame).not.toBeNull()
    act(() => scheduledFrame?.(16))
    const focused = setRouteProfileFocus.mock.calls[0][0]!
    expect(focused.lat).toBeCloseTo(kind === 'GPX' ? 48.005 : 48.018, 6)
    expect(focused.lng).toBe(kind === 'GPX' ? 11.01 : 11)
  })

  it.each([
    ['en', 'metric', 'At 500 m: 525 m'],
    ['de', 'imperial', 'Bei 0.3 mi: 1722 ft'],
  ] as const)('formats focused profile distance/elevation for %s %s units', async (language, distance_unit, expected) => {
    seedStore(useSettingsStore, { settings: { language, distance_unit } })
    const controller = planner({
      mode: { type: 'new-draft' },
      routeProfileFocus: { distanceMeters: 500, elevationMeters: 525, lat: 48.005, lng: 11, sampleIndex: 1 },
      setRouteProfileFocus: vi.fn(),
    })
    const { container } = render(<TourPlannerToursRail planner={controller} tours={[tour]} {...railProps} />)
    await waitFor(() => expect(container.querySelector('[data-profile-focus-readout]')?.textContent).toBe(expected))
  })
})

describe('TourPlannerRail', () => {
  it('RS-01: edits Tour description and HTTPS information link without exposing editable fields in GPX mode', () => {
    const setDescription = vi.fn()
    const setWebsite = vi.fn()
    const { rerender } = render(
      <TourPlannerRail
        planner={planner({ mode: { type: 'new-draft' }, hasUnsavedChanges: true, setDescription, setWebsite })}
      />
    )
    const description = screen.getByLabelText('Description')
    const website = screen.getByLabelText('Website')
    fireEvent.change(description, { target: { value: 'A quiet ridge route' } })
    fireEvent.change(website, { target: { value: 'https://www.komoot.com/tour/42' } })
    expect(setDescription).toHaveBeenCalledWith('A quiet ridge route')
    expect(setWebsite).toHaveBeenCalledWith('https://www.komoot.com/tour/42')

    rerender(
      <TourPlannerRail
        planner={planner({
          mode: { type: 'view-gpx', placeId: 42, tour },
          readOnlyGpxTour: { tour, routeGeometry: null },
          waypoints: [],
          websiteInvalid: true,
        })}
      />
    )
    expect(screen.queryByLabelText('Description')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Website')).not.toBeInTheDocument()
  })

  it('RS-02: edits breaks and planned total directly, and clearing total returns it to automatic', () => {
    const setPlannedDurationMinutes = vi.fn()
    const setBreakAdditionalMinutes = vi.fn()
    const controller = planner({
      mode: { type: 'new-draft' }, hasUnsavedChanges: true, durationSeconds: 3600,
      walkingDurationMinutes: 60, breakAdditionalMinutes: 35, setBreakAdditionalMinutes,
      plannedDurationMinutes: null, plannedTotalMinutes: 95, setPlannedDurationMinutes,
    })
    const { rerender } = render(<TourPlannerRail planner={controller} />)

    expect(screen.queryByTestId('tour-planner-walking-time')).not.toBeInTheDocument()
    expect(screen.getByTestId('tour-planner-time-grid')).toHaveClass('grid')
    expect(screen.getByTestId('tour-planner-time-grid')).toHaveClass('grid-cols-2')
    const breaks = screen.getByLabelText('Breaks / additional time')
    // A duration field shows "1 h 35 min" and reads minutes, a clock or units back.
    expect(breaks).toHaveValue('35 min')
    fireEvent.change(breaks, { target: { value: '50' } })
    expect(setBreakAdditionalMinutes).toHaveBeenCalledWith(50)
    fireEvent.change(breaks, { target: { value: '' } })
    expect(setBreakAdditionalMinutes).toHaveBeenLastCalledWith(null)
    fireEvent.change(breaks, { target: { value: '50' } })
    const input = screen.getByLabelText('Planned total duration')
    expect(input).toHaveValue('1 h 35 min')
    expect(controller.durationSeconds).toBe(3600)
    fireEvent.change(input, { target: { value: '2:05' } })
    expect(setPlannedDurationMinutes).toHaveBeenCalledWith(125)

    rerender(<TourPlannerRail planner={planner({
      mode: { type: 'new-draft' }, hasUnsavedChanges: true, plannedDurationMinutes: 125,
      setPlannedDurationMinutes,
      plannedTotalMinutes: 125, walkingDurationMinutes: 60, breakAdditionalMinutes: 35,
    })} />)
    const overriddenInput = screen.getByLabelText(/Planned total duration/)
    expect(overriddenInput).toHaveValue('2 h 5 min')
    expect(screen.getByTestId('tour-planner-planned-manual')).toHaveTextContent('Manual override')
    fireEvent.change(overriddenInput, { target: { value: '' } })
    expect(setPlannedDurationMinutes).toHaveBeenCalledWith(null)

    rerender(<TourPlannerRail planner={planner({
      mode: { type: 'new-draft' }, hasUnsavedChanges: true, plannedDurationMinutes: 1441,
      plannedDurationInvalid: true,
    })} />)
    expect(screen.getByLabelText(/Planned total duration/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole value from 0 to 1,440 minutes.')

    rerender(<TourPlannerRail planner={planner({
      mode: { type: 'new-draft' }, hasUnsavedChanges: true, breakAdditionalMinutes: 1441,
      breakAdditionalInvalid: true,
    })} />)
    expect(screen.getByLabelText('Breaks / additional time')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole value from 0 to 1,440 minutes.')
  })

  it('RS-02: Info controls are keyboard focusable and explain themselves only through the shared tooltip', async () => {
    render(<TourPlannerRail planner={planner({
      mode: { type: 'new-draft' }, hasUnsavedChanges: true, walkingDurationMinutes: 80,
      breakAdditionalMinutes: 50, plannedTotalMinutes: 130,
    })} />)

    const breaksInfo = screen.getByRole('button', { name: 'About breaks and additional time' })
    expect(breaksInfo.tabIndex).toBe(0)
    expect(breaksInfo).not.toHaveAttribute('aria-expanded')
    expect(breaksInfo).toHaveAccessibleDescription('Optional whole minutes added to calculated walking time.')
    expect(breaksInfo).toHaveClass('focus-visible:outline')
    fireEvent.mouseEnter(breaksInfo)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Optional whole minutes added to calculated walking time.')
    fireEvent.mouseLeave(breaksInfo)

    // A click shows nothing beyond the tooltip: no explanation unfolds in the form.
    fireEvent.click(breaksInfo)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()

    const totalInfo = screen.getByRole('button', { name: 'About planned total duration' })
    expect(totalInfo).toHaveAccessibleDescription('Calculated planned total duration.')
  })

  it('RS-01: marks unsafe website values invalid and does not offer Save', () => {
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, hasUnsavedChanges: true, website: 'http://example.org', websiteInvalid: true })} />)
    expect(screen.getByLabelText('Website')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('TREK cannot use that address.')
  })

  const reorderWaypoints = [
    { id: 'a', lat: 48, lng: 11, role: 'start' as const },
    { id: 'b', lat: 48.1, lng: 11.1, role: 'via' as const },
    { id: 'c', lat: 48.2, lng: 11.2, role: 'via' as const },
    { id: 'd', lat: 48.3, lng: 11.3, role: 'end' as const },
  ];

  it('RC-07: dragging before and after rows commits only on drop by stable waypoint ids', () => {
    const reorderWaypoint = vi.fn();
    render(
      <TourPlannerRail
        planner={planner({
          mode: { type: 'new-draft' },
          hasUnsavedChanges: true,
          waypoints: reorderWaypoints,
          reorderWaypoint,
        })}
      />
    );
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    const transfer = { setData: vi.fn(), getData: vi.fn(() => 'a'), effectAllowed: 'all', dropEffect: 'move' };
    const dispatchDrag = (type: string, target: HTMLElement, dataTransfer: typeof transfer, clientY = 0) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
      Object.defineProperty(event, 'clientY', { value: clientY });
      fireEvent(target, event);
    };
    for (const row of [rows[1], rows[2]]) {
      Object.defineProperty(row, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          top: 0,
          bottom: 20,
          height: 20,
          left: 0,
          right: 100,
          width: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      });
    }

    dispatchDrag('dragstart', within(rows[0]).getByTestId('tour-planner-waypoint-drag-handle'), transfer);
    dispatchDrag('dragover', rows[2], transfer, 1);
    expect(reorderWaypoint).not.toHaveBeenCalled();
    dispatchDrag('drop', rows[2], transfer, 1);
    expect(reorderWaypoint).toHaveBeenCalledOnce();
    expect(reorderWaypoint).toHaveBeenLastCalledWith('a', 'c', 'before');

    reorderWaypoint.mockClear();
    const lastTransfer = { ...transfer, getData: vi.fn(() => 'd') };
    dispatchDrag('dragstart', within(rows[3]).getByTestId('tour-planner-waypoint-drag-handle'), lastTransfer);
    dispatchDrag('dragover', rows[1], lastTransfer, 15);
    expect(reorderWaypoint).not.toHaveBeenCalled();
    dispatchDrag('drop', rows[1], lastTransfer, 15);
    expect(reorderWaypoint).toHaveBeenCalledOnce();
    expect(reorderWaypoint).toHaveBeenLastCalledWith('d', 'b', 'after');
  });

  it('RC-07: cancelled drags do not reorder and keyboard arrow controls remain buttons', async () => {
    const user = userEvent.setup();
    const reorderWaypoint = vi.fn();
    const moveWaypoint = vi.fn();
    render(
      <TourPlannerRail
        planner={planner({
          mode: { type: 'new-draft' },
          hasUnsavedChanges: true,
          waypoints: reorderWaypoints,
          reorderWaypoint,
          moveWaypoint,
        })}
      />
    );
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    const transfer = { setData: vi.fn(), getData: vi.fn(() => 'a'), effectAllowed: 'all', dropEffect: 'move' };
    Object.defineProperty(rows[2], 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 0,
        bottom: 20,
        height: 20,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    fireEvent.dragStart(within(rows[0]).getByTestId('tour-planner-waypoint-drag-handle'), { dataTransfer: transfer });
    fireEvent.dragOver(rows[2], { dataTransfer: transfer, clientY: -1 });
    fireEvent.dragEnd(rows[0], { dataTransfer: transfer });
    expect(reorderWaypoint).not.toHaveBeenCalled();

    // The row's menu opens from the keyboard and lands on its first action that can run.
    const more = screen.getAllByRole('button', { name: 'More actions' })[0];
    more.focus();
    await user.keyboard(' ');
    const moveDown = screen.getByRole('button', { name: 'Move waypoint down' });
    expect(moveDown).toHaveFocus();
    await user.keyboard(' ');
    expect(moveWaypoint).toHaveBeenCalledWith('a', 1);
    expect(reorderWaypoint).not.toHaveBeenCalled();
  });

  it('disables draft mutation and replacement controls while saving', () => {
    const controller = planner({
      mode: { type: 'new-draft' },
      status: 'saving',
      isSaving: true,
      hasUnsavedChanges: true,
      canSave: true,
      canUndo: true,
      canRedo: true,
      waypoints: [
        { id: 'a', lat: 48, lng: 11, role: 'start' },
        { id: 'b', lat: 48.1, lng: 11.1, role: 'end' },
      ],
      name: 'Ridge walk',
      selectedWaypointId: 'a',
      setSelectedWaypointId: vi.fn(),
      moveWaypoint: vi.fn(),
      removeWaypoint: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      save: vi.fn(),
      setName: vi.fn(),
    })
    render(<TourPlannerRail planner={controller} />)

    expect(screen.getByLabelText('Tour name')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Maximum trail difficulty' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back to Tours' })).toBeDisabled()
    expect(screen.getAllByLabelText('More actions')).toHaveLength(2)
    expect(screen.getAllByLabelText('More actions').every(element => element.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(screen.getAllByLabelText('Remove waypoint').every(element => element.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(within(screen.getByTestId('tour-planner-status')).getByLabelText('Saving…')).toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-005B: the routing badge says walking only for a walking tour', () => {
    const { rerender } = render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, status: 'routing', tourType: 'hike' })} />)
    expect(within(screen.getByTestId('tour-planner-status')).getByLabelText('Calculating walking route…')).toBeInTheDocument()
    rerender(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, status: 'routing', tourType: 'bike' })} />)
    expect(within(screen.getByTestId('tour-planner-status')).getByLabelText('Calculating route…')).toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-006: places the safety note beside Save and numbers rows like map pins', () => {
    const controller = planner({
      status: 'ready',
      waypoints: [
        { id: 'a', lat: 48, lng: 11, role: 'start' },
        { id: 'b', lat: 48.1, lng: 11.1, role: 'end' },
      ],
      selectedWaypointId: 'a',
      canSave: true,
      canUndo: false,
      canRedo: false,
      setSelectedWaypointId: vi.fn(),
      moveWaypoint: vi.fn(),
      removeWaypoint: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      save: vi.fn(),
      setName: vi.fn(),
      name: 'Ridge walk',
    })
    render(<TourPlannerRail planner={controller} />)

    const save = screen.getByRole('button', { name: 'Save' })
    // The safety note lives in the info dot beside the hiking difficulty, as its description.
    expect(screen.getByRole('button', { name: 'About safety' })).toHaveAccessibleDescription('Routing is planning assistance, not a safety guarantee.')
    expect(save).toHaveClass('bg-accent', 'text-accent-text')
    expect(save).toHaveClass('hover:opacity-90')
    const firstNumber = screen.getByLabelText('Waypoint 1')
    const secondNumber = screen.getByLabelText('Waypoint 2')
    expect(firstNumber).toHaveTextContent('1')
    expect(secondNumber).toHaveTextContent('2')
    expect(firstNumber).toHaveAttribute('data-waypoint-number', '1')
    expect(secondNumber).toHaveAttribute('data-waypoint-number', '2')
    expect(firstNumber).toHaveClass('bg-accent', 'text-accent-text', 'font-geist', 'tabular-nums', 'h-7', 'w-7')
    // Round like the map's pins and the plan's avatars.
    expect(secondNumber).toHaveClass(
      'bg-edge', 'text-content', 'font-geist', 'tabular-nums', 'h-7', 'w-7',
      'rounded-full'
    )
  })

  it('TOUR-PLANNER-RAIL-007: acknowledges alpine routing once per planner session, also after the rail mounts again', () => {
    const setDifficulty = vi.fn()
    const acknowledge = vi.fn()
    const controller = planner({ mode: { type: 'new-draft' }, setMaxHikingDifficulty: setDifficulty, acknowledgeAlpine: acknowledge })
    const { unmount } = render(<TourPlannerRail planner={controller} />)

    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))
    fireEvent.click(screen.getByRole('button', { name: /T4: Alpine hiking/ }))
    expect(screen.getByRole('heading', { name: 'Enable alpine routing?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enable alpine routing' }))
    expect(setDifficulty).toHaveBeenCalledWith(4)
    expect(acknowledge).toHaveBeenCalledOnce()
    unmount()

    // The planner remembers the answer, so a rail that mounts anew does not ask again.
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, setMaxHikingDifficulty: setDifficulty, alpineAcknowledged: true })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))
    fireEvent.click(screen.getByRole('button', { name: /T5: Demanding alpine hiking/ }))
    expect(screen.queryByRole('heading', { name: 'Enable alpine routing?' })).not.toBeInTheDocument()
    expect(setDifficulty).toHaveBeenLastCalledWith(5)
  })

  it('TOUR-PLANNER-RAIL-008: cancelling alpine acknowledgement leaves the setting unchanged', () => {
    const setDifficulty = vi.fn()
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, setMaxHikingDifficulty: setDifficulty })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))
    fireEvent.click(screen.getByRole('button', { name: /T4: Alpine hiking/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(setDifficulty).not.toHaveBeenCalled()
  })

  it('TOUR-PLANNER-RAIL-014: exposes every T1-T6 choice and the T3 warning', () => {
    const setDifficulty = vi.fn()
    function StatefulDifficultyRail() {
      const [difficulty, setDifficultyState] = useState<1 | 2 | 3 | 4 | 5 | 6>(2)
      return <TourPlannerRail planner={planner({
        mode: { type: 'new-draft' },
        maxHikingDifficulty: difficulty,
        setMaxHikingDifficulty: value => { setDifficulty(value); setDifficultyState(value as 1 | 2 | 3 | 4 | 5 | 6) },
      })} />
    }
    render(<StatefulDifficultyRail />)
    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))

    for (const label of [
      'T1: Hiking',
      'T2: Mountain hiking',
      'T3: Demanding mountain hiking',
      'T4: Alpine hiking',
      'T5: Demanding alpine hiking',
      'T6: Difficult alpine hiking',
    ]) expect(screen.getByRole('button', { name: label })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'T3: Demanding mountain hiking' }))
    expect(setDifficulty).toHaveBeenCalledWith(3)
    expect(screen.getAllByRole('status').some(el => /T3 routes may include exposed/.test(el.textContent ?? ''))).toBe(true)
  })

  it('TOUR-PLANNER-RAIL-009: neutral shows only the Plan new entry and new-draft guidance hides after the first waypoint', () => {
    const controller = planner({ mode: { type: 'neutral' } })
    const { rerender } = render(<TourPlannerRail planner={controller} />)

    expect(screen.getByText('Plan a tour')).toBeInTheDocument()
    expect(screen.getByText('Start a new tour and click the map to place its waypoints.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Plan new tour' }))
    expect(controller.startNewTour).toHaveBeenCalledOnce()
    expect(screen.queryByLabelText('Tour name')).not.toBeInTheDocument()
    expect(screen.queryByText('Maximum trail difficulty')).not.toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' } })} />)
    expect(screen.queryByRole('button', { name: 'Plan new tour' })).not.toBeInTheDocument()
    expect(screen.getByTestId('tour-planner-empty-state')).toHaveTextContent('Click the map to set points.')
    act(() => { toggleTourPlacing() })
    expect(screen.getByTestId('tour-planner-empty-state')).toHaveTextContent('Turn on Add point and click the map.')
    act(() => { toggleTourPlacing() })
    expect(screen.getByTestId('tour-planner-empty-state')).toHaveTextContent('From two points on, TREK works out the route.')
    rerender(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, waypoints: [{ id: 'first', lat: 48, lng: 11, role: 'start' }] })} />)
    expect(screen.queryByTestId('tour-planner-empty-state')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Plan new tour' })).not.toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-010: elevation disclosure is focusable and toggles with Enter and Space', async () => {
    function StatefulToursRail() {
      const [expanded, setExpanded] = useState(true)
      return (
        <TourPlannerToursRail
          planner={planner({
            mode: { type: 'new-draft' },
            elevationProfileExpanded: expanded,
            toggleElevationProfile: () => setExpanded(value => !value),
          })}
          tours={[tour]}
          {...railProps}
        />
      )
    }

    const user = userEvent.setup()
    const { container } = render(<StatefulToursRail />)
    const toggle = screen.getByRole('button', { name: 'Collapse elevation profile' })
    toggle.focus()
    expect(document.activeElement).toBe(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).not.toBeNull()

    await user.keyboard('{Enter}')
    const expand = screen.getByRole('button', { name: 'Expand elevation profile' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('svg[viewBox="0 0 440 100"]')).not.toBeInTheDocument()

    expand.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Collapse elevation profile' })).toHaveAttribute('aria-expanded', 'true')
    expect(container.querySelector('svg[viewBox="0 0 440 100"]')).toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-011: routes Plan new confirmation cancel and confirm through the hook action', () => {
    const controller = planner({ newTourConfirmationOpen: true, mode: { type: 'new-draft' } })
    const { rerender } = render(<TourPlannerRail planner={controller} />)

    expect(screen.getByRole('heading', { name: 'Start a new tour?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(controller.cancelNewTour).toHaveBeenCalledOnce()

    rerender(<TourPlannerRail planner={controller} />)
    fireEvent.click(screen.getByRole('button', { name: 'Discard and start' }))
    expect(controller.startNewTour).toHaveBeenCalledWith(true)
  })

  it('TOUR-PLANNER-RAIL-012: exposes the same Plan new action while editing a saved Tour', () => {
    const controller = planner({
      editingPlaceId: tour.place_id,
      name: tour.name,
      waypoints: [{ id: 'saved-start', lat: 48, lng: 11, role: 'start' }],
    })
    render(<TourPlannerRail planner={controller} />)

    expect(screen.getByRole('heading', { name: 'Edit tour' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Plan new tour' })).not.toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-013: does not compete with the GPX read-only presentation', () => {
    const geometry = JSON.stringify([[48, 11, 500], [48, 11.01, 550]])
    const controller = planner({
      readOnlyGpxTour: { tour: { ...tour, has_waypoints: false }, routeGeometry: geometry },
      readOnlyGpxAnalysis: analyzeRouteGeometry(geometry),
    })
    render(<TourPlannerRail planner={controller} />)

    expect(screen.getByRole('heading', { name: 'GPX tour' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Plan new tour' })).not.toBeInTheDocument()
  })

  it('PR1-05B: an import planned over in place offers its recorded track back, after a confirm', async () => {
    const restore = vi.fn()
    const controller = planner({
      mode: { type: 'edit-saved', placeId: tour.place_id },
      waypoints: [],
    } as Partial<TourPlannerController>)
    const recordedTrack = { available: true, restoring: false, restore }
    render(<TourPlannerRail planner={controller} recordedTrack={recordedTrack} />)

    expect(screen.getByRole('region', { name: 'Recorded track' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restore recorded track' }))
    expect(restore).not.toHaveBeenCalled()
    expect(screen.getByText('Restore the recorded track?')).toBeInTheDocument()

    const confirms = screen.getAllByRole('button', { name: 'Restore recorded track' })
    await userEvent.click(confirms[confirms.length - 1])
    expect(restore).toHaveBeenCalledOnce()
  })

  it('PR1-05B: a tour without a kept track shows no way back', () => {
    const controller = planner({
      mode: { type: 'edit-saved', placeId: tour.place_id },
      waypoints: [],
    } as Partial<TourPlannerController>)
    render(
      <TourPlannerRail planner={controller} recordedTrack={{ available: false, restoring: false, restore: vi.fn() }} />
    )
    expect(screen.queryByRole('region', { name: 'Recorded track' })).not.toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-015: returns from GPX view to the blank editable Planner', () => {
    const controller = planner({
      readOnlyGpxTour: { tour: { ...tour, has_waypoints: false }, routeGeometry: null },
      readOnlyGpxAnalysis: null,
    })
    const { rerender } = render(<TourPlannerRail planner={controller} />)
    expect(screen.getByText('Route geometry is unavailable for this GPX import.')).toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ mode: { type: 'neutral' } })} />)
    expect(screen.getByText('Plan a tour')).toBeInTheDocument()
    expect(screen.queryByText('Route geometry is unavailable for this GPX import.')).not.toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-016: the master list reflects neutral, saved-edit, and GPX selection modes', () => {
    const gpxTour = { ...tour, place_id: 43, name: 'Imported GPX walk', has_waypoints: false }
    const geometry = JSON.stringify([[48, 11], [48.01, 11.02]])
    const { rerender } = render(<TourPlannerToursRail planner={planner({ mode: { type: 'neutral' } })} tours={[tour, gpxTour]} {...railProps} />)
    expect(screen.getAllByRole('option').every(row => row.getAttribute('aria-selected') !== 'true')).toBe(true)

    rerender(<TourPlannerToursRail planner={planner({ editingPlaceId: tour.place_id })} tours={[tour, gpxTour]} {...railProps} />)
    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveAttribute('aria-selected', 'true')

    rerender(<TourPlannerToursRail planner={planner({
      readOnlyGpxTour: { tour: gpxTour, routeGeometry: geometry },
      readOnlyGpxAnalysis: analyzeRouteGeometry(geometry),
    })} tours={[tour, gpxTour]} {...railProps} />)
    expect(screen.getByRole('option', { name: /Imported GPX walk/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).not.toHaveAttribute('aria-selected', 'true')
  })

  it('TOUR-PLANNER-RAIL-018: clean saved editor closes directly; dirty editor close is cancellable', () => {
    const clean = planner({ mode: { type: 'edit-saved', placeId: tour.place_id }, editingPlaceId: tour.place_id, hasUnsavedChanges: false })
    const { rerender } = render(<TourPlannerRail planner={clean} />)
    const back = screen.getByRole('button', { name: 'Back to Tours' })
    expect(back).toHaveAttribute('aria-label', 'Back to Tours')
    expect(back).toHaveClass('focus-visible:outline')
    fireEvent.click(back)
    expect(clean.returnToNeutral).toHaveBeenCalledOnce()
    expect(screen.queryByRole('heading', { name: 'Discard unsaved tour changes?' })).not.toBeInTheDocument()

    const dirty = planner({ mode: { type: 'edit-saved', placeId: tour.place_id }, editingPlaceId: tour.place_id, hasUnsavedChanges: true })
    rerender(<TourPlannerRail planner={dirty} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back to Tours' }))
    expect(screen.getByRole('heading', { name: 'Discard unsaved tour changes?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(dirty.returnToNeutral).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Edit tour' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back to Tours' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(dirty.returnToNeutral).toHaveBeenCalledOnce()
  })

  it('TOUR-PLANNER-RAIL-021: dirty new-draft close requires confirmation', () => {
    const controller = planner({ mode: { type: 'new-draft' }, hasUnsavedChanges: true })
    render(<TourPlannerRail planner={controller} />)

    fireEvent.click(screen.getByRole('button', { name: 'Back to Tours' }))
    expect(screen.getByRole('heading', { name: 'Discard unsaved tour changes?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(controller.returnToNeutral).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'New tour' })).toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-019: restored new and saved drafts show a non-blocking notice', () => {
    const { rerender } = render(<TourPlannerRail planner={planner({ draftRestored: true, hasUnsavedChanges: true, mode: { type: 'new-draft' } })} />)
    expect(screen.getByLabelText('Unsaved draft restored')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New tour' })).toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ draftRestored: true, hasUnsavedChanges: true, editingPlaceId: tour.place_id, mode: { type: 'edit-saved', placeId: tour.place_id } })} />)
    expect(screen.getByLabelText('Unsaved draft restored')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit tour' })).toBeInTheDocument()
  })

  it('TOUR-PLANNER-RAIL-022: an unsaved walk read from Google Maps says so, and a saved one no longer does (CW-07)', () => {
    const notice = 'From a Google Maps walking route. TREK planned the way between the stops itself.'
    const { rerender } = render(<TourPlannerRail planner={planner({ draftSource: 'google_maps', hasUnsavedChanges: true, mode: { type: 'new-draft' } })} />)
    expect(screen.getByText(notice)).toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ draftSource: 'google_maps', editingPlaceId: tour.place_id, mode: { type: 'edit-saved', placeId: tour.place_id } })} />)
    expect(screen.queryByText(notice)).toBeNull()
    rerender(<TourPlannerRail planner={planner({ hasUnsavedChanges: true, mode: { type: 'new-draft' } })} />)
    expect(screen.queryByText(notice)).toBeNull()
  })
})

describe('the paddle checklist in the rails (PAD-06)', () => {
  const checklist = { status: 'ready', select: vi.fn(), decide: vi.fn() } as unknown as PaddleChecklist
  const kayak: TourListItem = { ...tour, tour_type: 'kayak', has_waypoints: false }
  const geometry = JSON.stringify([[48, 11], [48.01, 11.02]])
  const paddleEditor = (overrides: Partial<TourPlannerController> = {}) =>
    planner({ mode: { type: 'new-draft' }, tourType: 'kayak', isPaddle: true, ...overrides })
  const recorded = (recordedTour: TourListItem) => planner({
    readOnlyGpxTour: { tour: recordedTour, routeGeometry: geometry },
    readOnlyGpxAnalysis: analyzeRouteGeometry(geometry),
  })
  const safetyRow = () => screen.queryByRole('button', { name: /Paddling has risks/ })

  it('PCR-001: a paddle tour shows its checklist after the control points and before the wind, the safety row above Save', () => {
    render(<TourPlannerRail planner={paddleEditor()} paddleChecklist={checklist} />)

    const card = screen.getByTestId('paddle-check-card')
    expect(card).toHaveAttribute('data-status', 'ready')
    expect(screen.getByTestId('tour-planner-empty-state').compareDocumentPosition(card)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(card.compareDocumentPosition(screen.getByTestId('paddle-wind-card'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    const safety = screen.getByRole('button', { name: /Paddling has risks/ })
    expect(safety.closest('fieldset')).toBeNull()
    expect(safety.closest('.overflow-y-auto')).toBeNull()
    expect(safety.compareDocumentPosition(screen.getByRole('button', { name: 'Save' }))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('PCR-002: the safety row stays open while a save locks the rail', () => {
    render(<TourPlannerRail planner={paddleEditor({ isSaving: true })} paddleChecklist={checklist} />)

    expect(screen.getByRole('button', { name: /Paddling has risks/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('PCR-003: a hike shows neither the checklist nor the safety row', () => {
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' } })} paddleChecklist={checklist} />)

    expect(screen.queryByTestId('paddle-check-card')).not.toBeInTheDocument()
    expect(safetyRow()).not.toBeInTheDocument()
  })

  it('PCR-004: without a checklist a paddle tour still shows its safety row', () => {
    render(<TourPlannerRail planner={paddleEditor()} />)

    expect(screen.queryByTestId('paddle-check-card')).not.toBeInTheDocument()
    expect(safetyRow()).toBeInTheDocument()
  })

  it('PCR-006: legs the water router could not plan are counted in the head, without the retry the rows already offer', () => {
    const failed = paddleEditor({
      status: 'routing-failed',
      error: 'paddle-route',
      paddleRoute: { coordinates: [], parts: [], distanceMeters: 0, legs: [], legLengths: [], failures: [
        { index: 0, code: 'not_on_water', at: null },
        { index: 1, code: 'busy', at: null },
      ] },
    })
    const { rerender } = render(<TourPlannerRail planner={failed} />)
    expect(within(screen.getByTestId('tour-planner-status')).getByLabelText('2 legs not planned')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, status: 'routing-failed', error: 'routing' })} />)
    expect(within(screen.getByTestId('tour-planner-status')).getByLabelText('Route calculation failed. The last good route is still shown.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('PCR-005: a recorded kayak track scrolls its checklist before the wind and keeps the safety row in a footer; a recorded hike neither', () => {
    const { rerender } = render(<TourPlannerRail planner={recorded(kayak)} paddleChecklist={checklist} />)

    const card = screen.getByTestId('paddle-check-card')
    expect(card.closest('.overflow-y-auto')).not.toBeNull()
    expect(card.compareDocumentPosition(screen.getByTestId('paddle-wind-card'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    const safety = screen.getByRole('button', { name: /Paddling has risks/ })
    expect(safety.closest('.overflow-y-auto')).toBeNull()
    expect(safety.closest('section')).toHaveAttribute('aria-label', kayak.name)

    rerender(<TourPlannerRail planner={recorded({ ...tour, has_waypoints: false })} paddleChecklist={checklist} />)
    expect(screen.queryByTestId('paddle-check-card')).not.toBeInTheDocument()
    expect(safetyRow()).not.toBeInTheDocument()
  })
})

describe('a run in the planner rails (RUN-01)', () => {
  const run = { mode: { type: 'new-draft' as const }, tourType: 'run' as const, isRun: true }

  it('TOUR-PLANNER-RAIL-RUN-001: the overview names the time as planned and says climbs and difficulty stay out of it', () => {
    render(<TourPlannerToursRail planner={planner({ ...run, walkingDurationMinutes: 48, plannedTotalMinutes: 48 })} tours={[tour]} {...railProps} />)
    const facts = screen.getAllByRole('definition').map(value => [value.previousElementSibling?.textContent, value.textContent])
    expect(facts).toEqual(expect.arrayContaining([[expect.stringMatching(/^Running time \(planned\)/), '48 min']]))
    expect(screen.getByRole('button', { name: 'How the running time is planned' })).toHaveAccessibleDescription(
      'Distance × your pace and nothing else: climbs, descents and difficulty are not included. A plan, not a recorded time.'
    )
  })

  it('TOUR-PLANNER-RAIL-RUN-002: the editor asks for the profile and pace, and a point off every runnable way says so', () => {
    const waypoints = [{ id: 'a', lat: 48, lng: 11, role: 'start' as const }, { id: 'b', lat: 48.01, lng: 11.02, role: 'end' as const }]
    render(<TourPlannerRail planner={planner({ ...run, runPaceMissing: true, waypoints, unreachable: { unreachable: 1, snappedMeters: 900 } })} />)
    expect(screen.getByTestId('tour-planner-run-fields')).toBeInTheDocument()
    expect(screen.getByText('Enter your pace to plan the running time and save this run.')).toBeInTheDocument()
    expect(screen.getByTestId('tour-planner-unreachable')).toHaveTextContent('No runnable way reaches point 2')
    expect(screen.getByTestId('tour-planner-unreachable')).toHaveTextContent('900 m')
  })
})

describe('the hike ways card in the planner rails (MAP-03, MAP-04)', () => {
  it('MAP03-RAIL-001: a hike being edited carries the card with its line, whether it is planned now, and its routing limit', () => {
    const { unmount } = render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, routeCurrent: true, maxHikingDifficulty: 3 })} />)
    const card = screen.getByTestId('hike-ways-card')
    expect(card).toHaveAttribute('data-route', '2')
    expect(card).toHaveAttribute('data-current', 'true')
    expect(card).toHaveAttribute('data-limit', '3')
    unmount()
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, routeCurrent: false })} />)
    expect(screen.getByTestId('hike-ways-card')).toHaveAttribute('data-current', 'false')
  })

  it('MAP03-RAIL-002: a hike import carries it without a routing limit; a bike tour and a bike import do not', () => {
    const geometry = JSON.stringify([[48, 11, 500], [48, 11.01, 550], [48, 11.02, 520]])
    const imported = (tourType: 'hike' | 'bike') => planner({
      readOnlyGpxTour: { tour: { ...tour, tour_type: tourType, has_waypoints: false }, routeGeometry: geometry },
      readOnlyGpxAnalysis: analyzeRouteGeometry(geometry),
    })
    const hike = render(<TourPlannerRail planner={imported('hike')} />)
    expect(screen.getByTestId('hike-ways-card')).toHaveAttribute('data-route', '3')
    expect(screen.getByTestId('hike-ways-card')).toHaveAttribute('data-limit', 'null')
    hike.unmount()
    const bikeImport = render(<TourPlannerRail planner={imported('bike')} />)
    expect(screen.queryByTestId('hike-ways-card')).toBeNull()
    bikeImport.unmount()
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, tourType: 'bike', isBike: true, routeCurrent: false })} />)
    expect(screen.queryByTestId('hike-ways-card')).toBeNull()
  })
})
