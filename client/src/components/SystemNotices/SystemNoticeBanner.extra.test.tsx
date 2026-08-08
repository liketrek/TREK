// FE-W4SNB-001 to FE-W4SNB-029
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { useSystemNoticeStore, type SystemNoticeDTO } from '../../store/systemNoticeStore'
import { registerNoticeAction } from './noticeActions'
import { BannerRenderer, ToastRenderer } from './SystemNoticeBanner'

const navigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

function notice(overrides: Partial<SystemNoticeDTO> & { id: string }): SystemNoticeDTO {
  return {
    display: 'banner',
    severity: 'info',
    titleKey: 'Maintenance',
    bodyKey: 'Back at noon.',
    dismissible: true,
    ...overrides,
  } as SystemNoticeDTO
}

const dismiss = vi.fn()

let realMatchMedia: typeof window.matchMedia
let realRaf: typeof globalThis.requestAnimationFrame
let realResizeObserver: typeof globalThis.ResizeObserver

beforeEach(() => {
  navigate.mockClear()
  dismiss.mockClear()
  useSystemNoticeStore.setState({ notices: [], loaded: true, dismiss })
  window.__addToast = vi.fn(() => 1)
  realMatchMedia = window.matchMedia
  realRaf = globalThis.requestAnimationFrame
  realResizeObserver = globalThis.ResizeObserver
})

afterEach(() => {
  vi.restoreAllMocks()
  delete window.__addToast
  document.documentElement.style.removeProperty('--banner-stack-h')
  window.matchMedia = realMatchMedia
  globalThis.requestAnimationFrame = realRaf
  globalThis.ResizeObserver = realResizeObserver
})

describe('BannerRenderer', () => {
  it('FE-W4SNB-001: renders nothing without banners', () => {
    const { container } = render(<BannerRenderer notices={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4SNB-002: shows at most the two highest-priority banners', () => {
    render(<BannerRenderer notices={[notice({ id: 'a' }), notice({ id: 'b' }), notice({ id: 'c' })]} />)

    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  it('FE-W4SNB-003: a warn banner stays a polite status', () => {
    render(<BannerRenderer notices={[notice({ id: 'a', severity: 'warn' })]} />)
    const banner = screen.getByRole('status')

    expect(banner).toHaveAttribute('aria-live', 'polite')
    expect(banner.className).toContain('bg-amber-50')
  })

  it('FE-W4SNB-004: a critical banner is an assertive alert', () => {
    render(<BannerRenderer notices={[notice({ id: 'a', severity: 'critical' })]} />)
    const banner = screen.getByRole('alert')

    expect(banner).toHaveAttribute('aria-live', 'assertive')
    expect(banner.className).toContain('bg-rose-50')
  })

  it('FE-W4SNB-005: an unknown severity falls back to the info styling', () => {
    render(<BannerRenderer notices={[notice({ id: 'a', severity: 'weird' as SystemNoticeDTO['severity'] })]} />)

    expect(screen.getByRole('status').className).toContain('bg-white')
  })

  it('FE-W4SNB-006: hides the body when it repeats the title', () => {
    render(<BannerRenderer notices={[notice({ id: 'a', titleKey: 'Same', bodyKey: 'Same' })]} />)

    expect(screen.getAllByText('Same')).toHaveLength(1)
  })

  it('FE-W4SNB-007: the close button dismisses the notice', () => {
    render(<BannerRenderer notices={[notice({ id: 'a' })]} />)

    fireEvent.click(screen.getByLabelText('Dismiss: Maintenance'))

    expect(dismiss).toHaveBeenCalledWith('a')
  })

  it('FE-W4SNB-008: a non-dismissible banner has no close button', () => {
    render(<BannerRenderer notices={[notice({ id: 'a', dismissible: false })]} />)

    expect(screen.queryByLabelText(/^Dismiss:/)).toBeNull()
  })

  it('FE-W4SNB-009: a nav CTA routes in-app and dismisses the banner', () => {
    render(<BannerRenderer notices={[notice({ id: 'a', cta: { kind: 'nav', href: '/settings', labelKey: 'Open settings' } })]} />)

    fireEvent.click(screen.getByRole('link', { name: 'Open settings' }))

    expect(navigate).toHaveBeenCalledWith('/settings')
    expect(dismiss).toHaveBeenCalledWith('a')
  })

  it('FE-W4SNB-010: a nav CTA on a sticky banner does not dismiss it', () => {
    render(
      <BannerRenderer notices={[notice({ id: 'a', dismissible: false, cta: { kind: 'nav', href: '/settings', labelKey: 'Open settings' } })]} />,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Open settings' }))

    expect(navigate).toHaveBeenCalledWith('/settings')
    expect(dismiss).not.toHaveBeenCalled()
  })

  it('FE-W4SNB-011: a link CTA opens a hardened new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<BannerRenderer notices={[notice({ id: 'a', cta: { kind: 'link', href: 'https://trek.dev', labelKey: 'Read more' } })]} />)

    fireEvent.click(screen.getByRole('link', { name: 'Read more' }))

    expect(open).toHaveBeenCalledWith('https://trek.dev', '_blank', 'noopener,noreferrer')
    expect(dismiss).not.toHaveBeenCalled()
  })

  it('FE-W4SNB-012: an action CTA runs the registered handler and dismisses by default', () => {
    const handler = vi.fn(() => {})
    registerNoticeAction('open-support', handler)
    render(<BannerRenderer notices={[notice({ id: 'a', cta: { kind: 'action', actionId: 'open-support', labelKey: 'Support' } })]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Support' }))

    expect(handler).toHaveBeenCalledWith({ navigate })
    expect(dismiss).toHaveBeenCalledWith('a')
  })

  it('FE-W4SNB-013: an action CTA can opt out of dismissing', () => {
    registerNoticeAction('stay-open', () => {})
    render(
      <BannerRenderer notices={[notice({ id: 'a', cta: { kind: 'action', actionId: 'stay-open', labelKey: 'Support', dismissOnAction: false } })]} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Support' }))

    expect(dismiss).not.toHaveBeenCalled()
  })

  it('FE-W4SNB-014: resets the reported stack height on unmount', () => {
    const { unmount } = render(<BannerRenderer notices={[notice({ id: 'a' })]} />)

    unmount()

    expect(document.documentElement.style.getPropertyValue('--banner-stack-h')).toBe('0px')
  })

  it('FE-W4SNB-015: fades the banner in on the next frame', async () => {
    render(<BannerRenderer notices={[notice({ id: 'a' })]} />)
    expect(screen.getByRole('status').parentElement?.className).toContain('opacity-0')

    await waitFor(() => expect(screen.getByRole('status').parentElement?.className).toContain('opacity-100'))
  })

  it('FE-W4SNB-025: reduced motion drops the slide and fades only', () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    render(<BannerRenderer notices={[notice({ id: 'a' })]} />)

    expect(screen.getByRole('status').parentElement?.className).toContain('transition-opacity')
    expect(screen.getByRole('status').parentElement?.className).not.toContain('transition-all')
  })

  it('FE-W4SNB-026: a browser without matchMedia keeps the full transition', () => {
    ;(window as unknown as { matchMedia?: unknown }).matchMedia = undefined

    render(<BannerRenderer notices={[notice({ id: 'a' })]} />)

    expect(screen.getByRole('status').parentElement?.className).toContain('transition-all')
  })

  it('FE-W4SNB-027: without requestAnimationFrame the banner mounts already visible', () => {
    Reflect.deleteProperty(globalThis, 'requestAnimationFrame')

    render(<BannerRenderer notices={[notice({ id: 'a' })]} />)

    expect(screen.getByRole('status').parentElement?.className).toContain('opacity-100')
  })

  it('FE-W4SNB-028: publishes the measured stack height as a CSS variable', () => {
    let resize: ResizeObserverCallback | null = null
    class CapturingResizeObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      constructor(cb: ResizeObserverCallback) { resize = cb }
    }
    globalThis.ResizeObserver = CapturingResizeObserver as unknown as typeof globalThis.ResizeObserver

    render(<BannerRenderer notices={[notice({ id: 'a' })]} />)

    const stack = screen.getByRole('status').parentElement?.parentElement as HTMLElement
    Object.defineProperty(stack, 'offsetHeight', { configurable: true, value: 64 })

    act(() => {
      resize?.([], {} as ResizeObserver)
    })

    expect(document.documentElement.style.getPropertyValue('--banner-stack-h')).toBe('64px')
  })
})

describe('ToastRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('FE-W4SNB-016: fires an info toast joining title and body', () => {
    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast' })]} />)

    expect(window.__addToast).toHaveBeenCalledWith('Maintenance: Back at noon.', 'info', 6000)
  })

  it('FE-W4SNB-017: a warn toast uses the warning variant and a longer duration', () => {
    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast', severity: 'warn' })]} />)

    expect(window.__addToast).toHaveBeenCalledWith('Maintenance: Back at noon.', 'warning', 9000)
  })

  it('FE-W4SNB-018: uses the title alone when the body repeats it', () => {
    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast', titleKey: 'Same', bodyKey: 'Same' })]} />)

    expect(window.__addToast).toHaveBeenCalledWith('Same', 'info', 6000)
  })

  it('FE-W4SNB-019: dismisses the notice once the toast has run its course', () => {
    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast' })]} />)

    act(() => { vi.advanceTimersByTime(6500) })

    expect(dismiss).toHaveBeenCalledWith('t1')
  })

  it('FE-W4SNB-020: refuses a critical toast and dismisses it instead', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast', severity: 'critical' })]} />)

    expect(window.__addToast).not.toHaveBeenCalled()
    expect(dismiss).toHaveBeenCalledWith('t1')
    expect(String(warn.mock.calls[0][0])).toContain('t1')
  })

  it('FE-W4SNB-021: fires each notice only once across rerenders', () => {
    const notices = [notice({ id: 't1', display: 'toast' })]
    const { rerender } = render(<ToastRenderer notices={notices} />)

    rerender(<ToastRenderer notices={[...notices]} />)

    expect(window.__addToast).toHaveBeenCalledTimes(1)
  })

  it('FE-W4SNB-022: retries on the next frame while the toast host is not registered yet', () => {
    delete window.__addToast
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0)

    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast' })]} />)

    expect(raf).toHaveBeenCalled()
    expect(dismiss).not.toHaveBeenCalled()
  })

  it('FE-W4SNB-023: drops the toast after ten failed frames', () => {
    delete window.__addToast
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => { cb(0); return 0 })

    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast' })]} />)

    expect(String(warn.mock.calls[warn.mock.calls.length - 1][0])).toContain('never registered')
  })

  it('FE-W4SNB-029: an unmapped severity falls back to the info variant', () => {
    render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast', severity: 'legendary' as SystemNoticeDTO['severity'] })]} />)

    expect(window.__addToast).toHaveBeenCalledWith('Maintenance: Back at noon.', 'info', 6000)
  })

  it('FE-W4SNB-024: renders no DOM of its own', () => {
    const { container } = render(<ToastRenderer notices={[notice({ id: 't1', display: 'toast' })]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
