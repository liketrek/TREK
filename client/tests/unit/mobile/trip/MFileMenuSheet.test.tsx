import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MFileMenuSheet from '../../../../src/mobile/screens/trip/tabs/MFileMenuSheet'
import { filesApi } from '../../../../src/api/client'
import { downloadFile } from '../../../../src/utils/fileDownload'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { TripFile } from '../../../../src/types'
import { buildPlanner, buildTripActions } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-FMENU-001 to FE-MOB-FMENU-015

vi.mock('../../../../src/utils/fileDownload', () => ({
  downloadFile: vi.fn(async () => undefined),
  openFile: vi.fn(async () => undefined),
}))

function file(overrides: Partial<TripFile> = {}): TripFile {
  return {
    id: 7, trip_id: 1, filename: 'ticket.pdf', original_name: 'ticket.pdf',
    mime_type: 'application/pdf', file_size: 2048, description: 'Seat 14A',
    url: '/api/trips/1/files/7/download', created_at: '2026-05-01T12:00:00.000Z',
    ...overrides,
  } as unknown as TripFile
}

function renderSheet(fileArg: TripFile | null = file(), plannerOverrides: Partial<TripPlanner> = {}) {
  const planner = buildPlanner(plannerOverrides)
  const onClose = vi.fn()
  const onOpenLinks = vi.fn()
  const view = render(
    <MFileMenuSheet planner={planner} file={fileArg} onClose={onClose} onOpenLinks={onOpenLinks} />,
  )
  return { ...view, planner, onClose, onOpenLinks }
}

describe('MFileMenuSheet', () => {
  beforeEach(() => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({})
    vi.mocked(downloadFile).mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-FMENU-001: stays closed while no file is selected', () => {
    renderSheet(null)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-FMENU-002: heads the sheet with the file name, size and date', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog', { name: 'ticket.pdf' })
    expect(within(dialog).getByText('ticket.pdf')).toBeInTheDocument()
    expect(within(dialog).getByText(/2\.0 KB · May 1/)).toBeInTheDocument()
  })

  it('FE-MOB-FMENU-003: seeds the note field from the file description', () => {
    renderSheet()
    expect(screen.getByPlaceholderText('files.notePlaceholder')).toHaveValue('Seat 14A')
  })

  it('FE-MOB-FMENU-004: saves a changed note on blur and refreshes the store', async () => {
    const { planner } = renderSheet()
    const input = screen.getByPlaceholderText('files.notePlaceholder')
    fireEvent.change(input, { target: { value: '  Seat 22C  ' } })
    fireEvent.blur(input)
    expect(filesApi.update).toHaveBeenCalledWith(1, 7, { description: 'Seat 22C' })
    await waitFor(() => expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1))
  })

  it('FE-MOB-FMENU-005: Enter commits the note by blurring the field', () => {
    renderSheet()
    const input = screen.getByPlaceholderText('files.notePlaceholder')
    input.focus()
    fireEvent.change(input, { target: { value: 'Gate B' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(filesApi.update).toHaveBeenCalledWith(1, 7, { description: 'Gate B' })
  })

  it('FE-MOB-FMENU-006: an unchanged note is not sent', () => {
    renderSheet()
    const input = screen.getByPlaceholderText('files.notePlaceholder')
    fireEvent.change(input, { target: { value: '  Seat 14A  ' } })
    fireEvent.blur(input)
    expect(filesApi.update).not.toHaveBeenCalled()
  })

  it('FE-MOB-FMENU-007: reports a failed note save', async () => {
    vi.mocked(filesApi.update).mockRejectedValue(new Error('boom'))
    const { planner } = renderSheet()
    fireEvent.change(screen.getByPlaceholderText('files.notePlaceholder'), { target: { value: 'x' } })
    fireEvent.blur(screen.getByPlaceholderText('files.notePlaceholder'))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.assignError'))
    expect(planner.tripActions.loadFiles).not.toHaveBeenCalled()
  })

  it('FE-MOB-FMENU-008: an empty description starts blank and stays unsent while untouched', () => {
    renderSheet(file({ description: null }))
    const input = screen.getByPlaceholderText('files.notePlaceholder')
    expect(input).toHaveValue('')
    fireEvent.keyDown(input, { key: 'a' })
    fireEvent.blur(input)
    expect(filesApi.update).not.toHaveBeenCalled()
  })

  it('FE-MOB-FMENU-009: downloads through the cookie-authenticated helper', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'files.download' }))
    expect(downloadFile).toHaveBeenCalledWith('/api/trips/1/files/7/download', 'ticket.pdf')
  })

  it('FE-MOB-FMENU-010: hands the file to the link picker', () => {
    const { onOpenLinks } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'files.link' }))
    expect(onOpenLinks).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
  })

  it('FE-MOB-FMENU-011: deleting asks first, then trashes the file and closes', async () => {
    const { planner, onClose } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    const confirm = screen.getByRole('dialog', { name: 'common.delete' })
    expect(within(confirm).getByText('files.confirm.delete')).toBeInTheDocument()

    fireEvent.click(within(confirm).getByRole('button', { name: 'common.delete' }))
    expect(planner.tripActions.deleteFile).toHaveBeenCalledWith(1, 7)
    await waitFor(() => expect(planner.toast.success).toHaveBeenCalledWith('files.toast.trashed'))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-FMENU-012: reports a failed delete and keeps the sheet open', async () => {
    const tripActions = buildTripActions()
    tripActions.deleteFile.mockRejectedValue(new Error('nope'))
    const { planner, onClose } = renderSheet(file(), { tripActions } as unknown as Partial<TripPlanner>)
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    const confirm = screen.getByRole('dialog', { name: 'common.delete' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'common.delete' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.deleteError'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-FMENU-013: cancelling the confirm leaves the file alone', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
    const confirm = screen.getByRole('dialog', { name: 'common.delete' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'common.cancel' }))
    expect(planner.tripActions.deleteFile).not.toHaveBeenCalled()
  })

  it('FE-MOB-FMENU-014: a read-only member only sees the download row', () => {
    renderSheet(file(), { can: () => false } as unknown as Partial<TripPlanner>)
    expect(screen.getByRole('button', { name: 'files.download' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'files.link' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('files.notePlaceholder')).not.toBeInTheDocument()
  })

  it('FE-MOB-FMENU-015: keeps the last file mounted through the exit animation and re-seeds on a new one', () => {
    const planner = buildPlanner()
    const { rerender } = render(
      <MFileMenuSheet planner={planner} file={file()} onClose={vi.fn()} onOpenLinks={vi.fn()} />,
    )
    rerender(<MFileMenuSheet planner={planner} file={null} onClose={vi.fn()} onOpenLinks={vi.fn()} />)
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()

    rerender(
      <MFileMenuSheet
        planner={planner}
        file={file({ id: 8, original_name: 'map.png', description: 'Old town' })}
        onClose={vi.fn()}
        onOpenLinks={vi.fn()}
      />,
    )
    expect(screen.getByText('map.png')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('files.notePlaceholder')).toHaveValue('Old town')
  })
})
