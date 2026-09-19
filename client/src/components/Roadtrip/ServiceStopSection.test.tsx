import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import ServiceStopSection from './ServiceStopSection'
import type { ServiceStopMode } from './manualStop'

/**
 * FE-SERVICESTOP-011..016, 022..024: the place form, asked for a stop on a drive.
 *
 * What the section itself owes the reader: the two questions a service stop answers,
 * the leg it will land on preselected from where the place is, how far off that leg the
 * place lies, and a word about a place sitting well off the drawn line, which is noted
 * and never refused. The arithmetic underneath has its own suite in `manualStop.test.ts`.
 */

const mode = (over: Partial<ServiceStopMode> = {}): ServiceStopMode => ({
  days: [
    { dayId: 5, dayNumber: 1, stops: ['Hamburg', 'Bremen', 'Berlin'] },
    { dayId: 6, dayNumber: 2, stops: ['Berlin', 'Dresden'] },
  ],
  appendDay: { dayId: 5, dayNumber: 1, position: 3 },
  targetFor: () => null,
  ...over,
})

/** A drive with places on it but no line drawn between them yet. */
const unrouted = () => mode({ days: [], appendDay: { dayId: 5, dayNumber: 1, position: 2 } })

function draw(over: Partial<React.ComponentProps<typeof ServiceStopSection>> = {}) {
  const onStopType = vi.fn()
  const onMinutes = vi.fn()
  const onLeg = vi.fn()
  render(
    <ServiceStopSection
      mode={mode()}
      stopType="fuel"
      minutes={10}
      leg=""
      lat={null}
      lng={null}
      {...over}
      onStopType={onStopType}
      onMinutes={onMinutes}
      onLeg={onLeg}
    />,
  )
  return { onStopType, onMinutes, onLeg }
}

describe('ServiceStopSection', () => {
  it('FE-SERVICESTOP-011: it asks the two questions a stop on a drive answers', () => {
    draw()

    expect(screen.getByText('Kind of stop')).toBeInTheDocument()
    expect(screen.getByText('Time at this stop')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fuel' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Charging' })).toHaveAttribute('aria-pressed', 'false')
    // The kinds are the road trip's own closed set, never the trip's category list.
    expect(screen.queryByText('Category')).toBeNull()
  })

  it('FE-SERVICESTOP-012: picking another kind reports it, and picking the same one does not', () => {
    const props = draw()

    fireEvent.click(screen.getByRole('button', { name: 'Charging' }))
    expect(props.onStopType).toHaveBeenCalledWith('charging')

    // Clicking the kind already on changes nothing, so a dwell set by hand survives it.
    props.onStopType.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }))
    expect(props.onStopType).not.toHaveBeenCalled()
  })

  it('FE-SERVICESTOP-013: how long it stands is offered, because the schedule chains it', () => {
    const props = draw()

    fireEvent.click(screen.getByRole('button', { name: /45 min/ }))
    expect(props.onMinutes).toHaveBeenCalledWith(45)
  })

  it('FE-SERVICESTOP-014: the leg on offer is the projected one, and it can be overruled', () => {
    const props = draw({
      lat: 51.05,
      lng: 13.7,
      mode: mode({ targetFor: () => ({ dayId: 6, position: 1, offRouteKm: 0.4 }) }),
    })

    expect(screen.getByText('Add between')).toBeInTheDocument()
    // Each row names only the two stops it sits between: the word the caption carries
    // does not need repeating down the list.
    const trigger = screen.getByRole('button', { name: /Berlin · Dresden/ })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText(/Bremen · Berlin/))

    expect(props.onLeg).toHaveBeenCalledWith('5:1')
  })

  it('FE-SERVICESTOP-015: a place far from the road is noted rather than refused', () => {
    draw({ lat: 41.9, lng: 12.5, mode: mode({ targetFor: () => ({ dayId: 5, position: 2, offRouteKm: 14.8 }) }) })

    expect(screen.getByText(/check which leg it belongs on/)).toBeInTheDocument()
    // Still a leg to land on: the note is the reason to change it, not a refusal.
    expect(screen.getByRole('button', { name: /Bremen · Berlin/ })).toBeInTheDocument()
  })

  it('FE-SERVICESTOP-016: with nothing routed it says which day it will be added to', () => {
    draw({ lat: 53.55, lng: 9.99, mode: unrouted() })

    expect(screen.getByText(/it goes at the end of day 1/)).toBeInTheDocument()
  })

  it('FE-SERVICESTOP-022: with no place chosen yet it says so instead of picking a leg', () => {
    // The form opens on nothing at all, and a name on its own cannot be put on a drive.
    // Silently filing it onto the first leg of the trip is the one thing not to do.
    draw()

    expect(screen.getByTestId('service-stop-needs-point')).toBeInTheDocument()
    expect(screen.queryByText('Add between')).toBeNull()
    expect(screen.queryByRole('button', { name: /Hamburg · Bremen/ })).toBeNull()
  })

  it('FE-SERVICESTOP-023: every leg says how far off it the place lies, nearest first', () => {
    draw({
      lat: 50.9,
      lng: 10.5,
      mode: mode({
        days: [{
          dayId: 5,
          dayNumber: 1,
          stops: ['Hamburg', 'Bremen', 'Berlin'],
          legLines: [
            [{ lat: 50, lng: 10 }, { lat: 50, lng: 11 }],
            [{ lat: 51, lng: 10 }, { lat: 51, lng: 11 }],
          ],
        }],
        appendDay: null,
      }),
    })

    // The nearest stretch is the one on offer, and it says why it is: the trigger shows
    // the preselected row, distance and all.
    expect(screen.getByRole('button', { name: /Bremen · Berlin · 11\.1 km off the route/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Bremen · Berlin/ }))
    // The trigger repeats the preselected row, so the menu itself starts one along.
    const rows = screen.getAllByRole('button')
      .map(b => b.textContent ?? '')
      .filter(text => text.includes('off the route'))
      .slice(1)
    // Nearest first, so the preselected one is visibly the nearest and an override is an
    // informed choice rather than a guess.
    expect(rows[0]).toMatch(/Bremen · Berlin · 11\.1 km/)
    expect(rows[1]).toMatch(/Hamburg · Bremen · 100\.2 km/)
  })

  it('FE-SERVICESTOP-024: the day the panel is on is offered even once the others have routed', () => {
    const props = draw({
      lat: 51.05,
      lng: 13.7,
      // Days 1 and 2 are drawn; the panel is on a third that is still calculating.
      mode: mode({ appendDay: { dayId: 7, dayNumber: 3, position: 2 } }),
    })

    fireEvent.click(screen.getByRole('button', { name: /Hamburg · Bremen/ }))
    fireEvent.click(screen.getByText(/Day 3, as stop 3/))

    expect(props.onLeg).toHaveBeenCalledWith('7:end')
  })
})
