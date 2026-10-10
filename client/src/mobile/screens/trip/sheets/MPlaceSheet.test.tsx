import { render, screen } from '../../../../../tests/helpers/render'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPlace } from '../../../../../tests/helpers/factories'
import type { TripPlanner, MTripShellApi } from '../MTripShell'
import MPlaceSheet from './MPlaceSheet'

vi.mock('../../../components/MSheet', () => ({
  default: ({ open, children, ariaLabel }: { open: boolean; children?: ReactNode; ariaLabel?: string }) => (
    <div data-testid="mobile-place-sheet" data-open={String(open)}>{open && <div role="dialog" aria-label={ariaLabel}>{children}</div>}</div>
  ),
}))

const place = buildPlace({ id: 42, name: 'Ridge walk' })

function planner(overrides: Partial<TripPlanner> = {}): TripPlanner {
  return {
    selectedPlace: place,
    selectedTour: null,
    toursEnabled: false,
    tourDataReady: false,
    can: () => false,
    trip: {},
    categories: [],
    days: [],
    assignments: {},
    selectedDayId: null,
    selectedAssignmentId: null,
    reservations: [],
    files: [],
    tripMembers: [],
    language: 'en',
    isTourPlace: () => false,
    canUploadFiles: false,
    ...overrides,
  } as unknown as TripPlanner
}

const shell = {} as MTripShellApi

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MPlaceSheet tour exclusion', () => {
  it('keeps ordinary place details open when Tours is off', () => {
    render(<MPlaceSheet planner={planner()} shell={shell} />)

    expect(screen.getByTestId('mobile-place-sheet')).toHaveAttribute('data-open', 'true')
  })

  it('waits for the Tours facet before choosing a detail surface', () => {
    render(<MPlaceSheet planner={planner({ toursEnabled: true, tourDataReady: false })} shell={shell} />)

    expect(screen.getByTestId('mobile-place-sheet')).toHaveAttribute('data-open', 'false')
  })

  it('does not open underneath the purpose-built dialog for a selected tour', () => {
    render(<MPlaceSheet planner={planner({
      toursEnabled: true,
      tourDataReady: true,
      selectedTour: { place_id: place.id } as TripPlanner['selectedTour'],
    })} shell={shell} />)

    expect(screen.getByTestId('mobile-place-sheet')).toHaveAttribute('data-open', 'false')
  })

  it('opens for an ordinary place after the Tours facet is ready', () => {
    render(<MPlaceSheet planner={planner({ toursEnabled: true, tourDataReady: true })} shell={shell} />)

    expect(screen.getByTestId('mobile-place-sheet')).toHaveAttribute('data-open', 'true')
  })

  it('keeps a dormant facet-backed Tour view-only while retaining day assignment controls', () => {
    const tourPlace = buildPlace({ id: 42, name: 'Ridge walk', route_geometry: '[[48,11,500],[48.01,11.01,510]]', image_url: '/uploads/cover.jpg' })
    const plannerWithTour = planner({
      selectedPlace: tourPlace,
      toursEnabled: false,
      can: (permission: string) => permission === 'place_edit' || permission === 'day_edit',
      isTourPlace: (placeId: number) => placeId === tourPlace.id,
      days: [{ id: 7, day_number: 1, title: 'Day 1' } as never],
      selectedDayId: 7,
      selectedAssignmentId: 8,
      assignments: { '7': [{ id: 8, day_id: 7, place: tourPlace, route_excluded: false }] as never },
      tripActions: {
        uploadPlaceImage: vi.fn(), updatePlace: vi.fn(), addFile: vi.fn(),
        setAssignmentRouteExcluded: vi.fn(),
      } as never,
      canUploadFiles: true,
    })
    render(<MPlaceSheet planner={plannerWithTour} shell={shell} />)

    expect(screen.getByRole('dialog', { name: 'Ridge walk' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.upload' })).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'places.yourRating' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'dayplan.excludeFromRoute' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove from Day' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'inspector.addToDay' })).not.toBeInTheDocument()
  })
})
