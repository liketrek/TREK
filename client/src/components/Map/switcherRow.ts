import type { CSSProperties } from 'react';
import { MAP_LAYER_SWITCHER_INSET } from './MapLayerSwitcher';

/** What the switcher row leaves free at the map's trailing edge: the locate button (20px off the edge, 44px wide) and a gap. */
const LOCATE_BUTTON_ROOM = 76;

/**
 * The column along a map's bottom edge that holds the layer switcher, both
 * renderers alike. Its width ends before the locate button, so the switcher can
 * tell when its words no longer fit (useLabelFit) and go to its icons.
 */
export function switcherRowStyle(leftWidth: number, rightWidth: number): CSSProperties {
  return {
    position: 'absolute',
    left: leftWidth + MAP_LAYER_SWITCHER_INSET,
    width: `calc(100% - ${leftWidth + MAP_LAYER_SWITCHER_INSET + rightWidth + LOCATE_BUTTON_ROOM}px)`,
    zIndex: 1000,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  };
}
