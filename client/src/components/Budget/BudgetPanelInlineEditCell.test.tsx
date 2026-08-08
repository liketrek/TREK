// FE-W4IEC-001 to FE-W4IEC-016
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import InlineEditCell from './BudgetPanelInlineEditCell'

function setup(props: Partial<Parameters<typeof InlineEditCell>[0]> = {}) {
  const onSave = vi.fn()
  const utils = render(<InlineEditCell value="Ferry" onSave={onSave} locale="en-US" {...props} />)
  return { onSave, ...utils }
}

function paste(input: HTMLElement, text: string) {
  fireEvent.paste(input, { clipboardData: { getData: () => text } })
}

describe('InlineEditCell — display', () => {
  it('FE-W4IEC-001: shows the raw text value', () => {
    setup()
    expect(screen.getByText('Ferry')).toBeInTheDocument()
  })

  it('FE-W4IEC-002: formats a number with the given decimals and locale', () => {
    setup({ value: 1234.5, type: 'number' })
    expect(screen.getByText('1,234.50')).toBeInTheDocument()
  })

  it('FE-W4IEC-003: honours a custom decimal count', () => {
    setup({ value: 12, type: 'number', decimals: 0 })
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('FE-W4IEC-004: falls back to the placeholder, then to a dash', () => {
    const { unmount } = setup({ value: null, placeholder: 'Add note' })
    expect(screen.getByText('Add note')).toBeInTheDocument()
    unmount()

    setup({ value: null })
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('FE-W4IEC-005: exposes the edit tooltip and hover feedback when editable', () => {
    const { container } = setup({ editTooltip: 'Click to edit' })
    const cell = container.firstElementChild as HTMLElement

    expect(cell).toHaveAttribute('title', 'Click to edit')
    fireEvent.mouseEnter(cell)
    expect(cell.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(cell)
    expect(cell.style.background).toBe('transparent')
  })

  it('FE-W4IEC-006: a read-only cell has no tooltip, no hover and cannot be opened', () => {
    const { container } = setup({ readOnly: true, editTooltip: 'Click to edit' })
    const cell = container.firstElementChild as HTMLElement

    expect(cell).not.toHaveAttribute('title')
    fireEvent.mouseEnter(cell)
    expect(cell.style.background).toBe('')

    fireEvent.click(cell)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('FE-W4IEC-007: centres the content when the caller centres the text', () => {
    const { container } = setup({ style: { textAlign: 'center' } })

    expect((container.firstElementChild as HTMLElement).style.justifyContent).toBe('center')
  })
})

describe('InlineEditCell — editing', () => {
  it('FE-W4IEC-008: clicking opens a focused, pre-selected input', () => {
    const { container } = setup()
    fireEvent.click(container.firstElementChild!)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toHaveValue('Ferry')
    expect(input).toHaveFocus()
  })

  it('FE-W4IEC-009: Enter saves the changed value', () => {
    const { onSave, container } = setup()
    fireEvent.click(container.firstElementChild!)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Bus' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSave).toHaveBeenCalledWith('Bus')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('FE-W4IEC-010: blur saves and an unchanged value does not fire onSave', () => {
    const { onSave, container } = setup()
    fireEvent.click(container.firstElementChild!)

    fireEvent.blur(screen.getByRole('textbox'))

    expect(onSave).not.toHaveBeenCalled()
  })

  it('FE-W4IEC-011: Escape restores the original value without saving', () => {
    const { onSave, container } = setup()
    fireEvent.click(container.firstElementChild!)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Bus' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Ferry')).toBeInTheDocument()
  })

  it('FE-W4IEC-012: a numeric cell parses a comma decimal and uses a decimal keypad', () => {
    const { onSave, container } = setup({ value: 10, type: 'number' })
    fireEvent.click(container.firstElementChild!)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    fireEvent.change(input, { target: { value: '12,50' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSave).toHaveBeenCalledWith(12.5)
  })

  it('FE-W4IEC-013: an unparseable numeric entry saves null', () => {
    const { onSave, container } = setup({ value: 10, type: 'number' })
    fireEvent.click(container.firstElementChild!)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })

    expect(onSave).toHaveBeenCalledWith(null)
  })

  it('FE-W4IEC-014: pasting a formatted amount normalizes separators', () => {
    const { container } = setup({ value: 0, type: 'number' })
    fireEvent.click(container.firstElementChild!)
    const input = screen.getByRole('textbox')

    paste(input, '1.234,56 EUR')
    expect(input).toHaveValue('1234.56')

    paste(input, '$2,345.67')
    expect(input).toHaveValue('2345.67')
  })

  it('FE-W4IEC-015: pasting a separator-free amount keeps the digits', () => {
    const { container } = setup({ value: 0, type: 'number' })
    fireEvent.click(container.firstElementChild!)
    const input = screen.getByRole('textbox')

    paste(input, 'EUR 4200')
    expect(input).toHaveValue('4200')
  })

  it('FE-W4IEC-016: a text cell leaves pasted content to the browser', () => {
    const { container } = setup()
    fireEvent.click(container.firstElementChild!)
    const input = screen.getByRole('textbox')

    paste(input, '1.234,56')

    expect(input).toHaveValue('Ferry')
  })
})
