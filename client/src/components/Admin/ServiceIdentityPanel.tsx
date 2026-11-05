import type { ServiceAllowance, ServiceIdentityState, ServiceIdentityStatus, ServiceQuotaView } from '@trek/shared';
import { MapPin, RefreshCw, Route, Search, Signal, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatClockTime } from '../../utils/formatters';
import { SettingsCard } from '../Settings/settingsKit';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToast } from '../shared/Toast';
import { FigureBadge } from '../Tours/paddle/FigureBadge';
import { useServiceIdentity } from './useServiceIdentity';

const STATE_DOT: Record<ServiceIdentityState, string> = {
  connected: 'bg-success',
  registering: 'bg-warning motion-safe:animate-pulse',
  legacy: 'bg-[var(--text-faint)]',
  off: 'bg-[var(--text-faint)]',
  revoked: 'bg-danger',
};

const SERVICE_ICON: Record<string, LucideIcon> = { places: MapPin, photon: Search, valhalla: Route };

/** Below a tenth of the day left the bar turns amber, at nothing left red. */
function barTone(quota: ServiceQuotaView): string {
  if (quota.remaining === 0) return 'bg-danger';
  return quota.remaining < quota.limit / 10 ? 'bg-warning' : 'bg-accent';
}

function figureTone(quota: ServiceQuotaView): string {
  if (quota.remaining === 0) return 'text-danger';
  return quota.remaining < quota.limit / 10 ? 'text-warning' : 'text-content';
}

/** The clock time the counts start again, in the user's format; one for all services, which share the day. */
function useResetTime(status: ServiceIdentityStatus | null): string | null {
  const is12h = useSettingsStore((s) => s.settings.time_format === '12h');
  const at = status?.services.find((s) => s.quota)?.quota?.resetAt;
  if (!at) return null;
  const reset = new Date(at);
  return formatClockTime(
    `${String(reset.getHours()).padStart(2, '0')}:${String(reset.getMinutes()).padStart(2, '0')}`,
    is12h
  );
}

function tileNote(t: TranslationFn, allowance: ServiceAllowance): string | null {
  if (!allowance.inUse) return t('admin.trekApi.quota.notInUse');
  return allowance.quota ? null : t('admin.trekApi.quota.unavailable');
}

/**
 * One service under the key, as a tile: what is left today as the figure that
 * matters, the day's use as a bar, used and limit as badges. A service not in
 * use is dimmed rather than hidden, so the row reads the same on every install.
 */
function ServiceTile({ allowance }: { allowance: ServiceAllowance }) {
  const { t, locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const name = t(`admin.trekApi.quota.service.${allowance.service}`);
  const note = tileNote(t, allowance);
  const quota = allowance.quota;
  const Icon = SERVICE_ICON[allowance.service] ?? MapPin;
  const share = quota && quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 100;

  return (
    <li
      className={`flex min-w-0 flex-col gap-2.5 rounded-xl border border-edge-faint bg-surface-card p-3 shadow-sm ${allowance.inUse ? '' : 'opacity-60'}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-surface-tertiary text-content-muted">
          <Icon size={14} strokeWidth={2} aria-hidden="true" />
        </span>
        <p className="m-0 truncate text-caption font-medium text-content-secondary">{name}</p>
      </div>

      {quota && (
        <>
          <div className="min-w-0">
            <p className={`m-0 truncate text-title font-semibold tabular-nums leading-tight ${figureTone(quota)}`}>
              {number.format(quota.remaining)}
            </p>
            <p className="m-0 text-caption text-content-muted">{t('admin.trekApi.quota.remaining')}</p>
          </div>
          <div
            role="progressbar"
            aria-label={name}
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
          <div className="flex flex-wrap gap-1.5">
            <FigureBadge label={t('admin.trekApi.quota.used')} value={number.format(quota.used)} />
            <FigureBadge label={t('admin.trekApi.quota.limit')} value={number.format(quota.limit)} />
          </div>
        </>
      )}
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
  const panel = useRef<HTMLDivElement>(null);
  const { status, failed, regenerating, regenerate } = useServiceIdentity(panel);
  const [confirming, setConfirming] = useState(false);
  const resetAt = useResetTime(status);

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
    <div ref={panel}>
      <SettingsCard
        flush
        icon={Signal}
        title={t('admin.trekApi.quota.title')}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-2 py-[2px] text-caption font-semibold text-content shadow-sm">
            <span
              aria-hidden="true"
              className={`h-2 w-2 flex-none rounded-full ${STATE_DOT[status?.state ?? 'off']}`}
            />
            {status ? t(`admin.trekApi.quota.state.${status.state}`) : '…'}
          </span>
        }
        action={
          <>
            {status?.tier && <FigureBadge value={t(`admin.trekApi.quota.tier.${status.tier}`)} />}
            {status?.keySource === 'env' && (
              <FigureBadge
                label={t('admin.trekApi.quota.key')}
                value="TREK_SERVICES_KEY"
                info={t('admin.trekApi.quota.envKey')}
              />
            )}
            {resetAt && <FigureBadge label={t('admin.trekApi.quota.resets')} value={resetAt} />}
          </>
        }
      >
        {status && status.services.length > 0 && (
          <ul
            aria-label={t('admin.trekApi.quota.title')}
            className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-3"
          >
            {status.services.map((allowance) => (
              <ServiceTile key={allowance.service} allowance={allowance} />
            ))}
          </ul>
        )}
        {hint && <p className="m-0 text-caption leading-snug text-content-muted">{hint}</p>}

        {/* The one action, on a rule of its own below the figures. */}
        {canRegenerate && (
          <div className="-mx-4 -mb-4 flex items-center justify-end border-t border-edge-faint px-4 py-2.5">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge-faint bg-surface-card px-2.5 py-1 text-caption font-medium text-content-secondary shadow-sm hover:bg-surface-hover hover:text-content disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                strokeWidth={2}
                className={regenerating ? 'motion-safe:animate-spin' : ''}
                aria-hidden="true"
              />
              {t('admin.trekApi.quota.regenerate')}
            </button>
          </div>
        )}
      </SettingsCard>

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void confirmRegenerate()}
        title={t('admin.trekApi.quota.regenerateTitle')}
        message={t('admin.trekApi.quota.regenerateBody')}
        confirmLabel={t('admin.trekApi.quota.regenerate')}
        danger={false}
      />
    </div>
  );
}
