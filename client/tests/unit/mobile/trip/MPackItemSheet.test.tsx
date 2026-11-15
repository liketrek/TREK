import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import MPackItemSheet from '../../../../src/mobile/screens/trip/tabs/MPackItemSheet'
import type { PackingBag, PackingItem, TripMember } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render'

// FE-MOB-PACKITEM-001 to FE-MOB-PACKITEM-024

const ME = 7
const ANNA = { id: 11, username: 'anna', avatar: 'anna.png', avatar_url: null } as unknown as TripMember
const BEN = { id: 12, username: 'ben', avatar: null, avatar_url: 'https://cdn.example/ben.png' } as unknown as TripMember
const OWNER = { id: 21, username: 'owner', avatar: null, avatar_url: null } as unknown as TripMember
const BAGS = [
  { id: 71, name: 'Backpack', color: '#6366f1' },
  { id: 72, name: 'Duffel', color: '#ec4899' },
] as unknown as PackingBag[]

function packItem(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: 1, trip_id: 3, name: 'Rain jacket', checked: 0, category: 'Clothing', sort_order: 0,
    quantity: 2, weight_grams: 450, is_private: 0, owner_id: ME,
    ...overrides,
  } as PackingItem
}

function setup(overrides: Partial<ComponentProps<typeof MPackItemSheet>> = {}, items: PackingItem[] = [packItem()]) {
  const planner = buildPlanner({ tripId: 3, packingItems: items })
  const props: ComponentProps<typeof MPackItemSheet> = {
    planner,
    open: true,
    itemId: 1,
    bagTrackingEnabled: true,
    tripMembers: [ANNA, BEN],
    currentUserId: ME,
    categories: ['Clothing', 'Documents'],
    bags: BAGS,
    onCreateBag: vi.fn(async () => undefined),
    onDelete: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  const view = render(<MPackItemSheet {...props} />)
  return { ...props, planner, view }
}

const sheet = () => within(screen.getByRole('dialog', { name: 'packing.editItem' }))

describe('MPackItemSheet', () => {
  it('FE-MOB-PACKITEM-001: renders nothing without a resolvable item', () => {
    setup({ itemId: null })
    expect(screen.queryByRole('dialog')).toBeNull()
    setup({ itemId: 99 })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-MOB-PACKITEM-002: shows the name, the list, the amount and the weight, with no save button', () => {
    setup()
    expect(sheet().getByDisplayValue('Rain jacket')).toBeInTheDocument()
    expect(sheet().getAllByText('Clothing').length).toBeGreaterThan(0)
    expect(within(sheet().getByRole('group', { name: 'packing.quantity' })).getByText('2')).toBeInTheDocument()
    expect(sheet().getByDisplayValue('450')).toBeInTheDocument()
    expect(sheet().queryByRole('button', { name: 'common.save' })).toBeNull()
  })

  it('FE-MOB-PACKITEM-003: falls back to the default list', () => {
    setup({}, [packItem({ category: null })])
    expect(sheet().getAllByText('packing.defaultCategory').length).toBeGreaterThan(0)
  })

  it('FE-MOB-PACKITEM-004: a renamed item saves when the field lets go, a blank or unchanged name does not', async () => {
    const { planner } = setup()
    const name = sheet().getByRole('textbox', { name: 'packing.itemName' })
    fireEvent.focus(name)
    fireEvent.blur(name)
    fireEvent.focus(name)
    fireEvent.change(name, { target: { value: '   ' } })
    fireEvent.blur(name)
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()

    fireEvent.focus(name)
    fireEvent.change(name, { target: { value: '  Poncho  ' } })
    fireEvent.keyDown(name, { key: 'Enter' })
    fireEvent.blur(name)
    await waitFor(() => expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { name: 'Poncho' }))
  })

  it('FE-MOB-PACKITEM-005: a failing save is reported', async () => {
    const { planner } = setup()
    ;(planner.tripActions.updatePackingItem as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('nope'))
    fireEvent.click(sheet().getByRole('button', { name: 'packing.quantityMore' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError'))
  })

  it('FE-MOB-PACKITEM-006: the amount steps within one and 999', () => {
    const { planner } = setup({}, [packItem({ quantity: 1 })])
    expect(sheet().getByRole('button', { name: 'packing.quantityLess' })).toBeDisabled()
    fireEvent.click(sheet().getByRole('button', { name: 'packing.quantityMore' }))
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { quantity: 2 })
  })

  it('FE-MOB-PACKITEM-007: several pieces bring the packed counter, one piece does not', () => {
    const { planner, view } = setup({}, [packItem({ quantity: 3, packed_quantity: 1 } as Partial<PackingItem>)])
    const packed = within(sheet().getByRole('group', { name: 'packing.printPacked' }))
    expect(packed.getByText('1/3')).toBeInTheDocument()
    fireEvent.click(packed.getByRole('button', { name: 'packing.packedMore' }))
    expect(planner.tripActions.setPackedCount).toHaveBeenCalledWith(3, 1, 2)
    fireEvent.click(packed.getByRole('button', { name: 'packing.packedLess' }))
    expect(planner.tripActions.setPackedCount).toHaveBeenCalledWith(3, 1, 0)

    view.unmount()
    setup({}, [packItem({ quantity: 1 })])
    expect(screen.queryByRole('group', { name: 'packing.printPacked' })).toBeNull()
  })

  it('FE-MOB-PACKITEM-008: the weight takes digits only and saves on leaving, empty is no weight', async () => {
    const { planner } = setup()
    const weight = sheet().getByRole('textbox', { name: 'packing.totalWeight' })
    fireEvent.focus(weight)
    fireEvent.change(weight, { target: { value: '4x5' } })
    expect(weight).toHaveValue('45')
    fireEvent.blur(weight)
    await waitFor(() => expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { weight_grams: 45 }))

    fireEvent.focus(weight)
    fireEvent.change(weight, { target: { value: '' } })
    fireEvent.keyDown(weight, { key: 'Enter' })
    fireEvent.blur(weight)
    await waitFor(() => expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { weight_grams: null }))
  })

  it('FE-MOB-PACKITEM-009: without bag tracking there is no weight and no bag', () => {
    setup({ bagTrackingEnabled: false })
    expect(sheet().queryByRole('textbox', { name: 'packing.totalWeight' })).toBeNull()
    expect(sheet().queryByRole('button', { name: /packing.noBag/ })).toBeNull()
  })

  it('FE-MOB-PACKITEM-010: the list choice moves the item, the current list changes nothing', () => {
    const { planner } = setup()
    fireEvent.click(sheet().getByRole('button', { name: /Clothing/, expanded: false }))
    fireEvent.click(sheet().getAllByRole('button', { name: /Clothing/ })[1])
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()
    fireEvent.click(sheet().getByRole('button', { name: /Clothing/, expanded: false }))
    fireEvent.click(sheet().getByRole('button', { name: /Documents/ }))
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { category: 'Documents' })
  })

  it('FE-MOB-PACKITEM-011: the bag choice assigns, clears and creates bags', async () => {
    const created = { id: 73, name: 'Tote', color: '#10b981' } as unknown as PackingBag
    const onCreateBag = vi.fn(async () => created)
    const { planner } = setup({ onCreateBag }, [packItem({ bag_id: 71 } as Partial<PackingItem>)])

    fireEvent.click(sheet().getByRole('button', { name: /Backpack/ }))
    fireEvent.click(sheet().getByRole('button', { name: /Duffel/ }))
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { bag_id: 72 })

    fireEvent.click(sheet().getByRole('button', { name: /Backpack/ }))
    fireEvent.click(sheet().getByRole('button', { name: /packing.noBag/ }))
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { bag_id: null })

    fireEvent.click(sheet().getByRole('button', { name: /Backpack/ }))
    const field = sheet().getByRole('textbox', { name: 'packing.bagName' })
    expect(sheet().getByRole('button', { name: 'packing.addBag' })).toBeDisabled()
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onCreateBag).not.toHaveBeenCalled()
    fireEvent.change(field, { target: { value: 'Tote' } })
    fireEvent.click(sheet().getByRole('button', { name: 'packing.addBag' }))
    await waitFor(() => expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, { bag_id: 73 }))
  })

  it('FE-MOB-PACKITEM-012: a bag that could not be created assigns nothing', async () => {
    const { planner } = setup()
    fireEvent.click(sheet().getByRole('button', { name: /packing.noBag/ }))
    const field = sheet().getByRole('textbox', { name: 'packing.bagName' })
    fireEvent.change(field, { target: { value: 'Tote' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() => expect(sheet().queryByRole('textbox', { name: 'packing.bagName' })).toBeNull())
    expect(planner.tripActions.updatePackingItem).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKITEM-013: the bringer choice ticks anyone on or off (#3098)', () => {
    const item = packItem({ owner_id: 21, owner_username: 'owner', contributors: [{ user_id: 12, username: 'ben', status: 'accepted' }] })
    const { planner } = setup({ tripMembers: [ANNA, BEN, OWNER] }, [item])

    fireEvent.click(sheet().getByRole('button', { name: /owner, ben/ }))
    fireEvent.click(sheet().getByRole('button', { name: 'anna' }))
    expect(planner.tripActions.addPackingContributor).toHaveBeenCalledWith(3, 1, 11)
    fireEvent.click(sheet().getByRole('button', { name: 'ben' }))
    expect(planner.tripActions.removePackingContributor).toHaveBeenCalledWith(3, 1, 12)
  })

  it('FE-MOB-PACKITEM-014: nobody bringing it reads as such', () => {
    setup({}, [packItem({ owner_id: null })])
    expect(sheet().getByRole('button', { name: /packing.bringersNobody/ })).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-015: the owner switches who sees the item', () => {
    const { planner } = setup()
    const group = within(sheet().getByRole('radiogroup', { name: 'packing.detail.visibility' }))
    expect(group.getByRole('radio', { name: 'packing.filterAll' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(group.getByRole('radio', { name: 'packing.visibility.me' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenCalledWith(3, 1, 'personal', [])
    fireEvent.click(group.getByRole('radio', { name: 'packing.visibility.some' }))
    fireEvent.click(sheet().getByRole('button', { name: 'ben' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenCalledWith(3, 1, 'shared', [12])
    fireEvent.click(group.getByRole('radio', { name: 'packing.filterAll' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenLastCalledWith(3, 1, 'common', [])
  })

  it('FE-MOB-PACKITEM-016: the owner adds and removes a person on a shared item', () => {
    const item = packItem({ is_private: 1, recipients: [{ user_id: 11, username: 'anna' }] })
    const { planner } = setup({}, [item])
    fireEvent.click(sheet().getByRole('button', { name: 'ben' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenCalledWith(3, 1, 'shared', [11, 12])
    fireEvent.click(sheet().getByRole('button', { name: 'anna' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenCalledWith(3, 1, 'personal', [])
  })

  it('FE-MOB-PACKITEM-017: member pictures and initials show in the pickers', () => {
    const { view } = setup({}, [packItem({ is_private: 1, recipients: [{ user_id: 11, username: 'anna' }] })])
    const srcs = Array.from(view.baseElement.querySelectorAll('img')).map(i => i.getAttribute('src'))
    expect(srcs).toContain('/uploads/avatars/anna.png')
    expect(srcs).toContain('https://cdn.example/ben.png')
  })

  it('FE-MOB-PACKITEM-018: alone on the trip there is nobody to share with', () => {
    setup({ tripMembers: [] })
    fireEvent.click(sheet().getByRole('radio', { name: 'packing.visibility.some' }))
    expect(sheet().getByText('packing.noOneToShare')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-019: someone else\'s common item can be copied to my list', () => {
    const { planner, onClose } = setup({}, [packItem({ owner_id: 21, owner_username: 'owner' })])
    expect(sheet().queryByRole('radiogroup')).toBeNull()
    fireEvent.click(sheet().getByRole('button', { name: 'packing.cloneToMine' }))
    expect(planner.tripActions.clonePackingItem).toHaveBeenCalledWith(3, 1)
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-PACKITEM-020: a private item shared with me says whose it is, or the generic hint', () => {
    const { view } = setup({}, [packItem({ is_private: 1, owner_id: 21, owner_username: 'owner' })])
    expect(sheet().getByText('packing.takenCareOf:owner')).toBeInTheDocument()
    expect(sheet().queryByRole('radiogroup')).toBeNull()
    view.unmount()
    setup({}, [packItem({ is_private: 1, owner_id: 21, owner_username: null })])
    expect(sheet().getByText('packing.tierPersonalHint')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-021: a placeholder starts with an empty name and no people', () => {
    setup({}, [packItem({ name: '...', quantity: 1, weight_grams: null })])
    expect(sheet().getByPlaceholderText('packing.addItemPlaceholder')).toHaveValue('')
    expect(sheet().queryByRole('radiogroup')).toBeNull()
  })

  it('FE-MOB-PACKITEM-022: a reader sees the item without anything to change', () => {
    const planner = buildPlanner({ tripId: 3, packingItems: [packItem()], can: vi.fn(() => false) })
    setup({ planner })
    expect(sheet().getByDisplayValue('Rain jacket')).toHaveAttribute('readonly')
    expect(sheet().queryByRole('group', { name: 'packing.quantity' })).toBeNull()
    expect(sheet().queryByRole('button', { name: 'common.delete' })).toBeNull()
  })

  it('FE-MOB-PACKITEM-023: delete closes the sheet and hands over, close closes', () => {
    const { onClose, onDelete } = setup()
    fireEvent.click(sheet().getByRole('button', { name: 'common.delete' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    fireEvent.click(sheet().getByRole('button', { name: 'common.close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PACKITEM-024: keeps showing the last item after it left the store, and a typed name survives a refresh', () => {
    const { view, planner, ...props } = setup()
    const name = sheet().getByRole('textbox', { name: 'packing.itemName' })
    fireEvent.focus(name)
    fireEvent.change(name, { target: { value: 'Rain shell' } })
    const refreshed = buildPlanner({ tripId: 3, packingItems: [packItem()], t: planner.t })
    view.rerender(<MPackItemSheet {...props} planner={refreshed} />)
    expect(screen.getByDisplayValue('Rain shell')).toBeInTheDocument()

    const drained = buildPlanner({ tripId: 3, packingItems: [], t: planner.t })
    view.rerender(<MPackItemSheet {...props} planner={drained} />)
    expect(screen.getByDisplayValue('Rain shell')).toBeInTheDocument()
  })
})
