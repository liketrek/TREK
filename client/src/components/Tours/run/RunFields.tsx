import { MAX_RUN_PACE_SECONDS_PER_KM, MIN_RUN_PACE_SECONDS_PER_KM, RUN_PROFILES, type RunProfile } from '@trek/shared';
import { Clock, Gauge, Info, Ruler } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { DistanceUnit } from '../../../types';
import { formatDistance } from '../../../utils/units';
import { INPUT, LABEL, Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { FigureBadge } from '../paddle/FigureBadge';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { InfoDot, TourNotice } from '../tourParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import { formatRunPace, parseRunPace, RUN_PACE_INPUT_MAX_LENGTH, runPaceInvalid, runPaceUnitText } from './runPace';
import { RUN_PROFILE_ICON } from './runProfileIcon';

/**
 * RUN-01, RUN-02: what a run is planned as, running or trail running, chosen
 * on purpose like a bike tour's profile, with a line on the ways it asks the
 * router for. The planner and the GPX import share it.
 */
export function RunProfileField({ value, onChange }: { value: RunProfile; onChange: (profile: RunProfile) => void }) {
  const { t } = useTranslation();
  return (
    <div data-testid="tour-run-profile" className="min-w-0">
      <span className={LABEL}>{t('tours.run.profile')}</span>
      <Segmented<RunProfile>
        value={value}
        onChange={onChange}
        label={t('tours.run.profile')}
        fill
        options={RUN_PROFILES.map((profile) => {
          const Icon = RUN_PROFILE_ICON[profile];
          return {
            value: profile,
            label: t(`tours.run.profile.${profile}`),
            icon: <Icon size={13} strokeWidth={2} aria-hidden="true" />,
          };
        })}
      />
      <span className="mt-1.5 block text-content-faint" style={fs(11, 'body')}>
        {t(`tours.run.profileHint.${value}`)}
      </span>
    </div>
  );
}

type RunPlanner = Pick<
  TourPlannerController,
  'runProfile' | 'setRunProfile' | 'runPace' | 'runPaceMissing' | 'runPaceInvalid' | 'routeAnalysis'
> & { walkingDurationMinutes: number | null };

/** The distance unit the user reads distances in, which a pace is typed and read in too. */
function useDistanceUnit(): DistanceUnit {
  return useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
}

/**
 * The pace as min:s per km, or per mile with distances in miles; it is kept
 * per km whatever the unit. A pace a run can be saved with reaches the planner
 * while it is typed. Anything else waits for leaving the field (or Enter), so
 * the first digit of "12:30" flashes no error: then a pace out of bounds
 * reaches the planner as it is and text that is no pace as NaN, the planner
 * marks either and holds Save back, and the text stays for the runner to fix.
 * The field never offers a pace of its own: the placeholder is the format.
 */
function RunPaceInput({ planner, locked }: { planner: RunPlanner; locked: boolean }) {
  const { t } = useTranslation();
  const unit = useDistanceUnit();
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const { paceSecondsPerKm: pace, setPace } = planner.runPace;
  const unreadable = pace !== null && Number.isNaN(pace);
  const shown = pace === null || unreadable ? '' : formatRunPace(pace, unit);
  const showDraft = draft !== null && (focused || unreadable);
  return (
    <div className="relative">
      <input
        id="tour-planner-run-pace"
        type="text"
        inputMode="text"
        autoComplete="off"
        maxLength={RUN_PACE_INPUT_MAX_LENGTH}
        placeholder="0:00"
        disabled={locked}
        value={showDraft ? draft : shown}
        onFocus={() => {
          setFocused(true);
          // Text that is no pace yet stays to be fixed; otherwise editing starts from the pace as it reads.
          setDraft(unreadable ? (draft ?? '') : shown);
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parseRunPace(event.target.value, unit);
          if (!runPaceInvalid(parsed)) setPace(parsed);
        }}
        onBlur={() => {
          setFocused(false);
          if (draft === null) return;
          const parsed = parseRunPace(draft, unit);
          setPace(parsed);
          if (!Number.isNaN(parsed)) setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        aria-invalid={planner.runPaceInvalid || undefined}
        aria-describedby={planner.runPaceInvalid ? 'tour-planner-run-pace-error' : undefined}
        className={`${INPUT} pe-16 tabular-nums`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-content-faint"
        style={fs(12, 'body')}
      >
        {runPaceUnitText(unit, t)}
      </span>
    </div>
  );
}

/**
 * The sum the running time is, laid out as badges: the distance, times the
 * pace, is the time, both in the unit the user reads distances in. Shown once all three are known, so the runner sees
 * where the time comes from and that nothing else goes into it.
 */
function RunTimeSum({ planner }: { planner: RunPlanner }) {
  const { t } = useTranslation();
  const unit = useDistanceUnit();
  const distanceKm = planner.routeAnalysis?.distanceKm ?? null;
  const pace = planner.runPace.paceSecondsPerKm;
  const minutes = planner.walkingDurationMinutes;
  if (distanceKm === null || pace === null || planner.runPaceInvalid || minutes === null) return null;
  // The pace reads per km or per mile as the distances do, so the sum reads in that unit too.
  const distance = formatDistance(distanceKm, unit);
  const paceText = `${formatRunPace(pace, unit)} ${runPaceUnitText(unit, t)}`;
  const time = formatPlannedTourDuration(minutes);
  const operator = 'font-geist font-semibold text-content-faint';
  return (
    <div
      data-testid="tour-run-time-sum"
      role="note"
      aria-label={t('tours.run.timeSum', { distance, pace: paceText, time })}
      className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5"
    >
      <FigureBadge icon={<Ruler size={11} strokeWidth={2} aria-hidden="true" />} value={distance} />
      <span aria-hidden="true" className={operator} style={fs(12)}>
        ×
      </span>
      <FigureBadge icon={<Gauge size={11} strokeWidth={2} aria-hidden="true" />} value={paceText} />
      <span aria-hidden="true" className={operator} style={fs(12)}>
        =
      </span>
      <FigureBadge icon={<Clock size={11} strokeWidth={2} aria-hidden="true" />} value={time} />
    </div>
  );
}

/**
 * RUN-01: a run's profile and the pace it is planned at. The time is the
 * distance at that pace; the info dot says climbs and difficulty stay out of
 * it, and the sum below the field shows it. Without a pace the run cannot be
 * saved, since its time would be unknown.
 */
export function RunFields({ planner, locked }: { planner: RunPlanner; locked: boolean }) {
  const { t } = useTranslation();
  const unit = useDistanceUnit();
  const bounds = {
    fastest: formatRunPace(MIN_RUN_PACE_SECONDS_PER_KM, unit),
    slowest: formatRunPace(MAX_RUN_PACE_SECONDS_PER_KM, unit),
  };
  return (
    <div data-testid="tour-planner-run-fields" className="flex min-w-0 flex-col gap-3">
      <RunProfileField value={planner.runProfile} onChange={planner.setRunProfile} />
      <div className="min-w-0">
        <div className="mb-[5px] flex min-h-5 min-w-0 items-center gap-1">
          <label className={`${LABEL} !mb-0 min-w-0 truncate leading-5`} htmlFor="tour-planner-run-pace">
            {t('tours.run.pace')}
          </label>
          <InfoDot label={t('tours.run.paceInfoLabel')} description={t('tours.run.paceInfo')} />
        </div>
        <RunPaceInput planner={planner} locked={locked} />
        {planner.runPaceInvalid ? (
          <span id="tour-planner-run-pace-error" role="alert" className="mt-1 block text-danger" style={fs(11)}>
            {t(unit === 'imperial' ? 'tours.run.paceInvalidMi' : 'tours.run.paceInvalid', bounds)}
          </span>
        ) : (
          <RunTimeSum planner={planner} />
        )}
      </div>
      {planner.runPaceMissing && (
        <TourNotice role="status" icon={<Info size={13} strokeWidth={2} />}>
          {t('tours.run.paceNeeded')}
        </TourNotice>
      )}
    </div>
  );
}
