import { describe, expect, it, vi } from 'vitest'
import type { ReservationTraveler } from '@trek/shared'
import {
  CountPill, Field, SectionHeader, StatusDot, TabScroller, TravelerAvatars, TravelerFilterRow,
} from '../../../../src/mobile/screens/trip/tabs/tabChrome'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-TABCHR-001 to FE-MOB-TABCHR-014

function traveler(overrides: Partial<ReservationTraveler>): ReservationTraveler {
  return {
    user_id: 1, username: 'Ada', avatar: null, avatar_url: null, is_guest: 0,
    ...overrides,
  } as unknown as ReservationTraveler
}

describe('tabChrome', () => {
  it('FE-MOB-TABCHR-001: TabScroller puts its children in the scroll body with dock + top clearance', () => {
    const { container } = render(<TabScroller><p>panel body</p></TabScroller>)
    const body = screen.getByText('panel body').parentElement as HTMLElement
    expect(body).toHaveClass('overflow-y-auto')
    expect(body.className).toContain('--bottom-nav-h')
    expect(body.className).toContain('--m-safe-top')
    expect(container.firstElementChild).toHaveClass('h-full')
  })

  it('FE-MOB-TABCHR-002: CountPill renders its count', () => {
    render(<CountPill>7</CountPill>)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('FE-MOB-TABCHR-003: SectionHeader exposes the open state and its count pill', () => {
    render(<SectionHeader label="Confirmed" count={3} open onToggle={vi.fn()} />)
    const header = screen.getByRole('button', { name: /Confirmed/ })
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('3')).toBeInTheDocument()
    // Open → chevron points up.
    expect(header.querySelector('.lucide-chevron-up')).not.toBeNull()
    expect(header.querySelector('.lucide-chevron-down')).toBeNull()
  })

  it('FE-MOB-TABCHR-004: SectionHeader flips the chevron and drops the pill when collapsed without a count', () => {
    render(<SectionHeader label="Pending" open={false} onToggle={vi.fn()} />)
    const header = screen.getByRole('button', { name: 'Pending' })
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(header.querySelector('.lucide-chevron-down')).not.toBeNull()
    expect(header.textContent).toBe('Pending')
  })

  it('FE-MOB-TABCHR-005: SectionHeader reports taps', () => {
    const onToggle = vi.fn()
    render(<SectionHeader label="Pending" open={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TABCHR-006: Field pairs its label with the value box and takes the caller width', () => {
    const { container } = render(<Field label="Departure" className="flex-1">08:15</Field>)
    expect(screen.getByText('Departure')).toBeInTheDocument()
    const value = screen.getByText('08:15')
    expect(value).not.toHaveClass('tabular-nums')
    expect(container.firstElementChild).toHaveClass('flex-1')
  })

  it('FE-MOB-TABCHR-007: Field aligns numbers when asked to', () => {
    render(<Field label="Price" tabular>12,50 €</Field>)
    expect(screen.getByText('12,50 €')).toHaveClass('tabular-nums')
  })

  it('FE-MOB-TABCHR-008: StatusDot paints the passed token', () => {
    const { container } = render(<StatusDot color="var(--m-st-confirmed)" />)
    expect(container.firstElementChild).toHaveStyle({ background: 'var(--m-st-confirmed)' })
  })

  it('FE-MOB-TABCHR-009: TravelerAvatars renders nothing when nobody is assigned', () => {
    const { container } = render(<TravelerAvatars travelers={[]} label="Travelers" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-MOB-TABCHR-010: TravelerAvatars shows the label and one chip per traveler', () => {
    render(
      <TravelerAvatars
        travelers={[traveler({ user_id: 1, username: 'Ada' }), traveler({ user_id: 2, username: 'Bob' })]}
        label="Travelers"
      />,
    )
    expect(screen.getByText('Travelers')).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    // No avatar → initial only.
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('FE-MOB-TABCHR-011: TravelerAvatars prefers avatar_url and falls back to the raw avatar path', () => {
    const { container } = render(
      <TravelerAvatars
        travelers={[
          traveler({ user_id: 1, username: 'Ada', avatar_url: '/uploads/avatars/ada.png' }),
          traveler({ user_id: 2, username: 'Bob', avatar: 'bob.jpg' }),
          traveler({ user_id: 3, username: 'Cid', avatar: 'https://idp.example/cid.png' }),
        ]}
        label="Travelers"
      />,
    )
    const srcs = [...container.querySelectorAll('img')].map(i => i.getAttribute('src'))
    expect(srcs).toEqual([
      '/uploads/avatars/ada.png',
      '/uploads/avatars/bob.jpg',
      'https://idp.example/cid.png',
    ])
  })

  it('FE-MOB-TABCHR-012: TravelerAvatars marks accountless guests', () => {
    render(<TravelerAvatars travelers={[traveler({ user_id: 9, username: 'Zoe', is_guest: 1 })]} label="Travelers" />)
    expect(screen.getByText('Guest')).toBeInTheDocument()
  })

  it('FE-MOB-TABCHR-013: TravelerFilterRow toggles a member and dims the inactive ones', () => {
    const onToggle = vi.fn()
    render(
      <TravelerFilterRow
        members={[{ id: 1, username: 'Ada' }, { id: 2, username: 'Bob', avatar_url: '/uploads/avatars/bob.png' }]}
        active={new Set([1])}
        onToggle={onToggle}
        label="Filter by traveler"
      />,
    )
    expect(screen.getByLabelText('Filter by traveler')).toBeInTheDocument()
    const ada = screen.getByTitle('Ada')
    const bob = screen.getByTitle('Bob')
    expect(ada.className).toContain('opacity-100')
    expect(bob.className).toContain('opacity-40')
    expect(bob.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/bob.png')

    fireEvent.click(bob)
    expect(onToggle).toHaveBeenCalledWith(2)
  })

  it('FE-MOB-TABCHR-014: TravelerFilterRow keeps everyone at full opacity while no filter is set', () => {
    render(
      <TravelerFilterRow
        members={[{ id: 1, username: 'Ada' }, { id: 2, username: 'Bob' }]}
        active={new Set()}
        onToggle={vi.fn()}
        label="Filter by traveler"
      />,
    )
    expect(screen.getByTitle('Ada').className).toContain('opacity-100')
    expect(screen.getByTitle('Bob').className).toContain('opacity-100')
  })

  it('FE-MOB-TABCHR-015: TravelerFilterRow names itself, so the avatars are not left unexplained', () => {
    render(
      <TravelerFilterRow
        members={[{ id: 1, username: 'Ada' }]}
        active={new Set()}
        onToggle={vi.fn()}
        label="Travelers"
      />,
    )
    expect(screen.getByRole('group', { name: 'Travelers' })).toBeInTheDocument()
    expect(screen.getByText('Travelers')).toBeInTheDocument()
  })

  it('FE-MOB-TABCHR-016: the way out of a filter only appears once one is set', () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <TravelerFilterRow
        members={[{ id: 1, username: 'Ada' }]}
        active={new Set()}
        onToggle={vi.fn()}
        onClear={onClear}
        label="Travelers"
        allLabel="All"
      />,
    )
    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument()

    rerender(
      <TravelerFilterRow
        members={[{ id: 1, username: 'Ada' }]}
        active={new Set([1])}
        onToggle={vi.fn()}
        onClear={onClear}
        label="Travelers"
        allLabel="All"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-TABCHR-017: SectionHeader wraps its count exactly once', () => {
    // The callers used to pass a <CountPill> into a prop that wraps one itself,
    // which put a pill inside a pill and showed two stacked backgrounds.
    render(<SectionHeader label="Pending" count={2} open onToggle={vi.fn()} />)
    const pill = screen.getByText('2')
    expect(pill.querySelector('span')).toBeNull()
    expect(pill.parentElement?.tagName).toBe('BUTTON')
  })
})
