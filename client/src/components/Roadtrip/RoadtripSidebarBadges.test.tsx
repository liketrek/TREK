import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import { Arrival, DayCarry, DriveFindingBadge, FillBadge, LateBadge, NightCheckIn, OffRoadBadge, StayBadge } from './RoadtripSidebarBadges'
import { tooltipOf } from '../../../tests/helpers/roadtripRail'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

function settings(over: { distance_unit?: 'metric' | 'imperial'; time_format?: '12h' | '24h' } = {}): void {
  useSettingsStore.setState({ settings: { distance_unit: 'metric', time_format: '24h', ...over } as never })
}

beforeEach(() => settings())
afterEach(() => { vi.useRealTimers() })

/** The badge shell a figure sits in: the element its value text lives two levels inside. */
const shellOf = (text: string): Element => screen.getByText(text).parentElement!

function stop(over: Partial<RoadtripStop> = {}): RoadtripStop {
  return {
    assignmentId: 1, ownerDayId: 1, ownerIndex: 0, placeId: 10, name: 'Lake', lat: 47, lng: 11,
    time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    ...over,
  }
}

const entry = (over: Partial<ScheduleEntry> = {}): ScheduleEntry =>
  ({ arrival: '18:30', departure: null, anchored: false, dayOffset: 0, ...over })

const warning = (over: Partial<ScheduleWarning> & Pick<ScheduleWarning, 'code'>): ScheduleWarning => ({ index: 0, ...over })

describe('Road trip rail badges', () => {
  it('FE-ROADTRIP-BADGES-001: the walk from the road reads in the traveller\'s own unit, in the figure and in the tooltip', () => {
    const metric = wrap(<OffRoadBadge meters={240} />)
    expect(screen.getByText('240 m')).toBeInTheDocument()
    expect(metric.container.querySelector('svg.lucide-footprints')).not.toBeNull()
    expect(tooltipOf(shellOf('240 m'))).toBe('240 m from the road')
    metric.unmount()

    settings({ distance_unit: 'imperial' })
    wrap(<OffRoadBadge meters={1609.344} />)
    expect(screen.getByText('1 mi')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-BADGES-002: a too long drive and a tank running dry each wear their own sign and figure', () => {
    const leg = wrap(<DriveFindingBadge warning={warning({ code: 'leg', overMinutes: 30 })} />)
    expect(screen.getByText('+30 min')).toBeInTheDocument()
    expect(leg.container.querySelector('svg.lucide-clock')).not.toBeNull()
    expect(tooltipOf(shellOf('+30 min'))).toBe('30 min over your longest drive')
    leg.unmount()

    // The rail never draws this one, it hands range findings to the refuel band, so only a
    // direct render reaches it.
    const range = wrap(<DriveFindingBadge warning={warning({ code: 'range', sinceKm: 612 })} />)
    expect(screen.getByText('612 km')).toBeInTheDocument()
    expect(range.container.querySelector('svg.lucide-fuel')).not.toBeNull()
    expect(range.container.querySelector('svg.lucide-clock')).toBeNull()
    expect(tooltipOf(shellOf('612 km'))).toBe('612 km since the last fill-up')
  })

  it('FE-ROADTRIP-BADGES-003: a finding that is not about the drive draws nothing, and missing figures count as zero', () => {
    const late = wrap(<DriveFindingBadge warning={warning({ code: 'late', minutes: 20 })} />)
    expect(late.container).toBeEmptyDOMElement()
    late.unmount()

    wrap(<DriveFindingBadge warning={warning({ code: 'range' })} />)
    expect(screen.getByText('0 m')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-BADGES-004: the fill-up badge invites a figure, says whose it is, and hides when it can say nothing', () => {
    const silent = wrap(<FillBadge percent={null} own={false} />)
    expect(silent.container).toBeEmptyDOMElement()
    silent.unmount()

    const onEdit = vi.fn()
    const invite = wrap(<FillBadge percent={null} own={false} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onEdit).toHaveBeenCalledWith(screen.getByRole('button'))
    expect(screen.getByText('+')).toHaveClass('text-content-faint')
    expect(tooltipOf(screen.getByRole('button'))).toBe('Set how full this stop fills')
    invite.unmount()

    const inherited = wrap(<FillBadge percent={80} own={false} />)
    expect(screen.getByText('80 %')).toHaveClass('text-content-faint')
    expect(screen.queryByRole('button')).toBeNull()
    inherited.unmount()

    wrap(<FillBadge percent={90} own onEdit={onEdit} />)
    expect(screen.getByText('90 %')).not.toHaveClass('text-content-faint')
    expect(tooltipOf(screen.getByRole('button'))).toBe('fills to 90 %')
  })

  it('FE-ROADTRIP-BADGES-005: the check-in shows only on the stop a night begins at, in the traveller\'s clock', () => {
    const day = wrap(<NightCheckIn stop={stop({ checkInTime: '15:00' })} />)
    expect(day.container).toBeEmptyDOMElement()
    day.unmount()

    const noTime = wrap(<NightCheckIn stop={stop({ night: true })} />)
    expect(noTime.container).toBeEmptyDOMElement()
    noTime.unmount()

    settings({ time_format: '12h' })
    wrap(<NightCheckIn stop={stop({ night: true, checkInTime: '15:00' })} />)
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('3:00 PM')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-BADGES-006: the stay reads its length and the time it ends, and only an editor sees the plus', () => {
    const readOnly = wrap(<StayBadge stay={{ minutes: null, until: null }} />)
    expect(readOnly.container).toBeEmptyDOMElement()
    readOnly.unmount()

    const onEdit = vi.fn()
    const add = wrap(<StayBadge stay={{ minutes: null, until: null }} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add a stay' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(screen.getByText('+')).toBeInTheDocument()
    add.unmount()

    const both = wrap(<StayBadge stay={{ minutes: 90, until: '14:00' }} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: 'Time at this stop: 1 h 30 min until 14:00' })).toBeInTheDocument()
    expect(screen.getByText('until 14:00')).toHaveClass('ms-1')
    both.unmount()

    // Left at a set time with no length worked out yet: the end alone, with no gap before it.
    wrap(<StayBadge stay={{ minutes: null, until: '14:00' }} />)
    expect(screen.getByText('until 14:00')).not.toHaveClass('ms-1')
    expect(screen.queryByText('+')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('FE-ROADTRIP-BADGES-007: an arrival you pinned stands out from a computed one, and past midnight it carries the day', () => {
    const computed = wrap(<Arrival entry={entry()} />)
    expect(screen.getByText('18:30')).toHaveClass('font-medium', 'text-content-faint')
    expect(screen.getByText('18:30')).toHaveAttribute('dir', 'ltr')
    expect(tooltipOf(screen.getByText('18:30'))).toBe('Calculated from the drive')
    computed.unmount()

    settings({ time_format: '12h' })
    wrap(<Arrival entry={entry({ arrival: '01:15', anchored: true, dayOffset: 1 })} />)
    const clock = screen.getByText('1:15 AM')
    expect(clock).toHaveClass('font-semibold', 'text-content-secondary')
    expect(clock).toHaveTextContent('1:15 AM+1 Next day')
    expect(screen.getByText('Next day')).toHaveClass('sr-only')
    expect(tooltipOf(clock)).toBe('Time you set')
  })

  it('FE-ROADTRIP-BADGES-008: the day carry stays silent on the same day', () => {
    const same = wrap(<DayCarry days={0} />)
    expect(same.container).toBeEmptyDOMElement()
    same.unmount()

    wrap(<DayCarry days={2} />)
    expect(screen.getByText('+2')).toHaveClass('ms-0.5')
  })

  it('FE-ROADTRIP-BADGES-009: arriving late and missing the time to leave are told apart in words', () => {
    const late = wrap(<LateBadge late={warning({ code: 'late', minutes: 25 })} />)
    expect(screen.getByLabelText('Arrives 25 min after the time you set')).toBeInTheDocument()
    expect(screen.getByText('+25 min').parentElement).toHaveAttribute('dir', 'ltr')
    late.unmount()

    wrap(<LateBadge late={warning({ code: 'missedLeave' })} />)
    expect(screen.getByLabelText('Arrives 0 min after the time you set to leave')).toBeInTheDocument()
    expect(screen.getByText('+0 min')).toBeInTheDocument()
  })
})
