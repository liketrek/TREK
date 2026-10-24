import type { PaddleGeometry, PaddleObstacleKind } from '@trek/shared';
import { MapPinPlus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { placeOf } from './paddleObstaclePlace';

/** Where a paddler gets in or out: these places can become a waypoint from their card. */
const PLACEABLE: Partial<Record<PaddleObstacleKind, 'put_in' | 'egress'>> = {
  put_in: 'put_in',
  slipway: 'put_in',
  egress: 'egress',
};

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
