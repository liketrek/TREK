import { useRef, useState } from 'react'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import { DayNoteMarkdownToolbar } from './DayNoteMarkdownToolbar'

function TestEditor({ initial = '', maxLength = 250 }: { initial?: string; maxLength?: number }) {
  const [value, setValue] = useState(initial)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  return (
    <>
      <DayNoteMarkdownToolbar
        getTextarea={() => textareaRef.current}
        value={value}
        maxLength={maxLength}
        onChange={setValue}
        t={key => key.split('.').slice(-1)[0] || key}
      />
      <textarea ref={textareaRef} aria-label="Subtitle" value={value} onChange={event => setValue(event.target.value)} />
    </>
  )
}

function selectText(start: number, end: number) {
  const textarea = screen.getByRole('textbox', { name: 'Subtitle' }) as HTMLTextAreaElement
  textarea.setSelectionRange(start, end)
  return textarea
}

describe('DayNoteMarkdownToolbar', () => {
  it('renders the supported formatting actions as an accessible toolbar', () => {
    render(<TestEditor />)

    expect(screen.getByRole('toolbar', { name: 'toolbar' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(7)
    for (const label of ['bold', 'italic', 'strikethrough', 'bulletList', 'numberedList', 'inlineCode', 'link']) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('title', label)
    }
  })

  it.each([
    ['bold', '**Tickets**'],
    ['italic', '*Tickets*'],
    ['strikethrough', '~~Tickets~~'],
    ['inlineCode', '`Tickets`'],
  ])('wraps selected text with the %s syntax', (action, expected) => {
    render(<TestEditor initial="Tickets" />)
    selectText(0, 7)

    fireEvent.click(screen.getByRole('button', { name: action }))

    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toHaveValue(expected)
  })

  it('prefixes every selected line for unordered and ordered lists', () => {
    const { rerender } = render(<TestEditor initial={'one\ntwo'} />)
    selectText(0, 7)
    fireEvent.click(screen.getByRole('button', { name: 'bulletList' }))
    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toHaveValue('- one\n- two')

    rerender(<TestEditor key="ordered" initial={'one\ntwo'} />)
    selectText(0, 7)
    fireEvent.click(screen.getByRole('button', { name: 'numberedList' }))
    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toHaveValue('1. one\n1. two')
  })

  it('creates a Markdown link from selected text', () => {
    render(<TestEditor initial="Tickets" />)
    selectText(0, 7)

    fireEvent.click(screen.getByRole('button', { name: 'link' }))

    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toHaveValue('[Tickets](https://)')
  })

  it('preserves the textarea selection while a pointer click moves to the toolbar', () => {
    render(<TestEditor initial="Tickets" />)
    const textarea = selectText(0, 7)
    const bold = screen.getByRole('button', { name: 'bold' })

    fireEvent.mouseDown(bold)
    textarea.setSelectionRange(7, 7)
    fireEvent.click(bold)

    expect(textarea).toHaveValue('**Tickets**')
  })

  it('does not let formatting exceed the subtitle length limit', () => {
    render(<TestEditor initial={'a'.repeat(249)} />)
    selectText(0, 249)

    fireEvent.click(screen.getByRole('button', { name: 'bold' }))

    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toHaveValue('a'.repeat(249))
  })
})
