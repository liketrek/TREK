import {
  DEFAULT_PORTAGE_SPEED_KMH,
  MAX_PADDLE_SPEED_KMH,
  MAX_PORTAGE_SPEED_KMH,
  paddleLayoutOfPoints,
  type PaddleLayout,
  type PaddleTimeEstimate,
} from '@trek/shared';
import { AlertTriangle, Timer } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { paddlePlanPoints } from '../planner/paddlePlanOf';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { InfoDot, RailCard, TourNotice } from '../tourParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import { PaddleGlyph } from './PaddleGlyph';
import { PORTAGE_CSS_COLOR } from './paddlePaint';
import { PaddleRouteStrip, WATER_COLOR } from './PaddleRouteStrip';

const minutes = (value: number | null) => (value === null ? '–' : formatPlannedTourDuration(value));

/** A speed in km/h typed in place, decimals with either separator; the starting value shows until one is typed. */
function KmhChip({
  label,
  value,
  placeholder,
  max,
  disabled,
  onChange,
  testId,
}: {
  label: string;
  value: number | null;
  /** The starting value, shown while none is typed; null shows a dash. */
  placeholder: number | null;
  /** The highest speed the field takes, in km/h. */
  max: number;
  disabled: boolean;
  onChange: (kmh: number | null) => void;
  testId: string;
}) {
  const { locale } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = (kmh: number) => kmh.toLocaleString(locale, { maximumFractionDigits: 1 });
  const commit = (text: string) => {
    const trimmed = text.trim().replace(',', '.');
    if (trimmed === '') return onChange(null);
    const kmh = Number(trimmed);
    if (Number.isFinite(kmh) && kmh >= 0.5 && kmh <= max) onChange(Math.round(kmh * 10) / 10);
  };
  return (
    <label className="inline-flex items-center gap-0.5 rounded-sm focus-within:outline focus-within:outline-1 focus-within:outline-accent">
      <input
        data-testid={testId}
        type="text"
        inputMode="decimal"
        aria-label={label}
        disabled={disabled}
        value={draft ?? (value === null ? '' : shown(value))}
        placeholder={placeholder === null ? '–' : shown(placeholder)}
        onFocus={() => setDraft(value === null ? '' : shown(value))}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d.,]/g, '').slice(0, 4))}
        onBlur={() => {
          if (draft !== null) commit(draft);
          setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className="w-[3ch] min-w-0 border-b border-dashed border-edge bg-transparent text-end font-geist tabular-nums text-content outline-none placeholder:text-content-secondary"
        style={fs(10.5)}
      />
      <span className="text-content-faint" style={fs(10.5)}>
        km/h
      </span>
    </label>
  );
}

/**
 * Measures that belong together (a distance and the speed it is covered at)
 * as one white badge within the grey tile, its parts split by a hairline, so
 * a narrow rail keeps them on the tile's first line.
 */
function MeasureGroup({ parts }: { parts: ReactNode[] }) {
  return (
    <span
      className="inline-flex h-[20px] items-center rounded-full bg-surface-card px-1.5 font-geist tabular-nums text-content-secondary ring-1 ring-inset ring-edge-faint"
      style={fs(10.5)}
    >
      {parts.map((part, index) => (
        // The parts are fixed per tile; their order is their identity.
        <span key={index} className={index > 0 ? 'ms-1.5 border-s border-edge-faint ps-1.5' : ''}>
          {part}
        </span>
      ))}
    </span>
  );
}

/** A measure inside a part's tile: a white badge within the grey one. */
function MeasureBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-[20px] items-center rounded-full bg-surface-card px-1.5 font-geist tabular-nums text-content-secondary ring-1 ring-inset ring-edge-faint"
      style={fs(10.5)}
    >
      {children}
    </span>
  );
}

/**
 * One part of the estimate as a tile: its glyph in the colour the band gives
 * it, its name and measures as badges within, and its time as the white badge
 * at the end. The tile wraps in a narrow rail rather than cutting anything.
 */
function PartTile({
  icon,
  color,
  label,
  measures,
  time,
  muted = false,
  warn = false,
  testId,
}: {
  icon: ReactNode;
  /** The band's colour for this part, so tile and band read as one. */
  color?: string;
  label: string;
  measures?: ReactNode;
  time: string;
  muted?: boolean;
  /** A time that leaves something out: drawn in the warning tone. */
  warn?: boolean;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-[12px] bg-surface-secondary py-1.5 pe-1.5 ps-1.5"
    >
      <span
        className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm"
        style={color ? { color } : undefined}
      >
        {icon}
      </span>
      <span
        className={`min-w-0 truncate font-semibold ${muted ? 'text-content-muted' : 'text-content'}`}
        style={fs(12, 'body')}
      >
        {label}
      </span>
      {measures}
      <span
        className={`ms-auto inline-flex h-[22px] flex-none items-center rounded-full bg-surface-card px-2 font-geist font-semibold tabular-nums shadow-sm ${warn ? 'text-warning' : 'text-content'}`}
        style={fs(11.5)}
      >
        {time}
      </span>
    </div>
  );
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** What of the estimate is still missing, said plainly, never folded into a total that looks whole. */
function missingParts(estimate: PaddleTimeEstimate, t: Translate): string[] {
  const parts: string[] = [];
  if (estimate.waterMinutes === null) parts.push(t('tours.paddle.time.noSpeed'));
  if (estimate.locksMissingTime > 0)
    parts.push(t('tours.paddle.time.locksMissing', { count: estimate.locksMissingTime }));
  return parts;
}

/** The estimate as the card's headline, with the paddler's own planned total and the gap to it beside it. */
function EstimateHead({
  total,
  complete,
  planned,
  t,
}: {
  total: number;
  complete: boolean;
  planned: number | null;
  t: Translate;
}) {
  const deviation = planned === null ? null : planned - total;
  return (
    <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-1.5">
      <div className="min-w-0 flex-1">
        <span className="block text-content-faint" style={fs(10.5, 'body')}>
          {t('tours.paddle.time.estimate')}
        </span>
        <span className="flex items-center gap-2">
          <span
            data-testid="paddle-time-estimate"
            className="font-geist font-semibold tabular-nums text-content"
            style={fs(20)}
          >
            {formatPlannedTourDuration(total)}
          </span>
          {!complete && <SoftPill tone="warning">{t('tours.paddle.time.incomplete')}</SoftPill>}
        </span>
      </div>
      {planned !== null && deviation !== null && (
        <span
          data-testid="paddle-time-planned"
          className="inline-flex h-[24px] flex-none items-center gap-1 rounded-full bg-surface-secondary pe-1 ps-2 text-content-muted"
          style={fs(11, 'body')}
        >
          {t('tours.paddle.time.plannedOwn')}
          <MeasureBadge>{formatPlannedTourDuration(planned)}</MeasureBadge>
          {deviation !== 0 && (
            <span data-testid="paddle-time-deviation">
              <SoftPill tone={deviation < 0 ? 'warning' : 'neutral'}>
                {`${deviation > 0 ? '+' : '−'}${formatPlannedTourDuration(Math.abs(deviation))}`}
              </SoftPill>
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/** A speed the rail lets the paddler set, with the starting value it falls back to. */
export interface SpeedControl {
  value: number | null;
  startValue: number | null;
  onChange: (kmh: number | null) => void;
}

/** The tiles of the parts, water first, then what a portage and a lock add, then the breaks. */
function PartTiles({
  estimate,
  breakMinutes,
  locked,
  portageSpeed,
  paddleSpeed,
}: {
  estimate: PaddleTimeEstimate;
  breakMinutes: number | null;
  locked: boolean;
  portageSpeed: SpeedControl;
  /** Set here where the tour has no boat form of its own (a recorded track); else shown as it is. */
  paddleSpeed?: SpeedControl;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const km = (m: number) => formatDistance(m / 1000, unit);
  const speed = estimate.paddleSpeedKmh;
  const water = paddleSpeed ? (
    <KmhChip
      key="speed"
      testId="paddle-time-water-speed"
      label={t('tours.paddle.speed')}
      value={paddleSpeed.value}
      placeholder={paddleSpeed.startValue}
      max={MAX_PADDLE_SPEED_KMH}
      disabled={locked}
      onChange={paddleSpeed.onChange}
    />
  ) : speed !== null ? (
    `${speed.toLocaleString()} km/h`
  ) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <PartTile
        testId="paddle-time-water"
        icon={<PaddleGlyph kind="put_in" size={12} strokeWidth={2.4} />}
        color={WATER_COLOR}
        label={t('tours.paddle.time.waterShort')}
        measures={<MeasureGroup parts={water === null ? [km(estimate.waterM)] : [km(estimate.waterM), water]} />}
        time={minutes(estimate.waterMinutes)}
      />
      {estimate.portageCount > 0 && (
        <PartTile
          testId="paddle-time-carry"
          icon={<PaddleGlyph kind="portage" size={12} strokeWidth={2.4} />}
          color={PORTAGE_CSS_COLOR}
          label={t('tours.paddle.time.carry')}
          measures={
            <MeasureGroup
              parts={[
                km(estimate.landM),
                <KmhChip
                  key="speed"
                  testId="paddle-time-carry-speed"
                  label={t('tours.paddle.time.carrySpeed')}
                  value={portageSpeed.value}
                  placeholder={portageSpeed.startValue}
                  max={MAX_PORTAGE_SPEED_KMH}
                  disabled={locked}
                  onChange={portageSpeed.onChange}
                />,
              ]}
            />
          }
          time={minutes(estimate.carryMinutes)}
        />
      )}
      {estimate.portageCount > 0 && (
        <PartTile
          testId="paddle-time-out-in"
          icon={<PaddleGlyph kind="take_out" size={12} strokeWidth={2.4} />}
          color={PORTAGE_CSS_COLOR}
          label={t('tours.paddle.time.outIn')}
          measures={<MeasureBadge>{`${estimate.portageCount}×`}</MeasureBadge>}
          time={minutes(estimate.portageExtraMinutes)}
        />
      )}
      {estimate.locksCounted > 0 && (
        <PartTile
          testId="paddle-time-locks"
          icon={<PaddleGlyph kind="lock" size={12} strokeWidth={2.4} />}
          label={t('tours.paddle.time.locks')}
          measures={<MeasureBadge>{`${estimate.locksCounted}×`}</MeasureBadge>}
          time={estimate.locksMissingTime > 0 && estimate.lockMinutes === 0 ? '–' : minutes(estimate.lockMinutes)}
          warn={estimate.locksMissingTime > 0}
        />
      )}
      <PartTile
        testId="paddle-time-breaks"
        icon={<Timer size={12} strokeWidth={2.4} />}
        label={t('tours.planner.breaksShort')}
        time={minutes(breakMinutes)}
        muted={breakMinutes === null}
      />
    </div>
  );
}

/**
 * The estimate of a paddle tour as one block: the total as its headline beside
 * the paddler's own planned total, the band of its stretches, the tiles of its
 * parts and what is still missing. The planner and a recorded track show it alike.
 */
export function PaddleEstimateBody({
  estimate,
  layout,
  breakMinutes,
  planned,
  locked,
  portageSpeed,
  paddleSpeed,
}: {
  estimate: PaddleTimeEstimate;
  layout: PaddleLayout;
  breakMinutes: number | null;
  planned: number | null;
  locked: boolean;
  portageSpeed: SpeedControl;
  paddleSpeed?: SpeedControl;
}) {
  const { t } = useTranslation();
  const missing = missingParts(estimate, t);
  return (
    <div data-testid="paddle-time-card" className="flex flex-col gap-3">
      <EstimateHead
        total={estimate.estimateMinutes + (breakMinutes ?? 0)}
        complete={estimate.complete}
        planned={planned}
        t={t}
      />
      <PaddleRouteStrip layout={layout} />
      <PartTiles
        estimate={estimate}
        breakMinutes={breakMinutes}
        locked={locked}
        portageSpeed={portageSpeed}
        paddleSpeed={paddleSpeed}
      />
      {missing.length > 0 && (
        <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
          {missing.join(' ')}
        </TourNotice>
      )}
    </div>
  );
}

/** The card's head: its title, and that its values are planning values to adjust. */
export function PaddleTimeCardShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <RailCard
      icon={<Timer size={14} strokeWidth={2} />}
      title={t('tours.paddle.time.title')}
      aside={
        <span className="flex flex-none items-center gap-1">
          <SoftPill tone="info">{t('tours.paddle.time.assumption')}</SoftPill>
          <InfoDot label={t('tours.paddle.time.assumption')} description={t('tours.paddle.time.assumptionInfo')} />
        </span>
      }
    >
      {children}
    </RailCard>
  );
}

/**
 * PAD-07: how the time of a paddle tour comes about. Water at the paddling
 * speed, portages at the carrying speed with their time out and in, locks at
 * the times entered for them, the breaks; their sum is the estimate, set
 * beside a total the paddler planned themselves. Every starting value says it
 * is one, and what is unknown is named rather than counted as nothing.
 */
export function PaddleTimeCard({ planner, locked }: { planner: TourPlannerController; locked: boolean }) {
  const estimate = planner.paddleEstimate;
  if (!estimate || planner.waypoints.length < 2) return null;
  return (
    <PaddleTimeCardShell>
      <PaddleEstimateBody
        estimate={estimate}
        layout={paddleLayoutOfPoints(paddlePlanPoints(planner.waypoints))}
        breakMinutes={planner.breakAdditionalMinutes}
        planned={planner.plannedDurationMinutes}
        locked={locked}
        portageSpeed={{
          value: planner.paddle.portageSpeedKmh,
          startValue: DEFAULT_PORTAGE_SPEED_KMH,
          onChange: planner.paddle.setPortageSpeedKmh,
        }}
      />
    </PaddleTimeCardShell>
  );
}
