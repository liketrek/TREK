import { beforeEach, describe, expect, it, vi } from 'vitest'
import MTransportsTab from '../../../../src/mobile/screens/trip/tabs/MTransportsTab'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { openFile } from '../../../../src/utils/fileDownload'
import type { Day, Reservation, TripFile } from '../../../../src/types'
import { buildSettings } from '../../../helpers/factories'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-TRTAB-001 to FE-MOB-TRTAB-022

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
  { id: 2, username: 'Ada', avatar_url: '/uploads/avatars/ada.png' },
]

/** Endpoints deliberately out of sequence — orderedEndpoints has to sort them. */
const FLIGHT = {
  id: 101, trip_id: 7, type: 'flight', status: 'confirmed', title: 'HND to ITM',
  day_id: 1, reservation_time: '2026-05-01T08:30', reservation_end_time: '2026-05-01T11:45',
  confirmation_number: 'ABC123',
  metadata: JSON.stringify({ airline: 'ANA', flight_number: 'NH203', departure_airport: 'HND', arrival_airport: 'ITM' }),
  endpoints: [
    { role: 'to', sequence: 1, name: 'Osaka Itami' },
    { role: 'from', sequence: 0, name: 'Tokyo Haneda' },
  ],
  travelers: [{ user_id: 2, username: 'Ada', avatar: null }],
} as unknown as Reservation

/** metadata as an already-parsed object, spans two days, flagged for review. */
const TRAIN = {
  id: 102, trip_id: 7, type: 'train', status: 'pending', title: 'Shinkansen Nozomi',
  day_id: 1, end_day_id: 2, reservation_time: '2026-05-01T14:00', needs_review: 1,
  metadata: { train_number: 'ICE 599', platform: '7', seat: '12A', class: 'Business', price: 49.9, priceCurrency: 'EUR' },
} as unknown as Reservation

const BUS = {
  id: 103, trip_id: 7, type: 'bus', status: 'pending', title: 'Airport shuttle',
  metadata: JSON.stringify({ price: '25', priceCurrency: 'CHF' }),
} as unknown as Reservation

const TRANSIT = {
  id: 104, trip_id: 7, type: 'transit', status: 'confirmed', title: 'Metro to hotel',
  day_id: 2, reservation_time: '2026-05-02T09:10',
  metadata: JSON.stringify({ departure_airport: 'Shibuya' }),
} as unknown as Reservation

const CAR = {
  id: 105, trip_id: 7, type: 'car', status: 'confirmed', title: 'Rental pickup',
  reservation_time: '2026-06-15T09:00',
  metadata: JSON.stringify({ arrival_airport: 'Nagoya' }),
} as unknown as Reservation

const DINNER = {
  id: 106, trip_id: 7, type: 'restaurant', status: 'confirmed', title: 'Sushi Saito',
} as unknown as Reservation

const FILES = [
  { id: 201, trip_id: 7, reservation_id: 101, original_name: 'boarding-pass.pdf', url: '/uploads/f/201' },
  { id: 202, trip_id: 7, linked_reservation_ids: [101], original_name: 'seat-map.pdf', url: '/uploads/f/202' },
  { id: 203, trip_id: 7, reservation_id: 101, original_name: 'stale.pdf', url: '/uploads/f/203', deleted_at: '2026-01-01' },
] as unknown as TripFile[]

const ALL = [FLIGHT, TRAIN, BUS, TRANSIT, CAR, DINNER]

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
  const view = render(<MTransportsTab planner={p} shell={shell} />)
  return { ...view, planner: p, shell }
}

/** The card wrapper of a transport row — walks up from its title. */
function cardOf(title: string): HTMLElement {
  let el = screen.getByText(title).parentElement
  while (el && !el.className.includes('rounded-2xl')) el = el.parentElement
  if (!el) throw new Error(`no card for ${title}`)
  return el
}

describe('MTransportsTab', () => {
  beforeEach(() => {
    vi.mocked(openFile).mockClear()
  })

  it('FE-MOB-TRTAB-001: groups the transport reservations and leaves bookings out', () => {
    renderTab()
    expect(screen.getByRole('button', { name: 'reservations.confirmed2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'reservations.pending2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'reservations.type.transit1' })).toBeInTheDocument()
    expect(screen.queryByText('Sushi Saito')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-002: orders each group chronologically with undated rows last', () => {
    renderTab()
    const titles = screen.getAllByText(/HND to ITM|Rental pickup|Shinkansen Nozomi|Airport shuttle/)
      .map(n => n.textContent)
    expect(titles).toEqual(['HND to ITM', 'Rental pickup', 'Shinkansen Nozomi', 'Airport shuttle'])
  })

  it('FE-MOB-TRTAB-003: collapses a section and keeps the others open', () => {
    renderTab()
    const header = screen.getByRole('button', { name: 'reservations.confirmed2' })
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('HND to ITM')).not.toBeInTheDocument()
    expect(screen.getByText('Shinkansen Nozomi')).toBeInTheDocument()
    fireEvent.click(header)
    expect(screen.getByText('HND to ITM')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-004: shows the mascot empty state without transports', () => {
    renderTab(planner({ reservations: [DINNER] }))
    expect(screen.getByText('mobileTrip.transportsEmpty')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reservations.confirmed/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-005: renders day range, times and the confirmation code of a flight', () => {
    renderTab()
    const card = cardOf('HND to ITM')
    expect(within(card).getByText('dayplan.dayN:1')).toBeInTheDocument()
    expect(within(card).getByText('08:30 – 11:45')).toBeInTheDocument()
    expect(within(card).getByText('ABC123')).toBeInTheDocument()
    expect(within(card).getByText('ABC123')).not.toHaveClass('blur-[4px]')
  })

  it('FE-MOB-TRTAB-006: spans start and end day when they differ', () => {
    renderTab()
    expect(within(cardOf('Shinkansen Nozomi')).getByText('dayplan.dayN:1 – Kyoto')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-007: falls back to the raw reservation date without a linked day', () => {
    renderTab()
    expect(within(cardOf('Rental pickup')).getByText('Jun 15')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-008: shows em dashes when neither day nor time is known', () => {
    renderTab()
    const card = cardOf('Airport shuttle')
    expect(within(card).getAllByText('—')).toHaveLength(2)
  })

  it('FE-MOB-TRTAB-009: renders the ordered endpoints and drops the airport meta cells', () => {
    renderTab()
    const card = cardOf('HND to ITM')
    expect(within(card).getByText('Tokyo Haneda')).toBeInTheDocument()
    expect(within(card).getByText('Osaka Itami')).toBeInTheDocument()
    expect(within(card).getByText('reservations.meta.airline')).toBeInTheDocument()
    expect(within(card).getByText('ANA')).toBeInTheDocument()
    expect(within(card).getByText('NH203')).toBeInTheDocument()
    expect(within(card).queryByText('reservations.meta.from')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-010: reads object metadata and caps the meta row at three cells', () => {
    renderTab()
    const card = cardOf('Shinkansen Nozomi')
    expect(within(card).getByText('ICE 599')).toBeInTheDocument()
    expect(within(card).getByText('7')).toBeInTheDocument()
    expect(within(card).getByText('12A · Business')).toBeInTheDocument()
    expect(within(card).queryByText('reservations.price')).not.toBeInTheDocument()
    expect(within(card).getByText('reservations.needsReview')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-011: appends the currency to the price cell', () => {
    renderTab()
    const card = cardOf('Airport shuttle')
    expect(within(card).getByText('reservations.price')).toBeInTheDocument()
    expect(within(card).getByText('25 CHF')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-012: uses the airport meta cells when no endpoints are stored', () => {
    renderTab()
    expect(within(cardOf('Metro to hotel')).getByText('Shibuya')).toBeInTheDocument()
    expect(within(cardOf('Rental pickup')).getByText('Nagoya')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-013: lists the linked, non-deleted files and opens one on tap', () => {
    renderTab()
    const card = cardOf('HND to ITM')
    expect(within(card).getByText('boarding-pass.pdf')).toBeInTheDocument()
    expect(within(card).getByText('seat-map.pdf')).toBeInTheDocument()
    expect(within(card).queryByText('stale.pdf')).not.toBeInTheDocument()
    fireEvent.click(within(card).getByText('boarding-pass.pdf'))
    expect(openFile).toHaveBeenCalledWith('/uploads/f/201', 'boarding-pass.pdf')
  })

  it('FE-MOB-TRTAB-014: reveals a blurred confirmation code through a real button', () => {
    renderTab(planner({ settings: buildSettings({ time_format: '24h', blur_booking_codes: true }) }))
    // A button, not a bare div — the reveal has to be reachable by keyboard.
    const code = within(cardOf('HND to ITM')).getByRole('button', { name: 'ABC123' })
    expect(code).toHaveClass('blur-[4px]')
    fireEvent.click(code)
    expect(code).not.toHaveClass('blur-[4px]')
    expect(code).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-TRTAB-015: opens the transport detail sheet from the row', () => {
    const { shell } = renderTab()
    fireEvent.click(screen.getByText('HND to ITM'))
    expect(shell.openSheet).toHaveBeenCalledWith('transport', { reservationId: 101 })
  })

  it('FE-MOB-TRTAB-016: toggles the reservation status from the dot', async () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('HND to ITM')).getByRole('button', { name: 'reservations.pending' }))
    await waitFor(() => expect(p.tripActions.toggleReservationStatus).toHaveBeenCalledWith(7, 101))
  })

  it('FE-MOB-TRTAB-017: toasts when the status toggle fails', async () => {
    const p = planner()
    vi.mocked(p.tripActions.toggleReservationStatus).mockRejectedValueOnce(new Error('offline'))
    renderTab(p)
    fireEvent.click(within(cardOf('HND to ITM')).getByRole('button', { name: 'reservations.pending' }))
    await waitFor(() => expect(p.toast.error).toHaveBeenCalledWith('reservations.toast.updateError'))
  })

  it('FE-MOB-TRTAB-018: opens the transport editor with the row and its day', () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('Shinkansen Nozomi')).getByRole('button', { name: 'common.edit' }))
    expect(p.setEditingTransport).toHaveBeenCalledWith(expect.objectContaining({ id: 102 }))
    expect(p.setTransportModalDayId).toHaveBeenCalledWith(1)
    expect(p.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-TRTAB-019: deletes after confirming and toasts on failure', async () => {
    const p = planner({ handleDeleteReservation: vi.fn(() => Promise.reject(new Error('boom'))) as unknown as TripPlanner['handleDeleteReservation'] })
    renderTab(p)
    fireEvent.click(within(cardOf('HND to ITM')).getByRole('button', { name: 'common.delete' }))
    const dialog = screen.getByRole('dialog', { name: 'reservations.confirm.deleteTitle' })
    expect(within(dialog).getByText('reservations.confirm.deleteBody:HND to ITM')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByText('common.delete'))
    expect(p.handleDeleteReservation).toHaveBeenCalledWith(101)
    await waitFor(() => expect(p.toast.error).toHaveBeenCalledWith('reservations.toast.deleteError'))
  })

  it('FE-MOB-TRTAB-020: hides every edit affordance without the day_edit permission', () => {
    renderTab(planner({ can: vi.fn(() => false) as unknown as TripPlanner['can'] }))
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'reservations.pending' })).not.toBeInTheDocument()
    expect(screen.getByText('HND to ITM')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-021: compact mode keeps the header and drops the card body', () => {
    renderTab(planner(), buildShell({ transportsCompact: true }))
    expect(screen.getByText('HND to ITM')).toBeInTheDocument()
    expect(screen.queryByText('reservations.date')).not.toBeInTheDocument()
    expect(screen.queryByText('ABC123')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-022: filters by assigned traveler and shows the avatars on the card', () => {
    renderTab()
    expect(within(cardOf('HND to ITM')).getByText('reservations.travelers.label')).toBeInTheDocument()
    const ada = screen.getByTitle('Ada')
    fireEvent.click(ada)
    expect(screen.getByText('HND to ITM')).toBeInTheDocument()
    expect(screen.queryByText('Shinkansen Nozomi')).not.toBeInTheDocument()
    fireEvent.click(ada)
    expect(screen.getByText('Shinkansen Nozomi')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-023: hides the traveler filter for a solo trip', () => {
    renderTab(planner({ tripMembers: [MEMBERS[0]] as unknown as TripPlanner['tripMembers'] }))
    expect(screen.queryByTitle('Ada')).not.toBeInTheDocument()
    expect(screen.getByText('HND to ITM')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-024: cancelling the confirm keeps the transport', () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('HND to ITM')).getByRole('button', { name: 'common.delete' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('common.cancel'))
    expect(p.handleDeleteReservation).not.toHaveBeenCalled()
    expect(screen.getByText('HND to ITM')).toBeInTheDocument()
  })

  it('FE-MOB-TRTAB-025: opens the editor without a day for an unassigned transport', () => {
    const p = planner()
    renderTab(p)
    fireEvent.click(within(cardOf('Airport shuttle')).getByRole('button', { name: 'common.edit' }))
    expect(p.setTransportModalDayId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-TRTAB-026: falls back to the generic icon for an unknown transport type', () => {
    const HELI = {
      id: 107, trip_id: 7, type: 'helicopter', status: 'confirmed', title: 'Heli transfer',
      metadata: JSON.stringify({ seat: '3B', price: '99' }),
    } as unknown as Reservation
    renderTab(planner({
      reservations: [HELI],
      files: undefined as unknown as TripPlanner['files'],
      settings: { ...buildSettings(), time_format: '' },
      TRANSPORT_TYPES: new Set(['helicopter']) as unknown as TripPlanner['TRANSPORT_TYPES'],
    }))
    const card = cardOf('Heli transfer')
    expect(within(card).getByText('reservations.type.helicopter')).toBeInTheDocument()
    // seat without a class and a price without a currency stay bare
    expect(within(card).getByText('3B')).toBeInTheDocument()
    expect(within(card).getByText('99')).toBeInTheDocument()
    // nobody is assigned, so the traveler filter row stays away
    expect(screen.queryByTitle('Ada')).not.toBeInTheDocument()
  })
})
