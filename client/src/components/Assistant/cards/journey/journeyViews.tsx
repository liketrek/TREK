import type { CardView } from '../cardTypes';
import { JourneyEntryAside, JourneyEntryBody, JourneyEntryFacts } from './JourneyChangeSlots';
import JourneyEntriesBlock from './JourneyEntriesBlock';

/**
 * How the kinds of the journeys draw in the chat: the entries a read found
 * as a block of their own, and a change row of an entry with its photo beside
 * the subject, its day, time and place and whatever an update changes on the
 * faint line, and the start of its text under it. This file only maps each
 * kind to its view: the components live in sibling files, since a file that
 * exports anything besides components breaks fast refresh, and lint:warnings holds
 * react-refresh/only-export-components at zero for a new file.
 */
export const JOURNEY_VIEWS = {
  journeyEntries: {
    Block: JourneyEntriesBlock,
    Aside: JourneyEntryAside,
    Facts: JourneyEntryFacts,
    Body: JourneyEntryBody,
  },
} satisfies { [K in 'journeyEntries']: CardView<K> };
