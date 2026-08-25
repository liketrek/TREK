import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ComponentType, ReactNode } from 'react';
import { act } from '@testing-library/react';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useSystemNoticeStore } from '../../store/systemNoticeStore';
import { registerNoticeAction } from './noticeActions';
import { ModalRenderer } from './SystemNoticeModal';
import type { SystemNoticeDTO } from '../../store/systemNoticeStore';

const routerMocks = vi.hoisted(() => ({ navigate: vi.fn((_to: string) => {}) }));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => routerMocks.navigate };
});

// Flips isRtlLanguage on demand so the mirrored arrow-key / swipe branches can be
// driven without loading a real RTL locale bundle.
const i18nEnv = vi.hoisted(() => ({ rtl: false }));
vi.mock('../../i18n/index.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../../i18n/index')>();
  return {
    ...actual,
    isRtlLanguage: (lang: string) => i18nEnv.rtl || actual.isRtlLanguage(lang),
  };
});

interface MarkdownOverrideProps {
  href?: string;
  children?: ReactNode;
}
interface MarkdownOverrides {
  a: ComponentType<MarkdownOverrideProps>;
  p: ComponentType<MarkdownOverrideProps>;
  hr: ComponentType<MarkdownOverrideProps>;
  strong: ComponentType<MarkdownOverrideProps>;
  ul: ComponentType<MarkdownOverrideProps>;
  ol: ComponentType<MarkdownOverrideProps>;
}

// Body marker that makes the stub render the element overrides the modal hands to
// react-markdown (links, signature paragraphs, rule, lists) — they are ordinary
// components, so rendering them directly is the only way to reach them.
const MD_PROBE = '@@md-probe';

function MarkdownOverrideProbe({ c }: { c: MarkdownOverrides }) {
  return (
    <span data-testid="md-parts">
      <c.a href="https://trek.app/changelog">changelog</c.a>
      <c.p>{'— Maurice'}</c.p>
      <c.p>{['— Julien', <em key="mark">!</em>]}</c.p>
      <c.p>{'— a closing line that runs past the signature length limit'}</c.p>
      <c.p>{'a plain paragraph'}</c.p>
      <c.p>{[<em key="only">no string child</em>]}</c.p>
      <c.p><em>single element child</em></c.p>
      <c.hr />
      <c.strong>bold bit</c.strong>
      <c.ul><li>bullet</li></c.ul>
      <c.ol><li>numbered</li></c.ol>
    </span>
  );
}

// Stub react-markdown to avoid async chunk issues in tests
vi.mock('react-markdown', () => ({
  default: ({ children, components }: { children: string; components: MarkdownOverrides }) => (
    <span data-testid="md">
      {children}
      {children.includes(MD_PROBE) && <MarkdownOverrideProbe c={components} />}
    </span>
  ),
}));
vi.mock('remark-gfm', () => ({ default: () => ({}) }));
vi.mock('rehype-sanitize', () => ({ default: () => ({}) }));

interface MediaEnv {
  mobile?: boolean;
  reducedMotion?: boolean;
}

// Listeners the component registers on the (max-width: 639px) query, so a viewport
// change can be replayed from a test.
const mqChangeListeners: Array<(e: MediaQueryListEvent) => void> = [];

function stubMatchMedia({ mobile = false, reducedMotion = false }: MediaEnv = {}) {
  mqChangeListeners.length = 0;
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion')
      ? reducedMotion
      : query.includes('max-width')
        ? mobile
        : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
      mqChangeListeners.push(cb);
    },
    removeEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
      const at = mqChangeListeners.indexOf(cb);
      if (at >= 0) mqChangeListeners.splice(at, 1);
    },
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// The mobile sheet is [drag handle, clip [ strip [ prev, center, next ] ] ]
function sheetParts() {
  const sheet = screen.getByRole('dialog');
  const strip = sheet.children[1].children[0] as HTMLElement;
  return {
    sheet,
    strip,
    prevSlot: strip.children[0] as HTMLElement,
    centerSlot: strip.children[1] as HTMLElement,
    nextSlot: strip.children[2] as HTMLElement,
  };
}

function swipeHorizontally(sheet: HTMLElement, from: number, to: number) {
  const lockStep = from + (to > from ? 12 : -12);
  fireEvent.touchStart(sheet, { touches: [{ clientX: from, clientY: 200 }] });
  // below the 8px classification threshold — gesture stays unclassified
  fireEvent.touchMove(sheet, { touches: [{ clientX: from + 2, clientY: 200 }] });
  fireEvent.touchMove(sheet, { touches: [{ clientX: lockStep, clientY: 200 }] });
  fireEvent.touchMove(sheet, { touches: [{ clientX: to, clientY: 200 }] });
  fireEvent.touchEnd(sheet, { changedTouches: [{ clientX: to, clientY: 200 }] });
}

function dragVertically(sheet: HTMLElement, from: number, to: number) {
  const lockStep = from + (to > from ? 12 : -12);
  fireEvent.touchStart(sheet, { touches: [{ clientX: 200, clientY: from }] });
  fireEvent.touchMove(sheet, { touches: [{ clientX: 200, clientY: lockStep }] });
  fireEvent.touchMove(sheet, { touches: [{ clientX: 200, clientY: to }] });
  fireEvent.touchEnd(sheet, { changedTouches: [{ clientX: 200, clientY: to }] });
}

function makeNotice(overrides: Partial<SystemNoticeDTO> = {}): SystemNoticeDTO {
  return {
    id: 'test-notice-1',
    display: 'modal',
    severity: 'info',
    titleKey: 'Test Title',
    bodyKey: 'Test body text',
    dismissible: true,
    ...overrides,
  };
}

/**
 * Advance fake timers past the grace delay (2× rAF fallback → each is a
 * setTimeout(0), then 500ms).  All three timers fire in sequence with
 * runAllTimers() — no need to advance exact milliseconds.
 */
async function flushGraceDelay() {
  await act(async () => {
    vi.runAllTimers();
  });
}

describe('ModalRenderer', () => {
  let realMatchMedia: typeof window.matchMedia;
  let realRaf: typeof globalThis.requestAnimationFrame;

  beforeEach(() => {
    server.use(
      http.post('/api/system-notices/:id/dismiss', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );
    useSystemNoticeStore.setState({ notices: [], loaded: true });
    realMatchMedia = window.matchMedia;
    realRaf = globalThis.requestAnimationFrame;
    // jsdom has no Element.prototype.scrollTo; the mobile sheet resets slot scroll on paging
    Object.defineProperty(Element.prototype, 'scrollTo', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.style.overflow = '';
    window.matchMedia = realMatchMedia;
    globalThis.requestAnimationFrame = realRaf;
    i18nEnv.rtl = false;
    document.documentElement.classList.remove('dark');
  });

  it('FE-SN-MODAL-001: renders title and body after grace delay', async () => {
    const notice = makeNotice();
    render(<ModalRenderer notices={[notice]} />);

    // Before delay fires: dialog present but body not yet visible (class-based)
    expect(screen.getByRole('dialog')).toBeTruthy();

    await flushGraceDelay();

    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Test body text')).toBeTruthy();
  });

  it('FE-SN-MODAL-002: dismiss button calls store.dismiss(id)', async () => {
    const notice = makeNotice();
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });

    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');
    render(<ModalRenderer notices={[notice]} />);

    await flushGraceDelay();

    const dismissBtn = screen.getByLabelText('Dismiss');
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(dismissSpy).toHaveBeenCalledWith('test-notice-1');
  });

  it('FE-SN-MODAL-003: non-dismissible critical notice hides dismiss affordance', async () => {
    const notice = makeNotice({ severity: 'critical', dismissible: false });
    render(<ModalRenderer notices={[notice]} />);

    await flushGraceDelay();

    expect(screen.queryByLabelText('Dismiss')).toBeNull();
    expect(screen.queryByText('Not now')).toBeNull();
  });

  it('FE-SN-MODAL-004: ESC key does not close non-dismissible notice', async () => {
    const notice = makeNotice({ severity: 'critical', dismissible: false });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });

    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');
    render(<ModalRenderer notices={[notice]} />);

    await flushGraceDelay();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(dismissSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('FE-SN-MODAL-005: CTA nav button dismisses all notices (not just current)', async () => {
    // CTA is only shown on the last page; navigate there first
    const noticeA = makeNotice({ id: 'n-a', titleKey: 'Notice A' });
    const noticeB = makeNotice({ id: 'n-b', titleKey: 'Notice B', cta: { kind: 'nav', labelKey: 'Go to trips', href: '/trips' } });
    useSystemNoticeStore.setState({ notices: [noticeA, noticeB], loaded: true });

    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');
    render(<ModalRenderer notices={[noticeA, noticeB]} />);

    await flushGraceDelay();

    // Navigate to last page
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 2'));
    });
    await flushGraceDelay();

    const ctaBtn = screen.getByRole('button', { name: 'Go to trips' });
    await act(async () => {
      fireEvent.click(ctaBtn);
    });

    expect(dismissSpy).toHaveBeenCalledWith('n-a');
    expect(dismissSpy).toHaveBeenCalledWith('n-b');
    expect(dismissSpy).toHaveBeenCalledTimes(2);
  });

  it('FE-SN-MODAL-006: modal backdrop has opacity-0 class before grace delay fires', () => {
    const notice = makeNotice();
    const { container } = render(<ModalRenderer notices={[notice]} />);

    // Dialog is in DOM, backdrop has opacity-0 before timers fire
    expect(screen.getByRole('dialog')).toBeTruthy();
    const backdrop = container.querySelector('[role="presentation"]');
    expect(backdrop?.className).toContain('opacity-0');
  });

  it('FE-SN-MODAL-007: body params are interpolated before rendering', async () => {
    const notice = makeNotice({
      bodyKey: 'Hello {name}, welcome to {app}',
      bodyParams: { name: 'Alice', app: 'TREK' },
    });
    render(<ModalRenderer notices={[notice]} />);

    await flushGraceDelay();

    expect(screen.getByText('Hello Alice, welcome to TREK')).toBeTruthy();
  });

  it('FE-SN-MODAL-057: a body param is inserted literally, not as a replacement pattern', async () => {
    const notice = makeNotice({
      bodyKey: 'Version {version} is here',
      bodyParams: { version: '4.0.0 ($&)' },
    });
    render(<ModalRenderer notices={[notice]} />);

    await flushGraceDelay();

    expect(screen.getByText('Version 4.0.0 ($&) is here')).toBeTruthy();
  });

  it('FE-SN-MODAL-008: empty notices renders nothing', () => {
    const { container } = render(<ModalRenderer notices={[]} />);
    expect(container.firstChild).toBeNull();
  });

  // ── Multipage (pager) ──────────────────────────────────────────────────────

  it('FE-SN-MODAL-009: pager is hidden when only one notice is present', async () => {
    const notice = makeNotice();
    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    expect(screen.queryByLabelText('Previous notice')).toBeNull();
    expect(screen.queryByLabelText('Next notice')).toBeNull();
  });

  it('FE-SN-MODAL-010: pager shows counter and dots for multiple notices', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(screen.getByLabelText('Go to notice 1')).toBeTruthy();
    expect(screen.getByLabelText('Go to notice 2')).toBeTruthy();
    expect(screen.getByLabelText('Go to notice 3')).toBeTruthy();
    expect(screen.getByLabelText('Previous notice')).toBeTruthy();
    expect(screen.getByLabelText('Next notice')).toBeTruthy();
  });

  it('FE-SN-MODAL-011: next button advances to the next notice; prev returns', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(screen.getByText('Notice A')).toBeTruthy();

    // Navigate to page 2
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Next notice'));
    });
    await flushGraceDelay();

    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(screen.getByText('Notice B')).toBeTruthy();

    // Navigate back to page 1
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Previous notice'));
    });
    await flushGraceDelay();

    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(screen.getByText('Notice A')).toBeTruthy();
  });

  it('FE-SN-MODAL-012: ArrowRight / ArrowLeft keys navigate between pages', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    expect(screen.getByText('Notice A')).toBeTruthy();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });
    await flushGraceDelay();

    expect(screen.getByText('Notice B')).toBeTruthy();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });
    await flushGraceDelay();

    expect(screen.getByText('Notice A')).toBeTruthy();
  });

  it('FE-SN-MODAL-013: clicking a dot navigates directly to that page', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    expect(screen.getByText('Notice A')).toBeTruthy();

    // Click third dot
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 3'));
    });
    await flushGraceDelay();

    expect(screen.getByText('3 / 3')).toBeTruthy();
    expect(screen.getByText('Notice C')).toBeTruthy();
  });

  it('FE-SN-MODAL-014: non-dismissible notice locks the pager (prev/next/dots disabled)', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A', dismissible: false }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const prevBtn = screen.getByLabelText('Previous notice') as HTMLButtonElement;
    const nextBtn = screen.getByLabelText('Next notice') as HTMLButtonElement;
    const dot2 = screen.getByLabelText('Go to notice 2') as HTMLButtonElement;

    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(true);
    expect(dot2.disabled).toBe(true);

    // Arrow keys should also be blocked
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });
    // Still on page 1 (no grace delay needed because page didn't change)
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('FE-SN-MODAL-015: dismissing a notice does not skip the next one (regression)', async () => {
    const noticeA = makeNotice({ id: 'n-a', titleKey: 'Notice A' });
    const noticeB = makeNotice({ id: 'n-b', titleKey: 'Notice B' });
    const noticeC = makeNotice({ id: 'n-c', titleKey: 'Notice C' });

    useSystemNoticeStore.setState({ notices: [noticeA, noticeB, noticeC], loaded: true });
    const { rerender } = render(<ModalRenderer notices={[noticeA, noticeB, noticeC]} />);
    await flushGraceDelay();

    expect(screen.getByText('Notice A')).toBeTruthy();
    expect(screen.getByText('1 / 3')).toBeTruthy();

    // Navigate to last page where X button is available
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 3'));
    });
    await flushGraceDelay();

    // Dismiss all from last page — store shrinks
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Dismiss'));
      useSystemNoticeStore.setState({ notices: [], loaded: true });
      rerender(<ModalRenderer notices={[]} />);
    });
    await flushGraceDelay();

    // All dismissed — modal should be gone
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-SN-MODAL-017: X button dismisses all notices, not just the current one', async () => {
    const noticeA = makeNotice({ id: 'n-a', titleKey: 'Notice A' });
    const noticeB = makeNotice({ id: 'n-b', titleKey: 'Notice B' });
    useSystemNoticeStore.setState({ notices: [noticeA, noticeB], loaded: true });

    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');
    render(<ModalRenderer notices={[noticeA, noticeB]} />);
    await flushGraceDelay();

    // X button only appears on the last page — navigate there
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 2'));
    });
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Dismiss'));
    });

    expect(dismissSpy).toHaveBeenCalledWith('n-a');
    expect(dismissSpy).toHaveBeenCalledWith('n-b');
    expect(dismissSpy).toHaveBeenCalledTimes(2);
  });

  it('FE-SN-MODAL-018: ESC key dismisses all notices when on last page', async () => {
    const noticeA = makeNotice({ id: 'n-a', titleKey: 'Notice A' });
    const noticeB = makeNotice({ id: 'n-b', titleKey: 'Notice B' });
    useSystemNoticeStore.setState({ notices: [noticeA, noticeB], loaded: true });

    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');
    render(<ModalRenderer notices={[noticeA, noticeB]} />);
    await flushGraceDelay();

    // ESC only works on last page — navigate there first
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 2'));
    });
    await flushGraceDelay();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(dismissSpy).toHaveBeenCalledWith('n-a');
    expect(dismissSpy).toHaveBeenCalledWith('n-b');
    expect(dismissSpy).toHaveBeenCalledTimes(2);
  });

  it('FE-SN-MODAL-016: dismissing the only remaining notice closes the modal', async () => {
    const notice = makeNotice({ id: 'solo', titleKey: 'Solo Notice' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });

    const { rerender, container } = render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    expect(screen.getByText('Solo Notice')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Dismiss'));
      useSystemNoticeStore.setState({ notices: [], loaded: true });
      rerender(<ModalRenderer notices={[]} />);
    });

    expect(container.firstChild).toBeNull();
  });

  // ── Media / icons / highlights ─────────────────────────────────────────────

  it('FE-SN-MODAL-019: hero media replaces the severity bubble and hides itself on load error', async () => {
    const notice = makeNotice({
      media: { src: '/uploads/hero.png', altKey: 'Release hero', placement: 'hero', aspectRatio: '4/3' },
    });
    const { container } = render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const img = screen.getByAltText('Release hero') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/uploads/hero.png');
    expect((img.parentElement as HTMLElement).style.aspectRatio).toBe('4/3');
    // hero takes the place of the round severity icon
    expect(container.querySelector('.lucide-info')).toBeNull();

    await act(async () => {
      fireEvent.error(img);
    });

    expect(img.style.display).toBe('none');
  });

  it('FE-SN-MODAL-020: hero media falls back to 16/9 and swaps to the dark source', async () => {
    const notice = makeNotice({
      media: { src: '/uploads/light.png', srcDark: '/uploads/dark.png', altKey: 'Release hero' },
    });
    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const img = () => screen.getByAltText('Release hero') as HTMLImageElement;
    expect(img().getAttribute('src')).toBe('/uploads/light.png');
    expect((img().parentElement as HTMLElement).style.aspectRatio).toBe('16/9');

    await act(async () => {
      document.documentElement.classList.add('dark');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(img().getAttribute('src')).toBe('/uploads/dark.png');
  });

  it('FE-SN-MODAL-021: inline media renders below the body and honours its own ratio', async () => {
    const withRatio = makeNotice({
      id: 'inline-1',
      media: { src: '/uploads/inline.png', altKey: 'Inline shot', placement: 'inline', aspectRatio: '1/1' },
    });
    const withoutRatio = makeNotice({
      id: 'inline-2',
      media: { src: '/uploads/plain.png', srcDark: '/uploads/plain-dark.png', altKey: 'Plain shot', placement: 'inline' },
    });

    const { rerender } = render(<ModalRenderer notices={[withRatio]} />);
    await flushGraceDelay();

    const first = screen.getByAltText('Inline shot') as HTMLImageElement;
    expect((first.parentElement as HTMLElement).style.aspectRatio).toBe('1/1');
    await act(async () => {
      fireEvent.error(first);
    });
    expect(first.style.display).toBe('none');

    rerender(<ModalRenderer notices={[withoutRatio]} />);
    await flushGraceDelay();

    const second = screen.getByAltText('Plain shot') as HTMLImageElement;
    expect((second.parentElement as HTMLElement).style.aspectRatio).toBe('16/9');
    expect(second.getAttribute('src')).toBe('/uploads/plain.png');

    await act(async () => {
      document.documentElement.classList.add('dark');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect((screen.getByAltText('Plain shot') as HTMLImageElement).getAttribute('src')).toBe('/uploads/plain-dark.png');
  });

  it('FE-SN-MODAL-022: the Heart notice gets the gradient header instead of a plain title', async () => {
    const heartOnly = makeNotice({ id: 'heart-1', icon: 'Heart', titleKey: 'Thank you' });
    const heartWithMedia = makeNotice({
      id: 'heart-2',
      icon: 'Heart',
      titleKey: 'Thank you again',
      media: { src: '/uploads/heart.png', altKey: 'Heart hero' },
    });

    const { container, rerender } = render(<ModalRenderer notices={[heartOnly]} />);
    await flushGraceDelay();

    const heading = screen.getByText('Thank you');
    expect(heading.tagName).toBe('H2');
    expect((heading.parentElement as HTMLElement).className).toContain('bg-gradient-to-br');
    // no round severity bubble next to the gradient header
    expect(container.querySelector('.lucide-info')).toBeNull();

    // With a hero image the gradient header is dropped and the plain title returns
    rerender(<ModalRenderer notices={[heartWithMedia]} />);
    await flushGraceDelay();

    const plainHeading = screen.getByText('Thank you again');
    expect((plainHeading.parentElement as HTMLElement).className).not.toContain('bg-gradient-to-br');
    expect(screen.getByAltText('Heart hero')).toBeTruthy();
  });

  it('FE-SN-MODAL-023: a named lucide icon overrides the severity icon, unknown names fall back', async () => {
    const known = makeNotice({ id: 'icon-1', icon: 'Rocket' });
    const unknown = makeNotice({ id: 'icon-2', icon: 'ThisIconDoesNotExist' });

    const { container, rerender } = render(<ModalRenderer notices={[known]} />);
    await flushGraceDelay();

    expect(container.querySelector('.lucide-rocket')).not.toBeNull();
    expect(container.querySelector('.lucide-info')).toBeNull();

    rerender(<ModalRenderer notices={[unknown]} />);
    await flushGraceDelay();

    expect(container.querySelector('.lucide-info')).not.toBeNull();
  });

  it('FE-SN-MODAL-024: an unknown severity falls back to the info icon and drops the accent tint', async () => {
    const notice = makeNotice({ severity: 'obscure' as SystemNoticeDTO['severity'] });
    const { container } = render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const icon = container.querySelector('.lucide-info');
    expect(icon).not.toBeNull();
    const bubble = (icon as SVGElement).parentElement as HTMLElement;
    expect(bubble.className).toContain('rounded-full');
    expect(bubble.className).not.toContain('bg-blue-50');
  });

  it('FE-SN-MODAL-025: highlights render their lucide icon and fall back to a check mark', async () => {
    const notice = makeNotice({
      highlights: [
        { labelKey: 'Faster maps', iconName: 'Zap' },
        { labelKey: 'No icon given' },
        { labelKey: 'Unknown icon', iconName: 'NopeIcon' },
      ],
    });
    const { container } = render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    expect(screen.getByText('Faster maps')).toBeTruthy();
    expect(screen.getByText('No icon given')).toBeTruthy();
    expect(screen.getByText('Unknown icon')).toBeTruthy();
    expect(container.querySelector('.lucide-zap')).not.toBeNull();
    expect(screen.getAllByText('✓')).toHaveLength(2);
  });

  it('FE-SN-MODAL-026: markdown overrides style links, signatures, rules and lists', async () => {
    const notice = makeNotice({ bodyKey: `Release notes ${MD_PROBE}` });
    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const parts = screen.getByTestId('md-parts');

    const link = parts.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://trek.app/changelog');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');

    const paragraphs = Array.from(parts.querySelectorAll('p'));
    // short em-dash lines are signatures, everything else is a normal paragraph
    expect(paragraphs[0].className).toContain('italic');
    expect(paragraphs[1].className).toContain('italic');
    expect(paragraphs[2].className).not.toContain('italic');
    expect(paragraphs[3].className).not.toContain('italic');
    expect(paragraphs[4].className).not.toContain('italic');
    expect(paragraphs[5].className).not.toContain('italic');

    expect(parts.textContent).toContain('♡');
    expect((parts.querySelector('strong') as HTMLElement).className).toContain('font-semibold');
    expect((parts.querySelector('ul') as HTMLElement).className).toContain('list-disc');
    expect((parts.querySelector('ol') as HTMLElement).className).toContain('list-decimal');
  });

  // ── CTAs ───────────────────────────────────────────────────────────────────

  it('FE-SN-MODAL-027: link CTAs open a new tab and leave the notice open', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const notice = makeNotice({
      cta: { kind: 'link', href: 'https://example.com/support', labelKey: 'Support us' },
      secondaryCta: { kind: 'link', href: 'https://example.org/tip', labelKey: 'Tip us' },
    });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    const { container } = render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const primary = screen.getByRole('button', { name: 'Support us' });
    expect(primary.className).toContain('bg-[#FFDD00]');
    // unbranded links get the generic coffee glyph, not a brand mark
    expect(container.querySelector('.lucide-coffee')).not.toBeNull();

    await act(async () => {
      fireEvent.click(primary);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tip us' }));
    });

    expect(open).toHaveBeenNthCalledWith(1, 'https://example.com/support', '_blank', 'noopener,noreferrer');
    expect(open).toHaveBeenNthCalledWith(2, 'https://example.org/tip', '_blank', 'noopener,noreferrer');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-028: Buy Me a Coffee and Ko-fi links carry their own brand mark', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    const notice = makeNotice({
      id: 'brands',
      cta: { kind: 'link', href: 'https://buymeacoffee.com/trek', labelKey: 'Buy me a coffee' },
      secondaryCta: { kind: 'link', href: 'https://ko-fi.com/trek', labelKey: 'Ko-fi' },
    });
    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const primary = document.getElementById('notice-cta-brands') as HTMLElement;
    const secondary = document.getElementById('notice-cta2-brands') as HTMLElement;

    expect((primary.querySelector('path') as SVGPathElement).getAttribute('d')).toContain('M20.216');
    expect(secondary.className).toContain('bg-[#FF5E5B]');
    expect((secondary.querySelector('path') as SVGPathElement).getAttribute('d')).toContain('M11.351');
  });

  it('FE-SN-MODAL-029: a "kofi" link without the ko-fi.com host still resolves to the Ko-fi mark', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    const notice = makeNotice({
      id: 'kofi-alt',
      cta: { kind: 'link', href: 'https://kofi.example/trek', labelKey: 'Ko-fi' },
    });
    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const primary = document.getElementById('notice-cta-kofi-alt') as HTMLElement;
    expect((primary.querySelector('path') as SVGPathElement).getAttribute('d')).toContain('M11.351');
  });

  it('FE-SN-MODAL-030: a nav CTA on a non-dismissible notice navigates without dismissing', async () => {
    const notice = makeNotice({
      dismissible: false,
      cta: { kind: 'nav', href: '/settings', labelKey: 'Open settings' },
    });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    });

    expect(routerMocks.navigate).toHaveBeenCalledWith('/settings');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-031: an action CTA runs the registered handler and dismisses by default', async () => {
    const handler = vi.fn(() => {});
    registerNoticeAction('modal-open-support', handler);
    const notice = makeNotice({
      cta: { kind: 'action', actionId: 'modal-open-support', labelKey: 'Run it' },
    });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
    });

    expect(handler).toHaveBeenCalledWith({ navigate: routerMocks.navigate });
    expect(dismissSpy).toHaveBeenCalledWith('test-notice-1');
  });

  it('FE-SN-MODAL-032: a secondary action CTA can opt out of dismissing', async () => {
    const handler = vi.fn(() => {});
    registerNoticeAction('modal-stay-open', handler);
    const notice = makeNotice({
      id: 'secondary-action',
      cta: { kind: 'nav', href: '/trips', labelKey: 'Go' },
      secondaryCta: {
        kind: 'action',
        actionId: 'modal-stay-open',
        labelKey: 'Later',
        dismissOnAction: false,
      },
    });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const secondary = document.getElementById('notice-cta2-secondary-action') as HTMLElement;
    expect(secondary.className).toContain('bg-blue-600');

    await act(async () => {
      fireEvent.click(secondary);
    });

    expect(handler).toHaveBeenCalledWith({ navigate: routerMocks.navigate });
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  // ── Pager edge cases ───────────────────────────────────────────────────────

  it('FE-SN-MODAL-033: ArrowLeft on the first page stays put', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });

    expect(screen.getByText('1 / 2')).toBeTruthy();
    // unrelated keys are ignored outright
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowUp' });
    });
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('FE-SN-MODAL-034: clicking the dot of the current page is a no-op', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 1'));
    });

    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('Notice A')).toBeTruthy();
  });

  it('FE-SN-MODAL-035: a locked pager ignores its enabled current dot', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A', dismissible: false }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const currentDot = screen.getByLabelText('Go to notice 1') as HTMLButtonElement;
    expect(currentDot.disabled).toBe(false);
    expect(currentDot.getAttribute('aria-current')).toBe('true');

    await act(async () => {
      fireEvent.click(currentDot);
    });

    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('FE-SN-MODAL-036: jumping backwards announces the new position', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 3'));
    });
    await flushGraceDelay();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 1'));
    });
    await flushGraceDelay();

    expect(screen.getByText('Notice A')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Notice 1 of 3');
  });

  it('FE-SN-MODAL-037: the page index clamps when the notice list shrinks', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    const { rerender } = render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Go to notice 3'));
    });
    await flushGraceDelay();
    expect(screen.getByText('Notice C')).toBeTruthy();

    await act(async () => {
      rerender(<ModalRenderer notices={[notices[0]]} />);
    });
    await flushGraceDelay();

    expect(screen.getByText('Notice A')).toBeTruthy();
    expect(screen.queryByText('Notice C')).toBeNull();
  });

  it('FE-SN-MODAL-038: the page slide clears its inline transform once the transition ends', async () => {
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const wrapper = screen.getByRole('dialog').firstElementChild as HTMLElement;

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Next notice'));
    });
    await flushGraceDelay();

    expect(wrapper.style.transition).toContain('260ms');
    expect(wrapper.style.transform).not.toBe('');

    await act(async () => {
      fireEvent.transitionEnd(wrapper);
    });

    expect(wrapper.style.transition).toBe('');
    expect(wrapper.style.transform).toBe('');
  });

  it('FE-SN-MODAL-039: RTL layouts mirror the arrow keys', async () => {
    i18nEnv.rtl = true;
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });
    await flushGraceDelay();

    expect(screen.getByText('Notice B')).toBeTruthy();
  });

  // ── Environment ────────────────────────────────────────────────────────────

  it('FE-SN-MODAL-040: reduced motion swaps to the short fade and skips the slide transform', async () => {
    stubMatchMedia({ reducedMotion: true });
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('duration-[120ms]');
    expect(dialog.className).toContain('opacity-0');
    expect(dialog.className).not.toContain('scale-[0.97]');

    await flushGraceDelay();
    expect(screen.getByRole('dialog').className).toContain('opacity-100');

    const wrapper = screen.getByRole('dialog').firstElementChild as HTMLElement;
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Next notice'));
    });
    await flushGraceDelay();

    expect(screen.getByText('Notice B')).toBeTruthy();
    expect(wrapper.style.transform).toBe('');
  });

  it('FE-SN-MODAL-041: a browser without matchMedia still renders the desktop modal', async () => {
    (window as unknown as { matchMedia?: unknown }).matchMedia = undefined;
    render(<ModalRenderer notices={[makeNotice()]} />);
    await flushGraceDelay();

    expect(screen.getByRole('dialog').className).toContain('rounded-2xl');
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('FE-SN-MODAL-042: without requestAnimationFrame the grace delay falls back to timeouts', async () => {
    Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
    render(<ModalRenderer notices={[makeNotice()]} />);

    expect(screen.getByRole('dialog').className).toContain('opacity-0');
    await flushGraceDelay();

    expect(screen.getByRole('dialog').className).toContain('opacity-100');
  });

  it('FE-SN-MODAL-043: a viewport change swaps the desktop modal for the bottom sheet', async () => {
    stubMatchMedia({ mobile: false });
    render(<ModalRenderer notices={[makeNotice()]} />);
    await flushGraceDelay();

    expect(screen.getByRole('dialog').className).toContain('rounded-2xl');

    await act(async () => {
      mqChangeListeners.forEach(cb => cb({ matches: true } as MediaQueryListEvent));
    });

    expect(screen.getByRole('dialog').className).toContain('rounded-t-3xl');
  });

  // ── Mobile bottom sheet ────────────────────────────────────────────────────

  it('FE-SN-MODAL-044: the sheet keeps the neighbouring notices in its side slots', async () => {
    stubMatchMedia({ mobile: true });
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const { prevSlot, centerSlot, nextSlot } = sheetParts();
    expect(prevSlot.textContent).toBe('');
    expect(centerSlot.textContent).toContain('Notice A');
    expect(nextSlot.textContent).toContain('Notice B');
  });

  it('FE-SN-MODAL-045: tapping the backdrop animates the sheet out before dismissing', async () => {
    stubMatchMedia({ mobile: true });
    const noticeA = makeNotice({ id: 'n-a', titleKey: 'Notice A' });
    const noticeB = makeNotice({ id: 'n-b', titleKey: 'Notice B' });
    useSystemNoticeStore.setState({ notices: [noticeA, noticeB], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[noticeA, noticeB]} />);
    await flushGraceDelay();

    const backdrop = screen.getAllByRole('presentation')[1] as HTMLElement;
    await act(async () => {
      fireEvent.click(backdrop);
    });

    const { sheet } = sheetParts();
    expect(sheet.style.transform).toBe('translateY(110%)');
    expect(dismissSpy).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.transitionEnd(sheet);
    });

    expect(dismissSpy).toHaveBeenCalledWith('n-a');
    expect(dismissSpy).toHaveBeenCalledWith('n-b');
  });

  it('FE-SN-MODAL-046: with reduced motion the backdrop tap dismisses straight away', async () => {
    stubMatchMedia({ mobile: true, reducedMotion: true });
    const notice = makeNotice({ id: 'n-a' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    expect(screen.getByRole('dialog').className).toContain('opacity-100');

    await act(async () => {
      fireEvent.click(screen.getAllByRole('presentation')[1] as HTMLElement);
    });

    expect(dismissSpy).toHaveBeenCalledWith('n-a');
  });

  it('FE-SN-MODAL-047: horizontal swipes page forward and back', async () => {
    stubMatchMedia({ mobile: true });
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const { sheet, strip } = sheetParts();

    await act(async () => {
      swipeHorizontally(sheet, 250, 120);
    });
    expect(strip.style.transform).toBe('translateX(-66.666%)');

    await act(async () => {
      fireEvent.transitionEnd(strip);
    });
    await flushGraceDelay();

    expect(sheetParts().centerSlot.textContent).toContain('Notice B');
    expect(sheetParts().prevSlot.textContent).toContain('Notice A');
    expect(strip.style.transform).toBe('translateX(-33.333%)');

    await act(async () => {
      swipeHorizontally(sheet, 120, 250);
    });
    expect(strip.style.transform).toBe('translateX(0%)');

    await act(async () => {
      fireEvent.transitionEnd(strip);
    });
    await flushGraceDelay();

    expect(sheetParts().centerSlot.textContent).toContain('Notice A');
  });

  it('FE-SN-MODAL-048: a swipe short of the threshold springs back to the current page', async () => {
    stubMatchMedia({ mobile: true });
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const { sheet, strip } = sheetParts();

    await act(async () => {
      swipeHorizontally(sheet, 200, 180);
    });
    expect(strip.style.transform).toBe('translateX(-33.333%)');

    await act(async () => {
      fireEvent.transitionEnd(strip);
    });

    expect(strip.style.transition).toBe('');
    expect(sheetParts().centerSlot.textContent).toContain('Notice A');

    // a move without a preceding touchstart is ignored
    await act(async () => {
      fireEvent.touchMove(sheet, { touches: [{ clientX: 40, clientY: 200 }] });
    });
    expect(sheetParts().centerSlot.textContent).toContain('Notice A');
  });

  it('FE-SN-MODAL-049: RTL swipes are mirrored', async () => {
    i18nEnv.rtl = true;
    stubMatchMedia({ mobile: true });
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    const { sheet, strip } = sheetParts();
    await act(async () => {
      swipeHorizontally(sheet, 120, 250);
    });
    expect(strip.style.transform).toBe('translateX(-66.666%)');

    await act(async () => {
      fireEvent.transitionEnd(strip);
    });
    await flushGraceDelay();

    expect(sheetParts().centerSlot.textContent).toContain('Notice B');
  });

  it('FE-SN-MODAL-050: dragging the sheet down past the threshold dismisses it', async () => {
    stubMatchMedia({ mobile: true });
    const notice = makeNotice({ id: 'n-a' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const { sheet } = sheetParts();
    await act(async () => {
      dragVertically(sheet, 100, 220);
    });

    expect(sheet.style.transform).toBe('translateY(110%)');

    await act(async () => {
      fireEvent.transitionEnd(sheet);
    });

    expect(dismissSpy).toHaveBeenCalledWith('n-a');
  });

  it('FE-SN-MODAL-051: a short downward drag springs the sheet back', async () => {
    stubMatchMedia({ mobile: true });
    const notice = makeNotice({ id: 'n-a' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const { sheet } = sheetParts();
    await act(async () => {
      dragVertically(sheet, 100, 140);
    });

    expect(sheet.style.transform).toBe('translateY(0)');

    await act(async () => {
      fireEvent.transitionEnd(sheet);
    });

    expect(sheet.style.transform).toBe('');
    expect(sheet.style.transition).toBe('');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-052: an upward drag never moves the sheet', async () => {
    stubMatchMedia({ mobile: true });
    const notice = makeNotice({ id: 'n-a' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const { sheet } = sheetParts();
    await act(async () => {
      dragVertically(sheet, 220, 100);
    });

    expect(sheet.style.transform).toBe('');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-053: a sheet scrolled into its content does not drag away', async () => {
    stubMatchMedia({ mobile: true });
    const notice = makeNotice({ id: 'n-a' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const { sheet, centerSlot } = sheetParts();
    Object.defineProperty(centerSlot, 'scrollTop', { configurable: true, value: 150 });

    await act(async () => {
      dragVertically(sheet, 100, 260);
    });

    expect(sheet.style.transform).toBe('');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-054: reduced motion disables sheet dragging entirely', async () => {
    stubMatchMedia({ mobile: true, reducedMotion: true });
    const notice = makeNotice({ id: 'n-a' });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    const { sheet } = sheetParts();
    await act(async () => {
      dragVertically(sheet, 100, 260);
    });

    expect(sheet.style.transform).toBe('');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-055: a non-dismissible sheet ignores the backdrop tap and the drag', async () => {
    stubMatchMedia({ mobile: true });
    const notice = makeNotice({ id: 'n-a', dismissible: false });
    useSystemNoticeStore.setState({ notices: [notice], loaded: true });
    const dismissSpy = vi.spyOn(useSystemNoticeStore.getState(), 'dismiss');

    render(<ModalRenderer notices={[notice]} />);
    await flushGraceDelay();

    await act(async () => {
      fireEvent.click(screen.getAllByRole('presentation')[1] as HTMLElement);
    });
    expect(dismissSpy).not.toHaveBeenCalled();

    const { sheet } = sheetParts();
    await act(async () => {
      dragVertically(sheet, 100, 260);
    });

    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('FE-SN-MODAL-056: the side slots are inert previews, and their pagers cannot page past the ends', async () => {
    stubMatchMedia({ mobile: true });
    const notices = [
      makeNotice({ id: 'n1', titleKey: 'Notice A' }),
      makeNotice({ id: 'n2', titleKey: 'Notice B' }),
      makeNotice({ id: 'n3', titleKey: 'Notice C' }),
    ];
    render(<ModalRenderer notices={notices} />);
    await flushGraceDelay();

    // the side slots carry a second copy of the pager and title, so they are
    // kept out of the a11y tree and the tab order
    const { prevSlot, nextSlot } = sheetParts();
    expect(prevSlot.hasAttribute('inert')).toBe(true);
    expect(prevSlot.getAttribute('aria-hidden')).toBe('true');
    expect(nextSlot.hasAttribute('inert')).toBe(true);
    expect(nextSlot.getAttribute('aria-hidden')).toBe('true');

    // the next slot renders page 2's pager, whose "previous" button is enabled —
    // pressing it must not move the sheet below the first page
    const prevButtons = screen.getAllByLabelText('Previous notice') as HTMLButtonElement[];
    const enabledPrev = prevButtons.find(b => !b.disabled) as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(enabledPrev);
    });
    await flushGraceDelay();
    expect(sheetParts().centerSlot.textContent).toContain('Notice A');

    // walk to the last page, then press the previous slot's enabled "next"
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });
    await flushGraceDelay();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });
    await flushGraceDelay();
    expect(sheetParts().centerSlot.textContent).toContain('Notice C');

    const nextButtons = screen.getAllByLabelText('Next notice') as HTMLButtonElement[];
    const enabledNext = nextButtons.find(b => !b.disabled) as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(enabledNext);
    });
    await flushGraceDelay();

    expect(sheetParts().centerSlot.textContent).toContain('Notice C');
  });
});
