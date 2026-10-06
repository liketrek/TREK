import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useWeekStartDay } from '../../hooks/useWeekStartDay';
import { useTranslation } from '../../i18n';
import { leadingBlanks, weekdayLabels } from '../../utils/calendarWeek';
import { localIsoDate } from '../../utils/localDate';

/**
 * The header steps up a level on each click, days → months → years, and a
 * pick steps back down. Mirrors CustomDateTimePicker, so a person who has
 * learnt one calendar in TREK knows the other. Without it the only way to a
 * different year was one month at a time, which on a photo picker asked to
 * cover a trip three years back meant thirty-six clicks (#2318).
 */
type CalendarView = 'days' | 'months' | 'years';
const YEAR_PAGE_SIZE = 12;

export function DatePicker({
  value,
  onChange,
  tripDates,
}: {
  value: string;
  onChange: (date: string) => void;
  tripDates?: Set<string>;
}) {
  const { t, locale } = useTranslation();
  const weekStart = useWeekStartDay();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>('days');
  const [yearPageStart, setYearPageStart] = useState(0);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  // Rows open on the user's week_start, like CustomDateTimePicker (#2029).
  const firstDow = leadingBlanks(viewMonth.year, viewMonth.month, weekStart);
  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    setViewMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 }));
  };
  const nextMonth = () => {
    setViewMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 }));
  };

  const handlePrev = () => {
    if (view === 'days') prevMonth();
    else if (view === 'months') setViewMonth((p) => ({ ...p, year: p.year - 1 }));
    else setYearPageStart((s) => s - YEAR_PAGE_SIZE);
  };
  const handleNext = () => {
    if (view === 'days') nextMonth();
    else if (view === 'months') setViewMonth((p) => ({ ...p, year: p.year + 1 }));
    else setYearPageStart((s) => s + YEAR_PAGE_SIZE);
  };
  const handleHeaderClick = () => {
    if (view === 'days') {
      setView('months');
    } else if (view === 'months') {
      setYearPageStart(Math.floor(viewMonth.year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE);
      setView('years');
    }
  };
  const selectMonth = (month: number) => {
    setViewMonth((p) => ({ ...p, month }));
    setView('days');
  };
  const selectYear = (year: number) => {
    setViewMonth((p) => ({ ...p, year }));
    setView('months');
  };
  const toggleOpen = () => {
    // Reopening lands on the days again: a picker left on the year grid
    // would otherwise open there next time, one level away from a date.
    setView('days');
    setOpen(!open);
  };

  const prevLabel =
    view === 'days'
      ? t('common.datepicker.prevMonth')
      : view === 'months'
        ? t('common.datepicker.prevYear')
        : t('common.datepicker.prevYears');
  const nextLabel =
    view === 'days'
      ? t('common.datepicker.nextMonth')
      : view === 'months'
        ? t('common.datepicker.nextYear')
        : t('common.datepicker.nextYears');
  const headerLabel =
    view === 'days'
      ? monthName
      : view === 'months'
        ? String(viewMonth.year)
        : `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`;
  const headerAria =
    view === 'days'
      ? t('common.datepicker.selectMonth')
      : view === 'months'
        ? t('common.datepicker.selectYear')
        : undefined;

  const pad = (n: number) => String(n).padStart(2, '0');

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(viewMonth.year, i).toLocaleDateString(locale, { month: 'short' })
  );
  const years = Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i);

  const formatted = value
    ? new Date(value + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const navButton =
    'w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500';
  const gridCell = (selected: boolean) =>
    `h-9 rounded-lg text-[12px] font-medium flex items-center justify-center transition-colors ${
      selected
        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
    }`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-[13px] text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      >
        {formatted ? (
          <span>{formatted}</span>
        ) : (
          <span>
            <span className="hidden sm:inline">{t('journey.picker.selectDate')}</span>
            <span className="sm:hidden">{t('common.date')}</span>
          </span>
        )}
        <Calendar size={13} className="text-zinc-400" />
      </button>

      {open && (
        <>
          {/* Click-away catcher — no semantics of its own; the trigger button
              above closes the popover again from the keyboard. */}
          <div role="presentation" className="fixed inset-0 z-[10]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-[20] mt-1 w-[280px] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {/* Header: arrows step the current view, the label climbs to the next one up */}
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={handlePrev} aria-label={prevLabel} className={navButton}>
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleHeaderClick}
                aria-label={headerAria}
                disabled={view === 'years'}
                className="rounded-lg px-2 py-1 text-[13px] font-semibold text-zinc-900 hover:bg-zinc-100 disabled:cursor-default disabled:hover:bg-transparent dark:text-white dark:hover:bg-zinc-700"
              >
                {headerLabel}
              </button>
              <button type="button" onClick={handleNext} aria-label={nextLabel} className={navButton}>
                <ChevronRight size={14} />
              </button>
            </div>

            {view === 'months' && (
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectMonth(i)}
                    className={gridCell(i === viewMonth.month)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {view === 'years' && (
              <div className="grid grid-cols-3 gap-1">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => selectYear(y)}
                    className={gridCell(y === viewMonth.year)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {view === 'days' && (
              <>
                {/* Weekday headers */}
                <div className="mb-1 grid grid-cols-7">
                  {weekdayLabels(locale, weekStart, 'short').map((d, i) => (
                    <div key={i} className="py-1 text-center text-[10px] font-medium text-zinc-400">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7">
                  {cells.map((day, i) => {
                    if (day === null) return <div key={`e${i}`} />;
                    const dateStr = `${viewMonth.year}-${pad(viewMonth.month + 1)}-${pad(day)}`;
                    const isSelected = dateStr === value;
                    const isTrip = tripDates?.has(dateStr);
                    const isToday = dateStr === localIsoDate();

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          onChange(dateStr);
                          setOpen(false);
                        }}
                        className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : isToday
                              ? 'font-bold text-zinc-900 dark:text-white'
                              : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {day}
                        {isTrip && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
