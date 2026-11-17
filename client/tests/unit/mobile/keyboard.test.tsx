import { useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findShortcut,
  isTypingTarget,
  matchesShortcut,
  toNativeCommand,
  useShortcutRegistry,
  type Shortcut,
} from '../../../src/mobile/keyboard/shortcuts';
import { useShortcuts } from '../../../src/mobile/keyboard/useShortcuts';
import { useAddonStore } from '../../../src/store/addonStore';
import { usePluginStore } from '../../../src/store/pluginStore';
import { act, fireEvent, render, screen, waitFor } from '../../helpers/render';

// FE-MOB-KEYS-001 onwards

const native = vi.hoisted(() => ({
  app: false,
  ios: false,
  features: [] as string[],
  setKeyCommands: vi.fn(() => Promise.resolve()),
  listener: null as null | ((p: { id: string }) => void),
}));

vi.mock('../../../src/native/platform', () => ({
  isNativeApp: () => native.app,
  isNativeIos: () => native.app && native.ios,
  isNativeAndroid: () => native.app && !native.ios,
  nativeServerHost: () => null,
}));
vi.mock('../../../src/native/capabilities', () => ({
  useNativeCapabilities: () => ({
    caps: { shellApi: 2, platform: 'ios', appVersion: '', build: '', features: native.features },
    updateRequired: false,
  }),
}));
vi.mock('../../../src/native/trekShell', () => ({
  TrekShell: {
    setKeyCommands: native.setKeyCommands,
    addListener: vi.fn((_event: string, fn: (p: { id: string }) => void) => {
      native.listener = fn;
      return Promise.resolve({ remove: () => Promise.resolve() });
    }),
  },
}));

import MSheet from '../../../src/mobile/components/MSheet';
import MKeyboardHost from '../../../src/mobile/keyboard/MKeyboardHost';
import MShellShortcuts from '../../../src/mobile/keyboard/MShellShortcuts';
import { _resetOverlayStack } from '../../../src/mobile/overlayStack';

/** The iPad app; without the keyCommands feature (an older binary) the page answers every key. */
function asIpadApp(features: string[] = []) {
  native.app = true;
  native.ios = true;
  native.features = features;
}

const key = (k: string, mods: Partial<KeyboardEvent> = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe('shortcut matching', () => {
  const save: Shortcut = { id: 's', title: 'Save', key: 's', mod: true, run: () => {} };
  const sidebar: Shortcut = { id: 'p', title: 'Sidebar', key: 's', ctrl: true, run: () => {} };
  const next: Shortcut = { id: 'n', title: 'Next', key: 'ArrowRight', alt: true, run: () => {} };

  it("FE-MOB-KEYS-001: the command key is the platform's own, the rest must match exactly", () => {
    expect(matchesShortcut(key('s', { metaKey: true }), save)).toBe(true);
    expect(matchesShortcut(key('S', { metaKey: true }), save)).toBe(true);
    // On an Apple keyboard Ctrl is not ⌘: Ctrl+N in a text field moves the caret.
    expect(matchesShortcut(key('s', { ctrlKey: true }), save)).toBe(false);
    expect(matchesShortcut(key('s', { metaKey: true, ctrlKey: true }), save)).toBe(false);
    // Elsewhere (Android) Ctrl is the command key and the Meta key is not.
    expect(matchesShortcut(key('s', { ctrlKey: true }), save, false)).toBe(true);
    expect(matchesShortcut(key('s', { metaKey: true }), save, false)).toBe(false);
    expect(matchesShortcut(key('s'), save)).toBe(false);
    expect(matchesShortcut(key('s', { metaKey: true, shiftKey: true }), save)).toBe(false);
    expect(matchesShortcut(key('s', { metaKey: true, ctrlKey: true }), sidebar)).toBe(true);
    expect(matchesShortcut(key('s', { metaKey: true }), sidebar)).toBe(false);
    expect(matchesShortcut(key('ArrowRight', { altKey: true }), next)).toBe(true);
  });

  it('FE-MOB-KEYS-011: a digit shortcut finds its key on a French keyboard too', () => {
    const first: Shortcut = { id: 'one', title: 'One', key: '1', mod: true, run: () => {} };
    // AZERTY types '&' on the 1 key without Shift; the key's place is still Digit1.
    expect(matchesShortcut({ ...key('&', { metaKey: true }), code: 'Digit1' }, first)).toBe(true);
    expect(matchesShortcut({ ...key('é', { metaKey: true }), code: 'Digit2' }, first)).toBe(false);
    expect(matchesShortcut({ ...key('1', { metaKey: true }), code: 'Numpad1' }, first)).toBe(true);
  });

  it('FE-MOB-KEYS-002: a field keeps its own keys, except the ones with ⌘', () => {
    const field = document.createElement('input');
    expect(isTypingTarget(field)).toBe(true);
    expect(isTypingTarget(document.body)).toBe(false);
    expect(findShortcut({ ...key('ArrowRight', { altKey: true }), target: field }, [[next]])).toBeNull();
    expect(findShortcut({ ...key('s', { metaKey: true }), target: field }, [[save]])).toBe(save);
  });

  it("FE-MOB-KEYS-003: a later list wins, so a trip's shortcut goes before the shell's", () => {
    const shell: Shortcut = { ...save, id: 'shell' };
    const trip: Shortcut = { ...save, id: 'trip' };
    expect(findShortcut({ ...key('s', { metaKey: true }), target: document.body }, [[shell], [trip]])).toBe(trip);
  });

  it('FE-MOB-KEYS-004: a shortcut becomes a native key command under an id unique across screens', () => {
    expect(toNativeCommand('trip', next)).toEqual({
      id: 'trip:n',
      title: 'Next',
      input: 'right',
      modifiers: ['option'],
    });
    expect(toNativeCommand('shell', sidebar)).toEqual({
      id: 'shell:p',
      title: 'Sidebar',
      input: 's',
      modifiers: ['command', 'control'],
    });
  });
});

function Probe({ owner, shortcuts }: { owner: string; shortcuts: Shortcut[] }) {
  useShortcuts(owner, shortcuts);
  return null;
}

function LocationEcho() {
  const location = useLocation();
  return <span data-testid="loc">{location.pathname + location.search}</span>;
}

describe('MKeyboardHost', () => {
  beforeEach(() => {
    native.app = false;
    native.ios = false;
    native.features = [];
    native.setKeyCommands.mockClear();
    native.listener = null;
    useShortcutRegistry.setState({ lists: [] });
    _resetOverlayStack();
  });
  afterEach(() => useShortcutRegistry.setState({ lists: [] }));

  it('FE-MOB-KEYS-005: in the app the page answers the keys and runs the newest handler', () => {
    asIpadApp();
    const first = vi.fn();
    const second = vi.fn();
    const shortcut = (run: () => void): Shortcut[] => [{ id: 'go', title: 'Go', key: '1', mod: true, run }];
    const { rerender } = render(
      <>
        <MKeyboardHost />
        <Probe owner="a" shortcuts={shortcut(first)} />
      </>
    );
    rerender(
      <>
        <MKeyboardHost />
        <Probe owner="a" shortcuts={shortcut(second)} />
      </>
    );

    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(native.setKeyCommands).not.toHaveBeenCalled();
  });

  it('FE-MOB-KEYS-006: a screen that goes away takes its shortcuts with it', () => {
    asIpadApp();
    const run = vi.fn();
    const { rerender } = render(
      <>
        <MKeyboardHost />
        <Probe owner="a" shortcuts={[{ id: 'go', title: 'Go', key: '1', mod: true, run }]} />
      </>
    );
    rerender(<MKeyboardHost />);
    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(run).not.toHaveBeenCalled();
    expect(useShortcutRegistry.getState().lists).toEqual([]);
  });

  it('FE-MOB-KEYS-007: the app takes the ⌘ shortcuts as key commands, names and all, and reports them back', async () => {
    asIpadApp(['keyCommands']);
    const run = vi.fn();
    const step = vi.fn();
    render(
      <>
        <MKeyboardHost />
        <Probe
          owner="trip"
          shortcuts={[
            { id: 'tab-plan', title: 'Plan', key: '1', mod: true, run },
            { id: 'day-next', title: 'Next day', key: 'ArrowRight', alt: true, run: step },
          ]}
        />
      </>
    );
    await waitFor(() =>
      expect(native.setKeyCommands).toHaveBeenLastCalledWith({
        commands: [{ id: 'trip:tab-plan', title: 'Plan', input: '1', modifiers: ['command'] }],
      })
    );

    // The page leaves ⌘1 to the app, so it cannot run twice…
    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(run).not.toHaveBeenCalled();
    // …and still answers a key without ⌘ itself.
    fireEvent.keyDown(document.body, { key: 'ArrowRight', altKey: true });
    expect(step).toHaveBeenCalledOnce();

    await waitFor(() => expect(native.listener).not.toBeNull());
    act(() => native.listener?.({ id: 'trip:tab-plan' }));
    expect(run).toHaveBeenCalledOnce();
  });
});

describe('MKeyboardHost and the rest of the screen', () => {
  beforeEach(() => {
    native.app = false;
    native.ios = false;
    native.features = [];
    native.setKeyCommands.mockClear();
    native.listener = null;
    useShortcutRegistry.setState({ lists: [] });
    _resetOverlayStack();
  });
  afterEach(() => useShortcutRegistry.setState({ lists: [] }));

  it('FE-MOB-KEYS-012: a browser keeps its own keys: Ctrl+1 switches tabs, Alt+Left goes back', () => {
    const go = vi.fn();
    const back = vi.fn();
    render(
      <>
        <MKeyboardHost />
        <Probe
          owner="trip"
          shortcuts={[
            { id: 'go', title: 'Go', key: '1', mod: true, run: go },
            { id: 'day-prev', title: 'Previous day', key: 'ArrowLeft', alt: true, run: back },
          ]}
        />
      </>
    );
    const ctrlOne = fireEvent.keyDown(document.body, { key: '1', ctrlKey: true });
    const metaOne = fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    const altLeft = fireEvent.keyDown(document.body, { key: 'ArrowLeft', altKey: true });
    expect(go).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
    // Not prevented: the browser still does what the keys mean to it.
    expect([ctrlOne, metaOne, altLeft]).toEqual([true, true, true]);
  });

  it('FE-MOB-KEYS-013: with a sheet open and its form changed, ⌘[ neither leaves nor drops the form', async () => {
    asIpadApp();
    const leave = vi.fn();
    render(
      <>
        <MKeyboardHost />
        <Probe owner="trip" shortcuts={[{ id: 'back', title: 'Back', key: '[', mod: true, run: leave }]} />
        <MSheet open onClose={() => {}} discardGuard={{ title: 'changed' }} ariaLabel="Edit reservation">
          <input aria-label="Title" defaultValue="Dinner" />
        </MSheet>
      </>
    );
    await screen.findByRole('dialog', { name: 'Edit reservation' });
    const pressed = fireEvent.keyDown(screen.getByLabelText('Title'), { key: '[', metaKey: true });
    expect(leave).not.toHaveBeenCalled();
    expect(pressed).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Edit reservation' })).toBeInTheDocument();
  });

  it('FE-MOB-KEYS-014: the app is handed no key commands while a sheet is open, and gets them back after', async () => {
    asIpadApp(['keyCommands']);
    const run = vi.fn();
    const shortcuts: Shortcut[] = [{ id: 'create', title: 'New trip', key: 'n', mod: true, run }];
    const { rerender } = render(
      <>
        <MKeyboardHost />
        <Probe owner="shell" shortcuts={shortcuts} />
        <MSheet open onClose={() => {}} ariaLabel="New trip">
          <span />
        </MSheet>
      </>
    );
    await waitFor(() => expect(native.setKeyCommands).toHaveBeenLastCalledWith({ commands: [] }));
    await waitFor(() => expect(native.listener).not.toBeNull());
    // A command sent before the sheet opened does not run behind it either.
    act(() => native.listener?.({ id: 'shell:create' }));
    expect(run).not.toHaveBeenCalled();

    rerender(
      <>
        <MKeyboardHost />
        <Probe owner="shell" shortcuts={shortcuts} />
      </>
    );
    await waitFor(() =>
      expect(native.setKeyCommands).toHaveBeenLastCalledWith({
        commands: [{ id: 'shell:create', title: 'New trip', input: 'n', modifiers: ['command'] }],
      })
    );
  });

  it('FE-MOB-KEYS-015: a dialog kept mounted but hidden holds nothing back', () => {
    asIpadApp();
    const run = vi.fn();
    render(
      <>
        <MKeyboardHost />
        <Probe owner="a" shortcuts={[{ id: 'go', title: 'Go', key: '1', mod: true, run }]} />
        <section role="dialog" aria-modal="true" hidden />
      </>
    );
    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(run).toHaveBeenCalledOnce();
  });

  it('FE-MOB-KEYS-016: Android without key commands of its own answers Ctrl, not the Meta key', () => {
    native.app = true;
    const run = vi.fn();
    render(
      <>
        <MKeyboardHost />
        <Probe owner="a" shortcuts={[{ id: 'go', title: 'Go', key: '1', mod: true, run }]} />
      </>
    );
    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(run).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: '1', ctrlKey: true });
    expect(run).toHaveBeenCalledOnce();
  });
});

describe('MKeyboardHost in the Android app', () => {
  beforeEach(() => {
    native.app = true;
    native.ios = false;
    native.features = [];
    native.setKeyCommands.mockClear();
    useShortcutRegistry.setState({ lists: [] });
  });

  it('FE-MOB-KEYS-010: an Android shell with key commands takes the shortcuts too, the feature decides', async () => {
    native.features = ['keyCommands'];
    const run = vi.fn();
    render(
      <>
        <MKeyboardHost />
        <Probe owner="trip" shortcuts={[{ id: 'tab-plan', title: 'Plan', key: '1', mod: true, run }]} />
      </>
    );
    await waitFor(() =>
      expect(native.setKeyCommands).toHaveBeenLastCalledWith({
        commands: [{ id: 'trip:tab-plan', title: 'Plan', input: '1', modifiers: ['command'] }],
      })
    );
    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(run).not.toHaveBeenCalled();
  });
});

describe('MShellShortcuts', () => {
  beforeEach(() => {
    asIpadApp();
    useShortcutRegistry.setState({ lists: [] });
    usePluginStore.setState({ plugins: [], loaded: true });
    useAddonStore.setState({
      addons: [{ id: 'atlas', name: 'atlas', type: 'global', icon: 'globe', enabled: true }],
      loaded: true,
    } as never);
  });

  it('FE-MOB-KEYS-008: ⌘1… go to the sections, ⌘N creates, ⌘, opens settings', () => {
    render(
      <>
        <MKeyboardHost />
        <MShellShortcuts />
        <LocationEcho />
      </>,
      { initialEntries: ['/dashboard'] }
    );
    const at = () => screen.getByTestId('loc').textContent;

    fireEvent.keyDown(document.body, { key: '2', metaKey: true });
    expect(at()).toBe('/atlas');
    fireEvent.keyDown(document.body, { key: '1', metaKey: true });
    expect(at()).toBe('/dashboard');
    fireEvent.keyDown(document.body, { key: 'n', metaKey: true });
    expect(at()).toBe('/dashboard?create=1');
    fireEvent.keyDown(document.body, { key: ',', metaKey: true });
    expect(at()).toBe('/settings');
  });

  it('FE-MOB-KEYS-009: inside a trip the numbers and ⌘N belong to the trip', () => {
    render(
      <>
        <MKeyboardHost />
        <MShellShortcuts />
        <LocationEcho />
      </>,
      { initialEntries: ['/trips/4'] }
    );
    fireEvent.keyDown(document.body, { key: '2', metaKey: true });
    expect(screen.getByTestId('loc').textContent).toBe('/trips/4');
    // The trip registers its own ⌘N for the tab on show (MTripShell); the shell's
    // would only know the tab the trip opened on.
    fireEvent.keyDown(document.body, { key: 'n', metaKey: true });
    expect(screen.getByTestId('loc').textContent).toBe('/trips/4');
    const shell = useShortcutRegistry.getState().lists.find((l) => l.owner === 'shell');
    expect(shell?.shortcuts.map((s) => s.id)).toEqual(['settings']);
  });
});
