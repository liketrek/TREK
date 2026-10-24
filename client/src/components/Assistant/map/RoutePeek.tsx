import { X } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '../../../i18n';
import { chatOf, useAssistantStore } from '../../../store/assistantStore';
import { variantPaintCss } from '../../Tours/planner/legVariantPaint';
import { VariantMark } from '../../Tours/planner/mapCardParts';
import { type AssistantView, AssistantViewContext, useAssistantView } from '../assistantViewContext';
import { TourGrade, TourRouteFigures } from '../cards/tour/TourRouteHead';
import { profileSamples, WAY_KEYS } from '../cards/tour/tourRouteModel';
import TourRouteProfile from '../cards/tour/TourRouteProfile';
import { routeName } from '../cards/tour/tourRouteWords';
import { useRouteFocus } from '../cards/tour/useTourRouteCard';
import { moveRoutePeek } from './routePeekControl';
import { type PeekRoute, peekRoute } from './routePeekModel';

/** The peek's body, for the route found: its ways, its name and figures, its profile and the way to close it. */
function PeekBody({ route }: { route: PeekRoute }) {
  const { t } = useTranslation();
  const { tripId } = useAssistantView();
  const { entry, ways, blockKey } = route;
  const { card, toolCallId } = entry;
  const pick = useAssistantStore((s) => s.pick);
  const shown = useRouteFocus(toolCallId);
  const samples = useMemo(() => profileSamples(card), [card]);
  const index = ways.findIndex((way) => way.toolCallId === toolCallId);
  const color = variantPaintCss(index >= 0 ? (WAY_KEYS[index] ?? 'a') : 'current');
  const name = routeName(card, t);
  const waysLabel = t('assistant.card.tour.ways', { count: ways.length });

  return (
    <section
      aria-label={name}
      data-testid="route-peek"
      className="trek-assistant-enter absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+142px)] z-[42] rounded-2xl border border-edge-faint bg-surface-elevated px-3 pb-3 pt-2 shadow-elevated backdrop-blur-2xl"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 pt-1.5">
          <h3 className="m-0 line-clamp-2 text-body font-semibold leading-tight text-content">
            <bdi>{name}</bdi>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <TourGrade card={card} />
            <TourRouteFigures card={card} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => moveRoutePeek(tripId, null)}
          aria-label={t('assistant.card.tour.peekClose')}
          className="-me-1.5 grid h-11 w-11 flex-none place-items-center rounded-full text-content-secondary hover:bg-surface-hover"
        >
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      {ways.length > 0 && (
        <div role="group" aria-label={waysLabel} className="mt-1 flex items-center gap-1">
          {ways.map((way, position) => {
            const key = WAY_KEYS[position] ?? 'a';
            const letter = key.toUpperCase();
            const chosen = way.toolCallId === toolCallId;
            return (
              <button
                key={way.toolCallId}
                type="button"
                aria-pressed={chosen}
                aria-label={way.card.label ?? t('tours.variants.option', { letter })}
                onClick={() => {
                  pick(tripId, blockKey, way.toolCallId);
                  moveRoutePeek(tripId, way.toolCallId);
                }}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-hover"
              >
                <VariantMark variant={{ key, current: false }} chosen={chosen} />
              </button>
            );
          })}
        </div>
      )}
      <TourRouteProfile
        toolCallId={toolCallId}
        card={card}
        samples={samples}
        color={color}
        focus={shown.focus}
        onFocus={shown.setFocus}
      />
    </section>
  );
}

/** Finds the route the peek is open on in this trip's chat; nothing while it is closed or the route is gone. */
function PeekFinder() {
  const { tripId } = useAssistantView();
  const toolCallId = useAssistantStore((s) => (s.routePeek?.tripId === tripId ? s.routePeek.toolCallId : null));
  const messages = useAssistantStore((s) => chatOf(s, tripId).messages);
  const route = useMemo(() => (toolCallId ? peekRoute(messages, toolCallId) : null), [messages, toolCallId]);
  return route ? <PeekBody route={route} /> : null;
}

interface RoutePeekProps {
  tripId: number;
  onOpen: NonNullable<AssistantView['onOpen']>;
  onFocusDay: NonNullable<AssistantView['onFocusDay']>;
  onRevealMap: NonNullable<AssistantView['onRevealMap']>;
}

/**
 * The phone's peek at a route over the map, while the chat stands aside:
 * opened by "On map" on a route card or a tap on a route line. It shows the
 * route as its card does in brief (name, grade, figures) and its height
 * profile with the readout under it, a finger scrubbing along it while the
 * map's pin follows; the ways of an answer as their marks, 44 px targets, a
 * tap choosing one as the card's choice does; and a close button. The map
 * stays usable around it, and the chat's pill below brings the chat back.
 */
export default function RoutePeek({ tripId, onOpen, onFocusDay, onRevealMap }: RoutePeekProps) {
  const view = useMemo<AssistantView>(
    () => ({ tripId, variant: 'fullscreen', density: 'compact', onOpen, onFocusDay, onRevealMap }),
    [tripId, onOpen, onFocusDay, onRevealMap]
  );
  return (
    <AssistantViewContext.Provider value={view}>
      <PeekFinder />
    </AssistantViewContext.Provider>
  );
}
