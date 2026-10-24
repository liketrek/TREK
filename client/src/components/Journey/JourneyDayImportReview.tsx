import { Clock, FilePen, Loader2, RefreshCw, Route, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatClockTime } from '../../utils/formatters';
import { formatDistance } from '../../utils/units';
import { SoftPill } from '../Planner/planParts';
import ToggleSwitch from '../Settings/ToggleSwitch';
import { Segmented } from '../shared/dialogParts';
import { DialogButton, DialogSection, FooterSpacer, fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { JourneyDayImportStays } from './JourneyDayImportStays';
import JourneyMap from './JourneyMapAuto';
import { reasonText } from './journeyRecordingModel';
import { dayPrepNotice } from './journeyRecordingPrepModel';
import { JourneyRecordingPrepStatus } from './JourneyRecordingPrepSetting';
import { Notice } from './JourneyRecordingReview';
import { stayMarkerId, type JourneyDayImportState } from './useJourneyDayImport';
import type { JourneyRecordingPrepState } from './useJourneyRecordingPrep';

type Props = { state: JourneyDayImportState; dayColor: string; prep?: JourneyRecordingPrepState };

/**
 * Why the list may not be the whole day, and what went wrong on the way. With
 * the journey preparing its days, why this day is not final yet and how the
 * caller's own preparation stands, so an editor sees it without the settings.
 */
function DayNotices({ state, prep }: { state: JourneyDayImportState; prep?: JourneyRecordingPrepState }) {
  const { t, locale } = useTranslation();
  const { review, outcome } = state;
  const reason = review ? reasonText(review.error, t) : '';
  const day = prep?.dayPrep(state.date);
  const dayNotice = day ? dayPrepNotice(day, t, locale) : '';
  return (
    <>
      {outcome?.kind === 'failed' && (
        <Notice tone="danger">{t('journey.dayImport.failed', { reason: outcome.reason })}</Notice>
      )}
      {outcome?.kind === 'route' && (
        <Notice tone="warning">{t('journey.dayImport.routeFailed', { reason: outcome.reason })}</Notice>
      )}
      {review && !review.fresh && (
        <Notice tone="warning">
          {review.syncedAt
            ? t('journey.dayImport.stale', {
                reason,
                date: new Date(review.syncedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
              })
            : t('journey.dayImport.staleNever', { reason })}
        </Notice>
      )}
      {review?.truncated && <Notice tone="warning">{t('journey.dayImport.truncated')}</Notice>}
      {state.running && <Notice tone="info">{t('journey.dayImport.running')}</Notice>}
      {dayNotice && <Notice tone="warning">{dayNotice}</Notice>}
      {prep && <JourneyRecordingPrepStatus prep={prep} />}
    </>
  );
}

/** The day's route under the pins: kept already, to keep along, kept in another version, or none recorded. */
function RouteLine({ state }: { state: JourneyDayImportState }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit) ?? 'metric';
  const { route } = state;
  const distance = route.distanceMeters === null ? null : formatDistance(route.distanceMeters / 1000, unit);
  if (route.offer === 'loading') {
    return (
      <p className="m-0 flex items-center gap-1.5 text-content-faint" style={fs(11.5)}>
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        {t('journey.recording.loading')}
      </p>
    );
  }
  if (route.offer === 'keep') {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-content" style={fs(12.5, 'body')}>
            {t('journey.dayImport.keepRoute')}
          </span>
          <span className="block text-content-faint" style={fs(11.5)}>
            {t('journey.dayImport.keepRouteHint', { distance: distance ?? '' })}
          </span>
        </span>
        <ToggleSwitch on={route.keep} onToggle={route.toggle} label={t('journey.dayImport.keepRoute')} />
      </div>
    );
  }
  if (route.offer === 'none') {
    return (
      <p className="m-0 text-content-faint" style={fs(11.5)}>
        {t('journey.dayImport.routeNone')}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {distance && <SoftPill icon={<Route size={11} aria-hidden="true" />}>{distance}</SoftPill>}
      <SoftPill tone="success">{t('journey.dayImport.routeKept')}</SoftPill>
      {route.offer === 'differs' && (
        <span className="text-content-faint" style={fs(11.5)}>
          {t('journey.dayImport.routeDiffers')}
        </span>
      )}
    </div>
  );
}

/** What the journal has on the day already, so nothing is taken over twice by hand. */
function DayEntries({ state }: { state: JourneyDayImportState }) {
  const { t } = useTranslation();
  const is12h = useSettingsStore((s) => s.settings.time_format) === '12h';
  const entries = state.review?.entries ?? [];
  if (entries.length === 0) return null;
  return (
    <DialogSection label={t('journey.dayImport.existing')}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex min-w-0 items-center gap-1.5 text-content-secondary"
            style={fs(12.5, 'body')}
          >
            <span className="truncate">{entry.title || entry.locationName || t('journey.dayImport.untitled')}</span>
            {entry.entryTime && (
              <SoftPill icon={<Clock size={11} aria-hidden="true" />}>
                {formatClockTime(entry.entryTime, is12h)}
              </SoftPill>
            )}
            {entry.isDraft && (
              <SoftPill icon={<FilePen size={11} aria-hidden="true" />}>{t('journey.dayImport.draft')}</SoftPill>
            )}
          </li>
        ))}
      </ul>
    </DialogSection>
  );
}

function scrollToStay(id: string): void {
  document
    .querySelector(`[data-stay-id="${id.replace('stay-', '')}"]`)
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/**
 * Reviewing a recorded day with its stays (JRN-02): the route and the stays on
 * one map, the stays as a list to choose, rename and join, what the journal
 * holds on the day already, and who will see the drafts. The body of the
 * desktop dialog and of the phone sheet alike.
 */
export function JourneyDayImportReview({ state, dayColor, prep }: Props) {
  const { t } = useTranslation();
  const { review, choice } = state;
  if (!review) {
    if (state.error) {
      return (
        <div className="flex flex-col gap-2">
          <Notice tone="danger">{state.error}</Notice>
          <span>
            <DialogButton onClick={state.retry} icon={<RefreshCw size={14} aria-hidden="true" />}>
              {t('journey.recording.retry')}
            </DialogButton>
          </span>
        </div>
      );
    }
    return (
      <p className="m-0 flex items-center gap-2 py-6 text-content-muted" role="status" style={fs(12.5, 'body')}>
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        {t('journey.dayImport.loading')}
      </p>
    );
  }
  return (
    <>
      <DayNotices state={state} prep={prep} />
      <DialogSection label={t('journey.dayImport.map')}>
        <div className="flex flex-col gap-2.5">
          <div className="overflow-hidden rounded-[12px] border border-edge-faint">
            <JourneyMap
              checkins={[]}
              entries={state.mapEntries}
              tracks={state.mapTracks}
              height={200}
              activeMarkerId={state.activeStay === null ? null : stayMarkerId(state.activeStay)}
              onMarkerClick={scrollToStay}
            />
          </div>
          <RouteLine state={state} />
        </div>
      </DialogSection>
      <DialogSection
        label={t('journey.dayImport.stays')}
        action={
          choice && review.stays.length > 1 ? (
            <Segmented
              label={t('journey.dayImport.stays')}
              value={choice.mode}
              onChange={state.setMode}
              options={[
                { value: 'entries', label: t('journey.dayImport.modeEntries') },
                { value: 'report', label: t('journey.dayImport.modeReport') },
              ]}
            />
          ) : undefined
        }
      >
        {review.stays.length === 0 ? (
          <Notice tone="info">{t('journey.dayImport.empty')}</Notice>
        ) : (
          <JourneyDayImportStays state={state} dayColor={dayColor} />
        )}
      </DialogSection>
      <DayEntries state={state} />
      <p className="m-0 flex items-start gap-2 text-content-muted" style={fs(12, 'body')}>
        <Users size={14} className="mt-px flex-none" aria-hidden="true" />
        {review.audience > 0
          ? t('journey.dayImport.audience', { count: review.audience })
          : t('journey.dayImport.draftsNote')}
      </p>
    </>
  );
}

/**
 * The buttons under the review: how many stays are left out, close, and the
 * one that takes the chosen stays over as drafts, saying why when it cannot
 * yet. After a route that was not kept, it offers the route alone again.
 */
export function JourneyDayImportActions({ state, onCancel }: { state: JourneyDayImportState; onCancel: () => void }) {
  const { t } = useTranslation();
  const { problem, busy } = state;
  const working = busy !== null;
  if (state.outcome?.kind === 'route') {
    return (
      <>
        <FooterSpacer />
        <DialogButton onClick={onCancel}>{t('common.close')}</DialogButton>
        <DialogButton
          variant="primary"
          onClick={state.retryRoute}
          disabled={working}
          icon={busy === 'route' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : undefined}
        >
          {t('journey.dayImport.routeRetry')}
        </DialogButton>
      </>
    );
  }
  const submit = (
    <DialogButton
      variant="primary"
      onClick={state.submit}
      disabled={problem !== null || working || state.loading}
      icon={busy === 'submit' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : undefined}
    >
      {t('journey.dayImport.submit', { count: state.groups.length })}
    </DialogButton>
  );
  return (
    <>
      {state.skipCount > 0 && (
        <Tooltip label={t('journey.dayImport.skipHint')} placement="top">
          <button type="button" className="inline-flex cursor-default">
            <SoftPill>{t('journey.dayImport.skipped', { count: state.skipCount })}</SoftPill>
          </button>
        </Tooltip>
      )}
      <FooterSpacer />
      <DialogButton onClick={onCancel}>{t('common.cancel')}</DialogButton>
      {problem !== null && state.review && state.review.stays.length > 0 ? (
        <Tooltip label={t(`journey.dayImport.problem.${problem}`)} placement="top">
          <span className="inline-flex">{submit}</span>
        </Tooltip>
      ) : (
        submit
      )}
    </>
  );
}
