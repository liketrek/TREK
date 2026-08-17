// FE-PLANNER-DPTRANSPORT-001 to FE-PLANNER-DPTRANSPORT-019
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { useTripStore } from '../../store/tripStore'
import { buildReservation, buildTripFile } from '../../../tests/helpers/factories'
import { DayPlanSidebarTransportDetailModal } from './DayPlanSidebarTransportDetailModal'
import type { Reservation } from '../../types'

// `t` arrives as a prop here, so echoing the key (plus its params) keeps the
// assertions independent of the translation catalogue.
const t = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}|${Object.values(params).join('|')}` : key

function makeProps(overrides: Partial<React.ComponentProps<typeof DayPlanSidebarTransportDetailModal>> = {}) {
  return {
    transportDetail: null as Reservation | null,
    setTransportDetail: vi.fn(),
    onNavigateToFiles: vi.fn(),
    onEdit: vi.fn(),
    t,
    locale: 'en-US',
    timeFormat: '24h',
    ...overrides,
  }
}

const flight = () => buildReservation({
  id: 41,
  type: 'flight',
  title: 'BER → CDG',
  status: 'confirmed',
  reservation_time: '2025-06-15T08:30:00',
  reservation_end_time: '2025-06-15T10:05:00',
  confirmation_number: 'XY7Z9Q',
  location: 'Terminal 1',
  metadata: JSON.stringify({
    airline: 'Air France', flight_number: 'AF1235',
    departure_airport: 'BER', arrival_airport: 'CDG', seat: '14A',
  }),
} as Partial<Reservation>)

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useSettingsStore, { settings: { time_format: '24h', blur_booking_codes: false } })
})

describe('DayPlanSidebarTransportDetailModal', () => {
  it('FE-PLANNER-DPTRANSPORT-001: renders nothing without a reservation', () => {
    const { container } = render(<DayPlanSidebarTransportDetailModal {...makeProps()} />)
    expect(container).toBeEmptyDOMElement()
    expect(document.body.textContent).toBe('')
  })

  it('FE-PLANNER-DPTRANSPORT-002: shows the title, date and time range in the header', () => {
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    expect(screen.getByText('BER → CDG')).toBeInTheDocument()
    expect(screen.getByText(/Jun 15.*08:30 – 10:05/)).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-003: a confirmed booking shows the confirmed badge', () => {
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    expect(screen.getByText('planner.resConfirmed')).toBeInTheDocument()
    expect(screen.queryByText('planner.resPending')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-004: a pending booking shows the pending badge', () => {
    const res = { ...flight(), status: 'pending' } as Reservation
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)
    expect(screen.getByText('planner.resPending')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-005: flight metadata renders airline, number, route and seat', () => {
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    expect(screen.getByText('Air France')).toBeInTheDocument()
    expect(screen.getByText('AF1235')).toBeInTheDocument()
    expect(screen.getByText('BER')).toBeInTheDocument()
    expect(screen.getByText('CDG')).toBeInTheDocument()
    expect(screen.getByText('14A')).toBeInTheDocument()
    expect(screen.getByText('XY7Z9Q')).toBeInTheDocument()
    expect(screen.getByText('Terminal 1')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-006: train metadata renders number, platform and seat', () => {
    const res = buildReservation({
      id: 42, type: 'train', title: 'ICE 599', status: 'confirmed',
      metadata: { train_number: 'ICE 599', platform: '7', seat: '31' },
    } as unknown as Partial<Reservation>)
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)
    expect(screen.getByText('reservations.meta.trainNumber')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-007: a booking with no metadata and no codes renders no detail grid', () => {
    const res = buildReservation({ id: 43, type: 'other', title: 'Something', metadata: null } as Partial<Reservation>)
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)
    expect(screen.getByText('Something')).toBeInTheDocument()
    expect(screen.queryByText('reservations.confirmationCode')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-008: the confirmation code is blurred when the setting is on', () => {
    seedStore(useSettingsStore, { settings: { time_format: '24h', blur_booking_codes: true } })
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    const code = screen.getByText('XY7Z9Q')
    expect(code).toHaveStyle({ filter: 'blur(5px)' })
    // The location is not sensitive, so it stays readable.
    expect(screen.getByText('Terminal 1')).toHaveStyle({ filter: 'none' })
  })

  it('FE-PLANNER-DPTRANSPORT-009: hovering and clicking a blurred code reveals and re-hides it', () => {
    seedStore(useSettingsStore, { settings: { time_format: '24h', blur_booking_codes: true } })
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    const code = screen.getByText('XY7Z9Q')
    fireEvent.mouseEnter(code)
    expect(code.style.filter).toBe('none')
    fireEvent.mouseLeave(code)
    expect(code.style.filter).toBe('blur(5px)')
    fireEvent.click(code)
    expect(code.style.filter).toBe('none')
    fireEvent.click(code)
    expect(code.style.filter).toBe('blur(5px)')
  })

  it('FE-PLANNER-DPTRANSPORT-010: an unblurred field ignores hover and click', () => {
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    const code = screen.getByText('XY7Z9Q')
    fireEvent.mouseEnter(code)
    fireEvent.click(code)
    expect(code.style.filter).toBe('none')
  })

  it('FE-PLANNER-DPTRANSPORT-011: a transit journey renders its summary and itinerary legs', () => {
    const res = buildReservation({
      id: 44, type: 'transit', title: 'Alexanderplatz → Zoo', status: 'confirmed',
      metadata: {
        transit: {
          duration: 1800, transfers: 1, walk_seconds: 240,
          legs: [
            { mode: 'WALK', duration: 240, from: { name: 'Start' }, to: { name: 'Alexanderplatz' } },
            {
              mode: 'SUBWAY', line: 'U2', line_color: '#FF3300', line_text_color: '#FFFFFF',
              headsign: 'Ruhleben', duration: 1440, stops: 6,
              from: { name: 'Alexanderplatz', time: '08:36' }, to: { name: 'Zoo', time: '09:00' },
            },
          ],
        },
      },
    } as unknown as Partial<Reservation>)
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)
    expect(screen.getByText('transit.min|30')).toBeInTheDocument()
    expect(screen.getByText('transit.transfers|1')).toBeInTheDocument()
    expect(screen.getByText('transit.itinerary')).toBeInTheDocument()
    expect(screen.getByText('transit.walkTo|Alexanderplatz')).toBeInTheDocument()
    expect(screen.getByText('U2')).toBeInTheDocument()
    expect(screen.getByText('Zoo')).toBeInTheDocument()
    expect(screen.getByText(/08:36 – 09:00 · transit\.min\|24 · transit\.stops\|6 · → Ruhleben/)).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-012: a direct, long, walk-free journey renders hours and the direct label', () => {
    const res = buildReservation({
      id: 45, type: 'transit', title: 'Long haul', status: 'confirmed',
      metadata: {
        transit: {
          duration: 7200, transfers: 0, walk_seconds: 30,
          legs: [{ mode: 'BUS', duration: 7200, from: { name: 'A' }, to: { name: 'B' } }],
        },
      },
    } as unknown as Partial<Reservation>)
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)
    expect(screen.getByText('2 h 0 min')).toBeInTheDocument()
    expect(screen.getByText('transit.direct')).toBeInTheDocument()
    // Under a minute of walking is not worth a chip.
    expect(screen.queryByText('transit.min|1')).not.toBeInTheDocument()
    // No line name on this leg, so the badge falls back to the mode.
    expect(screen.getByText('BUS')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-013: notes render as markdown', () => {
    const res = { ...flight(), notes: 'Bring **passport**' } as Reservation
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)
    expect(screen.getByText('reservations.notes')).toBeInTheDocument()
    expect(screen.getByText('passport').tagName).toBe('STRONG')
  })

  it('FE-PLANNER-DPTRANSPORT-014: linked trip files are listed, deleted and unrelated ones are not', () => {
    seedStore(useTripStore, {
      files: [
        buildTripFile({ id: 1, original_name: 'boarding.pdf', reservation_id: 41 }),
        buildTripFile({ id: 2, original_name: 'linked.pdf', reservation_id: null, linked_reservation_ids: [41] }),
        buildTripFile({ id: 3, original_name: 'trashed.pdf', reservation_id: 41, deleted_at: '2025-06-01' }),
        buildTripFile({ id: 4, original_name: 'other.pdf', reservation_id: 99 }),
      ],
    })
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight() })} />)
    expect(screen.getByText('boarding.pdf')).toBeInTheDocument()
    expect(screen.getByText('linked.pdf')).toBeInTheDocument()
    expect(screen.queryByText('trashed.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('other.pdf')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-015: clicking a file closes the modal and navigates to the files view', async () => {
    const user = userEvent.setup()
    seedStore(useTripStore, { files: [buildTripFile({ id: 1, original_name: 'boarding.pdf', reservation_id: 41 })] })
    const setTransportDetail = vi.fn()
    const onNavigateToFiles = vi.fn()
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight(), setTransportDetail, onNavigateToFiles })} />)
    const row = screen.getByText('boarding.pdf').parentElement!
    fireEvent.mouseEnter(row)
    expect(row.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(row)
    expect(row.style.background).toBe('var(--bg-tertiary)')
    await user.click(row)
    expect(setTransportDetail).toHaveBeenCalledWith(null)
    expect(onNavigateToFiles).toHaveBeenCalledTimes(1)
  })

  it('FE-PLANNER-DPTRANSPORT-016: the edit action hands the reservation back to the caller', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const res = flight()
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res, onEdit })} />)
    await user.click(screen.getByRole('button', { name: /common\.edit/ }))
    expect(onEdit).toHaveBeenCalledWith(res)
  })

  it('FE-PLANNER-DPTRANSPORT-017: without onEdit only the close action is offered', async () => {
    const user = userEvent.setup()
    const setTransportDetail = vi.fn()
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight(), onEdit: undefined, setTransportDetail })} />)
    expect(screen.queryByRole('button', { name: /common\.edit/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'common.close' }))
    expect(setTransportDetail).toHaveBeenCalledWith(null)
  })

  it('FE-PLANNER-DPTRANSPORT-019: a segment with its own booking code gets its own blurred field (#1943)', () => {
    seedStore(useSettingsStore, { settings: { time_format: '24h', blur_booking_codes: true } })
    const res = buildReservation({
      id: 42, type: 'flight', title: 'BER → CDG → JFK', status: 'confirmed',
      reservation_time: '2025-06-15T08:30:00',
      confirmation_number: 'XY7Z9Q',
      metadata: JSON.stringify({
        legs: [
          { from: 'BER', to: 'CDG', confirmation_number: 'ABC123' },
          { from: 'CDG', to: 'JFK' },
        ],
      }),
    } as Partial<Reservation>)
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: res })} />)

    expect(screen.getByText('BER → CDG')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toHaveStyle({ filter: 'blur(5px)' })
    // The booking's own reference keeps its own field, a code-less segment adds none.
    expect(screen.getByText('XY7Z9Q')).toBeInTheDocument()
    expect(screen.queryByText('CDG → JFK')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTRANSPORT-018: clicking the backdrop closes, clicking the card does not', async () => {
    const user = userEvent.setup()
    const setTransportDetail = vi.fn()
    render(<DayPlanSidebarTransportDetailModal {...makeProps({ transportDetail: flight(), setTransportDetail })} />)
    const card = screen.getByText('BER → CDG').closest('div.bg-surface-card')!
    await user.click(card)
    expect(setTransportDetail).not.toHaveBeenCalled()
    await user.click(card.parentElement!)
    expect(setTransportDetail).toHaveBeenCalledWith(null)
  })
})
