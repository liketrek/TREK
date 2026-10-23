import { Users } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { PersonFace } from '../parts/CardPeople';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import { useCardFormat } from '../parts/useCardFormat';
import { useBudgetPeople } from './budgetHooks';
import { costsTarget, latestOf } from './budgetModel';

/**
 * What the trip's expenses come to for each traveller, largest share first:
 * the share at the end, a bar against the largest one under the name, how
 * many expenses it is made of and how much of it is marked paid.
 */
export default function CostPerPersonCard({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const { nameOf } = useBudgetPeople();
  const card = latestOf(cards, 'costPerPerson');
  if (!card) return null;
  const title = t('budget.perPerson');
  const largest = Math.max(...card.rows.map((row) => Math.abs(row.share)));
  const money = (amount: number) => format.money({ amount, currency: card.currency });
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={Users}
        tone="info"
        title={title}
        count={card.rows.length + card.more}
        actions={<CardOpenButton target={costsTarget()} labelKey="assistant.card.budget.open" />}
      />
      <CardRows>
        {card.rows.map((row) => (
          <CardRow
            key={row.person.id}
            lead={<PersonFace person={row.person} size={24} />}
            title={<bdi>{nameOf(row.person)}</bdi>}
            aside={<span className="text-body font-semibold tabular-nums text-content">{money(row.share)}</span>}
            facts={
              <span className="mt-1 block">
                <span className="block h-[5px] overflow-hidden rounded-full bg-surface-secondary">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${largest > 0 ? (Math.abs(row.share) / largest) * 100 : 0}%` }}
                  />
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-caption font-normal text-content-faint">
                    {t('costs.expensesCount', { count: row.count })}
                  </span>
                  {row.paid > 0 && (
                    <SoftPill tone="success">
                      {t('assistant.card.budget.markedPaid', { amount: money(row.paid) })}
                    </SoftPill>
                  )}
                </span>
              </span>
            }
          />
        ))}
      </CardRows>
      <CardMore count={card.more} target={costsTarget()} />
    </CardFrame>
  );
}
