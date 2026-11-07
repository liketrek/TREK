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
  ios: false,
  features: [] as string[],
  setKeyCommands: vi.fn(() => Promise.resolve()),
  listener: null as null | ((p: { id: string }) => void),
}));

vi.mock('../../../src/native/platform', () => ({
  isNativeApp: () => native.ios,
  isNativeIos: () => native.ios,
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

import MKeyboardHost from '../../../src/mobile/keyboard/MKeyboardHost';
import MShellShortcuts from '../../../src/mobile/keyboard/MShellShortcuts';

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

  it('FE-MOB-KEYS-001: ⌘ and Ctrl both count as the command key, the rest must match exactly', () => {
    expect(matchesShortcut(key('s', { metaKey: true }), save)).toBe(true);
    expect(matchesShortcut(key('S', { ctrlKey: true }), save)).toBe(true);
    expect(matchesShortcut(key('s'), save)).toBe(false);
    expect(matchesShortcut(key('s', { metaKey: true, shiftKey: true }), save)).toBe(false);
    expect(matchesShortcut(key('s', { metaKey: true, ctrlKey: true }), sidebar)).toBe(true);
    expect(matchesShortcut(key('s', { metaKey: true }), sidebar)).toBe(false);
    expect(matchesShortcut(key('ArrowRight', { altKey: true }), next)).toBe(true);
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
    native.ios = false;
    native.features = [];
    native.setKeyCommands.mockClear();
    native.listener = null;
    useShortcutRegistry.setState({ lists: [] });
  });
  afterEach(() => useShortcutRegistry.setState({ lists: [] }));

  it('FE-MOB-KEYS-005: in a browser the page answers the keys and runs the newest handler', () => {
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
    native.ios = true;
    native.features = ['keyCommands'];
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

describe('MShellShortcuts', () => {
  beforeEach(() => {
    native.ios = false;
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

  it('FE-MOB-KEYS-009: inside a trip the numbers belong to the trip', () => {
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
  });
});
