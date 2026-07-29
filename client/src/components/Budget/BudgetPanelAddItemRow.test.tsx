// FE-W4AIR-001 to FE-W4AIR-009
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import AddItemRow from './BudgetPanelAddItemRow'

const t = (key: string) => key

function setup() {
  const onAdd = vi.fn()
  const utils = render(<table><tbody><AddItemRow onAdd={onAdd} t={t} /></tbody></table>)
  return { onAdd, ...utils }
}

const nameInput = () => screen.getByPlaceholderText('budget.newEntry')
const priceInput = () => screen.getByPlaceholderText('0,00')
const noteInput = () => screen.getByPlaceholderText('budget.table.note')
const numberInputs = () => screen.getAllByPlaceholderText('-')

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BudgetPanelAddItemRow', () => {
  it('FE-W4AIR-001: the add button stays disabled until a name is typed', () => {
    setup()
    const button = screen.getByRole('button', { name: 'reservations.add' })

    expect(button).toBeDisabled()
    fireEvent.change(nameInput(), { target: { value: 'Ferry' } })
    expect(button).toBeEnabled()
  })

  it('FE-W4AIR-002: submits the trimmed name with parsed numbers', () => {
    const { onAdd } = setup()

    fireEvent.change(nameInput(), { target: { value: '  Ferry  ' } })
    fireEvent.change(priceInput(), { target: { value: '129,90' } })
    fireEvent.change(numberInputs()[0], { target: { value: '2' } })
    fireEvent.change(numberInputs()[1], { target: { value: '3' } })
    fireEvent.change(noteInput(), { target: { value: ' one way ' } })
    fireEvent.click(screen.getByRole('button', { name: 'reservations.add' }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Ferry', total_price: 129.9, persons: 2, days: 3, note: 'one way', expense_date: null,
    })
  })

  it('FE-W4AIR-003: falls back to zero price and null optionals', () => {
    const { onAdd } = setup()

    fireEvent.change(nameInput(), { target: { value: 'Ferry' } })
    fireEvent.click(screen.getByRole('button', { name: 'reservations.add' }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Ferry', total_price: 0, persons: null, days: null, note: null, expense_date: null,
    })
  })

  it('FE-W4AIR-004: ignores a whitespace-only name', () => {
    const { onAdd } = setup()

    fireEvent.change(nameInput(), { target: { value: '   ' } })
    fireEvent.keyDown(nameInput(), { key: 'Enter' })

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('FE-W4AIR-005: Enter in any field submits the row', () => {
    const { onAdd } = setup()
    fireEvent.change(nameInput(), { target: { value: 'Ferry' } })

    fireEvent.keyDown(priceInput(), { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('FE-W4AIR-006: a non-Enter key does not submit', () => {
    const { onAdd } = setup()
    fireEvent.change(nameInput(), { target: { value: 'Ferry' } })

    fireEvent.keyDown(nameInput(), { key: 'a' })

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('FE-W4AIR-007: clears the row and refocuses the name field after adding', () => {
    setup()
    fireEvent.change(nameInput(), { target: { value: 'Ferry' } })
    fireEvent.change(priceInput(), { target: { value: '12' } })

    fireEvent.click(screen.getByRole('button', { name: 'reservations.add' }))

    expect(nameInput()).toHaveValue('')
    expect(priceInput()).toHaveValue('')
    vi.advanceTimersByTime(60)
    expect(nameInput()).toHaveFocus()
  })

  it('FE-W4AIR-008: pasting a formatted amount normalizes the separators', () => {
    setup()

    fireEvent.paste(priceInput(), { clipboardData: { getData: () => '1.234,56 EUR' } })
    expect(priceInput()).toHaveValue('1234.56')

    fireEvent.paste(priceInput(), { clipboardData: { getData: () => '$2,345.67' } })
    expect(priceInput()).toHaveValue('2345.67')
  })

  it('FE-W4AIR-009: pasting a separator-free amount keeps the digits', () => {
    setup()

    fireEvent.paste(priceInput(), { clipboardData: { getData: () => 'EUR 4200' } })

    expect(priceInput()).toHaveValue('4200')
  })
})
