import type { TrekCard } from '@trek/shared';
import { Building2, CalendarCog, CalendarDays, CalendarMinus, CalendarPlus } from 'lucide-react';

import type { PackLook } from '../cardTypes';

/**
 * What the vacation planner brings to the chat's pure look: the verbs, tool
 * names and steps it adds, what an applied change of its own opens, and the
 * look of each of its kinds. A look stays pure, icons and literals only: the
 * chat's main chunk reads every look, so whatever a look imports ships with
 * it.
 */

/**
 * The leave year a vacation card is about: the held day's, else the year a
 * read asked for (a leave year from April shows a February trip of the next
 * calendar year), else the first of the days left, else its first month's.
 */
export function vacayYearOf(card: TrekCard | null): number | null {
  if (card?.kind !== 'vacay') return null;
  return card.proposal?.periodYear ?? card.year ?? card.balances[0]?.year ?? card.months[0]?.year ?? null;
}

/** Vacay on the year of the card, or on the period it would open anyway. */
export function vacayPathOf(card: TrekCard | null): string {
  const year = vacayYearOf(card);
  return year === null ? '/vacay' : `/vacay?year=${year}`;
}

export const VACAY_LOOK = {
  verbs: {
    addVacationDay: { Icon: CalendarPlus, tone: 'success', labelKey: 'assistant.change.verb.addVacationDay' },
    removeVacationDay: { Icon: CalendarMinus, tone: 'danger', labelKey: 'assistant.change.verb.removeVacationDay' },
    changeVacationDay: { Icon: CalendarCog, tone: 'info', labelKey: 'assistant.change.verb.changeVacationDay' },
    setCompanyHoliday: { Icon: Building2, tone: 'warning', labelKey: 'assistant.change.verb.setCompanyHoliday' },
    setVacationAllowance: {
      Icon: CalendarDays,
      tone: 'info',
      labelKey: 'assistant.change.verb.setVacationAllowance',
    },
  },
  tools: {
    add_vacay_year: { labelKey: 'assistant.tool.add_vacay_year' },
    delete_vacay_year: { labelKey: 'assistant.tool.delete_vacay_year' },
    update_vacay_plan: { labelKey: 'assistant.tool.update_vacay_plan' },
    set_vacay_color: { labelKey: 'assistant.tool.set_vacay_color' },
    add_holiday_calendar: { labelKey: 'assistant.tool.add_holiday_calendar' },
    delete_holiday_calendar: { labelKey: 'assistant.tool.delete_holiday_calendar' },
  },
  steps: {
    get_vacay_entries: { stepKey: 'assistant.step.vacayEntries' },
    get_vacay_stats: { stepKey: 'assistant.step.vacayStats' },
    list_holidays: { stepKey: 'assistant.step.vacayHolidays' },
  },
  entities: {
    vacay: {
      Icon: CalendarDays,
      openLabelKey: 'assistant.card.vacay.open',
      open: (_applied, card) => ({ kind: 'page', path: vacayPathOf(card) }),
    },
  },
  cards: {
    vacay: {
      entity: () => 'vacay',
      // The change card's calendar shows the logged days already, so a read of them next to it gives way.
      yieldsToChange: (_answer, change) => change.kind === 'vacay',
    },
  },
} satisfies PackLook<'vacay'>;
