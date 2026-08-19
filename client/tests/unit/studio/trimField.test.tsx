import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '../../helpers/render'
import { TrimField } from '../../../src/components/Studio/TrimField'

/**
 * Typing a trim size (#1973).
 *
 * The field clamped on every keystroke, so typing 500 meant it saw 5, clamped
 * that to the minimum and wrote it back under the cursor: the number could not
 * be typed at all, only nudged with the arrows. What follows is the behaviour
 * that fixes it, and the two things the fix must not break — the arrows, and
 * leaving the field with something unusable in it.
 */

const onCommit = vi.fn()

function open(value = 210) {
  render(<TrimField label="Width" value={value} onCommit={onCommit} />)
  return screen.getByLabelText('Width') as HTMLInputElement
}

beforeEach(() => { onCommit.mockReset() })

describe('typing', () => {
  /* The whole point: a number gets to be typed in full before it is judged. */
  it('does not clamp a half-typed number back under the cursor', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '5' } })
    expect(input.value).toBe('5')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('keeps taking keystrokes while the number is still too small', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.change(input, { target: { value: '50' } })
    expect(input.value).toBe('50')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits as soon as what was typed can be used', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.change(input, { target: { value: '500' } })
    expect(onCommit).toHaveBeenCalledWith(500)
  })

  /* The arrows produce values already in range, and those go straight through. */
  it('lets the arrows work exactly as they did', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '211' } })
    expect(onCommit).toHaveBeenCalledWith(211)
  })

  it('shows the document size again once a committed value comes back', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '240' } })
    expect(onCommit).toHaveBeenCalledWith(240)
    // The draft is dropped on commit, so the field follows the document rather
    // than holding a stale copy of what was typed.
    expect(input.value).toBe('210')
  })
})

describe('leaving the field', () => {
  /*
   * Someone who typed 5 and clicked away meant the smallest book, not the one
   * they started with — so the clamp still happens, just at the end.
   */
  it('commits what is there, out of range and all', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(5)
  })

  it('leaves the size alone when the field was emptied', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
    expect(input.value).toBe('210')
  })

  it('commits on enter without waiting for a click elsewhere', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(5)
  })

  it('drops the draft on escape and shows the real size again', () => {
    const input = open()
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.value).toBe('210')
    expect(onCommit).not.toHaveBeenCalled()
  })
})

describe('what it shows', () => {
  it('rounds to a tenth, the way the document stores it', () => {
    expect(open(210.06).value).toBe('210.1')
  })
})
