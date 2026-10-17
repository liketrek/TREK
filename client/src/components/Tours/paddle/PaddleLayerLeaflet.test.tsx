/**
 * FE-PADDLE-LEAFLET-001 to FE-PADDLE-LEAFLET-006: the paddle obstacles on the
 * Leaflet renderer.
 *
 * Leaflet itself is not under test: the mock reflects each polyline's,
 * marker's and tooltip's props back as data attributes, so the assertions read
 * what is drawn, in which order and with what options. Pinned: the objects only
 * in the area wait for PADDLE_AREA_MIN_ZOOM unless one is picked, every line
 * sits on a white casing that takes no clicks, a line only near the route is
 * dashed, the markers grow and rise by how they stand to the route, and a click
 * on a marker or a line picks the object without reaching the map underneath.
 */
import L from 'leaflet';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaddleFeature, PaddleGeometry, PaddleObstacleKind, RelatedObstacle } from '@trek/shared';

import { act, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { PaddleLayerLeaflet } from './PaddleLayerLeaflet';
import {
  PADDLE_AREA_MIN_ZOOM,
  paddleMapItems,
  paddleMarkerHtml,
  type PaddleMapItem,
  type PaddleMapLayer,
} from './paddleMapLayer';
import type { PaddlePaint } from './paddlePaint';

/** Test colours standing in for the theme tokens (styles/paddle.css), distinct so each can be told apart. */
const PAINT: PaddlePaint = {
  obstacle: '#334155',
  access: '#4338ca',
  landing: '#0f766e',
  portage: '#9a6233',
  rapids: '#d97706',
  gap: '#dc2626',
  disc: '#ffffff',
  shadow: 'rgba(15, 23, 42, 0.35)',
};

const zoom = { value: 12 };
const zoomEnd: { handler: (() => void) | null } = { handler: null };

/** What Leaflet hands a click handler; stopPropagation marks its original event. */
const leafletClick = { originalEvent: new MouseEvent('click') };
type Handlers = Record<string, ((event: typeof leafletClick) => void) | undefined>;

vi.mock('react-leaflet', () => ({
  Polyline: ({
    positions,
    pathOptions,
    interactive,
    bubblingMouseEvents,
    eventHandlers,
  }: {
    positions: [number, number][];
    pathOptions: { color: string; weight: number; opacity: number; dashArray?: string; lineCap?: string };
    interactive?: boolean;
    bubblingMouseEvents?: boolean;
    eventHandlers?: Handlers;
  }) => (
    <div
      data-testid="polyline"
      data-positions={JSON.stringify(positions)}
      data-color={pathOptions.color}
      data-weight={pathOptions.weight}
      data-opacity={pathOptions.opacity}
      data-dash={pathOptions.dashArray ?? ''}
      data-cap={pathOptions.lineCap ?? ''}
      data-interactive={interactive === false ? 'false' : 'true'}
      data-bubbles={bubblingMouseEvents === false ? 'false' : 'true'}
      onClick={() => eventHandlers?.click?.(leafletClick)}
    />
  ),
  Marker: ({
    position,
    icon,
    zIndexOffset,
    eventHandlers,
    children,
  }: {
    position: [number, number];
    icon: L.DivIcon;
    zIndexOffset: number;
    eventHandlers: Handlers;
    children: ReactNode;
  }) => (
    <button
      type="button"
      data-testid="pin"
      data-position={JSON.stringify(position)}
      data-size={JSON.stringify(icon.options.iconSize)}
      data-anchor={JSON.stringify(icon.options.iconAnchor)}
      data-class={icon.options.className}
      data-html={typeof icon.options.html === 'string' ? icon.options.html : ''}
      data-z={zIndexOffset}
      onClick={() => eventHandlers.click?.(leafletClick)}
    >
      {children}
    </button>
  ),
  Tooltip: ({
    children,
    direction,
    offset,
    opacity,
    className,
  }: {
    children: ReactNode;
    direction: string;
    offset: [number, number];
    opacity: number;
    className: string;
  }) => (
    <span
      data-testid="tooltip"
      data-direction={direction}
      data-offset={JSON.stringify(offset)}
      data-opacity={opacity}
      data-class={className}
    >
      {children}
    </span>
  ),
  useMap: () => ({ getZoom: () => zoom.value }),
  useMapEvents: (handlers: { zoomend?: () => void }) => {
    zoomEnd.handler = handlers.zoomend ?? null;
    return null;
  },
}));

const feature = (
  ref: string,
  kind: PaddleObstacleKind,
  geometry: PaddleGeometry,
  name: string | null = null
): PaddleFeature => ({
  ref,
  kind,
  group_key: null,
  name,
  geometry,
  tags: {},
  tag_hash: ref,
  region_id: 'oberpfalz',
});
const lineString = (...coordinates: [number, number][]): PaddleGeometry => ({ type: 'LineString', coordinates });
const polygon = (...ring: [number, number][]): PaddleGeometry => ({ type: 'Polygon', coordinates: [ring] });

/** In GeoJSON [lng, lat]: a weir the route crosses, a lock beside it, a put-in and an access area further off. */
const WEIR = feature('way/1', 'weir', lineString([12.1, 49.1], [12.1005, 49.1005], [12.101, 49.101]), 'Pielmühle');
const LOCK = feature('way/2', 'lock', lineString([12.11, 49.11], [12.111, 49.111]));
const PUT_IN = feature('node/3', 'put_in', { type: 'Point', coordinates: [12.12, 49.12] }, 'Etterzhausen');
const ACCESS = feature('way/4', 'access', polygon([12.13, 49.13], [12.131, 49.13], [12.131, 49.131], [12.13, 49.13]));
const RELATED: RelatedObstacle[] = [
  { feature: WEIR, relation: 'on_route', distanceM: 0, alongM: 1200 },
  { feature: LOCK, relation: 'near', distanceM: 90, alongM: 2400 },
];
const ITEMS = paddleMapItems([WEIR, LOCK, PUT_IN, ACCESS], RELATED, PAINT);
const ALL_LABELS = ['Weir: Pielmühle', 'Lock', 'Put-in: Etterzhausen', 'Access rule'];
const ROUTE_LABELS = ['Weir: Pielmühle', 'Lock'];

const layerOf = (
  items: PaddleMapItem[],
  selectedRef: string | null = null,
  onSelect: (ref: string) => void = vi.fn()
): PaddleMapLayer => ({ items, selectedRef, selectedKey: null, onSelect });

const lines = () => screen.queryAllByTestId('polyline');
const pins = () => screen.queryAllByTestId('pin');
const labels = () => screen.queryAllByTestId('tooltip').map((tip) => tip.textContent);
const attr = (elements: HTMLElement[], name: string) => elements.map((element) => element.dataset[name]);

const zoomTo = (value: number) => {
  zoom.value = value;
  act(() => zoomEnd.handler?.());
};

beforeEach(() => {
  zoom.value = PADDLE_AREA_MIN_ZOOM - 1;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PaddleLayerLeaflet', () => {
  it('FE-PADDLE-LEAFLET-001: draws nothing without a layer, without items, or with only area objects while zoomed out', () => {
    const { container, rerender } = render(<PaddleLayerLeaflet />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PaddleLayerLeaflet layer={layerOf([])} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PaddleLayerLeaflet layer={layerOf(paddleMapItems([PUT_IN, ACCESS], [], PAINT))} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-PADDLE-LEAFLET-002: area objects wait for PADDLE_AREA_MIN_ZOOM, join on a zoomend and leave again when zoomed out', () => {
    render(<PaddleLayerLeaflet layer={layerOf(ITEMS)} />);
    expect(labels()).toEqual(ROUTE_LABELS);
    // A casing and a line each for the weir and the lock.
    expect(lines()).toHaveLength(4);

    zoomTo(PADDLE_AREA_MIN_ZOOM);
    expect(labels()).toEqual(ALL_LABELS);
    // The put-in is a point and draws no line; the access area adds its outline.
    expect(lines()).toHaveLength(6);

    zoomTo(PADDLE_AREA_MIN_ZOOM - 1);
    expect(labels()).toEqual(ROUTE_LABELS);
    expect(lines()).toHaveLength(4);
  });

  it('FE-PADDLE-LEAFLET-003: a picked area object shows at any zoom, larger and on top, until it is no longer picked', () => {
    zoom.value = PADDLE_AREA_MIN_ZOOM - 3;
    const { rerender } = render(<PaddleLayerLeaflet layer={layerOf(ITEMS, 'way/4')} />);
    expect(labels()).toEqual([...ROUTE_LABELS, 'Access rule']);
    expect(lines()).toHaveLength(6);

    const pin = screen.getByRole('button', { name: 'Access rule' });
    expect(pin.dataset.size).toBe('[36,36]');
    expect(pin.dataset.anchor).toBe('[18,18]');
    expect(pin.dataset.z).toBe('900');
    expect(pin.dataset.html).toBe(paddleMarkerHtml(ITEMS[3], true));

    rerender(<PaddleLayerLeaflet layer={layerOf(ITEMS)} />);
    expect(labels()).toEqual(ROUTE_LABELS);
    expect(lines()).toHaveLength(4);
  });

  it('FE-PADDLE-LEAFLET-004: markers sit on the point or mid-line, grow and rise by their relation, and name kind and object', () => {
    zoom.value = PADDLE_AREA_MIN_ZOOM;
    const { rerender } = render(<PaddleLayerLeaflet layer={layerOf(ITEMS)} />);

    expect(attr(pins(), 'position')).toEqual([
      '[49.1005,12.1005]',
      '[49.111,12.111]',
      '[49.12,12.12]',
      '[49.131,12.131]',
    ]);
    expect(attr(pins(), 'size')).toEqual(['[30,30]', '[26,26]', '[22,22]', '[22,22]']);
    expect(attr(pins(), 'anchor')).toEqual(['[15,15]', '[13,13]', '[11,11]', '[11,11]']);
    expect(attr(pins(), 'z')).toEqual(['600', '300', '300', '300']);
    expect(attr(pins(), 'class')).toEqual(['trek-paddle-pin', 'trek-paddle-pin', 'trek-paddle-pin', 'trek-paddle-pin']);
    expect(attr(pins(), 'html')).toEqual(ITEMS.map((item) => paddleMarkerHtml(item, false)));

    // The kind, with the object's name when it has one.
    expect(labels()).toEqual(ALL_LABELS);
    const tip = screen.getAllByTestId('tooltip')[0];
    expect(tip.dataset.direction).toBe('top');
    expect(tip.dataset.offset).toBe('[0,-12]');
    expect(tip.dataset.opacity).toBe('1');
    expect(tip.dataset.class).toBe('map-tooltip');

    // Picking the weir draws its marker larger and above the rest; the others keep theirs.
    rerender(<PaddleLayerLeaflet layer={layerOf(ITEMS, 'way/1')} />);
    expect(attr(pins(), 'size')).toEqual(['[36,36]', '[26,26]', '[22,22]', '[22,22]']);
    expect(attr(pins(), 'z')).toEqual(['900', '300', '300', '300']);
    expect(pins()[0].dataset.html).toBe(paddleMarkerHtml(ITEMS[0], true));
  });

  it('FE-PADDLE-LEAFLET-005: every line runs on a white casing that takes no clicks, dashed only while near the route', () => {
    zoom.value = PADDLE_AREA_MIN_ZOOM;
    render(<PaddleLayerLeaflet layer={layerOf(ITEMS)} />);
    // The casings of the weir, the lock and the access outline first, then their lines on top.
    const casings = lines().slice(0, 3);
    const drawn = lines().slice(3);
    expect(drawn).toHaveLength(3);

    expect(attr(casings, 'color')).toEqual(['#ffffff', '#ffffff', '#ffffff']);
    expect(attr(casings, 'weight')).toEqual(['7', '6', '5']);
    expect(attr(casings, 'dash')).toEqual(['', '', '']);
    expect(attr(casings, 'interactive')).toEqual(['false', 'false', 'false']);

    expect(attr(drawn, 'color')).toEqual([PAINT.obstacle, PAINT.obstacle, PAINT.access]);
    expect(attr(drawn, 'weight')).toEqual(['4', '3', '2']);
    expect(attr(drawn, 'dash')).toEqual(['', '6 5', '']);
    expect(attr(drawn, 'cap')).toEqual(['round', 'round', 'round']);
    expect(attr(drawn, 'interactive')).toEqual(['true', 'true', 'true']);
    expect(attr(drawn, 'bubbles')).toEqual(['false', 'false', 'false']);

    // Casing and line fade together, by how the object stands to the route.
    expect(attr(casings, 'opacity')).toEqual(['1', '0.85', '0.5']);
    expect(attr(drawn, 'opacity')).toEqual(['1', '0.85', '0.5']);

    // Both follow the same geometry, turned into [lat, lng].
    expect(attr(casings, 'positions')).toEqual(attr(drawn, 'positions'));
    expect(attr(drawn, 'positions')).toEqual([
      '[[49.1,12.1],[49.1005,12.1005],[49.101,12.101]]',
      '[[49.11,12.11],[49.111,12.111]]',
      '[[49.13,12.13],[49.13,12.131],[49.131,12.131],[49.13,12.13]]',
    ]);
  });

  it('FE-PADDLE-LEAFLET-006: a click on a marker or a line picks the object and goes no further, so no waypoint lands under it', () => {
    const stop = vi.spyOn(L.DomEvent, 'stopPropagation');
    const onSelect = vi.fn();
    render(<PaddleLayerLeaflet layer={layerOf(ITEMS, null, onSelect)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    expect(onSelect).toHaveBeenCalledWith('way/2');
    expect(stop).toHaveBeenCalledWith(leafletClick);
    expect(stop.mock.invocationCallOrder[0]).toBeLessThan(onSelect.mock.invocationCallOrder[0]);

    // Two casings, then the weir's line and the lock's.
    fireEvent.click(lines()[2]);
    expect(onSelect).toHaveBeenLastCalledWith('way/1');
    expect(stop).toHaveBeenCalledTimes(2);

    // A casing carries no handler of its own.
    fireEvent.click(lines()[0]);
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);
  });
});
