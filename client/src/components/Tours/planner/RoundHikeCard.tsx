import {
  deviationOf,
  distanceWindow,
  isRoundTarget,
  MAX_ROUND_ASKS,
  ROUND_MAX_M,
  ROUND_MIN_M,
  ROUND_TOLERANCE,
} from '@trek/shared';
import { AlertTriangle, Check, Loader2, Mountain, RefreshCcwDot, Search, Target } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { DistanceUnit } from '../../../types';
import { formatDistance, getDistanceUnitLabel } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { INPUT, LABEL, PillSelect } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { TourNotice } from '../tourParts';
import { MapCard, MapCardActions, MapCornerOverlay, StopDisc, VariantFigures, WayChoice } from './mapCardParts';
import { metersTyped, roundStarts, typedLength, type RoundCandidate } from './roundHikes';
import { stopNumbersOf } from './tourPlannerWaypoints';
import type { RoundHikeView } from './useRoundHikes';
import type { TourPlannerController } from './useTourPlanner';

type Translate = ReturnType<typeof useTranslation>['t'];
type Planner = Pick<TourPlannerController, 'waypoints' | 'roundHikes' | 'canEdit' | 'isSaving' | 'maxHikingDifficulty'>;

/** A length in metres as the unit the traveller reads lengths in. */
const formatMeters = (meters: number, unit: DistanceUnit) => formatDistance(meters / 1000, unit);

/** Where a round can start: the tour's stops, by the number they carry in the list and on the map. */
function StartPicker({ planner, view, t }: { planner: Planner; view: RoundHikeView; t: Translate }) {
  const numbers = stopNumbersOf(planner.waypoints);
  const options = roundStarts(planner.waypoints).map((point) => ({
    value: point.id,
    label: t('tours.planner.waypointLabel', { n: numbers.get(point.id) ?? 0 }),
    icon: <StopDisc stop={numbers.get(point.id)} />,
    ...(point.name ? { hint: point.name } : {}),
  }));
  return (
    <span className="mt-1 flex min-w-0 items-center gap-1.5 text-content-muted" style={fs(11.5, 'body')}>
      {t('tours.round.from')}
      <PillSelect
        quiet
        label={t('tours.round.start')}
        value={view.startId}
        options={options}
        onChange={planner.roundHikes.open}
      />
    </span>
  );
}

/**
 * The wished length, typed in the traveller's unit, with the window a round
 * has to fall into beside it and the hike's limit the rounds keep to.
 */
function DistanceField({
  text,
  onText,
  onEnter,
  limit,
  unit,
  t,
}: {
  text: string;
  onText: (text: string) => void;
  /** Enter in the field looks for rounds, as the button does. */
  onEnter: () => void;
  limit: number;
  unit: DistanceUnit;
  t: Translate;
}) {
  const typed = metersTyped(text, unit);
  const valid = isRoundTarget(typed);
  const range = valid ? distanceWindow(typed) : null;
  return (
    <div className="min-w-0">
      <label htmlFor="round-hike-distance" className={LABEL}>
        {t('tours.round.distance')}
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="relative w-28 flex-none">
          <input
            id="round-hike-distance"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(event) => onText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onEnter();
            }}
            aria-invalid={!valid || undefined}
            aria-describedby={valid ? undefined : 'round-hike-distance-error'}
            className={`${INPUT} pe-10 tabular-nums`}
          />
          <span
            className="pointer-events-none absolute inset-y-0 end-3 flex items-center font-geist text-content-faint"
            style={fs(11.5)}
          >
            {getDistanceUnitLabel(unit)}
          </span>
        </span>
        {range && (
          <Tooltip label={t('tours.round.windowHint', { percent: Math.round(ROUND_TOLERANCE * 100) })}>
            <span className="inline-flex" data-testid="round-hike-window">
              <SoftPill icon={<Target size={10} strokeWidth={2.2} aria-hidden="true" />}>
                {t('tours.round.window', {
                  from: formatMeters(range.minM, unit),
                  to: formatMeters(range.maxM, unit),
                })}
              </SoftPill>
            </span>
          </Tooltip>
        )}
        <Tooltip label={t('tours.round.limitHint', { limit: t(`tours.planner.difficulty.t${limit}`) })}>
          <span className="inline-flex" data-testid="round-hike-limit">
            <SoftPill icon={<Mountain size={10} strokeWidth={2.2} aria-hidden="true" />}>{`T${limit}`}</SoftPill>
          </span>
        </Tooltip>
      </div>
      {!valid && (
        <p id="round-hike-distance-error" className="m-0 mt-1 text-danger" style={fs(11)}>
          {t('tours.round.distanceRange', {
            from: formatMeters(ROUND_MIN_M, unit),
            to: formatMeters(ROUND_MAX_M, unit),
          })}
        </p>
      )}
    </div>
  );
}

/** One round as a choice in the list: its mark, its figures, and how far it lies off the wish. */
function RoundRow({
  round,
  targetM,
  chosen,
  unit,
  onSelect,
  onHover,
}: {
  round: RoundCandidate;
  targetM: number;
  chosen: boolean;
  unit: DistanceUnit;
  onSelect: () => void;
  onHover: (on: boolean) => void;
}) {
  const { t, language } = useTranslation();
  const name = t('tours.round.option', { letter: round.key.toUpperCase() });
  const deviation = new Intl.NumberFormat(language, {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  }).format(deviationOf(round.distanceM, targetM));
  return (
    <WayChoice
      way={round}
      name={name}
      chosen={chosen}
      onSelect={onSelect}
      onHover={onHover}
      aside={
        <Tooltip label={t('tours.round.deviationHint', { target: formatMeters(targetM, unit) })}>
          <span className="inline-flex" data-testid="round-hike-deviation">
            <SoftPill icon={<Target size={10} strokeWidth={2.2} aria-hidden="true" />}>
              <span className="tabular-nums">{deviation}</span>
            </SoftPill>
          </span>
        </Tooltip>
      }
    >
      <VariantFigures variant={round} unit={unit} t={t} />
    </WayChoice>
  );
}

/** How far the search has come: a thin bar that fills with the questions put to the router. */
function SearchProgress({ asked, t }: { asked: number; t: Translate }) {
  const share = Math.min(1, asked / MAX_ROUND_ASKS);
  return (
    <div className="flex flex-col gap-1.5" role="status">
      <span className="flex items-center gap-1.5 text-content-muted" style={fs(12, 'body')}>
        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        {t('tours.round.searching')}
      </span>
      <div
        role="progressbar"
        aria-label={t('tours.round.searching')}
        aria-valuemin={0}
        aria-valuemax={MAX_ROUND_ASKS}
        aria-valuenow={asked}
        className="h-1 overflow-hidden rounded-full bg-surface-tertiary"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(4, share * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** What the card says besides the rounds: that the tour changed, the router did not answer, none or fewer fit. */
function RoundNotice({ view, unit, t }: { view: RoundHikeView; unit: DistanceUnit; t: Translate }) {
  const warning = (text: string) => (
    <TourNotice role="status" tone="warning" icon={<AlertTriangle size={13} aria-hidden="true" />}>
      {text}
    </TourNotice>
  );
  if (view.notice === 'stale') return warning(t('tours.round.stale'));
  if (view.phase === 'failed') return warning(t('tours.round.failed'));
  if (view.phase !== 'done') return null;
  if (view.candidates.length === 0) {
    const { minM, maxM } = distanceWindow(view.targetM);
    return warning(t('tours.round.none', { from: formatMeters(minM, unit), to: formatMeters(maxM, unit) }));
  }
  return view.candidates.length < 3 ? <TourNotice role="status">{t('tours.round.fewer')}</TourNotice> : null;
}

/** The rounds found so far, each drawn on the map in its colour; pointing at one lights its line up. */
function RoundList({
  planner,
  view,
  unit,
  t,
}: {
  planner: Planner;
  view: RoundHikeView;
  unit: DistanceUnit;
  t: Translate;
}) {
  if (view.candidates.length === 0) return null;
  const { select, hover } = planner.roundHikes;
  return (
    <div role="radiogroup" aria-label={t('tours.round.title')} className="flex flex-col gap-1.5">
      {view.candidates.map((round) => (
        <RoundRow
          key={round.key}
          round={round}
          targetM={view.request?.targetM ?? view.targetM}
          chosen={round.key === view.selected}
          unit={unit}
          onSelect={() => select(round.key)}
          onHover={(on) => hover(on ? round.key : null)}
        />
      ))}
    </div>
  );
}

/**
 * RTE-03: round hikes of about a wished length out of one of the tour's stops,
 * in the look of the other cards over the planner map. The start and the
 * length are set first; the rounds found are listed and drawn on the map
 * in their colours as they come. Choosing one only marks it: the tour changes
 * on the button, after a yes when there were points planned before, and
 * closing leaves everything as it was.
 */
export function RoundHikeCard({ planner, view, width }: { planner: Planner; view: RoundHikeView; width?: number }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const { find, back, apply, confirm, cancelConfirm, close } = planner.roundHikes;
  const [text, setText] = useState(() => typedLength(view.targetM, unit));
  const typed = metersTyped(text, unit);
  const locked = !planner.canEdit || planner.isSaving;
  const setup = view.phase === 'setup';
  const findTyped = () => {
    if (!locked && isRoundTarget(typed)) find(typed);
  };
  const actions = setup
    ? {
        secondary: { label: t('common.cancel'), onClick: close },
        primary: {
          label: t('tours.round.find'),
          icon: <Search size={14} strokeWidth={2.4} aria-hidden="true" />,
          disabled: locked || !isRoundTarget(typed),
          onClick: findTyped,
          testId: 'round-hike-find',
        },
      }
    : {
        secondary: { label: view.phase === 'searching' ? t('common.cancel') : t('tours.round.again'), onClick: back },
        primary: {
          label: t('tours.round.apply'),
          icon: <Check size={14} strokeWidth={2.4} aria-hidden="true" />,
          busy: view.phase === 'searching',
          disabled: locked || view.phase !== 'done' || view.selected === null,
          onClick: apply,
          testId: 'round-hike-apply',
        },
      };
  return (
    <MapCard
      icon={<RefreshCcwDot size={14} strokeWidth={2.2} aria-hidden="true" />}
      title={t('tours.round.title')}
      subtitle={<StartPicker planner={planner} view={view} t={t} />}
      onClose={close}
      width={width}
      testId="round-hike-card"
    >
      {setup && (
        <DistanceField
          text={text}
          onText={setText}
          onEnter={findTyped}
          limit={planner.maxHikingDifficulty}
          unit={unit}
          t={t}
        />
      )}
      {view.phase === 'searching' && <SearchProgress asked={view.asked} t={t} />}
      <RoundList planner={planner} view={view} unit={unit} t={t} />
      <RoundNotice view={view} unit={unit} t={t} />
      <MapCardActions {...actions} />
      <ConfirmDialog
        isOpen={view.confirming}
        onClose={cancelConfirm}
        onConfirm={confirm}
        title={t('tours.round.replaceTitle')}
        message={t('tours.round.replaceBody')}
        confirmLabel={t('tours.round.replace')}
      />
    </MapCard>
  );
}

/** The round hike's card in the corner over the planner map, while it is open. */
export default function RoundHikeOverlay({
  planner,
  insetEnd,
  bottom,
  width,
}: {
  planner: Planner;
  insetEnd: number;
  bottom: number;
  width?: number;
}) {
  const { view, close } = planner.roundHikes;
  if (!view) return null;
  return (
    <MapCornerOverlay onClose={close} insetEnd={insetEnd} bottom={bottom} testId="round-hike-overlay">
      <RoundHikeCard planner={planner} view={view} width={width} />
    </MapCornerOverlay>
  );
}
