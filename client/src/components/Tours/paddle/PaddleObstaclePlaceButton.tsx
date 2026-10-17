import type { PaddleGeometry, PaddleObstacleKind } from '@trek/shared';
import { MapPinPlus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';

/** Where a paddler gets in or out: these places can become a waypoint from their card. */
const PLACEABLE: Partial<Record<PaddleObstacleKind, 'put_in' | 'egress'>> = {
  put_in: 'put_in',
  slipway: 'put_in',
  egress: 'egress',
};

/**
 * The spot a waypoint goes to: the place itself, the middle of a way (a
 * slipway drawn as a ramp), or the middle of an area's outline.
 */
export function placeOf(geometry: PaddleGeometry): { lat: number; lng: number } | null {
  const line =
    geometry.type === 'Point'
      ? [geometry.coordinates]
      : geometry.type === 'LineString'
        ? geometry.coordinates
        : geometry.coordinates[0];
  if (!line?.length) return null;
  if (geometry.type === 'Polygon') {
    const ring = line.slice(0, -1);
    const lng = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
    const lat = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
    return { lat, lng };
  }
  const [lng, lat] = line[Math.floor((line.length - 1) / 2)] ?? [];
  return lat === undefined || lng === undefined ? null : { lat, lng };
}

/**
 * PAD-05B: a put-in, a slipway or an egress taken over as the tour's next
 * waypoint from its card on the map, so the point sits where the paddler
 * really gets in or out. Set after a portage asked for at the last point, it
 * is where the portage ends.
 */
export function PaddleObstaclePlaceButton({
  kind,
  geometry,
  onPlace,
}: {
  kind: PaddleObstacleKind;
  geometry: PaddleGeometry;
  onPlace: (lat: number, lng: number) => void;
}) {
  const { t } = useTranslation();
  const role = PLACEABLE[kind];
  const spot = role ? placeOf(geometry) : null;
  if (!role || !spot) return null;
  return (
    <button
      type="button"
      data-testid="paddle-obstacle-place"
      onClick={() => onPlace(spot.lat, spot.lng)}
      className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 font-semibold text-accent-text transition-opacity hover:opacity-90"
      style={fs(12, 'body')}
    >
      <MapPinPlus size={14} strokeWidth={2.2} aria-hidden="true" />
      {t(role === 'put_in' ? 'tours.paddle.placeHere.putIn' : 'tours.paddle.placeHere.egress')}
    </button>
  );
}
