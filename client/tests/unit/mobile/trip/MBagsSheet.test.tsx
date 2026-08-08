import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import MBagsSheet from '../../../../src/mobile/screens/trip/tabs/MBagsSheet'
import type { PackingBag, PackingItem, TripMember } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, within } from '../../../helpers/render'

// FE-MOB-BAGS-001 to FE-MOB-BAGS-019

function bag(overrides: Partial<PackingBag> = {}): PackingBag {
  return {
    id: 1, trip_id: 1, name: 'Backpack', color: '#6366f1', sort_order: 0,
    ...overrides,
  } as PackingBag
}

function item(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: 1, trip_id: 1, name: 'Shirt', checked: 0, category: 'Clothing', sort_order: 0,
    ...overrides,
  } as PackingItem
}

const ANNA = { id: 11, username: 'anna', avatar: 'anna.png', avatar_url: null } as unknown as TripMember
const BEN = { id: 12, username: 'ben', avatar: null, avatar_url: 'https://cdn.example/ben.png' } as unknown as TripMember

const BAGS = [
  bag({ id: 1, name: 'Backpack', color: '#6366f1', members: [{ user_id: 11, username: 'anna', avatar: '/uploads/avatars/anna.png' }] }),
  bag({ id: 2, name: 'Suitcase', color: '#ec4899', sort_order: 1, members: [{ user_id: 12, username: 'ben', avatar: null }] }),
]

// Backpack 300 g, Suitcase 2 x 600 g, unassigned 40 g → 1540 g total.
const ITEMS = [
  item({ id: 1, name: 'Shirt', bag_id: 1, weight_grams: 300 }),
  item({ id: 2, name: 'Boots', bag_id: 2, weight_grams: 600, quantity: 2 }),
  item({ id: 3, name: 'Charger', bag_id: null, weight_grams: 40 }),
]

function setup(overrides: Partial<ComponentProps<typeof MBagsSheet>> = {}) {
  const props: ComponentProps<typeof MBagsSheet> = {
    planner: buildPlanner(),
    open: true,
    onClose: vi.fn(),
    bags: BAGS,
    items: ITEMS,
    tripMembers: [ANNA, BEN],
    canEdit: true,
    onCreateBag: vi.fn(),
    onUpdateBag: vi.fn(),
    onDeleteBag: vi.fn(),
    onSetBagMembers: vi.fn(),
    ...overrides,
  }
  const view = render(<MBagsSheet {...props} />)
  return { ...props, view }
}

/** The bag block that owns the given name button. */
function rowFor(name: string): HTMLElement {
  return screen.getByRole('button', { name }).closest('div.mb-4') as HTMLElement
}

function fillBars(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('div.h-\\[7px\\] > div'))
}

describe('MBagsSheet', () => {
  it('FE-MOB-BAGS-001: stays unmounted while closed', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-MOB-BAGS-002: lists every bag with its weight and item count', () => {
    setup()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'packing.bags')
    expect(within(rowFor('Backpack')).getByText('300 g')).toBeInTheDocument()
    expect(within(rowFor('Backpack')).getByText('1 admin.packingTemplates.items')).toBeInTheDocument()
    expect(within(rowFor('Suitcase')).getByText('1.2 kg')).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-003: shows the unassigned pile and the grand total', () => {
    setup()
    expect(screen.getByText('packing.noBag')).toBeInTheDocument()
    expect(screen.getByText('40 g')).toBeInTheDocument()
    expect(screen.getByText('packing.totalWeight')).toBeInTheDocument()
    expect(screen.getByText('1.5 kg')).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-004: hides the unassigned pile when every item has a bag', () => {
    setup({ items: ITEMS.filter(i => i.bag_id != null) })
    expect(screen.queryByText('packing.noBag')).toBeNull()
  })

  it('FE-MOB-BAGS-005: scales the fill bar against the heaviest bag when no limit is set', () => {
    setup()
    // 300/1200 = 25 %, 1200/1200 = 100 %
    expect(fillBars().map(b => b.style.width)).toEqual(['25%', '100%'])
  })

  it('FE-MOB-BAGS-006: scales against the bag limit and caps at 100 %', () => {
    setup({ bags: [bag({ id: 1, name: 'Backpack', weight_limit_grams: 200 })] })
    expect(fillBars()[0].style.width).toBe('100%')
  })

  it('FE-MOB-BAGS-007: renames a bag on Enter', () => {
    const { onUpdateBag } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }))
    const input = screen.getByDisplayValue('Backpack')
    fireEvent.change(input, { target: { value: 'Daypack' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdateBag).toHaveBeenCalledWith(1, { name: 'Daypack' })
    // The row keeps showing the prop value until the parent pushes the update back.
    expect(screen.getByRole('button', { name: 'Backpack' })).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-008: renames on blur too, trimming the input', () => {
    const { onUpdateBag } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Suitcase' }))
    const input = screen.getByDisplayValue('Suitcase')
    fireEvent.change(input, { target: { value: '  Trunk  ' } })
    fireEvent.blur(input)

    expect(onUpdateBag).toHaveBeenCalledWith(2, { name: 'Trunk' })
  })

  it('FE-MOB-BAGS-009: keeps the old name when the edit is blank', () => {
    const { onUpdateBag } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }))
    const input = screen.getByDisplayValue('Backpack')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdateBag).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Backpack' })).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-010: Escape reverts the rename', () => {
    const { onUpdateBag } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }))
    const input = screen.getByDisplayValue('Backpack')
    fireEvent.change(input, { target: { value: 'Nope' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onUpdateBag).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Backpack' })).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-011: deletes a bag', () => {
    const { onDeleteBag } = setup()

    fireEvent.click(within(rowFor('Suitcase')).getByRole('button', { name: 'common.delete' }))

    expect(onDeleteBag).toHaveBeenCalledWith(2)
  })

  it('FE-MOB-BAGS-012: removes a member by tapping their avatar chip', () => {
    const { onSetBagMembers } = setup()

    fireEvent.click(within(rowFor('Backpack')).getByTitle('anna'))

    expect(onSetBagMembers).toHaveBeenCalledWith(1, [])
  })

  it('FE-MOB-BAGS-013: falls back to the initial when a member has no avatar', () => {
    setup()
    expect(within(rowFor('Suitcase')).getByTitle('ben')).toHaveTextContent('B')
  })

  it('FE-MOB-BAGS-014: adds a member from the picker', () => {
    const { onSetBagMembers } = setup()
    const row = rowFor('Backpack')

    fireEvent.click(within(row).getByRole('button', { name: 'common.add' }))
    const imgs = Array.from(row.querySelectorAll('img')).map(i => i.getAttribute('src'))
    expect(imgs).toContain('/uploads/avatars/anna.png')
    expect(imgs).toContain('https://cdn.example/ben.png')

    fireEvent.click(within(row).getByRole('button', { name: 'ben' }))

    expect(onSetBagMembers).toHaveBeenCalledWith(1, [11, 12])
  })

  it('FE-MOB-BAGS-015: shows the empty hint when the trip has no members', () => {
    setup({ tripMembers: [], bags: [bag({ id: 1, name: 'Backpack' })] })

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    expect(screen.getByText('packing.noMembers')).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-016: creates a bag from the inline field', () => {
    const { onCreateBag } = setup({ bags: [], items: [] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.addBag' }))
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('packing.bagName'), { target: { value: '  Duffel  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    expect(onCreateBag).toHaveBeenCalledWith('Duffel')
    expect(screen.getByRole('button', { name: 'packing.addBag' })).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-017: Enter submits and Escape aborts the new-bag field', () => {
    const { onCreateBag } = setup({ bags: [], items: [] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.addBag' }))
    fireEvent.keyDown(screen.getByPlaceholderText('packing.bagName'), { key: 'Enter' })
    expect(onCreateBag).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('packing.bagName'), { target: { value: 'Tote' } })
    fireEvent.keyDown(screen.getByPlaceholderText('packing.bagName'), { key: 'Enter' })
    expect(onCreateBag).toHaveBeenCalledWith('Tote')

    fireEvent.click(screen.getByRole('button', { name: 'packing.addBag' }))
    fireEvent.change(screen.getByPlaceholderText('packing.bagName'), { target: { value: 'x' } })
    fireEvent.keyDown(screen.getByPlaceholderText('packing.bagName'), { key: 'Escape' })

    expect(screen.getByRole('button', { name: 'packing.addBag' })).toBeInTheDocument()
    expect(onCreateBag).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-BAGS-018: read-only mode hides delete, add-bag, picker and rename', () => {
    const { onUpdateBag, onSetBagMembers } = setup({ canEdit: false })

    expect(screen.queryByRole('button', { name: 'common.delete' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'packing.addBag' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'common.add' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }))
    expect(screen.queryByDisplayValue('Backpack')).toBeNull()
    fireEvent.click(within(rowFor('Backpack')).getByTitle('anna'))

    expect(onUpdateBag).not.toHaveBeenCalled()
    expect(onSetBagMembers).not.toHaveBeenCalled()
  })

  it('FE-MOB-BAGS-019: closes from the header', () => {
    const { onClose } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))

    expect(onClose).toHaveBeenCalled()
  })

  // #207: the limit was storable and readable but had nowhere to be typed in.
  it('FE-MOB-BAGS-020: a limit typed in kg is stored in grams', () => {
    const { onUpdateBag } = setup({ bags: [bag({ id: 1, name: 'Backpack' })] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.setBagLimit' }))
    const input = screen.getByLabelText('packing.bagLimit')
    fireEvent.change(input, { target: { value: '7.5' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdateBag).toHaveBeenCalledWith(1, { weight_limit_grams: 7500 })
  })

  it('FE-MOB-BAGS-021: emptying the field clears the limit instead of storing zero', () => {
    const { onUpdateBag } = setup({ bags: [bag({ id: 1, name: 'Backpack', weight_limit_grams: 20000 })] })

    fireEvent.click(screen.getByRole('button', { name: 'packing.bagLimit' }))
    const input = screen.getByLabelText('packing.bagLimit')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdateBag).toHaveBeenCalledWith(1, { weight_limit_grams: null })
  })

  it('FE-MOB-BAGS-022: read-only mode offers no way to set a limit', () => {
    setup({ canEdit: false, bags: [bag({ id: 1, name: 'Backpack' })] })

    expect(screen.queryByRole('button', { name: 'packing.setBagLimit' })).toBeNull()
  })

  // #1767: an item somebody shared with me is theirs to carry, so it must not land in my
  // bag totals — while the common pool stays everyone's.
  it('FE-MOB-BAGS-023: an item shared with me is not added to my bag weight', () => {
    setup({
      currentUserId: 1,
      bags: [bag({ id: 1, name: 'Backpack' })],
      items: [
        item({ id: 1, name: 'Mine', bag_id: 1, weight_grams: 200, is_private: 1, owner_id: 1 } as Partial<PackingItem>),
        item({ id: 2, name: 'Binoculars', bag_id: 1, weight_grams: 300, is_private: 1, owner_id: 2 } as Partial<PackingItem>),
      ],
    })

    expect(within(rowFor('Backpack')).getByText('200 g')).toBeInTheDocument()
    expect(within(rowFor('Backpack')).getByText('1 admin.packingTemplates.items')).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-024: common items still count for everyone', () => {
    setup({
      currentUserId: 1,
      bags: [bag({ id: 1, name: 'Backpack' })],
      items: [
        item({ id: 1, name: 'First-aid kit', bag_id: 1, weight_grams: 500, is_private: 0, owner_id: 2 } as Partial<PackingItem>),
      ],
    })

    expect(within(rowFor('Backpack')).getByText('500 g')).toBeInTheDocument()
  })

  it('FE-MOB-BAGS-025: without a known viewer nothing is filtered out', () => {
    setup({
      bags: [bag({ id: 1, name: 'Backpack' })],
      items: [
        item({ id: 1, name: 'Binoculars', bag_id: 1, weight_grams: 300, is_private: 1, owner_id: 2 } as Partial<PackingItem>),
      ],
    })

    expect(within(rowFor('Backpack')).getByText('300 g')).toBeInTheDocument()
  })
})
