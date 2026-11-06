import { dayPlanOutputSchema, type DayPlanStop } from '@trek/shared/mcp-apps';
import { useState } from 'react';
import { formatDateRange } from '../../lib/format';
import type { Translate } from '../../lib/i18n';
import { moveEntry, timeSpan } from './dayPlanModel';
import './day-plan.css';

export interface DayPlanProps {
  data: unknown;
  locale: string;
  t: Translate;
  /** Saves the stops' new order in TREK; resolves false when TREK refused. */
  onReorder: (assignmentIds: number[]) => Promise<boolean>;
}

/** The order the reader made here, over the order the tool result carried, and whether TREK refused the last move. */
function useStopOrder(stops: DayPlanStop[], onReorder: (assignmentIds: number[]) => Promise<boolean>) {
  const [order, setOrder] = useState<number[] | null>(null);
  const [failed, setFailed] = useState(false);
  const current = order ?? stops.map((stop) => stop.assignment_id);
  const move = async (index: number, step: -1 | 1) => {
    const next = moveEntry(current, index, step);
    setFailed(false);
    setOrder(next);
    if (await onReorder(next)) return;
    setOrder(current);
    setFailed(true);
  };
  const ordered = current.flatMap((id) => stops.filter((stop) => stop.assignment_id === id));
  return { ordered, move, failed };
}

/** get_day_plan's day as a numbered timeline; the arrows move a stop and save the order through the host. */
export function DayPlan({ data, locale, t, onReorder }: DayPlanProps) {
  const parsed = dayPlanOutputSchema.safeParse(data);
  const { ordered, move, failed } = useStopOrder(parsed.success ? parsed.data.stops : [], onReorder);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { day } = parsed.data;
  const title = day.title || t('mcpApps.dayPlan.day').replace('{day}', String(day.day_number ?? ''));
  const date = formatDateRange(day.date, null, locale);
  return (
    <section className="trek-widget" aria-labelledby="day-title">
      <header className="trek-header">
        <div className="trek-header__text">
          <h1 id="day-title" className="trek-header__title">
            {title}
          </h1>
          {date ? <p className="trek-muted trek-header__subtitle">{date}</p> : null}
        </div>
      </header>
      {failed ? (
        <p role="alert" className="trek-error">
          {t('mcpApps.dayPlan.reorderError')}
        </p>
      ) : null}
      {ordered.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.dayPlan.empty')}</p>
      ) : (
        <ol className="trek-list">
          {ordered.map((stop, index) => {
            const span = timeSpan(stop.time, stop.end_time);
            return (
              <li key={stop.assignment_id} className="day__stop">
                <span className="day__number" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="day__text">
                  <span className="day__name">{stop.name}</span>
                  {span || stop.address ? (
                    <span className="trek-muted">{[span, stop.address].filter(Boolean).join(' · ')}</span>
                  ) : null}
                </div>
                <div className="day__moves">
                  <button
                    type="button"
                    className="trek-button trek-hit"
                    aria-label={`${t('mcpApps.dayPlan.moveUp')}: ${stop.name}`}
                    disabled={index === 0}
                    onClick={() => void move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="trek-button trek-hit"
                    aria-label={`${t('mcpApps.dayPlan.moveDown')}: ${stop.name}`}
                    disabled={index === ordered.length - 1}
                    onClick={() => void move(index, 1)}
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
