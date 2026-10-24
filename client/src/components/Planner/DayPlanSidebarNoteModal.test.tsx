// FE-PLANNER-NOTEMODAL-001 to FE-PLANNER-NOTEMODAL-014
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { DayPlanSidebarNoteModal } from './DayPlanSidebarNoteModal'

// `t` arrives as a prop, so echoing the key keeps the assertions exact. The
// shared pieces (the close and delete buttons, the colour swatches) read the
// English catalogue.
const t = (key: string) => key

type Ui = { mode: 'add' | 'edit'; noteId?: number; icon: string; text: string; time: string; color?: string | null }

/** Holds the note map like the planner's hook does, so typing reaches the fields. */
function setup(initial: Record<string, Ui | undefined>, overrides: Partial<React.ComponentProps<typeof DayPlanSidebarNoteModal>> = {}) {
  let state = initial
  const cancelNote = vi.fn()
  const saveNote = vi.fn()
  const onRequestDelete = vi.fn()
  const setNoteUi = vi.fn((updater: (prev: typeof state) => typeof state) => {
    state = updater(state)
    view.rerender(ui())
  })
  const ui = () => (
    <DayPlanSidebarNoteModal
      noteUi={state}
      setNoteUi={setNoteUi}
      noteInputRef={{ current: null }}
      cancelNote={cancelNote}
      saveNote={saveNote}
      onRequestDelete={onRequestDelete}
      t={t}
      {...overrides}
    />
  )
  const view = render(ui())
  return { cancelNote, saveNote, onRequestDelete, setNoteUi, get state() { return state } }
}

const adding = (fields: Partial<Ui> = {}): Ui => ({ mode: 'add', icon: 'FileText', text: '', time: '', color: null, ...fields })

describe('DayPlanSidebarNoteModal', () => {
  it('FE-PLANNER-NOTEMODAL-001: nothing open, nothing shown', () => {
    setup({ '10': undefined })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-NOTEMODAL-002: a new note is a dialog named "Add Note" with the title field focused', () => {
    setup({ '10': adding() })
    expect(screen.getByRole('dialog', { name: 'dayplan.noteAdd' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'dayplan.noteTitle' })).toHaveFocus()
    // Nothing to delete yet.
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('FE-PLANNER-NOTEMODAL-003: typing the title reaches the day entry and the preview card', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding() })
    // An empty title cannot be added.
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'dayplan.noteTitle' }), 'Ferry')
    expect(s.state['10']?.text).toBe('Ferry')
    expect(screen.getByText('Ferry')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.add' })).toBeEnabled()
  })

  it('FE-PLANNER-NOTEMODAL-004: Enter in the title saves the note', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding({ text: 'Ferry' }) })
    await user.type(screen.getByRole('textbox', { name: 'dayplan.noteTitle' }), '{Enter}')
    expect(s.saveNote).toHaveBeenCalledWith(10)
  })

  it('FE-PLANNER-NOTEMODAL-005: Save and Cancel answer for their own day', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding({ text: 'Ferry' }) })
    await user.click(screen.getByRole('button', { name: 'common.add' }))
    expect(s.saveNote).toHaveBeenCalledWith(10)
    await user.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(s.cancelNote).toHaveBeenCalledWith(10)
  })

  it('FE-PLANNER-NOTEMODAL-006: Escape in the title or the body cancels', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding({ text: 'Ferry' }) })
    await user.keyboard('{Escape}')
    expect(s.cancelNote).toHaveBeenCalledWith(10)
    s.cancelNote.mockClear()
    await user.click(screen.getByRole('textbox', { name: 'dayplan.noteSubtitle' }))
    await user.keyboard('{Escape}')
    expect(s.cancelNote).toHaveBeenCalledWith(10)
  })

  // The lost-note bug: a selection dragged out of a field and let go over the
  // backdrop used to count as a click on it and threw the note away.
  it('FE-PLANNER-NOTEMODAL-007: a press that starts in the dialog and ends on the backdrop keeps the note', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding({ text: 'Ferry' }) })
    const dialog = screen.getByRole('dialog')
    fireEvent.mouseDown(screen.getByRole('textbox', { name: 'dayplan.noteTitle' }))
    fireEvent.click(dialog.parentElement as HTMLElement)
    expect(s.cancelNote).not.toHaveBeenCalled()
    // A press that starts and ends on the backdrop still closes.
    await user.click(dialog.parentElement as HTMLElement)
    expect(s.cancelNote).toHaveBeenCalledWith(10)
  })

  it('FE-PLANNER-NOTEMODAL-008: the icon grid marks the pick and names each icon', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding() })
    const group = screen.getByRole('group', { name: 'dayplan.noteIcon' })
    expect(group.querySelectorAll('button')).toHaveLength(32)
    expect(screen.getByRole('button', { name: 'FileText' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Plane' }))
    expect(s.state['10']?.icon).toBe('Plane')
    expect(screen.getByRole('button', { name: 'Plane' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'FileText' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-PLANNER-NOTEMODAL-009: the shared tooltip names an icon on hover', async () => {
    const user = userEvent.setup()
    setup({ '10': adding() })
    const plane = screen.getByRole('button', { name: 'Plane' })
    expect(plane).not.toHaveAttribute('title')
    await user.hover(plane)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Plane')
  })

  it('FE-PLANNER-NOTEMODAL-010: a colour pick tints the head band', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding({ text: 'Ferry' }) })
    await user.click(screen.getByRole('button', { name: 'Red' }))
    expect(s.state['10']?.color).toBe('#dc2626')
    const header = screen.getByRole('dialog').querySelector('header') as HTMLElement
    // jsdom normalises the hex inside color-mix() to rgb().
    expect(header.style.background).toContain('220, 38, 38')
  })

  it('FE-PLANNER-NOTEMODAL-011: the body renders as markdown under the field, with a counter that warns near the limit', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding({ text: 'Ferry', time: 'book **early**' }) })
    expect(screen.getByText('early').tagName).toBe('STRONG')
    expect(screen.getByText('notes.markdownHint')).toBeInTheDocument()
    expect(screen.getByText('14/2000')).toHaveClass('text-content-faint')
    const body = screen.getByRole('textbox', { name: 'dayplan.noteSubtitle' })
    expect(body).toHaveAttribute('maxLength', '2000')
    expect(body).toHaveAttribute('rows', '6')
    fireEvent.change(body, { target: { value: 'x'.repeat(1900) } })
    expect(s.state['10']?.time).toHaveLength(1900)
    expect(screen.getByText('1900/2000')).toHaveClass('text-warning')
    // The formatting bar writes into the same field.
    await user.click(screen.getByRole('button', { name: 'Bold' }))
    expect(s.setNoteUi).toHaveBeenCalled()
  })

  it('FE-PLANNER-NOTEMODAL-012: an edited note is named "Edit Note", saves, and asks the planner before it deletes', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': { mode: 'edit', noteId: 55, icon: 'Plane', text: 'Ferry', time: '', color: null } })
    expect(screen.getByRole('dialog', { name: 'dayplan.noteEdit' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'common.save' }))
    expect(s.saveNote).toHaveBeenCalledWith(10)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(s.onRequestDelete).toHaveBeenCalledWith(10, 55)
  })

  it('FE-PLANNER-NOTEMODAL-013: the head band close button cancels', async () => {
    const user = userEvent.setup()
    const s = setup({ '10': adding() })
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(s.cancelNote).toHaveBeenCalledWith(10)
  })

  it('FE-PLANNER-NOTEMODAL-014: the two columns stack on a narrow window', () => {
    setup({ '10': adding() })
    const columns = screen.getByRole('group', { name: 'dayplan.noteIcon' }).closest('.grid') as HTMLElement
    expect(columns).toHaveClass('grid-cols-1')
    expect(columns.className).toMatch(/sm:grid-cols-\[210px_minmax\(0,1fr\)\]/)
  })
})
