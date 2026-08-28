/**
 * TransitWalkDivider — the one line a traveller reads between two trains.
 *
 * The case that motivated this file: where two feeds each carry their own copy
 * of a station, MOTIS returns the change between them as a walk from that
 * station to itself, and the divider read "Walk to Shinagawa" to somebody
 * already standing in Shinagawa. Live samples on 2026-08-28 showed it in Tokyo
 * (399 m), Berlin (193 m at Friedrichstraße) and Paris (0 m at Châtelet).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransitWalkDivider } from './transitDisplay'

// Mirrors the real resolver closely enough for these assertions: substitute
// {name}/{count}, fall back to the key so a missing key is visible as a failure.
const t = (key: string, params?: Record<string, string | number>) => {
  const strings: Record<string, string> = {
    'transit.walkTo': 'Walk to {name}',
    'transit.changeAt': 'Change at {name}',
    'transit.min': '{count} min',
  }
  const template = strings[key]
  if (!template) return key
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params?.[k] ?? ''))
}

const stop = (name: string) => ({ name, time: null, track: null })

describe('TransitWalkDivider', () => {
  it('FE-TRANSIT-WALK-001: a real walk still says where it goes', () => {
    render(<TransitWalkDivider leg={{ mode: 'WALK', duration: 240, from: stop('START'), to: stop('新宿 Shinjuku') }} t={t} />)
    expect(screen.getByText(/Walk to 新宿 Shinjuku/)).toBeInTheDocument()
    expect(screen.getByText(/4 min/)).toBeInTheDocument()
  })

  it('FE-TRANSIT-WALK-002: a same-station transfer reads as a change, not a walk', () => {
    render(
      <TransitWalkDivider
        leg={{ mode: 'WALK', duration: 120, sameStationTransfer: true, from: stop('品川 Shinagawa'), to: stop('品川') }}
        t={t}
      />,
    )
    expect(screen.getByText(/Change at 品川 Shinagawa/)).toBeInTheDocument()
    expect(screen.queryByText(/Walk to/)).not.toBeInTheDocument()
  })

  it('FE-TRANSIT-WALK-003: the change keeps its minutes — it really does take that long', () => {
    render(
      <TransitWalkDivider
        leg={{ mode: 'WALK', duration: 180, sameStationTransfer: true, from: stop('S+U Friedrichstr. Bhf'), to: stop('S+U Friedrichstr. Bhf') }}
        t={t}
      />,
    )
    expect(screen.getByText(/3 min/)).toBeInTheDocument()
  })

  it('FE-TRANSIT-WALK-004: names the station the traveller is standing in, not the duplicate', () => {
    // `to` is the second feed's copy and often the barer spelling, so the label
    // takes `from`: the name already on screen from the arriving leg.
    render(
      <TransitWalkDivider
        leg={{ mode: 'WALK', duration: 120, sameStationTransfer: true, from: stop('東京 Tōkyō'), to: stop('東京') }}
        t={t}
      />,
    )
    expect(screen.getByText(/Change at 東京 Tōkyō/)).toBeInTheDocument()
  })

  it('FE-TRANSIT-WALK-005: an itinerary saved before the flag existed keeps the old wording', () => {
    // Absent, not false: that is what a stored journey from an earlier release
    // actually looks like once it comes back out of the database.
    render(<TransitWalkDivider leg={{ mode: 'WALK', duration: 120, from: stop('品川'), to: stop('品川') }} t={t} />)
    expect(screen.getByText(/Walk to 品川/)).toBeInTheDocument()
  })
})
