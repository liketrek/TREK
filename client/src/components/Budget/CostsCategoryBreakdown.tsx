import type { CostCategory } from '@trek/shared';
import { RotateCcw } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { COST_CAT_META } from './costsCategories';
import type { CostsCategoryBar } from './costsModel';

/**
 * What each category cost, as a ranked list of bars (spec §3.5), on the
 * desktop Costs panel. Categories net refunds against spend (#2176): a category
 * that nets negative keeps its row without a bar. Bars are scaled against the
 * most expensive category counted, not the trip total, so the ranking reads.
 *
 * A row is a switch that leaves its category out of the totals for a look
 * without it (#2819). It stays in place, dimmed and struck through, and the
 * line on top says what is left out, with a way to count everything again.
 */
export function CostsCategoryBreakdown({
  rows,
  leftOutLabel,
  fmt,
  onToggle,
  onCountAll,
}: {
  rows: CostsCategoryBar[];
  /** What the totals leave out, as the line on top says it; empty while everything counts. */
  leftOutLabel: string;
  fmt: (amount: number) => string;
  onToggle: (key: CostCategory) => void;
  onCountAll: () => void;
}) {
  const { t } = useTranslation();
  if (rows.length === 0) {
    return (
      <div className="text-content-faint" style={fs(12.5, 'body')}>
        {t('costs.noCategories')}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {leftOutLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 text-content-muted" style={fs(12, 'body')}>
            {leftOutLabel}
          </span>
          <button
            type="button"
            onClick={onCountAll}
            className="inline-flex flex-none items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 font-semibold text-content-muted shadow-sm hover:text-content"
            style={fs(11.5)}
          >
            <RotateCcw size={12} /> {t('costs.breakdown.countAll')}
          </button>
        </div>
      ) : (
        rows.length > 1 && (
          <p className="m-0 text-content-faint" style={fs(11.5)}>
            {t('costs.breakdown.hint')}
          </p>
        )
      )}
      {rows.map((row) => {
        const c = COST_CAT_META[row.key];
        const name = t(c.labelKey);
        const action = row.leftOut
          ? t('costs.breakdown.countIn', { category: name })
          : t('costs.breakdown.leaveOut', { category: name });
        return (
          <Tooltip key={row.key} label={action}>
            <button
              type="button"
              aria-label={action}
              onClick={() => onToggle(row.key)}
              className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 rounded-lg text-start transition-opacity ${row.leftOut ? 'opacity-45' : ''}`}
            >
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c.color }} />
              <span className="text-content" style={fs(13, 'body')}>
                {name}
              </span>
              <span
                className={`font-semibold text-content-muted ${row.leftOut ? 'line-through' : ''}`}
                style={fs(13, 'body')}
              >
                {fmt(row.amount)}
              </span>
              <span className="col-span-full h-[5px] overflow-hidden rounded-[3px] bg-surface-secondary">
                <span
                  className="block h-full rounded-[3px]"
                  style={{ width: `${row.widthPct}%`, background: c.color }}
                />
              </span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
