import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import NoteFormatToolbar from './NoteFormatToolbar'

/**
 * The toolbar edits somebody else's controlled field, so every test drives it
 * through a real textarea rather than asserting on a callback in isolation —
 * the selection handling is the part that breaks, and it only exists in the DOM.
 */
function Harness({ initial = '', onValue }: { initial?: string; onValue?: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const [value, setValue] = useState(initial)
  return (
    <>
      <NoteFormatToolbar textareaRef={ref} onChange={v => { setValue(v); onValue?.(v) }} />
      <textarea ref={ref} aria-label="body" value={value} onChange={e => setValue(e.target.value)} />
    </>
  )
}

const field = () => screen.getByLabelText('body') as HTMLTextAreaElement
const select = (from: number, to: number) => {
  const ta = field()
  ta.focus()
  ta.setSelectionRange(from, to)
}

describe('NoteFormatToolbar', () => {
  it('FE-NOTEBAR-001: wraps the selection and leaves the selection on the text, not the markers', async () => {
    const user = userEvent.setup()
    render(<Harness initial="closes at 5pm" />)
    select(0, 6)

    await user.click(screen.getByRole('button', { name: /bold/i }))

    expect(field().value).toBe('**closes** at 5pm')
    // "closes", not "**closes**" — a second format nests instead of wrapping syntax.
    // The selection is restored in a rAF, after the field holds the new text.
    await waitFor(() => expect(field().value.slice(field().selectionStart, field().selectionEnd)).toBe('closes'))
  })

  it('FE-NOTEBAR-002: an empty selection inserts the markers and puts the caret between them', async () => {
    const user = userEvent.setup()
    render(<Harness initial="note" />)
    select(4, 4)

    await user.click(screen.getByRole('button', { name: /italic/i }))

    expect(field().value).toBe('note__')
    await waitFor(() => expect(field().selectionStart).toBe(5))
    expect(field().selectionEnd).toBe(5)
  })

  it('FE-NOTEBAR-003: a list prefix applies to the line the caret is on, not the whole field', async () => {
    const user = userEvent.setup()
    render(<Harness initial={'first\nsecond'} />)
    select(8, 8) // inside "second"

    await user.click(screen.getByRole('button', { name: /bulleted list/i }))

    expect(field().value).toBe('first\n- second')
  })

  it('FE-NOTEBAR-004: pressing the same line button again removes the prefix', async () => {
    const user = userEvent.setup()
    render(<Harness initial="- already a list" />)
    select(5, 5)

    await user.click(screen.getByRole('button', { name: /bulleted list/i }))

    expect(field().value).toBe('already a list')
  })

  it('FE-NOTEBAR-005: the link button leaves a placeholder URL to type over', async () => {
    const user = userEvent.setup()
    render(<Harness initial="opening hours" />)
    select(0, 13)

    await user.click(screen.getByRole('button', { name: /^link$/i }))

    expect(field().value).toBe('[opening hours](https://)')
  })

  it('FE-NOTEBAR-006: the buttons do not take focus away from the field', async () => {
    const user = userEvent.setup()
    render(<Harness initial="text" />)
    select(0, 4)

    await user.click(screen.getByRole('button', { name: /bold/i }))

    // If the button had taken focus, the selection would be gone and the wrap
    // would have landed at position 0 instead of around the word.
    expect(field().value).toBe('**text**')
    await waitFor(() => expect(document.activeElement).toBe(field()))
  })

  it('FE-NOTEBAR-007: does nothing when the field is not mounted', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Detached() {
      const ref = useRef<HTMLTextAreaElement | null>(null)
      return <NoteFormatToolbar textareaRef={ref} onChange={onChange} />
    }
    render(<Detached />)

    await user.click(screen.getByRole('button', { name: /bold/i }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
