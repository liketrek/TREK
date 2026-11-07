import { listPackingItemsOutputSchema } from '@trek/shared/mcp-apps';
import { useState } from 'react';
import { Checklist, useChecklist } from '../../lib/Checklist';
import type { Translate } from '../../lib/i18n';
import { SegmentedButtons, WidgetHeader } from '../../lib/WidgetState';
import { INLINE_ITEM_LIMIT, itemsInBag, type BagFilter, type PackingBag, type PackingItem } from './packingModel';
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
  const [filter, setFilter] = useState<BagFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const parsed = listPackingItemsOutputSchema.safeParse(data);
  const items = parsed.success ? parsed.data.items : [];
  const checklist = useChecklist((id, checked) => {
    const item = items.find((candidate) => candidate.id === id);
    return item ? onToggle(item, checked) : Promise.resolve(false);
  });
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { bags } = parsed.data;
  const shown = itemsInBag(items, filter);
  const visible = expanded ? shown : shown.slice(0, INLINE_ITEM_LIMIT);
  const packed = shown.filter((item) => checklist.isChecked(item.id, item.checked === 1)).length;
  const tripId = items[0]?.trip_id;
  const number = new Intl.NumberFormat(locale);

  return (
    <section className="trek-widget" aria-labelledby="packing-title">
      <WidgetHeader
        id="packing-title"
        title={t('mcpApps.packing.title')}
        subtitle={`${t('mcpApps.packing.packed')}: ${number.format(packed)} / ${number.format(shown.length)}`}
        link={{ href: appUrl && tripId ? `${appUrl}/trips/${tripId}` : null, label: t('mcpApps.openInTrek'), onOpen }}
      />
      {bags.length > 0 ? <BagChips bags={bags} filter={filter} onChange={setFilter} t={t} /> : null}
      {shown.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.packing.empty')}</p>
      ) : (
        <Checklist
          rows={visible.map((item) => ({
            id: item.id,
            name: item.name,
            checked: checklist.isChecked(item.id, item.checked === 1),
            aside: item.category ? <span className="trek-muted">{item.category}</span> : undefined,
          }))}
          failed={checklist.failed}
          errorText={t('mcpApps.packing.toggleError')}
          onToggle={(row) => void checklist.toggle(row.id, items.find((item) => item.id === row.id)?.checked === 1)}
        />
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
  const options: Array<readonly [BagFilter, string]> = [
    ['all', t('mcpApps.packing.all')],
    ...bags.map((bag) => [bag.id, bag.name] as const),
    ['none', t('mcpApps.packing.noBag')],
  ];
  return (
    <SegmentedButtons
      label={t('mcpApps.packing.bags')}
      options={options}
      value={filter}
      onChange={onChange}
      className="packing__chips"
    />
  );
}
