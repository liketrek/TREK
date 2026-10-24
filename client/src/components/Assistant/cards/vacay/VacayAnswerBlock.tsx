import type { CSSProperties } from 'react';

import { Palmtree } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { safeHexColor } from '../../../../utils/safeColor';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { CardFoot } from '../parts/CardSection';
import { useViewerId } from '../parts/useViewerId';
import VacayBalance from './VacayBalance';
import { balanceLines, mergeVacayCards, type VacayView } from './vacayCardModel';
import { personColor } from './vacayCellLook';
import { vacayPathOf } from './vacayLook';
import VacayMonthStrip from './VacayMonthStrip';

/**
 * What the vacation planner's reads found, as one card: the months with the
 * days off, a legend once more than one thing is drawn, the days off outside
 * the months shown, the days left per person, and the way into Vacay on that
 * year. Several reads in one answer read as one calendar.
 */

const LEGEND = 'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-content-muted';
const LEGEND_ITEM = 'inline-flex min-w-0 items-center gap-1.5';
const SWATCH = 'size-2 flex-none rounded-full';
const SQUARE = 'size-2 flex-none rounded-sm';
const COMPANY = 'size-2 flex-none rounded-sm bg-warning-soft ring-1 ring-inset ring-warning';
const TRIP = 'size-1.5 flex-none rounded-full bg-info';
const OTHER = 'mt-1.5 text-caption text-content-muted';

interface LegendItem {
  key: string;
  label: string;
  className: string;
  style?: CSSProperties;
}

/** What the calendar draws, named once it draws more than one thing. */
function Legend({ view }: { view: VacayView }) {
  const { t } = useTranslation();
  const viewerId = useViewerId();
  const people = view.people.filter((person) => view.days.some((day) => day.personId === person.id));
  const holiday = view.holidays[0];
  const items: LegendItem[] = people.map((person) => ({
    key: `person-${person.id}`,
    label: person.id === viewerId ? t('assistant.card.common.you') : person.name,
    className: SWATCH,
    style: { background: personColor(view, person.id) },
  }));
  if (holiday) {
    const color = safeHexColor(holiday.color, 'var(--danger)');
    items.push({
      key: 'holiday',
      label: t('vacay.publicHoliday'),
      className: SQUARE,
      style: { background: `color-mix(in srgb, ${color} 28%, transparent)` },
    });
  }
  if (view.company.length > 0) items.push({ key: 'company', label: t('vacay.companyHoliday'), className: COMPANY });
  if (view.tripDates.size > 0) items.push({ key: 'trip', label: t('assistant.card.vacay.trip'), className: TRIP });
  if (items.length < 2) return null;
  return (
    <ul className={LEGEND}>
      {items.map((item) => (
        <li key={item.key} className={LEGEND_ITEM}>
          <span aria-hidden="true" className={item.className} style={item.style} />
          <bdi className="truncate">{item.label}</bdi>
        </li>
      ))}
    </ul>
  );
}

export default function VacayAnswerBlock({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const own = cards.flatMap((entry) => (entry.card.kind === 'vacay' ? [entry.card] : []));
  const view = mergeVacayCards(own);
  const lines = balanceLines(view, []);
  const first = own[0] ?? null;
  return (
    <CardFrame label={t('assistant.card.vacay.label')}>
      <CardHeader icon={Palmtree} tone="info" title={t('assistant.card.vacay.label')} />
      {view.months.length > 0 && <VacayMonthStrip view={view} placed={[]} labelOf={() => ''} />}
      <Legend view={view} />
      {view.otherDays > 0 && <p className={OTHER}>{t('assistant.card.vacay.otherDays', { count: view.otherDays })}</p>}
      <VacayBalance lines={lines} view={view} mode="read" />
      <CardFoot>
        <CardOpenButton target={{ kind: 'page', path: vacayPathOf(first) }} labelKey="assistant.card.vacay.open" />
      </CardFoot>
    </CardFrame>
  );
}
