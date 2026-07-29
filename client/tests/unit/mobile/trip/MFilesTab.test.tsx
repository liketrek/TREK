import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MFilesTab from '../../../../src/mobile/screens/trip/tabs/MFilesTab'
import { filesApi } from '../../../../src/api/client'
import { openFile } from '../../../../src/utils/fileDownload'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { Place, TripFile } from '../../../../src/types'
import { buildPlanner, buildShell, buildTripActions } from '../../../helpers/mobileTrip'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-FTAB-001 to FE-MOB-FTAB-025

vi.mock('../../../../src/utils/fileDownload', () => ({
  downloadFile: vi.fn(async () => undefined),
  openFile: vi.fn(async () => undefined),
}))

// The four overlays are covered by their own suites — stubbed here so this one
// asserts the tab's own wiring.
vi.mock('../../../../src/mobile/screens/trip/tabs/MFileMenuSheet', () => ({
  default: ({ file, onClose, onOpenLinks }: {
    file: TripFile | null
    onClose: () => void
    onOpenLinks: (f: TripFile) => void
  }) => file ? (
    <div data-testid="menu-sheet" data-file={String(file.id)}>
      <button type="button" onClick={onClose}>menu-close</button>
      <button type="button" onClick={() => onOpenLinks(file)}>menu-links</button>
    </div>
  ) : null,
}))
vi.mock('../../../../src/mobile/screens/trip/tabs/MFileLinkSheet', () => ({
  default: ({ file, onClose }: { file: TripFile | null; onClose: () => void }) => file ? (
    <div data-testid="link-sheet" data-file={String(file.id)}>
      <button type="button" onClick={onClose}>link-close</button>
    </div>
  ) : null,
}))
vi.mock('../../../../src/mobile/screens/trip/tabs/MFileTrashSheet', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => open ? (
    <div data-testid="trash-sheet">
      <button type="button" onClick={onClose}>trash-close</button>
    </div>
  ) : null,
}))
vi.mock('../../../../src/mobile/screens/trip/tabs/MFileLightbox', () => ({
  default: ({ files, index, onIndexChange, onClose }: {
    files: TripFile[]
    index: number
    onIndexChange: (i: number) => void
    onClose: () => void
  }) => (
    <div data-testid="lightbox" data-index={String(index)} data-count={String(files.length)}>
      <span>{files[index]?.original_name}</span>
      <button type="button" onClick={() => onIndexChange(index + 1)}>lb-next</button>
      <button type="button" onClick={onClose}>lb-close</button>
    </div>
  ),
}))

const PLACES = [{ id: 11, name: 'Fushimi Inari' }] as unknown as Place[]

function tripFile(overrides: Partial<TripFile>): TripFile {
  return {
    trip_id: 1, filename: 'f', original_name: 'f', mime_type: 'application/octet-stream',
    url: '/api/trips/1/files/0/download', created_at: '2026-05-01T12:00:00.000Z',
    ...overrides,
  } as unknown as TripFile
}

const GUIDE = tripFile({
  id: 1, filename: 'guide.pdf', original_name: 'guide.pdf', mime_type: 'application/pdf',
  file_size: 2048, uploaded_by_name: 'ada', place_id: 11, url: '/api/trips/1/files/1/download',
})
const BEACH = tripFile({
  id: 2, filename: 'beach.jpg', original_name: 'beach.jpg', mime_type: 'image/jpeg',
  starred: 1, url: '/api/trips/1/files/2/download',
})
const NOTES = tripFile({ id: 3, filename: 'notes.txt', original_name: 'notes.txt', mime_type: 'text/plain' })
const PASS = tripFile({ id: 4, filename: 'board.pkpass', original_name: 'board.pkpass', mime_type: '' })
const IDEA = tripFile({
  id: 5, filename: 'idea.png', original_name: 'idea.png', mime_type: 'image/png', note_id: 9,
})

const FILES = [GUIDE, BEACH, NOTES, PASS, IDEA]
const NAME_RE = /^(guide\.pdf|beach\.jpg|notes\.txt|board\.pkpass|idea\.png)$/

function renderTab(plannerOverrides: Partial<TripPlanner> = {}, shellOverrides: Partial<MTripShellApi> = {}) {
  const planner = buildPlanner({ files: FILES, places: PLACES, ...plannerOverrides } as unknown as Partial<TripPlanner>)
  const shell = buildShell(shellOverrides)
  const view = render(<MFilesTab planner={planner} shell={shell} />)
  const rerenderWith = (nextShell: Partial<MTripShellApi>) =>
    view.rerender(<MFilesTab planner={planner} shell={buildShell({ ...shellOverrides, ...nextShell })} />)
  return { ...view, planner, shell, rerenderWith }
}

function tile(labelKey: string): HTMLButtonElement {
  return screen.getByText(labelKey).closest('button') as HTMLButtonElement
}

function rowNames(): string[] {
  return screen.queryAllByText(NAME_RE).map(n => n.textContent as string)
}

function hiddenInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

function pasteTarget(container: HTMLElement): HTMLElement {
  return container.querySelector('[tabindex="-1"]') as HTMLElement
}

function makeFile(name: string, type: string, size = 10): File {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('MFilesTab', () => {
  beforeEach(() => {
    vi.spyOn(filesApi, 'toggleStar').mockResolvedValue({})
    vi.mocked(openFile).mockClear()
    vi.mocked(openFile).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-FTAB-001: shows the mascot empty state and no filter grid without files', () => {
    renderTab({ files: [] } as unknown as Partial<TripPlanner>)
    expect(screen.getByText('mobileTrip.filesEmpty')).toBeInTheDocument()
    expect(screen.queryByText('files.filterAll')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTAB-002: counts every filter tile over the whole file list', () => {
    renderTab()
    expect(tile('files.filterAll').textContent).toBe('files.filterAll5')
    expect(tile('files.filterPdf').textContent).toBe('files.filterPdf1')
    expect(tile('files.filterImages').textContent).toBe('files.filterImages2')
    expect(tile('files.filterDocs').textContent).toBe('files.filterDocs2')
    expect(tile('files.filterStarred').textContent).toBe('files.filterStarred1')
    expect(tile('files.filterCollab').textContent).toBe('files.filterCollab1')
  })

  it('FE-MOB-FTAB-003: drops the collab tile when no file came from a note', () => {
    renderTab({ files: [GUIDE, BEACH] } as unknown as Partial<TripPlanner>)
    expect(screen.queryByText('files.filterCollab')).not.toBeInTheDocument()
    expect(screen.getByText('files.filterAll')).toBeInTheDocument()
  })

  it('FE-MOB-FTAB-004: sorts starred files to the top', () => {
    renderTab()
    expect(rowNames()).toEqual(['beach.jpg', 'guide.pdf', 'notes.txt', 'board.pkpass', 'idea.png'])
  })

  it('FE-MOB-FTAB-005: a filter narrows the list to its bucket', () => {
    renderTab()
    fireEvent.click(tile('files.filterDocs'))
    expect(rowNames()).toEqual(['notes.txt', 'board.pkpass'])

    fireEvent.click(tile('files.filterImages'))
    expect(rowNames()).toEqual(['beach.jpg', 'idea.png'])

    fireEvent.click(tile('files.filterStarred'))
    expect(rowNames()).toEqual(['beach.jpg'])

    fireEvent.click(tile('files.filterCollab'))
    expect(rowNames()).toEqual(['idea.png'])
  })

  it('FE-MOB-FTAB-006: an empty filter result keeps the grid and shows the hint', () => {
    renderTab({ files: [BEACH] } as unknown as Partial<TripPlanner>)
    fireEvent.click(tile('files.filterPdf'))
    expect(rowNames()).toEqual([])
    expect(screen.getByText('mobileTrip.filesEmpty')).toBeInTheDocument()
    expect(screen.getByText('files.filterPdf')).toBeInTheDocument()
  })

  it('FE-MOB-FTAB-007: a row carries size, date, uploader and its link labels', () => {
    renderTab()
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
    expect(screen.getAllByText('May 1').length).toBeGreaterThan(0)
    expect(screen.getByText('ada')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('files.sourcePlan · Fushimi Inari')).toBeInTheDocument()
    expect(screen.getByText('files.sourceCollab')).toBeInTheDocument()
  })

  it('FE-MOB-FTAB-008: starring calls the api and refreshes the store', async () => {
    const { planner } = renderTab()
    expect(screen.getByRole('button', { name: 'files.unstar' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'files.star' })[0])
    expect(filesApi.toggleStar).toHaveBeenCalledWith(1, 1)
    await waitFor(() => expect(planner.tripActions.loadFiles).toHaveBeenCalledWith(1))
  })

  it('FE-MOB-FTAB-009: a failing star toggle is reported', async () => {
    vi.mocked(filesApi.toggleStar).mockRejectedValue(new Error('boom'))
    const { planner } = renderTab()
    fireEvent.click(screen.getAllByRole('button', { name: 'files.star' })[0])
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.toast.assignError'))
  })

  it('FE-MOB-FTAB-010: opening a media row puts it in the lightbox at its media index', () => {
    renderTab()
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('idea.png'))
    const box = screen.getByTestId('lightbox')
    expect(box).toHaveAttribute('data-index', '1')
    expect(box).toHaveAttribute('data-count', '2')

    fireEvent.click(screen.getByText('lb-close'))
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTAB-011: the lightbox index is clamped to the media it is given', () => {
    renderTab()
    fireEvent.click(screen.getByText('beach.jpg'))
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '0')
    fireEvent.click(screen.getByText('lb-next'))
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '1')
    // Past the end the panel clamps instead of unmounting the viewer.
    fireEvent.click(screen.getByText('lb-next'))
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '1')
  })

  it('FE-MOB-FTAB-012: a non-media row opens through the browser-native helper', () => {
    renderTab()
    fireEvent.click(screen.getByText('guide.pdf'))
    expect(openFile).toHaveBeenCalledWith('/api/trips/1/files/1/download', 'guide.pdf')
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTAB-013: a failing open is reported', async () => {
    vi.mocked(openFile).mockRejectedValue(new Error('offline'))
    const { planner } = renderTab()
    fireEvent.click(screen.getByText('guide.pdf'))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.openError'))
  })

  it('FE-MOB-FTAB-014: the kebab opens the menu sheet and hands over to the link picker', () => {
    renderTab()
    fireEvent.click(screen.getAllByRole('button', { name: 'files.menu' })[0])
    expect(screen.getByTestId('menu-sheet')).toHaveAttribute('data-file', '2')

    fireEvent.click(screen.getByText('menu-links'))
    expect(screen.queryByTestId('menu-sheet')).not.toBeInTheDocument()
    expect(screen.getByTestId('link-sheet')).toHaveAttribute('data-file', '2')

    fireEvent.click(screen.getByText('link-close'))
    expect(screen.queryByTestId('link-sheet')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTAB-015: closing the menu sheet clears the selection', () => {
    renderTab()
    fireEvent.click(screen.getAllByRole('button', { name: 'files.menu' })[1])
    expect(screen.getByTestId('menu-sheet')).toHaveAttribute('data-file', '1')
    fireEvent.click(screen.getByText('menu-close'))
    expect(screen.queryByTestId('menu-sheet')).not.toBeInTheDocument()
  })

  it('FE-MOB-FTAB-016: the header upload signal opens the file picker', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const { rerenderWith } = renderTab()
    expect(click).not.toHaveBeenCalled()
    rerenderWith({ uploadFilesSignal: 1 })
    expect(click).toHaveBeenCalledTimes(1)
    // Re-render without a new signal must not re-open the picker.
    rerenderWith({ uploadFilesSignal: 1 })
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FTAB-017: uploads every picked file and reports the count', async () => {
    const { container, planner } = renderTab()
    const input = hiddenInput(container)
    fireEvent.change(input, {
      target: { files: [makeFile('a.pdf', 'application/pdf'), makeFile('b.pdf', 'application/pdf')] },
    })
    await waitFor(() => expect(planner.toast.success).toHaveBeenCalledWith('files.uploaded:2'))
    expect(planner.tripActions.addFile).toHaveBeenCalledTimes(2)
    expect(planner.tripActions.addFile).toHaveBeenCalledWith(1, expect.any(FormData))
    expect(input.value).toBe('')
  })

  it('FE-MOB-FTAB-018: an empty pick does nothing', () => {
    const { container, planner } = renderTab()
    fireEvent.change(hiddenInput(container), { target: { files: [] } })
    expect(planner.tripActions.addFile).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTAB-019: a file over the 50 MB cap is rejected outright', () => {
    const { container, planner } = renderTab()
    fireEvent.change(hiddenInput(container), {
      target: { files: [makeFile('huge.pdf', 'application/pdf', 60 * 1024 * 1024)] },
    })
    expect(planner.toast.error).toHaveBeenCalledWith('files.uploadErrorSize')
    expect(planner.tripActions.addFile).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTAB-020: an oversized file in a batch is skipped, the rest still uploads', async () => {
    const { container, planner } = renderTab()
    fireEvent.change(hiddenInput(container), {
      target: {
        files: [
          makeFile('huge.pdf', 'application/pdf', 60 * 1024 * 1024),
          makeFile('small.pdf', 'application/pdf'),
        ],
      },
    })
    expect(planner.toast.error).toHaveBeenCalledWith('files.uploadErrorSize')
    await waitFor(() => expect(planner.toast.success).toHaveBeenCalledWith('files.uploaded:1'))
    expect(planner.tripActions.addFile).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FTAB-021: a rejected upload falls back to the generic upload error', async () => {
    const tripActions = buildTripActions()
    tripActions.addFile.mockRejectedValue(new Error('server-500'))
    const { container, planner } = renderTab({ tripActions } as unknown as Partial<TripPlanner>)
    fireEvent.change(hiddenInput(container), { target: { files: [makeFile('a.pdf', 'application/pdf')] } })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('files.uploadError'))
    expect(planner.toast.success).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTAB-021b: one rejected file does not drop the rest of the batch', async () => {
    const tripActions = buildTripActions()
    tripActions.addFile
      .mockRejectedValueOnce(new Error('server-500'))
      .mockResolvedValueOnce(undefined)
    const { container, planner } = renderTab({ tripActions } as unknown as Partial<TripPlanner>)
    fireEvent.change(hiddenInput(container), {
      target: { files: [makeFile('a.pdf', 'application/pdf'), makeFile('b.pdf', 'application/pdf')] },
    })

    await waitFor(() => expect(planner.toast.success).toHaveBeenCalledWith('files.uploaded:1'))
    expect(planner.tripActions.addFile).toHaveBeenCalledTimes(2)
    expect(planner.toast.error).toHaveBeenCalledWith('files.uploadError')
  })

  it('FE-MOB-FTAB-022: the uploading pill shows while the request is in flight', async () => {
    let release: () => void = () => {}
    const tripActions = buildTripActions()
    tripActions.addFile.mockImplementation(() => new Promise(resolve => { release = () => resolve(undefined) }))
    const { container } = renderTab({ tripActions } as unknown as Partial<TripPlanner>)
    fireEvent.change(hiddenInput(container), { target: { files: [makeFile('a.pdf', 'application/pdf')] } })
    await waitFor(() => expect(screen.getByText('files.uploading')).toBeInTheDocument())

    await act(async () => { release() })
    await waitFor(() => expect(screen.queryByText('files.uploading')).not.toBeInTheDocument())
  })

  it('FE-MOB-FTAB-023: pasted files upload, and nothing happens without the permission', async () => {
    const { container, planner } = renderTab()
    const pasted = makeFile('screenshot.png', 'image/png')
    fireEvent.paste(pasteTarget(container), {
      clipboardData: {
        items: [
          { kind: 'file', getAsFile: () => pasted },
          { kind: 'file', getAsFile: () => null },
          { kind: 'string', getAsFile: () => null },
        ],
      },
    })
    await waitFor(() => expect(planner.tripActions.addFile).toHaveBeenCalledTimes(1))

    const readOnly = renderTab({ canUploadFiles: false } as unknown as Partial<TripPlanner>)
    fireEvent.paste(pasteTarget(readOnly.container), {
      clipboardData: { items: [{ kind: 'file', getAsFile: () => pasted }] },
    })
    expect(readOnly.planner.tripActions.addFile).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTAB-024: a paste that carries no file at all is left to the browser', () => {
    const { container, planner } = renderTab()
    fireEvent.paste(pasteTarget(container), { clipboardData: { items: [{ kind: 'string', getAsFile: () => null }] } })
    expect(planner.tripActions.addFile).not.toHaveBeenCalled()

    // A paste event without clipboardData at all must not throw either.
    fireEvent.paste(pasteTarget(container))
    expect(planner.tripActions.addFile).not.toHaveBeenCalled()
  })

  it('FE-MOB-FTAB-025: the header trash signal opens the trash sheet', () => {
    const { rerenderWith } = renderTab()
    expect(screen.queryByTestId('trash-sheet')).not.toBeInTheDocument()
    rerenderWith({ openFilesTrashSignal: 1 })
    expect(screen.getByTestId('trash-sheet')).toBeInTheDocument()
    fireEvent.click(screen.getByText('trash-close'))
    expect(screen.queryByTestId('trash-sheet')).not.toBeInTheDocument()
  })
})
