import React from 'react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, within, fireEvent } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
// The rail measures itself to drop the stop counts when pulled narrow. Zero reads as "not
// measured yet", which keeps every figure, and is the default here.
const { railWidth } = vi.hoisted(() => ({ railWidth: { value: 0 } }))
vi.mock('../../hooks/useElementSize', () => ({
  useElementSize: () => ({ ref: () => {}, width: railWidth.value, height: 0 }),
}))
afterEach(() => { railWidth.value = 0 })

import RoadtripSidebar from './RoadtripSidebar'
import RoadtripModeSwitch from './RoadtripModeSwitch'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { DryPoint } from './roadtripModel'
import type { RefuelSearch } from './useRefuelSearch'
import type { RefuelCandidate, RefuelOutcome } from './refuelSuggestion'
import type { Reservation, RouteSegment } from '../../types'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

function stop(over: Partial<RoadtripStop> & { assignmentId: number; name: string }): RoadtripStop {
  return {
    placeId: over.assignmentId * 10,
    // Filled in by `day()` from the card it is put on, unless the case under test says
    // otherwise: a stop names the day it is STORED on, which after a night drive is not
    // the card it is drawn on. -1 is "not stated", never a real id.
    ownerDayId: -1,
    ownerIndex: -1,
    lat: 53.5,
    lng: 9.9,
    time: null,
    dwellMinutes: null,
    legMode: null,
    incomingLegMode: null,
    stopType: null,
    ...over,
  }
}

const leg = (over: Partial<RouteSegment> = {}): RouteSegment =>
  ({ distance: 100000, duration: 3600, distanceText: '100 km', durationText: '1 h', mode: 'driving', ...over }) as RouteSegment

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  const stops = over.stops ?? [
    stop({ assignmentId: 1, name: 'Hamburg' }),
    stop({ assignmentId: 2, name: 'Berlin' }),
  ]
  const dayId = over.dayId ?? 1
  return {
    dayId,
    dayNumber: 1,
    date: null,
    title: null,
    legs: [leg()],
    legVias: [], driveWarnings: [], dayWarning: null,
    schedule: { entries: stops.map(() => ({ arrival: null, departure: null, anchored: false, dayOffset: 0 })), warnings: [] },
    geometry: [],
    distance: 100000,
    duration: 3600,
    ...over,
    // After the spread, because `over` carries the raw stops this was built from: the
    // same pair the hook fills in, for every stop that did not state its own.
    stops: stops.map((s, i) => ({
      ...s,
      ownerDayId: s.ownerDayId === -1 ? dayId : s.ownerDayId,
      ownerIndex: s.ownerIndex === -1 ? i : s.ownerIndex,
    })),
  }
}

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [day()],
    lines: [],
    lineDays: [],
    lineJoins: [],
    segments: [],
    accessLines: [],
    vias: [],
    totalDistance: 100000,
    totalDuration: 3600,
    totalStops: 2,
    quietDays: [],
    loading: false,
    ...over,
  }
}

const dry = (over: Partial<DryPoint> = {}): DryPoint & { lat: number; lng: number } => ({
  legIndex: 0,
  intoLegKm: 182,
  drivenMeters: 182000,
  // The range that was crossed, kept deliberately unlike `intoLegKm`: it is the
  // traveller's own setting, so a band printing it would read the same figure on
  // every leg of the day.
  sinceKm: 600,
  lat: 52.4,
  lng: 10.2,
  ...over,
})

/** Idle unless a case says which part of the search it is standing in. */
const search = (over: Partial<RefuelSearch> = {}): RefuelSearch => ({
  openFor: null,
  loading: false,
  outcome: null,
  results: [],
  offered: [],
  ask: vi.fn(),
  close: vi.fn(),
  ...over,
})

describe('RoadtripSidebar', () => {
  /**
   * The value the summary head pairs with this label. The same words also name the chips
   * further down for screen readers, so the lookup has to hold on to the `dt` — otherwise
   * it matches "Distance" three times over.
   */
  const total = (label: string): string => {
    // The summary is three columns; the caption and its number are siblings in one cell.
    // The same words also name the badges further down, so the lookup keeps to the cell
    // whose first child is the caption itself.
    const caption = screen.getAllByText(label).find(el => el.parentElement?.firstElementChild === el)!
    return caption.parentElement!.lastElementChild!.textContent!.replace(/\s+/g, ' ').trim()
  }

  it('FE-ROADTRIP-SIDEBAR-001: leads with the totals for the whole drive', () => {
    wrap(<RoadtripSidebar routes={routes({ totalDistance: 250000, totalDuration: 9000, totalStops: 5 })} />)

    expect(total('Distance')).toBe('250 km')
    expect(total('Driving time')).toBe('2 h 30 min')
    expect(total('Stops')).toBe('5')
  })

  it('FE-ROADTRIP-SIDEBAR-083: pulled narrow, the rail stops counting stops, in its head and on every day', () => {
    const wide = wrap(<RoadtripSidebar routes={routes({ totalDistance: 250000, totalDuration: 9000, totalStops: 5 })} />)
    expect(screen.getByText('2 stops')).toBeInTheDocument()
    wide.unmount()

    railWidth.value = 300
    wrap(<RoadtripSidebar routes={routes({ totalDistance: 250000, totalDuration: 9000, totalStops: 5 })} />)
    expect(total('Distance')).toBe('250 km')
    expect(total('Driving time')).toBe('2 h 30 min')
    const head = screen.getByText('Distance').closest('header')!
    // The figure goes with its hairline, so the two left share the width.
    expect(within(head).queryByText('Stops')).toBeNull()
    expect(head.querySelectorAll('span.w-px')).toHaveLength(1)
    expect(screen.queryByText('2 stops')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-002: chains the stops with the drive between them', () => {
    // Trip and day totals deliberately differ from the single leg, so the leg's own two
    // values are the only place '100 km' and '1 h' can come from.
    wrap(<RoadtripSidebar routes={routes({
      days: [day({ distance: 250000, duration: 9000 })],
      totalDistance: 250000,
      totalDuration: 9000,
    })} />)

    expect(screen.getByText('Hamburg')).toBeInTheDocument()
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    // One sentence, not two glued values: the middot is gone and so is the pair of chips.
    expect(screen.getByText('100 km in 1 h')).toBeInTheDocument()
    expect(screen.queryByText('100 km · 1 h')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-003: says a leg is still coming rather than showing a blank', () => {
    wrap(<RoadtripSidebar routes={routes({
      days: [day({ legs: [undefined], distance: 0, duration: 0 })],
      totalDistance: 0,
      totalDuration: 0,
    })} />)

    // An absent value says so rather than reading zero.
    expect(screen.queryByText(/100 km in/)).not.toBeInTheDocument()
    expect(screen.getByText('No route')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-004: sets a pinned arrival apart from a computed one', () => {
    const stops = [stop({ assignmentId: 1, name: 'Ferry' }), stop({ assignmentId: 2, name: 'Berlin' })]
    const schedule = {
      entries: [
        { arrival: '09:00', departure: '09:30', anchored: true, dayOffset: 0 },
        { arrival: '10:30', departure: '10:30', anchored: false, dayOffset: 0 },
      ],
      warnings: [],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    // Both are plain text at the row's edge — no pill, no icon. What separates the time
    // somebody chose from the one the drive worked out is weight and ink. The reason is
    // named in a tooltip, which only enters the DOM on hover, so the visible difference
    // is what this pins.
    const pinned = screen.getByText('09:00')
    const computed = screen.getByText('10:30')
    expect(pinned.className).toContain('font-semibold')
    expect(computed.className).not.toContain('font-semibold')
  })

  it('FE-ROADTRIP-SIDEBAR-005: flags a stop the drive cannot reach in time', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Ferry' })]
    const schedule = {
      entries: stops.map(() => ({ arrival: '09:00', departure: '09:00', anchored: true, dayOffset: 0 })),
      warnings: [{ index: 1, code: 'late' as const, minutes: 45 }],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    expect(screen.getByLabelText(/45/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-006: shows how long a stop is planned to take', () => {
    const stops = [stop({ assignmentId: 1, name: 'Museum', dwellMinutes: 90 }), stop({ assignmentId: 2, name: 'Berlin' })]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })] })} />)

    expect(screen.getByText('1 h 30 min')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-007: selecting a stop reports the place and the assignment', () => {
    const onSelectStop = vi.fn()
    wrap(<RoadtripSidebar routes={routes()} onSelectStop={onSelectStop} />)

    fireEvent.click(screen.getByText('Berlin'))
    expect(onSelectStop).toHaveBeenCalledWith(20, 2)
  })

  it('FE-ROADTRIP-SIDEBAR-008: marks the selected stop for assistive tech', () => {
    wrap(<RoadtripSidebar routes={routes()} selectedAssignmentId={2} />)

    const selected = screen.getByText('Berlin').closest('button')!
    expect(selected).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Hamburg').closest('button')).not.toHaveAttribute('aria-current')
  })

  it('FE-ROADTRIP-SIDEBAR-009: a trip with nothing to drive shows the empty state, not a zeroed rail', () => {
    // Nothing to total up, so no "0 km" standing over an empty list. The mascot
    // is the shape every other empty state in TREK uses.
    wrap(<RoadtripSidebar routes={routes({ days: [], totalDistance: 0, totalDuration: 0, totalStops: 0 })} />)

    expect(screen.getByText('No route yet')).toBeInTheDocument()
    expect(screen.queryByText('Hamburg')).not.toBeInTheDocument()
    expect(screen.queryByText(/0 km/)).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-010: each day carries its own distance and time', () => {
    const second = day({ dayId: 2, dayNumber: 2, distance: 50000, duration: 1800, stops: [
      stop({ assignmentId: 3, name: 'Dresden' }),
      stop({ assignmentId: 4, name: 'Prague' }),
    ] })
    wrap(<RoadtripSidebar routes={routes({ days: [day(), second], totalStops: 4 })} />)

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(2)
    expect(within(headings[1].parentElement!).getByText(/50 km/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-011: draws the midnight crossing where it happens', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Berlin' })]
    const schedule = {
      entries: [
        { arrival: '22:00', departure: '22:00', anchored: false, dayOffset: 0 },
        { arrival: '01:30', departure: '01:30', anchored: false, dayOffset: 1 },
      ],
      warnings: [{ index: 1, code: 'overnight' as const }],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    // The crossing is no longer a band in the chain: a drive past midnight hands its
    // stops to the next day's card, and the block around them there is what says so
    // (`nightSpill.ts`). What is left on a day that could not hand them on — the last day
    // of a trip, or one whose arrivals are supplied directly as they are here — is the
    // marker on the arrival, where "01:30" would otherwise read as tonight.
    // One mention, not two: the marker on the arrival, spelled out for a screen reader.
    // The band that used to repeat it in the chain is gone — a drive past midnight hands
    // its stops to the next day's card now, and the block around them there says it.
    expect(screen.getAllByText('Next day')).toHaveLength(1)
    expect(screen.getByText('01:30').textContent).toContain('+1')
  })

  it('FE-ROADTRIP-SIDEBAR-012: a late arrival past midnight keeps both findings', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Ferry' })]
    const schedule = {
      entries: [
        { arrival: '22:00', departure: '22:00', anchored: false, dayOffset: 0 },
        { arrival: '01:30', departure: '01:30', anchored: true, dayOffset: 1 },
      ],
      // Both belong to the same stop. Reading only the first one dropped the late flag.
      warnings: [
        { index: 1, code: 'overnight' as const },
        { index: 1, code: 'late' as const, minutes: 45 },
      ],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    // Both findings still reach the stop; only the band that used to repeat the crossing
    // is gone. Reading just the first warning used to drop the late flag entirely.
    expect(screen.getByText('01:30').textContent).toContain('+1')
    expect(screen.getByLabelText(/45/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-013: says the totals are still a partial sum while legs arrive', () => {
    const { unmount } = wrap(<RoadtripSidebar routes={routes({ loading: true })} />)
    expect(screen.getByText('Still working out the rest of the drive')).toBeInTheDocument()

    unmount()
    wrap(<RoadtripSidebar routes={routes({ loading: false })} />)
    expect(screen.queryByText('Still working out the rest of the drive')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-014: shows the name a day was given', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [day({ title: 'Along the coast' })] })} />)

    expect(screen.getByText('Along the coast')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-015: dates the day machine-readably, whatever the locale prints', () => {
    const { container } = wrap(<RoadtripSidebar routes={routes({ days: [day({ date: '2026-08-31' })] })} />)

    const stamp = container.querySelector('time')!
    expect(stamp).toHaveAttribute('datetime', '2026-08-31')
    expect(stamp.textContent).not.toBe('')
  })

  it('FE-ROADTRIP-SIDEBAR-016: a leg a plugin routed carries its own mark and its note', () => {
    const charged = leg({ mode: 'plugin:charge', noteText: '25 min charge' })
    wrap(<RoadtripSidebar routes={routes({ days: [day({ legs: [charged] })] })} />)

    // Free text, so it gets a line rather than being squeezed into a pill.
    expect(screen.getByText('25 min charge')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-019: a fuel stop breaks the drive instead of taking a number', () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Aral Autohof', stopType: 'fuel', dwellMinutes: 15 }),
      stop({ assignmentId: 3, name: 'Berlin' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg(), leg()] })] })} />)

    // The kind is what you look for on a drive; the running number is on the map pin.
    expect(screen.getByLabelText('Fuel')).toBeInTheDocument()
    expect(screen.getByText('Aral Autohof')).toBeInTheDocument()
    // How long the pause takes is what the row is for.
    expect(screen.getByText('15 min')).toBeInTheDocument()
    // The two places the trip is actually for keep counting one, two — the tank stop
    // between them is part of the drive, not a third destination. Scoped to the chain:
    // the summary above counts stops too, in the same digits.
    const chain = screen.getByRole('list')
    expect(within(chain).getByText('1')).toBeInTheDocument()
    expect(within(chain).getByText('2')).toBeInTheDocument()
    expect(within(chain).queryByText('3')).not.toBeInTheDocument()
    // Two drive bands, because the stop splits the leg it falls on. Scoped to the chain
    // again: the day's header badge phrases its own total the same way.
    expect(within(chain).getAllByText('100 km in 1 h')).toHaveLength(2)
  })

  it('FE-ROADTRIP-SIDEBAR-032: every stop offers a stay, whether it has one or not', () => {
    // The value has never been editable anywhere in TREK, so a stop without one needs a
    // way in before it can get one — the plus sits in the slot the number will occupy.
    const onEditStay = vi.fn()
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg', dwellMinutes: 90 }),
      stop({ assignmentId: 2, name: 'Berlin' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })] })} onEditStay={onEditStay} />)

    expect(screen.getByText('1 h 30 min')).toBeInTheDocument()
    const chain = screen.getByRole('list')
    const add = within(chain).getByText('+')

    fireEvent.click(add)
    // The visit rides along with the place, so the dialog can reach its end time.
    expect(onEditStay).toHaveBeenCalledWith({
      placeId: 20, name: 'Berlin', minutes: null, arrival: null, departure: null, leaveAt: null, missedBy: null, assignmentId: 2, dayId: 1,
    })
  })

  it('FE-ROADTRIP-SIDEBAR-034: a pause reached late says so, the same as a numbered stop', () => {
    // The schedule restarts its chain at any pinned time, whatever kind of stop carries
    // it, so it computes the finding for a fuel halt too. The rail used to hand `late`
    // only to the numbered branch and throw the pause's own away.
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Aral Autohof', stopType: 'fuel', dwellMinutes: 15 }),
    ]
    const schedule = {
      entries: stops.map(() => ({ arrival: '09:00', departure: '09:15', anchored: true, dayOffset: 0 })),
      warnings: [{ index: 1, code: 'late' as const, minutes: 45 }],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule, legs: [leg()] })] })} />)

    expect(screen.getByLabelText(/45/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-049: a stop left at a set time shows the stay that makes, and until when', () => {
    // The stay the place carries is 30 min; the End at two is what the drive keeps to.
    const onEditStay = vi.fn()
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Lueneburg', dwellMinutes: 30, leaveAt: '14:00' }),
    ]
    const schedule = {
      entries: [
        { arrival: '09:00', departure: '09:00', anchored: true, dayOffset: 0 },
        { arrival: '10:00', departure: '14:00', anchored: false, dayOffset: 0 },
      ],
      warnings: [],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} onEditStay={onEditStay} />)

    expect(screen.getByText('4 h')).toBeInTheDocument()
    expect(screen.getByText('until 14:00')).toBeInTheDocument()
    expect(screen.queryByText('30 min')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Time at this stop: 4 h until 14:00' }))
    expect(onEditStay).toHaveBeenCalledWith(expect.objectContaining({ leaveAt: '14:00', arrival: '10:00', departure: '14:00' }))
  })

  it('FE-ROADTRIP-SIDEBAR-050: a stop reached after the time it is left at says so, beside a late arrival', () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Aral Autohof', stopType: 'fuel', leaveAt: '14:00', time: '14:00' }),
    ]
    const schedule = {
      entries: stops.map(() => ({ arrival: '14:30', departure: '14:30', anchored: true, dayOffset: 0 })),
      warnings: [
        { index: 1, code: 'late' as const, minutes: 30 },
        { index: 1, code: 'missedLeave' as const, minutes: 30 },
      ],
    }
    const onEditStay = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule, legs: [leg()] })] })} onEditStay={onEditStay} />)

    expect(screen.getByLabelText('Arrives 30 min after the time you set')).toBeInTheDocument()
    expect(screen.getByLabelText('Arrives 30 min after the time you set to leave')).toBeInTheDocument()
    // Left the moment it is reached: a zero, until the time it was meant to go.
    expect(screen.getByText('0 min')).toBeInTheDocument()
    // The dialog is handed the schedule's own finding, so it can say the same.
    fireEvent.click(screen.getByRole('button', { name: 'Time at this stop: 0 min until 14:00' }))
    expect(onEditStay).toHaveBeenCalledWith(expect.objectContaining({ leaveAt: '14:00', missedBy: 30 }))
  })

  it('FE-ROADTRIP-SIDEBAR-033: without the right to edit, a stop with no stay shows nothing', () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg', dwellMinutes: 90 }),
      stop({ assignmentId: 2, name: 'Berlin' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })] })} />)

    // A label, not an invitation that leads nowhere.
    expect(screen.getByText('1 h 30 min')).toBeInTheDocument()
    expect(screen.queryByText('+')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-030: a day counts the places it visits, not the pauses on the way', () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Ionity Horst', stopType: 'charging' }),
      stop({ assignmentId: 3, name: 'Rasthof Fläming', stopType: 'rest_area' }),
      stop({ assignmentId: 4, name: 'Berlin' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg(), leg(), leg()] })] })} />)

    expect(screen.getByText('2 stops')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-031: every kind the corridor finds is a pause, not a destination', () => {
    // Anything picked off "along the route" was come across on the way, so all six kinds
    // sit inside the leg with their own icon and none of them counts as a stop.
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Camping Seeblick', stopType: 'campsite' }),
      stop({ assignmentId: 3, name: 'Bäckerei Junge', stopType: 'restaurant' }),
      stop({ assignmentId: 4, name: 'Holstentor', stopType: 'sights' }),
      stop({ assignmentId: 5, name: 'Lübeck' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg(), leg(), leg(), leg()] })] })} />)

    expect(screen.getByLabelText('Campsite')).toBeInTheDocument()
    expect(screen.getByLabelText('Food')).toBeInTheDocument()
    expect(screen.getByLabelText('Sights')).toBeInTheDocument()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-020: a stop kind nobody knows falls back to the running number', () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Etwas Neues', stopType: 'helipad' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })] })} />)

    expect(within(screen.getByRole('list')).getByText('2')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-021: without the right to edit days the chain cannot be dragged', () => {
    const { container } = wrap(<RoadtripSidebar routes={routes()} />)

    expect(container.querySelector('li[draggable="true"]')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-022: dropping a stop on another reports where it should go', () => {
    const onReorderStop = vi.fn()
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Lueneburg' }),
      stop({ assignmentId: 3, name: 'Berlin' }),
    ]
    const { container } = wrap(
      <RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg(), leg()] })] })} onReorderStop={onReorderStop} />,
    )

    const rows = container.querySelectorAll('li[draggable="true"]')
    expect(rows).toHaveLength(3)
    const dataTransfer = { effectAllowed: '', setData: vi.fn() }
    fireEvent.dragStart(rows[2], { dataTransfer })
    fireEvent.dragOver(rows[0])
    fireEvent.drop(rows[0])

    // The last stop dropped on the first: day, the assignment moved, and its new index.
    expect(onReorderStop).toHaveBeenCalledWith(1, 3, 0)
  })

  it('FE-ROADTRIP-SIDEBAR-023: dropping a stop back on itself changes nothing', () => {
    const onReorderStop = vi.fn()
    const { container } = wrap(<RoadtripSidebar routes={routes()} onReorderStop={onReorderStop} />)

    const rows = container.querySelectorAll('li[draggable="true"]')
    const dataTransfer = { effectAllowed: '', setData: vi.fn() }
    fireEvent.dragStart(rows[0], { dataTransfer })
    fireEvent.dragOver(rows[0])
    fireEvent.drop(rows[0])

    expect(onReorderStop).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-SIDEBAR-024: the chain can be reordered from the keyboard too', () => {
    const onReorderStop = vi.fn()
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      stop({ assignmentId: 2, name: 'Lueneburg' }),
      stop({ assignmentId: 3, name: 'Berlin' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg(), leg()] })] })} onReorderStop={onReorderStop} />)

    // Dragging is a gesture; without this the chain is unreachable without a mouse.
    fireEvent.keyDown(screen.getByText('Lueneburg').closest('button')!, { key: 'ArrowDown', altKey: true })
    expect(onReorderStop).toHaveBeenCalledWith(1, 2, 2)

    fireEvent.keyDown(screen.getByText('Lueneburg').closest('button')!, { key: 'ArrowUp', altKey: true })
    expect(onReorderStop).toHaveBeenCalledWith(1, 2, 0)
  })

  it('FE-ROADTRIP-SIDEBAR-025: the ends of a day cannot be pushed past themselves', () => {
    const onReorderStop = vi.fn()
    wrap(<RoadtripSidebar routes={routes()} onReorderStop={onReorderStop} />)

    fireEvent.keyDown(screen.getByText('Hamburg').closest('button')!, { key: 'ArrowUp', altKey: true })
    fireEvent.keyDown(screen.getByText('Berlin').closest('button')!, { key: 'ArrowDown', altKey: true })
    expect(onReorderStop).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-SIDEBAR-026: an arrow without Alt still belongs to the list, not to us', () => {
    const onReorderStop = vi.fn()
    wrap(<RoadtripSidebar routes={routes()} onReorderStop={onReorderStop} />)

    fireEvent.keyDown(screen.getByText('Hamburg').closest('button')!, { key: 'ArrowDown' })
    expect(onReorderStop).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-SIDEBAR-027: a day without a drive appears only while something is dragged', () => {
    const quiet = { dayId: 9, dayNumber: 2, date: null, title: null, stops: [] }
    const onMoveStopToDay = vi.fn()
    const { container } = wrap(
      <RoadtripSidebar
        routes={routes({ quietDays: [quiet] })}
        onReorderStop={vi.fn()}
        onMoveStopToDay={onMoveStopToDay}
      />,
    )

    // Nothing in flight: an empty day is not worth a row, the rail is about the drive.
    expect(screen.queryByText(/drop one here/i)).not.toBeInTheDocument()

    const rows = container.querySelectorAll('li[draggable="true"]')
    fireEvent.dragStart(rows[0], { dataTransfer: { effectAllowed: '', setData: vi.fn() } })
    expect(screen.getByText(/drop one here/i)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-028: dropping on another day reports both days', () => {
    const quiet = { dayId: 9, dayNumber: 2, date: null, title: null, stops: [] }
    const onMoveStopToDay = vi.fn()
    const { container } = wrap(
      <RoadtripSidebar
        routes={routes({ quietDays: [quiet] })}
        onReorderStop={vi.fn()}
        onMoveStopToDay={onMoveStopToDay}
      />,
    )

    const rows = container.querySelectorAll('li[draggable="true"]')
    fireEvent.dragStart(rows[1], { dataTransfer: { effectAllowed: '', setData: vi.fn() } })
    const target = screen.getByText(/drop one here/i).closest('section')!
    fireEvent.dragOver(target)
    fireEvent.drop(target)

    // From day 1, the second stop (assignment 2), onto day 9, at its end.
    expect(onMoveStopToDay).toHaveBeenCalledWith(1, 2, 9, 0)
  })

  it('FE-ROADTRIP-SIDEBAR-029: a stop dropped on a row of another day lands at that row', () => {
    const second = day({
      dayId: 2,
      dayNumber: 2,
      stops: [stop({ assignmentId: 3, name: 'Dresden' }), stop({ assignmentId: 4, name: 'Prague' })],
    })
    const onMoveStopToDay = vi.fn()
    const onReorderStop = vi.fn()
    const { container } = wrap(
      <RoadtripSidebar
        routes={routes({ days: [day(), second], totalStops: 4 })}
        onReorderStop={onReorderStop}
        onMoveStopToDay={onMoveStopToDay}
      />,
    )

    const rows = container.querySelectorAll('li[draggable="true"]')
    fireEvent.dragStart(rows[0], { dataTransfer: { effectAllowed: '', setData: vi.fn() } })
    fireEvent.dragOver(rows[3])
    fireEvent.drop(rows[3])

    expect(onMoveStopToDay).toHaveBeenCalledWith(1, 1, 2, 1)
    // Crossing days is a different call; the same-day reorder must not also fire.
    expect(onReorderStop).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-SIDEBAR-018: a travel mode with no mark of its own falls back to the car, a ride keeps its own', () => {
    const unknown = wrap(<RoadtripSidebar routes={routes({ days: [day({ legs: [leg({ mode: 'hovercraft' })] })] })} />)
    expect(unknown.container.querySelector('svg.lucide-car-front')).toBeInTheDocument()
    unknown.unmount()

    // A ferry leg is a booked ride since the carrier seams (#2429), not a drive
    // whose mode nobody drew an icon for.
    const ride = wrap(<RoadtripSidebar routes={routes({ days: [day({ legs: [leg({ mode: 'ferry' })] })] })} />)
    expect(ride.container.querySelector('svg.lucide-sailboat')).toBeInTheDocument()
    expect(ride.container.querySelector('svg.lucide-car-front')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-017: a late finding without a figure still reports itself', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Ferry' })]
    const schedule = {
      entries: stops.map(() => ({ arrival: '09:00', departure: '09:00', anchored: false, dayOffset: 0 })),
      warnings: [{ index: 1, code: 'late' as const }],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    expect(screen.getByLabelText(/0 min/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-018: the track badge is a viewer-free control, and it says when a day is shaped', () => {
    const onFollowTrack = vi.fn()
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Berlin' })]
    const { rerender } = wrap(
      <RoadtripSidebar routes={routes({ days: [day({ stops })] })} onFollowTrack={onFollowTrack} viaCounts={{ 1: 4 }} />,
    )

    const badge = screen.getByRole('button', { name: 'Track' })
    fireEvent.click(badge)
    expect(onFollowTrack).toHaveBeenCalledWith(1)
    // The rail draws no vias, so the tint is the only place a drive shaped by hand
    // differs from one the router picked on its own.
    expect(badge.className).toContain('bg-accent-subtle')

    rerender(
      <TranslationProvider>
        <RoadtripSidebar routes={routes({ days: [day({ stops })] })} onFollowTrack={onFollowTrack} />
      </TranslationProvider>,
    )
    expect(screen.getByRole('button', { name: 'Track' }).className).not.toContain('bg-accent-subtle')
  })

  it('FE-ROADTRIP-SIDEBAR-019: a viewer is offered no track badge at all', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Berlin' })]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })] })} />)
    expect(screen.queryByRole('button', { name: 'Track' })).toBeNull()
  })

  /**
   * The block a night drive leaves on the next morning's card.
   *
   * The stops are stored on the day they set off from and drawn on the day they are
   * reached, so what is asserted here is that the block says where they came from and
   * that the drive through the night is drawn with them. See `nightSpill.ts`.
   */
  describe('a stretch driven onto this day through the night', () => {
    const spilled = () => day({
      dayNumber: 2,
      stops: [
        stop({ assignmentId: 1, name: 'Neuruppin', ownerDayId: 9, ownerIndex: 3 }),
        stop({ assignmentId: 2, name: 'Wittenberg' }),
      ],
      spills: [{
        at: 0,
        count: 1,
        fromDayNumber: 1,
        departure: '22:30',
        leg: leg({ distance: 253000, duration: 10380 }),
        line: [[53, 10], [52, 11]],
        fromStop: stop({ assignmentId: 99, name: 'Circle K', ownerDayId: 9, ownerIndex: 2 }),
      }],
    })

    it('FE-ROADTRIP-SIDEBAR-031: names the day the stretch came from', () => {
      wrap(<RoadtripSidebar routes={routes({ days: [spilled()] })} />)
      expect(screen.getByText('From day 1')).toBeTruthy()
    })

    it('FE-ROADTRIP-SIDEBAR-032: draws the night drive, so the kilometres reach the stops', () => {
      wrap(<RoadtripSidebar routes={routes({ days: [spilled()] })} />)
      // Without it the card would gain a stop and none of the driving that reaches it.
      expect(screen.getByText('253 km in 2 h 53 min')).toBeTruthy()
      expect(screen.getByText('leaves 22:30')).toBeTruthy()
    })

    it('FE-ROADTRIP-SIDEBAR-030: a drag names the day the stop is STORED on, not the card', () => {
      const onReorderStop = vi.fn()
      const onMoveStopToDay = vi.fn()
      const { container } = wrap(<RoadtripSidebar
        routes={routes({ days: [spilled()] })}
        onReorderStop={onReorderStop}
        onMoveStopToDay={onMoveStopToDay}
      />)

      // Dropping the borrowed stop onto its neighbour is a reorder inside day 9 — the day
      // the server knows it by — even though both are drawn under day 2.
      // The draggable rows only: the block around the borrowed stretch is a list item
      // too, and it contains the text of every stop inside it.
      const rows = container.querySelectorAll('li[draggable="true"]')
      const dataTransfer = { effectAllowed: '', setData: vi.fn() }
      fireEvent.dragStart(rows[0], { dataTransfer })
      fireEvent.dragOver(rows[1], { dataTransfer })
      fireEvent.drop(rows[1], { dataTransfer })
      // Dragged from day 9 index 3 — where the server has it — onto day 1 index 1, the
      // stored position of the row it was dropped on. Neither number is the card's.
      expect(onMoveStopToDay).toHaveBeenCalledWith(9, 1, 1, 1)
      expect(onReorderStop).not.toHaveBeenCalled()
    })

    it('FE-ROADTRIP-SIDEBAR-033: an ordinary day draws no block at all', () => {
      wrap(<RoadtripSidebar routes={routes()} />)
      expect(screen.queryByText(/From day/)).toBeNull()
    })
  })

  /**
   * The band where the fuel actually ends, and the one search offered from it.
   *
   * It hangs off the leg rather than off a stop, because those are two different places:
   * the range warning marks where somebody finds out, and that can be a long way past the
   * point the tank ran dry. A station offered at the warning is one the car cannot reach.
   */
  describe('the leg the tank runs out on', () => {
    const pump = (name: string, offRouteKm: number, spareKm: number): RefuelCandidate => ({
      osm_id: `osm-${name}`,
      name,
      lat: 52.4,
      lng: 10.1,
      category: 'fuel',
      poi_type: 'fuel',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      cuisine: null,
      source: 'openstreetmap',
      alongKm: 170,
      offRouteKm,
      spareKm,
    })

    const empties = dry({ legIndex: 1 })
    // Three stops, so the leg that empties has one it is not on to be absent from.
    const thirsty = (): RoadtripDay => day({
      stops: [
        stop({ assignmentId: 1, name: 'Hamburg' }),
        stop({ assignmentId: 2, name: 'Hannover' }),
        stop({ assignmentId: 3, name: 'Kassel' }),
      ],
      legs: [leg(), leg()],
      dryPoints: [empties],
    })

    it('FE-ROADTRIP-SIDEBAR-035: the band sits on the leg the fuel ends on, and says how far into it', () => {
      const { container } = wrap(
        <RoadtripSidebar routes={routes({ days: [thirsty()], totalStops: 3 })} refuel={search()} />,
      )

      // The second row owns the second leg. Drawn on every row instead, the rail would
      // offer a fill-up on a stretch the car drives with a full tank.
      const rows = container.querySelectorAll('li')
      expect(screen.getAllByText('Tank runs out here')).toHaveLength(1)
      expect(within(rows[1] as HTMLElement).getByText('Tank runs out here')).toBeInTheDocument()
      // Distance into the leg, which is where a drive band keeps its figures. The 600 is
      // the setting that was crossed and belongs to no place on the map.
      expect(screen.getByText('after 182 km')).toBeInTheDocument()
      expect(screen.queryByText(/600 km/)).not.toBeInTheDocument()
    })

    it('FE-ROADTRIP-SIDEBAR-036: the low-fuel lamp is itself the button that goes looking', () => {
      const onAskRefuel = vi.fn()
      wrap(
        <RoadtripSidebar
          routes={routes({ days: [thirsty()], totalStops: 3 })}
          refuel={search()}
          onAskRefuel={onAskRefuel}
        />,
      )

      // Not a lamp with a magnifier beside it, which says the same thing twice: the lamp
      // reports the empty tank and pressing it is what does something about it, so the
      // lamp has to be inside the button rather than next to one.
      const ask = screen.getByRole('button', { name: 'Find fuel' })
      expect(ask.querySelector('svg.lucide-fuel')).toBeInTheDocument()
      expect(within(ask).queryByRole('button')).toBeNull()

      fireEvent.click(ask)
      // The dry point travels with the ask: the search is a circle pulled back from that
      // coordinate, and the day alone does not say where on it to look.
      expect(onAskRefuel).toHaveBeenCalledWith(1, empties)
    })

    it('FE-ROADTRIP-SIDEBAR-037: a band inside a borrowed stretch is filed under the card it is drawn on', () => {
      const onAskRefuel = vi.fn()
      const overnight = dry({ legIndex: 0 })
      const card = day({
        dayNumber: 2,
        stops: [
          stop({ assignmentId: 1, name: 'Neuruppin', ownerDayId: 9, ownerIndex: 3 }),
          stop({ assignmentId: 2, name: 'Wittenberg' }),
        ],
        dryPoints: [overnight],
        spills: [{
          at: 0,
          count: 1,
          fromDayNumber: 1,
          departure: '22:30',
          leg: leg(),
          line: [[53, 10], [52, 11]],
          fromStop: stop({ assignmentId: 99, name: 'Circle K', ownerDayId: 9, ownerIndex: 2 }),
        }],
      })
      const { unmount } = wrap(
        <RoadtripSidebar
          routes={routes({ days: [card] })}
          refuel={search({ openFor: '1:0', loading: true })}
          onAskRefuel={onAskRefuel}
        />,
      )

      // Everything that WRITES names the day a stop is stored on, day 9 here. This is the
      // exception and it has to be: the open search is filed under the card day and the
      // leg, so a band asking as day 9 would have its answers arrive under a key no band
      // is watching and would never open. That it opened at all is the assertion.
      expect(screen.getByText(/Looking along the route/)).toBeInTheDocument()

      unmount()
      wrap(
        <RoadtripSidebar
          routes={routes({ days: [card] })}
          refuel={search()}
          onAskRefuel={onAskRefuel}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Find fuel' }))
      expect(onAskRefuel).toHaveBeenCalledWith(1, overnight)
    })

    it('FE-ROADTRIP-SIDEBAR-038: while the request is in flight the lamp steps aside for the way out', () => {
      const close = vi.fn()
      wrap(
        <RoadtripSidebar
          routes={routes({ days: [thirsty()], totalStops: 3 })}
          refuel={search({ openFor: '1:1', loading: true, close })}
        />,
      )

      expect(screen.getByText(/Looking along the route/)).toBeInTheDocument()
      // Gone, not merely quieter. Every press is a real request against a shared service,
      // and a lamp still standing there invites a second one nobody asked for.
      expect(screen.queryByRole('button', { name: 'Find fuel' })).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(close).toHaveBeenCalled()
    })

    it('FE-ROADTRIP-SIDEBAR-039: an answer carries the detour and what is left in the tank as two figures', () => {
      const onAcceptRefuel = vi.fn()
      const shell = pump('Shell Hannover', 1.4, 48.6)
      wrap(
        <RoadtripSidebar
          routes={routes({ days: [thirsty()], totalStops: 3 })}
          refuel={search({ openFor: '1:1', outcome: 'found', results: [shell] })}
          onAcceptRefuel={onAcceptRefuel}
        />,
      )

      // Two facts about two different things: the detour is what the stop costs and what
      // the list is sorted by, the spare is what is left when the car draws level. Joined
      // into one line with a separator, neither exact lookup finds anything.
      expect(screen.getByText('1.4 km')).toBeInTheDocument()
      expect(screen.getByText('49 km')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Add Shell Hannover as a fuel stop' }))
      // With the dry point, because the caller has no other way of knowing which leg the
      // accepted stop belongs on.
      expect(onAcceptRefuel).toHaveBeenCalledWith(1, shell, empties)
    })

    it('FE-ROADTRIP-SIDEBAR-040: a search that came back with nothing says which nothing it was', () => {
      const answered = (outcome: RefuelOutcome) => (
        <TranslationProvider>
          <RoadtripSidebar
            routes={routes({ days: [thirsty()], totalStops: 3 })}
            refuel={search({ openFor: '1:1', outcome })}
          />
        </TranslationProvider>
      )
      const { rerender } = render(answered('none'))

      // Only the first of these is a statement about the road. Telling somebody there is
      // nothing on a stretch that was never fully checked, or never checked at all, is
      // worse than saying nothing.
      expect(screen.getByText(/Nothing found/)).toBeInTheDocument()
      rerender(answered('incomplete'))
      expect(screen.getByText(/cut short/)).toBeInTheDocument()
      rerender(answered('failed'))
      expect(screen.getByText(/did not answer/)).toBeInTheDocument()

      // And a way to ask again rather than a dead end: the place search is a shared
      // service that does time out, and no answer with no retry reads as broken.
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Find fuel' })).toBeNull()
    })

    it('FE-ROADTRIP-SIDEBAR-041: the stop stops repeating what the band already says better', () => {
      // The warning marks the stop somebody finds out at and counts the whole tank; the
      // band sits where the fuel ends and offers a way out. Both at once prints the answer
      // above the problem.
      const warned = (): RoadtripDay => ({
        ...thirsty(),
        driveWarnings: [{ index: 2, code: 'range', sinceKm: 640 }],
      })
      const { unmount } = wrap(
        <RoadtripSidebar routes={routes({ days: [warned()], totalStops: 3 })} refuel={search()} />,
      )
      expect(screen.queryByText('640 km')).toBeNull()

      unmount()
      // With no search to run there is nothing better, so the finding is all there is and
      // has to stay.
      wrap(<RoadtripSidebar routes={routes({ days: [warned()], totalStops: 3 })} />)
      expect(screen.queryByText('640 km')).toBeNull()
    })
  })

  /**
   * Folding a day down to its header.
   *
   * The whole header is the control and the hover is the only sign of it: a chevron or a
   * fold label sitting among the day's own facts reads as a fourth fact about the day
   * rather than as something to press. Nothing on screen says which way it stands, so the
   * header has to say it to a screen reader.
   */
  describe('a day folded down to its header', () => {
    it('FE-ROADTRIP-SIDEBAR-042: the header is the control, and it folds by id rather than by number', () => {
      const onToggleDay = vi.fn()
      // Id and number deliberately apart. The card is titled by its number and folded by
      // its id, and on a trip whose days were not created in order those two differ —
      // mixing them up folds a card the reader did not click.
      wrap(<RoadtripSidebar routes={routes({ days: [day({ dayId: 42 })] })} onToggleDay={onToggleDay} />)

      const header = screen.getByRole('button', { name: /Day 1/ })
      expect(header).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(header)
      expect(onToggleDay).toHaveBeenCalledWith(42)
    })

    it('FE-ROADTRIP-SIDEBAR-043: folded, the stops are gone and the header is what is left', () => {
      // Folded by id, again with a card whose id is not its number: a set read as numbers
      // would fold the card titled "Day 42" here, or nothing at all.
      wrap(<RoadtripSidebar
        routes={routes({ days: [day({ dayId: 42 }), day({ dayId: 2, dayNumber: 2 })], totalStops: 4 })}
        onToggleDay={vi.fn()}
        collapsedDayIds={new Set([42])}
      />)

      const folded = screen.getByRole('button', { name: /Day 1/ })
      expect(folded).toHaveAttribute('aria-expanded', 'false')
      // The card keeps its head: a day put away is still one the reader scrolls past, and
      // its own figures are how it is found again.
      expect(within(folded).getByText('2 stops')).toBeInTheDocument()
      expect(screen.getAllByText('Hamburg')[0]).not.toBeVisible()
      // One card at a time. Folding is per day, and the id is what decides which.
      expect(screen.getByRole('button', { name: /Day 2/ })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getAllByText('Berlin')[1]).toBeVisible()
    })

    it('FE-ROADTRIP-SIDEBAR-044: the header answers the keys that mean press, and no others', () => {
      const onToggleDay = vi.fn()
      wrap(<RoadtripSidebar routes={routes()} onToggleDay={onToggleDay} />)
      const header = screen.getByRole('button', { name: /Day 1/ })

      // A header wearing a button role gets none of a real button's keyboard behaviour, so
      // it answers both keys itself. Space has to be swallowed as well as answered, or the
      // rail scrolls a page down behind the day that was just put away. fireEvent reports
      // a cancelled event as false.
      fireEvent.keyDown(header, { key: 'Enter' })
      expect(fireEvent.keyDown(header, { key: ' ' })).toBe(false)
      expect(onToggleDay).toHaveBeenCalledTimes(2)

      fireEvent.keyDown(header, { key: 'ArrowDown' })
      expect(onToggleDay).toHaveBeenCalledTimes(2)
    })

    it('FE-ROADTRIP-SIDEBAR-045: a rail with nothing to fold offers no control at all', () => {
      wrap(<RoadtripSidebar routes={routes()} />)

      // A viewer gets a heading. A control that does nothing when pressed is worse than
      // one that is not there.
      expect(screen.queryByRole('button', { name: /Day 1/ })).toBeNull()
      expect(screen.getByRole('heading', { level: 3 })).toBeVisible()
      expect(screen.getByText('Hamburg')).toBeVisible()
    })
  })

  /**
   * How full one stop fills the tank.
   *
   * A property of the stop rather than of the traveller: the motorway rapid charger is
   * worth 80 % because the last fifth costs as long again, the one at the hotel is worth
   * all of it. The badge is the only way into that figure anywhere in TREK.
   */
  describe('the fill badge on a stop that puts fuel back', () => {
    const refuelling = (fillPercent?: number | null): RoadtripDay => day({
      stops: [
        stop({ assignmentId: 1, name: 'Hamburg' }),
        stop({ assignmentId: 2, name: 'Aral Autohof', stopType: 'fuel', fillPercent }),
      ],
    })

    it('FE-ROADTRIP-SIDEBAR-046: the badge is the way into a figure that is not there yet', () => {
      const onSelectStop = vi.fn()
      const onSetStopFill = vi.fn()
      wrap(<RoadtripSidebar
        routes={routes({ days: [refuelling()] })}
        onSelectStop={onSelectStop}
        onSetStopFill={onSetStopFill}
      />)

      // The plus stands in the slot the number will occupy: a badge that hid itself until
      // a figure existed could never be used to make one.
      fireEvent.click(screen.getByRole('button', { name: '+' }))
      expect(screen.getByRole('dialog', { name: 'Fills to' })).toBeInTheDocument()
      // The whole row is a button too. A click that reached it would select the stop and
      // move the map out from under the panel that just opened.
      expect(onSelectStop).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: '80' }))
      expect(onSetStopFill).toHaveBeenCalledWith(20, 80)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('FE-ROADTRIP-SIDEBAR-047: the badge opens from the keyboard and swallows the key', () => {
      wrap(<RoadtripSidebar routes={routes({ days: [refuelling()] })} onSetStopFill={vi.fn()} />)
      const badge = screen.getByRole('button', { name: '+' })

      // The same span-with-a-role bargain as the header, one row further in: unanswered,
      // the only way to the figure is a mouse.
      fireEvent.keyDown(badge, { key: 'ArrowDown' })
      expect(screen.queryByRole('dialog')).toBeNull()

      expect(fireEvent.keyDown(badge, { key: 'Enter' })).toBe(false)
      expect(screen.getByRole('dialog', { name: 'Fills to' })).toBeInTheDocument()
    })

    it('FE-ROADTRIP-SIDEBAR-048: only a stop that fills up carries the badge, and its own figure reads as one', () => {
      wrap(<RoadtripSidebar routes={routes({ days: [refuelling(100)] })} onSetStopFill={vi.fn()} />)

      // An explicit 100 is a decision, not an absent figure: on a trip whose default is 80
      // it says this one goes right up, and folding it into the invitation would leave the
      // traveller reading 80 on a stop that fills to 100.
      expect(screen.getAllByRole('button', { name: '100 %' })).toHaveLength(1)
      // Hamburg has none at all. A place the trip is for fills no tank, so a fill figure
      // there is a control for a decision nobody makes.
      expect(screen.queryByText('+')).toBeNull()
    })
  })
})

describe('RoadtripModeSwitch', () => {
  it('FE-ROADTRIP-MODESWITCH-001: offers both readings and marks the active one', () => {
    wrap(<RoadtripModeSwitch active onChange={vi.fn()} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('FE-ROADTRIP-MODESWITCH-002: switching back to the day plan reports false', () => {
    const onChange = vi.fn()
    wrap(<RoadtripModeSwitch active onChange={onChange} />)

    fireEvent.click(screen.getAllByRole('tab')[0])
    expect(onChange).toHaveBeenCalledWith(false)
  })
})

describe('RoadtripSidebar with a ride (#2428)', () => {
  const terminal = (role: 'departure' | 'arrival') =>
    stop({
      assignmentId: role === 'departure' ? -3000000140 : -3000000141,
      name: role === 'departure' ? 'Hamburg Airport' : 'Munich Airport',
      placeId: -70,
      lat: role === 'departure' ? 53.63 : 48.35,
      lng: role === 'departure' ? 9.99 : 11.78,
      time: role === 'departure' ? '12:20' : '14:30',
      dwellMinutes: role === 'departure' ? 60 : 0,
      legMode: role === 'departure' ? 'flight' : null,
      incomingLegMode: role === 'arrival' ? 'flight' : null,
      carrier: {
        reservationId: 70,
        type: 'flight',
        role,
        title: 'LH 2020',
        code: role === 'departure' ? 'HAM' : 'MUC',
        at: role === 'departure' ? '13:20' : '14:30',
      },
    })
  const flightDay = () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Hamburg' }),
      terminal('departure'),
      terminal('arrival'),
      stop({ assignmentId: 2, name: 'Munich' }),
    ]
    return day({
      stops,
      legs: [leg(), leg({ mode: 'flight', distance: 0, duration: 4200, distanceText: '', durationText: '1 h 10 min' }), leg()],
      schedule: {
        entries: [
          { arrival: '09:00', departure: '09:00', anchored: true, dayOffset: 0 },
          { arrival: '12:20', departure: '13:20', anchored: true, dayOffset: 0 },
          { arrival: '14:30', departure: '14:30', anchored: true, dayOffset: 0 },
          { arrival: '15:30', departure: '15:30', anchored: false, dayOffset: 0 },
        ],
        warnings: [],
      },
    })
  }

  it('FE-ROADTRIP-SIDEBAR-049: a same-day ride is one block: the booking and its minutes, both codes with their timetable, the places and the check-in, and no number', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay()], totalStops: 2 })} />)
    expect(screen.getByText('LH 2020')).toBeInTheDocument()
    expect(screen.getByText('1 h 10 min')).toBeInTheDocument()
    expect(screen.queryByText('LH 2020 · 1 h 10 min')).toBeNull()
    // Each code, each timetable clock and each place once.
    expect(screen.getAllByText('HAM')).toHaveLength(1)
    expect(screen.getAllByText('MUC')).toHaveLength(1)
    expect(screen.getAllByText('13:20')).toHaveLength(1)
    expect(screen.getAllByText('14:30')).toHaveLength(1)
    expect(screen.getByText('Hamburg Airport')).toBeInTheDocument()
    expect(screen.getByText('Munich Airport')).toBeInTheDocument()
    // What the clocks are is said to a screen reader, not printed a second time.
    expect(screen.getByText('Departure 13:20')).toHaveClass('sr-only')
    expect(screen.getByText('Arrival 14:30')).toHaveClass('sr-only')
    // The check-in, labelled, where an unlabelled 12:20 used to stand in the arrival column.
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('12:20')).toBeInTheDocument()
    // Hamburg is 1 and Munich is 2: the terminals between them take no number, and
    // the day header counts two stops.
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-050: the ride block opens the booking; the road out of the arrival offers no other ways', () => {
    const onOpenBooking = vi.fn()
    const onAskAlternatives = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay()], totalStops: 2 })} onOpenBooking={onOpenBooking} onAskAlternatives={onAskAlternatives} />)
    // One control for the whole ride, not one per terminal and one for the band.
    expect(screen.getAllByRole('button', { name: /Open booking$/ })).toHaveLength(1)
    fireEvent.click(screen.getByText('Hamburg Airport'))
    fireEvent.click(screen.getByText('LH 2020'))
    expect(onOpenBooking).toHaveBeenCalledTimes(2)
    expect(onOpenBooking).toHaveBeenCalledWith(70)
    // One shuffle: the road into the departure terminal. Not the ride, not the road out
    // of the arrival, whose via would be filed at the terminal's index.
    expect(screen.getAllByLabelText('Other ways')).toHaveLength(1)
  })

  it('FE-ROADTRIP-SIDEBAR-059: asking names the drive as a leg of its card, not as a bare position', () => {
    // A tagged drive rather than an index, so the road arriving at the head of a card can
    // be asked about as what it is instead of under an index no stop has.
    const onAskAlternatives = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay()], totalStops: 2 })} onOpenBooking={vi.fn()} onAskAlternatives={onAskAlternatives} />)

    fireEvent.click(screen.getByLabelText('Other ways'))

    expect(onAskAlternatives).toHaveBeenCalledWith(1, { kind: 'leg', index: 0 })
  })

  it('FE-ROADTRIP-SIDEBAR-051: a ride landing tomorrow leaves its departure as a row of its own, with the road into it', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), terminal('departure')]
    const overnight = day({
      stops,
      legs: [leg()],
      schedule: {
        entries: [
          { arrival: '18:00', departure: '18:00', anchored: true, dayOffset: 0 },
          { arrival: '21:00', departure: '22:00', anchored: true, dayOffset: 0 },
        ],
        warnings: [],
      },
    })
    wrap(<RoadtripSidebar routes={routes({ days: [overnight], totalStops: 1 })} onOpenBooking={vi.fn()} onAskAlternatives={vi.fn()} />)
    // The block's pieces on one row: the code and the place, the timetable's clock on the
    // right, and the check-in under them.
    const row = screen.getByText('Hamburg Airport').closest('button')!
    expect(within(row).getByText('HAM')).toBeInTheDocument()
    expect(within(row).getByText('13:20')).toBeInTheDocument()
    expect(within(row).getByText('Check-in')).toBeInTheDocument()
    expect(within(row).getByText('12:20')).toBeInTheDocument()
    // The chain's arrival there is the check-in, not a second clock in the column.
    expect(screen.queryByText('21:00')).toBeNull()
    expect(screen.queryByText('LH 2020')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Open booking$/ })).toHaveLength(1)
    expect(screen.getAllByLabelText('Other ways')).toHaveLength(1)
  })

  /** The card a ride lands on, joined to the card before it by the ride itself. */
  const landingDay = (arrivingLeg: RouteSegment) => {
    const arrival = terminal('arrival')
    return day({
      dayId: 2,
      dayNumber: 2,
      stops: [{ ...arrival, time: '07:00', carrier: { ...arrival.carrier!, at: '07:00' } }, stop({ assignmentId: 2, name: 'Munich' })],
      legs: [leg()],
      arrivingLeg,
      schedule: {
        entries: [
          { arrival: '07:00', departure: '07:00', anchored: true, dayOffset: 0 },
          { arrival: '08:00', departure: '08:00', anchored: false, dayOffset: 0 },
        ],
        warnings: [],
      },
    })
  }

  it('FE-ROADTRIP-SIDEBAR-054: the join into the day a ride lands on is the ride, not a car driving no distance', () => {
    const flown = leg({ mode: 'flight', distance: 0, duration: 9 * 3600, distanceText: '', durationText: '9 h' })
    wrap(<RoadtripSidebar routes={routes({ days: [landingDay(flown)], totalStops: 1 })} />)
    // The booking and its minutes, the minutes standing apart so a long title cannot cut them off.
    const band = screen.getByText('LH 2020').parentElement!
    expect(within(band).getByText('9 h')).toHaveClass('shrink-0')
    expect(screen.queryByText(/0 m in 9 h/)).not.toBeInTheDocument()
    // Under the booking's own icon, not the car the road out of the airport wears.
    expect(band.querySelector('svg.lucide-plane')).toBeInTheDocument()
    expect(band.querySelector('svg.lucide-car-front')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-055: a ride without a timetable still names the booking rather than passing for a hop', () => {
    const untimed = leg({ mode: 'flight', distance: 0, duration: 0, distanceText: '', durationText: '' })
    wrap(<RoadtripSidebar routes={routes({ days: [landingDay(untimed)], totalStops: 1 })} />)
    expect(screen.getByText('LH 2020')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-056: the tank starts afresh after a flight, and the road out of the arrival can be the one it runs out on', () => {
    const { container } = wrap(
      <RoadtripSidebar routes={routes({ days: [{ ...flightDay(), dryPoints: [dry({ legIndex: 2 })] }], totalStops: 2 })} refuel={search()} />,
    )
    // Hamburg, the ride block, Munich: the band hangs under the block, where the road
    // out of the arrival leaves, and nowhere else.
    const rows = container.querySelectorAll('li')
    expect(rows).toHaveLength(3)
    expect(screen.getAllByText('Tank runs out here')).toHaveLength(1)
    expect(within(rows[1] as HTMLElement).getByText('Tank runs out here')).toBeInTheDocument()
  })
})

describe('RoadtripSidebar with a hire car and the day\'s bookings (#2428)', () => {
  const desk = (role: 'pickup' | 'return') =>
    stop({
      assignmentId: role === 'pickup' ? -3000000180 : -3000000181,
      name: role === 'pickup' ? 'Sixt Hauptbahnhof' : 'Sixt Airport',
      placeId: -90,
      time: role === 'pickup' ? '09:00' : '11:30',
      dwellMinutes: 0,
      carrier: { reservationId: 90, type: 'car', role, title: 'Sixt Hamburg', code: role === 'return' ? 'HAM' : null, at: role === 'pickup' ? '09:00' : '11:30' },
    })
  const booking = (over: Partial<Reservation>): Reservation =>
    ({ id: 1, trip_id: 1, title: 'Booking', type: 'restaurant', status: 'confirmed', day_id: 1, ...over }) as Reservation

  const rentalDay = () => {
    const stops = [desk('pickup'), stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Lübeck' }), desk('return')]
    return day({
      stops,
      legs: [leg(), leg(), leg()],
      schedule: {
        entries: [
          { arrival: '09:00', departure: '09:00', anchored: true, dayOffset: 0 },
          { arrival: '09:20', departure: '09:50', anchored: false, dayOffset: 0 },
          { arrival: '10:50', departure: '11:20', anchored: false, dayOffset: 0 },
          { arrival: '11:30', departure: '11:30', anchored: true, dayOffset: 0 },
        ],
        warnings: [],
      },
    })
  }

  it('FE-ROADTRIP-SIDEBAR-052: the desks are rows on the road with the booking\'s clock, unnumbered, and the road between them is offered other ways only where it leaves a stored stop', () => {
    const onOpenBooking = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [rentalDay()], totalStops: 2 })} onOpenBooking={onOpenBooking} onAskAlternatives={vi.fn()} />)
    // Each desk says which one it is, having no other end beside it, and its clock once.
    const pickup = screen.getByText('Sixt Hauptbahnhof').closest('button')!
    expect(within(pickup).getByText('Pickup')).toBeInTheDocument()
    expect(within(pickup).getAllByText('09:00')).toHaveLength(1)
    expect(within(pickup).getByText('Pick-up 09:00')).toHaveClass('sr-only')
    const drop = screen.getByText('Sixt Airport').closest('button')!
    expect(within(drop).getByText('Return')).toBeInTheDocument()
    expect(within(drop).getAllByText('11:30')).toHaveLength(1)
    expect(within(drop).getByText('HAM')).toBeInTheDocument()
    // A desk has no check-in.
    expect(screen.queryByText('Check-in')).toBeNull()
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Sixt Airport'))
    expect(onOpenBooking).toHaveBeenCalledWith(90)
    // Hamburg to Lübeck and Lübeck to the desk leave stored stops; the road out of the
    // pick-up desk does not.
    expect(screen.getAllByLabelText('Other ways')).toHaveLength(2)
  })

  it('FE-ROADTRIP-SIDEBAR-057: a tank that empties on the road out of the pick-up desk is offered a fill-up under the desk', () => {
    const { container } = wrap(
      <RoadtripSidebar routes={routes({ days: [{ ...rentalDay(), dryPoints: [dry({ legIndex: 0 })] }], totalStops: 2 })} refuel={search()} />,
    )
    const rows = container.querySelectorAll('li')
    expect(screen.getAllByText('Tank runs out here')).toHaveLength(1)
    expect(within(rows[0] as HTMLElement).getByText('Tank runs out here')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-053: a table pinned to a stop, or booked at its place on its day, hangs under the stop as a chip that opens it; one for no stop is listed under the day', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Lübeck' })]
    const reservations = [
      booking({ id: 11, title: 'Tisch Bullerei', reservation_time: '2026-10-05T19:30', assignment_id: 1 }),
      booking({ id: 12, title: 'Café Niederegger', type: 'restaurant', reservation_time: '2026-10-05T11:30', place_id: 20 }),
      booking({ id: 13, title: 'Elbphilharmonie', type: 'event', reservation_time: '2026-10-05T20:00', place_id: 999 }),
      booking({ id: 14, title: 'Tomorrow', type: 'event', day_id: 2, place_id: 10 }),
      booking({ id: 15, title: 'Hotel Hafen', type: 'hotel', place_id: 10 }),
    ]
    const onOpenBooking = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })], totalStops: 2 })} reservations={reservations} onOpenBooking={onOpenBooking} canEditBookings />)
    expect(screen.getByText('Tisch Bullerei')).toBeInTheDocument()
    expect(screen.getByText('19:30')).toBeInTheDocument()
    expect(screen.getByText('Café Niederegger')).toBeInTheDocument()
    expect(screen.getByText('Also booked this day')).toBeInTheDocument()
    expect(screen.getByText('Elbphilharmonie')).toBeInTheDocument()
    // Another day's booking is not this day's, and the night is the stay, not a chip.
    expect(screen.queryByText('Tomorrow')).not.toBeInTheDocument()
    expect(screen.queryByText('Hotel Hafen')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Tisch Bullerei'))
    expect(onOpenBooking).toHaveBeenCalledWith(11)
    // The chips are the stop's, not stops: the count stays at two.
    expect(screen.getByText('2 stops')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-058: for a reader who may not edit bookings, a table is a plain chip while a taxi still opens its detail view', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Lübeck' })]
    const reservations = [
      booking({ id: 11, title: 'Tisch Bullerei', reservation_time: '2026-10-05T19:30', assignment_id: 1 }),
      booking({ id: 12, title: 'Taxi zum Hafen', type: 'taxi', reservation_time: '2026-10-05T18:30', assignment_id: 1 }),
    ]
    const onOpenBooking = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })], totalStops: 2 })} reservations={reservations} onOpenBooking={onOpenBooking} />)
    // The table is there to read, not a button that does nothing; the taxi is a button.
    expect(screen.getByText('Tisch Bullerei').closest('button')).toBeNull()
    expect(screen.getByText('Taxi zum Hafen').closest('button')).not.toBeNull()
    fireEvent.click(screen.getByText('Tisch Bullerei'))
    expect(onOpenBooking).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Taxi zum Hafen'))
    expect(onOpenBooking).toHaveBeenCalledWith(12)
  })
})

describe('RoadtripSidebar with the drive in from the day before (#2461)', () => {
  /** Where day 1 ended, three stops in, and a card joined to it by the road from there. */
  const yesterday = stop({ assignmentId: 9, name: 'Lüneburg', ownerDayId: 1, ownerIndex: 2 })
  const joined = (over: Partial<RoadtripDay> = {}) => day({
    dayId: 2,
    dayNumber: 2,
    arrivingLeg: leg({ distance: 120000, duration: 5400, distanceText: '120 km', durationText: '1 h 30 min' }),
    arrivingFrom: yesterday,
    arrivingLine: [[53.2, 10.4], [52.5, 13.4]],
    ...over,
  })
  const pressed = () => screen.getAllByLabelText('Other ways').map(icon => icon.closest('button')?.getAttribute('aria-pressed'))

  it('FE-ROADTRIP-SIDEBAR-060: the drive in offers other ways as the drive it is, and shows pressed while they are open', () => {
    // #2461: the band above the first stop was the one drive on the rail without the
    // control, so the road between two days could not be changed at all.
    const onAskAlternatives = vi.fn()
    const first = wrap(<RoadtripSidebar routes={routes({ days: [joined()] })} onAskAlternatives={onAskAlternatives} />)

    // The drive in, then the card's own leg.
    expect(pressed()).toEqual(['false', 'false'])
    fireEvent.click(screen.getAllByLabelText('Other ways')[0])
    expect(onAskAlternatives).toHaveBeenCalledWith(2, { kind: 'arriving' })
    first.unmount()

    const open = wrap(
      <RoadtripSidebar routes={routes({ days: [joined()] })} onAskAlternatives={vi.fn()} openAlternatives={{ dayId: 2, drive: { kind: 'arriving' } }} />,
    )
    expect(pressed()).toEqual(['true', 'false'])
    open.unmount()

    // The card's first leg is another drive, even at the index the drive in would borrow.
    wrap(<RoadtripSidebar routes={routes({ days: [joined()] })} onAskAlternatives={vi.fn()} openAlternatives={{ dayId: 2, drive: { kind: 'leg', index: 0 } }} />)
    expect(pressed()).toEqual(['false', 'true'])
  })

  it('FE-ROADTRIP-SIDEBAR-061: no control for a reader, for a drive from a terminal, or for one the rail has no line for', () => {
    const reader = wrap(<RoadtripSidebar routes={routes({ days: [joined()] })} />)
    expect(screen.queryAllByLabelText('Other ways')).toHaveLength(0)
    // The band is still drawn, only not as a control.
    expect(screen.getByText('120 km in 1 h 30 min')).toBeInTheDocument()
    reader.unmount()

    const landed = stop({
      assignmentId: -3000000141,
      name: 'Munich Airport',
      carrier: { reservationId: 70, type: 'flight', role: 'arrival', title: 'LH 2020', code: 'MUC', at: '14:30' },
    })
    const fromTerminal = wrap(<RoadtripSidebar routes={routes({ days: [joined({ arrivingFrom: landed })] })} onAskAlternatives={vi.fn()} />)
    expect(screen.getAllByLabelText('Other ways')).toHaveLength(1)
    fromTerminal.unmount()

    wrap(<RoadtripSidebar routes={routes({ days: [joined({ arrivingLine: undefined })] })} onAskAlternatives={vi.fn()} />)
    expect(screen.getAllByLabelText('Other ways')).toHaveLength(1)
  })

  describe('a ride on no day (#2461)', () => {
    const terminals = [
      { role: 'from', sequence: 0, name: 'IJmuiden', code: null, lat: 52.4581, lng: 4.5879, timezone: null, local_date: null, local_time: null },
      { role: 'to', sequence: 1, name: 'Port of Tyne', code: null, lat: 54.9925, lng: -1.4522, timezone: null, local_date: null, local_time: null },
    ]
    const ferry = (over: Partial<Reservation>): Reservation =>
      ({ id: 70, trip_id: 1, type: 'ferry', title: 'IJmuiden to Newcastle', status: 'confirmed', day_id: null, endpoints: terminals, ...over }) as unknown as Reservation

    it('FE-ROADTRIP-SIDEBAR-062: is named under the totals with its booking a click away; one on a day or without terminals is not', () => {
      const onOpenBooking = vi.fn()
      const reservations = [
        ferry({}),
        // On a day it is on the drive already; without terminals nothing says where it runs.
        ferry({ id: 71, title: 'Dated ferry', day_id: 1 }),
        ferry({ id: 72, title: 'Unlocated ferry', endpoints: [] } as Partial<Reservation>),
        ferry({ id: 73, title: 'Table', type: 'restaurant' }),
      ]
      wrap(<RoadtripSidebar routes={routes()} reservations={reservations} onOpenBooking={onOpenBooking} />)

      const notice = screen.getByRole('status')
      expect(within(notice).getByText('IJmuiden to Newcastle is on none of this trip’s days, so the drive does not use it.')).toBeInTheDocument()
      expect(within(notice).getAllByRole('listitem')).toHaveLength(1)
      fireEvent.click(within(notice).getByRole('button', { name: 'Open booking' }))
      expect(onOpenBooking).toHaveBeenCalledWith(70)
    })

    it('FE-ROADTRIP-SIDEBAR-063: says so without a button where bookings cannot be opened, and says nothing when every ride has a day', () => {
      const reader = wrap(<RoadtripSidebar routes={routes()} reservations={[ferry({})]} />)
      expect(screen.getByText('IJmuiden to Newcastle is on none of this trip’s days, so the drive does not use it.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Open booking' })).toBeNull()
      reader.unmount()

      wrap(<RoadtripSidebar routes={routes()} reservations={[ferry({ day_id: 1 })]} onOpenBooking={vi.fn()} />)
      expect(screen.queryByRole('status')).toBeNull()
    })
  })
})

describe('RoadtripSidebar with a booked night at the edge of the day', () => {
  const bookend = (phase: 'morning' | 'evening', over: Partial<NonNullable<RoadtripStop['bookend']>> = {}, at: Partial<RoadtripStop> = {}) =>
    stop({
      assignmentId: phase === 'morning' ? -6_000_000_002 : -6_000_000_003,
      name: 'Hotel Alpenblick',
      placeId: 900,
      lat: 47.2,
      lng: 11.4,
      stopType: 'hotel',
      dwellMinutes: 0,
      bookend: { phase, accommodationId: 5, reservationId: 41, checkingOut: false, checkingIn: false, checkOut: null, ...over },
      ...at,
    })
  /** Out of the hotel on its check-out morning, two places, and into the night's hotel. */
  const loop = (over: Partial<RoadtripDay> = {}) => {
    const stops = [
      bookend('morning', { checkingOut: true, checkOut: '10:00' }, { ownerIndex: 0 }),
      stop({ assignmentId: 1, name: 'Lookout', ownerIndex: 0 }),
      stop({ assignmentId: 2, name: 'Falls', ownerIndex: 1 }),
      bookend('evening', {}, { ownerIndex: 2 }),
    ]
    return day({
      stops,
      legs: [leg(), leg(), leg()],
      schedule: {
        entries: ['08:40', '09:40', '10:40', '11:40'].map(arrival => ({ arrival, departure: arrival, anchored: false, dayOffset: 0 })),
        warnings: [],
      },
      ...over,
    })
  }

  it('FE-ROADTRIP-SIDEBAR-064: names the hotel it sets out from and the one it ends at, and counts neither', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [loop()] })} />)
    // The hotel is the row's name; which edge of the stay it is, and the hour, sit in its badge.
    expect(screen.getAllByText('Hotel Alpenblick')).toHaveLength(2)
    expect(screen.getByText('Check-out').closest('button')).toHaveTextContent('10:00')
    expect(screen.getByText('Overnight')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).toBeNull()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
    // The places are one and two; the hotel wears no number.
    expect(screen.getByText('Lookout').closest('button')).toHaveTextContent('1')
    expect(screen.getByText('11:40')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-074: a check-out morning left after the room is handed back says so, one left in time does not', () => {
    const late = loop({
      schedule: {
        entries: ['12:27', '13:27', '14:27', '15:27'].map(arrival => ({ arrival, departure: arrival, anchored: false, dayOffset: 0 })),
        warnings: [],
      },
    })
    // The check-out badge itself turns, instead of a sentence added under the row.
    const { unmount } = wrap(<RoadtripSidebar routes={routes({ days: [late] })} />)
    expect(screen.getByText('Check-out').className).toContain('text-warning')
    unmount()

    wrap(<RoadtripSidebar routes={routes({ days: [loop()] })} />)
    expect(screen.getByText('Check-out').className).not.toContain('text-warning')
  })

  it('FE-ROADTRIP-SIDEBAR-065: the hotel rows are neither dragged nor dropped on, and carry no stay, kind or fill control', () => {
    const { container } = wrap(
      <RoadtripSidebar routes={routes({ days: [loop()] })} onReorderStop={vi.fn()} onEditStay={vi.fn()} onSetStopKind={vi.fn()} onSetStopFill={vi.fn()} />,
    )
    expect(container.querySelectorAll('li[draggable="true"]')).toHaveLength(2)
    const hotelRow = screen.getByText('Overnight').closest('li')!
    expect(hotelRow).not.toHaveAttribute('draggable')
    // The row is one button, with nothing inside it to press.
    expect(within(hotelRow).getAllByRole('button')).toHaveLength(1)
    expect(within(hotelRow).queryByText('Stay')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-066: offers other ways on the drive between the places only', () => {
    const onAskAlternatives = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [loop()] })} onAskAlternatives={onAskAlternatives} />)
    const offered = screen.getAllByLabelText('Other ways')
    expect(offered).toHaveLength(1)
    fireEvent.click(offered[0])
    expect(onAskAlternatives).toHaveBeenCalledWith(1, { kind: 'leg', index: 1 })
  })

  it('FE-ROADTRIP-SIDEBAR-067: opens the booking behind the night for an editor, the hotel for anybody else', () => {
    const onOpenBooking = vi.fn()
    const onSelectStop = vi.fn()
    const editor = wrap(<RoadtripSidebar routes={routes({ days: [loop()] })} onOpenBooking={onOpenBooking} onSelectStop={onSelectStop} canEditBookings />)
    fireEvent.click(screen.getByText('Overnight'))
    expect(onOpenBooking).toHaveBeenCalledWith(41)
    expect(onSelectStop).not.toHaveBeenCalled()
    editor.unmount()

    wrap(<RoadtripSidebar routes={routes({ days: [loop()] })} onOpenBooking={onOpenBooking} onSelectStop={onSelectStop} />)
    fireEvent.click(screen.getByText('Check-out'))
    // The place alone, without an assignment: the hotel is no stop of the day.
    expect(onSelectStop).toHaveBeenCalledWith(900)
    expect(onOpenBooking).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-SIDEBAR-068: a place is not moved past the hotel at either end of its day', () => {
    const onReorderStop = vi.fn()
    wrap(<RoadtripSidebar routes={routes({ days: [loop()] })} onReorderStop={onReorderStop} />)
    fireEvent.keyDown(screen.getByText('Lookout').closest('button')!, { key: 'ArrowUp', altKey: true })
    fireEvent.keyDown(screen.getByText('Falls').closest('button')!, { key: 'ArrowDown', altKey: true })
    expect(onReorderStop).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByText('Lookout').closest('button')!, { key: 'ArrowDown', altKey: true })
    expect(onReorderStop).toHaveBeenCalledWith(1, 1, 1)
  })

  it('FE-ROADTRIP-SIDEBAR-069: the morning marker at the hotel is drawn as the hotel row, not as a line of its own', () => {
    const resume = stop({
      assignmentId: -2_000_000_003,
      name: 'Continue journey',
      lat: 47.2,
      lng: 11.4,
      automaticNight: { phase: 'start', fromDayNumber: 1 },
    })
    const stops = [resume, bookend('morning', {}, { ownerIndex: 0 }), stop({ assignmentId: 1, name: 'Lookout', ownerIndex: 0 })]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg({ distance: 0 }), leg()] })] })} />)
    expect(screen.getByText('Day start')).toBeInTheDocument()
    expect(screen.queryByText('Continue journey')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-070: a drive to the hotel over the limit is flagged on the hotel row', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [loop({ driveWarnings: [{ index: 3, code: 'leg', overMinutes: 30 }] })] })} />)
    const hotelRow = screen.getByText('Overnight').closest('li')!
    expect(within(hotelRow).getByText('+30 min')).toBeInTheDocument()
  })

  /** Whether a row's disc has the rail running into it from above. */
  const lineAbove = (text: string): boolean => {
    const rail = screen.getByText(text).closest('button')!.firstElementChild!
    return rail.firstElementChild!.className.includes('w-[1.5px]')
  }

  it('FE-ROADTRIP-SIDEBAR-071: the hotel row the morning marker went into starts the rail, with no line running in from nowhere', () => {
    const resume = stop({
      assignmentId: -2_000_000_003,
      name: 'Continue journey',
      lat: 47.2,
      lng: 11.4,
      automaticNight: { phase: 'start', fromDayNumber: 1 },
    })
    const stops = [resume, bookend('morning', { checkingOut: true }, { ownerIndex: 0 }), stop({ assignmentId: 1, name: 'Lookout', ownerIndex: 0 })]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg({ distance: 0 }), leg()] })] })} />)
    expect(lineAbove('Check-out')).toBe(false)
    // Below it the rail runs on as always.
    expect(lineAbove('Lookout')).toBe(true)
  })

  /** A transfer day: out of one stay and into the next, with nothing stored in between. */
  const transfer = () => day({
    dayId: 2,
    dayNumber: 2,
    stops: [
      bookend('morning', { checkingOut: true }, { ownerIndex: 0 }),
      bookend('evening', { accommodationId: 6, checkingIn: true }, { ownerIndex: 0, name: 'Wallinga', lat: 48, lng: 12 }),
    ],
    legs: [leg()],
  })

  it('FE-ROADTRIP-SIDEBAR-072: a day that only drives from one stay to the next says its drive and no count of stops', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [transfer()] })} />)
    expect(screen.getByText('Check-in').closest('button')).toHaveTextContent('Wallinga')
    const header = screen.getByText('Day 2').closest('header')!
    expect(within(header).getByText(/100 km/)).toBeInTheDocument()
    expect(within(header).queryByText(/stops?$/)).toBeNull()
    expect(screen.queryByText('0 stops')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-073: a stop dragged onto such a day lands as its first stop, dropped on either hotel', () => {
    const onMoveStopToDay = vi.fn()
    const { container } = wrap(
      <RoadtripSidebar routes={routes({ days: [day(), transfer()] })} onReorderStop={vi.fn()} onMoveStopToDay={onMoveStopToDay} />,
    )
    const hotelRow = screen.getByText('Wallinga').closest('li')!
    const rows = container.querySelectorAll('li[draggable="true"]')
    fireEvent.dragStart(rows[1], { dataTransfer: { effectAllowed: '', setData: vi.fn() } })
    fireEvent.dragOver(hotelRow)
    expect(hotelRow.className).toContain('ring-accent')
    fireEvent.drop(hotelRow)

    // From day 1, its second stop (assignment 2), onto day 2 as its first.
    expect(onMoveStopToDay).toHaveBeenCalledWith(1, 2, 2, 0)
  })

  it('FE-ROADTRIP-SIDEBAR-081: the hotel at the edge of the day wears the hotel stop\'s own disc, not a terminal\'s', () => {
    const stops = [
      bookend('morning', { checkingOut: true }, { ownerIndex: 0 }),
      stop({ assignmentId: 1, name: 'Lookout', ownerIndex: 0 }),
      stop({ assignmentId: 2, name: 'Gasthof Post', ownerIndex: 1, stopType: 'hotel', lat: 48, lng: 12 }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg(), leg()] })] })} />)
    const disc = (row: HTMLElement) => row.querySelector('svg.lucide-bed-double')!.parentElement as HTMLElement
    const hotelStop = disc(screen.getByText('Gasthof Post').closest('div.grid') as HTMLElement)
    const edge = disc(screen.getByText('Check-out').closest('button')!)
    expect(edge.style.background).not.toBe('')
    expect(edge.style.background).toBe(hotelStop.style.background)
    expect(edge.style.color).toBe(hotelStop.style.color)
    expect(edge.className).not.toContain('bg-surface-tertiary')
  })

  it('FE-ROADTRIP-SIDEBAR-082: the own stop of a stay on its check-in day carries the check-in hour as a badge', () => {
    const stops = [
      stop({ assignmentId: 1, name: 'Lookout', ownerIndex: 0 }),
      stop({ assignmentId: 2, name: 'Gasthof Post', ownerIndex: 1, stopType: 'hotel', night: true, checkInTime: '15:00' }),
    ]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, legs: [leg()] })] })} />)
    const hotel = screen.getByText('Gasthof Post').closest('li')!
    expect(within(hotel).getByText('Check-in').closest('.flex-wrap')).toHaveTextContent('15:00')
    expect(within(screen.getByText('Lookout').closest('li')!).queryByText('Check-in')).toBeNull()
  })
})

describe('RoadtripSidebar with a flight the drive gets to late (#2460)', () => {
  /** LH 2078 as the routing round seats it: pinned an hour ahead for the check-in, named the way every airport writer names an endpoint. */
  const end = (role: 'departure' | 'arrival', type = 'flight') =>
    stop({
      assignmentId: role === 'departure' ? -3000000780 : -3000000781,
      name: role === 'departure' ? 'Hamburg (HAM)' : 'Munich (MUC)',
      placeId: -78,
      lat: role === 'departure' ? 53.63 : 48.35,
      lng: role === 'departure' ? 9.99 : 11.78,
      time: role === 'departure' ? '14:15' : '17:20',
      dwellMinutes: role === 'departure' ? 60 : 0,
      carrier: {
        reservationId: 78,
        type,
        role,
        title: 'LH 2078 HAM-MUC (ohne Endpunkte)',
        code: role === 'departure' ? 'HAM' : 'MUC',
        at: role === 'departure' ? '15:15' : '17:20',
      },
    })
  /** Out of the Hamburg hotel, the flight, into the Munich one, with the drive to the airport `late` minutes past check-in. */
  const flightDay = (late: number | null, type = 'flight') => {
    const stops = [stop({ assignmentId: 1, name: 'Hotel Atlantic' }), end('departure', type), end('arrival', type), stop({ assignmentId: 2, name: 'Hotel Bayerischer Hof' })]
    return day({
      dayId: 3,
      dayNumber: 3,
      stops,
      legs: [leg(), leg({ mode: type, distance: 0, duration: 7500, distanceText: '', durationText: '2 h 5 min' }), leg()],
      schedule: {
        entries: [
          { arrival: '09:00', departure: '09:00', anchored: false, dayOffset: 0 },
          { arrival: '14:15', departure: '15:15', anchored: true, dayOffset: 0 },
          { arrival: '17:20', departure: '17:20', anchored: true, dayOffset: 0 },
          { arrival: '18:00', departure: '18:00', anchored: false, dayOffset: 0 },
        ],
        warnings: late === null ? [] : [{ index: 1, code: 'late' as const, minutes: late }],
      },
    })
  }
  const block = () => screen.getByText('LH 2078 HAM-MUC (ohne Endpunkte)').closest('button')!.children[1] as HTMLElement

  it('FE-ROADTRIP-SIDEBAR-075: a missed flight says so on its check-in and on the day, with no delta against a clock nobody sees', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay(579)], totalStops: 2 })} onOpenBooking={vi.fn()} />)
    // The title as typed, the duration beside the check-in, each code once and the places without it.
    const title = screen.getByText('LH 2078 HAM-MUC (ohne Endpunkte)')
    expect(title.className).not.toContain('uppercase')
    expect(within(block()).getByText('Missed').closest('.flex-wrap')).toHaveTextContent('2 h 5 min')
    expect(title.parentElement).not.toHaveTextContent('2 h 5 min')
    expect(screen.getAllByText('HAM')).toHaveLength(1)
    expect(screen.getByText('Hamburg')).toBeInTheDocument()
    expect(screen.getByText('Munich')).toBeInTheDocument()
    expect(screen.queryByText(/\(HAM\)/)).toBeNull()
    // The check-in carries the finding; the separate late pill is gone.
    expect(within(block()).getByText('Missed')).toBeInTheDocument()
    expect(within(block()).getByText('there at 23:54')).toBeInTheDocument()
    expect(screen.queryByText('+9 h 39 min')).toBeNull()
    expect(block().className).toContain('border-warning')
    const header = screen.getByText('Day 3').closest('header')!
    expect(within(header).getByText('Flight missed')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-076: a folded day still says its flight is missed', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay(579)], totalStops: 2 })} collapsedDayIds={new Set([3])} onToggleDay={vi.fn()} />)
    const header = screen.getByText('Day 3').closest('header')!
    expect(within(header).getByText('Flight missed')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-077: late for the check-in but in time for the flight says by how much, and leaves the day alone', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay(25)], totalStops: 2 })} />)
    expect(within(block()).getByText('Check-in')).toBeInTheDocument()
    expect(within(block()).getByText('25 min late')).toBeInTheDocument()
    expect(block().className).not.toContain('border-warning')
    expect(screen.queryByText('Flight missed')).toBeNull()
  })

  it('FE-ROADTRIP-SIDEBAR-078: a train is boarded, and a missed one is named as a train', () => {
    const onTime = wrap(<RoadtripSidebar routes={routes({ days: [flightDay(null, 'train')], totalStops: 2 })} />)
    expect(screen.getByText('Boarding')).toBeInTheDocument()
    expect(screen.getByText('14:15')).toBeInTheDocument()
    onTime.unmount()

    wrap(<RoadtripSidebar routes={routes({ days: [flightDay(579, 'train')], totalStops: 2 })} />)
    expect(within(screen.getByText('Day 3').closest('header')!).getByText('Train missed')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-079: the badge explains itself in a sentence, and a booking clock names what it is, not a time you set', () => {
    vi.useFakeTimers()
    try {
      wrap(<RoadtripSidebar routes={routes({ days: [flightDay(579)], totalStops: 2 })} />)
      const hover = (el: HTMLElement) => {
        fireEvent.mouseEnter(el)
        act(() => { vi.advanceTimersByTime(300) })
      }
      hover(screen.getByText('there at 23:54').parentElement!)
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'The drive reaches Hamburg at 23:54. LH 2078 HAM-MUC (ohne Endpunkte) departs at 15:15, check-in closes at 14:15.',
      )
      fireEvent.mouseLeave(screen.getByText('there at 23:54').parentElement!)

      hover(screen.getByText('15:15').parentElement!)
      expect(screen.getByRole('tooltip')).toHaveTextContent('Departure 15:15')
      expect(screen.queryByText('Time you set')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-ROADTRIP-SIDEBAR-080: a screen reader hears the ride, its clocks and that it is missed, then what pressing it does', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [flightDay(579)], totalStops: 2 })} onOpenBooking={vi.fn()} />)
    const button = screen.getByText('LH 2078 HAM-MUC (ohne Endpunkte)').closest('button')!
    expect(button).not.toHaveAttribute('aria-label')
    expect(button).toHaveAccessibleName(expect.stringMatching(/Departure 15:15\s*Arrival 17:20.*Missed\s*there at 23:54\s*2 h 5 min\s*Open booking$/))
  })
})
