import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import MWalletButton from './MWalletButton';

const wallet = vi.hoisted(() => ({
  kind: 'apple' as 'apple' | 'google' | null,
  add: vi.fn(),
  addGoogle: vi.fn(),
}));

vi.mock('../../native/wallet', () => ({
  bookingWallet: () => wallet.kind,
  useGoogleWalletAvailable: () => wallet.kind === 'google',
  addReservationToWallet: wallet.add,
  addReservationToGoogleWallet: wallet.addGoogle,
}));
vi.mock('../../native/capabilities', () => ({ useNativeCapabilities: () => ({ caps: {}, updateRequired: false }) }));

beforeEach(() => {
  wallet.kind = 'apple';
  wallet.add.mockReset();
  wallet.addGoogle.mockReset();
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
    wallet.kind = null;
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
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/date/i)));
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    wallet.add.mockResolvedValueOnce('failed');
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onError).toHaveBeenLastCalledWith(expect.stringMatching(/could not be made/i)));
  });

  it('on Android adds the booking to Google Wallet, under its own name for screen readers', async () => {
    wallet.kind = 'google';
    wallet.addGoogle.mockResolvedValue('added');
    const onError = vi.fn();
    render(<MWalletButton tripId={42} reservationId={7} onError={onError} />);
    // The label is short, the accessible name says which wallet.
    expect(screen.getByRole('button')).toHaveTextContent(/^Wallet$/);
    expect(screen.getByRole('button', { name: /Google Wallet/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(wallet.addGoogle).toHaveBeenCalledWith(42, 7, expect.any(String)));
    expect(wallet.add).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
