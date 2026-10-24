import type { AssistantChangeLabelKey, AssistantChangeRow } from '@trek/shared';
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Hash,
  ListOrdered,
  LogIn,
  LogOut,
  type LucideIcon,
  Tag,
  Wallet,
} from 'lucide-react';

import { useTranslation } from '../../i18n';
import { FactChange } from './cards/parts/CardFacts';

/**
 * The few facts that tell a change apart at a glance, as badges on the line
 * under its name the way the planner's day list shows a place: when, what
 * kind, what it costs, a new order. A value that changes reads old to new.
 * The rest of what the change sets is not listed: the planner shows it once
 * applied.
 */

/** The fields worth a place on the line, each with its glyph, in this order. */
const KEY_FIELDS: Partial<Record<AssistantChangeLabelKey, LucideIcon>> = {
  day: CalendarDays,
  time: Clock,
  endTime: Clock,
  checkIn: LogIn,
  checkOut: LogOut,
  dueDate: CalendarClock,
  category: Tag,
  price: Wallet,
  quantity: Hash,
  order: ListOrdered,
};
const KEY_ORDER = Object.keys(KEY_FIELDS) as AssistantChangeLabelKey[];
const MAX_FACTS = 3;

/** "#3" is how a day comes from the server; it reads as "Day 3". */
function shown(row: AssistantChangeRow, value: string | null | undefined, dayWord: string): string {
  if (row.labelKey === 'day' && value && /^#\d+$/.test(value)) return `${dayWord} ${value.slice(1)}`;
  return value ?? '';
}

export default function AssistantChangeFields({ rows }: { rows: AssistantChangeRow[] }) {
  const { t } = useTranslation();
  const dayWord = t('assistant.week.day');
  const facts = rows
    .filter((row) => row.labelKey in KEY_FIELDS && row.after)
    .sort((a, b) => KEY_ORDER.indexOf(a.labelKey) - KEY_ORDER.indexOf(b.labelKey))
    .slice(0, MAX_FACTS);
  if (facts.length === 0) return null;
  return (
    <>
      {facts.map((row, i) => {
        const changed = row.op !== 'add' && !!row.before;
        return (
          <FactChange
            key={`${row.labelKey}-${i}`}
            icon={KEY_FIELDS[row.labelKey] ?? Tag}
            before={changed ? shown(row, row.before, dayWord) : null}
            after={shown(row, row.after, dayWord)}
          />
        );
      })}
    </>
  );
}
