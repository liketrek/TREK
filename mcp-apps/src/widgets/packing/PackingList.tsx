import { listPackingItemsOutputSchema } from '@trek/shared/mcp-apps';
import { useState } from 'react';
import type { Translate } from '../../lib/i18n';
import { WidgetHeader } from '../../lib/WidgetState';
import {
  INLINE_ITEM_LIMIT,
  isPacked,
  itemsInBag,
  progress,
  type BagFilter,
  type PackingBag,
  type PackingItem,
} from './packingModel';
import './packing.css';

export interface PackingListProps {
  data: unknown;
  appUrl: string | null;
  locale: string;
  t: Translate;
  onOpen: (url: string) => void;
  /** Ticks an item off or back on in TREK; resolves false when TREK refused. */
  onToggle: (item: PackingItem, checked: boolean) => Promise<boolean>;
  /** Asks the host for more room before the whole list unfolds. */
  onExpand: () => void;
}

/** list_packing_items' result as a checklist: tick items off here, filter by bag, unfold past the first dozen. */
export function PackingList({ data, appUrl, locale, t, onOpen, onToggle, onExpand }: PackingListProps) {
  const [overrides, setOverrides] = useState<ReadonlyMap<number, boolean>>(new Map());
  const [filter, setFilter] = useState<BagFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const parsed = listPackingItemsOutputSchema.safeParse(data);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { items, bags } = parsed.data;
  const shown = itemsInBag(items, filter);
  const visible = expanded ? shown : shown.slice(0, INLINE_ITEM_LIMIT);
  const { packed, total } = progress(shown, overrides);
  const tripId = items[0]?.trip_id;
  const number = new Intl.NumberFormat(locale);

  const toggle = async (item: PackingItem) => {
    const next = !isPacked(item, overrides);
    setFailed(false);
    setOverrides((previous) => new Map(previous).set(item.id, next));
    if (await onToggle(item, next)) return;
    setOverrides((previous) => new Map(previous).set(item.id, !next));
    setFailed(true);
  };

  return (
    <section className="trek-widget" aria-labelledby="packing-title">
      <WidgetHeader
        title={t('mcpApps.packing.title')}
        subtitle={`${t('mcpApps.packing.packed')}: ${number.format(packed)} / ${number.format(total)}`}
        href={appUrl && tripId ? `${appUrl}/trips/${tripId}` : null}
        openLabel={t('mcpApps.openInTrek')}
        onOpen={onOpen}
      />
      {bags.length > 0 ? <BagChips bags={bags} filter={filter} onChange={setFilter} t={t} /> : null}
      {failed ? (
        <p role="alert" className="packing__error">
          {t('mcpApps.packing.toggleError')}
        </p>
      ) : null}
      {shown.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.packing.empty')}</p>
      ) : (
        <ul className="trek-list">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isPacked(item, overrides)}
                className="packing__item trek-hit"
                onClick={() => void toggle(item)}
              >
                <span className="packing__box" aria-hidden="true" />
                <span className="packing__name">{item.name}</span>
                {item.category ? <span className="trek-muted">{item.category}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!expanded && shown.length > INLINE_ITEM_LIMIT ? (
        <button
          type="button"
          className="trek-button trek-hit packing__more"
          onClick={() => {
            setExpanded(true);
            onExpand();
          }}
        >
          {t('mcpApps.packing.showAll')}
        </button>
      ) : null}
    </section>
  );
}

function BagChips({
  bags,
  filter,
  onChange,
  t,
}: {
  bags: PackingBag[];
  filter: BagFilter;
  onChange: (filter: BagFilter) => void;
  t: Translate;
}) {
  const options: Array<[BagFilter, string]> = [
    ['all', t('mcpApps.packing.all')],
    ...bags.map((bag): [BagFilter, string] => [bag.id, bag.name]),
    ['none', t('mcpApps.packing.noBag')],
  ];
  return (
    <div role="group" aria-label={t('mcpApps.packing.bags')} className="packing__chips">
      {options.map(([value, label]) => (
        <button
          key={String(value)}
          type="button"
          aria-pressed={filter === value}
          className="trek-button trek-hit"
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
