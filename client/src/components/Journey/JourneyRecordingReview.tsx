import type { JourneyRecordedDay, JourneyRecordingPreview } from '@trek/shared';
import { AlertTriangle, Clock, Info, Loader2, RefreshCw, Route, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance } from '../../utils/units';
import { SoftPill } from '../Planner/planParts';
import ConfirmDialog from '../shared/ConfirmDialog';
import CustomSelect from '../shared/CustomSelect';
import { PANEL } from '../shared/dialogParts';
import { DeleteButton, DialogButton, DialogSection, FooterSpacer, fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { modeLabel, sketchPaths } from './journeyRecordingModel';
import type { useJourneyRecordingDay } from './useJourneyRecordingDay';

type RecordingDayState = ReturnType<typeof useJourneyRecordingDay>;

const SKETCH_W = 320;
const SKETCH_H = 150;

/** A sentence about the recording, its icon saying how much it matters. */
export function Notice({ tone, children }: { tone: 'info' | 'warning' | 'danger'; children: ReactNode }) {
  const look = {
    info: 'bg-surface-secondary text-content-secondary',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  }[tone];
  const Icon = tone === 'info' ? Info : AlertTriangle;
  return (
    <p className={`m-0 flex items-start gap-2 rounded-[12px] px-3 py-2.5 ${look}`} style={fs(12.5, 'body')}>
      <Icon size={15} strokeWidth={2} className="mt-px flex-none" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** The day's pieces drawn into a box, each its own line, so a gap stays a gap. */
function RecordingSketch({ segments }: { segments: JourneyRecordingPreview['segments'] }) {
  const { paths, ends } = sketchPaths(segments, SKETCH_W, SKETCH_H);
  return (
    <svg
      viewBox={`0 0 ${SKETCH_W} ${SKETCH_H}`}
      className="block h-[150px] w-full"
      role="img"
      aria-hidden="true"
      data-testid="recording-sketch"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {ends.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="var(--bg-card)" stroke="var(--text-faint)" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

/** A time of the recording on the clock of the zone the day is cut in. */
function clockIn(iso: string, zoneMinutes: number, locale: string, is12h: boolean): string {
  return new Date(Date.parse(iso) + zoneMinutes * 60_000).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: is12h,
  });
}

/** The day in figures: the sketch, how far, when, in how many pieces and gaps, how and from what. */
function RecordingFacts({ preview }: { preview: JourneyRecordingPreview }) {
  const { t, locale } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit) ?? 'metric';
  const is12h = useSettingsStore((s) => s.settings.time_format) === '12h';
  const { stats } = preview;
  return (
    <div className={PANEL}>
      <RecordingSketch segments={preview.segments} />
      <div className="flex flex-wrap items-center gap-1.5">
        <SoftPill icon={<Route size={11} aria-hidden="true" />}>
          {formatDistance(stats.distanceMeters / 1000, unit)}
        </SoftPill>
        {stats.firstAt && stats.lastAt && (
          <SoftPill icon={<Clock size={11} aria-hidden="true" />}>
            {t('journey.recording.span', {
              from: clockIn(stats.firstAt, preview.utcOffsetMinutes, locale, is12h),
              to: clockIn(stats.lastAt, preview.utcOffsetMinutes, locale, is12h),
            })}
          </SoftPill>
        )}
        <SoftPill>{t('journey.recording.pieces', { count: stats.segmentCount })}</SoftPill>
        {stats.gapCount > 0 && (
          <Tooltip label={t('journey.recording.gapsHint')} placement="top">
            <button type="button" className="inline-flex cursor-default">
              <SoftPill tone="info">{t('journey.recording.gaps', { count: stats.gapCount })}</SoftPill>
            </button>
          </Tooltip>
        )}
        {stats.modes.map((mode) => (
          <SoftPill key={mode}>{modeLabel(mode, t)}</SoftPill>
        ))}
        <Tooltip label={t('journey.recording.sourceHint')} placement="top">
          <button type="button" className="inline-flex cursor-default">
            <SoftPill>
              {t(preview.sourceKind === 'tracks' ? 'journey.recording.sourceTracks' : 'journey.recording.sourcePoints')}
            </SoftPill>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

/** Every reason to look twice before keeping the day, and who will see it. */
function RecordingNotices({
  preview,
  changedSincePreview,
}: {
  preview: JourneyRecordingPreview;
  changedSincePreview: boolean;
}) {
  const { t, locale } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit) ?? 'metric';
  const { stored } = preview;
  return (
    <>
      {changedSincePreview && <Notice tone="warning">{t('journey.recording.changedSincePreview')}</Notice>}
      {preview.truncated && <Notice tone="warning">{t('journey.recording.truncated')}</Notice>}
      {preview.provisional && <Notice tone="warning">{t('journey.recording.provisional')}</Notice>}
      {preview.sameAsStored && <Notice tone="info">{t('journey.recording.same')}</Notice>}
      {stored && !preview.sameAsStored && (
        <Notice tone="info">
          {t('journey.recording.differs', {
            date: new Date(stored.savedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
            distance: formatDistance(stored.stats.distanceMeters / 1000, unit),
          })}
        </Notice>
      )}
      {preview.audience > 0 && (
        <p className="m-0 flex items-start gap-2 text-content-muted" style={fs(12, 'body')}>
          <Users size={14} className="mt-px flex-none" aria-hidden="true" />
          {t('journey.recording.audience', { count: preview.audience })}
        </p>
      )}
    </>
  );
}

/** Reading, failed, nothing recorded, or the day to look at. */
function RecordingState({ day, stored }: { day: RecordingDayState; stored: JourneyRecordedDay | undefined }) {
  const { t } = useTranslation();
  const { preview } = day;
  if (day.loading) {
    return (
      <p className="m-0 flex items-center gap-2 py-6 text-content-muted" role="status" style={fs(12.5, 'body')}>
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        {t('journey.recording.loading')}
      </p>
    );
  }
  if (day.error) {
    return (
      <div className="flex flex-col gap-2">
        <Notice tone="danger">
          {day.error}
          {stored && ` ${t('journey.recording.keptStays')}`}
        </Notice>
        <span>
          <DialogButton onClick={day.retry} icon={<RefreshCw size={14} aria-hidden="true" />}>
            {t('journey.recording.retry')}
          </DialogButton>
        </span>
      </div>
    );
  }
  if (!preview) return null;
  if (preview.contentHash === null) return <Notice tone="info">{t('journey.recording.empty')}</Notice>;
  return (
    <div className="flex flex-col gap-3">
      <RecordingFacts preview={preview} />
      <RecordingNotices preview={preview} changedSincePreview={day.changedSincePreview} />
    </div>
  );
}

/**
 * What taking a day over would keep (JRN-01): the zone the day is cut in, the
 * recording as a sketch and in figures, and every reason to look twice. The
 * body of the desktop dialog and of the phone sheet alike.
 */
export function JourneyRecordingReview({
  day,
  stored,
}: {
  day: RecordingDayState;
  /** What the journey keeps for the day, known even when Dawarich does not answer. */
  stored: JourneyRecordedDay | undefined;
}) {
  const { t } = useTranslation();
  return (
    <>
      <DialogSection label={t('journey.recording.zone')}>
        <CustomSelect
          ariaLabel={t('journey.recording.zone')}
          value={day.zone}
          onChange={(value) => day.chooseZone(Number(value))}
          options={day.zoneOptions}
          disabled={day.loading}
        />
        <p className="m-0 mt-1.5 text-content-faint" style={fs(11.5)}>
          {t('journey.recording.zoneHint')}
        </p>
      </DialogSection>
      <DialogSection label={t('journey.recording.scope')}>
        <RecordingState day={day} stored={stored ?? day.preview?.stored ?? undefined} />
      </DialogSection>
    </>
  );
}

/**
 * The buttons under the review: drop the kept route (asked first), close, and
 * the one that keeps, replaces or says the day is kept already.
 */
export function JourneyRecordingActions({
  day,
  stored,
  onCancel,
}: {
  day: RecordingDayState;
  stored: JourneyRecordedDay | undefined;
  onCancel: () => void;
}) {
  const { action, busy } = day;
  const hasStored = Boolean(stored ?? day.preview?.stored);
  const onSave = () => void day.save();
  const onRemove = () => void day.remove();
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const primary =
    action === 'replace'
      ? t('journey.recording.replace')
      : action === 'same'
        ? t('journey.recording.alreadyKept')
        : t('journey.recording.keep');
  const canSave = (action === 'keep' || action === 'replace') && busy === null;

  return (
    <>
      {hasStored && (
        <DeleteButton
          onClick={() => setConfirming(true)}
          label={t('journey.recording.remove')}
          disabled={busy !== null}
        />
      )}
      <FooterSpacer />
      <DialogButton onClick={onCancel}>{t('common.cancel')}</DialogButton>
      <DialogButton
        variant="primary"
        onClick={onSave}
        disabled={!canSave}
        icon={busy === 'save' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : undefined}
      >
        {primary}
      </DialogButton>
      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
        title={t('journey.recording.removeTitle')}
        message={t('journey.recording.removeMessage')}
        confirmLabel={t('journey.recording.remove')}
      />
    </>
  );
}
