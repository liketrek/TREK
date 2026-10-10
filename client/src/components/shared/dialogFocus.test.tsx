// FE-SHARED-DIALOGFOCUS-001 to FE-SHARED-DIALOGFOCUS-009
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { DialogShell } from './DialogShell'
import Modal from './Modal'
import { firstTextField } from './dialogFocus'

/** A desktop with a mouse: the only case the first field takes the focus. */
function asDesktop() {
  const original = window.matchMedia
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(pointer: fine)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
  return () => { window.matchMedia = original }
}

let restore: (() => void) | null = null
afterEach(() => { restore?.(); restore = null })

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <DialogShell onClose={() => {}} labelledBy="t" header={<h2 id="t">Title</h2>}>
      {children}
    </DialogShell>
  )
}

describe('firstTextField', () => {
  it('FE-SHARED-DIALOGFOCUS-001: skips buttons, read-only, disabled and list-opening fields', () => {
    const panel = document.createElement('div')
    panel.innerHTML = `
      <button>Close</button>
      <input type="checkbox" />
      <input type="text" readonly />
      <input type="text" disabled />
      <input type="text" data-no-autofocus />
      <input role="combobox" />
      <div hidden><input type="text" /></div>
      <input type="text" id="target" />
      <textarea></textarea>`
    expect(firstTextField(panel)?.id).toBe('target')
  })

  it('FE-SHARED-DIALOGFOCUS-002: a dialog with no field has none', () => {
    const panel = document.createElement('div')
    panel.innerHTML = '<button>OK</button>'
    expect(firstTextField(panel)).toBeNull()
  })
})

describe('DialogShell focus (#1302)', () => {
  it('FE-SHARED-DIALOGFOCUS-003: on a desktop the first text field is ready to type into', () => {
    restore = asDesktop()
    render(<Shell><button>Pick</button><input aria-label="Name" /></Shell>)
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('FE-SHARED-DIALOGFOCUS-004: on a touch screen the panel takes the focus, so no keyboard pops up', () => {
    render(<Shell><input aria-label="Name" /></Shell>)
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('FE-SHARED-DIALOGFOCUS-005: a field that took the focus itself keeps it', () => {
    restore = asDesktop()
    render(<Shell><input aria-label="First" /><input aria-label="Search" autoFocus /></Shell>)
    expect(screen.getByLabelText('Search')).toHaveFocus()
  })

  it('FE-SHARED-DIALOGFOCUS-006: Tab wraps from the last control to the first and back', () => {
    render(<Shell><button>One</button><button>Two</button></Shell>)
    const one = screen.getByRole('button', { name: 'One' })
    const two = screen.getByRole('button', { name: 'Two' })

    two.focus()
    fireEvent.keyDown(two, { key: 'Tab' })
    expect(one).toHaveFocus()

    fireEvent.keyDown(one, { key: 'Tab', shiftKey: true })
    expect(two).toHaveFocus()

    // From the panel itself, Shift+Tab goes to the last control rather than the page.
    const panel = screen.getByRole('dialog')
    panel.focus()
    fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true })
    expect(two).toHaveFocus()
  })

  it('FE-SHARED-DIALOGFOCUS-007: Tab in the middle is left to the browser', () => {
    render(<Shell><button>One</button><button>Two</button><button>Three</button></Shell>)
    const two = screen.getByRole('button', { name: 'Two' })
    two.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    two.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('Modal focus (#1302)', () => {
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit">
          <input aria-label="Title" />
          <button>Save</button>
        </Modal>
      </>
    )
  }

  it('FE-SHARED-DIALOGFOCUS-008: the focus moves in on open and back to the opener on close', () => {
    restore = asDesktop()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByLabelText('Title')).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByLabelText('Title')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('FE-SHARED-DIALOGFOCUS-009: Tab stays inside the modal', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    const save = screen.getByRole('button', { name: 'Save' })
    save.focus()
    fireEvent.keyDown(save, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })
})
