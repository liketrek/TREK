import { App } from '@capacitor/app';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { isAppLockEnabled, unlockApp } from '../../native/appLock';
import AppLockGate from './AppLockGate';

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })) } }));
vi.mock('../../native/appLock', () => ({
  RELOCK_AFTER_MS: 30_000,
  isAppLockEnabled: vi.fn(),
  unlockApp: vi.fn(),
}));

function stateListener(): (state: { isActive: boolean }) => void {
  const call = vi.mocked(App.addListener).mock.calls.find(([name]) => (name as string) === 'appStateChange');
  if (!call) throw new Error('no appStateChange listener');
  return call[1] as unknown as (state: { isActive: boolean }) => void;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAppLockEnabled).mockReturnValue(true);
  vi.mocked(unlockApp).mockResolvedValue(false);
});

describe('AppLockGate', () => {
  it('covers the app at launch and asks at once; a successful unlock lifts it', async () => {
    render(<AppLockGate />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(unlockApp).toHaveBeenCalledTimes(1));

    vi.mocked(unlockApp).mockResolvedValue(true);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('locks again after half a minute in the background, not after a glance away', async () => {
    vi.mocked(unlockApp).mockResolvedValue(true);
    const now = vi.spyOn(Date, 'now');
    render(<AppLockGate />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    vi.mocked(unlockApp).mockResolvedValue(false);
    now.mockReturnValue(1_000);
    act(() => stateListener()({ isActive: false }));
    now.mockReturnValue(10_000);
    act(() => stateListener()({ isActive: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => stateListener()({ isActive: false }));
    now.mockReturnValue(60_000);
    act(() => stateListener()({ isActive: true }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    now.mockRestore();
  });

  it('is nothing while the lock is off', () => {
    vi.mocked(isAppLockEnabled).mockReturnValue(false);
    const { container } = render(<AppLockGate />);
    expect(container).toBeEmptyDOMElement();
    expect(unlockApp).not.toHaveBeenCalled();
  });
});
