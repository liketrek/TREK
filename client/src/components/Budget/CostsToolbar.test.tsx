// FE-COSTSBAR-001 to FE-COSTSBAR-013
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import type { CostsFilterProps } from './CostsToolbar'
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

  describe('search and filters', () => {
    function filters(over: Partial<CostsFilterProps> = {}): CostsFilterProps {
      return {
        query: '', onQuery: vi.fn(), owner: 'all', onOwner: vi.fn(),
        category: '', categoryOptions: [{ value: '', label: 'All categories' }, { value: 'Food', label: 'Food' }], onCategory: vi.fn(),
        day: '', dayOptions: [{ value: '', label: 'All days' }, { value: '2025-06-01', label: 'Day 1' }], onDay: vi.fn(),
        onResetFilters: vi.fn(), onExport: vi.fn(), canExport: true, ...over,
      }
    }

    it('FE-COSTSBAR-009: the search reports what is typed, clears with its button and on Escape', async () => {
      const user = userEvent.setup()
      const f = filters({ query: 'taxi' })
      setup({ filters: f })
      const search = screen.getByRole('textbox', { name: 'Search' })
      await user.type(search, 's')
      expect(f.onQuery).toHaveBeenLastCalledWith('taxis')
      await user.click(screen.getByRole('button', { name: 'Clear' }))
      expect(f.onQuery).toHaveBeenLastCalledWith('')
      vi.mocked(f.onQuery).mockClear()
      fireEvent.keyDown(search, { key: 'Escape' })
      expect(f.onQuery).toHaveBeenCalledWith('')
    })

    it('FE-COSTSBAR-010: the filter menu picks whose, which category and which day', async () => {
      const user = userEvent.setup()
      const f = filters()
      setup({ filters: f })
      await user.click(screen.getByRole('button', { name: 'Filter' }))
      const menu = screen.getByRole('menu')
      await user.click(within(menu).getByRole('button', { name: 'Paid by me' }))
      await user.click(within(menu).getByRole('button', { name: 'Food' }))
      await user.click(within(menu).getByRole('button', { name: 'Day 1' }))
      expect(f.onOwner).toHaveBeenCalledWith('mine')
      expect(f.onCategory).toHaveBeenCalledWith('Food')
      expect(f.onDay).toHaveBeenCalledWith('2025-06-01')
      expect(within(menu).queryByRole('button', { name: 'Reset filters' })).toBeNull()
      fireEvent.keyDown(menu, { key: 'Escape' })
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('FE-COSTSBAR-011: with filters on, the button counts them and the menu resets them', async () => {
      const user = userEvent.setup()
      const f = filters({ owner: 'owed', category: 'Food', day: '2025-06-01' })
      setup({ filters: f })
      const button = screen.getByRole('button', { name: 'Filter' })
      expect(within(button).getByText('3')).toBeInTheDocument()
      await user.click(button)
      await user.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Reset filters' }))
      expect(f.onResetFilters).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('FE-COSTSBAR-012: export runs while there is something to export', async () => {
      const user = userEvent.setup()
      const f = filters()
      const { unmount } = render(
        <CostsToolbar dateMeta={null} people={PEOPLE} me={1} colorFor={() => '#000'} canEdit canSettle
          onSettleAll={vi.fn()} onAddExpense={vi.fn()} filters={f} />,
      )
      await user.click(screen.getByRole('button', { name: 'Export CSV' }))
      expect(f.onExport).toHaveBeenCalledTimes(1)
      unmount()
      setup({ filters: filters({ canExport: false }) })
      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
    })

    it('FE-COSTSBAR-013: the view switch marks the current view and reports a new one', async () => {
      const user = userEvent.setup()
      const onView = vi.fn()
      setup({ view: 'list', onView })
      const group = screen.getByRole('group')
      const buttons = within(group).getAllByRole('button')
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
      await user.click(buttons[1])
      expect(onView).toHaveBeenCalledWith('table')
    })
  })
})
