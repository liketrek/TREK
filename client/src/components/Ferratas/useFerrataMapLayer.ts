import { useCallback, useMemo, useRef, useState } from 'react';

import type { Ferrata, FerrataBbox } from '@trek/shared';

import { type FerrataCrossing, ferrataTilesAlong, routeFerrataCrossings } from './ferrataCrossings';
import {
  type FerrataGroup,
  ferrataGroupOf,
  ferrataGroupsInView,
  ferrataPointsBbox,
  groupFerratas,
} from './ferrataGroups';
import type { FerrataSelectHandler } from './useFerrataLayerGL';
import { type FerrataStatus, useTripFerratas } from './useTripFerratas';

/**
 * The via ferrata layer as a map hands it around: whether it is on, the switch
 * the layer pill shows with its count badge, the ferratas to draw (grouped
 * from OSM's segments), the one open in the card, and what a click on a line
 * does. Both flat renderers and the 3D terrain map take this one object, so
 * the three cannot drift apart on what the layer is.
 */
export interface FerrataMapLayer {
  active: boolean;
  onToggle: () => void;
  status: FerrataStatus;
  /** How many ferratas reach into the view on screen. */
  count: number;
  groups: readonly FerrataGroup[];
  /** The ferrata open in the card, drawn highlighted. */
  selectedId: string | null;
  onSelect: FerrataSelectHandler;
}

/** The ferrata open in the card, and the OSM way that was picked on it. */
export interface FerrataSelection {
  group: FerrataGroup;
  segment: Ferrata;
}

/** The box around every point of every line the stage hands over, or null for none. */
export function ferrataAreaOf(lines: ReadonlyArray<ReadonlyArray<readonly [number, number]>>): FerrataBbox | null {
  return ferrataPointsBbox(lines.flat());
}

/**
 * The via ferrata layer of one map surface: off by default, and nothing is
 * read or asked for while it is off.
 *
 * `onViewportChange` takes the visible area from whichever map is on screen
 * (the flat planner map or the 3D terrain). While the layer is off the area is
 * only remembered, not put into state, so panning a map with the layer off
 * re-renders nothing; switching it on starts from the last area the map
 * reported instead of waiting for the next pan. `areaLines` are the lines the
 * trip's area is made of (tour routes, waypoints, places), prefetched once
 * the layer is on. The selection names the OSM way that was clicked, so it
 * follows its ferrata when more segments load and join it, and closes when the
 * layer is switched off.
 */
export function useFerrataMapLayer(
  tripId: number | null | undefined,
  areaLines: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [],
  /** The tour's line as the elevation profile measures it; the ferratas along it load with the layer off too. */
  routeLine: readonly (readonly [number, number])[] | null = null
) {
  const [active, setActive] = useState(false);
  const [bbox, setBbox] = useState<FerrataBbox | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const lastArea = useRef<FerrataBbox | null>(null);
  const activeRef = useRef(false);
  const area = ferrataAreaOf(areaLines);
  const routeTiles = useMemo(() => ferrataTilesAlong(routeLine), [routeLine]);
  const { ferratas, status } = useTripFerratas(tripId, bbox, active, area, routeTiles);
  const groups = useMemo(() => groupFerratas(ferratas), [ferratas]);
  const crossings = useMemo<FerrataCrossing[]>(() => routeFerrataCrossings(routeLine, groups), [routeLine, groups]);
  const count = active ? ferrataGroupsInView(groups, bbox) : 0;

  const onViewportChange = useCallback((next: FerrataBbox) => {
    lastArea.current = next;
    if (activeRef.current) setBbox(next);
  }, []);

  const onToggle = useCallback(() => {
    const next = !activeRef.current;
    activeRef.current = next;
    setActive(next);
    setSelectedSegment(null);
    if (next) setBbox(lastArea.current);
  }, []);

  const close = useCallback(() => setSelectedSegment(null), []);
  const onSelect = useCallback<FerrataSelectHandler>((_group, segment) => setSelectedSegment(segment.id), []);

  const selected = useMemo<FerrataSelection | null>(() => {
    if (!active) return null;
    const group = ferrataGroupOf(groups, selectedSegment);
    const segment = group?.segments.find((candidate) => candidate.id === selectedSegment);
    return group && segment ? { group, segment } : null;
  }, [active, groups, selectedSegment]);
  const selectedId = selected?.group.id ?? null;

  const layer = useMemo<FerrataMapLayer>(
    () => ({ active, onToggle, status, count, groups, selectedId, onSelect }),
    [active, onToggle, status, count, groups, selectedId, onSelect]
  );

  return { layer, onViewportChange, selected, close, crossings };
}
