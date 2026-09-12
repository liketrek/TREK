import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import RoadtripTrackModal from './RoadtripTrackModal'
import type { FollowTrack, TrackChoice } from './useFollowTrack'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

const track = (over: Partial<TrackChoice> & { id: number; name: string }): TrackChoice => ({
  color: '#0ea5e9',
  points: [{ lat: 52, lng: 13 }, { lat: 52, lng: 14 }],
  lengthKm: 68,
  gapKm: 0.4,
  ...over,
})

function follow(over: Partial<FollowTrack> = {}): FollowTrack {
  return {
    dayId: 7,
    open: vi.fn(),
    close: vi.fn(),
    tracks: [track({ id: 3, name: 'Atlantic Road' })],
    busy: false,
    round: 0,
    error: null,
    outcome: null,
    apply: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    viaCount: 0,
    available: true,
    current: null,
    namesByDay: {},
    ...over,
  }
}

describe('RoadtripTrackModal', () => {
  it('FE-TRACKMODAL-001: closed is nothing at all, not a hidden dialog', () => {
    const { container } = wrap(<RoadtripTrackModal follow={follow({ dayId: null })} dayNumber={1} />)
    expect(container.firstChild).toBeNull()
  })

  it('FE-TRACKMODAL-002: a trip with no tracks says where tracks come from', () => {
    wrap(<RoadtripTrackModal follow={follow({ tracks: [] })} dayNumber={2} />)
    expect(screen.getByText('No tracks in this trip')).toBeTruthy()
    expect(screen.getByText(/GPX or KML/)).toBeTruthy()
  })

  it('FE-TRACKMODAL-003: a track close to the day says so rather than quoting a distance', () => {
    wrap(<RoadtripTrackModal follow={follow()} dayNumber={1} />)
    expect(screen.getByText(/along this day/)).toBeTruthy()
    expect(screen.getByText(/68 km long/)).toBeTruthy()
  })

  it('FE-TRACKMODAL-004: a track that runs elsewhere is offered with the distance to here', () => {
    wrap(<RoadtripTrackModal follow={follow({ tracks: [track({ id: 9, name: 'Elsewhere', gapKm: 240 })] })} dayNumber={1} />)
    expect(screen.getByText(/240 km off this day/)).toBeTruthy()
  })

  it('FE-TRACKMODAL-005: nothing is applied until a track is picked', () => {
    const state = follow()
    wrap(<RoadtripTrackModal follow={state} dayNumber={1} />)

    const action = screen.getByRole('button', { name: 'Follow this track' })
    expect((action as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByText('Atlantic Road'))
    expect((screen.getByRole('button', { name: 'Follow this track' }) as HTMLButtonElement).disabled).toBe(false)
    // What it will do, before it does it: a track becomes a dozen waypoints on the day.
    expect(screen.getByText(/via points/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Follow this track' }))
    expect(state.apply).toHaveBeenCalledWith(3)
  })

  it('FE-TRACKMODAL-006: a picked track can be unpicked', () => {
    wrap(<RoadtripTrackModal follow={follow()} dayNumber={1} />)
    fireEvent.click(screen.getByText('Atlantic Road'))
    fireEvent.click(screen.getByText('Atlantic Road'))
    expect((screen.getByRole('button', { name: 'Follow this track' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('FE-TRACKMODAL-007: a run says which round it is on rather than going blank', () => {
    wrap(<RoadtripTrackModal follow={follow({ busy: true, round: 4 })} dayNumber={1} />)
    expect(screen.getByRole('status').textContent).toMatch(/round 4/)
  })

  it('FE-TRACKMODAL-008: a finished run reports how close the drive got', () => {
    wrap(<RoadtripTrackModal follow={follow({ outcome: { vias: 6, strayKm: 0.8, capped: false } })} dayNumber={1} />)
    expect(screen.getByRole('status').textContent).toMatch(/6 via points placed/)
  })

  it('FE-TRACKMODAL-009: a run that ran out of vias admits the gap it left', () => {
    wrap(<RoadtripTrackModal follow={follow({ outcome: { vias: 12, strayKm: 2.4, capped: true } })} dayNumber={1} />)
    // The honest form: it did what it could, and the number says how much that was worth.
    expect(screen.getByRole('status').textContent).toMatch(/no closer than/)
  })

  it('FE-TRACKMODAL-010: a drive that already followed the track is not dressed up as work', () => {
    wrap(<RoadtripTrackModal follow={follow({ outcome: { vias: 0, strayKm: 0, capped: false } })} dayNumber={1} />)
    expect(screen.getByRole('status').textContent).toMatch(/already followed/)
  })

  it('FE-TRACKMODAL-011: a failure is an alert, not a silent nothing', () => {
    wrap(<RoadtripTrackModal follow={follow({ error: 'route' })} dayNumber={1} />)
    expect(screen.getByRole('alert').textContent).toMatch(/routing service/)
  })

  it('FE-TRACKMODAL-012: dropping the day\'s vias is offered only once it has some', () => {
    const state = follow({ viaCount: 5 })
    const { rerender } = wrap(<RoadtripTrackModal follow={state} dayNumber={1} />)
    const drop = screen.getByRole('button', { name: /Drop 5 via points/ })
    fireEvent.click(drop)
    expect(state.clear).toHaveBeenCalled()

    rerender(<TranslationProvider><RoadtripTrackModal follow={follow({ viaCount: 0 })} dayNumber={1} /></TranslationProvider>)
    expect(screen.queryByRole('button', { name: /Drop/ })).toBeNull()
  })

  it('FE-TRACKMODAL-013: while it runs, nothing else in the dialog can be touched', () => {
    wrap(<RoadtripTrackModal follow={follow({ busy: true, viaCount: 2 })} dayNumber={1} />)
    expect((screen.getByRole('button', { name: /Atlantic Road/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /Drop 2 via points/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})
