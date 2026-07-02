// FE-PLANNER-TRANSIT-001 to FE-PLANNER-TRANSIT-006
import { render, screen, waitFor } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { buildUser, buildDay, buildPlace } from '../../../tests/helpers/factories'
import TransitSearchModal from './TransitSearchModal'

const { transitApiMock } = vi.hoisted(() => ({
  transitApiMock: { geocode: vi.fn(), plan: vi.fn() },
}))

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal() as object
  return { ...actual, transitApi: transitApiMock }
})

vi.mock('../shared/Toast', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))

// Berlin, summer time (UTC+2): 06:30Z departs 08:30 local, 07:00Z arrives 09:00.
const ITINERARY = {
  startTime: '2025-06-01T06:30:00Z',
  endTime: '2025-06-01T07:00:00Z',
  duration: 1800,
  transfers: 1,
  walkSeconds: 240,
  legs: [
    { mode: 'WALK', from: { name: 'Start', lat: 52.52, lng: 13.4, time: '2025-06-01T06:30:00Z', scheduledTime: null, track: null }, to: { name: 'Alexanderplatz', lat: 52.521, lng: 13.41, time: '2025-06-01T06:34:00Z', scheduledTime: null, track: null }, duration: 240, distance: 300, headsign: null, line: null, lineColor: null, lineTextColor: null, agency: null, intermediateStops: 0 },
    { mode: 'SUBWAY', from: { name: 'Alexanderplatz', lat: 52.521, lng: 13.41, time: '2025-06-01T06:36:00Z', scheduledTime: null, track: '2' }, to: { name: 'Zoologischer Garten', lat: 52.507, lng: 13.332, time: '2025-06-01T07:00:00Z', scheduledTime: null, track: null }, duration: 1440, distance: null, headsign: 'Ruhleben', line: 'U2', lineColor: '#FF3300', lineTextColor: '#FFFFFF', agency: 'BVG', intermediateStops: 6 },
  ],
}

const day = buildDay({ id: 10, trip_id: 1, date: '2025-06-01', title: 'Berlin Day' })

function makeProps(overrides = {}) {
  return {
    isOpen: true,
    onClose: vi.fn(),
    day,
    days: [day],
    places: [buildPlace({ id: 1, name: 'Fernsehturm', lat: 52.5208, lng: 13.4094 })],
    accommodations: [],
    onAdd: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
}

async function pickFromAndTo(user: ReturnType<typeof userEvent.setup>) {
  // Quick picks (the day's places) appear on focus with an empty query.
  const [fromInput, toInput] = screen.getAllByPlaceholderText('Search stop or station…')
  await user.click(fromInput)
  await user.click(await screen.findByText('Fernsehturm'))

  transitApiMock.geocode.mockResolvedValueOnce({ results: [{ name: 'Zoologischer Garten', lat: 52.507, lng: 13.332, type: 'STOP', area: 'Berlin' }] })
  await user.click(toInput)
  await user.type(toInput, 'Zoo')
  await user.click(await screen.findByText(/Zoologischer Garten/))
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true })
  seedStore(useSettingsStore, { settings: { time_format: '24h' } } as any)
})

describe('TransitSearchModal', () => {
  it('FE-PLANNER-TRANSIT-001: renders from/to pickers, modes and preferences', () => {
    render(<TransitSearchModal {...makeProps()} />)
    expect(screen.getByText('Public transit')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText('Search stop or station…')).toHaveLength(2)
    expect(screen.getByText('Subway')).toBeInTheDocument()
    expect(screen.getByText('Fewer transfers')).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSIT-002: searching lists itineraries with times, transfers and line badges', async () => {
    const user = userEvent.setup()
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [ITINERARY] })
    render(<TransitSearchModal {...makeProps()} />)
    await pickFromAndTo(user)
    await user.click(screen.getByRole('button', { name: /^Search$/ }))
    // Local Berlin times, U2 badge, 1 transfer.
    expect(await screen.findByText(/08:30 – 09:00/)).toBeInTheDocument()
    expect(screen.getByText('U2')).toBeInTheDocument()
    expect(screen.getByText('1 transfers')).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSIT-003: adding a route builds a transport payload with local times + endpoints', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue({})
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [ITINERARY] })
    render(<TransitSearchModal {...makeProps({ onAdd })} />)
    await pickFromAndTo(user)
    await user.click(screen.getByRole('button', { name: /^Search$/ }))
    await user.click(await screen.findByText(/08:30 – 09:00/))
    await user.click(await screen.findByRole('button', { name: 'Add to day' }))

    await waitFor(() => expect(onAdd).toHaveBeenCalled())
    const payload = onAdd.mock.calls[0][0]
    expect(payload.type).toBe('train') // dominant leg = SUBWAY → train
    expect(payload.title).toBe('Fernsehturm → Zoologischer Garten')
    expect(payload.day_id).toBe(10)
    expect(payload.reservation_time).toBe('2025-06-01T08:30')
    expect(payload.reservation_end_time).toBe('2025-06-01T09:00')
    expect(payload.status).toBe('confirmed')
    // from + to endpoints (single transit leg → no transfer stops)
    expect(payload.endpoints).toHaveLength(2)
    expect(payload.endpoints[0]).toMatchObject({ role: 'from', name: 'Fernsehturm', timezone: 'Europe/Berlin' })
    expect(payload.endpoints[1]).toMatchObject({ role: 'to', name: 'Zoologischer Garten' })
    // compact itinerary stored for the detail modal
    expect(payload.metadata.transit.provider).toBe('transitous')
    expect(payload.metadata.transit.legs).toHaveLength(2)
    expect(payload.metadata.transit.legs[1]).toMatchObject({ mode: 'SUBWAY', line: 'U2', line_color: '#FF3300', headsign: 'Ruhleben' })
  })

  it('FE-PLANNER-TRANSIT-004: search failure shows the empty state, not a crash', async () => {
    const user = userEvent.setup()
    transitApiMock.plan.mockRejectedValueOnce(new Error('boom'))
    render(<TransitSearchModal {...makeProps()} />)
    await pickFromAndTo(user)
    await user.click(screen.getByRole('button', { name: /^Search$/ }))
    expect(await screen.findByText(/No connections found/)).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSIT-005: preference "fewer transfers" re-ranks the list', async () => {
    const user = userEvent.setup()
    const direct = { ...ITINERARY, startTime: '2025-06-01T06:40:00Z', endTime: '2025-06-01T07:20:00Z', duration: 2400, transfers: 0 }
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [ITINERARY, direct] })
    render(<TransitSearchModal {...makeProps()} />)
    await pickFromAndTo(user)
    await user.click(screen.getByRole('button', { name: /^Search$/ }))
    await screen.findByText(/08:30 – 09:00/)
    await user.click(screen.getByText('Fewer transfers'))
    const cards = screen.getAllByText(/–/).filter(el => el.textContent?.match(/\d{2}:\d{2} – \d{2}:\d{2}/))
    // The direct (0-transfer) itinerary now ranks first.
    expect(cards[0].textContent).toContain('08:40')
  })

  it('FE-PLANNER-TRANSIT-006: swap exchanges from and to', async () => {
    const user = userEvent.setup()
    render(<TransitSearchModal {...makeProps()} />)
    const [fromInput] = screen.getAllByPlaceholderText('Search stop or station…')
    await user.click(fromInput)
    await user.click(await screen.findByText('Fernsehturm'))
    await user.click(screen.getByLabelText('Swap'))
    const inputs = screen.getAllByPlaceholderText('Search stop or station…')
    expect((inputs[0] as HTMLInputElement).value).toBe('')
    expect((inputs[1] as HTMLInputElement).value).toBe('Fernsehturm')
  })
})
