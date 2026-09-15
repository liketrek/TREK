import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TripRouteOverviewPill, TripRouteOverviewPanel } from './TripRouteOverview'
import type { TripRouteOverview } from './useTripRouteOverview'

const overview = (over: Partial<TripRouteOverview> = {}): TripRouteOverview => ({
  days: [
    { dayId: 1, dayNumber: 1, date: '2025-06-01', title: null, color: { line: '#0a84ff', casing: '#0a5cc2' }, lines: [], segments: [], distance: 82000, duration: 3600, modes: ['driving'] },
    { dayId: 2, dayNumber: 2, date: '2025-06-02', title: 'Coast road', color: { line: '#ff9f0a', casing: '#c2740a' }, lines: [], segments: [], distance: 140500, duration: 7200, modes: ['driving', 'walking'] },
  ],
  lines: [], lineColors: [], segments: [], focusPoints: [],
  totalDistance: 222500, totalDuration: 10800, loading: false,
  ...over,
})

describe('TripRouteOverviewPill', () => {
  it('FE-MAP-TROU-001: says which way it will take you, and reports its state', () => {
    const onToggle = vi.fn()
    const { rerender } = render(<TripRouteOverviewPill active={false} onToggle={onToggle} />)

    const button = screen.getByTestId('trip-overview-pill')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('aria-label', 'map.overview.show')

    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledTimes(1)

    rerender(<TripRouteOverviewPill active onToggle={onToggle} />)
    expect(screen.getByTestId('trip-overview-pill')).toHaveAttribute('aria-label', 'map.overview.hide')
  })
})

describe('TripRouteOverviewPanel', () => {
  it('FE-MAP-TROU-002: leads with the trip total in the reader\'s own unit', () => {
    const { rerender } = render(<TripRouteOverviewPanel overview={overview()} unit="metric" />)
    expect(screen.getByText('222.5 km')).toBeInTheDocument()

    rerender(<TripRouteOverviewPanel overview={overview()} unit="imperial" />)
    expect(screen.getByText('138.3 mi')).toBeInTheDocument()
  })

  it('FE-MAP-TROU-003: names every day, its distance and how it is travelled', () => {
    render(<TripRouteOverviewPanel overview={overview()} unit="metric" />)

    expect(screen.getByText('dayplan.dayN')).toBeInTheDocument()
    // A day with a title is named by it rather than by its number.
    expect(screen.getByText('Coast road')).toBeInTheDocument()
    expect(screen.getByText('82 km')).toBeInTheDocument()
    expect(screen.getByText('140.5 km')).toBeInTheDocument()
  })

  it('FE-MAP-TROU-004: marks the total as partial while legs are still coming in', () => {
    const { container, rerender } = render(<TripRouteOverviewPanel overview={overview({ loading: true })} unit="metric" />)
    expect(container.textContent).toContain('…')

    rerender(<TripRouteOverviewPanel overview={overview()} unit="metric" />)
    expect(container.textContent).not.toContain('…')
  })

  it('FE-MAP-TROU-005: a day row picks that day when the shell offers it', () => {
    const onSelectDay = vi.fn()
    render(<TripRouteOverviewPanel overview={overview()} unit="metric" selectedDayId={2} onSelectDay={onSelectDay} />)

    fireEvent.click(screen.getByText('Coast road'))
    expect(onSelectDay).toHaveBeenCalledWith(2)
  })

  it('FE-MAP-TROU-006: read-only shells get rows, not buttons', () => {
    render(<TripRouteOverviewPanel overview={overview()} unit="metric" />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('FE-MAP-TROU-008: hugs its rows, and takes the cap the shell gives it', () => {
    const { container, rerender } = render(<TripRouteOverviewPanel overview={overview()} unit="metric" />)
    const card = () => screen.getByTestId('trip-overview-panel')

    expect(card().style.width).toBe('fit-content')
    expect(card().style.maxWidth).toBe('320px')

    // The phone shell asks for a narrower card so the map keeps the space.
    rerender(<TripRouteOverviewPanel overview={overview()} unit="metric" maxWidth={240} />)
    expect(card().style.maxWidth).toBe('240px')
    expect(container).not.toBeEmptyDOMElement()
  })

  it('FE-MAP-TROU-007: draws nothing at all for a trip with no routed day', () => {
    const { container } = render(<TripRouteOverviewPanel overview={overview({ days: [], totalDistance: 0 })} unit="metric" />)
    expect(container).toBeEmptyDOMElement()
  })
})
