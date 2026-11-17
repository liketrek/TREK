import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { _resetNativeCapabilities, checkAppUpdate, loadNativeCapabilities } from '../../native/capabilities';
import { isNativeApp } from '../../native/platform';
import { TrekShell } from '../../native/trekShell';
import NativeUpdateNotice from './NativeUpdateNotice';

vi.mock('../../native/platform', () => ({ isNativeApp: vi.fn(), isNativeIos: vi.fn(() => false) }));
vi.mock('../../native/trekShell', () => ({
  TrekShell: { getCapabilities: vi.fn() },
  isUnimplemented: () => false,
}));

beforeEach(() => {
  _resetNativeCapabilities();
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(TrekShell.getCapabilities).mockResolvedValue({
    shellApi: 2,
    platform: 'android',
    appVersion: '5.2.0',
    build: '3',
    features: [],
  } as never);
});

describe('NativeUpdateNotice', () => {
  it('stays away while the binary is new enough', async () => {
    render(<NativeUpdateNotice />);
    await act(async () => {
      await checkAppUpdate(async () => ({ minNativeShellApi: 2 }));
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('leads to the store when the server needs a newer binary, and can be dismissed', async () => {
    render(<NativeUpdateNotice />);
    await act(async () => {
      await loadNativeCapabilities();
      await checkAppUpdate(async () => ({ minNativeShellApi: 3 }));
    });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=com.liketrek.trek');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
