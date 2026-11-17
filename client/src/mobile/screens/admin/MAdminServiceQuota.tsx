import type { ServiceAllowance, ServiceIdentityState, ServiceIdentityStatus } from '@trek/shared';
import { MapPin, RefreshCw, Route, Search, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  allowanceNote,
  canRegenerateKey,
  identityHint,
  quotaLevel,
  quotaResetClock,
  quotaShare,
  type QuotaLevel,
} from '../../../components/Admin/serviceIdentityModel';
import { useServiceIdentity } from '../../../components/Admin/useServiceIdentity';
import { useToast } from '../../../components/shared/Toast';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { TranslationFn } from '../../../types';
import { getApiErrorMessage } from '../../../utils/apiError';
import MConfirmSheet from '../settings/MConfirmSheet';
import { MAdminButton } from './MAdminUi';

const STATE_DOT: Record<ServiceIdentityState, string> = {
  connected: 'bg-[color:var(--m-st-confirmed)]',
  registering: 'bg-[color:var(--m-st-pending)] motion-safe:animate-pulse',
  legacy: 'bg-[color:var(--m-faint)]',
  off: 'bg-[color:var(--m-faint)]',
  revoked: 'bg-[color:var(--m-st-danger)]',
};
const BAR: Record<QuotaLevel, string> = {
  ok: 'bg-m-act',
  low: 'bg-[color:var(--m-st-pending)]',
  out: 'bg-[color:var(--m-st-danger)]',
};
const FIGURE: Record<QuotaLevel, string> = {
  ok: 'text-m-ink',
  low: 'text-[color:var(--m-st-pending)]',
  out: 'text-[color:var(--m-st-danger)]',
};
const SERVICE_ICON: Record<string, LucideIcon> = { places: MapPin, photon: Search, valhalla: Route };

/** The tier, an operator key from the environment and the reset, as one quiet line (the desktop's badges). */
function quotaMeta(t: TranslationFn, status: ServiceIdentityStatus | null, resetAt: string | null): string {
  if (!status) return '';
  const parts = [
    status.tier ? t(`admin.trekApi.quota.tier.${status.tier}`) : null,
    status.keySource === 'env' ? `${t('admin.trekApi.quota.key')}: TREK_SERVICES_KEY` : null,
    resetAt ? `${t('admin.trekApi.quota.resets')} ${resetAt}` : null,
  ];
  return parts.filter(Boolean).join(', ');
}

function MQuotaRow({ allowance }: { allowance: ServiceAllowance }) {
  const { t, locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const name = t(`admin.trekApi.quota.service.${allowance.service}`);
  const note = allowanceNote(t, allowance);
  const quota = allowance.quota;
  const Icon = SERVICE_ICON[allowance.service] ?? MapPin;
  return (
    <li className={`py-[9px] ${allowance.inUse ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-2">
        <Icon size={13} strokeWidth={2} aria-hidden className="flex-none text-m-faint" />
        <span className="min-w-0 flex-1 truncate text-[length:calc(12px*var(--fs-scale-body,1))] font-bold text-m-ink">
          {name}
        </span>
        {quota && (
          <span className="flex-none font-geist text-[length:calc(10.5px*var(--fs-scale-caption,1))] tabular-nums text-m-faint">
            <span className={`font-bold ${FIGURE[quotaLevel(quota)]}`}>{number.format(quota.used)}</span>
            {' / '}
            {number.format(quota.limit)}
          </span>
        )}
      </div>
      {quota && (
        <div
          role="progressbar"
          aria-label={name}
          aria-valuemin={0}
          aria-valuemax={quota.limit}
          aria-valuenow={quota.used}
          className="mt-[6px] h-[5px] overflow-hidden rounded-full bg-[color:var(--m-rowbr)]"
        >
          <div className={`h-full rounded-full ${BAR[quotaLevel(quota)]}`} style={{ width: `${quotaShare(quota)}%` }} />
        </div>
      )}
      {note && (
        <p className="mt-[3px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-snug text-m-muted">
          {note}
        </p>
      )}
    </li>
  );
}

/**
 * How this installation stands with the TREK services, the phone's form of the
 * desktop ServiceIdentityPanel: its state, today's use per service against the
 * allowance, when the count starts again, and a new key when the old one leaked.
 * Read while in view and refreshed every 30 seconds (useServiceIdentity).
 */
export default function MAdminServiceQuota({ managed = false }: { managed?: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  const panel = useRef<HTMLDivElement>(null);
  const { status, failed, regenerating, regenerate } = useServiceIdentity(panel);
  const [confirming, setConfirming] = useState(false);
  const is12h = useSettingsStore((s) => s.settings.time_format === '12h');
  const resetAt = quotaResetClock(status, is12h);
  const hint = identityHint(t, status, failed);
  const meta = quotaMeta(t, status, resetAt);

  const confirmRegenerate = async () => {
    setConfirming(false);
    try {
      await regenerate();
      toast.success(t('admin.trekApi.quota.regenerated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
  };

  return (
    <div
      ref={panel}
      className="rounded-[16px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3"
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-bold text-m-ink">
          {t('admin.trekApi.quota.title')}
        </span>
        <span className="inline-flex flex-none items-center gap-[5px] rounded-full bg-[color:var(--m-sheetop)] px-2 py-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold text-m-ink">
          <span aria-hidden className={`h-[7px] w-[7px] rounded-full ${STATE_DOT[status?.state ?? 'off']}`} />
          {status ? t(`admin.trekApi.quota.state.${status.state}`) : '…'}
        </span>
      </div>
      {meta && (
        <p className="mt-[3px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] text-m-muted">{meta}</p>
      )}
      {status && status.services.length > 0 && (
        <ul aria-label={t('admin.trekApi.quota.title')} className="mt-1 divide-y divide-[color:var(--m-rowbr)]">
          {status.services.map((allowance) => (
            <MQuotaRow key={allowance.service} allowance={allowance} />
          ))}
        </ul>
      )}
      {hint && (
        <p className="mt-1 font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-snug text-m-muted">
          {hint}
        </p>
      )}
      {canRegenerateKey(status, managed) && (
        <div className="mt-2 flex justify-end">
          <MAdminButton variant="ghost" busy={regenerating} onClick={() => setConfirming(true)}>
            {!regenerating && <RefreshCw size={12} strokeWidth={2.2} />}
            {t('admin.trekApi.quota.regenerate')}
          </MAdminButton>
        </div>
      )}
      <MConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('admin.trekApi.quota.regenerateTitle')}
        message={t('admin.trekApi.quota.regenerateBody')}
        confirmLabel={t('admin.trekApi.quota.regenerate')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void confirmRegenerate()}
      />
    </div>
  );
}
