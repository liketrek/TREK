/**
 * videoPoster unit tests (#823). The poster-capture path needs a real <video>
 * decoder + canvas, which jsdom does not provide, so we cover the pure file-type
 * gate here; poster capture is exercised manually / in the browser.
 */
import { describe, it, expect } from 'vitest'
import { isVideoFile } from '../../../src/utils/videoPoster'

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
