import { describe, it, expect, vi, beforeEach } from 'vitest'

const plyrCtor = vi.fn()
vi.mock('plyr', () => ({
  default: class {
    el: HTMLElement
    original: Node
    constructor(el: HTMLElement, options: Record<string, unknown>) {
      plyrCtor(el, options)
      this.el = el
      this.original = el.cloneNode(true)
    }
    // What the real destroy() does to the document: the element as it was at
    // construction goes back in, whatever React wrote to it since.
    destroy() {
      this.el.replaceWith(this.original)
    }
  },
}))
vi.mock('plyr/dist/plyr.css', () => ({}))

import { render } from '../../../tests/helpers/render'
import VideoPlayer from './VideoPlayer'

describe('VideoPlayer', () => {
  beforeEach(() => { plyrCtor.mockClear() })

  it('hands Plyr the sprite from this origin, not the one on cdn.plyr.io (#2341)', () => {
    // connect-src refuses cdn.plyr.io, so with the default the player worked and
    // every button in it was blank. The sprite ships with the bundle instead.
    render(<VideoPlayer src="/api/photos/7/original" autoPlay={false} />)

    expect(plyrCtor).toHaveBeenCalledTimes(1)
    const [, options] = plyrCtor.mock.calls[0]
    // A hashed asset URL in the bundle, the raw file (with its query) under vitest.
    expect(String(options.iconUrl)).toMatch(/plyr[^/]*\.svg(\?|$)/)
    expect(String(options.iconUrl)).not.toContain('cdn.plyr.io')
  })

  it('resets the element to an empty source on teardown rather than a clip on the CDN', () => {
    // media-src refuses cdn.plyr.io too; an empty source aborts the stream just the
    // same, and the element is out of the document by then.
    render(<VideoPlayer src="/api/photos/7/original" autoPlay={false} />)

    const [, options] = plyrCtor.mock.calls[0]
    expect(options.blankVideo).toBe('')
  })

  it('mounts the player on the video element it renders', () => {
    const { container } = render(<VideoPlayer src="/api/photos/7/original" poster="/api/photos/7/thumbnail" />)

    const [el] = plyrCtor.mock.calls[0]
    expect(el).toBe(container.querySelector('video'))
    expect(container.querySelector('video')).toHaveAttribute('poster', '/api/photos/7/thumbnail')
  })

  it('stepping to another clip builds the player on a fresh element, so the clip on screen is the new one', () => {
    // Rebuilding Plyr on the same <video> ran after React had already pointed it at
    // the next clip, and destroy() then swapped the first clip back in. The file
    // lightboxes do not key the player themselves, so this has to hold here.
    const { container, rerender } = render(<VideoPlayer src="/api/photos/7/original" autoPlay={false} />)
    rerender(<VideoPlayer src="/api/photos/8/original" autoPlay={false} />)

    expect(plyrCtor).toHaveBeenCalledTimes(2)
    const [first] = plyrCtor.mock.calls[0]
    const [second] = plyrCtor.mock.calls[1]
    expect(second).not.toBe(first)
    expect(second).toBe(container.querySelector('video'))
    expect(container.querySelector('video')).toHaveAttribute('src', '/api/photos/8/original')
  })
})
