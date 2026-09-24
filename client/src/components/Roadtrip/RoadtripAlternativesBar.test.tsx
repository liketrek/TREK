import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import { useSettingsStore } from '../../store/settingsStore'
import RoadtripAlternativesBar from './RoadtripAlternativesBar'
import type { AlternativeOverlay } from './alternativeOverlays'
import type { LegAlternatives } from './useRouteAlternatives'
import { openLeg } from '../../../tests/helpers/legAlternatives'

/**
 * FE-ALTBAR-001..014: the ways of driving one leg, offered over the map.
 *
 * Every value shown comes from the same overlay the map draws. Working them out
 * here separately is what once made the list label the driven route "Fastest"
 * while offering another one as quicker beside it, because it assumed the first
 * entry was the quickest — which stopped being true the moment the road
 * currently driven was put at the top.
 */

const overlay = (over: Partial<AlternativeOverlay> = {}): AlternativeOverlay => ({
  index: 0,
  coordinates: [],
  color: '#0a84ff',
  label: '3 h',
  note: '',
  duration: 10_800,
  distance: 290_000,
  slowerThanQuickest: 0,
  otherEngine: false,
  engine: 'osrm',
  labelBg: '#0a84ff',
  at: { lat: 53, lng: 11 },
  ...over,
})

const leg = (over: Partial<LegAlternatives> = {}): LegAlternatives => openLeg({ dayId: 4, drive: { kind: 'leg', index: 1 }, ...over })

beforeEach(() => {
  useSettingsStore.setState({ settings: { distance_unit: 'metric' } as never })
})

describe('RoadtripAlternativesBar', () => {
  it('FE-ALTBAR-001: nothing open means nothing drawn', () => {
    const { container } = render(
      <RoadtripAlternativesBar open={null} overlays={[]} onChoose={vi.fn()} onClose={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-ALTBAR-002: while the router is answering it says so rather than showing an empty list', () => {
    render(
      <RoadtripAlternativesBar open={leg({ loading: true })} overlays={[]} onChoose={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText(/asking the router/i)).toBeInTheDocument()
  })

  it('FE-ALTBAR-003: a router that will not answer says so, and offers nothing', () => {
    render(
      <RoadtripAlternativesBar open={leg({ error: true })} overlays={[]} onChoose={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText(/not answering/i)).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /km/ })).toHaveLength(0)
  })

  it('FE-ALTBAR-004: one route back is not a choice, and is said as one', () => {
    // Offering a single option would ask the traveller to pick the road they are
    // already on.
    render(
      <RoadtripAlternativesBar open={leg()} overlays={[overlay()]} onChoose={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText(/only/i)).toBeInTheDocument()
  })

  it('FE-ALTBAR-005: each offer shows its distance and what it is', () => {
    render(
      <RoadtripAlternativesBar
        open={leg()}
        overlays={[overlay({ note: 'Fastest' }), overlay({ index: 1, distance: 310_000, note: 'No motorway' })]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Fastest')).toBeInTheDocument()
    expect(screen.getByText('No motorway')).toBeInTheDocument()
    expect(screen.getByText(/290/)).toBeInTheDocument()
    expect(screen.getByText(/310/)).toBeInTheDocument()
  })

  it('FE-ALTBAR-006: an offer with nothing to say about itself says how much slower it is', () => {
    render(
      <RoadtripAlternativesBar
        open={leg()}
        overlays={[overlay({ note: 'Fastest' }), overlay({ index: 1, note: '', slowerThanQuickest: 1800 })]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/30/)).toBeInTheDocument()
  })

  it('FE-ALTBAR-007: choosing one reports its own index, not its position', () => {
    // The map and the list agree on `index`; a position would drift the moment
    // the driven road is prepended.
    const onChoose = vi.fn()
    render(
      <RoadtripAlternativesBar
        open={leg()}
        overlays={[overlay({ index: 3 }), overlay({ index: 7 })]}
        onChoose={onChoose}
        onClose={vi.fn()}
      />,
    )
    fireEvent.click(screen.getAllByRole('button')[2])
    expect(onChoose).toHaveBeenCalledWith(7)
  })

  it('FE-ALTBAR-008: pointing at an offer lights that road up, and leaving clears it', () => {
    const onHighlight = vi.fn()
    render(
      <RoadtripAlternativesBar
        open={leg()}
        overlays={[overlay({ index: 0 }), overlay({ index: 1 })]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
        onHighlight={onHighlight}
      />,
    )
    const first = screen.getAllByRole('button')[1]
    fireEvent.mouseEnter(first)
    expect(onHighlight).toHaveBeenLastCalledWith(0)
    fireEvent.mouseLeave(first)
    expect(onHighlight).toHaveBeenLastCalledWith(null)
    // Keyboard too: the same road lights up on focus.
    fireEvent.focus(first)
    expect(onHighlight).toHaveBeenLastCalledWith(0)
  })

  it('FE-ALTBAR-009: closing is always available, even while it is still asking', () => {
    const onClose = vi.fn()
    render(
      <RoadtripAlternativesBar open={leg({ loading: true })} overlays={[]} onChoose={vi.fn()} onClose={onClose} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-ALTBAR-010: an offer the other engine timed says so, naming that engine, and the rest do not', () => {
    render(
      <RoadtripAlternativesBar
        open={leg()}
        overlays={[
          overlay({ note: 'Fastest' }),
          overlay({ index: 1, note: 'No tolls', otherEngine: true, engine: 'valhalla' }),
        ]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getAllByLabelText(/avoidance router/i)).toHaveLength(1)
    expect(screen.queryByLabelText(/main router/i)).toBeNull()
  })

  it('FE-ALTBAR-011: while a choice is checked and saved the list stands still, and the one in hand says so', () => {
    // A second click would race the first, and the router's answer to it could land on
    // the leg after it.
    const onChoose = vi.fn()
    render(
      <RoadtripAlternativesBar
        open={leg({ proving: 1 })}
        overlays={[overlay({ index: 0, note: 'Current' }), overlay({ index: 1 }), overlay({ index: 2 })]}
        onChoose={onChoose}
        onClose={vi.fn()}
      />,
    )
    const [, current, checked, other] = screen.getAllByRole('button')
    expect([current, checked, other].every(chip => chip.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(checked).toHaveAttribute('aria-busy', 'true')
    expect(other).toHaveAttribute('aria-busy', 'false')
    expect(checked.parentElement).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(other)
    expect(onChoose).not.toHaveBeenCalled()
    // Closing stays available: it is how a check nobody wants to wait for is abandoned.
    expect(screen.getByRole('button', { name: /close/i })).not.toBeDisabled()
  })

  it('FE-ALTBAR-012: with nothing being checked every offer can be taken', () => {
    render(
      <RoadtripAlternativesBar open={leg()} overlays={[overlay({ index: 0 }), overlay({ index: 1 })]} onChoose={vi.fn()} onClose={vi.fn()} />,
    )
    const chips = screen.getAllByRole('button').slice(1)
    expect(chips.every(chip => chip.getAttribute('aria-disabled') === 'false')).toBe(true)
    expect(chips[0].parentElement).toHaveAttribute('aria-busy', 'false')
  })

  it('FE-ALTBAR-013: a keyboard keeps its place on the chip it chose while the check runs', () => {
    // A disabled button hands its focus to the page, so Enter on a chip left the keyboard
    // nowhere in the bar that was still open for another choice.
    const onChoose = vi.fn()
    const overlays = [overlay({ index: 0, note: 'Current' }), overlay({ index: 1 })]
    const { rerender } = render(
      <RoadtripAlternativesBar open={leg()} overlays={overlays} onChoose={onChoose} onClose={vi.fn()} />,
    )
    const chip = screen.getAllByRole('button')[2]
    chip.focus()
    fireEvent.click(chip)
    expect(onChoose).toHaveBeenCalledWith(1)
    rerender(<RoadtripAlternativesBar open={leg({ proving: 1 })} overlays={overlays} onChoose={onChoose} onClose={vi.fn()} />)
    expect(document.activeElement).toBe(chip)
    rerender(<RoadtripAlternativesBar open={leg({ notice: 'Not saved.' })} overlays={overlays} onChoose={onChoose} onClose={vi.fn()} />)
    expect(document.activeElement).toBe(chip)
  })

  it('FE-ALTBAR-014: the bar says a check is running and why the last one saved nothing, in a live line', () => {
    const overlays = [overlay({ index: 0, note: 'Current' }), overlay({ index: 1 })]
    const { rerender } = render(
      <RoadtripAlternativesBar open={leg()} overlays={overlays} onChoose={vi.fn()} onClose={vi.fn()} />,
    )
    // There before it has anything to say, so a screen reader is listening when it does.
    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()
    expect(status).toHaveClass('sr-only')

    rerender(<RoadtripAlternativesBar open={leg({ proving: 1 })} overlays={overlays} onChoose={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent(/checking this way/i)

    const notice = 'The road trip’s router won’t follow this way, so it was not saved.'
    rerender(<RoadtripAlternativesBar open={leg({ notice })} overlays={overlays} onChoose={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent(notice)
    expect(screen.getByRole('status')).not.toHaveClass('sr-only')
  })
})
