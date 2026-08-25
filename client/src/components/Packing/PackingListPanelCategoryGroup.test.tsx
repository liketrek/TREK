// FE-W5CAT-001 to FE-W5CAT-040
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ComponentProps } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildTrip, buildPackingItem } from '../../../tests/helpers/factories'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { KategorieGruppe } from './PackingListPanelCategoryGroup'
import type { TripMember } from './usePackingListPanel'

type Props = ComponentProps<typeof KategorieGruppe>

const toastSpy = vi.fn((_message: string, _type?: string, _duration?: number) => 0)

const MEMBERS = [
  { id: 1, username: 'owner' },
  { id: 2, username: 'alice', is_guest: true },
] as unknown as TripMember[]

/** A dataTransfer stand-in — jsdom drag events carry none of their own. */
const dt = () => ({ effectAllowed: '', dropEffect: '', setData: vi.fn(), getData: vi.fn(() => '') })

function setup(overrides: Partial<Props> = {}) {
  const items = overrides.items ?? [buildPackingItem({ id: 1, name: 'Tent', category: 'Gear' })]
  const props: Props = {
    kategorie: 'Gear',
    items,
    tripId: 1,
    allCategories: ['Gear', 'Docs'],
    onRename: vi.fn(async () => {}),
    onDeleteAll: vi.fn(async () => {}),
    onDeleteItem: vi.fn(async () => {}),
    onAddItem: vi.fn(async () => {}),
    assignees: [],
    tripMembers: [],
    onSetAssignees: vi.fn(async () => {}),
    onCreateBag: vi.fn(async () => undefined),
    allItems: items,
    onReorder: vi.fn((_ids: number[]) => {}),
    ...overrides,
  }
  const utils = render(<KategorieGruppe {...props} />)
  return { ...utils, props }
}

/** The category header owns the first MoreHorizontal; item rows render their own. */
function openCategoryMenu(container: HTMLElement) {
  const btn = container.querySelectorAll('svg.lucide-more-horizontal')[0].closest('button')!
  fireEvent.click(btn)
  return btn
}

function rows(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('.packing-item-row'))
}

function grip(row: HTMLElement) {
  return row.querySelector<HTMLElement>('div[draggable="true"]')!
}

beforeEach(() => {
  resetAllStores()
  toastSpy.mockClear()
  window.__addToast = toastSpy
  server.use(
    http.get('/api/view-contributions/:view/:tripId', () => HttpResponse.json({ contributions: [] })),
  )
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) })
})

afterEach(() => {
  delete window.__addToast
  vi.restoreAllMocks()
})

describe('KategorieGruppe — header', () => {
  it('FE-W5CAT-001: shows the category name and its packed count', () => {
    setup({
      items: [
        buildPackingItem({ id: 1, name: 'Tent', checked: 1 }),
        buildPackingItem({ id: 2, name: 'Rope', checked: 0 }),
      ],
    })

    expect(screen.getByText('Gear')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('FE-W5CAT-002: a fully packed category marks its badge green', () => {
    setup({ items: [buildPackingItem({ id: 1, name: 'Tent', checked: 1 })] })

    expect(screen.getByText('1/1')).toHaveStyle({ color: '#16a34a' })
  })

  it('FE-W5CAT-003: the chevron collapses and re-expands the item list', () => {
    const { container } = setup()
    const toggle = container.querySelector('svg.lucide-chevron-down')!.closest('button')!

    fireEvent.click(toggle)
    expect(screen.queryByText('Tent')).not.toBeInTheDocument()

    fireEvent.click(container.querySelector('svg.lucide-chevron-right')!.closest('button')!)
    expect(screen.getByText('Tent')).toBeInTheDocument()
  })
})

describe('KategorieGruppe — rename', () => {
  it('FE-W5CAT-004: renaming through the menu reports the new name', async () => {
    const onRename = vi.fn(async () => {})
    const { container } = setup({ onRename })
    openCategoryMenu(container)
    fireEvent.click(screen.getByText('Rename'))

    const input = screen.getByDisplayValue('Gear')
    fireEvent.change(input, { target: { value: 'Camping' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(onRename).toHaveBeenCalledWith('Gear', 'Camping'))
  })

  it('FE-W5CAT-005: an unchanged name closes the editor without a request', async () => {
    const onRename = vi.fn(async () => {})
    const { container } = setup({ onRename })
    openCategoryMenu(container)
    fireEvent.click(screen.getByText('Rename'))

    fireEvent.blur(screen.getByDisplayValue('Gear'))

    await waitFor(() => expect(screen.queryByDisplayValue('Gear')).toBeNull())
    expect(onRename).not.toHaveBeenCalled()
  })

  it('FE-W5CAT-006: an emptied name is discarded', async () => {
    const onRename = vi.fn(async () => {})
    const { container } = setup({ onRename })
    openCategoryMenu(container)
    fireEvent.click(screen.getByText('Rename'))

    const input = screen.getByDisplayValue('Gear')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)

    // The editor closes and the original name is restored as plain text.
    await waitFor(() => expect(screen.queryByDisplayValue('Gear')).toBeNull())
    expect(screen.getByText('Gear')).toBeInTheDocument()
    expect(onRename).not.toHaveBeenCalled()
  })

  it('FE-W5CAT-007: Escape restores the original name', () => {
    const { container } = setup()
    openCategoryMenu(container)
    fireEvent.click(screen.getByText('Rename'))

    const input = screen.getByDisplayValue('Gear')
    fireEvent.change(input, { target: { value: 'Camping' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByDisplayValue('Camping')).toBeNull()
    expect(screen.getByText('Gear')).toBeInTheDocument()
  })

  it('FE-W5CAT-008: a failing rename surfaces a rename error', async () => {
    const onRename = vi.fn(async () => { throw new Error('nope') })
    const { container } = setup({ onRename })
    openCategoryMenu(container)
    fireEvent.click(screen.getByText('Rename'))

    const input = screen.getByDisplayValue('Gear')
    fireEvent.change(input, { target: { value: 'Camping' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to rename', 'error', undefined))
  })

  it('FE-W5CAT-009: a read-only category offers no rename entry', () => {
    const { container } = setup({ canEdit: false })
    openCategoryMenu(container)

    expect(screen.queryByText('Rename')).toBeNull()
    expect(screen.queryByText('Delete List')).toBeNull()
    expect(screen.getByText('Check All')).toBeInTheDocument()
  })
})

describe('KategorieGruppe — bulk actions', () => {
  it('FE-W5CAT-010: Check All only touches the unchecked items', async () => {
    const puts: number[] = []
    server.use(
      http.put('/api/trips/1/packing/:itemId', ({ params }) => {
        puts.push(Number(params.itemId))
        return HttpResponse.json({ item: buildPackingItem({ id: Number(params.itemId) }) })
      }),
    )
    const { container } = setup({
      items: [
        buildPackingItem({ id: 1, name: 'Tent', checked: 1 }),
        buildPackingItem({ id: 2, name: 'Rope', checked: 0 }),
      ],
    })
    openCategoryMenu(container)

    fireEvent.click(screen.getByText('Check All'))

    await waitFor(() => expect(puts).toEqual([2]))
  })

  it('FE-W5CAT-011: Uncheck All only touches the checked items', async () => {
    const puts: number[] = []
    server.use(
      http.put('/api/trips/1/packing/:itemId', ({ params }) => {
        puts.push(Number(params.itemId))
        return HttpResponse.json({ item: buildPackingItem({ id: Number(params.itemId) }) })
      }),
    )
    const { container } = setup({
      items: [
        buildPackingItem({ id: 1, name: 'Tent', checked: 1 }),
        buildPackingItem({ id: 2, name: 'Rope', checked: 0 }),
      ],
    })
    openCategoryMenu(container)

    fireEvent.click(screen.getByText('Uncheck All'))

    await waitFor(() => expect(puts).toEqual([1]))
  })

  it('FE-W5CAT-011a: Check All sends the items together, not one round trip after another', async () => {
    const started: number[] = []
    let release = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    server.use(
      http.put('/api/trips/1/packing/:itemId', async ({ params }) => {
        started.push(Number(params.itemId))
        // The first item only answers once the second one has been sent, so a
        // serialised loop would never get its second request out.
        if (started.length === 1) await gate
        return HttpResponse.json({ item: buildPackingItem({ id: Number(params.itemId) }) })
      }),
    )
    const { container } = setup({
      items: [
        buildPackingItem({ id: 1, name: 'Tent', checked: 0 }),
        buildPackingItem({ id: 2, name: 'Rope', checked: 0 }),
      ],
    })
    openCategoryMenu(container)

    fireEvent.click(screen.getByText('Check All'))

    await waitFor(() => expect(started).toHaveLength(2))
    release()
  })

  it('FE-W5CAT-012: a failing PUT during Check All is reported by the store, once', async () => {
    server.use(http.put('/api/trips/1/packing/:itemId', () => new HttpResponse(null, { status: 500 })))
    seedStore(useTripStore, { packingItems: [buildPackingItem({ id: 1, name: 'Tent', checked: 0 })] })
    const { container } = setup({ items: [buildPackingItem({ id: 1, name: 'Tent', checked: 0 })] })
    openCategoryMenu(container)

    fireEvent.click(screen.getByText('Check All'))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Error updating item', 'error', undefined))
    expect(toastSpy).toHaveBeenCalledTimes(1)
  })

  it('FE-W5CAT-013: a failing PUT during Uncheck All is reported by the store, once', async () => {
    server.use(http.put('/api/trips/1/packing/:itemId', () => new HttpResponse(null, { status: 500 })))
    seedStore(useTripStore, { packingItems: [buildPackingItem({ id: 1, name: 'Tent', checked: 1 })] })
    const { container } = setup({ items: [buildPackingItem({ id: 1, name: 'Tent', checked: 1 })] })
    openCategoryMenu(container)

    fireEvent.click(screen.getByText('Uncheck All'))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Error updating item', 'error', undefined))
    expect(toastSpy).toHaveBeenCalledTimes(1)
  })

  it('FE-W5CAT-014: Delete List hands the whole category to the panel and closes the menu', async () => {
    const onDeleteAll = vi.fn(async () => {})
    const items = [buildPackingItem({ id: 1, name: 'Tent' })]
    const { container } = setup({ items, onDeleteAll })
    openCategoryMenu(container)

    fireEvent.click(screen.getByText('Delete List'))

    await waitFor(() => expect(onDeleteAll).toHaveBeenCalledWith(items))
    expect(screen.queryByText('Delete List')).toBeNull()
  })

  it('FE-W5CAT-015: the scrim closes the category menu', () => {
    const { container, baseElement } = setup()
    openCategoryMenu(container)

    fireEvent.click(baseElement.querySelector('div[style*="z-index: 99"]')!)

    expect(screen.queryByText('Check All')).toBeNull()
  })

  it('FE-W5CAT-015a: the menu trigger highlights on hover', () => {
    const { container } = setup()
    const trigger = container.querySelectorAll('svg.lucide-more-horizontal')[0].closest('button')!

    fireEvent.mouseEnter(trigger)
    expect(trigger.style.color).toBe('var(--text-secondary)')
    fireEvent.mouseLeave(trigger)
    expect(trigger.style.color).toBe('var(--text-faint)')
  })

  it('FE-W5CAT-016: a menu entry highlights on hover and resets on leave', () => {
    const { container } = setup()
    openCategoryMenu(container)
    const checkAll = screen.getByText('Check All').closest('button')!
    const deleteAll = screen.getByText('Delete List').closest('button')!

    fireEvent.mouseEnter(checkAll)
    expect(checkAll.style.background).toBe('var(--bg-tertiary)')
    fireEvent.mouseLeave(checkAll)
    expect(checkAll.style.background).toBe('none')

    fireEvent.mouseEnter(deleteAll)
    expect(deleteAll.style.background).toBe('rgb(254, 242, 242)')
  })
})

describe('KategorieGruppe — assignees', () => {
  it('FE-W5CAT-017: the dropdown lists every member and flags guests', () => {
    const { container } = setup({ tripMembers: MEMBERS })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)

    expect(screen.getByText('owner')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('Guest')).toBeInTheDocument()
  })

  it('FE-W5CAT-018: an empty trip shows the no-members hint', () => {
    const { container } = setup({ tripMembers: [] })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)

    expect(screen.getByText('No trip members')).toBeInTheDocument()
  })

  it('FE-W5CAT-019: picking an unassigned member adds them', () => {
    const onSetAssignees = vi.fn(async () => {})
    const { container } = setup({ tripMembers: MEMBERS, onSetAssignees })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)

    fireEvent.click(screen.getByText('alice').closest('button')!)

    expect(onSetAssignees).toHaveBeenCalledWith('Gear', [2])
  })

  it('FE-W5CAT-019a: adding a member keeps the ones already assigned', () => {
    const onSetAssignees = vi.fn(async () => {})
    const { container } = setup({
      tripMembers: MEMBERS,
      assignees: [{ user_id: 1, username: 'owner' }],
      onSetAssignees,
    })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)

    fireEvent.click(screen.getByRole('button', { name: /alice/ }))

    expect(onSetAssignees).toHaveBeenCalledWith('Gear', [1, 2])
  })

  it('FE-W5CAT-020: picking an assigned member removes them again', () => {
    const onSetAssignees = vi.fn(async () => {})
    const { container } = setup({
      tripMembers: MEMBERS,
      assignees: [{ user_id: 2, username: 'alice' }, { user_id: 1, username: 'owner' }],
      onSetAssignees,
    })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)

    // Scoped to the dropdown: an assigned member also has a chip button carrying
    // their name, so an unscoped role query matches two elements.
    const dropdown = within(container.querySelector('svg.lucide-user-plus')!.closest('div')!)
    fireEvent.click(dropdown.getByRole('button', { name: /alice/ }))

    expect(onSetAssignees).toHaveBeenCalledWith('Gear', [1])
  })

  it('FE-W5CAT-021: only the unassigned rows react to hover', () => {
    const { container } = setup({
      tripMembers: MEMBERS,
      assignees: [{ user_id: 1, username: 'owner' }],
    })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)
    const dropdown = within(container.querySelector('svg.lucide-user-plus')!.closest('div')!)
    const assigned = dropdown.getByRole('button', { name: /owner/ })
    const free = dropdown.getByRole('button', { name: /alice/ })

    fireEvent.mouseEnter(free)
    expect(free.style.background).toBe('var(--bg-tertiary)')
    fireEvent.mouseLeave(free)
    expect(free.style.background).toBe('transparent')

    fireEvent.mouseEnter(assigned)
    fireEvent.mouseLeave(assigned)
    expect(assigned.style.background).toBe('var(--bg-hover)')
  })

  it('FE-W5CAT-022: the add-assignee button highlights on hover', () => {
    const { container } = setup({ tripMembers: MEMBERS })
    const btn = container.querySelector('svg.lucide-user-plus')!.closest('button')!

    fireEvent.mouseEnter(btn)
    expect(btn.style.color).toBe('var(--text-muted)')
    fireEvent.mouseLeave(btn)
    expect(btn.style.color).toBe('var(--text-faint)')
  })

  it('FE-W5CAT-023: a mousedown outside closes the assignee dropdown', () => {
    const { container } = setup({ tripMembers: MEMBERS })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)
    expect(screen.getByText('alice')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByText('alice')).toBeNull()
  })

  it('FE-W5CAT-023a: a mousedown inside the assignee dropdown keeps it open', () => {
    const { container } = setup({ tripMembers: MEMBERS })
    fireEvent.click(container.querySelector('svg.lucide-user-plus')!.closest('button')!)

    fireEvent.mouseDown(screen.getByText('alice'))

    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('FE-W5CAT-024: clicking an assignee chip drops that member', () => {
    const onSetAssignees = vi.fn(async () => {})
    const { container } = setup({
      assignees: [{ user_id: 2, username: 'alice' }, { user_id: 1, username: 'owner' }],
      onSetAssignees,
    })

    fireEvent.click(container.querySelector('.assignee-chip')!.parentElement!)

    expect(onSetAssignees).toHaveBeenCalledWith('Gear', [1])
  })

  it('FE-W5CAT-025: a read-only category ignores chip clicks and hides the add button', () => {
    const onSetAssignees = vi.fn(async () => {})
    const { container } = setup({
      canEdit: false,
      assignees: [{ user_id: 2, username: 'alice' }],
      onSetAssignees,
    })

    fireEvent.click(container.querySelector('.assignee-chip')!.parentElement!)

    expect(onSetAssignees).not.toHaveBeenCalled()
    expect(container.querySelector('svg.lucide-user-plus')).toBeNull()
  })
})

describe('KategorieGruppe — inline add item', () => {
  it('FE-W5CAT-026: Enter adds the typed item and clears the field', () => {
    const onAddItem = vi.fn(async () => {})
    setup({ onAddItem })
    fireEvent.click(screen.getByText('Add item'))

    const input = screen.getByPlaceholderText('Item name...')
    fireEvent.change(input, { target: { value: 'Rope' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onAddItem).toHaveBeenCalledWith('Gear', 'Rope')
    expect(input).toHaveValue('')
  })

  it('FE-W5CAT-027: Enter on an empty field adds nothing', () => {
    const onAddItem = vi.fn(async () => {})
    setup({ onAddItem })
    fireEvent.click(screen.getByText('Add item'))

    fireEvent.keyDown(screen.getByPlaceholderText('Item name...'), { key: 'Enter' })

    expect(onAddItem).not.toHaveBeenCalled()
  })

  it('FE-W5CAT-028: the confirm button adds the item, and stays inert while empty', () => {
    const onAddItem = vi.fn(async () => {})
    const { container } = setup({ onAddItem })
    fireEvent.click(screen.getByText('Add item'))
    const confirm = container.querySelector('svg.lucide-plus')!.closest('button')!

    fireEvent.click(confirm)
    expect(onAddItem).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Item name...'), { target: { value: 'Rope' } })
    fireEvent.click(confirm)
    expect(onAddItem).toHaveBeenCalledWith('Gear', 'Rope')
  })

  it('FE-W5CAT-029: Escape closes the inline form', () => {
    setup()
    fireEvent.click(screen.getByText('Add item'))

    fireEvent.keyDown(screen.getByPlaceholderText('Item name...'), { key: 'Escape' })

    expect(screen.queryByPlaceholderText('Item name...')).toBeNull()
  })

  it('FE-W5CAT-030: the X button closes the inline form', () => {
    const { container } = setup()
    fireEvent.click(screen.getByText('Add item'))
    fireEvent.change(screen.getByPlaceholderText('Item name...'), { target: { value: 'Rope' } })

    fireEvent.click(container.querySelector('svg.lucide-x')!.closest('button')!)

    expect(screen.queryByPlaceholderText('Item name...')).toBeNull()
  })

  it('FE-W5CAT-031: the add-item trigger highlights on hover', () => {
    setup()
    const trigger = screen.getByText('Add item').closest('button')!

    fireEvent.mouseEnter(trigger)
    expect(trigger.style.color).toBe('var(--text-secondary)')
    fireEvent.mouseLeave(trigger)
    expect(trigger.style.color).toBe('var(--text-faint)')
  })

  it('FE-W5CAT-032: a read-only category hides the add-item affordance', () => {
    setup({ canEdit: false })

    expect(screen.queryByText('Add item')).toBeNull()
  })
})

describe('KategorieGruppe — drag to reorder', () => {
  const items = [
    buildPackingItem({ id: 1, name: 'Tent' }),
    buildPackingItem({ id: 2, name: 'Rope' }),
    buildPackingItem({ id: 3, name: 'Stove' }),
  ]
  // The order is global: another category's item sits between ours.
  const allItems = [items[0], buildPackingItem({ id: 9, name: 'Passport', category: 'Docs' }), items[1], items[2]]

  it('FE-W5CAT-033: dropping an item onto a later sibling reorders only this category', () => {
    const onReorder = vi.fn((_ids: number[]) => {})
    const { container } = setup({ items, allItems, onReorder })
    const row = rows(container)

    fireEvent.dragStart(grip(row[0]), { dataTransfer: dt() })
    fireEvent.dragOver(row[2], { dataTransfer: dt() })
    fireEvent.drop(row[2], { dataTransfer: dt() })

    expect(onReorder).toHaveBeenCalledWith([2, 9, 3, 1])
  })

  it('FE-W5CAT-034: a drop without a drag source is ignored', () => {
    const onReorder = vi.fn((_ids: number[]) => {})
    const { container } = setup({ items, allItems, onReorder })

    fireEvent.drop(rows(container)[1], { dataTransfer: dt() })

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('FE-W5CAT-035: dropping an item onto itself is ignored', () => {
    const onReorder = vi.fn((_ids: number[]) => {})
    const { container } = setup({ items, allItems, onReorder })
    const row = rows(container)

    fireEvent.dragStart(grip(row[1]), { dataTransfer: dt() })
    fireEvent.drop(row[1], { dataTransfer: dt() })

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('FE-W5CAT-036: a drop whose source has left the category is ignored', () => {
    const onReorder = vi.fn((_ids: number[]) => {})
    const { container, rerender, props } = setup({ items, allItems, onReorder })

    fireEvent.dragStart(grip(rows(container)[0]), { dataTransfer: dt() })
    // The dragged row disappears mid-drag (another client removed it).
    const shorter = [items[1], items[2]]
    rerender(<KategorieGruppe {...props} items={shorter} allItems={shorter} />)
    fireEvent.drop(rows(container)[0], { dataTransfer: dt() })

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('FE-W5CAT-037: dragging marks the source faint and the hovered target with an edge', () => {
    const { container } = setup({ items, allItems })
    const row = rows(container)

    fireEvent.dragStart(grip(row[0]), { dataTransfer: dt() })
    fireEvent.dragOver(row[1], { dataTransfer: dt() })

    expect(row[0].style.opacity).toBe('0.4')
    expect(row[1].style.boxShadow).toBe('inset 3px 0 0 0 var(--accent)')
  })

  it('FE-W5CAT-038: ending a drag clears both markers', () => {
    const { container } = setup({ items, allItems })
    const row = rows(container)

    fireEvent.dragStart(grip(row[0]), { dataTransfer: dt() })
    fireEvent.dragOver(row[1], { dataTransfer: dt() })
    fireEvent.dragEnd(grip(row[0]))

    expect(row[0].style.opacity).toBe('1')
    expect(row[1].style.boxShadow).toBe('none')
  })

  it('FE-W5CAT-039: a read-only category renders no drag handles', () => {
    const { container } = setup({ items, allItems, canEdit: false })

    expect(container.querySelector('div[draggable="true"]')).toBeNull()
  })
})

describe('KategorieGruppe — plugin contributions', () => {
  it('FE-W5CAT-040: a plugin column is rendered below its item row', async () => {
    server.use(
      http.get('/api/view-contributions/:view/:tripId', () =>
        HttpResponse.json({
          contributions: [
            { kind: 'column', pluginId: 'weather', entityId: 1, id: 'c1', label: 'Forecast', value: 'Sunny', tone: 'default' },
          ],
        })),
    )
    setup({ items: [buildPackingItem({ id: 1, name: 'Tent' })] })

    expect(await screen.findByText('Sunny')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
  })
})
