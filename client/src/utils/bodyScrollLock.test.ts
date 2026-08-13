import { describe, it, expect, beforeEach } from 'vitest'
import { lockBodyScroll, bodyScrollLocks, resetBodyScrollLock } from './bodyScrollLock'

/**
 * The lock only became load-bearing with #1809 (below 768px the document is the
 * scroller), and the bug it has to rule out is an overlay clearing a lock that
 * another overlay still holds.
 */
describe('bodyScrollLock', () => {
  beforeEach(() => {
    resetBodyScrollLock()
    document.body.style.overflow = ''
  })

  it('FE-UTIL-SCROLLLOCK-001: locks the body and restores the previous value', () => {
    document.body.style.overflow = 'auto'
    const release = lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')
    release()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('FE-UTIL-SCROLLLOCK-002: stacked overlays only unlock on the last release', () => {
    const first = lockBodyScroll()
    const second = lockBodyScroll()
    expect(bodyScrollLocks()).toBe(2)

    second()
    expect(document.body.style.overflow).toBe('hidden')

    first()
    expect(document.body.style.overflow).toBe('')
    expect(bodyScrollLocks()).toBe(0)
  })

  it('FE-UTIL-SCROLLLOCK-003: releasing twice leaves the other overlay lock intact', () => {
    const first = lockBodyScroll()
    const second = lockBodyScroll()

    second()
    second()
    second()

    expect(bodyScrollLocks()).toBe(1)
    expect(document.body.style.overflow).toBe('hidden')
    first()
    expect(document.body.style.overflow).toBe('')
  })

  it('FE-UTIL-SCROLLLOCK-004: an unlock never sets a value the caller did not save', () => {
    document.body.style.overflow = 'scroll'
    const release = lockBodyScroll()
    const nested = lockBodyScroll()
    nested()
    release()
    expect(document.body.style.overflow).toBe('scroll')
  })
})
