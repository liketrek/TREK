import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import AnchoredPopover from './AnchoredPopover'

/**
 * FE-ANCHOREDPOP-001..014 — where the panel lands and what makes it go away.
 *
 * Everything here is geometry read off the page and arithmetic nobody sees until it is
 * wrong: a panel a gap below the badge, above it on a short window, pulled back inside
 * the viewport, centred on the rail rather than on the badge. The numbers are worked out
 * in the comments so a changed rule fails with a readable diff instead of a shrug.
 *
 * jsdom lays nothing out — every getBoundingClientRect comes back as zeroes, so badge,
 * rail and panel all measure the same and every branch of the placement collapses onto
 * 0,0. Sizes are therefore fed in per element, and window.innerHeight / innerWidth are
 * stated rather than left to the jsdom default, since the flip and the clamp are the
 * whole point of half these cases.
 */

const rect = (top: number, left: number, width: number, height: number): DOMRect => ({
  top, left, width, height,
  bottom: top + height,
  right: left + width,
  x: left,
  y: top,
  toJSON: () => ({}),
}) as DOMRect

let section: HTMLElement
let anchor: HTMLElement
let panel: DOMRect

function viewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
}

beforeEach(() => {
  section = document.createElement('section')
  anchor = document.createElement('button')
  section.appendChild(anchor)
  document.body.appendChild(section)
  // The rail as it stands on a desktop: a tall column at the left edge with the badge
  // hard against its far side. That offset is what the centring rule exists for.
  section.getBoundingClientRect = () => rect(100, 0, 400, 600)
  anchor.getBoundingClientRect = () => rect(120, 344, 48, 20)
  panel = rect(0, 0, 200, 150)
  viewport(1200, 800)
  // The panel is the one element that cannot be primed by hand: React makes it inside the
  // portal and the layout effect measures it in the tick it is created. So it answers off
  // the prototype, which the two own assignments above shadow. Only its size is read —
  // handing back a top and a left it does not have yet would make the test circular.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => panel)
})

afterEach(() => {
  // Both, because case 006 moves the anchor out of the section to test the fallback, so
  // it would outlive section.remove() and sit in the document for the rest of the file.
  anchor.remove()
  section.remove()
  vi.restoreAllMocks()
})

function open() {
  const onClose = vi.fn()
  const view = render(
    <AnchoredPopover anchor={anchor} label="Stop kind" onClose={onClose}>
      <button>Inside</button>
    </AnchoredPopover>,
  )
  return { onClose, unmount: view.unmount, rerender: view.rerender }
}

const dialog = () => screen.getByRole('dialog')

describe('AnchoredPopover', () => {
  it('FE-ANCHOREDPOP-001: without an anchor there is nothing to hang under, and nothing listening', () => {
    const onClose = vi.fn()
    render(
      <AnchoredPopover anchor={null} label="Stop kind" onClose={onClose}>
        <button>Inside</button>
      </AnchoredPopover>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // A closed panel that keeps its key handler takes Escape away from whatever is
    // genuinely open behind it.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-ANCHOREDPOP-002: it hangs a gap under the badge, and is shown only once it has been placed', () => {
    open()

    // Badge bottom 140 plus the gap. Fixed is asserted as the class rather than as a
    // computed style, because jsdom resolves no stylesheet: it is what makes every
    // number in this file a viewport coordinate instead of an offset inside a scroller.
    expect(dialog()).toHaveStyle({ top: '148px' })
    expect(dialog().className).toContain('fixed')
    expect(screen.getByRole('dialog', { name: 'Stop kind' })).toBeInTheDocument()
  })

  it('FE-ANCHOREDPOP-015: it is portalled to the body, out of the rail that would clip it', () => {
    open()

    // The reason this component exists at all. The rail scrolls and carries transforms,
    // and both of those trap a fixed child, so a panel rendered where it is declared
    // would be clipped by the sidebar it hangs in. Every other case here passes without
    // the portal, which is why this one asserts the parent rather than the geometry.
    expect(dialog().parentElement).toBe(document.body)
    expect(section.contains(dialog())).toBe(false)
  })

  it('FE-ANCHOREDPOP-016: moving to another badge re-measures against that one', () => {
    const { onClose, rerender } = open()

    const second = document.createElement('button')
    section.appendChild(second)
    second.getBoundingClientRect = () => rect(500, 344, 48, 20)
    rerender(
      <AnchoredPopover anchor={second} label="Stop kind" onClose={onClose}>
        <button>Inside</button>
      </AnchoredPopover>,
    )

    // 500 plus 20 plus the gap. The rail has more than one badge worth opening and the
    // same panel serves all of them, so the anchor really does change under a mounted
    // popover. Measuring in a layout effect is what keeps that from ever being painted
    // at the previous badge: the position is committed before the browser draws.
    expect(dialog()).toHaveStyle({ top: '528px' })
    second.remove()
  })

  it('FE-ANCHOREDPOP-003: on a short window it flips above the badge instead of off the bottom', () => {
    anchor.getBoundingClientRect = () => rect(200, 344, 48, 20)
    viewport(1200, 360)

    open()

    // Below would start at 228 and run to 378, past the 352 the window leaves. Above is
    // badge top 200 less the 150 it needs less the gap.
    expect(dialog()).toHaveStyle({ top: '42px' })
  })

  it('FE-ANCHOREDPOP-004: a panel too tall for either side sits at the top edge rather than above it', () => {
    anchor.getBoundingClientRect = () => rect(40, 344, 48, 20)
    panel = rect(0, 0, 200, 250)
    viewport(1200, 320)

    open()

    // Flipping honestly would put it at -218, scrolling the half that holds the controls
    // out of reach with nothing to scroll back. Covering the badge is the lesser evil.
    expect(dialog()).toHaveStyle({ top: '8px' })
  })

  it('FE-ANCHOREDPOP-005: it centres on the rail, not on the badge sitting at the edge of it', () => {
    open()

    // Rail centre 200 less half the panel. Centred on the badge it would be 268, hanging
    // over the map and pointing at nothing.
    expect(dialog()).toHaveStyle({ left: '100px' })
  })

  it('FE-ANCHOREDPOP-006: with no column around it, it falls back to the badge', () => {
    // Same badge, no rail: the panel is not owned by the sidebar and has to place itself
    // sanely wherever it is hung.
    document.body.appendChild(anchor)

    open()

    // Badge centre 368 less half the panel.
    expect(dialog()).toHaveStyle({ left: '268px' })
  })

  it('FE-ANCHOREDPOP-007: a rail near the right edge does not push the panel off the screen', () => {
    section.getBoundingClientRect = () => rect(100, 380, 200, 600)
    viewport(500, 800)

    open()

    // Centred it would want 380 and end at 580, well past a window 500 wide. Clamped it
    // ends at 492, the same margin the rest of the placement keeps.
    expect(dialog()).toHaveStyle({ left: '292px' })
  })

  it('FE-ANCHOREDPOP-008: a rail scrolled off the left does not push the panel off it either', () => {
    section.getBoundingClientRect = () => rect(100, -60, 100, 600)

    open()

    // Centred on that sliver the panel would start at -110 and lose its first half.
    expect(dialog()).toHaveStyle({ left: '8px' })
  })

  it('FE-ANCHOREDPOP-009: Escape closes it, and only Escape', () => {
    // The handler sits on the document, so it sees every key pressed anywhere on the
    // page, typing in a field included.
    const { onClose } = open()

    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'e' })
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-ANCHOREDPOP-010: a press anywhere else closes it', () => {
    const { onClose } = open()

    fireEvent.mouseDown(document.body)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-ANCHOREDPOP-011: a press on what the panel contains leaves it open', () => {
    // It closes on mousedown, not on click. Without the guard a button in the panel would
    // be torn out from under the pointer before its own click ever landed.
    const { onClose } = open()

    fireEvent.mouseDown(screen.getByText('Inside'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-ANCHOREDPOP-012: a press on the badge that opened it leaves it open too', () => {
    // The badge toggles. Closing here as well means one press closes the panel twice, and
    // the next press reads as the badge refusing to open.
    const { onClose } = open()

    fireEvent.mouseDown(anchor)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-ANCHOREDPOP-013: a scroll closes it, including one that never bubbles up', () => {
    // Scroll events do not bubble and the rail is its own scroller. A listener without
    // capture would hear nothing while the badge slides out from under a panel that stays
    // where it was measured.
    const { onClose } = open()

    fireEvent.scroll(section)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-ANCHOREDPOP-014: once it is gone it has stopped listening', () => {
    // Three handlers on the document and the window, on a component that is mounted and
    // thrown away again for every badge in the rail.
    const { onClose, unmount } = open()

    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(document.body)
    fireEvent.scroll(section)

    expect(onClose).not.toHaveBeenCalled()
  })
})
