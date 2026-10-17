// FE-JOURNEY-DAYJUMP-001 to FE-JOURNEY-DAYJUMP-003 (#1243)
import { vi } from 'vitest'
import { createRef } from 'react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import JourneyDayJump from './JourneyDayJump'

const days = [
  { date: '2026-06-02', color: '#6366f1', entries: [{ id: 1, title: 'Arrival' }] },
  { date: '2026-06-03', color: '#f97316', entries: [{ id: 2, title: 'City walk' }, { id: 3, title: 'Dinner' }] },
]

function setup() {
  const feed = document.createElement('div')
  feed.innerHTML = '<div data-day="2026-06-03"></div><div data-entry-id="3"></div>'
  document.body.appendChild(feed)
  const scroll = vi.fn()
  Element.prototype.scrollIntoView = scroll
  const ref = createRef<HTMLDivElement>()
  ;(ref as { current: HTMLDivElement }).current = feed
  render(<JourneyDayJump days={days} feedRef={ref} />)
  return { scroll }
}

describe('JourneyDayJump', () => {
  it('FE-JOURNEY-DAYJUMP-001: opens every day and scrolls the feed to the one picked', () => {
    const { scroll } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Jump to a day' }))
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('menuitem')[1])
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('FE-JOURNEY-DAYJUMP-002: a day opens onto its entries, and an entry is a jump too', () => {
    const { scroll } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Jump to a day' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Expand' })[1])
    fireEvent.click(screen.getByRole('menuitem', { name: /Dinner/ }))
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('FE-JOURNEY-DAYJUMP-003: a single day needs no jump', () => {
    const { container } = render(<JourneyDayJump days={[days[0]]} feedRef={createRef()} />)
    expect(container.innerHTML).toBe('')
  })
})
