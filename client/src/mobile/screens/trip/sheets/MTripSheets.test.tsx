import { fireEvent, render, screen } from '../../../../../tests/helpers/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { buildPlace } from '../../../../../tests/helpers/factories'
import { resetAllStores, seedStore } from '../../../../../tests/helpers/store'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { TripPlanner } from '../MTripShell'
import { MSelectedTourDetail } from './MTripSheets'

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

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

describe('MSelectedTourDetail', () => {
  it('is the single mobile modal owner for Escape, focus containment, scroll lock and focus return', () => {
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

    expect(screen.getAllByText('Track Stats')).toHaveLength(1)
    expect(document.querySelector('#tour-elevation-42')).toBeInTheDocument()
  })

  it('renders nothing for an ordinary selected place', () => {
    render(<MSelectedTourDetail planner={planner({ selectedTour: null })} />)

    expect(screen.queryByText('Track Stats')).not.toBeInTheDocument()
  })
})