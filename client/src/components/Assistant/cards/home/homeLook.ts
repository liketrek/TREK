import type { PackLook } from '../cardTypes';

/**
 * What the home chat (the assistant outside any one trip) brings to the
 * chat's pure look: the words its reads run under and the look of the card
 * that offers a trip's own chat. It has no verbs or entities of its own; the
 * changes it proposes are the atlas', the vacation planner's and the
 * collections'. A look stays pure, literals only.
 */
export const HOME_LOOK = {
  verbs: {},
  tools: {},
  steps: {
    list_trips: { stepKey: 'assistant.step.readingTrips' },
    open_trip_chat: { stepKey: 'assistant.step.openTripChat' },
  },
  entities: {},
  cards: {
    tripChat: {},
  },
} satisfies PackLook<'tripChat'>;
