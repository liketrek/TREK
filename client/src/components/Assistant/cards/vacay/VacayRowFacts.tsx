import type { VacayCard, VacayCardProposal, VacayProposalNote } from '@trek/shared';
import { CalendarDays, Coffee, Sun, SunDim } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { safeHexColor } from '../../../../utils/safeColor';
import { type PillTone, SoftPill } from '../../../Planner/planParts';
import { fmtDays } from '../../../Vacay/vacayFormat';
import type { ChangeItem } from '../../assistantParts';
import { FactChange } from '../parts/CardFacts';
import { useViewerId } from '../parts/useViewerId';

/**
 * The facts on a vacation row's faint line: how much of the day it is (old
 * to new when it changes), whose day it is when it is not the user's, what
 * the user should know about the day, and for a new allowance the allowance
 * before and after.
 */

/** What the user should know about a day, in words and a tone. A table, so each key is named where it is read. */
const NOTE_LOOK: Record<VacayProposalNote, { labelKey: string; tone: PillTone }> = {
  weekendBlocked: { labelKey: 'assistant.card.vacay.weekendBlocked', tone: 'warning' },
  weekend: { labelKey: 'assistant.card.vacay.weekend', tone: 'warning' },
  publicHoliday: { labelKey: 'assistant.card.vacay.publicHoliday', tone: 'info' },
  companyHoliday: { labelKey: 'assistant.card.vacay.companyHoliday', tone: 'info' },
  companyHalf: { labelKey: 'assistant.card.vacay.companyHalf', tone: 'info' },
  notInPlan: { labelKey: 'assistant.card.vacay.notInPlan', tone: 'danger' },
  companyOff: { labelKey: 'assistant.card.vacay.companyOff', tone: 'warning' },
};

/** How much of a day an entry is, by its kind and size. */
const SIZE_LOOK = {
  comp: { labelKey: 'assistant.card.vacay.compDay', Icon: Coffee },
  half: { labelKey: 'assistant.card.vacay.halfDay', Icon: SunDim },
  full: { labelKey: 'assistant.card.vacay.fullDay', Icon: Sun },
} as const;

function sizeOf(day: Pick<VacayCardProposal, 'kind' | 'fraction'>): (typeof SIZE_LOOK)[keyof typeof SIZE_LOOK] {
  if (day.kind === 'comp') return SIZE_LOOK.comp;
  return day.fraction === 0.5 ? SIZE_LOOK.half : SIZE_LOOK.full;
}

const DOT = 'size-1.5 flex-none rounded-full';

export default function VacayRowFacts({ card }: { card: VacayCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const viewerId = useViewerId();
  const proposal = card.proposal;
  if (!proposal) {
    const balance = card.balances.find((row) => row.totalAfter !== null);
    if (!balance || balance.totalAfter === null) return null;
    // The allowance alone, the days carried over taken out of both totals.
    const carried = balance.carried ?? 0;
    const before = fmtDays(balance.total - carried);
    return <FactChange icon={CalendarDays} before={before} after={fmtDays(balance.totalAfter - carried)} />;
  }
  const shown = proposal.outcome === 'remove' && proposal.before ? proposal.before : proposal;
  const size = sizeOf(shown);
  const before = proposal.outcome === 'convert' && proposal.before ? t(sizeOf(proposal.before).labelKey) : null;
  const person =
    proposal.personId !== null && proposal.personId !== viewerId
      ? card.people.find((candidate) => candidate.id === proposal.personId)
      : undefined;
  const dotColor = safeHexColor(person?.color, 'var(--accent)');
  return (
    <>
      <FactChange icon={size.Icon} before={before} after={t(size.labelKey)} />
      {person && (
        <SoftPill icon={<span aria-hidden="true" className={DOT} style={{ background: dotColor }} />}>
          <bdi className="truncate">{person.name}</bdi>
        </SoftPill>
      )}
      {proposal.notes.map((note) => (
        <SoftPill key={note} tone={NOTE_LOOK[note].tone}>
          {t(NOTE_LOOK[note].labelKey)}
        </SoftPill>
      ))}
    </>
  );
}
