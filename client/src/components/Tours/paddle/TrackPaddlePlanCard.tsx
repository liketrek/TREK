import type { TourListItem } from '@trek/shared';
import { MousePointerClick, Plus, RotateCcw, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { TrackPick } from '../../../store/trackMarkToolStore';
import { formatDistance } from '../../../utils/units';
import { DialogButton, fs } from '../../shared/DialogShell';
import { RailCard, TourNotice } from '../tourParts';
import { PaddleGlyph } from './PaddleGlyph';
import { PaddleEstimateBody, PaddleTimeCardShell } from './PaddleTimeCard';
import { LockRow, PortageLegRow } from './PaddleWaypointParts';
import type { TrackPaddlePlan } from './useTrackPaddlePlan';

/** One of the two tools: pressed while a click on the line places its mark. */
function PickButton({
  active,
  disabled,
  onPress,
  icon,
  children,
  testId,
}: {
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  icon: ReactNode;
  children: ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      disabled={disabled}
      onClick={onPress}
      className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 font-semibold transition-colors disabled:cursor-default disabled:opacity-40 ${active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint enabled:hover:text-content'}`}
      style={fs(11.5, 'body')}
    >
      <Plus size={12} strokeWidth={2.6} className="flex-none" />
      <span className="flex-none">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

/** What a click on the line does now, or why the last one placed nothing. */
function pickHint(plan: TrackPaddlePlan, t: (key: string) => string): string | null {
  if (plan.refused === 'overlap') return t('tours.paddle.marks.overlap');
  if (plan.refused === 'off_line') return t('tours.paddle.marks.offLine');
  if (plan.pick === 'lock') return t('tours.paddle.marks.pickLock');
  if (plan.pick === 'portage')
    return t(plan.pendingFromM === null ? 'tours.paddle.marks.pickTakeOut' : 'tours.paddle.marks.pickReEntry');
  return null;
}

/**
 * The portages and locks laid onto a recorded paddle track: two tools to mark
 * them by clicking the line, the list of what is marked with its times, and
 * save once something changed. The recorded track is never redrawn.
 */
function TrackMarksCard({ plan }: { plan: TrackPaddlePlan }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const at = (m: number) => t('tours.paddle.marks.at', { distance: formatDistance(m / 1000, unit) });
  const locked = !plan.canEdit || plan.saving;
  const hint = pickHint(plan, t);
  const pick = (kind: TrackPick) => () => plan.startPick(kind);
  const empty = plan.marks.portages.length === 0 && plan.marks.locks.length === 0;
  return (
    <RailCard icon={<PaddleGlyph kind="portage" size={14} />} title={t('tours.paddle.marks.title')}>
      <div data-testid="track-marks-card" className="flex flex-col gap-2.5">
        {plan.canEdit && (
          <div className="flex gap-1.5">
            <PickButton
              testId="track-marks-pick-portage"
              active={plan.pick === 'portage'}
              disabled={locked}
              onPress={pick('portage')}
              icon={<PaddleGlyph kind="portage" size={13} strokeWidth={2.2} />}
            >
              {t('tours.paddle.marks.markPortage')}
            </PickButton>
            <PickButton
              testId="track-marks-pick-lock"
              active={plan.pick === 'lock'}
              disabled={locked}
              onPress={pick('lock')}
              icon={<PaddleGlyph kind="lock" size={13} strokeWidth={2.2} />}
            >
              {t('tours.paddle.marks.markLock')}
            </PickButton>
          </div>
        )}
        {hint && (
          <TourNotice
            tone={plan.refused ? 'warning' : 'neutral'}
            icon={<MousePointerClick size={13} strokeWidth={2} />}
          >
            {hint}
          </TourNotice>
        )}
        {empty ? (
          <p className="m-0 text-content-muted" style={fs(12, 'body')}>
            {t('tours.paddle.marks.empty')}
          </p>
        ) : (
          <ul className="m-0 -ms-[34px] flex list-none flex-col p-0">
            {plan.marks.portages.map((portage, index) => (
              <PortageLegRow
                key={`p-${portage.from_m}`}
                lengthM={portage.to_m - portage.from_m}
                extraMinutes={portage.extra_minutes}
                disabled={locked}
                position={at(portage.from_m)}
                onExtraChange={(minutes) => plan.edits.setPortageExtra(index, minutes)}
                onRemove={() => plan.edits.removePortage(index)}
              />
            ))}
            {plan.marks.locks.map((lock, index) => (
              <LockRow
                key={`l-${lock.at_m}-${index}`}
                lock={lock}
                bypassed={!!plan.layout.locks.find((stop) => stop.atM === lock.at_m)?.bypassed}
                disabled={locked}
                position={at(lock.at_m)}
                onChange={(next) => plan.edits.setLock(index, next)}
              />
            ))}
          </ul>
        )}
        {plan.dirty && plan.canEdit && (
          <div className="grid grid-cols-[auto_1fr] gap-2 [&>button]:justify-center">
            <DialogButton icon={<RotateCcw size={14} strokeWidth={2} />} onClick={plan.discard} disabled={plan.saving}>
              {t('common.discard')}
            </DialogButton>
            <DialogButton
              variant="primary"
              icon={<Save size={14} strokeWidth={2} />}
              onClick={() => void plan.save()}
              disabled={plan.saving}
            >
              {t('common.save')}
            </DialogButton>
          </div>
        )}
      </div>
    </RailCard>
  );
}

/**
 * PAD-03 and PAD-07 on a recorded paddle track: its time estimate, reckoned
 * with the portages and locks laid onto it, and the card to lay them.
 */
export function TrackPaddlePlanCards({ plan, tour }: { plan: TrackPaddlePlan; tour: TourListItem }) {
  if (!plan.active) return null;
  const locked = !plan.canEdit || plan.saving;
  return (
    <>
      <PaddleTimeCardShell>
        <PaddleEstimateBody
          estimate={plan.estimate}
          layout={plan.layout}
          breakMinutes={tour.break_additional_minutes ?? null}
          planned={tour.planned_duration_minutes ?? null}
          locked={locked}
          portageSpeed={{
            value: plan.speeds.portage,
            startValue: plan.defaultPortageSpeed,
            onChange: (portage) => plan.edits.setSpeeds({ portage }),
          }}
          paddleSpeed={{
            value: plan.speeds.paddle,
            startValue: plan.recommendedPaddleSpeed,
            onChange: (paddle) => plan.edits.setSpeeds({ paddle }),
          }}
        />
      </PaddleTimeCardShell>
      <TrackMarksCard plan={plan} />
    </>
  );
}
