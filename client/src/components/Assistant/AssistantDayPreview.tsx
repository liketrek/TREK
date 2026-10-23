import type { AssistantChangeEffect, AssistantMessage } from '@trek/shared';
import { ArrowRightLeft, Minus, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '../../i18n';
import { changeEffects } from '../../store/assistantMapModel';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';

/** What a waiting change does to one day, as a row of the preview. */
interface PreviewRow {
  toolCallId: string;
  kind: 'add' | 'in' | 'remove' | 'out';
  name: string;
}

/** The changes no one has decided on yet, by their call. */
function waitingCalls(messages: readonly AssistantMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === 'tool-call' && p.approval && !p.approval.resolution && p.approval.approved === undefined) {
        ids.add(p.toolCallId);
      }
    }
  }
  return ids;
}

function rowOf(
  toolCallId: string,
  effect: AssistantChangeEffect,
  dayId: number,
  nameOf: (id: number | null) => string | null
) {
  const name = effect.place?.name ?? nameOf(effect.placeId);
  if (!name) return null;
  if (effect.dayId === dayId) {
    const kind = effect.kind === 'remove' ? 'remove' : effect.kind === 'move' ? 'in' : 'add';
    return { toolCallId, kind, name } satisfies PreviewRow;
  }
  if (effect.kind === 'move' && effect.fromDayId === dayId)
    return { toolCallId, kind: 'out', name } satisfies PreviewRow;
  return null;
}

const LOOK: Record<PreviewRow['kind'], { icon: typeof Sparkles; row: string; name: string; badgeKey: string }> = {
  add: {
    icon: Sparkles,
    row: 'border-dashed border-accent bg-accent-subtle',
    name: 'text-content',
    badgeKey: 'assistant.preview.suggested',
  },
  in: {
    icon: ArrowRightLeft,
    row: 'border-dashed border-accent bg-accent-subtle',
    name: 'text-content',
    badgeKey: 'assistant.preview.movedHere',
  },
  remove: {
    icon: Minus,
    row: 'border-dashed border-edge',
    name: 'text-content-faint line-through',
    badgeKey: 'assistant.preview.removed',
  },
  out: {
    icon: ArrowRightLeft,
    row: 'border-dashed border-edge',
    name: 'text-content-faint line-through',
    badgeKey: 'assistant.preview.movedAway',
  },
};

/**
 * The assistant's waiting changes inside the day they touch, in the planner's
 * own day list: a place it would add as a dashed row, one it would take off
 * struck through, a move on both of its days. Resting on a row lights the
 * change's pin and card; a click brings the chat forward to decide. Nothing
 * here writes; the change card stays the one place a change is applied.
 */
export default function AssistantDayPreview({ tripId, dayId }: { tripId: number; dayId: number }) {
  const { t } = useTranslation();
  const messages = useAssistantStore((s) => chatOf(s, tripId).messages);
  const hovered = useAssistantStore((s) => (s.mapLink?.tripId === tripId ? s.mapLink.hoveredId : null));
  const { setMapHover, open } = useAssistantStore(useShallow((s) => ({ setMapHover: s.setMapHover, open: s.open })));
  const places = useTripStore((s) => s.places);

  const rows = useMemo(() => {
    const waiting = waitingCalls(messages);
    if (waiting.size === 0) return [];
    const nameOf = (id: number | null) => (id === null ? null : (places.find((p) => p.id === id)?.name ?? null));
    const out: PreviewRow[] = [];
    for (const [toolCallId, effect] of changeEffects(messages)) {
      if (!waiting.has(toolCallId)) continue;
      const row = rowOf(toolCallId, effect, dayId, nameOf);
      if (row) out.push(row);
    }
    return out;
  }, [messages, places, dayId]);

  if (rows.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-col gap-1 px-3 pb-2 pt-1" aria-label={t('assistant.preview.title')}>
      {rows.map((row, i) => {
        const look = LOOK[row.kind];
        const Icon = look.icon;
        const lit = hovered === row.toolCallId;
        return (
          <li
            key={`${row.toolCallId}-${row.kind}`}
            className="trek-assistant-enter"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <button
              type="button"
              onClick={open}
              onMouseEnter={() => setMapHover(tripId, row.toolCallId, 'card')}
              onMouseLeave={() => setMapHover(tripId, null, 'card')}
              className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-start transition-all ${look.row} ${
                lit ? 'shadow-md ring-2 ring-accent' : 'hover:shadow-sm'
              }`}
            >
              <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg bg-surface-card text-content-muted shadow-sm">
                <Icon size={12} aria-hidden="true" />
              </span>
              <bdi className={`min-w-0 flex-1 truncate text-caption font-medium ${look.name}`}>{row.name}</bdi>
              <span className="flex-shrink-0 rounded-full bg-surface-card px-2 py-0.5 text-caption text-content-muted shadow-sm">
                {t(look.badgeKey)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
