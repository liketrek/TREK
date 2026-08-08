import { beforeEach, describe, expect, it, vi } from 'vitest'
import MBrowseActionsSheet from '../../../../src/mobile/screens/trip/sheets/MBrowseActionsSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAddonStore } from '../../../../src/store/addonStore'
import { useSaveToCollectionStore } from '../../../../src/store/saveToCollectionStore'
import type { Day, Place } from '../../../../src/types'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-BRACT-001 to FE-MOB-BRACT-013
// This sheet reads its labels from the real TranslationProvider, so the
// assertions use the English copy rather than the planner's echo `t`.

const PLACE = {
  id: 77, trip_id: 5, name: 'Teamlab Planets', address: '6-chome Toyosu, Koto City',
  description: 'Digital art museum', lat: 35.65, lng: 139.79, category_id: 3,
} as unknown as Place

const DAYS = [
  { id: 1, trip_id: 5, day_number: 1, date: '2026-04-02', title: null },
  { id: 2, trip_id: 5, day_number: 2, date: '2026-04-03', title: 'Tokyo Bay' },
] as unknown as Day[]

function setup(plannerOverrides: Partial<TripPlanner> = {}, shellOverrides: Partial<MTripShellApi> = {}) {
  const planner = buildPlanner({ places: [PLACE], days: DAYS, ...plannerOverrides })
  const shell = buildShell({ sheet: { id: 'bract', payload: { placeId: 77 } }, ...shellOverrides })
  const view = render(<MBrowseActionsSheet planner={planner} shell={shell} />)
  return { ...view, planner, shell }
}

function enableCollections() {
  seedStore(useAddonStore, { addons: [{ id: 'collections', enabled: true }], loaded: true })
}

describe('MBrowseActionsSheet', () => {
  beforeEach(() => {
    resetAllStores()
    useSaveToCollectionStore.setState({ target: null, version: 0 })
  })

  it('FE-MOB-BRACT-001: renders nothing while another sheet id is active', () => {
    setup({}, { sheet: { id: 'mehr' } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-BRACT-002: renders nothing when the payload points at an unknown place', () => {
    setup({ places: [] })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-BRACT-003: heads the card with the place name and address', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Teamlab Planets' })).toBeInTheDocument()
    expect(screen.getByText('6-chome Toyosu, Koto City')).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-004: falls back to the description when there is no address', () => {
    setup({ places: [{ ...PLACE, address: null } as unknown as Place] })
    expect(screen.getByText('Digital art museum')).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-005: omits the subline when the place carries neither', () => {
    setup({ places: [{ ...PLACE, address: null, description: null } as unknown as Place] })
    expect(screen.queryByText('Digital art museum')).not.toBeInTheDocument()
    expect(screen.getByText('Teamlab Planets')).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-006: view details closes the sheet and opens the place', () => {
    const { planner, shell } = setup()
    fireEvent.click(screen.getByRole('button', { name: /View details/ }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.handlePlaceClick).toHaveBeenCalledWith(77)
  })

  it('FE-MOB-BRACT-007: edit hands the place to the planner editor', () => {
    const { planner, shell } = setup()
    fireEvent.click(screen.getByRole('button', { name: /^Edit/ }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.openPlaceEditor).toHaveBeenCalledWith(PLACE)
  })

  it('FE-MOB-BRACT-008: the collection row stays hidden while the addon is off', () => {
    setup()
    expect(screen.queryByRole('button', { name: /Save to Collection/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-BRACT-008b: saving to a collection hands the full place target to the picker', () => {
    enableCollections()
    const { shell } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Save to Collection/ }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(useSaveToCollectionStore.getState().target).toMatchObject({
      name: 'Teamlab Planets', source_trip_id: 5, source_place_id: 77, lat: 35.65, lng: 139.79, category_id: 3,
    })
  })

  it('FE-MOB-BRACT-009: the day list is collapsed by default and expands on tap', () => {
    setup()
    const toggle = screen.getByRole('button', { name: /Add to a day\?/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: /Tokyo Bay/ })).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Day 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tokyo Bay/ })).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-010: the quick-add payload opens with the day list already expanded and dated', () => {
    const { planner, shell } = setup({}, { sheet: { id: 'bract', payload: { placeId: 77, dayPicker: true } } })
    expect(screen.getByRole('button', { name: /Add to a day\?/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Thu, Apr 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Tokyo Bay/ }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.handleAssignToDay).toHaveBeenCalledWith(77, 2)
  })

  it('FE-MOB-BRACT-011: numbers an untitled, undated day by its position when day_number is missing or zero', () => {
    const days = [
      { id: 9, trip_id: 5, day_number: null, date: null, title: null },
      { id: 10, trip_id: 5, day_number: 0, date: null, title: null },
    ] as unknown as Day[]
    setup({ days }, { sheet: { id: 'bract', payload: { placeId: 77, dayPicker: true } } })
    expect(screen.getByRole('button', { name: 'Day 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day 2' })).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-012: delete routes through the planner confirm flow', () => {
    const { planner, shell } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.handleDeletePlace).toHaveBeenCalledWith(77)
  })

  it('FE-MOB-BRACT-013: a read-only member only keeps the view row', () => {
    enableCollections()
    setup({ can: vi.fn(() => false) })
    expect(screen.getByRole('button', { name: /View details/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add to a day\?/ })).not.toBeInTheDocument()
    // Saving to a personal collection is not a trip edit — it stays.
    expect(screen.getByRole('button', { name: /Save to Collection/ })).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-014: hides the day section for a trip without days', () => {
    setup({ days: [] })
    expect(screen.queryByRole('button', { name: /Add to a day\?/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-BRACT-015: keeps the card content while the sheet plays its exit animation', () => {
    const planner = buildPlanner({ places: [PLACE], days: DAYS })
    const shell = buildShell({ sheet: { id: 'bract', payload: { placeId: 77 } } })
    const { rerender } = render(<MBrowseActionsSheet planner={planner} shell={shell} />)
    expect(screen.getByText('Teamlab Planets')).toBeInTheDocument()

    // The place vanishes from the pool the moment it is deleted — the held
    // snapshot keeps the card readable until the sheet has faded out.
    rerender(<MBrowseActionsSheet planner={buildPlanner({ places: [], days: DAYS })} shell={shell} />)
    expect(screen.getByText('Teamlab Planets')).toBeInTheDocument()
  })

  it('FE-MOB-BRACT-016: checks the permissions against the trip in context', () => {
    const can = vi.fn(() => true)
    const { planner } = setup({ can })
    expect(can).toHaveBeenCalledWith('place_edit', planner.trip)
    expect(can).toHaveBeenCalledWith('day_edit', planner.trip)
  })
})
