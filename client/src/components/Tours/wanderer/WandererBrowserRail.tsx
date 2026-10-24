import { wandererDifficultyToSac, type WandererImportPreview, type WandererTrailSummary } from '@trek/shared';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Check,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  MapPinned,
  Ruler,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance, formatElevation } from '../../../utils/units';
import { BarButton, WhiteBadge } from '../../Planner/planParts';
import { DialogButton, NEUTRAL_TINT, fs } from '../../shared/DialogShell';
import EmptyState from '../../shared/EmptyState';
import { Tooltip } from '../../shared/Tooltip';
import { RAIL_HEAD, RailTitle } from '../planner/TourPlannerPanels';
import { TourDayRowAvatar } from '../TourDayRowFacts';
import { TourListCard, TourMetricFields, TourNotice, TourSection } from '../tourParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import type { WandererBrowser } from './useWandererBrowser';
import WandererMark from './WandererMark';

/**
 * The left rail of the tours workspace while the user browses their wanderer
 * trails: the search and its results, or one trail's preview with the import.
 * The trail itself shows on the map between the rails.
 */
export default function WandererBrowserRail({ browser }: { browser: WandererBrowser }) {
  const { t } = useTranslation();
  const inPreview = browser.selected !== null;
  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={t('wanderer.browser.title')}>
      <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
        <BarButton
          label={inPreview ? t('wanderer.browser.backToList') : t('tours.planner.backToTours')}
          onClick={inPreview ? browser.backToList : browser.close}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </BarButton>
        <RailTitle
          title={t('wanderer.browser.title')}
          sub={inPreview ? browser.selected?.name : t('wanderer.browser.sub')}
        />
      </div>
      {inPreview ? <TrailPreview browser={browser} /> : <TrailSearch browser={browser} />}
    </section>
  );
}

function TrailSearch({ browser }: { browser: WandererBrowser }) {
  const { t } = useTranslation();
  const notConnected = browser.searchError === 'not_connected' || browser.searchError === 'unauthorized';
  return (
    <>
      <div className="flex flex-none flex-col gap-2 border-b border-edge-faint px-3 py-2.5">
        <label className="flex h-8 items-center gap-2 rounded-[10px] bg-surface-card px-2.5 shadow-sm ring-1 ring-inset ring-edge-faint focus-within:ring-accent">
          <Search size={14} strokeWidth={2} className="flex-none text-content-faint" />
          <input
            value={browser.query}
            onChange={(event) => browser.setQuery(event.target.value)}
            autoFocus
            placeholder={t('wanderer.browser.searchPlaceholder')}
            aria-label={t('wanderer.browser.searchPlaceholder')}
            className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint"
            style={fs(12.5, 'body')}
          />
          {browser.searching && (
            <Loader2 size={13} strokeWidth={2.2} className="flex-none animate-spin text-content-faint" />
          )}
        </label>
        <Tooltip label={browser.area ? t('wanderer.browser.areaOffHint') : t('wanderer.browser.areaOnHint')}>
          <button
            type="button"
            onClick={browser.toggleArea}
            aria-pressed={!!browser.area}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-[10px] px-3 font-semibold shadow-sm transition-colors ${browser.area ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-secondary ring-1 ring-inset ring-edge-faint hover:text-content'}`}
            style={fs(12, 'body')}
          >
            <MapPinned size={14} strokeWidth={2.2} className="flex-none" />
            {browser.area ? t('wanderer.browser.areaOn') : t('wanderer.browser.areaOff')}
          </button>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
        {notConnected ? (
          <EmptyState
            scene="tours"
            size={92}
            fill
            surface="var(--bg-secondary)"
            title={t('wanderer.browser.connectTitle')}
            action={
              <div className="flex flex-col items-center gap-3">
                <p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>
                  {browser.errorText(browser.searchError ?? 'not_connected')}
                </p>
                <Link
                  to="/settings?tab=integrations"
                  className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm hover:opacity-90"
                  style={fs(12.5, 'body')}
                >
                  <WandererMark size={14} />
                  {t('wanderer.browser.connect')}
                </Link>
              </div>
            }
          />
        ) : browser.searchError ? (
          <div className="px-1.5 py-3">
            <TourNotice tone="warning">
              <p className="m-0">{browser.errorText(browser.searchError)}</p>
              <button type="button" onClick={browser.retry} className="mt-1.5 font-semibold underline">
                {t('tours.planner.retry')}
              </button>
            </TourNotice>
          </div>
        ) : !browser.searching && browser.trails.length === 0 ? (
          <EmptyState
            scene="tours"
            size={92}
            fill
            surface="var(--bg-secondary)"
            title={browser.area ? t('wanderer.browser.emptyArea') : t('wanderer.browser.empty')}
            action={
              <p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>
                {t('wanderer.browser.emptyHint')}
              </p>
            }
          />
        ) : (
          <>
            <TourListCard
              icon={<WandererMark size={14} />}
              title={t('wanderer.browser.count', { count: browser.total })}
              aside={
                browser.area && (
                  <WhiteBadge icon={<MapPinned size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
                    {t('wanderer.browser.areaBadge')}
                  </WhiteBadge>
                )
              }
              label={t('wanderer.browser.title')}
            >
              {browser.trails.map((trail) => (
                <TrailRow key={trail.id} trail={trail} onSelect={() => void browser.select(trail)} />
              ))}
            </TourListCard>
            {browser.hasMore && (
              <div className="flex justify-center py-2">
                <DialogButton onClick={browser.loadMore} disabled={browser.searching}>
                  {t('wanderer.browser.more')}
                </DialogButton>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** One fact of a trail as the white badge the plan's rows use, named in full by its tooltip. */
function TrailBadge({
  icon: Icon,
  label,
  children,
  className = '',
}: {
  icon?: LucideIcon;
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip label={label}>
      <span aria-label={label} className="inline-flex flex-none">
        <WhiteBadge
          className={className}
          icon={Icon && <Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}
        >
          {children}
        </WhiteBadge>
      </span>
    </Tooltip>
  );
}

/**
 * The facts a trail carries in the index, as the white badges of a plan row.
 * A row shows time, distance and ascent, its avatar the rest (grade, in the
 * trip, private). The preview has no avatar, so it names those as badges, and
 * leaves out distance and ascent: it measures both from the GPX itself, and two
 * numbers for one thing only confuse.
 */
function TrailBadges({ trail, variant }: { trail: WandererTrailSummary; variant: 'row' | 'preview' }) {
  const preview = variant === 'preview';
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const distance = trail.distanceM != null ? formatDistance(trail.distanceM / 1000, unit) : null;
  const ascent = trail.elevationGainM != null ? formatElevation(trail.elevationGainM, unit) : null;
  const duration = trail.durationS != null ? formatPlannedTourDuration(Math.round(trail.durationS / 60)) : null;
  const level = wandererDifficultyToSac(trail.difficulty);
  return (
    <>
      {preview && trail.importedAs.length > 0 && (
        <TrailBadge label={t('wanderer.browser.inTripHint')} className="text-success">
          <Check size={10} strokeWidth={2.6} className="flex-none" />
          {t('wanderer.browser.inTrip')}
        </TrailBadge>
      )}
      {duration && (
        <TrailBadge icon={Clock} label={`${t('tours.planner.inspector.duration')}: ${duration}`}>
          {duration}
        </TrailBadge>
      )}
      {!preview && distance && (
        <TrailBadge icon={Ruler} label={`${t('tours.detail.distance')}: ${distance}`}>
          {distance}
        </TrailBadge>
      )}
      {!preview && ascent && (
        <TrailBadge icon={ArrowUp} label={`${t('tours.detail.ascent')}: ${ascent}`}>
          {ascent}
        </TrailBadge>
      )}
      {preview && level != null && (
        <TrailBadge label={t(`tours.planner.difficulty.t${level}`)}>{`T${level}`}</TrailBadge>
      )}
      {preview && (
        <TrailBadge
          icon={trail.public ? Globe : Lock}
          label={trail.public ? t('wanderer.browser.publicHint') : t('wanderer.browser.privateHint')}
        >
          {trail.public ? t('wanderer.browser.public') : t('wanderer.browser.private')}
        </TrailBadge>
      )}
    </>
  );
}

/** The row's round tile with the trail's grade, and a check on it once the trail is in the trip. */
function TrailAvatar({ trail }: { trail: WandererTrailSummary }) {
  const { t } = useTranslation();
  return (
    <span className="relative flex-none">
      <TourDayRowAvatar
        tour={{ tour_type: 'hike', max_hiking_difficulty: wandererDifficultyToSac(trail.difficulty) }}
      />
      {trail.importedAs.length > 0 && (
        <Tooltip label={t('wanderer.browser.inTripHint')}>
          <span
            aria-label={t('wanderer.browser.inTrip')}
            className="absolute -end-0.5 -top-0.5 grid h-[15px] w-[15px] place-items-center rounded-full bg-surface-card text-success shadow-sm ring-1 ring-edge-faint"
          >
            <Check size={9} strokeWidth={3} />
          </span>
        </Tooltip>
      )}
    </span>
  );
}

/** A trail in the results, laid out like a stop in the day plan: avatar, name, one line of badges and where it is. */
function TrailRow({ trail, onSelect }: { trail: WandererTrailSummary; onSelect: () => void }) {
  return (
    <li
      role="option"
      aria-selected={false}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className="mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-[10px] px-1.5 py-2 outline-none transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover"
    >
      <TrailAvatar trail={trail} />
      <div className="min-w-0 flex-1">
        <span className="block min-w-0 truncate font-semibold leading-tight text-content" style={fs(13, 'body')}>
          {trail.name}
        </span>
        <div className="mt-0.5 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden">
          <TrailBadges trail={trail} variant="row" />
        </div>
      </div>
    </li>
  );
}

function TrailPreview({ browser }: { browser: WandererBrowser }) {
  const { t, locale } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const trail = browser.preview?.trail ?? browser.selected;
  if (!trail) return null;
  const preview = browser.preview;
  const snapshot = preview?.state === 'unchanged' ? preview.snapshot : null;
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
        <div className="min-w-0">
          {trail.location && (
            <p className="m-0 text-content-muted" style={fs(12, 'body')}>
              {trail.location}
            </p>
          )}
          {trail.author && (
            <p className="m-0 mt-0.5 flex items-center gap-1 text-content-faint" style={fs(11.5, 'body')}>
              <User size={11} strokeWidth={2} className="flex-none" />
              {trail.author}
            </p>
          )}
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1">
            <TrailBadges trail={trail} variant="preview" />
          </div>
        </div>

        {browser.previewing && (
          <TourNotice
            icon={<Loader2 size={13} strokeWidth={2} className="animate-spin text-content-faint" />}
            role="status"
          >
            {t('wanderer.preview.loading')}
          </TourNotice>
        )}
        {browser.previewError && <TourNotice tone="warning">{browser.errorText(browser.previewError)}</TourNotice>}

        {preview && (
          <>
            <SnapshotNotice preview={preview} locale={locale} onOpen={browser.openSnapshot} />
            <TourSection label={t('wanderer.preview.measured')}>
              <TourMetricFields
                columns={2}
                unit={unit}
                analysis={{
                  distanceKm: preview.distanceKm,
                  minEle: null,
                  maxEle: null,
                  gain: preview.elevationGainM,
                  loss: preview.elevationLossM,
                }}
                extra={[{ label: t('wanderer.preview.points'), value: preview.points.toLocaleString(locale) }]}
              />
              {!preview.hasElevation && (
                <p className="m-0 mt-2 text-content-faint" style={fs(11.5, 'body')}>
                  {t('wanderer.preview.noElevation')}
                </p>
              )}
            </TourSection>
            {trail.description && (
              <TourSection label={t('places.formDescription')}>
                <p
                  className="m-0 whitespace-pre-line rounded-[10px] bg-surface-card px-3 py-2 text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint"
                  style={fs(12, 'body')}
                >
                  {trail.description}
                </p>
              </TourSection>
            )}
          </>
        )}

        <a
          href={trail.externalUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 text-content-secondary hover:text-content hover:underline"
          style={fs(12, 'body')}
        >
          <ExternalLink size={13} className="flex-none" />
          {t('wanderer.preview.openExternal')}
        </a>
      </div>

      <div className="flex flex-none flex-col gap-2 border-t border-edge-faint px-3 py-3">
        {snapshot ? (
          <DialogButton
            variant="primary"
            onClick={() => browser.openSnapshot(snapshot.placeId)}
            icon={<Check size={14} strokeWidth={2} />}
          >
            {t('wanderer.preview.openSnapshot')}
          </DialogButton>
        ) : (
          <DialogButton
            variant="primary"
            onClick={() => void browser.importSelected()}
            disabled={!preview || browser.importing}
            icon={
              browser.importing ? (
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
              ) : (
                <Download size={14} strokeWidth={2} />
              )
            }
          >
            {preview?.state === 'changed' ? t('wanderer.preview.importNewVersion') : t('wanderer.preview.import')}
          </DialogButton>
        )}
      </div>
    </>
  );
}

/** How the trail stands to a snapshot already in the trip, and what importing it again would do. */
function SnapshotNotice({
  preview,
  locale,
  onOpen,
}: {
  preview: WandererImportPreview;
  locale: string;
  onOpen: (placeId: number) => void;
}) {
  const { t } = useTranslation();
  const snapshot = preview.snapshot;
  if (preview.state === 'new' || !snapshot) {
    return <TourNotice>{t('wanderer.preview.newHint')}</TourNotice>;
  }
  const when = snapshot.importedAt
    ? new Date(`${snapshot.importedAt.replace(' ', 'T')}Z`).toLocaleDateString(locale)
    : '';
  const open = (
    <button
      type="button"
      onClick={() => onOpen(snapshot.placeId)}
      className="mt-1 inline-flex items-center gap-1 font-semibold underline"
    >
      {t('wanderer.preview.openSnapshotShort')}
    </button>
  );
  if (preview.state === 'unchanged') {
    return (
      <TourNotice icon={<Check size={13} strokeWidth={2.2} className="text-success" />}>
        <p className="m-0">{t('wanderer.preview.unchanged', { name: snapshot.name, date: when })}</p>
      </TourNotice>
    );
  }
  const parts = preview.changes.map((part) => t(`wanderer.preview.change.${part}`)).join(', ');
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2.2} />}>
      <p className="m-0">{t('wanderer.preview.changed', { name: snapshot.name, date: when, parts })}</p>
      {snapshot.editedLocally && <p className="m-0 mt-1">{t('wanderer.preview.editedLocally')}</p>}
      <p className="m-0 mt-1">{t('wanderer.preview.newVersionHint')}</p>
      {open}
    </TourNotice>
  );
}
