// FE-PLANNER-DPTOOLBAR-001 to FE-PLANNER-DPTOOLBAR-022
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { downloadTripPDF } from '../PDF/TripPDF'
import { buildDay, buildDayNote, buildReservation, buildTrip } from '../../../tests/helpers/factories'
import { DayPlanSidebarToolbar } from './DayPlanSidebarToolbar'
import type { Reservation } from '../../types'

vi.mock('../PDF/TripPDF', () => ({ downloadTripPDF: vi.fn().mockResolvedValue(undefined) }))

// The subscribe dialog fetches its feed token on mount; it is exercised in its
// own test, here we only care that opening the menu entry mounts it.
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

function makeProps(overrides: Partial<React.ComponentProps<typeof DayPlanSidebarToolbar>> = {}) {
  return {
    tripId: 1,
    trip,
    days: [],
    places: [],
    categories: [],
    assignments: {},
    reservations: [] as Reservation[],
    dayNotes: {},
    t,
    locale: 'en-US',
    toast: makeToast(),
    icsHover: false,
    setIcsHover: vi.fn((_v: boolean) => {}),
    expandedDays: new Set<number>(),
    setExpandedDays: vi.fn((_v: Set<number>) => {}),
    canUndo: false,
    undoHover: false,
    setUndoHover: vi.fn((_v: boolean) => {}),
    lastActionLabel: null,
    ...overrides,
  }
}

const routableReservation = () => buildReservation({
  id: 5, type: 'flight', title: 'BER → CDG',
  endpoints: [
    { role: 'from', sequence: 0, name: 'BER', code: null, lat: 52.3, lng: 13.5, timezone: null, local_date: null, local_time: null },
    { role: 'to', sequence: 1, name: 'CDG', code: null, lat: 49.0, lng: 2.5, timezone: null, local_date: null, local_time: null },
  ],
} as Partial<Reservation>)

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('DayPlanSidebarToolbar', () => {
  // ── PDF export ────────────────────────────────────────────────────────────

  it('FE-PLANNER-DPTOOLBAR-001: the PDF button exports the trip with the day notes flattened', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10, title: 'Day 1' })]
    const dayNotes = { '10': [buildDayNote({ id: 1, text: 'Bring cash' })] }
    render(<DayPlanSidebarToolbar {...makeProps({ days, dayNotes })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(downloadTripPDF).toHaveBeenCalledTimes(1))
    expect(vi.mocked(downloadTripPDF).mock.calls[0][0]).toMatchObject({
      trip, days, dayNotes: [expect.objectContaining({ id: 1, text: 'Bring cash', day_id: 10 })],
    })
  })

  it('FE-PLANNER-DPTOOLBAR-002: a failing PDF export surfaces the error via the toast', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadTripPDF).mockRejectedValueOnce(new Error('font missing'))
    const toast = makeToast()
    render(<DayPlanSidebarToolbar {...makeProps({ toast })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('dayplan.pdfError: font missing'))
  })

  it('FE-PLANNER-DPTOOLBAR-003: hovering the PDF button shows the export tooltip', async () => {
    const user = userEvent.setup()
    render(<DayPlanSidebarToolbar {...makeProps()} />)
    expect(screen.queryByText('dayplan.pdfTooltip')).not.toBeInTheDocument()
    await user.hover(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(screen.getByText('dayplan.pdfTooltip')).toBeInTheDocument())
    await user.unhover(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(screen.queryByText('dayplan.pdfTooltip')).not.toBeInTheDocument())
  })

  // The button sits at the right edge of the leftmost pane. Its own tooltip was
  // anchored with `right: 0` and never wrapped, so a long label ran off the left
  // of the window. The shared tooltip is portalled and clamped to the viewport.
  it('FE-PLANNER-DPTOOLBAR-004: the export tooltip stays inside the window', async () => {
    const user = userEvent.setup()
    render(<DayPlanSidebarToolbar {...makeProps()} />)
    await user.hover(screen.getByText('dayplan.pdf'))
    const tip = await screen.findByText('dayplan.pdfTooltip')
    expect(tip.closest('[role="tooltip"]')).not.toBeNull()
    expect(tip.parentElement).toBe(document.body)
    expect(tip.style.position).toBe('fixed')
    // Placed once measured, and never to the left of the window edge.
    await waitFor(() => expect(parseFloat(tip.style.left)).toBeGreaterThanOrEqual(0))
  })

  // ── ICS menu ──────────────────────────────────────────────────────────────

  it('FE-PLANNER-DPTOOLBAR-005: hovering ICS opens the download/subscribe menu', async () => {
    const user = userEvent.setup()
    const setIcsHover = vi.fn((_v: boolean) => {})
    render(<DayPlanSidebarToolbar {...makeProps({ setIcsHover })} />)
    expect(screen.queryByText('Download ICS')).not.toBeInTheDocument()
    await user.hover(screen.getByText('ICS'))
    expect(screen.getByText('Download ICS')).toBeInTheDocument()
    expect(screen.getByText('Subscribe to calendar')).toBeInTheDocument()
    expect(setIcsHover).toHaveBeenCalledWith(true)
  })

  it('FE-PLANNER-DPTOOLBAR-005b: without share_manage the menu offers the download but not the subscription', async () => {
    // The subscription mints a link that reads the trip without an account, so
    // it needs share_manage; the one-off download is a file this member may
    // already read. Leaving the entry visible would only produce a dialog whose
    // enable button the server refuses.
    const user = userEvent.setup()
    render(<DayPlanSidebarToolbar {...makeProps({ canManageShare: false })} />)
    await user.hover(screen.getByText('ICS'))
    expect(screen.getByText('Download ICS')).toBeInTheDocument()
    expect(screen.queryByText('Subscribe to calendar')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTOOLBAR-006: leaving the ICS area closes the menu after the grace period', async () => {
    const user = userEvent.setup()
    const setIcsHover = vi.fn((_v: boolean) => {})
    render(<DayPlanSidebarToolbar {...makeProps({ setIcsHover })} />)
    const icsButton = screen.getByText('ICS')
    await user.hover(icsButton)
    expect(screen.getByText('Download ICS')).toBeInTheDocument()
    await user.unhover(icsButton)
    await waitFor(() => expect(screen.queryByText('Download ICS')).not.toBeInTheDocument())
    expect(setIcsHover).toHaveBeenLastCalledWith(false)
  })

  it('FE-PLANNER-DPTOOLBAR-007: re-entering the ICS area cancels the pending close', async () => {
    const user = userEvent.setup()
    render(<DayPlanSidebarToolbar {...makeProps()} />)
    const icsButton = screen.getByText('ICS')
    await user.hover(icsButton)
    await user.unhover(icsButton)
    await user.hover(icsButton)
    // The close is scheduled 120ms out; coming back in has to cancel it.
    await new Promise(r => setTimeout(r, 200))
    expect(screen.getByText('Download ICS')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTOOLBAR-008: "Download ICS" fetches the export and hands it to a download link', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['BEGIN:VCALENDAR'], { type: 'text/calendar' })),
    } as unknown as Response)
    const createObjURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<DayPlanSidebarToolbar {...makeProps()} />)
    await user.hover(screen.getByText('ICS'))
    await user.click(screen.getByText('Download ICS'))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/trips/1/export.ics', { credentials: 'include' }))
    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(revokeObjURL).toHaveBeenCalledWith('blob:mock')
    // The menu closes itself once the download starts.
    expect(screen.queryByText('Download ICS')).not.toBeInTheDocument()
    fetchSpy.mockRestore(); createObjURL.mockRestore(); revokeObjURL.mockRestore(); clickSpy.mockRestore()
  })

  it('FE-PLANNER-DPTOOLBAR-009: a rejected ICS export shows the failure toast', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as unknown as Response)
    const toast = makeToast()
    render(<DayPlanSidebarToolbar {...makeProps({ toast })} />)
    await user.hover(screen.getByText('ICS'))
    await user.click(screen.getByText('Download ICS'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('planner.icsExportFailed'))
    fetchSpy.mockRestore()
  })

  it('FE-PLANNER-DPTOOLBAR-010: "Subscribe to calendar" opens the subscribe dialog and closes again', async () => {
    const user = userEvent.setup()
    render(<DayPlanSidebarToolbar {...makeProps()} />)
    await user.hover(screen.getByText('ICS'))
    await user.click(screen.getByText('Subscribe to calendar'))
    expect(screen.getByTestId('ics-subscribe-modal')).toBeInTheDocument()
    await user.click(screen.getByText('close-subscribe'))
    expect(screen.queryByTestId('ics-subscribe-modal')).not.toBeInTheDocument()
  })

  // ── Expand / collapse all ────────────────────────────────────────────────

  it('FE-PLANNER-DPTOOLBAR-011: with days collapsed the button offers "expand all"', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10 }), buildDay({ id: 11 })]
    const setExpandedDays = vi.fn((_v: Set<number>) => {})
    render(<DayPlanSidebarToolbar {...makeProps({ days, setExpandedDays })} />)
    const btn = screen.getByRole('button', { name: 'dayplan.expandAll' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(setExpandedDays).toHaveBeenCalledWith(new Set([10, 11]))
    expect(JSON.parse(sessionStorage.getItem('day-expanded-1')!)).toEqual([10, 11])
  })

  it('FE-PLANNER-DPTOOLBAR-012: with every day expanded the button collapses them all', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10 }), buildDay({ id: 11 })]
    const setExpandedDays = vi.fn((_v: Set<number>) => {})
    render(<DayPlanSidebarToolbar {...makeProps({ days, expandedDays: new Set([10, 11]), setExpandedDays })} />)
    const btn = screen.getByRole('button', { name: 'dayplan.collapseAll' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await user.click(btn)
    expect(setExpandedDays).toHaveBeenCalledWith(new Set())
    expect(JSON.parse(sessionStorage.getItem('day-expanded-1')!)).toEqual([])
  })

  it('FE-PLANNER-DPTOOLBAR-013: a trip with no days is never treated as fully expanded', () => {
    render(<DayPlanSidebarToolbar {...makeProps({ days: [] })} />)
    expect(screen.getByRole('button', { name: 'dayplan.expandAll' })).toBeInTheDocument()
  })

  // ── Undo ─────────────────────────────────────────────────────────────────

  it('FE-PLANNER-DPTOOLBAR-014: no undo control without an onUndo handler', () => {
    render(<DayPlanSidebarToolbar {...makeProps()} />)
    expect(screen.queryByRole('button', { name: 'undo.button' })).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTOOLBAR-015: the undo button stays disabled while there is nothing to undo', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(<DayPlanSidebarToolbar {...makeProps({ onUndo, canUndo: false })} />)
    const btn = screen.getByRole('button', { name: 'undo.button' })
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(onUndo).not.toHaveBeenCalled()
  })

  it('FE-PLANNER-DPTOOLBAR-016: clicking undo fires the handler and hovering reports the hover state', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    const setUndoHover = vi.fn((_v: boolean) => {})
    render(<DayPlanSidebarToolbar {...makeProps({ onUndo, canUndo: true, setUndoHover })} />)
    const btn = screen.getByRole('button', { name: 'undo.button' })
    await user.hover(btn)
    expect(setUndoHover).toHaveBeenCalledWith(true)
    await user.click(btn)
    expect(onUndo).toHaveBeenCalledTimes(1)
    await user.unhover(btn)
    expect(setUndoHover).toHaveBeenCalledWith(false)
  })

  it('FE-PLANNER-DPTOOLBAR-017: the undo tooltip names the last action when there is one', () => {
    render(<DayPlanSidebarToolbar {...makeProps({ onUndo: vi.fn(), canUndo: true, undoHover: true, lastActionLabel: 'Reorder' })} />)
    expect(screen.getByText('undo.tooltip|Reorder')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPTOOLBAR-018: the undo tooltip falls back to the plain label with nothing to undo', () => {
    render(<DayPlanSidebarToolbar {...makeProps({ onUndo: vi.fn(), canUndo: false, undoHover: true, lastActionLabel: 'Reorder' })} />)
    // Both the aria-label and the tooltip carry the same text here.
    expect(screen.getAllByText('undo.button').length + screen.getAllByLabelText('undo.button').length).toBeGreaterThan(1)
    expect(screen.queryByText('undo.tooltip|Reorder')).not.toBeInTheDocument()
  })

  // ── Reorder days ─────────────────────────────────────────────────────────

  it('FE-PLANNER-DPTOOLBAR-019: the reorder button toggles the day-reorder popup', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10, title: 'Day 1', day_number: 1 })]
    render(<DayPlanSidebarToolbar {...makeProps({ days, canEditDays: true, onReorderDays: vi.fn(), onAddDay: vi.fn() })} />)
    const btn = screen.getByRole('button', { name: 'dayplan.reorderDays' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(screen.getByText('dayplan.reorderHint')).toBeInTheDocument()
    await user.click(screen.getByText('common.close'))
    expect(screen.queryByText('dayplan.reorderHint')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPTOOLBAR-020: the popup passes its add-day action straight through', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10, title: 'Day 1', day_number: 1 })]
    const onAddDay = vi.fn((_p?: number) => {})
    render(<DayPlanSidebarToolbar {...makeProps({ days, canEditDays: true, onReorderDays: vi.fn(), onAddDay })} />)
    await user.click(screen.getByRole('button', { name: 'dayplan.reorderDays' }))
    await user.click(screen.getByText('dayplan.addDay'))
    expect(onAddDay).toHaveBeenCalledWith()
  })

  it('FE-PLANNER-DPTOOLBAR-021: the reorder button is hidden without edit rights or without days', () => {
    const days = [buildDay({ id: 10 })]
    const { rerender } = render(<DayPlanSidebarToolbar {...makeProps({ days, canEditDays: false, onReorderDays: vi.fn(), onAddDay: vi.fn() })} />)
    expect(screen.queryByRole('button', { name: 'dayplan.reorderDays' })).not.toBeInTheDocument()
    rerender(<DayPlanSidebarToolbar {...makeProps({ days: [], canEditDays: true, onReorderDays: vi.fn(), onAddDay: vi.fn() })} />)
    expect(screen.queryByRole('button', { name: 'dayplan.reorderDays' })).not.toBeInTheDocument()
  })

  // ── Show/hide all booking routes ─────────────────────────────────────────

  it('FE-PLANNER-DPTOOLBAR-022: the connections toggle appears only for a routable reservation', async () => {
    const user = userEvent.setup()
    const onToggleAllConnections = vi.fn()
    const { rerender } = render(<DayPlanSidebarToolbar {...makeProps({ onToggleAllConnections, reservations: [buildReservation({ id: 6 })] })} />)
    expect(screen.queryByRole('button', { name: 'map.showAllConnections' })).not.toBeInTheDocument()

    rerender(<DayPlanSidebarToolbar {...makeProps({ onToggleAllConnections, reservations: [routableReservation()] })} />)
    const show = screen.getByRole('button', { name: 'map.showAllConnections' })
    expect(show).toHaveAttribute('aria-pressed', 'false')
    await user.click(show)
    expect(onToggleAllConnections).toHaveBeenCalledTimes(1)

    rerender(<DayPlanSidebarToolbar {...makeProps({ onToggleAllConnections, reservations: [routableReservation()], allConnectionsShown: true })} />)
    expect(screen.getByRole('button', { name: 'map.hideAllConnections' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-PLANNER-DPTOOLBAR-023: the icon buttons paint a hover background and clear it again', async () => {
    const user = userEvent.setup()
    const days = [buildDay({ id: 10 })]
    render(<DayPlanSidebarToolbar {...makeProps({ days, onToggleAllConnections: vi.fn(), reservations: [routableReservation()] })} />)

    const expandBtn = screen.getByRole('button', { name: 'dayplan.expandAll' })
    await user.hover(expandBtn)
    expect(expandBtn.style.background).toBe('var(--bg-hover)')
    await user.unhover(expandBtn)
    expect(expandBtn.style.background).toBe('transparent')

    const routeBtn = screen.getByRole('button', { name: 'map.showAllConnections' })
    await user.hover(routeBtn)
    expect(routeBtn.style.background).toBe('var(--bg-hover)')
    await user.unhover(routeBtn)
    expect(routeBtn.style.background).toBe('transparent')

    await user.hover(screen.getByText('ICS'))
    const download = screen.getByText('Download ICS')
    const subscribe = screen.getByText('Subscribe to calendar')
    await user.hover(download)
    expect(download.style.background).toContain('var(--bg-hover')
    // Sliding down to the next entry has to clear the one we left.
    await user.hover(subscribe)
    expect(download.style.background).toBe('transparent')
    expect(subscribe.style.background).toContain('var(--bg-hover')
    await user.unhover(subscribe)
    expect(subscribe.style.background).toBe('transparent')
  })

  it('FE-PLANNER-DPTOOLBAR-024: an aborted PDF export without an Error still reaches the toast', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadTripPDF).mockRejectedValueOnce('boom')
    const toast = makeToast()
    render(<DayPlanSidebarToolbar {...makeProps({ toast })} />)
    await user.click(screen.getByText('dayplan.pdf'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('dayplan.pdfError: boom'))
  })
})
