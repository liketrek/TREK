// FE-COMP-JSCROLLTRIG-001 to FE-COMP-JSCROLLTRIG-009

import { render } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import { ScrollTrigger } from './JourneyDetailPageScrollTrigger'

// The global stub in tests/setup.ts never fires — swap in one that hands the
// callback back so the sentinel can be driven into view on demand.
interface ObserverStub {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  observed: Element[]
  disconnect: () => void
}

let observers: ObserverStub[] = []

function intersect(observer: ObserverStub, isIntersecting: boolean) {
  observer.callback(
    [{ isIntersecting, target: observer.observed[0] } as unknown as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver,
  )
}

beforeEach(() => {
  resetAllStores()
  observers = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      const stub: ObserverStub = { callback, options, observed: [], disconnect: vi.fn(() => {}) }
      observers.push(stub)
      this.observe = (el: Element) => { stub.observed.push(el) }
      this.disconnect = stub.disconnect
    }
    observe: (el: Element) => void
    disconnect: () => void
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ScrollTrigger', () => {
  it('FE-COMP-JSCROLLTRIG-001: renders a spinner sentinel and observes it', () => {
    const { container } = render(<ScrollTrigger onVisible={vi.fn()} loading={false} />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
    expect(observers).toHaveLength(1)
    expect(observers[0].observed[0]).toBe(container.firstChild)
  })

  it('FE-COMP-JSCROLLTRIG-002: pre-loads while the sentinel is still 200px away', () => {
    render(<ScrollTrigger onVisible={vi.fn()} loading={false} />)
    expect(observers[0].options).toMatchObject({ rootMargin: '200px' })
  })

  it('FE-COMP-JSCROLLTRIG-003: scrolling the sentinel into view asks for the next page', () => {
    const onVisible = vi.fn()
    render(<ScrollTrigger onVisible={onVisible} loading={false} />)
    intersect(observers[0], true)
    expect(onVisible).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-JSCROLLTRIG-004: leaving the viewport does not ask for a page', () => {
    const onVisible = vi.fn()
    render(<ScrollTrigger onVisible={onVisible} loading={false} />)
    intersect(observers[0], false)
    expect(onVisible).not.toHaveBeenCalled()
  })

  it('FE-COMP-JSCROLLTRIG-005: a page already in flight is not requested twice', () => {
    const onVisible = vi.fn()
    const { rerender } = render(<ScrollTrigger onVisible={onVisible} loading />)
    intersect(observers[0], true)
    expect(onVisible).not.toHaveBeenCalled()

    // once the fetch settles the sentinel is re-observed and fires again
    rerender(<ScrollTrigger onVisible={onVisible} loading={false} />)
    intersect(observers[observers.length - 1], true)
    expect(onVisible).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-JSCROLLTRIG-006: unmounting disconnects the observer', () => {
    const { unmount } = render(<ScrollTrigger onVisible={vi.fn()} loading={false} />)
    unmount()
    expect(observers[0].disconnect).toHaveBeenCalled()
  })

  it('FE-COMP-JSCROLLTRIG-007: a fresh callback identity alone does not rebuild the observer', () => {
    // Both callers hand in a new arrow every render; rebuilding for that churn
    // replays the initial callback and pulls pages nobody asked for.
    const { rerender } = render(<ScrollTrigger onVisible={vi.fn()} loading={false} />)
    expect(observers).toHaveLength(1)

    rerender(<ScrollTrigger onVisible={vi.fn()} loading={false} />)
    rerender(<ScrollTrigger onVisible={vi.fn()} loading={false} />)

    expect(observers).toHaveLength(1)
    expect(observers[0].disconnect).not.toHaveBeenCalled()
  })

  it('FE-COMP-JSCROLLTRIG-008: the surviving observer calls the newest callback, not the one it was built with', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<ScrollTrigger onVisible={first} loading={false} />)
    rerender(<ScrollTrigger onVisible={second} loading={false} />)

    intersect(observers[0], true)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-JSCROLLTRIG-009: a settled page really re-observes the sentinel', () => {
    // A browser observer only fires on a threshold crossing plus once per
    // observe(). A sentinel that never leaves the 200px margin therefore only
    // gets another callback because the loading flip rebuilds the observer, so
    // loading must stay a dependency rather than moving into a ref as well.
    const onVisible = vi.fn()
    const { rerender } = render(<ScrollTrigger onVisible={onVisible} loading />)
    expect(observers).toHaveLength(1)

    rerender(<ScrollTrigger onVisible={onVisible} loading={false} />)

    expect(observers).toHaveLength(2)
    expect(observers[0].disconnect).toHaveBeenCalled()
  })
})
