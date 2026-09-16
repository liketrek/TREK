/**
 * The share page clusters its markers like the planner (#2343). The data hook and
 * Leaflet are stubbed: under test is the page's wiring, not Leaflet's rendering.
 */
import React from 'react';
import L from 'leaflet';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '../../helpers/render';
import { CLUSTER_OPTIONS, CLUSTER_RADIUS_PX, CLUSTER_UNTIL_ZOOM, createClusterIcon } from '../../../src/components/Map/markerCluster';
import { STACK_RADIUS_PX } from '../../../src/components/Map/coincidentPlaces';
import { MAP_MAX_ZOOM } from '../../../src/constants/mapDefaults';
import SharedTripPage from '../../../src/pages/SharedTripPage';

const mocks = vi.hoisted(() => ({
  hook: {} as Record<string, unknown>,
  clusterProps: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../../src/pages/sharedTrip/useSharedTrip', () => ({
  useSharedTrip: () => mocks.hook,
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Polyline: () => null,
  Tooltip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  useMap: () => ({ fitBounds: vi.fn(), on: vi.fn(), off: vi.fn() }),
}));

vi.mock('react-leaflet-cluster', () => ({
  default: (props: { children?: React.ReactNode }) => {
    mocks.clusterProps.push(props as unknown as Record<string, unknown>);
    return <div data-testid="cluster-group">{props.children}</div>;
  },
}));

// Its effect dynamically imports maplibre-gl, which has no business in jsdom.
vi.mock('../../../src/components/Map/VectorBasemap', () => ({ default: () => null }));

const place = (id: number, name: string, lat: number, lng: number) => ({
  id,
  name,
  lat,
  lng,
  category_color: '#6366f1',
  category_icon: 'map-pin',
});

function payload(places: Array<Record<string, unknown>>) {
  return {
    trip: { id: 1, title: 'Autumn', start_date: '2026-09-25', end_date: '2026-09-27', currency: 'EUR' },
    days: [{ id: 5, day_number: 1, date: '2026-09-25', title: 'Day one' }],
    assignments: {},
    dayNotes: {},
    places,
    reservations: [],
    accommodations: [],
    packing: [],
    budget: [],
    categories: [],
    permissions: { share_map: true, share_bookings: true, share_packing: true, share_budget: true },
    collab: null,
    cartoApiKey: null,
  };
}

function hookState(data: unknown) {
  return {
    data,
    error: false,
    base: 'EUR',
    convert: (n: number) => n,
    selectedDay: null,
    setSelectedDay: vi.fn(),
    activeTab: 'plan',
    setActiveTab: vi.fn(),
    showLangPicker: false,
    setShowLangPicker: vi.fn(),
  };
}

beforeEach(() => {
  mocks.clusterProps.length = 0;
});

describe('the map on a public share page', () => {
  it('FE-PAGE-SHARED-MAP-001: every stop is handed to a cluster group, not the raw map', () => {
    mocks.hook = hookState(
      payload([place(11, 'The Bund', 31.24, 121.49), place(12, 'Peace Hotel', 31.2397, 121.4903)]),
    );
    render(<SharedTripPage />);

    const cluster = screen.getByTestId('cluster-group');
    expect(within(cluster).getAllByTestId('marker')).toHaveLength(2);
    // And nothing escaped it: the map holds no bare markers of its own.
    expect(within(screen.getByTestId('map')).getAllByTestId('marker')).toHaveLength(2);
  });

  it('FE-PAGE-SHARED-MAP-002: the group is built from the shared options, so both maps cluster alike', () => {
    mocks.hook = hookState(payload([place(11, 'The Bund', 31.24, 121.49)]));
    render(<SharedTripPage />);

    expect(mocks.clusterProps).toHaveLength(1);
    const props = mocks.clusterProps[0];
    for (const [key, value] of Object.entries(CLUSTER_OPTIONS)) {
      expect(props[key], key + ' must reach the cluster group').toBe(value);
    }
    expect(typeof props.iconCreateFunction).toBe('function');
  });

  it('FE-PAGE-SHARED-MAP-003: the bubble shows the count, in the size bucket that count earns', () => {
    const small = createClusterIcon({ getChildCount: () => 7 });
    const medium = createClusterIcon({ getChildCount: () => 30 });
    const large = createClusterIcon({ getChildCount: () => 60 });

    expect(small.options.className).toBe('marker-cluster-wrapper');
    expect(small.options.html).toContain('<span>7</span>');
    expect([small, medium, large].map((icon) => icon.options.iconSize)).toEqual([L.point(36, 36), L.point(42, 42), L.point(48, 48)]);
    expect(small.options.html).toContain('width:36px;height:36px');
  });

  it('FE-PAGE-SHARED-MAP-005: two stops on one coordinate stay in a bubble a guest can open (#2344)', () => {
    mocks.hook = hookState(
      payload([place(11, 'Drop the bags', 31.24, 121.49), place(12, 'Check in', 31.24, 121.49)]),
    );
    render(<SharedTripPage />);

    const props = mocks.clusterProps[0];
    // A guest has no places rail to fall back on, so the bubble is the only way in and
    // nothing may switch clustering off above the zoom the trip is read at.
    expect(props).not.toHaveProperty('disableClusteringAtZoom');
    expect(props.spiderfyOnMaxZoom).toBe(true);
    const radius = props.maxClusterRadius as (zoom: number) => number;
    expect(radius(MAP_MAX_ZOOM)).toBe(STACK_RADIUS_PX);
    expect(radius(CLUSTER_UNTIL_ZOOM - 1)).toBe(CLUSTER_RADIUS_PX);
  });

  it('FE-PAGE-SHARED-MAP-004: a place without coordinates is left out of the map, as before', () => {
    mocks.hook = hookState(
      payload([place(11, 'The Bund', 31.24, 121.49), { id: 12, name: 'Geocoding failed' } as never]),
    );
    render(<SharedTripPage />);

    expect(within(screen.getByTestId('cluster-group')).getAllByTestId('marker')).toHaveLength(1);
  });
});
