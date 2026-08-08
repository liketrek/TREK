// FE-W4FPM-001 to FE-W4FPM-014
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { TripFile } from '../../types'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import type { FileManagerState } from './useFileManager'

const openFile = vi.fn(async (_url: string, _name: string) => {})
const downloadFile = vi.fn(async (_url: string, _name: string) => {})

vi.mock('../../utils/fileDownload', () => ({
  openFile: (url: string, name: string) => openFile(url, name),
  downloadFile: (url: string, name: string) => downloadFile(url, name),
}))

import { PdfPreviewModal } from './FileManagerPdfPreviewModal'
import { MarkdownPreviewModal } from './FileManagerMarkdownPreviewModal'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
const setPreviewFile = vi.fn()

function state(overrides: Partial<FileManagerState> = {}): FileManagerState {
  return {
    previewFile: { id: 1, original_name: 'ticket.pdf', url: '/uploads/files/ticket.pdf' } as unknown as TripFile,
    previewFileUrl: '/uploads/files/ticket.pdf?token=abc',
    setPreviewFile,
    toast,
    t: (key: string) => key,
    ...overrides,
  } as unknown as FileManagerState
}

beforeEach(() => {
  openFile.mockReset()
  openFile.mockResolvedValue(undefined)
  downloadFile.mockReset()
  downloadFile.mockResolvedValue(undefined)
  setPreviewFile.mockClear()
  Object.values(toast).forEach(f => f.mockClear())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PdfPreviewModal', () => {
  it('FE-W4FPM-001: portals the viewer with the signed url and the file name', () => {
    const { container, baseElement } = render(<PdfPreviewModal {...state()} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
    const object = baseElement.querySelector('object') as HTMLObjectElement
    expect(object).toHaveAttribute('data', '/uploads/files/ticket.pdf?token=abc#view=FitH')
    expect(object).toHaveAttribute('type', 'application/pdf')
  })

  it('FE-W4FPM-002: leaves the viewer source unset while no signed url exists yet', () => {
    const { baseElement } = render(<PdfPreviewModal {...state({ previewFileUrl: null })} />)

    expect(baseElement.querySelector('object')).not.toHaveAttribute('data')
  })

  it('FE-W4FPM-003: the open-in-tab button uses the unsigned url', () => {
    render(<PdfPreviewModal {...state()} />)

    fireEvent.click(screen.getByRole('button', { name: /openTab/ }))

    expect(openFile).toHaveBeenCalledWith('/uploads/files/ticket.pdf', 'ticket.pdf')
  })

  it('FE-W4FPM-004: a failed open toasts the error', async () => {
    openFile.mockRejectedValue(new Error('blocked'))
    render(<PdfPreviewModal {...state()} />)

    fireEvent.click(screen.getByRole('button', { name: /openTab/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('files.openError'))
  })

  it('FE-W4FPM-005: the download button hands the file to the download helper', () => {
    render(<PdfPreviewModal {...state()} />)

    fireEvent.click(screen.getByRole('button', { name: 'files.download' }))

    expect(downloadFile).toHaveBeenCalledWith('/uploads/files/ticket.pdf', 'ticket.pdf')
  })

  it('FE-W4FPM-006: the close button and the backdrop clear the preview, the card does not', () => {
    const { baseElement } = render(<PdfPreviewModal {...state()} />)
    const backdrop = baseElement.querySelector('div[style*="rgba(0, 0, 0, 0.85)"]') as HTMLElement

    fireEvent.click(screen.getAllByRole('button')[2])
    expect(setPreviewFile).toHaveBeenCalledWith(null)

    setPreviewFile.mockClear()
    fireEvent.click(backdrop.firstElementChild!)
    expect(setPreviewFile).not.toHaveBeenCalled()

    fireEvent.click(backdrop)
    expect(setPreviewFile).toHaveBeenCalledWith(null)
  })

  it('FE-W4FPM-007: the no-plugin fallback also opens the file', () => {
    render(<PdfPreviewModal {...state()} />)

    fireEvent.click(screen.getByRole('button', { name: 'files.downloadPdf' }))

    expect(openFile).toHaveBeenCalledWith('/uploads/files/ticket.pdf', 'ticket.pdf')
  })

  it('FE-W4FPM-014: the toolbar buttons brighten on hover and dim again', () => {
    render(<PdfPreviewModal {...state()} />)

    for (const button of screen.getAllByRole('button').slice(0, 3)) {
      fireEvent.mouseEnter(button)
      expect(button.style.color).toBe('var(--text-primary)')
      fireEvent.mouseLeave(button)
      expect(button.style.color).toBe(button === screen.getAllByRole('button')[2] ? 'var(--text-faint)' : 'var(--text-muted)')
    }
  })
})

describe('MarkdownPreviewModal', () => {
  const mdState = (overrides: Partial<FileManagerState> = {}) => state({
    previewFile: { id: 2, original_name: 'notes.md', url: '/uploads/files/notes.md' } as unknown as TripFile,
    previewFileUrl: '/uploads/files/notes.md?token=abc',
    ...overrides,
  })

  it('FE-W4FPM-008: fetches the markdown with credentials and renders it', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => '# Packing\n\nBring a **towel**.' }))
    vi.stubGlobal('fetch', fetchMock)

    render(<MarkdownPreviewModal {...mdState()} />)

    expect(fetchMock).toHaveBeenCalledWith('/uploads/files/notes.md?token=abc', { credentials: 'include' })
    expect(await screen.findByRole('heading', { name: 'Packing' })).toBeInTheDocument()
    expect(screen.getByText('towel')).toBeInTheDocument()
  })

  it('FE-W4FPM-009: shows the error copy when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))

    render(<MarkdownPreviewModal {...mdState()} />)

    expect(await screen.findByText('files.openError')).toBeInTheDocument()
  })

  it('FE-W4FPM-010: shows the error copy on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, text: async () => '' })))

    render(<MarkdownPreviewModal {...mdState()} />)

    expect(await screen.findByText('files.openError')).toBeInTheDocument()
  })

  it('FE-W4FPM-011: skips the fetch until a signed url exists', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<MarkdownPreviewModal {...mdState({ previewFileUrl: null })} />)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('notes.md')).toBeInTheDocument()
  })

  it('FE-W4FPM-012: the header buttons open, download and close', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => 'hi' })))
    render(<MarkdownPreviewModal {...mdState()} />)

    fireEvent.click(screen.getByRole('button', { name: /openTab/ }))
    expect(openFile).toHaveBeenCalledWith('/uploads/files/notes.md', 'notes.md')

    fireEvent.click(screen.getByRole('button', { name: 'files.download' }))
    expect(downloadFile).toHaveBeenCalledWith('/uploads/files/notes.md', 'notes.md')

    fireEvent.click(screen.getAllByRole('button')[2])
    expect(setPreviewFile).toHaveBeenCalledWith(null)
    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument())
  })

  it('FE-W4FPM-013: a failed open toasts the error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => '' })))
    openFile.mockRejectedValue(new Error('blocked'))
    render(<MarkdownPreviewModal {...mdState()} />)

    fireEvent.click(screen.getByRole('button', { name: /openTab/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('files.openError'))
  })
})
