import { beforeEach, describe, expect, it, vi } from 'vitest'
import MTodoListTab from '../../../../src/mobile/screens/trip/tabs/MTodoListTab'
import type { MTaskSheetProps } from '../../../../src/mobile/screens/trip/tabs/MTaskSheet'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAuthStore } from '../../../../src/store/authStore'
import type { TodoItem, TripMember } from '../../../../src/types'
import { buildUser } from '../../../helpers/factories'
import { buildPlanner, buildTripActions } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-TODO-001 to FE-MOB-TODO-019

// The sheet has its own suite; here it only has to report the props the tab feeds it.
vi.mock('../../../../src/mobile/screens/trip/tabs/MTaskSheet', () => ({
  default: (props: MTaskSheetProps) => (
    <div
      data-testid="task-sheet"
      data-open={String(props.open)}
      data-item-id={String(props.itemId)}
      data-default-category={String(props.defaultCategory)}
      data-categories={props.categories.join('|')}
      data-members={props.members.map(m => m.username).join('|')}
    />
  ),
}))

const ME = 7
const PAST = '2020-01-05'
const FUTURE = '2999-12-31'

const MEMBERS = [
  { id: ME, username: 'maurice', avatar: null, avatar_url: null },
  { id: 8, username: 'lea', avatar: null, avatar_url: '/uploads/avatars/lea.png' },
] as unknown as TripMember[]

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 1,
    trip_id: 1,
    name: 'Book flights',
    category: null,
    checked: 0,
    sort_order: 0,
    due_date: null,
    description: null,
    assigned_user_id: null,
    priority: 0,
    ...overrides,
  }
}

function setup(items: TodoItem[], plannerOverrides: Partial<TripPlanner> = {}) {
  const actions = buildTripActions()
  const planner = buildPlanner({
    todoItems: items,
    tripMembers: MEMBERS,
    tripActions: actions as unknown as TripPlanner['tripActions'],
    ...plannerOverrides,
  })
  const view = render(<MTodoListTab planner={planner} />)
  return { ...view, actions, planner }
}

function sheet() {
  return screen.getByTestId('task-sheet')
}

/** Row order, read off the check buttons — they are the only ones carrying the task name as aria-label. */
function rowOrder(names: string[]) {
  return screen
    .getAllByRole('button')
    .map(b => b.getAttribute('aria-label'))
    .filter((label): label is string => !!label && names.includes(label))
}

describe('MTodoListTab', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAuthStore, { user: buildUser({ id: ME, username: 'maurice' }) })
  })

  it('FE-MOB-TODO-001: renders the empty state and no filter row without items', () => {
    setup([])

    expect(screen.getByText('todo.empty')).toBeInTheDocument()
    expect(screen.getByText('0/0')).toBeInTheDocument()
    expect(screen.getByText('0% · todo.completed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /todo.filter.all/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-TODO-002: reports done/total and the completion percentage', () => {
    setup([todo({ id: 1 }), todo({ id: 2, checked: 1 }), todo({ id: 3, checked: 1 }), todo({ id: 4 })])

    expect(screen.getByText('2/4')).toBeInTheDocument()
    expect(screen.getByText('50% · todo.completed')).toBeInTheDocument()
  })

  it('FE-MOB-TODO-003: hides "new task" without packing_edit', () => {
    setup([todo()], { can: vi.fn(() => false) as unknown as TripPlanner['can'] })

    expect(screen.queryByRole('button', { name: /todo.newItem/ })).not.toBeInTheDocument()
    expect(screen.getByText('Book flights')).toBeInTheDocument()
  })

  it('FE-MOB-TODO-004: shows the four built-in filters with their counts', () => {
    setup([
      todo({ id: 1, name: 'Open' }),
      todo({ id: 2, name: 'Mine', assigned_user_id: ME }),
      todo({ id: 3, name: 'Late', due_date: PAST }),
      todo({ id: 4, name: 'Done', checked: 1 }),
    ])

    expect(screen.getByRole('button', { name: 'todo.filter.all3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'todo.filter.my1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'todo.filter.overdue1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'todo.filter.done1' })).toBeInTheDocument()
  })

  it('FE-MOB-TODO-005: defaults to the open items and hides done ones', () => {
    setup([todo({ id: 1, name: 'Open' }), todo({ id: 2, name: 'Packed', checked: 1 })])

    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.queryByText('Packed')).not.toBeInTheDocument()
  })

  it('FE-MOB-TODO-006: switches to the my / overdue / done buckets', () => {
    setup([
      todo({ id: 1, name: 'Open' }),
      todo({ id: 2, name: 'Mine', assigned_user_id: ME }),
      todo({ id: 3, name: 'Late', due_date: PAST }),
      todo({ id: 4, name: 'Packed', checked: 1 }),
    ])

    fireEvent.click(screen.getByRole('button', { name: /todo.filter.my/ }))
    expect(screen.getByText('Mine')).toBeInTheDocument()
    expect(screen.queryByText('Open')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /todo.filter.overdue/ }))
    expect(screen.getByText('Late')).toBeInTheDocument()
    expect(screen.queryByText('Mine')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /todo.filter.done/ }))
    expect(screen.getByText('Packed')).toBeInTheDocument()
    expect(screen.queryByText('Late')).not.toBeInTheDocument()
  })

  it('FE-MOB-TODO-006b: leaves the "my" bucket empty when nobody is signed in', () => {
    seedStore(useAuthStore, { user: null })
    setup([todo({ id: 1, name: 'Mine', assigned_user_id: ME })])

    expect(screen.getByRole('button', { name: 'todo.filter.my0' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /todo.filter.my/ }))

    expect(screen.getByText('todo.emptyFiltered')).toBeInTheDocument()
  })

  it('FE-MOB-TODO-007: shows the filtered-empty hint when a bucket is empty', () => {
    setup([todo({ id: 1, name: 'Open' })])

    fireEvent.click(screen.getByRole('button', { name: /todo.filter.done/ }))

    expect(screen.getByText('todo.emptyFiltered')).toBeInTheDocument()
    expect(screen.queryByText('todo.empty')).not.toBeInTheDocument()
  })

  it('FE-MOB-TODO-008: toggles the priority sort and reorders the rows', () => {
    setup([
      todo({ id: 1, name: 'Low', priority: 3 }),
      todo({ id: 2, name: 'High', priority: 1 }),
    ])

    expect(rowOrder(['Low', 'High'])).toEqual(['Low', 'High'])

    const sortButton = screen.getByRole('button', { name: /todo.priority/ })
    expect(sortButton).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(sortButton)

    expect(sortButton).toHaveAttribute('aria-pressed', 'true')
    expect(rowOrder(['Low', 'High'])).toEqual(['High', 'Low'])
  })

  it('FE-MOB-TODO-009: floats overdue rows above the other open ones', () => {
    setup([
      todo({ id: 1, name: 'Open' }),
      todo({ id: 2, name: 'Packed', checked: 1 }),
      todo({ id: 3, name: 'Late', due_date: PAST }),
    ])

    expect(rowOrder(['Open', 'Packed', 'Late'])).toEqual(['Late', 'Open'])
  })

  it('FE-MOB-TODO-009b: sinks done rows to the end of a category bucket', () => {
    setup([
      todo({ id: 1, name: 'Packed', category: 'Gear', checked: 1 }),
      todo({ id: 2, name: 'Boots', category: 'Gear' }),
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Gear1' }))

    expect(rowOrder(['Packed', 'Boots'])).toEqual(['Boots', 'Packed'])
  })

  it('FE-MOB-TODO-010: renders a category rail with open counts and filters by it', () => {
    setup([
      todo({ id: 1, name: 'Visa', category: 'Admin' }),
      todo({ id: 2, name: 'Insurance', category: 'Admin', checked: 1 }),
      todo({ id: 3, name: 'Boots', category: 'Gear' }),
    ])

    expect(screen.getByRole('button', { name: 'Admin1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gear1' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Admin1' }))

    // the category bucket keeps done items visible
    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.getByText('Insurance')).toBeInTheDocument()
    expect(screen.queryByText('Boots')).not.toBeInTheDocument()
  })

  it('FE-MOB-TODO-011: toggles a task through the store action', () => {
    const { actions } = setup([todo({ id: 12, name: 'Book flights' })])

    fireEvent.click(screen.getByRole('button', { name: 'Book flights', pressed: false }))

    expect(actions.toggleTodoItem).toHaveBeenCalledWith(1, 12, true)
  })

  it('FE-MOB-TODO-012: unchecks an already done task', () => {
    const { actions } = setup([todo({ id: 12, name: 'Book flights', checked: 1 })])

    fireEvent.click(screen.getByRole('button', { name: /todo.filter.done/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Book flights', pressed: true }))

    expect(actions.toggleTodoItem).toHaveBeenCalledWith(1, 12, false)
  })

  it('FE-MOB-TODO-013: renders description, priority, due date and assignee on a card', () => {
    setup([todo({
      id: 3,
      name: 'Book flights',
      description: 'Direct if possible',
      priority: 1,
      due_date: PAST,
      assigned_user_id: 8,
    })])

    expect(screen.getByText('Direct if possible')).toBeInTheDocument()
    expect(screen.getByText('P1')).toBeInTheDocument()
    expect(screen.getByText(/Jan/)).toBeInTheDocument()
    expect(screen.getByText('lea')).toBeInTheDocument()
    expect(document.querySelector('img[src="/uploads/avatars/lea.png"]')).toBeInTheDocument()
  })

  it('FE-MOB-TODO-014: falls back to the username initial when a member has no avatar', () => {
    setup([todo({ id: 3, due_date: FUTURE, assigned_user_id: ME })])

    expect(screen.getByText('maurice')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('FE-MOB-TODO-015: opens the sheet in create mode and closes it again', () => {
    setup([todo({ id: 3, category: 'Admin' })])

    expect(sheet()).toHaveAttribute('data-open', 'false')
    expect(sheet()).toHaveAttribute('data-categories', 'Admin')
    expect(sheet()).toHaveAttribute('data-members', 'maurice|lea')

    fireEvent.click(screen.getByRole('button', { name: /todo.newItem/ }))

    expect(sheet()).toHaveAttribute('data-open', 'true')
    expect(sheet()).toHaveAttribute('data-item-id', 'null')
    expect(sheet()).toHaveAttribute('data-default-category', 'null')
  })

  it('FE-MOB-TODO-016: seeds the new task with the active category filter', () => {
    setup([todo({ id: 3, name: 'Visa', category: 'Admin' })])

    fireEvent.click(screen.getByRole('button', { name: 'Admin1' }))
    fireEvent.click(screen.getByRole('button', { name: /todo.newItem/ }))

    expect(sheet()).toHaveAttribute('data-default-category', 'Admin')
  })

  it('FE-MOB-TODO-017: opens the sheet in edit mode for the tapped row', () => {
    setup([todo({ id: 42, name: 'Book flights' })])

    fireEvent.click(screen.getByText('Book flights'))

    expect(sheet()).toHaveAttribute('data-open', 'true')
    expect(sheet()).toHaveAttribute('data-item-id', '42')
  })

  it('FE-MOB-TODO-018: a category named like a built-in filter keeps its own bucket', () => {
    setup([
      todo({ id: 1, name: 'Visa', category: 'done' }),
      todo({ id: 2, name: 'Insurance', category: 'done', checked: 1 }),
      todo({ id: 3, name: 'Boots' }),
    ])

    fireEvent.click(screen.getByRole('button', { name: 'done1' }))

    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.getByText('Insurance')).toBeInTheDocument()
    expect(screen.queryByText('Boots')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /todo.newItem/ }))
    expect(sheet()).toHaveAttribute('data-default-category', 'done')
  })

  it('FE-MOB-TODO-019: shows an unparseable due date as it is stored', () => {
    setup([todo({ id: 3, name: 'Book flights', due_date: 'sometime' })])

    expect(screen.getByText('sometime')).toBeInTheDocument()
  })
})
