// FE-W4PSC-001 to FE-W4PSC-015, FE-W5PSC-001 to FE-W5PSC-009
import { describe, it, expect, vi } from 'vitest'
import type { PackingItem } from '../../types'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import PackingShareControl from './PackingShareControl'
import type { TripMember } from './usePackingListPanel'

const MEMBERS = [
  { id: 1, username: 'ada' },
  { id: 2, username: 'bob' },
  { id: 3, username: 'cleo' },
] as unknown as TripMember[]

function item(overrides: Partial<PackingItem> = {}): PackingItem {
  return { id: 5, name: 'Tent', is_private: 0, owner_id: 1, recipients: [], contributors: [], ...overrides } as unknown as PackingItem
}

function setup(it_: PackingItem, currentUserId = 1) {
  const onSetSharing = vi.fn()
  const onClone = vi.fn()
  const onJoin = vi.fn()
  const onLeave = vi.fn()
  const utils = render(
    <PackingShareControl
      item={it_} tripMembers={MEMBERS} currentUserId={currentUserId}
      onSetSharing={onSetSharing} onClone={onClone} onJoin={onJoin} onLeave={onLeave}
    />,
  )
  return { onSetSharing, onClone, onJoin, onLeave, ...utils }
}

describe('PackingShareControl — owner', () => {
  it('FE-W4PSC-001: shows the share trigger for the owner of a common item', () => {
    setup(item())

    expect(screen.getByRole('button', { name: /sharing/i })).toBeInTheDocument()
  })

  it('FE-W4PSC-002: opening the menu lists both tiers plus every other member', () => {
    setup(item())

    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    expect(screen.getByText(/^Shared$/)).toBeInTheDocument()
    expect(screen.getByText(/^Personal$/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bob/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cleo/ })).toBeInTheDocument()
    // Neither the owner nor the current user is offered as a recipient.
    expect(screen.queryByRole('button', { name: /ada/ })).toBeNull()
  })

  it('FE-W4PSC-003: picking Personal reports the tier and closes the menu', () => {
    const { onSetSharing } = setup(item())
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    fireEvent.click(screen.getByText(/^Personal$/))

    expect(onSetSharing).toHaveBeenCalledWith(5, 'personal', [])
    expect(screen.queryByText(/^Personal$/)).toBeNull()
  })

  it('FE-W4PSC-004: picking the common tier reports it', () => {
    const { onSetSharing } = setup(item({ is_private: 1 } as Partial<PackingItem>))
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    fireEvent.click(screen.getByText(/^Shared$/))

    expect(onSetSharing).toHaveBeenCalledWith(5, 'common', [])
  })

  it('FE-W4PSC-005: toggling a member on shares the item with them', () => {
    const { onSetSharing } = setup(item({ is_private: 1 } as Partial<PackingItem>))
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    fireEvent.click(screen.getByRole('button', { name: /bob/ }))

    expect(onSetSharing).toHaveBeenCalledWith(5, 'shared', [2])
  })

  it('FE-W4PSC-006: toggling an existing recipient off removes them', () => {
    const { onSetSharing } = setup(item({ is_private: 1, recipients: [{ user_id: 2 }, { user_id: 3 }] } as unknown as Partial<PackingItem>))
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    fireEvent.click(screen.getByRole('button', { name: /bob/ }))

    expect(onSetSharing).toHaveBeenCalledWith(5, 'shared', [3])
  })

  it('FE-W4PSC-007: an item with recipients reads as the shared tier', () => {
    setup(item({ is_private: 1, recipients: [{ user_id: 2 }] } as unknown as Partial<PackingItem>))
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    // The chosen recipient carries the check mark.
    expect(screen.getByRole('button', { name: /bob/ }).querySelector('svg')).not.toBeNull()
  })

  it('FE-W4PSC-008: shows a hint when there is nobody else to share with', () => {
    render(
      <PackingShareControl
        item={item()} tripMembers={[MEMBERS[0]]} currentUserId={1}
        onSetSharing={() => {}} onClone={() => {}} onJoin={() => {}} onLeave={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    expect(screen.getByText(/no one/i)).toBeInTheDocument()
  })

  it('FE-W4PSC-009: the scrim closes the menu', () => {
    const { baseElement } = setup(item())
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))

    // The scrim is the portaled full-screen layer that sits just under the menu.
    fireEvent.click(baseElement.querySelector('div[style*="z-index: 1099"]')!)

    expect(screen.queryByText(/^Personal$/)).toBeNull()
  })

  it('FE-W4PSC-010: the trigger toggles the menu closed again', () => {
    setup(item())
    const trigger = screen.getByRole('button', { name: /sharing/i })

    fireEvent.click(trigger)
    expect(screen.getByText(/^Personal$/)).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByText(/^Personal$/)).toBeNull()
  })

  it('FE-W4PSC-011: an unowned item is treated as the current user own', () => {
    setup(item({ owner_id: null } as unknown as Partial<PackingItem>), 9)

    expect(screen.getByRole('button', { name: /sharing/i })).toBeInTheDocument()
  })
})

describe('PackingShareControl — other members', () => {
  it('FE-W4PSC-012: a non-owner can pledge to co-bring a common item', () => {
    const { onJoin } = setup(item(), 2)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0])

    expect(onJoin).toHaveBeenCalledWith(5)
  })

  it('FE-W4PSC-013: a pledged contributor can withdraw again', () => {
    const { onLeave } = setup(item({ contributors: [{ user_id: 2 }] } as unknown as Partial<PackingItem>), 2)

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(onLeave).toHaveBeenCalledWith(5, 2)
  })

  it('FE-W4PSC-014: a non-owner can clone a common item to their own list', () => {
    const { onClone } = setup(item(), 2)

    fireEvent.click(screen.getAllByRole('button')[1])

    expect(onClone).toHaveBeenCalledWith(5)
  })

  it('FE-W4PSC-015: a recipient of a shared item gets no controls', () => {
    const { container } = setup(item({ is_private: 1, recipients: [{ user_id: 2 }] } as unknown as Partial<PackingItem>), 2)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('PackingShareControl — hover affordances', () => {
  it('FE-W5PSC-001: the trigger of a common item highlights on hover and resets on leave', () => {
    setup(item())
    const trigger = screen.getByRole('button', { name: /sharing/i })

    fireEvent.mouseEnter(trigger)
    expect(trigger.style.color).toBe('var(--text-secondary)')

    fireEvent.mouseLeave(trigger)
    expect(trigger.style.color).toBe('var(--text-faint)')
  })

  it('FE-W5PSC-002: a non-common item keeps its accent colour while hovered', () => {
    setup(item({ is_private: 1 } as Partial<PackingItem>))
    const trigger = screen.getByRole('button', { name: /sharing/i })

    fireEvent.mouseEnter(trigger)
    expect(trigger.style.color).toBe('var(--accent)')

    fireEvent.mouseLeave(trigger)
    expect(trigger.style.color).toBe('var(--accent)')
  })

  it('FE-W5PSC-003: the inactive tier row takes a hover background and drops it again', () => {
    setup(item())
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))
    // The item is Common, so the Personal row is the inactive one.
    const personalRow = screen.getByText(/^Personal$/).closest('button')!

    fireEvent.mouseEnter(personalRow)
    expect(personalRow.style.background).toBe('var(--bg-tertiary)')

    fireEvent.mouseLeave(personalRow)
    expect(personalRow.style.background).toBe('none')
  })

  it('FE-W5PSC-004: the active tier row ignores hover', () => {
    setup(item())
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))
    const commonRow = screen.getByText(/^Shared$/).closest('button')!
    const before = commonRow.style.background

    fireEvent.mouseEnter(commonRow)
    fireEvent.mouseLeave(commonRow)

    expect(commonRow.style.background).toBe(before)
  })

  it('FE-W5PSC-005: a recipient row highlights on hover', () => {
    setup(item({ is_private: 1 } as Partial<PackingItem>))
    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))
    const bob = screen.getByRole('button', { name: /bob/ })

    fireEvent.mouseEnter(bob)
    expect(bob.style.background).toBe('var(--bg-tertiary)')

    fireEvent.mouseLeave(bob)
    expect(bob.style.background).toBe('none')
  })

  it('FE-W5PSC-006: the co-bring button of a non-contributor highlights on hover', () => {
    setup(item(), 2)
    const pledge = screen.getAllByRole('button')[0]

    fireEvent.mouseEnter(pledge)
    expect(pledge.style.color).toBe('var(--text-secondary)')

    fireEvent.mouseLeave(pledge)
    expect(pledge.style.color).toBe('var(--text-faint)')
  })

  it('FE-W5PSC-007: an already pledged contributor keeps the accent colour while hovered', () => {
    setup(item({ contributors: [{ user_id: 2 }] } as unknown as Partial<PackingItem>), 2)
    const pledge = screen.getAllByRole('button')[0]

    fireEvent.mouseEnter(pledge)
    fireEvent.mouseLeave(pledge)

    expect(pledge.style.color).toBe('var(--accent)')
  })
})

describe('PackingShareControl — optional fields', () => {
  it('FE-W5PSC-008: an item without recipients or contributors reads as the common tier', () => {
    const bare = { id: 7, name: 'Stove', is_private: 0, owner_id: 1 } as unknown as PackingItem
    const onSetSharing = vi.fn()
    render(
      <PackingShareControl
        item={bare} tripMembers={MEMBERS} currentUserId={1}
        onSetSharing={onSetSharing} onClone={() => {}} onJoin={() => {}} onLeave={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /sharing/i }))
    fireEvent.click(screen.getByRole('button', { name: /bob/ }))

    expect(onSetSharing).toHaveBeenCalledWith(7, 'shared', [2])
  })

  it('FE-W5PSC-009: a non-owner without a contributor list can still pledge', () => {
    const bare = { id: 8, name: 'Stove', is_private: 0, owner_id: 1 } as unknown as PackingItem
    const onJoin = vi.fn()
    render(
      <PackingShareControl
        item={bare} tripMembers={MEMBERS} currentUserId={3}
        onSetSharing={() => {}} onClone={() => {}} onJoin={onJoin} onLeave={() => {}}
      />,
    )

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(onJoin).toHaveBeenCalledWith(8)
  })
})
