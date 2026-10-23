import type { CardExpense, CardMoney, CardPerson } from '@trek/shared';
import { ArrowRight, Check, StickyNote } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { catMeta } from '../../../Budget/costsCategories';
import { SoftPill, tintOf, WhiteBadge } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { useAssistantView } from '../../assistantViewContext';
import { PeopleStack, PersonFace } from '../parts/CardPeople';
import { useCardFormat } from '../parts/useCardFormat';
import { useBudgetPeople } from './budgetHooks';
import { chipLimit, sharesAsChips, stackLimit } from './budgetModel';

/**
 * The pieces the costs' cards share, drawn as the Costs page draws them: an
 * expense's category tile, an amount (struck through where a change replaces
 * it), the people of a split as small badges with their part, and the line
 * that says who paid and who shares it.
 */

/** The category's tile: its icon in its own colour on a tint of it, its name for a screen reader. */
export function CategoryTile({ category }: { category: string | null }) {
  const { t } = useTranslation();
  const { Icon, color, labelKey } = catMeta(category);
  const label = t(labelKey);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px]"
      style={{ background: tintOf(color, 14), color }}
    >
      <Icon size={14} strokeWidth={2.1} aria-hidden="true" />
    </span>
  );
}

/** An amount at the end of a row; the one a change replaces struck through before it. */
export function Amount({
  value,
  before = null,
  struck = false,
}: {
  value: CardMoney;
  before?: CardMoney | null;
  struck?: boolean;
}) {
  const format = useCardFormat();
  return (
    <span className="flex flex-none flex-wrap items-center justify-end gap-1 whitespace-nowrap text-body font-semibold tabular-nums text-content">
      {before && (
        <>
          <bdi className="font-normal text-content-faint line-through">{format.money(before)}</bdi>
          <ArrowRight size={9} aria-hidden="true" className="text-content-faint rtl:-scale-x-100" />
        </>
      )}
      <bdi className={struck ? 'text-content-faint line-through' : ''}>{format.money(value)}</bdi>
    </span>
  );
}

/**
 * One person's part of a split: a white badge, green with a tick once paid,
 * in the accent when the change is about them, the tick there too when they
 * have paid, so a paid tick set and one taken off read apart. Everything it
 * shows is in its label, for a screen reader and a phone without a tooltip.
 */
function ShareChip({
  person,
  amount,
  paid = false,
  highlighted = false,
}: {
  person: CardPerson;
  amount: CardMoney;
  paid?: boolean;
  highlighted?: boolean;
}) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const { nameOf } = useBudgetPeople();
  const money = format.money(amount);
  const said = t('costs.splitChipLabel', { name: nameOf(person), amount: money });
  const state = paid ? t('costs.table.paid') : highlighted ? t('assistant.card.budget.notPaid') : null;
  const label = state ? `${said}, ${state}` : said;
  const face = <PersonFace person={person} size={14} />;
  const pill = highlighted ? (
    <SoftPill tone="accent" icon={face} className="tabular-nums">
      {money}
      {paid && <Check size={9} strokeWidth={3} aria-hidden="true" />}
    </SoftPill>
  ) : paid ? (
    <SoftPill tone="success" icon={face} className="tabular-nums">
      {money}
      <Check size={9} strokeWidth={3} aria-hidden="true" />
    </SoftPill>
  ) : (
    <WhiteBadge icon={face}>{money}</WhiteBadge>
  );
  return (
    <Tooltip label={label}>
      <span role="img" className="inline-flex" aria-label={label}>
        {pill}
      </span>
    </Tooltip>
  );
}

/** Who paid: one payer by name ("You paid"), several each with what they paid; a warning when nobody did. */
function Payers({ row }: { row: Pick<CardExpense, 'payers' | 'amount'> }) {
  const { t } = useTranslation();
  const { paidBy } = useBudgetPeople();
  const [only] = row.payers;
  if (!only) return <SoftPill tone="warning">{t('costs.noOnePaid')}</SoftPill>;
  if (row.payers.length === 1) {
    return <WhiteBadge icon={<PersonFace person={only.person} size={14} />}>{paidBy(only.person)}</WhiteBadge>;
  }
  return (
    <>
      {row.payers.map((payer) => (
        <ShareChip
          key={payer.person.id}
          person={payer.person}
          amount={{ amount: payer.amount, currency: row.amount.currency }}
        />
      ))}
    </>
  );
}

/**
 * The split of an expense in a change row: who paid, an arrow, then each
 * part as a badge, or a stack and the part per person for an even split of
 * many. A planning-only expense says so instead.
 */
export function SplitLine({ row }: { row: CardExpense }) {
  const { t } = useTranslation();
  const { density } = useAssistantView();
  const format = useCardFormat();
  if (row.split === 'none') {
    return (
      <span className="flex flex-wrap items-center gap-1">
        <SoftPill>{t('assistant.card.budget.split.none')}</SoftPill>
      </span>
    );
  }
  const currency = row.amount.currency;
  const highlighted = new Set(row.highlight);
  const firstShare = row.shares[0];
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Payers row={row} />
      <ArrowRight size={10} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />
      {sharesAsChips(row, chipLimit(density)) || !firstShare ? (
        row.shares.map((share) => (
          <ShareChip
            key={share.person.id}
            person={share.person}
            amount={{ amount: share.amount, currency }}
            paid={share.paid}
            highlighted={highlighted.has(share.person.id)}
          />
        ))
      ) : (
        <>
          <PeopleStack people={row.shares.map((share) => share.person)} max={stackLimit(density)} />
          <span className="text-caption tabular-nums text-content-secondary">
            {t('costs.perPerson', { amount: format.money({ amount: firstShare.amount, currency }) })}
          </span>
        </>
      )}
      {row.moreShares > 0 && (
        <span className="text-caption text-content-faint">
          {t('assistant.card.common.more', { count: row.moreShares })}
        </span>
      )}
    </span>
  );
}

/** Two people of a payment, face to face: who paid, an arrow, who got it. */
export function PaymentFaces({ from, to, size = 24 }: { from: CardPerson; to: CardPerson; size?: 20 | 24 }) {
  return (
    <span className="flex flex-none items-center gap-1">
      <PersonFace person={from} size={size} />
      <ArrowRight size={13} aria-hidden="true" className="text-content-faint rtl:-scale-x-100" />
      <PersonFace person={to} size={size} />
    </span>
  );
}

/**
 * "Ben → Ana" in words, each name kept whole in either reading direction and
 * the arrow turned for a right-to-left one. Inside a badge it stays on one line.
 */
export function PaymentNames({ from, to, wrap = true }: { from: CardPerson; to: CardPerson; wrap?: boolean }) {
  const { nameOf } = useBudgetPeople();
  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${wrap ? 'flex-wrap' : 'flex-nowrap'}`}>
      <bdi>{nameOf(from)}</bdi>
      <ArrowRight size={11} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />
      <bdi>{nameOf(to)}</bdi>
    </span>
  );
}

/**
 * A note in the white of a badge, wrapping over up to three lines rather
 * than cut on one, so a phone without a tooltip reads it too. The card
 * carries a note already cut to a sentence or two; the tooltip still holds
 * all of it where three lines are not enough.
 */
export function NotePill({ note }: { note: string }) {
  return (
    <span
      title={note}
      className="inline-flex min-w-0 max-w-full items-start gap-1 rounded-[10px] bg-surface-card px-2 py-[3px] text-caption leading-snug text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint"
    >
      <StickyNote size={10} aria-hidden="true" className="mt-[3px] flex-none text-content-faint" />
      <bdi className="line-clamp-3 min-w-0 break-words">{note}</bdi>
    </span>
  );
}
