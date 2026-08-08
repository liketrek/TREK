// FE-PLANNER-TRANSITJOURNEY-001 to 016 — the journey view for a saved transit entry.
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render'
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
    // stat tiles: value + caption
    expect(screen.getByText('Transfers')).toBeInTheDocument()
    expect(screen.getByText('Walking')).toBeInTheDocument()
    expect(screen.getByText(/Platform 2/)).toBeInTheDocument()
    expect(screen.getByText(/Ruhleben/)).toBeInTheDocument()
    expect(screen.getByText(/BVG/)).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-002: inline title rename + notes save as a minimal field payload', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue({})
    render(<TransitJourneyModal {...makeProps({ onSave })} />)
    // The title renames inline in the header via its pencil.
    await user.click(screen.getByLabelText('Edit'))
    const titleInput = screen.getByDisplayValue('Fernsehturm → Zoo')
    await user.clear(titleInput)
    await user.type(titleInput, 'Zum Zoo')
    await user.keyboard('{Enter}')
    await user.type(screen.getByPlaceholderText(/notes/i), 'Take **coffee**')
    await user.click(screen.getByRole('button', { name: /^Save$/ }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({ title: 'Zum Zoo', notes: 'Take **coffee**' })
  })

  it('FE-PLANNER-TRANSITJOURNEY-006: no status or booking-code fields; notes support a markdown preview', async () => {
    const user = userEvent.setup()
    render(<TransitJourneyModal {...makeProps()} />)
    expect(screen.queryByText('Status')).not.toBeInTheDocument()
    expect(screen.queryByText(/Booking code|Confirmation/i)).not.toBeInTheDocument()
    await user.type(screen.getByPlaceholderText(/notes/i), '**bold** note')
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    const bold = document.querySelector('.collab-note-md strong')
    expect(bold?.textContent).toBe('bold')
  })

  it('FE-PLANNER-TRANSITJOURNEY-008: existing notes open rendered as markdown, not raw text', () => {
    const res = { ...makeReservation(), notes: 'bring **wefwe** along' }
    render(<TransitJourneyModal {...makeProps({ reservation: res })} />)
    // Preview tab is active on open: bold is rendered, no raw asterisks visible.
    const bold = document.querySelector('.collab-note-md strong')
    expect(bold?.textContent).toBe('wefwe')
    expect(screen.queryByDisplayValue(/\*\*wefwe\*\*/)).not.toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-007: the markdown toolbar wraps the note text', async () => {
    const user = userEvent.setup()
    render(<TransitJourneyModal {...makeProps()} />)
    const area = screen.getByPlaceholderText(/notes/i) as HTMLTextAreaElement
    await user.type(area, 'coffee')
    area.setSelectionRange(0, 6)
    await user.click(screen.getByRole('button', { name: 'Bold' }))
    expect(area.value).toBe('**coffee**')
    await user.click(screen.getByRole('button', { name: 'Checklist' }))
    expect((screen.getByPlaceholderText(/notes/i) as HTMLTextAreaElement).value).toMatch(/^- \[ \] /)
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

  it('FE-PLANNER-TRANSITJOURNEY-009: metadata stored as a JSON string is parsed into the itinerary', () => {
    const res = makeReservation()
    res.metadata = JSON.stringify(res.metadata)
    render(<TransitJourneyModal {...makeProps({ reservation: res })} />)
    expect(screen.getByText('U2')).toBeInTheDocument()
    expect(screen.getByText('Transfers')).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-010: unparsable metadata degrades to a journey without an itinerary', () => {
    const res = { ...makeReservation(), metadata: '{not json' }
    render(<TransitJourneyModal {...makeProps({ reservation: res })} />)
    // Title/date header still renders, the stat tiles and legs do not.
    expect(screen.getByText('Fernsehturm')).toBeInTheDocument()
    expect(screen.queryByText('Transfers')).not.toBeInTheDocument()
    expect(screen.queryByText('U2')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-011: a zero-duration, zero-walk journey renders em dashes, not "0 min"', () => {
    const res = makeReservation()
    res.metadata = { transit: { ...res.metadata.transit, duration: 0, walk_seconds: 12, transfers: 0 } }
    render(<TransitJourneyModal {...makeProps({ reservation: res })} />)
    // Duration + walking tiles both fall back to the dash; transfers shows 0.
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-012: Escape while renaming restores the previous title', async () => {
    const user = userEvent.setup()
    render(<TransitJourneyModal {...makeProps()} />)
    await user.click(screen.getByLabelText('Edit'))
    const input = screen.getByDisplayValue('Fernsehturm → Zoo')
    await user.clear(input)
    await user.type(input, 'Scrapped')
    await user.keyboard('{Escape}')
    // Inline editing closed and the original title is back — save stays disabled.
    expect(screen.queryByDisplayValue('Scrapped')).not.toBeInTheDocument()
    expect(screen.getByText('Fernsehturm')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeDisabled()
  })

  it('FE-PLANNER-TRANSITJOURNEY-013: blurring the title input closes inline editing but keeps the typed name', async () => {
    const user = userEvent.setup()
    render(<TransitJourneyModal {...makeProps()} />)
    await user.click(screen.getByLabelText('Edit'))
    const input = screen.getByDisplayValue('Fernsehturm → Zoo')
    await user.clear(input)
    await user.type(input, 'Zum Zoo')
    fireEvent.blur(input)
    expect(screen.queryByDisplayValue('Zum Zoo')).not.toBeInTheDocument()
    expect(screen.getByText('Zum Zoo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeEnabled()
  })

  it('FE-PLANNER-TRANSITJOURNEY-014: switching to a different reservation re-seeds title and notes', () => {
    const first = { ...makeReservation(), notes: 'first note' }
    const { rerender } = render(<TransitJourneyModal {...makeProps({ reservation: first })} />)
    expect(document.querySelector('.collab-note-md')?.textContent).toContain('first note')

    const second = { ...makeReservation(), id: 8, title: 'Zoo → Hbf', notes: '' }
    rerender(<TransitJourneyModal {...makeProps({ reservation: second })} />)
    expect(screen.getByText('Hbf')).toBeInTheDocument()
    // No notes on the new entry → the write tab is active again.
    expect(screen.getByPlaceholderText(/notes/i)).toBeInTheDocument()
  })
})

describe('TransitJourneyModal (mobile viewport)', () => {
  const desktopWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 420 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: desktopWidth })
  })

  function makeMobileReservation() {
    const res = makeReservation()
    res.metadata = {
      transit: {
        provider: 'transitous', duration: 1800, transfers: 1, walk_seconds: 240,
        legs: [
          { mode: 'WALK', duration: 240, from: { name: 'Start' }, to: { name: 'Alexanderplatz' } },
          {
            mode: 'SUBWAY', line: 'U2', line_color: '#FF3300', line_text_color: '#FFFFFF',
            headsign: 'Ruhleben', agency: 'BVG', duration: 1440, stops: 6,
            from: { name: 'Alexanderplatz', time: '08:36', track: '2' },
            to: { name: 'Zoo', time: '09:00' },
          },
          // No line/colour/headsign/agency and no times — exercises every fallback.
          { mode: 'BUS', from: { name: 'Zoo' }, to: { name: 'Kudamm' } },
        ],
      },
    }
    return res
  }

  it('FE-PLANNER-TRANSITJOURNEY-015: renders the per-leg rail with platform, headsign and meta line', () => {
    render(<TransitJourneyModal {...makeProps({ reservation: makeMobileReservation() })} />)
    expect(screen.getByText('U2')).toBeInTheDocument()
    expect(screen.getByText(/Platform 2/)).toBeInTheDocument()
    expect(screen.getByText('Ruhleben')).toBeInTheDocument()
    // mins · stops · agency collapse into one quiet line.
    expect(screen.getByText(/24 min · 6 stops · BVG/)).toBeInTheDocument()
    expect(screen.getByText('08:36')).toBeInTheDocument()
    // The meta-less leg falls back to its mode as the badge and shows no meta line.
    expect(screen.getByText('BUS')).toBeInTheDocument()
    expect(screen.getByText('Kudamm')).toBeInTheDocument()
  })

  it('FE-PLANNER-TRANSITJOURNEY-016: mobile stat tiles stay iconless but keep value + caption', () => {
    render(<TransitJourneyModal {...makeProps({ reservation: makeMobileReservation() })} />)
    expect(screen.getByText('Transfers')).toBeInTheDocument()
    expect(screen.getByText('Walking')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    // Delete collapses to an icon-only button on a phone.
    const deleteBtn = screen.getByRole('button', { name: 'Delete' })
    expect(deleteBtn.textContent?.trim()).toBe('')
  })
})
