// FE-PLANNER-DAYREORDER-001 to FE-PLANNER-DAYREORDER-028
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { MapPin } from 'lucide-react'
import { buildDay } from '../../../tests/helpers/factories'
import { DayReorderPopup } from './DayReorderPopup'
import { setForcedOffline } from '../../sync/networkMode'
import type { DayAddControls } from '../../utils/dayAdd'
import type { DayDeleteQuestion } from '../../utils/dayImpactLines'
import type { Day } from '../../types'

// The component takes `t` as a prop, so returning the key keeps assertions exact.
const t = (key: string) => key

function makeProps(overrides: Partial<React.ComponentProps<typeof DayReorderPopup>> = {}) {
  return {
    isOpen: true,
    days: [] as Day[],
    t,
    locale: 'en-US',
    onReorder: vi.fn(),
    onAddDay: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
}

function rows() {
  return Array.from(document.querySelectorAll<HTMLElement>('[draggable="true"]'))
}

const threeDays = () => [
  buildDay({ id: 3, title: 'Paris', day_number: 1 }),
  buildDay({ id: 7, title: 'Lyon', day_number: 2 }),
  buildDay({ id: 9, title: 'Nice', day_number: 3 }),
]

describe('DayReorderPopup', () => {
  it('FE-PLANNER-DAYREORDER-001: renders nothing while closed', () => {
    render(<DayReorderPopup {...makeProps({ isOpen: false, days: threeDays() })} />)
    expect(screen.queryByText('Paris')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DAYREORDER-002: renders one row per day with its position number', () => {
    render(<DayReorderPopup {...makeProps({ days: threeDays() })} />)
    expect(rows()).toHaveLength(3)
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('Nice')).toBeInTheDocument()
    expect(screen.getByText('dayplan.reorderHint')).toBeInTheDocument()
  })

  it('FE-PLANNER-DAYREORDER-003: sorts rows by day_number, not by array order', () => {
    const days = [
      buildDay({ id: 1, title: 'Third', day_number: 3 }),
      buildDay({ id: 2, title: 'First', day_number: 1 }),
      buildDay({ id: 3, title: 'Second', day_number: 2 }),
    ]
    render(<DayReorderPopup {...makeProps({ days })} />)
    const labels = rows().map(r => r.querySelectorAll('span')[1].textContent)
    expect(labels).toEqual(['First', 'Second', 'Third'])
  })

  it('FE-PLANNER-DAYREORDER-004: falls back to the formatted date when a day has no title', () => {
    const days = [buildDay({ id: 1, title: null, date: '2025-06-15', day_number: 1 })]
    render(<DayReorderPopup {...makeProps({ days })} />)
    expect(screen.getByText(/Jun 15|Sun/)).toBeInTheDocument()
  })

  it('FE-PLANNER-DAYREORDER-005: falls back to the day-number label with neither title nor date', () => {
    const days = [{ ...buildDay({ id: 1, title: null, day_number: 1 }), date: '' } as unknown as Day]
    render(<DayReorderPopup {...makeProps({ days })} />)
    expect(screen.getByText('dayplan.dayN')).toBeInTheDocument()
  })

  it('FE-PLANNER-DAYREORDER-006: the down arrow moves a day one slot later', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<DayReorderPopup {...makeProps({ days: threeDays(), onReorder })} />)
    await user.click(screen.getAllByLabelText('dayplan.moveDown')[0])
    expect(onReorder).toHaveBeenCalledWith([7, 3, 9])
  })

  it('FE-PLANNER-DAYREORDER-007: the up arrow moves a day one slot earlier', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<DayReorderPopup {...makeProps({ days: threeDays(), onReorder })} />)
    await user.click(screen.getAllByLabelText('dayplan.moveUp')[2])
    expect(onReorder).toHaveBeenCalledWith([3, 9, 7])
  })

  it('FE-PLANNER-DAYREORDER-008: the first up arrow and the last down arrow are disabled', () => {
    render(<DayReorderPopup {...makeProps({ days: threeDays() })} />)
    const ups = screen.getAllByLabelText('dayplan.moveUp')
    const downs = screen.getAllByLabelText('dayplan.moveDown')
    expect(ups[0]).toBeDisabled()
    expect(ups[2]).not.toBeDisabled()
    expect(downs[2]).toBeDisabled()
    expect(downs[0]).not.toBeDisabled()
  })

  it('FE-PLANNER-DAYREORDER-009: dropping a dragged row onto another reorders to that slot', () => {
    const onReorder = vi.fn()
    render(<DayReorderPopup {...makeProps({ days: threeDays(), onReorder })} />)
    const [first, , third] = rows()
    fireEvent.dragStart(first)
    fireEvent.dragOver(third)
    fireEvent.drop(third)
    expect(onReorder).toHaveBeenCalledWith([7, 9, 3])
  })

  it('FE-PLANNER-DAYREORDER-010: dropping a row onto itself does not reorder', () => {
    const onReorder = vi.fn()
    render(<DayReorderPopup {...makeProps({ days: threeDays(), onReorder })} />)
    const [first] = rows()
    fireEvent.dragStart(first)
    fireEvent.dragOver(first)
    fireEvent.drop(first)
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('FE-PLANNER-DAYREORDER-011: dragEnd clears the drag highlight without reordering', () => {
    const onReorder = vi.fn()
    render(<DayReorderPopup {...makeProps({ days: threeDays(), onReorder })} />)
    const [first, second] = rows()
    fireEvent.dragStart(first)
    fireEvent.dragOver(second)
    // The hovered row is highlighted while a drag is in flight.
    expect(second).toHaveClass('outline-dashed')
    fireEvent.dragEnd(first)
    expect(second).not.toHaveClass('outline-dashed')
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('FE-PLANNER-DAYREORDER-012: the footer buttons close the popup and add a day', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onAddDay = vi.fn()
    render(<DayReorderPopup {...makeProps({ days: threeDays(), onClose, onAddDay })} />)
    await user.click(screen.getByText('dayplan.addDay'))
    expect(onAddDay).toHaveBeenCalled()
    await user.click(screen.getByText('common.close'))
    expect(onClose).toHaveBeenCalled()
  })

  describe('deleting a day', () => {
    afterEach(() => setForcedOffline(false))

    it('FE-PLANNER-DAYREORDER-013: each row asks to delete its own day, and only asks', async () => {
      const user = userEvent.setup()
      const onDeleteDay = vi.fn()
      const onReorder = vi.fn()
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay, onReorder })} />)
      const buttons = screen.getAllByRole('button', { name: 'dayplan.deleteDay' })
      expect(buttons).toHaveLength(3)
      await user.click(buttons[1])
      expect(onDeleteDay).toHaveBeenCalledWith(7)
      expect(onReorder).not.toHaveBeenCalled()
    })

    it('FE-PLANNER-DAYREORDER-014: without a delete handler the rows carry no delete button', () => {
      render(<DayReorderPopup {...makeProps({ days: threeDays() })} />)
      expect(screen.queryByRole('button', { name: 'dayplan.deleteDay' })).not.toBeInTheDocument()
      // The label is still the row's second span, next to its position badge.
      expect(rows()[0].querySelectorAll('span')[1].textContent).toBe('Paris')
    })

    it('FE-PLANNER-DAYREORDER-015: the only day of a trip cannot be deleted', async () => {
      const user = userEvent.setup()
      const onDeleteDay = vi.fn()
      render(<DayReorderPopup {...makeProps({ days: [buildDay({ id: 3, title: 'Paris', day_number: 1 })], onDeleteDay })} />)
      const button = screen.getByRole('button', { name: 'dayplan.deleteDay' })
      expect(button).toBeDisabled()
      await user.click(button)
      expect(onDeleteDay).not.toHaveBeenCalled()
    })

    it('FE-PLANNER-DAYREORDER-016: offline every delete button is off, and hovering says why', async () => {
      setForcedOffline(true)
      const user = userEvent.setup()
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn() })} />)
      const buttons = screen.getAllByRole('button', { name: 'dayplan.deleteDay' })
      expect(buttons.every(b => (b as HTMLButtonElement).disabled)).toBe(true)
      await user.hover(buttons[0].parentElement as HTMLElement)
      expect(await screen.findByText('dayplan.daysOffline')).toBeInTheDocument()
    })
  })

  describe('adding a day', () => {
    const tWithDate = (key: string, params?: Record<string, unknown>) => (params?.date ? `${key}|${params.date}` : key)
    const controls = (overrides: Partial<DayAddControls> = {}): DayAddControls => ({
      nextDate: '2026-10-13', blocked: null, datedBlocked: null, busy: false, onAddDated: vi.fn(), ...overrides,
    })

    it('FE-PLANNER-DAYREORDER-017: a trip with dates offers a day without a date and the next date, by name', () => {
      render(<DayReorderPopup {...makeProps({ days: threeDays(), t: tWithDate, dayAdd: controls() })} />)
      expect(screen.getByRole('button', { name: 'dayplan.addUndatedDay' })).toBeEnabled()
      expect(screen.getByRole('button', { name: /^dayplan\.addDatedDay\|.*Oct 13/ })).toBeEnabled()
      expect(screen.queryByRole('button', { name: 'dayplan.addDay' })).not.toBeInTheDocument()
      expect(screen.getByText(/^dayplan\.addDatedDayHint\|.*Oct 13/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'common.close' })).toBeInTheDocument()
    })

    it('FE-PLANNER-DAYREORDER-018: each button adds its own kind of day', async () => {
      const user = userEvent.setup()
      const onAddDay = vi.fn()
      const dayAdd = controls()
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onAddDay, dayAdd })} />)
      await user.click(screen.getByRole('button', { name: 'dayplan.addUndatedDay' }))
      expect(onAddDay).toHaveBeenCalledTimes(1)
      expect(dayAdd.onAddDated).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'dayplan.addDatedDay' }))
      expect(dayAdd.onAddDated).toHaveBeenCalledTimes(1)
      expect(onAddDay).toHaveBeenCalledTimes(1)
    })

    it('FE-PLANNER-DAYREORDER-019: a trip without dates keeps the single button, which waits for the connection', async () => {
      const user = userEvent.setup()
      const onAddDay = vi.fn()
      const { rerender } = render(<DayReorderPopup {...makeProps({ days: threeDays(), onAddDay, dayAdd: controls({ nextDate: null }) })} />)
      expect(screen.queryByRole('button', { name: 'dayplan.addDatedDay' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'dayplan.addDay' }))
      expect(onAddDay).toHaveBeenCalledTimes(1)

      rerender(<DayReorderPopup {...makeProps({ days: threeDays(), onAddDay, dayAdd: controls({ nextDate: null, blocked: 'dayplan.daysOffline' }) })} />)
      expect(screen.getByRole('button', { name: 'dayplan.addDay' })).toBeDisabled()
      expect(screen.getByText('dayplan.daysOffline')).toBeInTheDocument()
    })

    it('FE-PLANNER-DAYREORDER-020: busy or offline turns both off, a trip at the day limit only the dated one, and the line says why', () => {
      const { rerender } = render(<DayReorderPopup {...makeProps({ days: threeDays(), dayAdd: controls({ busy: true }) })} />)
      expect(screen.getByRole('button', { name: 'dayplan.addUndatedDay' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'dayplan.addDatedDay' })).toBeDisabled()

      rerender(<DayReorderPopup {...makeProps({ days: threeDays(), dayAdd: controls({ blocked: 'dayplan.daysOffline' }) })} />)
      expect(screen.getByRole('button', { name: 'dayplan.addUndatedDay' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'dayplan.addDatedDay' })).toBeDisabled()
      expect(screen.getByText('dayplan.daysOffline')).toBeInTheDocument()

      rerender(<DayReorderPopup {...makeProps({ days: threeDays(), dayAdd: controls({ datedBlocked: 'dashboard.tripTooLong' }) })} />)
      expect(screen.getByRole('button', { name: 'dayplan.addUndatedDay' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'dayplan.addDatedDay' })).toBeDisabled()
      expect(screen.getByText('dashboard.tripTooLong')).toBeInTheDocument()
    })

    it('FE-PLANNER-DAYREORDER-021: the line under the buttons follows the pointer and the focus onto the undated one', async () => {
      const user = userEvent.setup()
      render(<DayReorderPopup {...makeProps({ days: threeDays(), dayAdd: controls() })} />)
      const undated = screen.getByRole('button', { name: 'dayplan.addUndatedDay' })
      expect(screen.getByText('dayplan.addDatedDayHint')).toBeInTheDocument()

      await user.hover(undated)
      expect(screen.getByText('dayplan.addUndatedDayHint')).toBeInTheDocument()
      await user.unhover(undated)
      expect(screen.getByText('dayplan.addDatedDayHint')).toBeInTheDocument()

      fireEvent.focus(undated)
      expect(screen.getByText('dayplan.addUndatedDayHint')).toBeInTheDocument()
      fireEvent.blur(undated)
      expect(screen.getByText('dayplan.addDatedDayHint')).toBeInTheDocument()
      // Both buttons are described by that line.
      const hintId = screen.getByText('dayplan.addDatedDayHint').id
      expect(undated).toHaveAttribute('aria-describedby', hintId)
    })
  })

  describe('the delete question, asked in place of the list', () => {
    const question = (overrides: Partial<DayDeleteQuestion> = {}): DayDeleteQuestion => ({
      dayId: 7,
      title: 'Delete Lyon?',
      lines: [{ key: 'places', icon: MapPin, tone: 'neutral', text: 'Planned places: 2', hint: 'They stay in the place list.' }],
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
      ...overrides,
    })

    it('FE-PLANNER-DAYREORDER-022: the question takes the place of the rows and the add buttons, in the same dialog', () => {
      const dayAdd: DayAddControls = { nextDate: '2026-10-13', blocked: null, datedBlocked: null, busy: false, onAddDated: vi.fn() }
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: question(), dayAdd })} />)
      expect(rows()).toHaveLength(0)
      expect(screen.queryByRole('button', { name: 'dayplan.addUndatedDay' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'common.close' })).not.toBeInTheDocument()
      // Still the reorder dialog: its own title stays, the question sits under it.
      expect(screen.getByText('dayplan.reorderTitle')).toBeInTheDocument()
      const section = screen.getByRole('region', { name: 'Delete Lyon?' })
      expect(section).toHaveAccessibleDescription('dayplan.deleteDayBody')
      expect(screen.getByRole('list', { name: 'Delete Lyon?' })).toHaveTextContent('Planned places: 2')
      expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'dayplan.deleteDay' })).toBeInTheDocument()
    })

    it('FE-PLANNER-DAYREORDER-023: Cancel takes the question back, the delete button answers it', async () => {
      const user = userEvent.setup()
      const q = question()
      const onClose = vi.fn()
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: q, onClose })} />)
      await user.click(screen.getByRole('button', { name: 'common.cancel' }))
      expect(q.onCancel).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'dayplan.deleteDay' }))
      expect(q.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('FE-PLANNER-DAYREORDER-024: Escape takes back only the question, not the dialog', async () => {
      const user = userEvent.setup()
      const q = question()
      const onClose = vi.fn()
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: q, onClose })} />)
      await user.keyboard('{Escape}')
      expect(q.onCancel).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
    })

    it('FE-PLANNER-DAYREORDER-025: closing the dialog also drops an open question', async () => {
      const user = userEvent.setup()
      const q = question()
      const onClose = vi.fn()
      const { rerender } = render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: q, onClose })} />)
      const closeX = document.querySelector<HTMLButtonElement>('h2 + button')
      expect(closeX).not.toBeNull()
      await user.click(closeX as HTMLButtonElement)
      expect(q.onCancel).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)

      // A dialog closed from outside takes its question with it as well.
      const again = question()
      rerender(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: again, onClose })} />)
      rerender(<DayReorderPopup {...makeProps({ isOpen: false, days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: again, onClose })} />)
      expect(again.onCancel).toHaveBeenCalled()
    })

    it('FE-PLANNER-DAYREORDER-026: a question about a day that is no longer there is not asked', () => {
      render(<DayReorderPopup {...makeProps({ days: threeDays(), onDeleteDay: vi.fn(), deleteQuestion: question({ dayId: 99 }) })} />)
      expect(rows()).toHaveLength(3)
      expect(screen.queryByRole('region', { name: 'Delete Lyon?' })).not.toBeInTheDocument()
    })

    it('FE-PLANNER-DAYREORDER-027: the focus goes to Cancel, and back to the row asked about when the list returns', async () => {
      const user = userEvent.setup()
      const days = threeDays()
      const onDeleteDay = vi.fn()
      const { rerender } = render(<DayReorderPopup {...makeProps({ days, onDeleteDay })} />)
      await user.click(screen.getAllByRole('button', { name: 'dayplan.deleteDay' })[1])
      expect(onDeleteDay).toHaveBeenCalledWith(7)

      rerender(<DayReorderPopup {...makeProps({ days, onDeleteDay, deleteQuestion: question() })} />)
      expect(screen.getByRole('button', { name: 'common.cancel' })).toHaveFocus()

      rerender(<DayReorderPopup {...makeProps({ days, onDeleteDay, deleteQuestion: null })} />)
      expect(screen.getAllByRole('button', { name: 'dayplan.deleteDay' })[1]).toHaveFocus()
    })

    it('FE-PLANNER-DAYREORDER-028: after the day went, the focus lands on the row that took its place', async () => {
      const user = userEvent.setup()
      const days = threeDays()
      const { rerender } = render(<DayReorderPopup {...makeProps({ days, onDeleteDay: vi.fn() })} />)
      await user.click(screen.getAllByRole('button', { name: 'dayplan.deleteDay' })[1])
      rerender(<DayReorderPopup {...makeProps({ days, onDeleteDay: vi.fn(), deleteQuestion: question() })} />)
      const left = days.filter(d => d.id !== 7)
      rerender(<DayReorderPopup {...makeProps({ days: left, onDeleteDay: vi.fn(), deleteQuestion: null })} />)
      const buttons = screen.getAllByRole('button', { name: 'dayplan.deleteDay' })
      expect(buttons).toHaveLength(2)
      expect(buttons[1]).toHaveFocus()
    })
  })
})
