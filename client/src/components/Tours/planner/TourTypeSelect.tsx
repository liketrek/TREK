import { plannableTourTypeSchema, type ImportableTourType, type PlannableTourType } from '@trek/shared';
import { Check, ChevronDown } from 'lucide-react';
import { createElement, useId } from 'react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { PopoverListPanel } from '../../shared/dialogParts';
import { usePopoverList } from '../../shared/usePopoverList';
import { tourDayRowIcon } from '../tourDayRowIcon';

/** The types the planner offers, in the order the contract lists them. */
const PLANNER_TOUR_TYPES = plannableTourTypeSchema.options;

function TypeTile({ type, active = false }: { type: ImportableTourType; active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] ${active ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-secondary'}`}
    >
      {createElement(tourDayRowIcon(type), { size: 15, strokeWidth: 2 })}
    </span>
  );
}

/**
 * What the tour is, as one field that opens the types with what each one
 * plans: a hike on footpaths within its limit, a bike tour on its profile, a
 * paddle tour on the water, a ride along horse routes, a ski and winter tour
 * (SKI-02) drawn point to point. Room for the types still to come without the
 * row of buttons it was growing too long for. The planner offers the types it
 * plans, the GPX import the types a track can be kept as.
 */
export function TourTypeSelect<T extends ImportableTourType = PlannableTourType>({
  value,
  onChange,
  disabled = false,
  labelId,
  types,
}: {
  value: T;
  onChange: (type: T) => void;
  disabled?: boolean;
  /** The label over the field, read before the type chosen. */
  labelId: string;
  /** The types offered, in order; the planner's own when left out. */
  types?: readonly T[];
}) {
  const { t } = useTranslation();
  const valueId = useId();
  const offered: readonly ImportableTourType[] = types ?? PLANNER_TOUR_TYPES;
  const list = usePopoverList(offered.indexOf(value), { estimatedHeight: 50 * offered.length + 20 });
  const { open, toggle, triggerRef, listId } = list;
  const label = t('tours.planner.tourType');
  const pick = (type: T) => {
    list.close();
    onChange(type);
  };
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-testid="tour-type-select"
        onClick={toggle}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${valueId}`}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-[10px] border border-edge bg-surface-input py-1.5 pe-3 ps-1.5 text-start hover:border-content-faint disabled:cursor-default disabled:opacity-50"
      >
        <TypeTile type={value} />
        <span id={valueId} className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>
            {t(`tourTypes.${value}`)}
          </span>
          <span className="block truncate text-content-faint" style={fs(11, 'body')}>
            {t(`tours.planner.tourTypeHint.${value}`)}
          </span>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <PopoverListPanel list={list} label={label} className="flex min-w-[260px] flex-col gap-0.5">
        {(offered as readonly T[]).map((type) => {
          const active = type === value;
          return (
            <button
              key={type}
              type="button"
              data-testid={`tour-type-option-${type}`}
              aria-pressed={active}
              onClick={() => pick(type)}
              className={`flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-start hover:bg-surface-tertiary focus-visible:bg-surface-tertiary focus-visible:outline-none ${active ? 'bg-surface-tertiary' : ''}`}
            >
              <TypeTile type={type} active={active} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-content" style={fs(12.5, 'body')}>
                  {t(`tourTypes.${type}`)}
                </span>
                <span className="block text-content-muted" style={fs(11, 'body')}>
                  {t(`tours.planner.tourTypeHint.${type}`)}
                </span>
              </span>
              {active && (
                <Check size={14} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-muted" />
              )}
            </button>
          );
        })}
      </PopoverListPanel>
    </>
  );
}
