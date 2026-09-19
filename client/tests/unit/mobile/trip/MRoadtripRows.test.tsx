import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../helpers/render'
import {
  RtAutoRow, RtDryRow, RtLegRow, RtSpillRow, RtStopRow, type RowChrome,
} from '../../../../src/mobile/screens/trip/roadtrip/MRoadtripRows'
import type { StopRow } from '../../../../src/components/Roadtrip/roadtripRowModel'
import type { RouteSegment, ScheduleWarning } from '@trek/shared/roadtrip'
import type { TranslationFn } from '../../../../src/types'
import type { RefuelSearch } from '../../../../src/components/Roadtrip/useRefuelSearch'
import type { RefuelCandidate } from '../../../../src/components/Roadtrip/refuelSuggestion'

// FE-MOB-RTROW-001 to FE-MOB-RTROW-048

// Same echo strategy as tests/helpers/mobileTrip: assertions stay on keys, not copy.
const t: TranslationFn = (key, params) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

const chrome: RowChrome = { t, unit: 'metric', is12h: false }

function stopRow(over: Partial<StopRow> = {}): StopRow {
  return {
    kind: 'stop',
    stop: {
      assignmentId: 501, ownerDayId: 2, ownerIndex: 0, placeId: 101,
      name: 'Kyoto Station', lat: 34.98, lng: 135.75,
      time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    },
    number: 2,
    service: false,
    entry: undefined,
    time: '12:40',
    pinned: false,
    warning: null,
    dwellMinutes: null,
    offRoadMeters: null,
    ...over,
  } as StopRow
}

const SEG: RouteSegment = {
  mid: [35.4, 138.6], from: [35.7, 139.8], to: [34.98, 135.75],
  distance: 210_000, duration: 9_600,
  // The two differ on purpose: durationText is the routed time, drivingText the
  // fallback the older segments carry.
  walkingText: '42 h', drivingText: '2 h 55 min', distanceText: '210 km', durationText: '2 h 40 min',
}

describe('RtStopRow', () => {
  it('FE-MOB-RTROW-001: gives a destination its number and no kind icon', () => {
    const { container } = render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(container.querySelector('.lucide-fuel')).toBeNull()
  })

  it('FE-MOB-RTROW-002: gives a service stop its kind symbol in the kind colour instead of a number', () => {
    const { container } = render(
      <RtStopRow
        row={stopRow({
          number: null,
          service: true,
          stop: { ...stopRow().stop, name: 'Shell Ebina', stopType: 'fuel' },
        })}
        chrome={chrome}
        onOpen={vi.fn()}
      />,
    )

    const disc = container.querySelector('.lucide-fuel')?.parentElement as HTMLElement
    expect(disc).toBeTruthy()
    // #E8590C is SERVICE_COLORS.fuel, the colour the stop wears on the map too.
    expect(disc).toHaveStyle({ background: '#E8590C' })
    expect(screen.queryByText('2')).toBeNull()
  })

  it('FE-MOB-RTROW-003: keeps at most two marks, a dwell and a warning push the road distance out', () => {
    const { container } = render(
      <RtStopRow
        row={stopRow({
          dwellMinutes: 45,
          warning: { index: 1, code: 'late', minutes: 25 },
          offRoadMeters: 120,
        })}
        chrome={chrome}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('+25 min')).toBeInTheDocument()
    expect(screen.queryByText('120 m')).toBeNull()
    expect(container.querySelector('.lucide-footprints')).toBeNull()
  })

  it('FE-MOB-RTROW-004: shows the road distance only when the row has neither dwell nor warning', () => {
    render(<RtStopRow row={stopRow({ offRoadMeters: 120 })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('120 m')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-005: gives a pinned time the pin and the full colour', () => {
    render(<RtStopRow row={stopRow({ pinned: true })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByLabelText('roadtrip.stop.pinned')).toBeInTheDocument()
    expect(screen.getByText('12:40').className).toContain('text-m-ink')
  })

  it('FE-MOB-RTROW-006: leaves a computed time unpinned and muted', () => {
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.queryByLabelText('roadtrip.stop.pinned')).toBeNull()
    const time = screen.getByText('12:40')
    expect(time.className).toContain('text-m-faint')
    expect(time.className).not.toContain('text-m-ink')
  })

  it('FE-MOB-RTROW-007: prints no clock for a stop the schedule could not time', () => {
    render(<RtStopRow row={stopRow({ time: null })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.queryByText('12:40')).toBeNull()
    expect(screen.getByText('Kyoto Station')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-008: opens the stop on a tap and on the keyboard', () => {
    const onOpen = vi.fn()
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={onOpen} />)

    const row = screen.getByRole('button')
    fireEvent.click(row)
    expect(onOpen).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(row, { key: ' ' })
    expect(onOpen).toHaveBeenCalledTimes(3)
  })

  it('FE-MOB-RTROW-009: ignores a key press that came from something inside the row', () => {
    const onOpen = vi.fn()
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={onOpen} />)

    fireEvent.keyDown(screen.getByText('Kyoto Station'), { key: 'Enter' })

    expect(onOpen).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTROW-010: writes a late warning as the minutes it costs', () => {
    const warning: ScheduleWarning = { index: 1, code: 'late', minutes: 25 }
    const { container } = render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('+25 min')).toBeInTheDocument()
    expect(container.querySelector('.lucide-alert-triangle')).not.toBeNull()
  })

  it('FE-MOB-RTROW-011: writes a range warning as the distance driven since the last fill', () => {
    const warning: ScheduleWarning = { index: 1, code: 'range', sinceKm: 520 }
    const { container } = render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('520 km')).toBeInTheDocument()
    expect(container.querySelector('.lucide-fuel')).not.toBeNull()
  })

  it('FE-MOB-RTROW-012: writes a leg warning as the time it runs over', () => {
    const warning: ScheduleWarning = { index: 1, code: 'leg', overMinutes: 35 }
    render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('35 min')).toBeInTheDocument()
  })

  // The disc as the control that switches a stop between a destination and a pause, the
  // way the desktop rail's own disc does.
  it('FE-MOB-RTROW-041: the disc is a button that asks for the kind, and the tap stops there', () => {
    const onOpen = vi.fn()
    const onPickKind = vi.fn()
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={onOpen} onPickKind={onPickKind} />)

    const disc = screen.getByRole('button', { name: 'roadtrip.stop.makeService' })
    expect(disc).toHaveTextContent('2')

    fireEvent.click(disc)

    expect(onPickKind).toHaveBeenCalledTimes(1)
    // The row opens the stop; a tap meant for the disc must not do both.
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTROW-042: the disc of a service stop asks the same question, named for what it already is', () => {
    const onPickKind = vi.fn()
    render(
      <RtStopRow
        row={stopRow({ number: null, service: true, stop: { ...stopRow().stop, stopType: 'fuel' } })}
        chrome={chrome}
        onOpen={vi.fn()}
        onPickKind={onPickKind}
      />,
    )

    const disc = screen.getByRole('button', { name: 'roadtrip.stop.kind' })
    // Still the kind's own symbol: the control is its own preview of what it changes.
    expect(disc.querySelector('.lucide-fuel')).not.toBeNull()

    fireEvent.click(disc)
    expect(onPickKind).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-043: without the handler the disc is not a button at all', () => {
    // A traveller who may not edit places gets no handler, and a disabled-looking control
    // for something they cannot do is worse than no control.
    render(<RtStopRow row={stopRow()} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'roadtrip.stop.makeService' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'roadtrip.stop.kind' })).toBeNull()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-047: a clock follows the reader twelve hour setting', () => {
    // The model hands clocks over as HH:MM, which is the shape the schedule computes in.
    // Printing that straight to the screen ignored the setting the desktop rail, the day
    // timeline and this tab's own sheets all honour.
    render(<RtStopRow row={stopRow({ time: '14:05' })} chrome={{ ...chrome, is12h: true }} onOpen={vi.fn()} />)

    expect(screen.getByText('2:05 PM')).toBeInTheDocument()
    expect(screen.queryByText('14:05')).toBeNull()
  })

  it('FE-MOB-RTROW-048: on a twenty four hour clock it stays exactly as the model wrote it', () => {
    render(<RtStopRow row={stopRow({ time: '14:05' })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('14:05')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-013: writes an overnight warning as a word, since it has no figure', () => {
    const warning: ScheduleWarning = { index: 1, code: 'overnight' }
    const { container } = render(<RtStopRow row={stopRow({ warning })} chrome={chrome} onOpen={vi.fn()} />)

    expect(screen.getByText('roadtrip.warn.overnight')).toBeInTheDocument()
    expect(container.querySelector('.lucide-moon')).not.toBeNull()
  })
})

describe('RtLegRow', () => {
  it('FE-MOB-RTROW-014: without a way to ask for other roads the leg is not a control, no button, no role, nothing focusable', () => {
    const { container } = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[role]')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
  })

  it('FE-MOB-RTROW-015: prints the drive and the car icon for a routed leg, falling back to the driving text', () => {
    const bare = render(<RtLegRow seg={{ ...SEG, durationText: undefined }} mode="driving" chrome={chrome} />)
    expect(screen.getByText('roadtrip.leg.driveText:210 km,2 h 55 min')).toBeInTheDocument()
    bare.unmount()

    const { container } = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} />)

    expect(screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')).toBeInTheDocument()
    expect(container.querySelector('.lucide-car-front')).not.toBeNull()
  })

  it('FE-MOB-RTROW-016: says the leg is pending while no segment has come back', () => {
    render(<RtLegRow seg={undefined} mode="driving" chrome={chrome} />)

    expect(screen.getByText('roadtrip.leg.pending')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-044: a segment with no texts yet is read off its numbers, the way the desktop rail reads it', () => {
    // A segment can reach the chain before its routing round has landed: metres and
    // seconds are there, the pre-formatted texts are not.
    render(
      <RtLegRow
        seg={{ ...SEG, distanceText: '', durationText: undefined, drivingText: '' }}
        mode="driving"
        chrome={chrome}
      />,
    )

    expect(screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-045: a segment with neither texts nor numbers says pending, never a bare separator', () => {
    // This printed the template with both slots empty, so the pill read " in " and said
    // nothing at all. A leg that is not routed says so.
    render(
      <RtLegRow
        seg={{ ...SEG, distance: 0, duration: 0, distanceText: '', durationText: undefined, drivingText: '' }}
        mode="driving"
        chrome={chrome}
      />,
    )

    expect(screen.getByText('roadtrip.leg.pending')).toBeInTheDocument()
    expect(screen.queryByText(/driveText/)).toBeNull()
  })

  it('FE-MOB-RTROW-046: half a segment is pending too, rather than a figure with a hole beside it', () => {
    // A distance with no time would read "210 km in", which is worse than saying nothing:
    // it looks like a sentence that was cut off.
    render(
      <RtLegRow
        seg={{ ...SEG, duration: 0, durationText: undefined, drivingText: '' }}
        mode="driving"
        chrome={chrome}
      />,
    )

    expect(screen.getByText('roadtrip.leg.pending')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-017: swaps the icon for a walked leg and for a plugin mode', () => {
    const walk = render(<RtLegRow seg={SEG} mode="walking" chrome={chrome} />)
    expect(walk.container.querySelector('.lucide-footprints')).not.toBeNull()
    walk.unmount()

    const plugin = render(<RtLegRow seg={SEG} mode="plugin:rail" chrome={chrome} />)
    expect(plugin.container.querySelector('.lucide-zap')).not.toBeNull()
  })

  it('FE-MOB-RTROW-038: other ways are one round button beside the pill, and the pill stays text', () => {
    const onAlternatives = vi.fn()
    const { container } = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={onAlternatives} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    const ask = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(ask.querySelector('.lucide-shuffle')).not.toBeNull()
    // A separate 40px target: a tap that stops a scroll on the pill asks the router nothing.
    expect(ask.className).toContain('h-10')
    expect(ask.className).toContain('w-10')
    const drive = screen.getByText('roadtrip.leg.driveText:210 km,2 h 40 min')
    expect(ask.contains(drive)).toBe(false)
    expect(drive.closest('[role]')).toBeNull()
    fireEvent.click(drive)
    expect(onAlternatives).not.toHaveBeenCalled()

    fireEvent.click(ask)
    expect(onAlternatives).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0)
  })

  it('FE-MOB-RTROW-039: shows pressed while its leg is open, in full ink rather than a filled button', () => {
    const closed = render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={vi.fn()} />)
    const idle = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(idle).toHaveAttribute('aria-pressed', 'false')
    expect(idle.className).toContain('text-m-muted')
    closed.unmount()

    render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={vi.fn()} alternativesOpen />)
    const open = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(open).toHaveAttribute('aria-pressed', 'true')
    expect(open.className).toContain('text-m-ink')
    // A filled chip in a column of quiet rows reads as a button pressed and stuck.
    expect(open.className).not.toContain('bg-m-act')
  })

  it('FE-MOB-RTROW-040: offline the button keeps its place but does nothing', () => {
    const onAlternatives = vi.fn()
    render(<RtLegRow seg={SEG} mode="driving" chrome={chrome} onAlternatives={onAlternatives} alternativesDisabled />)

    const ask = screen.getByRole('button', { name: 'roadtrip.alt.ask' })
    expect(ask).toBeDisabled()
    fireEvent.click(ask)
    expect(onAlternatives).not.toHaveBeenCalled()
  })
})

describe('RtDryRow', () => {
  const idle = {
    openFor: null, loading: false, outcome: null, results: [], offered: [],
    ask: vi.fn(), close: vi.fn(),
  } as unknown as RefuelSearch
  const props = { intoLegKm: 82, chrome, electric: false, offline: false, refuel: idle, dayId: 7, legIndex: 1 }

  it('FE-MOB-RTROW-018: names the fuel wording and the distance into the leg for a combustion car', () => {
    const { container } = render(<RtDryRow {...props} onSearch={vi.fn()} />)

    expect(screen.getByText('roadtrip.refuel.dry')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.refuel.after:82 km')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.find' })).toBeInTheDocument()
    expect(container.querySelector('svg.trek--transport')).not.toBeNull()
  })

  it('FE-MOB-RTROW-019: swaps to the charging wording for an electric car', () => {
    render(<RtDryRow {...props} electric onSearch={vi.fn()} />)

    expect(screen.getByText('roadtrip.refuel.dryElectric')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.findElectric' })).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.refuel.dry')).toBeNull()
  })

  it('FE-MOB-RTROW-020: searches from the button', () => {
    const onSearch = vi.fn()
    render(<RtDryRow {...props} onSearch={onSearch} />)

    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.find' }))
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-021: disables the search offline and says why underneath it', () => {
    const onSearch = vi.fn()
    render(<RtDryRow {...props} offline onSearch={onSearch} />)

    const button = screen.getByRole('button', { name: 'roadtrip.refuel.find' })
    expect(button).toBeDisabled()
    expect(screen.getByText('mobileTrip.rtSearchOffline')).toBeInTheDocument()
    // The lamp stops glowing: a lamp that glows invites a press that cannot work.
    expect(button.querySelector('svg.lucide-fuel')).not.toBeNull()
    expect(button.querySelector('.trek-lowfuel')).toBeNull()

    fireEvent.click(button)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTROW-022: drops the button entirely without write permission, offline line included', () => {
    const { container } = render(<RtDryRow {...props} offline />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText('mobileTrip.rtSearchOffline')).toBeNull()
    // The warning itself stays: it is information, not an action. The reserve lamp too,
    // as a mark rather than a control.
    expect(screen.getByText('roadtrip.refuel.dry')).toBeInTheDocument()
    expect(container.querySelector('.trek-lowfuel')).not.toBeNull()
  })
  const offer = (over: Record<string, unknown> = {}) => ({
    osm_id: 'n1', name: 'Shell Ebina', lat: 35.44, lng: 139.39, category: 'fuel',
    poi_type: 'amenity=fuel', address: null, website: null, phone: null,
    opening_hours: null, cuisine: null, source: 'openstreetmap',
    offRouteKm: 0.4, alongKm: 70, spareKm: 22, ...over,
  }) as unknown as RefuelCandidate

  const answering = (over: Partial<RefuelSearch> = {}) => ({
    ...idle, openFor: '7:1', ...over,
  } as unknown as RefuelSearch)

  it('FE-MOB-RTROW-027: says it is looking while the search runs', () => {
    render(<RtDryRow {...props} refuel={answering({ loading: true })} onSearch={vi.fn()} />)

    expect(screen.getByText('roadtrip.refuel.looking')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-028: offers what it found, with the detour and what is left in the tank', () => {
    render(
      <RtDryRow
        {...props}
        refuel={answering({ outcome: 'found', results: [offer()] })}
        onSearch={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.poi.offRoute:400 m · roadtrip.refuel.spare:22 km')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-029: an offer three legs away does not light up this band', () => {
    // One search is open at a time and it names the dry point it belongs to.
    render(
      <RtDryRow
        {...props}
        refuel={answering({ openFor: '7:4', outcome: 'found', results: [offer()] })}
        onSearch={vi.fn()}
      />,
    )

    expect(screen.queryByText('Shell Ebina')).toBeNull()
  })

  it('FE-MOB-RTROW-030: taking an offer goes through the planner, and never without permission', () => {
    const onAccept = vi.fn()
    const refuel = answering({ outcome: 'found', results: [offer()] })
    const view = render(<RtDryRow {...props} refuel={refuel} onSearch={vi.fn()} onAccept={onAccept} />)

    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.add:Shell Ebina' }))
    expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ osm_id: 'n1' }))
    view.unmount()

    render(<RtDryRow {...props} refuel={refuel} />)
    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.add:Shell Ebina' })).toBeNull()
    // The offer is still worth seeing: a reader can look up a station even if they
    // cannot put it on the trip.
    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-031: three sentences for three different facts, and none of them "nothing here"', () => {
    const none = render(<RtDryRow {...props} refuel={answering({ outcome: 'none' })} onSearch={vi.fn()} />)
    expect(screen.getByText('roadtrip.refuel.none')).toBeInTheDocument()
    none.unmount()

    const cut = render(<RtDryRow {...props} refuel={answering({ outcome: 'incomplete' })} onSearch={vi.fn()} />)
    expect(screen.getByText('roadtrip.refuel.incomplete')).toBeInTheDocument()
    cut.unmount()

    render(<RtDryRow {...props} refuel={answering({ outcome: 'failed' })} onSearch={vi.fn()} />)
    // A request that failed never checked the stretch, so it must not read as empty.
    expect(screen.getByText('roadtrip.refuel.failed')).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.refuel.none')).toBeNull()
  })

  it('FE-MOB-RTROW-032: the mascot rides the skateboard, sad, in the band colour and on an opaque ground', () => {
    const { container } = render(<RtDryRow {...props} onSearch={vi.fn()} />)

    const mascot = container.querySelector('svg.trek--transport') as SVGElement
    // Expression eyes, not the default open ones, bent down rather than up.
    expect(mascot.querySelectorAll('.trek-eye')).toHaveLength(0)
    const eyes = mascot.querySelectorAll('.trek-body g[stroke] path')
    expect(eyes).toHaveLength(2)
    const [, startY, controlY] = /^M[\d.]+ ([\d.]+) Q[\d.]+ ([\d.]+)/.exec(eyes[0].getAttribute('d') ?? '') ?? []
    expect(Number(controlY)).toBeGreaterThan(Number(startY))

    // Renamed on the mascot's own span, against an opaque surface so the cut out eyes
    // do not show the body through them.
    const wrapper = mascot.parentElement as HTMLElement
    expect(wrapper.style.getPropertyValue('--m-ink')).toBe('var(--m-st-danger)')
    expect(wrapper.style.getPropertyValue('--m-bg')).toContain('--m-sheetop')
    // And never on the band, where the offers read --m-ink and have to stay ink.
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--m-ink')).toBe('')
  })

  it('FE-MOB-RTROW-033: the reserve lamp is the button, with its words in the label only', () => {
    const fuel = render(<RtDryRow {...props} onSearch={vi.fn()} />)

    const lamp = screen.getByRole('button', { name: 'roadtrip.refuel.find' })
    expect(lamp.querySelector('svg.lucide-fuel.trek-lowfuel')).not.toBeNull()
    // Not the black pill it replaced, and no visible label beside the mascot and title.
    expect(lamp.className).not.toContain('bg-m-act')
    expect(screen.queryByText('roadtrip.refuel.find')).toBeNull()
    fuel.unmount()

    render(<RtDryRow {...props} electric onSearch={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.findElectric' }).querySelector('svg.lucide-zap')).not.toBeNull()
  })

  it('FE-MOB-RTROW-034: while the search runs or offers show, the lamp steps aside for a close', () => {
    // The map draws the offers, and the band is where somebody lets those pins go.
    const close = vi.fn()
    const running = render(<RtDryRow {...props} refuel={answering({ loading: true, close })} onSearch={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(close).toHaveBeenCalledTimes(1)
    running.unmount()

    const found = render(<RtDryRow {...props} refuel={answering({ outcome: 'found', results: [offer()], close })} onSearch={vi.fn()} />)
    expect(screen.getByText('Shell Ebina')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(close).toHaveBeenCalledTimes(2)
    found.unmount()

    // Offline the close still works, because closing is local, and with no dead control
    // in the slot the sentence explaining one stands down.
    render(<RtDryRow {...props} offline refuel={answering({ outcome: 'found', results: [offer()], close })} onSearch={vi.fn()} />)
    const closeOffline = screen.getByRole('button', { name: 'common.close' })
    expect(closeOffline).toBeEnabled()
    expect(screen.queryByText('mobileTrip.rtSearchOffline')).toBeNull()
    fireEvent.click(closeOffline)
    expect(close).toHaveBeenCalledTimes(3)
  })

  it('FE-MOB-RTROW-035: an empty answer leaves a retry rather than a dead end, and offline it waits', () => {
    const onSearch = vi.fn()
    const failed = render(<RtDryRow {...props} refuel={answering({ outcome: 'failed' })} onSearch={onSearch} />)

    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.find' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'roadtrip.refuel.again' }))
    expect(onSearch).toHaveBeenCalledTimes(1)
    failed.unmount()

    const none = render(<RtDryRow {...props} refuel={answering({ outcome: 'none' })} onSearch={onSearch} />)
    expect(screen.getByRole('button', { name: 'roadtrip.refuel.again' })).toBeInTheDocument()
    none.unmount()

    render(<RtDryRow {...props} offline refuel={answering({ outcome: 'failed' })} onSearch={onSearch} />)
    const again = screen.getByRole('button', { name: 'roadtrip.refuel.again' })
    expect(again).toBeDisabled()
    fireEvent.click(again)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTROW-036: lists three offers at most, however many came back', () => {
    const results = ['n1', 'n2', 'n3', 'n4'].map((id, i) => offer({ osm_id: id, name: `Station ${i + 1}` }))
    const { container } = render(<RtDryRow {...props} refuel={answering({ outcome: 'found', results })} onSearch={vi.fn()} />)

    expect(container.querySelectorAll('li')).toHaveLength(3)
    expect(screen.queryByText('Station 4')).toBeNull()
  })

  it('FE-MOB-RTROW-037: the battery wording carries through to taking an offer', () => {
    render(
      <RtDryRow
        {...props}
        electric
        refuel={answering({ outcome: 'found', results: [offer()] })}
        onSearch={vi.fn()}
        onAccept={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'roadtrip.refuel.addElectric:Shell Ebina' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'roadtrip.refuel.add:Shell Ebina' })).toBeNull()
  })
})

describe('RtAutoRow', () => {
  it('FE-MOB-RTROW-023: marks the end of a day with the moon and the time it stopped', () => {
    const { container } = render(<RtAutoRow phase="end" time="22:00" chrome={chrome} />)

    expect(screen.getByText('roadtrip.window.stop')).toBeInTheDocument()
    expect(screen.getByText('22:00')).toBeInTheDocument()
    expect(container.querySelector('.lucide-moon')).not.toBeNull()
  })

  it('FE-MOB-RTROW-024: marks the morning with the sunrise and no clock when there is none', () => {
    const { container } = render(<RtAutoRow phase="resume" time={null} chrome={chrome} />)

    expect(screen.getByText('roadtrip.window.resume')).toBeInTheDocument()
    expect(container.querySelector('.lucide-sunrise')).not.toBeNull()
    expect(screen.queryByText('22:00')).toBeNull()
  })
})

describe('RtSpillRow', () => {
  it('FE-MOB-RTROW-025: names the day the night drive came from and when it set off', () => {
    render(
      <RtSpillRow fromDayNumber={1} departs="23:10" chrome={chrome}>
        <span>Fuji Viewpoint</span>
      </RtSpillRow>,
    )

    expect(screen.getByText('roadtrip.spill.title:1')).toBeInTheDocument()
    expect(screen.getByText('roadtrip.spill.departs:23:10')).toBeInTheDocument()
    expect(screen.getByText('Fuji Viewpoint')).toBeInTheDocument()
  })

  it('FE-MOB-RTROW-026: leaves the departure off when the night drive has no time', () => {
    render(<RtSpillRow fromDayNumber={1} departs={null} chrome={chrome} />)

    expect(screen.getByText('roadtrip.spill.title:1')).toBeInTheDocument()
    expect(screen.queryByText(/roadtrip\.spill\.departs/)).toBeNull()
  })
})
