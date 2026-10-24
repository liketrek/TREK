import { currencyDecimals, currencyLocale, formatMoney } from '../../utils/formatters';
import { fs } from '../shared/DialogShell';

/** A tone's colour, from the status tokens the booking cards use. */
const TONE_COLOR = {
  owe: 'var(--danger)',
  owed: 'var(--success)',
  unfinished: 'var(--warning)',
  total: 'var(--accent)',
} as const;

/**
 * One of the four figures on top, drawn like a booking card: a head band tinted
 * by what the figure means, with its icon, name and a line on what it counts,
 * then the amount and a foot with who or what is behind it.
 */
export default function SummaryCard({
  label,
  sub,
  amount,
  currency,
  locale,
  icon,
  foot,
  tone,
}: {
  label: string;
  sub: string;
  amount: number;
  currency: string;
  locale: string;
  icon: React.ReactNode;
  foot: React.ReactNode;
  tone: 'owe' | 'owed' | 'total' | 'unfinished';
}) {
  const color = TONE_COLOR[tone];
  // formatToParts keeps the design's "big integer + muted symbol/decimals" styling
  // while letting Intl place the symbol and pick separators per locale + currency.
  let parts: Intl.NumberFormatPart[] | null = null;
  try {
    const d = currencyDecimals(currency);
    parts = new Intl.NumberFormat(currencyLocale(currency), {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).formatToParts(amount || 0);
  } catch {
    parts = null;
  }
  const big = (p: Intl.NumberFormatPart) => p.type === 'integer' || p.type === 'group' || p.type === 'minusSign';
  return (
    <section
      aria-label={label}
      className="flex flex-col overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary"
    >
      <div
        className="flex items-center gap-2.5 border-b border-edge-faint px-4 py-3"
        style={{ background: `color-mix(in srgb, ${color} ${tone === 'total' ? 7 : 11}%, transparent)` }}
      >
        <span
          className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card shadow-sm"
          style={{ color: tone === 'total' ? 'var(--text-primary)' : color }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="truncate font-bold text-content" style={fs(13.5, 'body')}>
            {label}
          </div>
          <div className="truncate text-content-faint" style={fs(11.5)}>
            {sub}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3.5">
        <div
          className="flex items-baseline font-semibold leading-none tracking-[-0.035em]"
          style={{
            fontSize: 'calc(40px * var(--fs-scale-title, 1))',
            color: tone === 'total' ? 'var(--text-primary)' : color,
          }}
        >
          {parts ? (
            parts.map((p, i) => (
              <span
                key={i}
                className={big(p) ? undefined : 'font-medium text-content-faint'}
                style={big(p) ? undefined : { fontSize: 'calc(22px * var(--fs-scale-title, 1))' }}
              >
                {p.value}
              </span>
            ))
          ) : (
            <span>{formatMoney(amount, currency, locale)}</span>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-content-muted" style={fs(12.5, 'body')}>
          {foot}
        </div>
      </div>
    </section>
  );
}
