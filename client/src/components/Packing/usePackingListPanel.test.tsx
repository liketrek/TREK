// FE-W5HOOK-001 to FE-W5HOOK-058
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChangeEvent, ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { renderHook, act, waitFor } from '@testing-library/react'
import { TranslationProvider } from '../../i18n/TranslationContext'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildAdmin, buildTrip, buildPackingItem } from '../../../tests/helpers/factories'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { useAddonStore } from '../../store/addonStore'
import { usePermissionsStore } from '../../store/permissionsStore'
import { usePackingList, type PackingListPanelProps } from './usePackingListPanel'
import type { PackingItem } from '../../types'

const wrapper = ({ children }: { children: ReactNode }) => <TranslationProvider>{children}</TranslationProvider>

const toastSpy = vi.fn((_message: string, _type?: string, _duration?: number) => 0)

function renderPanel(props: Partial<PackingListPanelProps> = {}) {
  return renderHook((p: PackingListPanelProps) => usePackingList(p), {
    wrapper,
    initialProps: { tripId: 1, items: [], ...props },
  })
}

/** Waits for the mount effects (members, assignees, templates) to settle. */
async function settled() {
  await act(async () => { await Promise.resolve() })
}

beforeEach(() => {
  resetAllStores()
  toastSpy.mockClear()
  window.__addToast = toastSpy
  server.use(
    http.get('/api/trips/:id/members', () =>
      HttpResponse.json({ owner: { id: 1, username: 'owner', avatar_url: null }, members: [] })),
    http.get('/api/trips/:id/packing/category-assignees', () => HttpResponse.json({ assignees: {} })),
    http.get('/api/addons', () => HttpResponse.json({ bagTracking: false, addons: [] })),
    http.get('/api/trips/:id/packing/templates', () => HttpResponse.json({ templates: [] })),
    http.get('/api/trips/:id/packing/bags', () => HttpResponse.json({ bags: [] })),
  )
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1 }) })
})

afterEach(() => {
  delete window.__addToast
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('usePackingList — members & assignees', () => {
  it('FE-W5HOOK-001: merges the owner and the members into one member list', async () => {
    server.use(
      http.get('/api/trips/:id/members', () =>
        HttpResponse.json({
          owner: { id: 1, username: 'owner', avatar_url: 'a.png' },
          members: [{ id: 2, username: 'alice', avatar_url: null, is_guest: 1 }],
        })),
    )
    const { result } = renderPanel()

    await waitFor(() => expect(result.current.tripMembers).toHaveLength(2))
    expect(result.current.tripMembers[0]).toEqual({ id: 1, username: 'owner', avatar: 'a.png', is_guest: false })
    expect(result.current.tripMembers[1]).toEqual({ id: 2, username: 'alice', avatar: null, is_guest: true })
  })

  it('FE-W5HOOK-002: a response without owner or members yields no members', async () => {
    server.use(http.get('/api/trips/:id/members', () => HttpResponse.json({})))
    const { result } = renderPanel()

    await settled()
    expect(result.current.tripMembers).toEqual([])
  })

  it('FE-W5HOOK-003: a failing members request leaves the list empty', async () => {
    server.use(http.get('/api/trips/:id/members', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await settled()
    expect(result.current.tripMembers).toEqual([])
  })

  it('FE-W5HOOK-004: an assignee response without a map falls back to an empty record', async () => {
    server.use(http.get('/api/trips/:id/packing/category-assignees', () => HttpResponse.json({})))
    const { result } = renderPanel()

    await settled()
    expect(result.current.categoryAssignees).toEqual({})
  })

  it('FE-W5HOOK-005: setting assignees stores the returned list for that category', async () => {
    server.use(
      http.get('/api/trips/:id/packing/category-assignees', () => HttpResponse.json({ assignees: { Docs: [] } })),
      http.put('/api/trips/1/packing/category-assignees/Gear', () =>
        HttpResponse.json({ assignees: [{ user_id: 2, username: 'alice' }] })),
    )
    const { result } = renderPanel()
    await waitFor(() => expect(result.current.categoryAssignees.Docs).toEqual([]))

    await act(async () => { await result.current.handleSetAssignees('Gear', [2]) })

    expect(result.current.categoryAssignees.Gear).toEqual([{ user_id: 2, username: 'alice' }])
    // The existing categories survive the merge.
    expect(result.current.categoryAssignees.Docs).toEqual([])
  })

  it('FE-W5HOOK-006: an assignee response without a list stores an empty array', async () => {
    server.use(
      http.get('/api/trips/:id/packing/category-assignees', () => HttpResponse.json({ assignees: { Docs: [] } })),
      http.put('/api/trips/1/packing/category-assignees/Gear', () => HttpResponse.json({})),
    )
    const { result } = renderPanel()
    await waitFor(() => expect(result.current.categoryAssignees.Docs).toEqual([]))

    await act(async () => { await result.current.handleSetAssignees('Gear', [2]) })

    expect(result.current.categoryAssignees.Gear).toEqual([])
  })

  it('FE-W5HOOK-007: a failing assignee update surfaces a save error', async () => {
    server.use(http.put('/api/trips/1/packing/category-assignees/Gear', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleSetAssignees('Gear', [2]) })

    expect(toastSpy).toHaveBeenCalledWith('Failed to save', 'error', undefined)
  })
})

describe('usePackingList — grouping, filtering and progress', () => {
  const items = [
    buildPackingItem({ id: 1, name: 'Tent', category: 'Gear', checked: 1 }),
    buildPackingItem({ id: 2, name: 'Rope', category: 'Gear', checked: 0 }),
    buildPackingItem({ id: 3, name: 'Soap', category: null, checked: 0 }),
    buildPackingItem({ id: 4, name: 'Diary', category: 'Gear', is_private: 1 } as Partial<PackingItem>),
  ]

  it('FE-W5HOOK-008: the common view hides private items and buckets by category', async () => {
    const { result } = renderPanel({ items })
    await settled()

    expect(result.current.allCategories).toEqual(['Gear', 'Other'])
    expect(result.current.gruppiert.Gear.map(i => i.name)).toEqual(['Tent', 'Rope'])
    expect(result.current.gruppiert.Other.map(i => i.name)).toEqual(['Soap'])
  })

  it('FE-W5HOOK-009: the personal view shows only private items', async () => {
    const { result } = renderPanel({ items })
    await settled()

    act(() => result.current.setView('personal'))

    expect(result.current.view).toBe('personal')
    expect(result.current.gruppiert.Gear.map(i => i.name)).toEqual(['Diary'])
  })

  it('FE-W5HOOK-010: the "offen" filter keeps only unchecked items', async () => {
    const { result } = renderPanel({ items })
    await settled()

    act(() => result.current.setFilter('offen'))

    expect(result.current.gruppiert.Gear.map(i => i.name)).toEqual(['Rope'])
  })

  it('FE-W5HOOK-011: the "erledigt" filter keeps only checked items', async () => {
    const { result } = renderPanel({ items })
    await settled()

    act(() => result.current.setFilter('erledigt'))

    expect(result.current.gruppiert.Gear.map(i => i.name)).toEqual(['Tent'])
    expect(result.current.gruppiert.Other).toBeUndefined()
  })

  it('FE-W5HOOK-012: progress is the checked share of the active view', async () => {
    const { result } = renderPanel({ items })
    await settled()

    expect(result.current.abgehakt).toBe(1)
    expect(result.current.fortschritt).toBe(33)
  })

  it('FE-W5HOOK-013: an empty view reports zero progress instead of NaN', async () => {
    const { result } = renderPanel()
    await settled()

    expect(result.current.fortschritt).toBe(0)
  })

  it('FE-W5HOOK-014: a controlled view prop drives the split and reports changes upwards', async () => {
    const onViewChange = vi.fn()
    const { result } = renderPanel({ items, view: 'personal', onViewChange })
    await settled()

    expect(result.current.gruppiert.Gear.map(i => i.name)).toEqual(['Diary'])

    act(() => result.current.setView('common'))

    expect(onViewChange).toHaveBeenCalledWith('common')
    // Controlled: the hook does not flip its own state.
    expect(result.current.view).toBe('personal')
  })
})

describe('usePackingList — item and category CRUD', () => {
  it('FE-W5HOOK-015: adding to a category reuses its placeholder row', async () => {
    const placeholder = buildPackingItem({ id: 9, name: '...', category: 'Gear' })
    seedStore(useTripStore, { packingItems: [placeholder] })
    let put: Record<string, unknown> | null = null
    let posted = false
    server.use(
      http.put('/api/trips/1/packing/9', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ item: placeholder })
      }),
      http.post('/api/trips/1/packing', () => { posted = true; return HttpResponse.json({ item: placeholder }) }),
    )
    const { result } = renderPanel({ items: [placeholder] })

    await act(async () => { await result.current.handleAddItemToCategory('Gear', 'Tent') })

    expect(put).toMatchObject({ name: 'Tent' })
    expect(posted).toBe(false)
  })

  it('FE-W5HOOK-016: a new item in the personal view is created as personal', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/trips/1/packing', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ item: buildPackingItem({ id: 3 }) })
      }),
    )
    const { result } = renderPanel({ view: 'personal', onViewChange: () => {} })

    await act(async () => { await result.current.handleAddItemToCategory('Gear', 'Tent') })

    expect(body).toMatchObject({ name: 'Tent', category: 'Gear', visibility: 'personal' })
  })

  it('FE-W5HOOK-017: a failing add surfaces an add error', async () => {
    server.use(http.post('/api/trips/1/packing', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleAddItemToCategory('Gear', 'Tent') })

    expect(toastSpy).toHaveBeenCalledWith('Failed to add', 'error', undefined)
  })

  it('FE-W5HOOK-018: deleting the last item of a category unchecks it and converts it to a placeholder', async () => {
    const item = buildPackingItem({ id: 11, name: 'Tent', category: 'Gear', checked: 1 })
    const bodies: Record<string, unknown>[] = []
    let deleted = false
    server.use(
      http.put('/api/trips/1/packing/11', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ item })
      }),
      http.delete('/api/trips/1/packing/11', () => { deleted = true; return HttpResponse.json({ success: true }) }),
    )
    const { result } = renderPanel({ items: [item] })

    await act(async () => { await result.current.handleDeleteItem(item) })

    expect(bodies[0]).toMatchObject({ checked: false })
    expect(bodies[1]).toMatchObject({ name: '...', weight_grams: null, bag_id: null, quantity: 1 })
    expect(deleted).toBe(false)
  })

  it('FE-W5HOOK-018a: the last item of a category is converted without an extra uncheck call', async () => {
    const item = buildPackingItem({ id: 14, name: 'Tent', category: 'Gear', checked: 0 })
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.put('/api/trips/1/packing/14', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ item })
      }),
    )
    const { result } = renderPanel({ items: [item] })

    await act(async () => { await result.current.handleDeleteItem(item) })

    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({ name: '...' })
  })

  it('FE-W5HOOK-018b: an item with siblings in its category is deleted outright', async () => {
    const item = buildPackingItem({ id: 15, name: 'Tent', category: 'Gear' })
    const sibling = buildPackingItem({ id: 16, name: 'Rope', category: 'Gear' })
    let deleted = false
    let converted = false
    server.use(
      http.delete('/api/trips/1/packing/15', () => { deleted = true; return HttpResponse.json({ success: true }) }),
      http.put('/api/trips/1/packing/15', () => { converted = true; return HttpResponse.json({ item }) }),
    )
    const { result } = renderPanel({ items: [item, sibling] })

    await act(async () => { await result.current.handleDeleteItem(item) })

    expect(deleted).toBe(true)
    expect(converted).toBe(false)
  })

  it('FE-W5HOOK-019: an uncategorized item is deleted outright', async () => {
    const item = buildPackingItem({ id: 12, name: 'Soap', category: null })
    let deleted = false
    server.use(http.delete('/api/trips/1/packing/12', () => { deleted = true; return HttpResponse.json({ success: true }) }))
    const { result } = renderPanel({ items: [item] })

    await act(async () => { await result.current.handleDeleteItem(item) })

    expect(deleted).toBe(true)
  })

  it('FE-W5HOOK-020: a failing delete surfaces a delete error', async () => {
    const item = buildPackingItem({ id: 13, name: 'Soap', category: null })
    server.use(http.delete('/api/trips/1/packing/13', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel({ items: [item] })

    await act(async () => { await result.current.handleDeleteItem(item) })

    expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined)
  })

  it('FE-W5HOOK-021: adding a category without a name does nothing', async () => {
    let posted = false
    server.use(http.post('/api/trips/1/packing', () => { posted = true; return HttpResponse.json({ item: buildPackingItem() }) }))
    const { result } = renderPanel()

    act(() => result.current.setNewCatName('   '))
    await act(async () => { await result.current.handleAddNewCategory() })

    expect(posted).toBe(false)
  })

  it('FE-W5HOOK-022: a duplicate category name gets a zero-width suffix so it stays distinct', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/trips/1/packing', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ item: buildPackingItem() })
      }),
    )
    const { result } = renderPanel({ items: [buildPackingItem({ id: 20, category: 'Gear' })] })
    await settled()

    act(() => result.current.setNewCatName('Gear'))
    await act(async () => { await result.current.handleAddNewCategory() })

    expect(body).toMatchObject({ name: '...', category: 'Gear​', visibility: 'common' })
    expect(result.current.newCatName).toBe('')
    expect(result.current.addingCategory).toBe(false)
  })

  it('FE-W5HOOK-022a: a category added from the personal view is created as personal', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/trips/1/packing', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ item: buildPackingItem() })
      }),
    )
    const { result } = renderPanel({ view: 'personal', onViewChange: () => {} })

    act(() => result.current.setNewCatName('Gear'))
    await act(async () => { await result.current.handleAddNewCategory() })

    expect(body).toMatchObject({ category: 'Gear', visibility: 'personal' })
  })

  it('FE-W5HOOK-023: a failing category add surfaces an add error', async () => {
    server.use(http.post('/api/trips/1/packing', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    act(() => result.current.setNewCatName('Gear'))
    await act(async () => { await result.current.handleAddNewCategory() })

    expect(toastSpy).toHaveBeenCalledWith('Failed to add', 'error', undefined)
  })

  it('FE-W5HOOK-024: renaming the default category moves every uncategorized item', async () => {
    const items = [
      buildPackingItem({ id: 31, category: null }),
      buildPackingItem({ id: 32, category: 'Gear' }),
    ]
    const touched: number[] = []
    server.use(
      http.put('/api/trips/1/packing/:itemId', ({ params }) => {
        touched.push(Number(params.itemId))
        return HttpResponse.json({ item: items[0] })
      }),
    )
    const { result } = renderPanel({ items })

    await act(async () => { await result.current.handleRenameCategory('Other', 'Misc') })

    expect(touched).toEqual([31])
  })

  it('FE-W5HOOK-025: a partly failing category delete surfaces a delete error', async () => {
    const items = [buildPackingItem({ id: 41 }), buildPackingItem({ id: 42 })]
    server.use(
      http.delete('/api/trips/1/packing/41', () => HttpResponse.json({ success: true })),
      http.delete('/api/trips/1/packing/42', () => new HttpResponse(null, { status: 500 })),
    )
    const { result } = renderPanel({ items })

    await act(async () => { await result.current.handleDeleteCategory(items) })

    expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined)
  })

  it('FE-W5HOOK-025a: a clean category delete stays quiet', async () => {
    const items = [buildPackingItem({ id: 43 }), buildPackingItem({ id: 44 })]
    const deleted: number[] = []
    server.use(
      http.delete('/api/trips/1/packing/:itemId', ({ params }) => {
        deleted.push(Number(params.itemId))
        return HttpResponse.json({ success: true })
      }),
    )
    const { result } = renderPanel({ items })

    await act(async () => { await result.current.handleDeleteCategory(items) })

    expect(deleted).toEqual([43, 44])
    expect(toastSpy).not.toHaveBeenCalled()
  })

  it('FE-W5HOOK-026: declining the clear-checked confirmation deletes nothing', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    let deleted = false
    server.use(http.delete('/api/trips/1/packing/:itemId', () => { deleted = true; return HttpResponse.json({ success: true }) }))
    const { result } = renderPanel({ items: [buildPackingItem({ id: 51, checked: 1 })] })

    await act(async () => { await result.current.handleClearChecked() })

    expect(deleted).toBe(false)
  })

  it('FE-W5HOOK-027: a failing clear-checked delete surfaces a delete error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    server.use(http.delete('/api/trips/1/packing/52', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel({ items: [buildPackingItem({ id: 52, checked: 1 })] })

    await act(async () => { await result.current.handleClearChecked() })

    expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined)
  })
})

describe('usePackingList — bags', () => {
  beforeEach(() => {
    seedStore(useAddonStore, { bagTracking: true, loaded: true })
  })

  it('FE-W5HOOK-028: a bag list response without bags falls back to an empty list', async () => {
    server.use(http.get('/api/trips/:id/packing/bags', () => HttpResponse.json({})))
    const { result } = renderPanel()

    await settled()
    expect(result.current.bagTrackingEnabled).toBe(true)
    expect(result.current.bags).toEqual([])
  })

  it('FE-W5HOOK-029: creating a bag without a name does nothing', async () => {
    let posted = false
    server.use(http.post('/api/trips/1/packing/bags', () => { posted = true; return HttpResponse.json({ bag: {} }) }))
    const { result } = renderPanel()

    act(() => result.current.setNewBagName('  '))
    await act(async () => { await result.current.handleCreateBag() })

    expect(posted).toBe(false)
  })

  it('FE-W5HOOK-030: creating a bag appends it and clears the form', async () => {
    server.use(
      http.post('/api/trips/1/packing/bags', () =>
        HttpResponse.json({ bag: { id: 3, name: 'Duffel', color: '#6366f1' } })),
    )
    const { result } = renderPanel()
    await settled()

    act(() => { result.current.setNewBagName('Duffel'); result.current.setShowAddBag(true) })
    await act(async () => { await result.current.handleCreateBag() })

    expect(result.current.bags).toEqual([{ id: 3, name: 'Duffel', color: '#6366f1' }])
    expect(result.current.newBagName).toBe('')
    expect(result.current.showAddBag).toBe(false)
  })

  it('FE-W5HOOK-031: a failing bag create surfaces a save error', async () => {
    server.use(http.post('/api/trips/1/packing/bags', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    act(() => result.current.setNewBagName('Duffel'))
    await act(async () => { await result.current.handleCreateBag() })

    expect(toastSpy).toHaveBeenCalledWith('Failed to save', 'error', undefined)
  })

  it('FE-W5HOOK-032: creating a bag by name returns the new bag', async () => {
    server.use(
      http.post('/api/trips/1/packing/bags', () =>
        HttpResponse.json({ bag: { id: 4, name: 'Crate', color: '#6366f1' } })),
    )
    const { result } = renderPanel()
    await settled()

    let created: unknown
    await act(async () => { created = await result.current.handleCreateBagByName('Crate') })

    expect(created).toEqual({ id: 4, name: 'Crate', color: '#6366f1' })
    expect(result.current.bags).toHaveLength(1)
  })

  it('FE-W5HOOK-033: a failing create-by-name returns undefined and warns', async () => {
    server.use(http.post('/api/trips/1/packing/bags', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    let created: unknown = 'unset'
    await act(async () => { created = await result.current.handleCreateBagByName('Crate') })

    expect(created).toBeUndefined()
    expect(toastSpy).toHaveBeenCalledWith('Failed to save', 'error', undefined)
  })

  it('FE-W5HOOK-034: deleting a bag drops it from the list', async () => {
    server.use(
      http.get('/api/trips/:id/packing/bags', () =>
        HttpResponse.json({ bags: [{ id: 5, name: 'A' }, { id: 6, name: 'B' }] })),
      http.delete('/api/trips/1/packing/bags/5', () => HttpResponse.json({ success: true })),
    )
    const { result } = renderPanel()
    await waitFor(() => expect(result.current.bags).toHaveLength(2))

    await act(async () => { await result.current.handleDeleteBag(5) })

    expect(result.current.bags.map(b => b.id)).toEqual([6])
  })

  it('FE-W5HOOK-035: a failing bag delete surfaces a delete error', async () => {
    server.use(http.delete('/api/trips/1/packing/bags/5', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleDeleteBag(5) })

    expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined)
  })

  it('FE-W5HOOK-036: updating a bag merges the response into that bag only', async () => {
    server.use(
      http.get('/api/trips/:id/packing/bags', () =>
        HttpResponse.json({ bags: [{ id: 5, name: 'A' }, { id: 6, name: 'B' }] })),
      http.put('/api/trips/1/packing/bags/6', () => HttpResponse.json({ bag: { name: 'Renamed' } })),
    )
    const { result } = renderPanel()
    await waitFor(() => expect(result.current.bags).toHaveLength(2))

    await act(async () => { await result.current.handleUpdateBag(6, { name: 'Renamed' }) })

    expect(result.current.bags.map(b => b.name)).toEqual(['A', 'Renamed'])
  })

  it('FE-W5HOOK-037: a failing bag update surfaces a generic error', async () => {
    server.use(http.put('/api/trips/1/packing/bags/6', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleUpdateBag(6, { name: 'X' }) })

    expect(toastSpy).toHaveBeenCalledWith('Error', 'error', undefined)
  })

  it('FE-W5HOOK-038: setting bag members replaces that bag members', async () => {
    server.use(
      http.get('/api/trips/:id/packing/bags', () =>
        HttpResponse.json({ bags: [{ id: 5, name: 'A', members: [] }, { id: 6, name: 'B', members: [] }] })),
      http.put('/api/trips/1/packing/bags/5/members', () =>
        HttpResponse.json({ members: [{ user_id: 2, username: 'alice' }] })),
    )
    const { result } = renderPanel()
    await waitFor(() => expect(result.current.bags).toHaveLength(2))

    await act(async () => { await result.current.handleSetBagMembers(5, [2]) })

    expect(result.current.bags[0].members).toEqual([{ user_id: 2, username: 'alice' }])
    expect(result.current.bags[1].members).toEqual([])
  })

  it('FE-W5HOOK-039: a failing member update surfaces a generic error', async () => {
    server.use(http.put('/api/trips/1/packing/bags/5/members', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleSetBagMembers(5, [2]) })

    expect(toastSpy).toHaveBeenCalledWith('Error', 'error', undefined)
  })
})

describe('usePackingList — templates, import and signals', () => {
  it('FE-W5HOOK-040: a template list response without templates falls back to an empty list', async () => {
    server.use(http.get('/api/trips/:id/packing/templates', () => HttpResponse.json({})))
    const { result } = renderPanel()

    await settled()
    expect(result.current.availableTemplates).toEqual([])
  })

  it('FE-W5HOOK-041: applying a template appends its items and reports the count', async () => {
    const fresh = buildPackingItem({ id: 61, name: 'Towel' })
    server.use(http.post('/api/trips/1/packing/apply-template/2', () => HttpResponse.json({ items: [fresh], count: 1 })))
    const { result } = renderPanel()

    act(() => result.current.setShowTemplateDropdown(true))
    await act(async () => { await result.current.handleApplyTemplate(2) })

    expect(useTripStore.getState().packingItems).toContainEqual(fresh)
    expect(toastSpy).toHaveBeenCalledWith('1 items added from template', 'success', undefined)
    expect(result.current.showTemplateDropdown).toBe(false)
    expect(result.current.applyingTemplate).toBe(false)
  })

  it('FE-W5HOOK-041a: a template response without items leaves the store untouched', async () => {
    server.use(http.post('/api/trips/1/packing/apply-template/2', () => HttpResponse.json({ count: 0 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleApplyTemplate(2) })

    expect(useTripStore.getState().packingItems).toEqual([])
    expect(toastSpy).toHaveBeenCalledWith('0 items added from template', 'success', undefined)
  })

  it('FE-W5HOOK-042: a failing template apply surfaces a template error', async () => {
    server.use(http.post('/api/trips/1/packing/apply-template/2', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleApplyTemplate(2) })

    expect(toastSpy).toHaveBeenCalledWith('Failed to apply template', 'error', undefined)
    expect(result.current.applyingTemplate).toBe(false)
  })

  it('FE-W5HOOK-043: saving a template without a name does nothing', async () => {
    let posted = false
    server.use(http.post('/api/trips/1/packing/save-as-template', () => { posted = true; return HttpResponse.json({}) }))
    const { result } = renderPanel()

    await act(async () => { await result.current.handleSaveAsTemplate() })

    expect(posted).toBe(false)
  })

  it('FE-W5HOOK-044: saving a template reloads the list and clears the form', async () => {
    server.use(
      http.post('/api/trips/1/packing/save-as-template', () => HttpResponse.json({ success: true })),
      // The reload response omits `templates` — the hook must fall back to [].
      http.get('/api/trips/:id/packing/templates', () => HttpResponse.json({})),
    )
    const { result } = renderPanel()

    act(() => { result.current.setSaveTemplateName('Beach'); result.current.setShowSaveTemplate(true) })
    await act(async () => { await result.current.handleSaveAsTemplate() })

    expect(toastSpy).toHaveBeenCalledWith('Packing list saved as template', 'success', undefined)
    expect(result.current.showSaveTemplate).toBe(false)
    expect(result.current.saveTemplateName).toBe('')
    await waitFor(() => expect(result.current.availableTemplates).toEqual([]))
  })

  it('FE-W5HOOK-045: a failing template save surfaces a generic error', async () => {
    server.use(http.post('/api/trips/1/packing/save-as-template', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    act(() => result.current.setSaveTemplateName('Beach'))
    await act(async () => { await result.current.handleSaveAsTemplate() })

    expect(toastSpy).toHaveBeenCalledWith('Error', 'error', undefined)
  })

  it('FE-W5HOOK-046: importing nothing reports an empty import', async () => {
    const { result } = renderPanel()

    await act(async () => { await result.current.handleBulkImport() })

    expect(toastSpy).toHaveBeenCalledWith('No items to import', 'error', undefined)
  })

  it('FE-W5HOOK-047: a successful import appends the items and closes the modal', async () => {
    const imported = buildPackingItem({ id: 71, name: 'Rope' })
    server.use(http.post('/api/trips/1/packing/import', () => HttpResponse.json({ items: [imported], count: 1 })))
    const { result } = renderPanel()

    act(() => { result.current.setImportText('Gear, Rope'); result.current.setShowImportModal(true) })
    await act(async () => { await result.current.handleBulkImport() })

    expect(useTripStore.getState().packingItems).toContainEqual(imported)
    expect(toastSpy).toHaveBeenCalledWith('1 items imported', 'success', undefined)
    expect(result.current.importText).toBe('')
    expect(result.current.showImportModal).toBe(false)
  })

  it('FE-W5HOOK-047a: an import response without items still reports success', async () => {
    server.use(http.post('/api/trips/1/packing/import', () => HttpResponse.json({ count: 0 })))
    const { result } = renderPanel()

    act(() => result.current.setImportText('Gear, Rope'))
    await act(async () => { await result.current.handleBulkImport() })

    expect(useTripStore.getState().packingItems).toEqual([])
    expect(toastSpy).toHaveBeenCalledWith('0 items imported', 'success', undefined)
  })

  it('FE-W5HOOK-048: a failing import surfaces an import error', async () => {
    server.use(http.post('/api/trips/1/packing/import', () => new HttpResponse(null, { status: 500 })))
    const { result } = renderPanel()

    act(() => result.current.setImportText('Gear, Rope'))
    await act(async () => { await result.current.handleBulkImport() })

    expect(toastSpy).toHaveBeenCalledWith('Import failed', 'error', undefined)
  })

  it('FE-W5HOOK-049: picking a CSV file loads its text into the import box', async () => {
    const { result } = renderPanel()
    const file = new File(['Gear, Rope'], 'list.csv', { type: 'text/plain' })
    const target = { files: [file], value: 'list.csv' } as unknown as HTMLInputElement

    act(() => result.current.handleCsvFile({ target } as unknown as ChangeEvent<HTMLInputElement>))

    await waitFor(() => expect(result.current.importText).toBe('Gear, Rope'))
    expect(target.value).toBe('')
  })

  it('FE-W5HOOK-050: an empty file picker selection is ignored', async () => {
    const { result } = renderPanel()
    const target = { files: null, value: 'x' } as unknown as HTMLInputElement

    act(() => result.current.handleCsvFile({ target } as unknown as ChangeEvent<HTMLInputElement>))

    await settled()
    expect(result.current.importText).toBe('')
    // The input is only reset once a file was actually taken.
    expect(target.value).toBe('x')
  })

  it('FE-W5HOOK-051: a non-text read result is ignored', async () => {
    class BinaryReader {
      result: unknown = new ArrayBuffer(4)
      onload: (() => void) | null = null
      readAsText() { this.onload?.() }
    }
    vi.stubGlobal('FileReader', BinaryReader)
    const { result } = renderPanel()
    const file = new File(['x'], 'list.csv')
    const target = { files: [file], value: 'list.csv' } as unknown as HTMLInputElement

    act(() => result.current.handleCsvFile({ target } as unknown as ChangeEvent<HTMLInputElement>))

    await settled()
    expect(result.current.importText).toBe('')
  })

  it('FE-W5HOOK-052: a raised import signal opens the import modal', async () => {
    const { result, rerender } = renderPanel({ openImportSignal: 0 })
    await settled()

    rerender({ tripId: 1, items: [], openImportSignal: 1 })

    expect(result.current.showImportModal).toBe(true)
  })

  it('FE-W5HOOK-053: a raised save-template signal opens the save form', async () => {
    const { result, rerender } = renderPanel({ saveTemplateSignal: 0 })
    await settled()

    rerender({ tripId: 1, items: [], saveTemplateSignal: 1 })

    expect(result.current.showSaveTemplate).toBe(true)
  })

  it('FE-W5HOOK-054: a raised clear-checked signal runs the bulk delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const items = [buildPackingItem({ id: 81, checked: 1 })]
    let deleted = false
    server.use(http.delete('/api/trips/1/packing/81', () => { deleted = true; return HttpResponse.json({ success: true }) }))
    const { rerender } = renderPanel({ items, clearCheckedSignal: 0 })
    await settled()

    await act(async () => { rerender({ tripId: 1, items, clearCheckedSignal: 1 }) })

    await waitFor(() => expect(deleted).toBe(true))
  })

  it('FE-W5HOOK-055: a mousedown outside the template dropdown closes it', async () => {
    const { result } = renderPanel()
    await settled()

    act(() => { result.current.setShowTemplateDropdown(true) })
    act(() => { result.current.templateDropdownRef.current = document.createElement('div') })
    act(() => { document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })) })

    expect(result.current.showTemplateDropdown).toBe(false)
  })

  it('FE-W5HOOK-055a: a mousedown inside the template dropdown keeps it open', async () => {
    const { result } = renderPanel()
    await settled()

    const dropdown = document.createElement('div')
    const child = document.createElement('button')
    dropdown.appendChild(child)
    document.body.appendChild(dropdown)

    act(() => { result.current.setShowTemplateDropdown(true) })
    act(() => { result.current.templateDropdownRef.current = dropdown })
    act(() => { child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })) })

    expect(result.current.showTemplateDropdown).toBe(true)
    document.body.removeChild(dropdown)
  })
})

describe('usePackingList — permissions and sharing', () => {
  it('FE-W5HOOK-056: a restricted packing_edit permission removes edit rights', async () => {
    usePermissionsStore.setState({ permissions: { packing_edit: 'admin' } })
    seedStore(useAuthStore, { user: buildUser({ id: 2 }), isAuthenticated: true })
    const { result } = renderPanel()

    await settled()
    expect(result.current.canEdit).toBe(false)
    expect(result.current.isAdmin).toBe(false)
  })

  it('FE-W5HOOK-057: an admin keeps edit rights and the admin flag', async () => {
    usePermissionsStore.setState({ permissions: { packing_edit: 'admin' } })
    seedStore(useAuthStore, { user: buildAdmin({ id: 3 }), isAuthenticated: true })
    const { result } = renderPanel()

    await settled()
    expect(result.current.canEdit).toBe(true)
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.currentUserId).toBe(3)
  })

  it('FE-W5HOOK-058: the sharing handlers delegate to the packing endpoints', async () => {
    const item = buildPackingItem({ id: 91, name: 'Stove' })
    seedStore(useTripStore, { packingItems: [item] })
    let sharingBody: Record<string, unknown> | null = null
    const hits: string[] = []
    server.use(
      http.put('/api/trips/1/packing/91/sharing', async ({ request }) => {
        sharingBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ item })
      }),
      http.post('/api/trips/1/packing/91/clone', () => { hits.push('clone'); return HttpResponse.json({ item }) }),
      http.post('/api/trips/1/packing/91/contributors', () => { hits.push('join'); return HttpResponse.json({ item }) }),
      http.delete('/api/trips/1/packing/91/contributors/2', () => { hits.push('leave'); return HttpResponse.json({ item }) }),
    )
    const { result } = renderPanel({ items: [item] })

    await act(async () => { await result.current.handleSetSharing(91, 'shared', [2]) })
    await act(async () => { await result.current.handleCloneItem(91) })
    await act(async () => { await result.current.handleJoinItem(91) })
    await act(async () => { await result.current.handleLeaveItem(91, 2) })

    expect(sharingBody).toEqual({ visibility: 'shared', recipient_ids: [2] })
    expect(hits).toEqual(['clone', 'join', 'leave'])
  })
})
