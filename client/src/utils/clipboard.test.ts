import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyText } from './clipboard'

function setContext(clipboard: unknown, secure: boolean) {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true, writable: true })
  Object.defineProperty(window, 'isSecureContext', { value: secure, configurable: true, writable: true })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('copyText', () => {
  it('FE-UTIL-CLIP-001: uses the async clipboard API in a secure context', async () => {
    const writeText = vi.fn(async () => {})
    setContext({ writeText }, true)

    expect(await copyText('https://trip.example/s/abc')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('https://trip.example/s/abc')
  })

  // The case every plain-HTTP self-host is in: navigator.clipboard is not there
  // at all, so reading .writeText off it throws before anything is copied.
  it('FE-UTIL-CLIP-002: falls back to execCommand when there is no clipboard API', async () => {
    setContext(undefined, false)
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true, writable: true })

    expect(await copyText('https://trip.example/s/abc')).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('FE-UTIL-CLIP-003: falls back when the page is served over plain HTTP but the API object exists', async () => {
    const writeText = vi.fn(async () => {})
    setContext({ writeText }, false)
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true, writable: true })

    expect(await copyText('x')).toBe(true)
    expect(writeText).not.toHaveBeenCalled()
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('FE-UTIL-CLIP-004: reports a refused clipboard write instead of throwing', async () => {
    setContext({ writeText: vi.fn().mockRejectedValue(new Error('denied')) }, true)

    expect(await copyText('x')).toBe(false)
  })

  // A leftover textarea would steal focus and show up in the next query.
  it('FE-UTIL-CLIP-005: removes the temporary textarea even when execCommand throws', async () => {
    setContext(undefined, false)
    Object.defineProperty(document, 'execCommand', {
      value: () => { throw new Error('not allowed') },
      configurable: true,
      writable: true,
    })

    expect(await copyText('x')).toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })
})
