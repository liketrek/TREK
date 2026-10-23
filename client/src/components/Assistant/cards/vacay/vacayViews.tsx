import type { CardView } from '../cardTypes';
import VacayAnswerBlock from './VacayAnswerBlock';
import { startsExcluded } from './vacayCardModel';
import VacayChangeGroup from './VacayChangeGroup';
import VacayRowFacts from './VacayRowFacts';

/**
 * How the vacation planner's card draws in the chat: an answer as a month
 * calendar with the days left, a change card's vacation rows under one such
 * calendar, each row's facts on its faint line, and the held days the planner
 * would refuse or that need no leave left out at first. This file only maps
 * the kind to its view: the components live in sibling files, since a file
 * that exports anything besides components breaks fast refresh, and
 * lint:warnings holds react-refresh/only-export-components at zero for a new
 * file.
 */
export const VACAY_VIEWS = {
  vacay: { Block: VacayAnswerBlock, Group: VacayChangeGroup, Facts: VacayRowFacts, startsExcluded },
} satisfies { [K in 'vacay']: CardView<K> };
