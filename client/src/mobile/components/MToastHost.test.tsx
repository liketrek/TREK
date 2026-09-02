// FE-COMP-MTOASTHOST-001 to FE-COMP-MTOASTHOST-005
import { act, render, screen } from '@testing-library/react'
import MToastHost from './MToastHost'

// The geolocation hint from discussion #2095: the longest string the toast bus
// carries, and the one whose actionable half used to sit behind the ellipsis.
const LONG = 'Location access is blocked. Check your device settings; an installed app has its own location permission, separate from the browser.'

// Tailwind emits the display plugin AFTER lineClamp, so any display utility on
// the same element overrides `line-clamp-*`'s own `-webkit-box`.
const DISPLAY_UTILITIES = ['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'flow-root', 'contents', 'inline']

function push(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000): void {
  act(() => { window.__addToast?.(message, type, duration) })
}

afterEach(() => {
  delete window.__addToast
})

describe('MToastHost', () => {
  it('FE-COMP-MTOASTHOST-001: takes over the toast bus and hands it back on unmount', () => {
    const previous = vi.fn(() => 1)
    window.__addToast = previous

    const { unmount } = render(<MToastHost />)
    expect(window.__addToast).not.toBe(previous)

    unmount()
    expect(window.__addToast).toBe(previous)
  })

  it('FE-COMP-MTOASTHOST-002: keeps a short message on the single-line pill', () => {
    render(<MToastHost />)
    push('Trip saved')

    const text = screen.getByText('Trip saved')
    expect(text.className.split(/\s+/)).toContain('truncate')
    expect(text.parentElement!.className).toContain('rounded-full')
  })

  it('FE-COMP-MTOASTHOST-003: wraps a long message instead of cutting it off', () => {
    render(<MToastHost />)
    push(LONG, 'error', 6000)

    const classes = screen.getByText(LONG).className.split(/\s+/)
    expect(classes).not.toContain('truncate')
    expect(classes).toContain('line-clamp-4')
    DISPLAY_UTILITIES.forEach(utility => expect(classes).not.toContain(utility))
  })

  it('FE-COMP-MTOASTHOST-004: softens the pill into a card once the message wraps', () => {
    render(<MToastHost />)
    push(LONG, 'error', 6000)

    const pill = screen.getByText(LONG).parentElement!
    expect(pill.className).toContain('rounded-2xl')
    expect(pill.className).not.toContain('rounded-full')
    expect(pill.className).toContain('items-start')
  })

  it('FE-COMP-MTOASTHOST-005: a wrapping sticky toast is still tappable', () => {
    render(<MToastHost />)
    push(LONG, 'error', 0)

    const pill = screen.getByRole('button')
    expect(pill.className).toContain('pointer-events-auto')
    expect(pill.className).toContain('rounded-2xl')
  })
})
