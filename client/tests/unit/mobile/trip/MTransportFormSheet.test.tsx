import { beforeEach, describe, expect, it, vi } from 'vitest'
import MTransportFormSheet from '../../../../src/mobile/screens/trip/sheets/MTransportFormSheet'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAddonStore } from '../../../../src/store/addonStore'
import { useTripStore } from '../../../../src/store/tripStore'
import type { Day, Reservation, TripMember } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { act, fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-TRFRM-001 to FE-MOB-TRFRM-048
//
// The sheet's own pickers (airport/location search, day select, time picker) and
// the embedded transit panel are replaced by minimal controlled stand-ins so the
// form's own state machine and payload assembly are what the tests exercise.

const { AIRPORTS, LOCATIONS } = vi.hoisted(() => ({
  AIRPORTS: {
    FRA: { iata: 'FRA', icao: null, name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', lat: 50.03, lng: 8.57, tz: 'Europe/Berlin' },
    IST: { iata: 'IST', icao: null, name: 'Istanbul Airport', city: 'Istanbul', country: 'TR', lat: 41.27, lng: 28.75, tz: 'Europe/Istanbul' },
    HND: { iata: 'HND', icao: null, name: 'Haneda Airport', city: 'Tokyo', country: 'JP', lat: 35.55, lng: 139.78, tz: 'Asia/Tokyo' },
  } as Record<string, { iata: string; icao: null; name: string; city: string; country: string; lat: number; lng: number; tz: string }>,
  LOCATIONS: {
    osaka: { name: 'Osaka Station', lat: 34.7, lng: 135.5, address: null },
    kyoto: { name: 'Kyoto Station', lat: 34.98, lng: 135.75, address: null },
    nara: { name: 'Nara Station', lat: 34.68, lng: 135.82, address: null },
  } as Record<string, { name: string; lat: number; lng: number; address: null }>,
}))

vi.mock('../../../../src/components/shared/CustomSelect', () => ({
  default: ({ value, onChange, options = [] }: {
    value: string | number
    onChange: (v: string | number) => void
    options?: { value: string | number; label: string }[]
  }) => (
    <select
      aria-label="day-select"
      value={String(value)}
      onChange={e => {
        const opt = options.find(o => String(o.value) === e.target.value)
        onChange(opt ? opt.value : e.target.value)
      }}
    >
      {options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  ),
}))

vi.mock('../../../../src/components/shared/CustomTimePicker', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="time-input" value={value} onChange={e => onChange(e.target.value)} />
  ),
}))

vi.mock('../../../../src/components/Planner/AirportSelect', () => ({
  default: ({ value, onChange }: { value: { iata: string } | null; onChange: (a: unknown) => void }) => (
    <input
      aria-label="airport-select"
      value={value?.iata ?? ''}
      onChange={e => onChange(AIRPORTS[e.target.value] ?? null)}
    />
  ),
}))

vi.mock('../../../../src/components/Planner/LocationSelect', () => ({
  default: ({ value, onChange }: { value: { name: string } | null; onChange: (l: unknown) => void }) => (
    <input
      aria-label="location-select"
      value={value?.name ?? ''}
      onChange={e => onChange(LOCATIONS[e.target.value] ?? null)}
    />
  ),
}))

vi.mock('../../../../src/components/Planner/TransitSearchPanel', () => ({
  default: ({ day, places, onAdd, initialFrom }: {
    day: { id: number }
    places: { name: string }[]
    onAdd: (p: Record<string, unknown>) => void
    initialFrom: { name: string } | null
  }) => (
    <div>
      <span data-testid="transit-day">{day.id}</span>
      <span data-testid="transit-places">{places.map(p => p.name).join(',')}</span>
      <span data-testid="transit-from">{initialFrom?.name ?? ''}</span>
      <button type="button" onClick={() => onAdd({ title: 'U4 to Prater', type: 'transit' })}>add-itinerary</button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/PlFileAttach', () => ({
  default: ({ files, onAdd, onRemove }: { files: File[]; onAdd: (f: File[]) => void; onRemove: (i: number) => void }) => (
    <div>
      <button type="button" onClick={() => onAdd([new File(['x'], 'extra.pdf')])}>attach-file</button>
      {files.map((f, i) => (
        <button key={`${f.name}-${i}`} type="button" onClick={() => onRemove(i)}>{`drop-${f.name}`}</button>
      ))}
    </div>
  ),
}))

const DAYS = [
  { id: 11, trip_id: 1, day_number: 1, date: '2026-05-01', title: null },
  { id: 12, trip_id: 1, day_number: 2, date: '2026-05-02', title: 'Kyoto' },
  { id: 13, trip_id: 1, day_number: 3, date: '2026-05-03', title: null },
] as unknown as Day[]

const MEMBERS = [
  { id: 4, username: 'maurice', avatar_url: null },
  { id: 5, username: 'julien', avatar_url: '/uploads/avatars/j.png', is_guest: true },
] as unknown as TripMember[]

type SavePayload = Record<string, unknown> & { title: string }

function makeSave(result: unknown = { id: 99 } as unknown) {
  return vi.fn(async (_payload: SavePayload) => result)
}

function makePlanner(overrides: Record<string, unknown> = {}): TripPlanner {
  return buildPlanner({
    days: DAYS,
    showTransportModal: true,
    trip: { id: 1, title: 'Japan 2026', start_date: '2026-05-01', end_date: '2026-05-03', currency: 'EUR' },
    ...overrides,
  } as unknown as Parameters<typeof buildPlanner>[0])
}

function renderSheet(planner: TripPlanner, onOpenExpense = vi.fn()) {
  const view = render(<MTransportFormSheet planner={planner} onOpenExpense={onOpenExpense} />)
  return { ...view, planner, onOpenExpense }
}

const daySelects = () => screen.getAllByLabelText('day-select') as HTMLSelectElement[]
const timeInputs = () => screen.getAllByLabelText('time-input') as HTMLInputElement[]
const airportInputs = () => screen.getAllByLabelText('airport-select') as HTMLInputElement[]
const locationInputs = () => screen.getAllByLabelText('location-select') as HTMLInputElement[]

const setValue = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })

const typeTitle = (value: string) =>
  setValue(screen.getByPlaceholderText('reservations.titlePlaceholder'), value)

async function submit(label = 'common.add') {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: label }))
  })
}

describe('MTransportFormSheet', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAddonStore, { addons: [{ id: 'budget', name: 'Budget', type: 'addon', icon: '', enabled: true }] })
  })

  it('FE-MOB-TRFRM-001: renders nothing while the planner has the editor closed', () => {
    renderSheet(makePlanner({ showTransportModal: false }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-002: opens in create mode with a disabled save and the manual/automated switch', () => {
    renderSheet(makePlanner())
    expect(screen.getByRole('dialog', { name: 'transport.modalTitle.create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'transport.modeManual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'transport.modeAutomated' })).toBeInTheDocument()
    // Nothing to delete on a fresh booking.
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-003: hides the automated switch when the trip has no dates', () => {
    renderSheet(makePlanner({ trip: { id: 1, title: 'Someday', start_date: null, end_date: null } }))
    expect(screen.queryByRole('button', { name: 'transport.modeAutomated' })).not.toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-004: offers every transport type and marks the active one', () => {
    renderSheet(makePlanner())
    for (const type of ['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transport_other']) {
      expect(screen.getByRole('button', { name: `reservations.type.${type}` })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'reservations.type.flight' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.bus' }))
    expect(screen.getByRole('button', { name: 'reservations.type.bus' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'reservations.type.flight' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-MOB-TRFRM-005: a car booking relabels the date rows as pick-up and return', () => {
    renderSheet(makePlanner())
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.bus' }))
    expect(screen.getByText('reservations.date')).toBeInTheDocument()
    expect(screen.getByText('reservations.startTime')).toBeInTheDocument()
    expect(screen.getByText('reservations.endDate')).toBeInTheDocument()
    expect(screen.getByText('reservations.endTime')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.car' }))
    expect(screen.getByText('reservations.pickupDate')).toBeInTheDocument()
    expect(screen.getByText('reservations.pickupTime')).toBeInTheDocument()
    expect(screen.getByText('reservations.returnDate')).toBeInTheDocument()
    expect(screen.getByText('reservations.returnTime')).toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-006: saves a simple two-endpoint booking with the day-anchored times', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.bus' }))
    typeTitle('Bus to Kyoto')
    setValue(locationInputs()[0], 'osaka')
    setValue(locationInputs()[1], 'kyoto')
    setValue(daySelects()[0], '11')
    setValue(timeInputs()[0], '08:15')
    setValue(daySelects()[1], '12')
    setValue(timeInputs()[1], '11:00')
    setValue(screen.getByPlaceholderText('reservations.confirmationPlaceholder'), 'BUS-4711')
    setValue(screen.getByPlaceholderText('reservations.notesPlaceholder'), 'Seat 4 reserved')
    fireEvent.click(screen.getByRole('button', { name: 'reservations.confirmed' }))

    await submit()

    expect(handleSaveTransport).toHaveBeenCalledTimes(1)
    expect(handleSaveTransport.mock.calls[0][0]).toEqual({
      title: 'Bus to Kyoto',
      type: 'bus',
      status: 'confirmed',
      day_id: 11,
      end_day_id: 12,
      reservation_time: '2026-05-01T08:15',
      reservation_end_time: '2026-05-02T11:00',
      location: null,
      confirmation_number: 'BUS-4711',
      notes: 'Seat 4 reserved',
      metadata: null,
      endpoints: [
        { role: 'from', sequence: 0, name: 'Osaka Station', code: null, lat: 34.7, lng: 135.5, timezone: null, local_date: '2026-05-01', local_time: '08:15' },
        { role: 'to', sequence: 1, name: 'Kyoto Station', code: null, lat: 34.98, lng: 135.75, timezone: null, local_date: '2026-05-02', local_time: '11:00' },
      ],
      needs_review: false,
    })
  })

  it('FE-MOB-TRFRM-007: falls back to the start day for the end date and keeps a bare time', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport, days: [] }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.taxi' }))
    typeTitle('Airport transfer')
    setValue(timeInputs()[0], '05:40')

    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.day_id).toBeNull()
    expect(payload.end_day_id).toBeNull()
    // No day means no date prefix — the bare clock time is stored.
    expect(payload.reservation_time).toBe('05:40')
    expect(payload.reservation_end_time).toBeNull()
    expect(payload.endpoints).toEqual([])
  })

  it('FE-MOB-TRFRM-008: saves a single-leg flight with the flat airline metadata', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    typeTitle('LH 716')
    setValue(airportInputs()[0], 'FRA')
    setValue(airportInputs()[1], 'HND')
    setValue(daySelects()[0], '11')
    setValue(timeInputs()[0], '10:20')
    setValue(daySelects()[1], '12')
    setValue(timeInputs()[1], '06:45')
    setValue(screen.getByPlaceholderText('Lufthansa'), 'Lufthansa')
    setValue(screen.getByPlaceholderText('LH 123'), 'LH 716')
    setValue(screen.getByPlaceholderText('12A'), '31A')

    await submit()

    expect(handleSaveTransport.mock.calls[0][0]).toEqual({
      title: 'LH 716',
      type: 'flight',
      status: 'pending',
      day_id: 11,
      end_day_id: 12,
      reservation_time: '2026-05-01T10:20',
      reservation_end_time: '2026-05-02T06:45',
      location: null,
      confirmation_number: null,
      notes: null,
      metadata: {
        airline: 'Lufthansa',
        flight_number: 'LH 716',
        seat: '31A',
        departure_airport: 'FRA',
        departure_timezone: 'Europe/Berlin',
        arrival_airport: 'HND',
        arrival_timezone: 'Asia/Tokyo',
      },
      endpoints: [
        { role: 'from', sequence: 0, name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin', local_date: '2026-05-01', local_time: '10:20' },
        { role: 'to', sequence: 1, name: 'Tokyo (HND)', code: 'HND', lat: 35.55, lng: 139.78, timezone: 'Asia/Tokyo', local_date: '2026-05-02', local_time: '06:45' },
      ],
      needs_review: false,
    })
  })

  it('FE-MOB-TRFRM-009: adds a layover and writes one metadata leg per segment', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    typeTitle('FRA-IST-HND')
    fireEvent.click(screen.getByRole('button', { name: 'reservations.layover.addStop' }))
    expect(screen.getAllByLabelText('airport-select')).toHaveLength(3)
    expect(screen.getByText('reservations.layover.stop')).toBeInTheDocument()

    setValue(airportInputs()[0], 'FRA')
    setValue(airportInputs()[1], 'IST')
    setValue(airportInputs()[2], 'HND')
    // selects: dep(0) | arr(1) dep(1) | arr(2)
    setValue(daySelects()[0], '11')
    setValue(timeInputs()[0], '10:20')
    setValue(daySelects()[1], '11')
    setValue(timeInputs()[1], '14:05')
    setValue(daySelects()[2], '11')
    setValue(timeInputs()[2], '16:30')
    setValue(daySelects()[3], '12')
    setValue(timeInputs()[3], '09:00')
    const airlines = screen.getAllByPlaceholderText('Lufthansa')
    setValue(airlines[0], 'Lufthansa')
    setValue(airlines[1], 'Turkish Airlines')
    const flightNumbers = screen.getAllByPlaceholderText('LH 123')
    setValue(flightNumbers[0], 'LH 1300')
    setValue(flightNumbers[1], 'TK 46')
    setValue(screen.getAllByPlaceholderText('12A')[0], '2A')

    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.metadata).toEqual({
      airline: 'Lufthansa',
      flight_number: 'LH 1300',
      seat: '2A',
      departure_airport: 'FRA',
      departure_timezone: 'Europe/Berlin',
      arrival_airport: 'HND',
      arrival_timezone: 'Asia/Tokyo',
      legs: [
        { from: 'FRA', to: 'IST', airline: 'Lufthansa', flight_number: 'LH 1300', seat: '2A', dep_day_id: 11, dep_time: '10:20', arr_day_id: 11, arr_time: '14:05' },
        { from: 'IST', to: 'HND', airline: 'Turkish Airlines', flight_number: 'TK 46', dep_day_id: 11, dep_time: '16:30', arr_day_id: 12, arr_time: '09:00' },
      ],
    })
    expect(payload.endpoints).toEqual([
      expect.objectContaining({ role: 'from', sequence: 0, code: 'FRA', local_time: '10:20' }),
      expect.objectContaining({ role: 'stop', sequence: 1, code: 'IST', local_time: '16:30' }),
      expect.objectContaining({ role: 'to', sequence: 2, code: 'HND', local_time: '09:00' }),
    ])
    expect(payload.day_id).toBe(11)
    expect(payload.end_day_id).toBe(12)
  })

  it('FE-MOB-TRFRM-010: removing a layover falls back to the flat single-leg shape', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    typeTitle('FRA-HND')
    fireEvent.click(screen.getByRole('button', { name: 'reservations.layover.addStop' }))
    expect(airportInputs()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    expect(airportInputs()).toHaveLength(2)

    setValue(airportInputs()[0], 'FRA')
    setValue(airportInputs()[1], 'HND')
    await submit()

    expect(handleSaveTransport.mock.calls[0][0].metadata).not.toHaveProperty('legs')
  })

  it('FE-MOB-TRFRM-011: a flight without any picked airport saves no metadata and no endpoints', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    typeTitle('Placeholder flight')
    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.metadata).toBeNull()
    expect(payload.endpoints).toEqual([])
    expect(payload.day_id).toBeNull()
  })

  it('FE-MOB-TRFRM-012: saves a single-leg train with train number, platform and seat', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.train' }))
    typeTitle('ICE 599')
    setValue(locationInputs()[0], 'osaka')
    setValue(locationInputs()[1], 'kyoto')
    setValue(daySelects()[0], '12')
    setValue(timeInputs()[0], '07:45')
    setValue(daySelects()[1], '12')
    setValue(timeInputs()[1], '09:12')
    setValue(screen.getByPlaceholderText('ICE 123'), 'ICE 599')
    setValue(screen.getByPlaceholderText('12'), '7')
    setValue(screen.getByPlaceholderText('42A'), '12C')

    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.metadata).toEqual({ train_number: 'ICE 599', platform: '7', seat: '12C' })
    expect(payload.day_id).toBe(12)
    expect(payload.end_day_id).toBe(12)
    expect(payload.reservation_time).toBe('2026-05-02T07:45')
    expect(payload.reservation_end_time).toBe('2026-05-02T09:12')
    expect(payload.endpoints).toEqual([
      { role: 'from', sequence: 0, name: 'Osaka Station', code: null, lat: 34.7, lng: 135.5, timezone: null, local_date: '2026-05-02', local_time: '07:45' },
      { role: 'to', sequence: 1, name: 'Kyoto Station', code: null, lat: 34.98, lng: 135.75, timezone: null, local_date: '2026-05-02', local_time: '09:12' },
    ])
  })

  it('FE-MOB-TRFRM-013: a multi-stop train writes per-leg train numbers and stop endpoints', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.train' }))
    typeTitle('Osaka via Nara')
    fireEvent.click(screen.getByRole('button', { name: 'reservations.layover.addStop' }))
    setValue(locationInputs()[0], 'osaka')
    setValue(locationInputs()[1], 'nara')
    setValue(locationInputs()[2], 'kyoto')
    setValue(daySelects()[0], '12')
    setValue(timeInputs()[0], '08:00')
    setValue(daySelects()[1], '12')
    setValue(timeInputs()[1], '08:40')
    setValue(daySelects()[2], '12')
    setValue(timeInputs()[2], '09:00')
    setValue(daySelects()[3], '12')
    setValue(timeInputs()[3], '09:35')
    const trainNumbers = screen.getAllByPlaceholderText('ICE 123')
    setValue(trainNumbers[0], 'JR 12')
    setValue(trainNumbers[1], 'JR 88')
    setValue(screen.getAllByPlaceholderText('12')[0], '3')

    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.metadata).toEqual({
      train_number: 'JR 12',
      platform: '3',
      legs: [
        { from: 'Osaka Station', to: 'Nara Station', train_number: 'JR 12', platform: '3', dep_day_id: 12, dep_time: '08:00', arr_day_id: 12, arr_time: '08:40' },
        { from: 'Nara Station', to: 'Kyoto Station', train_number: 'JR 88', dep_day_id: 12, dep_time: '09:00', arr_day_id: 12, arr_time: '09:35' },
      ],
    })
    expect(payload.endpoints).toEqual([
      expect.objectContaining({ role: 'from', sequence: 0, name: 'Osaka Station' }),
      expect.objectContaining({ role: 'stop', sequence: 1, name: 'Nara Station' }),
      expect.objectContaining({ role: 'to', sequence: 2, name: 'Kyoto Station' }),
    ])
  })

  it('FE-MOB-TRFRM-046: a train row without a picked station no longer anchors the arrival', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.train' }))
    typeTitle('Osaka departure')
    setValue(locationInputs()[0], 'osaka')
    setValue(daySelects()[0], '12')
    setValue(timeInputs()[0], '07:45')
    // The arrival row carries a day and a time but never gets a station.
    setValue(daySelects()[1], '13')
    setValue(timeInputs()[1], '09:12')

    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.endpoints).toEqual([expect.objectContaining({ role: 'from', name: 'Osaka Station' })])
    expect(payload.day_id).toBe(12)
    expect(payload.reservation_time).toBe('2026-05-02T07:45')
    expect(payload.end_day_id).toBeNull()
    expect(payload.reservation_end_time).toBeNull()
  })

  it('FE-MOB-TRFRM-043: removing a train stop restores the two-station route', () => {
    renderSheet(makePlanner())
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.train' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'reservations.layover.addStop' })[0])
    expect(locationInputs()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    expect(locationInputs()).toHaveLength(2)
  })

  it('FE-MOB-TRFRM-044: seeds an edited train route from its ordered station endpoints', () => {
    const editingTransport = {
      id: 51, trip_id: 1, type: 'train', title: 'Osaka via Nara', status: 'pending',
      day_id: 12, end_day_id: 13, metadata: { train_number: 'JR 12', platform: '3', seat: '5B' },
      endpoints: [
        { id: 3, reservation_id: 51, role: 'to', sequence: 2, name: 'Kyoto Station', code: null, lat: 34.98, lng: 135.75, timezone: null, local_date: '2026-05-03', local_time: '09:35' },
        { id: 1, reservation_id: 51, role: 'from', sequence: 0, name: 'Osaka Station', code: null, lat: 34.7, lng: 135.5, timezone: null, local_date: '2026-05-02', local_time: '08:00' },
        { id: 2, reservation_id: 51, role: 'stop', sequence: 1, name: 'Nara Station', code: null, lat: 34.68, lng: 135.82, timezone: null, local_date: '2026-05-02', local_time: '08:40' },
      ],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport }))

    expect(locationInputs().map(i => i.value)).toEqual(['Osaka Station', 'Nara Station', 'Kyoto Station'])
    // The stop's own local_time and local_date seed both its arrival and its departure —
    // without metadata.legs the endpoint is the only record of the stop's day.
    expect(timeInputs().map(i => i.value)).toEqual(['08:00', '08:40', '08:40', '09:35'])
    expect(daySelects().map(s => s.value)).toEqual(['12', '12', '12', '13'])
    expect(screen.getAllByPlaceholderText('ICE 123')[0]).toHaveValue('JR 12')
    expect(screen.getAllByPlaceholderText('42A')[0]).toHaveValue('5B')
  })

  it('FE-MOB-TRFRM-045: picking a day in the automated tab reveals the transit search', () => {
    renderSheet(makePlanner({ transportModalAutomated: true }))
    expect(screen.getByText('transit.pickDay')).toBeInTheDocument()
    setValue(daySelects()[0], '13')
    expect(screen.queryByText('transit.pickDay')).not.toBeInTheDocument()
    expect(screen.getByTestId('transit-day')).toHaveTextContent('13')
  })

  it('FE-MOB-TRFRM-014: reports a failing save through the toast', async () => {
    const planner = makePlanner({ handleSaveTransport: vi.fn(async () => { throw new Error('server said no') }) })
    renderSheet(planner)
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.bus' }))
    typeTitle('Broken bus')
    await submit()
    expect(planner.toast.error).toHaveBeenCalledWith('server said no')
    expect(screen.getByRole('button', { name: 'common.add' })).toBeEnabled()
  })

  it('FE-MOB-TRFRM-015: falls back to the generic error text for a non-Error rejection', async () => {
    const planner = makePlanner({ handleSaveTransport: vi.fn(async () => { throw 'nope' }) })
    renderSheet(planner)
    typeTitle('Broken flight')
    await submit()
    expect(planner.toast.error).toHaveBeenCalledWith('common.unknownError')
  })

  it('FE-MOB-TRFRM-016: disables and relabels the save button while the request is in flight', async () => {
    let release: (v: { id: number }) => void = () => {}
    const handleSaveTransport = vi.fn(() => new Promise<{ id: number }>(resolve => { release = resolve }))
    renderSheet(makePlanner({ handleSaveTransport }))
    typeTitle('Slow flight')
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    const saving = await screen.findByRole('button', { name: 'common.saving' })
    expect(saving).toBeDisabled()
    await act(async () => { release({ id: 99 }) })
    expect(screen.getByRole('button', { name: 'common.add' })).toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-017: closing resets every editor flag on the planner', () => {
    const planner = makePlanner()
    renderSheet(planner)
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(false)
    expect(planner.setEditingTransport).toHaveBeenCalledWith(null)
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(null)
    expect(planner.setTransportModalAutomated).toHaveBeenCalledWith(false)
    expect(planner.setTransitPrefill).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-TRFRM-018: during an import review the close button advances instead of resetting', () => {
    const planner = makePlanner({ importReviewActive: true })
    renderSheet(planner)
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(planner.advanceImportReview).toHaveBeenCalledTimes(1)
    expect(planner.setShowTransportModal).not.toHaveBeenCalled()
  })

  it('FE-MOB-TRFRM-019: a successful save during an import review advances to the next item', async () => {
    const planner = makePlanner({ importReviewActive: true, handleSaveTransport: makeSave() })
    renderSheet(planner)
    typeTitle('Imported flight')
    await submit()
    expect(planner.advanceImportReview).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TRFRM-020: a save that returns nothing does not advance the import review', async () => {
    const planner = makePlanner({ importReviewActive: true, handleSaveTransport: makeSave(null) })
    renderSheet(planner)
    typeTitle('Imported flight')
    await submit()
    expect(planner.advanceImportReview).not.toHaveBeenCalled()
  })

  it('FE-MOB-TRFRM-021: seeds the form from the edited flight including the day selects', () => {
    const editingTransport = {
      id: 42, trip_id: 1, type: 'flight', title: 'LH 716', status: 'confirmed',
      day_id: 11, end_day_id: 12,
      reservation_time: '2026-05-01T10:20', reservation_end_time: '2026-05-02T06:45',
      confirmation_number: 'ABC123', notes: 'Exit row',
      metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH 716', seat: '31A' }),
      endpoints: [
        { id: 1, reservation_id: 42, role: 'to', sequence: 1, name: 'Tokyo (HND)', code: 'HND', lat: 35.55, lng: 139.78, timezone: 'Asia/Tokyo', local_date: '2026-05-02', local_time: '06:45' },
        { id: 2, reservation_id: 42, role: 'from', sequence: 0, name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin', local_date: '2026-05-01', local_time: '10:20' },
      ],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport }))

    expect(screen.getByRole('dialog', { name: 'transport.modalTitle.edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.update' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('reservations.titlePlaceholder')).toHaveValue('LH 716')
    expect(screen.getByPlaceholderText('reservations.confirmationPlaceholder')).toHaveValue('ABC123')
    expect(screen.getByPlaceholderText('reservations.notesPlaceholder')).toHaveValue('Exit row')
    expect(screen.getByRole('button', { name: 'reservations.confirmed' }).className).toContain('bg-m-act')
    // Endpoints are read in sequence order, not array order.
    expect(airportInputs().map(i => i.value)).toEqual(['FRA', 'HND'])
    expect(daySelects().map(s => s.value)).toEqual(['11', '12'])
    expect(timeInputs().map(i => i.value)).toEqual(['10:20', '06:45'])
    expect(screen.getByPlaceholderText('Lufthansa')).toHaveValue('Lufthansa')
    expect(screen.getByPlaceholderText('12A')).toHaveValue('31A')
    // No mode switch while editing.
    expect(screen.queryByRole('button', { name: 'transport.modeAutomated' })).not.toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-022: seeds a multi-leg flight from metadata.legs and keeps the day positions on re-save', async () => {
    const handleSaveTransport = makeSave()
    const editingTransport = {
      id: 43, trip_id: 1, type: 'flight', title: 'FRA-IST-HND', status: 'pending',
      day_id: 11, end_day_id: 12,
      metadata: {
        legs: [
          { from: 'FRA', to: 'IST', airline: 'Lufthansa', flight_number: 'LH 1300', seat: '2A', dep_day_id: 11, dep_time: '10:20', arr_day_id: 11, arr_time: '14:05', day_positions: { '11': 3 } },
          { from: 'IST', to: 'HND', airline: 'Turkish Airlines', flight_number: 'TK 46', dep_day_id: 11, dep_time: '16:30', arr_day_id: 12, arr_time: '09:00' },
        ],
      },
      endpoints: [
        { id: 1, reservation_id: 43, role: 'from', sequence: 0, name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin', local_date: null, local_time: null },
        { id: 2, reservation_id: 43, role: 'stop', sequence: 1, name: 'Istanbul (IST)', code: 'IST', lat: 41.27, lng: 28.75, timezone: 'Europe/Istanbul', local_date: null, local_time: null },
        { id: 3, reservation_id: 43, role: 'to', sequence: 2, name: 'Tokyo (HND)', code: 'HND', lat: 35.55, lng: 139.78, timezone: 'Asia/Tokyo', local_date: null, local_time: null },
      ],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport, handleSaveTransport }))

    expect(airportInputs().map(i => i.value)).toEqual(['FRA', 'IST', 'HND'])
    expect(timeInputs().map(i => i.value)).toEqual(['10:20', '14:05', '16:30', '09:00'])

    await submit('common.update')
    const legs = (handleSaveTransport.mock.calls[0][0].metadata as { legs: Record<string, unknown>[] }).legs
    expect(legs[0]).toMatchObject({ from: 'FRA', to: 'IST', day_positions: { '11': 3 } })
    expect(legs[1]).not.toHaveProperty('day_positions')
  })

  it('FE-MOB-TRFRM-047: each segment of a layover saves its own booking code (#1943)', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport }))
    typeTitle('FRA-IST-HND')
    // A direct flight writes no legs, so only the booking's own field is offered.
    expect(screen.getAllByPlaceholderText('reservations.confirmationPlaceholder')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'reservations.layover.addStop' }))
    setValue(airportInputs()[0], 'FRA')
    setValue(airportInputs()[1], 'IST')
    setValue(airportInputs()[2], 'HND')

    const codes = screen.getAllByPlaceholderText('reservations.confirmationPlaceholder')
    expect(codes).toHaveLength(3)
    setValue(codes[0], 'ABC123')
    setValue(codes[1], 'XYZ789')
    setValue(codes[2], 'BOOK1')

    await submit()

    const payload = handleSaveTransport.mock.calls[0][0]
    const legs = (payload.metadata as { legs: Record<string, unknown>[] }).legs
    expect(legs.map(l => l.confirmation_number)).toEqual(['ABC123', 'XYZ789'])
    // The booking's own reference stays on its column, never on a segment.
    expect(payload.confirmation_number).toBe('BOOK1')
    expect(payload.metadata).not.toHaveProperty('confirmation_number')
  })

  it('FE-MOB-TRFRM-048: a re-save on the phone keeps the stored segment codes (#1943)', async () => {
    const handleSaveTransport = makeSave()
    const editingTransport = {
      id: 45, trip_id: 1, type: 'flight', title: 'FRA-IST-HND', status: 'pending',
      day_id: 11, end_day_id: 12, confirmation_number: 'BOOK1',
      metadata: {
        legs: [
          { from: 'FRA', to: 'IST', confirmation_number: 'ABC123', dep_day_id: 11, dep_time: '10:20', arr_day_id: 11, arr_time: '14:05' },
          { from: 'IST', to: 'HND', confirmation_number: 'XYZ789', dep_day_id: 11, dep_time: '16:30', arr_day_id: 12, arr_time: '09:00' },
        ],
      },
      endpoints: [
        { id: 1, reservation_id: 45, role: 'from', sequence: 0, name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin', local_date: null, local_time: null },
        { id: 2, reservation_id: 45, role: 'stop', sequence: 1, name: 'Istanbul (IST)', code: 'IST', lat: 41.27, lng: 28.75, timezone: 'Europe/Istanbul', local_date: null, local_time: null },
        { id: 3, reservation_id: 45, role: 'to', sequence: 2, name: 'Tokyo (HND)', code: 'HND', lat: 35.55, lng: 139.78, timezone: 'Asia/Tokyo', local_date: null, local_time: null },
      ],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport, handleSaveTransport }))

    const codes = screen.getAllByPlaceholderText('reservations.confirmationPlaceholder') as HTMLInputElement[]
    expect(codes.map(i => i.value)).toEqual(['ABC123', 'XYZ789', 'BOOK1'])

    await submit('common.update')

    const legs = (handleSaveTransport.mock.calls[0][0].metadata as { legs: Record<string, unknown>[] }).legs
    expect(legs.map(l => l.confirmation_number)).toEqual(['ABC123', 'XYZ789'])
  })

  it('FE-MOB-TRFRM-023: an edited flight without endpoints falls back to the reservation times', () => {
    const editingTransport = {
      id: 44, trip_id: 1, type: 'flight', title: 'Legacy flight', status: 'pending',
      day_id: 11, end_day_id: 13,
      reservation_time: '2026-05-01T06:00', reservation_end_time: '2026-05-03T21:30',
      metadata: { airline: 'Air Legacy', flight_number: 'AL 1', seat: '9F' },
      endpoints: [],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport }))
    expect(airportInputs().map(i => i.value)).toEqual(['', ''])
    expect(daySelects().map(s => s.value)).toEqual(['11', '13'])
    expect(timeInputs().map(i => i.value)).toEqual(['06:00', '21:30'])
    expect(screen.getByPlaceholderText('Lufthansa')).toHaveValue('Air Legacy')
  })

  it('FE-MOB-TRFRM-024: an edited train without endpoints falls back to the flat metadata', () => {
    const editingTransport = {
      id: 45, trip_id: 1, type: 'train', title: 'Legacy train', status: 'pending',
      day_id: 12, reservation_time: '2026-05-02T07:45', reservation_end_time: '2026-05-02T09:12',
      metadata: { train_number: 'ICE 599', platform: '7', seat: '12C' },
      endpoints: [],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport }))
    expect(screen.getByPlaceholderText('ICE 123')).toHaveValue('ICE 599')
    expect(screen.getByPlaceholderText('12')).toHaveValue('7')
    expect(screen.getByPlaceholderText('42A')).toHaveValue('12C')
    expect(timeInputs().map(i => i.value)).toEqual(['07:45', '09:12'])
  })

  it('FE-MOB-TRFRM-025: an unknown booking type is edited as a flight', () => {
    const editingTransport = {
      id: 46, trip_id: 1, type: 'hotel', title: 'Wrong type', status: 'pending', endpoints: [], metadata: null,
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport }))
    expect(screen.getByRole('button', { name: 'reservations.type.flight' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-TRFRM-026: keeps a transit itinerary and its stops while the endpoints stay put', async () => {
    const handleSaveTransport = makeSave()
    const editingTransport = {
      id: 47, trip_id: 1, type: 'transit', title: 'U4 to Prater', status: 'pending', day_id: 12,
      reservation_time: '2026-05-02T09:05', reservation_end_time: '2026-05-02T09:30',
      metadata: { transit: { legs: [{ mode: 'SUBWAY', line: 'U4' }] }, airtrail_ids: [7, 8] },
      endpoints: [
        { id: 1, reservation_id: 47, role: 'from', sequence: 0, name: 'Osaka Station', code: null, lat: 34.7, lng: 135.5, timezone: null, local_date: '2026-05-02', local_time: '09:05' },
        { id: 2, reservation_id: 47, role: 'stop', sequence: 1, name: 'Change', code: null, lat: 34.8, lng: 135.6, timezone: null, local_date: '2026-05-02', local_time: '09:15' },
        { id: 3, reservation_id: 47, role: 'to', sequence: 2, name: 'Kyoto Station', code: null, lat: 34.98, lng: 135.75, timezone: null, local_date: '2026-05-02', local_time: '09:30' },
      ],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport, handleSaveTransport }))

    expect(locationInputs().map(i => i.value)).toEqual(['Osaka Station', 'Kyoto Station'])
    await submit('common.update')

    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.metadata).toEqual({
      transit: { legs: [{ mode: 'SUBWAY', line: 'U4' }] },
      airtrail_ids: [7, 8],
    })
    expect(payload.endpoints).toEqual([
      expect.objectContaining({ role: 'from', sequence: 0, name: 'Osaka Station' }),
      expect.objectContaining({ role: 'stop', sequence: 1, name: 'Change', local_time: '09:15' }),
      expect.objectContaining({ role: 'to', sequence: 2, name: 'Kyoto Station' }),
    ])
  })

  it('FE-MOB-TRFRM-027: changing an endpoint drops the stale transit itinerary', async () => {
    const handleSaveTransport = makeSave()
    const editingTransport = {
      id: 48, trip_id: 1, type: 'transit', title: 'U4 to Prater', status: 'pending', day_id: 12,
      metadata: { transit: { legs: [{ mode: 'SUBWAY', line: 'U4' }] } },
      endpoints: [
        { id: 1, reservation_id: 48, role: 'from', sequence: 0, name: 'Osaka Station', code: null, lat: 34.7, lng: 135.5, timezone: null, local_date: null, local_time: null },
        { id: 2, reservation_id: 48, role: 'stop', sequence: 1, name: 'Change', code: null, lat: 34.8, lng: 135.6, timezone: null, local_date: null, local_time: null },
        { id: 3, reservation_id: 48, role: 'to', sequence: 2, name: 'Kyoto Station', code: null, lat: 34.98, lng: 135.75, timezone: null, local_date: null, local_time: null },
      ],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport, handleSaveTransport }))
    setValue(locationInputs()[1], 'nara')

    await submit('common.update')
    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.metadata).toBeNull()
    expect(payload.endpoints).toEqual([
      expect.objectContaining({ role: 'from', name: 'Osaka Station' }),
      expect.objectContaining({ role: 'to', sequence: 1, name: 'Nara Station' }),
    ])
  })

  it('FE-MOB-TRFRM-028: deleting asks for a second tap before it removes the booking', async () => {
    const editingTransport = {
      id: 49, trip_id: 1, type: 'bus', title: 'Bus', status: 'pending', endpoints: [], metadata: null,
    } as unknown as Reservation
    const planner = makePlanner({ editingTransport })
    renderSheet(planner)

    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    expect(planner.toast.warning).toHaveBeenCalledWith('mobileTrip.tapAgainToDelete')
    expect(planner.handleDeleteReservation).not.toHaveBeenCalled()

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.delete' })) })
    expect(planner.handleDeleteReservation).toHaveBeenCalledWith(49)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(false)
  })

  it('FE-MOB-TRFRM-029: imports a parsed booking with its day, source file and parsed price', async () => {
    const handleSaveTransport = makeSave()
    const addFile = vi.fn(async (_tripId: number, _form: FormData) => undefined)
    const sourceFile = new File(['pdf'], 'voucher.pdf')
    const transportPrefill = {
      type: 'car', title: 'Rental car', status: 'pending',
      reservation_time: '2026-05-02T09:00', reservation_end_time: '2026-05-03T18:00',
      metadata: { price: 120 }, endpoints: [], _sourceFiles: [sourceFile],
    }
    const planner = makePlanner({
      transportPrefill, handleSaveTransport, tripActions: { addFile },
    })
    renderSheet(planner)

    expect(screen.getByPlaceholderText('reservations.titlePlaceholder')).toHaveValue('Rental car')
    expect(screen.getByRole('button', { name: 'reservations.type.car' })).toHaveAttribute('aria-pressed', 'true')
    expect(daySelects().map(s => s.value)).toEqual(['12', '13'])
    expect(timeInputs().map(i => i.value)).toEqual(['09:00', '18:00'])
    expect(screen.getByRole('button', { name: 'drop-voucher.pdf' })).toBeInTheDocument()

    await submit()
    const payload = handleSaveTransport.mock.calls[0][0]
    expect(payload.create_budget_entry).toEqual({ total_price: 120, category: 'transport' })
    expect(addFile).toHaveBeenCalledTimes(1)
    expect(addFile.mock.calls[0][0]).toBe(1)
    expect((addFile.mock.calls[0][1] as FormData).get('description')).toBe('Rental car')
  })

  it('FE-MOB-TRFRM-030: a prefill without a price and with the budget addon off skips the cost entry', async () => {
    seedStore(useAddonStore, { addons: [] })
    const handleSaveTransport = makeSave()
    const planner = makePlanner({
      transportPrefill: { type: 'bus', title: 'Shuttle', metadata: { price: 0 }, endpoints: [] },
      handleSaveTransport,
    })
    renderSheet(planner)
    expect(screen.queryByRole('button', { name: 'reservations.createExpense' })).not.toBeInTheDocument()
    await submit()
    expect(handleSaveTransport.mock.calls[0][0]).not.toHaveProperty('create_budget_entry')
  })

  it('FE-MOB-TRFRM-031: attaching and dropping files only uploads what is left', async () => {
    const handleSaveTransport = makeSave()
    const addFile = vi.fn(async (_tripId: number, _form: FormData) => undefined)
    renderSheet(makePlanner({ handleSaveTransport, tripActions: { addFile } }))
    typeTitle('Flight with docs')
    fireEvent.click(screen.getByRole('button', { name: 'attach-file' }))
    fireEvent.click(screen.getByRole('button', { name: 'attach-file' }))
    expect(screen.getAllByRole('button', { name: 'drop-extra.pdf' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'drop-extra.pdf' })[0])

    await submit()
    expect(addFile).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TRFRM-032: hides the file row without upload permission', () => {
    renderSheet(makePlanner({ canUploadFiles: false }))
    expect(screen.queryByRole('button', { name: 'attach-file' })).not.toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-033: assigns travelers and persists them once the booking has an id', async () => {
    const setReservationTravelers = vi.fn(async (_tripId: number, _resId: number, _ids: number[]) => undefined)
    seedStore(useTripStore, { setReservationTravelers })
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ handleSaveTransport, tripMembers: MEMBERS }))
    typeTitle('Shared flight')
    fireEvent.click(screen.getByRole('button', { name: /maurice/ }))
    fireEvent.click(screen.getByRole('button', { name: /julien/ }))
    fireEvent.click(screen.getByRole('button', { name: /maurice/ }))

    await submit()
    expect(setReservationTravelers).toHaveBeenCalledWith(1, 99, [5])
  })

  it('FE-MOB-TRFRM-034: leaves the traveler list alone when nothing changed', async () => {
    const setReservationTravelers = vi.fn(async (_tripId: number, _resId: number, _ids: number[]) => undefined)
    seedStore(useTripStore, { setReservationTravelers })
    const editingTransport = {
      id: 50, trip_id: 1, type: 'bus', title: 'Bus', status: 'pending', endpoints: [], metadata: null,
      travelers: [{ user_id: 4, username: 'maurice' }],
    } as unknown as Reservation
    renderSheet(makePlanner({ editingTransport, tripMembers: MEMBERS, handleSaveTransport: makeSave(null) }))
    expect(screen.getByRole('button', { name: /maurice/ }).className).not.toContain('opacity-60')

    await submit('common.update')
    expect(setReservationTravelers).not.toHaveBeenCalled()
  })

  it('FE-MOB-TRFRM-035: shows the empty hint when the trip has no members', () => {
    renderSheet(makePlanner({ tripMembers: [] }))
    expect(screen.getByText('reservations.travelers.none')).toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-036: creating an expense saves first and hands the new id to the cost sheet', async () => {
    const handleSaveTransport = makeSave()
    const onOpenExpense = vi.fn()
    renderSheet(makePlanner({ handleSaveTransport }), onOpenExpense)
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.ferry' }))
    typeTitle('Ferry ticket')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'reservations.createExpense' }))
    })
    expect(handleSaveTransport).toHaveBeenCalledTimes(1)
    expect(onOpenExpense).toHaveBeenCalledWith({
      prefill: { reservationId: 99, name: 'Ferry ticket', category: 'transport' },
    })
  })

  it('FE-MOB-TRFRM-037: a plain save does not open the cost sheet', async () => {
    const onOpenExpense = vi.fn()
    renderSheet(makePlanner({ handleSaveTransport: makeSave() }), onOpenExpense)
    typeTitle('No costs please')
    await submit()
    expect(onOpenExpense).not.toHaveBeenCalled()
  })

  it('FE-MOB-TRFRM-038: the automated tab asks for a day before it searches', () => {
    renderSheet(makePlanner({ transportModalAutomated: true }))
    expect(screen.getByRole('dialog', { name: 'transit.title' })).toBeInTheDocument()
    expect(screen.getByText('transit.pickDay')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.add' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-039: the transit panel gets the chosen day, its ordered places and the prefill', () => {
    const planner = makePlanner({
      transportModalAutomated: true,
      transportModalDayId: 12,
      transitPrefill: { from: { name: 'Hotel', lat: 34.7, lng: 135.5 }, to: null },
      places: [{ id: 1, name: 'Fushimi Inari' }, { id: 2, name: 'Nishiki Market' }],
      assignments: { '12': [{ id: 9, place_id: 2, order_index: 1 }, { id: 8, place_id: 1, order_index: 0 }] },
    })
    renderSheet(planner)
    expect(screen.getByTestId('transit-day')).toHaveTextContent('12')
    expect(screen.getByTestId('transit-places')).toHaveTextContent('Fushimi Inari,Nishiki Market')
    expect(screen.getByTestId('transit-from')).toHaveTextContent('Hotel')
  })

  it('FE-MOB-TRFRM-040: the transit panel saves its itinerary through the shared save path', async () => {
    const handleSaveTransport = makeSave()
    renderSheet(makePlanner({ transportModalAutomated: true, transportModalDayId: 12, handleSaveTransport }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'add-itinerary' })) })
    expect(handleSaveTransport).toHaveBeenCalledWith({ title: 'U4 to Prater', type: 'transit' })
  })

  it('FE-MOB-TRFRM-041: switching between manual and automated swaps the form', () => {
    renderSheet(makePlanner())
    expect(screen.getByText('reservations.bookingType')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'transport.modeAutomated' }))
    expect(screen.queryByText('reservations.bookingType')).not.toBeInTheDocument()
    expect(screen.getByText('transit.searchHint')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'transport.modeManual' }))
    expect(screen.getByText('reservations.bookingType')).toBeInTheDocument()
  })

  it('FE-MOB-TRFRM-042: a new booking opened from a day preselects that day', () => {
    renderSheet(makePlanner({ transportModalDayId: 13 }))
    fireEvent.click(screen.getByRole('button', { name: 'reservations.type.bus' }))
    expect(daySelects().map(s => s.value)).toEqual(['13', '13'])
  })
})
