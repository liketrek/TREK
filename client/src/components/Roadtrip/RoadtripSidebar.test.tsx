import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import RoadtripSidebar from './RoadtripSidebar'
import RoadtripModeSwitch from './RoadtripModeSwitch'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

function stop(over: Partial<RoadtripStop> & { assignmentId: number; name: string }): RoadtripStop {
  return {
    placeId: over.assignmentId * 10,
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
  return {
    dayId: 1,
    dayNumber: 1,
    date: null,
    title: null,
    stops,
    legs: [leg()],
    legVias: [], driveWarnings: [], dayWarning: null,
    schedule: { entries: stops.map(() => ({ arrival: null, departure: null, anchored: false, dayOffset: 0 })), warnings: [] },
    geometry: [],
    distance: 100000,
    duration: 3600,
    ...over,
  }
}

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [day()],
    lines: [],
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
    // somebody chose from the one the drive worked out is weight and ink, and the reason
    // is named for a screen reader either way.
    const pinned = screen.getByText('09:00')
    const computed = screen.getByText('10:30')
    expect(pinned.className).toContain('font-semibold')
    expect(pinned).toHaveAttribute('title', 'Time you set')
    expect(computed.className).not.toContain('font-semibold')
    expect(computed).toHaveAttribute('title', 'Calculated from the drive')
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

  it('FE-ROADTRIP-SIDEBAR-009: a trip with nothing to drive explains itself', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [], totalDistance: 0, totalDuration: 0, totalStops: 0 })} />)

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    expect(screen.queryByText('Hamburg')).not.toBeInTheDocument()
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

    // Said twice on purpose: once as the break in the chain, once on the arrival after
    // it, where "01:30" would otherwise read as tonight.
    expect(screen.getAllByText('Next day')).toHaveLength(2)
    expect(screen.getAllByTitle('Calculated from the drive')[1].textContent).toContain('+1')
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

    expect(screen.getAllByText('Next day')).toHaveLength(2)
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
