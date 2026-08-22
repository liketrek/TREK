import { useCallback, useRef, useState, type DragEvent } from 'react'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { PlanRow } from './planTimelineModel'

interface DragReorderArgs {
  /** The day's items in merged order — the space a reorder is expressed in. */
  merged: MergedItem[]
  dayId: number | null | undefined
  /** Same mover the up/down buttons use, so both paths share every guard. */
  onMove: (item: MergedItem, toIndex: number) => void
  enabled: boolean
}

export interface DragRowProps {
  draggable: boolean
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
  onDragEnd: () => void
}

export interface MPlanDragReorder {
  /** Key of the row under the finger, so it can be dimmed while it travels. */
  draggingKey: string | null
  /** Key of the row the drop would land in front of, for the insertion line. */
  dropBeforeKey: string | null
  dragPropsFor: (row: PlanRow) => DragRowProps | undefined
}

const NO_DRAG: MPlanDragReorder = {
  draggingKey: null,
  dropBeforeKey: null,
  dragPropsFor: () => undefined,
}

/**
 * Long-press drag reordering for the mobile day timeline (#1997).
 *
 * The phone shell shipped with up/down buttons only, on the reasoning that a
 * finger cannot start an HTML5 drag (#1265) and that the document-wide
 * `drag-drop-touch` polyfill which used to paper over that broke list scrolling
 * (#1432) and hijacked map pans (#1440). `utils/touchDragBridge` already solved
 * that for tablets (#1616): it watches only `[draggable]` rows inside an opted-in
 * `[data-touch-drag]` container, waits out a 320ms press before it claims the
 * gesture — so a swipe is still a scroll — and then replays real drag events.
 * This hook is the receiving half the mobile timeline was missing.
 *
 * Rows carry native drag props, which means the same code also works with a
 * mouse (tablet with a trackpad, desktop dev tools) at no extra cost.
 *
 * The up/down buttons stay exactly where they are: they are the accessible path,
 * and they are what still works when a drag is not practical.
 */
export function useMPlanDragReorder({ merged, dayId, onMove, enabled }: DragReorderArgs): MPlanDragReorder {
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [dropBeforeKey, setDropBeforeKey] = useState<string | null>(null)
  // The bridge's DataTransfer is a shim on browsers that refuse `new DataTransfer()`,
  // so the source also rides along in a ref — same as the desktop sidebar does.
  const sourceRef = useRef<MergedItem | null>(null)

  const clear = useCallback(() => {
    sourceRef.current = null
    setDraggingKey(null)
    setDropBeforeKey(null)
  }, [])

  const dragPropsFor = useCallback((row: PlanRow): DragRowProps | undefined => {
    // Connector rows are computed spacing between two stops, not items.
    if (!enabled || dayId == null || row.kind === 'conn') return undefined
    const item = row.item

    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        sourceRef.current = item
        setDraggingKey(row.key)
        try {
          e.dataTransfer.setData('planRowKey', row.key)
          e.dataTransfer.effectAllowed = 'move'
        } catch { /* the bridge's shim may not implement every DataTransfer member */ }
      },
      onDragOver: (e: DragEvent) => {
        if (!sourceRef.current) return
        // preventDefault is how a drop target says yes — the bridge reads it too.
        e.preventDefault()
        e.stopPropagation()
        setDropBeforeKey(prev => (prev === row.key ? prev : row.key))
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const source = sourceRef.current
        clear()
        if (!source || source === item) return
        const to = merged.indexOf(item)
        if (to < 0) return
        onMove(source, to)
      },
      onDragEnd: clear,
    }
  }, [enabled, dayId, merged, onMove, clear])

  if (!enabled) return NO_DRAG
  return { draggingKey, dropBeforeKey, dragPropsFor }
}
