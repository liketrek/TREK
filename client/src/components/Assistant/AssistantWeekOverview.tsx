import { useTranslation } from '../../i18n';
import type { WeekDay } from './useWeekDays';

/**
 * A plan over several days as one row of small tiles: a day per tile, its
 * number of changes in the corner, taken in or left out as a whole with one
 * tap. The single changes
 * stay below it, folded away until asked for.
 */
export default function AssistantWeekOverview({
  days,
  excluded,
  disabled,
  onToggleDay,
}: {
  days: readonly WeekDay[];
  excluded: ReadonlySet<string>;
  disabled: boolean;
  onToggleDay: (ids: readonly string[], include: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('assistant.week.title')}
      className="mb-2 grid gap-2 pt-1"
      style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 7)}, minmax(0, 1fr))` }}
    >
      {days.map((day, i) => {
        const on = day.ids.filter((id) => !excluded.has(id)).length;
        const taken = on > 0;
        const count = taken ? on : day.ids.length;
        const name = `${day.weekday ?? t('assistant.week.day')} ${day.n}`;
        return (
          <button
            key={day.id}
            type="button"
            disabled={disabled}
            aria-pressed={taken}
            aria-label={`${name}, ${t('assistant.week.changes', { count })}`}
            title={t('assistant.week.changes', { count })}
            onClick={() => onToggleDay(day.ids, !taken)}
            className={`trek-assistant-enter relative flex min-w-0 flex-col items-center rounded-lg py-1.5 outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default ${
              taken
                ? 'bg-accent text-accent-text shadow-sm hover:-translate-y-px hover:shadow-md'
                : 'bg-surface-secondary text-content-faint hover:text-content-muted'
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className={`text-caption leading-tight ${taken ? 'opacity-75' : ''}`}>
              {day.weekday ?? t('assistant.week.day')}
            </span>
            <span className={`text-body font-semibold tabular-nums leading-tight ${taken ? '' : 'line-through'}`}>
              {day.n}
            </span>
            <span
              aria-hidden="true"
              className={`absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-caption font-semibold tabular-nums leading-none ring-2 ring-surface-card ${
                taken ? 'bg-surface-card text-content' : 'bg-surface-tertiary text-content-faint'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
