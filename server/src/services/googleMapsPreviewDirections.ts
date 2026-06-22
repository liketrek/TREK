import tzLookup from 'tz-lookup';

export type GoogleMapsPreviewDirectionsMode = 'driving' | 'bicycling' | 'walking' | 'transit';
export type GoogleMapsPreviewFeatureProfile = 'compact' | 'full';

export interface GoogleMapsPreviewDirectionsLocation {
  label?: string;
  address?: string;
  lat: number;
  lng: number;
  /** Google Maps place id, e.g. ChIJ... */
  placeId?: string;
  /** Google Maps data id / cid-like value, e.g. 0x...:0x... */
  dataId?: string;
}

export type GoogleMapsPreviewTimeOption =
  | { kind?: 'now'; timeZone?: string }
  | { kind: 'departAt'; epochSeconds: number; timeZone?: string }
  | { kind: 'departAtLocal'; localDateTime: string; timeZone?: string }
  | { kind: 'raw'; googleMapsEpochSeconds: number; timeKindEnum?: number; timeZone?: string };

export interface GoogleMapsPreviewViewport {
  centerLat?: number;
  centerLng?: number;
  spanMeters?: number;
  width?: number;
  height?: number;
  zoom?: number;
}

export interface GoogleMapsPreviewDirectionsRequest {
  origin: GoogleMapsPreviewDirectionsLocation;
  destination: GoogleMapsPreviewDirectionsLocation;
  waypoints?: GoogleMapsPreviewDirectionsLocation[];
  mode?: GoogleMapsPreviewDirectionsMode;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  language?: string;
  region?: string;
  time?: GoogleMapsPreviewTimeOption;
  viewport?: GoogleMapsPreviewViewport;
  includeOverviewGeometry?: boolean;
  includeSteps?: boolean;
  includeRaw?: boolean;
  includeDebug?: boolean;
  featureProfile?: GoogleMapsPreviewFeatureProfile;
  timeoutMs?: number;
  internal?: {
    /** Google-internal route mode enum. Known: 0 driving, 1 bicycling, 2 walking, 3 transit. */
    modeEnum?: number;
    /** Google-internal time enum. Known from testing: 2 means depart at. */
    timeKindEnum?: number;
    /** Google-internal !20m5 !2e value. Default observed value is 3. */
    routePreferenceEnum?: number;
  };
}

export interface GoogleMapsPreviewDirectionsTime {
  epochSeconds: number;
  timeZone?: string;
  text?: string;
  utcOffsetSeconds?: number;
  roundedEpochSeconds?: number;
}

export interface GoogleMapsPreviewDirectionsDistance {
  meters: number | null;
  text: string | null;
}

export interface GoogleMapsPreviewDirectionsDuration {
  seconds: number | null;
  text: string | null;
}

export interface GoogleMapsPreviewDirectionsFare {
  amount: number | null;
  text: string | null;
  currency: string | null;
}

export interface GoogleMapsPreviewDirectionsIcon {
  name: string | null;
  label: string | null;
  urls: string[];
}

export interface GoogleMapsPreviewDirectionsAdvisory {
  text: string;
  code: number | null;
  kind: 'toll' | 'ferry' | 'traffic' | 'other';
  iconUrls: string[];
  raw?: unknown;
}

export interface GoogleMapsPreviewDirectionsTraffic {
  duration: GoogleMapsPreviewDirectionsDuration | null;
  noTrafficDuration: GoogleMapsPreviewDirectionsDuration | null;
  range: { minSeconds: number | null; maxSeconds: number | null; text: string | null } | null;
  arrivalTime: GoogleMapsPreviewDirectionsTime | null;
}

export interface GoogleMapsPreviewDirectionsTrafficEvent {
  type: string | null;
  title: string | null;
  description: string | null;
  typeCode: number | null;
  delay: GoogleMapsPreviewDirectionsDuration | null;
  distance: GoogleMapsPreviewDirectionsDistance;
  reportedAgo: GoogleMapsPreviewDirectionsDuration | null;
  updatedAgo: GoogleMapsPreviewDirectionsDuration | null;
  updatedTime: GoogleMapsPreviewDirectionsTime | null;
  iconUrls: string[];
  raw?: unknown;
}

export interface GoogleMapsPreviewDirectionsStep {
  instructionHtml: string | null;
  instructionText: string | null;
  maneuver: string | null;
  distance: GoogleMapsPreviewDirectionsDistance;
  duration: GoogleMapsPreviewDirectionsDuration;
  advisories: GoogleMapsPreviewDirectionsAdvisory[];
  raw?: unknown;
}

export interface GoogleMapsPreviewTransitStop {
  name: string;
  stationCode: string | null;
  platform: string | null;
  dataId: string | null;
  lat: number | null;
  lng: number | null;
  arrivalTime: GoogleMapsPreviewDirectionsTime | null;
  departureTime: GoogleMapsPreviewDirectionsTime | null;
  icon: GoogleMapsPreviewDirectionsIcon | null;
  raw?: unknown;
}

export interface GoogleMapsPreviewTransitDetails {
  lineName: string | null;
  serviceName: string | null;
  serviceShortName: string | null;
  headsign: string | null;
  vehicleType: string | null;
  vehicleIcon: GoogleMapsPreviewDirectionsIcon | null;
  color: string | null;
  textColor: string | null;
  stopCount: number | null;
  agencies: GoogleMapsPreviewTransitAgency[];
  departureStop: GoogleMapsPreviewTransitStop | null;
  arrivalStop: GoogleMapsPreviewTransitStop | null;
  intermediateStops: GoogleMapsPreviewTransitStop[];
  raw?: unknown;
}

export interface GoogleMapsPreviewDirectionsLeg {
  distance: GoogleMapsPreviewDirectionsDistance;
  duration: GoogleMapsPreviewDirectionsDuration;
  fare: GoogleMapsPreviewDirectionsFare | null;
  advisories: GoogleMapsPreviewDirectionsAdvisory[];
  departureTime: GoogleMapsPreviewDirectionsTime | null;
  arrivalTime: GoogleMapsPreviewDirectionsTime | null;
  transit: GoogleMapsPreviewTransitDetails | null;
  steps: GoogleMapsPreviewDirectionsStep[];
  raw?: unknown;
}

export interface GoogleMapsPreviewTransitAgency {
  name: string;
  phone: string | null;
  website: string | null;
  fareUrl: string | null;
}

export interface GoogleMapsPreviewDirectionsRoute {
  index: number;
  mode: GoogleMapsPreviewDirectionsMode | 'unknown';
  modeCode: number | null;
  title: string | null;
  distance: GoogleMapsPreviewDirectionsDistance;
  duration: GoogleMapsPreviewDirectionsDuration;
  fare: GoogleMapsPreviewDirectionsFare | null;
  traffic: GoogleMapsPreviewDirectionsTraffic | null;
  trafficEvents: GoogleMapsPreviewDirectionsTrafficEvent[];
  departureTime: GoogleMapsPreviewDirectionsTime | null;
  arrivalTime: GoogleMapsPreviewDirectionsTime | null;
  warnings: string[];
  advisories: GoogleMapsPreviewDirectionsAdvisory[];
  transitAgencies: GoogleMapsPreviewTransitAgency[];
  legs: GoogleMapsPreviewDirectionsLeg[];
  overviewGeometry?: Array<{ lat: number; lng: number }>;
  raw?: unknown;
}

export interface GoogleMapsPreviewDirectionsResult {
  source: 'google-preview-directions';
  mode: GoogleMapsPreviewDirectionsMode | 'unknown';
  modeCode: number;
  language: string;
  region: string;
  routes: GoogleMapsPreviewDirectionsRoute[];
  encodedTime: {
    googleMapsEpochSeconds: number;
    timeKindEnum: number;
    timeZone: string;
  };
  debug?: {
    url: string;
    pb: string;
    featureProfile: GoogleMapsPreviewFeatureProfile;
  };
  raw?: unknown;
}

interface NormalizedRequest extends GoogleMapsPreviewDirectionsRequest {
  origin: GoogleMapsPreviewDirectionsLocation;
  destination: GoogleMapsPreviewDirectionsLocation;
  waypoints: GoogleMapsPreviewDirectionsLocation[];
  mode: GoogleMapsPreviewDirectionsMode;
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidFerries: boolean;
  language: string;
  region: string;
  includeSteps: boolean;
  featureProfile: GoogleMapsPreviewFeatureProfile;
  timeoutMs: number;
}

interface BuiltPreviewRequest {
  url: string;
  pb: string;
  modeCode: number;
  timeKindEnum: number;
  googleMapsEpochSeconds: number;
  timeZone: string;
  featureProfile: GoogleMapsPreviewFeatureProfile;
}

const GOOGLE_MAPS_PREVIEW_DIRECTIONS_ENDPOINT = 'https://www.google.com/maps/preview/directions';
const GOOGLE_MAPS_PREVIEW_XSSI_PREFIX = ")]}'\n";
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_REGION = 'ca';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 30_000;
const MAX_LABEL_LENGTH = 500;
const MAX_WAYPOINTS = 8;
const RESPONSE_CACHE_MAX = 500;
const RESPONSE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const MODE_TO_ENUM: Record<GoogleMapsPreviewDirectionsMode, number> = {
  driving: 0,
  bicycling: 1,
  walking: 2,
  transit: 3,
};

const ENUM_TO_MODE: Record<number, GoogleMapsPreviewDirectionsMode> = {
  0: 'driving',
  1: 'bicycling',
  2: 'walking',
  3: 'transit',
};

const FULL_FEATURE_SUFFIX = '!46m1!1b0!96b1!99b1';

const responseTextCache = new Map<string, { savedAt: number; text: string }>();
const inFlightResponseText = new Map<string, Promise<string>>();

function getCachedResponseText(cacheKey: string): string | null {
  const entry = responseTextCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > RESPONSE_CACHE_TTL_MS) {
    responseTextCache.delete(cacheKey);
    return null;
  }
  return entry.text;
}

function setCachedResponseText(cacheKey: string, text: string): void {
  responseTextCache.set(cacheKey, { savedAt: Date.now(), text });
  if (responseTextCache.size > RESPONSE_CACHE_MAX) {
    const oldest = responseTextCache.keys().next().value;
    if (oldest !== undefined) responseTextCache.delete(oldest);
  }
}

export function __clearGoogleMapsPreviewDirectionsCacheForTests(): void {
  responseTextCache.clear();
  inFlightResponseText.clear();
}

function makeHttpError(status: number, message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw makeHttpError(400, 'Directions request body must be an object');
  }
  return value as Record<string, unknown>;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw makeHttpError(400, `${field} must be a string`);
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') throw makeHttpError(400, `${field} must be a boolean`);
  return value;
}

function validateLocation(value: unknown, field: string): GoogleMapsPreviewDirectionsLocation {
  const body = asRecord(value);
  if (!finiteNumber(body.lat)) throw makeHttpError(400, `${field}.lat must be a finite number`);
  if (!finiteNumber(body.lng)) throw makeHttpError(400, `${field}.lng must be a finite number`);

  const label = optionalString(body.label, `${field}.label`);
  const address = optionalString(body.address, `${field}.address`);
  if (label && label.length > MAX_LABEL_LENGTH) throw makeHttpError(400, `${field}.label is too long`);
  if (address && address.length > MAX_LABEL_LENGTH) throw makeHttpError(400, `${field}.address is too long`);

  return {
    label,
    address,
    lat: body.lat,
    lng: body.lng,
    placeId: optionalString(body.placeId, `${field}.placeId`),
    dataId: optionalString(body.dataId, `${field}.dataId`) ?? optionalString(body.cid, `${field}.cid`),
  };
}

function validateTime(value: unknown): GoogleMapsPreviewTimeOption | undefined {
  if (value === undefined || value === null) return undefined;
  const body = asRecord(value);
  const kind = optionalString(body.kind, 'time.kind') ?? 'now';
  const timeZone = optionalString(body.timeZone, 'time.timeZone');

  if (kind === 'now') return { kind: 'now', timeZone };
  if (kind === 'departAt') {
    if (!finiteNumber(body.epochSeconds)) throw makeHttpError(400, 'time.epochSeconds must be a finite number');
    return { kind: 'departAt', epochSeconds: body.epochSeconds, timeZone };
  }
  if (kind === 'departAtLocal') {
    const localDateTime = optionalString(body.localDateTime, 'time.localDateTime');
    if (!localDateTime) throw makeHttpError(400, 'time.localDateTime is required');
    return { kind: 'departAtLocal', localDateTime, timeZone };
  }
  if (kind === 'raw') {
    if (!finiteNumber(body.googleMapsEpochSeconds)) {
      throw makeHttpError(400, 'time.googleMapsEpochSeconds must be a finite number');
    }
    const timeKindEnum = body.timeKindEnum;
    if (timeKindEnum !== undefined && (!Number.isInteger(timeKindEnum) || (timeKindEnum as number) < 0)) {
      throw makeHttpError(400, 'time.timeKindEnum must be a non-negative integer');
    }
    return {
      kind: 'raw',
      googleMapsEpochSeconds: body.googleMapsEpochSeconds,
      timeKindEnum: timeKindEnum as number | undefined,
      timeZone,
    };
  }

  throw makeHttpError(400, 'time.kind must be one of now, departAt, departAtLocal, raw');
}

function validateViewport(value: unknown): GoogleMapsPreviewViewport | undefined {
  if (value === undefined || value === null) return undefined;
  const body = asRecord(value);
  const viewport: GoogleMapsPreviewViewport = {};
  for (const key of ['centerLat', 'centerLng', 'spanMeters', 'width', 'height', 'zoom'] as const) {
    if (body[key] !== undefined) {
      if (!finiteNumber(body[key])) throw makeHttpError(400, `viewport.${key} must be a finite number`);
      viewport[key] = body[key] as number;
    }
  }
  return viewport;
}

function validateInternal(value: unknown): GoogleMapsPreviewDirectionsRequest['internal'] {
  if (value === undefined || value === null) return undefined;
  const body = asRecord(value);
  const result: NonNullable<GoogleMapsPreviewDirectionsRequest['internal']> = {};
  for (const key of ['modeEnum', 'timeKindEnum', 'routePreferenceEnum'] as const) {
    if (body[key] !== undefined) {
      if (!Number.isInteger(body[key]) || (body[key] as number) < 0) {
        throw makeHttpError(400, `internal.${key} must be a non-negative integer`);
      }
      result[key] = body[key] as number;
    }
  }
  return result;
}

export function normalizeGoogleMapsPreviewDirectionsRequest(input: unknown): NormalizedRequest {
  const body = asRecord(input);
  const mode = optionalString(body.mode, 'mode') ?? 'driving';
  if (!(mode in MODE_TO_ENUM)) {
    throw makeHttpError(400, 'mode must be one of driving, bicycling, walking, transit');
  }

  let waypoints: GoogleMapsPreviewDirectionsLocation[] = [];
  if (body.waypoints !== undefined) {
    if (!Array.isArray(body.waypoints)) throw makeHttpError(400, 'waypoints must be an array');
    if (body.waypoints.length > MAX_WAYPOINTS)
      throw makeHttpError(400, `waypoints cannot contain more than ${MAX_WAYPOINTS} entries`);
    waypoints = body.waypoints.map((item, index) => validateLocation(item, `waypoints.${index}`));
  }

  const timeoutMs = finiteNumber(body.timeoutMs)
    ? Math.min(Math.max(body.timeoutMs, 1), MAX_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
  const includeOverviewGeometry = body.includeOverviewGeometry === true;
  const avoidTolls = optionalBoolean(body.avoidTolls, 'avoidTolls') ?? false;
  const avoidHighways = optionalBoolean(body.avoidHighways, 'avoidHighways') ?? false;
  const avoidFerries = optionalBoolean(body.avoidFerries, 'avoidFerries') ?? false;
  const featureProfile = body.featureProfile === 'full' || includeOverviewGeometry || avoidTolls || avoidHighways || avoidFerries ? 'full' : 'compact';
  if (body.featureProfile !== undefined && body.featureProfile !== 'compact' && body.featureProfile !== 'full') {
    throw makeHttpError(400, 'featureProfile must be compact or full');
  }

  return {
    origin: validateLocation(body.origin, 'origin'),
    destination: validateLocation(body.destination, 'destination'),
    waypoints,
    mode: mode as GoogleMapsPreviewDirectionsMode,
    avoidTolls,
    avoidHighways,
    avoidFerries,
    language: optionalString(body.language, 'language') ?? DEFAULT_LANGUAGE,
    region: optionalString(body.region, 'region') ?? DEFAULT_REGION,
    time: validateTime(body.time),
    viewport: validateViewport(body.viewport),
    includeOverviewGeometry,
    includeSteps: body.includeSteps !== false,
    includeRaw: body.includeRaw === true,
    includeDebug: body.includeDebug === true,
    featureProfile,
    timeoutMs,
    internal: validateInternal(body.internal),
  };
}

function encodePbString(value: string): string {
  return encodeURIComponent(value.replace(/!/g, ' ')).replace(/%20/g, '+');
}

function locationLabel(location: GoogleMapsPreviewDirectionsLocation): string {
  return location.label || location.address || `${location.lat},${location.lng}`;
}

function buildLocationPb(location: GoogleMapsPreviewDirectionsLocation): string {
  const label = encodePbString(locationLabel(location));
  if (location.dataId && location.placeId) {
    return `!1m6!1s${label}!2s${encodePbString(location.dataId)}!3m2!3d${location.lat}!4d${location.lng}!19s${encodePbString(location.placeId)}`;
  }
  return `!1m4!1s${label}!3m2!3d${location.lat}!4d${location.lng}`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMeters(a: GoogleMapsPreviewDirectionsLocation, b: GoogleMapsPreviewDirectionsLocation): number {
  const radius = 6_371_000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function buildViewportPb(points: GoogleMapsPreviewDirectionsLocation[], viewport?: GoogleMapsPreviewViewport): string {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const centerLat = viewport?.centerLat ?? (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = viewport?.centerLng ?? (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const straightLineMeters = points
    .slice(1)
    .reduce((sum, point, index) => sum + haversineMeters(points[index], point), 0);
  const spanMeters = viewport?.spanMeters ?? Math.max(straightLineMeters * 7, 10_000);
  const width = Math.round(viewport?.width ?? 2544);
  const height = Math.round(viewport?.height ?? 1376);
  const zoom = viewport?.zoom ?? 13.1;

  return `!3m12!1m3!1d${spanMeters}!2d${centerLng}!3d${centerLat}!2m3!1f0!2f0!3f0!3m2!1i${width}!2i${height}!4f${zoom}`;
}

function safeTimeZone(origin: GoogleMapsPreviewDirectionsLocation, explicit?: string): string {
  if (explicit) return explicit;
  try {
    return tzLookup(origin.lat, origin.lng);
  } catch {
    return 'UTC';
  }
}

function partsInTimeZone(epochSeconds: number, timeZone: string): Record<string, number> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(new Date(epochSeconds * 1000))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return parts;
}

function googleEpochFromAbsoluteEpoch(epochSeconds: number, timeZone: string): number {
  const epoch = epochSeconds > 1_000_000_000_000 ? Math.floor(epochSeconds / 1000) : Math.floor(epochSeconds);
  const parts = partsInTimeZone(epoch, timeZone);
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) / 1000);
}

function googleEpochFromLocalDateTime(value: string): number {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) {
    throw makeHttpError(400, 'time.localDateTime must use YYYY-MM-DDTHH:mm[:ss]');
  }
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = match;
  return Math.floor(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)) / 1000);
}

function buildTime(request: NormalizedRequest): {
  googleMapsEpochSeconds: number;
  timeKindEnum: number;
  timeZone: string;
} {
  const option = request.time ?? { kind: 'now' as const };
  const timeZone = safeTimeZone(request.origin, option.timeZone);

  if (option.kind === 'raw') {
    return {
      googleMapsEpochSeconds: Math.floor(option.googleMapsEpochSeconds),
      timeKindEnum: option.timeKindEnum ?? request.internal?.timeKindEnum ?? 2,
      timeZone,
    };
  }
  if (option.kind === 'departAt') {
    return {
      googleMapsEpochSeconds: googleEpochFromAbsoluteEpoch(option.epochSeconds, timeZone),
      timeKindEnum: request.internal?.timeKindEnum ?? 2,
      timeZone,
    };
  }
  if (option.kind === 'departAtLocal') {
    return {
      googleMapsEpochSeconds: googleEpochFromLocalDateTime(option.localDateTime),
      timeKindEnum: request.internal?.timeKindEnum ?? 2,
      timeZone,
    };
  }
  return {
    googleMapsEpochSeconds: googleEpochFromAbsoluteEpoch(Date.now() / 1000, timeZone),
    timeKindEnum: request.internal?.timeKindEnum ?? 2,
    timeZone,
  };
}

function buildFullFeaturePrefix(request: NormalizedRequest): string {
  const routeAvoidFlags = [
    request.avoidHighways ? '!1b1' : '',
    request.avoidTolls ? '!2b1' : '',
  ].join('');
  const routeAvoidFlagCount = (request.avoidHighways ? 1 : 0) + (request.avoidTolls ? 1 : 0);
  const ferryFlag = request.avoidFerries ? '!7b1' : '';
  const ferryFlagCount = request.avoidFerries ? 1 : 0;

  return (
    `!6m${57 + routeAvoidFlagCount + ferryFlagCount}` +
    '!1m5!18b1!30b1!31m1!1b1!34e1' +
    `!2m${4 + routeAvoidFlagCount}${routeAvoidFlags}!5m1!6e2!20e3!39b1` +
    `!6m${25 + ferryFlagCount}` +
    '!32i1!49b1!66b1!85b1!114b1!149b1!206b1!209b1!212b1!216b1' +
    '!222b1!223b1!232b1!234b1!235b1!241b1!244b1!246b1!250b1!253b1' +
    '!260b1!266b1!270b1!273b1!279b1' +
    `${ferryFlag}!10b1!12b1!13b1!14b1!16b1` +
    '!17m1!3e1'
  );
}

function buildFeaturePb(
  request: NormalizedRequest,
  modeCode: number,
  timeKindEnum: number,
  googleMapsEpochSeconds: number,
): string {
  const routePreferenceEnum = request.internal?.routePreferenceEnum ?? 3;
  const routeOptions = `!19m2!2e${timeKindEnum}!3j${googleMapsEpochSeconds}!20m5!1e${modeCode}!2e${routePreferenceEnum}!5e2!6b1!14b1`;
  if (request.featureProfile === 'full') {
    return `${buildFullFeaturePrefix(request)}${routeOptions}${FULL_FEATURE_SUFFIX}`;
  }
  return `!6m11!17m1!3e1${routeOptions}`;
}

export function buildGoogleMapsPreviewDirectionsUrl(
  input: GoogleMapsPreviewDirectionsRequest | unknown,
): BuiltPreviewRequest {
  const request = normalizeGoogleMapsPreviewDirectionsRequest(input);
  const modeCode = request.internal?.modeEnum ?? MODE_TO_ENUM[request.mode];
  const time = buildTime(request);
  const points = [request.origin, ...request.waypoints, request.destination];
  const pb = [
    ...points.map(buildLocationPb),
    buildViewportPb(points, request.viewport),
    buildFeaturePb(request, modeCode, time.timeKindEnum, time.googleMapsEpochSeconds),
    buildGeometryViewportPb(request.includeOverviewGeometry),
    '!50s',
  ].join('');
  const query = new URLSearchParams({
    authuser: '0',
    hl: request.language,
    gl: request.region,
  });
  const url = `${GOOGLE_MAPS_PREVIEW_DIRECTIONS_ENDPOINT}?${query.toString()}&pb=${pb}`;
  return {
    url,
    pb,
    modeCode,
    timeKindEnum: time.timeKindEnum,
    googleMapsEpochSeconds: time.googleMapsEpochSeconds,
    timeZone: time.timeZone,
    featureProfile: request.featureProfile,
  };
}

function buildGeometryViewportPb(includeOverviewGeometry: boolean): string {
  if (!includeOverviewGeometry) return '';
  return (
    '!20m28' +
    '!1m6!1m2!1i0!2i0!2m2!1i530!2i1376' +
    '!1m6!1m2!1i2494!2i0!2m2!1i2544!2i1376' +
    '!1m6!1m2!1i0!2i0!2m2!1i2544!2i20' +
    '!1m6!1m2!1i0!2i1356!2m2!1i2544!2i1376' +
    '!27b1!28m0!40i783!47m2!8b1!10e2'
  );
}

function stripXssi(text: string): string {
  return text.startsWith(GOOGLE_MAPS_PREVIEW_XSSI_PREFIX) ? text.slice(GOOGLE_MAPS_PREVIEW_XSSI_PREFIX.length) : text;
}

function parseJsonResponse(text: string): unknown[] {
  try {
    const parsed = JSON.parse(stripXssi(text));
    if (!Array.isArray(parsed)) throw new Error('Unexpected Google Maps preview response shape');
    return parsed;
  } catch (err) {
    throw makeHttpError(
      502,
      `Unable to parse Google Maps preview response: ${err instanceof Error ? err.message : 'invalid JSON'}`,
    );
  }
}

function tupleDistance(value: unknown): GoogleMapsPreviewDirectionsDistance {
  return Array.isArray(value)
    ? { meters: finiteNumber(value[0]) ? value[0] : null, text: typeof value[1] === 'string' ? value[1] : null }
    : { meters: null, text: null };
}

function tupleDuration(value: unknown): GoogleMapsPreviewDirectionsDuration {
  return Array.isArray(value)
    ? { seconds: finiteNumber(value[0]) ? value[0] : null, text: typeof value[1] === 'string' ? value[1] : null }
    : { seconds: null, text: null };
}

function tupleTime(value: unknown): GoogleMapsPreviewDirectionsTime | null {
  if (!Array.isArray(value)) return null;
  return {
    epochSeconds: finiteNumber(value[0]) ? value[0] : 0,
    timeZone: typeof value[1] === 'string' ? value[1] : undefined,
    text: typeof value[2] === 'string' ? value[2] : undefined,
    utcOffsetSeconds: finiteNumber(value[3]) ? value[3] : undefined,
    roundedEpochSeconds: finiteNumber(value[4]) ? value[4] : undefined,
  };
}

function tupleFare(value: unknown): GoogleMapsPreviewDirectionsFare | null {
  if (!Array.isArray(value)) return null;
  return {
    amount: finiteNumber(value[0]) ? value[0] : null,
    text: typeof value[1] === 'string' ? value[1] : null,
    currency: typeof value[2] === 'string' ? value[2] : null,
  };
}

function normalizeGoogleUrl(value: string): string {
  return value.startsWith('//') ? `https:${value}` : value;
}

function collectUrls(value: unknown, urls = new Set<string>()): Set<string> {
  if (typeof value === 'string' && /^https?:\/\/|^\/\//.test(value)) {
    urls.add(normalizeGoogleUrl(value));
    return urls;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, urls);
  }
  return urls;
}

function parseIcon(value: unknown): GoogleMapsPreviewDirectionsIcon | null {
  if (!Array.isArray(value)) return null;
  const name = typeof value[1] === 'string' ? value[1] : null;
  const label = typeof value[3] === 'string' ? value[3] : null;
  const urls = [...collectUrls(value)];
  if (!name && !label && urls.length === 0) return null;
  return { name, label, urls };
}

function parseWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (Array.isArray(item) && typeof item[1] === 'string' ? item[1] : null))
    .filter((item): item is string => Boolean(item));
}

function advisoryKind(text: string, code: number | null): GoogleMapsPreviewDirectionsAdvisory['kind'] {
  const normalized = text.toLowerCase();
  if (code === 2 || normalized.includes('toll')) return 'toll';
  if (code === 18 || normalized.includes('ferry')) return 'ferry';
  if (normalized.includes('traffic') || normalized.includes('delay')) return 'traffic';
  return 'other';
}

function parseAdvisories(value: unknown, includeRaw: boolean): GoogleMapsPreviewDirectionsAdvisory[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!Array.isArray(item) || typeof item[1] !== 'string') return null;
      const text = item[1];
      const code = finiteNumber(item[8]) ? item[8] : null;
      const advisory: GoogleMapsPreviewDirectionsAdvisory = {
        text,
        code,
        kind: advisoryKind(text, code),
        iconUrls: [...collectUrls(item[14])],
        ...(includeRaw ? { raw: item } : {}),
      };
      return advisory;
    })
    .filter((item): item is GoogleMapsPreviewDirectionsAdvisory => item !== null);
}

function parseTransitAgencies(value: unknown): GoogleMapsPreviewTransitAgency[] {
  const agencies = Array.isArray(value) && Array.isArray(value[4]) ? value[4] : [];
  return agencies
    .map((agency) => {
      if (!Array.isArray(agency) || typeof agency[0] !== 'string') return null;
      const website = Array.isArray(agency[7]) && typeof agency[7][0] === 'string' ? agency[7][0] : null;
      const fareUrl = Array.isArray(agency[8]) && typeof agency[8][0] === 'string' ? agency[8][0] : null;
      return {
        name: agency[0],
        phone: typeof agency[4] === 'string' ? agency[4] : null,
        website,
        fareUrl,
      };
    })
    .filter((agency): agency is GoogleMapsPreviewTransitAgency => agency !== null);
}

function firstNestedText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() && !/^https?:\/\/|^\/\//.test(value)) return value;
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const found = firstNestedText(item);
    if (found) return found;
  }
  return null;
}

function firstSummaryLabel(value: unknown): string | null {
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null;
}

function parseTransitSummary(value: unknown): {
  lineName: string | null;
  serviceName: string | null;
  serviceShortName: string | null;
  headsign: string | null;
  vehicleType: string | null;
  vehicleIcon: GoogleMapsPreviewDirectionsIcon | null;
  color: string | null;
  textColor: string | null;
} {
  const result = {
    lineName: null as string | null,
    serviceName: null as string | null,
    serviceShortName: null as string | null,
    headsign: null as string | null,
    vehicleType: null as string | null,
    vehicleIcon: null as GoogleMapsPreviewDirectionsIcon | null,
    color: null as string | null,
    textColor: null as string | null,
  };

  if (!Array.isArray(value)) return result;
  for (const item of value) {
    if (!Array.isArray(item)) continue;
    const code = finiteNumber(item[0]) ? item[0] : null;
    const labelParts = Array.isArray(item[1]) ? item[1] : [];
    const label = firstSummaryLabel(labelParts);
    const icon = parseIcon(item[2]);
    if (icon && !result.vehicleIcon) {
      result.vehicleIcon = icon;
      result.vehicleType = icon.label;
    }
    if (code === 5 && label && !result.lineName) {
      result.lineName = label;
      result.color = typeof labelParts[2] === 'string' ? labelParts[2] : null;
      result.textColor = typeof labelParts[3] === 'string' ? labelParts[3] : null;
    } else if (code === 6 && label) {
      result.serviceName = label;
    } else if (code === 15 && label) {
      result.serviceShortName = label;
    } else if (code === 7 && label) {
      result.headsign = label;
    }
  }

  return result;
}

function parseTransitStop(value: unknown, includeRaw: boolean): GoogleMapsPreviewTransitStop | null {
  if (!Array.isArray(value) || typeof value[0] !== 'string') return null;
  const coords = Array.isArray(value[4]) ? value[4] : [];
  const platform = typeof value[5] === 'string' ? value[5] : finiteNumber(value[5]) ? String(value[5]) : null;
  return {
    name: value[0],
    stationCode: typeof value[1] === 'string' ? value[1] : null,
    platform,
    dataId: typeof value[6] === 'string' ? value[6] : null,
    lat: finiteNumber(coords[2]) ? coords[2] : null,
    lng: finiteNumber(coords[3]) ? coords[3] : null,
    arrivalTime: tupleTime(value[2]) ?? tupleTime(value[7]),
    departureTime: tupleTime(value[3]) ?? tupleTime(value[8]),
    icon: parseIcon(value[15]),
    ...(includeRaw ? { raw: value } : {}),
  };
}

function parseTransitDetails(
  header: unknown[],
  detail: unknown,
  includeRaw: boolean,
): GoogleMapsPreviewTransitDetails | null {
  if (header[0] !== 3) return null;
  if (!Array.isArray(detail)) return null;
  const summary = parseTransitSummary(header[14]);
  const agencies = parseTransitAgencies(header[6]);
  const serviceLabels = Array.isArray(detail[5]) ? detail[5] : [];
  const detailVehicleIcon = Array.isArray(detail[22]) ? parseIcon(detail[22][2]) : null;
  const intermediateStops = Array.isArray(detail[7])
    ? detail[7]
        .map((stop) => parseTransitStop(stop, includeRaw))
        .filter((stop): stop is GoogleMapsPreviewTransitStop => stop !== null)
    : [];

  return {
    lineName: summary.lineName,
    serviceName: summary.serviceName ?? (typeof serviceLabels[1] === 'string' ? serviceLabels[1] : null),
    serviceShortName: summary.serviceShortName ?? (typeof serviceLabels[0] === 'string' ? serviceLabels[0] : null),
    headsign: summary.headsign,
    vehicleType: summary.vehicleType ?? detailVehicleIcon?.label ?? null,
    vehicleIcon: summary.vehicleIcon ?? detailVehicleIcon,
    color: typeof detail[3] === 'string' ? detail[3] : summary.color,
    textColor: summary.textColor,
    stopCount: finiteNumber(detail[2]) ? detail[2] : null,
    agencies,
    departureStop: parseTransitStop(detail[0], includeRaw),
    arrivalStop: parseTransitStop(detail[1], includeRaw),
    intermediateStops,
    ...(includeRaw ? { raw: detail } : {}),
  };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function instructionText(value: string | null): string | null {
  if (!value) return null;
  return (
    decodeEntities(
      value
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ) || null
  );
}

function maneuver(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/maneuver='([^']+)'/);
  return match?.[1] ?? null;
}

function parseStep(value: unknown, includeRaw: boolean): GoogleMapsPreviewDirectionsStep {
  const header = Array.isArray(value) && Array.isArray(value[0]) ? value[0] : [];
  const html = typeof header[1] === 'string' && header[1].trim() ? header[1] : null;
  return {
    instructionHtml: html,
    instructionText: instructionText(html),
    maneuver: maneuver(html),
    distance: tupleDistance(header[2]),
    duration: tupleDuration(header[3]),
    advisories: parseAdvisories(header[9], includeRaw),
    ...(includeRaw ? { raw: value } : {}),
  };
}

function parseLeg(value: unknown, includeSteps: boolean, includeRaw: boolean): GoogleMapsPreviewDirectionsLeg {
  const leg = Array.isArray(value) ? value : [];
  const header = Array.isArray(leg[0]) ? leg[0] : [];
  const steps = includeSteps && Array.isArray(leg[1]) ? leg[1].map((step) => parseStep(step, includeRaw)) : [];
  const departureTime = Array.isArray(header[5]) ? tupleTime(header[5][0]) : null;
  const arrivalTime = Array.isArray(header[5]) ? tupleTime(header[5][1]) : null;
  return {
    distance: tupleDistance(header[2]),
    duration: tupleDuration(header[3]),
    fare: tupleFare(header[11]),
    advisories: parseAdvisories(header[9], includeRaw),
    departureTime,
    arrivalTime,
    transit: parseTransitDetails(header, leg[5], includeRaw),
    steps,
    ...(includeRaw ? { raw: value } : {}),
  };
}

function parseLegs(route: unknown, includeSteps: boolean, includeRaw: boolean): GoogleMapsPreviewDirectionsLeg[] {
  const routeItems = Array.isArray(route) ? route : [];
  const containers = Array.isArray(routeItems[1]) ? routeItems[1] : [];
  return containers.flatMap((container) => {
    const legs = Array.isArray(container) && Array.isArray(container[1]) ? container[1] : [];
    return legs.map((leg) => parseLeg(leg, includeSteps, includeRaw));
  });
}

function parseTraffic(value: unknown): GoogleMapsPreviewDirectionsTraffic | null {
  if (!Array.isArray(value)) return null;
  const range = Array.isArray(value[4])
    ? {
        minSeconds: finiteNumber(value[4][0]) ? value[4][0] : null,
        maxSeconds: finiteNumber(value[4][1]) ? value[4][1] : null,
        text: typeof value[4][2] === 'string' ? value[4][2] : null,
      }
    : null;
  return {
    duration: tupleDuration(value[0]),
    noTrafficDuration: tupleDuration(value[3]),
    range,
    arrivalTime: tupleTime(value[7]),
  };
}

function parseTrafficEvents(value: unknown, includeRaw: boolean): GoogleMapsPreviewDirectionsTrafficEvent[] {
  const events = Array.isArray(value) && Array.isArray(value[3]) ? value[3] : [];
  return events
    .map((event) => {
      if (!Array.isArray(event)) return null;
      const details = Array.isArray(event[21]) ? event[21] : [];
      const title = firstNestedText(event[19]);
      const trafficEvent: GoogleMapsPreviewDirectionsTrafficEvent = {
        type: firstNestedText(details[18]) ?? title,
        title,
        description: firstNestedText(event[20]),
        typeCode: finiteNumber(event[8]) ? event[8] : null,
        delay: Array.isArray(details[0]) ? tupleDuration(details[0]) : null,
        distance: tupleDistance(details[1]),
        reportedAgo: Array.isArray(details[8]) ? tupleDuration(details[8]) : null,
        updatedAgo: Array.isArray(details[10]) ? tupleDuration(details[10]) : null,
        updatedTime: tupleTime(details[24]),
        iconUrls: [...collectUrls(event[14])],
        ...(includeRaw ? { raw: event } : {}),
      };
      return trafficEvent;
    })
    .filter((event): event is GoogleMapsPreviewDirectionsTrafficEvent => event !== null);
}

function decodeOverviewGeometry(value: unknown): Array<{ lat: number; lng: number }> | undefined {
  if (!Array.isArray(value) || !Array.isArray(value[0]) || !Array.isArray(value[1])) return undefined;
  const latDeltas = value[0];
  const lngDeltas = value[1];
  const count = Math.min(latDeltas.length, lngDeltas.length);
  const points: Array<{ lat: number; lng: number }> = [];
  let lat = 0;
  let lng = 0;
  for (let i = 0; i < count; i++) {
    if (!finiteNumber(latDeltas[i]) || !finiteNumber(lngDeltas[i])) continue;
    lat += latDeltas[i];
    lng += lngDeltas[i];
    points.push({ lat: lat / 1e7, lng: lng / 1e7 });
  }
  return points.length ? points : undefined;
}

function parseRoute(
  value: unknown,
  index: number,
  overviewGeometry: unknown,
  includeSteps: boolean,
  includeRaw: boolean,
): GoogleMapsPreviewDirectionsRoute {
  const route = Array.isArray(value) ? value : [];
  const header = Array.isArray(route[0]) ? route[0] : [];
  const modeCode = finiteNumber(header[0]) ? header[0] : null;
  const traffic = parseTraffic(header[10]);
  const departureTime = Array.isArray(header[5]) ? tupleTime(header[5][0]) : null;
  const arrivalTime = Array.isArray(header[5]) ? tupleTime(header[5][1]) : (traffic?.arrivalTime ?? null);
  return {
    index,
    mode: modeCode !== null ? (ENUM_TO_MODE[modeCode] ?? 'unknown') : 'unknown',
    modeCode,
    title: typeof header[1] === 'string' ? header[1] : null,
    distance: tupleDistance(header[2]),
    duration: tupleDuration(header[3]),
    fare: tupleFare(header[11]),
    traffic,
    trafficEvents: parseTrafficEvents(route[3], includeRaw),
    departureTime,
    arrivalTime,
    warnings: parseWarnings(header[9]),
    advisories: parseAdvisories(header[9], includeRaw),
    transitAgencies: parseTransitAgencies(header[6]),
    legs: parseLegs(route, includeSteps, includeRaw),
    overviewGeometry: decodeOverviewGeometry(overviewGeometry),
    ...(includeRaw ? { raw: value } : {}),
  };
}

export function parseGoogleMapsPreviewDirectionsResponse(
  text: string,
  request: GoogleMapsPreviewDirectionsRequest | unknown = {},
  built?: BuiltPreviewRequest,
): GoogleMapsPreviewDirectionsResult {
  const normalized = normalizeGoogleMapsPreviewDirectionsRequest(request);
  const parsed = parseJsonResponse(text);
  const root = Array.isArray(parsed[0]) ? parsed[0] : [];
  const routesRaw = Array.isArray(root[1]) ? root[1] : [];
  const geometryRaw = Array.isArray(root[7]) ? root[7] : [];
  const modeCode = built?.modeCode ?? normalized.internal?.modeEnum ?? MODE_TO_ENUM[normalized.mode];
  const time = built
    ? {
        googleMapsEpochSeconds: built.googleMapsEpochSeconds,
        timeKindEnum: built.timeKindEnum,
        timeZone: built.timeZone,
      }
    : buildTime(normalized);

  return {
    source: 'google-preview-directions',
    mode: ENUM_TO_MODE[modeCode] ?? 'unknown',
    modeCode,
    language: normalized.language,
    region: normalized.region,
    routes: routesRaw.map((route, index) =>
      parseRoute(route, index, geometryRaw[index], normalized.includeSteps, normalized.includeRaw === true),
    ),
    encodedTime: time,
    ...(normalized.includeDebug && built
      ? {
          debug: {
            url: built.url,
            pb: built.pb,
            featureProfile: built.featureProfile,
          },
        }
      : {}),
    ...(normalized.includeRaw ? { raw: parsed } : {}),
  };
}

export async function fetchGoogleMapsPreviewDirections(
  input: GoogleMapsPreviewDirectionsRequest | unknown,
): Promise<GoogleMapsPreviewDirectionsResult> {
  const normalized = normalizeGoogleMapsPreviewDirectionsRequest(input);
  const built = buildGoogleMapsPreviewDirectionsUrl(normalized);
  const cachedText = getCachedResponseText(built.url);
  if (cachedText) {
    return parseGoogleMapsPreviewDirectionsResponse(cachedText, normalized, built);
  }

  const existingRequest = inFlightResponseText.get(built.url);
  if (existingRequest) {
    const text = await existingRequest;
    return parseGoogleMapsPreviewDirectionsResponse(text, normalized, built);
  }

  const requestText = fetchGoogleMapsPreviewDirectionsText(normalized, built);
  inFlightResponseText.set(built.url, requestText);
  try {
    const text = await requestText;
    setCachedResponseText(built.url, text);
    return parseGoogleMapsPreviewDirectionsResponse(text, normalized, built);
  } finally {
    inFlightResponseText.delete(built.url);
  }
}

async function fetchGoogleMapsPreviewDirectionsText(
  normalized: NormalizedRequest,
  built: BuiltPreviewRequest,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), normalized.timeoutMs);

  let response: Response;
  try {
    response = await fetch(built.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': `${normalized.language},en;q=0.9`,
        Referer: 'https://www.google.com/',
        'x-maps-diversion-context-bin': 'CAE=',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      throw makeHttpError(504, 'Google Maps preview directions request timed out');
    }
    throw makeHttpError(
      502,
      `Google Maps preview directions request failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  if (!response.ok) {
    throw makeHttpError(
      response.status,
      `Google Maps preview directions error: ${response.status} ${response.statusText}`,
    );
  }

  return text;
}
