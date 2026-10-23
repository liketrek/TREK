import { Clock, MoveHorizontal, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

import type { DistanceUnit } from '../../../../types';
import { formatDistance, formatElevation } from '../../../../utils/units';
import type { LegVariant } from '../../../Tours/planner/legVariants';
import { formatTourDuration } from '../../../Tours/planner/tourDurationInput';

/**
 * A way's length, climb and time as one quiet line of glyphs and values,
 * without a frame around each: what a choice of ways and a change row show
 * where framed fields would crowd the row.
 */

/** One figure of a way: its glyph and its value, quiet, in a line of them. */
function Figure({ name, icon, children }: { name: string; icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap" data-figure={name}>
      {icon}
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

const GLYPH = { size: 11, strokeWidth: 2.2, 'aria-hidden': true, className: 'flex-none text-content-faint' } as const;

/** A way's length, climb and time in one quiet line. */
export default function WayFigures({ way, unit }: { way: LegVariant; unit: DistanceUnit }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-content-secondary">
      <Figure name="distance" icon={<MoveHorizontal {...GLYPH} />}>
        {formatDistance(way.distanceM / 1000, unit)}
      </Figure>
      {way.gainM !== null && (
        <Figure name="ascent" icon={<TrendingUp {...GLYPH} />}>
          {formatElevation(way.gainM, unit)}
        </Figure>
      )}
      {way.minutes !== null && (
        <Figure name="time" icon={<Clock {...GLYPH} />}>
          {formatTourDuration(way.minutes)}
        </Figure>
      )}
    </span>
  );
}
