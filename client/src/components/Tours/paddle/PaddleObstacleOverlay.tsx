import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { selectPaddleObstacle, usePaddleObstacleStore } from '../../../store/paddleObstacleStore';
import { useMapCardDismiss } from '../../Map/useMapCardDismiss';
import PaddleObstacleCard from './PaddleObstacleCard';
import { paddleObstacleDetail, type PaddleObstacleDetail } from './paddleObstacleModel';

/**
 * The picked paddle object's card over the planner map (PAD-05B), where a
 * via ferrata's card sits and closing as that one does: on a press outside
 * it and on Escape, the press handed on so the map leaves its click alone.
 * The pick lives in the obstacle store, so the map and the checklist open
 * and close the same card. `extra` adds the checklist's part for the object.
 */
export default function PaddleObstacleOverlay({
  onOutsidePress,
  insetEnd,
  bottom,
  width,
  extra,
}: {
  onOutsidePress?: () => void;
  insetEnd: number;
  bottom: number;
  width?: number;
  extra?: (detail: PaddleObstacleDetail) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { features, related, regions, selectedRef } = usePaddleObstacleStore(
    useShallow((state) => ({
      features: state.features,
      related: state.related,
      regions: state.regions,
      selectedRef: state.selectedRef,
    }))
  );
  const detail = useMemo(
    () => paddleObstacleDetail({ features, related, regions, selectedRef }),
    [features, related, regions, selectedRef]
  );
  const close = useCallback(() => selectPaddleObstacle(null), []);
  useMapCardDismiss(ref, !!detail, close, onOutsidePress);

  if (!detail) return null;
  return (
    <div
      ref={ref}
      className="absolute z-[20] flex justify-end transition-[bottom] duration-200 ease-out"
      style={{ insetInlineEnd: insetEnd, bottom, maxWidth: `calc(100% - ${insetEnd + 32}px)` }}
      data-testid="paddle-obstacle-overlay"
    >
      <PaddleObstacleCard detail={detail} onClose={close} width={width}>
        {extra?.(detail)}
      </PaddleObstacleCard>
    </div>
  );
}
