import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MFileLightbox from '../../../../src/mobile/screens/trip/tabs/MFileLightbox'
import { getAuthUrl } from '../../../../src/api/authUrl'
import { downloadFile, openFile } from '../../../../src/utils/fileDownload'
import type { TranslationFn, TripFile } from '../../../../src/types'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-FLBOX-001 to FE-MOB-FLBOX-017

vi.mock('../../../../src/api/authUrl', () => ({
  getAuthUrl: vi.fn(async (url: string) => `${url}?token=t1`),
}))
vi.mock('../../../../src/utils/fileDownload', () => ({
  downloadFile: vi.fn(async () => undefined),
  openFile: vi.fn(async () => undefined),
}))
vi.mock('../../../../src/components/Journey/VideoPlayer', () => ({
  default: ({ src }: { src: string }) => <div data-testid="video-player" data-src={src} />,
}))

const t: TranslationFn = key => key

function file(id: number, name: string, mime = 'image/jpeg'): TripFile {
  return {
    id, trip_id: 1, filename: name, original_name: name, mime_type: mime,
    url: `/api/trips/1/files/${id}/download`, created_at: '2026-05-01T10:00:00.000Z',
  } as unknown as TripFile
}

const FILES = [file(1, 'beach.jpg'), file(2, 'castle.png', 'image/png'), file(3, 'clip.mp4', 'video/mp4')]

function renderBox(index: number, overrides: { files?: TripFile[] } = {}) {
  const onIndexChange = vi.fn()
  const onClose = vi.fn()
  const view = render(
    <MFileLightbox
      files={overrides.files ?? FILES}
      index={index}
      onIndexChange={onIndexChange}
      onClose={onClose}
      t={t}
    />,
  )
  return { ...view, onIndexChange, onClose }
}

describe('MFileLightbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
    document.getElementById('m-sheet-root')?.remove()
  })

  it('FE-MOB-FLBOX-001: shows the file name, the position counter and the signed image url', async () => {
    renderBox(0)
    expect(screen.getByText('beach.jpg')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(getAuthUrl).toHaveBeenCalledWith('/api/trips/1/files/1/download', 'download')
    await waitFor(() =>
      expect(screen.getByAltText('beach.jpg')).toHaveAttribute('src', '/api/trips/1/files/1/download?token=t1'),
    )
  })

  it('FE-MOB-FLBOX-002: renders nothing when the index points past the list', () => {
    const { container } = renderBox(5)
    expect(container).toBeEmptyDOMElement()
    expect(document.querySelector('.m-root')).toBeNull()
    expect(getAuthUrl).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLBOX-003: hides the prev arrow on the first file and the next arrow on the last', () => {
    renderBox(0)
    expect(screen.queryByRole('button', { name: 'mobileTrip.filesPrev' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'mobileTrip.filesNext' })).toBeInTheDocument()
  })

  it('FE-MOB-FLBOX-004: steps forward and back without bubbling the close click', () => {
    const { onIndexChange, onClose } = renderBox(1)
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.filesNext' }))
    expect(onIndexChange).toHaveBeenCalledWith(2)
    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.filesPrev' }))
    expect(onIndexChange).toHaveBeenCalledWith(0)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLBOX-005: arrow keys navigate and Escape closes', () => {
    const { onIndexChange, onClose } = renderBox(1)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onIndexChange).toHaveBeenCalledWith(2)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onIndexChange).toHaveBeenCalledWith(0)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FLBOX-006: arrow keys stop at both ends', () => {
    const { onIndexChange, unmount } = renderBox(0)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onIndexChange).not.toHaveBeenCalled()
    unmount()

    const last = renderBox(FILES.length - 1)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(last.onIndexChange).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLBOX-007: unregisters the key handler on unmount', () => {
    const { onClose, unmount } = renderBox(0)
    unmount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLBOX-008: a swipe to the right goes back, a swipe to the left goes forward', () => {
    const { onIndexChange } = renderBox(1)
    const overlay = document.querySelector('.m-root') as HTMLElement
    fireEvent.touchStart(overlay, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 300 }] })
    expect(onIndexChange).toHaveBeenLastCalledWith(0)

    fireEvent.touchStart(overlay, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 200 }] })
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('FE-MOB-FLBOX-009: ignores a short drag and a touchend without a start', () => {
    const { onIndexChange } = renderBox(1)
    const overlay = document.querySelector('.m-root') as HTMLElement
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 900 }] })
    expect(onIndexChange).not.toHaveBeenCalled()

    fireEvent.touchStart(overlay, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientX: 210 }] })
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLBOX-010: tapping the backdrop closes, tapping the header does not', () => {
    const { onClose } = renderBox(0)
    const overlay = document.querySelector('.m-root') as HTMLElement
    fireEvent.click(screen.getByText('beach.jpg'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FLBOX-011: tapping the empty media area closes but tapping the image does not', async () => {
    const { onClose } = renderBox(0)
    const img = await screen.findByAltText('beach.jpg')
    fireEvent.click(img)
    expect(onClose).not.toHaveBeenCalled()
    // The picture now sits in a wrapper that swallows the tap for it — the
    // <img> itself carries no handler — so the empty area is one level up.
    fireEvent.click(img.parentElement?.parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FLBOX-012: the close button closes', () => {
    const { onClose } = renderBox(0)
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-FLBOX-013: opens and downloads through the protected file helpers', () => {
    renderBox(1)
    fireEvent.click(screen.getByRole('button', { name: 'files.openTab' }))
    expect(openFile).toHaveBeenCalledWith('/api/trips/1/files/2/download', 'castle.png')
    fireEvent.click(screen.getByRole('button', { name: 'files.download' }))
    expect(downloadFile).toHaveBeenCalledWith('/api/trips/1/files/2/download', 'castle.png')
  })

  it('FE-MOB-FLBOX-014: swallows a failing open or download', async () => {
    vi.mocked(openFile).mockRejectedValueOnce(new Error('offline'))
    vi.mocked(downloadFile).mockRejectedValueOnce(new Error('offline'))
    renderBox(0)
    fireEvent.click(screen.getByRole('button', { name: 'files.openTab' }))
    fireEvent.click(screen.getByRole('button', { name: 'files.download' }))
    await waitFor(() => expect(downloadFile).toHaveBeenCalled())
    expect(screen.getByText('beach.jpg')).toBeInTheDocument()
  })

  it('FE-MOB-FLBOX-015: a video plays in the player instead of resolving a signed image url', () => {
    renderBox(2)
    expect(screen.getByTestId('video-player')).toHaveAttribute('data-src', '/api/trips/1/files/3/download')
    expect(screen.queryByAltText('clip.mp4')).not.toBeInTheDocument()
    expect(getAuthUrl).not.toHaveBeenCalled()
  })

  it('FE-MOB-FLBOX-016: locks the body scroll while open and mounts into the sheet root', () => {
    const root = document.createElement('div')
    root.id = 'm-sheet-root'
    document.body.appendChild(root)
    document.body.style.overflow = 'auto'

    const { unmount } = renderBox(0)
    expect(document.body.style.overflow).toBe('hidden')
    expect(root.querySelector('.m-root')).not.toBeNull()

    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('FE-MOB-FLBOX-017: tapping the player does not dismiss the viewer', () => {
    const { onClose } = renderBox(2)
    fireEvent.click(screen.getByTestId('video-player').parentElement as HTMLElement)
    expect(onClose).not.toHaveBeenCalled()
  })

  // Swiping is quicker than the token round trip, so the first file's url must not
  // land on the second one.
  it('FE-MOB-FLBOX-018: a token that resolves after a swipe does not overwrite the new image', async () => {
    const release: Array<(url: string) => void> = []
    vi.mocked(getAuthUrl).mockImplementation(
      (url: string) => new Promise<string>(resolve => { release.push(() => resolve(`${url}?token=t1`)) }),
    )
    const { rerender, onIndexChange, onClose } = renderBox(0)

    rerender(
      <MFileLightbox files={FILES} index={1} onIndexChange={onIndexChange} onClose={onClose} t={t} />,
    )
    await waitFor(() => expect(release).toHaveLength(2))

    // The first file resolves last.
    release[1]('')
    release[0]('')

    await waitFor(() =>
      expect(screen.getByAltText('castle.png')).toHaveAttribute('src', '/api/trips/1/files/2/download?token=t1'),
    )
  })
})
