import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import type { CarrierTerminal } from '@trek/shared/roadtrip'
import type { SpillMark } from './nightSpill'
import type { RouteSegment } from '../../types'
import { DriveBand, SpillBlock } from './RoadtripSidebarDriveBands'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

function settings(over: { distance_unit?: 'metric' | 'imperial'; time_format?: '12h' | '24h' } = {}): void {
  useSettingsStore.setState({ settings: { distance_unit: 'metric', time_format: '24h', ...over } as never })
}

beforeEach(() => settings())

const leg = (over: Partial<RouteSegment> = {}): RouteSegment =>
  ({ distance: 152000, duration: 5880, distanceText: '152 km', durationText: '1 h 38 min', mode: 'driving', ...over }) as RouteSegment

const flight: CarrierTerminal = { reservationId: 9, type: 'flight', role: 'departure', title: 'LH 2078', code: 'HAM', at: '15:15' }

const spill = (over: Partial<SpillMark> = {}): SpillMark => ({
  at: 0, count: 1, fromDayNumber: 3, departure: '21:40', leg: leg({ distance: 248000, duration: 13500 }),
  fromStop: undefined, line: [],
  ...over,
})

/** The lucide icon a band leads with, by its class name. */
const iconOf = (container: HTMLElement): string =>
  [...(container.querySelector('svg.lucide')?.classList ?? [])].find(c => c.startsWith('lucide-')) ?? ''

describe('DriveBand', () => {
  it('FE-ROADTRIP-DRIVEBAND-001: a road leg reads distance and time as one sentence, under the sign of how it is travelled', () => {
    const cases: [string, string][] = [
      ['driving', 'lucide-car-front'],
      ['walking', 'lucide-footprints'],
      ['cycling', 'lucide-bike'],
      ['plugin:ev-router', 'lucide-zap'],
      ['hovercraft', 'lucide-car-front'],
    ]
    for (const [mode, icon] of cases) {
      const { container, unmount } = wrap(<DriveBand leg={leg({ mode })} />)
      expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
      expect(iconOf(container)).toBe(icon)
      unmount()
    }

    // No mode at all is a drive.
    const { container } = wrap(<DriveBand leg={leg({ mode: undefined })} />)
    expect(iconOf(container)).toBe('lucide-car-front')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('FE-ROADTRIP-DRIVEBAND-002: the band is the button that asks for other ways, and shows when they are open', () => {
    const onAsk = vi.fn()
    const { rerender } = wrap(<DriveBand leg={leg()} onAskAlternatives={onAsk} alternativesOpen={false} />)
    const band = screen.getByRole('button')
    expect(band).toHaveAttribute('aria-pressed', 'false')
    expect(band).toHaveClass('bg-surface-tertiary')
    expect(screen.getByLabelText('Other ways')).toBeInTheDocument()
    fireEvent.click(band)
    expect(onAsk).toHaveBeenCalledTimes(1)

    rerender(<TranslationProvider><DriveBand leg={leg()} onAskAlternatives={onAsk} alternativesOpen /></TranslationProvider>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button')).toHaveClass('bg-surface-selected')
  })

  it('FE-ROADTRIP-DRIVEBAND-003: a leg still coming says so, and offers nothing to change', () => {
    wrap(<DriveBand leg={undefined} onAskAlternatives={vi.fn()} />)
    expect(screen.getByText('No route')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('FE-ROADTRIP-DRIVEBAND-004: a hop keeps the line and drops the pill, unless a plugin wrote something on it', () => {
    const hop = wrap(<DriveBand leg={leg({ distance: 80, duration: 60 })} onAskAlternatives={vi.fn()} />)
    expect(hop.container.querySelector('svg')).toBeNull()
    expect(hop.container.textContent).toBe('')
    expect(hop.container.querySelector('span.flex-1')).not.toBeNull()
    hop.unmount()

    wrap(<DriveBand leg={leg({ distance: 80, duration: 60, noteText: 'Ferry ramp' })} />)
    expect(screen.getByText('Ferry ramp')).toBeInTheDocument()
    expect(screen.getByText('80 m in 1 min')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-DRIVEBAND-005: a ride reads as its booking and its minutes, however short it is', () => {
    const ride = wrap(<DriveBand leg={leg({ mode: 'flight', distance: 0, duration: 4800, durationText: '' })} carrier={flight} />)
    expect(iconOf(ride.container)).toBe('lucide-plane')
    expect(screen.getByText('LH 2078')).toHaveClass('truncate')
    expect(screen.getByText('1 h 20 min')).toHaveClass('shrink-0')
    expect(screen.queryByText(/ in /)).toBeNull()
    ride.unmount()

    // Without a booking to name and without a timetable there is only the sign.
    const bare = wrap(<DriveBand leg={leg({ mode: 'train', duration: 0, durationText: '' })} />)
    expect(iconOf(bare.container)).toBe('lucide-tram-front')
    expect(bare.container.textContent).toBe('')
  })
})

describe('SpillBlock', () => {
  /** The rail row that holds the night's drive: the moon's band, its column, then the row. */
  const driveRow = (container: HTMLElement): HTMLElement =>
    container.querySelector('svg.lucide-moon')!.parentElement!.parentElement!.parentElement!

  it('FE-ROADTRIP-DRIVEBAND-006: the night drive carries yesterday\'s number, its own drive and when it leaves', () => {
    settings({ time_format: '12h' })
    const { container } = wrap(
      <ol>
        <SpillBlock spill={spill()}>
          <li>Ghent</li>
        </SpillBlock>
      </ol>,
    )
    expect(screen.getByText('From day 3')).toBeInTheDocument()
    expect(screen.getByText('248 km in 3 h 45 min')).toBeInTheDocument()
    expect(screen.getByText('leaves 9:40 PM')).toHaveAttribute('dir', 'ltr')
    expect(driveRow(container)).toHaveClass('grid')
    expect(driveRow(container)).not.toHaveClass('hidden')
    // The stops it brings along sit in a list of their own inside the block.
    expect(screen.getByText('Ghent').closest('ol')).not.toBe(container.querySelector('ol'))
  })

  it('FE-ROADTRIP-DRIVEBAND-007: an automatic night hides its drive, and missing figures fall back instead of breaking', () => {
    const automatic = wrap(<ol><SpillBlock spill={spill({ automatic: true, departure: null })}>{null}</SpillBlock></ol>)
    expect(driveRow(automatic.container)).toHaveClass('hidden')
    expect(driveRow(automatic.container)).not.toHaveClass('grid')
    expect(screen.queryByText(/^leaves /)).toBeNull()
    automatic.unmount()

    const pending = wrap(<ol><SpillBlock spill={spill({ leg: undefined })}>{null}</SpillBlock></ol>)
    expect(screen.getByText('No route')).toBeInTheDocument()
    pending.unmount()

    wrap(<ol><SpillBlock spill={spill({ leg: { mode: 'driving' } as RouteSegment })}>{null}</SpillBlock></ol>)
    expect(screen.getByText('0 m in 0 min')).toBeInTheDocument()
  })
})
