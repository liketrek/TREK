import type { DawarichTrack, RoadtripHazard, RoadtripVia } from '@trek/shared';
import type { Day, Place, Reservation, RouteVia } from '../../types';
import type { ViewportPadding } from '../../utils/mapViewport';
import type { RouteProfileFocus } from '../../utils/routeGeometry';
import type { AlternativeOverlay } from '../Roadtrip/alternativeOverlays';
import type { DayBoundaryControls } from './dayBoundaryDrag';
import type { CompassMap } from './MapCompassPill';
import type { TourBaseLayer } from './MapLayerSwitcher';
import type { Poi } from './poiCategories';

/*
 * The props both trip map renderers take: the Leaflet MapView and the GL
 * MapViewGL (Mapbox or MapLibre), between which MapViewAuto picks at runtime.
 *
 * Callers talk to MapViewAuto, so one prop type has to describe what either
 * renderer does with it; before this file each side read `any`, and a prop one
 * renderer learned and the other never heard of went unnoticed. Both renderers
 * now declare `satisfies ComponentType<...>` against this type.
 *
 * Types only, on purpose: this module must stay free of leaflet, mapbox-gl and
 * maplibre-gl (`check:gl-split`), so every import here is `import type`.
 */

/**
 * A pin as the callers of MapViewAuto hand it down. Besides trip places they
 * pass the places inside a day's assignments and collection places, and those
 * carry no trip_id. Neither renderer reads trip_id, but both type their pins
 * as Place, which requires it; see MapViewAutoProps.
 */
export type MapPlace = Omit<Place, 'trip_id'> & { trip_id?: number };

/** A leg label between two consecutive stops: where it sits and what it says. */
export interface RouteSegment {
  mid: [number, number];
  from: [number, number];
  to: [number, number];
  walkingText?: string;
  drivingText?: string;
}

export interface MapViewProps {
  places?: Place[];
  dayPlaces?: Place[];
  // Enables the plugin map contributions (markers + layers). Absent on surfaces
  // without a trip (CollectionMap), which naturally excludes them — same rule as
  // the Leaflet MapPluginMarkers.
  tripId?: number;
  // Charging stops / rest areas a plugin route places on the drawn day route.
  routeVias?: RouteVia[];
  dayBoundaryControls?: DayBoundaryControls;
  /** The dashed last bit to a place the road network does not reach. */
  accessLines?: { line: [[number, number], [number, number]]; meters: number }[];
  route?: [number, number][][] | null;
  /**
   * One colour pair per entry of `route`, or absent for the blue the route has always
   * been. Only the road trip passes these, and only while colouring by day is on.
   */
  routeColors?: ({ line: string; casing: string } | undefined)[] | null;
  /** One flag per entry of `route`: true where the stretch is walked, drawn dashed (#2532). */
  routeWalking?: boolean[] | null;
  /** False while the map is locked (#2010): picking a place leaves the view alone. */
  followSelection?: boolean;
  /** Given, the lock that sets followSelection sits above the layer switcher. */
  onToggleFollow?: () => void;
  routeSegments?: RouteSegment[];
  selectedPlaceId?: number | null;
  /** The selected place itself, for when no pin on this map stands for it. */
  selectedPlace?: Place | null;
  onMarkerClick?: (id: number) => void;
  hoverDisabled?: boolean;
  onMapClick?: (info: { latlng: { lat: number; lng: number } }) => void;
  onMapContextMenu?:
    ((e: { latlng: { lat: number; lng: number }; originalEvent: MouseEvent | TouchEvent }) => void) | null;
  center?: [number, number];
  zoom?: number;
  fitKey?: number | null;
  dayOrderMap?: Record<number, number[] | null>;
  leftWidth?: number;
  rightWidth?: number;
  hasInspector?: boolean;
  hasDayDetail?: boolean;
  reservations?: Reservation[];
  visibleConnectionIds?: number[];
  showTransitRoutes?: boolean;
  days?: Day[];
  selectedDayId?: number | null;
  /**
   * Whether a booking switched on by hand also has to run on the selected day to be
   * drawn. Only the phone's plan map asks for it; see RouteVisibilityOptions.
   */
  scopeConnectionsToDay?: boolean;
  showReservationStats?: boolean;
  onReservationClick?: (reservationId: number) => void;
  pois?: Poi[];
  onPoiClick?: (poi: Poi) => void;
  /**
   * A corridor hit dropped somewhere on the map, with the coordinate it landed on.
   * The caller decides whether that point is near enough to the drive to mean anything.
   */
  onPoiDropOnRoute?: (osmId: string, lat: number, lng: number) => void;
  /** A click on the drawn route, for putting a via point there (#1797). */
  onRouteClick?: (lat: number, lng: number) => void;
  /** The ways of driving one leg, drawn while the picker is open. */
  alternativeRoutes?: AlternativeOverlay[];
  /** Which option is being considered, so it can be lit up in its own colour. */
  activeAlternative?: number | null;
  onChooseAlternative?: (index: number) => void;
  /** Reports which option the pointer is over, so the list and the map agree. */
  onHighlightAlternative?: (index: number | null) => void;
  /** Generic numbered control points for list-first route editors. */
  plannerWaypoints?: Array<{ id: string; lat: number; lng: number }>;
  selectedPlannerWaypointId?: string | null;
  onPlannerWaypointClick?: (id: string) => void;
  routeProfileFocus?: RouteProfileFocus | null;
  viewBaseLayer?: TourBaseLayer;
  onViewBaseLayerChange?: (layer: TourBaseLayer) => void;
  /**
   * An explicit stretch of map to frame, independent of the day being shown.
   *
   * `fitKey` cannot express this: it carries no coordinates, and each renderer decides
   * for itself that it means "the selected day". Weighing the ways of driving one leg
   * needs that leg on screen, which is neither the day nor the trip.
   */
  focusPoints?: [number, number][];
  /** Changes only when the caller intentionally wants a new initial frame. */
  focusKey?: number;
  /**
   * What the caller's own chrome covers while `focusPoints` is framed, in pixels per edge.
   *
   * The default padding knows this component's panels and nothing else, and on a phone it
   * is a flat margin. A shell that lays its own bars over the map passes what they cover,
   * so the frame lands in the part still visible. Only the fit on `focusPoints` reads it.
   * Compared by value: the same numbers in a new object do not refit, while new numbers
   * refit the points already handed over, because the chrome they must clear has moved.
   */
  fitPadding?: ViewportPadding;
  /**
   * Let markers stay apart longer than usual.
   *
   * A road trip is read along a line: two stops fifty kilometres apart on the same
   * motorway are the shape of the day, and merging them into one dot hides it.
   */
  clusterLoosely?: boolean;
  hazards?: RoadtripHazard[];
  /** The route recorded in Dawarich, already fetched by MapViewAuto (#2279). */
  dawarichTrack?: DawarichTrack | null;
  /** Draw only this local day of the recording. */
  dawarichSelectedDate?: string | null;
  /** Local dates whose day is collapsed in the day plan; their recording is not drawn. */
  dawarichHiddenDates?: ReadonlySet<string> | null;
  /** Via points to draw as draggable handles, keyed by day (#1797). */
  roadtripVias?: Record<number, RoadtripVia[]>;
  onMoveVia?: (dayId: number, id: number, lat: number, lng: number) => void;
  onRemoveVia?: (dayId: number, id: number) => void;
  onViewportChange?: (bbox: { south: number; west: number; north: number; east: number }) => void;
  /**
   * The raster tile URL template. Only the Leaflet renderer draws raster tiles;
   * the GL renderer draws the style of the chosen provider and ignores it.
   */
  tileUrl?: string;
  /**
   * Hands the caller the live map once it is ready. Only the GL renderer calls
   * it; the Leaflet renderer takes the prop and never calls it.
   */
  onMapReady?: (map: CompassMap | null) => void;
}

/**
 * What MapViewAuto accepts: the renderer contract with pins as callers really
 * pass them (MapPlace, possibly without trip_id). The gap between this and
 * MapViewProps is known drift between the callers and the renderers' Place
 * type; it is bridged in one place, in MapViewAuto, until the renderers type
 * their pins by what they read.
 */
export type MapViewAutoProps = Omit<MapViewProps, 'places' | 'dayPlaces'> & {
  places?: MapPlace[];
  dayPlaces?: MapPlace[];
};
