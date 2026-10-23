import type { AssistantChangePreview, TrekCardKind } from '@trek/shared';
import { Check, Undo2 } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

import { useTranslation } from '../../../i18n';
import { Tooltip } from '../../shared/Tooltip';
import AssistantChangeFields from '../AssistantChangeFields';
import type { ChangeItem } from '../assistantParts';
import { useAssistantView } from '../assistantViewContext';
import { useChangeHover } from '../useChangeHover';
import { TOOL_LABELS, verbLookOf } from './cardLooks';
import type { CardView } from './cardTypes';
import { viewOf } from './cardViews';
import EntityActions from './EntityActions';
import { ICON_BUTTON, RECEIPT } from './parts/assistantTones';
import CardBoundary from './parts/CardBoundary';
import KindTile from './parts/KindTile';

/**
 * The rows of the change card: a change waiting for its decision, and the
 * receipt it turns into. A change that carries a card is drawn through its
 * kind's view, slot by slot (`Lead` in front, `Aside` at the end of the
 * subject line, `Facts` on the faint line, `Body` under it); a change
 * without one reads as it always has: the tile of its verb, its subject, and
 * the few fields that tell it apart. A slot that throws draws what the row
 * shows without a card, so one broken view never takes the chat down.
 */

type View = CardView<TrekCardKind>;

/** What the change does: the tool's own action where TREK names it, else add, change or remove. */
function verbLabel(preview: AssistantChangePreview, t: (key: string) => string): string {
  // Read as a string: a tool named like an object's own member (toString) has no label.
  const own = preview.tool ? TOOL_LABELS[preview.tool]?.labelKey : undefined;
  return t(typeof own === 'string' ? own : verbLookOf(preview.verbKey).labelKey);
}

/** The tile in front: the kind's own lead, else the verb's tile. */
function Lead({ item, view, dimmed }: { item: ChangeItem; view: View | null; dimmed: boolean }) {
  const look = item.preview ? verbLookOf(item.preview.verbKey) : null;
  const tile = <KindTile icon={look?.Icon ?? null} tone={look?.tone ?? 'info'} size="sm" dimmed={dimmed} />;
  const Own = view?.Lead;
  if (!Own || !item.card) return tile;
  return (
    <CardBoundary fallback={tile}>
      <Own card={item.card} item={item} />
    </CardBoundary>
  );
}

/** A slot of the kind's view, or nothing; `fallback` where it throws, until the change moves on to its next state. */
function Slot({
  item,
  view,
  name,
  fallback = null,
}: {
  item: ChangeItem;
  view: View | null;
  name: 'Aside' | 'Facts' | 'Body';
  fallback?: ReactNode;
}) {
  const Own = view?.[name];
  if (!Own || !item.card) return null;
  return (
    <CardBoundary fallback={fallback} resetKeys={[item.state]}>
      <Own card={item.card} item={item} />
    </CardBoundary>
  );
}

/** The subject in bold, with the kind's aside at its end; only the aside where the kind draws the subject itself. */
function SubjectLine({
  subject,
  struck,
  aside,
  block = false,
}: {
  subject: string;
  struck: boolean;
  aside: ReactNode;
  block?: boolean;
}) {
  const text = (
    <bdi
      className={`${block ? 'block' : ''}truncate text-body font-semibold leading-tight text-content ${struck ? 'line-through' : ''}`}
    >
      {subject}
    </bdi>
  );
  if (!aside) return text;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {aside}
    </span>
  );
}

/** Where in TREK a change outside the trip plan lands: the vacation planner, the journal. */
function DomainChip({ domain }: { domain: string | undefined }) {
  const { t } = useTranslation();
  if (!domain) return null;
  return (
    <span className="flex-shrink-0 rounded-full bg-surface-secondary px-1.5 text-content-secondary">
      {t(`assistant.domain.${domain}`)}
    </span>
  );
}

function ChangeHead({ item, view, struck }: { item: ChangeItem; view: View | null; struck: boolean }) {
  const { t } = useTranslation();
  const preview = item.preview;
  if (!preview) return <span className="trek-skeleton inline-block h-4 w-40" aria-hidden="true" />;
  const aside = <Slot item={item} view={view} name="Aside" />;
  return (
    <span className="flex min-w-0 flex-col">
      {view?.ownsSubject ? (
        aside
      ) : (
        <SubjectLine subject={preview.subject} struck={struck} aside={view?.Aside && aside} />
      )}
      <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-caption text-content-faint">
        <span className="max-w-full truncate">{verbLabel(preview, t)}</span>
        <DomainChip domain={preview.domain} />
        <Slot item={item} view={view} name="Facts" />
      </span>
    </span>
  );
}

/** The kind's body under a row, faded with the row once the change is settled. */
function BodySlot({ item, settled }: { item: ChangeItem; settled: boolean }) {
  const view = item.card ? viewOf(item.card) : null;
  if (!view?.Body || !item.card) return null;
  return (
    <div className={`mt-1.5 pb-1.5 ${view.wideBody ? '' : 'ps-[38px]'} ${settled ? 'opacity-60' : ''}`}>
      <Slot item={item} view={view} name="Body" />
    </div>
  );
}

/** A decided change that no longer stands: discarded, expired or taken back. */
const settledOf = (item: ChangeItem, undone: boolean) =>
  item.state === 'discarded' || item.state === 'expired' || undone;

/** A decided change: its tile and head, the ways to what it changed, undo while it can, and its mark. */
function Receipt({
  item,
  undone,
  canUndo,
  onUndo,
}: {
  item: ChangeItem;
  undone: boolean;
  canUndo: boolean;
  onUndo: () => void;
}) {
  const { t } = useTranslation();
  if (item.state === 'pending') return null;
  const receipt = undone ? RECEIPT.discarded : RECEIPT[item.state];
  const { Icon } = receipt;
  const applied = item.state === 'applied' && !undone ? item.applied : null;
  const settled = settledOf(item, undone);
  const statusLabel = t(undone ? 'assistant.change.undone' : receipt.labelKey);
  const view = item.card ? viewOf(item.card) : null;
  return (
    <div className="trek-assistant-enter flex items-center gap-2.5 py-1.5">
      <Lead item={item} view={view} dimmed={settled} />
      <div className={`min-w-0 flex-1 ${settled ? 'opacity-60' : ''}`}>
        <ChangeHead item={item} view={view} struck={settled} />
      </div>
      {applied && <EntityActions applied={applied} card={item.card} />}
      {canUndo && (
        <Tooltip label={t('assistant.change.undo')} placement="top">
          <button type="button" onClick={onUndo} aria-label={t('assistant.change.undo')} className={ICON_BUTTON}>
            <Undo2 size={14} aria-hidden="true" />
          </button>
        </Tooltip>
      )}
      <Tooltip label={statusLabel} placement="top">
        <span
          role="img"
          aria-label={statusLabel}
          className={`flex h-7 w-5 items-center justify-center ${receipt.tone}`}
        >
          <Icon size={15} strokeWidth={2.4} className={item.state === 'applying' ? 'animate-spin' : ''} />
        </span>
      </Tooltip>
    </div>
  );
}

/**
 * A change waiting for its decision, as a row of the planner's day list: the
 * round choice in front (only when there is more than one to choose from),
 * what it touches in bold, and a faint line saying what happens and when.
 * Resting on it lights its pin on the map.
 */
function PendingRow({
  item,
  excluded,
  withChoice,
  disabled,
  onToggle,
}: {
  item: ChangeItem;
  excluded: boolean;
  withChoice: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { tripId } = useAssistantView();
  const { litFromMap, handlers } = useChangeHover(tripId, item.preview?.effect ? item.toolCallId : null);
  const preview = item.preview;
  const view = item.card ? viewOf(item.card) : null;
  const aside = <Slot item={item} view={view} name="Aside" />;
  return (
    <div
      {...handlers}
      className={`-mx-1.5 flex items-center gap-2.5 rounded-[12px] px-1.5 py-2 transition-[opacity,background-color] ${
        excluded ? 'opacity-50' : ''
      } ${litFromMap ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
    >
      {withChoice && (
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={!excluded}
          aria-label={t('assistant.change.include')}
          className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
            excluded ? 'border-[1.5px] border-edge bg-surface-card' : 'bg-accent'
          }`}
        >
          {!excluded && <Check size={11} strokeWidth={3} aria-hidden="true" className="text-accent-text" />}
        </button>
      )}
      <Lead item={item} view={view} dimmed={excluded} />
      <div className="min-w-0 flex-1">
        {preview ? (
          <>
            {view?.ownsSubject ? (
              aside
            ) : (
              <SubjectLine subject={preview.subject} struck={false} aside={view?.Aside && aside} block />
            )}
            <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-caption text-content-faint">
              <span className="me-0.5 min-w-0 truncate">{verbLabel(preview, t)}</span>
              <DomainChip domain={preview.domain} />
              {view?.Facts ? (
                <Slot item={item} view={view} name="Facts" fallback={<AssistantChangeFields rows={preview.rows} />} />
              ) : (
                <AssistantChangeFields rows={preview.rows} />
              )}
            </span>
          </>
        ) : (
          <span className="trek-skeleton inline-block h-4 w-40" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

interface RowsProps {
  items: readonly ChangeItem[];
  /** The waiting rows wait behind the week grid. */
  folded: boolean;
  excluded: ReadonlySet<string>;
  disabled: boolean;
  undone: Readonly<Record<string, true>>;
  undoable: readonly string[];
  onToggle: (toolCallId: string) => void;
  onUndo: (toolCallId: string) => void;
}

/** Consecutive changes of one kind of card; a change without a card stands alone. */
function runsOf(items: readonly ChangeItem[]): ChangeItem[][] {
  const runs: ChangeItem[][] = [];
  for (const item of items) {
    const last = runs[runs.length - 1];
    const kind = item.card?.kind;
    if (last && kind && last[0]?.card?.kind === kind) last.push(item);
    else runs.push([item]);
  }
  return runs;
}

/** Whether a row can join a `Run`: it waits, and its view takes it. */
function runnable(item: ChangeItem, view: View | null): boolean {
  if (item.state !== 'pending' || !item.card || !view?.Run) return false;
  return view.runnable ? view.runnable(item.card) : true;
}

/**
 * Every row of the card in order. A run of rows of one kind gets the kind's
 * `Group` before and after it, and two or more waiting rows its view can
 * take together are drawn as one `Run` instead.
 */
export function ChangeRows({ items, folded, excluded, disabled, undone, undoable, onToggle, onUndo }: RowsProps) {
  const pendingCount = items.filter((i) => i.state === 'pending').length;
  // The body stands beside the row, in the same place whether the change waits or is decided, so a body that holds
  // what the user chose (the pages of a book design) keeps it, and draws on, as the change starts to apply.
  const row = (item: ChangeItem) => {
    const waiting = item.state === 'pending';
    if (waiting && folded) return null;
    const isUndone = !!undone[item.toolCallId];
    return (
      <Fragment key={item.toolCallId}>
        {waiting ? (
          <PendingRow
            item={item}
            excluded={excluded.has(item.toolCallId)}
            withChoice={pendingCount > 1}
            disabled={disabled}
            onToggle={() => onToggle(item.toolCallId)}
          />
        ) : (
          <Receipt
            item={item}
            undone={isUndone}
            canUndo={undoable.includes(item.toolCallId)}
            onUndo={() => onUndo(item.toolCallId)}
          />
        )}
        <BodySlot item={item} settled={waiting ? excluded.has(item.toolCallId) : settledOf(item, isUndone)} />
      </Fragment>
    );
  };
  const rows = runsOf(items).flatMap((run) => {
    const first = run[0];
    const view = first?.card ? viewOf(first.card) : null;
    const Group = view?.Group;
    const Run = view?.Run;
    const body: ReactNode[] = [];
    let i = 0;
    while (i < run.length) {
      let end = i;
      let next = i + 1;
      while (end < run.length && runnable(run[end] as ChangeItem, view)) end++;
      if (Run && end - i >= 2) {
        const taken = run.slice(i, end);
        if (!folded) {
          // A run that throws falls back to its rows one by one.
          body.push(
            <CardBoundary key={`run-${taken[0]?.toolCallId}`} fallback={taken.map(row)}>
              <Run items={taken} excluded={excluded} disabled={disabled} onToggle={onToggle} />
            </CardBoundary>
          );
        }
        next = end;
      } else body.push(row(run[i] as ChangeItem));
      i = next;
    }
    if (!Group || !first) return body;
    const group = (place: 'head' | 'foot') => (
      <CardBoundary key={`${place}-${first.toolCallId}`}>
        <Group items={run} excluded={excluded} disabled={disabled} onToggle={onToggle} place={place} />
      </CardBoundary>
    );
    return [group('head'), ...body, group('foot')];
  });
  return <div>{rows}</div>;
}
