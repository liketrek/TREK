import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import RoadtripSidebar from './RoadtripSidebar'
import RoadtripModeSwitch from './RoadtripModeSwitch'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { DryPoint } from './roadtripModel'
import type { RefuelSearch } from './useRefuelSearch'
import type { RefuelCandidate, RefuelOutcome } from './refuelSuggestion'
import type { RouteSegment } from '../../types'

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
    expect(onEditStay).toHaveBeenCalledWith({ placeId: 20, name: 'Berlin', minutes: null, arrival: null })
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

  it('FE-ROADTRIP-SIDEBAR-018: a travel mode with no mark of its own falls back to the car', () => {
    const ferry = leg({ mode: 'ferry' })
    const { container } = wrap(<RoadtripSidebar routes={routes({ days: [day({ legs: [ferry] })] })} />)

    expect(container.querySelector('svg.lucide-car-front')).toBeInTheDocument()
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
