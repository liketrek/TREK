import type { TodoListCard as TodoCard, TodoCardGroup, TodoCardItem } from '@trek/shared';
import { CalendarDays, Flag, ListTodo, PencilLine, StickyNote, Tag, User } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { type PillTone, SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { localToday } from '../../../Planner/today';
import { Tooltip } from '../../../shared/Tooltip';
import { PRIO_CONFIG } from '../../../Todo/todoListModel';
import AssistantChangeFields from '../../AssistantChangeFields';
import type { ChangeItem } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry, EntityTarget } from '../cardTypes';
import { ChangeMark, FactChange, NoLonger } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { PersonFace } from '../parts/CardPeople';
import { CardFoot } from '../parts/CardSection';
import { useCardFormat } from '../parts/useCardFormat';
import { isRunnable, mergeTodoCards, todoColorOf } from './checklistModel';
import {
  ChecklistFoot,
  ChecklistHead,
  ChecklistRow,
  ChecklistRun,
  MoreLine,
  type RunEntry,
  type RunProps,
} from './checklistParts';

/**
 * The to-dos in the chat, drawn like the to-do panel: lists with their colour
 * dot and default people, tasks with their round check, a note, a priority in
 * the panel's red, amber and blue, a due date that turns red once it has
 * passed (by the reader's own calendar, so a card read tomorrow still marks
 * it) and shows its day in the plan, and who it is for. A change draws its
 * task inside the change card; a run of them reads as one checklist.
 */

const TODO_TARGET: EntityTarget = { kind: 'tab', tab: 'listen', sub: 'todo' };

/** The panel's priority colours as tones. */
const PRIORITY_TONE: Readonly<Record<number, PillTone>> = { 1: 'danger', 2: 'warning', 3: 'info' };

/** How a priority reads: "P1" as the panel writes it, or none. */
function usePriorityLabel(): (priority: number) => string {
  const { t } = useTranslation();
  return (priority) => PRIO_CONFIG[priority]?.label ?? t('todo.detail.noPriority');
}

/** A due date as a pill: red once it has passed, a way to its day in the plan where the trip has one. */
function DuePill({ row }: { row: TodoCardItem }) {
  const { t } = useTranslation();
  const { onOpen } = useAssistantView();
  const format = useCardFormat();
  if (!row.dueDate) return null;
  const overdue = !row.checked && row.dueDate < localToday();
  const pill = (
    <SoftPill
      tone={overdue ? 'danger' : 'neutral'}
      icon={<CalendarDays size={10} strokeWidth={2.2} aria-hidden="true" />}
    >
      {format.date(row.dueDate)}
    </SoftPill>
  );
  const dayId = row.dueDayId;
  if (!onOpen || dayId === null) return pill;
  const hint = t('assistant.card.common.showDay');
  return (
    <Tooltip label={hint}>
      <button
        type="button"
        aria-label={`${format.date(row.dueDate)}: ${hint}`}
        onClick={() => onOpen({ kind: 'map', placeId: null, dayId })}
        className="flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {pill}
      </button>
    </Tooltip>
  );
}

/**
 * What a task states under its name: its priority and its due date. A field a
 * change moves is left to the change's own old-to-new fact, so it never shows twice.
 */
function TodoFacts({ row }: { row: TodoCardItem }) {
  const priority = usePriorityLabel();
  const moved = new Set(row.changed.map((entry) => entry.field));
  const tone = moved.has('priority') ? undefined : PRIORITY_TONE[row.priority];
  return (
    <>
      {tone && (
        <SoftPill tone={tone} icon={<Flag size={10} strokeWidth={2.2} aria-hidden="true" />}>
          {priority(row.priority)}
        </SoftPill>
      )}
      {!moved.has('dueDate') && <DuePill row={row} />}
    </>
  );
}

/** What a change does to a task: new, done, open again, gone, or each field it changes, old to new. */
function TodoChangeFacts({ row, category }: { row: TodoCardItem; category: string }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const priority = usePriorityLabel();
  if (row.change === 'add') return <ChangeMark change="new" />;
  if (row.change === 'remove') return <ChangeMark change="removed" />;
  if (row.change === 'check') return <SoftPill tone="success">{t('todo.filter.done')}</SoftPill>;
  if (row.change === 'uncheck') return <SoftPill>{t('assistant.card.todo.notDone')}</SoftPill>;
  const noDate = t('assistant.card.todo.noDueDate');
  const date = (value: string | null) => (value ? format.date(value) : noDate);
  // `done` is kept for the way back only, never drawn.
  const facts = row.changed
    .filter((entry) => entry.field !== 'done')
    .map(({ field, before }) => {
      if (field === 'name') return { field, icon: PencilLine, before, after: row.name };
      if (field === 'note') return { field, icon: StickyNote, before, after: row.note ?? '' };
      if (field === 'category') return { field, icon: Tag, before: before ?? t('todo.uncategorized'), after: category };
      if (field === 'dueDate') return { field, icon: CalendarDays, before: date(before), after: date(row.dueDate) };
      if (field === 'priority') {
        return { field, icon: Flag, before: priority(Number(before ?? 0)), after: priority(row.priority) };
      }
      const after = row.assignee?.name ?? t('todo.unassigned');
      return { field, icon: User, before: before ?? t('todo.unassigned'), after };
    });
  return (
    <>
      {facts.map((fact) => (
        <FactChange key={fact.field} icon={fact.icon} before={fact.before} after={fact.after} />
      ))}
    </>
  );
}

/** One task: its check, its name, who it is for, its note, its priority and due date, and what a change does. */
function TodoRow({ row, category, inChange }: { row: TodoCardItem; category: string; inChange: boolean }) {
  const under = (
    <>
      {row.note && (
        <p title={row.note} className="m-0 line-clamp-1 text-caption text-content-faint">
          {row.note}
        </p>
      )}
      <span className="mt-1 flex flex-wrap items-center gap-1 empty:hidden">
        <TodoFacts row={row} />
        {inChange && row.change !== 'none' && row.change !== 'add' && <TodoChangeFacts row={row} category={category} />}
      </span>
    </>
  );
  return (
    <ChecklistRow
      done={row.checked}
      pendingTick={inChange && row.change === 'check'}
      struck={row.change === 'remove'}
      name={row.name}
      aside={row.assignee ? <PersonFace person={row.assignee} size={20} /> : undefined}
      under={under}
    />
  );
}

/** A list of tasks: its head with its open count and default people, its tasks, and how many more there are. */
function TodoGroup({ group, inChange }: { group: TodoCardGroup; inChange: boolean }) {
  const { t } = useTranslation();
  const name = group.category ?? t('todo.uncategorized');
  const hidden = group.count - group.items.length;
  const badge = (
    <span aria-label={t('assistant.card.todo.openCount', { count: group.open })} className="inline-flex">
      <WhiteBadge>{group.open}</WhiteBadge>
    </span>
  );
  return (
    <section className="flex min-w-0 flex-col">
      <ChecklistHead
        color={todoColorOf(group.slot, name)}
        name={name}
        badge={inChange ? undefined : badge}
        people={group.assignees}
        removed={group.assigneesRemoved}
      />
      {inChange && group.assigneesRemoved.length > 0 && (
        <p className="m-0 ps-[18px]">
          <NoLonger names={group.assigneesRemoved.map((person) => person.name)} />
        </p>
      )}
      {group.items.length > 0 && (
        <ul className="m-0 list-none p-0 ps-1">
          {group.items.map((row, i) => (
            <TodoRow key={`${row.id ?? 'new'}-${i}`} row={row} category={name} inChange={inChange} />
          ))}
        </ul>
      )}
      {group.items.length > 0 && (
        <MoreLine label={hidden > 0 ? t('assistant.card.todo.moreTasks', { count: hidden }) : null} />
      )}
    </section>
  );
}

/** One answer card: the tile, what is open and overdue, the lists, and the way into the to-dos. */
function TodoAnswer({ card }: { card: TodoCard }) {
  const { t } = useTranslation();
  const progress = card.progress;
  const title = t('assistant.card.todo.title');
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={ListTodo}
        tone={progress && progress.overdue > 0 ? 'danger' : 'info'}
        title={title}
        meta={progress ? t('assistant.card.todo.openCount', { count: progress.open }) : undefined}
        actions={
          progress && progress.overdue > 0 ? (
            <SoftPill tone="danger">{t('assistant.card.todo.overdueCount', { count: progress.overdue })}</SoftPill>
          ) : undefined
        }
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        {card.groups.map((group) => (
          <TodoGroup key={group.category ?? ''} group={group} inChange={false} />
        ))}
      </div>
      <CardFoot>
        <ChecklistFoot
          more={card.moreGroups}
          moreKey="assistant.card.todo.moreLists"
          target={TODO_TARGET}
          openKey="assistant.card.todo.open"
        />
      </CardFoot>
    </CardFrame>
  );
}

/** The to-do answers of one group, read as one list. */
export function TodoListBlock({ cards }: { cards: readonly CardEntry[] }) {
  const lists = mergeTodoCards(cards.flatMap((entry) => (entry.card.kind === 'todoList' ? [entry.card] : [])));
  return (
    <div className="flex flex-col gap-2">
      {lists.map((card, i) => (
        <TodoAnswer key={i} card={card} />
      ))}
    </div>
  );
}

/** The facts of a change of one task on its line; any other change keeps the fields of its preview. */
export function TodoChangeLine({ card, item }: { card: TodoCard; item: ChangeItem }) {
  const group = card.groups[0];
  const row = group?.items[0];
  if (!isRunnable(card) || !group || !row) return <AssistantChangeFields rows={item.preview?.rows ?? []} />;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      <TodoFacts row={row} />
      <TodoChangeFacts row={row} category={group.category ?? ''} />
    </span>
  );
}

/** Under a change of a list's default people: the list's head with the people it will have and the ones it drops. */
export function TodoChangeBody({ card }: { card: TodoCard; item: ChangeItem }) {
  if (isRunnable(card)) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {card.groups.map((group) => (
        <TodoGroup key={group.category ?? ''} group={group} inChange />
      ))}
    </div>
  );
}

/** A waiting change of one task as a row of a run: its list's head, its name, person, facts and change. */
function todoEntry(item: ChangeItem): RunEntry | null {
  const card = item.card?.kind === 'todoList' ? item.card : null;
  const group = card?.groups[0];
  const row = group?.items[0];
  if (!group || !row) return null;
  const category = group.category ?? '';
  return {
    item,
    change: row.change,
    headKey: `todo:${category}`,
    head: <TodoGroup group={{ ...group, items: [] }} inChange />,
    name: row.name,
    facts: (
      <>
        {row.assignee && <PersonFace person={row.assignee} size={20} />}
        <TodoFacts row={row} />
        <TodoChangeFacts row={row} category={category} />
      </>
    ),
  };
}

/** Two or more waiting changes of one task each, as one checklist under their lists' heads. */
export function TodoChangeRun(props: RunProps) {
  return <ChecklistRun {...props} entryOf={todoEntry} />;
}
