import { create } from 'zustand';

/**
 * BIK-01 to BIK-05, RUN-02, MAP-03 and MAP-04: the stretches of the planned
 * route a card points at (a surface, a kind of way, a trail or hiking grade,
 * and on a hike its SAC grades, surfaces or kinds of way as OpenStreetMap
 * records them), drawn over the route on the planner map in the colour of
 * what they are. `paint` names a token of the route paints (bike and hike),
 * resolved where the map is drawn, so the theme decides the colour.
 */
export interface RouteHighlight {
  /** What is pointed at, so its row can show it is on. */
  id: string;
  lines: [number, number][][];
  paint: string;
  /** One paint per line where they differ, as when a hike's whole facet is drawn at once; else `paint` for all. */
  paints?: readonly string[];
}

interface TourRouteHighlightState {
  highlight: RouteHighlight | null;
  show: (highlight: RouteHighlight | null) => void;
  clear: () => void;
}

export const useTourRouteHighlightStore = create<TourRouteHighlightState>((set) => ({
  highlight: null,
  show: (highlight) => set({ highlight }),
  clear: () => set({ highlight: null }),
}));
