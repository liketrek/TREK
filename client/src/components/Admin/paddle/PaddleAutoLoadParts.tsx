import type { PaddleRegionAutoMode, PaddleRegionPending } from '@trek/shared';
import { Ban, CloudDownload, Hand, Loader2, Power, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { ChoiceChips, SettingRows, SETTINGS_BUTTON, SettingsHint, StatusPill } from '../../Settings/settingsKit';
import { LABEL, Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { AUTO_LOAD_MODES, autoLoadSizes, formatMegabytes } from './paddleRegionsModel';
import type { usePaddleRegionsAdmin } from './usePaddleRegionsAdmin';

type Admin = ReturnType<typeof usePaddleRegionsAdmin>;

const MODE_ICONS = { auto: CloudDownload, ask: Hand, off: Power } as const;

/** `formatMegabytes` in the reader's language. */
function useMegabytes() {
  const { language } = useTranslation();
  return (mb: number) => formatMegabytes(mb, language);
}

const MB = 1024 * 1024;

/**
 * PAD-11C: how TREK gets the water data of a place a paddler plans in. The
 * mode, and in the automatic one the largest region it loads without asking.
 */
export function AutoLoadSettings({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  const megabytes = useMegabytes();
  const { settings, saving, save } = admin.autoLoad;
  if (!settings) return null;
  const sizes = autoLoadSizes(settings.max_mb);
  return (
    <div data-testid="paddle-auto-load" className="flex min-w-0 flex-col gap-2.5">
      <div className="min-w-0">
        <span className={LABEL}>{t('admin.paddleRegions.auto.title')}</span>
        <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
          <Segmented<PaddleRegionAutoMode>
            value={settings.mode}
            onChange={(mode) => void save({ mode })}
            label={t('admin.paddleRegions.auto.title')}
            fill
            options={AUTO_LOAD_MODES.map((mode) => {
              const Icon = MODE_ICONS[mode];
              return {
                value: mode,
                label: t(`admin.paddleRegions.auto.mode.${mode}`),
                icon: <Icon size={13} strokeWidth={2} aria-hidden="true" />,
              };
            })}
          />
        </fieldset>
        <SettingsHint className="mt-1.5">{t(`admin.paddleRegions.auto.modeHint.${settings.mode}`)}</SettingsHint>
      </div>
      {settings.mode === 'auto' && (
        <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
          <span className={LABEL}>{t('admin.paddleRegions.auto.maxSize')}</span>
          <ChoiceChips<string>
            value={String(settings.max_mb)}
            label={t('admin.paddleRegions.auto.maxSize')}
            onChange={(value) => void save({ max_mb: Number(value) })}
            options={sizes.map((mb) => ({ value: String(mb), label: megabytes(mb) }))}
          />
          <SettingsHint className="mt-1.5">{t('admin.paddleRegions.auto.maxSizeHint')}</SettingsHint>
        </fieldset>
      )}
    </div>
  );
}

function RequestRow({ request, admin }: { request: PaddleRegionPending; admin: Admin }) {
  const { t, language } = useTranslation();
  const megabytes = useMegabytes();
  const busy = admin.busyId === request.id;
  const date = new Date(request.requested_at).toLocaleDateString(language, { dateStyle: 'medium' });
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pe-2 ps-3 ${busy ? 'opacity-60' : ''}`}
      data-testid="paddle-region-request"
    >
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
        <span className="truncate font-medium text-content" style={fs(13, 'body')}>
          {request.name}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {request.declined ? (
            <StatusPill tone="danger" icon={<Ban size={10} strokeWidth={2.4} />}>
              {t('admin.paddleRegions.requests.declined')}
            </StatusPill>
          ) : (
            <StatusPill tone="warning">{t(`admin.paddleRegions.requests.reason.${request.reason}`)}</StatusPill>
          )}
          {request.bytes !== null && <StatusPill>{megabytes(Math.max(1, Math.round(request.bytes / MB)))}</StatusPill>}
          {request.requested_by && (
            <StatusPill>{t('admin.paddleRegions.requests.by', { user: request.requested_by })}</StatusPill>
          )}
          <StatusPill>{date}</StatusPill>
        </span>
      </div>
      <span className="flex flex-none items-center gap-1.5">
        {!request.declined && (
          <button
            type="button"
            disabled={admin.busyId !== null}
            onClick={() => void admin.decline(request.id)}
            className={SETTINGS_BUTTON}
            style={fs(12.5, 'body')}
          >
            {t('admin.paddleRegions.requests.decline')}
          </button>
        )}
        <button
          type="button"
          disabled={admin.busyId !== null}
          onClick={() => void admin.approve(request.id)}
          className={SETTINGS_BUTTON}
          style={fs(12.5, 'body')}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <CloudDownload size={13} strokeWidth={2.2} />}
          {t('admin.paddleRegions.requests.approve')}
        </button>
      </span>
    </div>
  );
}

/** The regions paddlers asked for that wait for an admin, the open ones first. */
export function RequestList({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  if (admin.requests.length === 0) return null;
  const ordered = [...admin.requests].sort((a, b) => Number(a.declined) - Number(b.declined));
  const open = admin.requests.filter((request) => !request.declined).length;
  return (
    <div className="flex min-w-0 flex-col gap-2" data-testid="paddle-region-requests">
      <span className={`${LABEL} mb-0 flex items-center gap-1.5`}>
        {t('admin.paddleRegions.requests.title')}
        {open > 0 && <StatusPill tone="warning">{open}</StatusPill>}
      </span>
      <SettingRows>
        {ordered.map((request) => (
          <RequestRow key={request.id} request={request} admin={admin} />
        ))}
      </SettingRows>
    </div>
  );
}

/** A region TREK loaded by itself for a paddler, told apart from those an admin added. */
export function AutoOriginPill() {
  const { t } = useTranslation();
  return (
    <Tooltip label={t('admin.paddleRegions.origin.autoHint')}>
      <span className="inline-flex" data-testid="paddle-region-auto">
        <StatusPill icon={<Sparkles size={10} strokeWidth={2.2} />}>{t('admin.paddleRegions.origin.auto')}</StatusPill>
      </span>
    </Tooltip>
  );
}
