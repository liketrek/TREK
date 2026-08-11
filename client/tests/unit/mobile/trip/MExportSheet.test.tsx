import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { http, HttpResponse } from 'msw'
import MExportSheet from '../../../../src/mobile/screens/trip/sheets/MExportSheet'
import { downloadTripPDF } from '../../../../src/components/PDF/TripPDF'
import { useTripStore } from '../../../../src/store/tripStore'
import type { Day, DayNote } from '../../../../src/types'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { server } from '../../../helpers/msw/server'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-EXPSH-001 to FE-MOB-EXPSH-013
// This sheet reads its copy from useTranslation(), so the assertions are English.

vi.mock('../../../../src/components/PDF/TripPDF', () => ({ downloadTripPDF: vi.fn() }))

vi.mock('../../../../src/components/Planner/IcsSubscribeModal', () => ({
  IcsSubscribeModal: ({ endpoint, onClose }: { endpoint: string; onClose: () => void }) => (
    <div data-testid="ics-subscribe" data-endpoint={endpoint}>
      <button type="button" onClick={onClose}>dismiss subscribe</button>
    </div>
  ),
}))

const DAYS = [{ id: 2, trip_id: 1, day_number: 1, date: '2026-05-01', title: null }] as unknown as Day[]

const NOTES: Record<string, DayNote[]> = {
  '2': [{ id: 41, day_id: 2, text: 'Pack the day bag' }] as unknown as DayNote[],
  '3': [{ id: 42, day_id: 3, text: 'Return the keys' }] as unknown as DayNote[],
}

function renderSheet(plannerOverrides: Record<string, unknown> = {}, sheetId: string | null = 'export') {
  const planner = buildPlanner({ days: DAYS, ...plannerOverrides })
  const shell = buildShell({ sheet: sheetId ? { id: sheetId } : null })
  const view = render(<MExportSheet planner={planner} shell={shell} />)
  return { ...view, planner, shell }
}

describe('MExportSheet', () => {
  // The download anchor is never attached to the DOM, so the click spy's
  // recorded `this` is the only handle on it.
  let clickSpy: MockInstance<() => void>
  const clickedAnchor = () => clickSpy.mock.contexts[0] as HTMLAnchorElement

  beforeEach(() => {
    resetAllStores()
    seedStore(useTripStore, { dayNotes: NOTES })
    vi.mocked(downloadTripPDF).mockReset().mockResolvedValue(undefined)
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:trek/ics')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-EXPSH-001: stays closed while another sheet id is active', () => {
    renderSheet({}, 'mehr')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-EXPSH-002: lists the three export routes and names the ics after the trip', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Export Calendar' })).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText('Export day plan as PDF')).toBeInTheDocument()
    expect(screen.getByText('Download .ics')).toBeInTheDocument()
    expect(screen.getByText('Japan 2026.ics')).toBeInTheDocument()
    expect(screen.getByText('Subscribe to calendar')).toBeInTheDocument()
    expect(screen.getByText('Auto-updates in your calendar app')).toBeInTheDocument()
  })

  it('FE-MOB-EXPSH-002b: drops the subscription row without share_manage, keeps the two exports', () => {
    // Same gate as the desktop toolbar: the subscription hands out a link that
    // works without an account, the download does not.
    renderSheet({ can: vi.fn((action: string) => action !== 'share_manage') })
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText('Download .ics')).toBeInTheDocument()
    expect(screen.queryByText('Subscribe to calendar')).not.toBeInTheDocument()
  })

  it('FE-MOB-EXPSH-003: hands the planner slices and the flattened day notes to the PDF export', async () => {
    const { planner } = renderSheet({
      places: [{ id: 9, name: 'Fushimi Inari' }],
      categories: [{ id: 3, name: 'Sights' }],
      reservations: [{ id: 4, title: 'Ryokan' }],
    })
    fireEvent.click(screen.getByText('PDF'))

    await waitFor(() => expect(downloadTripPDF).toHaveBeenCalledTimes(1))
    const arg = vi.mocked(downloadTripPDF).mock.calls[0][0]
    expect(arg.trip).toBe(planner.trip)
    expect(arg.days).toBe(planner.days)
    expect(arg.places).toBe(planner.places)
    expect(arg.reservations).toBe(planner.reservations)
    expect(arg.categories).toBe(planner.categories)
    // dayNotes come out of the store keyed by day, flattened with a numeric day_id.
    expect(arg.dayNotes).toEqual([
      { id: 41, day_id: 2, text: 'Pack the day bag' },
      { id: 42, day_id: 3, text: 'Return the keys' },
    ])
    expect(typeof arg.t).toBe('function')
  })

  it('FE-MOB-EXPSH-004: shows the busy label and refuses a second export while one runs', async () => {
    let release: () => void = () => {}
    vi.mocked(downloadTripPDF).mockImplementation(() => new Promise<void>(res => { release = () => res() }))
    renderSheet()

    fireEvent.click(screen.getByText('PDF'))
    const busy = await screen.findByText('Loading...')
    fireEvent.click(busy)
    expect(downloadTripPDF).toHaveBeenCalledTimes(1)

    release()
    await waitFor(() => expect(screen.getByText('PDF')).toBeInTheDocument())
  })

  it('FE-MOB-EXPSH-005: reports a failing PDF export with the underlying message', async () => {
    vi.mocked(downloadTripPDF).mockRejectedValue(new Error('font missing'))
    const { planner } = renderSheet()
    fireEvent.click(screen.getByText('PDF'))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Failed to export PDF: font missing'))
    // The busy flag is released in the finally branch.
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('FE-MOB-EXPSH-006: stringifies a non-Error rejection in the toast', async () => {
    vi.mocked(downloadTripPDF).mockRejectedValue('renderer gone')
    const { planner } = renderSheet()
    fireEvent.click(screen.getByText('PDF'))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Failed to export PDF: renderer gone'))
  })

  it('FE-MOB-EXPSH-007: does not export without a loaded trip', () => {
    renderSheet({ trip: null })
    expect(screen.getByText('trip.ics')).toBeInTheDocument()
    fireEvent.click(screen.getByText('PDF'))
    expect(downloadTripPDF).not.toHaveBeenCalled()
  })

  it('FE-MOB-EXPSH-008: downloads the ics through a named anchor and closes the sheet', async () => {
    server.use(http.get('/api/trips/1/export.ics', () => HttpResponse.text('BEGIN:VCALENDAR')))
    const { shell } = renderSheet()
    fireEvent.click(screen.getByText('Download .ics'))

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1))
    expect(clickedAnchor().getAttribute('href')).toBe('blob:trek/ics')
    expect(clickedAnchor().download).toBe('Japan 2026.ics')
    // The object URL outlives the click so slower browsers can still read it.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:trek/ics'))
    await waitFor(() => expect(shell.closeSheet).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-EXPSH-008b: a second tap while the ics request runs is ignored', async () => {
    let release: () => void = () => {}
    server.use(http.get('/api/trips/1/export.ics', async () => {
      await new Promise<void>(res => { release = res })
      return HttpResponse.text('BEGIN:VCALENDAR')
    }))
    const { shell } = renderSheet()
    fireEvent.click(screen.getByText('Download .ics'))

    const busy = await screen.findByText('Loading...')
    fireEvent.click(busy)
    release()

    await waitFor(() => expect(shell.closeSheet).toHaveBeenCalledTimes(1))
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-EXPSH-009: falls back to a generic filename without a trip title', async () => {
    server.use(http.get('/api/trips/1/export.ics', () => HttpResponse.text('BEGIN:VCALENDAR')))
    renderSheet({ trip: null })
    fireEvent.click(screen.getByText('Download .ics'))

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1))
    expect(clickedAnchor().download).toBe('trip.ics')
  })

  it('FE-MOB-EXPSH-010: toasts and keeps the sheet open when the ics endpoint errors', async () => {
    server.use(http.get('/api/trips/1/export.ics', () => new HttpResponse(null, { status: 500 })))
    const { planner, shell } = renderSheet()
    fireEvent.click(screen.getByText('Download .ics'))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('ICS export failed'))
    expect(shell.closeSheet).not.toHaveBeenCalled()
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('FE-MOB-EXPSH-011: toasts when the ics request never reaches the server', async () => {
    server.use(http.get('/api/trips/1/export.ics', () => HttpResponse.error()))
    const { planner } = renderSheet()
    fireEvent.click(screen.getByText('Download .ics'))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('ICS export failed'))
  })

  it('FE-MOB-EXPSH-012: opens the subscribe dialog on the trip feed endpoint and dismisses it again', () => {
    renderSheet()
    expect(screen.queryByTestId('ics-subscribe')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Subscribe to calendar'))
    expect(screen.getByTestId('ics-subscribe')).toHaveAttribute('data-endpoint', '/api/trips/1/feed')

    fireEvent.click(screen.getByRole('button', { name: 'dismiss subscribe' }))
    expect(screen.queryByTestId('ics-subscribe')).not.toBeInTheDocument()
  })

  it('FE-MOB-EXPSH-013: the header close hands the dismissal back to the shell', () => {
    const { shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
  })
})
