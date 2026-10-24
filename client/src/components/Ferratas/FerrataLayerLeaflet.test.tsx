/**
 * FE-FERRATA-LEAFLET-001 to FE-FERRATA-LEAFLET-011: the via ferrata layer on
 * the Leaflet renderer.
 *
 * Leaflet itself is not under test: the mock reflects each polyline's and
 * marker's props back as data attributes, so the assertions read which lines
 * are drawn, in which order and with what options. Casing and line stay
 * non-interactive so they cannot swallow clicks meant for places; only the
 * invisible hit line on top carries the tooltip, the hover and the click.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ferrata } from '@trek/shared';

import FerrataLayerLeaflet from './FerrataLayerLeaflet';
import { groupFerratas } from './ferrataGroups';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}(${Object.values(params).join(',')})` : key,
  }),
}));

const zoom = { value: 12 };
const zoomEnd: { handler: (() => void) | null } = { handler: null };

type Handlers = Record<string, ((event: { latlng: { lat: number; lng: number } }) => void) | undefined>;
const at = { latlng: { lat: 46.505, lng: 11.705 } };

vi.mock('react-leaflet', () => ({
  Polyline: ({
    positions,
    pathOptions,
    interactive,
    bubblingMouseEvents,
    eventHandlers,
    children,
  }: {
    positions: unknown;
    pathOptions: { color: string; weight: number; opacity: number; dashArray?: string; className?: string };
    interactive?: boolean;
    bubblingMouseEvents?: boolean;
    eventHandlers?: Handlers;
    children?: ReactNode;
  }) => (
    <div
      data-testid="polyline"
      data-positions={JSON.stringify(positions)}
      data-color={pathOptions.color}
      data-weight={pathOptions.weight}
      data-opacity={pathOptions.opacity}
      data-dash={pathOptions.dashArray ?? ''}
      data-class={pathOptions.className ?? ''}
      data-interactive={interactive === false ? 'false' : 'true'}
      data-bubbles={bubblingMouseEvents === false ? 'false' : 'true'}
      onClick={() => eventHandlers?.click?.(at)}
      onMouseOver={() => eventHandlers?.mouseover?.(at)}
      onMouseOut={() => eventHandlers?.mouseout?.(at)}
    >
      {children}
    </div>
  ),
  Marker: ({ position, eventHandlers }: { position: [number, number]; eventHandlers?: Handlers }) => (
    <button
      type="button"
      data-testid="ferrata-icon"
      data-position={JSON.stringify(position)}
      onClick={() => eventHandlers?.click?.(at)}
    />
  ),
  Tooltip: ({ children, className }: { children: ReactNode; className?: string }) => (
    <span data-testid="tooltip" data-class={className ?? ''}>
      {children}
    </span>
  ),
  // A pixel per 0.00001 degree: enough to tell icons apart that sit a few metres from each other.
  useMap: () => ({
    getZoom: () => zoom.value,
    project: ([lat, lng]: [number, number]) => ({ x: lng * 100_000, y: -lat * 100_000 }),
  }),
  useMapEvents: (handlers: { zoomend?: () => void }) => {
    zoomEnd.handler = handlers.zoomend ?? null;
    return null;
  },
}));

const ferrata = (
  id: string,
  name: string | null,
  level: number | null,
  options: { routeName?: string | null; lat?: number; lng?: number; plus?: '+' | null } = {}
): Ferrata => {
  const lat = options.lat ?? 46.5;
  const lng = options.lng ?? 11.7;
  return {
    id,
    name,
    grade: { raw: level === null ? null : String(level), level, plus: options.plus ?? null },
    routeName: options.routeName ?? null,
    geometry: [
      [lat, lng],
      [lat + 0.01, Math.round((lng + 0.01) * 1e6) / 1e6],
    ],
    osmUrl: `https://www.openstreetmap.org/${id}`,
  };
};

const lines = () => screen.getAllByTestId('polyline');

beforeEach(() => {
  zoom.value = 12;
});

describe('FerrataLayerLeaflet', () => {
  it('FE-FERRATA-LEAFLET-001: draws nothing for no ferratas', () => {
    const { container } = render(<FerrataLayerLeaflet groups={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-FERRATA-LEAFLET-002: a light casing, the dark dashed line, then the invisible hit line, in [lat, lng]', () => {
    const root = document.documentElement;
    root.style.setProperty('--map-ferrata', 'black');
    root.style.setProperty('--map-ferrata-casing', 'white');
    render(<FerrataLayerLeaflet groups={groupFerratas([ferrata('way/1', 'Pisciadù', 3)])} onSelect={vi.fn()} />);

    expect(lines().map((line) => line.dataset.weight)).toEqual(['6', '2.5', '16']);
    expect(lines().map((line) => line.dataset.color)).toEqual(['white', 'black', 'white']);
    expect(lines().map((line) => line.dataset.interactive)).toEqual(['false', 'false', 'true']);
    expect(lines()[1]?.dataset.dash).toBe('6 5');
    expect(lines()[2]?.dataset.opacity).toBe('0');
    expect(JSON.parse(lines()[0]?.dataset.positions ?? '[]')).toEqual([
      [46.5, 11.7],
      [46.51, 11.71],
    ]);
    root.style.removeProperty('--map-ferrata');
    root.style.removeProperty('--map-ferrata-casing');
  });

  it('FE-FERRATA-LEAFLET-003: the tooltip names the ferrata and its grade range, or falls back to the route and unnamed', () => {
    const groups = groupFerratas([
      ferrata('way/1', 'Pisciadù', 2),
      // Picks up where way/1 ends: one ferrata in two segments.
      ferrata('way/2', 'Pisciadù', 4, { lat: 46.51, lng: 11.71, plus: '+' }),
      ferrata('way/3', null, 3, { routeName: 'Sentiero attrezzato', lat: 47 }),
      ferrata('way/4', null, null, { lat: 48 }),
    ]);
    render(<FerrataLayerLeaflet groups={groups} onSelect={vi.fn()} />);
    expect(screen.getAllByTestId('tooltip').map((tip) => tip.textContent)).toEqual([
      'Pisciadùferratas.gradeRange(K2,K4+)',
      'Pisciadùferratas.gradeRange(K2,K4+)',
      'Sentiero attrezzatoK3',
      'ferratas.unnamed',
    ]);
  });

  it('FE-FERRATA-LEAFLET-004: a click on the hit line hands the ferrata, the way and the point to onSelect', () => {
    const onSelect = vi.fn();
    const target = ferrata('way/9', 'Tridentina', 2);
    const groups = groupFerratas([target]);
    render(<FerrataLayerLeaflet groups={groups} onSelect={onSelect} />);

    const hit = lines()[2];
    if (!hit) throw new Error('no hit line');
    fireEvent.click(hit);
    expect(onSelect).toHaveBeenCalledWith(groups[0], target, { lng: 11.705, lat: 46.505 });
  });

  it('FE-FERRATA-LEAFLET-005: the hit line keeps its click from reaching the map, so no control point lands under it', () => {
    render(<FerrataLayerLeaflet groups={groupFerratas([ferrata('way/1', 'Pisciadù', 3)])} onSelect={vi.fn()} />);
    expect(lines()[2]?.dataset.bubbles).toBe('false');
  });

  it('FE-FERRATA-LEAFLET-006: the grade sits beside the name as its own label, without a separator', () => {
    render(<FerrataLayerLeaflet groups={groupFerratas([ferrata('way/1', 'Pisciadù', 4)])} onSelect={vi.fn()} />);
    const tip = screen.getByTestId('tooltip');
    expect(tip.textContent).not.toContain('·');
    expect(tip.querySelector('span')?.textContent).toBe('K4');
  });

  it('FE-FERRATA-LEAFLET-007: hovering a segment lights up the whole ferrata in the deeper violet, and so does the open card', () => {
    const root = document.documentElement;
    root.style.setProperty('--map-ferrata-lit', 'navy');
    const groups = groupFerratas([
      ferrata('way/1', 'Via A', 2),
      ferrata('way/2', 'Via A', 3, { lat: 46.51, lng: 11.71 }),
      ferrata('way/3', 'Via B', 3, { lat: 47 }),
    ]);
    const { rerender } = render(<FerrataLayerLeaflet groups={groups} onSelect={vi.fn()} />);
    // Casings 0 to 2, lines 3 to 5, hit lines 6 to 8.
    const lineColours = () =>
      lines()
        .slice(3, 6)
        .map((line) => line.dataset.color);
    expect(lineColours()).not.toContain('navy');

    const hit = lines()[7];
    if (!hit) throw new Error('no hit line');
    fireEvent.mouseOver(hit);
    expect(lineColours().map((colour) => colour === 'navy')).toEqual([true, true, false]);
    fireEvent.mouseOut(hit);
    expect(lineColours()).not.toContain('navy');

    rerender(<FerrataLayerLeaflet groups={groups} onSelect={vi.fn()} selectedId={groups[1]?.id ?? null} />);
    expect(lineColours().map((colour) => colour === 'navy')).toEqual([false, false, true]);
    root.style.removeProperty('--map-ferrata-lit');
  });

  it('FE-FERRATA-LEAFLET-008: shows a route icon halfway along each ferrata only once zoomed in, and it opens the card', () => {
    const onSelect = vi.fn();
    const groups = groupFerratas([ferrata('way/1', 'Via A', 2), ferrata('way/2', 'Via B', 3, { lat: 47 })]);
    render(<FerrataLayerLeaflet groups={groups} onSelect={onSelect} />);
    expect(screen.queryAllByTestId('ferrata-icon')).toHaveLength(0);

    zoom.value = 14;
    act(() => zoomEnd.handler?.());
    const icons = screen.getAllByTestId('ferrata-icon');
    expect(icons).toHaveLength(2);
    const [lat, lng] = JSON.parse(icons[0]?.dataset.position ?? '[]') as [number, number];
    expect(lat).toBeCloseTo(46.505, 4);
    expect(lng).toBeCloseTo(11.705, 4);

    fireEvent.click(icons[1] as HTMLElement);
    expect(onSelect).toHaveBeenCalledWith(groups[1], groups[1]?.segments[0], { lng: 11.705, lat: 46.505 });
  });

  it('FE-FERRATA-LEAFLET-009: a theme change recolours the lines without a refetch', async () => {
    const root = document.documentElement;
    root.style.setProperty('--map-ferrata', 'black');
    render(<FerrataLayerLeaflet groups={groupFerratas([ferrata('way/1', 'Pisciadù', 3)])} onSelect={vi.fn()} />);
    expect(lines()[1]?.dataset.color).toBe('black');

    await act(async () => {
      root.style.setProperty('--map-ferrata', 'ivory');
      await Promise.resolve();
    });

    await waitFor(() => expect(lines()[1]?.dataset.color).toBe('ivory'));
    root.style.removeProperty('--map-ferrata');
  });
  it('FE-FERRATA-LEAFLET-010: a lit ferrata is drawn solid and wider on a wider casing, the hit line and tooltip carry their classes', () => {
    const groups = groupFerratas([ferrata('way/1', 'Via A', 2)]);
    render(<FerrataLayerLeaflet groups={groups} onSelect={vi.fn()} selectedId={groups[0]?.id ?? null} />);
    expect(lines().map((line) => line.dataset.weight)).toEqual(['9', '4', '16']);
    expect(lines()[1]?.dataset.dash).toBe('');
    expect(lines()[2]?.dataset.class).toBe('trek-ferrata-hit');
    expect(screen.getByTestId('tooltip').dataset.class).toBe('map-tooltip');
  });

  it('FE-FERRATA-LEAFLET-011: of two icons that would touch only the longer ferrata keeps its own', () => {
    const short = ferrata('way/1', 'Via A', 2);
    const long: Ferrata = {
      ...ferrata('way/2', 'Via B', 3, { lat: 46.5001 }),
      geometry: [
        [46.4951, 11.695],
        [46.5151, 11.715],
      ],
    };
    const groups = groupFerratas([short, long]);
    zoom.value = 14;
    render(<FerrataLayerLeaflet groups={groups} onSelect={vi.fn()} />);
    const icons = screen.getAllByTestId('ferrata-icon');
    expect(icons).toHaveLength(1);
    const [lat] = JSON.parse(icons[0]?.dataset.position ?? '[]') as [number, number];
    expect(lat).toBeCloseTo(46.5051, 4);
  });
});
