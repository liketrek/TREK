import type { PaddleRegion, PaddleRegionPending } from '@trek/shared';
import {
  Ban,
  Check,
  ChevronRight,
  CloudDownload,
  Hand,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Waves,
  WifiOff,
} from 'lucide-react';
import {
  AUTO_LOAD_MODES,
  autoLoadSizes,
  formatMegabytes,
  progressPercent,
  regionStatusTone,
} from '../../../components/Admin/paddle/paddleRegionsModel';
import { usePaddleRegionsAdmin } from '../../../components/Admin/paddle/usePaddleRegionsAdmin';
import { useTranslation } from '../../../i18n';
import MBadge from '../../components/MBadge';
import MChip from '../../components/MChip';
import MConfirmSheet from '../settings/MConfirmSheet';
import { MAdminButton, MAdminCard, MAdminClampedText } from './MAdminUi';

type Admin = ReturnType<typeof usePaddleRegionsAdmin>;

const MODE_ICONS = { auto: CloudDownload, ask: Hand, off: Power } as const;
const MB = 1024 * 1024;
const LABEL =
  'mb-1.5 block font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.08em] text-m-faint';
const ROWS =
  'flex flex-col divide-y divide-[color:var(--m-rowbr)] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]';
const ROUND =
  'flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] text-m-muted disabled:opacity-40';
const TONE = {
  neutral: '',
  accent: '!text-[color:var(--m-st-info)]',
  success: '!text-[color:var(--m-st-confirmed)]',
  danger: '!text-[color:var(--m-st-danger)]',
} as const;

/** How TREK loads a paddler's region by itself, and up to which size. */
function AutoLoad({ admin }: { admin: Admin }) {
  const { t, language } = useTranslation();
  const { settings, saving, save } = admin.autoLoad;
  if (!settings) return null;
  return (
    <div data-testid="paddle-auto-load">
      <span className={LABEL}>{t('admin.paddleRegions.auto.title')}</span>
      <div
        role="radiogroup"
        aria-label={t('admin.paddleRegions.auto.title')}
        className="flex gap-1 rounded-full bg-[color:var(--m-ic)] p-[3px]"
      >
        {AUTO_LOAD_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode];
          const active = settings.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={saving}
              onClick={() => void save({ mode })}
              className={`flex h-[34px] min-w-0 flex-1 items-center justify-center gap-1 rounded-full text-[length:calc(11.5px*var(--fs-scale-caption,1))] font-semibold ${
                active ? 'bg-m-act text-m-actfg' : 'text-m-ink'
              }`}
            >
              <Icon size={13} strokeWidth={2} aria-hidden="true" className="flex-none" />
              <span className="truncate">{t(`admin.paddleRegions.auto.mode.${mode}`)}</span>
            </button>
          );
        })}
      </div>
      <MAdminClampedText className="mt-1.5 text-[length:calc(10px*var(--fs-scale-caption,1))]">
        {t(`admin.paddleRegions.auto.modeHint.${settings.mode}`)}
      </MAdminClampedText>
      {settings.mode === 'auto' && (
        <div className="mt-3">
          <span className={LABEL}>{t('admin.paddleRegions.auto.maxSize')}</span>
          <div role="group" aria-label={t('admin.paddleRegions.auto.maxSize')} className="flex flex-wrap gap-1.5">
            {autoLoadSizes(settings.max_mb).map((mb) => (
              <MChip
                key={mb}
                pressable
                active={settings.max_mb === mb}
                onClick={() => {
                  if (!saving) void save({ max_mb: mb });
                }}
              >
                {formatMegabytes(mb, language)}
              </MChip>
            ))}
          </div>
          <MAdminClampedText className="mt-1.5 text-[length:calc(10px*var(--fs-scale-caption,1))]">
            {t('admin.paddleRegions.auto.maxSizeHint')}
          </MAdminClampedText>
        </div>
      )}
    </div>
  );
}

function RequestRow({ request, admin }: { request: PaddleRegionPending; admin: Admin }) {
  const { t, language } = useTranslation();
  const busy = admin.busyId === request.id;
  return (
    <div data-testid="paddle-region-request" className={`px-3 py-2.5 ${busy ? 'opacity-60' : ''}`}>
      <div className="truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink">
        {request.name}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {request.declined ? (
          <MBadge caps={false} icon={<Ban size={10} strokeWidth={2.4} />} className={TONE.danger}>
            {t('admin.paddleRegions.requests.declined')}
          </MBadge>
        ) : (
          <MBadge caps={false} className="!text-[color:var(--m-st-pending)]">
            {t(`admin.paddleRegions.requests.reason.${request.reason}`)}
          </MBadge>
        )}
        {request.bytes !== null && (
          <MBadge caps={false}>{formatMegabytes(Math.max(1, Math.round(request.bytes / MB)), language)}</MBadge>
        )}
        {request.requested_by && (
          <MBadge caps={false}>{t('admin.paddleRegions.requests.by', { user: request.requested_by })}</MBadge>
        )}
        <MBadge caps={false}>
          {new Date(request.requested_at).toLocaleDateString(language, { dateStyle: 'medium' })}
        </MBadge>
      </div>
      <div className="mt-2 flex justify-end gap-1.5">
        {!request.declined && (
          <MAdminButton variant="ghost" disabled={admin.busyId !== null} onClick={() => void admin.decline(request.id)}>
            {t('admin.paddleRegions.requests.decline')}
          </MAdminButton>
        )}
        <MAdminButton busy={busy} disabled={admin.busyId !== null} onClick={() => void admin.approve(request.id)}>
          {!busy && <CloudDownload size={12} strokeWidth={2.2} />}
          {t('admin.paddleRegions.requests.approve')}
        </MAdminButton>
      </div>
    </div>
  );
}

function Requests({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  if (admin.requests.length === 0) return null;
  const ordered = [...admin.requests].sort((a, b) => Number(a.declined) - Number(b.declined));
  const open = admin.requests.filter((request) => !request.declined).length;
  return (
    <div data-testid="paddle-region-requests">
      <span className={`${LABEL} flex items-center gap-1.5`}>
        {t('admin.paddleRegions.requests.title')}
        {open > 0 && (
          <MBadge tone="strong" caps={false}>
            {open}
          </MBadge>
        )}
      </span>
      <div className={ROWS}>
        {ordered.map((request) => (
          <RequestRow key={request.id} request={request} admin={admin} />
        ))}
      </div>
    </div>
  );
}

function CatalogSearch({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  const { search } = admin;
  return (
    <div>
      <span className={LABEL}>{t('admin.paddleRegions.search')}</span>
      <div className="relative">
        <Search
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute start-[13px] top-1/2 -translate-y-1/2 text-m-faint"
        />
        <input
          type="search"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          autoComplete="off"
          aria-label={t('admin.paddleRegions.search')}
          placeholder={t('admin.paddleRegions.searchPlaceholder')}
          className="h-[42px] w-full rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] pe-3 ps-[34px] text-[length:calc(13px*var(--fs-scale-body,1))] text-m-ink outline-none placeholder:text-m-faint"
        />
      </div>
      {search.searching && (
        <p
          role="status"
          className="mt-2 flex items-center gap-2 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-muted"
        >
          <Loader2 size={13} className="animate-spin" />
          {t('common.loading')}
        </p>
      )}
      {search.error && (
        <p
          role="alert"
          className="mt-2 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-[color:var(--m-st-danger)]"
        >
          {search.error}
        </p>
      )}
      {search.hits && search.hits.length === 0 && (
        <p className="mt-2 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-faint">
          {t('admin.paddleRegions.noHits')}
        </p>
      )}
      {search.hits && search.hits.length > 0 && (
        <div className={`mt-2 ${ROWS}`}>
          {search.hits.map((hit) => (
            <div key={hit.id} data-testid="paddle-region-hit" className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink">
                  {hit.name}
                </div>
                {hit.path.length > 0 && (
                  <div className="flex min-w-0 flex-wrap items-center gap-0.5 font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] text-m-faint">
                    {hit.path.map((part, index) => (
                      <span key={`${part}-${index}`} className="inline-flex items-center gap-0.5">
                        {index > 0 && <ChevronRight size={10} aria-hidden="true" className="rtl:rotate-180" />}
                        {part}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {admin.added.has(hit.id) ? (
                <MBadge caps={false} icon={<Check size={10} strokeWidth={2.4} />}>
                  {t('admin.paddleRegions.added')}
                </MBadge>
              ) : (
                <button
                  type="button"
                  aria-label={`${t('common.add')} ${hit.name}`}
                  disabled={admin.busyId !== null}
                  onClick={() => void admin.add(hit.id)}
                  className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg disabled:opacity-40"
                >
                  {admin.busyId === hit.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={14} strokeWidth={2.2} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** What a region's read stands at: its status, where it came from, its objects, its date and its water. */
function RegionBadges({ region }: { region: PaddleRegion }) {
  const { t, language } = useTranslation();
  const percent = progressPercent(region);
  const status =
    region.status === 'importing' && region.progress
      ? t(`admin.paddleRegions.phase.${region.progress.phase}`)
      : t(`admin.paddleRegions.status.${region.status}`);
  const date = region.source_timestamp
    ? new Date(region.source_timestamp).toLocaleDateString(language, { dateStyle: 'medium' })
    : null;
  const km = region.network
    ? new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(region.network.water_km)
    : null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <MBadge
        caps={false}
        className={TONE[regionStatusTone(region.status)]}
        icon={region.status === 'importing' ? <Loader2 size={10} className="animate-spin" /> : undefined}
      >
        {status}
        {percent === null ? '' : ` ${new Intl.NumberFormat(language, { style: 'percent' }).format(percent / 100)}`}
      </MBadge>
      {region.origin === 'auto' && (
        <MBadge caps={false} icon={<Sparkles size={10} strokeWidth={2.2} />}>
          {t('admin.paddleRegions.origin.auto')}
        </MBadge>
      )}
      {region.imported_at && (
        <MBadge caps={false}>{t('admin.paddleRegions.objects', { count: region.feature_count })}</MBadge>
      )}
      {region.imported_at && date && <MBadge caps={false}>{t('admin.paddleRegions.asOf', { date })}</MBadge>}
      {km !== null && <MBadge caps={false}>{t('admin.paddleRegions.network.km', { km })}</MBadge>}
      {!region.network && region.imported_at && region.status !== 'importing' && (
        <MBadge caps={false} className="!text-[color:var(--m-st-pending)]">
          {t('admin.paddleRegions.network.missing')}
        </MBadge>
      )}
    </div>
  );
}

function RegionRow({ region, admin }: { region: PaddleRegion; admin: Admin }) {
  const { t } = useTranslation();
  const busy = admin.busyId === region.id;
  return (
    <div
      data-testid="paddle-region-row"
      className={`flex items-center gap-2.5 px-3 py-2.5 ${busy ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden="true"
        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-sheetop)] text-m-muted"
      >
        <Waves size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink">
          {region.name}
        </div>
        <RegionBadges region={region} />
        {region.status === 'failed' && region.error && (
          <p className="mt-1 line-clamp-2 break-words font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] text-[color:var(--m-st-danger)]">
            {region.error}
            {region.imported_at ? ` ${t('admin.paddleRegions.keptData')}` : ''}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`${t('admin.paddleRegions.refresh')} ${region.name}`}
        disabled={admin.busyId !== null || region.status === 'queued' || region.status === 'importing'}
        onClick={() => void admin.refresh(region.id)}
        className={ROUND}
      >
        <RefreshCw size={13} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label={`${t('admin.paddleRegions.remove')} ${region.name}`}
        disabled={admin.busyId !== null}
        onClick={() => admin.askRemove(region)}
        className={ROUND}
      >
        <Trash2 size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

function Regions({ admin }: { admin: Admin }) {
  const { t } = useTranslation();
  if (admin.loading) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-muted"
      >
        <Loader2 size={13} className="animate-spin" />
        {t('common.loading')}
      </p>
    );
  }
  if (admin.regions.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[color:var(--m-rowbr)] px-4 py-4 text-center font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-faint">
        {t('admin.paddleRegions.empty')}
      </p>
    );
  }
  return (
    <div className={ROWS}>
      {admin.regions.map((region) => (
        <RegionRow key={region.id} region={region} admin={admin} />
      ))}
    </div>
  );
}

/**
 * PAD-05A/PAD-11C on the phone: the regions TREK reads paddle data for, how it
 * loads a paddler's region by itself and the regions that wait for an admin.
 * usePaddleRegionsAdmin is the desktop card's state; this is only the markup.
 */
export default function MAdminPaddleRegionsPanel() {
  const { t } = useTranslation();
  const admin = usePaddleRegionsAdmin();
  if (!admin.toursOn) return null;
  return (
    <MAdminCard>
      <div className="flex items-start gap-3">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)] text-m-ink">
          <Waves size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate text-[length:calc(14px*var(--fs-scale-body,1))] font-extrabold text-m-ink">
              {t('admin.paddleRegions.title')}
            </span>
            {admin.regions.length > 0 && <MBadge caps={false}>{admin.regions.length}</MBadge>}
          </div>
          <MAdminClampedText className="mt-[2px] text-[length:calc(10px*var(--fs-scale-caption,1))]">
            {t('admin.paddleRegions.hint')}
          </MAdminClampedText>
        </div>
      </div>

      {admin.offline && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-[12px] bg-[color:var(--m-ic)] px-3 py-2 text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-[color:var(--m-st-pending)]"
        >
          <WifiOff size={13} className="flex-none" />
          {t('admin.paddleRegions.offline')}
        </p>
      )}
      {admin.error && !admin.offline && (
        <div role="alert" className="mt-3 flex items-center gap-2 rounded-[12px] bg-[color:var(--m-ic)] px-3 py-2">
          <span className="min-w-0 flex-1 text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-[color:var(--m-st-danger)]">
            {admin.error}
          </span>
          <MAdminButton variant="ghost" onClick={admin.retry}>
            {t('admin.paddleRegions.retry')}
          </MAdminButton>
        </div>
      )}

      <fieldset
        disabled={admin.offline}
        className="m-0 mt-3 flex min-w-0 flex-col gap-4 border-0 border-t border-[color:var(--m-rowbr)] p-0 pt-3"
      >
        <AutoLoad admin={admin} />
        <Requests admin={admin} />
        <CatalogSearch admin={admin} />
        <Regions admin={admin} />
      </fieldset>
      <p className="mt-3 font-geist text-[length:calc(9px*var(--fs-scale-caption,1))] leading-relaxed text-m-faint">
        {t('admin.paddleRegions.attribution')}
      </p>

      <MConfirmSheet
        open={admin.removing !== null}
        onClose={admin.cancelRemove}
        title={t('admin.paddleRegions.remove')}
        message={t('admin.paddleRegions.removeMessage', { name: admin.removing?.name ?? '' })}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={admin.confirmRemove}
      />
    </MAdminCard>
  );
}
