import type { PaddleRegion, PaddleRegionCatalogEntry } from '@trek/shared';
import { Check, ChevronRight, Loader2, Plus, RefreshCw, Search, Trash2, Waves, WifiOff } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import {
  SettingRows,
  SETTINGS_BUTTON,
  SETTINGS_ICON_BUTTON,
  SettingsCard,
  SettingsHint,
  StatusPill,
} from '../../Settings/settingsKit';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { EditorField, INPUT } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import ErrorBoundary from '../../shared/ErrorBoundary';
import { Tooltip } from '../../shared/Tooltip';
import { progressPercent, regionStatusTone } from './paddleRegionsModel';
import { usePaddleRegionsAdmin } from './usePaddleRegionsAdmin';

type Admin = ReturnType<typeof usePaddleRegionsAdmin>;

/**
 * PAD-05A in the admin area: the regions TREK reads paddle obstacles for,
 * picked from Geofabrik's list. Both the desktop and the phone admin show
 * this one card under the addons, while the Tours addon is on.
 */
export default function PaddleRegionsPanel() {
  return (
    <ErrorBoundary boundaryId="paddle-regions">
      <Panel />
    </ErrorBoundary>
  );
}

function Panel() {
  const { t } = useTranslation();
  const admin = usePaddleRegionsAdmin();
  if (!admin.toursOn) return null;
  return (
    <SettingsCard
      icon={Waves}
      title={t('admin.paddleRegions.title')}
      hint={t('admin.paddleRegions.hint')}
      badge={admin.regions.length > 0 ? <StatusPill>{admin.regions.length}</StatusPill> : undefined}
    >
      {admin.offline && (
        <p
          role="status"
          className="m-0 flex items-center gap-2 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-warning"
          style={fs(12.5, 'body')}
        >
          <WifiOff size={14} className="flex-none" />
          {t('admin.paddleRegions.offline')}
        </p>
      )}
      {admin.error && !admin.offline && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-danger"
          style={fs(12.5, 'body')}
        >
          <span className="min-w-0 flex-1 basis-48">{admin.error}</span>
          <button type="button" onClick={admin.retry} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
            {t('admin.paddleRegions.retry')}
          </button>
        </div>
      )}
      <fieldset disabled={admin.offline} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <CatalogSearch admin={admin} />
        <RegionList admin={admin} />
      </fieldset>
      <SettingsHint>{t('admin.paddleRegions.attribution')}</SettingsHint>
      <ConfirmDialog
        isOpen={admin.removing !== null}
        onClose={admin.cancelRemove}
        onConfirm={admin.confirmRemove}
        title={t('admin.paddleRegions.remove')}
        message={t('admin.paddleRegions.removeMessage', { name: admin.removing?.name ?? '' })}
        confirmLabel={t('common.remove')}
      />
    </SettingsCard>
  );
}

/** A Geofabrik region with the regions it lies in, outermost first, so two of one name tell apart. */
function RegionPath({ hit }: { hit: PaddleRegionCatalogEntry }) {
  if (hit.path.length === 0) return null;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-0.5 text-content-faint" style={fs(11.5)}>
      {hit.path.map((part, index) => (
        <span key={`${part}-${index}`} className="inline-flex items-center gap-0.5">
          {index > 0 && <ChevronRight size={11} className="flex-none rtl:rotate-180" aria-hidden="true" />}
          {part}
        </span>
      ))}
    </span>
  );
}

function CatalogSearch({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  const id = useId();
  const { search } = admin;
  return (
    <div className="flex flex-col gap-2">
      <EditorField label={t('admin.paddleRegions.search')} htmlFor={id}>
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint"
            aria-hidden="true"
          />
          <input
            id={id}
            type="search"
            className={`${INPUT} ps-9`}
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            placeholder={t('admin.paddleRegions.searchPlaceholder')}
            autoComplete="off"
          />
        </div>
      </EditorField>
      {search.searching && (
        <p role="status" className="m-0 flex items-center gap-2 text-content-muted" style={fs(12.5, 'body')}>
          <Loader2 size={14} className="flex-none animate-spin" />
          {t('common.loading')}
        </p>
      )}
      {search.error && (
        <p role="alert" className="m-0 text-danger" style={fs(12.5, 'body')}>
          {search.error}
        </p>
      )}
      {search.hits && search.hits.length === 0 && <SettingsHint>{t('admin.paddleRegions.noHits')}</SettingsHint>}
      {search.hits && search.hits.length > 0 && (
        <SettingRows>
          {search.hits.map((hit) => (
            <div key={hit.id} className="flex items-center gap-3 py-2 pe-2 ps-3.5" data-testid="paddle-region-hit">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-content" style={fs(13, 'body')}>
                  {hit.name}
                </span>
                <RegionPath hit={hit} />
              </div>
              {admin.added.has(hit.id) ? (
                <StatusPill icon={<Check size={11} strokeWidth={2.4} />}>{t('admin.paddleRegions.added')}</StatusPill>
              ) : (
                <button
                  type="button"
                  disabled={admin.busyId !== null}
                  onClick={() => void admin.add(hit.id)}
                  className={SETTINGS_BUTTON}
                  style={fs(12.5, 'body')}
                >
                  {admin.busyId === hit.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} strokeWidth={2.2} />
                  )}
                  {t('common.add')}
                </button>
              )}
            </div>
          ))}
        </SettingRows>
      )}
    </div>
  );
}

function RegionList({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  if (admin.loading) {
    return (
      <p role="status" className="m-0 flex items-center gap-2 text-content-muted" style={fs(12.5, 'body')}>
        <Loader2 size={14} className="flex-none animate-spin" />
        {t('common.loading')}
      </p>
    );
  }
  if (admin.regions.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-edge px-4 py-5 text-center">
        <SettingsHint>{t('admin.paddleRegions.empty')}</SettingsHint>
      </div>
    );
  }
  return (
    <SettingRows>
      {admin.regions.map((region) => (
        <RegionRow key={region.id} region={region} admin={admin} />
      ))}
    </SettingRows>
  );
}

function RegionStatus({ region }: { region: PaddleRegion }) {
  const { t, language } = useTranslation();
  const percent = progressPercent(region);
  const label =
    region.status === 'importing' && region.progress
      ? t(`admin.paddleRegions.phase.${region.progress.phase}`)
      : t(`admin.paddleRegions.status.${region.status}`);
  const share =
    percent === null ? '' : ` ${new Intl.NumberFormat(language, { style: 'percent' }).format(percent / 100)}`;
  return (
    <StatusPill
      tone={regionStatusTone(region.status)}
      icon={region.status === 'importing' ? <Loader2 size={11} className="animate-spin" /> : undefined}
    >
      {label}
      {share}
    </StatusPill>
  );
}

function RegionRow({ region, admin }: { region: PaddleRegion; admin: Admin }) {
  const { t, language } = useTranslation();
  const busy = admin.busyId === region.id;
  const date = region.source_timestamp
    ? new Date(region.source_timestamp).toLocaleDateString(language, { dateStyle: 'medium' })
    : null;
  return (
    <div
      className={`flex items-center gap-3 py-2.5 pe-2 ps-3 ${busy ? 'opacity-60' : ''}`}
      data-testid="paddle-region-row"
    >
      <span
        aria-hidden
        className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary"
      >
        <Waves size={15} strokeWidth={1.9} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium text-content" style={fs(13, 'body')}>
          {region.name}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <RegionStatus region={region} />
          {region.imported_at && (
            <StatusPill>{t('admin.paddleRegions.objects', { count: region.feature_count })}</StatusPill>
          )}
          {region.imported_at && date && <StatusPill>{t('admin.paddleRegions.asOf', { date })}</StatusPill>}
        </span>
        {region.status === 'failed' && region.error && (
          <p className="m-0 line-clamp-2 break-words text-danger" style={fs(11.5)} title={region.error}>
            {region.error}
            {region.imported_at ? ` ${t('admin.paddleRegions.keptData')}` : ''}
          </p>
        )}
      </div>
      <Tooltip label={t('admin.paddleRegions.refresh')}>
        <button
          type="button"
          aria-label={`${t('admin.paddleRegions.refresh')} ${region.name}`}
          disabled={admin.busyId !== null || region.status === 'queued' || region.status === 'importing'}
          onClick={() => void admin.refresh(region.id)}
          className={SETTINGS_ICON_BUTTON}
        >
          <RefreshCw size={14} strokeWidth={2} />
        </button>
      </Tooltip>
      <Tooltip label={t('admin.paddleRegions.remove')}>
        <button
          type="button"
          aria-label={`${t('admin.paddleRegions.remove')} ${region.name}`}
          disabled={admin.busyId !== null}
          onClick={() => admin.askRemove(region)}
          className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`}
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </Tooltip>
    </div>
  );
}
