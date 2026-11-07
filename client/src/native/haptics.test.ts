import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pressHaptic, selectionHaptic, tickHaptic, toastHaptic } from './haptics';
import { isNativeApp } from './platform';

vi.mock('@capacitor/haptics', () => ({
  Haptics: { notification: vi.fn(), impact: vi.fn(), selectionChanged: vi.fn() },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));
vi.mock('./platform', () => ({ isNativeApp: vi.fn() }));

beforeEach(() => {
  vi.mocked(Haptics.notification).mockReset().mockResolvedValue();
  vi.mocked(Haptics.impact).mockReset().mockResolvedValue();
  vi.mocked(Haptics.selectionChanged).mockReset().mockResolvedValue();
  vi.mocked(isNativeApp).mockReturnValue(true);
});

describe('toastHaptic', () => {
  it('taps for success, warning and error toasts in the app', () => {
    toastHaptic('success');
    toastHaptic('warning');
    toastHaptic('error');
    expect(vi.mocked(Haptics.notification).mock.calls.map(([o]) => o?.type)).toEqual([
      NotificationType.Success,
      NotificationType.Warning,
      NotificationType.Error,
    ]);
  });

  it('stays still for info toasts and in a browser', () => {
    toastHaptic('info');
    vi.mocked(isNativeApp).mockReturnValue(false);
    toastHaptic('success');
    expect(Haptics.notification).not.toHaveBeenCalled();
  });

  it('does not let a missing vibrator surface as an error', async () => {
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    vi.mocked(Haptics.notification).mockRejectedValue(new Error('not available'));
    toastHaptic('error');
    await vi.waitFor(() => expect(report).toHaveBeenCalledWith(expect.any(Error)));
    vi.unstubAllGlobals();
  });
});

describe('tickHaptic', () => {
  it('gives a light detent in the app', () => {
    tickHaptic();
    expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });
  });

  it('stays still in a browser', () => {
    vi.mocked(isNativeApp).mockReturnValue(false);
    tickHaptic();
    expect(Haptics.impact).not.toHaveBeenCalled();
  });
});

describe('selectionHaptic and pressHaptic', () => {
  it('click on a changed value and bump on a long press, in the app only', () => {
    selectionHaptic();
    pressHaptic();
    expect(Haptics.selectionChanged).toHaveBeenCalledTimes(1);
    expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Medium });
    vi.mocked(isNativeApp).mockReturnValue(false);
    selectionHaptic();
    pressHaptic();
    expect(Haptics.selectionChanged).toHaveBeenCalledTimes(1);
    expect(Haptics.impact).toHaveBeenCalledTimes(1);
  });
});
