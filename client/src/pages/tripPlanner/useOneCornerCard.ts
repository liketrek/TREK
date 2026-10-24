import { useLayoutEffect, useRef } from 'react';
import { useSelectedPoi } from '../../components/Tours/poi/useTourPoiSearch';
import { selectPaddleObstacle, usePaddleObstacleStore } from '../../store/paddleObstacleStore';
import { useTourPoiStore } from '../../store/tourPoiStore';

/** One of the planner's own cards: whether it is up, and how it is closed. */
interface StickyCard {
  open: boolean;
  close: () => void;
}

/**
 * The corner over the planner map holds one card at a time. A via ferrata's,
 * a paddle object's and a place's card close on any press outside them, so
 * the press that opens the next one has closed the last already. The
 * planner's own cards (the ways of a section compared, RTE-02, and the round
 * hikes out of a stop, RTE-03) stay up through presses on the map, so they
 * are kept apart here: whichever card opened last stays, and every other one
 * closes. Laid out before paint, so two cards never show stacked in the
 * corner, not even for a frame.
 */
export function useOneCornerCard({
  planned,
  ferrataOpen,
  closeFerrata,
}: {
  planned: readonly StickyCard[];
  ferrataOpen: boolean;
  closeFerrata: () => void;
}): void {
  const paddleOpen = usePaddleObstacleStore((state) => state.selectedRef !== null);
  const poiOpen = useSelectedPoi() !== null;
  const selectPoi = useTourPoiStore((state) => state.select);
  const otherOpen = ferrataOpen || paddleOpen || poiOpen;
  const cards: StickyCard[] = [
    ...planned,
    {
      open: otherOpen,
      close: () => {
        closeFerrata();
        selectPaddleObstacle(null);
        selectPoi(null);
      },
    },
  ];
  // The cards as this render has them, read by the layout pass that follows.
  const latest = useRef(cards);
  useLayoutEffect(() => {
    latest.current = cards;
  });
  const was = useRef(cards.map((card) => card.open));
  const openKey = cards.map((card) => card.open).join();

  // Runs when what is open changes: the cards that just opened take the corner, those up already make way.
  useLayoutEffect(() => {
    const now = latest.current;
    const before = was.current;
    was.current = now.map((card) => card.open);
    if (now.filter((card) => card.open).length < 2) return;
    if (!now.some((card, index) => card.open && !before[index])) return;
    now.forEach((card, index) => {
      if (card.open && before[index]) card.close();
    });
  }, [openKey]);
}
