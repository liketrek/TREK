// FE-W4LBX-001 to FE-W4LBX-020
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TripFile } from '../../types'
import { render, screen, fireEvent, waitFor, act } from '../../../tests/helpers/render'

const getAuthUrl = vi.fn(async (url: string, _kind: string) => `${url}?token=abc`)
const openFile = vi.fn(async (_url: string, _name: string) => {})
const downloadFile = vi.fn(async (_url: string, _name: string) => {})

vi.mock('../../api/authUrl', () => ({ getAuthUrl: (url: string, kind: string) => getAuthUrl(url, kind) }))
vi.mock('../../utils/fileDownload', () => ({
  openFile: (url: string, name: string) => openFile(url, name),
  downloadFile: (url: string, name: string) => downloadFile(url, name),
}))
vi.mock('../Journey/VideoPlayer', () => ({
  default: ({ src }: { src: string }) => <div data-testid="video" data-src={src} />,
}))

import { ImageLightbox } from './FileManagerImageLightbox'

type LightboxFile = TripFile & { url: string }

function file(overrides: Partial<LightboxFile> = {}): LightboxFile {
  return { id: 1, original_name: 'beach.jpg', mime_type: 'image/jpeg', url: '/uploads/files/beach.jpg', ...overrides } as unknown as LightboxFile
}

const IMAGES = [
  file({ id: 1, original_name: 'a.jpg', url: '/f/a.jpg' }),
  file({ id: 2, original_name: 'b.jpg', url: '/f/b.jpg' }),
  file({ id: 3, original_name: 'c.jpg', url: '/f/c.jpg' }),
]

beforeEach(() => {
  getAuthUrl.mockReset()
  getAuthUrl.mockImplementation(async (url: string) => `${url}?token=abc`)
  openFile.mockReset()
  openFile.mockResolvedValue(undefined)
  downloadFile.mockReset()
  downloadFile.mockResolvedValue(undefined)
})

describe('ImageLightbox', () => {
  it('FE-W4LBX-001: renders nothing when the index points past the list', () => {
    const { container } = render(<ImageLightbox files={[]} initialIndex={0} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4LBX-002: shows the file name and its position in the gallery', () => {
    render(<ImageLightbox files={IMAGES} initialIndex={1} onClose={() => {}} />)

    expect(screen.getByText('b.jpg', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('FE-W4LBX-003: mints a signed download url for the shown image', async () => {
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)

    await waitFor(() => expect(container.querySelector('img[alt="a.jpg"]')).not.toBeNull())
    expect(getAuthUrl).toHaveBeenCalledWith('/f/a.jpg', 'download')
    expect(container.querySelector('img[alt="a.jpg"]')).toHaveAttribute('src', '/f/a.jpg?token=abc')
  })

  it('FE-W4LBX-004: hides the previous arrow on the first and the next arrow on the last file', () => {
    const first = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)
    // header (3) + next arrow + 3 thumbnails
    expect(first.container.querySelectorAll('.lucide-chevron-left')).toHaveLength(0)
    expect(first.container.querySelectorAll('.lucide-chevron-right')).toHaveLength(1)
    first.unmount()

    const last = render(<ImageLightbox files={IMAGES} initialIndex={2} onClose={() => {}} />)
    expect(last.container.querySelectorAll('.lucide-chevron-left')).toHaveLength(1)
    expect(last.container.querySelectorAll('.lucide-chevron-right')).toHaveLength(0)
  })

  it('FE-W4LBX-005: the arrows page through the gallery', () => {
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)

    fireEvent.click(container.querySelector('.lucide-chevron-right')!.closest('button')!)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    fireEvent.click(container.querySelector('.lucide-chevron-left')!.closest('button')!)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('FE-W4LBX-006: the arrow keys page and Escape closes', () => {
    const onClose = vi.fn()
    render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('FE-W4LBX-007: paging never runs past either end', () => {
    render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('FE-W4LBX-008: a swipe pages in the swiped direction', () => {
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={1} onClose={() => {}} />)
    const root = container.firstElementChild as HTMLElement

    fireEvent.touchStart(root, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 100 }] })
    expect(screen.getByText('3 / 3')).toBeInTheDocument()

    fireEvent.touchStart(root, { touches: [{ clientX: 100 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 220 }] })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('FE-W4LBX-009: a short swipe is ignored', () => {
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={1} onClose={() => {}} />)
    const root = container.firstElementChild as HTMLElement

    fireEvent.touchStart(root, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 180 }] })

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('FE-W4LBX-010: a touch end without a start is ignored', () => {
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={1} onClose={() => {}} />)

    fireEvent.touchEnd(container.firstElementChild!, { changedTouches: [{ clientX: 0 }] })

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('FE-W4LBX-011: the header buttons open, download and close', () => {
    const onClose = vi.fn()
    render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={onClose} />)

    fireEvent.click(screen.getByTitle(/open/i))
    expect(openFile).toHaveBeenCalledWith('/f/a.jpg', 'a.jpg')

    fireEvent.click(screen.getByTitle(/download/i))
    expect(downloadFile).toHaveBeenCalledWith('/f/a.jpg', 'a.jpg')

    fireEvent.click(screen.getAllByRole('button')[2])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('FE-W4LBX-012: clicking the backdrop closes but clicking the image does not', async () => {
    const onClose = vi.fn()
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={onClose} />)

    await waitFor(() => expect(container.querySelector('img[alt="a.jpg"]')).not.toBeNull())
    fireEvent.click(container.querySelector('img[alt="a.jpg"]')!)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(container.firstElementChild!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('FE-W4LBX-013: the thumbnail strip jumps to the picked file', async () => {
    render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)
    // header: open + download + close, then the next arrow, then three thumbs.
    const thumbs = screen.getAllByRole('button').slice(-3)

    fireEvent.click(thumbs[2])

    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    await waitFor(() => expect(getAuthUrl).toHaveBeenCalledWith('/f/c.jpg', 'download'))
  })

  it('FE-W4LBX-014: hides the strip for a single file', () => {
    render(<ImageLightbox files={[IMAGES[0]]} initialIndex={0} onClose={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('FE-W4LBX-015: a video plays in the player and never mints a download token', async () => {
    const video = file({ id: 9, original_name: 'clip.mp4', mime_type: 'video/mp4', url: '/f/clip.mp4' })
    const { container } = render(<ImageLightbox files={[video]} initialIndex={0} onClose={() => {}} />)

    // The player loads on demand now — plyr no longer ships with the file manager.
    expect(await screen.findByTestId('video')).toHaveAttribute('data-src', '/f/clip.mp4')
    expect(getAuthUrl).not.toHaveBeenCalled()
    expect(container.querySelector('img')).toBeNull()
  })

  it('FE-W4LBX-016: a video thumbnail is a play glyph, not an image request', async () => {
    const files = [IMAGES[0], file({ id: 9, original_name: 'clip.mp4', mime_type: 'video/mp4', url: '/f/clip.mp4' })]
    const { container } = render(<ImageLightbox files={files} initialIndex={0} onClose={() => {}} />)

    await waitFor(() => expect(getAuthUrl).toHaveBeenCalledWith('/f/a.jpg', 'download'))
    expect(getAuthUrl).not.toHaveBeenCalledWith('/f/clip.mp4', 'download')
    expect(container.querySelector('.lucide-play')).not.toBeNull()
  })

  it('FE-W4LBX-017: clicking the video wrapper does not close the lightbox', () => {
    const onClose = vi.fn()
    render(<ImageLightbox files={[file({ mime_type: 'video/mp4' })]} initialIndex={0} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('video').parentElement!)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-W4LBX-018: Escape reaches the current onClose after a re-render', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={first} />)

    rerender(<ImageLightbox files={IMAGES} initialIndex={0} onClose={second} />)
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(second).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('FE-W4LBX-020: a mint that lands after the gallery moved on does not paint', async () => {
    const pending: Record<string, (url: string) => void> = {}
    getAuthUrl.mockImplementation((url: string) => new Promise<string>(resolve => { pending[url] = resolve }))
    const { container } = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)
    await waitFor(() => expect(getAuthUrl).toHaveBeenCalledWith('/f/a.jpg', 'download'))

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(getAuthUrl).toHaveBeenCalledWith('/f/b.jpg', 'download'))
    // The token for the image we already left resolves last.
    await act(async () => {
      pending['/f/b.jpg']('/f/b.jpg?token=b')
      pending['/f/a.jpg']('/f/a.jpg?token=a')
    })

    expect(container.querySelector('img[alt="b.jpg"]')).toHaveAttribute('src', '/f/b.jpg?token=b')
  })

  it('FE-W4LBX-019: the strip mints thumbnail tokens only for thumbs in view', async () => {
    // Every thumbnail costs its own one-shot token, so an off-screen thumb must
    // stay quiet. The default observer stub never intersects.
    const { unmount } = render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)
    await waitFor(() => expect(getAuthUrl).toHaveBeenCalledWith('/f/a.jpg', 'download'))
    expect(getAuthUrl).toHaveBeenCalledTimes(1)
    unmount()

    getAuthUrl.mockClear()
    const original = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
      disconnect() {}
      unobserve() {}
      takeRecords() { return [] }
    } as unknown as typeof IntersectionObserver
    try {
      render(<ImageLightbox files={IMAGES} initialIndex={0} onClose={() => {}} />)
      await waitFor(() => expect(getAuthUrl).toHaveBeenCalledWith('/f/c.jpg', 'download'))
    } finally {
      globalThis.IntersectionObserver = original
    }
  })
})
