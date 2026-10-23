import type { RoadtripCardDay } from '@trek/shared';
import type { RoadtripDay } from '@trek/shared/roadtrip';

import { useTranslation } from '../../../../i18n';
import { dayColor } from '../../../Roadtrip/dayColors';
import { DayTile } from '../../../Roadtrip/RoadtripSidebarHeaders';
import { useAssistantView } from '../../assistantViewContext';
import { useCardFormat } from '../parts/useCardFormat';
import { dayHasWarning } from './roadtripCardModel';

/**
 * The days of a drive as a row of chips, each the planner's day tile with
 * how far that day drives (or "No drive"), a small dot where something on it
 * needs a look. A tap shows that day's rail below; resting on a chip draws
 * that day's drive over the plan.
 */
export default function DriveDayStrip({
  days,
  tiles,
  selected,
  dayColors,
  onSelect,
  onHover,
}: {
  days: readonly RoadtripCardDay[];
  /** The same days as the planner's day tile reads them. */
  tiles: readonly RoadtripDay[];
  selected: number;
  dayColors: boolean;
  onSelect: (index: number) => void;
  onHover: (day: RoadtripCardDay | null) => void;
}) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const format = useCardFormat();
  const warning = t('assistant.card.roadtrip.dayWarning');
  const tall = variant === 'fullscreen' ? 'min-h-11' : '';
  return (
    <ul
      aria-label={t('assistant.card.roadtrip.days')}
      className="trek-assistant-strip -mx-3 mt-2 flex list-none gap-1.5 overflow-x-auto px-3 pb-1 pt-0.5"
    >
      {days.map((day, index) => {
        const tile = tiles[index];
        const active = index === selected;
        const look = active ? 'bg-surface-card ring-1 ring-edge' : 'bg-surface-secondary hover:bg-surface-hover';
        return (
          <li key={day.dayId} className="flex-none">
            <button
              type="button"
              onClick={() => onSelect(index)}
              onMouseEnter={() => onHover(day)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(day)}
              onBlur={() => onHover(null)}
              aria-pressed={active}
              className={`relative flex items-center gap-1.5 rounded-xl p-1 pe-2 transition-colors ${tall} ${look}`}
            >
              {tile && <DayTile day={tile} tint={dayColors ? dayColor(day.dayNumber).line : null} />}
              <span className="whitespace-nowrap text-caption tabular-nums text-content-muted">
                {day.legs.length > 0 ? format.distance(day.distanceM / 1000) : t('assistant.card.roadtrip.noDrive')}
              </span>
              {dayHasWarning(day) && (
                <span
                  role="img"
                  aria-label={warning}
                  title={warning}
                  className="absolute end-1 top-1 h-1.5 w-1.5 rounded-full bg-warning"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
