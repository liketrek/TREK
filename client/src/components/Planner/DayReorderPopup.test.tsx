// FE-PLANNER-DAYREORDER-001 to FE-PLANNER-DAYREORDER-012
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { buildDay } from '../../../tests/helpers/factories'
import { DayReorderPopup } from './DayReorderPopup'
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
    expect(second.style.outline).toContain('dashed')
    fireEvent.dragEnd(first)
    expect(second.style.outline).toBe('none')
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
})
