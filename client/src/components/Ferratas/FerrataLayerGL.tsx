import type { Map } from 'mapbox-gl';

import type { FerrataGroup } from './ferrataGroups';
import { type FerrataSelectHandler, useFerrataLayerGL } from './useFerrataLayerGL';

/**
 * The via ferrata layer as a mountable piece for a GL map view: it renders
 * nothing itself, the lines live on `map`. See useFerrataLayerGL for the
 * layering, the highlight and the click handling.
 */
export default function FerrataLayerGL({
  map,
  groups,
  onSelect,
  selectedId = null,
}: {
  map: Map | null;
  groups: readonly FerrataGroup[];
  onSelect: FerrataSelectHandler;
  selectedId?: string | null;
}) {
  useFerrataLayerGL(map, groups, onSelect, selectedId);
  return null;
}
