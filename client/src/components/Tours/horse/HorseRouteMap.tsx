import type { HorseRoute } from '@trek/shared';
import { useMemo } from 'react';
import { OFM_POSITRON } from '../../../constants/mapDefaults';
import { useTileUrl } from '../../../hooks/useTileUrl';
import { useTranslation } from '../../../i18n';
import { MapViewAuto } from '../../Map/MapViewAuto';
import { useHorsePaint } from './horsePaint';
import type { HorseSectionLeg } from './horseSection';

type Line = [number, number][];

/**
 * HOR-01: the route in the dialog that takes a section of it: the ride so far
 * in the planner's blue, every section of the route in its brown, and the one
 * chosen over them in the accent, from A to B in the direction chosen. The map
 * frames the chosen section and the end of the ride, so a gap between them
 * shows before anything is taken.
 */
export function HorseRouteMap({
  route,
  chosen,
  ride,
}: {
  route: HorseRoute;
  chosen: HorseSectionLeg | null;
  /** The ride as the planner draws it now, or null while it has no line. */
  ride: Line | null;
}) {
  const { t } = useTranslation();
  const tileUrl = useTileUrl(OFM_POSITRON);
  const paint = useHorsePaint();
  const drawn = useMemo(() => {
    const sections = route.sections.map((section) =>
      section.geometry.map(([lat, lng]): [number, number] => [lat, lng])
    );
    const chosenLine = chosen?.geometry.map(([lat, lng]): [number, number] => [Number(lat), Number(lng)]) ?? null;
    const sectionColor = { line: paint.section, casing: paint.casing };
    return {
      lines: [...(ride ? [ride] : []), ...sections, ...(chosenLine ? [chosenLine] : [])],
      colors: [
        ...(ride ? [undefined] : []),
        ...sections.map(() => sectionColor),
        ...(chosenLine ? [{ line: paint.chosen, casing: paint.casing }] : []),
      ],
      focus: [...(chosenLine ?? sections.flat()), ...(ride ? ride.slice(-1) : [])],
    };
  }, [chosen, paint, ride, route]);
  const chosenGeometry = chosen?.geometry ?? [];
  const first = chosenGeometry[0];
  const last = chosenGeometry[chosenGeometry.length - 1];
  const pin = (id: string, at: readonly unknown[], label: string, detail: string) => ({
    id,
    lat: Number(at[0]),
    lng: Number(at[1]),
    label,
    detail,
  });
  const ends =
    first && last
      ? [
          pin('horse-section-start', first, 'A', t('tours.planner.start')),
          pin('horse-section-end', last, 'B', t('tours.planner.end')),
        ]
      : [];
  return (
    <div
      data-testid="horse-route-map"
      className="relative h-[240px] flex-none overflow-hidden rounded-[14px] border border-edge-faint"
    >
      <MapViewAuto
        places={[]}
        route={drawn.lines}
        routeColors={drawn.colors}
        tileUrl={tileUrl}
        focusPoints={drawn.focus}
        focusKey={`${route.id}:${first?.join(',') ?? ''}`}
        followSelection={false}
        plannerWaypoints={ends}
      />
    </div>
  );
}
