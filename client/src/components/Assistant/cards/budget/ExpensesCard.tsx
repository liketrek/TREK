import type { CardExpense, ExpensesCard as ExpensesCardData } from '@trek/shared';
import { CalendarDays, Receipt, TriangleAlert, Wallet } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import { Fact } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { PeopleStack, PersonFace } from '../parts/CardPeople';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import { useCardFormat } from '../parts/useCardFormat';
import { useBudgetPeople } from './budgetHooks';
import { costsTarget, mergeExpenses, stackLimit } from './budgetModel';
import { CategoryTile } from './budgetParts';

/**
 * The expense list in an answer, as the Costs page lists it: per expense its
 * category tile, the name, the amount (and what a foreign one comes to in the
 * trip currency), the day, who paid and who shares it, its receipts. An
 * expense opens itself in the Costs tab; the ones the card leaves out are
 * counted there too, beside the trip's total.
 */

/** Who paid, in words as the Costs page says it: "You paid", "Ana paid", or that several did. */
function PayerBadge({ payers }: { payers: CardExpense['payers'] }) {
  const { t } = useTranslation();
  const { paidBy } = useBudgetPeople();
  const [payer] = payers;
  if (!payer) return null;
  if (payers.length > 1) return <WhiteBadge>{t('costs.multiplePayers')}</WhiteBadge>;
  return <WhiteBadge icon={<PersonFace person={payer.person} size={14} />}>{paidBy(payer.person)}</WhiteBadge>;
}

/** The line under an expense's name: its day, who paid, who shares it, its receipts. */
function ExpenseFacts({ row }: { row: CardExpense }) {
  const { t } = useTranslation();
  const { density } = useAssistantView();
  const format = useCardFormat();
  const payer = row.payers[0];
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {row.date && <Fact icon={CalendarDays} label={format.date(row.date)} />}
      <PayerBadge payers={row.payers} />
      {row.split === 'none' ? (
        <SoftPill>{t('assistant.card.budget.split.none')}</SoftPill>
      ) : (
        <>
          {!payer && <SoftPill tone="warning">{t('costs.noOnePaid')}</SoftPill>}
          <PeopleStack people={row.shares.map((share) => share.person)} max={stackLimit(density)} />
        </>
      )}
      {row.receipts > 0 && <Fact icon={Receipt} label={t('assistant.card.budget.receipts', { count: row.receipts })} />}
    </span>
  );
}

/** One expense of the list: a button into the Costs tab where something can open it. */
function ExpenseRow({ row }: { row: CardExpense }) {
  const { onOpen } = useAssistantView();
  const format = useCardFormat();
  const amount = format.money(row.amount);
  const id = row.id;
  return (
    <CardRow
      lead={<CategoryTile category={row.category} />}
      title={
        <bdi title={row.name} className="line-clamp-2">
          {row.name}
        </bdi>
      }
      aside={
        <span className="flex flex-col items-end">
          <span className="whitespace-nowrap text-body font-semibold tabular-nums text-content">{amount}</span>
          {row.tripAmount && <span className="whitespace-nowrap tabular-nums">≈ {format.money(row.tripAmount)}</span>}
        </span>
      }
      facts={<ExpenseFacts row={row} />}
      onActivate={id !== null && onOpen ? () => onOpen(costsTarget(id)) : undefined}
    />
  );
}

/** The foot of the list: the expenses left out, and the trip's total (marked when it leaves some out). */
function ExpensesFoot({ card }: { card: ExpensesCardData }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  if (card.more === 0 && !card.total) return null;
  const leftOut = t('assistant.card.budget.leftOut', { count: card.unconverted });
  return (
    <div className="mt-1 flex items-center gap-2 border-t border-edge-faint pt-2 text-caption">
      <CardMore count={card.more} target={costsTarget()} />
      {card.total && (
        <span className="ms-auto flex items-center gap-1 text-content-secondary">
          {card.unconverted > 0 && (
            <Tooltip label={leftOut}>
              <span role="img" aria-label={leftOut} className="inline-flex text-warning">
                <TriangleAlert size={12} aria-hidden="true" />
              </span>
            </Tooltip>
          )}
          {t('budget.total')}
          <span className="font-semibold tabular-nums text-content">{format.money(card.total)}</span>
        </span>
      )}
    </div>
  );
}

/** The expense cards of one answer, drawn as one list. */
export default function ExpensesCard({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const card = mergeExpenses(cards);
  if (!card) return null;
  const title = t('costs.expenses');
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={Wallet}
        tone="info"
        title={title}
        count={card.rows.length + card.more}
        actions={<CardOpenButton target={costsTarget()} labelKey="assistant.card.budget.open" />}
      />
      <CardRows>
        {card.rows.map((row, i) => (
          <ExpenseRow key={row.id ?? `new-${i}`} row={row} />
        ))}
      </CardRows>
      <ExpensesFoot card={card} />
    </CardFrame>
  );
}
