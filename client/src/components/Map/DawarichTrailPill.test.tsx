/**
 * FE-DAWARICH-TRAILUI-001 to FE-DAWARICH-TRAILUI-009: the recorded-route
 * toggle that sits with the compass and the layer switcher on the trip map.
 *
 * The pill is small but it carries the only explanation the user ever gets for
 * an empty overlay. Turning the layer on and seeing no line has four different
 * causes (it is still loading, nothing was recorded on these dates, the
 * Dawarich instance did not answer, the device is offline), and all four are
 * answered by the label on this one control. If the label chain collapses to
 * "hide recorded route" the map silently lies: the user sees a pressed button,
 * no line, and no reason.
 *
 * So what is pinned here is the mapping from `status` to the label, and the
 * second, wordless channel next to it: a problem state drains the mark to 0.35
 * so it is visible without hovering, while loading (which is not a problem)
 * stays at full strength. The off state has to win over all of it, because a
 * dimmed logo on a switched-off control would read as broken rather than as
 * off.
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../../tests/helpers/render'
import { DawarichTrailPill } from './DawarichTrailPill'
import type { DawarichTrailStatus } from './useDawarichTrail'

function pill(props: Partial<React.ComponentProps<typeof DawarichTrailPill>> = {}) {
  return render(
    <DawarichTrailPill active={false} status="idle" onToggle={vi.fn()} {...props} />,
  )
}

const button = () => screen.getByTestId('dawarich-trail-pill')
const label = () => button().getAttribute('aria-label')

afterEach(() => {
  vi.useRealTimers()
})

describe('DawarichTrailPill', () => {
  it('FE-DAWARICH-TRAILUI-001: offers to show the route while the layer is off, whatever the last status was', () => {
    const { rerender } = pill()

    expect(label()).toBe('Show recorded route')
    expect(button()).toHaveAttribute('aria-pressed', 'false')
    expect(button().style.opacity).toBe('0.6')

    // A stale failure from the last time the layer was on must not dim a
    // switched-off control: off already has its own resting opacity, and a
    // second, dimmer step would read as "this button is broken".
    rerender(<DawarichTrailPill active={false} status="unavailable" onToggle={vi.fn()} />)
    expect(label()).toBe('Show recorded route')
    expect(button().style.opacity).toBe('0.6')
  })

  it('FE-DAWARICH-TRAILUI-002: offers to hide the route once a line is on the map', () => {
    const { rerender } = pill({ active: true, status: 'ready' })

    expect(label()).toBe('Hide recorded route')
    expect(button()).toHaveAttribute('aria-pressed', 'true')
    expect(button().style.opacity).toBe('1')

    // `idle` is the state between the toggle flipping and the first fetch
    // starting. It falls through the same arm as `ready` on purpose: the button
    // has just been pressed and "hide" is the only honest thing it can offer.
    rerender(<DawarichTrailPill active status="idle" onToggle={vi.fn()} />)
    expect(label()).toBe('Hide recorded route')
    expect(button().style.opacity).toBe('1')
  })

  it('FE-DAWARICH-TRAILUI-003: says it is loading without dimming the mark', () => {
    pill({ active: true, status: 'loading' })

    expect(label()).toMatch(/^Loading the recorded route/)
    // Loading is not a problem, so the wordless "something is wrong" channel
    // stays off. Otherwise every refresh would blink the control.
    expect(button().style.opacity).toBe('1')
  })

  it('FE-DAWARICH-TRAILUI-004: names each reason there is no line and dims the mark for it', () => {
    const reasons: Array<[DawarichTrailStatus, string]> = [
      ['empty', 'Nothing was recorded on these dates'],
      ['offline', 'The recorded route needs a connection'],
      ['unavailable', 'The recorded route could not be loaded'],
    ]

    for (const [status, expected] of reasons) {
      const { unmount } = pill({ active: true, status })
      expect(label()).toBe(expected)
      expect(button().style.opacity).toBe('0.35')
      // The pressed state survives the problem: the layer really is on, and
      // un-pressing it here would make the toggle disagree with the map.
      expect(button()).toHaveAttribute('aria-pressed', 'true')
      unmount()
    }
  })

  it('FE-DAWARICH-TRAILUI-005: reports a press once', () => {
    const onToggle = vi.fn()
    pill({ onToggle })

    fireEvent.click(button())
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-TRAILUI-006: lifts the mark under the pointer and puts it back', () => {
    pill({ active: true, status: 'ready' })

    fireEvent.mouseEnter(button())
    expect(button().style.transform).toBe('scale(1.06)')

    fireEvent.mouseLeave(button())
    expect(button().style.transform).toBe('none')
  })

  it('FE-DAWARICH-TRAILUI-007: repeats the status in a readable tooltip rather than the native one', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    pill({ active: true, status: 'empty' })

    fireEvent.mouseEnter(button())
    act(() => { vi.advanceTimersByTime(300) })

    // The whole reason this control carries TREK's own tooltip: the native one
    // never appears on a touch device, which is exactly where someone taps the
    // button to find out why the map is empty.
    expect(screen.getByRole('tooltip')).toHaveTextContent('Nothing was recorded on these dates')
  })

  it('FE-DAWARICH-TRAILUI-008: shows a spinning ring and a busy state while the route loads', () => {
    pill({ active: true, status: 'loading' })

    // A first fetch from somebody's own server can take a while. With nothing on
    // the button it read as "done, no line", and the tester reloaded the page.
    expect(screen.getByTestId('dawarich-trail-loading')).toBeInTheDocument()
    expect(button()).toHaveAttribute('aria-busy', 'true')
  })

  it('FE-DAWARICH-TRAILUI-009: drops the ring once there is an answer, and never shows it while the layer is off', () => {
    const view = pill({ active: true, status: 'loading' })

    view.rerender(<DawarichTrailPill active status="ready" onToggle={vi.fn()} />)
    expect(screen.queryByTestId('dawarich-trail-loading')).not.toBeInTheDocument()
    expect(button()).toHaveAttribute('aria-busy', 'false')

    // Switched off mid-load: the hook still reports its last status, the button
    // must not keep spinning for a layer nobody asked for any more.
    view.rerender(<DawarichTrailPill active={false} status="loading" onToggle={vi.fn()} />)
    expect(screen.queryByTestId('dawarich-trail-loading')).not.toBeInTheDocument()
  })
})
