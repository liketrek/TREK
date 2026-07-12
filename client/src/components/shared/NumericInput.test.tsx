// FE-COMP-NUMINPUT-001 to FE-COMP-NUMINPUT-008
//
// #1513: tapping a pre-populated numeric field put the caret at the end, so the first
// digit typed was appended rather than replacing the value — quantity 1 + "6" = "16".
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { NumericInput, type NumericMode } from './NumericInput'

// select() is deferred a frame on purpose (see the component); run rAF synchronously.
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
})
afterEach(() => vi.unstubAllGlobals())

function Harness({ initial, mode }: { initial: string; mode?: NumericMode }) {
  const [v, setV] = useState(initial)
  return <NumericInput value={v} onValueChange={setV} mode={mode} aria-label="field" />
}

describe('NumericInput', () => {
  it('FE-COMP-NUMINPUT-001: selects the existing value on focus so a typed digit replaces it', () => {
    render(<Harness initial="1" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.focus(input)

    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(1)
  })

  it('FE-COMP-NUMINPUT-002: selects a multi-digit value in full', () => {
    render(<Harness initial="250" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.focus(input)

    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(3)
  })

  it('FE-COMP-NUMINPUT-003: is a text input with a numeric keypad, not type=number', () => {
    // type=number silently mutates the value on scroll-wheel and ships spinner arrows.
    render(<Harness initial="1" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    expect(input.type).toBe('text')
    expect(input.inputMode).toBe('numeric')
  })

  it('FE-COMP-NUMINPUT-004: integer mode strips non-digits', () => {
    render(<Harness initial="" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.change(input, { target: { value: '1a2-b3' } })

    expect(input.value).toBe('123')
  })

  it('FE-COMP-NUMINPUT-005: decimal mode keeps a dot and a comma (callers normalize the comma)', () => {
    render(<Harness initial="" mode="decimal" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.change(input, { target: { value: '12.50' } })
    expect(input.value).toBe('12.50')

    fireEvent.change(input, { target: { value: '12,50' } })
    expect(input.value).toBe('12,50')

    fireEvent.change(input, { target: { value: '1x2.5eur' } })
    expect(input.value).toBe('12.5')
  })

  it('FE-COMP-NUMINPUT-006: decimal mode uses the decimal keypad', () => {
    render(<Harness initial="" mode="decimal" />)
    expect((screen.getByLabelText('field') as HTMLInputElement).inputMode).toBe('decimal')
  })

  it('FE-COMP-NUMINPUT-007: signed mode keeps a leading minus (coordinates)', () => {
    render(<Harness initial="" mode="signed" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.change(input, { target: { value: '-4.4215' } })
    expect(input.value).toBe('-4.4215')

    // A minus anywhere but the front is not a sign.
    fireEvent.change(input, { target: { value: '36.72' } })
    expect(input.value).toBe('36.72')
  })

  it('FE-COMP-NUMINPUT-009: typing inside the one-frame window is not swallowed by the deferred select', async () => {
    // The deferred select() exists for WebKit, but it must not fire *after* the user has
    // started typing: it would select the half-typed value and the next character would
    // replace it, turning "48.853" into ".853". Any input cancels the pending select.
    vi.unstubAllGlobals()
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return 0
    })

    render(<Harness initial="" mode="signed" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.focus(input)
    // User types before the queued frame runs.
    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.change(input, { target: { value: '48' } })

    // Frame finally runs — must be a no-op now.
    frames.forEach(cb => cb(0))

    fireEvent.change(input, { target: { value: '48.853' } })

    expect(input.value).toBe('48.853')
  })

  it('FE-COMP-NUMINPUT-008: a caller-supplied onFocus still runs alongside the select', () => {
    const onFocus = vi.fn()
    render(
      <NumericInput value="7" onValueChange={() => {}} onFocus={onFocus} aria-label="field" />,
    )
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.focus(input)

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(input.selectionEnd).toBe(1)
  })
})
