import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '../../i18n';
import type { BudgetItem } from '../../types';
import { Tooltip } from '../shared/Tooltip';

/** Split chips a row shows before the rest fold into "+N" (#1763). */
const SPLIT_CHIP_MAX = 6;
const CHIP = 'inline-flex items-center gap-[5px] rounded-full bg-surface-tertiary text-content-secondary';

/**
 * Who an expense is split between and each one's part (#1763), so checking that
 * the right people are in no longer means opening every expense. Quieter than
 * the payer chips above it in the ledger row, and capped so a large group
 * cannot crowd the row.
 */
export function CostsSplitChips({
  e,
  avatar,
  personName,
  shareOf,
  fmt,
}: {
  e: BudgetItem;
  /** A member's avatar at the given size, drawn the way the rest of the ledger draws it. */
  avatar: (userId: number, size: number) => ReactNode;
  personName: (id: number) => string;
  /** A member's part of the expense in the display currency. */
  shareOf: (e: BudgetItem, userId: number) => number;
  fmt: (amount: number) => string;
}) {
  const { t } = useTranslation();
  const members = e.members || [];
  if (members.length === 0) return null;
  const shown = members.length > SPLIT_CHIP_MAX ? members.slice(0, SPLIT_CHIP_MAX - 1) : members;
  const rest = members.slice(shown.length);
  const label = (userId: number) =>
    t('costs.splitChipLabel', { name: personName(userId), amount: fmt(shareOf(e, userId)) });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 6 }}>
      <span
        className="text-content-faint"
        style={{
          fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginInlineEnd: 2,
        }}
      >
        {t('costs.split')}
      </span>
      {shown.map((m) => (
        <Tooltip key={m.user_id} label={label(m.user_id)}>
          <span
            className={CHIP}
            data-testid="split-chip"
            style={{ paddingBlock: 2, paddingInline: '2px 8px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}
          >
            {avatar(m.user_id, 16)}
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(shareOf(e, m.user_id))}</span>
            {m.paid ? (
              <Check size={11} strokeWidth={2.6} className="text-success" aria-label={t('costs.paid')} />
            ) : null}
          </span>
        </Tooltip>
      ))}
      {rest.length > 0 && (
        <Tooltip label={rest.map((m) => label(m.user_id)).join(', ')}>
          <span
            className={CHIP}
            style={{ padding: '2px 8px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700 }}
          >
            +{rest.length}
          </span>
        </Tooltip>
      )}
    </div>
  );
}
