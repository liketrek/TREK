// FE-W4TDR-001 to FE-W4TDR-020
import type { ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import type { TodoItem } from '../../types'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import TodoRow from './TodoRow'
import type { Member } from './todoListModel'

const MEMBERS: Member[] = [
  { id: 1, username: 'ada', avatar: 'ada.png' },
  { id: 2, username: 'bob', avatar: null, is_guest: true },
]

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 10, trip_id: 1, name: 'Book ferry', checked: 0, priority: 0,
    description: null, due_date: null, category: null, assigned_user_id: null,
    ...overrides,
  } as unknown as TodoItem
}

function setup(item: TodoItem, overrides: Partial<ComponentProps<typeof TodoRow>> = {}) {
  const onSelect = vi.fn()
  const onToggle = vi.fn()
  const utils = render(
    <TodoRow
      item={item}
      members={MEMBERS}
      categories={['Docs', 'Gear']}
      today="2026-06-15"
      isSelected={false}
      canEdit
      formatDate={(d: string) => `on ${d}`}
      onSelect={onSelect}
      onToggle={onToggle}
      {...overrides}
    />,
  )
  return { onSelect, onToggle, ...utils }
}

const dragHandlers = () => ({
  isDragging: false,
  isOver: false,
  onStart: vi.fn(),
  onOver: vi.fn(),
  onEnd: vi.fn(),
  onDrop: vi.fn(),
})

describe('TodoRow', () => {
  it('FE-W4TDR-001: renders the task name without any badges', () => {
    const { container } = setup(todo())

    expect(screen.getByText('Book ferry')).toBeInTheDocument()
    expect(container.querySelectorAll('span')).toHaveLength(0)
  })

  it('FE-W4TDR-002: selecting an unselected row reports its id', () => {
    const { onSelect, container } = setup(todo())

    fireEvent.click(container.firstElementChild!)

    expect(onSelect).toHaveBeenCalledWith(10)
  })

  it('FE-W4TDR-003: clicking the selected row deselects it', () => {
    const { onSelect, container } = setup(todo(), { isSelected: true })

    fireEvent.click(container.firstElementChild!)

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('FE-W4TDR-004: the checkbox toggles the task without selecting the row', () => {
    const { onToggle, onSelect, container } = setup(todo())

    fireEvent.click(container.querySelector('button')!)

    expect(onToggle).toHaveBeenCalledWith(10, true)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('FE-W4TDR-005: a done task strikes through and unchecks on click', () => {
    const { onToggle, container } = setup(todo({ checked: 1 } as Partial<TodoItem>))

    expect(screen.getByText('Book ferry')).toHaveStyle({ textDecoration: 'line-through' })
    fireEvent.click(container.querySelector('button')!)
    expect(onToggle).toHaveBeenCalledWith(10, false)
  })

  it('FE-W4TDR-006: a read-only row swallows the toggle', () => {
    const { onToggle, container } = setup(todo(), { canEdit: false })

    fireEvent.click(container.querySelector('button')!)

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('FE-W4TDR-007: renders the description preview', () => {
    setup(todo({ description: 'Ferry to Vestmannaeyjar' } as Partial<TodoItem>))

    expect(screen.getByText('Ferry to Vestmannaeyjar')).toBeInTheDocument()
  })

  it('FE-W4TDR-008: renders the priority badge', () => {
    setup(todo({ priority: 2 } as Partial<TodoItem>))

    expect(screen.getByText('P2')).toBeInTheDocument()
  })

  it('FE-W4TDR-009: ignores a priority outside the configured range', () => {
    setup(todo({ priority: 9 } as Partial<TodoItem>))

    expect(screen.queryByText(/^P\d$/)).toBeNull()
  })

  it('FE-W4TDR-010: formats the due date through the caller formatter', () => {
    setup(todo({ due_date: '2026-06-20' } as Partial<TodoItem>))

    expect(screen.getByText('on 2026-06-20')).toBeInTheDocument()
  })

  it('FE-W4TDR-011: highlights an overdue date in red', () => {
    setup(todo({ due_date: '2026-06-01' } as Partial<TodoItem>))

    expect(screen.getByText('on 2026-06-01')).toHaveStyle({ color: 'rgb(239, 68, 68)' })
  })

  it('FE-W4TDR-012: does not treat a past date on a done task as overdue', () => {
    setup(todo({ due_date: '2026-06-01', checked: 1 } as Partial<TodoItem>))

    expect(screen.getByText('on 2026-06-01')).not.toHaveStyle({ color: 'rgb(239, 68, 68)' })
  })

  it('FE-W4TDR-013: renders the category chip with its palette dot', () => {
    const { container } = setup(todo({ category: 'Gear' } as Partial<TodoItem>))

    expect(screen.getByText('Gear')).toBeInTheDocument()
    expect(container.innerHTML).toContain('rgb(168, 85, 247)')
  })

  it('FE-W4TDR-014: renders the assignee avatar for a member with a picture', () => {
    const { container } = setup(todo({ assigned_user_id: 1 } as Partial<TodoItem>))

    expect(screen.getByText('ada')).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/ada.png')
  })

  it('FE-W4TDR-015: falls back to an initial and flags a guest assignee', () => {
    const { container } = setup(todo({ assigned_user_id: 2 } as Partial<TodoItem>))

    expect(screen.getByText('B')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.lucide-user-round')).not.toBeNull()
  })

  it('FE-W4TDR-016: the drag handle starts and ends a reorder', () => {
    const drag = dragHandlers()
    const { container } = setup(todo(), { drag })
    const handle = container.querySelector('[draggable="true"]') as HTMLElement

    fireEvent.dragStart(handle, { dataTransfer: { effectAllowed: '' } })
    expect(drag.onStart).toHaveBeenCalledWith(10)

    fireEvent.dragEnd(handle)
    expect(drag.onEnd).toHaveBeenCalled()
  })

  it('FE-W4TDR-017: dragging over the row reports it and leaving clears the target', () => {
    const drag = dragHandlers()
    const { container } = setup(todo(), { drag })
    const row = container.firstElementChild as HTMLElement

    fireEvent.dragOver(row, { dataTransfer: { dropEffect: '' } })
    expect(drag.onOver).toHaveBeenCalledWith(10)

    fireEvent.dragLeave(row, { relatedTarget: document.body })
    expect(drag.onOver).toHaveBeenLastCalledWith(-1)
  })

  it('FE-W4TDR-018: dropping on the row reports the target id', () => {
    const drag = dragHandlers()
    const { container } = setup(todo(), { drag })

    fireEvent.drop(container.firstElementChild!)

    expect(drag.onDrop).toHaveBeenCalledWith(10)
  })

  it('FE-W4TDR-019: hides the drag handle when the user cannot edit', () => {
    const { container } = setup(todo(), { drag: dragHandlers(), canEdit: false })

    expect(container.querySelector('[draggable="true"]')).toBeNull()
  })

  it('FE-W4TDR-020: dims the dragged row and marks the drop target', () => {
    const { container, rerender } = setup(todo(), { drag: { ...dragHandlers(), isDragging: true } })
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe('0.4')

    rerender(
      <TodoRow
        item={todo()} members={MEMBERS} categories={[]} today="2026-06-15" isSelected={false} canEdit
        formatDate={(d: string) => d} onSelect={() => {}} onToggle={() => {}}
        drag={{ ...dragHandlers(), isOver: true }}
      />,
    )
    expect((container.firstElementChild as HTMLElement).style.boxShadow).toBe('inset 3px 0 0 0 var(--accent)')
  })
})
