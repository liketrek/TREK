import { renderHook } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { useAddonStore } from '../../store/addonStore';
import { useTourStageLayers } from './useTourStageLayers';

type Planner = Parameters<typeof useTourStageLayers>[0];
type Ferrata = Parameters<typeof useTourStageLayers>[1];

const ferrata = { layer: undefined, crossings: [], selected: null } as unknown as Ferrata;

function planner(
  mode: TourPlannerController['mode'],
  tourType: Planner['tourType'] = 'hike',
  mapBaseLayer: Planner['mapBaseLayer'] = 'hiking'
): Planner {
  return {
    mode,
    tourType,
    mapBaseLayer,
    mapOverlays: new Set(),
    mapOverlaysOff: new Set(),
    toggleMapOverlay: () => {},
  };
}

const basesOf = (p: Planner, zoom: number | null = null) =>
  renderHook(() => useTourStageLayers(p, ferrata, zoom)).result.current;

describe('useTourStageLayers: OpenHikingMap (MAP-01)', () => {
  beforeEach(() => useAddonStore.setState({ toursHikingMap: true, toursCycleMap: true }));

  it('offers it while a hike is open: planned as a draft, a saved tour in the editor, or an import viewed as it came in', () => {
    const viewed = { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'hike' } as TourListItem } as const;
    for (const mode of [{ type: 'new-draft' }, { type: 'edit-saved', placeId: 4 }, viewed] as const) {
      const layers = basesOf(planner(mode));
      expect(layers.tourLayers.bases).toContain('hiking');
      expect(layers.baseLayer).toBe('hiking');
    }
  });

  it('not with no tour open, or for a paddle or a bike tour', () => {
    for (const p of [
      planner({ type: 'neutral' }),
      planner({ type: 'new-draft' }, 'kayak'),
      planner({ type: 'new-draft' }, 'bike'),
    ]) {
      const layers = basesOf(p);
      expect(layers.tourLayers.bases).not.toContain('hiking');
      // The choice is kept; the map shows the type's default until a hike is planned again.
      expect(layers.baseLayer).toBe('default');
    }
  });

  it('not where the admin withdrew it', () => {
    useAddonStore.setState({ toursHikingMap: false });
    expect(basesOf(planner({ type: 'new-draft' })).tourLayers.bases).not.toContain('hiking');
  });

  it('BIK-06: CyclOSM for a bike tour that is open, watched for whether it answers, and only while the admin allows it', () => {
    const viewed = { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'bike' } as TourListItem } as const;
    for (const mode of [{ type: 'new-draft' }, viewed] as const) {
      const layers = basesOf(planner(mode, 'bike', 'cycle'));
      expect(layers.tourLayers.bases).toEqual(['default', 'topo', 'cycle', 'satellite']);
      expect(layers.baseLayer).toBe('cycle');
      expect(layers.tourLayers.baseHealth).toMatchObject({ base: 'cycle', down: false });
    }
    expect(basesOf(planner({ type: 'new-draft' }, 'hike', 'cycle')).baseLayer).toBe('default');
    useAddonStore.setState({ toursCycleMap: false });
    expect(basesOf(planner({ type: 'new-draft' }, 'bike', 'cycle')).tourLayers.bases).not.toContain('cycle');
  });
});

describe('useTourStageLayers: the pistes (SKI-01)', () => {
  const pistesOf = (p: Planner) => basesOf(p).tourLayers.overlays.find((overlay) => overlay.id === 'pistes');

  it('offers them with no tour open, off until switched on, and shows them for a ski tour until switched off', () => {
    expect(pistesOf(planner({ type: 'neutral' }, 'hike', 'default'))).toMatchObject({ status: 'off', active: false });
    // With no tour open they come even while the last type chosen was a paddle tour.
    expect(pistesOf(planner({ type: 'neutral' }, 'kayak', 'default'))).toBeDefined();
    const imported = { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'ski' } as TourListItem } as const;
    for (const p of [planner(imported, 'hike', 'default'), planner({ type: 'new-draft' }, 'ski', 'default')]) {
      expect(pistesOf(p)).toMatchObject({ status: 'on', active: true });
      expect(pistesOf({ ...p, mapOverlaysOff: new Set(['pistes']) })).toMatchObject({ status: 'off', active: false });
    }
  });

  it('switches the pistes of a ski tour off by saying they show, and on again by saying they do not', () => {
    const toggles: Array<[string, boolean | undefined]> = [];
    const toggleMapOverlay = (id: string, shown?: boolean) => {
      toggles.push([id, shown]);
    };
    const shown = { ...planner({ type: 'new-draft' }, 'ski', 'default'), toggleMapOverlay };
    pistesOf(shown)?.onToggle();
    pistesOf({ ...shown, mapOverlaysOff: new Set(['pistes']) })?.onToggle();
    expect(toggles).toEqual([
      ['pistes', true],
      ['pistes', false],
    ]);
  });

  it('not for a hike, a bike tour, a run or a paddle tour that is open: a hike is summer only', () => {
    for (const tourType of ['hike', 'bike', 'run', 'kayak'] as const)
      expect(pistesOf(planner({ type: 'new-draft' }, tourType, 'default'))).toBeUndefined();
  });

  it('shows them on while the planner keeps them on, beside the seamarks of a paddle tour with none open', () => {
    const p = { ...planner({ type: 'neutral' }, 'kayak', 'default'), mapOverlays: new Set(['pistes']) };
    expect(basesOf(p).tourLayers.overlays.map((overlay) => [overlay.id, overlay.status])).toEqual([
      ['seamarks', 'off'],
      ['pistes', 'on'],
    ]);
  });

  it('marks them on but out of reach while the map is further out than their first tiles, and not once it is close', () => {
    const p = { ...planner({ type: 'neutral' }, 'hike', 'default'), mapOverlays: new Set(['pistes']) };
    const pistesAt = (zoom: number | null) =>
      basesOf(p, zoom).tourLayers.overlays.find((overlay) => overlay.id === 'pistes');
    expect(pistesAt(6)).toMatchObject({ status: 'on', belowMinZoom: true });
    expect(pistesAt(9)).toMatchObject({ status: 'on', belowMinZoom: false });
    // Until the map reported a zoom, nothing is claimed.
    expect(pistesAt(null)?.belowMinZoom).toBe(false);
  });
});
