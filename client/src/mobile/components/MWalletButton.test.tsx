import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import MWalletButton from './MWalletButton';

const wallet = vi.hoisted(() => ({
  can: true,
  add: vi.fn(),
}));

vi.mock('../../native/wallet', () => ({
  canAddToWallet: () => wallet.can,
  addReservationToWallet: wallet.add,
}));
vi.mock('../../native/capabilities', () => ({ useNativeCapabilities: () => ({ caps: {}, updateRequired: false }) }));

beforeEach(() => {
  wallet.can = true;
  wallet.add.mockReset();
});

describe('MWalletButton', () => {
  it('is not there for a booking that is not saved yet', () => {
    render(<MWalletButton tripId={42} reservationId={undefined} onError={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sits in a wrapper when the sheet places it', () => {
    const { container } = render(<MWalletButton tripId={42} reservationId={7} onError={vi.fn()} className="mt-2" />);
    expect(container.querySelector('div.mt-2 > button')).not.toBeNull();
  });

  it('is not there where the app cannot add a pass', () => {
    wallet.can = false;
    render(<MWalletButton tripId={42} reservationId={7} onError={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('adds the booking and says nothing when Wallet took it', async () => {
    wallet.add.mockResolvedValue('added');
    const onError = vi.fn();
    render(<MWalletButton tripId={42} reservationId={7} onError={onError} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(wallet.add).toHaveBeenCalledWith(42, 7, expect.any(String)));
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    expect(onError).not.toHaveBeenCalled();
  });

  it('explains an undated booking and a failure apart', async () => {
    const onError = vi.fn();
    render(<MWalletButton tripId={42} reservationId={7} onError={onError} />);
    wallet.add.mockResolvedValueOnce('undated');
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onError).toHaveBeenCalledWith('reservations.wallet.undated'));
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    wallet.add.mockResolvedValueOnce('failed');
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onError).toHaveBeenLastCalledWith('reservations.wallet.failed'));
  });
});
