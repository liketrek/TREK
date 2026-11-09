import { Loader2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';
import {
  addReservationToGoogleWallet,
  addReservationToWallet,
  bookingWallet,
  useGoogleWalletAvailable,
} from '../../native/wallet';

interface MWalletButtonProps {
  tripId: number;
  /** None yet (a booking being created): no button. */
  reservationId: number | undefined;
  /** Placement in the hosting sheet, on a wrapper around the button. */
  className?: string;
  /** Shown when the pass could not be made (a toast in the sheet that hosts the button). */
  onError: (message: string) => void;
}

/**
 * "Add to Apple Wallet" on a booking in the iOS app (feature wallet), "Add to
 * Google Wallet" in the Android app (feature googleWallet): the booking becomes a
 * TREK pass that shows up around its time and place. Black like both stores' own
 * badges, so it reads as the wallet at a glance.
 */
export default function MWalletButton({ tripId, reservationId, onError, className }: MWalletButtonProps) {
  const { t, language } = useTranslation();
  // Re-renders once the app binary has said what it can do.
  useNativeCapabilities();
  // Re-renders once the server has said whether Google Wallet works here.
  useGoogleWalletAvailable(tripId);
  const [busy, setBusy] = useState(false);
  const wallet = bookingWallet();
  if (reservationId === undefined || !wallet) return null;
  const id = reservationId;

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const outcome =
        wallet === 'google'
          ? await addReservationToGoogleWallet(tripId, id, language)
          : await addReservationToWallet(tripId, id, language);
      if (outcome === 'undated') onError(t('reservations.wallet.undated'));
      else if (outcome === 'failed') onError(t('reservations.wallet.failed'));
    } finally {
      setBusy(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={() => void add()}
      disabled={busy}
      aria-busy={busy}
      aria-label={t(wallet === 'google' ? 'reservations.wallet.addGoogle' : 'reservations.wallet.add')}
      className="flex items-center gap-[6px] rounded-full bg-black px-3 py-[7px] text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-white transition-transform active:scale-[.97] disabled:opacity-70" // theme-lint-disable: the wallets' badges are black in either theme
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Wallet size={13} strokeWidth={2} />}
      {t('reservations.wallet.short')}
    </button>
  );
  return className ? <div className={className}>{button}</div> : button;
}
