// FE-W4SNH-001 to FE-W4SNH-012
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '../../../tests/helpers/render'
import { useSystemNoticeStore, type SystemNoticeDTO } from '../../store/systemNoticeStore'

vi.mock('./SystemNoticeModal.js', () => ({
  ModalRenderer: ({ notices }: { notices: SystemNoticeDTO[] }) =>
    <div data-testid="modals">{notices.map(n => n.id).join(',')}</div>,
}))
vi.mock('./SystemNoticeBanner.js', () => ({
  BannerRenderer: ({ notices }: { notices: SystemNoticeDTO[] }) =>
    <div data-testid="banners">{notices.map(n => n.id).join(',')}</div>,
  ToastRenderer: ({ notices }: { notices: SystemNoticeDTO[] }) =>
    <div data-testid="toasts">{notices.map(n => n.id).join(',')}</div>,
}))

import { SystemNoticeHost } from './SystemNoticeHost'

function notice(overrides: Partial<SystemNoticeDTO> & { id: string }): SystemNoticeDTO {
  return {
    display: 'banner',
    severity: 'info',
    titleKey: 'Title',
    bodyKey: 'Body',
    dismissible: true,
    ...overrides,
  } as SystemNoticeDTO
}

let mqListeners: Array<(e: MediaQueryListEvent) => void> = []

function stubMatchMedia(matches: boolean, { supported = true } = {}) {
  mqListeners = []
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: supported
      ? vi.fn((query: string) => ({
          matches,
          media: query,
          addEventListener: (_ev: string, fn: (e: MediaQueryListEvent) => void) => { mqListeners.push(fn) },
          removeEventListener: (_ev: string, fn: (e: MediaQueryListEvent) => void) => {
            mqListeners = mqListeners.filter(l => l !== fn)
          },
        }))
      : undefined,
  })
}

beforeEach(() => {
  stubMatchMedia(false)
  useSystemNoticeStore.setState({ notices: [], loaded: true, fetching: false })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SystemNoticeHost', () => {
  it('FE-W4SNH-001: renders nothing until the store has loaded', () => {
    useSystemNoticeStore.setState({ notices: [], loaded: false, fetching: true })
    const { container } = render(<SystemNoticeHost />)

    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4SNH-002: triggers a cold-session fetch when nothing is loaded yet', () => {
    const fetch = vi.fn(async () => {})
    useSystemNoticeStore.setState({ notices: [], loaded: false, fetching: false, fetch })

    render(<SystemNoticeHost />)

    expect(fetch).toHaveBeenCalledOnce()
  })

  it('FE-W4SNH-003: does not refetch when authStore already loaded the notices', () => {
    const fetch = vi.fn(async () => {})
    useSystemNoticeStore.setState({ notices: [], loaded: true, fetching: false, fetch })

    render(<SystemNoticeHost />)

    expect(fetch).not.toHaveBeenCalled()
  })

  it('FE-W4SNH-004: routes each notice to the renderer matching its display', () => {
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [
        notice({ id: 'b1', display: 'banner' }),
        notice({ id: 'm1', display: 'modal' }),
        notice({ id: 't1', display: 'toast' }),
        notice({ id: 'b2', display: 'banner' }),
      ],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('banners')).toHaveTextContent('b1,b2')
    expect(screen.getByTestId('modals')).toHaveTextContent('m1')
    expect(screen.getByTestId('toasts')).toHaveTextContent('t1')
  })

  it('FE-W4SNH-005: hides desktopOnly notices on a mobile viewport', () => {
    stubMatchMedia(true)
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [
        notice({ id: 'thanks', display: 'modal', desktopOnly: true }),
        notice({ id: 'outage', display: 'modal' }),
      ],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toHaveTextContent('outage')
    expect(screen.getByTestId('modals')).not.toHaveTextContent('thanks')
  })

  it('FE-W4SNH-006: keeps desktopOnly notices on a desktop viewport', () => {
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({ id: 'thanks', display: 'modal', desktopOnly: true })],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toHaveTextContent('thanks')
  })

  it('FE-W4SNH-007: reacts to a viewport change reported by matchMedia', () => {
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({ id: 'thanks', display: 'modal', desktopOnly: true })],
    })

    render(<SystemNoticeHost />)
    expect(screen.getByTestId('modals')).toHaveTextContent('thanks')

    act(() => { mqListeners.forEach(fn => fn({ matches: true } as MediaQueryListEvent)) })

    expect(screen.getByTestId('modals')).toBeEmptyDOMElement()
  })

  it('FE-W4SNH-008: falls back to the desktop layout when matchMedia is unavailable', () => {
    stubMatchMedia(false, { supported: false })
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({ id: 'thanks', display: 'modal', desktopOnly: true })],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toHaveTextContent('thanks')
  })
  // The deploy window: the server already serves the new release notice, the browser is
  // still running the bundle the service worker cached, and the keys that notice names do
  // not exist in it. See hasCopy in SystemNoticeHost.
  it('FE-W4SNH-009: a notice made only of keys this build cannot resolve waits instead of showing them', () => {
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({
        id: 'release-notes',
        display: 'modal',
        titleKey: 'system_notice.release_notes.title',
        bodyKey: 'system_notice.release_notes.body',
      })],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toBeEmptyDOMElement()
  })

  it('FE-W4SNH-010: a release notice is judged by the strings its own layout draws', () => {
    // The release panel never shows the generic title and body, so a resolvable pair there
    // would vouch for a panel that is still all keys. The keys name a release this build
    // knows nothing about, which is exactly the position an old bundle is in.
    const release = {
      version: '5.0.0',
      eyebrowKey: 'system_notice.release_notes_5_0_0.eyebrow',
      headlineKey: 'system_notice.release_notes_5_0_0.headline',
      introKey: 'system_notice.release_notes_5_0_0.intro',
      featuresLabelKey: 'system_notice.release_notes_5_0_0.features_label',
      features: [],
      note: {
        eyebrowKey: 'system_notice.release_notes_5_0_0.note_eyebrow',
        titleKey: 'system_notice.release_notes_5_0_0.note_title',
        bodyKey: 'system_notice.release_notes_5_0_0.note_body',
        promiseLabelKey: 'system_notice.release_notes_5_0_0.promise_label',
        promiseLeadKey: 'system_notice.release_notes_5_0_0.promise_lead',
        promiseTextKey: 'system_notice.release_notes_5_0_0.promise_text',
        bodyAfterKey: 'system_notice.release_notes_5_0_0.note_body_after',
        closingKey: 'system_notice.release_notes_5_0_0.note_closing',
      },
      supportLeadKey: 'system_notice.release_notes_5_0_0.support_lead',
      supportTextKey: 'system_notice.release_notes_5_0_0.support_text',
    }
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({ id: 'release-notes', display: 'modal', titleKey: 'Update', bodyKey: 'Installed', release })],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toBeEmptyDOMElement()
  })

  it('FE-W4SNH-011: a notice written out in words is shown, keys or no keys', () => {
    // An instance's own announcement carries literal copy, and t() hands back anything it
    // does not know — so the shape of the string is what tells the two apart.
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({
        id: 'outage',
        display: 'modal',
        titleKey: 'Maintenance tonight',
        bodyKey: 'The server restarts at 22:00.',
      })],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toHaveTextContent('outage')
  })

  it('FE-W4SNH-012: one resolved string is enough to show the notice', () => {
    // Generous on purpose: half a translation is still readable, and a notice hidden by
    // mistake is the worse failure. 'common.save' is in every build.
    useSystemNoticeStore.setState({
      loaded: true,
      notices: [notice({
        id: 'half',
        display: 'modal',
        titleKey: 'common.save',
        bodyKey: 'system_notice.not.in.this.build',
      })],
    })

    render(<SystemNoticeHost />)

    expect(screen.getByTestId('modals')).toHaveTextContent('half')
  })
})
