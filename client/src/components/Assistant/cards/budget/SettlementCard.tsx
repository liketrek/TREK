import type { SettlementCard as SettlementCardData } from '@trek/shared';
import { Check, Scale, TriangleAlert } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { Eyebrow } from '../../../Planner/bookings/bookingParts';
import { TourNotice } from '../../../Tours/tourParts';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { PersonFace } from '../parts/CardPeople';
import { useCardFormat } from '../parts/useCardFormat';
import { useBudgetPeople } from './budgetHooks';
import { balanceShare, costsTarget, latestOf } from './budgetModel';
import { PaymentFaces, PaymentNames } from './budgetParts';

/**
 * Settle up as the Costs page shows it: the payments that square the trip,
 * face to face, or a green "everyone's square"; each traveller's balance on
 * a bar from the middle (green to one side, red to the other, mirrored in a
 * right-to-left language); the entries no rate converts yet, and how many
 * payments were already recorded.
 */

/** Who pays whom, or the square trip. */
function Flows({ card }: { card: SettlementCardData }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  if (card.flows.length === 0) {
    return (
      <div className="flex items-center gap-2.5 py-2">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-body font-semibold text-content">{t('costs.everyoneSquare')}</span>
          <span className="block text-caption text-content-faint">{t('costs.nothingOutstanding')}</span>
        </span>
      </div>
    );
  }
  return (
    <ul className="m-0 list-none divide-y divide-edge-faint p-0">
      {card.flows.map((flow) => (
        <li key={`${flow.from.id}-${flow.to.id}`} className="flex items-center gap-2 py-2">
          <PaymentFaces from={flow.from} to={flow.to} />
          <span className="min-w-0 flex-1 text-caption text-content-secondary">
            <PaymentNames from={flow.from} to={flow.to} />
          </span>
          <span className="flex-none text-body font-semibold tabular-nums text-content">
            {format.money({ amount: flow.amount, currency: card.currency })}
          </span>
        </li>
      ))}
      {card.moreFlows > 0 && (
        <li className="py-1 text-caption text-content-faint">
          {t('assistant.card.common.more', { count: card.moreFlows })}
        </li>
      )}
    </ul>
  );
}

/** Each traveller's balance: positive is owed money, negative owes it. */
function Balances({ card }: { card: SettlementCardData }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const { nameOf } = useBudgetPeople();
  if (card.balances.length === 0) return null;
  const largest = Math.max(...card.balances.map((row) => Math.abs(row.balance)));
  return (
    <section className="mt-2">
      <Eyebrow className="mb-1.5">{t('costs.balances')}</Eyebrow>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {card.balances.map((row) => {
          const owed = row.balance >= 0.005;
          const owes = row.balance <= -0.005;
          const reach = { width: `${balanceShare(row.balance, largest)}%` };
          const money = format.money({ amount: row.balance, currency: card.currency });
          const tone = owed ? 'text-success' : owes ? 'text-danger' : 'text-content-faint';
          return (
            <li key={row.person.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2.5">
              <PersonFace person={row.person} size={20} />
              <span className="min-w-0">
                <bdi className="block truncate text-caption font-semibold text-content">{nameOf(row.person)}</bdi>
                <span className="relative mt-1 block h-[5px] overflow-hidden rounded-full bg-surface-secondary">
                  <span className="absolute inset-y-0 start-1/2 w-px bg-edge" />
                  {owed && <span className="absolute inset-y-0 start-1/2 rounded-full bg-success" style={reach} />}
                  {owes && <span className="absolute inset-y-0 end-1/2 rounded-full bg-danger" style={reach} />}
                </span>
              </span>
              <span className={`text-caption font-semibold tabular-nums ${tone}`}>{owed ? `+${money}` : money}</span>
            </li>
          );
        })}
        {card.moreBalances > 0 && (
          <li className="text-caption text-content-faint">
            {t('assistant.card.common.more', { count: card.moreBalances })}
          </li>
        )}
      </ul>
    </section>
  );
}

/** The latest settle up of an answer. */
export default function SettlementCard({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const card = latestOf(cards, 'settlement');
  if (!card) return null;
  const title = t('costs.settleUp');
  const { entries, currencies } = card.unconverted;
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={Scale}
        tone="info"
        title={title}
        count={card.flows.length + card.moreFlows}
        actions={<CardOpenButton target={costsTarget()} labelKey="assistant.card.budget.open" />}
      />
      <Flows card={card} />
      <Balances card={card} />
      {entries > 0 && (
        <div className="mt-2">
          <TourNotice tone="warning" icon={<TriangleAlert size={12} aria-hidden="true" />}>
            {t('assistant.card.budget.unconverted', { count: entries, currencies: currencies.join(', ') })}
          </TourNotice>
        </div>
      )}
      {card.recorded > 0 && (
        <p className="m-0 pt-2 text-caption text-content-faint">
          {t('costs.paymentsSettled', { count: card.recorded })}
        </p>
      )}
    </CardFrame>
  );
}
