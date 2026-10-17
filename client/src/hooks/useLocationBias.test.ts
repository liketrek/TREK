// FE-HOOK-LOCBIAS-001 to FE-HOOK-LOCBIAS-014
import { renderHook } from '@testing-library/react';
import { useTripStore } from '../store/tripStore';
import { boxFromCoords, pointFromBox, radiusKm, useLocationBias, viewportBox } from './useLocationBias';

// Coordinates of real places, because the whole point of the hint is distance
// and a made-up grid would not show when a box stops being useful.
const KYOTO_A = { id: 1, lat: 35.0116, lng: 135.7681 };   // Kyoto Bahnhof
const KYOTO_B = { id: 2, lat: 34.9949, lng: 135.7850 };   // Kiyomizu-dera, ~2 km
const TOKIO = { id: 3, lat: 35.6762, lng: 139.6503 };     // ~370 km entfernt

function seed(state: Record<string, unknown>) {
  useTripStore.setState({ trip: null, places: [], assignments: {}, selectedDayId: null, planMapViewport: null, ...state } as never);
}

afterEach(() => seed({}));

describe('boxFromCoords', () => {
  it('ignoriert Eintraege ohne brauchbare Koordinaten', () => {
    const box = boxFromCoords([KYOTO_A, { lat: null, lng: null }, { lat: 'x', lng: 'y' }]);
    expect(box).toEqual({ low: { lat: KYOTO_A.lat, lng: KYOTO_A.lng }, high: { lat: KYOTO_A.lat, lng: KYOTO_A.lng } });
  });

  it('gibt nichts zurueck, wenn keine Koordinate brauchbar ist', () => {
    expect(boxFromCoords([{ lat: null, lng: null }])).toBeUndefined();
    expect(boxFromCoords([])).toBeUndefined();
  });
});

describe('pointFromBox', () => {
  it('legt den Punkt in die Mitte und deckt die Box mit dem Radius ab', () => {
    const punkt = pointFromBox(boxFromCoords([KYOTO_A, KYOTO_B]));
    expect(punkt!.lat).toBeCloseTo((KYOTO_A.lat + KYOTO_B.lat) / 2, 6);
    expect(punkt!.lng).toBeCloseTo((KYOTO_A.lng + KYOTO_B.lng) / 2, 6);
    // gut 2 km Diagonale, also rund 1 km Radius — angehoben auf die Untergrenze
    expect(punkt!.radius).toBe(5000);
  });

  it('haelt eine Untergrenze ein, damit ein einzelner Ort die Nachbarschaft meint', () => {
    // Ein Punkt ohne Ausdehnung wuerde sonst mit Radius 0 auf die Tuerschwelle zeigen.
    expect(pointFromBox(boxFromCoords([KYOTO_A]))!.radius).toBe(5000);
  });
});

describe('useLocationBias', () => {
  it('gibt ohne Orte keinen Hinweis', () => {
    seed({});
    expect(renderHook(() => useLocationBias()).result.current).toEqual({});
  });

  it('nimmt die Orte des geoeffneten Tages, nicht die der ganzen Reise', () => {
    // Die Reise reicht von Kyoto bis Tokio; der offene Tag spielt in Kyoto.
    seed({
      places: [KYOTO_A, KYOTO_B, TOKIO],
      assignments: { '7': [{ place_id: 1 }, { place_id: 2 }] },
      selectedDayId: 7,
    });
    const { box } = renderHook(() => useLocationBias()).result.current;
    expect(box).toBeDefined();
    // Tokio darf nicht in der Box liegen, sonst zeigt der Hinweis ins Leere.
    expect(box!.high.lng).toBeLessThan(TOKIO.lng);
    expect(radiusKm(box!)).toBeLessThan(5);
  });

  it('faellt auf die Reise zurueck, solange sie in eine Region passt', () => {
    seed({ places: [KYOTO_A, KYOTO_B] });
    const { box, point } = renderHook(() => useLocationBias()).result.current;
    expect(box).toBeDefined();
    expect(point!.lat).toBeCloseTo((KYOTO_A.lat + KYOTO_B.lat) / 2, 6);
  });

  it('verwirft einen Hinweis, der ueber eine ganze Rundreise spannt', () => {
    // Gemessen: eine Box ueber Kyoto UND Tokio kostet mehr Treffer auf Platz 1
    // als sie einbringt. Kein Hinweis ist dann die bessere Antwort.
    seed({ places: [KYOTO_A, TOKIO] });
    expect(renderHook(() => useLocationBias()).result.current).toEqual({});
  });

  it('verwirft die zu weite Reise-Box auch dann, wenn ein Tag gewaehlt aber leer ist', () => {
    seed({ places: [KYOTO_A, TOKIO], assignments: { '7': [] }, selectedDayId: 7 });
    expect(renderHook(() => useLocationBias()).result.current).toEqual({});
  });
});

// Der Kartenausschnitt, auf den gerade geschaut wird (#2620). Rund 11 x 9 km um
// den Kyoto Bahnhof, so wie ihn die Karte auf Zoom 13 meldet.
const KYOTO_VIEW = { tripId: 5, south: 34.96, west: 135.70, north: 35.06, east: 135.82 };
// Ganz Honshu auf Zoom 6, viel zu weit fuer einen brauchbaren Hinweis.
const HONSHU_VIEW = { tripId: 5, south: 33.0, west: 132.0, north: 38.0, east: 142.0 };

describe('useLocationBias mit Kartenausschnitt', () => {
  it('nimmt den sichtbaren Ausschnitt vor allem anderen, auch bei zu weiter Reise', () => {
    // Kyoto und Tokio: ohne Ausschnitt gaebe es gar keinen Hinweis.
    seed({ trip: { id: 5 }, places: [KYOTO_A, TOKIO], planMapViewport: KYOTO_VIEW });
    const { box, point } = renderHook(() => useLocationBias()).result.current;
    expect(box).toEqual({ low: { lat: 34.96, lng: 135.70 }, high: { lat: 35.06, lng: 135.82 } });
    expect(point?.lat).toBeCloseTo(35.01, 6);
    expect(point?.lng).toBeCloseTo(135.76, 6);
  });

  it('schlaegt auch den geoeffneten Tag', () => {
    // Der Tag spielt in Tokio, die Karte steht aber auf Kyoto: gesucht wird, wo hingeschaut wird.
    seed({
      trip: { id: 5 },
      places: [KYOTO_A, TOKIO],
      assignments: { '7': [{ place_id: 3 }] },
      selectedDayId: 7,
      planMapViewport: KYOTO_VIEW,
    });
    const { box } = renderHook(() => useLocationBias()).result.current;
    expect(box?.high.lng).toBeLessThan(TOKIO.lng);
  });

  it('faellt bei einem zu weiten Ausschnitt auf den Tag zurueck', () => {
    seed({
      trip: { id: 5 },
      places: [KYOTO_A, KYOTO_B, TOKIO],
      assignments: { '7': [{ place_id: 1 }, { place_id: 2 }] },
      selectedDayId: 7,
      planMapViewport: HONSHU_VIEW,
    });
    const { box } = renderHook(() => useLocationBias()).result.current;
    expect(box).toEqual(boxFromCoords([KYOTO_A, KYOTO_B]));
  });

  it('faellt bei einem zu weiten Ausschnitt und zu weiter Reise auf keinen Hinweis zurueck', () => {
    seed({ trip: { id: 5 }, places: [KYOTO_A, TOKIO], planMapViewport: HONSHU_VIEW });
    expect(renderHook(() => useLocationBias()).result.current).toEqual({});
  });

  it('ignoriert den Ausschnitt einer anderen Reise', () => {
    seed({ trip: { id: 9 }, places: [KYOTO_A, TOKIO], planMapViewport: KYOTO_VIEW });
    expect(renderHook(() => useLocationBias()).result.current).toEqual({});
  });

  it('nimmt keinen Ausschnitt ueber die Datumsgrenze oder ausserhalb der Welt', () => {
    expect(viewportBox({ tripId: 5, south: -18, west: 179.5, north: -17, east: -179.5 })).toBeUndefined();
    expect(viewportBox({ tripId: 5, south: -18, west: -180.5, north: -17, east: -179.5 })).toBeUndefined();
    expect(viewportBox({ tripId: 5, south: Number.NaN, west: 1, north: 2, east: 2 })).toBeUndefined();
    expect(viewportBox(KYOTO_VIEW)).toEqual({ low: { lat: 34.96, lng: 135.70 }, high: { lat: 35.06, lng: 135.82 } });
  });
});
