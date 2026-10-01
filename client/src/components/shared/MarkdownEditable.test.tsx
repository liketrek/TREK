// FE-SHARED-MDEDIT-001 to FE-SHARED-MDEDIT-004 (#2558)
import { useState } from 'react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import MarkdownEditable from './MarkdownEditable'

function Harness({ initial, canEdit = true }: { initial: string; canEdit?: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <MarkdownEditable value={value} canEdit={canEdit} editLabel="Edit"
      renderEditor={editor => <textarea aria-label="editor" value={value} onChange={e => setValue(e.target.value)} {...editor} />} />
  )
}

describe('MarkdownEditable', () => {
  it('FE-SHARED-MDEDIT-001: renders a saved value as Markdown with a working link', () => {
    render(<Harness initial={'**Ferry** at [the port](https://example.com)'} />)
    expect(screen.getByText('Ferry').tagName).toBe('STRONG')
    const link = screen.getByRole('link', { name: 'the port' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    // Following the link does not open the editor.
    fireEvent.click(link)
    expect(screen.queryByLabelText('editor')).not.toBeInTheDocument()
  })

  it('FE-SHARED-MDEDIT-002: a click on the text opens the editor, leaving it shows the text again', () => {
    render(<Harness initial="Bring cash" />)
    fireEvent.click(screen.getByText('Bring cash'))
    const editor = screen.getByLabelText('editor')
    expect(editor).toHaveValue('Bring cash')
    fireEvent.blur(editor)
    expect(screen.queryByLabelText('editor')).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(screen.getByLabelText('editor')).toBeInTheDocument()
  })

  it('FE-SHARED-MDEDIT-003: an empty field is the editor, and stays one while it is typed into', () => {
    render(<Harness initial="" />)
    const editor = screen.getByLabelText('editor')
    fireEvent.focus(editor)
    fireEvent.change(editor, { target: { value: 'N' } })
    expect(screen.getByLabelText('editor')).toHaveValue('N')
  })

  it('FE-SHARED-MDEDIT-004: without edit rights it is only text', () => {
    render(<Harness initial="Read only" canEdit={false} />)
    expect(screen.getByText('Read only')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
