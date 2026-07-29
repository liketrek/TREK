import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accommodationsApi } from '../../../../src/api/client'
import MAccommodationSheet from '../../../../src/mobile/screens/trip/sheets/MAccommodationSheet'
import type { Accommodation, Category, Day, Place } from '../../../../src/types'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-ACCSH-001 to FE-MOB-ACCSH-025

// The pickers have their own suites; here they only need to be addressable, so
// they render as plain controls. data-value keeps the requested value readable
// even when it is not one of the offered options.
vi.mock('../../../../src/components/shared/CustomSelect', () => ({
  default: ({ value, onChange, options = [] }: {
    value: string | number
    onChange: (v: string | number) => void
    options?: { value: string | number; label: string }[]
  }) => (
    <select
      data-testid="cselect"
      data-value={String(value ?? '')}
      value={options.some(o => String(o.value) === String(value)) ? String(value) : ''}
      onChange={e => {
        const hit = options.find(o => String(o.value) === e.target.value)
        onChange(hit ? hit.value : e.target.value)
      }}
    >
      <option value="" />
      {options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  ),
}))

vi.mock('../../../../src/components/shared/CustomTimePicker', () => ({
  default: ({ value, onChange, placeholder }: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }) => (
    <input data-testid="ctime" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  ),
}))

const DAYS = [
  { id: 11, trip_id: 5, day_number: 1, date: '2026-05-01', title: null },
  { id: 12, trip_id: 5, day_number: 2, date: '2026-05-02', title: null },
  { id: 13, trip_id: 5, day_number: 3, date: null, title: 'Fly home' },
] as unknown as Day[]

const CATEGORIES = [
  { id: 1, name: 'Hotels', color: '#ff0000' },
  { id: 2, name: 'Food', color: '#00ff00' },
] as unknown as Category[]

const PLACES = [
  { id: 101, name: 'Hotel Sacher', address: 'Philharmonikerstrasse 4', category_id: 1, image_url: '/uploads/sacher.jpg' },
  { id: 102, name: 'Cafe Central', address: null, category_id: 2, image_url: null },
] as unknown as Place[]

const EXISTING = {
  id: 77, trip_id: 5, place_id: 102, start_day_id: 12, end_day_id: 13,
  check_in: '15:00', check_in_end: '18:00', check_out: '10:00', confirmation: 'ABC-1',
} as unknown as Accommodation

function makePlanner(overrides: Record<string, unknown> = {}) {
  return buildPlanner({
    tripId: 5,
    days: DAYS,
    places: PLACES,
    categories: CATEGORIES,
    tripAccommodations: [EXISTING],
    ...overrides,
  } as never)
}

function makeShell(payload: Record<string, unknown> | null = { dayId: 11 }) {
  return buildShell({ sheet: payload === null ? null : { id: 'accommodation', payload } } as never)
}

function setup(planner = makePlanner(), shell = makeShell()) {
  const view = render(<MAccommodationSheet planner={planner} shell={shell} />)
  return { ...view, planner, shell }
}

/** [start, end] of the day-range selects as the component holds them. */
function range(): [string, string] {
  const [start, end] = screen.getAllByTestId('cselect')
  return [start.getAttribute('data-value') ?? '', end.getAttribute('data-value') ?? '']
}

function pickDay(index: 0 | 1, id: number) {
  fireEvent.change(screen.getAllByTestId('cselect')[index], { target: { value: String(id) } })
}

/** Both the day-range chip and the category filter are labelled "All". */
function allChips() {
  return screen.getAllByRole('button', { name: 'All' })
}

function placeRow(name: string) {
  return screen.getByText(name).closest('button') as HTMLButtonElement
}

describe('MAccommodationSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-ACCSH-001: stays closed while another sheet is on top', () => {
    setup(makePlanner(), buildShell({ sheet: { id: 'day', payload: { dayId: 11 } } } as never))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-ACCSH-002: stays closed without any sheet', () => {
    setup(makePlanner(), makeShell(null))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-ACCSH-003: opens in add mode with an empty form and a disabled save', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Add accommodation' })).toBeInTheDocument()
    expect(screen.getByText('Apply to days')).toBeInTheDocument()
    expect(screen.getByText('Select accommodation')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ABC-12345')).toHaveValue('')
    expect(screen.getByPlaceholderText('14:00')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('FE-MOB-ACCSH-004: defaults the range from the opening day to the next one', () => {
    setup()
    expect(range()).toEqual(['11', '12'])
  })

  it('FE-MOB-ACCSH-005: a day that is not in the trip keeps the range on that single day', () => {
    setup(makePlanner(), makeShell({ dayId: 999 }))
    expect(range()).toEqual(['999', '999'])
  })

  it('FE-MOB-ACCSH-006: opening the last day keeps it as its own end', () => {
    setup(makePlanner(), makeShell({ dayId: 13 }))
    expect(range()).toEqual(['13', '13'])
  })

  it('FE-MOB-ACCSH-007: an empty payload falls back to no day at all', () => {
    setup(makePlanner(), makeShell({}))
    expect(range()).toEqual(['0', '0'])
  })

  it('FE-MOB-ACCSH-008: edit mode seeds range, times, code and the linked place', () => {
    setup(makePlanner(), makeShell({ dayId: 12, accId: 77 }))
    expect(screen.getByRole('dialog', { name: 'Edit accommodation' })).toBeInTheDocument()
    expect(range()).toEqual(['12', '13'])
    expect(screen.getByPlaceholderText('14:00')).toHaveValue('15:00')
    expect(screen.getByPlaceholderText('22:00')).toHaveValue('18:00')
    expect(screen.getByPlaceholderText('11:00')).toHaveValue('10:00')
    expect(screen.getByPlaceholderText('ABC-12345')).toHaveValue('ABC-1')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('FE-MOB-ACCSH-009: a stay without any times seeds empty fields', () => {
    const bare = { id: 78, trip_id: 5, place_id: 101, start_day_id: 11, end_day_id: 11 } as unknown as Accommodation
    setup(makePlanner({ tripAccommodations: [bare] }), makeShell({ dayId: 11, accId: 78 }))
    expect(screen.getByPlaceholderText('14:00')).toHaveValue('')
    expect(screen.getByPlaceholderText('ABC-12345')).toHaveValue('')
    expect(range()).toEqual(['11', '11'])
  })

  it('FE-MOB-ACCSH-010: an unknown accommodation id falls back to add mode', () => {
    setup(makePlanner(), makeShell({ dayId: 11, accId: 4242 }))
    expect(screen.getByRole('dialog', { name: 'Add accommodation' })).toBeInTheDocument()
  })

  it('FE-MOB-ACCSH-011: cancel and the header X both return to the day sheet', () => {
    const { shell } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(shell.openSheet).toHaveBeenCalledTimes(2)
    expect(shell.openSheet).toHaveBeenCalledWith('day', { dayId: 11 })
  })

  it('FE-MOB-ACCSH-011b: an edit opened without a dayId returns to the stay\'s start day', () => {
    const { shell } = setup(makePlanner(), makeShell({ accId: 77 }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(shell.openSheet).toHaveBeenCalledWith('day', { dayId: 12 })
  })

  it('FE-MOB-ACCSH-012: the All chip spans the whole trip and reaches the payload', async () => {
    const create = vi.spyOn(accommodationsApi, 'create').mockResolvedValue({})
    setup()
    fireEvent.click(allChips()[0])
    expect(range()).toEqual(['11', '13'])

    fireEvent.click(placeRow('Hotel Sacher'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(create).toHaveBeenCalled())
    expect(create.mock.calls[0][1]).toMatchObject({ start_day_id: 11, end_day_id: 13 })
  })

  it('FE-MOB-ACCSH-013: moving the start past the end drags the end with it', () => {
    setup()
    pickDay(0, 13)
    expect(range()).toEqual(['13', '13'])
  })

  it('FE-MOB-ACCSH-014: moving the end before the start drags the start with it', () => {
    setup(makePlanner(), makeShell({ dayId: 12 }))
    pickDay(1, 11)
    expect(range()).toEqual(['11', '11'])
  })

  it('FE-MOB-ACCSH-015: widening the range leaves the other end alone', () => {
    setup()
    pickDay(1, 13)
    pickDay(0, 12)
    expect(range()).toEqual(['12', '13'])
  })

  it('FE-MOB-ACCSH-016: the category chips filter the place list and All restores it', () => {
    setup()
    expect(screen.getByText('Cafe Central')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hotels' }))
    expect(screen.getByText('Hotel Sacher')).toBeInTheDocument()
    expect(screen.queryByText('Cafe Central')).not.toBeInTheDocument()
    fireEvent.click(allChips()[1])
    expect(screen.getByText('Cafe Central')).toBeInTheDocument()
  })

  it('FE-MOB-ACCSH-017: a category without places shows the empty hint', () => {
    setup(makePlanner({ places: [PLACES[0]] }))
    fireEvent.click(screen.getByRole('button', { name: 'Food' }))
    expect(screen.getByText('Add places to your trip first')).toBeInTheDocument()
  })

  it('FE-MOB-ACCSH-018: without categories there are no filter chips', () => {
    setup(makePlanner({ categories: [] }))
    expect(screen.queryByRole('button', { name: 'Hotels' })).not.toBeInTheDocument()
    expect(allChips()).toHaveLength(1)
  })

  it('FE-MOB-ACCSH-019: renders the place thumbnail when there is one, a pin otherwise', () => {
    setup()
    expect(placeRow('Hotel Sacher').querySelector('img')).toHaveAttribute('src', '/uploads/sacher.jpg')
    expect(screen.getByText('Philharmonikerstrasse 4')).toBeInTheDocument()
    const cafe = placeRow('Cafe Central')
    expect(cafe.querySelector('img')).toBeNull()
    expect(cafe.querySelector('svg')).not.toBeNull()
  })

  it('FE-MOB-ACCSH-020: creating posts the full body, reloads the stays and returns to the day', async () => {
    const create = vi.spyOn(accommodationsApi, 'create').mockResolvedValue({})
    const { planner, shell } = setup()

    fireEvent.change(screen.getByPlaceholderText('14:00'), { target: { value: '15:30' } })
    fireEvent.change(screen.getByPlaceholderText('22:00'), { target: { value: '20:00' } })
    fireEvent.change(screen.getByPlaceholderText('11:00'), { target: { value: '09:45' } })
    fireEvent.change(screen.getByPlaceholderText('ABC-12345'), { target: { value: 'XYZ-9' } })
    fireEvent.click(placeRow('Cafe Central'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(planner.loadAccommodations).toHaveBeenCalled())
    expect(create).toHaveBeenCalledWith(5, {
      place_id: 102,
      start_day_id: 11,
      end_day_id: 12,
      check_in: '15:30',
      check_in_end: '20:00',
      check_out: '09:45',
      confirmation: 'XYZ-9',
    })
    expect(shell.openSheet).toHaveBeenCalledWith('day', { dayId: 11 })
  })

  it('FE-MOB-ACCSH-021: editing updates the existing stay and nulls the cleared fields', async () => {
    const update = vi.spyOn(accommodationsApi, 'update').mockResolvedValue({})
    const { planner } = setup(makePlanner(), makeShell({ dayId: 12, accId: 77 }))

    fireEvent.change(screen.getByPlaceholderText('22:00'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText('ABC-12345'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(planner.loadAccommodations).toHaveBeenCalled())
    expect(update).toHaveBeenCalledWith(5, 77, {
      place_id: 102,
      start_day_id: 12,
      end_day_id: 13,
      check_in: '15:00',
      check_in_end: null,
      check_out: '10:00',
      confirmation: null,
    })
  })

  it('FE-MOB-ACCSH-022: the save button locks while the request is in flight', async () => {
    const deferred = { settle: () => undefined as void }
    vi.spyOn(accommodationsApi, 'create').mockReturnValue(
      new Promise<unknown>(res => { deferred.settle = () => res({}) }),
    )
    setup()
    fireEvent.click(placeRow('Hotel Sacher'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const saving = await screen.findByRole('button', { name: 'Saving...' })
    expect(saving).toBeDisabled()
    await act(async () => { deferred.settle() })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('FE-MOB-ACCSH-024: a trip without days opens on an empty range', () => {
    setup(makePlanner({ days: [] }), makeShell({}))
    expect(range()).toEqual(['0', '0'])
    fireEvent.click(allChips()[0])
    expect(range()).toEqual(['0', '0'])
  })

  it('FE-MOB-ACCSH-025: a day with neither date nor title is still numbered in the range', () => {
    const bareDays = [{ id: 21, trip_id: 5, day_number: 1, date: null, title: null }] as unknown as Day[]
    setup(makePlanner({ days: bareDays }), makeShell({ dayId: 21 }))
    expect(screen.getAllByRole('option', { name: 'Day 1' }).length).toBeGreaterThan(0)
  })

  it('FE-MOB-ACCSH-023: a failing save toasts, keeps the sheet open and re-enables Save', async () => {
    vi.spyOn(accommodationsApi, 'create').mockRejectedValue(new Error('boom'))
    const { planner, shell } = setup()

    fireEvent.click(placeRow('Hotel Sacher'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Error'))
    expect(planner.loadAccommodations).not.toHaveBeenCalled()
    expect(shell.openSheet).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
