import { describe, it, expect, afterEach, vi } from 'vitest'
import { maybeInstallTouchDragPolyfill } from './touchDragPolyfill'

// Stub the polyfill so the test exercises only the load gate, not the real
// document-level touch listeners the package installs on import.
vi.mock('drag-drop-touch', () => ({}))

// The gate is pointer-based, not width-based. The polyfill synthesises HTML5 drag events
// from touchmove, so on a coarse-pointer device it turns a scroll swipe into a drag
// (#1432) and fabricates a dblclick that zooms the map (#1440). Drag reorder is disabled
// on those devices anyway, leaving one device class with a job for it: the hybrid laptop
// — mouse as primary pointer, touchscreen also present.
function mockPointer(matching: string[]) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: matching.includes(query), media: query }) as MediaQueryList,
  )
}

describe('maybeInstallTouchDragPolyfill', () => {
  afterEach(() => vi.restoreAllMocks())

  it('loads on a hybrid laptop — mouse primary, touchscreen available', async () => {
    mockPointer(['(pointer: fine) and (any-pointer: coarse)'])
    const result = maybeInstallTouchDragPolyfill()
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toBeDefined()
  })

  it('does not load on a tablet — coarse primary pointer at a desktop width (#1432)', () => {
    mockPointer(['(pointer: coarse)', '(any-pointer: coarse)'])
    expect(maybeInstallTouchDragPolyfill()).toBeUndefined()
  })

  it('does not load on a phone', () => {
    mockPointer(['(pointer: coarse)', '(any-pointer: coarse)'])
    expect(maybeInstallTouchDragPolyfill()).toBeUndefined()
  })

  it('does not load on a plain mouse-driven desktop', () => {
    mockPointer(['(pointer: fine)'])
    expect(maybeInstallTouchDragPolyfill()).toBeUndefined()
  })
})
