// FE-PLANNER-TRIPWARN-001 to FE-PLANNER-TRIPWARN-011
import { render, screen, fireEvent, waitFor, act } from '../../../tests/helpers/render';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { usePluginStore, type ActivePlugin } from '../../store/pluginStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import TripWarningsBanner from './TripWarningsBanner';

type Warning = { pluginId: string; level: 'info' | 'warning' | 'error'; message: string };

const plugin = (over: Partial<ActivePlugin> = {}): ActivePlugin => ({
  id: 'visa-check',
  name: 'Visa Check',
  type: 'trip-page',
  icon: null,
  ...over,
});

function warnings(...list: Warning[]) {
  server.use(http.get('/api/trip-warnings/1', () => HttpResponse.json({ warnings: list })));
}

/** The navbar slot the chip variant portals into; absent unless a test adds it. */
function mountNavSlot(): HTMLElement {
  const slot = document.createElement('div');
  slot.id = 'trek-nav-center-slot';
  document.body.appendChild(slot);
  return slot;
}

/** matchMedia is stubbed to matches:false globally — opt this component into desktop. */
function stubDesktop(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  const mql = {
    matches,
    media: '(min-width: 768px)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => { listeners.push(cb); }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
  window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
  return { mql, fire: (m: boolean) => listeners.forEach(cb => cb({ matches: m } as MediaQueryListEvent)) };
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  resetAllStores();
  window.matchMedia = originalMatchMedia;
  document.getElementById('trek-nav-center-slot')?.remove();
});

describe('TripWarningsBanner', () => {
  it('FE-PLANNER-TRIPWARN-001: renders nothing while there are no warnings', async () => {
    warnings();
    const { container } = render(<TripWarningsBanner tripId={1} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('FE-PLANNER-TRIPWARN-002: a warning from a non trip-page plugin floats in the planner', async () => {
    warnings({ pluginId: 'weather-guard', level: 'warning', message: 'Storm expected on day 3' });
    render(<TripWarningsBanner tripId={1} />);
    expect(await screen.findByText('Storm expected on day 3')).toBeInTheDocument();
  });

  it('FE-PLANNER-TRIPWARN-003: floating rows render one entry per warning', async () => {
    warnings(
      { pluginId: 'a', level: 'info', message: 'First note' },
      { pluginId: 'b', level: 'error', message: 'Second note' },
    );
    render(<TripWarningsBanner tripId={1} />);
    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('FE-PLANNER-TRIPWARN-004: an unknown level falls back to the warning style instead of crashing', async () => {
    warnings({ pluginId: 'a', level: 'critical' as unknown as Warning['level'], message: 'Odd level' });
    render(<TripWarningsBanner tripId={1} />);
    const row = (await screen.findByText('Odd level')).parentElement as HTMLElement;
    expect(row.style.background).toBe('var(--warning-soft)');
  });

  it('FE-PLANNER-TRIPWARN-005: a trip-page plugin warning becomes a navbar chip, not a floating row', async () => {
    const slot = mountNavSlot();
    stubDesktop(true);
    seedStore(usePluginStore, { plugins: [plugin()] });
    warnings({ pluginId: 'visa-check', level: 'error', message: 'Visa missing for Japan' });
    render(<TripWarningsBanner tripId={1} />);
    await waitFor(() => expect(slot.textContent).toContain('Visa missing for Japan'));
    expect(slot.querySelector('button')).not.toBeNull();
  });

  it('FE-PLANNER-TRIPWARN-006: clicking the chip opens the plugin tab', async () => {
    const slot = mountNavSlot();
    stubDesktop(true);
    const onOpenPluginTab = vi.fn();
    seedStore(usePluginStore, { plugins: [plugin()] });
    warnings({ pluginId: 'visa-check', level: 'warning', message: 'Visa missing' });
    render(<TripWarningsBanner tripId={1} onOpenPluginTab={onOpenPluginTab} />);
    await waitFor(() => expect(slot.querySelector('button')).not.toBeNull());
    fireEvent.click(slot.querySelector('button') as HTMLButtonElement);
    expect(onOpenPluginTab).toHaveBeenCalledWith('visa-check');
  });

  it('FE-PLANNER-TRIPWARN-007: without onOpenPluginTab the chip is inert', async () => {
    const slot = mountNavSlot();
    stubDesktop(true);
    seedStore(usePluginStore, { plugins: [plugin()] });
    warnings({ pluginId: 'visa-check', level: 'info', message: 'Visa reminder' });
    render(<TripWarningsBanner tripId={1} />);
    await waitFor(() => expect(slot.querySelector('button')).not.toBeNull());
    const chip = slot.querySelector('button') as HTMLButtonElement;
    expect(chip.style.cursor).toBe('default');
    fireEvent.click(chip);
    expect(chip).toBeInTheDocument();
  });

  it('FE-PLANNER-TRIPWARN-008: below the md breakpoint the same warning floats instead of becoming a chip', async () => {
    const slot = mountNavSlot();
    stubDesktop(false);
    seedStore(usePluginStore, { plugins: [plugin()] });
    warnings({ pluginId: 'visa-check', level: 'warning', message: 'Visa missing' });
    render(<TripWarningsBanner tripId={1} />);
    expect(await screen.findByText('Visa missing')).toBeInTheDocument();
    expect(slot.textContent).toBe('');
  });

  it('FE-PLANNER-TRIPWARN-009: a breakpoint change moves the warning into the navbar slot', async () => {
    const slot = mountNavSlot();
    const media = stubDesktop(false);
    seedStore(usePluginStore, { plugins: [plugin()] });
    warnings({ pluginId: 'visa-check', level: 'warning', message: 'Visa missing' });
    render(<TripWarningsBanner tripId={1} />);
    await screen.findByText('Visa missing');
    expect(slot.textContent).toBe('');
    act(() => { media.fire(true); });
    await waitFor(() => expect(slot.textContent).toContain('Visa missing'));
  });

  it('FE-PLANNER-TRIPWARN-010: a failing warnings request renders nothing', async () => {
    server.use(http.get('/api/trip-warnings/1', () => new HttpResponse(null, { status: 500 })));
    const { container } = render(<TripWarningsBanner tripId={1} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('FE-PLANNER-TRIPWARN-011: a non-finite tripId short-circuits without a request', async () => {
    let called = false;
    server.use(http.get('/api/trip-warnings/*', () => { called = true; return HttpResponse.json({ warnings: [] }); }));
    const { container } = render(<TripWarningsBanner tripId={Number.NaN} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(called).toBe(false);
  });
});
