import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import {
  NativePushDenied,
  forgetNativePush,
  nativePushActive,
  nativePushEndpoint,
  openPushTarget,
  registerNativePush,
  startNativePush,
} from './push';
import { TrekShell } from './trekShell';

vi.mock('./platform', () => ({ isNativeIos: vi.fn() }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: {
    registerPush: vi.fn(),
    takeOpenedPush: vi.fn(),
    addListener: vi.fn(async () => ({ remove: async () => {} })),
  },
}));

const SUB = {
  endpoint: 'https://push.liketrek.com/v1/apns/production/abcd',
  keys: { p256dh: 'BPk', auth: 'aa' },
};

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(isNativeIos).mockReturnValue(true);
  vi.mocked(hasNativeFeature).mockReturnValue(true);
  vi.mocked(TrekShell.registerPush).mockReset().mockResolvedValue(SUB);
  vi.mocked(TrekShell.takeOpenedPush).mockReset().mockResolvedValue({ url: null });
  window.history.replaceState({}, '', '/dashboard');
});

describe('native push', () => {
  it('is on only in an iOS binary that has it', () => {
    expect(nativePushActive()).toBe(true);
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(nativePushActive()).toBe(false);
  });

  it('remembers the relay endpoint it subscribed with, and forgets it again', async () => {
    expect(await registerNativePush()).toEqual(SUB);
    expect(nativePushEndpoint()).toBe(SUB.endpoint);
    forgetNativePush();
    expect(nativePushEndpoint()).toBeNull();
  });

  it('tells a refused permission apart from a failure', async () => {
    vi.mocked(TrekShell.registerPush).mockRejectedValue({ code: 'DENIED' });
    await expect(registerNativePush()).rejects.toBeInstanceOf(NativePushDenied);
    vi.mocked(TrekShell.registerPush).mockRejectedValue(new Error('apns down'));
    await expect(registerNativePush()).rejects.toThrow('apns down');
    expect(nativePushEndpoint()).toBeNull();
  });

  it('opens a tapped notification inside the app, and never another origin', () => {
    const pops = vi.fn();
    window.addEventListener('popstate', pops);
    openPushTarget('/trips/12?tab=chat');
    expect(window.location.pathname).toBe('/trips/12');
    expect(window.location.search).toBe('?tab=chat');
    openPushTarget('https://evil.example/phish');
    expect(window.location.pathname).toBe('/trips/12');
    expect(pops).toHaveBeenCalledTimes(1);
    window.removeEventListener('popstate', pops);
  });

  it('follows the notification the app was opened from', async () => {
    vi.mocked(TrekShell.takeOpenedPush).mockResolvedValue({ url: '/trips/3' });
    await startNativePush();
    expect(window.location.pathname).toBe('/trips/3');
    expect(TrekShell.addListener).toHaveBeenCalledWith('pushOpened', expect.any(Function));
  });
});
