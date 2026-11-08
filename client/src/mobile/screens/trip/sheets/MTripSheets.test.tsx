import { fireEvent, render, screen } from '../../../../../tests/helpers/render'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { buildPlace } from '../../../../../tests/helpers/factories'
import { resetAllStores, seedStore } from '../../../../../tests/helpers/store'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { TripPlanner } from '../MTripShell'
import { MSelectedTourDetail } from './MTripSheets'
import { _pinSizeClass } from '../../../../hooks/sizeClass'

const place = buildPlace({
  id: 42,
  name: 'Ridge walk',
  route_geometry: JSON.stringify([
    [48, 11, 500],
    [48, 11.01, 550],
    [48, 11.03, 520],
  ]),
})

const tour: TourListItem = {
  place_id: place.id,
  name: place.name,
  tour_type: 'hike',
  distance: 999,
  elevation_gain: 999,
  elevation_loss: 999,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

function planner(overrides: Partial<TripPlanner> = {}): TripPlanner {
  return {
    selectedPlace: place,
    selectedTour: tour,
    selectedDayId: null,
    selectedAssignmentId: null,
    assignments: {},
    days: [],
    files: [],
    tripId: 7,
    can: vi.fn<TripPlanner['can']>((actionKey) => actionKey === 'day_edit'),
    canUploadFiles: false,
    setSelectedPlaceId: vi.fn(),
    reloadTourPlaceIds: vi.fn().mockResolvedValue(undefined),
    tripActions: {
      updatePlace: vi.fn().mockResolvedValue(undefined),
      addFile: vi.fn().mockResolvedValue(undefined),
    },
    handleAssignToDay: vi.fn(),
    handleRemoveAssignment: vi.fn(),
    handleDeletePlace: vi.fn(),
    ...overrides,
  } as unknown as TripPlanner
}

afterEach(() => {
  _pinSizeClass(null)
})

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

describe('MSelectedTourDetail', () => {
  it('shows the tour in a mobile sheet that owns Escape, focus containment, scroll lock and focus return', () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open mobile Tour'
    document.body.appendChild(opener)
    opener.focus()
    const setSelectedPlaceId = vi.fn()
    const view = render(<MSelectedTourDetail planner={planner({ setSelectedPlaceId })} />)

    const dialog = screen.getByRole('dialog', { name: 'Ridge walk' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.querySelectorAll('[aria-modal="true"]')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(dialog)
    expect(fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })).toBe(false)

    const nestedSheet = document.createElement('div')
    nestedSheet.dataset.mSheet = 'open'
    document.body.appendChild(nestedSheet)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(setSelectedPlaceId).not.toHaveBeenCalled()
    document.body.removeChild(nestedSheet)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(setSelectedPlaceId).toHaveBeenCalledWith(null)
    view.unmount()
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).not.toBe('hidden')
    document.body.removeChild(opener)
  })

  it('renders the selected tour through the shared detail dialog and elevation profile', () => {
    render(<MSelectedTourDetail planner={planner()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(document.querySelector('#tour-elevation-42')).toBeInTheDocument()
  })

  it('renders nothing for an ordinary selected place', () => {
    render(<MSelectedTourDetail planner={planner({ selectedTour: null })} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('#tour-elevation-42')).not.toBeInTheDocument()
  })

  it('FE-MOB-TOURDETAIL-001: the phone reads the tour, with no way to rename it', () => {
    render(<MSelectedTourDetail planner={planner({ can: vi.fn<TripPlanner['can']>(() => true) })} />)

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('FE-MOB-TOURDETAIL-002: an iPad edits the tour as the desktop card does, through the shared actions', async () => {
    _pinSizeClass('wide')
    const p = planner({ can: vi.fn<TripPlanner['can']>(() => true) })
    render(<MSelectedTourDetail planner={p} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const field = screen.getByRole('textbox', { name: 'Name' })
    fireEvent.change(field, { target: { value: 'Ridge walk long' } })
    fireEvent.keyDown(field, { key: 'Enter' })

    await vi.waitFor(() => expect(p.tripActions.updatePlace).toHaveBeenCalledWith(7, 42, { name: 'Ridge walk long' }))
    await vi.waitFor(() => expect(p.reloadTourPlaceIds).toHaveBeenCalled())
  })

  it('FE-MOB-TOURDETAIL-003: on an iPad a member who may not edit places still only reads', () => {
    _pinSizeClass('split')
    render(<MSelectedTourDetail planner={planner()} />)

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })
})
