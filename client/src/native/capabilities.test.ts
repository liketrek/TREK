import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetNativeCapabilities,
  appUpdateRequired,
  checkAppUpdate,
  hasNativeFeature,
  loadNativeCapabilities,
  nativeCapabilities,
} from './capabilities';
import { isNativeApp } from './platform';
import { TrekShell } from './trekShell';

vi.mock('./platform', () => ({ isNativeApp: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: { getCapabilities: vi.fn() },
  isUnimplemented: (err: unknown) => (err as { code?: string })?.code === 'UNIMPLEMENTED',
}));

const CAPS = { shellApi: 2, platform: 'ios', appVersion: '5.2.0', build: '12', features: ['capabilities', 'edgeBack'] };

beforeEach(() => {
  _resetNativeCapabilities();
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(TrekShell.getCapabilities)
    .mockReset()
    .mockResolvedValue(CAPS as never);
});

afterEach(() => vi.unstubAllGlobals());

describe('native capabilities', () => {
  it('asks the binary once and answers features by name', async () => {
    await loadNativeCapabilities();
    await loadNativeCapabilities();
    expect(TrekShell.getCapabilities).toHaveBeenCalledTimes(1);
    expect(hasNativeFeature('edgeBack')).toBe(true);
    expect(hasNativeFeature('tileCache')).toBe(false);
    expect(nativeCapabilities().appVersion).toBe('5.2.0');
  });

  it('counts a binary from before the handshake as shell API 1 with no features', async () => {
    vi.mocked(TrekShell.getCapabilities).mockRejectedValue({ code: 'UNIMPLEMENTED' });
    const caps = await loadNativeCapabilities();
    expect(caps.shellApi).toBe(1);
    expect(hasNativeFeature('capabilities')).toBe(false);
  });

  it('reports a real failure but still settles on the legacy answer', async () => {
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    vi.mocked(TrekShell.getCapabilities).mockRejectedValue(new Error('bridge down'));
    expect((await loadNativeCapabilities()).shellApi).toBe(1);
    expect(report).toHaveBeenCalled();
  });

  it('asks nothing in a browser', async () => {
    vi.mocked(isNativeApp).mockReturnValue(false);
    expect((await loadNativeCapabilities()).platform).toBe('web');
    expect(TrekShell.getCapabilities).not.toHaveBeenCalled();
    expect(await checkAppUpdate(async () => ({ minNativeShellApi: 9 }))).toBe(false);
  });

  it('asks for an update only when the server needs a newer binary', async () => {
    expect(await checkAppUpdate(async () => ({ minNativeShellApi: 2 }))).toBe(false);
    expect(await checkAppUpdate(async () => ({ minNativeShellApi: 3 }))).toBe(true);
    expect(appUpdateRequired()).toBe(true);
  });

  it('requires nothing from a server that names no minimum, or cannot be asked', async () => {
    expect(await checkAppUpdate(async () => ({}))).toBe(false);
    expect(
      await checkAppUpdate(async () => {
        throw new Error('offline');
      })
    ).toBe(false);
  });
});
