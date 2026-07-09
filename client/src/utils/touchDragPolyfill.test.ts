import { describe, it, expect, afterEach, vi } from 'vitest'
import { maybeInstallTouchDragPolyfill } from './touchDragPolyfill'

// Stub the polyfill so the test exercises only the load gate, not the real
// document-level touch listeners the package installs on import.
vi.mock('drag-drop-touch', () => ({}))

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true, writable: true })
}

describe('maybeInstallTouchDragPolyfill', () => {
  const original = window.innerWidth
  afterEach(() => setWidth(original))

  it('does not load the polyfill on mobile viewports (<1024px)', () => {
    setWidth(390)
    expect(maybeInstallTouchDragPolyfill()).toBeUndefined()
  })

  it('loads the polyfill on large viewports (>=1024px)', async () => {
    setWidth(1440)
    const result = maybeInstallTouchDragPolyfill()
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toBeDefined()
  })
})
