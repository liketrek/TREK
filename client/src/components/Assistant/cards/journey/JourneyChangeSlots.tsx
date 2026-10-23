import type { AssistantChangeRow, JourneyEntriesCard } from '@trek/shared';
import { AlignLeft, CalendarDays, Clock, MapPin, Tag, Type } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import type { ChangeItem } from '../../assistantParts';
import { FactChange } from '../parts/CardFacts';
import { EntryMarks, EntryStory, EntryThumb } from './JourneyEntryParts';
import { flagOf, stateOf } from './journeyTones';
import { entryHoverProps, useEntryHover } from './useEntryHover';

/**
 * What a change row of a journal entry adds to the row it already is (its
 * verb and subject): the facts, words and states it changes, each old to new,
 * the entry's photo at the end of the subject line when it has one already,
 * and under the row the start of its text and how it reads. A deleted entry made from a trip place says it
 * goes back to a suggestion. A change that failed, was discarded or ran out
 * shows the row alone.
 */

const GONE: ReadonlySet<ChangeItem['state']> = new Set(['failed', 'discarded', 'expired']);

/** The facts a journal change row names on its faint line, in this order: when, then where. */
const FACT_ICONS = { day: CalendarDays, time: Clock, location: MapPin } as const;
/** The words an update rewrites, named only when they change: the entry's title and its text. */
const WORD_ICONS = { name: Type, text: AlignLeft } as const;
type FactRow = AssistantChangeRow & { labelKey: keyof typeof FACT_ICONS };
type WordRow = AssistantChangeRow & { labelKey: keyof typeof WORD_ICONS };
const TO_SUGGESTION = 'mt-1 text-caption text-content-faint';
const HOVER_BOX = 'flex flex-none';

/** A row's old value, for a row that had one. */
function beforeOf(row: AssistantChangeRow): string | null {
  return row.op !== 'add' && row.before ? row.before : null;
}

/** A row that holds something: a new value, or an old one it clears. */
function holds(row: AssistantChangeRow): boolean {
  return row.after !== '' || beforeOf(row) !== null;
}

/** A state an update sets (who sees the entry, its mood, weather or kind, a flag), named in the user's words. */
function StateChange({ row }: { row: AssistantChangeRow }) {
  const { t } = useTranslation();
  const flag = flagOf(row.field, row.after);
  if (flag) return <FactChange icon={flag.Icon} before={null} after={t(flag.labelKey)} tone="info" />;
  const was = stateOf(row.field, row.before);
  const now = stateOf(row.field, row.after);
  const Icon = (now ?? was)?.Icon ?? Tag;
  const named = (tone: typeof now, value: string | null) => (tone ? t(tone.labelKey) : value);
  return (
    <FactChange
      icon={Icon}
      before={named(was, beforeOf(row))}
      after={named(now, row.after) || t('assistant.card.common.removed')}
    />
  );
}

/**
 * When and where the entry is, before and after on a change (the day, the
 * time and the place), then the title and text an update rewrites and the
 * states it sets. A value an update clears reads as removed.
 */
export function JourneyEntryFacts({ item }: { card: JourneyEntriesCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const rows = item.preview?.rows ?? [];
  const removed = t('assistant.card.common.removed');
  const order = Object.keys(FACT_ICONS);
  const facts = rows
    .filter((row): row is FactRow => row.labelKey in FACT_ICONS && holds(row))
    .sort((a, b) => order.indexOf(a.labelKey) - order.indexOf(b.labelKey));
  // A new entry's text and a deleted one's show under the row already; only a rewrite names them here.
  const words = rows.filter((row): row is WordRow => row.op === 'change' && row.labelKey in WORD_ICONS && holds(row));
  const states = rows.filter((row) => row.labelKey === 'field' && holds(row));
  return (
    <>
      {facts.map((row) => (
        <FactChange
          key={row.labelKey}
          icon={FACT_ICONS[row.labelKey]}
          before={beforeOf(row)}
          after={row.after || removed}
        />
      ))}
      {words.map((row) => (
        <FactChange
          key={row.labelKey}
          icon={WORD_ICONS[row.labelKey]}
          before={beforeOf(row)}
          after={row.after || removed}
          tone="info"
        />
      ))}
      {states.map((row) => (
        <StateChange key={row.field ?? row.labelKey} row={row} />
      ))}
    </>
  );
}

/** The entry's photo beside the subject, for an entry that is written already; resting on it shows its place. */
export function JourneyEntryAside({ card, item }: { card: JourneyEntriesCard; item: ChangeItem }) {
  const hover = useEntryHover(card.journeyId, item.toolCallId);
  const look = card.entries[0];
  if (!look || look.photoId === null || GONE.has(item.state)) return null;
  return (
    <span className={HOVER_BOX} {...entryHoverProps(hover, look)}>
      <EntryThumb look={look} size="sm" />
    </span>
  );
}

/** The start of the entry's text and its marks, under the row; resting on them shows its place on the map. */
export function JourneyEntryBody({ card, item }: { card: JourneyEntriesCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const hover = useEntryHover(card.journeyId, item.toolCallId);
  const look = card.entries[0];
  if (!look || GONE.has(item.state)) return null;
  return (
    <div {...entryHoverProps(hover, look)}>
      <EntryStory look={look} roomy={false} />
      <EntryMarks look={look} />
      {card.change === 'willDelete' && look.fromTripPlace && (
        <p className={TO_SUGGESTION}>{t('assistant.card.journey.toSuggestion')}</p>
      )}
    </div>
  );
}
