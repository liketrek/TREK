import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import { useTouchDragBridge } from './useTouchDragBridge'

describe('useTouchDragBridge (#1616)', () => {
  let source: HTMLElement
  let started: number

  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div data-touch-drag><div id="source" draggable="true">Place</div></div>'
    source = document.getElementById('source')!
    started = 0
    document.addEventListener('dragstart', () => { started++ })
    document.elementFromPoint = () => source
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  /** Presses the row for longer than the bridge's long press. */
  function longPress() {
    fireEvent.touchStart(source, { touches: [{ identifier: 1, clientX: 10, clientY: 10 }] })
    vi.advanceTimersByTime(400)
  }

  it('FE-TOUCHDRAGHOOK-001: while enabled a long press starts a drag', () => {
    renderHook(() => useTouchDragBridge(true))
    longPress()
    expect(started).toBe(1)
  })

  it('FE-TOUCHDRAGHOOK-002: a mouse-driven desktop is left to the browser', () => {
    renderHook(() => useTouchDragBridge(false))
    longPress()
    expect(started).toBe(0)
  })

  it('FE-TOUCHDRAGHOOK-003: leaving the planner stops the bridge watching', () => {
    const { unmount } = renderHook(() => useTouchDragBridge(true))
    unmount()
    longPress()
    expect(started).toBe(0)
  })

  it('FE-TOUCHDRAGHOOK-004: turning it off mid-session stops the bridge watching', () => {
    const { rerender } = renderHook(({ on }) => useTouchDragBridge(on), {
      initialProps: { on: true },
    })
    rerender({ on: false })
    longPress()
    expect(started).toBe(0)
  })
})
