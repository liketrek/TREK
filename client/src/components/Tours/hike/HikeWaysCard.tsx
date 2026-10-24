import { Footprints, Layers, MountainSnow, Signpost } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import { Segmented, type SegmentedOption } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { ReadStatusNotice } from '../ReadStatusNotice';
import { RailCard } from '../tourParts';
import type { HikeFacet } from './hikeFacetSpecs';
import { HikeWaysList } from './HikeWaysList';
import { useHikeWays, type HikeWays } from './useHikeWays';

const ICON = { size: 13, strokeWidth: 2 } as const;

/**
 * MAP-03 and MAP-04: what OpenStreetMap records for the ways along a hike, on
 * the traveller's word. Switched on, the ways under the line are read once
 * and drawn along it on the map by the facet picked: the SAC grade, the
 * surface or the kind of way, three things kept apart, each class with its
 * share; the unknown stays unknown and says why. The routing limit, where the
 * hike was planned with one, sits apart as the setting it is. Nothing here
 * changes the tour. A run (RUN-02) shows its ways in this same card, matched
 * as a run, with what a runner reads first in the card's head.
 */
export function HikeWaysCard({
  tripId,
  route,
  routeCurrent = true,
  routingLimit,
  matching = 'foot',
  aside,
}: {
  tripId: number | string;
  /** The tour's own line, or null while there is none. */
  route: [number, number][] | null;
  /** False while the line is being planned anew. */
  routeCurrent?: boolean;
  /** The routing limit the hike is planned with, or null where it was not routed (an import). */
  routingLimit: number | null;
  /** How the line is matched to the ways: on foot for a hike, as a run for a run. */
  matching?: 'foot' | 'run';
  /** What the card's head shows beside its title, from what has been read. */
  aside?: (ways: HikeWays) => ReactNode;
}) {
  const { t } = useTranslation();
  const ways = useHikeWays({ tripId, route, current: routeCurrent, matching });
  if (!ways.available) return null;
  const facets: SegmentedOption<HikeFacet>[] = [
    { value: 'sac', label: t('tours.hike.ways.facet.sac'), icon: <MountainSnow {...ICON} /> },
    { value: 'surface', label: t('tours.hike.ways.facet.surface'), icon: <Layers {...ICON} /> },
    { value: 'way', label: t('tours.hike.ways.facet.way'), icon: <Signpost {...ICON} /> },
  ];
  return (
    <RailCard
      icon={<Footprints size={14} strokeWidth={2} />}
      title={t('tours.hike.ways.title')}
      foldId={matching === 'run' ? 'run-ways' : 'hike-ways'}
      aside={aside?.(ways)}
    >
      <div data-testid="hike-ways-card" className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="min-w-0 flex-1 text-content-secondary" style={fs(12, 'body')}>
            {t('tours.hike.ways.show')}
          </span>
          <ToggleSwitch on={ways.shown} onToggle={ways.toggle} label={t('tours.hike.ways.show')} />
        </div>
        {ways.shown && (
          <>
            <Segmented<HikeFacet>
              value={ways.facet}
              options={facets}
              onChange={ways.chooseFacet}
              label={t('tours.hike.ways.facets')}
              fill
            />
            <ReadStatusNotice
              status={ways.status}
              messages={{
                loading: t('tours.hike.ways.loading'),
                offline: t('tours.hike.ways.offline'),
                failed: t('tours.hike.ways.failed'),
              }}
              onRetry={ways.retry}
            />
          </>
        )}
        {ways.shown && ways.status === 'ready' && <HikeWaysList ways={ways} limit={routingLimit} />}
      </div>
    </RailCard>
  );
}
