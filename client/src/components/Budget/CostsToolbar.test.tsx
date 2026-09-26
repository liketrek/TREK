// FE-COSTSBAR-001 to FE-COSTSBAR-008
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import CostsToolbar from './CostsToolbar'
import type { TripMember } from './BudgetPanelMemberChips'

const PEOPLE: TripMember[] = [
  { id: 1, username: 'ada', avatar_url: '/uploads/avatars/ada.png' },
  { id: 2, username: 'bob', avatar_url: null },
]

function setup(props: Partial<Parameters<typeof CostsToolbar>[0]> = {}) {
  const onSettleAll = vi.fn()
  const onAddExpense = vi.fn()
  render(
    <CostsToolbar dateMeta={{ range: 'Oct 9 – Oct 16', days: 8 }} people={PEOPLE} me={1} colorFor={() => 'linear-gradient(#000,#111)'}
      canEdit canSettle onSettleAll={onSettleAll} onAddExpense={onAddExpense} {...props} />,
  )
  return { onSettleAll, onAddExpense }
}

describe('CostsToolbar', () => {
  it('FE-COSTSBAR-001: names the tab like the other planner bars', () => {
    setup()
    expect(screen.getByRole('heading', { level: 2, name: 'Costs' })).toBeInTheDocument()
  })

  it('FE-COSTSBAR-002: splits the trip span and its days with a rule instead of a dot', () => {
    setup()
    const days = screen.getByText('8 days')
    const pill = days.parentElement!
    expect(pill).toHaveTextContent('Oct 9 – Oct 16')
    expect(pill.textContent).not.toContain('·')
    expect(pill.querySelector('[aria-hidden]')).not.toBeNull()
  })

  it('FE-COSTSBAR-003: leaves the span out for a trip without dates', () => {
    setup({ dateMeta: null })
    expect(screen.queryByText(/^\d+ days$/)).toBeNull()
    expect(screen.getByText('2 travelers')).toBeInTheDocument()
  })

  it('FE-COSTSBAR-004: shows each traveler by avatar, or by initial with "you" for the viewer', () => {
    setup({ people: [{ id: 1, username: 'ada', avatar_url: null }, ...PEOPLE.slice(1), { id: 3, username: 'cy', avatar_url: '/uploads/avatars/cy.png' }] })
    expect(screen.getByText('Y')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(document.querySelector('img[src="/uploads/avatars/cy.png"]')).not.toBeNull()
    expect(screen.getByText('3 travelers')).toBeInTheDocument()
  })

  it('FE-COSTSBAR-005: runs settle up and add expense from the right of the bar', () => {
    const { onSettleAll, onAddExpense } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Settle up' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(onSettleAll).toHaveBeenCalledTimes(1)
    expect(onAddExpense).toHaveBeenCalledTimes(1)
  })

  it('FE-COSTSBAR-006: disables settle up while there is nothing to settle', () => {
    setup({ canSettle: false })
    expect(screen.getByRole('button', { name: 'Settle up' })).toBeDisabled()
  })

  it('FE-COSTSBAR-007: a viewer without edit rights gets the bar without actions', () => {
    setup({ canEdit: false })
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('8 days')).toBeInTheDocument()
  })

  it('FE-COSTSBAR-008: offers Scan receipt only when handed a way to open it', () => {
    const onScanReceipt = vi.fn()
    const { unmount } = render(
      <CostsToolbar dateMeta={null} people={PEOPLE} me={1} colorFor={() => '#000'} canEdit canSettle
        onSettleAll={vi.fn()} onAddExpense={vi.fn()} onScanReceipt={onScanReceipt} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Scan receipt' }))
    expect(onScanReceipt).toHaveBeenCalledTimes(1)
    unmount()

    setup()
    expect(screen.queryByRole('button', { name: 'Scan receipt' })).toBeNull()
  })
})
