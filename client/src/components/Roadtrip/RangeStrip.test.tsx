import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import type { DistanceUnit } from '../../types'
import RangeStrip, { blockMask } from './RangeStrip'

/**
 * FE-RANGESTRIP-001..015 — the picture under the range field.
 *
 * Nothing here is interactive, so what is worth pinning is the arithmetic the drawing
 * rests on: the empty state has to stay empty rather than settle on a plausible zero,
 * the block mask has a band it lives in and looks broken outside it, and the three
 * segments have to cover the bar exactly or the tail runs off the end. The chips are the
 * only readable proof that any of that happened, and the aria-label is the only route a
 * screen reader has to the figure at all.
 */

const strip = (over: Partial<React.ComponentProps<typeof RangeStrip>> = {}) => (
  <RangeStrip
    rangeKm={500}
    fillPercent={null}
    wearPercent={null}
    unit={'metric' as DistanceUnit}
    electric={false}
    {...over}
  />
)

/**
 * The three widths of the bar, in the order they are laid: what a stop puts in, what is
 * left of the tank, what age has taken. Read off the track rather than off the wrapper,
 * because the wrapper is the thing carrying the label.
 */
function segments(): number[] {
  const track = screen.getByRole('img').firstElementChild as HTMLElement
  return Array.from(track.children).map(c => parseFloat((c as HTMLElement).style.width))
}

describe('RangeStrip', () => {
  it('FE-RANGESTRIP-001: with no range the figure is a dash and no unit hangs off it', () => {
    // A lone "km" beside a dash reads as a unit waiting for a number, which invites the
    // guess that the number is zero. There is no number, so there is nothing to label.
    render(strip({ rangeKm: null }))

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('km')).not.toBeInTheDocument()
    expect(screen.getByText('No range set')).toBeInTheDocument()
    expect(screen.getByText(/Type a range/)).toBeInTheDocument()
  })

  it('FE-RANGESTRIP-002: with no range the bar reads out the hint alone', () => {
    // The bar is drawn empty here, so its label is the only thing that can say why.
    render(strip({ rangeKm: null }))

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Type a range, or fill in the figures below and TREK works it out.',
    )
  })

  it('FE-RANGESTRIP-003: the figure and its unit are split but say the same thing', () => {
    // Split so the unit can sit smaller beside the number; the split is only safe while
    // the two halves still read as one reading of one distance.
    render(strip({ rangeKm: 500 }))

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('km')).toBeInTheDocument()
  })

  it('FE-RANGESTRIP-004: an electric car charges where a petrol one fills', () => {
    const { rerender } = render(strip({ electric: true }))
    expect(screen.getByText('per charge')).toBeInTheDocument()

    rerender(strip({ electric: false }))
    expect(screen.getByText('per tank')).toBeInTheDocument()
  })

  it('FE-RANGESTRIP-005: a countable range is cut into blocks and says what one is worth', () => {
    // Ten blocks. The chip is the only thing that turns the gaps from texture into a
    // measure, so it has to appear with the mask rather than merely near it.
    render(strip({ rangeKm: 500 }))

    expect(screen.getByText('One block = 50 km')).toBeInTheDocument()
  })

  it('FE-RANGESTRIP-006: a range too short or too long to count is left solid', () => {
    // Two blocks read as damage; forty eat the bar. Either way there is nothing to
    // count, so claiming a block is worth fifty kilometres would be claiming a mask
    // that was never cut.
    const { rerender } = render(strip({ rangeKm: 100 }))
    expect(screen.queryByText(/One block/)).not.toBeInTheDocument()

    rerender(strip({ rangeKm: 2000 }))
    expect(screen.queryByText(/One block/)).not.toBeInTheDocument()
  })

  it('FE-RANGESTRIP-007: the countable band has hard edges at three and thirty blocks', () => {
    // Rounded, not floored: 130 km is three blocks and 1520 km is thirty. The pairs
    // either side of each edge are what a change to that rounding would move.
    const { rerender } = render(strip({ rangeKm: 120 }))
    expect(screen.queryByText(/One block/)).not.toBeInTheDocument()

    rerender(strip({ rangeKm: 130 }))
    expect(screen.getByText('One block = 50 km')).toBeInTheDocument()

    rerender(strip({ rangeKm: 1520 }))
    expect(screen.getByText('One block = 50 km')).toBeInTheDocument()

    rerender(strip({ rangeKm: 1560 }))
    expect(screen.queryByText(/One block/)).not.toBeInTheDocument()
  })

  it('FE-RANGESTRIP-008: a partial fill says what that stop actually buys', () => {
    // Four fifths of a 500 km tank. The whole point of the panel is that nobody charges
    // to the top, so the note has to move off the full-tank sentence.
    render(strip({ rangeKm: 500, fillPercent: 80 }))

    expect(screen.getByText('A 80 % stop gives 400 km')).toBeInTheDocument()
    expect(screen.queryByText('A stop fills right up')).not.toBeInTheDocument()
  })

  it('FE-RANGESTRIP-009: a full, an absent and an impossible fill all read as filling right up', () => {
    // Anything outside nought to a hundred is not a fraction of a tank, and a note
    // saying a 130 % stop gives 650 km would be the panel inventing range.
    const { rerender } = render(strip({ fillPercent: 100 }))
    expect(screen.getByText('A stop fills right up')).toBeInTheDocument()

    rerender(strip({ fillPercent: null }))
    expect(screen.getByText('A stop fills right up')).toBeInTheDocument()

    rerender(strip({ fillPercent: 130 }))
    expect(screen.getByText('A stop fills right up')).toBeInTheDocument()

    // The other end of the same guard, and the one a cleared or mistyped field really
    // produces: a stop that puts nothing in would leave the bar empty and the note
    // claiming a range of nought.
    rerender(strip({ fillPercent: 0 }))
    expect(screen.getByText('A stop fills right up')).toBeInTheDocument()

    rerender(strip({ fillPercent: -20 }))
    expect(screen.getByText('A stop fills right up')).toBeInTheDocument()
  })

  it('FE-RANGESTRIP-010: wear is clamped to 90 rather than drawn past the bar', () => {
    // A battery reported as 150 % gone would leave the middle segment at a negative
    // width, which the browser drops: the tail would then be the whole bar and the chip
    // would be telling the traveller the car cannot move.
    render(strip({ rangeKm: 400, fillPercent: 80, wearPercent: 150 }))

    expect(screen.getByText('90 % lost to age')).toBeInTheDocument()
    expect(segments()).toEqual([8, 2, 90])
  })

  it('FE-RANGESTRIP-011: with nothing lost to age there is no tail to explain', () => {
    // Zero is the ordinary case for a new car and for every petrol one. A chip reading
    // "0 % lost to age" is an answer to a question nobody asked.
    const { rerender } = render(strip({ wearPercent: 0 }))
    expect(screen.queryByText(/lost to age/)).not.toBeInTheDocument()

    rerender(strip({ wearPercent: -20 }))
    expect(screen.queryByText(/lost to age/)).not.toBeInTheDocument()
    expect(segments()).toEqual([100, 0, 0])
  })

  it('FE-RANGESTRIP-012: without a range there is no wear to take off it', () => {
    // Wear is a share of a range. With no range the share is of nothing, and a tail on
    // an empty bar would be the one filled thing on it.
    render(strip({ rangeKm: null, wearPercent: 30 }))

    expect(screen.queryByText(/lost to age/)).not.toBeInTheDocument()
    expect(segments()).toEqual([0, 100, 0])
  })

  it('FE-RANGESTRIP-013: the three segments cover the bar exactly', () => {
    // A fifth gone and a four-fifths stop: the fill is four fifths of what is LEFT, not
    // of the factory bar, or the filled part would reach into the hatched tail.
    render(strip({ rangeKm: 400, fillPercent: 80, wearPercent: 20 }))

    expect(segments()).toEqual([64, 16, 20])
  })

  it('FE-RANGESTRIP-016: the stencil itself cuts one block per fifty kilometres', () => {
    // Asserted on the function, because jsdom implements no mask property: React writes
    // neither maskImage nor WebkitMaskImage and the element arrives with no style at
    // all, so through the DOM every one of these cases would pass on an empty bar.
    expect(blockMask(500)).toContain('repeating-linear-gradient')
    // Ten blocks of fifty, so one keep-then-cut step is a tenth of the bar.
    expect(blockMask(500)).toContain('10%')
    // Five blocks, a fifth each: the step really follows the distance rather than being
    // a fixed number of divisions dressed up as one.
    expect(blockMask(250)).toContain('20%')

    // Below three the cuts read as damage and above thirty the gaps eat the bar, so
    // outside that the bar is honestly solid.
    expect(blockMask(100)).toBeUndefined()
    expect(blockMask(2000)).toBeUndefined()
    expect(blockMask(null)).toBeUndefined()
  })

  it('FE-RANGESTRIP-017: the wear chip carries the same hatching as the tail of the bar', () => {
    // The swatch is what ties the sentence to the stripe. Without it the hatching is an
    // unexplained texture at the end of the bar and the chip an unexplained subtraction.
    const { container } = render(strip({ rangeKm: 400, wearPercent: 12, electric: true }))

    const hatched = Array.from(container.querySelectorAll<HTMLElement>('span[style*="repeating-linear-gradient"]'))
    expect(hatched).toHaveLength(1)
    expect(hatched[0].style.backgroundImage).toBe(
      (screen.getByRole('img').firstElementChild?.lastElementChild as HTMLElement).style.backgroundImage,
    )
  })

  it('FE-RANGESTRIP-014: the bar reads out the figure and the note together', () => {
    // Everything else in here is colour and width. A screen reader gets the range from
    // this label or not at all, so it has to carry both halves of the answer.
    render(strip({ rangeKm: 500, fillPercent: 80 }))

    expect(screen.getByRole('img')).toHaveAccessibleName('500 km — A 80 % stop gives 400 km')
  })

  it('FE-RANGESTRIP-015: imperial converts the figure, the unit and the block chip together', () => {
    // The blocks are cut in kilometres whatever the setting, so the chip is the one
    // place the two systems can drift apart: 50 km of bar has to be stated as 31.1 mi.
    render(strip({ rangeKm: 500, unit: 'imperial' as DistanceUnit }))

    expect(screen.getByText('310.7')).toBeInTheDocument()
    expect(screen.getByText('mi')).toBeInTheDocument()
    expect(screen.getByText('One block = 31.1 mi')).toBeInTheDocument()
  })
})
