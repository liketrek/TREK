import {
  DEFAULT_SKI_ROUTE_OPTIONS,
  SKI_DIFFICULTIES,
  SKI_LIFT_CLASSES,
  SKI_PACES,
  SKI_ROUTE_PRIORITIES,
  skiOptionsReadBy,
  skiUsesLifts,
  type SkiRouteOptions as Options,
  type SkiDifficulty,
  type SkiDiscipline,
  type SkiLiftClass,
  type SkiPace,
  type SkiRouteOptionsInput,
  type SkiRoutePriority,
} from '@trek/shared';
import { useTranslation } from '../../../i18n';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import CustomSelect from '../../shared/CustomSelect';
import { LABEL, Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';

/** The switches of the piste router, each with the key of its label, in the order they are read. */
const SWITCHES = [
  { key: 'use_lifts', labelKey: 'tours.ski.options.useLifts' },
  { key: 'allow_freeride', labelKey: 'tours.ski.options.freeride' },
  { key: 'allow_lift_down', labelKey: 'tours.ski.options.liftDown' },
  { key: 'groomed_only', labelKey: 'tours.ski.options.groomedOnly' },
  { key: 'lit_only', labelKey: 'tours.ski.options.litOnly' },
  { key: 'touring_uphill_on_pistes', labelKey: 'tours.ski.options.uphillOnPistes' },
  { key: 'avoid_inferred_links', labelKey: 'tours.ski.options.avoidLinks' },
] as const;

type SwitchKey = (typeof SWITCHES)[number]['key'];

/** One switch set, the rest of the options kept. */
function switchPatch(key: SwitchKey, on: boolean): Partial<SkiRouteOptionsInput> {
  const patch: Partial<SkiRouteOptionsInput> = {};
  patch[key] = on;
  return patch;
}

/** Switches that say something only while lifts are ridden. */
const LIFT_SWITCHES: ReadonlySet<SwitchKey> = new Set(['allow_lift_down']);

interface SkiRouteOptionsProps {
  discipline: SkiDiscipline;
  options: SkiRouteOptionsInput | null | undefined;
  onChange: (patch: Partial<SkiRouteOptionsInput>) => void;
}

/** One switch of the piste router on its own row, its label beside it. */
function OptionSwitch({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="min-w-0 flex-1 text-content-secondary" style={fs(12, 'body')}>
        {label}
      </span>
      <ToggleSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  );
}

/**
 * The lift classes a skier leaves out, as pressed badges: a pressed one is
 * not ridden. Shown only while lifts are ridden at all.
 */
function LiftClasses({ avoided, onChange }: { avoided: SkiLiftClass[]; onChange: (next: SkiLiftClass[]) => void }) {
  const { t } = useTranslation();
  const flip = (lift: SkiLiftClass) =>
    onChange(avoided.includes(lift) ? avoided.filter((entry) => entry !== lift) : [...avoided, lift]);
  return (
    <div className="min-w-0">
      <span className={LABEL}>{t('tours.ski.options.avoidLifts')}</span>
      <div role="group" aria-label={t('tours.ski.options.avoidLifts')} className="flex flex-wrap gap-1.5">
        {SKI_LIFT_CLASSES.map((lift) => {
          const left = avoided.includes(lift);
          const look = left
            ? 'border-edge bg-surface-tertiary text-content-muted line-through'
            : 'border-edge bg-surface-card text-content-secondary';
          return (
            <button
              key={lift}
              type="button"
              aria-pressed={left}
              onClick={() => flip(lift)}
              className={`rounded-full border px-2.5 py-1 font-medium ${look}`}
              style={fs(11.5, 'caption')}
            >
              {t(`tours.ski.lift.${lift}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SKI-02: what the piste router is asked for besides the discipline, only the
 * options the chosen discipline reads: the hardest runs, the pace and what to
 * weigh most for a downhill skier, groomed and lit trails for cross-country,
 * the lifts for anyone who rides them. Every change plans the tour again.
 */
export function SkiRouteOptions({ discipline, options, onChange }: SkiRouteOptionsProps) {
  const { t } = useTranslation();
  const read = new Set(skiOptionsReadBy(discipline));
  const current: Options = { ...DEFAULT_SKI_ROUTE_OPTIONS, ...options };
  const usesLifts = skiUsesLifts(discipline, current);
  const switchOn = (key: SwitchKey) => (key === 'use_lifts' ? usesLifts : current[key]);
  const switches = SWITCHES.filter(({ key }) => read.has(key) && (usesLifts || !LIFT_SWITCHES.has(key)));
  return (
    <div data-testid="tour-planner-ski-options" className="flex min-w-0 flex-col gap-2.5">
      {read.has('max_difficulty') && (
        <div className="min-w-0">
          <span className={LABEL} id="tour-planner-ski-difficulty-label">
            {t('tours.ski.options.maxDifficulty')}
          </span>
          <CustomSelect
            id="tour-planner-ski-difficulty"
            ariaLabel={t('tours.ski.options.maxDifficulty')}
            size="sm"
            value={current.max_difficulty}
            onChange={(value) => onChange({ max_difficulty: value as SkiDifficulty })}
            options={SKI_DIFFICULTIES.map((level) => ({ value: level, label: t(`tours.ski.difficulty.${level}`) }))}
          />
        </div>
      )}
      {read.has('priority') && (
        <div className="min-w-0">
          <span className={LABEL}>{t('tours.ski.options.priority')}</span>
          <Segmented<SkiRoutePriority>
            value={current.priority}
            onChange={(priority) => onChange({ priority })}
            label={t('tours.ski.options.priority')}
            fill
            options={SKI_ROUTE_PRIORITIES.map((value) => ({ value, label: t(`tours.ski.priority.${value}`) }))}
          />
        </div>
      )}
      {read.has('pace') && (
        <div className="min-w-0">
          <span className={LABEL}>{t('tours.ski.options.pace')}</span>
          <Segmented<SkiPace>
            value={current.pace}
            onChange={(pace) => onChange({ pace })}
            label={t('tours.ski.options.pace')}
            fill
            options={SKI_PACES.map((value) => ({ value, label: t(`tours.ski.pace.${value}`) }))}
          />
        </div>
      )}
      {switches.map(({ key, labelKey }) => (
        <OptionSwitch
          key={key}
          label={t(labelKey)}
          on={switchOn(key)}
          onToggle={() => onChange(switchPatch(key, !switchOn(key)))}
        />
      ))}
      {usesLifts && read.has('avoid_lifts') && (
        <LiftClasses avoided={current.avoid_lifts} onChange={(avoid_lifts) => onChange({ avoid_lifts })} />
      )}
    </div>
  );
}
