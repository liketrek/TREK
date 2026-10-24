import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { Tooltip } from '../../../shared/Tooltip';
import {
  type CardMonth,
  type CellSize,
  type DayCell,
  monthCells,
  type PlacedProposal,
  type VacayView,
} from './vacayCardModel';
import { cellLook } from './vacayCellLook';

/**
 * One month of the vacation card, drawn the way the planner draws it: the
 * weekdays in the user's language, a person's days in their colour, the
 * company's and the public holidays, the trip's days dotted. A held day sits
 * on its cell; while it waits, the cell is a button that takes it in or
 * leaves it out, and its tooltip says which.
 */

const SIZE: Record<CellSize, string> = { compact: 'size-6', roomy: 'size-7', phone: 'size-9' };
const GRID: Record<CellSize, string> = {
  compact: 'grid grid-cols-7 gap-0.5',
  roomy: 'grid grid-cols-7 gap-1',
  phone: 'grid grid-cols-7 gap-1.5',
};
const TITLE = 'mb-1.5 ps-0.5 text-caption font-semibold capitalize text-content';
const WEEKDAY = 'grid h-5 place-items-center text-caption text-content-faint';
const TRIP_DOT = 'absolute end-0.5 top-0.5 size-1 rounded-full bg-info';
const HALF_DOT = 'absolute bottom-0.5 end-0.5 size-1 rounded-full bg-warning';

interface MonthProps {
  view: VacayView;
  month: CardMonth;
  placed: readonly PlacedProposal[];
  today: string;
  size: CellSize;
  /** Takes a held day in or leaves it out; absent once the card is decided or while a turn runs. */
  onToggle?: (toolCallId: string) => void;
  /** A held day in words: its date and what it does. */
  labelOf: (entry: PlacedProposal) => string;
}

/** The narrow weekday names from the week's first day on; 7 January 2024 was a Sunday. */
function weekdayNames(locale: string, weekStart: number): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  return Array.from({ length: 7 }, (_, column) => format.format(new Date(2024, 0, 7 + ((column + weekStart) % 7))));
}

/** "October 2026" in the user's language. */
function monthTitle(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1));
}

function Cell({
  view,
  cell,
  size,
  onToggle,
  labelOf,
}: Pick<MonthProps, 'view' | 'size' | 'onToggle' | 'labelOf'> & { cell: DayCell }) {
  const { t } = useTranslation();
  const look = cellLook(view, cell);
  const className = [look.className, SIZE[size]].join(' ');
  const marks = (
    <>
      {cell.trip && <span aria-hidden="true" className={TRIP_DOT} />}
      {look.half && <span aria-hidden="true" className={HALF_DOT} />}
    </>
  );
  const entry = look.proposal;
  if (entry && onToggle && (entry.state === 'pending' || entry.state === 'excluded')) {
    const label = labelOf(entry);
    const hint = t(entry.state === 'pending' ? 'assistant.card.vacay.tapToSkip' : 'assistant.card.vacay.tapToTake');
    return (
      <Tooltip label={`${label}. ${hint}`} placement="top">
        <button
          type="button"
          aria-pressed={entry.state === 'pending'}
          aria-label={label}
          onClick={() => onToggle(entry.toolCallId)}
          className={className}
          style={look.style}
        >
          {cell.day}
          {marks}
        </button>
      </Tooltip>
    );
  }
  const body = (
    <span className={className} style={look.style}>
      {cell.day}
      {marks}
    </span>
  );
  return cell.holiday ? (
    <Tooltip label={cell.holiday.name} placement="top">
      {body}
    </Tooltip>
  ) : (
    body
  );
}

export default function VacayMiniMonth({ view, month, placed, today, size, onToggle, labelOf }: MonthProps) {
  const { locale } = useTranslation();
  const title = useMemo(() => monthTitle(locale, month.year, month.month), [locale, month.year, month.month]);
  const weekdays = useMemo(() => weekdayNames(locale, view.weekStart), [locale, view.weekStart]);
  const cells = monthCells(view, month, placed, today);
  return (
    <div role="group" aria-label={title}>
      <p className={TITLE}>{title}</p>
      <div className={GRID[size]}>
        {weekdays.map((name, column) => (
          <span key={`weekday-${column}`} aria-hidden="true" className={WEEKDAY}>
            {name}
          </span>
        ))}
        {cells.map((cell, index) =>
          cell ? (
            <Cell key={cell.date} view={view} cell={cell} size={size} onToggle={onToggle} labelOf={labelOf} />
          ) : (
            <span key={`lead-${index}`} aria-hidden="true" />
          )
        )}
      </div>
    </div>
  );
}
