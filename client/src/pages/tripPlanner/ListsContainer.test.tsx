// FE-PAGE-PLANNER-LISTS-001 to FE-PAGE-PLANNER-LISTS-007
import { render, screen, fireEvent, act } from '../../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildTrip, buildPackingItem, buildTodoItem } from '../../../tests/helpers/factories'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { usePermissionsStore, type PermissionLevel } from '../../store/permissionsStore'
import { ListsContainer } from './ListsContainer'

// The panels and header tools are stubs that record what the container hands them.
const captured = vi.hoisted(() => ({} as Record<string, Record<string, unknown>>))
const stub = vi.hoisted(() => (name: string) => (props: Record<string, unknown>) => {
  captured[name] = props
  return null
})
vi.mock('../../components/Packing/PackingListPanel', () => ({ default: stub('packingPanel') }))
vi.mock('../../components/Todo/TodoListPanel', () => ({ default: stub('todoPanel') }))
vi.mock('../../components/Packing/PackingListsMenu', () => ({ default: stub('listsMenu') }))

type MenuProps = {
  onImport: () => void; onSaveTemplate: () => void; onClearChecked: () => void; onOpenBags: () => void
  onSortChange: (s: 'manual' | 'name') => void; onHideDoneChange: (v: boolean) => void
}
const menu = () => captured.listsMenu as unknown as MenuProps

/** The props a lazily loaded panel was last rendered with, once its chunk is in. */
function loaded<T = Record<string, unknown>>(name: string): Promise<T> {
  return vi.waitFor(() => {
    if (!captured[name]) throw new Error(`${name} has not rendered yet`)
    return captured[name] as T
  })
}

const TRIP_ID = 31

function seed({ role = 'user', packingPermission }: { role?: 'user' | 'admin'; packingPermission?: PermissionLevel } = {}) {
  seedStore(useAuthStore, { user: buildUser({ id: 9, role }) })
  // A member, not the owner: owner-only rights then really are withheld.
  seedStore(useTripStore, { trip: buildTrip({ id: TRIP_ID, user_id: 1 }) })
  seedStore(usePermissionsStore, { permissions: packingPermission ? { packing_edit: packingPermission } : {} })
}

function renderLists(packing = [buildPackingItem(), buildPackingItem()], todos = [buildTodoItem()]) {
  return render(<ListsContainer tripId={TRIP_ID} packingItems={packing} todoItems={todos} />)
}

beforeEach(() => {
  resetAllStores()
  sessionStorage.clear()
  localStorage.removeItem('trek:packing-sort')
  for (const key of Object.keys(captured)) delete captured[key]
})

describe('ListsContainer', () => {
  it('FE-PAGE-PLANNER-LISTS-001: opens on the packing list and counts both lists', async () => {
    seed()
    renderLists()

    expect(screen.getByRole('heading', { name: 'Lists' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Packing List\s*2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /To-Do\s*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add list' })).toBeInTheDocument()
    expect(await loaded('packingPanel')).toMatchObject({ tripId: TRIP_ID, inlineHeader: false, view: 'common' })
    expect(captured.todoPanel).toBeUndefined()
  })

  it('FE-PAGE-PLANNER-LISTS-002: the chosen subtab is remembered per trip for the session', async () => {
    seed()
    sessionStorage.setItem('trip-lists-subtab-99', 'todo')
    renderLists()
    // Another trip's choice does not carry over.
    expect(screen.queryByRole('button', { name: 'Add new task' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /To-Do/ }))
    expect(sessionStorage.getItem(`trip-lists-subtab-${TRIP_ID}`)).toBe('todo')
    expect(await loaded('todoPanel')).toMatchObject({ tripId: TRIP_ID, addItemSignal: 0 })
    expect(screen.queryByRole('button', { name: 'Add list' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Packing List/ }))
    expect(sessionStorage.getItem(`trip-lists-subtab-${TRIP_ID}`)).toBe('packing')
  })

  it('FE-PAGE-PLANNER-LISTS-003: each press of Add new task raises the to-do signal once more', async () => {
    seed()
    sessionStorage.setItem(`trip-lists-subtab-${TRIP_ID}`, 'todo')
    renderLists()

    const add = screen.getByRole('button', { name: 'Add new task' })
    fireEvent.click(add)
    fireEvent.click(add)
    expect(await loaded('todoPanel')).toMatchObject({ addItemSignal: 2 })
  })

  it('FE-PAGE-PLANNER-LISTS-004: without the packing right there is no Add list, the menu still imports', async () => {
    seed({ packingPermission: 'trip_owner' })
    renderLists()

    expect(screen.queryByRole('button', { name: 'Add list' })).toBeNull()
    expect(captured.listsMenu).toMatchObject({ canEdit: false, tripId: TRIP_ID })
    await loaded('packingPanel')
    act(() => { menu().onImport() })
    expect(captured.packingPanel).toMatchObject({ openImportSignal: 1, addCategorySignal: 0 })
  })

  it('FE-PAGE-PLANNER-LISTS-005: an admin saves a template only when the list has items', async () => {
    seed({ role: 'admin' })
    const { unmount } = renderLists([])
    expect(captured.listsMenu).toMatchObject({ isAdmin: true, hasItems: false })
    unmount()

    renderLists()
    expect(captured.listsMenu).toMatchObject({ hasItems: true })
    act(() => { menu().onSaveTemplate() })
    fireEvent.click(screen.getByRole('button', { name: 'Add list' }))
    expect(await loaded('packingPanel')).toMatchObject({ saveTemplateSignal: 1, addCategorySignal: 1 })
  })

  it('FE-PAGE-PLANNER-LISTS-006: the panel switches the view the menu works on, and the packed count follows it', async () => {
    seed()
    renderLists([buildPackingItem({ checked: 1 }), buildPackingItem({ is_private: 1, checked: 1 }), buildPackingItem({ is_private: 1 })])
    const panel = await loaded<{ onViewChange: (v: string) => void }>('packingPanel')
    expect(captured.listsMenu).toMatchObject({ tripId: TRIP_ID, view: 'common', packedCount: 1 })

    act(() => { panel.onViewChange('personal') })
    expect(captured.listsMenu).toMatchObject({ view: 'personal', packedCount: 1 })
    expect(captured.packingPanel).toMatchObject({ view: 'personal' })
  })

  it('FE-PAGE-PLANNER-LISTS-007: order, hiding packed items, the clean-up and the bags reach the panel from the menu', async () => {
    seed()
    renderLists()
    await loaded('packingPanel')
    expect(captured.packingPanel).toMatchObject({ sort: 'manual', hideDone: false, clearCheckedSignal: 0, openBagsSignal: 0 })

    act(() => { menu().onSortChange('name') })
    act(() => { menu().onHideDoneChange(true) })
    act(() => { menu().onClearChecked() })
    act(() => { menu().onOpenBags() })
    expect(captured.packingPanel).toMatchObject({ sort: 'name', hideDone: true, clearCheckedSignal: 1, openBagsSignal: 1 })
    expect(localStorage.getItem('trek:packing-sort')).toBe('name')
  })
})
