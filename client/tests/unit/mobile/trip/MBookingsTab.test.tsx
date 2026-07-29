import { beforeEach, describe, expect, it, vi } from 'vitest'
import MBookingsTab from '../../../../src/mobile/screens/trip/tabs/MBookingsTab'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { openFile } from '../../../../src/utils/fileDownload'
import type { Day, Reservation, TripFile } from '../../../../src/types'
import { buildSettings } from '../../../helpers/factories'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-BKTAB-001 to FE-MOB-BKTAB-018

vi.mock('../../../../src/utils/fileDownload', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../../src/utils/fileDownload')>()),
  openFile: vi.fn(),
}))

const DAYS = [
  { id: 1, trip_id: 7, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 7, day_number: 2, date: '2026-05-02', title: 'Kyoto' },
] as unknown as Day[]

const MEMBERS = [
  { id: 1, username: 'Me', avatar_url: null },
  { id: 2, username: 'Ada', avatar_url: null },
]

/** Stay: the day range comes from the accommodation link, not day_id. */
const HOTEL = {
  id: 201, trip_id: 7, type: 'hotel', status: 'confirmed', title: 'Hotel Granvia',
  accommodation_start_day_id: 1, accommodation_end_day_id: 2,
  confirmation_number: 'HG-77', location: 'Kyoto Station', notes: 'Ask for a high floor',
  metadata: JSON.stringify({ check_in_time: '15:00', check_in_end_time: '18:00', check_out_time: '11:00' }),
} as unknown as Reservation

const DINNER = {
  id: 202, trip_id: 7, type: 'restaurant', status: 'confirmed', title: 'Sushi Saito',
  day_id: 2, reservation_time: '2026-05-02T19:30', reservation_end_time: '2026-05-02T21:00',
  travelers: [{ user_id: 2, username: 'Ada', avatar: null }],
} as unknown as Reservation

/** Starts and ends on the same day — the range suffix has to stay off. */
const SHOW = {
  id: 203, trip_id: 7, type: 'event', status: 'pending', title: 'Kabuki show',
  day_id: 2, end_day_id: 2, needs_review: 1,
  metadata: JSON.stringify({ departure_airport: 'Gion', platform: 'Gate 3', seat: 'B12', price: 40, priceCurrency: 'JPY' }),
} as unknown as Reservation

/** Endpoints present, so the airport meta cells are suppressed and only the price stays. */
const TOUR = {
  id: 204, trip_id: 7, type: 'tour', status: 'pending', title: 'Bamboo walk',
  metadata: JSON.stringify({ departure_airport: 'Arashiyama', arrival_airport: 'Saga', price: 30, priceCurrency: 'JPY' }),
  endpoints: [
    { role: 'from', sequence: 0, name: 'Arashiyama' },
    { role: 'to', sequence: 1, name: 'Saga' },
  ],
} as unknown as Reservation

const FLIGHT = {
  id: 205, trip_id: 7, type: 'flight', status: 'confirmed', title: 'HND to ITM', day_id: 1,
} as unknown as Reservation

const FILES = [
  { id: 301, trip_id: 7, reservation_id: 202, original_name: 'voucher.pdf', url: '/uploads/f/301' },
  { id: 302, trip_id: 7, reservation_id: 202, original_name: 'stale.pdf', url: '/uploads/f/302', deleted_at: '2026-01-01' },
] as unknown as TripFile[]

const ALL = [HOTEL, DINNER, SHOW, TOUR, FLIGHT]

function planner(overrides: Partial<TripPlanner> = {}) {
  return buildPlanner({
    tripId: 7,
    days: DAYS,
    reservations: ALL,
    files: FILES,
    tripMembers: MEMBERS as unknown as TripPlanner['tripMembers'],
    settings: buildSettings({ time_format: '24h' }),
    ...overrides,
  })
}

function renderTab(p: TripPlanner = planner(), shell: MTripShellApi = buildShell()) {
  const view = render(<MBookingsTab planner={p} shell={shell} />)
  return { ...view, planner: p, shell }
}

function cardOf(title: string): HTMLElement {
  let el = screen.getByText(title).parentElement
  while (el && !el.className.includes('rounded-2xl')) el = el.parentElement
  if (!el) throw new Error(`no card for ${title}`)
  return el
}

describe('MBookingsTab', () => {
  beforeEach(() => {
    vi.mocked(openFile).mockClear()
  })

  it('FE-MOB-BKTAB-001: keeps only the non-transport reservations, split by status', () => {
    renderTab()
    expect(screen.getByRole('button', { name: 'reservations.confirmed2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'reservations.pending2' })).toBeInTheDocument()
    expect(screen.queryByText('HND to ITM')).not.toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-002: sorts chronologically and sinks the undated booking', () => {
    renderTab()
    const titles = screen.getAllByText(/Hotel Granvia|Sushi Saito|Kabuki show|Bamboo walk/).map(n => n.textContent)
    expect(titles).toEqual(['Hotel Granvia', 'Sushi Saito', 'Kabuki show', 'Bamboo walk'])
  })

  it('FE-MOB-BKTAB-003: collapses a section', () => {
    renderTab()
    const header = screen.getByRole('button', { name: 'reservations.pending2' })
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Kabuki show')).not.toBeInTheDocument()
    expect(screen.getByText('Hotel Granvia')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-004: shows the mascot empty state when only transports exist', () => {
    renderTab(planner({ reservations: [FLIGHT] }))
    expect(screen.getByText('mobileTrip.bookingsEmpty')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-005: spans the stay over the accommodation day range', () => {
    renderTab()
    const card = cardOf('Hotel Granvia')
    expect(within(card).getByText('dayplan.dayN:1 – Kyoto')).toBeInTheDocument()
    expect(within(card).getByText('—')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-006: renders check-in window and check-out for a stay', () => {
    renderTab()
    const card = cardOf('Hotel Granvia')
    expect(within(card).getByText('reservations.meta.checkIn')).toBeInTheDocument()
    expect(within(card).getByText('15:00 – 18:00')).toBeInTheDocument()
    expect(within(card).getByText('reservations.meta.checkOut')).toBeInTheDocument()
    expect(within(card).getByText('11:00')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-007: renders location, notes and the confirmation code of a stay', () => {
    renderTab()
    const card = cardOf('Hotel Granvia')
    expect(within(card).getByText('Kyoto Station')).toBeInTheDocument()
    expect(within(card).getByText('Ask for a high floor')).toBeInTheDocument()
    expect(within(card).getByText('HG-77')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-008: renders the booking time range, travelers and files', () => {
    renderTab()
    const card = cardOf('Sushi Saito')
    expect(within(card).getByText('Kyoto')).toBeInTheDocument()
    expect(within(card).getByText('19:30 – 21:00')).toBeInTheDocument()
    expect(within(card).getByText('reservations.travelers.label')).toBeInTheDocument()
    expect(within(card).getByText('Ada')).toBeInTheDocument()
    expect(within(card).getByText('voucher.pdf')).toBeInTheDocument()
    expect(within(card).queryByText('stale.pdf')).not.toBeInTheDocument()
    fireEvent.click(within(card).getByText('voucher.pdf'))
    expect(openFile).toHaveBeenCalledWith('/uploads/f/301', 'voucher.pdf')
  })

  it('FE-MOB-BKTAB-009: drops the day-range suffix when start and end day are the same', () => {
    renderTab()
    const card = cardOf('Kabuki show')
    expect(within(card).getByText('Kyoto')).toBeInTheDocument()
    expect(within(card).getByText('reservations.needsReview')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-010: caps the meta row at three cells', () => {
    renderTab()
    const card = cardOf('Kabuki show')
    expect(within(card).getByText('Gion')).toBeInTheDocument()
    expect(within(card).getByText('Gate 3')).toBeInTheDocument()
    expect(within(card).getByText('B12')).toBeInTheDocument()
    expect(within(card).queryByText('reservations.price')).not.toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-011: suppresses the airport cells when endpoints exist and keeps the price', () => {
    renderTab()
    const card = cardOf('Bamboo walk')
    expect(within(card).queryByText('reservations.meta.from')).not.toBeInTheDocument()
    expect(within(card).getByText('reservations.price')).toBeInTheDocument()
    expect(within(card).getByText('30 JPY')).toBeInTheDocument()
    expect(within(card).getAllByText('—')).toHaveLength(2)
  })

  it('FE-MOB-BKTAB-012: opens the reservation editor from the row', () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(screen.getByText('Sushi Saito'))
    expect(p.can).toHaveBeenCalledWith('reservation_edit', p.trip)
    expect(p.setEditingReservation).toHaveBeenCalledWith(expect.objectContaining({ id: 202 }))
    expect(p.setShowReservationModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-BKTAB-013: opens the same editor from the pencil', () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('Hotel Granvia')).getByRole('button', { name: 'common.edit' }))
    expect(p.setEditingReservation).toHaveBeenCalledWith(expect.objectContaining({ id: 201 }))
  })

  it('FE-MOB-BKTAB-014: a read-only member gets no editor and no actions', () => {
    const p = planner({ can: vi.fn(() => false) as unknown as TripPlanner['can'] })
    renderTab(p)
    fireEvent.click(screen.getByText('Sushi Saito'))
    expect(p.setShowReservationModal).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-015: deletes after confirming', async () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('Sushi Saito')).getByRole('button', { name: 'common.delete' }))
    const dialog = screen.getByRole('dialog', { name: 'reservations.confirm.deleteTitle' })
    expect(within(dialog).getByText('reservations.confirm.deleteBody:Sushi Saito')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByText('common.delete'))
    await waitFor(() => expect(p.handleDeleteReservation).toHaveBeenCalledWith(202))
    expect(p.toast.error).not.toHaveBeenCalled()
  })

  it('FE-MOB-BKTAB-016: toasts when the delete rejects', async () => {
    const p = planner({
      handleDeleteReservation: vi.fn(() => Promise.reject(new Error('boom'))) as unknown as TripPlanner['handleDeleteReservation'],
    })
    renderTab(p)
    fireEvent.click(within(cardOf('Sushi Saito')).getByRole('button', { name: 'common.delete' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('common.delete'))
    await waitFor(() => expect(p.toast.error).toHaveBeenCalledWith('reservations.toast.deleteError'))
  })

  it('FE-MOB-BKTAB-017: compact mode drops the card bodies', () => {
    renderTab(planner(), buildShell({ bookingsCompact: true }))
    expect(screen.getByText('Hotel Granvia')).toBeInTheDocument()
    expect(screen.queryByText('HG-77')).not.toBeInTheDocument()
    expect(screen.queryByText('Kyoto Station')).not.toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-018: blurs the confirmation code until its button is used', () => {
    renderTab(planner({ settings: buildSettings({ time_format: '24h', blur_booking_codes: true }) }))
    // A button, not a bare div — the reveal has to be reachable by keyboard.
    const code = within(cardOf('Hotel Granvia')).getByRole('button', { name: 'HG-77' })
    expect(code).toHaveClass('blur-[4px]')
    fireEvent.click(code)
    expect(code).not.toHaveClass('blur-[4px]')
    expect(code).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-BKTAB-019: filters the list by assigned traveler', () => {
    renderTab()
    const ada = screen.getByTitle('Ada')
    fireEvent.click(ada)
    expect(screen.getByText('Sushi Saito')).toBeInTheDocument()
    expect(screen.queryByText('Hotel Granvia')).not.toBeInTheDocument()
    fireEvent.click(ada)
    expect(screen.getByText('Hotel Granvia')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-020: cancelling the confirm keeps the booking', () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('Sushi Saito')).getByRole('button', { name: 'common.delete' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('common.cancel'))
    expect(p.handleDeleteReservation).not.toHaveBeenCalled()
    expect(screen.getByText('Sushi Saito')).toBeInTheDocument()
  })

  it('FE-MOB-BKTAB-021: falls back for an unknown type and formats a dateless booking', () => {
    const SPA = {
      id: 206, trip_id: 7, type: 'spa', status: 'confirmed', title: 'Onsen visit',
      reservation_time: '2026-06-15T09:00',
      metadata: JSON.stringify({ arrival_airport: 'Hakone', check_in_time: '09:00' }),
    } as unknown as Reservation
    renderTab(planner({
      reservations: [SPA],
      files: undefined as unknown as TripPlanner['files'],
      settings: { ...buildSettings(), time_format: '' },
    }))
    const card = cardOf('Onsen visit')
    expect(within(card).getByText('reservations.type.spa')).toBeInTheDocument()
    expect(within(card).getByText('Jun 15')).toBeInTheDocument()
    expect(within(card).getByText('reservations.meta.to')).toBeInTheDocument()
    expect(within(card).getByText('Hakone')).toBeInTheDocument()
    // the check-in cell and the time field both read 09:00
    expect(within(card).getAllByText('09:00')).toHaveLength(2)
  })
})
