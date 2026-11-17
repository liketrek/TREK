import type { ServiceAllowance, ServiceIdentityState } from '@trek/shared';
import { MapPin, RefreshCw, Route, Search, Signal, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { SettingsCard } from '../Settings/settingsKit';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToast } from '../shared/Toast';
import { FigureBadge } from '../Tours/paddle/FigureBadge';
import {
  allowanceNote,
  canRegenerateKey,
  identityHint,
  quotaLevel,
  quotaResetClock,
  quotaShare,
  type QuotaLevel,
} from './serviceIdentityModel';
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
const BAR_TONE: Record<QuotaLevel, string> = { ok: 'bg-accent', low: 'bg-warning', out: 'bg-danger' };
const FIGURE_TONE: Record<QuotaLevel, string> = { ok: 'text-content', low: 'text-warning', out: 'text-danger' };

/**
 * One service under the key, as a tile: what is left today as the figure that
 * matters, the day's use as a bar, used and limit as badges. A service not in
 * use is dimmed rather than hidden, so the row reads the same on every install.
 */
function ServiceTile({ allowance }: { allowance: ServiceAllowance }) {
  const { t, locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const name = t(`admin.trekApi.quota.service.${allowance.service}`);
  const note = allowanceNote(t, allowance);
  const quota = allowance.quota;
  const Icon = SERVICE_ICON[allowance.service] ?? MapPin;
  const share = quota ? quotaShare(quota) : 100;

  // One row per service: its name, the day's use as a bar, used of the limit.
  return (
    <li className={`flex min-w-0 flex-col gap-1 px-3 py-2.5 ${allowance.inUse ? '' : 'opacity-60'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex w-[34%] min-w-0 flex-none items-center gap-2">
          <Icon size={14} strokeWidth={2} aria-hidden="true" className="flex-none text-content-muted" />
          <span className="truncate text-caption font-medium text-content-secondary">{name}</span>
        </span>
        {quota && (
          <>
            <div
              role="progressbar"
              aria-label={name}
              aria-valuemin={0}
              aria-valuemax={quota.limit}
              aria-valuenow={quota.used}
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-tertiary"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${BAR_TONE[quotaLevel(quota)]}`}
                style={{ width: `${share}%` }}
              />
            </div>
            <span
              className="flex-none text-caption tabular-nums text-content-faint"
              title={`${t('admin.trekApi.quota.remaining')}: ${number.format(quota.remaining)}`}
            >
              <span className={`font-semibold ${FIGURE_TONE[quotaLevel(quota)]}`}>{number.format(quota.used)}</span>
              {' / '}
              {number.format(quota.limit)}
            </span>
          </>
        )}
      </div>
      {note && <p className="m-0 text-caption leading-snug text-content-muted">{note}</p>}
    </li>
  );
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
  const is12h = useSettingsStore((s) => s.settings.time_format === '12h');
  const resetAt = quotaResetClock(status, is12h);

  const confirmRegenerate = async () => {
    setConfirming(false);
    try {
      await regenerate();
      toast.success(t('admin.trekApi.quota.regenerated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
  };

  const hint = identityHint(t, status, failed);
  const canRegenerate = canRegenerateKey(status, managed);

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
            className="m-0 flex list-none flex-col divide-y divide-edge-faint overflow-hidden rounded-xl border border-edge-faint bg-surface-card p-0"
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
