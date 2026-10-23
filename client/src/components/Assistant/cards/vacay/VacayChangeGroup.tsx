import { TriangleAlert } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import type { ChangeItem } from '../../assistantParts';
import { verbLookOf } from '../cardLooks';
import VacayBalance from './VacayBalance';
import {
  allowancesOf,
  balanceLines,
  mergeVacayCards,
  type PlacedProposal,
  placedProposals,
  vacayCardsOf,
} from './vacayCardModel';
import VacayMonthStrip from './VacayMonthStrip';

/**
 * The calendar over a change card's vacation rows: the months of the held
 * days with what is logged there, each held day on its cell (tap one to take
 * it in or leave it out), and the days left before and after what is chosen.
 * Once the changes are decided it shows what was applied.
 */

const GROUP = 'mb-1 rounded-lg bg-surface-secondary px-2.5 pb-2 pt-2';
const PILLS = 'mt-1.5 flex flex-wrap items-center gap-1';

/** A held day's date as the change rows write it. */
function dateLabel(locale: string, date: string): string {
  const value = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(value);
}

export default function VacayChangeGroup({
  items,
  excluded,
  disabled,
  onToggle,
  place,
}: {
  items: readonly ChangeItem[];
  excluded: ReadonlySet<string>;
  /** The chat runs: the held days wait, as the change card's own choices do. */
  disabled: boolean;
  onToggle(id: string): void;
  place: 'head' | 'foot';
}) {
  const { t, locale } = useTranslation();
  if (place !== 'head') return null;
  const view = mergeVacayCards(vacayCardsOf(items).map((entry) => entry.card));
  const placed = placedProposals(items, excluded);
  const lines = balanceLines(view, placed, allowancesOf(items, excluded));
  const waiting = items.some((item) => item.state === 'pending');
  const verbOf = (toolCallId: string) => items.find((item) => item.toolCallId === toolCallId)?.preview?.verbKey;
  const labelOf = (entry: PlacedProposal) => {
    const verb = verbOf(entry.toolCallId);
    const date = dateLabel(locale, entry.proposal.date);
    return verb ? `${date}: ${t(verbLookOf(verb).labelKey)}` : date;
  };
  const twice = placed.some((entry) => entry.twice);
  return (
    <div className={GROUP}>
      {view.months.length > 0 && (
        <VacayMonthStrip
          view={view}
          placed={placed}
          onToggle={waiting && !disabled ? onToggle : undefined}
          labelOf={labelOf}
        />
      )}
      {placed.length > 0 && (
        <ul className="sr-only">
          {placed.map((entry) => (
            <li key={entry.toolCallId}>{labelOf(entry)}</li>
          ))}
        </ul>
      )}
      {twice && (
        <div className={PILLS}>
          <SoftPill tone="warning" icon={<TriangleAlert size={10} aria-hidden="true" />}>
            {t('assistant.card.vacay.twice')}
          </SoftPill>
        </div>
      )}
      <VacayBalance lines={lines} view={view} mode="change" />
    </div>
  );
}
