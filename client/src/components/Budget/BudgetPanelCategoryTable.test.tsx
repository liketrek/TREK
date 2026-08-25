// FE-W4BCT-001 to FE-W4BCT-053
import type { CSSProperties } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BudgetItem } from '../../types'
import { render, screen, fireEvent, createEvent, within } from '../../../tests/helpers/render'
import BudgetCategoryTable from './BudgetPanelCategoryTable'
import type { TripMember } from './BudgetPanelMemberChips'

const contribFor = vi.fn((_id: number) => [] as unknown[])

vi.mock('../Plugins/PluginContributions', () => ({
  usePluginViewContributions: () => contribFor,
  PluginCardFooter: ({ items }: { items: unknown[] }) => <div data-testid="plugin-footer">{items.length}</div>,
}))

const TRIP_MEMBERS: TripMember[] = [
  { id: 1, username: 'ada', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
]

function budgetItem(overrides: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id: 1, trip_id: 7, category: 'Food', name: 'Ferry', total_price: 100,
    persons: 2, days: 5, note: null, expense_date: null, reservation_id: null, members: [],
    ...overrides,
  } as unknown as BudgetItem
}

type Props = Parameters<typeof BudgetCategoryTable>[0]

function setup(overrides: Partial<Props> = {}, items: BudgetItem[] = [budgetItem()]) {
  const spies = {
    setEditingCat: vi.fn(),
    setDragCat: vi.fn(),
    setDragOverCat: vi.fn(),
    setDragItem: vi.fn(),
    setDragOverItem: vi.fn(),
    setDragItemCat: vi.fn(),
    reorderBudgetCategories: vi.fn(async () => {}),
    reorderBudgetItems: vi.fn(async () => {}),
    handleRenameCategory: vi.fn(async () => {}),
    handleDeleteCategory: vi.fn(async () => {}),
    handleDeleteItem: vi.fn(async () => {}),
    handleUpdateField: vi.fn(async () => {}),
    handleAddItem: vi.fn(async () => {}),
    setBudgetItemMembers: vi.fn(async () => ({ members: [], item: {} })),
    toggleBudgetMemberPaid: vi.fn(async () => {}),
  }
  const props = {
    cat: 'Food',
    grouped: new Map([['Food', items]]),
    categoryColor: () => '#ef4444',
    canEdit: true,
    editingCat: null,
    dragCat: null,
    dragOverCat: null,
    dragItem: null,
    dragOverItem: null,
    dragItemCat: null,
    categoryNames: ['Transport', 'Food', 'Hotels'],
    tripId: 7,
    currency: 'EUR',
    locale: 'en-US',
    t: (key: string) => key,
    fmt: (v: number | null | undefined, cur: string) => `${v ?? '-'} ${cur}`,
    hasMultipleMembers: false,
    tripMembers: TRIP_MEMBERS,
    th: {} as CSSProperties,
    td: {} as CSSProperties,
    ...spies,
    ...overrides,
  } as unknown as Props

  const utils = render(<BudgetCategoryTable {...props} />)
  return { ...spies, ...utils }
}

/** dragleave carrying a relatedTarget — jsdom lacks DragEvent, so fireEvent drops it. */
function dragLeaveInto(target: Element, relatedTarget: Element) {
  const event = createEvent.dragLeave(target)
  Object.defineProperty(event, 'relatedTarget', { value: relatedTarget })
  fireEvent(target, event)
}

beforeEach(() => {
  contribFor.mockReset()
  contribFor.mockReturnValue([])
})

describe('BudgetCategoryTable — header', () => {
  it('FE-W4BCT-001: shows the category name and the summed subtotal', () => {
    setup({}, [budgetItem(), budgetItem({ id: 2, total_price: 50 })])

    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('150 EUR')).toBeInTheDocument()
  })

  it('FE-W4BCT-002: treats a priceless item as zero in the subtotal', () => {
    const { container } = setup({}, [budgetItem({ total_price: null } as Partial<BudgetItem>)])

    // The subtotal sits in the black category header, before the table.
    expect(container.querySelectorAll('span')[1]).toHaveTextContent('0 EUR')
  })

  it('FE-W4BCT-003: renders an empty category with only the add row', () => {
    setup({ grouped: new Map() } as Partial<Props>)

    expect(screen.getByPlaceholderText('budget.newEntry')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Ferry')).toBeNull()
  })

  it('FE-W4BCT-004: the pencil starts renaming the category', () => {
    const { setEditingCat } = setup()

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(setEditingCat).toHaveBeenCalledWith({ name: 'Food', value: 'Food' })
  })

  it('FE-W4BCT-005: Enter in the rename input commits and closes the editor', () => {
    const { handleRenameCategory, setEditingCat } = setup({ editingCat: { name: 'Food', value: 'Groceries' } })
    const input = screen.getByDisplayValue('Groceries')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleRenameCategory).toHaveBeenCalledWith('Food', 'Groceries')
    expect(setEditingCat).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-006: blurring the rename input commits it', () => {
    const { handleRenameCategory } = setup({ editingCat: { name: 'Food', value: 'Groceries' } })

    fireEvent.blur(screen.getByDisplayValue('Groceries'))

    expect(handleRenameCategory).toHaveBeenCalledWith('Food', 'Groceries')
  })

  it('FE-W4BCT-007: Escape abandons the rename', () => {
    const { handleRenameCategory, setEditingCat } = setup({ editingCat: { name: 'Food', value: 'Groceries' } })

    fireEvent.keyDown(screen.getByDisplayValue('Groceries'), { key: 'Escape' })

    expect(handleRenameCategory).not.toHaveBeenCalled()
    expect(setEditingCat).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-008: typing updates the pending rename value', () => {
    const { setEditingCat } = setup({ editingCat: { name: 'Food', value: 'Food' } })

    fireEvent.change(screen.getByDisplayValue('Food'), { target: { value: 'Fuel' } })

    expect(setEditingCat).toHaveBeenCalledWith({ name: 'Food', value: 'Fuel' })
  })

  it('FE-W4BCT-009: the trash button deletes the category', () => {
    const { handleDeleteCategory } = setup()

    fireEvent.click(screen.getByTitle('budget.deleteCategory'))

    expect(handleDeleteCategory).toHaveBeenCalledWith('Food')
  })

  it('FE-W4BCT-010: a read-only table hides every editing affordance', () => {
    setup({ canEdit: false })

    expect(screen.queryByTitle('budget.deleteCategory')).toBeNull()
    expect(screen.queryByTitle('common.delete')).toBeNull()
    expect(screen.queryByPlaceholderText('budget.newEntry')).toBeNull()
    expect(document.querySelectorAll('[draggable="true"]')).toHaveLength(0)
  })
})

describe('BudgetCategoryTable — rows', () => {
  it('FE-W4BCT-011: derives the per-person, per-day and per-person-day figures', () => {
    setup({}, [budgetItem({ total_price: 100, persons: 2, days: 5 })])

    expect(screen.getByText('50 EUR')).toBeInTheDocument()
    expect(screen.getByText('20 EUR')).toBeInTheDocument()
    expect(screen.getByText('10 EUR')).toBeInTheDocument()
  })

  it('FE-W4BCT-012: blanks the per-person columns for a custom member split', () => {
    setup({}, [budgetItem({
      total_price: 100, persons: 2, days: 5,
      members: [{ user_id: 1, username: 'ada', amount: 70 }, { user_id: 2, username: 'bob', amount: 30 }],
    } as unknown as Partial<BudgetItem>)])

    // per-day still resolves; per-person and per-person-day are dashed out.
    expect(screen.getByText('20 EUR')).toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2)
  })

  it('FE-W4BCT-013: deleting a row reports its id', () => {
    const { handleDeleteItem } = setup()

    fireEvent.click(screen.getByTitle('common.delete'))

    expect(handleDeleteItem).toHaveBeenCalledWith(1)
  })

  it('FE-W4BCT-014: editing the name cell saves through handleUpdateField', () => {
    const { handleUpdateField } = setup()

    fireEvent.click(screen.getByText('Ferry'))
    const input = screen.getByDisplayValue('Ferry')
    fireEvent.change(input, { target: { value: 'Bus' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'name', 'Bus')
  })

  it('FE-W4BCT-015: a reservation-linked row locks the name cell', () => {
    setup({}, [budgetItem({ reservation_id: 42 } as Partial<BudgetItem>)])

    fireEvent.click(screen.getByText('Ferry'))

    expect(screen.queryByDisplayValue('Ferry')).toBeNull()
    expect(screen.getByText('Ferry')).not.toHaveAttribute('title')
  })

  it('FE-W4BCT-016: the persons cell coerces the entry to an integer', () => {
    const { handleUpdateField } = setup()

    fireEvent.click(screen.getByText('2'))
    const input = screen.getByDisplayValue('2')
    fireEvent.change(input, { target: { value: '4.7' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'persons', 4)
  })

  it('FE-W4BCT-017: clearing the days cell stores null', () => {
    const { handleUpdateField } = setup()

    fireEvent.click(screen.getByText('5'))
    const input = screen.getByDisplayValue('5')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'days', null)
  })

  it('FE-W4BCT-018: swaps the persons cell for member chips on a multi-member trip', () => {
    setup({ hasMultipleMembers: true }, [budgetItem({ members: [{ user_id: 1, username: 'ada', paid: 0 }] } as unknown as Partial<BudgetItem>)])

    // One chip in the persons column and one in the mobile stack under the name.
    expect(screen.getAllByText('A')).toHaveLength(2)
  })

  it('FE-W4BCT-019: shows the raw expense date instead of a picker when read-only', () => {
    setup({ canEdit: false }, [budgetItem({ expense_date: '2026-06-15' } as Partial<BudgetItem>)])

    expect(screen.getByText('2026-06-15')).toBeInTheDocument()
  })

  it('FE-W4BCT-020: falls back to an em dash for a read-only row without a date', () => {
    setup({ canEdit: false })

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('FE-W4BCT-021: appends a plugin footer row when a plugin contributes', () => {
    contribFor.mockReturnValue([{ kind: 'column' }])
    setup()

    expect(screen.getByTestId('plugin-footer')).toHaveTextContent('1')
  })

  it('FE-W4BCT-022: adding an item routes the payload into the category', () => {
    const { handleAddItem } = setup()

    fireEvent.change(screen.getByPlaceholderText('budget.newEntry'), { target: { value: 'Taxi' } })
    fireEvent.click(screen.getByTitle('reservations.add'))

    expect(handleAddItem).toHaveBeenCalledWith('Food', expect.objectContaining({ name: 'Taxi' }))
  })
})

describe('BudgetCategoryTable — drag and drop', () => {
  it('FE-W4BCT-023: the category handle starts and ends a category drag', () => {
    const { setDragCat, setDragOverCat, container } = setup()
    const handle = container.querySelectorAll('[draggable="true"]')[0] as HTMLElement

    fireEvent.dragStart(handle, { dataTransfer: { effectAllowed: '', setData: vi.fn() } })
    expect(setDragCat).toHaveBeenCalledWith('Food')

    fireEvent.dragEnd(handle)
    expect(setDragCat).toHaveBeenLastCalledWith(null)
    expect(setDragOverCat).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-024: dragging another category over this one marks the drop line', () => {
    const { setDragOverCat, container } = setup({ dragCat: 'Transport' })

    fireEvent.dragOver(container.firstElementChild!, { dataTransfer: { dropEffect: '' } })

    expect(setDragOverCat).toHaveBeenCalledWith('Food')
  })

  it('FE-W4BCT-025: ignores a drag-over from the same category or from an item', () => {
    const same = setup({ dragCat: 'Food' })
    fireEvent.dragOver(same.container.firstElementChild!, { dataTransfer: { dropEffect: '' } })
    expect(same.setDragOverCat).not.toHaveBeenCalled()

    const item = setup({ dragCat: 'Transport', dragItem: 5 })
    fireEvent.dragOver(item.container.firstElementChild!, { dataTransfer: { dropEffect: '' } })
    expect(item.setDragOverCat).not.toHaveBeenCalled()
  })

  it('FE-W4BCT-026: dropping a category reorders the list around this one', () => {
    const { reorderBudgetCategories, setDragCat, container } = setup({ dragCat: 'Hotels' })

    fireEvent.drop(container.firstElementChild!)

    expect(reorderBudgetCategories).toHaveBeenCalledWith(7, ['Transport', 'Hotels', 'Food'])
    expect(setDragCat).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-027: dropping a category on itself only clears the drag state', () => {
    const { reorderBudgetCategories, setDragOverCat, container } = setup({ dragCat: 'Food' })

    fireEvent.drop(container.firstElementChild!)

    expect(reorderBudgetCategories).not.toHaveBeenCalled()
    expect(setDragOverCat).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-028: leaving the category clears the drop marker', () => {
    const { setDragOverCat, container } = setup({ dragCat: 'Transport' })

    fireEvent.dragLeave(container.firstElementChild!, { relatedTarget: document.body })

    expect(setDragOverCat).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-029: dragging a row over a sibling marks it as the target', () => {
    const rows = [budgetItem(), budgetItem({ id: 2, name: 'Bus' })]
    const { setDragOverItem, container } = setup({ dragItem: 2, dragItemCat: 'Food' }, rows)

    fireEvent.dragOver(container.querySelectorAll('tbody tr')[0], { dataTransfer: { dropEffect: '' } })

    expect(setDragOverItem).toHaveBeenCalledWith(1)
  })

  it('FE-W4BCT-030: dropping a row reorders the ids inside the category', () => {
    const rows = [budgetItem(), budgetItem({ id: 2, name: 'Bus' }), budgetItem({ id: 3, name: 'Taxi' })]
    const { reorderBudgetItems, setDragItem, container } = setup({ dragItem: 3, dragItemCat: 'Food' }, rows)

    fireEvent.drop(container.querySelectorAll('tbody tr')[0])

    expect(reorderBudgetItems).toHaveBeenCalledWith(7, [3, 1, 2])
    expect(setDragItem).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-031: a row from another category is not reordered here', () => {
    const { reorderBudgetItems, container } = setup({ dragItem: 9, dragItemCat: 'Transport' })

    fireEvent.drop(container.querySelectorAll('tbody tr')[0])

    expect(reorderBudgetItems).not.toHaveBeenCalled()
  })

  it('FE-W4BCT-032: the row handle starts and ends an item drag', () => {
    const { setDragItem, setDragItemCat, container } = setup()
    const handle = container.querySelectorAll('[draggable="true"]')[1] as HTMLElement

    fireEvent.dragStart(handle, { dataTransfer: { effectAllowed: '' } })
    expect(setDragItem).toHaveBeenCalledWith(1)
    expect(setDragItemCat).toHaveBeenCalledWith('Food')

    fireEvent.dragEnd(handle)
    expect(setDragItem).toHaveBeenLastCalledWith(null)
    expect(setDragItemCat).toHaveBeenLastCalledWith(null)
  })

  it('FE-W4BCT-033: leaving a row clears the item drop marker', () => {
    const { setDragOverItem, container } = setup()

    fireEvent.dragLeave(container.querySelectorAll('tbody tr')[0], { relatedTarget: document.body })

    expect(setDragOverItem).toHaveBeenCalledWith(null)
  })

  it('FE-W4BCT-034: dims the dragged category and marks the drop line', () => {
    const dragged = setup({ dragCat: 'Food' })
    expect((dragged.container.firstElementChild as HTMLElement).style.opacity).toBe('0.4')

    const over = setup({ dragCat: 'Transport', dragOverCat: 'Food' })
    const marker = within(over.container.firstElementChild as HTMLElement).getAllByRole('generic')
    expect(marker.length).toBeGreaterThan(0)
    expect((over.container.firstElementChild as HTMLElement).firstElementChild).toHaveStyle({ height: '4px' })
  })

  it('FE-W4BCT-035: dims the dragged row and outlines the drop target', () => {
    const dragged = setup({ dragItem: 1 })
    expect((dragged.container.querySelector('tbody tr') as HTMLElement).style.opacity).toBe('0.4')

    const over = setup({ dragOverItem: 1 })
    expect((over.container.querySelector('tbody tr') as HTMLElement).style.boxShadow).toBe('inset 4px 0 0 0 var(--accent)')
  })

  it('FE-W4BCT-036: the table body accepts a category drop only while one is being dragged', () => {
    const dragging = setup({ dragCat: 'Transport' })
    const activeTransfer = { dropEffect: '' }
    fireEvent.dragOver(dragging.container.querySelector('table')!.parentElement!, { dataTransfer: activeTransfer })
    expect(activeTransfer.dropEffect).toBe('move')

    const idle = setup()
    const idleTransfer = { dropEffect: '' }
    fireEvent.dragOver(idle.container.querySelector('table')!.parentElement!, { dataTransfer: idleTransfer })
    expect(idleTransfer.dropEffect).toBe('')
  })

  it('FE-W4BCT-037: a row accepts a dragged category without becoming an item drop target', () => {
    const { setDragOverItem, container } = setup({ dragCat: 'Transport' })
    const transfer = { dropEffect: '' }

    fireEvent.dragOver(container.querySelectorAll('tbody tr')[0], { dataTransfer: transfer })

    expect(transfer.dropEffect).toBe('move')
    expect(setDragOverItem).not.toHaveBeenCalled()
  })

  it('FE-W4BCT-038: moving between a row and its own cells keeps the drop marker', () => {
    const { setDragOverItem, setDragOverCat, container } = setup({ dragCat: 'Transport', dragItem: 2, dragItemCat: 'Food' })
    const row = container.querySelectorAll('tbody tr')[0]

    // jsdom has no DragEvent, so relatedTarget has to be attached by hand.
    dragLeaveInto(row, row.querySelector('td')!)
    dragLeaveInto(container.firstElementChild as HTMLElement, container.querySelector('table')!)

    expect(setDragOverItem).not.toHaveBeenCalled()
    expect(setDragOverCat).not.toHaveBeenCalled()
  })
})

describe('BudgetCategoryTable — hover affordances', () => {
  it('FE-W4BCT-039: the rename pencil brightens while hovered', () => {
    setup()
    const pencil = screen.getAllByRole('button')[0]

    fireEvent.mouseEnter(pencil)
    expect(pencil.style.color).toBe('rgb(255, 255, 255)')

    fireEvent.mouseLeave(pencil)
    expect(pencil.style.color).toBe('rgba(255, 255, 255, 0.4)')
  })

  it('FE-W4BCT-040: the delete-category button fades in while hovered', () => {
    setup()
    const trash = screen.getByTitle('budget.deleteCategory')

    fireEvent.mouseEnter(trash)
    expect(trash.style.opacity).toBe('1')

    fireEvent.mouseLeave(trash)
    expect(trash.style.opacity).toBe('0.6')
  })

  it('FE-W4BCT-041: a row highlights while hovered', () => {
    const { container } = setup()
    const row = container.querySelector('tbody tr') as HTMLElement

    fireEvent.mouseEnter(row)
    expect(row.style.background).toBe('var(--bg-hover)')

    fireEvent.mouseLeave(row)
    expect(row.style.background).toBe('transparent')
  })

  it('FE-W4BCT-042: the delete-row button turns red while hovered', () => {
    setup()
    const trash = screen.getByTitle('common.delete')

    fireEvent.mouseEnter(trash)
    expect(trash.style.color).toBe('rgb(239, 68, 68)')

    fireEvent.mouseLeave(trash)
    expect(trash.style.color).toBe('rgb(209, 213, 219)')
  })
})

describe('BudgetCategoryTable — remaining cells', () => {
  it('FE-W4BCT-043: editing the total saves the parsed number', () => {
    const { handleUpdateField } = setup()

    fireEvent.click(screen.getByText('100.00'))
    const input = screen.getByDisplayValue('100')
    fireEvent.change(input, { target: { value: '120,50' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'total_price', 120.5)
  })

  it('FE-W4BCT-044: a zero-decimal currency drops the decimals from the amount placeholder', () => {
    setup({ currency: 'JPY' }, [budgetItem({ total_price: null } as Partial<BudgetItem>)])

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('0,00')).toBeNull()
  })

  it('FE-W4BCT-045: editing the note saves it', () => {
    const { handleUpdateField } = setup({}, [budgetItem({ note: 'Return trip' } as Partial<BudgetItem>)])

    fireEvent.click(screen.getByText('Return trip'))
    const input = screen.getByDisplayValue('Return trip')
    fireEvent.change(input, { target: { value: 'One way' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'note', 'One way')
  })

  it('FE-W4BCT-046: picking a day from the date cell stores the ISO date', () => {
    const { handleUpdateField, container } = setup({}, [budgetItem({ expense_date: '2026-06-15' } as Partial<BudgetItem>)])
    const dateCell = container.querySelectorAll('tbody tr')[0].querySelectorAll('td')[7]

    fireEvent.click(dateCell.querySelector('button')!)
    const day20 = screen.getAllByRole('button').find(b => b.textContent?.trim() === '20')
    fireEvent.click(day20!)

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'expense_date', '2026-06-20')
  })

  it('FE-W4BCT-047: clearing the date cell stores null', () => {
    const { handleUpdateField, container } = setup({}, [budgetItem({ expense_date: '2026-06-15' } as Partial<BudgetItem>)])
    const dateCell = container.querySelectorAll('tbody tr')[0].querySelectorAll('td')[7]

    fireEvent.click(dateCell.querySelector('button')!)
    fireEvent.click(screen.getByLabelText('Clear date'))

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'expense_date', null)
  })

  it('FE-W4BCT-048: a non-numeric persons entry stores null', () => {
    const { handleUpdateField } = setup()

    fireEvent.click(screen.getByText('2'))
    const input = screen.getByDisplayValue('2')
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'persons', null)
  })

  it('FE-W4BCT-049: zero days is stored as null rather than 0', () => {
    const { handleUpdateField } = setup()

    fireEvent.click(screen.getByText('5'))
    const input = screen.getByDisplayValue('5')
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleUpdateField).toHaveBeenCalledWith(1, 'days', null)
  })

  it('FE-W4BCT-050: an item without persons, days or members dashes out every derived column', () => {
    const { container } = setup({}, [budgetItem({ persons: null, days: null, members: undefined } as unknown as Partial<BudgetItem>)])
    const cells = container.querySelectorAll('tbody tr')[0].querySelectorAll('td')

    // per person, per day, per person-day — none of them is derivable.
    expect(cells[4]).toHaveTextContent('-')
    expect(cells[5]).toHaveTextContent('-')
    expect(cells[6]).toHaveTextContent('-')
    expect(screen.queryByText('100.00 EUR')).toBeNull()
  })
})

describe('BudgetCategoryTable — member chips', () => {
  const withMembers = () => setup(
    { hasMultipleMembers: true },
    [budgetItem({ members: [{ user_id: 1, username: 'ada', paid: 0 }] } as unknown as Partial<BudgetItem>)],
  )

  it('FE-W4BCT-051: tapping a chip toggles that member’s paid flag', () => {
    const { toggleBudgetMemberPaid } = withMembers()

    // The chip is rendered twice: the mobile stack under the name and the persons column.
    const chips = screen.getAllByText('A')
    fireEvent.click(chips[0])
    fireEvent.click(chips[1])

    expect(toggleBudgetMemberPaid).toHaveBeenCalledTimes(2)
    expect(toggleBudgetMemberPaid).toHaveBeenCalledWith(7, 1, 1, true)
  })

  it('FE-W4BCT-052: picking a member from either chip dropdown sets the item members', () => {
    const { setBudgetItemMembers, container } = withMembers()
    // The mobile stack under the name and the persons column both carry an editor.
    // Assigned chips are buttons of their own, so the editors are the two that
    // carry the picker icon.
    const editors = Array.from(container.querySelectorAll('td button'))
      .filter(b => b.querySelector('.lucide-pencil, .lucide-users'))

    fireEvent.click(editors[0])
    fireEvent.click(screen.getByText('bob'))
    fireEvent.click(editors[0]) // picking an option leaves the dropdown open
    fireEvent.click(editors[1])
    fireEvent.click(screen.getByText('bob'))

    expect(setBudgetItemMembers).toHaveBeenCalledTimes(2)
    expect(setBudgetItemMembers).toHaveBeenCalledWith(7, 1, [1, 2])
  })

  it('FE-W4BCT-053: read-only member chips expose no editing controls', () => {
    setup(
      { hasMultipleMembers: true, canEdit: false },
      [budgetItem({ members: [{ user_id: 1, username: 'ada', paid: 1 }] } as unknown as Partial<BudgetItem>)],
    )

    expect(screen.getAllByText('A')).toHaveLength(2)
    expect(document.querySelectorAll('table button')).toHaveLength(0)
  })
})
