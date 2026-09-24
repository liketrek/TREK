// FE-COMP-NUMINPUT-001 to FE-COMP-NUMINPUT-014
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

function Harness({ initial, mode, signToggleLabel }: { initial: string; mode?: NumericMode; signToggleLabel?: string }) {
  const [v, setV] = useState(initial)
  return <NumericInput value={v} onValueChange={setV} mode={mode} signToggleLabel={signToggleLabel} aria-label="field" />
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

  it('FE-COMP-NUMINPUT-010: signed-decimal mode keeps a leading minus and the comma (#2176)', () => {
    render(<Harness initial="" mode="signed-decimal" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    // A refund typed on a European keypad: sign and comma both survive.
    fireEvent.change(input, { target: { value: '-12,50' } })
    expect(input.value).toBe('-12,50')

    fireEvent.change(input, { target: { value: '-100' } })
    expect(input.value).toBe('-100')

    // A minus anywhere but the front is not a sign.
    fireEvent.change(input, { target: { value: '12-50' } })
    expect(input.value).toBe('1250')

    fireEvent.change(input, { target: { value: '-1x2.5eur' } })
    expect(input.value).toBe('-12.5')
  })

  it('FE-COMP-NUMINPUT-011: signed-decimal mode uses the decimal keypad', () => {
    render(<Harness initial="" mode="signed-decimal" />)
    expect((screen.getByLabelText('field') as HTMLInputElement).inputMode).toBe('decimal')
  })

  it('FE-COMP-NUMINPUT-012: the sign toggle flips the sign of what is already there (#2176)', () => {
    // iOS renders inputMode="decimal" as a pad of digits, separator and backspace, with
    // no minus key, so a refund is untypeable on a phone without this button.
    render(<Harness initial="" mode="signed-decimal" signToggleLabel="Toggle sign" />)
    const input = screen.getByLabelText('field') as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Toggle sign' })

    fireEvent.change(input, { target: { value: '12,50' } })
    fireEvent.click(toggle)
    expect(input.value).toBe('-12,50')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(toggle)
    expect(input.value).toBe('12,50')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    // The button must not take the focus, or the phone keypad closes mid-entry.
    expect(fireEvent.mouseDown(toggle)).toBe(false)
  })

  it('FE-COMP-NUMINPUT-013: an empty field toggles to a bare minus so the digits follow', () => {
    render(<Harness initial="" mode="signed-decimal" signToggleLabel="Toggle sign" />)
    const input = screen.getByLabelText('field') as HTMLInputElement

    fireEvent.click(screen.getByRole('button', { name: 'Toggle sign' }))
    expect(input.value).toBe('-')

    // The caret stays in the field, so the next keystroke appends to the sign.
    fireEvent.change(input, { target: { value: '-1' } })
    expect(input.value).toBe('-1')
  })

  it('FE-COMP-NUMINPUT-014: there is no toggle without a label, and none on an unsigned field', () => {
    const { unmount } = render(<Harness initial="" mode="signed-decimal" />)
    expect(screen.queryByRole('button')).toBeNull()
    unmount()

    render(<Harness initial="" mode="decimal" signToggleLabel="Toggle sign" />)
    expect(screen.queryByRole('button')).toBeNull()
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
