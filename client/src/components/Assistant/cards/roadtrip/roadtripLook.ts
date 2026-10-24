import type { AssistantApplied, DayRouteCard } from '@trek/shared';
import { Flag, Move, Pin, Route, RouteOff, SlidersHorizontal, Spline, TrainFront, Waypoints } from 'lucide-react';

import type { GhostPoint, RouteLineSpec, RouteUse } from '../../../../types/assistantMap';
import type { EntityTarget, PackLook } from '../cardTypes';

/**
 * What the road trip brings to the chat's pure look: the verbs of its
 * changes (vias, settings, day endings, a Google Maps route, a transit
 * connection), the names of its tools and reading steps, what an applied
 * change of the road trip opens (its day on the map, the road trip view on
 * that day), and the look of each of its kinds. A look stays pure, icons and
 * literals only: the chat's main chunk reads every look, so whatever a look
 * imports ships with it.
 */

/** The road trip on the day a change touched; the planner switches its road trip view on for it. */
export function roadtripTarget(applied: Pick<AssistantApplied, 'dayId'>): EntityTarget {
  return applied.dayId === null
    ? { kind: 'tab', tab: 'roadtrip' }
    : { kind: 'tab', tab: 'roadtrip', params: { day: String(applied.dayId) } };
}

/** The spots a waiting day route marks on the map: its new stops as pins, the vias it adds or moves as points. */
export function dayRouteGhosts(card: DayRouteCard): GhostPoint[] {
  const stops = card.stops.flatMap((stop, index): GhostPoint[] =>
    stop.added ? [{ id: `stop:${index}`, lat: stop.lat, lng: stop.lng, name: stop.name, variant: 'pin' }] : []
  );
  const vias = card.vias.flatMap((via, index): GhostPoint[] =>
    via.state === 'removed'
      ? []
      : [{ id: `via:${index}`, lat: via.lat, lng: via.lng, name: card.afterName ?? '', variant: 'point' }]
  );
  return [...stops, ...vias];
}

/** Where a waiting via move goes: a dashed line from where it stands to where it will. */
export function dayRouteLines(card: DayRouteCard, use: RouteUse): RouteLineSpec[] {
  if (use !== 'pending') return [];
  const moves = card.vias.flatMap((via): [number, number][][] =>
    via.state === 'moved' && via.from ? [[via.from, [via.lat, via.lng]]] : []
  );
  return moves.length > 0 ? [{ id: 'via-moves', lines: moves, color: 'var(--accent)', dashed: true }] : [];
}

export const ROADTRIP_LOOK = {
  verbs: {
    addRouteVia: { Icon: Waypoints, tone: 'success', labelKey: 'assistant.change.verb.addRouteVia' },
    shapeRoute: { Icon: Spline, tone: 'info', labelKey: 'assistant.change.verb.shapeRoute' },
    moveRouteVia: { Icon: Move, tone: 'warning', labelKey: 'assistant.change.verb.moveRouteVia' },
    removeRouteVia: { Icon: RouteOff, tone: 'danger', labelKey: 'assistant.change.verb.removeRouteVia' },
    repinRouteVias: { Icon: Pin, tone: 'info', labelKey: 'assistant.change.verb.repinRouteVias' },
    updateDriveSettings: {
      Icon: SlidersHorizontal,
      tone: 'info',
      labelKey: 'assistant.change.verb.updateDriveSettings',
    },
    setDayBoundary: { Icon: Flag, tone: 'info', labelKey: 'assistant.change.verb.setDayBoundary' },
    importRoute: { Icon: Route, tone: 'success', labelKey: 'assistant.change.verb.importRoute' },
    addTransit: { Icon: TrainFront, tone: 'success', labelKey: 'assistant.change.verb.addTransit' },
  },
  tools: {
    add_route_via: { labelKey: 'assistant.tool.add_route_via' },
    add_route_vias: { labelKey: 'assistant.tool.add_route_vias' },
    update_route_via: { labelKey: 'assistant.tool.update_route_via' },
    remove_route_via: { labelKey: 'assistant.tool.remove_route_via' },
    reanchor_route_vias: { labelKey: 'assistant.tool.reanchor_route_vias' },
    update_roadtrip_settings: { labelKey: 'assistant.tool.update_roadtrip_settings' },
    set_day_boundary: { labelKey: 'assistant.tool.set_day_boundary' },
    import_google_maps_route: { labelKey: 'assistant.tool.import_google_maps_route' },
    preview_google_maps_route: { labelKey: 'assistant.tool.preview_google_maps_route' },
    create_transit_journey: { labelKey: 'assistant.tool.create_transit_journey' },
  },
  steps: {
    calculate_roadtrip: { stepKey: 'assistant.step.roadtrip' },
    search_roadtrip_corridor: { stepKey: 'assistant.step.corridor' },
    get_roadtrip_charging_info: { stepKey: 'assistant.step.charging' },
    lookup_roadtrip_charging_info: { stepKey: 'assistant.step.charging' },
    search_transit_routes: { stepKey: 'assistant.step.transit' },
  },
  entities: {
    roadtrip: {
      Icon: Route,
      openLabelKey: 'assistant.card.roadtrip.open',
      onMap: (applied) => (applied.dayId === null ? null : { placeId: null, dayId: applied.dayId }),
      open: (applied) => roadtripTarget(applied),
    },
  },
  cards: {
    // A charger checked beside a drive joins the drive's card, in the row of its stop.
    roadtrip: {
      group: () => 'drive',
      followUps: [
        { id: 'chargers', labelKey: 'assistant.followUp.chargers' },
        { id: 'stays', labelKey: 'assistant.followUp.stays' },
      ],
    },
    charging: { group: () => 'drive' },
    corridor: { followUps: [{ id: 'corridorMore', labelKey: 'assistant.followUp.corridorMore' }] },
    transit: {
      followUps: [
        { id: 'laterTransit', labelKey: 'assistant.followUp.laterTransit' },
        { id: 'addTransit', labelKey: 'assistant.followUp.addTransit', edits: true },
      ],
    },
    dayRoute: { ghosts: dayRouteGhosts, lines: dayRouteLines },
    roadtripRules: {},
  },
} satisfies PackLook<'roadtrip' | 'corridor' | 'charging' | 'transit' | 'dayRoute' | 'roadtripRules'>;
