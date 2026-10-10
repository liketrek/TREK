import { act, useState } from 'react'
import { fireEvent, render, screen, waitFor } from '../../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { resetAllStores, seedStore } from '../../../../tests/helpers/store'
import { useSettingsStore } from '../../../store/settingsStore'
import { analyzeRouteGeometry } from '../../../utils/routeGeometry'
import type { TourPlannerController } from './useTourPlanner'
import type { Day } from '../../../types'
import { TourPlannerRail, TourPlannerToursRail } from './TourPlannerPanels'

vi.mock('../../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in client tests') })
vi.mock('../../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in client tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in client tests') })

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
    canEdit: true,
    canAssign: true,
    isSaving: false,
    maxHikingDifficulty: 2,
    setMaxHikingDifficulty: vi.fn(),
    name: '',
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
  it('disables saved-tour switching and Plan another while a Save is pending', () => {
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
    expect(screen.getByRole('button', { name: 'Plan another' })).toBeDisabled()
  })

  it('TOUR-PLANNER-RAIL-001: shows saved Tours rows and route stats without hiding the safety note in navigation', () => {
    render(<TourPlannerToursRail planner={planner({ mode: { type: 'new-draft' } })} tours={[tour]} {...railProps} />)

    expect(screen.getByRole('complementary', { name: 'Tours of this trip' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveTextContent('TREK')
    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveTextContent('4 km')
    expect(screen.getByText('Ascent')).toBeInTheDocument()
    expect(screen.getByText('50 m')).toBeInTheDocument()
    expect(document.querySelector('svg[viewBox="0 0 440 100"]')).toBeInTheDocument()
    expect(screen.queryByText('Routing is planning assistance, not a safety guarantee.')).not.toBeInTheDocument()
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

    expect(screen.getByRole('status')).toHaveTextContent('Tour saved')
    expect(screen.queryByRole('button', { name: 'Assign to a day' })).not.toBeInTheDocument()
    expect(onAssignToDay).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Plan another' }))
    expect(controller.startNewTour).toHaveBeenCalledOnce()
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
    expect(screen.getByRole('status')).toHaveTextContent('Tour saved')
    expect(screen.queryByRole('button', { name: 'Assign to a day' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to day: Saved ridge walk' })).toBeEnabled()
  })

  it('TOUR-PLANNER-RAIL-004: protects a dirty draft before selecting a GPX Tour', () => {
    const gpxTour = { ...tour, has_waypoints: false }
    const controller = planner({ hasUnsavedChanges: true, mode: { type: 'new-draft' } })
    const onViewGpxTour = vi.fn()
    render(<TourPlannerToursRail planner={controller} tours={[gpxTour]} {...railProps} onViewGpxTour={onViewGpxTour} />)

    expect(screen.getByRole('option', { name: /Saved ridge walk/i })).toHaveTextContent('GPX import')
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
    expect(screen.getByRole('button', { name: 'Save tour' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back to Tours' })).toBeDisabled()
    expect(screen.getAllByLabelText('Move waypoint up')).toHaveLength(2)
    expect(screen.getAllByLabelText('Move waypoint up').every(element => element.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(screen.getAllByLabelText('Move waypoint down').every(element => element.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(screen.getAllByLabelText('Remove waypoint').every(element => element.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('Saving…')
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

    const save = screen.getByRole('button', { name: 'Save tour' })
    expect(save.parentElement?.parentElement).toHaveTextContent('Routing is planning assistance, not a safety guarantee.')
    expect(save).toHaveClass('bg-accent', 'text-accent-text')
    expect(save).toHaveClass('hover:opacity-90')
    const firstNumber = screen.getByLabelText('Waypoint 1')
    const secondNumber = screen.getByLabelText('Waypoint 2')
    expect(firstNumber).toHaveTextContent('1')
    expect(secondNumber).toHaveTextContent('2')
    expect(firstNumber).toHaveAttribute('data-waypoint-number', '1')
    expect(secondNumber).toHaveAttribute('data-waypoint-number', '2')
    expect(firstNumber).toHaveClass('bg-accent', 'text-accent-text', 'font-geist', 'tabular-nums', 'h-7', 'w-7')
    expect(secondNumber).toHaveClass('bg-surface-card', 'text-content', 'font-geist', 'tabular-nums', 'h-7', 'w-7')
  })

  it('TOUR-PLANNER-RAIL-007: acknowledges alpine routing once per planner session', () => {
    const setDifficulty = vi.fn()
    const controller = planner({ mode: { type: 'new-draft' }, setMaxHikingDifficulty: setDifficulty })
    render(<TourPlannerRail planner={controller} />)

    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))
    fireEvent.click(screen.getByRole('button', { name: /T4 — Alpine hiking/ }))
    expect(screen.getByRole('heading', { name: 'Enable alpine routing?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enable alpine routing' }))
    expect(setDifficulty).toHaveBeenCalledWith(4)

    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))
    fireEvent.click(screen.getByRole('button', { name: /T5 — Demanding alpine hiking/ }))
    expect(screen.queryByRole('heading', { name: 'Enable alpine routing?' })).not.toBeInTheDocument()
    expect(setDifficulty).toHaveBeenLastCalledWith(5)
  })

  it('TOUR-PLANNER-RAIL-008: cancelling alpine acknowledgement leaves the setting unchanged', () => {
    const setDifficulty = vi.fn()
    render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, setMaxHikingDifficulty: setDifficulty })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Maximum trail difficulty' }))
    fireEvent.click(screen.getByRole('button', { name: /T4 — Alpine hiking/ }))
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
      'T1 — Hiking',
      'T2 — Mountain hiking',
      'T3 — Demanding mountain hiking',
      'T4 — Alpine hiking',
      'T5 — Demanding alpine hiking',
      'T6 — Difficult alpine hiking',
    ]) expect(screen.getByRole('button', { name: label })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'T3 — Demanding mountain hiking' }))
    expect(setDifficulty).toHaveBeenCalledWith(3)
    expect(screen.getByRole('status')).toHaveTextContent(/T3 routes may include exposed/)
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
    expect(screen.getByTestId('tour-planner-empty-state')).toHaveTextContent('Click the map to add your starting point.')
    expect(screen.getByTestId('tour-planner-empty-state')).toHaveTextContent('Add another point to calculate a route.')
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
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes and start new tour' }))
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

  it('TOUR-PLANNER-RAIL-015: returns from GPX view to the blank editable Planner', () => {
    const controller = planner({
      readOnlyGpxTour: { tour: { ...tour, has_waypoints: false }, routeGeometry: null },
      readOnlyGpxAnalysis: null,
    })
    const { rerender } = render(<TourPlannerRail planner={controller} />)
    expect(screen.getByText('GPX tours are view-only and cannot be edited in the planner yet.')).toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ mode: { type: 'neutral' } })} />)
    expect(screen.getByText('Plan a tour')).toBeInTheDocument()
    expect(screen.queryByText('GPX tours are view-only and cannot be edited in the planner yet.')).not.toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: 'Discard unsaved changes' }))
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
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved draft restored')
    expect(screen.getByRole('heading', { name: 'New tour' })).toBeInTheDocument()

    rerender(<TourPlannerRail planner={planner({ draftRestored: true, hasUnsavedChanges: true, editingPlaceId: tour.place_id, mode: { type: 'edit-saved', placeId: tour.place_id } })} />)
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved draft restored')
    expect(screen.getByRole('heading', { name: 'Edit tour' })).toBeInTheDocument()
  })
})
