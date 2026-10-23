import type { DomainCards, ToolCards } from '../card-types';
import { recordOf } from '../card-values';
import {
  appliedTourCard,
  createCityWalkCard,
  createHikeCard,
  createHikeEffect,
  loadCreateHike,
  loadUpdateTour,
  updateTourCard,
  type TourLoaded,
} from './tour-change.cards';
import { TOUR_DESCRIBERS } from './tour-describe';
import { tourListCard } from './tour-lists.cards';
import { proposalCard, savedTourCard } from './tour-route.cards';
import { cityWalkCard, paddleCard, skiCard } from './tour-sport.cards';
import { DELETE_CREATED_TOUR, DELETE_IMPORTED_TOUR } from './tour-undo';

/**
 * The tours in the assistant chat. A tour is a place with a route: its id is
 * its place's, so a created one is taken back by deleting that place. The
 * planning tools are always asked for their line for drawing, which the
 * model never sees (every key holding `geometry` is dropped for it); the
 * cards draw it.
 */

/** The planning tools answer their line for drawing; the flag is set by the server and hidden from the model. */
const WITH_GEOMETRY: NonNullable<ToolCards['argPolicy']> = { forced: { include_geometry: true } };

/** get_tour_plan as the model reads it: without the saved line in brief, which only the card draws. */
function withoutPreview(value: unknown): unknown {
  const plan = recordOf(value);
  if (!plan.line || typeof plan.line !== 'object') return value;
  const { preview: _preview, ...line } = recordOf(plan.line);
  return { ...plan, line };
}

const createHike: ToolCards<TourLoaded> = {
  write: { verbKey: 'addTour', entity: 'tour' },
  describe: TOUR_DESCRIBERS.create_hike,
  load: loadCreateHike,
  change: createHikeCard,
  effect: createHikeEffect,
  applied: appliedTourCard,
  undo: DELETE_CREATED_TOUR,
};

const updateTour: ToolCards<TourLoaded> = {
  write: { verbKey: 'updateTour', entity: 'tour' },
  describe: TOUR_DESCRIBERS.update_tour,
  load: loadUpdateTour,
  change: updateTourCard,
  // The new way stays beside the receipt: the answer is the tour as saved, naming it.
  applied: appliedTourCard,
};

export const TOUR_CARDS: DomainCards = {
  id: 'tour',
  tools: {
    propose_hike: { argPolicy: WITH_GEOMETRY, answer: proposalCard },
    propose_city_walk: { argPolicy: WITH_GEOMETRY, answer: cityWalkCard },
    plan_paddle_route: { argPolicy: WITH_GEOMETRY, answer: paddleCard },
    plan_ski_route: { argPolicy: WITH_GEOMETRY, answer: skiCard },
    get_tour_plan: { project: withoutPreview, answer: savedTourCard },
    list_tours: { answer: tourListCard },
    find_tours_for_day: { answer: tourListCard },
    create_hike: createHike,
    create_city_walk: {
      write: { verbKey: 'addTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.create_city_walk,
      change: createCityWalkCard,
      applied: appliedTourCard,
      undo: DELETE_CREATED_TOUR,
    },
    update_tour: updateTour,
    import_tour_gpx: {
      write: { verbKey: 'importTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.import_tour_gpx,
      undo: DELETE_IMPORTED_TOUR,
    },
    take_over_tour: {
      write: { verbKey: 'addTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.take_over_tour,
      undo: DELETE_CREATED_TOUR,
    },
  },
  prompt: [
    'Hikes: call propose_hike with a name, and day_id and start_time when known; to compare ways, call it up to three times in one step, each with a variant_label and along false. Call create_hike only once the user chose a way.',
    'The app draws a proposed, planned or saved tour (route, profile, stops, times, weather, warnings) and lists of tours as cards: do not repeat their figures or list them again, say in one sentence what matters.',
  ],
};
