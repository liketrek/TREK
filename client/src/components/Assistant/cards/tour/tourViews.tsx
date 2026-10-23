import type { CardView } from '../cardTypes';
import TourListCard from './TourListCard';
import TourRouteBlock from './TourRouteBlock';
import TourRouteInRow, { TourRouteLead } from './TourRouteInRow';

/**
 * How the kinds of the tours draw in the chat: routes as the Tours tab's own
 * route card (two or three ways of one route as one card to choose from),
 * under a held change the route it adds or changes with the kind of tour as
 * the row's tile, and saved tours as the sidebar's rows. This file only maps
 * each kind to its view: the components live in sibling files, since a file
 * that exports anything besides components breaks fast refresh, and
 * lint:warnings holds react-refresh/only-export-components at zero for a new
 * file.
 */
export const TOUR_VIEWS = {
  tourRoute: { Block: TourRouteBlock, Lead: TourRouteLead, Body: TourRouteInRow },
  tourList: { Block: TourListCard },
} satisfies { [K in 'tourRoute' | 'tourList']: CardView<K> };
