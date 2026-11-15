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
import * as fileDownload from '../../../../src/utils/fileDownload'

// FE-MOB-PACKTAB-001 to FE-MOB-PACKTAB-066

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

/** The category card that owns the given title (the card comes before any sheet naming it). */
function card(category: string): HTMLElement {
  return screen.getAllByText(category)[0].closest('div.rounded-2xl') as HTMLElement
}

/** The row of an item, found via its checkbox (aria-label = item name). */
function itemRow(name: string): HTMLElement {
  return screen.getByRole('button', { name }).parentElement as HTMLElement
}

function openActions() {
  fireEvent.click(screen.getByRole('button', { name: 'packing.actions' }))
}

function openCategoryMenu(category: string) {
  fireEvent.click(within(card(category)).getByRole('button', { name: 'packing.categoryOptions' }))
}

function openItem(name: string) {
  fireEvent.click(screen.getByRole('button', { name: `${name}, packing.editItem` }))
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

  // ── Progress card ─────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-001: the card says how much of the common list is packed, with one button for the rest', async () => {
    await setup()
    expect(screen.getByText('packing.packedCount:2,4')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.edit' })).toBeNull()
    expect(screen.getByRole('button', { name: 'packing.actions' })).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('FE-MOB-PACKTAB-002: all packed reads as done', async () => {
    await setup({ items: [packItem({ id: 1, checked: 1 })] })
    expect(screen.getByText('packing.allPacked')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-003: without bag tracking the menu has no bags and nothing is loaded', async () => {
    await setup()
    openActions()
    expect(screen.queryByRole('button', { name: 'packing.bags' })).toBeNull()
    expect(packingApi.listBags).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-004: with bag tracking the menu opens the bags sheet', async () => {
    await setup({ bagTracking: true })
    expect(packingApi.listBags).toHaveBeenCalledWith(3)
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.bags' }))

    const dialog = screen.getByRole('dialog', { name: 'packing.bags' })
    expect(within(dialog).getByText('Backpack')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-005: read-only members get no editing in the menu, no add row, no list menu actions', async () => {
    await setup({ planner: { can: vi.fn(() => false) } as Partial<TripPlanner> })
    openActions()
    expect(screen.queryByRole('button', { name: 'packing.addCategory' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'packing.import' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'packing.addItem' })).toBeNull()
    expect(screen.getByRole('button', { name: 'packing.hideDone' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-006: survives failing mount requests', async () => {
    vi.mocked(packingApi.listBags).mockRejectedValue(new Error('x'))
    vi.mocked(packingApi.listTemplates).mockRejectedValue(new Error('x'))
    vi.mocked(packingApi.getCategoryAssignees).mockRejectedValue(new Error('x'))

    await setup({ bagTracking: true })
    openActions()

    expect(screen.getByText('packing.packedCount:2,4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.import' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.applyTemplate' })).toBeNull()
  })

  // ── Action sheet ──────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-007: the action sheet offers add list, apply, import and clear to a non-admin', async () => {
    await setup()
    openActions()

    expect(screen.getByRole('dialog', { name: 'packing.actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.addCategory' })).toBeInTheDocument()
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
    const dialog = await screen.findByRole('dialog', { name: 'packing.clearChecked:2' })
    expect(within(dialog).getByText('packing.confirm.clearChecked:2')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.tripActions.deletePackingItem).toHaveBeenCalledTimes(2))
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledWith(3, 1)
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledWith(3, 4)
  })

  it('FE-MOB-PACKTAB-011: a failed clear surfaces the delete error, a cancelled one deletes nothing', async () => {
    const { planner } = await setup()
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.clearChecked:2' }))
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'packing.clearChecked:2' })).getByRole('button', { name: 'common.cancel' }))
    expect(planner.tripActions.deletePackingItem).not.toHaveBeenCalled()

    asMock(planner.tripActions.deletePackingItem).mockRejectedValueOnce(new Error('x'))
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.clearChecked:2' }))
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'packing.clearChecked:2' })).getByRole('button', { name: 'common.delete' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError'))
  })

  it('FE-MOB-PACKTAB-012: applies a template and appends its items to the store', async () => {
    const applied = [packItem({ id: 30, name: 'Towel', category: 'Beach' })]
    vi.spyOn(packingApi, 'applyTemplate').mockResolvedValue({ items: applied, count: 1 })
    const { planner } = await setup()

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.applyTemplate' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Beach trip/ })) })

    // The visibility follows the Shared|My-list toggle so the items land where
    // the user can see them.
    expect(packingApi.applyTemplate).toHaveBeenCalledWith(3, 91, 'common')
    expect(planner.toast.success).toHaveBeenCalledWith('packing.templateApplied:1')
    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([30])
  })

  it('FE-MOB-PACKTAB-013: reports a failing template', async () => {
    vi.spyOn(packingApi, 'applyTemplate').mockRejectedValue(new Error('x'))
    const { planner } = await setup()

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.applyTemplate' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Beach trip/ })) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.templateError')
  })

  it('FE-MOB-PACKTAB-014: saves the list as a template, Enter included, a blank name does nothing', async () => {
    vi.spyOn(packingApi, 'saveAsTemplate').mockResolvedValue({ ok: true })
    const { planner } = await setup({ admin: true })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.saveAsTemplate' }))
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled()
    const input = screen.getByPlaceholderText('packing.templateName')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(packingApi.saveAsTemplate).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '  Summer  ' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.save' })) })
    expect(packingApi.saveAsTemplate).toHaveBeenCalledWith(3, 'Summer')
    expect(planner.toast.success).toHaveBeenCalledWith('packing.templateSaved')
    expect(packingApi.listTemplates).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PACKTAB-015: reports a failing template save', async () => {
    vi.spyOn(packingApi, 'saveAsTemplate').mockRejectedValue(new Error('x'))
    const { planner } = await setup({ admin: true })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.saveAsTemplate' }))
    fireEvent.change(screen.getByPlaceholderText('packing.templateName'), { target: { value: 'Summer' } })
    await act(async () => { fireEvent.keyDown(screen.getByPlaceholderText('packing.templateName'), { key: 'Enter' }) })

    expect(planner.toast.error).toHaveBeenCalledWith('common.error')
  })

  it('FE-MOB-PACKTAB-016: the import row opens the import sheet', async () => {
    await setup()
    openActions()

    fireEvent.click(screen.getByRole('button', { name: 'packing.import' }))

    expect(await screen.findByRole('dialog', { name: 'packing.importTitle' })).toBeInTheDocument()
  })

  // ── Views, hiding packed items, empty states ──────────────────────────

  it('FE-MOB-PACKTAB-017: the personal view shows only private items', async () => {
    await setup()
    expect(screen.queryByText('Diary')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))
    expect(screen.getByText('Diary')).toBeInTheDocument()
    expect(screen.queryByText('Passport')).toBeNull()
    expect(screen.getByText('packing.packedCount:0,1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'packing.viewCommon' }))
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-018: an empty personal list shows its own hint', async () => {
    await setup({ items: ITEMS.filter(i => !i.is_private) })
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))
    expect(screen.getByText('packing.personalEmptyHint')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-019: hiding packed items from the menu narrows the lists, and back', async () => {
    await setup()
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.hideDone' }))
    expect(screen.queryByText('Passport')).toBeNull()
    expect(screen.getByText('Visa')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'packing.hideDone' }))
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-020: hiding everything shows the filtered-empty hint', async () => {
    await setup({ items: [packItem({ id: 1, name: 'Visa', checked: 1 })] })
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.hideDone' }))
    expect(screen.getByText('packing.emptyFiltered')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-021: an empty list shows the mascot, no view switch, and the add-list button', async () => {
    await setup({ items: [] })
    expect(screen.getByText('packing.emptyTitle')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.viewCommon' })).toBeNull()
    expect(screen.getByRole('button', { name: 'packing.addCategory' })).toBeInTheDocument()
  })

  // ── Lists ─────────────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-022: adds a list as a placeholder item', async () => {
    const { planner } = await setup({ items: [] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { target: { value: '  Gear  ' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.add' })) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, { name: '...', category: 'Gear', visibility: 'common' })
  })

  it('FE-MOB-PACKTAB-023: a list added from the menu with a taken name is disambiguated', async () => {
    const { planner } = await setup()
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))

    const input = screen.getByPlaceholderText('packing.newCategoryPlaceholder')
    fireEvent.change(input, { target: { value: 'Documents' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, { name: '...', category: `Documents${ZERO_WIDTH}`, visibility: 'common' })
  })

  it('FE-MOB-PACKTAB-024: a list added from the personal view is private', async () => {
    const { planner } = await setup()
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    fireEvent.change(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { target: { value: 'Books' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.add' })) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, { name: '...', category: 'Books', visibility: 'personal' })
  })

  it('FE-MOB-PACKTAB-025: Escape aborts the new-list field and errors are reported', async () => {
    const { planner } = await setup({ items: [] })
    asMock(planner.tripActions.addPackingItem).mockRejectedValueOnce(new Error('x'))

    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    const field = screen.getByPlaceholderText('packing.newCategoryPlaceholder')
    fireEvent.change(field, { target: { value: 'Gear' } })
    await act(async () => { fireEvent.keyDown(field, { key: 'Enter' }) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.addError')

    fireEvent.keyDown(screen.getByPlaceholderText('packing.newCategoryPlaceholder'), { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'packing.addCategory' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'packing.addCategory' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(screen.queryByPlaceholderText('packing.newCategoryPlaceholder')).toBeNull()
  })

  it('FE-MOB-PACKTAB-026: a tap on the list head folds it', async () => {
    await setup()
    const header = within(card('Documents')).getByRole('button', { expanded: true })
    fireEvent.click(header)
    expect(screen.queryByText('Passport')).toBeNull()
    fireEvent.click(within(card('Documents')).getByRole('button', { expanded: false }))
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-027: the list menu is a sheet named after the list', async () => {
    await setup()
    openCategoryMenu('Documents')
    const sheet = screen.getByRole('dialog', { name: 'packing.categoryOptions' })
    expect(within(sheet).getByText('Documents')).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: 'common.close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'packing.categoryOptions' })).toBeNull())
  })

  it('FE-MOB-PACKTAB-028: renames a list across all its items', async () => {
    const { planner } = await setup()
    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))

    const input = screen.getByRole('textbox', { name: 'packing.menuRename' })
    fireEvent.change(input, { target: { value: 'Papers' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { category: 'Papers' })
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 2, { category: 'Papers' })
  })

  it('FE-MOB-PACKTAB-029: an unchanged rename is dropped, Escape reverts', async () => {
    const { planner } = await setup()
    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    fireEvent.blur(screen.getByRole('textbox', { name: 'packing.menuRename' }))
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()

    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    const input = screen.getByRole('textbox', { name: 'packing.menuRename' })
    fireEvent.change(input, { target: { value: 'Nope' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-030: a failing rename surfaces the rename error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.updatePackingItem).mockRejectedValueOnce(new Error('x'))
    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuRename' }))
    const input = screen.getByRole('textbox', { name: 'packing.menuRename' })
    fireEvent.change(input, { target: { value: 'Papers' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.renameError')
  })

  it('FE-MOB-PACKTAB-031: checks and unchecks a whole list', async () => {
    const { planner } = await setup()
    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuCheckAll' })) })
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledTimes(1)
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 2, true)

    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuUncheckAll' })) })
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 1, false)
  })

  it('FE-MOB-PACKTAB-032: a failing bulk check surfaces the save error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.togglePackingItem).mockRejectedValueOnce(new Error('x'))
    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.menuCheckAll' })) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')
  })

  it('FE-MOB-PACKTAB-033: deleting a list removes every item after confirmation, cancelling keeps them', async () => {
    const { planner } = await setup()
    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuDeleteCat' }))
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'packing.menuDeleteCat' })).getByRole('button', { name: 'common.cancel' }))
    expect(planner.tripActions.deletePackingItem).not.toHaveBeenCalled()

    asMock(planner.tripActions.deletePackingItem).mockRejectedValueOnce(new Error('x'))
    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuDeleteCat' }))
    const dialog = await screen.findByRole('dialog', { name: 'packing.menuDeleteCat' })
    expect(within(dialog).getByText('packing.confirm.deleteCat:Documents,2')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError'))
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PACKTAB-034: the list menu moves the whole list to my list, one write per item (#2961)', async () => {
    const { planner } = await setup({ planner: { tripMembers: [ANNA, BEN] } })
    openCategoryMenu('Documents')
    fireEvent.click(screen.getByRole('button', { name: 'packing.menuShareCat' }))
    const sheet = await screen.findByRole('dialog', { name: 'packing.menuShareCat' })
    fireEvent.click(within(sheet).getByRole('button', { name: /^packing.tierPersonal/ }))
    await act(async () => { fireEvent.click(within(sheet).getByRole('button', { name: 'packing.shareCat.apply' })) })

    expect(asMock(planner.tripActions.setPackingItemSharing).mock.calls).toEqual([
      [3, 1, 'personal', []],
      [3, 2, 'personal', []],
    ])
  })

  // ── Who looks after a list ────────────────────────────────────────────

  it('FE-MOB-PACKTAB-035: assigns and unassigns people from the list menu, and shows them on the head', async () => {
    const both = [{ user_id: 11, username: 'anna' }, { user_id: 12, username: 'ben' }]
    vi.mocked(packingApi.getCategoryAssignees).mockResolvedValue({ assignees: { Documents: [both[0]] } })
    const setAssignees = vi.spyOn(packingApi, 'setCategoryAssignees').mockResolvedValue({ assignees: both })
    await setup({ planner: { tripMembers: [ANNA, BEN] } as Partial<TripPlanner> })
    expect(within(card('Documents')).getByLabelText('anna')).toBeInTheDocument()

    openCategoryMenu('Documents')
    const sheet = screen.getByRole('dialog', { name: 'packing.categoryOptions' })
    await act(async () => { fireEvent.click(within(sheet).getByRole('button', { name: 'ben' })) })
    expect(setAssignees).toHaveBeenCalledWith(3, 'Documents', [11, 12])

    await act(async () => { fireEvent.click(within(sheet).getByRole('button', { name: 'anna' })) })
    expect(setAssignees).toHaveBeenLastCalledWith(3, 'Documents', [12])
  })

  it('FE-MOB-PACKTAB-036: a failing assignee update surfaces the save error, no members shows the hint', async () => {
    vi.spyOn(packingApi, 'setCategoryAssignees').mockRejectedValue(new Error('x'))
    const { planner, view } = await setup({ planner: { tripMembers: [ANNA] } as Partial<TripPlanner> })
    openCategoryMenu('Documents')
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'packing.categoryOptions' })).getByRole('button', { name: 'anna' })) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError')

    view.unmount()
    await setup()
    openCategoryMenu('Documents')
    expect(screen.getByText('packing.noMembers')).toBeInTheDocument()
  })

  // ── Adding items ──────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-037: adds an item to a list from the row at its end', async () => {
    const { planner } = await setup()
    fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' }))
    const input = within(card('Clothing')).getByPlaceholderText('packing.addItemPlaceholder')
    expect(within(card('Clothing')).getByRole('button', { name: 'common.add' })).toBeDisabled()
    fireEvent.change(input, { target: { value: '  Hat  ' } })
    await act(async () => { fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'common.add' })) })

    expect(planner.tripActions.addPackingItem).toHaveBeenCalledWith(3, { name: 'Hat', category: 'Clothing', visibility: 'common' })
  })

  it('FE-MOB-PACKTAB-038: a list placeholder is renamed instead of adding a second row', async () => {
    const items = [packItem({ id: 1, name: 'Passport', category: 'Documents' }), packItem({ id: 9, name: '...', category: 'Gear' })]
    const { planner } = await setup({ items })
    fireEvent.click(within(card('Gear')).getByRole('button', { name: 'packing.addItem' }))
    const input = within(card('Gear')).getByPlaceholderText('packing.addItemPlaceholder')
    fireEvent.change(input, { target: { value: 'Rope' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 9, { name: 'Rope' })
    expect(planner.tripActions.addPackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-039: Escape and an empty blur close the add field, failures are reported', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.addPackingItem).mockRejectedValueOnce(new Error('x'))
    fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' }))
    const input = within(card('Clothing')).getByPlaceholderText('packing.addItemPlaceholder')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(planner.tripActions.addPackingItem).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Hat' } })
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.addError')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' })).toBeInTheDocument()
    fireEvent.click(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' }))
    fireEvent.blur(within(card('Clothing')).getByPlaceholderText('packing.addItemPlaceholder'))
    expect(within(card('Clothing')).getByRole('button', { name: 'packing.addItem' })).toBeInTheDocument()
  })

  // ── Rows ──────────────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-040: toggles an item; the row says the amount and nothing else unset', async () => {
    const { planner } = await setup({ bagTracking: true })
    fireEvent.click(screen.getByRole('button', { name: 'Socks' }))
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 3, true)
    fireEvent.click(screen.getByRole('button', { name: 'Passport' }))
    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 1, false)

    expect(within(itemRow('Socks')).getByText('×3')).toBeInTheDocument()
    expect(within(itemRow('Socks')).queryByText('120 g')).toBeNull()
    expect(within(itemRow('Socks')).queryByRole('button', { name: 'packing.bags' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Passport' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-PACKTAB-041: a partly packed item shows its pieces instead of the amount (#2296)', async () => {
    await setup({ items: [packItem({ id: 3, name: 'Socks', category: 'Clothing', quantity: 3, packed_quantity: 1 })] })
    expect(within(itemRow('Socks')).getByText('1/3')).toBeInTheDocument()
    expect(within(itemRow('Socks')).queryByText('×3')).toBeNull()
  })

  it('FE-MOB-PACKTAB-042: shows the placeholder label instead of the sentinel name', async () => {
    await setup({ items: [packItem({ id: 9, name: '...', category: 'Gear' })] })
    expect(screen.getByText('packing.addItemPlaceholder')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-043: a tap on the name opens the item sheet, which closes again', async () => {
    await setup()
    openItem('Socks')
    const dialog = screen.getByRole('dialog', { name: 'packing.editItem' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'packing.editItem' })).toBeNull())
  })

  it('FE-MOB-PACKTAB-044: deletes a normal item from its sheet', async () => {
    const { planner } = await setup()
    openItem('Socks')
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'packing.editItem' })).getByRole('button', { name: 'common.delete' })) })
    expect(planner.tripActions.deletePackingItem).toHaveBeenCalledWith(3, 3)
  })

  it('FE-MOB-PACKTAB-045: the last item of a custom list is reset to a placeholder', async () => {
    const items = [
      packItem({ id: 1, name: 'Passport', category: 'Documents' }),
      packItem({ id: 8, name: 'Rope', category: 'Gear', checked: 1, quantity: 2, weight_grams: 90 }),
    ]
    const { planner } = await setup({ items })
    openItem('Rope')
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'packing.editItem' })).getByRole('button', { name: 'common.delete' })) })

    expect(planner.tripActions.togglePackingItem).toHaveBeenCalledWith(3, 8, false)
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 8, { name: '...', weight_grams: null, bag_id: null, quantity: 1 })
    expect(planner.tripActions.deletePackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKTAB-046: a failing item delete surfaces the delete error', async () => {
    const { planner } = await setup()
    asMock(planner.tripActions.deletePackingItem).mockRejectedValueOnce(new Error('x'))
    openItem('Socks')
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'packing.editItem' })).getByRole('button', { name: 'common.delete' })) })
    expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.deleteError')
  })

  // ── Sharing badges ────────────────────────────────────────────────────

  it('FE-MOB-PACKTAB-047: badges an item somebody else takes care of, as an icon not a sentence', async () => {
    await setup({ items: [packItem({ id: 1, name: 'Tent', is_private: 1, owner_id: 21, owner_username: 'owner' })] })
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))
    expect(screen.queryByText('packing.takenCareOf:owner')).not.toBeInTheDocument()
    expect(screen.getByLabelText('packing.takenCareOf:owner')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-048: badges how many people my shared item covers', async () => {
    await setup({ items: [packItem({
      id: 1, name: 'Tent', is_private: 1, owner_id: ME, owner_username: 'me',
      recipients: [{ user_id: 11, username: 'anna' }, { user_id: 12, username: 'ben' }],
    })] })
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewPersonal' }))
    expect(screen.getByLabelText('packing.sharedWithCount:2')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-049: shows the bringer picture and how many more bring it', async () => {
    const items = [packItem({
      id: 1, name: 'Tent', owner_id: 11, owner_username: 'anna',
      contributors: [{ user_id: 12, username: 'ben', status: 'pledged' }],
    })]
    await setup({ items, planner: { tripMembers: [ANNA] } as Partial<TripPlanner> })
    expect(itemRow('Tent').querySelector('img')).toHaveAttribute('src', 'https://cdn.example/anna.png')
    expect(within(itemRow('Tent')).getByText('+1')).toBeInTheDocument()
    expect(screen.getByLabelText('packing.broughtBy:anna, ben')).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-050: falls back to the initial, and co-bringers alone still show', async () => {
    await setup({ items: [
      packItem({ id: 1, name: 'Tent', owner_id: 99, owner_username: 'zoe' }),
      packItem({ id: 2, name: 'Stove', owner_id: null, contributors: [{ user_id: 12, username: 'ben', status: 'pledged' }] }),
    ] })
    expect(within(itemRow('Tent')).getByText('Z')).toBeInTheDocument()
    expect(within(itemRow('Stove')).getByText('B')).toBeInTheDocument()
  })

  // ── Bags sheet plumbing ───────────────────────────────────────────────

  it('FE-MOB-PACKTAB-051: renames, deletes and re-crews a bag through the sheet', async () => {
    vi.spyOn(packingApi, 'updateBag').mockResolvedValue({ bag: { ...BAGS[0], name: 'Daypack' } })
    vi.spyOn(packingApi, 'setBagMembers').mockResolvedValue({ members: [{ user_id: 11, username: 'anna', avatar: null }] })
    vi.spyOn(packingApi, 'deleteBag').mockResolvedValue({ ok: true })
    await setup({ bagTracking: true, planner: { tripMembers: [ANNA] } as Partial<TripPlanner> })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.bags' }))
    const dialog = await screen.findByRole('dialog', { name: 'packing.bags' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Backpack' }))
    const nameInput = within(dialog).getByDisplayValue('Backpack')
    fireEvent.change(nameInput, { target: { value: 'Daypack' } })
    await act(async () => { fireEvent.keyDown(nameInput, { key: 'Enter' }) })
    expect(packingApi.updateBag).toHaveBeenCalledWith(3, 71, { name: 'Daypack' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.add' }))
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'anna' })) })
    expect(packingApi.setBagMembers).toHaveBeenCalledWith(3, 71, [11])

    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' })) })
    expect(packingApi.deleteBag).toHaveBeenCalledWith(3, 71)
  })

  it('FE-MOB-PACKTAB-052: creates a bag from the sheet with the next palette colour', async () => {
    const created = { id: 72, trip_id: 3, name: 'Duffel', color: '#ec4899', sort_order: 1 } as PackingBag
    vi.spyOn(packingApi, 'createBag').mockResolvedValue({ bag: created })
    await setup({ bagTracking: true })

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.bags' }))
    const dialog = await screen.findByRole('dialog', { name: 'packing.bags' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'packing.addBag' }))
    const field = within(dialog).getByPlaceholderText('packing.bagName')
    fireEvent.change(field, { target: { value: 'Duffel' } })
    const addRow = field.parentElement as HTMLElement
    await act(async () => { fireEvent.click(within(addRow).getByRole('button', { name: 'common.add' })) })

    expect(packingApi.createBag).toHaveBeenCalledWith(3, { name: 'Duffel', color: '#ec4899' })
  })

  it('FE-MOB-PACKTAB-053: the action sheet and the import sheet can be dismissed again', async () => {
    await setup()
    openActions()
    fireEvent.click(within(screen.getByRole('dialog', { name: 'packing.actions' })).getByRole('button', { name: 'common.close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'packing.actions' })).toBeNull())

    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.import' }))
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'packing.importTitle' })).getByRole('button', { name: 'common.cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'packing.importTitle' })).toBeNull())
  })

  // ── Export (#875, #1420) ──────────────────────────────────────────────

  it('FE-MOB-PACKTAB-054: offers the three exports in the action sheet, right after Import', async () => {
    seedStore(useTripStore, { packingItems: ITEMS })
    await setup()
    openActions()
    const labels = within(screen.getByRole('dialog', { name: 'packing.actions' })).getAllByRole('button').map(b => b.textContent)
    const importAt = labels.indexOf('packing.import')
    expect(labels.slice(importAt, importAt + 4)).toEqual([
      'packing.import', 'packing.exportPrint', 'packing.exportMarkdown', 'packing.exportCsv',
    ])
  })

  it('FE-MOB-PACKTAB-055: a member who may not edit still gets the exports and nothing that changes the list', async () => {
    seedStore(useTripStore, { packingItems: ITEMS })
    await setup({ planner: { can: vi.fn(() => false) } })
    openActions()
    expect(screen.getByRole('button', { name: 'packing.exportMarkdown' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /packing.clearChecked/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.applyTemplate' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-056: downloads the open view as Markdown, and opens the print preview', async () => {
    const download = vi.spyOn(fileDownload, 'downloadBlob').mockImplementation(() => {})
    seedStore(useTripStore, { packingItems: ITEMS })
    await setup()
    openActions()
    fireEvent.click(screen.getByRole('button', { name: 'packing.exportMarkdown' }))
    expect(download).toHaveBeenCalledTimes(1)
    const [blob, name] = download.mock.calls[0]
    expect(name).toMatch(/^packing-list.*\.md$/)
    const text = await (blob as Blob).text()
    expect(text).toContain('- [x] Passport')
    expect(text).not.toContain('Diary')

    openActions()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'packing.exportPrint' })) })
    expect(await screen.findByTitle(/Packing List/)).toBeInTheDocument()
  })

  it('FE-MOB-PACKTAB-057: on a wide window the lists stand in columns, each card whole', async () => {
    await setup()
    const listCard = card('Documents')
    expect(listCard.className).toContain('wide:break-inside-avoid')
    expect(listCard.className).toContain('wide:inline-block')
    expect((listCard.parentElement as HTMLElement).className).toContain('wide:columns-[300px]')
  })
})
