import type { JourneyDayStay } from '@trek/shared';
import { Check, Clock, Gauge, HelpCircle, Hourglass, Link2, MapPinOff, Unlink2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDuration, timeRange } from '../Dawarich/dawarichSuggestionModel';
import { SoftPill } from '../Planner/planParts';
import { INPUT, PANEL, PillSelect } from '../shared/dialogParts';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { canJoin, isTakeable, nameOf, REPORT_KEY, type DayImportGroup } from './journeyDayImportModel';
import type { JourneyDayImportState } from './useJourneyDayImport';

type Props = { state: JourneyDayImportState; dayColor: string };

/** A fact about a stay with what it means on hover. */
function Hinted({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip label={label} placement="top">
      <button type="button" className="inline-flex cursor-default">
        {children}
      </button>
    </Tooltip>
  );
}

/** Where a stay stands, when it is not simply open: in this journal already, taken elsewhere, or left out before. */
function StatusPill({ stay }: { stay: JourneyDayStay }) {
  const { t } = useTranslation();
  if (stay.status === 'here') {
    return (
      <SoftPill tone="success" icon={<Check size={11} aria-hidden="true" />}>
        {stay.entry?.title
          ? t('journey.dayImport.statusHere', { title: stay.entry.title })
          : t('journey.dayImport.statusHereUntitled')}
      </SoftPill>
    );
  }
  if (stay.status === 'elsewhere') {
    return (
      <Hinted label={t('journey.dayImport.statusElsewhereHint')}>
        <SoftPill icon={<Check size={11} aria-hidden="true" />}>{t('journey.dayImport.statusElsewhere')}</SoftPill>
      </Hinted>
    );
  }
  if (stay.status === 'skipped') return <SoftPill>{t('journey.dayImport.statusSkipped')}</SoftPill>;
  return null;
}

/** When, how long, how sure Dawarich is and whether it has a place: every fact the recording gives, no more. */
function StayFacts({ stay }: { stay: JourneyDayStay }) {
  const { t } = useTranslation();
  const is12h = useSettingsStore((s) => s.settings.time_format) === '12h';
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <SoftPill icon={<Clock size={11} aria-hidden="true" />}>
        {timeRange(stay.startedAt, stay.endedAt, is12h)}
      </SoftPill>
      <SoftPill icon={<Hourglass size={11} aria-hidden="true" />}>{formatDuration(stay.durationMinutes, t)}</SoftPill>
      {stay.sourceStatus === 'suggested' && (
        <Hinted label={t('dawarich.sourceStatus.suggested')}>
          <SoftPill tone="warning" icon={<HelpCircle size={11} aria-hidden="true" />}>
            {t('journey.dayImport.unconfirmed')}
          </SoftPill>
        </Hinted>
      )}
      {stay.confidenceBand === 'low' && (
        <Hinted label={t('dawarich.confidence.low')}>
          <SoftPill tone="warning" icon={<Gauge size={11} aria-hidden="true" />}>
            {t('dawarich.badge.lowConfidence')}
          </SoftPill>
        </Hinted>
      )}
      {stay.lat === null && (
        <Hinted label={t('journey.dayImport.noPlaceHint')}>
          <SoftPill icon={<MapPinOff size={11} aria-hidden="true" />}>{t('journey.dayImport.noPlace')}</SoftPill>
        </Hinted>
      )}
      <StatusPill stay={stay} />
    </div>
  );
}

/** One stay: chosen or not, its number on the map, its name to correct, and its facts. */
function StayRow({ state, dayColor, stay, index }: Props & { stay: JourneyDayStay; index: number }) {
  const { t } = useTranslation();
  const { choice } = state;
  const takeable = isTakeable(stay);
  const chosen = takeable && !!choice?.selected.has(stay.suggestionId);
  const name = choice ? nameOf(choice, stay) : stay.name;
  const active = state.activeStay === stay.suggestionId;
  return (
    <div
      data-stay-id={stay.suggestionId}
      onMouseEnter={() => state.setActiveStay(stay.suggestionId)}
      onMouseLeave={() => state.setActiveStay(null)}
      className={`flex items-start gap-2.5 rounded-[12px] border px-2.5 py-2 transition-opacity ${
        active ? 'border-edge' : 'border-edge-faint'
      } ${chosen ? 'bg-surface-card' : 'bg-surface-secondary opacity-60'}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={chosen}
        aria-label={t('journey.dayImport.choose', { name })}
        disabled={!takeable || state.busy !== null}
        onClick={() => state.toggle(stay.suggestionId)}
        className={`mt-1.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border ${
          chosen ? 'border-transparent bg-accent text-accent-text' : 'border-edge bg-surface-card'
        } disabled:cursor-default`}
      >
        {chosen && <Check size={12} strokeWidth={3} aria-hidden="true" />}
      </button>
      <span
        aria-hidden="true"
        className={`mt-1 grid h-[22px] min-w-[22px] flex-none place-items-center rounded-full border-2 bg-surface-card px-1 font-bold tabular-nums ${
          chosen ? 'text-content' : 'border-edge text-content-faint'
        }`}
        style={{ ...fs(10.5), ...(chosen ? { borderColor: dayColor } : {}) }}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <input
          value={name}
          onChange={(e) => state.rename(stay, e.target.value)}
          disabled={!chosen || state.busy !== null}
          aria-label={t('journey.dayImport.name', { name: stay.name })}
          placeholder={stay.name}
          className={INPUT}
        />
        <StayFacts stay={stay} />
      </div>
    </div>
  );
}

/** Between two chosen stays: join them into one entry, or separate them again. */
function JoinToggle({ state, stay }: { state: JourneyDayImportState; stay: JourneyDayStay }) {
  const { t } = useTranslation();
  const joined = !!state.choice?.joined.has(stay.suggestionId);
  const label = joined ? t('journey.dayImport.split') : t('journey.dayImport.join');
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => state.join(stay.suggestionId)}
        disabled={state.busy !== null}
        aria-pressed={joined}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
        style={fs(11)}
      >
        {joined ? <Unlink2 size={12} aria-hidden="true" /> : <Link2 size={12} aria-hidden="true" />}
        {label}
      </button>
    </div>
  );
}

/** The title and the map position of an entry made of several stays: both chosen on purpose, both shown. */
function GroupHead({ state, group }: { state: JourneyDayImportState; group: DayImportGroup }) {
  const { t } = useTranslation();
  const isReport = group.key === REPORT_KEY;
  const typed = state.choice?.titles[group.key];
  const anchor = state.anchorOf(group.key);
  const options = [
    ...group.stays
      .filter((stay) => stay.lat !== null)
      .map((stay) => ({
        value: String(stay.suggestionId),
        label: state.choice ? nameOf(state.choice, stay) : stay.name,
      })),
    ...(isReport ? [{ value: 'none', label: t('journey.dayImport.noPin') }] : []),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={typed ?? (isReport ? state.reportDefault : nameOfAnchor(state, group, anchor))}
        onChange={(e) => state.setTitle(group.key, e.target.value)}
        aria-label={t('journey.dayImport.groupTitle')}
        disabled={state.busy !== null}
        className={`${INPUT} min-w-[160px] flex-1`}
      />
      {options.length > 0 && (
        <PillSelect
          quiet
          label={t('journey.dayImport.groupPin')}
          value={anchor === null ? 'none' : String(anchor)}
          options={options}
          onChange={(value) => state.setAnchor(group.key, value === 'none' ? null : Number(value))}
        />
      )}
    </div>
  );
}

function nameOfAnchor(state: JourneyDayImportState, group: DayImportGroup, anchor: number | null): string {
  const stay = group.stays.find((s) => s.suggestionId === anchor) ?? group.stays[0];
  return stay && state.choice ? nameOf(state.choice, stay) : '';
}

/** The day report: one entry for all chosen stays, its title and its one map position. */
function ReportBox({ state }: { state: JourneyDayImportState }) {
  const { t } = useTranslation();
  const report = state.groups.find((group) => group.kind === 'report');
  return (
    <div className={PANEL}>
      {report ? (
        <GroupHead state={state} group={report} />
      ) : (
        <p className="m-0 text-content-muted" style={fs(12, 'body')}>
          {t('journey.dayImport.reportNeedsTwo')}
        </p>
      )}
      <p className="m-0 text-content-faint" style={fs(11.5)}>
        {t('journey.dayImport.reportHint')}
      </p>
    </div>
  );
}

/**
 * The stays of the day in the order they were lived, numbered like their pins:
 * chosen ones in front, the rest dimmed, joined ones framed under the title and
 * position of the entry they become. In report mode all chosen stays become
 * one report, so there is nothing to join.
 */
export function JourneyDayImportStays({ state, dayColor }: Props) {
  const { stays, choice } = state;
  if (!choice) return null;
  const merged = new Map(
    state.groups.filter((group) => group.kind === 'merged').map((group) => [group.key, group] as const)
  );
  const inGroup = new Set([...merged.values()].flatMap((group) => group.stays.slice(1).map((s) => s.suggestionId)));
  return (
    <div className="flex flex-col gap-1.5">
      {choice.mode === 'report' && <ReportBox state={state} />}
      {stays.map((stay, index) => {
        if (inGroup.has(stay.suggestionId)) return null;
        const group = merged.get(stay.suggestionId);
        const toggle = canJoin(choice, stays, index) ? <JoinToggle state={state} stay={stay} /> : null;
        if (!group) {
          return (
            <div key={stay.suggestionId} className="flex flex-col gap-1.5">
              {toggle}
              <StayRow state={state} dayColor={dayColor} stay={stay} index={index} />
            </div>
          );
        }
        return (
          <div key={stay.suggestionId} className="flex flex-col gap-1.5">
            {toggle}
            <div className={PANEL}>
              <GroupHead state={state} group={group} />
              {group.stays.map((member, offset) => {
                const at = index + offset;
                return (
                  <div key={member.suggestionId} className="flex flex-col gap-1.5">
                    {offset > 0 && <JoinToggle state={state} stay={member} />}
                    <StayRow state={state} dayColor={dayColor} stay={member} index={at} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
