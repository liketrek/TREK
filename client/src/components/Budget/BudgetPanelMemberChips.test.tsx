// FE-W4BMC-001 to FE-W4BMC-016
import { describe, it, expect, vi } from 'vitest'
import type { BudgetItemMember } from '../../types'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import BudgetMemberChips, { ChipWithTooltip, type TripMember } from './BudgetPanelMemberChips'

const TRIP_MEMBERS: TripMember[] = [
  { id: 1, username: 'ada', avatar_url: '/uploads/avatars/ada.png' },
  { id: 2, username: 'bob', avatar_url: null },
]

function member(overrides: Partial<BudgetItemMember> = {}): BudgetItemMember {
  return { user_id: 1, username: 'ada', avatar_url: null, paid: 0, ...overrides } as unknown as BudgetItemMember
}

function setup(props: Partial<Parameters<typeof BudgetMemberChips>[0]> = {}) {
  const onSetMembers = vi.fn()
  const onTogglePaid = vi.fn()
  const utils = render(
    <BudgetMemberChips members={[member()]} tripMembers={TRIP_MEMBERS} onSetMembers={onSetMembers} onTogglePaid={onTogglePaid} {...props} />,
  )
  return { onSetMembers, onTogglePaid, ...utils }
}

/**
 * The member picker trigger. A chip that can be clicked is a real button too,
 * so it is the icon that tells the trigger apart from the chips before it.
 */
function picker(): HTMLElement {
  const trigger = screen.getAllByRole('button').find(b => b.querySelector('.lucide-pencil, .lucide-users'))
  if (!trigger) throw new Error('no picker trigger rendered')
  return trigger
}

describe('ChipWithTooltip', () => {
  it('FE-W4BMC-001: falls back to the uppercased initial', () => {
    const { container } = render(<ChipWithTooltip label="ada" avatarUrl={null} />)

    expect(container.firstElementChild).toHaveTextContent('A')
  })

  it('FE-W4BMC-002: renders the avatar when one is given', () => {
    const { container } = render(<ChipWithTooltip label="ada" avatarUrl="/uploads/avatars/ada.png" />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/ada.png')
  })

  it('FE-W4BMC-003: hovering portals a name tooltip and leaving removes it', () => {
    const { container } = render(<ChipWithTooltip label="Ada Lovelace" avatarUrl={null} />)
    const chip = container.firstElementChild as HTMLElement

    fireEvent.mouseEnter(chip)
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()

    fireEvent.mouseLeave(chip)
    expect(screen.queryByText('Ada Lovelace')).toBeNull()
  })

  it('FE-W4BMC-004: a paid chip turns green and the tooltip carries a Paid tag', () => {
    const { container } = render(<ChipWithTooltip label="ada" avatarUrl={null} paid />)
    const chip = container.firstElementChild as HTMLElement

    expect(chip.style.border).toBe('2px solid rgb(34, 197, 94)')
    fireEvent.mouseEnter(chip)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('FE-W4BMC-005: only a clickable chip gets the pointer cursor', () => {
    const onClick = vi.fn()
    const { container, unmount } = render(<ChipWithTooltip label="ada" avatarUrl={null} onClick={onClick} />)
    const chip = container.firstElementChild as HTMLElement

    expect(chip.style.cursor).toBe('pointer')
    fireEvent.click(chip)
    expect(onClick).toHaveBeenCalledOnce()
    unmount()

    const plain = render(<ChipWithTooltip label="ada" avatarUrl={null} />)
    expect((plain.container.firstElementChild as HTMLElement).style.cursor).toBe('default')
  })
})

describe('BudgetMemberChips', () => {
  it('FE-W4BMC-006: renders one chip per assigned member plus the picker button', () => {
    setup({ members: [member(), member({ user_id: 2, username: 'bob' })] })

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(picker()).toBeInTheDocument()
  })

  it('FE-W4BMC-007: uses the people icon while nobody is assigned and the pencil afterwards', () => {
    const { container, unmount } = setup({ members: [] })
    expect(container.querySelector('.lucide-users')).not.toBeNull()
    unmount()

    const withMembers = setup()
    expect(withMembers.container.querySelector('.lucide-pencil')).not.toBeNull()
  })

  it('FE-W4BMC-008: clicking a chip toggles that member paid flag', () => {
    const { onTogglePaid } = setup()

    fireEvent.click(screen.getByText('A'))

    expect(onTogglePaid).toHaveBeenCalledWith(1, true)
  })

  it('FE-W4BMC-009: clicking an already-paid chip clears the flag', () => {
    const { onTogglePaid } = setup({ members: [member({ paid: 1 })] })

    fireEvent.click(screen.getByText('A'))

    expect(onTogglePaid).toHaveBeenCalledWith(1, false)
  })

  it('FE-W4BMC-010: a read-only strip has no picker and no paid toggling', () => {
    const { onTogglePaid } = setup({ readOnly: true })

    expect(screen.queryByRole('button')).toBeNull()
    fireEvent.click(screen.getByText('A'))
    expect(onTogglePaid).not.toHaveBeenCalled()
  })

  it('FE-W4BMC-011: the picker lists every trip member and marks the assigned ones', () => {
    setup()
    fireEvent.click(picker())

    const rows = screen.getAllByRole('button').slice(2)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('ada')
    expect(rows[0].querySelector('.lucide-check')).not.toBeNull()
    expect(rows[1].querySelector('.lucide-check')).toBeNull()
    expect(rows[0].querySelector('img')).toHaveAttribute('src', '/uploads/avatars/ada.png')
    expect(rows[1]).toHaveTextContent('B')
  })

  it('FE-W4BMC-012: picking an unassigned member adds them', () => {
    const { onSetMembers } = setup()
    fireEvent.click(picker())

    fireEvent.click(screen.getAllByRole('button')[3])

    expect(onSetMembers).toHaveBeenCalledWith([1, 2])
  })

  it('FE-W4BMC-013: picking an assigned member removes them', () => {
    const { onSetMembers } = setup()
    fireEvent.click(picker())

    fireEvent.click(screen.getAllByRole('button')[2])

    expect(onSetMembers).toHaveBeenCalledWith([])
  })

  it('FE-W4BMC-014: a mousedown outside closes the picker, inside keeps it', () => {
    setup()
    const trigger = picker()
    fireEvent.click(trigger)

    fireEvent.mouseDown(screen.getAllByRole('button')[2])
    expect(screen.getAllByRole('button')).toHaveLength(4)

    fireEvent.mouseDown(trigger)
    expect(screen.getAllByRole('button')).toHaveLength(4)

    fireEvent.mouseDown(document.body)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('FE-W4BMC-015: the trigger toggles the picker closed again', () => {
    setup()
    const trigger = picker()

    fireEvent.click(trigger)
    expect(screen.getAllByRole('button')).toHaveLength(4)

    fireEvent.click(trigger)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('FE-W4BMC-016: the non-compact variant renders larger chips', () => {
    setup({ compact: false })

    expect(screen.getByText('A')).toHaveStyle({ width: '30px' })
    expect(picker().style.width).toBe('28px')
  })
})
