import type { ServiceAllowance, ServiceIdentityState, ServiceIdentityStatus, ServiceQuotaView } from '@trek/shared';
import { RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatClockTime } from '../../utils/formatters';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToast } from '../shared/Toast';
import { useServiceIdentity } from './useServiceIdentity';

const STATE_DOT: Record<ServiceIdentityState, string> = {
  connected: 'bg-success',
  registering: 'bg-warning motion-safe:animate-pulse',
  legacy: 'bg-[var(--text-faint)]',
  off: 'bg-[var(--text-faint)]',
  revoked: 'bg-danger',
};

/** Below a tenth of the day left the bar turns amber, at nothing left red. */
function barTone(quota: ServiceQuotaView): string {
  if (quota.remaining === 0) return 'bg-danger';
  return quota.remaining < quota.limit / 10 ? 'bg-warning' : 'bg-accent';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-content-muted">{label}</dt>
      <dd className="m-0 truncate text-body font-medium tabular-nums text-content">{value}</dd>
    </div>
  );
}

function QuotaMeter({ quota, label }: { quota: ServiceQuotaView; label: string }) {
  const { t, locale } = useTranslation();
  const is12h = useSettingsStore((s) => s.settings.time_format === '12h');
  const number = new Intl.NumberFormat(locale);
  const share = quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 100;
  const reset = new Date(quota.resetAt);
  const resetAt = formatClockTime(
    `${String(reset.getHours()).padStart(2, '0')}:${String(reset.getMinutes()).padStart(2, '0')}`,
    is12h
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={quota.limit}
        aria-valuenow={quota.used}
        className="h-1.5 overflow-hidden rounded-full bg-surface-tertiary"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${barTone(quota)}`}
          style={{ width: `${share}%` }}
        />
      </div>
      <dl className="m-0 grid grid-cols-3 gap-3">
        <Stat
          label={t('admin.trekApi.quota.used')}
          value={`${number.format(quota.used)} / ${number.format(quota.limit)}`}
        />
        <Stat label={t('admin.trekApi.quota.remaining')} value={number.format(quota.remaining)} />
        <Stat label={t('admin.trekApi.quota.resets')} value={resetAt} />
      </dl>
    </div>
  );
}

function rowNote(t: TranslationFn, allowance: ServiceAllowance): string | null {
  if (!allowance.inUse) return t('admin.trekApi.quota.notInUse');
  return allowance.quota ? null : t('admin.trekApi.quota.unavailable');
}

/**
 * One service under the key: its name, today's allowance where its host told
 * it, and whether this instance asks it at all. A service not in use is
 * dimmed rather than hidden, so the list reads the same on every install.
 */
function ServiceRow({ allowance }: { allowance: ServiceAllowance }) {
  const { t } = useTranslation();
  const name = t(`admin.trekApi.quota.service.${allowance.service}`);
  const note = rowNote(t, allowance);

  return (
    <li className={`flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 ${allowance.inUse ? '' : 'opacity-60'}`}>
      <p className="m-0 text-caption font-medium text-content-secondary">{name}</p>
      {allowance.quota && <QuotaMeter quota={allowance.quota} label={name} />}
      {note && <p className="m-0 text-caption leading-snug text-content-muted">{note}</p>}
    </li>
  );
}

function stateHint(t: TranslationFn, status: ServiceIdentityStatus | null, failed: boolean): string | null {
  if (!status) return failed ? t('admin.trekApi.quota.unavailable') : null;
  return status.state === 'connected' ? null : t(`admin.trekApi.quota.hint.${status.state}`);
}

/**
 * How this installation stands with the TREK services: whether it has its key,
 * and for place search, address search and routing today's allowance against
 * what is used, and when the count starts again.
 * Read when the card is in view and refreshed every 30 seconds while it stays.
 * A managed install leaves the identity to its operator, so it offers no new one.
 */
export default function ServiceIdentityPanel({ managed = false }: { managed?: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  const panel = useRef<HTMLElement>(null);
  const { status, failed, regenerating, regenerate } = useServiceIdentity(panel);
  const [confirming, setConfirming] = useState(false);

  const confirmRegenerate = async () => {
    setConfirming(false);
    try {
      await regenerate();
      toast.success(t('admin.trekApi.quota.regenerated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
  };

  const hint = stateHint(t, status, failed);
  const canRegenerate = !managed && status !== null && status.keySource !== 'env' && status.state !== 'off';

  return (
    <section
      ref={panel}
      aria-label={t('admin.trekApi.quota.title')}
      className="flex flex-col gap-3 rounded-xl border border-edge-faint bg-surface-secondary px-3.5 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-2 text-body font-medium text-content">
          <span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${STATE_DOT[status?.state ?? 'off']}`} />
          {status ? t(`admin.trekApi.quota.state.${status.state}`) : t('admin.trekApi.quota.title')}
        </p>
        {status?.tier && (
          <span className="rounded-full border border-edge-faint bg-surface-card px-2 py-0.5 text-caption font-medium text-content-secondary">
            {t(`admin.trekApi.quota.tier.${status.tier}`)}
          </span>
        )}
      </div>

      {status && status.services.length > 0 && (
        <ul aria-label={t('admin.trekApi.quota.title')} className="m-0 list-none divide-y divide-edge-faint p-0">
          {status.services.map((allowance) => (
            <ServiceRow key={allowance.service} allowance={allowance} />
          ))}
        </ul>
      )}
      {hint && <p className="m-0 text-caption leading-snug text-content-muted">{hint}</p>}

      {status?.keySource === 'env' && (
        <p className="m-0 text-caption text-content-faint">{t('admin.trekApi.quota.envKey')}</p>
      )}
      {canRegenerate && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 self-start rounded-lg text-caption font-medium text-content-secondary hover:text-content disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            strokeWidth={2}
            className={regenerating ? 'motion-safe:animate-spin' : ''}
            aria-hidden="true"
          />
          {t('admin.trekApi.quota.regenerate')}
        </button>
      )}

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void confirmRegenerate()}
        title={t('admin.trekApi.quota.regenerateTitle')}
        message={t('admin.trekApi.quota.regenerateBody')}
        confirmLabel={t('admin.trekApi.quota.regenerate')}
        danger={false}
      />
    </section>
  );
}
