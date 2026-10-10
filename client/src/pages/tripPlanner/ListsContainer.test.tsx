// FE-PAGE-PLANNER-LISTS-001 to FE-PAGE-PLANNER-LISTS-006
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
vi.mock('../../components/Packing/ApplyTemplateButton', () => ({ default: stub('applyTemplate') }))
vi.mock('../../components/Packing/PackingExportMenu', () => ({ default: stub('exportMenu') }))

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

  it('FE-PAGE-PLANNER-LISTS-004: without the packing right there is no Add list, the other tools stay', async () => {
    seed({ packingPermission: 'trip_owner' })
    renderLists()

    expect(screen.queryByRole('button', { name: 'Add list' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument()
    await loaded('packingPanel')
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(captured.packingPanel).toMatchObject({ openImportSignal: 1, addCategorySignal: 0 })
  })

  it('FE-PAGE-PLANNER-LISTS-005: an admin saves a template only when the list has items', async () => {
    seed({ role: 'admin' })
    const { unmount } = renderLists([])
    expect(screen.queryByRole('button', { name: 'Save as template' })).toBeNull()
    unmount()

    renderLists()
    fireEvent.click(screen.getByRole('button', { name: 'Save as template' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add list' }))
    expect(await loaded('packingPanel')).toMatchObject({ saveTemplateSignal: 1, addCategorySignal: 1 })
  })

  it('FE-PAGE-PLANNER-LISTS-006: the panel switches the view the template and export tools work on', async () => {
    seed()
    renderLists()
    const panel = await loaded<{ onViewChange: (v: string) => void }>('packingPanel')
    expect(captured.applyTemplate).toMatchObject({ tripId: TRIP_ID, visibility: 'common' })
    expect(captured.exportMenu).toMatchObject({ tripId: TRIP_ID, view: 'common' })

    act(() => { panel.onViewChange('personal') })
    expect(captured.applyTemplate).toMatchObject({ visibility: 'personal' })
    expect(captured.exportMenu).toMatchObject({ view: 'personal' })
    expect(captured.packingPanel).toMatchObject({ view: 'personal' })
  })
})
