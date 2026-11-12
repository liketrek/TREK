import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';

/** A stop's or a day's id, as the day plan's drag handlers pass them around. */
type DragKey = string | number | null;

/**
 * The drag state of the day plan (DayPlanSidebar): what is being dragged, which
 * row the drop line stands on, which day the drag is over, and whether a drag
 * happened yet.
 *
 * The day list fades in once, on mount. Switching its stagger back on when a
 * drag ended played that entrance again on every drop, so the first drag turns
 * it off for good (#3041).
 *
 * A drag whose source row re-rendered away never sends its dragend to the
 * document, and the drop line then stayed on a row until the next reload. The
 * browser sends no mousemove during a drag, so the first plain mouse move or
 * press after one means it is over. Plain means no button held: Firefox fires
 * dragstart while it handles the move that starts the drag and hands that move
 * to the page afterwards, button still down. Read as the end, it threw the drag
 * away at pick-up and left only the arrows to reorder a day (#3041).
 */
export function useDayPlanDragState(dragDataRef: MutableRefObject<unknown>) {
  const [draggingId, setDraggingIdState] = useState<DragKey>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [dropTargetKey, setDropTargetKeyState] = useState<string | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<DragKey>(null);

  // Stable, so the sidebar's listeners that call them are set up once.
  const setDraggingId = useCallback((id: DragKey) => {
    if (id != null) setHasDragged(true);
    setDraggingIdState(id);
  }, []);
  const setDropTargetKey = useCallback((key: string | null) => {
    dropTargetRef.current = key;
    setDropTargetKeyState(key);
  }, []);

  useEffect(() => {
    if (!draggingId && !dropTargetKey && !dragOverDayId) return;
    const settle = (e: MouseEvent | PointerEvent) => {
      if (e.type === 'mousemove' && e.buttons !== 0) return;
      setDraggingIdState(null);
      dropTargetRef.current = null;
      setDropTargetKeyState(null);
      setDragOverDayId(null);
      dragDataRef.current = null;
      window.__dragData = null;
    };
    document.addEventListener('mousemove', settle);
    document.addEventListener('pointerdown', settle, true);
    return () => {
      document.removeEventListener('mousemove', settle);
      document.removeEventListener('pointerdown', settle, true);
    };
  }, [draggingId, dropTargetKey, dragOverDayId, dragDataRef]);

  return {
    draggingId,
    setDraggingId,
    hasDragged,
    dropTargetKey,
    dropTargetRef,
    setDropTargetKey,
    dragOverDayId,
    setDragOverDayId,
  };
}
