import type { CardExpense, ExpensesCard } from '@trek/shared';
import { CalendarDays, MapPin, Receipt, Tag } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { catMeta } from '../../../Budget/costsCategories';
import type { ChangeItem } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import { Fact, FactChange } from '../parts/CardFacts';
import { useCardFormat } from '../parts/useCardFormat';
import { SPLIT_LABEL, togetherOf } from './budgetModel';
import { Amount, NotePill, SplitLine } from './budgetParts';

/**
 * An expense inside a change row, waiting or decided: its amount at the end
 * of the subject line (the one an update replaces struck through before it),
 * its category, day and place on the faint line with what an update changes,
 * and under it the whole split, the part the user decides on, and its note. A run of new
 * expenses in one currency says what they add up to.
 */

interface SlotProps {
  card: ExpensesCard;
  item: ChangeItem;
}

/** Whether the row is struck: an expense that goes, or a change that will not happen. */
function struckOut(card: ExpensesCard, item: ChangeItem): boolean {
  return card.rows[0]?.change === 'willDelete' || item.state === 'discarded' || item.state === 'expired';
}

export function ExpenseAside({ card, item }: SlotProps) {
  const row = card.rows[0];
  if (!row) return null;
  return <Amount value={row.amount} before={row.before?.amount ?? null} struck={struckOut(card, item)} />;
}

/** The category, or the one it was struck through before the new one. */
function CategoryFact({ row }: { row: CardExpense }) {
  const { t } = useTranslation();
  const nameOf = (category: string | null) => (category === null ? null : t(catMeta(category).labelKey));
  const now = nameOf(row.category);
  const was = row.before?.category ?? null;
  if (was !== null) return <FactChange icon={Tag} before={nameOf(was)} after={now ?? ''} tone="info" />;
  return now ? <Fact icon={Tag} label={now} /> : null;
}

/** The day, or the one it was struck through before the new one. */
function DateFact({ row }: { row: CardExpense }) {
  const format = useCardFormat();
  const was = row.before?.date ?? null;
  const now = row.date === null ? '' : format.date(row.date);
  if (was !== null) return <FactChange icon={CalendarDays} before={format.date(was)} after={now} tone="info" />;
  return now ? <Fact icon={CalendarDays} label={now} /> : null;
}

/** The place the expense belongs to; shown on the map where the chat can show it. */
function PlaceFact({ place }: { place: NonNullable<CardExpense['place']> }) {
  const { onOpen } = useAssistantView();
  const fact = <Fact icon={MapPin} label={place.name} />;
  if (!onOpen) return fact;
  return (
    <button
      type="button"
      onClick={() => onOpen({ kind: 'map', placeId: place.id, dayId: null })}
      className="inline-flex max-w-full rounded-full"
    >
      {fact}
    </button>
  );
}

export function ExpenseFacts({ card }: SlotProps) {
  const { t } = useTranslation();
  const row = card.rows[0];
  if (!row) return null;
  const split = row.before?.split ?? null;
  return (
    <>
      <CategoryFact row={row} />
      <DateFact row={row} />
      {split && (
        <FactChange
          icon={Tag}
          before={t(SPLIT_LABEL[split].labelKey)}
          after={t(SPLIT_LABEL[row.split].labelKey)}
          tone="info"
        />
      )}
      {row.receipts > 0 && <Fact icon={Receipt} label={t('assistant.card.budget.receipts', { count: row.receipts })} />}
    </>
  );
}

/** Under the row: the place it belongs to beside the split, and the expense's note under them. */
export function ExpenseBody({ card }: SlotProps) {
  const row = card.rows[0];
  if (!row) return null;
  return (
    <span className="flex flex-col items-start gap-1.5">
      <span className="flex flex-wrap items-center gap-1.5">
        {row.place && <PlaceFact place={row.place} />}
        <SplitLine row={row} />
      </span>
      {row.note && <NotePill note={row.note} />}
    </span>
  );
}

/** Under a run of waiting expenses: what the included ones add up to, when they are two or more in one currency. */
export function ExpensesTogether({
  items,
  excluded,
  place,
}: {
  items: readonly ChangeItem[];
  excluded: ReadonlySet<string>;
  place: 'head' | 'foot';
}) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const together = place === 'foot' ? togetherOf(items, excluded) : null;
  if (!together) return null;
  return (
    <p className="m-0 pt-1 text-end text-caption tabular-nums text-content-secondary">
      {t('assistant.card.budget.together', { amount: format.money(together) })}
    </p>
  );
}
