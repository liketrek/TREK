import { render, screen } from '../../../../../tests/helpers/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import en from '@trek/shared/i18n/en'
import de from '@trek/shared/i18n/de'
import { resetAllStores, seedStore } from '../../../../../tests/helpers/store'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { TripPlanner, MTripShellApi } from '../MTripShell'
import MToursSelectionList from './MToursSelectionList'

const tour: TourListItem = {
  place_id: 42,
  name: 'Camping tour with a deliberately long readable name',
  tour_type: 'hike',
  distance: 12.5,
  elevation_gain: 420,
  elevation_loss: 390,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  has_waypoints: true,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

const reloadTourPlaceIds = vi.fn().mockResolvedValue(undefined)
const handlePlaceClick = vi.fn()
const openSheet = vi.fn()

function planner(): TripPlanner {
  return {
    t: (key: string) => {
      const value = en[key]
      return typeof value === 'string' ? value : key
    },
    tripId: 7,
    tours: [tour],
    selectedPlaceId: null,
    selectedPlace: null,
    selectedTour: null,
    selectedDayId: null,
    selectedAssignmentId: null,
    assignments: {},
    days: [],
    files: [],
    canUploadFiles: false,
    reloadTourPlaceIds,
    handlePlaceClick,
  } as unknown as TripPlanner
}

function shell(sheet: MTripShellApi['sheet'] = null): MTripShellApi {
  return {
    sheet,
    openSheet,
  } as unknown as MTripShellApi
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

describe('MToursSelectionList', () => {
  it('shows German ADD, difficulty and empty-state text without raw Tours keys', () => {
    const germanPlanner = { ...planner(), t: (key: string) => {
      const value = de[key] ?? en[key]
      return typeof value === 'string' ? value : key
    } }
    const { rerender } = render(<MToursSelectionList planner={germanPlanner} shell={shell()} filter="all" />)

    expect(screen.getByRole('button', { name: 'Zum Tag hinzufügen' })).toBeInTheDocument()
    expect(screen.getByTitle('T2 – Bergwandern')).toHaveAttribute('aria-label', 'T2 – Bergwandern')
    expect(screen.getByText(germanPlanner.t('tours.planner.mobileHint'))).toBeInTheDocument()
    rerender(<MToursSelectionList planner={{ ...germanPlanner, tours: [] }} shell={shell()} filter="all" />)
    expect(screen.getByText('Noch keine Touren')).toBeInTheDocument()
    expect(screen.getByText(germanPlanner.t('tours.empty.body'))).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\btours\.[a-zA-Z]/)
  })

  it('gives a tour name the full row and up to two lines', () => {
    render(<MToursSelectionList planner={planner()} shell={shell()} filter="all" />)

    const name = screen.getByText(tour.name)
    expect(name).toHaveClass('line-clamp-2', 'break-words')
    expect(name).toHaveAttribute('title', tour.name)
    expect(name).not.toHaveClass('truncate')
  })

  it('keeps the mobile TRIP-PLAN Tours browse list limited to viewing and assignment', () => {
    const { container } = render(<MToursSelectionList planner={{ ...planner(), selectedPlaceId: tour.place_id }} shell={shell()} filter="all" canEdit canAssign />)
    expect(screen.getByRole('option', { name: new RegExp(tour.name) })).toHaveAttribute('aria-selected', 'true')
    const metrics = screen.getByTestId('mobile-tour-metrics')
    expect(metrics).toHaveTextContent('12.5 km')
    expect(metrics).toHaveTextContent('420 m')
    expect(metrics).toHaveTextContent('390 m')
    for (const metric of metrics.children) expect(metric).toHaveClass('whitespace-nowrap')
    expect(metrics.children[0].getAttribute('aria-label')).toContain('12.5 km')
    expect(metrics.children[1].getAttribute('aria-label')).toContain('420 m')
    expect(metrics.children[2].getAttribute('aria-label')).toContain('390 m')
    expect(screen.getByText('TREK')).toBeInTheDocument()
    expect(screen.getByTitle(en['tours.planner.difficulty.t2'] as string)).toHaveAttribute('aria-label', en['tours.planner.difficulty.t2'])
    const add = screen.getByRole('button', { name: 'Add to day' })
    expect(add).toHaveClass('w-full')
    add.click()
    expect(openSheet).toHaveBeenCalledWith('bract', { placeId: tour.place_id, dayPicker: true })
    expect(container.querySelector('[data-testid="mobile-tour-metrics"]')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('keeps a long German name and source/difficulty labels intact', () => {
    const germanPlanner = {
      ...planner(),
      tours: [{ ...tour, name: 'Eine sehr lange deutsche Wanderung durch das abgelegene Gebirge', has_waypoints: false }],
      t: (key: string) => {
        const value = de[key] ?? en[key]
        return typeof value === 'string' ? value : key
      },
    }
    render(<MToursSelectionList planner={germanPlanner} shell={shell()} filter="all" />)
    expect(screen.getByRole('option', { name: /Eine sehr lange deutsche Wanderung/ })).toBeInTheDocument()
    expect(screen.getByText('GPX-Import')).toBeInTheDocument()
    expect(screen.getByLabelText('T2 – Bergwandern')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zum Tag hinzufügen' })).toHaveClass('w-full')
  })

  it('does not refresh Tours merely because the mobile assignment sheet closes', () => {
    const { rerender } = render(<MToursSelectionList planner={planner()} shell={shell({ id: 'bract' })} filter="all" />)

    rerender(<MToursSelectionList planner={planner()} shell={shell()} filter="all" />)

    expect(reloadTourPlaceIds).not.toHaveBeenCalled()
  })
})
