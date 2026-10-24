import { Check, Clock, Loader2, MoveHorizontal, Route, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import { formatDistance, formatElevation } from '../../../utils/units';
import { MAP_CARD_GLASS } from '../../Map/mapControlShadow';
import { WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { variantPaintCss } from './legVariantPaint';
import type { LegVariant } from './legVariants';
import { formatTourDuration } from './tourDurationInput';

/**
 * The parts the planner's own cards over the map share: the other ways of a
 * section (RTE-02) and the round hikes out of a stop (RTE-03). A frosted card
 * in the corner the other map cards use, its head, its two buttons, and a way
 * shown as a row: its mark in the colour it is drawn in, and its figures.
 */

type Translate = ReturnType<typeof useTranslation>['t'];

/**
 * A point of the tour as the waypoint list numbers it: a stop by its number,
 * a shaping point as the small dot it is on the map.
 */
export function StopDisc({ stop }: { stop: number | undefined }) {
  if (stop === undefined) {
    return (
      <span className="grid h-5 w-5 flex-none place-items-center" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-content-faint ring-2 ring-surface-card" />
      </span>
    );
  }
  return (
    <span
      className="grid h-5 w-5 flex-none place-items-center rounded-full bg-edge font-geist font-semibold tabular-nums text-content"
      style={fs(10)}
      aria-hidden="true"
    >
      {stop}
    </span>
  );
}

/**
 * A way's mark, the colour it is drawn in on the map: the way taken now on
 * the route's own icon, the others by their letter. The chosen one carries a
 * tick at its corner.
 */
export function VariantMark({ variant, chosen }: { variant: Pick<LegVariant, 'key' | 'current'>; chosen: boolean }) {
  return (
    <span
      className="relative grid h-7 w-7 flex-none place-items-center rounded-full font-geist font-bold uppercase shadow-sm"
      // The very colour this way is drawn in on the map: the one link between the row and the line.
      style={{ background: variantPaintCss(variant.key), color: 'var(--bike-highlight-casing)', ...fs(12) }}
      aria-hidden="true"
    >
      {variant.current ? <Route size={14} strokeWidth={2.4} /> : variant.key}
      {chosen && (
        <span className="absolute -bottom-1 -end-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent text-accent-text ring-2 ring-surface-card">
          <Check size={9} strokeWidth={3.2} />
        </span>
      )}
    </span>
  );
}

/**
 * One way as a choice in a card's list, a radio: its mark in the colour it is
 * drawn in, its name with what goes beside it, and what is known of it below.
 * Pointing at it or focusing it lights its line up on the map.
 */
export function WayChoice({
  way,
  name,
  chosen,
  disabled = false,
  aside,
  onSelect,
  onHover,
  children,
}: {
  way: Pick<LegVariant, 'key' | 'current'>;
  name: string;
  chosen: boolean;
  disabled?: boolean;
  aside?: ReactNode;
  onSelect: () => void;
  onHover: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      aria-label={name}
      aria-disabled={disabled}
      data-way={way.key}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={`flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2 text-start transition-colors aria-disabled:cursor-default ${chosen ? 'border-accent bg-surface-card shadow-sm' : 'border-edge-faint bg-surface-secondary hover:border-edge hover:bg-surface-card'}`}
    >
      <VariantMark variant={way} chosen={chosen} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="font-semibold text-content" style={fs(12, 'body')}>
            {name}
          </span>
          {aside}
        </span>
        {children}
      </span>
    </button>
  );
}

/** A height-bound figure: the value once the heights are in, a turning wheel while they are asked for, else unknown. */
function heightFigure(variant: LegVariant, value: number | null, format: (value: number) => string, t: Translate) {
  if (value !== null) return format(value);
  if (variant.heights === 'pending') {
    return <Loader2 size={10} className="animate-spin" aria-label={t('tours.variants.heightsPending')} />;
  }
  return t('tours.hike.ways.unknown');
}

/** What is known of one way, as the badges every tour card uses: length, climb, descent, walking time. */
export function VariantFigures({ variant, unit, t }: { variant: LegVariant; unit: DistanceUnit; t: Translate }) {
  const elevation = (meters: number) => formatElevation(meters, unit);
  const faint = 'flex-none text-content-faint';
  const heightsNote = variant.heights === 'unknown' ? t('tours.variants.heightsUnknown') : '';
  const badges: { key: string; label: string; icon: ReactNode; value: ReactNode }[] = [
    {
      key: 'distance',
      label: t('tours.detail.distance'),
      icon: <MoveHorizontal size={10} strokeWidth={2.2} className={faint} />,
      value: formatDistance(variant.distanceM / 1000, unit),
    },
    {
      key: 'ascent',
      label: heightsNote || t('tours.detail.ascent'),
      icon: <TrendingUp size={10} strokeWidth={2.2} className={faint} />,
      value: heightFigure(variant, variant.gainM, elevation, t),
    },
    {
      key: 'descent',
      label: heightsNote || t('tours.detail.descent'),
      icon: <TrendingDown size={10} strokeWidth={2.2} className={faint} />,
      value: heightFigure(variant, variant.lossM, elevation, t),
    },
    {
      key: 'time',
      label: heightsNote || t('tours.planner.walkingEstimatedInfo'),
      icon: <Clock size={10} strokeWidth={2.2} className={faint} />,
      value: heightFigure(variant, variant.minutes, formatTourDuration, t),
    },
  ];
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      {badges.map((badge) => (
        <Tooltip key={badge.key} label={badge.label}>
          <span className="inline-flex" data-figure={badge.key}>
            <WhiteBadge icon={badge.icon}>{badge.value}</WhiteBadge>
          </span>
        </Tooltip>
      ))}
    </span>
  );
}

/**
 * The frosted card itself: an icon and a title with a line under it, the
 * close button, and the body. As wide as it is given, or as a map card is.
 */
export function MapCard({
  icon,
  title,
  subtitle,
  onClose,
  width,
  testId,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  width?: number;
  testId: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <article
      className={`flex max-h-[70vh] flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-2xl p-3 text-content ${width ? '' : 'w-[min(22rem,calc(100vw_-_2rem))]'}`}
      style={{ ...MAP_CARD_GLASS, width }}
      aria-label={title}
      data-testid={testId}
    >
      <div className="flex items-start gap-2">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-secondary text-content-muted">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" style={fs(14, 'body')}>
            {title}
          </h3>
          {subtitle}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex-none rounded-lg p-1 text-content-muted hover:bg-surface-hover hover:text-content"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {children}
    </article>
  );
}

/** The card's foot: a quiet button that leaves or steps back, and the one that acts, turning while it works. */
export function MapCardActions({
  secondary,
  primary,
}: {
  secondary: { label: string; onClick: () => void };
  primary: { label: string; icon: ReactNode; onClick: () => void; disabled: boolean; busy?: boolean; testId: string };
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-0.5">
      <button
        type="button"
        onClick={secondary.onClick}
        className="inline-flex h-8 items-center rounded-[10px] px-3 font-semibold text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
        style={fs(12, 'body')}
      >
        {secondary.label}
      </button>
      <button
        type="button"
        disabled={primary.disabled}
        onClick={primary.onClick}
        data-testid={primary.testId}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
        style={fs(12, 'body')}
      >
        {primary.busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : primary.icon}
        {primary.label}
      </button>
    </div>
  );
}

/**
 * Where the planner's own card sits: in the corner over the planner map that
 * a via ferrata's or a place's card takes. Unlike those it stays while the
 * map is panned and zoomed, since the map is what it is about; Escape and its
 * own buttons close it.
 */
export function MapCornerOverlay({
  onClose,
  insetEnd,
  bottom,
  testId,
  children,
}: {
  onClose: () => void;
  insetEnd: number;
  bottom: number;
  testId: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="absolute z-[20] flex justify-end transition-[bottom] duration-200 ease-out"
      style={{ insetInlineEnd: insetEnd, bottom, maxWidth: `calc(100% - ${insetEnd + 32}px)` }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
