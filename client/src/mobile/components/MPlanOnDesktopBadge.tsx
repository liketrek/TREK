import { Monitor } from 'lucide-react';
import { useTranslation } from '../../i18n';

/**
 * The one way the phone says "this is planned on a bigger screen": the road
 * trip's empty stage and the tours list both carry it, so the sentence around
 * it only has to say what the phone does instead.
 */
export default function MPlanOnDesktopBadge({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-1 pe-3 ps-1 ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
      >
        <Monitor size={12} strokeWidth={2.2} />
      </span>
      <span className="truncate font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-m-ink">
        {t('mobileTrip.planOnDesktop')}
      </span>
    </span>
  );
}
