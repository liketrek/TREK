// FE-COSTSTABLE-001 to FE-COSTSTABLE-016
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildBudgetItem } from '../../../tests/helpers/factories'
import type { BudgetItem } from '../../types'
import CostsTable, { CostsTableSummary, type CostsTableProps } from './CostsTable'

const fmt = (v: number) => `${v.toFixed(2)} EUR`

function item(overrides: Partial<BudgetItem>): BudgetItem {
  return { ...buildBudgetItem(), persons: null, days: null, currency: 'EUR', payers: [], ...overrides } as BudgetItem
}

function setup(items: BudgetItem[], overrides: Partial<CostsTableProps> = {}) {
  const props: CostsTableProps = {
    items,
    base: 'EUR',
    canEdit: true,
    baseTotal: e => e.total_price || 0,
    toBase: amount => amount,
    currencyOf: e => e.currency || 'EUR',
    fmt,
    personName: id => (id === 1 ? 'ada' : 'bob'),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onAdd: vi.fn().mockResolvedValue(null),
    onOpen: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<CostsTable {...props} />)
  return props
}

beforeEach(() => resetAllStores())

describe('CostsTable', () => {
  it('FE-COSTSTABLE-001: groups expenses under their category with a subtotal and a trip total', () => {
    setup([
      item({ id: 1, name: 'Hotel', category: 'accommodation', total_price: 120 }),
      item({ id: 2, name: 'Ramen', category: 'food', total_price: 30 }),
      item({ id: 3, name: 'Snacks', category: 'food', total_price: 10 }),
    ])
    const food = screen.getByRole('button', { name: /Food/ })
    expect(food).toHaveAttribute('aria-expanded', 'true')
    expect(within(food.closest('tr')!).getByText('40.00 EUR')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: /Accommodation/ }).closest('tr')!).getByText('120.00 EUR')).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Total/ }).closest('tr')).toHaveTextContent('160.00 EUR')
  })

  it('FE-COSTSTABLE-002: works out per person, per day and per person per day', () => {
    setup([item({ id: 1, name: 'Ferry', category: 'transport', total_price: 80, persons: 2, days: 4 })])
    const row = screen.getByRole('button', { name: 'Name: Ferry' }).closest('tr')!
    expect(row).toHaveTextContent('40.00')
    expect(row).toHaveTextContent('20.00')
    expect(row).toHaveTextContent('10.00')
  })

  it('FE-COSTSTABLE-003: an uneven split leaves the per-person columns empty', () => {
    setup([item({
      id: 1, name: 'Dinner', category: 'food', total_price: 90, persons: 2, days: 3,
      members: [{ user_id: 1, paid: 0, username: 'ada', amount: 60 }, { user_id: 2, paid: 0, username: 'bob', amount: 30 }],
    } as Partial<BudgetItem>)])
    const cells = screen.getByRole('button', { name: 'Name: Dinner' }).closest('tr')!.querySelectorAll('td')
    expect(cells[5].textContent).toBe('')
    expect(cells[6].textContent).toBe('30.00')
    expect(cells[7].textContent).toBe('')
  })

  it('FE-COSTSTABLE-004: a name edits in place, Enter keeps it and Escape leaves it', async () => {
    const user = userEvent.setup()
    const props = setup([item({ id: 7, name: 'Taxi', category: 'transport', total_price: 15 })])
    await user.click(screen.getByRole('button', { name: 'Name: Taxi' }))
    const field = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(field)
    await user.type(field, 'Airport taxi{Enter}')
    expect(props.onUpdate).toHaveBeenCalledWith(7, { name: 'Airport taxi' })

    await user.click(screen.getByRole('button', { name: 'Name: Taxi' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'x{Escape}')
    expect(props.onUpdate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument()
  })

  it('FE-COSTSTABLE-005: an empty name is not saved', async () => {
    const user = userEvent.setup()
    const props = setup([item({ id: 7, name: 'Taxi', category: 'transport' })])
    await user.click(screen.getByRole('button', { name: 'Name: Taxi' }))
    await user.clear(screen.getByRole('textbox', { name: 'Name' }))
    await user.keyboard('{Enter}')
    expect(props.onUpdate).not.toHaveBeenCalled()
  })

  it('FE-COSTSTABLE-006: a total nobody paid edits in place, with a comma as the decimal mark', async () => {
    const user = userEvent.setup()
    const props = setup([item({ id: 3, name: 'Museum', category: 'activities', total_price: 12 })])
    await user.click(screen.getByRole('button', { name: 'Total: 12.00 EUR' }))
    const field = screen.getByRole('textbox', { name: 'Total' })
    await user.clear(field)
    await user.type(field, '14,50')
    fireEvent.blur(field)
    expect(props.onUpdate).toHaveBeenCalledWith(3, { total_price: 14.5 })
  })

  it('FE-COSTSTABLE-007: a total someone paid is locked and opens the expense instead', async () => {
    const user = userEvent.setup()
    const paid = item({ id: 4, name: 'Hotel', category: 'accommodation', total_price: 200, payers: [{ user_id: 1, amount: 200 }] } as Partial<BudgetItem>)
    const props = setup([paid])
    const total = screen.getByRole('button', { name: 'Total: 200.00 EUR' })
    fireEvent.mouseEnter(total)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/change the amount in the expense/)
    await user.click(total)
    expect(props.onOpen).toHaveBeenCalledWith(paid)
    expect(screen.queryByRole('textbox', { name: 'Total' })).not.toBeInTheDocument()
  })

  it('FE-COSTSTABLE-008: a total in another currency is locked and shows what was entered', async () => {
    setup([item({ id: 5, name: 'Swiss train', category: 'transport', total_price: 62, currency: 'CHF' })], {
      baseTotal: () => 66.4,
    })
    const total = screen.getByRole('button', { name: 'Total: 66.40 EUR' })
    expect(total).toHaveTextContent('62.00 CHF')
    fireEvent.mouseEnter(total)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Entered in CHF')
  })

  it('FE-COSTSTABLE-009: persons and days fill in from an empty pill and clear again', async () => {
    const user = userEvent.setup()
    const props = setup([item({ id: 6, name: 'Boat', category: 'transport', total_price: 60 })])
    await user.click(screen.getByRole('button', { name: 'Persons' }))
    await user.type(screen.getByRole('textbox', { name: 'Persons' }), '3{Enter}')
    expect(props.onUpdate).toHaveBeenCalledWith(6, { persons: 3 })

    await user.click(screen.getByRole('button', { name: 'Days' }))
    await user.type(screen.getByRole('textbox', { name: 'Days' }), '0{Enter}')
    expect(props.onUpdate).toHaveBeenLastCalledWith(6, { days: null })
  })

  it('FE-COSTSTABLE-010: a row added to a category takes its latest date and opens its name', async () => {
    const user = userEvent.setup()
    const created = item({ id: 99, name: 'New Entry', category: 'food' })
    const onAdd = vi.fn().mockResolvedValue(created)
    render(<CostsTable items={[
      item({ id: 1, name: 'Lunch', category: 'food', expense_date: '2025-06-02' }),
      item({ id: 2, name: 'Dinner', category: 'food', expense_date: '2025-06-04' }),
      created,
    ]} base="EUR" canEdit baseTotal={e => e.total_price || 0} toBase={a => a} currencyOf={() => 'EUR'} fmt={fmt}
      personName={() => ''} onUpdate={vi.fn()} onAdd={onAdd} onOpen={vi.fn()} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(onAdd).toHaveBeenCalledWith('food', '2025-06-04')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('New Entry'))
  })

  it('FE-COSTSTABLE-011: a category folds away and back', async () => {
    const user = userEvent.setup()
    setup([item({ id: 1, name: 'Ramen', category: 'food' })])
    await user.click(screen.getByRole('button', { name: /Food/ }))
    expect(screen.queryByText('Ramen')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Food/ }))
    expect(screen.getByText('Ramen')).toBeInTheDocument()
  })

  it('FE-COSTSTABLE-012: the row menu edits in the dialog and deletes', async () => {
    const user = userEvent.setup()
    const e = item({ id: 8, name: 'Gift', category: 'shopping' })
    const props = setup([e])
    await user.click(screen.getByRole('button', { name: 'More options' }))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    expect(props.onOpen).toHaveBeenCalledWith(e)
    await user.click(screen.getByRole('button', { name: 'More options' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(props.onDelete).toHaveBeenCalledWith(8)
  })

  it('FE-COSTSTABLE-013: without edit rights the table reads only', async () => {
    const user = userEvent.setup()
    const e = item({ id: 9, name: 'Tip', category: 'tips', total_price: 5, expense_date: '2025-06-03' })
    const props = setup([e], { canEdit: false })
    expect(screen.queryByRole('button', { name: /^Name:/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'More options' }))
    await user.click(await screen.findByRole('button', { name: 'Open' }))
    expect(props.onOpen).toHaveBeenCalledWith(e)
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})

describe('CostsTableSummary', () => {
  const summaryItems = [
    item({ id: 1, name: 'Hotel', category: 'accommodation', total_price: 100, expense_date: '2025-06-02', payers: [{ user_id: 1, amount: 100 }] } as Partial<BudgetItem>),
    item({ id: 2, name: 'Ramen', category: 'food', total_price: 30, expense_date: '2025-06-01', payers: [{ user_id: 2, amount: 30 }] } as Partial<BudgetItem>),
    item({ id: 3, name: 'Snacks', category: 'food', total_price: 10 }),
  ]
  const renderSummary = () => render(<CostsTableSummary items={summaryItems} baseTotal={e => e.total_price || 0} toBase={a => a} fmt={fmt} personName={id => (id === 1 ? 'ada' : 'bob')} />)

  it('FE-COSTSTABLE-014: sums up by category, largest first', () => {
    renderSummary()
    const rows = within(screen.getByRole('region', { name: 'Summary' })).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent(/Accommodation.*100\.00 EUR/)
    expect(rows[1]).toHaveTextContent(/Food.*40\.00 EUR/)
  })

  it('FE-COSTSTABLE-015: by day oldest first, the undated last', async () => {
    const user = userEvent.setup()
    renderSummary()
    await user.click(screen.getByRole('button', { name: 'Day' }))
    const rows = within(screen.getByRole('region', { name: 'Summary' })).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('30.00 EUR')
    expect(rows[1]).toHaveTextContent('100.00 EUR')
    expect(rows[2]).toHaveTextContent(/No date.*10\.00 EUR/)
  })

  it('FE-COSTSTABLE-016: by payer with the unpaid on their own line, and paid against open', async () => {
    const user = userEvent.setup()
    renderSummary()
    await user.click(screen.getByRole('button', { name: 'Payer' }))
    const region = screen.getByRole('region', { name: 'Summary' })
    expect(region).toHaveTextContent(/ada.*100\.00 EUR/)
    expect(region).toHaveTextContent(/bob.*30\.00 EUR/)
    expect(region).toHaveTextContent(/No payer yet.*10\.00 EUR/)

    await user.click(screen.getByRole('button', { name: 'Status' }))
    expect(region).toHaveTextContent(/Paid.*130\.00 EUR/)
    expect(region).toHaveTextContent(/Open.*10\.00 EUR/)
  })
})
