// FE-PLANNER-EXPORTMODAL-001 to FE-PLANNER-EXPORTMODAL-014
import { render, screen, waitFor } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { downloadTripPDF } from '../PDF/TripPDF'
import { buildDay, buildDayNote, buildTrip } from '../../../tests/helpers/factories'
import { TripExportModal } from './TripExportModal'

vi.mock('../PDF/TripPDF', () => ({ downloadTripPDF: vi.fn().mockResolvedValue(undefined) }))

// The subscribe dialog fetches its feed token on mount; it is exercised in its
// own test, here we only care that the entry mounts it.
vi.mock('./IcsSubscribeModal', () => ({
  IcsSubscribeModal: ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div data-testid="ics-subscribe-modal">
      {title}
      <button onClick={onClose}>close-subscribe</button>
    </div>
  ),
}))

const t = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}|${Object.values(params).join('|')}` : key

const trip = buildTrip({ id: 1, title: 'Roadtrip' })

function makeToast() {
  return {
    success: vi.fn((_m: string) => {}),
    error: vi.fn((_m: string) => {}),
    warning: vi.fn((_m: string) => {}),
    info: vi.fn((_m: string) => {}),
  }
}

function makeProps(overrides: Partial<React.ComponentProps<typeof TripExportModal>> = {}) {
  return {
    isOpen: true,
    onClose: vi.fn(),
    tripId: 1,
    trip,
    days: [],
    places: [],
    categories: [],
    assignments: {},
    reservations: [],
    dayNotes: {},
    t,
    locale: 'en-US',
    toast: makeToast(),
    ...overrides,
  } as React.ComponentProps<typeof TripExportModal>
}

let clickedHref: string | null

beforeEach(() => {
  vi.clearAllMocks()
  clickedHref = null
  // jsdom has neither of these, and an anchor click would navigate.
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
  globalThis.URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clickedHref = this.href
  })
})

afterEach(() => vi.restoreAllMocks())

const okResponse = (body = '<gpx/>') =>
  ({ ok: true, status: 200, blob: async () => new Blob([body]) }) as unknown as Response

describe('TripExportModal', () => {
  it('FE-PLANNER-EXPORTMODAL-001: closed, it renders nothing', () => {
    render(<TripExportModal {...makeProps({ isOpen: false })} />)
    expect(screen.queryByText('dayplan.export')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-EXPORTMODAL-002: open, every export sits in its own section', () => {
    render(<TripExportModal {...makeProps()} />)
    expect(screen.getByText('dayplan.exportDocument')).toBeInTheDocument()
    expect(screen.getByText('dayplan.exportCalendar')).toBeInTheDocument()
    expect(screen.getByText('dayplan.exportMaps · GPX')).toBeInTheDocument()
    for (const label of ['dayplan.pdf', 'mobileTrip.icsDownload', 'mobileTrip.icsSubscribe',
      'dayplan.gpxAll', 'dayplan.gpxPlaces', 'dayplan.gpxDays']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  // ── PDF ───────────────────────────────────────────────────────────────────

  it('FE-PLANNER-EXPORTMODAL-003: the PDF row exports the trip with the day notes flattened', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10, title: 'Day 1' })]
    const dayNotes = { '10': [buildDayNote({ id: 1, text: 'Bring cash' })] }
    render(<TripExportModal {...makeProps({ days, dayNotes })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(downloadTripPDF).toHaveBeenCalledTimes(1))
    expect(vi.mocked(downloadTripPDF).mock.calls[0][0]).toMatchObject({
      trip, days, dayNotes: [expect.objectContaining({ id: 1, text: 'Bring cash', day_id: 10 })],
    })
  })

  it('FE-PLANNER-EXPORTMODAL-004: a finished PDF export closes the dialog', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TripExportModal {...makeProps({ onClose })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('FE-PLANNER-EXPORTMODAL-005: a failing PDF export toasts the error and keeps the dialog open', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadTripPDF).mockRejectedValueOnce(new Error('font missing'))
    const toast = makeToast()
    const onClose = vi.fn()
    render(<TripExportModal {...makeProps({ toast, onClose })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('dayplan.pdfError: font missing'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-PLANNER-EXPORTMODAL-006: an aborted PDF export without an Error still reaches the toast', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadTripPDF).mockRejectedValueOnce('boom')
    const toast = makeToast()
    render(<TripExportModal {...makeProps({ toast })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('dayplan.pdfError: boom'))
  })

  // ── Calendar ──────────────────────────────────────────────────────────────

  it('FE-PLANNER-EXPORTMODAL-007: the ICS row fetches the export and hands it to a download link', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async () => okResponse('BEGIN:VCALENDAR'))
    vi.stubGlobal('fetch', fetchMock)
    render(<TripExportModal {...makeProps()} />)
    await user.click(screen.getByText('mobileTrip.icsDownload'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/trips/1/export.ics', { credentials: 'include' }))
    await waitFor(() => expect(clickedHref).toBe('blob:mock'))
  })

  it('FE-PLANNER-EXPORTMODAL-008: a rejected ICS export shows the failure toast', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response))
    const toast = makeToast()
    render(<TripExportModal {...makeProps({ toast })} />)
    await user.click(screen.getByText('mobileTrip.icsDownload'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('planner.icsExportFailed'))
    expect(clickedHref).toBeNull()
  })

  it('FE-PLANNER-EXPORTMODAL-009: the subscribe row opens the subscribe dialog and closes again', async () => {
    const user = userEvent.setup()
    render(<TripExportModal {...makeProps()} />)
    await user.click(screen.getByText('mobileTrip.icsSubscribe'))
    expect(screen.getByTestId('ics-subscribe-modal')).toBeInTheDocument()
    await user.click(screen.getByText('close-subscribe'))
    expect(screen.queryByTestId('ics-subscribe-modal')).not.toBeInTheDocument()
  })

  // The subscription mints a link that reads the trip without an account, so it
  // needs share_manage; the one-off download is a file this member may already
  // read. Leaving the entry visible would only produce a dialog whose enable
  // button the server refuses.
  it('FE-PLANNER-EXPORTMODAL-010: without share_manage the download stays and the subscription goes', () => {
    render(<TripExportModal {...makeProps({ canManageShare: false })} />)
    expect(screen.getByText('mobileTrip.icsDownload')).toBeInTheDocument()
    expect(screen.queryByText('mobileTrip.icsSubscribe')).not.toBeInTheDocument()
  })

  // ── GPX (#1442) ───────────────────────────────────────────────────────────

  it('FE-PLANNER-EXPORTMODAL-011: each scope asks the server for exactly its own selection', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async () => okResponse())
    vi.stubGlobal('fetch', fetchMock)
    for (const [label, expected] of [
      ['dayplan.gpxAll', '/api/trips/1/places/export.gpx'],
      ['dayplan.gpxPlaces', '/api/trips/1/places/export.gpx?dayRoutes=false'],
      ['dayplan.gpxDays', '/api/trips/1/places/export.gpx?waypoints=false&tracks=false'],
    ] as const) {
      const view = render(<TripExportModal {...makeProps()} />)
      await user.click(screen.getByText(label))
      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expected, { credentials: 'include' }))
      fetchMock.mockClear()
      view.unmount()
    }
  })

  it('FE-PLANNER-EXPORTMODAL-012: a download names the file after the trip', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => okResponse()))
    render(<TripExportModal {...makeProps()} />)
    await user.click(screen.getByText('dayplan.gpxAll'))
    await waitFor(() => expect(clickedHref).toBe('blob:mock'))
    await waitFor(() => expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled())
  })

  it('FE-PLANNER-EXPORTMODAL-013: an empty trip says so instead of reporting a failure', async () => {
    const user = userEvent.setup()
    const toast = makeToast()
    const onClose = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }) as unknown as Response))
    render(<TripExportModal {...makeProps({ toast, onClose })} />)
    await user.click(screen.getByText('dayplan.gpxAll'))
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('dayplan.gpxEmpty'))
    expect(toast.error).not.toHaveBeenCalled()
    expect(clickedHref).toBeNull()
    // Nothing was downloaded, so the dialog stays put.
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-PLANNER-EXPORTMODAL-014: a real failure toasts the error', async () => {
    const user = userEvent.setup()
    const toast = makeToast()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response))
    render(<TripExportModal {...makeProps({ toast })} />)
    await user.click(screen.getByText('dayplan.gpxAll'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('dayplan.gpxFailed'))
  })
})
