import { useTranslation } from '../../i18n';

/**
 * Grey stand-ins in the shape of what is loading, where a native app shows the
 * list before its content rather than a spinner in an empty screen: rows for a
 * list, cards for a feed, a cover and lines for a detail page, a plain surface
 * for a map. They pulse softly, and not at all with reduced motion. Announced
 * once as "Loading" for a screen reader; the shapes themselves are hidden from it.
 */

type MSkeletonVariant = 'rows' | 'cards' | 'detail' | 'map';

interface MSkeletonProps {
  variant: MSkeletonVariant;
  /** How many rows or cards (rows, cards). */
  count?: number;
  /** Rows as cards of their own (default), or as lines inside a card that already frames them. */
  framed?: boolean;
  className?: string;
}

const BLOCK = 'bg-[color:var(--m-ic)]';
// Lines of different lengths read as text; equal ones read as a table.
const WIDTHS = ['w-2/3', 'w-1/2', 'w-3/4', 'w-3/5'];

function Row({ i, framed }: { i: number; framed: boolean }) {
  const frame = framed
    ? 'mb-2 rounded-[14px] border border-[color:var(--m-rowbr)] px-3 py-[10px]'
    : 'border-b border-[color:var(--m-rowbr)] py-3 last:border-b-0';
  return (
    <div className={`flex items-center gap-[11px] ${frame}`}>
      <span className={`h-9 w-9 flex-none rounded-[10px] ${BLOCK}`} />
      <span className="min-w-0 flex-1">
        <span className={`block h-3 rounded-full ${BLOCK} ${WIDTHS[i % WIDTHS.length]}`} />
        <span className={`mt-2 block h-2.5 w-1/3 rounded-full ${BLOCK}`} />
      </span>
    </div>
  );
}

function Card({ i }: { i: number }) {
  return (
    <div className="mb-3">
      <div className={`h-[180px] w-full rounded-[22px] ${BLOCK}`} />
      <span className={`mt-3 block h-3.5 rounded-full ${BLOCK} ${WIDTHS[i % WIDTHS.length]}`} />
      <span className={`mt-2 block h-2.5 w-1/3 rounded-full ${BLOCK}`} />
    </div>
  );
}

function Detail() {
  return (
    <div>
      <div className={`h-[300px] w-full ${BLOCK}`} />
      <div className="px-4 pt-5">
        <span className={`block h-5 w-2/3 rounded-full ${BLOCK}`} />
        <span className={`mt-3 block h-3 w-1/3 rounded-full ${BLOCK}`} />
        {WIDTHS.map((w) => (
          <span key={w} className={`mt-4 block h-3 rounded-full ${BLOCK} ${w}`} />
        ))}
      </div>
    </div>
  );
}

export default function MSkeleton({ variant, count = 4, framed = true, className = '' }: MSkeletonProps) {
  const { t } = useTranslation();
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <div
      role="status"
      data-skeleton=""
      aria-label={t('common.loading')}
      className={`animate-pulse motion-reduce:animate-none ${className}`}
    >
      <div aria-hidden="true" className={variant === 'map' ? 'h-full' : undefined}>
        {variant === 'rows' && items.map((i) => <Row key={i} i={i} framed={framed} />)}
        {variant === 'cards' && items.map((i) => <Card key={i} i={i} />)}
        {variant === 'detail' && <Detail />}
        {variant === 'map' && <div className={`h-full w-full ${BLOCK}`} />}
      </div>
    </div>
  );
}
