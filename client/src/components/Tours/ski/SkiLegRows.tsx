import type { SkiColourScheme, SkiRouteOkLeg, SkiRouteSegment } from '@trek/shared';
import { AlertTriangle, CableCar, Footprints, MountainSnow, Spline, Sun } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import type { SkiLegProblem } from '../planner/skiRouting';
import { formatTourDuration } from '../planner/tourDurationInput';
import type { SkiChoice } from './skiChoice';
import { skiFixesOf } from './skiRouteFacts';
import { skiPaintOf } from './skiRouteStyle';

const ACTION =
  'inline-flex h-[22px] flex-none items-center gap-1 rounded-full bg-surface-card px-2 font-semibold text-content shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover disabled:opacity-40';

/**
 * A ski leg the piste router could not plan: why, the run or lift it is about,
 * and the change that would plan it, applied with one press. A snowshoer's or
 * winter hiker's leg taken on summer paths instead says so calmly.
 */
export function SkiLegFailureRow({
  problem,
  choice,
  disabled,
  onChoice,
  onDrawStraight,
}: {
  problem: SkiLegProblem;
  choice: SkiChoice;
  disabled: boolean;
  onChoice: (next: SkiChoice) => void;
  onDrawStraight: () => void;
}) {
  const { t } = useTranslation();
  const tone = problem.summer ? 'bg-surface-secondary text-content-secondary' : 'bg-danger-soft text-danger';
  return (
    <li data-testid="tour-planner-ski-leg-failure" className="flex min-w-0 py-0.5 ps-[34px]">
      <div
        role={problem.summer ? 'status' : 'alert'}
        className={`flex w-full min-w-0 flex-col gap-1.5 rounded-[10px] ${tone} px-2 py-1.5`}
      >
        <span className="flex min-w-0 items-center gap-1.5 font-semibold" style={fs(11.5, 'body')}>
          {problem.summer ? (
            <Sun size={12} strokeWidth={2.2} className="flex-none" aria-hidden="true" />
          ) : (
            <AlertTriangle size={12} strokeWidth={2.2} className="flex-none" aria-hidden="true" />
          )}
          <span className="min-w-0">
            {problem.summer ? t('tours.ski.summerPath') : t(`tours.ski.fail.${problem.code}`)}
          </span>
        </span>
        {problem.name && (
          <span
            className="w-fit max-w-full truncate rounded-full bg-surface-card px-2 py-0.5 text-content"
            style={fs(10.5, 'caption')}
          >
            {problem.name}
          </span>
        )}
        <span className="flex flex-wrap gap-1">
          {skiFixesOf(problem).map((fix) => (
            <button
              key={fix.labelKey}
              type="button"
              disabled={disabled}
              onClick={() => onChoice(fix.apply(choice))}
              className={ACTION}
              style={fs(10.5)}
            >
              {t(fix.labelKey)}
            </button>
          ))}
          <button type="button" disabled={disabled} onClick={onDrawStraight} className={ACTION} style={fs(10.5)}>
            <Spline size={11} strokeWidth={2.2} aria-hidden="true" />
            {t('tours.ski.drawStraight')}
          </button>
        </span>
      </div>
    </li>
  );
}

/** Neighbouring stretches of one way (the same kind, name and grade) as one step. */
function stepsOf(segments: readonly SkiRouteSegment[]): SkiRouteSegment[] {
  const steps: SkiRouteSegment[] = [];
  for (const segment of segments) {
    const last = steps[steps.length - 1];
    const same =
      last && last.kind === segment.kind && last.name === segment.name && last.difficulty === segment.difficulty;
    if (same) steps[steps.length - 1] = { ...last, to: segment.to, seconds: last.seconds + segment.seconds };
    else steps.push(segment);
  }
  return steps;
}

const LIFT_KINDS = new Set(['lift', 'rail', 'lift_down']);
const FOOT_KINDS = new Set(['walk', 'hike', 'link', 'crossing']);

/** The icon of a step: a lift, a stretch on foot, or skiing. */
function StepIcon({ kind }: { kind: SkiRouteSegment['kind'] }) {
  const Icon = LIFT_KINDS.has(kind) ? CableCar : FOOT_KINDS.has(kind) ? Footprints : MountainSnow;
  return <Icon size={11} strokeWidth={2.2} className="flex-none" aria-hidden="true" />;
}

/**
 * The steps of a planned ski leg, in order: each run in the colour of its
 * grade, each lift and stretch on foot, with the time on it. A step the map
 * data names no way for says what kind of way it is.
 */
export function SkiLegSteps({ leg, scheme }: { leg: SkiRouteOkLeg; scheme: SkiColourScheme }) {
  const { t } = useTranslation();
  const steps = stepsOf(leg.segments);
  return (
    <li data-testid="tour-planner-ski-leg-steps" className="flex min-w-0 py-0.5 ps-[34px]">
      <ol className="m-0 flex min-w-0 list-none flex-wrap gap-1 p-0">
        {steps.map((step, at) => (
          <li
            key={`${step.from}-${at}`}
            className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-surface-secondary py-0.5 pe-2 ps-1.5 text-content-secondary"
            style={fs(10.5, 'caption')}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 flex-none rounded-full"
              style={{ background: skiPaintOf({ kind: step.kind, difficulty: step.difficulty, scheme }) }}
            />
            <StepIcon kind={step.kind} />
            <span className="min-w-0 truncate">{step.name ?? t(`tours.ski.kind.${step.kind}`)}</span>
            {step.seconds >= 60 && (
              <span className="flex-none tabular-nums">{formatTourDuration(Math.round(step.seconds / 60))}</span>
            )}
          </li>
        ))}
      </ol>
    </li>
  );
}
