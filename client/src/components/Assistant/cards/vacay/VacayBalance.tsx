import { ArrowRight, CalendarDays, TriangleAlert } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { fmtDays } from '../../../Vacay/vacayFormat';
import { useViewerId } from '../parts/useViewerId';
import { type BalanceLine, lineFigures, namesYear, todayStr, type VacayView } from './vacayCardModel';
import { personColor } from './vacayCellLook';

/**
 * The days left per person and leave year under the calendar: who, the days
 * left before and after the changes that count, a meter of used, planned and
 * left days in the person's colour, and what the changes come to (days used
 * or given back, past the allowance, a new allowance). A read card shows the
 * days left as they are.
 */

const ROW = 'mt-2 first:mt-1.5';
const HEAD = 'flex min-w-0 items-center gap-2';
const DOT = 'size-2 flex-none rounded-full';
const NAME = 'min-w-0 flex-1 text-body text-content';
const FIGURES = 'flex flex-none items-baseline gap-1 tabular-nums';
const FIGURE = 'text-body font-semibold text-content';
const CAPTION = 'text-caption text-content-muted';
const METER = 'mt-1 flex h-1.5 gap-0.5 overflow-hidden rounded-full';
const PILLS = 'mt-1 flex flex-wrap items-center gap-1';
const ARROW = 'flex-none self-center text-content-faint rtl:-scale-x-100';

type Mode = 'read' | 'change';

interface Piece {
  key: string;
  grow: number;
  style: CSSProperties;
  label: string;
  className?: string;
}

/** The pieces of a person's meter: used, given back, planned, past the allowance, left. */
function meterPieces(line: BalanceLine, color: string, t: (key: string, params?: Record<string, number>) => string) {
  const total = line.totalAfter ?? line.total;
  const planned = Math.max(0, line.delta);
  const given = Math.max(0, -line.delta);
  const over = Math.max(0, line.used + line.delta - total);
  const left = Math.max(0, total - line.used - line.delta);
  const hatch = (tone: string) => `repeating-linear-gradient(45deg, ${tone} 0 2px, transparent 2px 4px)`;
  const pieces: Piece[] = [
    {
      key: 'used',
      grow: line.used - given,
      style: { background: `color-mix(in srgb, ${color} 78%, transparent)` },
      label: t('assistant.card.vacay.usedDays', { count: line.used - given }),
    },
    {
      key: 'given',
      grow: given,
      style: {},
      label: t('assistant.card.vacay.givesBack', { count: given }),
      className: 'rounded-full outline-dashed outline-1 outline-offset-[-1px] outline-edge',
    },
    {
      key: 'planned',
      grow: planned - over,
      style: { background: hatch(`color-mix(in srgb, ${color} 78%, transparent)`) },
      label: t('assistant.card.vacay.uses', { count: planned - over }),
    },
    {
      key: 'over',
      grow: over,
      style: { background: `${hatch('var(--danger)')}, var(--danger-soft)` },
      label: t('assistant.card.vacay.over', { count: over }),
    },
    {
      key: 'left',
      grow: left,
      style: { background: `color-mix(in srgb, ${color} 16%, transparent)` },
      label: t('assistant.card.vacay.daysLeft', { count: left }),
    },
  ];
  return pieces.filter((piece) => piece.grow > 0);
}

function Line({ line, view, mode, withYear }: { line: BalanceLine; view: VacayView; mode: Mode; withYear: boolean }) {
  const { t } = useTranslation();
  const viewerId = useViewerId();
  const person = view.people.find((candidate) => candidate.id === line.personId);
  const color = personColor(view, line.personId);
  const { leftNow, leftAfter, over } = lineFigures(line);
  const changes = line.delta !== 0 || line.totalAfter !== null;
  const total = line.totalAfter ?? line.total;
  const name = line.personId === viewerId ? t('assistant.card.common.you') : (person?.name ?? `#${line.personId}`);
  const usedOf = t('assistant.card.vacay.usedOf', { used: fmtDays(line.used), total: fmtDays(total) });
  const meter = t('assistant.card.vacay.meter', {
    used: fmtDays(line.used),
    planned: fmtDays(Math.max(0, line.delta)),
    remaining: fmtDays(Math.max(0, leftAfter)),
    total: fmtDays(total),
  });
  return (
    <li className={ROW}>
      <div className={HEAD}>
        <span aria-hidden="true" className={DOT} style={{ background: color }} />
        <bdi className={NAME}>{name}</bdi>
        {withYear && <WhiteBadge>{line.year}</WhiteBadge>}
        <span className={FIGURES}>
          {changes && (
            <>
              <span className={FIGURE}>{fmtDays(leftNow)}</span>
              <ArrowRight size={12} aria-hidden="true" className={ARROW} />
            </>
          )}
          {mode === 'read' && !changes && <span className={CAPTION}>{usedOf}</span>}
          <span className={changes ? FIGURE : CAPTION}>
            {t('assistant.card.vacay.daysLeft', { count: Math.max(0, changes ? leftAfter : leftNow) })}
          </span>
        </span>
      </div>
      <div role="img" aria-label={meter} className={METER}>
        {meterPieces(line, color, t).map((piece) => (
          <Tooltip key={piece.key} label={piece.label} placement="top">
            <span className={piece.className} style={{ ...piece.style, flexGrow: piece.grow }} />
          </Tooltip>
        ))}
      </div>
      <BalanceFacts line={line} mode={mode} over={over} />
    </li>
  );
}

/** What the changes come to, in pills; a read card names the comp days only. */
function BalanceFacts({ line, mode, over }: { line: BalanceLine; mode: Mode; over: number }) {
  const { t } = useTranslation();
  const pills: ReactNode[] = [];
  if (line.delta > 0) {
    pills.push(<SoftPill key="uses">{t('assistant.card.vacay.uses', { count: line.delta })}</SoftPill>);
  }
  if (line.delta < 0) {
    pills.push(<SoftPill key="given">{t('assistant.card.vacay.givesBack', { count: -line.delta })}</SoftPill>);
  }
  if (over > 0) {
    pills.push(
      <SoftPill key="over" tone="danger" icon={<TriangleAlert size={10} aria-hidden="true" />}>
        {t('assistant.card.vacay.over', { count: over })}
      </SoftPill>
    );
  }
  if (line.totalAfter !== null) {
    // The allowance alone, as the user set it: the totals also hold what was carried over.
    pills.push(
      <SoftPill key="allowance" icon={<CalendarDays size={10} aria-hidden="true" />}>
        {t('assistant.card.vacay.allowance')}
        <bdi className="text-content-faint line-through">{fmtDays(line.total - line.carried)}</bdi>
        <ArrowRight size={9} aria-hidden="true" className={ARROW} />
        <bdi>{fmtDays(line.totalAfter - line.carried)}</bdi>
      </SoftPill>
    );
  }
  if (mode === 'read' && line.comp > 0) {
    pills.push(<SoftPill key="comp">{t('assistant.card.vacay.compDays', { count: line.comp })}</SoftPill>);
  }
  return pills.length > 0 ? <div className={PILLS}>{pills}</div> : null;
}

export default function VacayBalance({
  lines,
  view,
  mode,
}: {
  lines: readonly BalanceLine[];
  view: VacayView;
  mode: Mode;
}) {
  if (lines.length === 0) return null;
  const withYear = namesYear(lines, todayStr());
  return (
    <ul>
      {lines.map((line) => (
        <Line key={`${line.personId}:${line.year}`} line={line} view={view} mode={mode} withYear={withYear} />
      ))}
    </ul>
  );
}
