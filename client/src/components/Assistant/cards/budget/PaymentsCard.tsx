import type { CardPayment, CardPerson, PaymentsCard as PaymentsCardData } from '@trek/shared';
import { ArrowLeftRight, ArrowRight, CalendarDays } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import { Fact } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import { useCardFormat } from '../parts/useCardFormat';
import { costsTarget, mergePayments } from './budgetModel';
import { Amount, NotePill, PaymentFaces, PaymentNames } from './budgetParts';

/**
 * Settle-up payments as the Costs page's history lists them: who paid whom,
 * face to face, how much, on which day and with what note. The same pieces
 * fill a change row of a payment recorded, changed or removed, where a change
 * strikes through the people and the amount it replaces.
 */

/** The day of a payment. */
function PaymentDate({ date }: { date: string }) {
  const format = useCardFormat();
  return <Fact icon={CalendarDays} label={format.date(date)} />;
}

/** The day of a payment and its note. */
function PaymentFacts({ row }: { row: CardPayment }) {
  return (
    <>
      {row.date && <PaymentDate date={row.date} />}
      {row.note && <NotePill note={row.note} />}
    </>
  );
}

/** One payment of the history. */
function PaymentRow({ row }: { row: CardPayment }) {
  const format = useCardFormat();
  return (
    <CardRow
      lead={<PaymentFaces from={row.from} to={row.to} />}
      title={<PaymentNames from={row.from} to={row.to} />}
      aside={<span className="text-body font-semibold tabular-nums text-content">{format.money(row.amount)}</span>}
      facts={
        <span className="mt-1 flex flex-wrap items-center gap-1">
          <PaymentFacts row={row} />
        </span>
      }
    />
  );
}

/** The payment cards of one answer, as one history. */
export default function PaymentsCard({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const card = mergePayments(cards);
  if (!card) return null;
  const title = t('costs.settleHistory');
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={ArrowLeftRight}
        tone="info"
        title={title}
        count={card.rows.length + card.more}
        actions={<CardOpenButton target={costsTarget()} labelKey="assistant.card.budget.open" />}
      />
      <CardRows>
        {card.rows.map((row, i) => (
          <PaymentRow key={row.id ?? `new-${i}`} row={row} />
        ))}
      </CardRows>
      <CardMore count={card.more} target={costsTarget()} />
    </CardFrame>
  );
}

interface SlotProps {
  card: PaymentsCardData;
  item: ChangeItem;
}

/** The amount at the end of a payment's change row, the one it replaces struck through before it. */
export function PaymentAside({ card, item }: SlotProps) {
  const row = card.rows[0];
  if (!row) return null;
  const struck = row.change === 'willDelete' || item.state === 'discarded' || item.state === 'expired';
  return <Amount value={row.amount} before={row.before?.amount ?? null} struck={struck} />;
}

interface PaymentPeople {
  from: CardPerson;
  to: CardPerson;
}

/** The people a change no longer moves money between, struck through, before the ones it does. */
function PeopleChange({ was, now }: { was: PaymentPeople; now: PaymentPeople }) {
  return (
    <SoftPill
      tone="info"
      className="max-w-full"
      icon={<ArrowLeftRight size={10} strokeWidth={2.2} aria-hidden="true" className="flex-none" />}
    >
      <span className="inline-flex min-w-0 text-content-faint line-through">
        <PaymentNames from={was.from} to={was.to} wrap={false} />
      </span>
      <ArrowRight size={9} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />
      <PaymentNames from={now.from} to={now.to} wrap={false} />
    </SoftPill>
  );
}

/** The day and note of a payment's change, and the people it no longer moves money between. */
export function PaymentChangeFacts({ card }: SlotProps) {
  const row = card.rows[0];
  if (!row) return null;
  const before = row.before;
  const was = before && (before.from || before.to) ? { from: before.from ?? row.from, to: before.to ?? row.to } : null;
  return (
    <>
      {was && <PeopleChange was={was} now={row} />}
      {row.date && <PaymentDate date={row.date} />}
    </>
  );
}

/** Under a payment's change row: the two people, face to face, and the payment's note under them. */
export function PaymentBody({ card }: SlotProps) {
  const row = card.rows[0];
  if (!row) return null;
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="flex items-center gap-2 text-caption text-content-secondary">
        <PaymentFaces from={row.from} to={row.to} size={20} />
        <PaymentNames from={row.from} to={row.to} />
      </span>
      {row.note && <NotePill note={row.note} />}
    </span>
  );
}
