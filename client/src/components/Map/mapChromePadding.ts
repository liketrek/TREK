import type { ViewportPadding } from '../../utils/mapViewport';

/** How far above the map's bottom edge the place card floats (PlaceInspector's `bottom`). */
export const PLACE_CARD_OFFSET_PX = 20;
/** Map kept clear above the place card, so a pin panned there is not touching its edge. */
const PLACE_CARD_CLEARANCE_PX = 40;
/** What a place card is assumed to cover before it has been measured. */
const PLACE_CARD_MIN_COVER_PX = 320;

export interface BottomChrome {
  hasInspector?: boolean;
  /** The place card's measured height in pixels, 0 or absent while it is not on screen. */
  inspectorHeight?: number;
  hasDayDetail?: boolean;
}

/**
 * How much of the map's bottom edge the floating panels cover, the same on both renderers.
 *
 * The place card grows with its content up to 60vh, which on a portrait tablet reaches past
 * the middle of the map. A fixed allowance put the selected pin right under it (#2991), so
 * the card's real height counts once it is known; the fixed value stays the floor for the
 * moment between the selection and the card's first layout.
 */
export function bottomChromePadding({ hasInspector, inspectorHeight = 0, hasDayDetail }: BottomChrome): number {
  if (hasInspector)
    return Math.max(PLACE_CARD_MIN_COVER_PX, inspectorHeight + PLACE_CARD_OFFSET_PX + PLACE_CARD_CLEARANCE_PX);
  return hasDayDetail ? 280 : 60;
}

/**
 * Whether a point on the map's container sits under the panels around it rather than in
 * the open part of the map. Used to bring the selected pin back out after a panel grew
 * over it, and to leave the camera alone when it did not.
 */
export function isUnderChrome(
  point: { x: number; y: number },
  size: { x: number; y: number },
  padding: ViewportPadding
): boolean {
  return (
    point.x < padding.left ||
    point.x > size.x - padding.right ||
    point.y < padding.top ||
    point.y > size.y - padding.bottom
  );
}
