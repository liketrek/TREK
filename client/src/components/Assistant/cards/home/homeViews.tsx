import type { CardView } from '../cardTypes';
import { TripChatBlock } from './TripChatBlock';

/**
 * How the home chat's kind draws: the trip it offers to go on with, beside
 * the answer. This file only maps the kind to its view; the component lives
 * in a sibling file, since a file that exports anything besides components
 * breaks fast refresh.
 */
export const HOME_VIEWS = {
  tripChat: { Block: TripChatBlock },
} satisfies { [K in 'tripChat']: CardView<K> };
