import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MFileTrashSheet from '../../../../src/mobile/screens/trip/tabs/MFileTrashSheet'
import { filesApi } from '../../../../src/api/client'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { TripFile } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { act, fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-FTRASH-001 to FE-MOB-FTRASH-016

const TRASHED = [
  {
    id: 31, trip_id: 1, filename: 'old.pdf', original_name: 'old.pdf', mime_type: 'application/pdf',
    file_size: 1024, url: '/api/trips/1/files/31/download', created_at: '2026-05-01T12:00:00.000Z',
  },
  {
    id: 32, trip_id: 1, filename: 'shot.png', original_name: 'shot.png', mime_type: 'image/png',
    url: '/api/trips/1/files/32/download', created_at: '2026-05-02T12:00:00.000Z',
  },
] as unknown as TripFile[]

function renderSheet(open = true, plannerOverrides: Partial<TripPlanner> = {}) {
  const planner = buildPlanner(plannerOverrides)
  const onClose = vi.fn()
  const view = render(<MFileTrashSheet planner={planner} open={open} onClose={onClose} />)
  return { ...view, planner, onClose }
}

/** Waits for the lazy trash fetch to settle. */
async function settled() {
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull())
}

describe('MFileTrashSheet', () => {
  beforeEach(() => {
    vi.spyOn(filesApi, 'list').mockResolvedValue({ files: TRASHED })
    vi.spyOn(filesApi, 'restore').mockResolvedValue({})
    vi.spyOn(filesApi, 'permanentDelete').mockResolvedValue({})
    vi.spyOn(filesApi, 'emptyTrash').mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-FTRASH-001: fetches nothing while closed', () => {
    renderSheet(false)
    expect(filesApi.list).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-002: loads the trashed files on open and lists them with size and date', async () => {
    renderSheet()
    expect(filesApi.list).toHaveBeenCalledWith(1, true)
    expect(document.querySelector('.animate-spin')).not.toBeNull()

    await settled()
    expect(screen.getByRole('dialog', { name: 'files.trash' })).toBeInTheDocument()
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
    expect(screen.getByText('1.0 KB · May 1')).toBeInTheDocument()
    // No file_size → only the date remains.
    expect(screen.getByText('May 2')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-003: shows the empty hint for an empty trash', async () => {
    vi.mocked(filesApi.list).mockResolvedValue({ files: [] })
    renderSheet()
    await settled()
    expect(screen.getByText('files.trashEmpty')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'files.emptyTrash' })).not.toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-004: survives a failing fetch', async () => {
    vi.mocked(filesApi.list).mockRejectedValue(new Error('offline'))
    renderSheet()
    await settled()
    expect(screen.getByText('files.trashEmpty')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-005: tolerates a response without a files array', async () => {
    vi.mocked(filesApi.list).mockResolvedValue({})
    renderSheet()
    await settled()
    expect(screen.getByText('files.trashEmpty')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-006: restores a file, drops the row and refreshes the store', async () => {
    const { planner } = renderSheet()
    await settled()
    fireEvent.click(screen.getAllByRole('button', { name: 'files.restore' })[0])
    expect(filesApi.restore).toHaveBeenCalledWith(1, 31)
    await waitFor(() => expect(screen.queryByText('old.pdf')).not.toBeInTheDocument())
    expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1)
    expect(planner.toast.success).toHaveBeenCalledWith('files.toast.restored')
  })

  it('FE-MOB-FTRASH-007: reports a failed restore and keeps the row', async () => {
    vi.mocked(filesApi.restore).mockRejectedValue(new Error('nope'))
    const { planner } = renderSheet()
    await settled()
    fireEvent.click(screen.getAllByRole('button', { name: 'files.restore' })[0])
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.restoreError'))
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-008: permanently deletes only after the confirm', async () => {
    const { planner } = renderSheet()
    await settled()
    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[0])
    expect(filesApi.permanentDelete).not.toHaveBeenCalled()

    const confirm = screen.getByRole('dialog', { name: 'common.delete' })
    expect(within(confirm).getByText('files.confirm.permanentDelete')).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: 'common.delete' }))
    expect(filesApi.permanentDelete).toHaveBeenCalledWith(1, 31)
    await waitFor(() => expect(screen.queryByText('old.pdf')).not.toBeInTheDocument())
    expect(planner.toast.success).toHaveBeenCalledWith('files.toast.deleted')
    expect(planner.tripActions.loadFiles).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTRASH-009: cancelling the confirm keeps the file', async () => {
    renderSheet()
    await settled()
    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[0])
    const confirm = screen.getByRole('dialog', { name: 'common.delete' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'common.cancel' }))
    expect(filesApi.permanentDelete).not.toHaveBeenCalled()
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-010: reports a failed permanent delete', async () => {
    vi.mocked(filesApi.permanentDelete).mockRejectedValue(new Error('nope'))
    const { planner } = renderSheet()
    await settled()
    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[0])
    const confirm = screen.getByRole('dialog', { name: 'common.delete' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'common.delete' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.deleteError'))
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-011: empties the whole trash after the confirm', async () => {
    const { planner } = renderSheet()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'files.emptyTrash' }))
    const confirm = screen.getByRole('dialog', { name: 'files.emptyTrash' })
    expect(within(confirm).getByText('files.confirm.emptyTrash')).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: 'files.emptyTrash' }))
    expect(filesApi.emptyTrash).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.getByText('files.trashEmpty')).toBeInTheDocument())
    expect(planner.toast.success).toHaveBeenCalledWith('files.toast.trashEmptied')
  })

  it('FE-MOB-FTRASH-011b: locks the row actions while the empty is in flight', async () => {
    let release: () => void = () => {}
    vi.mocked(filesApi.emptyTrash).mockImplementation(() => new Promise(resolve => { release = () => resolve({}) }))
    renderSheet()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'files.emptyTrash' }))
    const confirm = screen.getByRole('dialog', { name: 'files.emptyTrash' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'files.emptyTrash' }))

    expect(screen.getAllByRole('button', { name: 'files.restore' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'common.delete' })[0]).toBeDisabled()

    await act(async () => { release() })
    expect(filesApi.restore).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTRASH-012: reports a failed empty', async () => {
    vi.mocked(filesApi.emptyTrash).mockRejectedValue(new Error('nope'))
    const { planner } = renderSheet()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'files.emptyTrash' }))
    const confirm = screen.getByRole('dialog', { name: 'files.emptyTrash' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'files.emptyTrash' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.deleteError'))
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-013: a member without file_delete only gets to look', async () => {
    renderSheet(true, { can: (perm: string) => perm !== 'file_delete' } as unknown as Partial<TripPlanner>)
    await settled()
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'files.restore' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'files.emptyTrash' })).not.toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-014: closes through the header button', async () => {
    const { onClose } = renderSheet()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FTRASH-015: a fetch that lands after unmount is dropped', async () => {
    let release: (data: { files: TripFile[] }) => void = () => {}
    vi.mocked(filesApi.list).mockImplementation(() => new Promise(resolve => { release = resolve }))
    const { unmount } = renderSheet()
    unmount()
    await act(async () => { release({ files: TRASHED }) })
    expect(screen.queryByText('old.pdf')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTRASH-016: cancelling the empty-trash confirm keeps everything', async () => {
    renderSheet()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'files.emptyTrash' }))
    const confirm = screen.getByRole('dialog', { name: 'files.emptyTrash' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'common.cancel' }))
    expect(filesApi.emptyTrash).not.toHaveBeenCalled()
    expect(screen.getByText('old.pdf')).toBeInTheDocument()
  })
})
