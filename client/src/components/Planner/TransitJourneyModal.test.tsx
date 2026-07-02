// FE-PLANNER-TRANSITJOURNEY-001 to 005 — the journey view for a saved transit entry.
import { render, screen, waitFor } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { buildUser, buildReservation } from '../../../tests/helpers/factories'
import TransitJourneyModal from './TransitJourneyModal'

function makeReservation() {
  return {
    ...buildReservation({ id: 7, type: 'transit', title: 'Fernsehturm → Zoo', reservation_time: '2025-06-01T08:30:00', status: 'confirmed' }),
    metadata: {
      transit: {
        provider: 'transitous', duration: 1800, transfers: 1, walk_seconds: 240,
        legs: [
          { mode: 'WALK', duration: 240, from: { name: 'Start' }, to: { name: 'Alexanderplatz' } },
          { mode: 'SUBWAY', line: 'U2', line_color: '#FF3300', line_text_color: '#FFFFFF', headsign: 'Ruhleben', agency: 'BVG', duration: 1440, stops: 6, from: { name: 'Alexanderplatz', time: '08:36', track: '2' }, to: { name: 'Zoo', time: '09:00' } },
        ],
      },
    },
    endpoints: [
      { role: 'from', sequence: 0, name: 'Fernsehturm', code: null, lat: 52.52, lng: 13.4, timezone: 'Europe/Berlin', local_date: null, local_time: null },
      { role: 'to', sequence: 1, name: 'Zoo', code: null, lat: 52.5, lng: 13.33, timezone: 'Europe/Berlin', local_date: null, local_time: null },
    ],
  } as any
}

function makeProps(overrides = {}) {
  return {
    reservation: makeReservation(),
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue({}),
    onDelete: vi.fn().mockResolvedValue({}),
    onChangeRoute: vi.fn(),
    canEdit: true,
    ...overrides,
  }
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true })
  seedStore(useSettingsStore, { settings: { time_format: '24h' } } as any)
})

describe('TransitJourneyModal', () => {
  it('FE-PLANNER-TRANSITJOURNEY-001: shows summary, line badge, platform and legs', () => {
    render(<TransitJourneyModal {...makeProps()} />)
    expect(screen.getByText('U2')).toBeInTheDocument()
    expect(screen.getByText('1 transfers')).toBeInTheDocument()
    expect(screen.getByText(/Platform 2/)).toBeInTheDocument()
    expect(screen.getByText(/Ruhleben/)).toBeInTheDocument()
    expect(screen.getByText(/BVG/)).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-002: saving edited fields calls onSave with the field payload only', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue({})
    render(<TransitJourneyModal {...makeProps({ onSave })} />)
    const titleInput = screen.getByDisplayValue('Fernsehturm → Zoo')
    await user.clear(titleInput)
    await user.type(titleInput, 'Zum Zoo')
    await user.click(screen.getByRole('button', { name: /^Save$/ }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({ title: 'Zum Zoo', status: 'confirmed', confirmation_number: null, notes: null })
  })

  it('FE-PLANNER-TRANSITJOURNEY-003: change route triggers onChangeRoute', async () => {
    const user = userEvent.setup()
    const onChangeRoute = vi.fn()
    render(<TransitJourneyModal {...makeProps({ onChangeRoute })} />)
    await user.click(screen.getByRole('button', { name: /Change route/ }))
    expect(onChangeRoute).toHaveBeenCalled()
  })

  it('FE-PLANNER-TRANSITJOURNEY-004: delete asks for confirmation, then calls onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue({})
    render(<TransitJourneyModal {...makeProps({ onDelete })} />)
    await user.click(screen.getByRole('button', { name: /^Delete$/ }))
    expect(onDelete).not.toHaveBeenCalled()
    // Confirm dialog appears — confirm it.
    const confirmBtns = await screen.findAllByRole('button', { name: /Delete/ })
    await user.click(confirmBtns[confirmBtns.length - 1])
    await waitFor(() => expect(onDelete).toHaveBeenCalled())
  })

  it('FE-PLANNER-TRANSITJOURNEY-005: read-only without edit rights — no delete/save/change-route', () => {
    render(<TransitJourneyModal {...makeProps({ canEdit: false })} />)
    expect(screen.queryByRole('button', { name: /^Delete$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change route/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Save$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Close/ })).toBeInTheDocument()
  })
})
