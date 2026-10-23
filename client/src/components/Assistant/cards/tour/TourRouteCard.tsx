import type { TourRouteCard as Route } from '@trek/shared';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import type { DistanceIndexedProfileSample } from '../../../../utils/routeGeometry';
import { variantPaintCss } from '../../../Tours/planner/legVariantPaint';
import { useAssistantView } from '../../assistantViewContext';
import CardFrame from '../parts/CardFrame';
import TourRouteActions from './TourRouteActions';
import TourRouteDay from './TourRouteDay';
import TourRouteHead from './TourRouteHead';
import { profileSamples } from './tourRouteModel';
import { TourRouteProblem, TourRouteWarnings } from './TourRouteNotes';
import TourRouteProfile from './TourRouteProfile';
import TourRouteStops from './TourRouteStops';
import { routeName } from './tourRouteWords';
import { useTourRouteCard } from './useTourRouteCard';

/**
 * One route in the chat, the way the Tours tab shows a hike: drawn small
 * beside its name, its grade and figures, its height profile, its stops along
 * the way, its day with the sun and the weather, what to look out for, and
 * the ways onward ("On map", "Plan this", "Open in Tours"). Resting on the
 * card lights its line on the map; resting on the line lights the card.
 */

/** Everything under a route's head, shared by a single route and the chosen way of a ways card. */
export function TourRouteBody({
  toolCallId,
  card,
  route,
  color,
  compare,
  letter,
}: {
  toolCallId: string;
  card: Route;
  route: ReturnType<typeof useTourRouteCard>;
  color: string;
  compare?: ReadonlyArray<{ key: string; samples: readonly DistanceIndexedProfileSample[]; color: string }>;
  letter?: string;
}) {
  const samples = useMemo(() => profileSamples(card), [card]);
  return (
    <>
      <TourRouteProfile
        toolCallId={toolCallId}
        card={card}
        samples={samples}
        color={color}
        focus={route.focus}
        onFocus={route.setFocus}
        compare={compare}
      />
      <TourRouteStops card={card} samples={samples} onFocus={route.setFocus} />
      <TourRouteDay card={card} />
      <TourRouteWarnings card={card} />
      <TourRouteProblem card={card} />
      <TourRouteActions toolCallId={toolCallId} card={card} letter={letter} onShow={route.showOnMap} />
    </>
  );
}

export default function TourRouteCard({ toolCallId, card }: { toolCallId: string; card: Route }) {
  const { t } = useTranslation();
  const { density } = useAssistantView();
  const route = useTourRouteCard(toolCallId, card);
  return (
    <div {...route.handlers} className={`rounded-xl ${route.litFromMap ? 'ring-1 ring-accent' : ''}`}>
      <CardFrame label={routeName(card, t)}>
        <TourRouteHead card={card} sketchHeight={density === 'roomy' ? 64 : 56} onShow={route.showOnMap} />
        <TourRouteBody toolCallId={toolCallId} card={card} route={route} color={variantPaintCss('current')} />
      </CardFrame>
    </div>
  );
}
