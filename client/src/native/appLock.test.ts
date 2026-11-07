import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appLockSupported, biometryAvailable, isAppLockEnabled, setAppLockEnabled, unlockApp } from './appLock';
import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { TrekShell } from './trekShell';

vi.mock('./platform', () => ({ isNativeApp: vi.fn() }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: { setPrivacyCover: vi.fn(), biometryInfo: vi.fn(), authenticateBiometric: vi.fn() },
}));

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(hasNativeFeature).mockReturnValue(true);
  vi.mocked(TrekShell.setPrivacyCover).mockReset().mockResolvedValue();
  vi.mocked(TrekShell.biometryInfo).mockReset().mockResolvedValue({ available: true, type: 'faceID' });
  vi.mocked(TrekShell.authenticateBiometric).mockReset().mockResolvedValue({ ok: true });
});

describe('appLock', () => {
  it('is only offered in a binary with the feature', () => {
    expect(appLockSupported()).toBe(true);
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(appLockSupported()).toBe(false);
  });

  it('keeps the switch on the device and tells the native side for the app-switcher cover', async () => {
    expect(isAppLockEnabled()).toBe(false);
    await setAppLockEnabled(true);
    expect(isAppLockEnabled()).toBe(true);
    expect(TrekShell.setPrivacyCover).toHaveBeenLastCalledWith({ enabled: true });
    await setAppLockEnabled(false);
    expect(isAppLockEnabled()).toBe(false);
    expect(TrekShell.setPrivacyCover).toHaveBeenLastCalledWith({ enabled: false });
  });

  it('reads off as off without the feature, whatever is stored', async () => {
    await setAppLockEnabled(true);
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(isAppLockEnabled()).toBe(false);
    expect(await biometryAvailable()).toEqual({ available: false, type: 'none' });
  });

  it('unlocks on success and stays locked on a cancel or a failure', async () => {
    expect(await unlockApp('Unlock TREK')).toBe(true);
    vi.mocked(TrekShell.authenticateBiometric).mockRejectedValue({ code: 'CANCELLED' });
    expect(await unlockApp('Unlock TREK')).toBe(false);
    vi.mocked(TrekShell.authenticateBiometric).mockRejectedValue({ code: 'FAILED' });
    expect(await unlockApp('Unlock TREK')).toBe(false);
  });
});
