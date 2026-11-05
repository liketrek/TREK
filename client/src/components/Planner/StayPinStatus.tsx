import { MapPin, MapPinOff, RotateCw } from 'lucide-react';

import { useTranslation } from '../../i18n';
import type { StayPin } from './useStayPin';

interface StayPinStatusProps {
  pin: StayPin;
  /** A stay already linked to a place of the trip shows on the map through that place. */
  hidden?: boolean;
  /** Asks the map again with what the form now holds. */
  onRetry: () => void;
}

/**
 * Whether an imported stay will show on the map, under its address in the
 * review: being looked up, found (and where, so a wrong match is plain), or not
 * found, with a way to search again before it is saved without a pin. Shared by
 * the desktop booking dialog and the phone's booking sheet.
 */
export default function StayPinStatus({ pin, hidden = false, onRetry }: StayPinStatusProps) {
  const { t } = useTranslation();
  if (hidden || pin.status === 'idle') return null;

  if (pin.status === 'searching') {
    return (
      <div role="status" className="flex items-center gap-2 px-1 text-caption text-content-muted">
        <span className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-edge border-t-content-muted" />
        {t('reservations.import.pinSearching')}
      </div>
    );
  }

  if (pin.status === 'found') {
    return (
      <div role="status" className="flex min-w-0 items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-caption">
        <MapPin size={14} strokeWidth={2.2} className="flex-none text-success" />
        <span className="flex-none font-semibold text-success">{t('reservations.import.pinFound')}</span>
        <span className="min-w-0 truncate text-content-secondary" title={pin.match.label}>
          {pin.match.label}
        </span>
      </div>
    );
  }

  return (
    <div role="status" className="flex items-start gap-3 rounded-xl bg-warning-soft px-3.5 py-3">
      <MapPinOff size={16} strokeWidth={2.2} className="mt-0.5 flex-none text-warning" />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-body font-semibold text-content">{t('reservations.import.pinMissingTitle')}</p>
        <p className="m-0 mt-0.5 text-caption text-content-muted">{t('reservations.import.pinMissingBody')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface-card px-2.5 py-1 text-caption font-medium text-content hover:bg-surface-hover"
        >
          <RotateCw size={12} strokeWidth={2.2} />
          {t('reservations.import.pinRetry')}
        </button>
      </div>
    </div>
  );
}
