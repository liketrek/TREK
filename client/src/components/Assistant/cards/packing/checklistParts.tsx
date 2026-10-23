import type { CardPerson } from '@trek/shared';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import { CategoryDot, CheckCircle } from '../../../Tours/packing/packingLinkParts';
import type { ChangeItem } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import type { EntityTarget } from '../cardTypes';
import { CardOpenButton } from '../parts/CardOpen';
import { PeopleStack } from '../parts/CardPeople';
import { CardMore } from '../parts/CardRows';
import KindTile from '../parts/KindTile';
import { ROW_GLYPH, type RowChange } from './checklistModel';

/**
 * The pieces the packing and to-do cards share, drawn the way the lists draw
 * themselves: a group's head with its colour dot and its people, a row with
 * its round check, the quiet "more" line, a card's foot with the way into the
 * list, and the rows of a run of changes with their include choice.
 */

/** A group's head: its colour, its name, a badge, and who looks after it (the ones a change drops faded). */
export function ChecklistHead({
  color,
  name,
  badge,
  people = [],
  removed = [],
  lead,
}: {
  color: string;
  name: string;
  badge?: ReactNode;
  people?: readonly CardPerson[];
  removed?: readonly CardPerson[];
  /** A bag's swatch in place of the dot. */
  lead?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 pt-1">
      {lead ?? <CategoryDot color={color} />}
      <bdi title={name} className="min-w-0 truncate text-caption font-semibold text-content">
        {name}
      </bdi>
      {badge}
      {(people.length > 0 || removed.length > 0) && (
        <span className="ms-auto flex flex-none items-center gap-1.5">
          <PeopleStack people={people} />
          {/* The people a change takes off, faded; the card says "No longer" in words under the head. */}
          {removed.length > 0 && (
            <span className="flex opacity-40">
              <PeopleStack people={removed} />
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/** One row of a list: its round check, its name (wrapping, never cut mid word), its end, and what goes under it. */
export function ChecklistRow({
  done,
  pendingTick = false,
  struck = false,
  name,
  aside,
  under,
}: {
  done: boolean;
  /** A tick a change has not made yet. */
  pendingTick?: boolean;
  struck?: boolean;
  name: string;
  aside?: ReactNode;
  under?: ReactNode;
}) {
  const { variant } = useAssistantView();
  const faint = done || struck;
  return (
    <li className={`flex min-w-0 items-start gap-2 ${variant === 'fullscreen' ? 'py-1.5' : 'py-1'}`}>
      <span className="flex h-5 flex-none items-center">
        <CheckCircle done={done} pending={pendingTick} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <bdi
            className={`line-clamp-2 min-w-0 flex-1 break-words text-body ${faint ? 'text-content-faint line-through' : 'text-content-secondary'}`}
          >
            {name}
          </bdi>
          {aside && <span className="flex flex-none flex-wrap items-center justify-end gap-x-2 gap-y-1">{aside}</span>}
        </div>
        {under}
      </div>
    </li>
  );
}

/** "+4 more" under a group: quiet words, the list itself is one tap away at the card's foot. */
export function MoreLine({ label }: { label: string | null }) {
  if (!label) return null;
  return <p className="m-0 ps-6 text-caption text-content-faint">{label}</p>;
}

/** A card's foot: how many groups it left out, and the way into the list. */
export function ChecklistFoot({
  more,
  moreKey,
  target,
  openKey,
}: {
  more: number;
  moreKey: string;
  target: EntityTarget;
  openKey: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-1">
      <CardMore count={more} labelKey={moreKey} target={target} />
      <span className="ms-auto">
        <CardOpenButton target={target} labelKey={openKey} />
      </span>
    </div>
  );
}

/** One row of a run of changes, with the group head it opens (if it opens one). */
export interface RunEntry {
  item: ChangeItem;
  change: RowChange;
  /** Rows with one key sit under one head. */
  headKey: string;
  head: ReactNode;
  name: string;
  /** What the row says at its end and what the change does to it. */
  facts: ReactNode;
}

/** A change in a run: the round include choice (waiting while the chat runs), the tile of what it does, and the row. */
function RunRow({
  entry,
  excluded,
  disabled,
  onToggle,
}: {
  entry: RunEntry;
  excluded: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const glyph = ROW_GLYPH[entry.change];
  return (
    <div
      className={`-mx-1.5 flex items-center gap-2.5 rounded-xl px-1.5 transition-[opacity,background-color] hover:bg-surface-hover ${
        variant === 'fullscreen' ? 'py-1.5' : 'py-1'
      } ${excluded ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        onClick={() => onToggle(entry.item.toolCallId)}
        disabled={disabled}
        aria-pressed={!excluded}
        aria-label={t('assistant.change.include')}
        className={`grid flex-none place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
          variant === 'fullscreen' ? 'h-8 w-8' : 'h-[18px] w-[18px]'
        }`}
      >
        <span
          className={`grid h-[18px] w-[18px] place-items-center rounded-full ${
            excluded ? 'border-[1.5px] border-edge bg-surface-card' : 'bg-accent'
          }`}
        >
          {!excluded && <Check size={11} strokeWidth={3} aria-hidden="true" className="text-accent-text" />}
        </span>
      </button>
      <KindTile icon={glyph.Icon} tone={glyph.tone} size="sm" dimmed={excluded} />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <RunName name={entry.name} removed={entry.change === 'remove'} />
        {entry.facts}
      </span>
    </div>
  );
}

/** What a run of changes gets from the change card. */
export interface RunProps {
  items: readonly ChangeItem[];
  excluded: ReadonlySet<string>;
  /** The include choices wait while the chat runs. */
  disabled: boolean;
  onToggle(id: string): void;
}

/**
 * Two or more waiting changes of a list drawn as one checklist: each group's
 * head once, a row per change with its own include choice. Applying,
 * discarding and undoing stay with each change. `entryOf` reads a change's
 * card; one it cannot read is left out of the run.
 */
export function ChecklistRun({
  items,
  excluded,
  disabled,
  onToggle,
  entryOf,
}: RunProps & { entryOf: (item: ChangeItem) => RunEntry | null }) {
  const entries = items.flatMap((item) => entryOf(item) ?? []);
  return (
    <div className="py-1">
      {entries.map((entry, i) => (
        <div key={entry.item.toolCallId}>
          {entries[i - 1]?.headKey !== entry.headKey && entry.head}
          <RunRow
            entry={entry}
            excluded={excluded.has(entry.item.toolCallId)}
            disabled={disabled}
            onToggle={onToggle}
          />
        </div>
      ))}
    </div>
  );
}

/** A row's name in a run: struck through for one a change removes. */
function RunName({ name, removed }: { name: string; removed: boolean }) {
  return (
    <bdi className={`min-w-0 break-words text-body ${removed ? 'text-content-faint line-through' : 'text-content'}`}>
      {name}
    </bdi>
  );
}
