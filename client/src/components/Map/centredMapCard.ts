import { MAP_LAYER_SWITCHER_INSET, MAP_ROUND_CONTROL_SIZE } from './MapLayerSwitcher';

/** The card's gap to the side panels where nothing else sits at the map's edge. */
const EDGE_GAP = 16;
/** How far the card keeps from the left panel, so it ends short of the base-layer pill. */
const PILL_CLEARANCE = MAP_LAYER_SWITCHER_INSET + MAP_ROUND_CONTROL_SIZE + 8;

/**
 * Where a card opened over the map sits (the place inspector, a tour's detail,
 * the day panel): centred between the two side panels, at most 800 wide.
 *
 * On the desktop map the base-layer pill stays put in the bottom-left corner. On
 * a map wide enough the centred card never reaches that corner, but on a narrower
 * one (both sidebars open in a 1280 window) it ran under the pill, which then
 * covered the first button of the card's footer (#2604). With `clearPill` the
 * card's left edge never comes closer than the pill: a narrow card moves right of
 * it and gives up the few pixels it needs, a wide map keeps it exactly centred.
 * The phone shows these cards as sheets with no pill beside them, so it leaves
 * `clearPill` off.
 *
 * `extent` is what the card is placed in: '100%' of the map, or '100vw' for the
 * fixed day panel.
 *
 * `centre` is where the card's middle sits, measured from the map's left edge like
 * the panel widths. Each card sets it as its own `left` next to translateX(-50%),
 * so lint:rtl counts that physical side where the card is placed.
 */
export function centredMapCard(
  leftWidth: number,
  rightWidth: number,
  { extent = '100%', clearPill = false }: { extent?: string; clearPill?: boolean } = {}
): { centre: string; width: string } {
  const free = `(${extent} - ${leftWidth}px - ${rightWidth}px)`;
  const centre = `calc(${leftWidth}px + ${free} / 2)`;
  if (!clearPill) return { centre, width: `min(800px, calc(${free} - ${2 * EDGE_GAP}px))` };
  const width = `min(800px, calc(${free} - ${PILL_CLEARANCE + EDGE_GAP}px))`;
  return { width, centre: `max(${centre}, calc(${leftWidth}px + ${PILL_CLEARANCE}px + ${width} / 2))` };
}
