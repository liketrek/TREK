import { useEffect } from 'react'
import { installTouchDragBridge } from '../utils/touchDragBridge'

/**
 * Arms the planner's long-press touch drag while `enabled` (#1616).
 *
 * Deliberately not armed on hybrid laptops: their primary pointer is fine, so
 * `drag-drop-touch` is loaded there instead (see utils/touchDragPolyfill) and
 * two bridges would fight over the same gesture. The two conditions cannot
 * both hold — a pointer is either coarse or fine.
 */
export function useTouchDragBridge(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    return installTouchDragBridge()
  }, [enabled])
}
