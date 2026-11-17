import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../../tests/helpers/render';
import {
  appLockSupported,
  biometryAvailable,
  isAppLockEnabled,
  setAppLockEnabled,
  unlockApp,
} from '../../../native/appLock';
import MAppLockCard from './MAppLockCard';

vi.mock('../../../native/appLock', () => ({
  appLockSupported: vi.fn(),
  biometryAvailable: vi.fn(),
  isAppLockEnabled: vi.fn(),
  setAppLockEnabled: vi.fn(async () => {}),
  unlockApp: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(appLockSupported).mockReturnValue(true);
  vi.mocked(biometryAvailable).mockResolvedValue({ available: true, type: 'faceID' });
  vi.mocked(isAppLockEnabled).mockReturnValue(false);
  vi.mocked(unlockApp).mockResolvedValue(true);
});

describe('MAppLockCard', () => {
  it('turns the lock on only after one successful unlock', async () => {
    render(<MAppLockCard />);
    const toggle = await screen.findByRole('switch');
    vi.mocked(unlockApp).mockResolvedValueOnce(false);
    fireEvent.click(toggle);
    await waitFor(() => expect(unlockApp).toHaveBeenCalledTimes(1));
    expect(setAppLockEnabled).not.toHaveBeenCalled();

    fireEvent.click(toggle);
    await waitFor(() => expect(setAppLockEnabled).toHaveBeenCalledWith(true));
  });

  it('turns it off without asking', async () => {
    vi.mocked(isAppLockEnabled).mockReturnValue(true);
    render(<MAppLockCard />);
    fireEvent.click(await screen.findByRole('switch'));
    await waitFor(() => expect(setAppLockEnabled).toHaveBeenCalledWith(false));
    expect(unlockApp).not.toHaveBeenCalled();
  });

  it('is not offered on a device without Face ID, Touch ID or a passcode', async () => {
    vi.mocked(biometryAvailable).mockResolvedValue({ available: false, type: 'none' });
    const { container } = render(<MAppLockCard />);
    await waitFor(() => expect(biometryAvailable).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
