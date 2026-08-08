import { beforeEach, describe, expect, it, vi } from 'vitest'
import MTaskSheet from '../../../../src/mobile/screens/trip/tabs/MTaskSheet'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { TodoItem, TripMember } from '../../../../src/types'
import { buildPlanner, buildToast, buildTripActions } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-TASK-001 to FE-MOB-TASK-020

const MEMBERS = [
  { id: 7, username: 'maurice', avatar: null, avatar_url: null },
  { id: 8, username: 'lea', avatar: 'lea.png', avatar_url: null },
] as unknown as TripMember[]

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 42,
    trip_id: 1,
    name: 'Book flights',
    category: 'Admin',
    checked: 0,
    sort_order: 0,
    due_date: '2026-08-01',
    description: 'Direct if possible',
    assigned_user_id: 8,
    priority: 2,
    ...overrides,
  }
}

interface SetupOptions {
  items?: TodoItem[]
  itemId?: number | null
  categories?: string[]
  defaultCategory?: string | null
  open?: boolean
}

function setup({ items = [], itemId = null, categories = ['Admin', 'Gear'], defaultCategory = null, open = true }: SetupOptions = {}) {
  const actions = buildTripActions()
  const toast = buildToast()
  const onClose = vi.fn()
  const planner = buildPlanner({
    todoItems: items,
    tripActions: actions as unknown as TripPlanner['tripActions'],
    toast: toast as unknown as TripPlanner['toast'],
  })
  const view = render(
    <MTaskSheet
      planner={planner}
      open={open}
      itemId={itemId}
      categories={categories}
      members={MEMBERS}
      defaultCategory={defaultCategory}
      onClose={onClose}
    />,
  )
  return { ...view, actions, toast, onClose, planner }
}

describe('MTaskSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-TASK-001: stays unmounted while closed', () => {
    setup({ open: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-TASK-002: opens in create mode with empty fields and no delete action', () => {
    setup()

    expect(screen.getAllByText('todo.newItem').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('todo.namePlaceholder')).toHaveValue('')
    expect(screen.getByPlaceholderText('todo.descriptionPlaceholder')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'todo.detail.create' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'todo.detail.delete' })).not.toBeInTheDocument()
  })

  it('FE-MOB-TASK-003: enables the submit only once a non-blank name is typed', () => {
    setup()
    const submit = screen.getByRole('button', { name: 'todo.detail.create' })

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: '   ' } })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Visa' } })
    expect(submit).toBeEnabled()
  })

  it('FE-MOB-TASK-004: creates a task with the trimmed name and undefined optionals', async () => {
    const { actions, onClose } = setup()

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: '  Visa  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.create' }))

    await waitFor(() => expect(actions.addTodoItem).toHaveBeenCalledWith(1, {
      name: 'Visa',
      description: undefined,
      due_date: undefined,
      category: undefined,
      assigned_user_id: undefined,
      priority: 0,
    }))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-TASK-005: seeds the category from defaultCategory and sends it on create', async () => {
    const { actions } = setup({ defaultCategory: 'Gear' })

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Boots' } })
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.create' }))

    await waitFor(() => expect(actions.addTodoItem).toHaveBeenCalledWith(1, expect.objectContaining({ category: 'Gear' })))
  })

  it('FE-MOB-TASK-006: sends description, priority and assignee picked in the form', async () => {
    const { actions } = setup()

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Visa' } })
    fireEvent.change(screen.getByPlaceholderText('todo.descriptionPlaceholder'), { target: { value: 'Embassy' } })
    fireEvent.click(screen.getByRole('button', { name: /^P1$/ }))
    fireEvent.click(screen.getByRole('button', { name: /lea/ }))
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.create' }))

    await waitFor(() => expect(actions.addTodoItem).toHaveBeenCalledWith(1, expect.objectContaining({
      description: 'Embassy',
      priority: 1,
      assigned_user_id: 8,
    })))
  })

  it('FE-MOB-TASK-007: only submits once while a save is in flight', async () => {
    const { actions } = setup()
    let release = () => {}
    actions.addTodoItem.mockImplementation(() => new Promise<void>(resolve => { release = () => resolve() }))

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Visa' } })
    const submit = screen.getByRole('button', { name: 'todo.detail.create' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(actions.addTodoItem).toHaveBeenCalledTimes(1)
    release()
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it('FE-MOB-TASK-008: toasts and keeps the sheet open when creating fails', async () => {
    const { actions, toast, onClose } = setup()
    actions.addTodoItem.mockRejectedValue(new Error('boom'))

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Visa' } })
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.create' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-TASK-009: prefills every field in edit mode', () => {
    setup({ items: [todo()], itemId: 42 })

    expect(screen.getAllByText('todo.detail.title').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('todo.namePlaceholder')).toHaveValue('Book flights')
    expect(screen.getByPlaceholderText('todo.descriptionPlaceholder')).toHaveValue('Direct if possible')
    expect(screen.getByRole('button', { name: 'todo.detail.save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'todo.detail.delete' })).toBeInTheDocument()
  })

  it('FE-MOB-TASK-010: updates a task and nulls out the cleared optionals', async () => {
    const { actions, onClose } = setup({ items: [todo({ description: null, due_date: null, category: null, assigned_user_id: null, priority: 0 })], itemId: 42 })

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Book trains' } })
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(actions.updateTodoItem).toHaveBeenCalledWith(1, 42, {
      name: 'Book trains',
      description: null,
      due_date: null,
      category: null,
      assigned_user_id: null,
      priority: 0,
    }))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-TASK-011: keeps the stored due date and category when only the name changes', async () => {
    const { actions } = setup({ items: [todo()], itemId: 42 })

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Book trains' } })
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(actions.updateTodoItem).toHaveBeenCalledWith(1, 42, expect.objectContaining({
      due_date: '2026-08-01',
      category: 'Admin',
      assigned_user_id: 8,
      priority: 2,
    })))
  })

  it('FE-MOB-TASK-012: toasts when updating fails', async () => {
    const { actions, toast, onClose } = setup({ items: [todo()], itemId: 42 })
    actions.updateTodoItem.mockRejectedValue(new Error('boom'))

    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-TASK-013: deletes the task and closes', async () => {
    const { actions, onClose } = setup({ items: [todo()], itemId: 42 })

    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.delete' }))

    await waitFor(() => expect(actions.deleteTodoItem).toHaveBeenCalledWith(1, 42))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-TASK-014: toasts when deleting fails', async () => {
    const { actions, toast, onClose } = setup({ items: [todo()], itemId: 42 })
    actions.deleteTodoItem.mockRejectedValue(new Error('boom'))

    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.delete' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-TASK-015: holds on to the last known row when it vanishes from the store', () => {
    const { rerender, planner } = setup({ items: [todo()], itemId: 42 })
    expect(screen.getByPlaceholderText('todo.namePlaceholder')).toHaveValue('Book flights')

    const emptied = { ...planner, todoItems: [] } as unknown as TripPlanner
    rerender(
      <MTaskSheet
        planner={emptied}
        open
        itemId={42}
        categories={['Admin', 'Gear']}
        members={MEMBERS}
        defaultCategory={null}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'todo.detail.save' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('todo.namePlaceholder')).toHaveValue('Book flights')
  })

  it('FE-MOB-TASK-016: switches the category between the offered pills', async () => {
    const { actions } = setup({ items: [todo()], itemId: 42 })

    fireEvent.click(screen.getByRole('button', { name: 'Gear' }))
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(actions.updateTodoItem).toHaveBeenCalledWith(1, 42, expect.objectContaining({ category: 'Gear' })))
  })

  it('FE-MOB-TASK-017: clears the category via the "no category" pill', async () => {
    const { actions } = setup({ items: [todo()], itemId: 42 })

    fireEvent.click(screen.getByRole('button', { name: 'todo.noCategory' }))
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(actions.updateTodoItem).toHaveBeenCalledWith(1, 42, expect.objectContaining({ category: null })))
  })

  it('FE-MOB-TASK-018: keeps a stored category that is not in the offered list', async () => {
    const { actions } = setup({ items: [todo({ category: 'Legacy' })], itemId: 42, categories: ['Admin'] })

    // It has no pill to switch to, so it shows as the active label rather than a button.
    expect(screen.getByText('Legacy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Legacy' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(actions.updateTodoItem).toHaveBeenCalledWith(1, 42, expect.objectContaining({ category: 'Legacy' })))
  })

  it('FE-MOB-TASK-019: adds a new category with the confirm button', async () => {
    const { actions } = setup()

    fireEvent.change(screen.getByPlaceholderText('todo.namePlaceholder'), { target: { value: 'Visa' } })
    fireEvent.click(screen.getByRole('button', { name: /todo.addCategory/ }))
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('todo.newCategory'), { target: { value: '  Docs  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    expect(screen.getByText('Docs')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.create' }))
    await waitFor(() => expect(actions.addTodoItem).toHaveBeenCalledWith(1, expect.objectContaining({ category: 'Docs' })))
  })

  it('FE-MOB-TASK-020: commits a new category on Enter and abandons it on Escape', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: /todo.addCategory/ }))
    fireEvent.change(screen.getByPlaceholderText('todo.newCategory'), { target: { value: 'Docs' } })
    fireEvent.keyDown(screen.getByPlaceholderText('todo.newCategory'), { key: 'Enter' })
    expect(screen.getByText('Docs')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /todo.addCategory/ }))
    fireEvent.change(screen.getByPlaceholderText('todo.newCategory'), { target: { value: 'Ignored' } })
    fireEvent.keyDown(screen.getByPlaceholderText('todo.newCategory'), { key: 'Escape' })

    expect(screen.queryByPlaceholderText('todo.newCategory')).not.toBeInTheDocument()
    expect(screen.queryByText('Ignored')).not.toBeInTheDocument()
    expect(screen.getByText('Docs')).toBeInTheDocument()
  })

  it('FE-MOB-TASK-021: keeps the current category when the draft is blank', () => {
    setup({ items: [todo()], itemId: 42 })

    fireEvent.click(screen.getByRole('button', { name: /todo.addCategory/ }))
    fireEvent.change(screen.getByPlaceholderText('todo.newCategory'), { target: { value: '   ' } })
    fireEvent.keyDown(screen.getByPlaceholderText('todo.newCategory'), { key: 'Enter' })

    expect(screen.queryByPlaceholderText('todo.newCategory')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument()
  })

  it('FE-MOB-TASK-022: unassigns a task again', async () => {
    const { actions } = setup({ items: [todo()], itemId: 42 })

    expect(document.querySelector('img[src="/uploads/avatars/lea.png"]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /todo.unassigned/ }))
    fireEvent.click(screen.getByRole('button', { name: 'todo.detail.save' }))

    await waitFor(() => expect(actions.updateTodoItem).toHaveBeenCalledWith(1, 42, expect.objectContaining({ assigned_user_id: null })))
  })

  it('FE-MOB-TASK-023: falls back to the initial for a member without an avatar', () => {
    setup()

    const chip = screen.getByRole('button', { name: /maurice/ })
    expect(chip).toHaveTextContent('M')
    expect(chip.querySelector('img')).toBeNull()
  })

  it('FE-MOB-TASK-024: resets the form when the same sheet is reused for another task', () => {
    const items = [todo(), todo({ id: 43, name: 'Renew passport', description: null, category: null, assigned_user_id: null, priority: 0 })]
    const { rerender, planner } = setup({ items, itemId: 42 })

    expect(screen.getByPlaceholderText('todo.namePlaceholder')).toHaveValue('Book flights')

    rerender(
      <MTaskSheet
        planner={planner}
        open
        itemId={43}
        categories={['Admin', 'Gear']}
        members={MEMBERS}
        defaultCategory={null}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByPlaceholderText('todo.namePlaceholder')).toHaveValue('Renew passport')
    expect(screen.getByPlaceholderText('todo.descriptionPlaceholder')).toHaveValue('')
  })
})
