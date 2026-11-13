import { AlertCircle, Check } from 'lucide-react';
import { useTranslation } from '../../../../i18n';

interface MReviewNoticeProps {
  /** With the right to edit the booking: "Looks right" takes the mark off. */
  onConfirm?: () => void;
}

/**
 * The phone's counterpart of the review pill in the desktop dialog: an import
 * could not read every detail for sure, so the booking asks for a look. The
 * one action says it was checked; editing the booking works as always.
 */
export default function MReviewNotice({ onConfirm }: MReviewNoticeProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-[14px] flex items-center gap-[10px] rounded-[14px] bg-[color-mix(in_srgb,var(--m-st-pending)_12%,transparent)] px-3 py-[10px]">
      <AlertCircle size={16} strokeWidth={2.2} className="flex-none text-[color:var(--m-st-pending)]" />
      <span className="min-w-0 flex-1 text-caption leading-snug text-m-ink">{t('reservations.needsReviewHint')}</span>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-[30px] flex-none items-center gap-1 rounded-full bg-[color:var(--m-inner)] px-[11px] font-geist text-caption font-bold text-m-ink shadow-sm"
        >
          <Check size={13} strokeWidth={2.4} />
          {t('reservations.reviewConfirm')}
        </button>
      )}
    </div>
  );
}
