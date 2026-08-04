// FE-W4TIP-001 to FE-W4TIP-013
import { createRef, useRef } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../../tests/helpers/render'
import Tooltip from './Tooltip'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function hover(el: HTMLElement) {
  fireEvent.mouseEnter(el)
  act(() => { vi.advanceTimersByTime(300) })
}

describe('Tooltip', () => {
  it('FE-W4TIP-001: renders the trigger and no tooltip until hovered', () => {
    render(<Tooltip label="Delete"><button>x</button></Tooltip>)

    expect(screen.getByRole('button', { name: 'x' })).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4TIP-002: opens only after the delay has elapsed', () => {
    render(<Tooltip label="Delete" delay={250}><button>x</button></Tooltip>)

    fireEvent.mouseEnter(screen.getByRole('button'))
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.queryByRole('tooltip')).toBeNull()

    act(() => { vi.advanceTimersByTime(100) })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete')
  })

  it('FE-W4TIP-003: leaving cancels a pending open', () => {
    render(<Tooltip label="Delete"><button>x</button></Tooltip>)
    const trigger = screen.getByRole('button')

    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)
    act(() => { vi.advanceTimersByTime(500) })

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4TIP-004: focus opens and blur closes the tooltip', () => {
    render(<Tooltip label="Delete"><button>x</button></Tooltip>)
    const trigger = screen.getByRole('button')

    fireEvent.focus(trigger)
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4TIP-005: a disabled tooltip never opens', () => {
    render(<Tooltip label="Delete" disabled><button>x</button></Tooltip>)

    hover(screen.getByRole('button'))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4TIP-006: an empty label never opens', () => {
    render(<Tooltip label=""><button>x</button></Tooltip>)

    hover(screen.getByRole('button'))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4TIP-007: still chains the original handlers of the child', () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(
      <Tooltip label="Delete">
        <button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onFocus={onFocus} onBlur={onBlur}>x</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')

    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)
    fireEvent.focus(trigger)
    fireEvent.blur(trigger)

    expect(onMouseEnter).toHaveBeenCalledOnce()
    expect(onMouseLeave).toHaveBeenCalledOnce()
    expect(onFocus).toHaveBeenCalledOnce()
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it('FE-W4TIP-008: forwards the node to an object ref on the child', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Tooltip label="Delete"><button ref={ref}>x</button></Tooltip>)

    expect(ref.current).toBe(screen.getByRole('button'))
  })

  it('FE-W4TIP-009: forwards the node to a callback ref on the child', () => {
    const seen: (HTMLElement | null)[] = []
    render(<Tooltip label="Delete"><button ref={(n: HTMLButtonElement | null) => { seen.push(n) }}>x</button></Tooltip>)

    expect(seen[0]).toBe(screen.getByRole('button'))
  })

  it('FE-W4TIP-010: positions the tooltip per placement and clamps it into the viewport', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 130, left: 200, right: 260, width: 60, height: 30, x: 200, y: 100, toJSON: () => ({}),
    } as DOMRect)

    const { unmount } = render(<Tooltip label="Delete" placement="bottom"><button>x</button></Tooltip>)
    hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveStyle({ top: '136px' })
    unmount()

    render(<Tooltip label="Delete" placement="right"><button>x</button></Tooltip>)
    hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '266px' })
  })

  it('FE-W4TIP-011: clamps a top/left placement to the viewport padding', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 0, bottom: 20, left: 0, right: 20, width: 20, height: 20, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect)

    const { unmount } = render(<Tooltip label="Delete" placement="top"><button>x</button></Tooltip>)
    hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveStyle({ top: '6px' })
    unmount()

    render(<Tooltip label="Delete" placement="left"><button>x</button></Tooltip>)
    hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '6px' })
  })

  it('FE-W4TIP-012: clears a pending timer when the trigger unmounts', () => {
    const clear = vi.spyOn(window, 'clearTimeout')
    const { unmount } = render(<Tooltip label="Delete"><button>x</button></Tooltip>)

    fireEvent.mouseEnter(screen.getByRole('button'))
    unmount()

    expect(clear).toHaveBeenCalled()
  })
})

describe('Tooltip — inside a component that owns the ref', () => {
  it('FE-W4TIP-013: keeps the owner ref pointing at the trigger', () => {
    function Owner() {
      const ref = useRef<HTMLButtonElement>(null)
      return (
        <Tooltip label="Delete">
          <button ref={ref} onClick={() => { ref.current?.setAttribute('data-clicked', '1') }}>x</button>
        </Tooltip>
      )
    }
    render(<Owner />)

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveAttribute('data-clicked', '1')
  })
})
