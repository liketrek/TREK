// FE-JOURNEY-LAYEREDMAP-001 to FE-JOURNEY-LAYEREDMAP-003
//
// JRN-04: the journey map with its layers: what the renderer is handed, and a
// picked mark's card.
import type { JourneyMapPlace } from '@trek/shared';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import JourneyLayeredMap from './JourneyLayeredMap';
import { ALL_VISIBLE } from './journeyMapLayers';
import type { JourneyMapMark } from './journeyMapMarks';
import type { JourneyMapLayersView } from './useJourneyMapLayers';

const seen = vi.hoisted(() => ({ props: [] as Record<string, unknown>[], engine: [] as string[] }));

vi.mock('./JourneyMap', () => ({
  default: (props: Record<string, unknown>) => {
    seen.props.push(props);
    seen.engine.push('leaflet');
    return null;
  },
}));
vi.mock('./JourneyMapAuto', () => ({
  default: (props: Record<string, unknown>) => {
    seen.props.push(props);
    seen.engine.push('auto');
    return null;
  },
}));

const MARK: JourneyMapMark = {
  kind: 'plan',
  key: 'plan:4',
  lat: 45.434,
  lng: 12.3388,
  color: '#64748b',
  place: {
    name: 'Piazza San Marco',
    trip_title: 'Venice',
    days: [],
    time: null,
    entry_id: null,
  } as unknown as JourneyMapPlace,
};

function layers(over: Partial<JourneyMapLayersView> = {}): JourneyMapLayersView {
  return {
    visibility: ALL_VISIBLE,
    toggle: vi.fn(),
    controls: [{ layer: 'entries', count: 1, state: 'ready' }],
    tracks: [],
    marks: [MARK],
    plannedEntryIds: new Set(['3']),
    ...over,
  };
}

const last = () => seen.props[seen.props.length - 1];
const PHOTOS = [{ id: 'p', lat: 1, lng: 2, thumbUrl: '/t.jpg' }];

describe('JourneyLayeredMap', () => {
  it('FE-JOURNEY-LAYEREDMAP-001: without layers the map draws as it always did, on the renderer asked for', () => {
    render(<JourneyLayeredMap engine="leaflet" checkins={[]} entries={[]} photos={PHOTOS} tracks={[]} />);
    expect(seen.engine[seen.engine.length - 1]).toBe('leaflet');
    expect(last()).toMatchObject({ photos: PHOTOS, marks: undefined, layerVisibility: undefined });
    expect(screen.queryByRole('group', { name: 'Map layers' })).toBeNull();
  });

  it('FE-JOURNEY-LAYEREDMAP-002: hands the renderer the layers, the photos only while their switch is on', () => {
    const view = layers();
    const { rerender } = render(<JourneyLayeredMap layers={view} checkins={[]} entries={[]} photos={PHOTOS} />);
    expect(seen.engine[seen.engine.length - 1]).toBe('auto');
    expect(last()).toMatchObject({
      photos: PHOTOS,
      marks: [MARK],
      layerVisibility: ALL_VISIBLE,
      plannedEntryIds: view.plannedEntryIds,
    });
    expect(screen.getByRole('group', { name: 'Map layers' })).toBeInTheDocument();

    rerender(
      <JourneyLayeredMap
        layers={layers({ visibility: { ...ALL_VISIBLE, photos: false } })}
        checkins={[]}
        entries={[]}
        photos={PHOTOS}
      />
    );
    expect(last().photos).toBeUndefined();
  });

  it('FE-JOURNEY-LAYEREDMAP-002b: the phone draws the layers without their switches', () => {
    render(<JourneyLayeredMap layers={layers()} hideLayerControl checkins={[]} entries={[]} photos={PHOTOS} />);
    expect(last()).toMatchObject({ marks: [MARK], layerVisibility: ALL_VISIBLE });
    expect(screen.queryByRole('group', { name: 'Map layers' })).toBeNull();
  });

  it('FE-JOURNEY-LAYEREDMAP-003: a picked mark opens its card, which goes when its layer is switched off', () => {
    const onOpenEntry = vi.fn();
    const { rerender } = render(
      <JourneyLayeredMap layers={layers()} onOpenEntry={onOpenEntry} checkins={[]} entries={[]} />
    );
    act(() => (last().onMarksPick as (marks: JourneyMapMark[]) => void)([MARK]));
    expect(screen.getByRole('dialog', { name: 'Piazza San Marco' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    act(() => (last().onMarksPick as (marks: JourneyMapMark[]) => void)([MARK]));
    rerender(<JourneyLayeredMap layers={layers({ marks: [] })} onOpenEntry={onOpenEntry} checkins={[]} entries={[]} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
