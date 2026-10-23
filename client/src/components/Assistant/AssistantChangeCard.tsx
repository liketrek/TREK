import { Check, LoaderCircle, MapPin, Undo2 } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '../../i18n';
import { blockKeyOf } from '../../store/assistantMapModel';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import { useToast } from '../shared/Toast';
import { Tooltip } from '../shared/Tooltip';
import AssistantCompareSwitch from './AssistantCompareSwitch';
import AssistantFitCheck from './AssistantFitCheck';
import AssistantWeekOverview from './AssistantWeekOverview';
import { type ChangeItem, undoLeftMs } from './assistantParts';
import { useAssistantView } from './assistantViewContext';
import { ChangeRows } from './cards/ChangeCardSlots';
import { ICON_BUTTON } from './cards/parts/assistantTones';
import { useChangeExclusions } from './cards/useChangeExclusions';
import { changePoints, type DayChange } from './dayAfterModel';
import { useWeekDays } from './useWeekDays';

/**
 * The changes the assistant proposes in one go, as one card in plain words:
 * what happens to which place, note or item, field by field. Nothing is
 * written before the user applies it. Each change keeps its own decision, so
 * when the card holds several, each has a switch and the button applies the
 * ones left on. Once decided, the card turns into a receipt per change, with
 * a way to the change on the map and, for a while, undo.
 *
 * Every change wears its kind: a tinted tile with the icon of what it touches
 * and a badge naming the verb, in the tone of what happens (green adds, blue
 * changes, amber moves, red takes away). Its fields sit as badges holding a
 * label badge, so a row of them reads at a glance. The rows themselves, and a
 * change that carries a card of its own, are drawn in cards/ChangeCardSlots.
 *
 * While it waits, the card shows the days it touches as they would read
 * afterwards, and each row lights its pin on the map (and the pin its row).
 * Once applied, the head offers the plan before and after the block on the
 * map, and taking the whole block back at once.
 */

/** The time now, ticking once more when the next undo window closes. */
function useUndoClock(items: ChangeItem[]): number {
  const [now, setNow] = useState(() => Date.now());
  const next = Math.min(...items.map((i) => undoLeftMs(i.applied, now)).filter((ms) => ms > 0));
  useEffect(() => {
    if (!Number.isFinite(next)) return;
    const timer = window.setTimeout(() => setNow(Date.now()), next + 50);
    return () => window.clearTimeout(timer);
  }, [next]);
  return now;
}

/** Whether an applied change can still be taken back now. */
function undoableNow(item: ChangeItem, undone: Readonly<Record<string, true>>, now: number): boolean {
  return (
    item.state === 'applied' &&
    !undone[item.toolCallId] &&
    !!item.preview?.undoable &&
    undoLeftMs(item.applied, now) > 0
  );
}

/** The waiting changes the user left on that touch the day plan. */
function dayChangesOf(items: readonly ChangeItem[], excluded: ReadonlySet<string>): DayChange[] {
  return items.flatMap((i) =>
    i.state === 'pending' && i.preview?.effect && !excluded.has(i.toolCallId)
      ? [{ toolCallId: i.toolCallId, effect: i.preview.effect, subject: i.preview.subject }]
      : []
  );
}

/** The card's head: what the card is, what can be done with it as a whole, and how many changes it holds. */
function CardHead({ open, count, actions }: { open: boolean; count: number; actions?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mb-1 flex min-h-7 items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-caption font-semibold text-content-secondary">
        {t(open ? 'assistant.change.title' : 'assistant.change.doneTitle')}
      </span>
      {actions}
      <span className="text-caption tabular-nums text-content-faint">{count}</span>
    </div>
  );
}

/** On the phone the map hides behind the chat: this shrinks the chat and frames what the card would change. */
function ViewOnMapButton({ changes }: { changes: readonly DayChange[] }) {
  const { t } = useTranslation();
  const { tripId } = useAssistantView();
  const requestCamera = useAssistantStore((s) => s.requestCamera);
  const setMinimized = useAssistantStore((s) => s.setMinimized);
  const show = () => {
    const { assignments, places } = useTripStore.getState();
    requestCamera(tripId, changePoints(changes, assignments, places), 'fit', 'user');
    setMinimized(true);
  };
  return (
    <Tooltip label={t('assistant.change.viewOnMap')} placement="top">
      <button type="button" onClick={show} aria-label={t('assistant.change.viewOnMap')} className={ICON_BUTTON}>
        <MapPin size={14} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/** Takes back every change of the block that still can be, the last one first, and says how it went. */
function UndoAllButton({ toolCallIds }: { toolCallIds: readonly string[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { tripId } = useAssistantView();
  const undoBlock = useAssistantStore((s) => s.undoBlock);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const { done, stale, failed } = await undoBlock(tripId, toolCallIds);
      if (failed > 0) toast.error(t('assistant.change.undoAllFailed', { count: failed }));
      else if (stale > 0) toast.warning(t('assistant.change.undoAllPartial', { done, stale }));
      else toast.success(t('assistant.change.undoneAll', { count: done }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Tooltip label={t('assistant.change.undoAll')} placement="top">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        aria-label={t('assistant.change.undoAll')}
        className={ICON_BUTTON}
      >
        {busy ? (
          <LoaderCircle size={14} aria-hidden="true" className="animate-spin" />
        ) : (
          <Undo2 size={14} aria-hidden="true" />
        )}
      </button>
    </Tooltip>
  );
}

/** What the head offers: on a waiting card the way to the map on the phone, on a receipt the block as a whole. */
function HeadActions({
  open,
  items,
  changes,
  undoable,
}: {
  open: boolean;
  items: readonly ChangeItem[];
  changes: readonly DayChange[];
  undoable: readonly string[];
}) {
  const { tripId, variant, onOpen } = useAssistantView();
  const here = useTripStore((s) => s.trip?.id === tripId);
  if (open) {
    const toMap = variant === 'fullscreen' && !!onOpen && here && changes.length > 0;
    return (
      <>
        <AssistantFitCheck changes={changes} />
        {toMap && <ViewOnMapButton changes={changes} />}
      </>
    );
  }
  return (
    <>
      {onOpen && <AssistantCompareSwitch tripId={tripId} blockKey={blockKeyOf(items.map((i) => i.toolCallId))} />}
      {undoable.length >= 2 && <UndoAllButton toolCallIds={undoable} />}
    </>
  );
}

export default function AssistantChangeCard({ items }: { items: ChangeItem[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { tripId } = useAssistantView();
  const isRunning = useAssistantStore((s) => chatOf(s, tripId).isRunning);
  const undone = useAssistantStore((s) => chatOf(s, tripId).undone);
  const decide = useAssistantStore((s) => s.decide);
  const undo = useAssistantStore((s) => s.undo);
  const [excluded, setExcluded] = useChangeExclusions(items);
  const now = useUndoClock(items);

  const pending = items.filter((i) => i.state === 'pending');
  const chosen = pending.filter((i) => !excluded.has(i.toolCallId)).length;
  const changes = useMemo(() => dayChangesOf(items, excluded), [items, excluded]);
  const undoable = items.filter((i) => undoableNow(i, undone, now)).map((i) => i.toolCallId);

  const week = useWeekDays(pending);
  const [showAll, setShowAll] = useState(false);
  // A plan over a week reads from its grid; the single changes wait behind one line.
  const folded = week.length > 0 && !showAll;

  const toggleDay = (ids: readonly string[], include: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (include) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const toggle = (toolCallId: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(toolCallId)) next.add(toolCallId);
      return next;
    });

  const submit = (applyChosen: boolean) =>
    decide(
      tripId,
      pending.map((i) => ({ toolCallId: i.toolCallId, approved: applyChosen && !excluded.has(i.toolCallId) }))
    );

  // An undone change reads as undone from the store; only what stays needs a word.
  const runUndo = async (toolCallId: string) => {
    const outcome = await undo(tripId, toolCallId);
    if (outcome === 'stale') toast.warning(t('assistant.change.undoStale'));
    else if (outcome === 'failed') toast.error(t('assistant.change.undoFailed'));
  };

  const open = pending.length > 0;
  return (
    <section className="trek-popover-enter rounded-xl border border-edge-faint bg-surface-card px-3 pb-2 pt-2.5 shadow-card">
      <CardHead
        open={open}
        count={items.length}
        actions={<HeadActions open={open} items={items} changes={changes} undoable={undoable} />}
      />
      {open && week.length > 0 && (
        <AssistantWeekOverview days={week} excluded={excluded} disabled={isRunning} onToggleDay={toggleDay} />
      )}
      {folded && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mb-1 w-full rounded-lg px-2 py-1.5 text-center text-caption font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
        >
          {t('assistant.week.showAll', { count: pending.length })}
        </button>
      )}
      <ChangeRows
        items={items}
        folded={folded}
        excluded={excluded}
        disabled={isRunning}
        undone={undone}
        undoable={undoable}
        onToggle={toggle}
        onUndo={(toolCallId) => void runUndo(toolCallId)}
      />
      {open && (
        <>
          <p className="sr-only" role="status">
            {t('assistant.change.pending', { count: pending.length })}
          </p>
          <div className="flex justify-end gap-2 border-t border-edge-faint pt-2.5">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => void submit(false)}
              className="rounded-lg px-3 py-1.5 text-body text-content-secondary hover:bg-surface-hover hover:text-content disabled:opacity-50"
            >
              {t('assistant.change.discard')}
            </button>
            <button
              type="button"
              disabled={isRunning || chosen === 0}
              onClick={() => void submit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-body font-medium text-accent-text hover:bg-accent-hover disabled:opacity-50"
            >
              <Check size={14} aria-hidden="true" />
              {pending.length === 1 ? t('assistant.change.apply') : t('assistant.change.applyN', { count: chosen })}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
