import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RenderResult } from '@testing-library/react'
import { packingApi } from '../../../../src/api/client'
import MPackingListTab from '../../../../src/mobile/screens/trip/tabs/MPackingListTab'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAddonStore } from '../../../../src/store/addonStore'
import { useAuthStore } from '../../../../src/store/authStore'
import { useTripStore } from '../../../../src/store/tripStore'
import type { PackingBag, PackingItem, TripMember } from '../../../../src/types'
import { buildUser } from '../../../helpers/factories'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { act, fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-PACKTAB-001 to FE-MOB-PACKTAB-046 (plus 060-062)

const ME = 7
const ANNA = { id: 11, username: 'anna', avatar: null, avatar_url: 'https://cdn.example/anna.png' } as unknown as TripMember
const BEN = { id: 12, username: 'ben', avatar: null, avatar_url: null } as unknown as TripMember

function packItem(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: 1, trip_id: 3, name: 'Passport', checked: 0, category: 'Documents', sort_order: 0,
    is_private: 0, owner_id: null,
    ...overrides,
  } as PackingItem
}

const ITEMS: PackingItem[] = [
  packItem({ id: 1, name: 'Passport', category: 'Documents', checked: 1 }),
  packItem({ id: 2, name: 'Visa', category: 'Documents' }),
  packItem({ id: 3, name: 'Socks', category: 'Clothing', quantity: 3, weight_grams: 120 }),
  packItem({ id: 4, name: 'Shirt', category: 'Clothing', checked: 1 }),
  packItem({ id: 5, name: 'Diary', category: 'Private', is_private: 1, owner_id: ME }),
]

const BAGS: PackingBag[] = [
  { id: 71, trip_id: 3, name: 'Backpack', color: '#6366f1', sort_order: 0, members: [] } as PackingBag,
]

const TEMPLATES = [{ id: 91, name: 'Beach trip', item_count: 12 }]

/** The tab appends this zero-width space to keep a duplicate category name distinguishable. */
const ZERO_WIDTH = '​'

interface SetupOptions {
  items?: PackingItem[]
  planner?: Partial<TripPlanner>
  admin?: boolean
  bagTracking?: boolean
}

async function setup(opts: SetupOptions = {}) {
  seedStore(useAuthStore, { user: buildUser({ id: ME, role: opts.admin ? 'admin' : 'user' }) })
  if (opts.bagTracking) seedStore(useAddonStore, { bagTracking: true })
  const planner = buildPlanner({ tripId: 3, packingItems: opts.items ?? ITEMS, ...opts.planner })
  let view!: RenderResult
  await act(async () => { view = render(<MPackingListTab planner={planner} />) })
  return { planner, view }
}

/** The category card that owns the given title. */
function card(category: string): HTMLElement {
  return screen.getByText(category).closest('div.rounded-2xl') as HTMLElement
}

/** The row of an item, found via its checkbox (aria-label = item name). */
function itemRow(name: string): HTMLElement {
  return screen.getByRole('button', { name }).parentElement as HTMLElement
}

function openActions() {
  fireEvent.click(screen.getByRole('button', { name: 'packing.actions' }))
}

function enterEditMode() {
  fireEvent.click(screen.getByRole('button', { name: /common.edit/ }))
}

function openCategoryMenu(category: string) {
  fireEvent.click(within(card(category)).getByRole('button', { name: 'packing.categoryOptions' }))
}

function asMock(fn: unknown): ReturnType<typeof vi.fn> {
  return fn as ReturnType<typeof vi.fn>
}

describe('MPackingListTab', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useTripStore, { packingItems: [] })
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: BAGS })
    vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: TEMPLATES })
    vi.spyOn(packingApi, 'getCategoryAssignees').mockResolvedValue({ assignees: {} })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Progress card + chrome ────────────────────────────────────────────

  it('FE-MOB-PACKTAB-001: shows checked/total and the percentage of the common list', async () => {
    await setup()
    expect(screen.getByText('2/4')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-002: hides the bags button while bag tracking is off', async () => {
    await setup()
    expect(screen.queryByRole('button', { name: 'packing.bags' })).toBeNull()
    expect(packingApi.listBags).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-003: loads the bags and opens the bags sheet', async () => {
    await setup({ bagTracking: true })
    expect(packingApi.listBags).toHaveBeenCalledWith(3)

    fireEvent.click(screen.getAllByRole('button', { name: 'packing.bags' })[0])

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'packing.bags')
    expect(within(dialog).getByText('Backpack')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-004: toggles edit mode', async () => {
    await setup()
    const toggle = screen.getByRole('button', { name: 'common.edit' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'packing.editDone' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-PACKTAB-005: read-only members get neither edit nor the action menu', async () => {
    await setup({ planner: { can: vi.fn(() => false) } as Partial<TripPlanner> })
    expect(screen.queryByRole('button', { name: 'common.edit' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'packing.actions' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'packing.addCategory' })).toBeNull()
  })

  it('FE-MOB-PACKTAB-006: survives failing mount requests', async () => {
    vi.mocked(packingApi.listBags).mockRejectedValue(new Error('x'))
    vi.mocked(packingApi.listTemplates).mockRejectedValue(new Error('x'))
    vi.mocked(packingApi.getCategoryAssignees).mockRejectedValue(new Error('x'))

    await setup({ bagTracking: true })
    openActions()

    expect(screen.getByText('2/4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.import' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.applyTemplate' })).toBeNull()
  })

  // ── Action menu ───────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-007: the action menu offers clear/apply/import to a non-admin', async () => {
    await setup()
    openActions()

    expect(screen.getByRole('button', { name: 'packing.clearChecked:2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.applyTemplate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.import' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.saveAsTemplate' })).toBeNull()
  })

  it('FE-MOB-PACKTAB-008: admins additionally get save-as-template', async () => {
    await setup({ admin: true })
    openActions()
    expect(screen.getByRole('button', { name: 'packing.saveAsTemplate' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-009: hides clear + apply when nothing is checked and no template exists', async () => {
    vi.mocked(packingApi.listTemplates).mockResolvedValue({ templates: [] })
    await setup({ items: [packItem({ id: 1, name: 'Visa' })] })
    openActions()

    expect(screen.queryByRole('button', { name: /packing.clearChecked/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'packing.applyTemplate' })).toBeNull()
    expect(screen.getByRole('button', { name: 'packing.import' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-010: clearing checked items deletes each of them after confirmation', async () => {
    const { planner } = await setup()
    openActions()

    fireEvent.click(screen.getByRole('button', { name: 'packing.clearChecked:2' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('packing.confirm.clearChecked:2')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.tripActions.deletePackingItem).toHaveBeenCalledTimes(2))
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledWith(3, 1)
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledWith(3, 4)
  })

  it('FE-MOB-PACKTAB-011: a failed clear surfaces the delete error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.deletePackingItem).mockRejectedValueOnce(new Error('x'))
    openActions()

    fireEvent.click(screen.getByRole('button', { name: 'packing.clearChecked:2' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError'))
  })

  it('FE-MOB-PACKTAB-012: cancelling the clear dialog deletes nothing', async () => {
    const { planner } = await setup()
    openActions()

    fireEvent.click(screen.getByRole('button', { name: 'packing.clearChecked:2' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.cancel' }))

    expect(planner.tripActions.deletePackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-013: applies a template and appends its items to the store', async () => {
    const applied = [packItem({ id: 30, name: 'Towel', category: 'Beach' })]
    vi.spyOn(packingApi, 'applyTemplate').mockResolvedValue({ items: applied, count: 1 })
    const { planner } = await setup()

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.applyTemplate' }))
    expect(screen.getByText('12 admin.packingTemplates.items')).toBeInTheDocument()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Beach trip/ })) })

    // The visibility follows the Shared|My-list toggle so the items land where
    // the user can see them.
    expect(packingApi.applyTemplate).toHaveBeenCalledWith(3, 91, 'common')
    expect(planner.toast.success).toHaveBeenCalledWith('packing.templateApplied:1')
    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([30])
    expect(screen.queryByRole('button', { name: /Beach trip/ })).toBeNull()
  })

  it('FE-MOB-PACKTAB-014: reports a failing template', async () => {
    vi.spyOn(packingApi, 'applyTemplate').mockRejectedValue(new Error('x'))
    const { planner } = await setup()

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.applyTemplate' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Beach trip/ })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.templateError')
  })

  it('FE-MOB-PACKTAB-015: saves the list as a template and reloads the template list', async () => {
    vi.spyOn(packingApi, 'saveAsTemplate').mockResolvedValue({ ok: true })
    const { planner } = await setup({ admin: true })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.saveAsTemplate' }))
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('packing.templateName'), { target: { value: '  Summer  ' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.save' })) })

    expect(packingApi.saveAsTemplate).toHaveBeenCalledWith(3, 'Summer')
    expect(planner.toast.success).toHaveBeenCalledWith('packing.templateSaved')
    expect(packingApi.listTemplates).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PACKTAB-016: Enter submits the template name, blank input does nothing', async () => {
    vi.spyOn(packingApi, 'saveAsTemplate').mockResolvedValue({ ok: true })
    await setup({ admin: true })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.saveAsTemplate' }))
    const input = screen.getByPlaceholderText('packing.templateName')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(packingApi.saveAsTemplate).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Winter' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(packingApi.saveAsTemplate).toHaveBeenCalledWith(3, 'Winter')
  })

  it('FE-MOB-PACKTAB-017: reports a failing template save', async () => {
    vi.spyOn(packingApi, 'saveAsTemplate').mockRejectedValue(new Error('x'))
    const { planner } = await setup({ admin: true })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.saveAsTemplate' }))
    fireEvent.change(screen.getByPlaceholderText('packing.templateName'), { target: { value: 'Summer' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.save' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('common.error')
  })

  it('FE-MOB-PACKTAB-018: the import row opens the import sheet', async () => {
    await setup()
    openActions()

    fireEvent.click(screen.getByRole('button', { name: 'packing.import' }))

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'packing.importTitle')
  })

  // ── Filters + empty states ────────────────────────────────────────────

  it('FE-MOB-PACKTAB-019: the personal view shows only private items', async () => {
    await setup()
    expect(screen.queryByText('Diary')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))

    expect(screen.getByText('Diary')).toBeInTheDocument()
    expect(screen.queryByText('Passport')).toBeNull()
    expect(screen.getByText('0%')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewCommon' }))

    expect(screen.getByText('Passport')).toBeInTheDocument()
    expect(screen.queryByText('Diary')).toBeNull()
  })

  it('FE-MOB-PACKTAB-020: an empty personal list shows its own hint', async () => {
    await setup({ items: ITEMS.filter(i => !i.is_private) })

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))

    expect(screen.getByText('packing.personalEmptyHint')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-021: the open/done filters narrow the categories', async () => {
    await setup()

    fireEvent.click(screen.getByRole('button', { name: 'packing.filterDone' }))
    expect(screen.getByText('Passport')).toBeInTheDocument()
    expect(screen.queryByText('Visa')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'packing.filterOpen' }))
    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.queryByText('Passport')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'packing.filterAll' }))
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-022: a filter that matches nothing shows the filtered-empty hint', async () => {
    await setup({ items: [packItem({ id: 1, name: 'Visa' })] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.filterDone' }))

    expect(screen.getByText('packing.emptyFiltered')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-023: an empty list shows the mascot empty state and no filters', async () => {
    await setup({ items: [] })

    expect(screen.getByText('packing.emptyTitle')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.filterAll' })).toBeNull()
    expect(screen.getByRole('button', { name: 'packing.addCategory' })).toBeInTheDocument()
  })

  // ── Categories ────────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-024: adds a category as a placeholder item', async () => {
    const { planner } = await setup({ items: [] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { target: { value: '  Gear  ' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.add' })) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, {
      name: '...', category: 'Gear', visibility: 'common',
    })
    expect(screen.getByRole('button', { name: 'packing.addCategory' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-025: a duplicate category name is disambiguated', async () => {
    const { planner } = await setup()
    enterEditMode()

    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    const input = screen.getByPlaceholderText('packing.newCategoryPlaceholder')
    fireEvent.change(input, { target: { value: 'Documents' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, {
      name: '...', category: `Documents${ZERO_WIDTH}`, visibility: 'common',
    })
  })

  it('FE-MOB-PACKTAB-026: a category added from the personal view is private', async () => {
    const { planner } = await setup()
    enterEditMode()
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))

    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    fireEvent.change(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { target: { value: 'Books' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.add' })) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, {
      name: '...', category: 'Books', visibility: 'personal',
    })
  })

  it('FE-MOB-PACKTAB-027: Escape aborts the new-category field and errors are reported', async () => {
    const { planner } = await setup({ items: [] })
    asMock(planner.tripActions.addPackingItem).mockRejectedValueOnce(new Error('x'))

    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    fireEvent.change(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { target: { value: 'Gear' } })
    await act(async () => { fireEvent.keyDown(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { key: 'Enter' }) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.addError')

    fireEvent.keyDown(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'packing.addCategory' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-028: collapses a category by click and by keyboard', async () => {
    await setup()
    const header = within(card('Documents')).getByRole('button', { expanded: true })

    fireEvent.click(header)
    expect(screen.queryByText('Passport')).toBeNull()

    fireEvent.keyDown(header, { key: 'Enter' })
    expect(screen.getByText('Passport')).toBeInTheDocument()

    fireEvent.keyDown(header, { key: ' ' })
    expect(screen.queryByText('Passport')).toBeNull()

    fireEvent.keyDown(header, { key: 'a' })
    expect(screen.queryByText('Passport')).toBeNull()
  })

  it('FE-MOB-PACKTAB-029: renames a category across all its items', async () => {
    const { planner } = await setup()
    enterEditMode()
    openCategoryMenu('Documents')

    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    const input = screen.getByDisplayValue('Documents')
    fireEvent.click(input)
    fireEvent.change(input, { target: { value: 'Papers' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { category: 'Papers' })
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 2, { category: 'Papers' })
  })

  it('FE-MOB-PACKTAB-030: an unchanged or blank rename is dropped, Escape reverts', async () => {
    const { planner } = await setup()
    enterEditMode()
    openCategoryMenu('Documents')

    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    fireEvent.blur(screen.getByDisplayValue('Documents'))
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()

    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    const input = screen.getByDisplayValue('Documents')
    fireEvent.change(input, { target: { value: 'Nope' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-031: a failing rename surfaces the rename error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.updatePackingItem).mockRejectedValueOnce(new Error('x'))
    enterEditMode()
    openCategoryMenu('Documents')

    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    const input = screen.getByDisplayValue('Documents')
    fireEvent.change(input, { target: { value: 'Papers' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.renameError')
  })

  it('FE-MOB-PACKTAB-032: checks and unchecks a whole category', async () => {
    const { planner } = await setup()
    enterEditMode()

    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuCheckAll' })) })
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledTimes(1)
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 2, true)

    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuUncheckAll' })) })
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 1, false)
  })

  it('FE-MOB-PACKTAB-033: a failing bulk check surfaces the save error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.togglePackingItem).mockRejectedValueOnce(new Error('x'))
    enterEditMode()

    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuCheckAll' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')
  })

  it('FE-MOB-PACKTAB-034: a failing bulk uncheck surfaces the save error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.togglePackingItem).mockRejectedValueOnce(new Error('x'))
    enterEditMode()

    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuUncheckAll' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')
  })

  it('FE-MOB-PACKTAB-035: deleting a category removes every item after confirmation', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.deletePackingItem).mockRejectedValueOnce(new Error('x'))
    enterEditMode()

    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuDeleteCat' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('packing.confirm.deleteCat:Documents,2')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError'))
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PACKTAB-036: cancelling the category delete keeps the items', async () => {
    const { planner } = await setup()
    enterEditMode()

    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuDeleteCat' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.cancel' }))

    expect(planner.tripActions.deletePackingItem).not.toHaveBeenCalled()
  })

  // ── Category assignees ────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-037: assigns and unassigns members of a category', async () => {
    const both = [{ user_id: 11, username: 'anna' }, { user_id: 12, username: 'ben' }]
    vi.mocked(packingApi.getCategoryAssignees).mockResolvedValue({ assignees: { Documents: [both[0]] } })
    const setAssignees = vi.spyOn(packingApi, 'setCategoryAssignees').mockResolvedValue({ assignees: both })
    await setup({ planner: { tripMembers: [ANNA, BEN] } as Partial<TripPlanner> })
    enterEditMode()

    fireEvent.click(within(card('Documents')).getByRole('button', { name: 'packing.assignMembers' }))
    await act(async () => { fireEvent.click(within(card('Documents')).getByRole('button', { name: 'ben' })) })
    expect(setAssignees).toHaveBeenCalledWith(3, 'Documents', [11, 12])

    // The response made both members assigned — tapping anna now removes her.
    await act(async () => { fireEvent.click(within(card('Documents')).getByRole('button', { name: 'anna' })) })
    expect(setAssignees).toHaveBeenLastCalledWith(3, 'Documents', [12])
  })

  it('FE-MOB-PACKTAB-038: a failing assignee update surfaces the save error', async () => {
    vi.spyOn(packingApi, 'setCategoryAssignees').mockRejectedValue(new Error('x'))
    const { planner } = await setup({ planner: { tripMembers: [ANNA] } as Partial<TripPlanner> })
    enterEditMode()

    fireEvent.click(within(card('Documents')).getByRole('button', { name: 'packing.assignMembers' }))
    await act(async () => { fireEvent.click(within(card('Documents')).getByRole('button', { name: 'anna' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')
  })

  it('FE-MOB-PACKTAB-039: a trip without members shows the assign hint', async () => {
    await setup()
    enterEditMode()

    fireEvent.click(within(card('Documents')).getByRole('button', { name: 'packing.assignMembers' }))

    expect(screen.getByText('packing.noMembers')).toBeInTheDocument()
  })

  // ── Items ─────────────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-040: adds an item to a category', async () => {
    const { planner } = await setup()
    enterEditMode()

    fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' }))
    const input = within(card('Clothing')).getByPlaceholderText('packing.addItemPlaceholder')
    expect(within(card('Clothing')).getByRole('button', { name: 'common.add' })).toBeDisabled()
    fireEvent.change(input, { target: { value: '  Hat  ' } })
    await act(async () => { fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'common.add' })) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, {
      name: 'Hat', category: 'Clothing', visibility: 'common',
    })
  })

  it('FE-MOB-PACKTAB-041: a category placeholder is renamed instead of adding a second row', async () => {
    const items = [packItem({ id: 1, name: 'Passport', category: 'Documents' }), packItem({ id: 9, name: '...', category: 'Gear' })]
    const { planner } = await setup({ items })
    enterEditMode()

    fireEvent.click(within(card('Gear')).getByRole('button', { name: 'packing.addItem' }))
    const input = within(card('Gear')).getByPlaceholderText('packing.addItemPlaceholder')
    fireEvent.change(input, { target: { value: 'Rope' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 9, { name: 'Rope' })
    expect(planner.tripActions.addPackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-042: Escape aborts the add-item field and failures are reported', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.addPackingItem).mockRejectedValueOnce(new Error('x'))
    enterEditMode()

    fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' }))
    const input = within(card('Clothing')).getByPlaceholderText('packing.addItemPlaceholder')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(planner.tripActions.addPackingItem).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Hat' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.addError')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-043: toggles an item and shows its quantity badge', async () => {
    const { planner } = await setup()

    fireEvent.click(screen.getByRole('button', { name: 'Socks' }))
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 3, true)

    fireEvent.click(screen.getByRole('button', { name: 'Passport' }))
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 1, false)

    expect(within(itemRow('Socks')).getByText('3×')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Passport' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-PACKTAB-044: shows the placeholder label instead of the sentinel name', async () => {
    await setup({ items: [packItem({ id: 9, name: '...', category: 'Gear' })] })
    expect(screen.getByText('packing.addItemPlaceholder')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-045: shows weights in edit mode while bag tracking is on', async () => {
    await setup({ bagTracking: true })
    enterEditMode()

    // The row shows the unit weight, not quantity x weight; a row without one
    // says nothing rather than spending width on a dash (#1525).
    expect(within(itemRow('Socks')).getByText('120 g')).toBeInTheDocument()
    expect(within(itemRow('Shirt')).queryByText('— g')).not.toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-046: opens the item editor from the row', async () => {
    await setup()
    enterEditMode()

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }))

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'packing.editItem')
  })

  it('FE-MOB-PACKTAB-047: deletes a normal item outright', async () => {
    const { planner } = await setup()
    enterEditMode()

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.delete' })) })

    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledWith(3, 3)
  })

  it('FE-MOB-PACKTAB-048: the last item of a custom category is reset to a placeholder', async () => {
    const items = [
      packItem({ id: 1, name: 'Passport', category: 'Documents' }),
      packItem({ id: 8, name: 'Rope', category: 'Gear', checked: 1, quantity: 2, weight_grams: 90 }),
    ]
    const { planner } = await setup({ items })
    enterEditMode()

    fireEvent.click(within(itemRow('Rope')).getByRole('button', { name: 'mobileTrip.more' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.delete' })) })

    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 8, false)
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 8, {
      name: '...', weight_grams: null, bag_id: null, quantity: 1,
    })
    expect(planner.tripActions.deletePackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-049: a failing item delete surfaces the delete error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.deletePackingItem).mockRejectedValueOnce(new Error('x'))
    enterEditMode()

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.delete' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError')
  })

  // ── Sharing badges ────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-050: badges an item somebody else takes care of', async () => {
    const items = [packItem({ id: 1, name: 'Tent', is_private: 1, owner_id: 21, owner_username: 'owner' })]
    await setup({ items })

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))

    expect(screen.getByLabelText('packing.takenCareOf:owner')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-051: badges how many people my shared item covers', async () => {
    const items = [packItem({
      id: 1, name: 'Tent', is_private: 1, owner_id: ME, owner_username: 'me',
      recipients: [{ user_id: 11, username: 'anna' }, { user_id: 12, username: 'ben' }],
    })]
    await setup({ items })

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))

    expect(screen.getByLabelText('packing.sharedWithCount:2')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-052: shows the owner avatar and the contributor count on a common item', async () => {
    const items = [packItem({
      id: 1, name: 'Tent', owner_id: 11, owner_username: 'anna',
      contributors: [{ user_id: 12, username: 'ben', status: 'pledged' }],
    })]
    const member = { ...ANNA, avatar_url: 'https://cdn.example/anna.png' } as unknown as TripMember
    await setup({ items, planner: { tripMembers: [member] } as Partial<TripPlanner> })

    expect(within(itemRow('Tent')).getByAltText('anna')).toHaveAttribute('src', 'https://cdn.example/anna.png')
    expect(within(itemRow('Tent')).getByText('+1')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-053: falls back to the owner initial when there is no avatar', async () => {
    const items = [packItem({ id: 1, name: 'Tent', owner_id: 99, owner_username: 'zoe' })]
    await setup({ items })

    expect(within(itemRow('Tent')).getByText('Z')).toBeInTheDocument()
  })

  // ── Bag picker on the row ─────────────────────────────────────────────

  it('FE-MOB-PACKTAB-054: assigns and clears the bag of an item', async () => {
    const { planner } = await setup({ bagTracking: true })

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'packing.bags' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Backpack' })) })
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 3, { bag_id: 71 })

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'packing.bags' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.noBag' })) })
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 3, { bag_id: null })
  })

  it('FE-MOB-PACKTAB-055: a failing bag assignment surfaces the save error', async () => {
    const { planner } = await setup({ bagTracking: true })
    asMock(planner.tripActions.updatePackingItem).mockRejectedValueOnce(new Error('x'))

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'packing.bags' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Backpack' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')
  })

  it('FE-MOB-PACKTAB-056: creates a bag from the row picker and assigns it right away', async () => {
    const created = { id: 72, trip_id: 3, name: 'Duffel', color: '#ec4899', sort_order: 1 } as PackingBag
    vi.spyOn(packingApi, 'createBag').mockResolvedValue({ bag: created })
    const { planner } = await setup({ bagTracking: true })

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'packing.bags' }))
    fireEvent.click(screen.getByRole('button', { name: 'packing.addBag' }))
    const input = screen.getByPlaceholderText('packing.bagName')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(packingApi.createBag).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Duffel' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(packingApi.createBag).toHaveBeenCalledWith(3, { name: 'Duffel', color: '#ec4899' })
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 3, { bag_id: 72 })
  })

  it('FE-MOB-PACKTAB-057: a failing bag creation is reported and assigns nothing', async () => {
    vi.spyOn(packingApi, 'createBag').mockRejectedValue(new Error('x'))
    const { planner } = await setup({ bagTracking: true })

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'packing.bags' }))
    fireEvent.click(screen.getByRole('button', { name: 'packing.addBag' }))
    fireEvent.change(screen.getByPlaceholderText('packing.bagName'), { target: { value: 'Duffel' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.add' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-058: Escape closes the inline bag field', async () => {
    await setup({ bagTracking: true })

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'packing.bags' }))
    fireEvent.click(screen.getByRole('button', { name: 'packing.addBag' }))
    fireEvent.change(screen.getByPlaceholderText('packing.bagName'), { target: { value: 'x' } })
    fireEvent.keyDown(screen.getByPlaceholderText('packing.bagName'), { key: 'Escape' })

    expect(screen.getByRole('button', { name: 'packing.addBag' })).toBeInTheDocument()
  })

  // ── Bags sheet plumbing ───────────────────────────────────────────────

  it('FE-MOB-PACKTAB-059: renames, deletes and re-crews a bag through the sheet', async () => {
    vi.spyOn(packingApi, 'updateBag').mockResolvedValue({ bag: { ...BAGS[0], name: 'Daypack' } })
    vi.spyOn(packingApi, 'setBagMembers').mockResolvedValue({ members: [{ user_id: 11, username: 'anna', avatar: null }] })
    vi.spyOn(packingApi, 'deleteBag').mockResolvedValue({ ok: true })
    await setup({ bagTracking: true, planner: { tripMembers: [ANNA] } as Partial<TripPlanner> })

    fireEvent.click(screen.getAllByRole('button', { name: 'packing.bags' })[0])
    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Backpack' }))
    const nameInput = within(dialog).getByDisplayValue('Backpack')
    fireEvent.change(nameInput, { target: { value: 'Daypack' } })
    await act(async () => { fireEvent.keyDown(nameInput, { key: 'Enter' }) })
    expect(packingApi.updateBag).toHaveBeenCalledWith(3, 71, { name: 'Daypack' })
    expect(within(dialog).getByRole('button', { name: 'Daypack' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.add' }))
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'anna' })) })
    expect(packingApi.setBagMembers).toHaveBeenCalledWith(3, 71, [11])

    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' })) })
    expect(packingApi.deleteBag).toHaveBeenCalledWith(3, 71)
    expect(within(dialog).queryByRole('button', { name: 'Daypack' })).toBeNull()
  })

  it('FE-MOB-PACKTAB-060: reports failures of the bag sheet mutations', async () => {
    vi.spyOn(packingApi, 'updateBag').mockRejectedValue(new Error('x'))
    vi.spyOn(packingApi, 'setBagMembers').mockRejectedValue(new Error('x'))
    vi.spyOn(packingApi, 'deleteBag').mockRejectedValue(new Error('x'))
    const { planner } = await setup({ bagTracking: true, planner: { tripMembers: [ANNA] } as Partial<TripPlanner> })

    fireEvent.click(screen.getAllByRole('button', { name: 'packing.bags' })[0])
    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Backpack' }))
    const nameInput = within(dialog).getByDisplayValue('Backpack')
    fireEvent.change(nameInput, { target: { value: 'Daypack' } })
    await act(async () => { fireEvent.keyDown(nameInput, { key: 'Enter' }) })

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.add' }))
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'anna' })) })

    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' })) })

    expect(planner.toast.error).toHaveBeenCalledWith('common.error')
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError')
  })

  it('FE-MOB-PACKTAB-061: creates a bag from the sheet with the next palette colour', async () => {
    const created = { id: 72, trip_id: 3, name: 'Duffel', color: '#ec4899', sort_order: 1 } as PackingBag
    vi.spyOn(packingApi, 'createBag').mockResolvedValue({ bag: created })
    await setup({ bagTracking: true })

    fireEvent.click(screen.getAllByRole('button', { name: 'packing.bags' })[0])
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'packing.addBag' }))
    const field = within(dialog).getByPlaceholderText('packing.bagName')
    fireEvent.change(field, { target: { value: 'Duffel' } })
    const addRow = field.parentElement as HTMLElement
    await act(async () => { fireEvent.click(within(addRow).getByRole('button', { name: 'common.add' })) })

    expect(packingApi.createBag).toHaveBeenCalledWith(3, { name: 'Duffel', color: '#ec4899' })
    expect(within(dialog).getByRole('button', { name: 'Duffel' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-062: every sheet the tab owns can be dismissed again', async () => {
    await setup({ bagTracking: true })

    fireEvent.click(screen.getAllByRole('button', { name: 'packing.bags' })[0])
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.import' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    enterEditMode()
    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'common.close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  // ── Row width (#1525) ─────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-063: the row actions stay behind one button until it is opened', async () => {
    await setup()
    enterEditMode()

    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    expect(screen.getByRole('button', { name: 'common.edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.delete' })).toBeInTheDocument()

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-064: the menu and the bag picker never stand open together', async () => {
    await setup({ bagTracking: true })
    enterEditMode()

    fireEvent.click(within(itemRow('Socks')).getByRole('button', { name: 'mobileTrip.more' }))
    expect(screen.getByRole('button', { name: 'common.edit' })).toBeInTheDocument()

    // Opening the bag picker on the same row closes the action menu.
    fireEvent.click(within(itemRow('Socks')).getAllByRole('button', { name: 'packing.bags' })[0])
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /packing.noBag/ })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-065: the sharing state is an icon on the row, not a sentence', async () => {
    const items = [packItem({ id: 1, name: 'Tent', is_private: 1, owner_id: 21, owner_username: 'owner' })]
    await setup({ items })
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))

    // The wording is still reachable — it just does not eat the row any more.
    expect(screen.queryByText('packing.takenCareOf:owner')).not.toBeInTheDocument()
    expect(screen.getByLabelText('packing.takenCareOf:owner')).toBeInTheDocument()
  })
})
