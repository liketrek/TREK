import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MFileLinkSheet from '../../../../src/mobile/screens/trip/tabs/MFileLinkSheet'
import { filesApi } from '../../../../src/api/client'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { Place, Reservation, TripFile } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-FLINK-001 to FE-MOB-FLINK-018

const PLACES = [
  { id: 11, name: 'Fushimi Inari' },
  { id: 12, name: 'Nara Park' },
] as unknown as Place[]

const RESERVATIONS = [
  { id: 21, type: 'hotel', title: 'Hotel Granvia' },
  { id: 22, type: 'train', title: 'Shinkansen Nozomi 21' },
] as unknown as Reservation[]

function file(overrides: Partial<TripFile> = {}): TripFile {
  return {
    id: 7, trip_id: 1, filename: 'ticket.pdf', original_name: 'ticket.pdf',
    mime_type: 'application/pdf', url: '/api/trips/1/files/7/download',
    created_at: '2026-05-01T12:00:00.000Z',
    ...overrides,
  } as unknown as TripFile
}

function renderSheet(fileArg: TripFile | null = file(), plannerOverrides: Partial<TripPlanner> = {}) {
  const planner = buildPlanner({
    places: PLACES, reservations: RESERVATIONS, ...plannerOverrides,
  } as unknown as Partial<TripPlanner>)
  const onClose = vi.fn()
  const view = render(<MFileLinkSheet planner={planner} file={fileArg} onClose={onClose} />)
  return { ...view, planner, onClose }
}

describe('MFileLinkSheet', () => {
  beforeEach(() => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({})
    vi.spyOn(filesApi, 'addLink').mockResolvedValue({})
    vi.spyOn(filesApi, 'removeLink').mockResolvedValue({})
    vi.spyOn(filesApi, 'getLinks').mockResolvedValue({ links: [] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-FLINK-001: stays closed without a file', () => {
    renderSheet(null)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-FLINK-002: heads the sheet with the file name and lists both sections', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'files.linkTitle' })).toBeInTheDocument()
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
    expect(screen.getByText('files.assignPlace')).toBeInTheDocument()
    expect(screen.getByText('files.assignBooking')).toBeInTheDocument()
    expect(screen.getByText('files.assignTransport')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fushimi Inari' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hotel Granvia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shinkansen Nozomi 21' })).toBeInTheDocument()
  })

  it('FE-MOB-FLINK-003: shows the empty hint when the trip has nothing to link to', () => {
    renderSheet(file(), { places: [], reservations: [] } as unknown as Partial<TripPlanner>)
    expect(screen.getByText('files.linkEmpty')).toBeInTheDocument()
    expect(screen.queryByText('files.assignPlace')).not.toBeInTheDocument()
  })

  it('FE-MOB-FLINK-004: marks the primary and the extra links as active', () => {
    renderSheet(file({ place_id: 11, linked_place_ids: [12], reservation_id: 21, linked_reservation_ids: [22] }))
    for (const name of ['Fushimi Inari', 'Nara Park', 'Hotel Granvia', 'Shinkansen Nozomi 21']) {
      expect(screen.getByRole('button', { name }).querySelector('.lucide-check')).not.toBeNull()
    }
  })

  it('FE-MOB-FLINK-005: the first place link goes into place_id', async () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Fushimi Inari' }))
    expect(filesApi.update).toHaveBeenCalledWith(1, 7, { place_id: 11 })
    await waitFor(() => expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1))
    expect(filesApi.addLink).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLINK-006: a further place becomes a file_link record', async () => {
    renderSheet(file({ place_id: 11 }))
    fireEvent.click(screen.getByRole('button', { name: 'Nara Park' }))
    await waitFor(() => expect(filesApi.addLink).toHaveBeenCalledWith(1, 7, { place_id: 12 }))
    expect(filesApi.update).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLINK-007: unlinking the primary place clears place_id', async () => {
    renderSheet(file({ place_id: 11 }))
    fireEvent.click(screen.getByRole('button', { name: 'Fushimi Inari' }))
    await waitFor(() => expect(filesApi.update).toHaveBeenCalledWith(1, 7, { place_id: null }))
  })

  it('FE-MOB-FLINK-008: unlinking an extra place removes its link record', async () => {
    vi.mocked(filesApi.getLinks).mockResolvedValue({ links: [{ id: 99, place_id: '12' }] })
    renderSheet(file({ place_id: 11, linked_place_ids: [12] }))
    fireEvent.click(screen.getByRole('button', { name: 'Nara Park' }))
    await waitFor(() => expect(filesApi.removeLink).toHaveBeenCalledWith(1, 7, 99))
    expect(filesApi.update).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLINK-009: a missing link record is a no-op that still refreshes', async () => {
    vi.mocked(filesApi.getLinks).mockResolvedValue({})
    const { planner } = renderSheet(file({ place_id: 11, linked_place_ids: [12] }))
    fireEvent.click(screen.getByRole('button', { name: 'Nara Park' }))
    await waitFor(() => expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1))
    expect(filesApi.removeLink).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLINK-010: the first reservation link goes into reservation_id', async () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Hotel Granvia' }))
    expect(filesApi.update).toHaveBeenCalledWith(1, 7, { reservation_id: 21 })
    await waitFor(() => expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1))
  })

  it('FE-MOB-FLINK-011: a further reservation becomes a file_link record', async () => {
    renderSheet(file({ reservation_id: 21 }))
    fireEvent.click(screen.getByRole('button', { name: 'Shinkansen Nozomi 21' }))
    await waitFor(() => expect(filesApi.addLink).toHaveBeenCalledWith(1, 7, { reservation_id: 22 }))
  })

  it('FE-MOB-FLINK-012: unlinking the primary reservation clears reservation_id', async () => {
    renderSheet(file({ reservation_id: 21 }))
    fireEvent.click(screen.getByRole('button', { name: 'Hotel Granvia' }))
    await waitFor(() => expect(filesApi.update).toHaveBeenCalledWith(1, 7, { reservation_id: null }))
  })

  it('FE-MOB-FLINK-013: unlinking an extra reservation removes its link record', async () => {
    vi.mocked(filesApi.getLinks).mockResolvedValue({ links: [{ id: 77, reservation_id: 22 }] })
    renderSheet(file({ reservation_id: 21, linked_reservation_ids: [22] }))
    fireEvent.click(screen.getByRole('button', { name: 'Shinkansen Nozomi 21' }))
    await waitFor(() => expect(filesApi.removeLink).toHaveBeenCalledWith(1, 7, 77))
  })

  it('FE-MOB-FLINK-014: a failing toggle surfaces the assign error for both sections', async () => {
    vi.mocked(filesApi.update).mockRejectedValue(new Error('boom'))
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Fushimi Inari' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.assignError'))
    expect(planner.tripActions.loadFiles).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Hotel Granvia' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledTimes(2))
  })

  it('FE-MOB-FLINK-015: one toggle at a time — the row spins and the others are ignored', async () => {
    let release: () => void = () => {}
    vi.mocked(filesApi.update).mockImplementation(
      () => new Promise(resolve => { release = () => resolve({}) }),
    )
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Fushimi Inari' }))
    const row = screen.getByRole('button', { name: 'Fushimi Inari' })
    await waitFor(() => expect(row).toBeDisabled())
    expect(row.querySelector('.animate-spin')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Nara Park' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hotel Granvia' }))
    expect(filesApi.update).toHaveBeenCalledTimes(1)

    await act(async () => { release() })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fushimi Inari' })).not.toBeDisabled())
  })

  it('FE-MOB-FLINK-016: skips null entries in the linked id arrays', () => {
    renderSheet(file({ linked_place_ids: [null, 12], linked_reservation_ids: [null, 22] }))
    expect(screen.getByRole('button', { name: 'Nara Park' }).querySelector('.lucide-check')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Shinkansen Nozomi 21' }).querySelector('.lucide-check')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Fushimi Inari' }).querySelector('.lucide-check')).toBeNull()
  })

  it('FE-MOB-FLINK-017: a links response without a links array is treated as empty', async () => {
    vi.mocked(filesApi.getLinks).mockResolvedValue({})
    const { planner } = renderSheet(file({ reservation_id: 21, linked_reservation_ids: [22] }))
    fireEvent.click(screen.getByRole('button', { name: 'Shinkansen Nozomi 21' }))
    await waitFor(() => expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1))
    expect(filesApi.removeLink).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLINK-018: keeps the file mounted through the exit animation', () => {
    const planner = buildPlanner({ places: PLACES, reservations: RESERVATIONS } as unknown as Partial<TripPlanner>)
    const { rerender } = render(<MFileLinkSheet planner={planner} file={file()} onClose={vi.fn()} />)
    rerender(<MFileLinkSheet planner={planner} file={null} onClose={vi.fn()} />)
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
  })
})
