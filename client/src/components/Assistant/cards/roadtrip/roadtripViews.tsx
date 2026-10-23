import type { CardView } from '../cardTypes';
import CorridorCard from './CorridorCard';
import DayRouteBody from './DayRouteBody';
import RoadtripBlock from './RoadtripBlock';
import RulesBody from './RulesBody';
import TransitCard, { TransitBody } from './TransitCard';

/**
 * How the kinds of the road trip draw in the chat: a drive (with the
 * chargers checked beside it) as the road trip's own card and day rail,
 * corridor hits and transit connections as answer cards, and under a change
 * row the day route it bends, the connection it adds or the rules it sets.
 * This file only maps each kind to its view: the components live in sibling
 * files, since a file that exports anything besides components breaks fast
 * refresh, and lint:warnings holds react-refresh/only-export-components at
 * zero for a new file.
 */
export const ROADTRIP_VIEWS = {
  roadtrip: { Block: RoadtripBlock },
  charging: { Block: RoadtripBlock },
  corridor: { Block: CorridorCard },
  transit: { Block: TransitCard, Body: TransitBody },
  dayRoute: { Body: DayRouteBody },
  roadtripRules: { Body: RulesBody },
} satisfies { [K in 'roadtrip' | 'corridor' | 'charging' | 'transit' | 'dayRoute' | 'roadtripRules']: CardView<K> };
