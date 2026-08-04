/**
 * videoPoster unit tests (#823). jsdom has no video decoder and no canvas
 * rasteriser, so the capture path is driven by hand: document.createElement is
 * spied on to hand back the <video>/<canvas> the helper creates, and the media
 * events it waits for are fired from the test.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { captureVideoPoster, isVideoFile } from '../../../src/utils/videoPoster'

describe('isVideoFile', () => {
  it('is true for a video MIME type', () => {
    expect(isVideoFile(new File([], 'clip.mp4', { type: 'video/mp4' }))).toBe(true)
    expect(isVideoFile(new File([], 'clip.webm', { type: 'video/webm' }))).toBe(true)
  })

  it('is false for images and other files', () => {
    expect(isVideoFile(new File([], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false)
    expect(isVideoFile(new File([], 'doc.pdf', { type: 'application/pdf' }))).toBe(false)
    expect(isVideoFile(new File([], 'noext', { type: '' }))).toBe(false)
  })
})

interface CanvasStub {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
  toBlob: ReturnType<typeof vi.fn>
}

const CLIP = new File(['data'], 'clip.mp4', { type: 'video/mp4' })
const POSTER = new Blob(['jpeg'], { type: 'image/jpeg' })

let video: HTMLVideoElement
let canvas: CanvasStub
let drawImage: ReturnType<typeof vi.fn>
let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>

/** Fakes the read-only metadata jsdom leaves at 0/NaN. */
function describeMedia(duration: number, width = 1280, height = 720): void {
  Object.defineProperty(video, 'duration', { value: duration, configurable: true })
  Object.defineProperty(video, 'videoWidth', { value: width, configurable: true })
  Object.defineProperty(video, 'videoHeight', { value: height, configurable: true })
}

beforeEach(() => {
  vi.useFakeTimers()

  drawImage = vi.fn()
  canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({ drawImage })),
    toBlob: vi.fn((cb: BlobCallback) => cb(POSTER)),
  }

  const realCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return canvas as unknown as HTMLCanvasElement
    const el = realCreate(tag)
    if (tag === 'video') video = el as HTMLVideoElement
    return el
  })

  createObjectURL = vi.fn(() => 'blob:clip')
  revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('captureVideoPoster', () => {
  it('captures a frame just past the start and reports the duration', async () => {
    const pending = captureVideoPoster(CLIP)

    describeMedia(12.5)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    // 0.1s in, not the (often black) first frame.
    expect(video.currentTime).toBe(0.1)

    video.onseeked!(new Event('seeked'))
    await expect(pending).resolves.toEqual({ poster: POSTER, durationMs: 12500 })

    expect(canvas.width).toBe(1280)
    expect(canvas.height).toBe(720)
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:clip')
  })

  it('seeks to the midpoint of a clip shorter than 0.2s', async () => {
    const pending = captureVideoPoster(CLIP)

    describeMedia(0.08)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    expect(video.currentTime).toBe(0.04)

    video.onseeked!(new Event('seeked'))
    await expect(pending).resolves.toEqual({ poster: POSTER, durationMs: 80 })
  })

  it('falls back to 640x360 when the stream reports no dimensions', async () => {
    const pending = captureVideoPoster(CLIP)

    describeMedia(4, 0, 0)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    video.onseeked!(new Event('seeked'))
    await pending

    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(360)
  })

  it('reports a null duration for a stream of unknown length', async () => {
    const pending = captureVideoPoster(CLIP)

    describeMedia(Infinity)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    video.onseeked!(new Event('seeked'))
    await expect(pending).resolves.toEqual({ poster: POSTER, durationMs: null })
  })

  it('keeps the duration when no 2d context is available', async () => {
    canvas.getContext = vi.fn(() => null)
    const pending = captureVideoPoster(CLIP)

    describeMedia(3)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    video.onseeked!(new Event('seeked'))

    await expect(pending).resolves.toEqual({ poster: null, durationMs: 3000 })
  })

  it('keeps the duration when drawing the frame throws', async () => {
    drawImage.mockImplementation(() => { throw new Error('tainted') })
    const pending = captureVideoPoster(CLIP)

    describeMedia(3)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    video.onseeked!(new Event('seeked'))

    await expect(pending).resolves.toEqual({ poster: null, durationMs: 3000 })
  })

  it('passes a null poster through when toBlob produces nothing', async () => {
    canvas.toBlob = vi.fn((cb: BlobCallback) => cb(null))
    const pending = captureVideoPoster(CLIP)

    describeMedia(3)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    video.onseeked!(new Event('seeked'))

    await expect(pending).resolves.toEqual({ poster: null, durationMs: 3000 })
  })

  it('resolves empty when the browser cannot decode the file', async () => {
    const pending = captureVideoPoster(CLIP)

    video.onerror!(new Event('error'))
    await expect(pending).resolves.toEqual({ poster: null, durationMs: null })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:clip')
  })

  it('gives up after ten seconds instead of hanging', async () => {
    const pending = captureVideoPoster(CLIP)

    await vi.advanceTimersByTimeAsync(10_000)
    await expect(pending).resolves.toEqual({ poster: null, durationMs: null })
  })

  it('resolves once even if several outcomes race', async () => {
    const pending = captureVideoPoster(CLIP)

    describeMedia(6)
    video.onloadedmetadata!(new Event('loadedmetadata'))
    video.onseeked!(new Event('seeked'))
    video.onerror!(new Event('error'))

    await expect(pending).resolves.toEqual({ poster: POSTER, durationMs: 6000 })
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('still reports the duration when seeking is rejected', async () => {
    const pending = captureVideoPoster(CLIP)

    describeMedia(9)
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get: () => 0,
      set: () => { throw new Error('seek not supported') },
    })
    video.onloadedmetadata!(new Event('loadedmetadata'))

    await expect(pending).resolves.toEqual({ poster: null, durationMs: 9000 })
  })
})
