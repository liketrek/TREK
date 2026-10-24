import { OnlineOnlyError } from '../../repo/onlineOnly';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * The zones a day can be cut in: every whole hour from UTC-12 to UTC+14 and
 * the half and three-quarter hours places actually keep (India, Nepal,
 * Newfoundland, Iran, parts of Australia, the Chathams).
 */
const ZONE_OFFSETS = [
  ...Array.from({ length: 27 }, (_, i) => (i - 12) * 60),
  -570,
  -210,
  210,
  270,
  330,
  345,
  390,
  525,
  570,
  630,
  765,
].sort((a, b) => a - b);

/** `UTC+05:30`, `UTC-03:00`, `UTC+00:00`. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, '0');
  const rest = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${rest}`;
}

/** The zone this device is in on that day, so a day abroad in summer gets its summer offset. */
export function deviceOffsetOn(date: string): number {
  return -new Date(`${date}T12:00:00`).getTimezoneOffset();
}

interface ZoneOption {
  value: number;
  label: string;
  badge?: string;
}

/**
 * The zone picker's list, Dawarich's own zone and this device's marked, both
 * kept in the list even when they are no whole or usual offset.
 */
export function zoneOptions(t: Translate, sourceOffset: number | null, deviceOffset: number): ZoneOption[] {
  const offsets = new Set(ZONE_OFFSETS);
  if (sourceOffset !== null) offsets.add(sourceOffset);
  offsets.add(deviceOffset);
  return [...offsets]
    .sort((a, b) => a - b)
    .map((minutes) => {
      const badge =
        minutes === sourceOffset
          ? t('journey.recording.zoneSource')
          : minutes === deviceOffset
            ? t('journey.recording.zoneDevice')
            : undefined;
      return badge
        ? { value: minutes, label: formatOffset(minutes), badge }
        : { value: minutes, label: formatOffset(minutes) };
    });
}

/** The modes Dawarich gives a track, as far as TREK names them; anything else is shown as Dawarich spells it. */
const KNOWN_MODES = new Set([
  'walking',
  'running',
  'cycling',
  'driving',
  'motorcycle',
  'bus',
  'train',
  'flying',
  'boat',
  'stationary',
  'unknown',
]);

export function modeLabel(mode: string, t: Translate): string {
  return KNOWN_MODES.has(mode) ? t(`journey.recording.mode.${mode}`) : mode;
}

/**
 * A failed preview, save or removal in the reader's language. The server
 * names its reason as a code: Dawarich's own reasons have their strings
 * already, the journey's three have theirs.
 */
export function recordingErrorText(err: unknown, t: Translate): string {
  if (err instanceof OnlineOnlyError) return t('dawarich.error.offline');
  const code = recordingErrorCode(err);
  if (code === 'recording_exists' || code === 'recording_changed' || code === 'recording_empty') {
    return t(`journey.recording.error.${code}`);
  }
  return reasonText(code, t);
}

/** A reason Dawarich gave as a code, in the reader's language; one TREK has no words for reads as unknown. */
export function reasonText(code: string | null, t: Translate): string {
  if (code) {
    const key = `dawarich.error.${code}`;
    const text = t(key);
    if (text !== key) return text;
  }
  return t('dawarich.error.unknown');
}

export function recordingErrorCode(err: unknown): string | null {
  const code = (err as { response?: { data?: { code?: unknown } } })?.response?.data?.code;
  return typeof code === 'string' ? code : null;
}

/**
 * The pieces of a day drawn into a box, north up, longitude shortened by the
 * latitude so a walk keeps its shape. Answers one SVG path per piece, never a
 * line between two of them.
 */
export function sketchPaths(
  segments: ReadonlyArray<{ points: ReadonlyArray<readonly unknown[]> }>,
  width: number,
  height: number,
  pad = 8
): { paths: string[]; ends: Array<[number, number]> } {
  const all = segments.flatMap((s) => s.points);
  if (all.length === 0) return { paths: [], ends: [] };
  const lats = all.map((p) => Number(p[0]));
  const lngs = all.map((p) => Number(p[1]));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const shrink = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180) || 1;
  const spanX = Math.max((maxLng - minLng) * shrink, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  const at = (point: readonly unknown[]): [number, number] => [
    Math.round((offX + (Number(point[1]) - minLng) * shrink * scale) * 10) / 10,
    Math.round((offY + (maxLat - Number(point[0])) * scale) * 10) / 10,
  ];
  const paths = segments
    .filter((s) => s.points.length > 1)
    .map((s) =>
      s.points
        .map(at)
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`)
        .join(' ')
    );
  const ends = segments.flatMap((s) => {
    const first = s.points[0];
    const last = s.points[s.points.length - 1];
    return s.points.length > 1 && first && last ? [at(first), at(last)] : [];
  });
  return { paths, ends };
}
