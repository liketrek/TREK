/**
 * The collection map frames every place of the list in the box it is given (FE-COMP-COLMAP-*).
 *
 * Real Leaflet on purpose, as in MapView.leaflet.test.tsx. The places went missing between
 * two sizes: the renderer opened on a camera framed for the browser window, while this map
 * is a box a fraction of that, and a mocked map has neither. The window here is a desktop
 * of 1600 x 1000 and the map the 567 x 724 split it gets beside the list, where the demo's
 * cafes opened on northern France with one pin in sight.
 */
import type { CollectionPlace } from '@trek/shared';
import L from 'leaflet';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { withMarkerCategory } from '../../pages/collections/collectionsModel';
import CollectionMap from './CollectionMap';

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    position: null,
    mode: 'off',
    error: null,
    errorCode: null,
    cycleMode: vi.fn(),
    setMode: vi.fn(),
  }),
}));

vi.mock('../Ferratas/FerrataLayerLeaflet', () => ({ FerrataMapLayerLeaflet: () => null }));

// A raster template keeps the basemap a plain TileLayer: the vector default needs WebGL.
vi.mock('../../hooks/useTileUrl', () => ({ useTileUrl: () => 'https://tiles.example.test/{z}/{x}/{y}.png' }));

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  getAllThumbs: vi.fn(() => ({})),
}));

// Every map this file builds, newest last.
const maps: L.Map[] = [];
L.Map.addInitHook(function (this: L.Map) {
  maps.push(this);
});

/** Half a selected pin (44 px): a point this far inside an edge keeps its whole pin on the map. */
const PIN = 22;
/** The desktop panel's control bar ends 52 px below the map's top edge. */
const BAR = 52;
/** The satellite and locate buttons fill the bottom 54 px of the map's corners. */
const CONTROLS = 54;

// Leaflet sizes the map from its container, which jsdom lays out at 0 x 0.
const box = { width: 567, height: 724 };
const sized = ['clientWidth', 'clientHeight'] as const;
const originals = new Map<string, PropertyDescriptor | undefined>();
const startWindow = { width: window.innerWidth, height: window.innerHeight };

function setWindow(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });
}

beforeAll(() => {
  for (const key of sized) {
    originals.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => (key === 'clientWidth' ? box.width : box.height),
    });
  }
});
afterAll(() => {
  for (const key of sized) {
    const original = originals.get(key);
    if (original) Object.defineProperty(HTMLElement.prototype, key, original);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

beforeEach(() => {
  // The desktop split beside the list, unless a test says otherwise.
  setWindow(1600, 1000);
  Object.assign(box, { width: 567, height: 724 });
});
afterEach(() => {
  setWindow(startWindow.width, startWindow.height);
  resetAllStores();
});

function place(id: number, name: string, lat: number, lng: number): CollectionPlace {
  return { id, collection_id: 1, name, lat, lng, status: 'idea' };
}

// The demo's cafes: Vienna twice, Trieste, Rome, Paris, Lisbon, Porto and Copenhagen.
const CAFES = [
  place(1, 'Cafe Central', 48.2105, 16.366),
  place(2, 'Cafe Sperl', 48.1999, 16.3634),
  place(3, 'Caffe San Marco', 45.6513, 13.777),
  place(4, "Sant'Eustachio il Caffe", 41.8984, 12.4753),
  place(5, 'Cafe de Flore', 48.8542, 2.3331),
  place(6, 'A Brasileira', 38.7102, -9.1417),
  place(7, 'Cafe Majestic', 41.1472, -8.6064),
  place(8, 'The Coffee Collective', 55.696, 12.5509),
];

// The demo's viewpoints, from the Norwegian fjords to the Cinque Terre.
const VIEWPOINTS = [
  place(11, 'Seceda', 46.6046, 11.722),
  place(12, 'Preikestolen', 58.9863, 6.1904),
  place(13, 'Trolltunga', 60.1241, 6.74),
  place(14, 'Rigi Kulm', 47.056, 8.485),
  place(15, 'Zugspitze', 47.4211, 10.9852),
  place(16, 'Eibsee loop', 47.4575, 10.9918),
  place(17, 'Hallstatt overlook', 47.5622, 13.6493),
  place(18, 'Monterosso al Mare', 44.1456, 9.654),
];

// Temples and shrines across Japan: eight as well, and far outside the cafes' frame.
const TEMPLES = [
  place(31, 'Fushimi Inari', 34.9671, 135.7727),
  place(32, 'Kiyomizu-dera', 34.9949, 135.785),
  place(33, 'Senso-ji', 35.7148, 139.7967),
  place(34, 'Chureito Pagoda', 35.5014, 138.8016),
  place(35, 'Itsukushima', 34.2959, 132.3199),
  place(36, 'Himeji Castle', 34.8394, 134.6939),
  place(37, 'Shirakawa-go', 36.2578, 136.9066),
  place(38, 'Todai-ji', 34.689, 135.8398),
];

// "All saved" across the globe, from Patagonia to Taiwan.
const WORLD = [
  place(21, 'Torres del Paine', -50.942, -73.4068),
  place(22, 'Pico do Arieiro', 32.7356, -16.9281),
  place(23, 'Landmannalaugar', 63.9926, -19.0607),
  place(24, 'Taroko Gorge', 24.1594, 121.6211),
  place(25, 'Lycian Way', 36.5497, 29.1153),
  ...VIEWPOINTS.slice(0, 3),
];

function mapOf(places: CollectionPlace[], underBar: boolean) {
  return (
    <CollectionMap places={places} selectedPlaceId={null} onOpenPlace={vi.fn()} dark={false} underBar={underBar} />
  );
}

async function renderMap(places: CollectionPlace[], underBar = true) {
  const view = render(mapOf(places, underBar));
  await waitFor(() => expect(view.container.querySelector('.leaflet-container')).not.toBeNull());
  return { view, map: maps[maps.length - 1] };
}

/** Where each place sits on the map, in pixels from its top left corner. */
function pointsOf(map: L.Map, places: CollectionPlace[]): L.Point[] {
  return places.map((p) => map.latLngToContainerPoint([p.lat ?? 0, p.lng ?? 0]));
}

/** Every pin whole on the map, below the bar when there is one, and above the bottom controls. */
function expectEveryPinClear(map: L.Map, places: CollectionPlace[], top: number) {
  for (const { x, y } of pointsOf(map, places)) {
    expect(x).toBeGreaterThanOrEqual(PIN);
    expect(x).toBeLessThanOrEqual(box.width - PIN);
    expect(y).toBeGreaterThanOrEqual(top + PIN);
    expect(y).toBeLessThanOrEqual(box.height - CONTROLS - PIN);
  }
}

/** Whether an element around the map carries the class. */
function wrappedIn(map: L.Map, className: string): boolean {
  for (let el = map.getContainer().parentElement; el; el = el.parentElement) {
    if (el.classList.contains(className)) return true;
  }
  return false;
}

/** The places fill a good part of the free box along one axis: framed, not shown from orbit. */
function expectFramedClosely(map: L.Map, places: CollectionPlace[], top: number) {
  const points = pointsOf(map, places);
  const spanX = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
  const spanY = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  const freeX = box.width - 2 * PIN;
  const freeY = box.height - top - CONTROLS - 2 * PIN;
  expect(Math.max(spanX / freeX, spanY / freeY)).toBeGreaterThan(0.4);
}

describe('CollectionMap framing', () => {
  it('FE-COMP-COLMAP-001: the desktop split opens with every cafe on screen, clear of the edges and the bar', async () => {
    const { map } = await renderMap(CAFES);

    expectEveryPinClear(map, CAFES, BAR);
    expectFramedClosely(map, CAFES, BAR);
  });

  it('FE-COMP-COLMAP-002: another list of the same length frames again', async () => {
    const { view, map } = await renderMap(CAFES);

    // Both lists hold eight places, so a fit keyed on the count never noticed the switch.
    // The temples lie far east of the cafes' frame, so their pins come clear only by a new fit.
    expect(pointsOf(map, TEMPLES).every((p) => p.x > box.width)).toBe(true);
    view.rerender(mapOf(TEMPLES, true));

    await waitFor(() => expectEveryPinClear(map, TEMPLES, BAR));
    expectFramedClosely(map, TEMPLES, BAR);
  });

  it('FE-COMP-COLMAP-003: a map the user moved stays put through a reload, a new order or an edited place', async () => {
    const { view, map } = await renderMap(CAFES);
    act(() => {
      map.setView([50, 10], 7, { animate: false });
    });

    const reloaded = [...CAFES].reverse().map((p) => ({ ...p, status: 'visited' as const }));
    view.rerender(mapOf(reloaded, true));

    expect(map.getZoom()).toBe(7);
    expect(map.getCenter().lat).toBeCloseTo(50, 5);
    expect(map.getCenter().lng).toBeCloseTo(10, 5);
  });

  it('FE-COMP-COLMAP-004: a filter that hides every place leaves the map where it was', async () => {
    const { view, map } = await renderMap(CAFES);
    const zoom = map.getZoom();
    const center = map.getCenter();

    view.rerender(mapOf([], true));

    expect(map.getZoom()).toBe(zoom);
    expect(map.getCenter().lat).toBeCloseTo(center.lat, 5);
    expect(map.getCenter().lng).toBeCloseTo(center.lng, 5);
  });

  it('FE-COMP-COLMAP-005: a list of one opens on its town, not on its street', async () => {
    const { map } = await renderMap([CAFES[0]]);

    expectEveryPinClear(map, [CAFES[0]], BAR);
    expect(map.getZoom()).toBeGreaterThanOrEqual(10);
    expect(map.getZoom()).toBeLessThanOrEqual(13);
  });

  it('FE-COMP-COLMAP-006: "All saved" across the globe keeps Patagonia and Taiwan on screen', async () => {
    const { map } = await renderMap(WORLD);

    expectEveryPinClear(map, WORLD, BAR);
  });

  it("FE-COMP-COLMAP-007: the phone's card frames every cafe clear of its edges and its bottom controls", async () => {
    setWindow(390, 844);
    Object.assign(box, { width: 356, height: 414 });

    const { map } = await renderMap(CAFES, false);

    expectEveryPinClear(map, CAFES, 0);
    expectFramedClosely(map, CAFES, 0);
    // The locate and satellite buttons stand on --bottom-nav-h, which lifts them over the tab
    // bar under a full-screen map. The card ends above the tab bar, so its wrapper zeroes it
    // and the buttons sit in the bottom 54 px the frame keeps free.
    expect(wrappedIn(map, '[--bottom-nav-h:0px]')).toBe(true);
  });
});

describe('CollectionMap pins (#3073)', () => {
  const MUSEUM = { id: 4, name: 'Museum', color: '#7c3aed', icon: 'Landmark' };

  it('FE-COMP-COLMAP-008: a saved place carries its category where the markers read it', () => {
    const pin = withMarkerCategory({ ...place(1, 'Belvedere', 48.1915, 16.3809), category_id: 4, category: MUSEUM });
    expect(pin).toMatchObject({ category_name: 'Museum', category_color: '#7c3aed', category_icon: 'Landmark' });
    expect(withMarkerCategory(place(2, 'Somewhere', 48.2, 16.37))).toMatchObject({
      category_name: null,
      category_color: null,
      category_icon: null,
    });
  });

  it('FE-COMP-COLMAP-009: the pin of a place with a category wears its colour, not the grey default', async () => {
    const { view } = await renderMap([
      { ...place(1, 'Belvedere', 48.1915, 16.3809), category_id: 4, category: MUSEUM },
    ]);
    await waitFor(() => expect(view.container.querySelector('.leaflet-marker-icon')).not.toBeNull());
    const html = view.container.querySelector('.leaflet-marker-icon')?.innerHTML ?? '';
    expect(html.toLowerCase()).toContain('#7c3aed');
  });
});
