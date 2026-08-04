import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import MPackItemSheet from '../../../../src/mobile/screens/trip/tabs/MPackItemSheet'
import type { PackingItem, TripMember } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-PACKITEM-001 to FE-MOB-PACKITEM-024

const ME = 7
const ANNA = { id: 11, username: 'anna', avatar: 'anna.png', avatar_url: null } as unknown as TripMember
const BEN = { id: 12, username: 'ben', avatar: null, avatar_url: 'https://cdn.example/ben.png' } as unknown as TripMember
const OWNER = { id: 21, username: 'owner', avatar: null, avatar_url: null } as unknown as TripMember

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
    onClose: vi.fn(),
    ...overrides,
  }
  const view = render(<MPackItemSheet {...props} />)
  return { ...props, planner, view }
}

describe('MPackItemSheet', () => {
  it('FE-MOB-PACKITEM-001: renders nothing without a resolvable item', () => {
    setup({ itemId: null })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-MOB-PACKITEM-002: renders nothing when the id is unknown', () => {
    setup({ itemId: 99 })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-MOB-PACKITEM-003: prefills name, quantity and weight', () => {
    setup()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'packing.editItem')
    expect(screen.getByText('Clothing')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rain jacket')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('450')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-004: falls back to the default category in the subtitle', () => {
    setup({}, [packItem({ category: null })])
    expect(screen.getByText('packing.defaultCategory')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-005: hides the weight field when bag tracking is off', () => {
    setup({ bagTrackingEnabled: false })
    expect(screen.queryByText('packing.itemWeight')).toBeNull()
    expect(screen.queryByDisplayValue('450')).toBeNull()
  })

  it('FE-MOB-PACKITEM-006: starts a placeholder row with an empty name and no sharing block', () => {
    setup({}, [packItem({ name: '...', quantity: 1, weight_grams: null })])
    const name = screen.getByPlaceholderText('packing.addItemPlaceholder')
    expect(name).toHaveValue('')
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled()
    expect(screen.queryByText('packing.share')).toBeNull()
  })

  it('FE-MOB-PACKITEM-007: strips non-digits from quantity and weight', () => {
    setup()

    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '1a2' } })
    fireEvent.change(screen.getByDisplayValue('450'), { target: { value: '4x5' } })

    expect(screen.getByDisplayValue('12')).toBeInTheDocument()
    expect(screen.getByDisplayValue('45')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-008: saves name, clamped quantity and weight', async () => {
    const { planner, onClose } = setup()

    fireEvent.change(screen.getByDisplayValue('Rain jacket'), { target: { value: '  Poncho  ' } })
    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '1500' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, {
      name: 'Poncho', quantity: 999, weight_grams: 450,
    })
  })

  it('FE-MOB-PACKITEM-009: treats an empty quantity as 1 and an empty weight as null', async () => {
    const { planner } = setup()

    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '' } })
    fireEvent.change(screen.getByDisplayValue('450'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, {
      name: 'Rain jacket', quantity: 1, weight_grams: null,
    }))
  })

  it('FE-MOB-PACKITEM-010: omits weight entirely without bag tracking', async () => {
    const { planner } = setup({ bagTrackingEnabled: false })

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(planner.tripActions.updatePackingItem).toHaveBeenCalledWith(3, 1, {
      name: 'Rain jacket', quantity: 2,
    }))
  })

  it('FE-MOB-PACKITEM-011: reports a failed save and keeps the sheet open', async () => {
    const { planner, onClose } = setup()
    const update = planner.tripActions.updatePackingItem as unknown as ReturnType<typeof vi.fn>
    update.mockRejectedValueOnce(new Error('nope'))

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.toast.saveError'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-PACKITEM-012: disables save for a blank name', () => {
    setup()

    fireEvent.change(screen.getByDisplayValue('Rain jacket'), { target: { value: '   ' } })

    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled()
  })

  it('FE-MOB-PACKITEM-013: keeps rendering the last item after it disappears from the store', () => {
    const { view, planner, ...props } = setup()
    const drained = buildPlanner({ tripId: 3, packingItems: [], t: planner.t })

    view.rerender(<MPackItemSheet {...props} planner={drained} />)

    expect(screen.getByDisplayValue('Rain jacket')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-014: owner switches the item to personal and back to common', () => {
    const { planner } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'packing.tierPersonal' }))
    fireEvent.click(screen.getByRole('button', { name: 'packing.viewCommon' }))

    expect(planner.tripActions.setPackingItemSharing).toHaveBeenNthCalledWith(1, 3, 1, 'personal', [])
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenNthCalledWith(2, 3, 1, 'common', [])
  })

  it('FE-MOB-PACKITEM-015: owner adds and removes a share recipient', () => {
    const item = packItem({ is_private: 1, recipients: [{ user_id: 11, username: 'anna' }] })
    const { planner } = setup({}, [item])

    fireEvent.click(screen.getByRole('button', { name: 'ben' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenCalledWith(3, 1, 'shared', [11, 12])

    fireEvent.click(screen.getByRole('button', { name: 'anna' }))
    expect(planner.tripActions.setPackingItemSharing).toHaveBeenCalledWith(3, 1, 'shared', [])
  })

  it('FE-MOB-PACKITEM-016: renders member avatars and initials in the share picker', () => {
    const { view } = setup()
    const srcs = Array.from(view.baseElement.querySelectorAll('img')).map(i => i.getAttribute('src'))
    expect(srcs).toContain('/uploads/avatars/anna.png')
    expect(srcs).toContain('https://cdn.example/ben.png')
  })

  it('FE-MOB-PACKITEM-017: tells the owner when there is nobody to share with', () => {
    setup({ tripMembers: [] })
    expect(screen.getByText('packing.noOneToShare')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-018: a non-owner can pledge to bring a common item too', () => {
    const item = packItem({ owner_id: 21, owner_username: 'owner' })
    const { planner } = setup({ tripMembers: [ANNA, BEN, OWNER] }, [item])

    expect(screen.getByText('packing.broughtBy:owner')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'packing.alsoBring' }))

    expect(planner.tripActions.addPackingContributor).toHaveBeenCalledWith(3, 1)
  })

  it('FE-MOB-PACKITEM-019: a pledged contributor can withdraw and can clone the item', () => {
    const item = packItem({
      owner_id: 21, owner_username: 'owner',
      contributors: [{ user_id: ME, username: 'me', status: 'pledged' }],
    })
    const { planner, onClose } = setup({}, [item])

    fireEvent.click(screen.getByRole('button', { name: 'packing.alsoBringingStop' }))
    expect(planner.tripActions.removePackingContributor).toHaveBeenCalledWith(3, 1, ME)

    fireEvent.click(screen.getByRole('button', { name: 'packing.cloneToMine' }))
    expect(planner.tripActions.clonePackingItem).toHaveBeenCalledWith(3, 1)
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-PACKITEM-020: a recipient sees a read-only note instead of the tier pills', () => {
    const item = packItem({ is_private: 1, owner_id: 21, owner_username: 'owner' })
    setup({}, [item])

    expect(screen.getByText('packing.takenCareOf:owner')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'packing.tierPersonal' })).toBeNull()
  })

  it('FE-MOB-PACKITEM-021: falls back to the generic hint when the owner is unknown', () => {
    const item = packItem({ is_private: 1, owner_id: 21, owner_username: null })
    setup({}, [item])

    expect(screen.getByText('packing.tierPersonalHint')).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-022: an unowned item is treated as the viewer\'s own', () => {
    const item = packItem({ owner_id: null })
    setup({}, [item])

    expect(screen.getByRole('button', { name: 'packing.tierPersonal' })).toBeInTheDocument()
  })

  it('FE-MOB-PACKITEM-023: closes from the header and the cancel button', () => {
    const { onClose } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PACKITEM-024: a store refresh of the open item keeps the typed draft', () => {
    const { view, planner, ...props } = setup()
    fireEvent.change(screen.getByDisplayValue('Rain jacket'), { target: { value: 'Rain shell' } })
    // packingSlice replaces the item object on every update, so a WebSocket
    // refresh of the same id must not reseed the fields.
    const refreshed = buildPlanner({ tripId: 3, packingItems: [packItem()], t: planner.t })
    view.rerender(<MPackItemSheet {...props} planner={refreshed} />)

    expect(screen.getByDisplayValue('Rain shell')).toBeInTheDocument()
  })
})
