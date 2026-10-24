import type { BookMetric, BookStatsElement } from '@trek/shared';
import { inkOn } from './badgeLook';
import type { Figure } from './statsFit';
import { heavy, inkAt, light, METRIC_ICONS, mm } from './travelInk';

/** The pieces every summary look is set from: a figure with its unit, its caption, its icon in a disc. */

/** The figure with its unit riding beside it at a fraction of its size, in the accent. */
export function FigureText({
  f,
  size,
  el,
  color,
  unitColor,
}: {
  f: Figure;
  size: number;
  el: BookStatsElement;
  color: string;
  unitColor?: string;
}) {
  return (
    <span
      style={{
        fontSize: mm(size),
        fontWeight: heavy(el),
        lineHeight: 0.92,
        letterSpacing: '-0.04em',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        color,
      }}
    >
      {f.value}
      {f.unit && (
        <span
          style={{
            fontSize: mm(size * 0.38),
            fontWeight: light(el),
            letterSpacing: '0.02em',
            marginInlineStart: '0.14em',
            color: unitColor ?? color,
          }}
        >
          {f.unit}
        </span>
      )}
    </span>
  );
}

/** The caption, in tracked small capitals. */
export function Caption({
  text,
  size,
  el,
  color,
  opacity = 0.62,
}: {
  text: string;
  size: number;
  el: BookStatsElement;
  color?: string;
  opacity?: number;
}) {
  return (
    <span
      style={{
        fontSize: mm(size),
        fontWeight: heavy(el),
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        opacity,
        color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}
    >
      {text}
    </span>
  );
}

/** A figure's icon in a disc: tinted in the accent, or solid with the icon cut out of it. */
export function IconDisc({
  metric,
  size,
  el,
  solid = false,
}: {
  metric: BookMetric;
  size: number;
  el: BookStatsElement;
  solid?: boolean;
}) {
  const Icon = METRIC_ICONS[metric];
  return (
    <span
      style={{
        width: mm(size),
        height: mm(size),
        flex: '0 0 auto',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        background: solid ? el.accent : inkAt(el.accent, 0.14),
      }}
    >
      <Icon
        color={solid ? inkOn(el.accent) : el.accent}
        strokeWidth={2}
        style={{ width: mm(size * 0.52), height: mm(size * 0.52), display: 'block' }}
      />
    </span>
  );
}

/** The disc on a tile: on the solid tile it is the paper's colour faintly, elsewhere the accent's. */
export function IconDiscOn({
  metric,
  size,
  el,
  solid,
}: {
  metric: BookMetric;
  size: number;
  el: BookStatsElement;
  solid: boolean;
}) {
  if (!solid) return <IconDisc metric={metric} size={size} el={el} />;
  const Icon = METRIC_ICONS[metric];
  const ink = inkOn(el.accent);
  return (
    <span
      style={{
        width: mm(size),
        height: mm(size),
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        background: inkAt(ink, 0.18),
      }}
    >
      <Icon color={ink} strokeWidth={2} style={{ width: mm(size * 0.52), height: mm(size * 0.52), display: 'block' }} />
    </span>
  );
}
