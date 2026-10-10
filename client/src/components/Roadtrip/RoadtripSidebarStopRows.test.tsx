import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import type { RouteVia } from '../../types'
import { RouteViaStop, ServiceStop, Stop } from './RoadtripSidebarStopRows'
import { preferences, resetRailStores, seedRailSettings, tooltipOf } from '../../../tests/helpers/roadtripRail'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

beforeEach(() => seedRailSettings())
afterEach(() => resetRailStores())

function stop(over: Partial<RoadtripStop> = {}): RoadtripStop {
  return {
    assignmentId: 1, ownerDayId: 1, ownerIndex: 0, placeId: 10, name: 'Lüneburg', lat: 53.2, lng: 10.4,
    time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    ...over,
  }
}

const entry = (over: Partial<ScheduleEntry> = {}): ScheduleEntry =>
  ({ arrival: '11:20', departure: null, anchored: false, dayOffset: 0, ...over })

const warning = (over: Partial<ScheduleWarning> & Pick<ScheduleWarning, 'code'>): ScheduleWarning => ({ index: 0, ...over })

const fuelStop = (over: Partial<RoadtripStop> = {}): RoadtripStop => stop({ name: 'Aral Autohof', stopType: 'fuel', ...over })

/** The badge row under a stop's name: the second line of the name column. */
const badgeRowOf = (name: string): Element => screen.getByText(name).closest('.flex-col')!.children[1]

describe('RouteViaStop', () => {
  it('FE-ROADTRIP-STOPROWS-001: a plugin halt reads its own name and the time it takes, on a hollow disc', () => {
    const via = { lat: 52.1, lng: 10.1, label: 'Ionity Allertal', dwellSeconds: 1200 } as RouteVia
    const { container } = wrap(<RouteViaStop via={via} />)
    expect(screen.getByText('Ionity Allertal')).toBeInTheDocument()
    expect(screen.getByText('20 min')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-zap')!.parentElement).toHaveClass('border-dashed')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('FE-ROADTRIP-STOPROWS-002: without a name it is a stop on the way, and without a stay it says no time', () => {
    const { container } = wrap(<RouteViaStop via={{ lat: 52.1, lng: 10.1 } as RouteVia} />)
    expect(screen.getByText('Stop on the way')).toBeInTheDocument()
    // The name alone in its column: no second line for a stay the plugin gave none of.
    expect(screen.getByText('Stop on the way').parentElement!.children).toHaveLength(1)
    expect(container.textContent).not.toMatch(/\d/)
  })
})

describe('ServiceStop', () => {
  it('FE-ROADTRIP-STOPROWS-003: the disc opens the kind picker on a click, Enter or Space, and never selects the row', () => {
    const onPickKind = vi.fn()
    const onSelect = vi.fn()
    wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected={false} onSelect={onSelect} onPickKind={onPickKind} />)
    const disc = screen.getByRole('button', { name: 'Change what kind of stop this is' })
    expect(disc).toHaveStyle({ background: '#E8590C', color: '#fff' })
    expect(disc.querySelector('svg.lucide-fuel')).not.toBeNull()

    fireEvent.click(disc)
    expect(onPickKind).toHaveBeenLastCalledWith(disc)
    fireEvent.keyDown(disc, { key: 'Enter' })
    fireEvent.keyDown(disc, { key: ' ' })
    expect(onPickKind).toHaveBeenCalledTimes(3)
    fireEvent.keyDown(disc, { key: 'a' })
    expect(onPickKind).toHaveBeenCalledTimes(3)
    expect(onSelect).not.toHaveBeenCalled()
    expect(tooltipOf(disc)).toBe('Change what kind of stop this is')
  })

  it('FE-ROADTRIP-STOPROWS-004: read-only, the disc names the kind, and a kind the table does not know is a rest area', () => {
    const fuel = wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected={false} />)
    expect(screen.getByLabelText('Fuel')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change what kind of stop this is' })).toBeNull()
    fuel.unmount()

    const { container } = wrap(
      <ServiceStop stop={stop({ name: 'Somewhere', stopType: 'mystery' as never })} entry={undefined} late={[]} selected={false} />,
    )
    expect(screen.getByLabelText('Rest area')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-square-parking, svg.lucide-parking-square')).not.toBeNull()
    expect(screen.getByLabelText('Rest area').parentElement).toHaveStyle({ background: '#64748B' })
  })

  it('FE-ROADTRIP-STOPROWS-005: a pause with no kind at all reads as a rest area too', () => {
    wrap(<ServiceStop stop={stop({ name: 'Parkplatz' })} entry={undefined} late={[]} selected={false} />)
    expect(screen.getByLabelText('Rest area')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPROWS-006: the row selects the pause, says when it is selected and reads its arrival', () => {
    const onSelect = vi.fn()
    const { rerender } = wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected={false} onSelect={onSelect} />)
    const row = screen.getByText('Aral Autohof').closest('button')!
    expect(row).not.toHaveAttribute('aria-current')
    expect(screen.getByText('11:20')).toBeInTheDocument()
    fireEvent.click(row)
    expect(onSelect).toHaveBeenCalledTimes(1)

    rerender(<TranslationProvider><ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected onSelect={onSelect} /></TranslationProvider>)
    expect(row).toHaveAttribute('aria-current', 'true')
    expect(row).toHaveClass('bg-surface-selected')
  })
})

describe('Stop', () => {
  it('FE-ROADTRIP-STOPROWS-007: the number opens the kind picker on a click, Enter or Space, without selecting the stop', () => {
    const onPickKind = vi.fn()
    const onSelect = vi.fn()
    wrap(<Stop stop={stop()} number={3} entry={entry()} late={[]} selected={false} continues onSelect={onSelect} onPickKind={onPickKind} />)
    const number = screen.getByRole('button', { name: 'Make it a stop on the way' })
    expect(number).toHaveTextContent('3')

    fireEvent.click(number)
    expect(onPickKind).toHaveBeenLastCalledWith(number)
    fireEvent.keyDown(number, { key: 'Enter' })
    fireEvent.keyDown(number, { key: ' ' })
    expect(onPickKind).toHaveBeenCalledTimes(3)
    fireEvent.keyDown(number, { key: 'Escape' })
    expect(onPickKind).toHaveBeenCalledTimes(3)
    expect(onSelect).not.toHaveBeenCalled()
    expect(tooltipOf(number)).toBe('Make it a stop on the way')

    // The stop itself still selects from anywhere else on the row.
    fireEvent.click(screen.getByText('Lüneburg'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-STOPROWS-008: read-only, the number is a plain marker, and the line runs only where the chain does', () => {
    const { container } = wrap(<Stop stop={stop()} number={1} entry={undefined} late={[]} selected starts continues={false} />)
    expect(screen.queryByRole('button', { name: 'Make it a stop on the way' })).toBeNull()
    const marker = screen.getByText('1')
    expect(marker.tagName).toBe('SPAN')
    expect(marker.parentElement!.children).toHaveLength(1)
    expect(container.querySelector('button')).toHaveAttribute('aria-current', 'true')
  })

  it('FE-ROADTRIP-STOPROWS-009: a charger keeps its name to one line, leaving room for the charging panel beside it', () => {
    const charger = wrap(<Stop stop={stop({ name: 'Ionity Allertal', stopType: 'charging' })} number={1} entry={entry()} late={[]} selected={false} continues />)
    expect(screen.getByText('Ionity Allertal')).toHaveClass('min-w-0', 'truncate')
    expect(screen.getByText('Ionity Allertal').nextElementSibling).not.toBeNull()
    charger.unmount()

    wrap(<Stop stop={stop()} number={1} entry={entry()} late={[]} selected={false} continues />)
    expect(screen.getByText('Lüneburg')).toHaveClass('min-w-0', 'break-words')
    expect(screen.getByText('Lüneburg').nextElementSibling).toBeNull()
  })

  it('FE-ROADTRIP-STOPROWS-010: Alt and an arrow move the stop where there is room, and nothing else does', () => {
    const onMove = vi.fn()
    wrap(<Stop stop={stop()} number={2} entry={entry()} late={[]} selected={false} continues onMove={onMove} canMove={{ up: true, down: false }} />)
    const row = screen.getByText('Lüneburg').closest('button')!
    fireEvent.keyDown(row, { key: 'ArrowUp' })
    fireEvent.keyDown(row, { key: 'ArrowDown', altKey: true })
    expect(onMove).not.toHaveBeenCalled()
    fireEvent.keyDown(row, { key: 'ArrowUp', altKey: true })
    expect(onMove).toHaveBeenCalledWith(-1)
  })
})

describe('the badge row both stop shapes share', () => {
  const findings = [
    warning({ code: 'leg', overMinutes: 30 }),
    // The rail hands range findings to the refuel band and never draws them on a row,
    // and a code the row has no words for draws nothing: only a direct render reaches
    // either arm.
    warning({ code: 'range', sinceKm: 612 }),
    warning({ code: 'overnight' }),
  ]

  it('FE-ROADTRIP-STOPROWS-011: a numbered stop carries the findings about its drive and its lateness, each with its own figure', () => {
    const { container } = wrap(
      <Stop stop={stop()} number={2} entry={entry()} late={[warning({ code: 'late', minutes: 15 })]} driveFindings={findings} selected={false} continues />,
    )
    expect(screen.getByText('+30 min')).toBeInTheDocument()
    expect(screen.getByText('612 km')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-fuel')).not.toBeNull()
    expect(screen.getByLabelText('Arrives 15 min after the time you set')).toBeInTheDocument()
    // The two drive findings and the lateness; the overnight code adds nothing.
    expect(badgeRowOf('Lüneburg').children).toHaveLength(3)
  })

  it('FE-ROADTRIP-STOPROWS-012: a pause carries the same findings the same way', () => {
    wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} driveFindings={findings} selected={false} />)
    expect(screen.getByText('+30 min')).toBeInTheDocument()
    expect(screen.getByText('612 km')).toBeInTheDocument()
    expect(tooltipOf(screen.getByText('612 km').parentElement!)).toBe('612 km since the last fill-up')
  })

  it('FE-ROADTRIP-STOPROWS-013: the walk from the road shows once it is far enough to change the plan', () => {
    const far = wrap(<Stop stop={stop({ offRoadMeters: 400 })} number={1} entry={entry()} late={[]} selected={false} continues />)
    expect(screen.getByText('400 m')).toBeInTheDocument()
    expect(far.container.querySelector('svg.lucide-footprints')).not.toBeNull()
    far.unmount()

    const pause = wrap(<ServiceStop stop={fuelStop({ offRoadMeters: 400 })} entry={entry()} late={[]} selected={false} />)
    expect(screen.getByText('400 m')).toBeInTheDocument()
    pause.unmount()

    const near = wrap(<Stop stop={stop({ offRoadMeters: 120 })} number={1} entry={entry()} late={[]} selected={false} continues />)
    expect(near.container.querySelector('svg.lucide-footprints')).toBeNull()
  })

  it('FE-ROADTRIP-STOPROWS-014: a stop that fills up reads its own figure, or the traveller\'s default faintly, and opens the fill panel', () => {
    preferences({ roadtrip_fill_percent: 80 })
    const onPickFill = vi.fn()
    const inherited = wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected={false} onPickFill={onPickFill} />)
    const badge = screen.getByRole('button', { name: '80 %' })
    expect(screen.getByText('80 %')).toHaveClass('text-content-faint')
    fireEvent.click(badge)
    expect(onPickFill).toHaveBeenCalledWith(badge)
    inherited.unmount()

    wrap(<Stop stop={fuelStop({ fillPercent: 60 })} number={1} entry={entry()} late={[]} selected={false} continues />)
    expect(screen.getByText('60 %')).not.toHaveClass('text-content-faint')
  })

  it('FE-ROADTRIP-STOPROWS-015: a full tank by default is nothing to say, and only a stop that refuels this vehicle carries the badge', () => {
    preferences({ roadtrip_fill_percent: 100 })
    const full = wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected={false} />)
    expect(screen.queryByText(/%/)).toBeNull()
    full.unmount()

    // An electric car does not fill up at a pump, and a place the trip is for fills no tank.
    preferences({ roadtrip_vehicle: 'electric', roadtrip_fill_percent: 80 })
    const pump = wrap(<ServiceStop stop={fuelStop()} entry={entry()} late={[]} selected={false} onPickFill={vi.fn()} />)
    expect(screen.queryByText(/%|\+/)).toBeNull()
    pump.unmount()

    wrap(<Stop stop={stop()} number={1} entry={entry()} late={[]} selected={false} continues onPickFill={vi.fn()} />)
    expect(screen.queryByText(/%|\+/)).toBeNull()
  })

  it('FE-ROADTRIP-STOPROWS-016: the row is the bare wrapping line straight under the name, with the stay that opens its dialog', () => {
    const onEditStay = vi.fn()
    const numbered = wrap(<Stop stop={stop()} number={1} entry={entry()} late={[]} selected={false} continues onEditStay={onEditStay} />)
    const row = badgeRowOf('Lüneburg')
    expect(row.tagName).toBe('SPAN')
    expect(row).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-1')
    fireEvent.click(screen.getByRole('button', { name: 'Add a stay' }))
    expect(onEditStay).toHaveBeenCalledTimes(1)
    numbered.unmount()

    wrap(<ServiceStop stop={fuelStop({ night: true, checkInTime: '15:00' })} entry={entry()} late={[]} selected={false} />)
    const pauseRow = badgeRowOf('Aral Autohof')
    expect(pauseRow).toHaveClass('flex-wrap')
    expect(pauseRow.firstElementChild).toHaveTextContent('Check-in15:00')
  })
})
